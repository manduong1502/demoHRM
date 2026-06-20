import React, { useState } from 'react';

export default function SkeletonModule({ type, fetchAPI, showToast }) {
  const [loading, setLoading] = useState(false);

  const handleSalaryCalc = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/salary/calculate', {
        method: 'POST',
        body: JSON.stringify({ month: 6, year: 2026 })
      });
      showToast(`${res.message} Mức lương ròng = ${res.calculatedFields.netSalary} VNĐ.`);
    } finally {
      setLoading(false);
    }
  };

  const handleKPISubmit = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/kpi/evaluations', {
        method: 'POST',
        body: JSON.stringify({ employeeId: 1, score: 95, comments: 'Làm việc tốt' })
      });
      showToast(`${res.message} Điểm số lưu lúc: ${new Date(res.evaluation.recordedAt).toLocaleTimeString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReportFetch = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/reports/attendance-stats');
      showToast(`${res.message} Tỷ lệ đi làm đúng giờ: ${res.stats.presentRate}.`);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'salary') {
    return (
      <div className="skeleton-msg">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          Phân Hệ: Tính lương & Phúc lợi (Salary & Benefits)
        </h3>
        <p style={{ marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          Module này sẽ tự động liên kết với Bảng chấm công đã duyệt và thông tin cấu hình lương trên Hợp đồng ở hồ sơ nhân viên để tính toán lương định kỳ.
        </p>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
          <div className="form-group">
            <label>Chu kỳ tính lương dự kiến</label>
            <select className="form-control" defaultValue="06/2026">
              <option value="06/2026">Tháng 06/2026</option>
            </select>
          </div>
          <button onClick={handleSalaryCalc} className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang tính toán...' : 'Thực hiện tính lương thử nghiệm (API Call)'}
          </button>
        </div>
      </div>
    );
  }

  if (type === 'kpi') {
    return (
      <div className="skeleton-msg">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          Phân Hệ: Đánh giá KPI & Hiệu suất (KPI & Performance)
        </h3>
        <p style={{ marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          Hỗ trợ thiết lập mục tiêu chỉ số KPI theo tháng/quý và theo dõi lịch sử đánh giá hiệu suất trực tiếp liên kết với hồ sơ nhân viên.
        </p>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
          <div className="form-group">
            <label>Nhân viên</label>
            <select className="form-control" defaultValue="1">
              <option value="1">EMP-0001 - Nguyễn Văn Nhân Viên</option>
            </select>
          </div>
          <div className="form-group">
            <label>Điểm số KPI dự kiến</label>
            <input type="number" className="form-control" placeholder="100" defaultValue="95" readOnly />
          </div>
          <button onClick={handleKPISubmit} className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang ghi nhận...' : 'Lưu kết quả đánh giá thử nghiệm (API Call)'}
          </button>
        </div>
      </div>
    );
  }

  if (type === 'reports') {
    return (
      <div className="skeleton-msg">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          Phân Hệ: Báo cáo & Thống kê tổng hợp (Analytics & Reports)
        </h3>
        <p style={{ marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          Cung cấp biểu đồ trực quan hóa dữ liệu biến động nhân sự, tỷ lệ đi muộn/về sớm, thống kê số ngày phép còn lại.
        </p>
        <button onClick={handleReportFetch} className="btn btn-secondary" disabled={loading}>
          {loading ? 'Đang tải dữ liệu...' : 'Tải dữ liệu phân tích thử nghiệm (API Call)'}
        </button>
      </div>
    );
  }

  return null;
}
