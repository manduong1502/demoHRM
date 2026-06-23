const API_BASE_URL = 'http://localhost:5000/api';

// --- State Store ---
const state = {
  token: localStorage.getItem('hrm_token') || '',
  user: JSON.parse(localStorage.getItem('hrm_user')) || null,
  activeView: 'view-dashboard',
  employees: {
    data: [],
    page: 1,
    limit: 10,
    totalPages: 1,
    search: '',
    department: '',
    status: ''
  },
  timesheet: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    data: []
  },
  leaves: {
    data: [],
    statusFilter: ''
  }
};

// --- HTTP Client ---
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    
    // Check if the response is a blob/file stream
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      if (!response.ok) throw new Error('File download failed');
      return await response.blob();
    }

    const data = await response.json();
    
    if (!response.ok) {
      // Automatic logout on token expiration
      if (response.status === 401) {
        logout();
      }
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Toast Feedback Utility ---
function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast badge-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- App Bootstrapper & Routing ---
function initApp() {
  if (state.token && state.user) {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-layout').classList.remove('hidden');
    
    // Setup user display details
    document.getElementById('user-display-name').innerText = state.user.username;
    document.getElementById('user-display-role').innerText = state.user.role;
    
    applyRolePermissionsVisibility();
    switchView(state.activeView);
  } else {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('app-layout').classList.add('hidden');
  }
}

function applyRolePermissionsVisibility() {
  const role = state.user ? state.user.role : '';
  
  // Rules-based visibility check
  document.querySelectorAll('[data-permission]').forEach(el => {
    const perm = el.getAttribute('data-permission');
    
    if (role === 'Admin') {
      el.classList.remove('hidden');
      return;
    }

    // Map permissions
    const mockUserPermissions = {
      'HR Manager': ['employee:view', 'employee:create', 'employee:edit', 'employee:delete', 'leave:approve'],
      'Line Manager': ['employee:view', 'leave:approve'],
      'Employee': ['leave:request']
    };

    const userPerms = mockUserPermissions[role] || [];
    if (userPerms.includes(perm)) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Check-in and out buttons are hidden for direct Admin if they have no linked profile, 
  // but let's keep them visible. If they trigger, the controller handles profile link checking.
}

function switchView(viewId) {
  state.activeView = viewId;

  // Active view visibility toggle
  document.querySelectorAll('.app-view').forEach(view => {
    if (view.id === viewId) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });

  // Sidebar link visual updates
  document.querySelectorAll('.sidebar-menu li').forEach(li => {
    if (li.getAttribute('data-target') === viewId) {
      li.classList.add('active');
    } else {
      li.classList.remove('active');
    }
  });

  // Header Title Update
  const headerTitles = {
    'view-dashboard': 'Tổng quan',
    'view-employees': 'Hồ sơ nhân viên',
    'view-timesheet': 'Bảng chấm công',
    'view-leaves': 'Đơn từ nghỉ phép / OT',
    'view-salary': 'Tính lương & Phúc lợi (Skeleton)',
    'view-kpi': 'Đánh giá KPI (Skeleton)',
    'view-reports': 'Báo cáo tổng hợp (Skeleton)'
  };
  document.getElementById('main-page-header').innerText = headerTitles[viewId] || 'HRM System';

  // Load specific view data
  if (viewId === 'view-dashboard') loadDashboardData();
  else if (viewId === 'view-employees') loadEmployeesData();
  else if (viewId === 'view-timesheet') loadTimesheetData();
  else if (viewId === 'view-leaves') loadLeavesData();
}

// --- Auth Operations ---
async function login(username, password) {
  try {
    const result = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    state.token = result.token;
    state.user = result.user;
    
    localStorage.setItem('hrm_token', result.token);
    localStorage.setItem('hrm_user', JSON.stringify(result.user));
    
    showToast('Đăng nhập thành công!');
    initApp();
  } catch (err) {
    console.error(err);
  }
}

function logout() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('hrm_token');
  localStorage.removeItem('hrm_user');
  initApp();
}

// --- View 1: Dashboard Logic ---
async function loadDashboardData() {
  try {
    // If the user has 'employee:view', retrieve total count from employees list
    let totalEmployees = 0;
    if (state.user.role === 'Admin' || state.user.role === 'HR Manager' || state.user.role === 'Line Manager') {
      const empData = await fetchAPI('/employees?limit=1');
      totalEmployees = empData.totalItems || 0;
    } else {
      totalEmployees = 1; // current employee
    }
    
    // Retrieve timesheet count for today
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const timesheetData = await fetchAPI(`/attendance/timesheet?year=${year}&month=${month}`);
    const activeToday = timesheetData.filter(t => t.date === todayStr && t.checkIn).length;

    // Retrieve pending leaves
    const pendingLeaves = await fetchAPI('/attendance/leave-requests?status=pending');
    
    document.getElementById('widget-total-employees').innerText = totalEmployees;
    document.getElementById('widget-today-attendance').innerText = activeToday;
    document.getElementById('widget-pending-leaves').innerText = pendingLeaves.length;
  } catch (err) {
    console.error(err);
  }
}

// --- View 2: Employee Profiles Logic ---
async function loadEmployeesData() {
  const { page, limit, search, department, status } = state.employees;
  const queryString = `?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}&status=${encodeURIComponent(status)}`;
  
  try {
    const result = await fetchAPI(`/employees${queryString}`);
    state.employees.data = result.employees;
    state.employees.totalPages = result.totalPages;
    
    renderEmployeeTable(result.employees);
    updateEmployeePaginationInfo(result.totalItems);
  } catch (err) {
    console.error(err);
  }
}

function renderEmployeeTable(employees) {
  const tbody = document.getElementById('employee-list-tbody');
  tbody.innerHTML = '';

  if (employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Không tìm thấy nhân sự phù hợp</td></tr>`;
    return;
  }

  const role = state.user.role;
  const isEditable = role === 'Admin' || role === 'HR Manager';

  employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${emp.employeeCode}</strong></td>
      <td>${emp.fullName}</td>
      <td>${emp.email || '-'}</td>
      <td>${emp.phone || '-'}</td>
      <td>${emp.department}</td>
      <td>${emp.position}</td>
      <td>${emp.contractType}</td>
      <td><span class="badge badge-${emp.status}">${emp.status === 'working' ? 'Đang làm việc' : (emp.status === 'probation' ? 'Thử việc' : 'Đã nghỉ việc')}</span></td>
      <td class="action-cell">
        ${isEditable ? `
          <button class="btn btn-secondary btn-sm-action" onclick="editEmployee(${emp.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Sửa</button>
          <button class="btn btn-danger btn-sm-action" onclick="deleteEmployee(${emp.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;">Xóa</button>
        ` : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateEmployeePaginationInfo(totalItems) {
  const { page, limit } = state.employees;
  const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);
  
  document.getElementById('employee-pagination-info').innerText = `Hiển thị ${start} - ${end} của ${totalItems} nhân sự`;
  
  document.getElementById('btn-employee-prev-page').disabled = page <= 1;
  document.getElementById('btn-employee-next-page').disabled = page >= state.employees.totalPages;
}

// Edit/Delete actions in window scope
window.editEmployee = async function(id) {
  try {
    const employee = await fetchAPI(`/employees/${id}`);
    
    // Fill Form fields
    document.getElementById('emp-form-id').value = employee.id;
    document.getElementById('emp-form-name').value = employee.fullName;
    document.getElementById('emp-form-dob').value = employee.dob || '';
    document.getElementById('emp-form-identity').value = employee.identityCode || '';
    document.getElementById('emp-form-phone').value = employee.phone || '';
    document.getElementById('emp-form-email').value = employee.email || '';
    document.getElementById('emp-form-address').value = employee.address || '';
    document.getElementById('emp-form-dept').value = employee.department;
    document.getElementById('emp-form-position').value = employee.position;
    document.getElementById('emp-form-contract').value = employee.contractType;
    document.getElementById('emp-form-status').value = employee.status;
    document.getElementById('emp-form-probation-date').value = employee.probationDate || '';
    document.getElementById('emp-form-official-date').value = employee.officialDate || '';

    // Hide portal setup during edits
    document.getElementById('portal-account-section').classList.add('hidden');

    document.getElementById('employee-modal-title').innerText = 'Chỉnh sửa Hồ Sơ Nhân Viên';
    document.getElementById('modal-employee').classList.remove('hidden');
  } catch (err) {
    console.error(err);
  }
};

window.deleteEmployee = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ nhân viên này không?')) return;
  try {
    await fetchAPI(`/employees/${id}`, { method: 'DELETE' });
    showToast('Xóa hồ sơ nhân viên thành công.');
    loadEmployeesData();
  } catch (err) {
    console.error(err);
  }
};

// Modal toggles
window.closeEmployeeModal = function() {
  document.getElementById('modal-employee').classList.add('hidden');
};

window.closeImportModal = function() {
  document.getElementById('modal-import').classList.add('hidden');
};

// --- View 3: Timesheet Logic ---
async function loadTimesheetData() {
  const { year, month } = state.timesheet;
  try {
    // 1. Fetch timesheet records from database
    const records = await fetchAPI(`/attendance/timesheet?year=${year}&month=${month}`);
    
    // 2. Fetch employee list to display rows
    const employeesResult = await fetchAPI('/employees?limit=200');
    const employees = employeesResult.employees;

    renderTimesheetGrid(employees, records, year, month);
  } catch (err) {
    console.error(err);
  }
}

function renderTimesheetGrid(employees, records, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const theadTr = document.getElementById('timesheet-grid-thead-tr');
  const tbody = document.getElementById('timesheet-grid-tbody');

  // Reset columns
  theadTr.innerHTML = `<th class="emp-name-col">Họ và tên</th>`;
  tbody.innerHTML = '';

  // 1. Build table header columns (Days of month)
  for (let day = 1; day <= daysInMonth; day++) {
    const th = document.createElement('th');
    th.innerText = day < 10 ? `0${day}` : day;
    // Highlight weekend headers
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      th.style.backgroundColor = '#e2e8f0';
    }
    theadTr.appendChild(th);
  }

  // 2. Build rows for each employee
  if (employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${daysInMonth + 1}" style="padding: 2rem; color: var(--text-muted); text-align: center;">Không có hồ sơ nhân viên nào.</td></tr>`;
    return;
  }

  employees.forEach(emp => {
    const tr = document.createElement('tr');
    
    // Column 1: Employee Name
    const nameTd = document.createElement('td');
    nameTd.className = 'emp-name-col';
    nameTd.innerHTML = `<strong>${emp.fullName}</strong><div style="font-size: 0.65rem; color: var(--text-muted);">${emp.employeeCode} | ${emp.department}</div>`;
    tr.appendChild(nameTd);

    // Days Columns (1 to N)
    for (let day = 1; day <= daysInMonth; day++) {
      const td = document.createElement('td');
      td.className = 'day-cell';
      
      const dayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Look up attendance record
      const attRecord = records.find(r => r.employeeId === emp.id && r.date === dayDateStr);
      const cellWrapper = document.createElement('div');
      cellWrapper.className = 'day-cell-content';

      // Check if it's weekend
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

      if (attRecord) {
        let displaySymbol = 'X'; // Default present
        let cellClass = 'cell-present';

        if (attRecord.status === 'late') {
          displaySymbol = 'L';
          cellClass = 'cell-late';
        } else if (attRecord.status === 'early') {
          displaySymbol = 'V';
          cellClass = 'cell-early';
        } else if (attRecord.status === 'absent') {
          displaySymbol = 'KP';
          cellClass = 'cell-absent';
        } else if (attRecord.status === 'leave_paid') {
          displaySymbol = 'P';
          cellClass = 'cell-leave_paid';
        } else if (attRecord.status === 'leave_unpaid') {
          displaySymbol = 'PL';
          cellClass = 'cell-leave_unpaid';
        }

        cellWrapper.innerText = displaySymbol;
        cellWrapper.className += ` ${cellClass}`;
        
        // Tooltip detail
        td.title = `Check-in: ${attRecord.checkIn || '-'}\nCheck-out: ${attRecord.checkOut || '-'}\nOT: ${attRecord.otHours}h\nGhi chú: ${attRecord.notes || '-'}`;
      } else {
        if (isWeekend) {
          cellWrapper.innerText = '';
          cellWrapper.className += ' cell-weekend';
        } else {
          // If day is in the past, display it as absent (KP)
          const todayStr = getLocalDateString(new Date());
          if (dayDateStr < todayStr) {
            cellWrapper.innerText = 'KP';
            cellWrapper.className += ' cell-absent';
            td.title = 'Vắng mặt không phép';
          } else {
            cellWrapper.innerText = '-';
            cellWrapper.className += ' cell-empty';
          }
        }
      }

      td.appendChild(cellWrapper);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

// --- View 4: Leave Requests & OT Logic ---
async function loadLeavesData() {
  const { statusFilter } = state.leaves;
  let query = statusFilter ? `?status=${statusFilter}` : '';
  
  try {
    const requests = await fetchAPI(`/attendance/leave-requests${query}`);
    state.leaves.data = requests;
    renderLeavesTable(requests);
  } catch (err) {
    console.error(err);
  }
}

function renderLeavesTable(requests) {
  const tbody = document.getElementById('leave-requests-tbody');
  tbody.innerHTML = '';

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Không có đơn từ nào.</td></tr>`;
    return;
  }

  const role = state.user.role;
  const isApprover = role === 'Admin' || role === 'HR Manager' || role === 'Line Manager';

  requests.forEach(req => {
    const tr = document.createElement('tr');
    
    // Duration display
    const durationUnit = req.requestType === 'ot' ? 'giờ' : 'ngày';
    
    // Status text
    let typeText = 'Nghỉ phép có lương';
    if (req.requestType === 'leave_unpaid') typeText = 'Nghỉ phép không lương';
    else if (req.requestType === 'ot') typeText = 'Làm thêm giờ (OT)';

    // Date formatting helper
    const formatDate = (isoString) => {
      const d = new Date(isoString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    tr.innerHTML = `
      <td><strong>${req.employee ? req.employee.fullName : 'Hệ thống'}</strong><div style="font-size: 0.7rem; color: var(--text-muted);">${req.employee ? req.employee.employeeCode : ''}</div></td>
      <td>${typeText}</td>
      <td style="font-size: 0.75rem;">
        <div>Từ: ${formatDate(req.startDate)}</div>
        <div>Đến: ${formatDate(req.endDate)}</div>
      </td>
      <td>${req.duration} ${durationUnit}</td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${req.reason}">${req.reason}</td>
      <td><span class="badge badge-${req.status}">${req.status === 'pending' ? 'Chờ duyệt' : (req.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối')}</span></td>
      <td>
        ${isApprover && req.status === 'pending' ? `
          <button class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="approveLeave(${req.id})">Duyệt</button>
          <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;" onclick="rejectLeave(${req.id})">Từ chối</button>
        ` : (req.status !== 'pending' ? `<span style="font-size: 0.75rem; color: var(--text-muted);">Duyệt bởi: ${req.approver ? req.approver.username : 'Admin'}</span>` : '-')}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.approveLeave = async function(id) {
  const notes = prompt('Nhập ý kiến duyệt đơn (Tùy chọn):') || '';
  try {
    await fetchAPI(`/attendance/leave-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
    showToast('Đã duyệt đơn và đồng bộ vào bảng chấm công.');
    loadLeavesData();
  } catch (err) {
    console.error(err);
  }
};

window.rejectLeave = async function(id) {
  const notes = prompt('Nhập lý do từ chối:') || '';
  if (!notes) return;
  try {
    await fetchAPI(`/attendance/leave-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
    showToast('Đã từ chối đơn từ.');
    loadLeavesData();
  } catch (err) {
    console.error(err);
  }
};

// --- Event Listeners Mapping ---
document.addEventListener('DOMContentLoaded', () => {
  // Init
  initApp();

  // Auth Form Submit
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    login(u, p);
  });

  // Logout Click
  document.getElementById('btn-logout-action').addEventListener('click', logout);

  // Sidebar Menu Clicks
  document.querySelectorAll('.sidebar-menu li').forEach(li => {
    li.addEventListener('click', (e) => {
      e.preventDefault();
      const target = li.getAttribute('data-target');
      switchView(target);
    });
  });

  // Check-in / Check-out quick triggers
  document.getElementById('btn-quick-checkin').addEventListener('click', async () => {
    try {
      const result = await fetchAPI('/attendance/check-in', { method: 'POST' });
      showToast(`Đã Check-In vào lúc: ${result.record.checkIn}`);
      if (state.activeView === 'view-dashboard') loadDashboardData();
      else if (state.activeView === 'view-timesheet') loadTimesheetData();
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('btn-quick-checkout').addEventListener('click', async () => {
    try {
      const result = await fetchAPI('/attendance/check-out', { method: 'POST' });
      showToast(`Đã Check-Out vào lúc: ${result.record.checkOut}`);
      if (state.activeView === 'view-dashboard') loadDashboardData();
      else if (state.activeView === 'view-timesheet') loadTimesheetData();
    } catch (err) {
      console.error(err);
    }
  });

  // Employee: Filter Button
  document.getElementById('btn-employee-search-action').addEventListener('click', () => {
    state.employees.search = document.getElementById('filter-employee-search').value;
    state.employees.department = document.getElementById('filter-employee-dept').value;
    state.employees.status = document.getElementById('filter-employee-status').value;
    state.employees.page = 1;
    loadEmployeesData();
  });

  // Employee: Pagination triggers
  document.getElementById('btn-employee-prev-page').addEventListener('click', () => {
    if (state.employees.page > 1) {
      state.employees.page--;
      loadEmployeesData();
    }
  });

  document.getElementById('btn-employee-next-page').addEventListener('click', () => {
    if (state.employees.page < state.employees.totalPages) {
      state.employees.page++;
      loadEmployeesData();
    }
  });

  // Employee: Add button trigger modal
  document.getElementById('btn-add-employee-modal').addEventListener('click', () => {
    document.getElementById('emp-form-id').value = '';
    document.getElementById('employee-detail-form').reset();
    document.getElementById('employee-modal-title').innerText = 'Thêm Nhân Viên Mới';
    // Display portal account fields for creation
    document.getElementById('portal-account-section').classList.remove('hidden');
    document.getElementById('modal-employee').classList.remove('hidden');
  });

  // Employee: Save Form
  document.getElementById('employee-detail-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('emp-form-id').value;
    
    // Construct body payload
    const body = {
      fullName: document.getElementById('emp-form-name').value,
      dob: document.getElementById('emp-form-dob').value || null,
      identityCode: document.getElementById('emp-form-identity').value || null,
      phone: document.getElementById('emp-form-phone').value || null,
      email: document.getElementById('emp-form-email').value || null,
      address: document.getElementById('emp-form-address').value || null,
      department: document.getElementById('emp-form-dept').value,
      position: document.getElementById('emp-form-position').value,
      contractType: document.getElementById('emp-form-contract').value,
      status: document.getElementById('emp-form-status').value,
      probationDate: document.getElementById('emp-form-probation-date').value || null,
      officialDate: document.getElementById('emp-form-official-date').value || null
    };

    try {
      if (id) {
        // Edit Profile
        await fetchAPI(`/employees/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        showToast('Cập nhật hồ sơ thành công.');
      } else {
        const username = document.getElementById('emp-form-username').value.trim();
        const passwordHash = document.getElementById('emp-form-password').value;

        if (username && passwordHash) {
          // 1. Register user portal account first to check for duplicate usernames
          const userResponse = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              username,
              email: body.email || `${username}@hrm.com`,
              password: passwordHash,
              roleName: 'Employee'
            })
          });

          // 2. Map new userId to employee profile payload
          body.userId = userResponse.user.id;
        }

        // 3. Create employee profile with the mapped userId
        await fetchAPI('/employees', {
          method: 'POST',
          body: JSON.stringify(body)
        });

        showToast('Thêm hồ sơ nhân sự thành công.');
      }
      closeEmployeeModal();
      loadEmployeesData();
    } catch (err) {
      console.error(err);
    }
  });

  // Employee: Export Excel trigger
  document.getElementById('btn-export-employees-action').addEventListener('click', async () => {
    try {
      const blob = await fetchAPI('/employees/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Danh_Sach_Nhan_Vien.xlsx';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 500);
      showToast('Đã tải xuống file Excel.');
    } catch (err) {
      console.error(err);
    }
  });

  // Employee: Import Excel trigger modal
  document.getElementById('btn-import-employee-modal').addEventListener('click', () => {
    document.getElementById('excel-import-form').reset();
    document.getElementById('modal-import').classList.remove('hidden');
  });

  // Employee: Import Excel Form Submit
  document.getElementById('excel-import-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput.files.length === 0) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const response = await fetch(`${API_BASE_URL}/employees/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Import failed.');

      showToast(`Import thành công ${data.successCount} nhân viên.`);
      if (data.errors && data.errors.length > 0) {
        alert('Một số dòng bị lỗi:\n' + data.errors.join('\n'));
      }
      closeImportModal();
      loadEmployeesData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Timesheet: Loader trigger
  document.getElementById('btn-load-timesheet-action').addEventListener('click', () => {
    state.timesheet.year = document.getElementById('timesheet-select-year').value;
    state.timesheet.month = document.getElementById('timesheet-select-month').value;
    loadTimesheetData();
  });

  // Leaves: Filter dropdown click
  document.getElementById('filter-leave-status').addEventListener('change', (e) => {
    state.leaves.statusFilter = e.target.value;
    loadLeavesData();
  });

  // Leaves: Form submit
  document.getElementById('leave-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      requestType: document.getElementById('leave-req-type').value,
      startDate: new Date(document.getElementById('leave-req-start').value).toISOString(),
      endDate: new Date(document.getElementById('leave-req-end').value).toISOString(),
      duration: parseFloat(document.getElementById('leave-req-duration').value),
      reason: document.getElementById('leave-req-reason').value
    };

    try {
      await fetchAPI('/attendance/leave-requests', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast('Đã gửi đơn từ xin nghỉ / OT.');
      document.getElementById('leave-request-form').reset();
      loadLeavesData();
    } catch (err) {
      console.error(err);
    }
  });

  // --- Skeleton View Actions ---
  document.getElementById('btn-skeleton-salary-calc').addEventListener('click', async () => {
    try {
      const res = await fetchAPI('/salary/calculate', {
        method: 'POST',
        body: JSON.stringify({ month: 6, year: 2026 })
      });
      showToast(`${res.message} Mức lương ròng = ${res.calculatedFields.netSalary} VNĐ.`);
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('btn-skeleton-kpi-submit').addEventListener('click', async () => {
    try {
      const res = await fetchAPI('/kpi/evaluations', {
        method: 'POST',
        body: JSON.stringify({ employeeId: 1, score: 95, comments: 'Good work' })
      });
      showToast(`${res.message} Ghi nhận lúc: ${res.evaluation.recordedAt}`);
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('btn-skeleton-reports-fetch').addEventListener('click', async () => {
    try {
      const res = await fetchAPI('/reports/attendance-stats');
      showToast(`${res.message} Tỷ lệ đi làm: ${res.stats.presentRate}.`);
    } catch (err) {
      console.error(err);
    }
  });
});
