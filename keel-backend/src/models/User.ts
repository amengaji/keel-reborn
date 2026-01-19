// keel-backend/src/models/User.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';
import Vessel from './Vessel';

class User extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public role_id!: number;
  public phone?: string;
  
  // --- Professional Details ---
  public indos_number?: string;
  public rank?: string;
  public nationality?: string;
  public status?: 'Ready' | 'Onboard' | 'Leave' | 'Training';
  public vessel_id?: string;
  public sign_on_date?: Date;
  
  // --- NEW: Extended Profile Data ---
  public dob?: Date;
  public gender?: string;
  public blood_group?: string;
  
  // Address
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public pincode?: string;

  // Documents (Passport / CDC / SID)
  public passport_number?: string;
  public passport_issue_date?: Date;
  public passport_expiry_date?: Date;
  public passport_place?: string;

  public cdc_number?: string;
  public cdc_country?: string; // Country of Issue
  public cdc_issue_date?: Date;
  public cdc_expiry_date?: Date;
  
  public sid_number?: string;

  // Next of Kin (Emergency)
  public kin_name?: string;
  public kin_relation?: string;
  public kin_mobile?: string;
  public kin_email?: string;

  // Settings
  public coc_number?: string;
  public seaman_book_number?: string; // Standard Seaman Book if different from CDC
  public mfa_enabled?: boolean;

  public role?: Role; 
  public vessel?: Vessel;

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
      references: { model: 'roles', key: 'id' },
    },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    
    // --- Maritime & Profile ---
    indos_number: { type: DataTypes.STRING(50), allowNull: true },
    rank: { type: DataTypes.STRING(50), allowNull: true },
    nationality: { type: DataTypes.STRING(50), allowNull: true },
    status: {
      type: DataTypes.ENUM('Ready', 'Onboard', 'Leave', 'Training'),
      defaultValue: 'Ready',
    },
    vessel_id: {
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: { model: 'vessels', key: 'id' },
    },
    sign_on_date: { type: DataTypes.DATE, allowNull: true },

    // --- Extended Profile ---
    dob: { type: DataTypes.DATE, allowNull: true },
    gender: { type: DataTypes.STRING(20), allowNull: true },
    blood_group: { type: DataTypes.STRING(10), allowNull: true },

    // Address
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    pincode: { type: DataTypes.STRING(20), allowNull: true },

    // Passport
    passport_number: { type: DataTypes.STRING(50), allowNull: true },
    passport_issue_date: { type: DataTypes.DATE, allowNull: true },
    passport_expiry_date: { type: DataTypes.DATE, allowNull: true },
    passport_place: { type: DataTypes.STRING(100), allowNull: true },

    // CDC
    cdc_number: { type: DataTypes.STRING(50), allowNull: true },
    cdc_country: { type: DataTypes.STRING(100), allowNull: true },
    cdc_issue_date: { type: DataTypes.DATE, allowNull: true },
    cdc_expiry_date: { type: DataTypes.DATE, allowNull: true },

    sid_number: { type: DataTypes.STRING(50), allowNull: true },

    // Next of Kin
    kin_name: { type: DataTypes.STRING(100), allowNull: true },
    kin_relation: { type: DataTypes.STRING(50), allowNull: true },
    kin_mobile: { type: DataTypes.STRING(20), allowNull: true },
    kin_email: { type: DataTypes.STRING(100), allowNull: true },

    // Settings
    coc_number: { type: DataTypes.STRING(50), allowNull: true },
    seaman_book_number: { type: DataTypes.STRING(50), allowNull: true },
    mfa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
  }
);

export default User;