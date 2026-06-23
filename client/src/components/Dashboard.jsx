import React from 'react';

export default function Dashboard({ stats }) {
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
        return { color: 'warning', text: 'M' }; // Muộn
      }
      return { color: 'success', text: 'C' }; // Check-In
    }
    if (action.includes('duyệt')) {
      return { color: 'info', text: 'D' }; // Duyệt
    }
    if (action.includes('gửi')) {
      return { color: 'primary', text: 'Y' }; // Yêu cầu
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

      {/* Main Sections */}
      <div className="grid-2 mt-4">
        {/* Recent Activity Log */}
        <div className="table-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
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

        {/* Quick Instructions & Overview */}
        <div className="table-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Thông báo nội bộ
          </h3>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>📢 Cập nhật hệ thống HRM v1.2</strong>
            Hệ thống chấm công và tính lương tự động đã được triển khai. Vui lòng kiểm tra lại thông tin hồ sơ và thực hiện Check-In/Check-Out hàng ngày tại thanh tiêu đề.
          </div>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-main)' }}>📅 Lịch quyết toán công & lương tháng 06</strong>
            Hạn chót phê duyệt đơn từ nghỉ phép và tăng ca tháng 06/2026 là ngày **25/06/2026**. HR Manager vui lòng hoàn tất bảng công trước ngày **28/06/2026**.
          </div>
        </div>
      </div>
    </div>
  );
}
