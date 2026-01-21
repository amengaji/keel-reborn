//keel-backend/src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import sequelize, { connectDB } from './config/database';
import { setupAssociations } from './models/associations';

// Middleware Imports
import { authenticate } from './middleware/auth.middleware';
import { validateSubscription } from './middleware/subscription.middleware';

// Route Imports
import authRoutes from './routes/auth.routes';
import vesselRoutes from './routes/vessel.routes'; 
import cadetRoutes from './routes/cadet.routes';
import taskRoutes from './routes/task.routes';
import assignmentRoutes from './routes/assignment.routes';
import traineeAssignmentRoutes from "./routes/traineeAssignment.routes";
import analyticsRoutes from './routes/analytics.routes'; // <--- NEW IMPORT
import companyRoutes from './routes/company.routes'; // <--- NEW IMPORT

// Models (Imported to ensure Sequelize registers them)
import Task from './models/Task';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// --- MIDDLEWARE CONFIGURATION ---
// UI/UX Note: We enable CORS so the Vite dev server can reach this API
app.use(cors({
  origin: true, // Your Frontend URL
  credentials: true
}));

app.use(express.json());

// --- 1. PUBLIC ROUTES (No License Check Required) ---
// Login, Register, and Password Reset must be accessible even if subscription expires
app.use('/api/auth', authRoutes);


// --- 2. GLOBAL SECURITY BARRIER ---
// All routes below this line require:
// A) Valid JWT Token (authenticate)
// B) Active Company Subscription (validateSubscription)
app.use(authenticate); 
app.use(validateSubscription);


// --- 3. PROTECTED ROUTES (Business Logic) ---
app.use('/api/vessels', vesselRoutes);
app.use('/api/trainees', cadetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use("/api/trainee-assignments", traineeAssignmentRoutes);
app.use('/api/analytics', analyticsRoutes); // <--- NEW ROUTE (Super Admin Only)
app.use('/api/companies', companyRoutes); // <--- NEW ROUTE (Super Admin Only)

const startServer = async () => {
  // Database Synchronization
  // Note: { alter: true } updates the schema to match models (adds Subscription table)
  await sequelize.sync({ alter: true }); 
  console.log('⚓ DATABASE: Tables synchronized successfully.');

  try {
    await connectDB();
    setupAssociations();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ SERVER: Keel Digital TRB active on 0.0.0.0:${PORT}`);
      console.log(`🛡️  SECURITY: Global License Enforcement is ACTIVE.`);
    });

  } catch (error) {
    console.error('❌ SERVER: Startup failure:', error);
    process.exit(1);
  }
};

app.get('/', (req, res) => {
  res.send('Keel Digital TRB API is running smoothly.');
});

startServer();