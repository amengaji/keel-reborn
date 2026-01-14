import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Task extends Model {
  public id!: number;
  public code!: string;             // e.g. "A.1.2"
  public title!: string;            // e.g. "Steer the ship"
  public description?: string;      // e.g. "Demonstrate ability to keep course..."
  public department!: string;       // "Deck" or "Engine"
  public category?: string;         // e.g. "Navigation at Operational Level"
  public function_code?: string;    // NEW: "1", "2", "3" (STCW Function ID)
  public safety_level?: string;     // "Green", "Amber", "Red" (Risk Level)
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // No duplicate task codes allowed
    },
    title: {
      type: DataTypes.TEXT, // Text because some task names are long
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    department: {
      type: DataTypes.ENUM('Deck', 'Engine'),
      allowNull: false,
      defaultValue: 'Deck'
    },
    category: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    safety_level: {
      type: DataTypes.ENUM('Green', 'Amber', 'Red', 'None'),
      defaultValue: 'Green',
    },
    function_code: { type: DataTypes.STRING(10), allowNull: true, defaultValue: '1' },
  },
  {
    sequelize,
    tableName: 'tasks',
    underscored: true,
    timestamps: true,
  }
);

export default Task;