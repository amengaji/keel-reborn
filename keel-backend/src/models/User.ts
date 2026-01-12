// keel-reborn/keel-backend/src/models/User.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role'; // Import Role to define the relationship type

/**
 * MARITIME EXPERT NOTE:
 * The User model is the foundation of the TRB. 
 * We have added the 'role' property explicitly so the Auth Controller
 * can identify the Officer's rank during login.
 */
class User extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public role_id!: number;
  public phone?: string;
  
  // UX Note: This allows TypeScript to "see" the joined role data
  public role?: Role; 

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
      validate: { isEmail: true },
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
        model: 'roles',
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
    timestamps: true,
  }
);

export default User;