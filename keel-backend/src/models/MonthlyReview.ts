//keel-backend/src/models/MonthlyReview.ts

import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

/**
 * MonthlyReview Model
 * Stores formal periodic evaluations of a Cadet by a Master or CTO.
 * This covers the STCW/TRB requirement for a "Monthly Statement".
 */
class MonthlyReview extends Model {
  public id!: number;
  public user_id!: number;      // The Cadet being reviewed
  public reviewer_id!: number;  // The Master or CTO signing the review
  public vessel_id!: number;    // The vessel where review took place
  
  public review_month!: number; // 1-12
  public review_year!: number;  // e.g., 2026
  
  public tasks_completed!: number;     // Stats snapshot at time of review
  public sea_hours_this_month!: number; // Stats snapshot
  
  public performance_score!: number;    // 1 to 5 rating
  public comments!: string;             // Master's formal remarks
  public digital_signature!: string;    // Verification hash or placeholder
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MonthlyReview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    reviewer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vessels', key: 'id' }
    },
    review_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 }
    },
    review_year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tasks_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sea_hours_this_month: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    performance_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: { min: 1, max: 5 }
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    digital_signature: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'monthly_reviews',
    underscored: true,
    indexes: [
      { fields: ['user_id', 'review_month', 'review_year'], unique: true } // Only one review per month
    ]
  }
);

export default MonthlyReview;