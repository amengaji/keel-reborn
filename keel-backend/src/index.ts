// keel-reborn/keel-backend/src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { setupAssociations } from './models/associations';

// Load environment variables for home/office flexibility
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * MARITIME EXPERT NOTE:
 * The backend entry point initializes the "Command & Control" center.
 * We must ensure the database is synchronized before the server 
 * starts accepting training data or officer signatures.
 */

// Middleware to handle JSON data (Essential for API requests)
app.use(express.json());

// Initialize Database and Models
const startServer = async () => {
  try {
    // 1. Connect to PostgreSQL
    await connectDB();

    // 2. Setup Model Relationships (User <-> Role)
    setupAssociations();

    // 3. Start Listening for connections
    app.listen(PORT, () => {
      console.log(`✅ SERVER: Keel Digital TRB is active on port ${PORT}`);
      console.log(`🚀 STATUS: Ready for home/office synchronization.`);
    });
  } catch (error) {
    console.error('❌ SERVER: Critical startup failure:', error);
    process.exit(1);
  }
};

// Health Check Route (UX Note: Allows us to verify the server is "Alive" easily)
app.get('/', (req, res) => {
  res.send('Keel Digital TRB API is running smoothly.');
});

// Launch the application
startServer();