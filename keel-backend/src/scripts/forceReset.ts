// keel-backend/src/scripts/forceReset.ts
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load .env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import sequelize from '../config/database';
import User from '../models/User';

const resetPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Database');

    const email = 'bb@keel.com';
    const newPassword = '123456'; // Simple password for testing

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ User ${email} NOT FOUND in database.`);
      return;
    }

    // Force update password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    user.password_hash = hash;
    user.status = 'Active'; // Ensure account is active
    await user.save();

    console.log('-------------------------------------------');
    console.log(`✅ PASSWORD RESET SUCCESSFUL`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

resetPassword();