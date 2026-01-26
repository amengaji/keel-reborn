//keel-backend/src/models/TaskEvidence.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Task from './Task';

class TaskEvidence extends Model {
  public id!: number;
  public user_id!: number;
  public task_id!: string; // Using string ID from JSON catalog
  public file_url!: string;
  public file_type!: string; // 'IMAGE', 'PDF', 'VIDEO'
  public description!: string | null;
  
  public readonly created_at!: Date;
}

TaskEvidence.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' }
    },
    task_id: {
      type: DataTypes.STRING,
      allowNull: false,
      // Note: If Task ID comes from a JSON file, we might not have a foreign key constraint here.
      // If Task is in DB, add references: { model: Task, key: 'id' }
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_type: {
      type: DataTypes.ENUM('IMAGE', 'PDF', 'VIDEO', 'AUDIO'),
      defaultValue: 'IMAGE'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'task_evidence',
    underscored: true,
  }
);

export default TaskEvidence;