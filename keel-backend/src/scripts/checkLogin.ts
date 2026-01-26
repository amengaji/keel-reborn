// keel-backend/src/scripts/checkLogin.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { connectDB } from '../config/database';
import User from '../models/User';

const run = async () => {
  await connectDB();

  const email = 'superadmin@keel.com';
  const password = 'admin123';

  console.log('🔍 Checking login manually...');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    console.log('❌ USER NOT FOUND IN DATABASE');
    process.exit(0);
  }

  console.log('✅ User found');
  console.log('Stored hash:', user.password_hash);

  const match = await bcrypt.compare(password, user.password_hash);

  console.log('🔐 bcrypt.compare result:', match);

  process.exit(0);
};

run().catch(err => {
  console.error('❌ ERROR:', err);
  process.exit(1);
});
