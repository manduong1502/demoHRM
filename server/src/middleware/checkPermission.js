/**
 * Middleware to check if the authenticated user has the required permission(s).
 * @param {string|string[]} requiredPermissions - Single permission string or array of permissions.
 */
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Yêu cầu đăng nhập để tiếp tục.' });
    }

    // Admin role bypasses all permission checks (has superuser privileges)
    if (req.user.role === 'Admin') {
      return next();
    }

    const permissionsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    // Check if user has at least one of the required permissions (OR logic)
    // Alternatively, we could enforce AND logic if needed, but OR is more common for route-level guards
    const hasPermission = permissionsToCheck.some(permission =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Truy cập bị từ chối. Bạn không có quyền thực hiện hành động này.'
      });
    }

    next();
  };
};

module.exports = checkPermission;
