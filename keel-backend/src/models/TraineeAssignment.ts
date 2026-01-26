//keel-backend/src/models/TraineeAssignment.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Vessel from './Vessel';
import Company from './Company';

class TraineeAssignment extends Model {
  public id!: number;
  public trainee_id!: number;
  public vessel_id!: number;
  public company_id!: number;
  public sign_on_date!: Date;
  public sign_on_port!: string | null; // <--- NEW FIELD
  public sign_off_date!: Date | null;
  public status!: string;
  
  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public trainee?: User;
  public vessel?: Vessel;
}

TraineeAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trainee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Vessel,
        key: 'id',
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: 'id',
      },
    },
    sign_on_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    sign_on_port: { // <--- NEW COLUMN
      type: DataTypes.STRING,
      allowNull: true,
    },
    sign_off_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'trainee_assignments',
    underscored: true,
  }
);

export default TraineeAssignment;