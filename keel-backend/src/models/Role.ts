// keel-reborn/keel-backend/src/models/Role.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

/**
 * MARITIME EXPERT NOTE:
 * The Role model defines the "Command Hierarchy" within the app.
 * It is essential for the verification chain: Cadet -> CTO -> Master -> Shore.
 * Every signature in the digital TRB is validated against these roles.
 */
class Role extends Model {
  public id!: number;
  public name!: string; // e.g., 'CADET', 'CTO', 'MASTER'
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      // UX Note: Role names are always uppercase for consistent UI display
    },
  },
  {
    sequelize,
    tableName: 'roles',
    underscored: true,
    timestamps: true, // Tracks when new roles are added to the system
  }
);

export default Role;