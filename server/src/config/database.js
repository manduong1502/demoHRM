const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const storagePath = process.env.DB_STORAGE || './database.sqlite';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.isAbsolute(storagePath) ? storagePath : path.resolve(process.cwd(), storagePath),
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
  }
});

module.exports = sequelize;
