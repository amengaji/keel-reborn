// keel-backend/src/scripts/seed.ts

import Role from '../models/Role';
import User from '../models/User';
import sequelize from '../config/database';
import { setupAssociations } from '../models/associations';
import bcrypt from 'bcryptjs';

/**
 * MARITIME EXPERT NOTE:
 * This script initializes the "Crew Manifest".
 * It establishes the legal ranks required for STCW compliance 
 * and creates the first System Administrator with a SECURE HASHED password.
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
    const roles = ['CADET', 'CTO', 'MASTER', 'SHORE_OFFICER', 'ADMIN', 'SHORE_ADMIN'];
    for (const roleName of roles) {
      await Role.findOrCreate({ 
        where: { name: roleName } 
      });
    }
    console.log('✅ ROLES: Standard maritime hierarchy initialized.');

    // 3. Create or Fix the First Administrator
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    
    if (adminRole) {
      // HASH THE PASSWORD (Crucial Fix)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      // Check if Admin exists
      const existingAdmin = await User.findOne({ where: { email: 'admin@keel.com' } });

      if (existingAdmin) {
        // UPDATE existing admin with the new hashed password
        existingAdmin.password_hash = passwordHash;
        existingAdmin.first_name = 'System';
        existingAdmin.last_name = 'Administrator';
        existingAdmin.role_id = adminRole.id;
        await existingAdmin.save();
        console.log('✅ USER: Admin account REPAIRED with hashed password (admin@keel.com / admin123)');
      } else {
        // CREATE new admin
        await User.create({
          email: 'admin@keel.com',
          first_name: 'System',
          last_name: 'Administrator',
          password_hash: passwordHash, 
          role_id: adminRole.id,
          status: 'Ready'
        });
        console.log('✅ USER: Admin created (admin@keel.com / admin123)');
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