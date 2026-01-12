// keel-reborn/keel-backend/src/scripts/seed.ts

import Role from '../models/Role';
import User from '../models/User';
import sequelize from '../config/database';
import { setupAssociations } from '../models/associations';

/**
 * MARITIME EXPERT NOTE:
 * This script initializes the "Crew Manifest".
 * It establishes the legal ranks required for STCW compliance 
 * and creates the first System Administrator.
 */

const seed = async () => {
  try {
    // 1. Initialize Connection and Associations
    await sequelize.authenticate();
    setupAssociations();
    
    // Sync tables (This creates the tables if they don't exist yet)
    await sequelize.sync({ alter: true });
    console.log('⚓ DATABASE: Tables synchronized.');

    // 2. Create Standard Maritime Roles
    const roles = ['CADET', 'CTO', 'MASTER', 'SHORE_OFFICER', 'ADMIN'];
    for (const roleName of roles) {
      await Role.findOrCreate({ 
        where: { name: roleName } 
      });
    }
    console.log('✅ ROLES: Standard maritime hierarchy initialized.');

    // 3. Create the First Administrator (The Captain)
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    
    if (adminRole) {
      const [adminUser, created] = await User.findOrCreate({
        where: { email: 'admin@keel.com' },
        defaults: {
          first_name: 'System',
          last_name: 'Administrator',
          password_hash: 'admin123', // UI/UX Note: In production, we will use bcrypt
          role_id: adminRole.id
        }
      });

      if (created) {
        console.log('✅ USER: Admin created (admin@keel.com / admin123)');
      } else {
        console.log('ℹ️ USER: Admin already exists.');
      }
    }

    console.log('🚀 SEEDING COMPLETE: System is ready for login.');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING ERROR:', error);
    process.exit(1);
  }
};

seed();