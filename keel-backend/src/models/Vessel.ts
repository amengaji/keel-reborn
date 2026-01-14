import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Vessel extends Model {
  public id!: number;
  public name!: string;
  public imo_number!: string;
  public vessel_type!: string; // Matches frontend 'type'
  public flag!: string;
  public class_society!: string; // Matches frontend 'classSociety'
  public status!: string;        // Matches frontend 'status' ('Active'/'Inactive')
  public is_active!: boolean;    // For the checkbox you requested
}

Vessel.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  imo_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  vessel_type: { type: DataTypes.STRING, allowNull: false },
  flag: { type: DataTypes.STRING, defaultValue: 'Unknown' },
  class_society: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'vessels', underscored: true });

export default Vessel;