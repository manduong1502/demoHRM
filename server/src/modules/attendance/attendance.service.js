const { Attendance, LeaveRequest, EmployeeProfile, User } = require('../../models');
const { Op } = require('sequelize');

// Helper to format date and time in local timezone
const getLocalDateString = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => {
  return getLocalDateString(new Date());
};

const getCurrentTimeString = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0]; // HH:MM:SS
};

// 1. Check-In
const checkIn = async (employeeId) => {
  const today = getTodayDateString();
  const nowTime = getCurrentTimeString();
  
  // Rule: late if check in after 08:30 AM
  const checkInLimit = '08:30:00';
  const status = nowTime > checkInLimit ? 'late' : 'present';

  let record = await Attendance.findOne({
    where: { employeeId, date: today }
  });

  if (record) {
    if (record.checkIn) {
      throw new Error('Bạn đã thực hiện check-in hôm nay rồi.');
    }
    // Update existing record (could be created by leave approval previously)
    await record.update({
      checkIn: nowTime,
      status: record.status.startsWith('leave') ? record.status : status
    });
  } else {
    // Create new check-in record
    record = await Attendance.create({
      employeeId,
      date: today,
      checkIn: nowTime,
      status
    });
  }

  return record;
};

// 2. Check-Out
const checkOut = async (employeeId) => {
  const today = getTodayDateString();
  const nowTime = getCurrentTimeString();

  const record = await Attendance.findOne({
    where: { employeeId, date: today }
  });

  if (!record) {
    throw new Error('Bạn phải check-in trước khi thực hiện check-out.');
  }

  if (record.checkOut) {
    throw new Error('Bạn đã thực hiện check-out hôm nay rồi.');
  }

  // Rule: early if check out before 05:30 PM (17:30)
  const checkOutLimit = '17:30:00';
  let newStatus = record.status;

  if (nowTime < checkOutLimit) {
    // If they checked in fine but left early, update status to early
    if (record.status === 'present') {
      newStatus = 'early';
    }
  }

  await record.update({
    checkOut: nowTime,
    status: newStatus
  });

  return record;
};

// 3. Get Timesheet summary
const getTimesheet = async ({ year, month, employeeId = null }) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Calculate end date
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const whereClause = {
    date: {
      [Op.between]: [startDate, endDate]
    }
  };

  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  const attendanceRecords = await Attendance.findAll({
    where: whereClause,
    order: [['date', 'ASC']],
    include: {
      model: EmployeeProfile,
      as: 'employee',
      attributes: ['fullName', 'employeeCode', 'department']
    }
  });

  return attendanceRecords;
};

// 4. Submit Leave or OT request
const submitLeaveRequest = async (employeeId, requestData) => {
  const { requestType, startDate, endDate, duration, reason } = requestData;

  if (!requestType || !startDate || !endDate || !duration || !reason) {
    throw new Error('Thiếu các trường bắt buộc để gửi yêu cầu.');
  }

  // Validate dates: start must be before end
  if (new Date(startDate) > new Date(endDate)) {
    throw new Error('Ngày bắt đầu không thể sau ngày kết thúc.');
  }

  // Overlap verification: check if there's any pending or approved request overlapping this range
  const overlap = await LeaveRequest.findOne({
    where: {
      employeeId,
      status: { [Op.ne]: 'rejected' }, // ignore rejected requests
      [Op.or]: [
        {
          startDate: { [Op.between]: [startDate, endDate] }
        },
        {
          endDate: { [Op.between]: [startDate, endDate] }
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]
        }
      ]
    }
  });

  if (overlap) {
    throw new Error('Bạn đã có đơn nghỉ phép hoặc đơn OT khác bị trùng lặp thời gian trong khoảng này.');
  }

  return await LeaveRequest.create({
    employeeId,
    requestType,
    startDate,
    endDate,
    duration,
    reason,
    status: 'pending'
  });
};

// 5. Get Leave Requests List
const getLeaveRequests = async ({ status, employeeId = null }) => {
  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  return await LeaveRequest.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: EmployeeProfile,
        as: 'employee',
        attributes: ['fullName', 'employeeCode', 'department']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['username']
      }
    ]
  });
};

// Helper: Sync leave/OT to attendance
const syncRequestToAttendance = async (request, approverUserId) => {
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);

  // OT Request Sync logic
  if (request.requestType === 'ot') {
    const otDate = getLocalDateString(request.startDate);
    let record = await Attendance.findOne({
      where: { employeeId: request.employeeId, date: otDate }
    });

    if (record) {
      await record.update({
        otHours: parseFloat(request.duration),
        notes: `Duyệt OT: ${request.reason} (Người duyệt ID: ${approverUserId})`
      });
    } else {
      await Attendance.create({
        employeeId: request.employeeId,
        date: otDate,
        status: 'present', // assume present for OT day or default to present
        otHours: parseFloat(request.duration),
        notes: `Duyệt OT: ${request.reason} (Người duyệt ID: ${approverUserId})`
      });
    }
    return;
  }

  // Leave Request (Paid/Unpaid) Sync logic
  // Iterate dates between start and end inclusive
  const curr = new Date(start);
  while (curr <= end) {
    const dateStr = getLocalDateString(curr);
    
    // Check if day is weekend (0 = Sunday, 6 = Saturday)
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // skip Saturday & Sunday
      let record = await Attendance.findOne({
        where: { employeeId: request.employeeId, date: dateStr }
      });

      const leaveStatus = request.requestType === 'leave_paid' ? 'leave_paid' : 'leave_unpaid';

      if (record) {
        await record.update({
          status: leaveStatus,
          notes: `Duyệt nghỉ phép: ${request.reason}`
        });
      } else {
        await Attendance.create({
          employeeId: request.employeeId,
          date: dateStr,
          status: leaveStatus,
          notes: `Duyệt nghỉ phép: ${request.reason}`
        });
      }
    }
    
    // Move to next day
    curr.setDate(curr.getDate() + 1);
  }
};

// 6. Approve Leave Request
const approveRequest = async (requestId, approverUserId, notes = '') => {
  const request = await LeaveRequest.findByPk(requestId);
  if (!request) {
    throw new Error('Không tìm thấy yêu cầu nghỉ phép.');
  }

  if (request.status !== 'pending') {
    throw new Error(`Không thể duyệt yêu cầu đã ở trạng thái ${request.status}.`);
  }

  await request.update({
    status: 'approved',
    approvedBy: approverUserId,
    approvedAt: new Date(),
    notes: notes || request.notes
  });

  // Sync to Attendance
  await syncRequestToAttendance(request, approverUserId);

  return request;
};

// 7. Reject Leave Request
const rejectRequest = async (requestId, approverUserId, notes = '') => {
  const request = await LeaveRequest.findByPk(requestId);
  if (!request) {
    throw new Error('Không tìm thấy yêu cầu nghỉ phép.');
  }

  if (request.status !== 'pending') {
    throw new Error(`Không thể từ chối yêu cầu đã ở trạng thái ${request.status}.`);
  }

  await request.update({
    status: 'rejected',
    approvedBy: approverUserId,
    approvedAt: new Date(),
    notes: notes || 'Bị từ chối bởi Quản lý'
  });

  return request;
};

module.exports = {
  checkIn,
  checkOut,
  getTimesheet,
  submitLeaveRequest,
  getLeaveRequests,
  approveRequest,
  rejectRequest
};
