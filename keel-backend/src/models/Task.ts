// keel-backend/src/models/Task.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Task extends Model {
  public id!: number;
  public code!: string;
  public title!: string;
  public description!: string; // Competence
  public instructions!: string; // Step-by-step
  public department!: string;
  public category!: string; // Section / Topic
  public function_code!: string; // STCW Function
  public safety_level!: string;
  public trainee_type!: string; // Rank
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
      type: DataTypes.TEXT, // Changed to TEXT for longer content
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT, // New Field
      allowNull: true,
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

export default Task;