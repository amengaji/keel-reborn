//keel-backend/src/models/associations.ts

import User from './User';
import Role from './Role';
import Vessel from './Vessel';
import Task from './Task';
import Assignment from './Assignment';
import TraineeAssignment from "./TraineeAssignment";
import Company from './Company';
import Subscription from './Subscription';

export const setupAssociations = () => {
  // --- 1. AUTH & ROLES ---
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

  // --- 2. MULTI-TENANCY (Company) ---
  // A Company has employees (Users) and a fleet (Vessels)
  Company.hasMany(User, { foreignKey: 'company_id', as: 'employees' });
  User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  Company.hasMany(Vessel, { foreignKey: 'company_id', as: 'vessels' });
  Vessel.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  // A Company has one Subscription
  Company.hasOne(Subscription, { foreignKey: 'company_id', as: 'subscription' });
  Subscription.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  // --- 3. VESSEL MANNING (Crew & Assignments) ---
  // "Permanent" Crew list (if used)
  Vessel.hasMany(User, { foreignKey: 'vessel_id', as: 'crew' });
  User.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  // *** THE FIX IS HERE ***
  // We explicitly define 'as: vessel' so the Controller can include it.
  TraineeAssignment.belongsTo(User, { foreignKey: 'trainee_id', as: 'trainee' });
  TraineeAssignment.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  // Inverse: A User has many assignments (history of ships)
  User.hasMany(TraineeAssignment, { foreignKey: 'trainee_id', as: 'assignments' });

  // --- 4. DIGITAL TRB (Tasks & Progress) ---
  // Tasks assigned to a Cadet
  User.hasMany(Assignment, { foreignKey: 'user_id', as: 'taskAssignments' });
  Assignment.belongsTo(User, { foreignKey: 'user_id', as: 'cadet' });

  // Task Details (The question/requirement)
  Task.hasMany(Assignment, { foreignKey: 'task_id', as: 'taskSignOffs' });
  Assignment.belongsTo(Task, { foreignKey: 'task_id', as: 'template' }); // Changed to 'template' for clarity, or 'taskDetail'

  // Officer Sign-offs
  User.hasMany(Assignment, { foreignKey: 'officer_id', as: 'officerSignOffs' });
  Assignment.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

  console.log('✅ MODELS: Associations synchronized with explicit aliases.');
};

export default setupAssociations;