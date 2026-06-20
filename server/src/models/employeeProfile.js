const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeeProfile = sequelize.define('EmployeeProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true // One-to-one mapping if associated
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  identityCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contractType: {
    type: DataTypes.STRING,
    allowNull: false // e.g., 'Full-time', 'Part-time', 'Probation', 'Internship'
  },
  probationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  officialDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'probation' // 'working', 'probation', 'resigned'
  }
}, {
  hooks: {
    beforeValidate: async (profile) => {
      // If employeeCode is not provided, generate it
      if (!profile.employeeCode) {
        try {
          const lastEmp = await EmployeeProfile.findOne({
            order: [['id', 'DESC']],
            raw: true
          });
          let nextNum = 1;
          if (lastEmp && lastEmp.employeeCode) {
            const matches = lastEmp.employeeCode.match(/EMP-(\d+)/);
            if (matches && matches[1]) {
              nextNum = parseInt(matches[1], 10) + 1;
            }
          }
          profile.employeeCode = `EMP-${String(nextNum).padStart(4, '0')}`;
        } catch (err) {
          // Fallback in case of query error during testing or db sync
          profile.employeeCode = `EMP-${Date.now()}`;
        }
      }
    }
  }
});

module.exports = EmployeeProfile;
