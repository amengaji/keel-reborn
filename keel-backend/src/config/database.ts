// keel-reborn/keel-backend/src/config/database.ts

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load the settings from the .env file we just created
dotenv.config();

/**
 * MARITIME EXPERT NOTE:
 * In a professional TRB system, database reliability is mission-critical.
 * We use a connection pool to handle multiple simultaneous requests 
 * from various officers on the ship's network.
 */

const sequelize = new Sequelize(
  process.env.DB_NAME || 'keel_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false, // Set to true if you want to see the "Maritime Logs" (SQL) in your terminal
    pool: {
      max: 5,       // Maximum active connections
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,   // Automatically tracks when records are created/updated
      underscored: true,  // Keeps database naming consistent (e.g., user_id)
    }
  }
);

/**
 * CONNECTIVITY TEST
 * This ensures the backend can successfully reach the PostgreSQL server.
 * Success/Failure is logged to the terminal immediately.
 */
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DATABASE: Maritime Training Record connection established.');
  } catch (error) {
    console.error('❌ DATABASE: Connection failed. Check your .env file.', error);
    process.exit(1); // Stop the server if the database is unreachable
  }
};

export default sequelize;