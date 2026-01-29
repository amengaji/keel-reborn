//keel-backend/src/models/associations.ts

import User from './User';
import Role from './Role';
import Vessel from './Vessel';
import Task from './Task';
import Assignment from './Assignment';
import TraineeAssignment from "./TraineeAssignment";
import Company from './Company';
import Subscription from './Subscription';
import MonthlyReview from './MonthlyReview'; // ✅ NEW IMPORT

export const setupAssociations = () => {
  // --- 1. AUTH & ROLES ---
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

  // --- 2. MULTI-TENANCY (Company) ---
  Company.hasMany(User, { foreignKey: 'company_id', as: 'employees' });
  User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  Company.hasMany(Vessel, { foreignKey: 'company_id', as: 'vessels' });
  Vessel.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  Company.hasOne(Subscription, { foreignKey: 'company_id', as: 'subscription' });
  Subscription.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  // --- 3. VESSEL MANNING (Crew & Assignments) ---
  Vessel.hasMany(User, { foreignKey: 'vessel_id', as: 'crew' });
  User.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  TraineeAssignment.belongsTo(User, { foreignKey: 'trainee_id', as: 'trainee' });
  TraineeAssignment.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  User.hasMany(TraineeAssignment, { foreignKey: 'trainee_id', as: 'assignments' });

  // --- 4. DIGITAL TRB (Tasks & Progress) ---
  User.hasMany(Assignment, { foreignKey: 'user_id', as: 'taskAssignments' });
  Assignment.belongsTo(User, { foreignKey: 'user_id', as: 'cadet' });

  Task.hasMany(Assignment, { foreignKey: 'task_id', as: 'taskSignOffs' });
  Assignment.belongsTo(Task, { foreignKey: 'task_id', as: 'template' });

  User.hasMany(Assignment, { foreignKey: 'officer_id', as: 'officerSignOffs' });
  Assignment.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

  // --- 5. MONTHLY REVIEWS (NEW) ---
  // A Cadet has many reviews
  User.hasMany(MonthlyReview, { foreignKey: 'user_id', as: 'reviewsReceived' });
  MonthlyReview.belongsTo(User, { foreignKey: 'user_id', as: 'cadet' });

  // A Master/CTO has many reviews signed
  User.hasMany(MonthlyReview, { foreignKey: 'reviewer_id', as: 'reviewsSigned' });
  MonthlyReview.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });

  // Reviews are linked to a specific vessel voyage
  Vessel.hasMany(MonthlyReview, { foreignKey: 'vessel_id', as: 'vesselReviews' });
  MonthlyReview.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  console.log('✅ MODELS: Associations synchronized with explicit aliases (Including Monthly Reviews).');
};

export default setupAssociations;