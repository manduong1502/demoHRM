const employeeService = require('./employee.service');

const getEmployees = async (req, res, next) => {
  try {
    const { page, limit, search, department, status } = req.query;
    const result = await employeeService.getEmployeeList({ page, limit, search, department, status });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getEmployeeDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
};

const createEmployeeProfile = async (req, res, next) => {
  try {
    const newProfile = await employeeService.createEmployee(req.body);
    res.status(201).json({
      message: 'Tạo hồ sơ nhân viên thành công.',
      employee: newProfile
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedProfile = await employeeService.updateEmployee(id, req.body);
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    }
    res.json({
      message: 'Cập nhật hồ sơ nhân viên thành công.',
      employee: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

const deleteEmployeeProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await employeeService.deleteEmployee(id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    }
    res.json({ message: 'Xóa hồ sơ nhân viên thành công.' });
  } catch (error) {
    next(error);
  }
};

const exportEmployees = async (req, res, next) => {
  try {
    const buffer = await employeeService.exportEmployeesToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=EmployeeDirectory.xlsx');
    res.end(buffer);
  } catch (error) {
    next(error);
  }
};

const importEmployees = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên một tệp Excel.' });
    }
    const result = await employeeService.importEmployeesFromExcel(req.file.buffer);
    res.json({
      message: `Nhập dữ liệu hàng loạt thành công: ${result.successCount} nhân viên được thêm.`,
      successCount: result.successCount,
      errors: result.errors
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeDetail,
  createEmployeeProfile,
  updateEmployeeProfile,
  deleteEmployeeProfile,
  exportEmployees,
  importEmployees
};
