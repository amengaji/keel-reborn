// keel-backend/src/models/TraineeAssignment.ts
//
// PURPOSE:
// - Track vessel assignments for trainees
// - Preserve assignment history (sign-on / sign-off)
// - STRICTLY separate from TRB task assignments
//
// DOMAIN:
// - Trainee ↔ Vessel
//
// SAFETY:
// - No deletes (status-based lifecycle)
// - Audit-safe
//

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TraineeAssignment extends Model {
  public id!: number;

  public trainee_id!: number;
  public vessel_id!: number;

  public sign_on_date!: string;
  public sign_off_date?: string | null;

  public status!: "ACTIVE" | "COMPLETED";

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
    },

    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sign_on_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    sign_off_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "COMPLETED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    sequelize,
    tableName: "trainee_assignments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "idx_trainee_active_assignment",
        fields: ["trainee_id", "status"],
      },
      {
        name: "idx_vessel_active_assignments",
        fields: ["vessel_id", "status"],
      },
    ],
  }
);

export default TraineeAssignment;
