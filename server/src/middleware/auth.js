const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yêu cầu đăng nhập. Không tìm thấy token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-in-production');

    // Fetch user with Role and Permissions
    const user = await User.findByPk(decoded.id, {
      include: {
        model: Role,
        as: 'role',
        include: {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] } // Exclude junction table attributes
        }
      }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    // Attach minimal, processed user object to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map(p => p.code)
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
    }
    next(error);
  }
};

module.exports = authenticate;
