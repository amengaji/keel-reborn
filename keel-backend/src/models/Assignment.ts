//keel-backend/src/models/Assignment.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Assignment extends Model {
  public id!: number;
  public user_id!: number;      // The Cadet
  public task_id!: number;      // The Task from Syllabus
  public status!: string;       // 'Not Started', 'In Progress', 'Pending Review', 'Review', 'Completed'
  public progress!: number;     // 0 to 100
  
  // --- SIGNATURE CHAIN ---
  public cto_id?: number;       // Step 1: Technical Verification
  public cto_signed_at?: Date;
  
  public officer_id?: number;   // Step 2: Master's Final Approval
  public signed_off_at?: Date;
  
  public evidence_url?: string; 
}

Assignment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'tasks', key: 'id' }
    },
    // ✅ ADDED 'Pending Review' to ENUM
    status: {
      type: DataTypes.ENUM('Not Started', 'In Progress', 'Pending Review', 'Review', 'Completed'),
      defaultValue: 'Not Started'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    // --- CTO DATA ---
    cto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    cto_signed_at: { type: DataTypes.DATE, allowNull: true },

    // --- MASTER DATA ---
    officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    signed_off_at: { type: DataTypes.DATE, allowNull: true },
    
    evidence_url: { type: DataTypes.STRING, allowNull: true }
  },
  { sequelize, tableName: 'assignments', underscored: true }
);

export default Assignment;