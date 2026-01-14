// keel-reborn/keel-backend/src/models/Vessel.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';


class Vessel extends Model {
  public id!: number;
  public name!: string;
  public imo_number!: string;
  public vessel_type!: string;
  public flag?: string;
  public is_active!: boolean;
  public classSociety?:string;
}

Vessel.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  imo_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  vessel_type: { type: DataTypes.STRING, allowNull: false }, // <--- MUST BE STRING
  flag: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  classSociety: {type: DataTypes.STRING, defaultValue: ""}  

}, { sequelize, tableName: 'vessels', underscored: true });

export default Vessel;