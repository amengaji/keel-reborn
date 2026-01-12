// keel-reborn/keel-backend/src/models/ShipType.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ShipType extends Model {
  public id!: number;
  public name!: string;
}

ShipType.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, { sequelize, modelName: 'ship_type' });

export default ShipType;