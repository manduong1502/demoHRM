const jwt = require('jsonwebtoken');
const { User, Role } = require('../../models');

const register = async (req, res, next) => {
  try {
    const { username, email, password, roleName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tài khoản, email và mật khẩu không được để trống.' });
    }

    // Determine Role ID
    let roleId;
    if (roleName) {
      const role = await Role.findOne({ where: { name: roleName } });
      if (!role) {
        return res.status(400).json({ message: `Vai trò ${roleName} không tồn tại.` });
      }
      roleId = role.id;
    } else {
      // Default to Employee role
      const empRole = await Role.findOne({ where: { name: 'Employee' } });
      if (!empRole) {
        return res.status(500).json({ message: 'Vai trò nhân viên mặc định chưa được cấu hình.' });
      }
      roleId = empRole.id;
    }

    const newUser = await User.create({
      username,
      email,
      passwordHash: password, // hooks will hash it
      roleId
    });

    // Exclude passwordHash from response
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roleId: newUser.roleId,
      status: newUser.status,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'Đăng ký tài khoản người dùng thành công.',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu không được để trống.' });
    }

    const user = await User.findOne({
      where: { username },
      include: { model: Role, as: 'role' }
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'super-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
