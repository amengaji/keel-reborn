// keel-reborn/keel-backend/src/models/User.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

/**
 * MARITIME EXPERT NOTE:
 * The User model is the foundation of the TRB. 
 * It handles role-based access to ensure only authorized officers 
 * can sign off on training tasks.
 */
class User extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public role_id!: number; // Links to the Roles table (CADET, CTO, etc.)
  public phone?: string;
  
  // Timestamps for audit trails required by STCW
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles', // Name of the target table
        key: 'id',
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true, // Ensures every change is tracked for the audit timeline
  }
);

export default User;