// keel-reborn/keel-backend/src/models/Vessel.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Vessel extends Model {
  public id!: number;
  public name!: string;
  public imo_number!: string;
  public ship_type_id!: number;
  public is_active!: boolean;
}

Vessel.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  imo_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  ship_type_id: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, modelName: 'vessel' });

export default Vessel;