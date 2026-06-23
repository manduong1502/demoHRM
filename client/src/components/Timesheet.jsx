import React, { useState, useEffect } from 'react';

export default function Timesheet({ fetchAPI, userRole }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Local date helper
  const getLocalDateString = (dateInput) => {
    const d = new Date(dateInput);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const loadTimesheet = async () => {
    const startTime = Date.now();
    // Tránh giật màn hình (Skeleton flash) bằng cách chỉ hiện loading nếu API phản hồi lâu hơn 300ms
    const timer = setTimeout(() => {
      setLoading(true);
    }, 300);
    try {
      const recordsResult = await fetchAPI(`/attendance/timesheet?year=${year}&month=${month}`);
      const employeesResult = await fetchAPI('/employees?limit=200');
      
      // Chờ ít nhất 250ms ở lần load đầu tiên để hiệu ứng chuyển trang (220ms) hoàn tất
      if (isInitialLoad) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 250) {
          await new Promise(resolve => setTimeout(resolve, 250 - elapsed));
        }
      }

      setRecords(recordsResult);
      setEmployees(employeesResult.employees);
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadTimesheet();
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = getLocalDateString(new Date());

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(emp => {
      const name = emp.fullName || '';
      const code = emp.employeeCode || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter ? emp.department === deptFilter : true;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, deptFilter]);

  return (
    <div>
      <div className="timesheet-header">
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <label style={{ fontWeight: 550 }}>Năm:</label>
          <select
            className="form-control"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            style={{ width: '110px', padding: '0.45rem 0.75rem' }}
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <label style={{ fontWeight: 550, marginLeft: '1rem' }}>Tháng:</label>
          <select
            className="form-control"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            style={{ width: '90px', padding: '0.45rem 0.75rem' }}
          >
            {[...Array(12).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
          <button onClick={loadTimesheet} className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>
            Xem
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-sm" style={{ fontSize: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-working">X : Đúng giờ</span>
          <span className="badge badge-probation">L : Đi muộn</span>
          <span className="badge badge-early">V : Về sớm</span>
          <span className="badge badge-resigned">KP : Nghỉ không phép</span>
          <span className="badge badge-leave_paid">P : Phép năm</span>
          <span className="badge badge-leave_unpaid">PL : Phép không lương</span>
        </div>
      </div>

      {/* Timesheet Search & Filter Bar */}
      <div className="filter-bar" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
        <div className="form-group" style={{ flexGrow: 2, minWidth: '150px' }}>
          <label style={{ fontSize: '0.8rem' }}>Tìm nhân viên</label>
          <input
            type="text"
            className="form-control"
            placeholder="Họ tên hoặc mã nhân viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="form-group" style={{ minWidth: '150px' }}>
          <label style={{ fontSize: '0.8rem' }}>Lọc phòng ban</label>
          <select
            className="form-control"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả phòng ban</option>
            <option value="Hành chính - Nhân sự">Hành chính - Nhân sự</option>
            <option value="Kỹ thuật & Công nghệ">Kỹ thuật & Công nghệ</option>
            <option value="Kinh doanh & Marketing">Kinh doanh & Marketing</option>
            <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
          </select>
        </div>
      </div>

      <div className="timesheet-grid-wrapper">
        <table className="timesheet-grid-table">
          <thead>
            <tr>
              <th className="emp-name-col">Họ và tên</th>
              {[...Array(daysInMonth).keys()].map((day) => {
                const dayNum = day + 1;
                const dateObj = new Date(year, month - 1, dayNum);
                const dayOfWeek = dateObj.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <th key={dayNum} style={isWeekend ? { backgroundColor: '#e2e8f0' } : {}}>
                    {String(dayNum).padStart(2, '0')}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isInitialLoad && !loading ? (
              [...Array(5).keys()].map((i) => (
                <tr key={i}>
                  <td colSpan={daysInMonth + 1} style={{ height: '53px' }}>&nbsp;</td>
                </tr>
              ))
            ) : loading ? (
              [...Array(5).keys()].map((i) => (
                <tr key={i}>
                  <td colSpan={daysInMonth + 1} style={{ padding: '1rem' }}>
                    <div className="skeleton-line skeleton-shimmer" style={{ width: '100%' }}></div>
                  </td>
                </tr>
              ))
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 1} style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Không tìm thấy hồ sơ nhân sự nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td className="emp-name-col">
                    <strong>{emp.fullName}</strong>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {emp.employeeCode} | {emp.department}
                    </div>
                  </td>
                  {[...Array(daysInMonth).keys()].map((day) => {
                    const dayNum = day + 1;
                    const dayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const attRecord = records.find((r) => r.employeeId === emp.id && r.date === dayDateStr);

                    // Weekend check
                    const dateObj = new Date(year, month - 1, dayNum);
                    const dayOfWeek = dateObj.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    let symbol = '-';
                    let cellClass = 'cell-empty';
                    let tooltip = '';

                    if (attRecord) {
                      symbol = 'X';
                      cellClass = 'cell-present';
                      if (attRecord.status === 'late') {
                        symbol = 'L';
                        cellClass = 'cell-late';
                      } else if (attRecord.status === 'early') {
                        symbol = 'V';
                        cellClass = 'cell-early';
                      } else if (attRecord.status === 'absent') {
                        symbol = 'KP';
                        cellClass = 'cell-absent';
                      } else if (attRecord.status === 'leave_paid') {
                        symbol = 'P';
                        cellClass = 'cell-leave_paid';
                      } else if (attRecord.status === 'leave_unpaid') {
                        symbol = 'PL';
                        cellClass = 'cell-leave_unpaid';
                      }
                      tooltip = `Check-in: ${attRecord.checkIn || '-'}\nCheck-out: ${attRecord.checkOut || '-'}\nOT: ${attRecord.otHours}h\nGhi chú: ${attRecord.notes || '-'}`;
                    } else {
                      if (isWeekend) {
                        symbol = '';
                        cellClass = 'cell-weekend';
                      } else if (dayDateStr < todayStr) {
                        const hasStarted = emp.probationDate ? dayDateStr >= emp.probationDate : true;
                        const isActive = emp.status !== 'resigned';
                        if (hasStarted && isActive) {
                          symbol = 'KP';
                          cellClass = 'cell-absent';
                          tooltip = 'Vắng mặt không phép';
                        } else {
                          symbol = '-';
                          cellClass = 'cell-empty';
                          tooltip = !isActive ? 'Đã nghỉ việc' : 'Chưa vào làm';
                        }
                      }
                    }

                    return (
                      <td key={dayNum} className="day-cell" title={tooltip}>
                        <div className={`day-cell-content ${cellClass}`}>
                          {symbol}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
