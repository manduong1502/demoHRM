const { Role, Permission, User } = require('../../models');

// Roles
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      include: {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên vai trò không được để trống.' });
    }

    const role = await Role.create({ name, description });
    res.status(201).json({ message: 'Tạo vai trò thành công.', role });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Vai trò không tồn tại.' });
    }

    await role.update({ name, description });
    res.json({ message: 'Cập nhật vai trò thành công.', role });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Vai trò không tồn tại.' });
    }

    // Check if role is assigned to users
    const usersWithRole = await User.count({ where: { roleId: id } });
    if (usersWithRole > 0) {
      return res.status(400).json({
        message: `Không thể xóa vai trò. Vai trò này hiện đang được gán cho ${usersWithRole} tài khoản người dùng.`
      });
    }

    await role.destroy();
    res.json({ message: 'Xóa vai trò thành công.' });
  } catch (error) {
    next(error);
  }
};

// Permissions
const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

// Role-Permission Assignment
const assignPermissions = async (req, res, next) => {
  try {
    const { id } = req.params; // roleId
    const { permissionIds } = req.body; // array of permission IDs

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds phải là một danh sách (mảng).' });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Vai trò không tồn tại.' });
    }

    // Verify all permissionIds exist
    const count = await Permission.count({
      where: { id: permissionIds }
    });

    if (count !== permissionIds.length) {
      return res.status(400).json({ message: 'Một hoặc nhiều quyền truy cập (permissionIds) không hợp lệ.' });
    }

    // Set permissions association
    await role.setPermissions(permissionIds);

    const updatedRole = await Role.findByPk(id, {
      include: {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    });

    res.json({
      message: 'Gán quyền thành công.',
      role: updatedRole
    });
  } catch (error) {
    next(error);
  }
};

// User-Role Assignment
const assignUserRole = async (req, res, next) => {
  try {
    const { id } = req.params; // userId
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: 'roleId không được để trống.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Tài khoản người dùng không tồn tại.' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Vai trò không tồn tại.' });
    }

    await user.update({ roleId });

    res.json({
      message: 'Cập nhật vai trò tài khoản thành công.',
      user: {
        id: user.id,
        username: user.username,
        roleId: user.roleId,
        role: role.name
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  assignPermissions,
  assignUserRole
};
