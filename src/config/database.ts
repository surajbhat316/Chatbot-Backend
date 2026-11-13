import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'chatapp_db';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDatabase = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection has been established successfully.');
    // Synchronize models with the database
    await sequelize.sync({ alter: true });
    console.log('Sequelize models synchronized successfully.');
    return true;
  } catch (error: any) {
    console.warn(
      'Warning: Could not connect to MySQL database:',
      error.message || error
    );
    console.warn(
      'Ensure MySQL server is running and check your .env database credentials.'
    );
    return false;
  }
};
