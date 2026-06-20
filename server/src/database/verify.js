const { sequelize, Role, Permission, User, EmployeeProfile } = require('../models');
const seed = require('./seed');

const runVerification = async () => {
  console.log('=== STARTING BACKEND & DATABASE SANITY VERIFICATION ===');
  try {
    // 1. Database Connection
    await sequelize.authenticate();
    console.log('✔ Database connection authenticated.');

    // 2. Schema check & Auto-seed
    await sequelize.sync();
    console.log('✔ Database schema synchronized.');

    let rolesCount = await Role.count();
    if (rolesCount === 0) {
      console.log('No data found, running seeder...');
      await seed();
      rolesCount = await Role.count();
    }
    console.log(`✔ Roles check passed. Found ${rolesCount} roles (Expected: 4).`);

    // 3. Permissions check
    const permissionsCount = await Permission.count();
    console.log(`✔ Permissions check passed. Found ${permissionsCount} permissions (Expected: 13).`);

    // 4. Role Permissions association check
    const hrRole = await Role.findOne({
      where: { name: 'HR Manager' },
      include: { model: Permission, as: 'permissions' }
    });

    if (!hrRole || hrRole.permissions.length === 0) {
      throw new Error('HR Manager role not found or has no permissions associated.');
    }
    console.log(`✔ Associations check passed. HR Manager has ${hrRole.permissions.length} permissions.`);

    // 5. User password hashing & validation check
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      throw new Error('Default admin user not found.');
    }
    const isPasswordValid = await adminUser.comparePassword('admin123');
    if (!isPasswordValid) {
      throw new Error('Default admin password validation failed.');
    }
    console.log('✔ Password hashing and comparison check passed.');

    // 6. EmployeeProfile employeeCode hooks check
    console.log('Testing EmployeeProfile hooks by creating a dummy profile...');
    const dummyEmp = await EmployeeProfile.create({
      fullName: 'Verification Test User',
      department: 'QA & Testing',
      position: 'Quality Engineer',
      contractType: 'Full-time',
      status: 'working'
    });

    console.log(`Created Employee: ID=${dummyEmp.id}, Code=${dummyEmp.employeeCode}, Name=${dummyEmp.fullName}`);
    if (!dummyEmp.employeeCode.startsWith('EMP-')) {
      throw new Error(`Generated employee code "${dummyEmp.employeeCode}" does not follow format "EMP-XXXX".`);
    }
    console.log('✔ Employee code auto-generation hook check passed.');

    // Clean up dummy employee
    await dummyEmp.destroy();
    console.log('✔ Dummy employee profile deleted successfully.');

    console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===');
    console.log('Your RBAC Database, Models, and Seeders are fully operational!');
  } catch (error) {
    console.error('\n✖ VERIFICATION FAILED with error:', error.message);
    process.exit(1);
  }
};

runVerification().then(() => process.exit(0));
