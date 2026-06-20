const { EmployeeProfile, User, Role } = require('../../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

const getEmployeeList = async ({ page = 1, limit = 10, search = '', department = '', status = '' }) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { employeeCode: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  if (department) {
    whereClause.department = department;
  }

  if (status) {
    whereClause.status = status;
  }

  const { count, rows } = await EmployeeProfile.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['employeeCode', 'ASC']],
    include: {
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'status'],
      include: {
        model: Role,
        as: 'role',
        attributes: ['name']
      }
    }
  });

  return {
    totalItems: count,
    employees: rows,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page, 10)
  };
};

const getEmployeeById = async (id) => {
  const employee = await EmployeeProfile.findByPk(id, {
    include: {
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'status'],
      include: {
        model: Role,
        as: 'role',
        attributes: ['name']
      }
    }
  });
  return employee;
};

const createEmployee = async (employeeData) => {
  return await EmployeeProfile.create(employeeData);
};

const updateEmployee = async (id, updateData) => {
  const employee = await EmployeeProfile.findByPk(id);
  if (!employee) return null;
  return await employee.update(updateData);
};

const deleteEmployee = async (id) => {
  const employee = await EmployeeProfile.findByPk(id);
  if (!employee) return false;
  await employee.destroy();
  return true;
};

// Excel Export: Returns a buffer
const exportEmployeesToExcel = async () => {
  const employees = await EmployeeProfile.findAll({
    order: [['employeeCode', 'ASC']],
    raw: true
  });

  const data = employees.map(emp => ({
    'Mã Nhân Viên': emp.employeeCode,
    'Họ Và Tên': emp.fullName,
    'Ngày Sinh': emp.dob || '',
    'Số CCCD': emp.identityCode || '',
    'Email': emp.email || '',
    'Số Điện Thoại': emp.phone || '',
    'Địa Chỉ': emp.address || '',
    'Phòng Ban': emp.department,
    'Chức Vụ': emp.position,
    'Loại Hợp Đồng': emp.contractType,
    'Ngày Thử Việc': emp.probationDate || '',
    'Ngày Chính Thức': emp.officialDate || '',
    'Trạng Thái': emp.status === 'working' ? 'Đang làm việc' : (emp.status === 'probation' ? 'Thử việc' : 'Đã nghỉ việc')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

// Excel Import: Parses buffer and creates profiles
const importEmployeesFromExcel = async (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const importedList = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const fullName = row['Họ Và Tên'];
      const department = row['Phòng Ban'];
      const position = row['Chức Vụ'];
      const contractType = row['Loại Hợp Đồng'];

      if (!fullName || !department || !position || !contractType) {
        errors.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc (Họ Và Tên, Phòng Ban, Chức Vụ, Loại Hợp Đồng).`);
        continue;
      }

      // Format status
      let status = 'probation';
      const statusText = row['Trạng Thái'];
      if (statusText === 'Đang làm việc') status = 'working';
      else if (statusText === 'Đã nghỉ việc') status = 'resigned';

      const employeeData = {
        fullName,
        dob: row['Ngày Sinh'] || null,
        identityCode: row['Số CCCD'] ? String(row['Số CCCD']) : null,
        email: row['Email'] || null,
        phone: row['Số Điện Thoại'] ? String(row['Số Điện Thoại']) : null,
        address: row['Địa Chỉ'] || null,
        department,
        position,
        contractType,
        probationDate: row['Ngày Thử Việc'] || null,
        officialDate: row['Ngày Chính Thức'] || null,
        status
      };

      const newEmp = await EmployeeProfile.create(employeeData);
      importedList.push(newEmp);
    } catch (err) {
      errors.push(`Dòng ${i + 2}: Lỗi lưu dữ liệu (${err.message}).`);
    }
  }

  return {
    successCount: importedList.length,
    errors
  };
};

module.exports = {
  getEmployeeList,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  exportEmployeesToExcel,
  importEmployeesFromExcel
};
