const sequelize = require('../config/database');
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const EmployeeProfile = require('./employeeProfile');
const Attendance = require('./attendance');
const LeaveRequest = require('./leaveRequest');

// --- Associations ---

// User <-> Role (Many-to-One)
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// Role <-> Permission (Many-to-Many via RolePermissions join table)
Role.belongsToMany(Permission, {
  through: 'RolePermissions',
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: 'RolePermissions',
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// User <-> EmployeeProfile (One-to-One, optional)
User.hasOne(EmployeeProfile, { foreignKey: 'userId', as: 'employeeProfile' });
EmployeeProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// EmployeeProfile <-> Attendance (One-to-Many)
EmployeeProfile.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(EmployeeProfile, { foreignKey: 'employeeId', as: 'employee' });

// EmployeeProfile <-> LeaveRequest (One-to-Many)
EmployeeProfile.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(EmployeeProfile, { foreignKey: 'employeeId', as: 'employee' });

// User <-> LeaveRequest (One-to-Many for approvals)
LeaveRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
User.hasMany(LeaveRequest, { foreignKey: 'approvedBy', as: 'approvedRequests' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  EmployeeProfile,
  Attendance,
  LeaveRequest
};
