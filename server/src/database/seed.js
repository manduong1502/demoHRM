const { sequelize, Role, Permission, User, EmployeeProfile, Attendance, LeaveRequest } = require('../models');

const permissionsList = [
  // RBAC permissions
  { code: 'rbac:view', description: 'View roles and permissions', module: 'rbac' },
  { code: 'rbac:write', description: 'Manage roles, permissions, and user role assignments', module: 'rbac' },

  // Employee Profile permissions
  { code: 'employee:view', description: 'View employee profiles', module: 'employee' },
  { code: 'employee:create', description: 'Create new employee profiles', module: 'employee' },
  { code: 'employee:edit', description: 'Modify employee profiles', module: 'employee' },
  { code: 'employee:delete', description: 'Delete employee profiles', module: 'employee' },

  // Attendance & Leave permissions
  { code: 'attendance:view', description: 'View timesheets for all employees', module: 'attendance' },
  { code: 'attendance:view_own', description: 'View own timesheet', module: 'attendance' },
  { code: 'attendance:check', description: 'Check-in and check-out', module: 'attendance' },
  { code: 'leave:request', description: 'Submit leave or OT requests', module: 'attendance' },
  { code: 'leave:view', description: 'View leave and OT requests of all employees', module: 'attendance' },
  { code: 'leave:view_own', description: 'View own leave and OT requests', module: 'attendance' },
  { code: 'leave:approve', description: 'Approve or reject leave and OT requests', module: 'attendance' }
];

