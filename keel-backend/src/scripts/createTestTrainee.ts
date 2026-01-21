//keel-backend/src/scripts/createTestTrainee.ts

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Force load .env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import sequelize, { connectDB } from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import Company from '../models/Company';

const createTrainee = async () => {
  try {
    console.log('🌱 Connecting to DB...');
    await connectDB();

    const email = 'trainee@keel.com';
    const passwordRaw = 'admin123';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    // 1. Get Roles & Company
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    
    // We try to attach them to 'Element Tree' (bb@keel.com's company) so assignments work
    const company = await Company.findOne({ where: { contact_email: 'bb@keel.com' } });

    if (!cadetRole || !company) {
      console.error('❌ Error: Missing "CADET" role or "Element Tree" company. Run the seed script first.');
      return;
    }

    // 2. Create or Update User
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        first_name: 'Test',
        last_name: 'Trainee',
        email,
        password_hash: passwordHash,
        role_id: cadetRole.id,
        company_id: company.id,
        rank: 'Deck Cadet',
        status: 'Ready',
        nationality: 'India'
      }
    });

    if (!created) {
      // If exists, just reset password
      user.password_hash = passwordHash;
      user.company_id = company.id; // Ensure linked to correct company
      await user.save();
      console.log(`🔄 Updated existing user ${email}`);
    }

    console.log('------------------------------------------------');
    console.log(`✅ Trainee Ready!`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${passwordRaw}`);
    console.log(`🏢 Company:  ${company.name}`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await sequelize.close();
  }
};

createTrainee();
