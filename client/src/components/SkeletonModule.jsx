import React, { useState, useEffect } from 'react';

export default function SkeletonModule({ type, fetchAPI, showToast }) {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('6');
  const [year, setYear] = useState('2026');

  // Salary data
  const [salaryRecords, setSalaryRecords] = useState([
    { name: 'Nguyễn Văn Admin', dept: 'Hành chính - Nhân sự', base: 25000000, days: 22, ot: 0, net: 25000000, status: 'Đã thanh toán' },
    { name: 'Trần Thị Nhân Sự', dept: 'Hành chính - Nhân sự', base: 18000000, days: 22, ot: 0, net: 18000000, status: 'Đã thanh toán' },
    { name: 'Lê Văn Quản Lý', dept: 'Kỹ thuật & Công nghệ', base: 20000000, days: 22, ot: 0, net: 20000000, status: 'Đã thanh toán' },
    { name: 'Nguyễn Văn Nhân Viên', dept: 'Kỹ thuật & Công nghệ', base: 12000000, days: 20, ot: 4.5, net: 11450000, status: 'Chờ duyệt' },
    { name: 'Phạm Minh Hoàng', dept: 'Kỹ thuật & Công nghệ', base: 13500000, days: 21, ot: 2.0, net: 13100000, status: 'Chờ duyệt' },
    { name: 'Nguyễn Thùy Linh', dept: 'Hành chính - Nhân sự', base: 10000000, days: 22, ot: 2.5, net: 10250000, status: 'Đã thanh toán' },
  ]);

  // KPI data
  const [kpiList, setKpiList] = useState([
    { name: 'Nguyễn Văn Nhân Viên', dept: 'Kỹ thuật & Công nghệ', score: 95, comments: 'Làm việc tốt, hoàn thành đúng hạn các task được giao', date: '2026-06-20' },
    { name: 'Phạm Minh Hoàng', dept: 'Kỹ thuật & Công nghệ', score: 88, comments: 'Đóng góp tích cực vào dự án, cần cải thiện tốc độ code', date: '2026-06-19' },
    { name: 'Nguyễn Thùy Linh', dept: 'Hành chính - Nhân sự', score: 92, comments: 'Hỗ trợ phỏng vấn ứng viên nhiệt tình, chu đáo', date: '2026-06-18' },
  ]);

  // New KPI Form State
  const [kpiEmployee, setKpiEmployee] = useState('Nguyễn Văn Nhân Viên');
  const [kpiScore, setKpiScore] = useState('95');
  const [kpiComment, setKpiComment] = useState('Hoàn thành tốt các mục tiêu đề ra');

  // Reports data
  const [reportStats, setReportStats] = useState({
    onTimeRate: '94.2%',
    lateCount: '12 lần',
    otHours: '19.5 giờ',
    leaveDays: '8.5 ngày'
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSalaryCalc = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/salary/calculate', {
        method: 'POST',
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) })
      });
      // Simulate calculation updates
      const updated = salaryRecords.map(r => ({
        ...r,
        status: 'Đã tính lương'
      }));
      setSalaryRecords(updated);
      showToast(`Đã hoàn tất tính toán lương chu kỳ tháng ${month}/${year}.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKPISubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchAPI('/kpi/evaluations', {
        method: 'POST',
        body: JSON.stringify({ employeeId: 1, score: parseInt(kpiScore), comments: kpiComment })
      });
      // Add dynamically to state list
      const newEntry = {
        name: kpiEmployee,
        dept: kpiEmployee.includes('Nhân Viên') || kpiEmployee.includes('Hoàng') ? 'Kỹ thuật & Công nghệ' : 'Hành chính - Nhân sự',
        score: parseInt(kpiScore),
        comments: kpiComment,
        date: new Date().toISOString().split('T')[0]
      };
      setKpiList([newEntry, ...kpiList]);
      showToast(`Đã lưu kết quả đánh giá KPI cho ${kpiEmployee}!`);
      // Reset form
      setKpiComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportFetch = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/reports/attendance-stats');
      setReportStats({
        onTimeRate: res.stats.presentRate || '94.2%',
        lateCount: '12 lần',
        otHours: '19.5 giờ',
        leaveDays: '8.5 ngày'
      });
      showToast('Đã làm mới dữ liệu thống kê từ hệ thống.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // RENDER SALARY
  if (type === 'salary') {
    return (
      <div>
        {/* Controls Bar */}
        <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '150px' }}>
            <label>Chọn tháng</label>
            <select className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="5">Tháng 05</option>
              <option value="6">Tháng 06</option>
              <option value="7">Tháng 07</option>
            </select>
          </div>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '150px' }}>
            <label>Chọn năm</label>
            <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="2025">Năm 2025</option>
              <option value="2026">Năm 2026</option>
            </select>
          </div>
          <button onClick={handleSalaryCalc} className="btn btn-primary" disabled={loading} style={{ height: '42px' }}>
            {loading ? 'Đang tính toán...' : 'Tính toán lại bảng lương'}
          </button>
        </div>

        {/* Salary Sheet Table */}
        <div className="table-container">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Bảng tính lương tháng {month}/{year}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đơn vị: VNĐ</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-excel">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Phòng ban</th>
                  <th style={{ textAlign: 'right' }}>Lương cơ bản</th>
                  <th style={{ textAlign: 'center' }}>Số ngày công</th>
                  <th style={{ textAlign: 'center' }}>Số giờ OT</th>
                  <th style={{ textAlign: 'right' }}>Lương thực tế (Net)</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((record, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 550 }}>{record.name}</td>
                    <td>{record.dept}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(record.base)}</td>
                    <td style={{ textAlign: 'center' }}>{record.days} / 22</td>
                    <td style={{ textAlign: 'center' }}>{record.ot > 0 ? `${record.ot}h` : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                      {formatCurrency(record.net)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${record.status === 'Đã thanh toán' ? 'approved' : 'pending'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // RENDER KPI
  if (type === 'kpi') {
    return (
      <div className="grid-1-2">
        {/* Left Side: Creation Form */}
        <div className="table-container" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Đánh giá hiệu suất nhân sự</h3>
          <form onSubmit={handleKPISubmit}>
            <div className="form-group">
              <label>Nhân sự đánh giá</label>
              <select className="form-control" value={kpiEmployee} onChange={(e) => setKpiEmployee(e.target.value)}>
                <option value="Nguyễn Văn Nhân Viên">Nguyễn Văn Nhân Viên (Lập trình viên)</option>
                <option value="Phạm Minh Hoàng">Phạm Minh Hoàng (Backend Developer)</option>
                <option value="Nguyễn Thùy Linh">Nguyễn Thùy Linh (Chuyên viên Tuyển dụng)</option>
                <option value="Vũ Hoàng Nam">Vũ Hoàng Nam (React Developer)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Điểm hiệu suất (KPI Score: 0 - 100)</label>
              <input 
                type="number" 
                className="form-control" 
                min="0" 
                max="100" 
                value={kpiScore} 
                onChange={(e) => setKpiScore(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Nhận xét / Đánh giá chi tiết</label>
              <textarea 
                className="form-control" 
                rows="4" 
                value={kpiComment} 
                onChange={(e) => setKpiComment(e.target.value)}
                placeholder="Nhập ghi chú hoặc đánh giá chi tiết về hiệu suất..."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Gửi đánh giá KPI'}
            </button>
          </form>
        </div>

        {/* Right Side: Performance History */}
        <div className="table-container">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Lịch sử đánh giá KPI</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-excel">
              <thead>
                <tr>
                  <th>Nhân sự</th>
                  <th>Phòng ban</th>
                  <th style={{ textAlign: 'center' }}>Điểm số</th>
                  <th>Nhận xét chi tiết</th>
                  <th style={{ textAlign: 'center' }}>Ngày đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {kpiList.map((kpi, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 550 }}>{kpi.name}</td>
                    <td>{kpi.dept}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${kpi.score >= 90 ? 'badge-approved' : 'badge-pending'}`} style={{ minWidth: '40px', justifyContent: 'center' }}>
                        {kpi.score}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {kpi.comments}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{kpi.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // RENDER REPORTS
  if (type === 'reports') {
    return (
      <div>
        {/* Top Report Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="widget-card">
            <div className="widget-title">Tỉ lệ đúng giờ trung bình</div>
            <div className="widget-value" style={{ color: 'var(--success)' }}>{reportStats.onTimeRate}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Dựa trên dữ liệu tháng 06/2026</div>
          </div>
          <div className="widget-card">
            <div className="widget-title">Tổng số lần đi muộn</div>
            <div className="widget-value" style={{ color: 'var(--warning)' }}>{reportStats.lateCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Đã ghi nhận trên hệ thống</div>
          </div>
          <div className="widget-card">
            <div className="widget-title">Số giờ tăng ca (OT)</div>
            <div className="widget-value" style={{ color: 'var(--primary)' }}>{reportStats.otHours}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Phòng kỹ thuật & công nghệ chiếm 85%</div>
          </div>
          <div className="widget-card">
            <div className="widget-title">Tổng số ngày nghỉ phép</div>
            <div className="widget-value" style={{ color: 'purple' }}>{reportStats.leaveDays}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Đã nghỉ & được duyệt trong tháng</div>
          </div>
        </div>

        {/* Detail Analytics Tables */}
        <div className="grid-2">
          {/* Department Breakdown */}
          <div className="table-container">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tình hình đi muộn theo phòng ban</h3>
              <button className="btn btn-secondary" onClick={handleReportFetch} disabled={loading} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                {loading ? 'Đang làm mới...' : 'Làm mới số liệu'}
              </button>
            </div>
            <table className="table-excel">
              <thead>
                <tr>
                  <th>Phòng ban</th>
                  <th style={{ textAlign: 'center' }}>Số nhân sự</th>
                  <th style={{ textAlign: 'center' }}>Số lần muộn</th>
                  <th>Tỉ lệ chuyên cần</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 550 }}>Kỹ thuật & Công nghệ</td>
                  <td style={{ textAlign: 'center' }}>6 người</td>
                  <td style={{ textAlign: 'center' }}>8 lần</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flexGrow: 1, backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--success)', width: '92%', height: '100%' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>92%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 550 }}>Hành chính - Nhân sự</td>
                  <td style={{ textAlign: 'center' }}>4 người</td>
                  <td style={{ textAlign: 'center' }}>3 lần</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flexGrow: 1, backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--success)', width: '96%', height: '100%' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>96%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 550 }}>Tài chính - Kế toán</td>
                  <td style={{ textAlign: 'center' }}>1 người</td>
                  <td style={{ textAlign: 'center' }}>1 lần</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flexGrow: 1, backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--success)', width: '95%', height: '100%' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>95%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 550 }}>Kinh doanh & Marketing</td>
                  <td style={{ textAlign: 'center' }}>1 người</td>
                  <td style={{ textAlign: 'center' }}>0 lần</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flexGrow: 1, backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--success)', width: '100%', height: '100%' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>100%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Metrics */}
          <div className="table-container" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Báo cáo biến động nhân sự Q2/2026</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>NHÂN SỰ MỚI TUYỂN DỤNG</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>+3 thành viên</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>Bộ phận: Kỹ thuật (2), Nhân sự (1)</span>
              </div>
              <div>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>NHÂN SỰ ĐÃ NGHỈ VIỆC</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>-1 thành viên</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>Bộ phận: Sales (Bùi Quốc Huy)</span>
              </div>
              <div>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>QUY MÔ ĐỘI NGŨ HIỆN TẠI</span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>11 thành viên hoạt động</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>Tỉ lệ nhân sự thử việc đạt yêu cầu: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
