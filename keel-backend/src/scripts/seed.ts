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

    // 2. Create Roles (Added SUPER_ADMIN)
    const roles = ['CADET', 'CTO', 'MASTER', 'SHORE_OFFICER', 'ADMIN', 'SHORE_ADMIN', 'SUPER_ADMIN'];
    for (const roleName of roles) {
      await Role.findOrCreate({ where: { name: roleName } });
    }
    console.log('✅ ROLES: Standard maritime hierarchy initialized.');

    // 3. Create/Update System Admin (Standard Admin)
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (adminRole) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const existingAdmin = await User.findOne({ where: { email: 'admin@keel.com' } });

      if (existingAdmin) {
        existingAdmin.password_hash = passwordHash;
        existingAdmin.role_id = adminRole.id;
        await existingAdmin.save();
        console.log('✅ USER: Admin updated (admin@keel.com / admin123)');
      } else {
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

    // 4. Create/Update SUPER ADMIN (Owner Access)
    const superAdminRole = await Role.findOne({ where: { name: 'SUPER_ADMIN' } });
    if (superAdminRole) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin@123', salt); // User requested password

      const existingSuper = await User.findOne({ where: { email: 'superadmin@keel.com' } });

      if (existingSuper) {
        existingSuper.password_hash = passwordHash;
        existingSuper.first_name = 'Platform';
        existingSuper.last_name = 'Owner';
        existingSuper.role_id = superAdminRole.id;
        await existingSuper.save();
        console.log('✅ USER: Super Admin updated (superadmin@keel.com / admin@123)');
      } else {
        await User.create({
          email: 'superadmin@keel.com',
          first_name: 'Platform',
          last_name: 'Owner',
          password_hash: passwordHash, 
          role_id: superAdminRole.id,
          status: 'Ready'
        });
        console.log('✅ USER: Super Admin created (superadmin@keel.com / admin@123)');
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