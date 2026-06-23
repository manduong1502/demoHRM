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
    { title: 'TỔNG SỐ NHÂN SỰ', value: stats.totalEmployees, desc: 'Nhân viên chính thức & thử việc' },
    { title: 'CHECK-IN HÔM NAY', value: stats.todayAttendance, desc: 'Số lượng nhân viên đang làm việc' },
    { title: 'ĐƠN CHỜ PHÊ DUYỆT', value: stats.pendingLeaves, desc: 'Yêu cầu nghỉ phép & tăng ca' }
  ];

  return (
    <div className="dashboard-container">
      {/* Top Stats Cards */}
      <div className="dashboard-grid">
        {quickStats.map((item, idx) => (
          <div className="widget-card" key={idx}>
            <div className="widget-title">{item.title}</div>
            <div className="widget-value">{item.value}</div>
            <div className="widget-desc" style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivities.map((act, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.825rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{act.user}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{act.action}</span>
                  {act.details && <span style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{act.details}</span>}
                </div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{act.time}</span>
              </div>
            ))}
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
