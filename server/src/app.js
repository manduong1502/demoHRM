const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./modules/auth/auth.routes');
const rbacRoutes = require('./modules/rbac/rbac.routes');
const employeeRoutes = require('./modules/employee/employee.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const salaryRoutes = require('./modules/salary/salary.routes');
const kpiRoutes = require('./modules/kpi/kpi.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const errorMiddleware = require('./middleware/error');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (React Vite build or dev static fallback)
const fs = require('fs');
const distPath = path.join(__dirname, '../../client/dist');
const cpanelPath = path.join(__dirname, '../..');
const fallbackPath = path.join(__dirname, '../../client');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else if (fs.existsSync(path.join(cpanelPath, 'index.html')) && !fs.existsSync(path.join(cpanelPath, 'package.json'))) {
  app.use(express.static(cpanelPath));
} else {
  app.use(express.static(fallbackPath));
}


// Default welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the lightweight HRM System API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/reports', reportsRoutes);


// Error Handling
app.use(errorMiddleware);

module.exports = app;
