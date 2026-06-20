const express = require('express');
const router = express.Router();
const rbacController = require('./rbac.controller');
const authenticate = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

// Apply authentication to all RBAC routes
router.use(authenticate);

// Role CRUD & permissions list
router.get('/roles', checkPermission('rbac:view'), rbacController.getRoles);
router.post('/roles', checkPermission('rbac:write'), rbacController.createRole);
router.put('/roles/:id', checkPermission('rbac:write'), rbacController.updateRole);
router.delete('/roles/:id', checkPermission('rbac:write'), rbacController.deleteRole);

router.get('/permissions', checkPermission('rbac:view'), rbacController.getPermissions);

// Assign permissions to a role
router.post('/roles/:id/permissions', checkPermission('rbac:write'), rbacController.assignPermissions);

// Assign role to a user
router.post('/users/:id/role', checkPermission('rbac:write'), rbacController.assignUserRole);

module.exports = router;
