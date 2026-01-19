// keel-backend/src/scripts/seed.ts

import Role from '../models/Role';
import User from '../models/User';
import sequelize from '../config/database';
import { setupAssociations } from '../models/associations';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    // 1. Initialize Connection
    await sequelize.authenticate();
    setupAssociations();
    
    // Sync tables
    await sequelize.sync({ alter: true });
    console.log('⚓ DATABASE: Tables synchronized.');

    // 2. Create Roles
    const roles = ['CADET', 'CTO', 'MASTER', 'SHORE_OFFICER', 'ADMIN', 'SHORE_ADMIN'];
    for (const roleName of roles) {
      await Role.findOrCreate({ where: { name: roleName } });
    }
    console.log('✅ ROLES: Standard maritime hierarchy initialized.');

    // 3. Fix or Create Admin with HASHED Password
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    
    if (adminRole) {
      // --- THE FIX: Hash the password ---
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const existingAdmin = await User.findOne({ where: { email: 'admin@keel.com' } });

      if (existingAdmin) {
        // REPAIR existing account
        existingAdmin.password_hash = passwordHash;
        existingAdmin.first_name = 'System';
        existingAdmin.last_name = 'Administrator';
        existingAdmin.role_id = adminRole.id;
        await existingAdmin.save();
        console.log('✅ USER: Admin account REPAIRED (admin@keel.com / admin123)');
      } else {
        // CREATE new account
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

    console.log('🚀 SEEDING COMPLETE: System is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING ERROR:', error);
    process.exit(1);
  }
};

seed();