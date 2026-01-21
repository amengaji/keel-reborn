// keel-backend/src/models/Task.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company'; // Import Company to link the Foreign Key

class Task extends Model {
  public id!: number;
  public code!: string;
  public title!: string;
  public description!: string;
  public instructions!: string;
  
  // --- NEW: STCW Reference Column ---
  public stcw_code!: string; 

  // --- NEW: Ownership Column ---
  // NULL = Global Task (Visible to everyone, created by Super Admin)
  // ID = Private Task (Visible only to that Company)
  public company_id!: number | null;

  public department!: string;
  public category!: string;
  public function_code!: string;
  public safety_level!: string;
  public trainee_type!: string;
  public frequency!: string;
  public mandatory!: boolean;
  public evidence_type!: string;
  public verification_method!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stcw_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // --- OWNERSHIP LOGIC ---
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow NULL for Global Tasks (Super Admin)
      references: {
        model: Company,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    function_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    safety_level: {
      type: DataTypes.STRING(50),
      defaultValue: 'None',
    },
    trainee_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    frequency: {
      type: DataTypes.STRING(50),
      defaultValue: 'ONCE',
    },
    mandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    evidence_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'DOCUMENT/PHOTO',
    },
    verification_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'OBSERVATION',
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    underscored: true,
    timestamps: true,
  }
);

// Define Association
Task.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

export default Task;