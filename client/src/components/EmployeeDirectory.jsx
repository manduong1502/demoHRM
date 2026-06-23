import React, { useState, useEffect } from 'react';

export default function EmployeeDirectory({ fetchAPI, userRole, showToast, API_BASE_URL }) {
  const [employees, setEmployees] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal control
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [identityCode, setIdentityCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [empDept, setEmpDept] = useState('Hành chính - Nhân sự');
  const [empPos, setEmpPos] = useState('');
  const [contractType, setContractType] = useState('Full-time');
  const [empStatus, setEmpStatus] = useState('working');
  const [probationDate, setProbationDate] = useState('');
  const [officialDate, setOfficialDate] = useState('');
  
  // Portal account fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Import file
  const [importFile, setImportFile] = useState(null);

  // Permissions helper
  const canEdit = userRole === 'Admin' || userRole === 'HR Manager';

  const [searchTrigger, setSearchTrigger] = useState(0);

  const loadEmployees = async () => {
    // Tránh giật màn hình (Skeleton flash) bằng cách chỉ hiện loading nếu API phản hồi lâu hơn 200ms
    const timer = setTimeout(() => {
      setLoading(true);
    }, 200);

    try {
      const qs = `?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}&status=${encodeURIComponent(status)}`;
      const result = await fetchAPI(`/employees${qs}`);
      setEmployees(result.employees);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [page, department, status, searchTrigger]);

  const handleSearch = () => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchAPI('/employees/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Danh_Sach_Nhan_Vien.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Tải file Excel thành công.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setCurrentEmpId(null);
    setFullName('');
    setDob('');
    setIdentityCode('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEmpDept('Hành chính - Nhân sự');
    setEmpPos('');
    setContractType('Full-time');
    setEmpStatus('working');
    setProbationDate('');
    setOfficialDate('');
    setUsername('');
    setPassword('');
    setIsEmpModalOpen(true);
  };

  const handleOpenEditModal = async (emp) => {
    setCurrentEmpId(emp.id);
    setFullName(emp.fullName || '');
    setDob(emp.dob || '');
    setIdentityCode(emp.identityCode || '');
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setAddress(emp.address || '');
    setEmpDept(emp.department || 'Hành chính - Nhân sự');
    setEmpPos(emp.position || '');
    setContractType(emp.contractType || 'Full-time');
    setEmpStatus(emp.status || 'working');
    setProbationDate(emp.probationDate || '');
    setOfficialDate(emp.officialDate || '');
    setIsEmpModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này không?')) return;
    try {
      await fetchAPI(`/employees/${id}`, { method: 'DELETE' });
      showToast('Đã xóa hồ sơ nhân viên.');
      loadEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const payload = {
      fullName,
      dob: dob || null,
      identityCode: identityCode || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      department: empDept,
      position: empPos,
      contractType,
      status: empStatus,
      probationDate: probationDate || null,
      officialDate: officialDate || null
    };

    try {
      if (currentEmpId) {
        // Edit Profile
        await fetchAPI(`/employees/${currentEmpId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Cập nhật hồ sơ thành công.');
      } else {
        // Create Profile (optimized: User registration first if portal fields entered)
        if (username.trim() && password) {
          const userResponse = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username: username.trim(),
              email: email || `${username.trim()}@hrm.com`,
              password,
              roleName: 'Employee'
            })
          });
          payload.userId = userResponse.user.id;
        }

        await fetchAPI('/employees', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Tạo hồ sơ nhân viên thành công.');
      }
      setIsEmpModalOpen(false);
      loadEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    const token = localStorage.getItem('hrm_token');

    try {
      const response = await fetch(`${API_BASE_URL}/employees/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Nhập dữ liệu từ Excel thất bại.');

      showToast(`Import thành công ${data.successCount} nhân viên.`);
      if (data.errors && data.errors.length > 0) {
        alert('Có lỗi xảy ra ở một số dòng:\n' + data.errors.join('\n'));
      }
      setIsImportModalOpen(false);
      setImportFile(null);
      loadEmployees();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <div className="form-group" style={{ flexGrow: 2 }}>
          <label>Tìm kiếm nhanh</label>
          <input
            type="text"
            className="form-control"
            placeholder="Tên, mã nhân viên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="form-group">
          <label>Phòng ban</label>
          <select
            className="form-control"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả phòng ban</option>
            <option value="Hành chính - Nhân sự">Hành chính - Nhân sự</option>
            <option value="Kỹ thuật & Công nghệ">Kỹ thuật & Công nghệ</option>
            <option value="Kinh doanh & Marketing">Kinh doanh & Marketing</option>
            <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
          </select>
        </div>
        <div className="form-group">
          <label>Trạng thái</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="working">Đang làm việc</option>
            <option value="probation">Thử việc</option>
            <option value="resigned">Đã nghỉ việc</option>
          </select>
        </div>
        <button onClick={handleSearch} className="btn btn-secondary">
          Lọc dữ liệu
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex-between mb-4">
        <div className="flex gap-sm">
          {canEdit && (
            <>
              <button onClick={handleOpenAddModal} className="btn btn-primary">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                </svg>
                Thêm nhân viên
              </button>
              <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                Import Excel
              </button>
            </>
          )}
        </div>
        <button onClick={handleExportExcel} className="btn btn-secondary">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-excel">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số ĐT</th>
              <th>Phòng ban</th>
              <th>Chức vụ</th>
              <th>Loại HĐ</th>
              <th>Trạng thái</th>
              {canEdit && <th style={{ width: '140px' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {isInitialLoad && !loading ? (
              [...Array(5).keys()].map((i) => (
                <tr key={i}>
                  <td colSpan={canEdit ? 9 : 8} style={{ height: '53px' }}>&nbsp;</td>
                </tr>
              ))
            ) : loading ? (
              [...Array(5).keys()].map((i) => (
                <tr key={i}>
                  <td colSpan={canEdit ? 9 : 8} style={{ padding: '1rem 1.5rem' }}>
                    <div className="skeleton-line skeleton-shimmer"></div>
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy dữ liệu nhân viên.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td><strong>{emp.employeeCode}</strong></td>
                  <td>{emp.fullName}</td>
                  <td>{emp.email || '-'}</td>
                  <td>{emp.phone || '-'}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>{emp.contractType}</td>
                  <td>
                    <span className={`badge badge-${emp.status}`}>
                      {emp.status === 'working' ? 'Đang làm việc' : (emp.status === 'probation' ? 'Thử việc' : 'Đã nghỉ việc')}
                    </span>
                  </td>
                  {canEdit && (
                    <td>
                      <button onClick={() => handleOpenEditModal(emp)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Hiển thị {totalItems === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} của {totalItems} nhân sự
        </div>
        <div className="pagination-buttons">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn btn-secondary"
            style={{ padding: '0.375rem 0.75rem' }}
            disabled={page <= 1}
          >
            Trước
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="btn btn-secondary"
            style={{ padding: '0.375rem 0.75rem' }}
            disabled={page >= totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      {/* Modal: Add/Edit Employee */}
      {isEmpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentEmpId ? 'Chỉnh sửa Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}</h3>
              <button className="modal-close" onClick={() => setIsEmpModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveEmployee}>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Thông tin cá nhân</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input type="date" className="form-control" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Số CCCD</label>
                  <input type="text" className="form-control" value={identityCode} onChange={e => setIdentityCode(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Địa chỉ thường trú</label>
                <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '1rem', color: 'var(--primary)', marginTop: '1.5rem' }}>Thông tin công việc</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>Phòng ban *</label>
                  <select className="form-control" value={empDept} onChange={e => setEmpDept(e.target.value)} required>
                    <option value="Hành chính - Nhân sự">Hành chính - Nhân sự</option>
                    <option value="Kỹ thuật & Công nghệ">Kỹ thuật & Công nghệ</option>
                    <option value="Kinh doanh & Marketing">Kinh doanh & Marketing</option>
                    <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Chức vụ *</label>
                  <input type="text" className="form-control" value={empPos} onChange={e => setEmpPos(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Loại hợp đồng *</label>
                  <select className="form-control" value={contractType} onChange={e => setContractType(e.target.value)} required>
                    <option value="Full-time">Hợp đồng chính thức (Full-time)</option>
                    <option value="Part-time">Bán thời gian (Part-time)</option>
                    <option value="Probation">Hợp đồng thử việc (Probation)</option>
                    <option value="Internship">Thực tập sinh (Internship)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái *</label>
                  <select className="form-control" value={empStatus} onChange={e => setEmpStatus(e.target.value)} required>
                    <option value="working">Đang làm việc</option>
                    <option value="probation">Thử việc</option>
                    <option value="resigned">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Ngày bắt đầu thử việc</label>
                  <input type="date" className="form-control" value={probationDate} onChange={e => setProbationDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ngày ký hợp đồng chính thức</label>
                  <input type="date" className="form-control" value={officialDate} onChange={e => setOfficialDate(e.target.value)} />
                </div>
              </div>

              {/* Portal accounts creation */}
              {!currentEmpId && (
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '1rem', color: 'var(--primary)', marginTop: '1.5rem' }}>Cấp tài khoản đăng nhập (Tùy chọn)</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Tên đăng nhập mới</label>
                      <input type="text" className="form-control" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu khởi tạo</label>
                      <input type="password" className="form-control" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEmpModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Excel */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Nhập nhân sự từ file Excel</h3>
              <button className="modal-close" onClick={() => setIsImportModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="form-group">
                <label>Chọn File Excel (.xlsx)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".xlsx"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>

              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <strong>Lưu ý về định dạng cột:</strong>
                <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                  <li>Cần chứa các tiêu đề cột đúng định dạng tiếng Việt:</li>
                  <li>Họ Và Tên, Phòng Ban, Chức Vụ, Loại Hợp Đồng</li>
                  <li>(Tùy chọn: Ngày Sinh, Số CCCD, Email, Số Điện Thoại, Địa Chỉ, Ngày Thử Việc, Ngày Chính Thức, Trạng Thái)</li>
                </ul>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>Đóng</button>
                <button type="submit" className="btn btn-primary">Bắt đầu Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
