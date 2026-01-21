// keel-backend/src/scripts/setupDatabase.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import sequelize, { connectDB } from '../config/database';
// Import ALL models to ensure Sequelize knows about them before syncing
import Role from '../models/Role';
import User from '../models/User';
import Company from '../models/Company';
import Vessel from '../models/Vessel';
import Subscription from '../models/Subscription';
// Add any other models you have (e.g. Assignment, Notification) here

const setupDatabase = async () => {
  try {
    console.log('🚀 Starting Database Setup...');

    // 2. Connect to Database
    await connectDB();

    // 3. Sync Structure (Creates Tables/Columns if missing)
    // 'alter: true' updates columns without deleting data. 
    // Use 'force: true' if you want to WIPE everything and start fresh.
    console.log('🔄 Syncing Database Schema...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database Schema Synced.');

    // 4. Seed Roles
    console.log('🌱 Seeding Roles...');
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CADET', 'CREW'];
    const roleMap = new Map();
    
    for (const roleName of roles) {
      const [role] = await Role.findOrCreate({ where: { name: roleName } });
      roleMap.set(roleName, role.id);
    }
    console.log('✅ Roles Created.');

    // 5. Seed Company (Element Tree)
    console.log('🏢 Seeding Company...');
    const [company] = await Company.findOrCreate({
      where: { name: 'Element Tree' },
      defaults: {
        contact_email: 'bb@keel.com',
        status: 'Active',
        address: 'Mumbai, India'
      }
    });
    console.log('✅ Company Ready: Element Tree');

    // 6. Seed Super Admin
    console.log('👤 Seeding Super Admin...');
    const adminPass = await bcrypt.hash('admin123', 10);
    
    await User.findOrCreate({
      where: { email: 'superadmin@keel.com' },
      defaults: {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@keel.com',
        password_hash: adminPass,
        role_id: roleMap.get('SUPER_ADMIN'),
        status: 'Active',
        nationality: 'Global'
      }
    });
    // Force update password/role just in case it existed but was wrong
    await User.update(
      { password_hash: adminPass, role_id: roleMap.get('SUPER_ADMIN') }, 
      { where: { email: 'superadmin@keel.com' } }
    );
    console.log('✅ Super Admin Ready (superadmin@keel.com / admin123)');

    // 7. Seed Test Trainee
    console.log('👨‍✈️ Seeding Test Trainee...');
    await User.findOrCreate({
      where: { email: 'trainee@keel.com' },
      defaults: {
        first_name: 'Test',
        last_name: 'Trainee',
        email: 'trainee@keel.com',
        password_hash: adminPass,
        role_id: roleMap.get('CADET'),
        company_id: company.id,
        rank: 'Deck Cadet',
        status: 'Ready',
        nationality: 'India'
      }
    });
    // Force update password just in case
    await User.update(
      { password_hash: adminPass, company_id: company.id },
      { where: { email: 'trainee@keel.com' } }
    );
    console.log('✅ Test Trainee Ready (trainee@keel.com / admin123)');

    console.log('\n🎉 SUCCESS! Database setup complete.');
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Setup Failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

setupDatabase();