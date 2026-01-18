// keel-reborn/keel-backend/src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Added for cross-origin communication
import sequelize, { connectDB } from './config/database';
import { setupAssociations } from './models/associations';
import authRoutes from './routes/auth.routes';
import vesselRoutes from './routes/vessel.routes'; 
import cadetRoutes from './routes/cadet.routes'; // Import
import taskRoutes from './routes/task.routes';
import Task from './models/Task';
import assignmentRoutes from './routes/assignment.routes';
import traineeAssignmentRoutes from "./routes/traineeAssignment.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;


// Middleware
// UI/UX Note: We enable CORS so the Vite dev server can reach this API
app.use(cors({
  origin: true, // Your Frontend URL
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/trainees', cadetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use("/api/trainee-assignments", traineeAssignmentRoutes);


const startServer = async () => {
  // Inside startServer function in src/index.ts
  await sequelize.sync({ alter: true }); 
  console.log('⚓ DATABASE: Tables recreated successfully.');
  try {
    await connectDB();
    setupAssociations();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ SERVER: Keel Digital TRB active on 0.0.0.0:${PORT}`);
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