// keel-reborn/keel-backend/src/models/associations.ts

import User from './User';
import Role from './Role';
import Vessel from './Vessel';
import Task from './Task';
import Assignment from './Assignment';
import TraineeAssignment from "./TraineeAssignment";

TraineeAssignment.belongsTo(User, {
  foreignKey: "trainee_id",
  as: "trainee",
});

TraineeAssignment.belongsTo(Vessel, {
  foreignKey: "vessel_id",
});

export const setupAssociations = () => {
  // Role & User
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

  // Vessel & Crew
  Vessel.hasMany(User, { foreignKey: 'vessel_id', as: 'crew' });
  User.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  // Vessel Assignments (For Sea Time/Current Vessel)
  User.hasMany(TraineeAssignment, { foreignKey: 'trainee_id', as: 'assignments' });

  // --- FIXED SECTION: TRB TASK PROGRESS ---
  // We explicitly name this 'taskAssignments' to avoid the EagerLoadingError
  User.hasMany(Assignment, { foreignKey: 'user_id', as: 'taskAssignments' });
  Assignment.belongsTo(User, { foreignKey: 'user_id', as: 'cadet' });

  // Task & Assignment
  Task.hasMany(Assignment, { foreignKey: 'task_id', as: 'taskSignOffs' });
  Assignment.belongsTo(Task, { foreignKey: 'task_id', as: 'taskDetail' });

  // Officer & Assignment
  User.hasMany(Assignment, { foreignKey: 'officer_id', as: 'officerSignOffs' });
  Assignment.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

  console.log('✅ MODELS: Associations synchronized with explicit aliases.');
};

export default setupAssociations;