// keel-reborn/keel-backend/src/models/associations.ts

import User from './User';
import Role from './Role';
import Vessel from './Vessel';
import Task from './Task';
import Assignment from './Assignment';
import TraineeAssignment from "./TraineeAssignment";

// Setup Trainee-Specific Relationships
TraineeAssignment.belongsTo(User, {
  foreignKey: "trainee_id",
  as: "trainee",
});

// MARITIME NOTE: This links an assignment record to a specific Vessel
TraineeAssignment.belongsTo(Vessel, {
  foreignKey: "vessel_id",
});

/**
 * MARITIME EXPERT NOTE:
 * This file defines the relationships between our data entities.
 * Just like a crew manifest links a person to their rank,
 * these associations link our Users to their functional Roles and Vessels.
 */
export const setupAssociations = () => {
  // Relationship: Role <-> User
  Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'users',
  });

  User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role',
  });

  // Vessel <-> User (Direct Link)
  Vessel.hasMany(User, { foreignKey: 'vessel_id', as: 'crew' });
  User.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  // FIXED: Link User to Assignments to fetch Vessel Name on Trainees Page
  User.hasMany(TraineeAssignment, { foreignKey: 'trainee_id', as: 'assignments' });

  // A Cadet has many individual task sign-offs
  User.hasMany(Assignment, { foreignKey: 'user_id' });
  Assignment.belongsTo(User, { as: 'cadet', foreignKey: 'user_id' });

  // A Task can be assigned to many users
  Task.hasMany(Assignment, { foreignKey: 'task_id' });
  Assignment.belongsTo(Task, { foreignKey: 'task_id' });

  // An Officer signs off many assignments
  User.hasMany(Assignment, { foreignKey: 'officer_id' });
  Assignment.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });

  console.log('✅ MODELS: Associations (User <-> Role <-> Vessel) have been synchronized.');
};

export default setupAssociations;