const seed = async () => {
  try {
    console.log('Starting Database sync and seeding...');

    // Force sync the database to re-create tables cleanly
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // 1. Insert permissions
    const createdPermissions = {};
    for (const p of permissionsList) {
      const createdPerm = await Permission.create(p);
      createdPermissions[p.code] = createdPerm.id;
    }
    console.log(`Seeded ${Object.keys(createdPermissions).length} permissions.`);

    // 2. Create Roles
    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Superuser với toàn quyền hệ thống'
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Quản lý hồ sơ nhân viên và phê duyệt đơn từ nghỉ phép'
    });

    const lineManagerRole = await Role.create({
      name: 'Line Manager',
      description: 'Quản lý trực tiếp phòng ban, phê duyệt đơn từ nội bộ'
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Nhân viên chính thức, thực hiện chấm công và gửi đơn từ'
    });

    console.log('Seeded roles: Admin, HR Manager, Line Manager, Employee.');

    // 3. Associate Permissions to Roles
    const allPermissionIds = Object.values(createdPermissions);
    await adminRole.setPermissions(allPermissionIds);

    const hrPermissionCodes = [
      'employee:view', 'employee:create', 'employee:edit', 'employee:delete',
      'attendance:view', 'attendance:view_own', 'attendance:check',
      'leave:request', 'leave:view', 'leave:view_own', 'leave:approve'
    ];
    const hrPermissionIds = hrPermissionCodes.map(code => createdPermissions[code]);
    await hrRole.setPermissions(hrPermissionIds);

    const lmPermissionCodes = [
      'employee:view',
      'attendance:view_own', 'attendance:check',
      'leave:request', 'leave:view', 'leave:view_own', 'leave:approve'
    ];
    const lmPermissionIds = lmPermissionCodes.map(code => createdPermissions[code]);
    await lineManagerRole.setPermissions(lmPermissionIds);

    const empPermissionCodes = [
      'attendance:view_own', 'attendance:check',
      'leave:request', 'leave:view_own'
    ];
    const empPermissionIds = empPermissionCodes.map(code => createdPermissions[code]);
    await employeeRole.setPermissions(empPermissionIds);

    console.log('Assigned permissions to roles successfully.');

    // 4. Create default accounts
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@hrm.com',
      passwordHash: 'admin123',
      roleId: adminRole.id,
      status: 'active'
    });

    const hrUser = await User.create({
      username: 'hruser',
      email: 'hr@hrm.com',
      passwordHash: 'hr123',
      roleId: hrRole.id,
      status: 'active'
    });

    const managerUser = await User.create({
      username: 'manageruser',
      email: 'manager@hrm.com',
      passwordHash: 'manager123',
      roleId: lineManagerRole.id,
      status: 'active'
    });

    const empUser = await User.create({
      username: 'empuser',
      email: 'emp@hrm.com',
      passwordHash: 'emp123',
      roleId: employeeRole.id,
      status: 'active'
    });

    console.log('Seeded default user accounts.');

    // 5. Create Employee Profiles for default accounts
    const adminProfile = await EmployeeProfile.create({
      userId: adminUser.id,
      fullName: 'Nguyễn Văn Admin',
      dob: '1988-03-24',
      identityCode: '001088019283',
      email: 'admin@hrm.com',
      phone: '0912345678',
      address: 'Hoàn Kiếm, Hà Nội',
      department: 'Hành chính - Nhân sự',
      position: 'Giám đốc Hệ thống',
      contractType: 'Full-time',
      status: 'working',
      probationDate: '2026-01-01',
      officialDate: '2026-03-01'
    });

    const hrProfile = await EmployeeProfile.create({
      userId: hrUser.id,
      fullName: 'Trần Thị Nhân Sự',
      dob: '1992-10-12',
      identityCode: '001092018273',
      email: 'hr@hrm.com',
      phone: '0987654321',
      address: 'Cầu Giấy, Hà Nội',
      department: 'Hành chính - Nhân sự',
      position: 'Trưởng phòng Nhân sự',
      contractType: 'Full-time',
      status: 'working',
      probationDate: '2026-01-01',
      officialDate: '2026-03-01'
    });

    const managerProfile = await EmployeeProfile.create({
      userId: managerUser.id,
      fullName: 'Lê Văn Quản Lý',
      dob: '1990-05-18',
      identityCode: '001090017263',
      email: 'manager@hrm.com',
      phone: '0977665544',
      address: 'Thanh Xuân, Hà Nội',
      department: 'Kỹ thuật & Công nghệ',
      position: 'Trưởng phòng Kỹ thuật',
      contractType: 'Full-time',
      status: 'working',
      probationDate: '2026-01-01',
      officialDate: '2026-03-01'
    });

    const empProfile = await EmployeeProfile.create({
      userId: empUser.id,
      fullName: 'Nguyễn Văn Nhân Viên',
      dob: '1996-08-08',
      identityCode: '001096016253',
      email: 'emp@hrm.com',
      phone: '0966554433',
      address: 'Đống Đa, Hà Nội',
      department: 'Kỹ thuật & Công nghệ',
      position: 'Lập trình viên',
      contractType: 'Full-time',
      status: 'working',
      probationDate: '2026-05-01',
      officialDate: '2026-07-01'
    });

    // 6. Create extra mock Employee Profiles
    const mockProfilesData = [
      {
        fullName: 'Phạm Minh Hoàng',
        dob: '1997-12-05',
        identityCode: '001097015243',
        email: 'hoang.pm@hrm.com',
        phone: '0955443322',
        address: 'Hai Bà Trưng, Hà Nội',
        department: 'Kỹ thuật & Công nghệ',
        position: 'Lập trình viên Backend',
        contractType: 'Full-time',
        status: 'working',
        probationDate: '2026-02-15',
        officialDate: '2026-04-15'
      },
      {
        fullName: 'Nguyễn Thùy Linh',
        dob: '1999-04-15',
        identityCode: '001099014233',
        email: 'linh.nt@hrm.com',
        phone: '0944332211',
        address: 'Tây Hồ, Hà Nội',
        department: 'Hành chính - Nhân sự',
        position: 'Chuyên viên Tuyển dụng',
        contractType: 'Full-time',
        status: 'working',
        probationDate: '2026-03-01',
        officialDate: '2026-05-01'
      },
      {
        fullName: 'Trần Bích Phương',
        dob: '1994-07-22',
        identityCode: '001094013223',
        email: 'phuong.tb@hrm.com',
        phone: '0933221100',
        address: 'Ba Đình, Hà Nội',
        department: 'Tài chính - Kế toán',
        position: 'Kế toán viên',
        contractType: 'Full-time',
        status: 'working',
        probationDate: '2026-01-15',
        officialDate: '2026-03-15'
      },
      {
        fullName: 'Phan Anh Tuấn',
        dob: '1995-11-30',
        identityCode: '001095012213',
        email: 'tuan.pa@hrm.com',
        phone: '0922110099',
        address: 'Hà Đông, Hà Nội',
        department: 'Kinh doanh & Marketing',
        position: 'Chuyên viên Marketing',
        contractType: 'Full-time',
        status: 'working',
        probationDate: '2026-02-01',
        officialDate: '2026-04-01'
      },
      {
        fullName: 'Vũ Hoàng Nam',
        dob: '1998-09-14',
        identityCode: '001098011203',
        email: 'nam.vh@hrm.com',
        phone: '0911009988',
        address: 'Long Biên, Hà Nội',
        department: 'Kỹ thuật & Công nghệ',
        position: 'Lập trình viên React',
        contractType: 'Probation',
        status: 'probation',
        probationDate: '2026-05-15',
        officialDate: null
      },
      {
        fullName: 'Đặng Minh Trí',
        dob: '1996-01-20',
        identityCode: '001096010193',
        email: 'tri.dm@hrm.com',
        phone: '0900998877',
        address: 'Thanh Trì, Hà Nội',
        department: 'Kỹ thuật & Công nghệ',
        position: 'Tester',
        contractType: 'Internship',
        status: 'probation',
        probationDate: '2026-06-01',
        officialDate: null
      },
      {
        fullName: 'Lê Hà Vy',
        dob: '2000-06-18',
        identityCode: '001200009183',
        email: 'vy.lh@hrm.com',
        phone: '0988776655',
        address: 'Nam Từ Liêm, Hà Nội',
        department: 'Hành chính - Nhân sự',
        position: 'Thực tập sinh C&B',
        contractType: 'Internship',
        status: 'probation',
        probationDate: '2026-06-08',
        officialDate: null
      },
      {
        fullName: 'Bùi Quốc Huy',
        dob: '1993-02-28',
        identityCode: '001093008173',
        email: 'huy.bq@hrm.com',
        phone: '0977889900',
        address: 'Bắc Từ Liêm, Hà Nội',
        department: 'Kinh doanh & Marketing',
        position: 'Nhân viên Sales',
        contractType: 'Full-time',
        status: 'resigned',
        probationDate: '2026-01-01',
        officialDate: '2026-03-01'
      }
    ];

    const mockProfiles = [
      adminProfile,
      hrProfile,
      managerProfile,
      empProfile
    ];

    for (const data of mockProfilesData) {
      const p = await EmployeeProfile.create(data);
      mockProfiles.push(p);
    }
    console.log(`Seeded ${mockProfiles.length} employee profiles.`);

    // 7. Generate attendance logs from June 1st to June 19th, 2026
    const startDate = new Date('2026-06-01');
    const endDate = new Date('2026-06-19');
    let attendanceCount = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const dateStr = d.toISOString().split('T')[0];

      for (const emp of mockProfiles) {
        // Skip if employee has not started yet
        if (emp.probationDate && dateStr < emp.probationDate) continue;
        // Skip if employee has resigned
        if (emp.status === 'resigned') continue;

        const rand = Math.random();

        if (rand < 0.05) {
          // Leave day simulation
          const leaveStatus = Math.random() < 0.7 ? 'leave_paid' : 'leave_unpaid';
          await Attendance.create({
            employeeId: emp.id,
            date: dateStr,
            status: leaveStatus,
            notes: leaveStatus === 'leave_paid' ? 'Nghỉ phép năm có lương' : 'Nghỉ phép không lương'
          });
          attendanceCount++;
        } else if (rand < 0.92) {
          // Standard check-in / check-out
          // Late simulation (12% chance, check-in > 08:30)
          const isLate = Math.random() < 0.12;
          const checkInHour = isLate ? '08' : '07';
          const checkInMin = isLate 
            ? String(Math.floor(Math.random() * 25) + 31).padStart(2, '0') // 08:31 - 08:55
            : String(Math.floor(Math.random() * 45) + 15).padStart(2, '0'); // 07:15 - 07:59
          const checkInSec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          const checkInTime = `${checkInHour}:${checkInMin}:${checkInSec}`;

          // Early check-out simulation (5% chance, check-out < 17:30)
          const isEarly = Math.random() < 0.05;
          const checkOutHour = isEarly ? '17' : (Math.random() < 0.3 ? '18' : '17');
          const checkOutMin = isEarly
            ? String(Math.floor(Math.random() * 25)).padStart(2, '0') // 17:00 - 17:24
            : (checkOutHour === '18' 
               ? String(Math.floor(Math.random() * 30)).padStart(2, '0') // 18:00 - 18:29
               : String(Math.floor(Math.random() * 30) + 30).padStart(2, '0')); // 17:30 - 17:59
          const checkOutSec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          const checkOutTime = `${checkOutHour}:${checkOutMin}:${checkOutSec}`;

          let attStatus = 'present';
          if (isLate) {
            attStatus = 'late';
          } else if (isEarly) {
            attStatus = 'early';
          }

          // OT simulation (8% chance)
          const hasOT = Math.random() < 0.08;
          const otHours = hasOT ? (Math.random() < 0.5 ? 1.5 : 2.0) : 0.0;

          await Attendance.create({
            employeeId: emp.id,
            date: dateStr,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            status: attStatus,
            otHours,
            notes: hasOT ? 'Tăng ca hoàn thành task dự án' : ''
          });
          attendanceCount++;
        }
      }
    }
    console.log(`Seeded ${attendanceCount} attendance logs.`);

    // 8. Generate Leave & OT Requests
    const leaveRequestsData = [
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Nguyễn Văn Nhân Viên').id,
        requestType: 'leave_paid',
        startDate: '2026-06-22T08:00:00.000Z',
        endDate: '2026-06-24T17:30:00.000Z',
        duration: 3.0,
        reason: 'Nghỉ mát gia đình tại Cát Bà',
        status: 'pending'
      },
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Phạm Minh Hoàng').id,
        requestType: 'leave_paid',
        startDate: '2026-06-25T08:00:00.000Z',
        endDate: '2026-06-25T17:30:00.000Z',
        duration: 1.0,
        reason: 'Giải quyết việc riêng cá nhân',
        status: 'pending'
      },
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Nguyễn Thùy Linh').id,
        requestType: 'ot',
        startDate: '2026-06-18T18:00:00.000Z',
        endDate: '2026-06-18T20:30:00.000Z',
        duration: 2.5,
        reason: 'Hỗ trợ phỏng vấn ứng viên ngoài giờ',
        status: 'approved',
        approvedBy: hrUser.id,
        approvedAt: new Date(),
        notes: 'Đã duyệt tăng ca hỗ trợ phòng tuyển dụng.'
      },
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Phan Anh Tuấn').id,
        requestType: 'leave_unpaid',
        startDate: '2026-06-15T08:00:00.000Z',
        endDate: '2026-06-16T17:30:00.000Z',
        duration: 2.0,
        reason: 'Về quê có đám cưới họ hàng',
        status: 'approved',
        approvedBy: hrUser.id,
        approvedAt: new Date(),
        notes: 'Đã duyệt phép không lương.'
      },
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Vũ Hoàng Nam').id,
        requestType: 'leave_paid',
        startDate: '2026-06-10T08:00:00.000Z',
        endDate: '2026-06-10T12:00:00.000Z',
        duration: 0.5,
        reason: 'Đi khám sức khỏe định kỳ',
        status: 'approved',
        approvedBy: managerUser.id,
        approvedAt: new Date(),
        notes: 'Duyệt nghỉ nửa ngày khám sức khỏe.'
      },
      {
        employeeId: mockProfiles.find(p => p.fullName === 'Trần Bích Phương').id,
        requestType: 'leave_paid',
        startDate: '2026-06-29T08:00:00.000Z',
        endDate: '2026-06-30T17:30:00.000Z',
        duration: 2.0,
        reason: 'Đi làm răng thẩm mỹ',
        status: 'rejected',
        approvedBy: hrUser.id,
        approvedAt: new Date(),
        notes: 'Cuối tháng phòng Kế toán quyết toán thuế, đề nghị dời sang tuần sau.'
      }
    ];

    for (const req of leaveRequestsData) {
      await LeaveRequest.create(req);
    }
    console.log(`Seeded ${leaveRequestsData.length} leave requests.`);
    console.log('Seeding process completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if executed directly
if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = seed;
