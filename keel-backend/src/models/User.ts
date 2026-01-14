import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';
import Vessel from './Vessel'; // Import Vessel model

class User extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public role_id!: number;
  public phone?: string;
  
  // --- Maritime Fields ---
  public indos_number?: string;
  public rank?: string;
  public nationality?: string;
  public status?: 'Ready' | 'Onboard' | 'Leave' | 'Training';
  public vessel_id?: string; // Links to Vessel table
  public sign_on_date?: Date;
  
  public role?: Role; 
  public vessel?: Vessel; // For including vessel details

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
    // --- New Maritime Columns ---
    indos_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rank: {
      type: DataTypes.STRING(50),
      allowNull: true, // e.g. "Deck Cadet", "Engine Cadet"
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Ready', 'Onboard', 'Leave', 'Training'),
      defaultValue: 'Ready',
    },
    vessel_id: {
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: {
        model: 'vessels',
        key: 'id',
      },
    },
    sign_on_date: {
      type: DataTypes.DATE,
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