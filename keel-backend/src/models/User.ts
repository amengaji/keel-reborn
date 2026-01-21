//keel-backend/src/models/User.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';
import Company from './Company'; // <--- Import Company

class User extends Model {
  public id!: number;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public password_hash!: string;
  public role_id!: number;
  public company_id!: number;
  public rank!: string | null;
  public status!: string;
  public nationality!: string | null;
  public avatar_url!: string | null; // <--- Added TS Property
  
  // Professional / Documents
  public indos_number!: string | null;
  public sid_number!: string | null;
  public coc_number!: string | null;
  public seaman_book_number!: string | null;
  
  // Contact & Personal
  public phone!: string | null;
  public dob!: Date | null;
  public gender!: string | null;
  public blood_group!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public pincode!: string | null;

  // Passport Data
  public passport_number!: string | null;
  public passport_issue_date!: Date | null;
  public passport_expiry_date!: Date | null;
  public passport_place!: string | null;

  // CDC Data
  public cdc_number!: string | null;
  public cdc_country!: string | null;
  public cdc_issue_date!: Date | null;
  public cdc_expiry_date!: Date | null;

  // Kin Data
  public kin_name!: string | null;
  public kin_relation!: string | null;
  public kin_mobile!: string | null;
  public kin_email!: string | null;

  // Settings
  public mfa_enabled!: boolean;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations (TypeScript Types)
  public readonly role?: Role;
  public readonly company?: Company; // <--- Added TS Property
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Super Admin has no company
      references: { model: 'companies', key: 'id' }
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Onboard', 'Ready', 'Leave', 'Training'),
      defaultValue: 'Ready',
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar_url: { // <--- Added Database Column
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- PROFESSIONAL ---
    indos_number: { type: DataTypes.STRING, allowNull: true },
    sid_number: { type: DataTypes.STRING, allowNull: true },
    coc_number: { type: DataTypes.STRING, allowNull: true },
    seaman_book_number: { type: DataTypes.STRING, allowNull: true },
    
    // --- PERSONAL ---
    phone: { type: DataTypes.STRING, allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    blood_group: { type: DataTypes.STRING, allowNull: true },
    
    // --- ADDRESS ---
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },

    // --- PASSPORT ---
    passport_number: { type: DataTypes.STRING, allowNull: true },
    passport_issue_date: { type: DataTypes.DATEONLY, allowNull: true },
    passport_expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
    passport_place: { type: DataTypes.STRING, allowNull: true },

    // --- CDC ---
    cdc_number: { type: DataTypes.STRING, allowNull: true },
    cdc_country: { type: DataTypes.STRING, allowNull: true },
    cdc_issue_date: { type: DataTypes.DATEONLY, allowNull: true },
    cdc_expiry_date: { type: DataTypes.DATEONLY, allowNull: true },

    // --- NEXT OF KIN ---
    kin_name: { type: DataTypes.STRING, allowNull: true },
    kin_relation: { type: DataTypes.STRING, allowNull: true },
    kin_mobile: { type: DataTypes.STRING, allowNull: true },
    kin_email: { type: DataTypes.STRING, allowNull: true },

    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
  }
);

export default User;