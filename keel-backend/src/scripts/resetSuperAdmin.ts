//keel-backend/src/scripts/resetSuperAdmin.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load .env from backend root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import sequelize, { connectDB } from '../config/database';
import User from '../models/User';
import Role from '../models/Role';

const resetPassword = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const email = 'superadmin@keel.com';
    const newPassword = 'admin123';
    
    // 1. Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 2. Find the user
    const user = await User.findOne({ where: { email } });

    if (user) {
      console.log(`👤 Found user: ${email}`);
      // Update password
      user.password_hash = passwordHash;
      await user.save();
      console.log(`✅ Password successfully reset to: ${newPassword}`);
    } else {
      console.log(`⚠️ User ${email} not found. Creating new Super Admin...`);
      
      // Ensure Role Exists
      const [role] = await Role.findOrCreate({ where: { name: 'SUPER_ADMIN' } });

      await User.create({
        first_name: 'Super',
        last_name: 'Admin',
        email: email,
        password_hash: passwordHash,
        role_id: role.id,
        status: 'Active',
        nationality: 'Global'
      });
      console.log(`✅ Created new Super Admin: ${email} with password: ${newPassword}`);
    }

  } catch (error) {
    console.error('❌ Reset Failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

resetPassword();