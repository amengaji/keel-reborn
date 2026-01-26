// keel-backend/src/scripts/seedNewPc.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// --- FIX: FORCE LOAD .ENV ---
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Stop immediately if password is missing
if (!process.env.DB_PASS) {
  console.error('❌ ERROR: DB_PASSWORD is missing in your .env file.');
  process.exit(1);
}

// Import database connection
import sequelize, { connectDB } from '../config/database';
import Role from '../models/Role';
import User from '../models/User';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
// Import Associations to ensure DB schema is perfect
import { setupAssociations } from '../models/associations';

const seedNewPC = async () => {
  try {
    console.log('🌱 Connecting to database...');
    await connectDB();
    
    // Setup associations BEFORE sync to ensure Foreign Keys are created
    setupAssociations();
    await sequelize.sync({ alter: true });

    console.log('🛠️  Seeding Roles...');
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MASTER', 'CADET'];
    const roleMap: any = {};
    
    for (const r of roles) {
      const [role] = await Role.findOrCreate({ where: { name: r } });
      roleMap[r] = role.id;
    }

    // --- 1. SUPER ADMIN ---
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
      console.log('   ✅ Created admin@keel.com');
    }

    // --- 2. COMPANY ---
    console.log('🏢 ensuring Company exists...');
    const [company] = await Company.findOrCreate({
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

    // --- 3. SUBSCRIPTION (Check independently) ---
    const sub = await Subscription.findOne({ where: { company_id: company.id } });
    if (!sub) {
      await Subscription.create({
        company_id: company.id,
        cadet_limit: 50,
        price_per_cadet: 500,
        valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'ACTIVE'
      });
      console.log('   ✅ Created Subscription');
    }

    // --- 4. COMPANY USER (The Fix) ---
    console.log('👤 Checking for bb@keel.com...');
    const existingUser = await User.findOne({ where: { email: 'bb@keel.com' } });

    if (!existingUser) {
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
      console.log('   ✅ CREATED USER: bb@keel.com (Pass: Keel2024!)');
    } else {
        // Optional: Reset password if user exists but login fails
        const newPass = await bcrypt.hash('Keel2024!', 10);
        existingUser.password_hash = newPass;
        existingUser.role_id = roleMap['ADMIN']; // Ensure correct role
        await existingUser.save();
        console.log('   🔄 UPDATED USER: bb@keel.com (Password reset to Keel2024!)');
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