import React from 'react';

export default function Dashboard({ stats, setActiveView }) {
  const recentActivities = [
    { time: '08:45 AM', user: 'Phạm Minh Hoàng', action: 'đã Check-In', details: 'Trạng thái: Đúng giờ' },
    { time: '08:32 AM', user: 'Lê Hà Vy', action: 'đã Check-In', details: 'Trạng thái: Đi muộn (17 phút)' },
    { time: 'Hôm qua', user: 'Trần Thị Nhân Sự', action: 'đã duyệt đơn xin nghỉ phép', details: 'Nhân viên: Nguyễn Văn Nhân Viên' },
    { time: 'Hôm qua', user: 'Vũ Hoàng Nam', action: 'đã gửi yêu cầu tăng ca OT', details: 'Lý do: Hoàn thành task dự án' },
    { time: 'Hôm qua', user: 'Lê Văn Quản Lý', action: 'đã duyệt đơn tăng ca', details: 'Nhân viên: Nguyễn Thùy Linh' }
  ];

  const quickStats = [
    { 
      title: 'TỔNG SỐ NHÂN SỰ', 
      value: stats.totalEmployees, 
      desc: 'Nhân viên chính thức & thử việc',
      color: 'indigo',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      )
    },
    { 
      title: 'CHECK-IN HÔM NAY', 
      value: stats.todayAttendance, 
      desc: 'Số lượng nhân viên đang làm việc',
      color: 'success',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    { 
      title: 'ĐƠN CHỜ PHÊ DUYỆT', 
      value: stats.pendingLeaves, 
      desc: 'Yêu cầu nghỉ phép & tăng ca',
      color: 'warning',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      )
    },
    { 
      title: 'TỈ LỆ CHUYÊN CẦN', 
      value: '94.2%', 
      desc: 'Tỉ lệ đi làm đúng giờ Q2/2026',
      color: 'indigo',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path>
        </svg>
      )
    }
  ];

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getActivityStyle = (action, details) => {
    if (action.includes('Check-In')) {
      if (details.includes('Đi muộn')) {
        return { color: 'warning', text: 'M' };
      }
      return { color: 'success', text: 'C' };
    }
    if (action.includes('duyệt')) {
      return { color: 'info', text: 'D' };
    }
    if (action.includes('gửi')) {
      return { color: 'primary', text: 'Y' };
    }
    return { color: 'secondary', text: 'H' };
  };

  return (
    <div className="dashboard-container">
      {/* Top Stats Cards */}
      <div className="dashboard-grid">
        {quickStats.map((item, idx) => (
          <div className={`widget-card card-${item.color}`} key={idx}>
            <div className="widget-header-flex">
              <div>
                <div className="widget-title">{item.title}</div>
                <div className="widget-value">{item.value}</div>
              </div>
              <div className={`widget-icon-wrapper icon-${item.color}`}>
                {item.icon}
              </div>
            </div>
            <div className="widget-desc" style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Main Asymmetric Grid Layout */}
      <div className="dashboard-content-layout mt-4">
        {/* Left Column: Actions and Activities */}
        <div className="flex-col gap-md">
          {/* Quick Actions Panel */}
          <div className="quick-actions-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Liên kết nhanh thao tác
            </h3>
            <div className="quick-actions-grid">
              <a href="#" className="action-btn-card" onClick={(e) => { e.preventDefault(); setActiveView('view-leaves'); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Tạo đơn phép / OT</span>
              </a>
              <a href="#" className="action-btn-card" onClick={(e) => { e.preventDefault(); setActiveView('view-timesheet'); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>Xem bảng công</span>
              </a>
              <a href="#" className="action-btn-card" onClick={(e) => { e.preventDefault(); setActiveView('view-employees'); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <span>Hồ sơ nhân sự</span>
              </a>
              <a href="#" className="action-btn-card" onClick={(e) => { e.preventDefault(); setActiveView('view-salary'); }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Tính công & lương</span>
              </a>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="table-container" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              Hoạt động gần đây
            </h3>
            <div className="activity-list">
              {recentActivities.map((act, idx) => {
                const avatarInitials = getInitials(act.user);
                const styleMeta = getActivityStyle(act.action, act.details);
                return (
                  <div key={idx} className="activity-item">
                    <div className="activity-left">
                      <div className={`activity-avatar avatar-${styleMeta.color}`}>
                        {avatarInitials}
                      </div>
                      <div className="activity-details-wrapper">
                        <div>
                          <strong className="activity-user">{act.user}</strong>{' '}
                          <span className="activity-action">{act.action}</span>
                        </div>
                        {act.details && <span className="activity-subtext">{act.details}</span>}
                      </div>
                    </div>
                    <span className="activity-time">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts, Birthdays, Holidays */}
        <div className="flex-col gap-md">
          {/* Announcements */}
          <div className="table-container" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              Thông báo nội bộ
            </h3>
            <div className="announcement-box">
              <div className="announcement-title">
                <span>📢</span>
                <span>Cập nhật hệ thống HRM v1.2</span>
              </div>
              <div className="announcement-body">
                Hệ thống chấm công và tính lương tự động đã được triển khai. Vui lòng kiểm tra lại thông tin hồ sơ và thực hiện Check-In/Check-Out hàng ngày tại thanh tiêu đề.
              </div>
            </div>
            <div className="announcement-box warning-alert">
              <div className="announcement-title">
                <span>📅</span>
                <span>Lịch quyết toán công & lương tháng 06</span>
              </div>
              <div className="announcement-body">
                Hạn chót phê duyệt đơn từ nghỉ phép và tăng ca tháng 06/2026 là ngày <strong>25/06/2026</strong>. HR Manager vui lòng hoàn tất bảng công trước ngày <strong>28/06/2026</strong>.
              </div>
            </div>
          </div>

          {/* Upcoming Holidays & Events */}
          <div className="table-container" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Sự kiện & Ngày nghỉ sắp tới
            </h3>
            <div className="events-list">
              <div className="event-item">
                <div className="event-date-badge">
                  <span className="day">02</span>
                  <span className="month">Th09</span>
                </div>
                <div className="event-info">
                  <span className="event-title">Ngày Quốc Khánh Việt Nam</span>
                  <span className="event-desc">Nghỉ lễ toàn công ty (Hưởng nguyên lương)</span>
                </div>
              </div>
              <div className="event-item">
                <div className="event-date-badge">
                  <span className="day">25</span>
                  <span className="month">Th06</span>
                </div>
                <div className="event-info">
                  <span className="event-title">Chốt bảng công tháng 06</span>
                  <span className="event-desc">Hạn chót gửi và duyệt các đơn từ nghỉ phép / OT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Birthdays of the Month */}
          <div className="table-container" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Sinh nhật trong tháng 06
            </h3>
            <div className="birthdays-list">
              <div className="birthday-item">
                <div className="birthday-left">
                  <div className="birthday-avatar">HV</div>
                  <div>
                    <div className="birthday-name">Lê Hà Vy</div>
                    <div className="birthday-date">Ngày 12 tháng 06</div>
                  </div>
                </div>
                <span className="birthday-badge">🎂 Sinh nhật</span>
              </div>
              <div className="birthday-item">
                <div className="birthday-left">
                  <div className="birthday-avatar">HN</div>
                  <div>
                    <div className="birthday-name">Vũ Hoàng Nam</div>
                    <div className="birthday-date">Ngày 28 tháng 06</div>
                  </div>
                </div>
                <span className="birthday-badge">🎉 Sắp tới</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
