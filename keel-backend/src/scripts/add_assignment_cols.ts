//keel-backend/src/scripts/add_assignment_cols.ts

import path from 'path';
import dotenv from 'dotenv';

// FIX: Explicitly load .env from keel-backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';

const migrate = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // 1. Add sign_on_port column
    await queryInterface.addColumn('trainee_assignments', 'sign_on_port', {
      type: 'VARCHAR(255)',
      allowNull: true
    });

    console.log('✅ Migration Complete: Added sign_on_port to trainee_assignments');
  } catch (e) { 
    console.error('Migration Failed (Column might already exist):', e); 
  }
};

migrate();