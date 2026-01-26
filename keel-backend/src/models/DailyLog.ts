//keel-backend/src/models/DailyLog.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Vessel from './Vessel';

class DailyLog extends Model {
  public id!: number;
  public user_id!: number;
  public vessel_id!: number;
  public log_date!: string; // YYYY-MM-DD
  
  // We store the 24h timeline as a generic JSON object
  // Format: { "00:00": "REST", "00:30": "WORK", ... }
  public timeline!: any; 
  
  public remarks!: string | null;
  public status!: string; // 'DRAFT', 'SUBMITTED', 'VERIFIED'

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DailyLog.init(
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
    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Vessel, key: 'id' }
    },
    log_date: {
      type: DataTypes.DATEONLY, // Stores just YYYY-MM-DD
      allowNull: false,
    },
    timeline: {
      type: DataTypes.JSONB, // Efficient storage for the visualizer data
      allowNull: false,
      defaultValue: {}
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'VERIFIED'),
      defaultValue: 'DRAFT'
    }
  },
  {
    sequelize,
    tableName: 'daily_logs',
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id', 'log_date'] } // Prevent duplicate logs for same day
    ]
  }
);

export default DailyLog;