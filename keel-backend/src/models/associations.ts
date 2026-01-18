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


/**
 * MARITIME EXPERT NOTE:
 * This file defines the relationships between our data entities.
 * Just like a crew manifest links a person to their rank,
 * these associations link our Users to their functional Roles.
 */

export const setupAssociations = () => {
  // Relationship: Role <-> User
  // One Role (e.g., 'CADET') can belong to many Users.
  Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'users',
  });

  // Each User belongs to exactly one Role.
  User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role',
  });

  // Vessel <-> User (Crew)
  Vessel.hasMany(User, { foreignKey: 'vessel_id', as: 'crew' });
  User.belongsTo(Vessel, { foreignKey: 'vessel_id', as: 'vessel' });

  // A Cadet has many task assignments
  User.hasMany(Assignment, { foreignKey: 'user_id' });
  Assignment.belongsTo(User, { as: 'cadet', foreignKey: 'user_id' });

  // A Task can be assigned to many users
  Task.hasMany(Assignment, { foreignKey: 'task_id' });
  Assignment.belongsTo(Task, { foreignKey: 'task_id' });

  // An Officer signs off many assignments
  User.hasMany(Assignment, { foreignKey: 'officer_id' });
  Assignment.belongsTo(User, { as: 'officer', foreignKey: 'officer_id' });

  console.log('✅ MODELS: Associations (User <-> Role) have been synchronized.');
};

export default setupAssociations;