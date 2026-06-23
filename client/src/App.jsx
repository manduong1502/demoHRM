import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EmployeeDirectory from './components/EmployeeDirectory';
import Timesheet from './components/Timesheet';
import LeaveRequests from './components/LeaveRequests';
import SkeletonModule from './components/SkeletonModule';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('hrm_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('hrm_user')) || null);
  const [activeView, setActiveView] = useState('view-dashboard');
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Trạng thái đóng/mở sidebar trên mobile
  
  // Dashboard states
  const [totalEmployees, setTotalEmployees] = useState('-');
  const [todayAttendance, setTodayAttendance] = useState('-');
  const [pendingLeaves, setPendingLeaves] = useState('-');

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // JWT fetch API helper
  const fetchAPI = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    const response = await fetch(url, config);

    // Excel downloads MIME validation
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      if (!response.ok) throw new Error('Tải tệp tin thất bại.');
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
      }
      showToast(data.message || 'Có lỗi xảy ra', 'danger');
      throw new Error(data.message || 'Có lỗi xảy ra');
    }

    return data;
  };

  const handleLogin = async (username, password) => {
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('hrm_token', data.token);
      localStorage.setItem('hrm_user', JSON.stringify(data.user));
      showToast('Đăng nhập thành công!');
      setActiveView('view-dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('hrm_token');
    localStorage.removeItem('hrm_user');
  };

  const loadDashboardStats = async () => {
    if (!token || !user) return;
    try {
      // 1. Total employees count
      let employeesCount = 0;
      if (user.role === 'Admin' || user.role === 'HR Manager' || user.role === 'Line Manager') {
        const empData = await fetchAPI('/employees?limit=1');
        employeesCount = empData.totalItems || 0;
      } else {
        employeesCount = 1;
      }
      setTotalEmployees(employeesCount);

      // 2. Attendance count today
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const timesheetData = await fetchAPI(`/attendance/timesheet?year=${year}&month=${month}`);
      const activeCount = timesheetData.filter(t => t.date === todayStr && t.checkIn).length;
      setTodayAttendance(activeCount);

      // 3. Pending requests
      const pendingData = await fetchAPI('/attendance/leave-requests?status=pending');
      setPendingLeaves(pendingData.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadDashboardStats();
    }
  }, [token, activeView]);

  const handleQuickCheckIn = async () => {
    try {
      const res = await fetchAPI('/attendance/check-in', { method: 'POST' });
      showToast(`Đã Check-In vào lúc: ${res.record.checkIn}`);
      loadDashboardStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCheckOut = async () => {
    try {
      const res = await fetchAPI('/attendance/check-out', { method: 'POST' });
      showToast(`Đã Check-Out vào lúc: ${res.record.checkOut}`);
      loadDashboardStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Check element permissions visibility
  const checkHasPermission = (requiredPermission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const mockPermissions = {
      'HR Manager': ['employee:view', 'employee:create', 'employee:edit', 'employee:delete', 'leave:approve'],
      'Line Manager': ['employee:view', 'leave:approve'],
      'Employee': ['leave:request']
    };

    const perms = mockPermissions[user.role] || [];
    return perms.includes(requiredPermission);
  };

  if (!token || !user) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        {toast && <div className={`toast badge-${toast.type}`}>{toast.message}</div>}
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'view-dashboard':
        return <Dashboard stats={{ totalEmployees, todayAttendance, pendingLeaves }} />;
      case 'view-employees':
        return (
          <EmployeeDirectory
            fetchAPI={fetchAPI}
            userRole={user.role}
            showToast={showToast}
            API_BASE_URL={API_BASE_URL}
          />
        );
      case 'view-timesheet':
        return <Timesheet fetchAPI={fetchAPI} userRole={user.role} />;
      case 'view-leaves':
        return <LeaveRequests fetchAPI={fetchAPI} userRole={user.role} showToast={showToast} />;
      case 'view-salary':
        return <SkeletonModule type="salary" fetchAPI={fetchAPI} showToast={showToast} />;
      case 'view-kpi':
        return <SkeletonModule type="kpi" fetchAPI={fetchAPI} showToast={showToast} />;
      case 'view-reports':
        return <SkeletonModule type="reports" fetchAPI={fetchAPI} showToast={showToast} />;
      default:
        return <Dashboard stats={{ totalEmployees, todayAttendance, pendingLeaves }} />;
    }
  };

  const getPageHeaderTitle = () => {
    const titles = {
      'view-dashboard': 'Tổng quan',
      'view-employees': 'Hồ sơ nhân viên',
      'view-timesheet': 'Bảng chấm công',
      'view-leaves': 'Đơn từ nghỉ phép / OT',
      'view-salary': 'Tính lương & Phúc lợi',
      'view-kpi': 'Đánh giá KPI',
      'view-reports': 'Báo cáo tổng hợp'
    };
    return titles[activeView] || 'HRM System';
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Quản trị Nhân sự</h1>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
            &times;
          </button>
        </div>
        <ul className="sidebar-menu">
          <li className={activeView === 'view-dashboard' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-dashboard'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path>
              </svg>
              Tổng quan
            </a>
          </li>
          {checkHasPermission('employee:view') && (
            <li className={activeView === 'view-employees' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-employees'); setIsSidebarOpen(false); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                Hồ sơ nhân viên
              </a>
            </li>
          )}
          <li className={activeView === 'view-timesheet' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-timesheet'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Bảng chấm công
            </a>
          </li>
          <li className={activeView === 'view-leaves' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-leaves'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Đơn từ nghỉ phép / OT
            </a>
          </li>
          {/* Skeletal Navigation Links */}
          <li className={activeView === 'view-salary' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-salary'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Tính lương & Phúc lợi
            </a>
          </li>
          <li className={activeView === 'view-kpi' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-kpi'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path>
              </svg>
              Đánh giá KPI
            </a>
          </li>
          <li className={activeView === 'view-reports' ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('view-reports'); setIsSidebarOpen(false); }}>
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z"></path>
              </svg>
              Báo cáo tổng hợp
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="user-info-name">{user.username}</div>
          <div className="user-info-role">
            {user.role === 'Admin' ? 'Quản trị viên' : 
             user.role === 'HR Manager' ? 'Quản lý Nhân sự' : 
             user.role === 'Line Manager' ? 'Quản lý Trực tiếp' : 
             user.role === 'Employee' ? 'Nhân viên' : user.role}
          </div>
          <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-left">
            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h2 className="page-title">{getPageHeaderTitle()}</h2>
          </div>
          <div className="flex gap-sm">
            <button onClick={handleQuickCheckIn} className="btn btn-success check-btn">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Check-In</span>
            </button>
            <button onClick={handleQuickCheckOut} className="btn btn-primary check-btn">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Check-Out</span>
            </button>
          </div>
        </header>

        <main className="main-content">
          <div key={activeView} className="fade-in-view">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Overlay background when mobile sidebar is open */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {toast && <div className={`toast badge-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default App;
