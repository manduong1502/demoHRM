const app = require('./app');
const { sequelize, Role } = require('./models');
const seed = require('./database/seed');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database models (creates tables if they do not exist)
    await sequelize.sync();
    console.log('Database schema synchronized.');

    // Check if seeding is required (if no roles are defined)
    const roleCount = await Role.count();
    if (roleCount === 0) {
      console.log('No roles found in database. Running auto-seeder...');
      await seed();
    } else {
      console.log('Database already has seeded data. Skipping auto-seeding.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
};

startServer();
