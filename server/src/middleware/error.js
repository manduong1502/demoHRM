const errorMiddleware = (err, req, res, next) => {
  console.error('Error stack:', err);

  const status = err.status || 500;
  const message = err.message || 'Lỗi hệ thống nội bộ.';

  // Customize Sequelize Validation and Unique Constraint Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Lỗi dữ liệu đầu vào không hợp lệ.',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  res.status(status).json({
    message,
    // Include stack trace only in development environment
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorMiddleware;
