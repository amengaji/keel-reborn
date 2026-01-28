//keel-backend/src/models/WatchkeepingLog.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class WatchkeepingLog extends Model {
  public id!: number;
  public user_id!: number;        // The Cadet
  public local_id!: string;       // ID from Mobile (UUID) to prevent duplicates
  
  public start_time!: Date;
  public end_time!: Date;
  public watch_type!: string;     // 'Bridge', 'Engine'
  public ship_state!: string;     // 'At Sea', 'Port', 'Anchor'
  public location!: string;       // 'Bridge', 'Engine Room'
  
  public is_cargo_ops!: boolean;  // 0 or 1 from mobile
  public discipline!: string;     // 'Steering', 'Lookout', 'Navigation'
  
  public remarks?: string;
  
  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

WatchkeepingLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    local_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Prevents syncing the same log twice
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    watch_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ship_state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_cargo_ops: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    discipline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'watchkeeping_logs',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['local_id'], unique: true }
    ]
  }
);

export default WatchkeepingLog;