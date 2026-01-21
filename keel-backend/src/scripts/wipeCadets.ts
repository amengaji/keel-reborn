//keel-backend/src/scripts/wipeCadets.ts

import dotenv from 'dotenv';
import sequelize, { connectDB } from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import Assignment from '../models/Assignment';
import TraineeAssignment from '../models/TraineeAssignment';

dotenv.config();

const wipeCadets = async () => {
  // Use a transaction to ensure all-or-nothing deletion
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🧹 Connecting to database...');
    await connectDB();

    // 1. Find the Cadet Role ID
    const cadetRole = await Role.findOne({ 
      where: { name: 'CADET' },
      transaction 
    });

    if (!cadetRole) {
      console.error('❌ Error: Role "CADET" not found. Nothing to delete.');
      await transaction.rollback();
      process.exit(1);
    }

    console.log(`🎯 Found Cadet Role ID: ${cadetRole.id}`);

    // 2. Find all Cadet IDs
    // We need the IDs first to clean up the related tables
    const cadets = await User.findAll({
      where: { role_id: cadetRole.id },
      attributes: ['id'],
      transaction
    });

    const cadetIds = cadets.map(c => c.id);

    if (cadetIds.length === 0) {
      console.log('✨ No cadets found in the database. Nothing to wipe.');
      await transaction.commit();
      process.exit(0);
    }

    console.log(`⚠️ Identifying ${cadetIds.length} cadets to wipe...`);

    // 3. Delete Task Progress (Assignment Table)
    const deletedTasks = await Assignment.destroy({
      where: { user_id: cadetIds },
      transaction
    });
    console.log(`   🗑️ Deleted ${deletedTasks} task records.`);

    // 4. Delete Vessel Assignments (TraineeAssignment Table) - THIS WAS THE CAUSE OF THE ERROR
    const deletedVesselAssigns = await TraineeAssignment.destroy({
      where: { trainee_id: cadetIds },
      transaction
    });
    console.log(`   🗑️ Deleted ${deletedVesselAssigns} vessel assignment records.`);

    // 5. Delete the Users
    const deletedUsers = await User.destroy({
      where: { id: cadetIds },
      transaction
    });

    await transaction.commit();
    console.log(`✅ SUCCESS: Wiped ${deletedUsers} trainees from the database.`);
    console.log('🚀 You can now re-import your clean list.');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Cleanup Failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

wipeCadets();