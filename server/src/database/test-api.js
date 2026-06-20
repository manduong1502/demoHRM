const request = require('supertest');
const app = require('../app');
const { sequelize, User, EmployeeProfile, Attendance, LeaveRequest } = require('../models');
const seed = require('./seed');

const runIntegrationTests = async () => {
  console.log('=====================================================');
  console.log('   STARTING INTEGRATION TESTS FOR 3 CORE FEATURES   ');
  console.log('=====================================================');
  
  let adminToken = '';
  let hrToken = '';
  let empToken = '';
  let testEmployeeId = null;
  let testLeaveRequestId = null;

  try {
    // 0. Clean & Seed database to start from fresh state
    console.log('\n[0] Initializing and Seeding Database...');
    await seed();
    console.log('✔ Seeding complete.');

    // 1. Test Authentication
    console.log('\n[1] Testing Authentication & Token Generation...');
    
    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);
    adminToken = adminLogin.body.token;
    console.log('✔ Admin logged in successfully.');

    // Login HR Manager
    const hrLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'hruser', password: 'hr123' })
      .expect(200);
    hrToken = hrLogin.body.token;
    console.log('✔ HR Manager logged in successfully.');

    // Login Employee
    const empLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'empuser', password: 'emp123' })
      .expect(200);
    empToken = empLogin.body.token;
    console.log('✔ Standard Employee logged in successfully.');

    // 2. Test RBAC Permissions Guard
    console.log('\n[2] Testing RBAC (Role-Based Access Control) Gates...');
    
    // Admin reading roles list -> Should be allowed (bypasses check or has rbac:view)
    await request(app)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log('✔ RBAC Pass Case: Admin allowed to fetch Roles list.');

    // Employee reading roles list -> Should be blocked (lack rbac:view)
    const blockedRes = await request(app)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(403);
    console.log(`✔ RBAC Block Case: Employee blocked from fetching Roles list (Status: ${blockedRes.status}, Message: "${blockedRes.body.message}").`);

    // 3. Test Employee Directory
    console.log('\n[3] Testing Employee Directory CRUD & Excel Actions...');

    // HR User creates profile for standard Employee
    const targetEmpUser = await User.findOne({ where: { username: 'empuser' } });
    await EmployeeProfile.destroy({ where: { userId: targetEmpUser.id } });

    const createEmpRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        userId: targetEmpUser.id,
        fullName: 'Nguyễn Văn Nhân Viên',
        dob: '1995-05-15',
        identityCode: '012345678912',
        email: 'emp@hrm.com',
        phone: '0987654321',
        department: 'Kỹ thuật & Công nghệ',
        position: 'Software Developer',
        contractType: 'Full-time',
        status: 'working'
      })
      .expect(201);
    
    testEmployeeId = createEmpRes.body.employee.id;
    console.log(`✔ Employee Profile created. Assigned Code: ${createEmpRes.body.employee.employeeCode}`);

    // HR User reads employee list with filter
    const listRes = await request(app)
      .get('/api/employees')
      .query({ department: 'Kỹ thuật & Công nghệ' })
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);
    
    const found = listRes.body.employees.some(e => e.id === testEmployeeId);
    if (!found) throw new Error('Created employee not found in filtered list.');
    console.log('✔ Fetch & filter Employee profile matches department criteria.');

    // Fetch Excel export
    const excelRes = await request(app)
      .get('/api/employees/export')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);
    
    if (excelRes.header['content-type'] !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      throw new Error('Incorrect MIME type in Excel export header.');
    }
    console.log('✔ Excel sheet generated and exported successfully.');

    // 4. Test Time & Attendance Check-In/Check-Out
    console.log('\n[4] Testing Check-In & Check-Out Logger...');

    // Employee check-in
    const checkinRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);
    console.log(`✔ Check-In registered. Recorded Check-in: ${checkinRes.body.record.checkIn}, Status: ${checkinRes.body.record.status}`);

    // Employee check-out
    const checkoutRes = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);
    console.log(`✔ Check-Out registered. Recorded Check-out: ${checkoutRes.body.record.checkOut}`);

    // 5. Test Leaves & OT Workflow and Auto-Sync
    console.log('\n[5] Testing Leave Requests Submission, Approval, and Auto-sync...');

    // Submit leave request for 3 days next week
    const leaveRes = await request(app)
      .post('/api/attendance/leave-requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        requestType: 'leave_paid',
        startDate: '2026-06-22T08:00:00Z', // Monday
        endDate: '2026-06-24T17:30:00Z',   // Wednesday
        duration: 3,
        reason: 'Nghỉ mát gia đình'
      })
      .expect(201);
    
    testLeaveRequestId = leaveRes.body.request.id;
    console.log(`✔ Leave request submitted successfully. Status: ${leaveRes.body.request.status}`);

    // HR approves request
    await request(app)
      .patch(`/api/attendance/leave-requests/${testLeaveRequestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ notes: 'Duyệt phép nghỉ mát.' })
      .expect(200);
    console.log('✔ Leave request approved by HR Manager.');

    // Verify timesheet sync (should create leave_paid records for Monday, Tuesday, Wednesday)
    const timesheetRes = await request(app)
      .get('/api/attendance/timesheet?year=2026&month=6')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);
    
    const leaveRecordMon = timesheetRes.body.find(r => r.date === '2026-06-22');
    const leaveRecordTue = timesheetRes.body.find(r => r.date === '2026-06-23');
    const leaveRecordWed = timesheetRes.body.find(r => r.date === '2026-06-24');

    if (!leaveRecordMon || leaveRecordMon.status !== 'leave_paid' ||
        !leaveRecordTue || leaveRecordTue.status !== 'leave_paid' ||
        !leaveRecordWed || leaveRecordWed.status !== 'leave_paid') {
      throw new Error('Leave approval status failed to auto-sync to Attendance Timesheet.');
    }
    console.log('✔ Auto-sync confirmed: 3 timesheet days updated to "leave_paid".');

    console.log('\n=====================================================');
    console.log('  ★ INTEGRATION TESTS SUMMARY: 100% SUCCESS ★  ');
    console.log('=====================================================');
  } catch (error) {
    console.error('\n✖ TEST FAILED WITH EXCEPTION:', error.message);
    process.exit(1);
  }
};

runIntegrationTests().then(() => process.exit(0));
