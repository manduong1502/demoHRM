import React, { useState, useEffect } from 'react';

export default function LeaveRequests({ fetchAPI, userRole, showToast }) {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Form states
  const [requestType, setRequestType] = useState('leave_paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');

  const isApprover = userRole === 'Admin' || userRole === 'HR Manager' || userRole === 'Line Manager';

  const loadRequests = async () => {
    const startTime = Date.now();
    // Tránh giật màn hình (Skeleton flash) bằng cách chỉ hiện loading nếu API phản hồi lâu hơn 300ms
    const timer = setTimeout(() => {
      setLoading(true);
    }, 300);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const result = await fetchAPI(`/attendance/leave-requests${q}`);
      
      // Chờ ít nhất 250ms ở lần load đầu tiên để hiệu ứng chuyển trang (220ms) hoàn tất
      if (isInitialLoad) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 250) {
          await new Promise(resolve => setTimeout(resolve, 250 - elapsed));
        }
      }

      setRequests(result);
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  // Auto-calculate duration
  useEffect(() => {
    if (!startDate || !endDate) {
      setDuration('');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      setDuration('');
      return;
    }

    if (requestType === 'ot') {
      // Calculate OT hours
      const diffMs = end - start;
      const hours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
      setDuration(hours.toString());
    } else {
      // Calculate leave days excluding weekends
      let workingDays = 0;
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);

      let temp = new Date(startDay);
      while (temp <= endDay) {
        const dayOfWeek = temp.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0: Sunday, 6: Saturday
          workingDays++;
        }
        temp.setDate(temp.getDate() + 1);
      }

      // Allow half-day (0.5) if total hours difference on a single day is <= 5 hours
      if (workingDays === 1) {
        const hoursDiff = (end - start) / (1000 * 60 * 60);
        if (hoursDiff <= 5) {
          workingDays = 0.5;
        }
      }
      setDuration(workingDays.toString());
    }
  }, [startDate, endDate, requestType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !duration || !reason.trim()) return;

    try {
      await fetchAPI('/attendance/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          duration: parseFloat(duration),
          reason: reason.trim()
        })
      });

      showToast('Đã gửi đơn từ thành công.');
      setRequestType('leave_paid');
      setStartDate('');
      setEndDate('');
      setDuration('');
      setReason('');
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    const notes = prompt('Nhập ý kiến phê duyệt (Tùy chọn):') || '';
    try {
      await fetchAPI(`/attendance/leave-requests/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      });
      showToast('Phê duyệt thành công. Bảng công đã được đồng bộ.');
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    const notes = prompt('Nhập lý do từ chối:') || '';
    if (!notes) return;
    try {
      await fetchAPI(`/attendance/leave-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      });
      showToast('Đã từ chối đơn từ.');
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="grid-1-2">
      {/* Form submit */}
      <div className="widget-card">
        <h3 className="mb-4" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tạo đơn từ mới</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại đơn từ</label>
            <select
              className="form-control"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
            >
              <option value="leave_paid">Nghỉ phép có lương (Phép năm)</option>
              <option value="leave_unpaid">Nghỉ phép không lương</option>
              <option value="ot">Làm thêm giờ (Tăng ca OT)</option>
            </select>
          </div>

          <div className="expandable-panel expanded" style={{ marginBottom: '1.25rem' }}>
            <div className="info-box-animate" key={requestType}>
              {requestType === 'leave_paid' && (
                <div className="alert-info-light">
                  <strong>💡 Quy định nghỉ phép năm:</strong> Nhân viên được hưởng nguyên lương. Đơn cần được gửi và duyệt trước ngày nghỉ tối thiểu 1 ngày.
                </div>
              )}
              {requestType === 'leave_unpaid' && (
                <div className="alert-info-light warning-alert">
                  <strong>⚠️ Quy định phép không lương:</strong> Ngày nghỉ sẽ trừ trực tiếp vào công thực tế của tháng. Cần có sự đồng ý của Quản lý trực tiếp.
                </div>
              )}
              {requestType === 'ot' && (
                <div className="alert-info-light info-alert">
                  <strong>⏰ Quy định làm thêm giờ (OT):</strong> Hệ số tính lương OT là 1.5x (ngày thường), 2.0x (cuối tuần), 3.0x (ngày lễ). Vui lòng điền đúng số giờ thực tế làm việc.
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Từ ngày / Ngày tăng ca</label>
            <input
              type="datetime-local"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Đến ngày / Thời gian kết thúc</label>
            <input
              type="datetime-local"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Thời lượng (Số ngày nghỉ / Số giờ OT)</label>
            <input
              type="number"
              step="0.1"
              className="form-control"
              placeholder="Ví dụ: 1.0, 0.5, 4.0..."
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Lý do</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Lý do nghỉ hoặc lý do OT..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Gửi đơn từ
          </button>
        </form>
      </div>

      {/* History table */}
      <div className="widget-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="flex-between" style={{ padding: '1.75rem 1.75rem 1rem 1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Lịch sử đơn từ</h3>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px', padding: '0.4rem 0.75rem' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
          </select>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, flexGrow: 1, overflowY: 'auto' }}>
          <table className="table-excel" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Loại đơn</th>
                <th>Thời gian</th>
                <th>Thời lượng</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                {isApprover && <th style={{ width: '150px' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {isInitialLoad && !loading ? (
                [...Array(3).keys()].map((i) => (
                  <tr key={i}>
                    <td colSpan={isApprover ? 7 : 6} style={{ height: '53px' }}>&nbsp;</td>
                  </tr>
                ))
              ) : loading ? (
                [...Array(3).keys()].map((i) => (
                  <tr key={i}>
                    <td colSpan={isApprover ? 7 : 6} style={{ padding: '1rem' }}>
                      <div className="skeleton-line skeleton-shimmer" style={{ width: '100%' }}></div>
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={isApprover ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy đơn từ nào.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  let typeText = 'Phép năm có lương';
                  if (req.requestType === 'leave_unpaid') typeText = 'Phép không lương';
                  else if (req.requestType === 'ot') typeText = 'Tăng ca OT';

                  const durationUnit = req.requestType === 'ot' ? 'giờ' : 'ngày';

                  return (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.employee ? req.employee.fullName : 'Hệ thống'}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {req.employee ? req.employee.employeeCode : ''}
                        </div>
                      </td>
                      <td>{typeText}</td>
                      <td style={{ fontSize: '0.75rem' }}>
                        <div>Từ: {formatDate(req.startDate)}</div>
                        <div>Đến: {formatDate(req.endDate)}</div>
                      </td>
                      <td>{req.duration} {durationUnit}</td>
                      <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                        {req.reason}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status === 'pending' ? 'Chờ duyệt' : (req.status === 'approved' ? 'Đã duyệt' : 'Từ chối')}
                        </span>
                      </td>
                      {isApprover && (
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {req.status === 'pending' ? (
                            <div className="table-actions">
                              <button onClick={() => handleApprove(req.id)} className="btn btn-success btn-table-action">
                                Duyệt
                              </button>
                              <button onClick={() => handleReject(req.id)} className="btn btn-danger btn-table-action">
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Duyệt bởi: {req.approver ? req.approver.username : 'Hệ thống'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
