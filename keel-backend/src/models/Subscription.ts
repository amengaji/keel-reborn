//keel-backend/src/models/Subscription.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company';

class Subscription extends Model {
  public id!: number;
  public company_id!: number;
  
  // Licensing
  public cadet_limit!: number; // e.g., 50 cadets purchased
  public price_per_cadet!: number; // e.g., 500.00
  
  // Status & Expiry
  public status!: 'ACTIVE' | 'PAST_DUE' | 'EXPIRED';
  public start_date!: Date;
  public valid_until!: Date;
  public grace_period_days!: number;
  
  // Invoicing (Manual Reference)
  public last_invoice_ref?: string; // e.g., "INV-2025-001"

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    cadet_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5, // Default trial limit?
      comment: 'Number of paid cadet seats (licenses)',
    },
    price_per_cadet: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 500.00,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'PAST_DUE', 'EXPIRED'),
      defaultValue: 'ACTIVE',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    valid_until: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date when the current license period ends',
    },
    grace_period_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15, // As per requirements
    },
    last_invoice_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    underscored: true,
    timestamps: true,
  }
);

export default Subscription;