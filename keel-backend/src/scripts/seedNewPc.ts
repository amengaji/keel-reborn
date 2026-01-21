//keel-backend/src/scripts/seedNewPc.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// --- FIX: FORCE LOAD .ENV ---
// This tells code to look exactly 2 folders up from this script (src/scripts -> src -> root)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// --- DEBUG CHECK ---
console.log('------------------------------------------------');
console.log('🔍 DEBUG: Loading Environment Variables');
console.log('📂 Target .env path:', envPath);
console.log('👤 DB User:', process.env.DB_USER);
console.log('🔑 DB Password Found?', process.env.DB_PASSWORD ? 'YES' : 'NO (This is the error)');
console.log('------------------------------------------------');

// Stop immediately if password is missing
if (!process.env.DB_PASS) {
  console.error('❌ ERROR: DB_PASSWORD is missing in your .env file.');
  console.error('👉 Please create/edit "keel-backend/.env" and add: DB_PASSWORD=your_password');
  process.exit(1);
}

// Now import database connection (only after env is loaded)
import sequelize, { connectDB } from '../config/database';
import Role from '../models/Role';
import User from '../models/User';
import Company from '../models/Company';
import Subscription from '../models/Subscription';

const seedNewPC = async () => {
  try {
    console.log('🌱 Connecting to new database...');
    await connectDB();
    await sequelize.sync({ alter: true });

    console.log('🛠️  Seeding Roles...');
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MASTER', 'CADET'];
    const roleMap: any = {};
    
    for (const r of roles) {
      const [role] = await Role.findOrCreate({ where: { name: r } });
      roleMap[r] = role.id;
    }

    console.log('👤 Seeding Super Admin...');
    const superPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.findOne({ where: { email: 'admin@keel.com' } });
    
    if (!superAdmin) {
      await User.create({
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@keel.com',
        password_hash: superPassword,
        role_id: roleMap['SUPER_ADMIN'],
        status: 'Active',
        nationality: 'Global'
      });
      console.log('   ✅ Created admin@keel.com (Pass: admin123)');
    } else {
      console.log('   ℹ️  admin@keel.com already exists.');
    }

    console.log('🏢 Re-creating Company (bb@keel.com)...');
    
    const [company, created] = await Company.findOrCreate({
      where: { contact_email: 'bb@keel.com' },
      defaults: {
        name: 'Element Tree (Restored)',
        domain: 'elementtree.com',
        contact_email: 'bb@keel.com',
        address: 'Singapore / India',
        plan_tier: 'ENTERPRISE',
        is_active: true
      }
    });

    if (created) {
      await Subscription.create({
        company_id: company.id,
        cadet_limit: 50,
        price_per_cadet: 500,
        valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'ACTIVE'
      });

      const userPassword = await bcrypt.hash('Keel2024!', 10);
      await User.create({
        first_name: 'Anuj',
        last_name: 'Mengaji',
        email: 'bb@keel.com',
        password_hash: userPassword,
        role_id: roleMap['ADMIN'],
        company_id: company.id,
        rank: 'Managing Director',
        status: 'Ready',
        nationality: 'India'
      });
      console.log('   ✅ Created bb@keel.com (Pass: Keel2024!)');
    } else {
      console.log('   ℹ️  Company bb@keel.com already exists.');
    }

    console.log('✨ RESTORE COMPLETE! You can now log in.');

  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

seedNewPC();