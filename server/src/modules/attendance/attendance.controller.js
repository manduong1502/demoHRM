const attendanceService = require('./attendance.service');
const { EmployeeProfile } = require('../../models');

// Helper to get employee profile of current user
const getCurrentEmployeeProfile = async (userId) => {
  const emp = await EmployeeProfile.findOne({ where: { userId } });
  if (!emp) {
    throw new Error('Tài khoản người dùng này chưa được liên kết với Hồ sơ nhân viên nào.');
  }
  return emp;
};

const handleCheckIn = async (req, res, next) => {
  try {
    const emp = await getCurrentEmployeeProfile(req.user.id);
    const record = await attendanceService.checkIn(emp.id);
    res.json({
      message: 'Điểm danh vào làm (Check-in) thành công.',
      record
    });
  } catch (error) {
    next(error);
  }
};

const handleCheckOut = async (req, res, next) => {
  try {
    const emp = await getCurrentEmployeeProfile(req.user.id);
    const record = await attendanceService.checkOut(emp.id);
    res.json({
      message: 'Điểm danh ra về (Check-out) thành công.',
      record
    });
  } catch (error) {
    next(error);
  }
};

const getTimesheetData = async (req, res, next) => {
  try {
    const { year, month, employeeId } = req.query;

    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || (new Date().getMonth() + 1);

    let targetEmployeeId = employeeId;

    // If the logged-in user is an Employee, they can only view their own timesheet
    if (req.user.role === 'Employee') {
      const emp = await getCurrentEmployeeProfile(req.user.id);
      targetEmployeeId = emp.id;
    }

    const records = await attendanceService.getTimesheet({
      year: parseInt(currentYear, 10),
      month: parseInt(currentMonth, 10),
      employeeId: targetEmployeeId
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

const submitLeave = async (req, res, next) => {
  try {
    const emp = await getCurrentEmployeeProfile(req.user.id);
    const request = await attendanceService.submitLeaveRequest(emp.id, req.body);
    res.status(201).json({
      message: 'Gửi yêu cầu nghỉ phép/OT thành công.',
      request
    });
  } catch (error) {
    next(error);
  }
};

const listLeaveRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let employeeId = null;

    // If user is Employee, filter to only show their own requests
    if (req.user.role === 'Employee') {
      const emp = await getCurrentEmployeeProfile(req.user.id);
      employeeId = emp.id;
    }

    const requests = await attendanceService.getLeaveRequests({ status, employeeId });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

const handleApprove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const request = await attendanceService.approveRequest(id, req.user.id, notes);
    res.json({
      message: 'Duyệt yêu cầu thành công và đã đồng bộ vào bảng công.',
      request
    });
  } catch (error) {
    next(error);
  }
};

const handleReject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const request = await attendanceService.rejectRequest(id, req.user.id, notes);
    res.json({
      message: 'Từ chối yêu cầu thành công.',
      request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCheckIn,
  handleCheckOut,
  getTimesheetData,
  submitLeave,
  listLeaveRequests,
  handleApprove,
  handleReject
};
