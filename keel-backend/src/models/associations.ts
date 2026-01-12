// keel-reborn/keel-backend/src/models/associations.ts

import User from './User';
import Role from './Role';

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

  console.log('✅ MODELS: Associations (User <-> Role) have been synchronized.');
};

export default setupAssociations;