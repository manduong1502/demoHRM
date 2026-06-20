const express = require('express');
const multer = require('multer');
const router = express.Router();
const employeeController = require('./employee.controller');
const authenticate = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

const upload = multer({ storage: multer.memoryStorage() });

// Authenticate all employee routes
router.use(authenticate);

// Export before /:id path to prevent routing clashes
router.get('/export', checkPermission('employee:view'), employeeController.exportEmployees);

router.get('/', checkPermission('employee:view'), employeeController.getEmployees);
router.get('/:id', checkPermission('employee:view'), employeeController.getEmployeeDetail);
router.post('/', checkPermission('employee:create'), employeeController.createEmployeeProfile);
router.put('/:id', checkPermission('employee:edit'), employeeController.updateEmployeeProfile);
router.delete('/:id', checkPermission('employee:delete'), employeeController.deleteEmployeeProfile);

router.post('/import', checkPermission('employee:create'), upload.single('file'), employeeController.importEmployees);

module.exports = router;
