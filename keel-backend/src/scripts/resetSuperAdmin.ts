// keel-backend/src/scripts/resetSuperAdmin.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt'; // ✅ IMPORTANT: native bcrypt ONLY

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

    // 1️⃣ Hash password using bcrypt (same as login)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 2️⃣ Find user
    const user = await User.findOne({ where: { email } });

    if (user) {
      console.log(`👤 Found user: ${email}`);

      user.password_hash = passwordHash;
      await user.save();

      console.log(`✅ Password reset successful`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${newPassword}`);
    } else {
      console.log(`⚠️ User not found. Creating Super Admin...`);

      // Ensure role exists
      const [role] = await Role.findOrCreate({
        where: { name: 'SUPER_ADMIN' }
      });

      await User.create({
        first_name: 'Super',
        last_name: 'Admin',
        email,
        password_hash: passwordHash,
        role_id: role.id,
        status: 'Active',
        nationality: 'Global'
      });

      console.log(`✅ Super Admin created`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${newPassword}`);
    }

  } catch (error) {
    console.error('❌ Reset Failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

resetPassword();
