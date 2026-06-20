import React from 'react';

export default function Dashboard({ stats }) {
  return (
    <div>
      <div className="dashboard-grid">
        <div className="widget-card">
          <div className="widget-title">Tổng số nhân sự</div>
          <div className="widget-value">{stats.totalEmployees}</div>
        </div>
        <div className="widget-card">
          <div className="widget-title">Check-in hôm nay</div>
          <div className="widget-value">{stats.todayAttendance}</div>
        </div>
        <div className="widget-card">
          <div className="widget-title">Đơn xin nghỉ chờ duyệt</div>
          <div className="widget-value">{stats.pendingLeaves}</div>
        </div>
      </div>

      <div className="table-container">
        <div style={{ padding: '1.5rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
          Cổng thông tin nhân sự nội bộ
        </div>
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600 }}>Chào mừng trở lại!</h3>
          <p>Sử dụng thanh điều hướng bên trái để quản lý hồ sơ nhân sự, bảng chấm công và duyệt đơn từ.</p>
        </div>
      </div>
    </div>
  );
}
