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
import analyticsRoutes from './routes/analytics.routes';
import companyRoutes from './routes/company.routes';
import importRoutes from './routes/import.routes'; // <--- NEW IMPORT

// Models
import Task from './models/Task';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// --- MIDDLEWARE ---
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// --- 1. PUBLIC ROUTES ---
app.use('/api/auth', authRoutes);

// --- 2. GLOBAL SECURITY BARRIER ---
app.use(authenticate); 
app.use(validateSubscription);

// --- 3. PROTECTED ROUTES ---
app.use('/api/vessels', vesselRoutes);
app.use('/api/trainees', cadetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use("/api/trainee-assignments", traineeAssignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/import', importRoutes); // <--- NEW ROUTE REGISTERED

const startServer = async () => {
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