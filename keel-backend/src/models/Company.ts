//keel-backend/src/models/Company.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Subscription from './Subscription';
import User from './User'; // <--- FIX 1: Import User for type definition

class Company extends Model {
  public id!: number;
  public name!: string;
  public domain?: string;
  public plan_tier!: 'TRIAL' | 'STANDARD' | 'ENTERPRISE';
  public address?: string;
  public contact_email?: string;
  public logo_url?: string;
  public is_active!: boolean;
  
  // Association Type Hints
  public subscription?: Subscription;
  public employees?: User[]; // <--- FIX 2: Declare the association property

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    plan_tier: {
      type: DataTypes.ENUM('TRIAL', 'STANDARD', 'ENTERPRISE'),
      defaultValue: 'TRIAL',
    },
    address: { type: DataTypes.TEXT, allowNull: true },
    contact_email: { type: DataTypes.STRING(100), allowNull: true },
    logo_url: { type: DataTypes.TEXT, allowNull: true },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'companies',
    underscored: true,
    timestamps: true,
  }
);

export default Company;