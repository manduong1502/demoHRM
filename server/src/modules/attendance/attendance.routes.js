const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const authenticate = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

// Authenticate all attendance and leave routes
router.use(authenticate);

// Check-in and Check-out
router.post('/check-in', checkPermission('attendance:check'), attendanceController.handleCheckIn);
router.post('/check-out', checkPermission('attendance:check'), attendanceController.handleCheckOut);

// Timesheet data retrieval
router.get('/timesheet', checkPermission(['attendance:view', 'attendance:view_own']), attendanceController.getTimesheetData);

// Leave & OT Requests
router.post('/leave-requests', checkPermission('leave:request'), attendanceController.submitLeave);
router.get('/leave-requests', checkPermission(['leave:view', 'leave:view_own']), attendanceController.listLeaveRequests);
router.patch('/leave-requests/:id/approve', checkPermission('leave:approve'), attendanceController.handleApprove);
router.patch('/leave-requests/:id/reject', checkPermission('leave:approve'), attendanceController.handleReject);

module.exports = router;
