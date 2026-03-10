// keel-backend/src/scripts/prepare_mobile_test.ts

import path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env from keel-backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import sequelize from '../config/database';
import User from '../models/User';
import Vessel from '../models/Vessel';
import Role from '../models/Role';
import Company from '../models/Company';
import TraineeAssignment from '../models/TraineeAssignment';
import bcrypt from 'bcrypt';

const prepareTest = async () => {
  try {
    console.log("🔄 Setting up Mobile Test Environment...");
    
    // Connect to database to ensure models are initialized correctly
    await sequelize.authenticate();

    // 1. Find Cadet Role
    const role = await Role.findOne({ where: { name: 'CADET' } });
    if (!role) throw new Error("Role 'CADET' not found. Please run seed script first.");

    // 2. Dynamically fetch a company or create a dummy one if none exists
    let company = await Company.findOne();
    if (!company) {
        console.log("🏢 No company found. Creating a test company...");
        company = await Company.create({
            name: "Test Maritime Company",
            domain: "testmaritime.com",
            contact_email: "admin@testmaritime.com",
            plan_tier: "ENTERPRISE",
            is_active: true
        });
    }
    const companyId = company.id;

    // 3. Find or Create a Test Vessel using the dynamic company ID
    let vessel = await Vessel.findOne({ where: { name: 'MV TEST SHIP' } });
    if (!vessel) {
        vessel = await Vessel.create({ 
            name: "MV TEST SHIP", 
            imo_number: "9999999",
            vessel_type: "Oil Tanker",
            company_id: companyId 
        });
    }

    // 4. Create Test User
    const email = "cadet@mobile.test";
    const password = "Keel@123";

    // Cleanup existing test user if present
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        await TraineeAssignment.destroy({ where: { trainee_id: existingUser.id } });
        await existingUser.destroy();
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
        first_name: "Mobile",
        last_name: "Tester",
        email: email,
        password_hash: hash,
        role_id: role.id,
        company_id: companyId,
        rank: "Deck Cadet",
        status: "Ready", 
        vessel_id: vessel.id, // Assigned but not joined
        department: "Deck"
    });

    // 5. Create the 'Shore Admin' Assignment Record
    await TraineeAssignment.create({
        trainee_id: user.id,
        vessel_id: vessel.id,
        company_id: companyId,
        sign_on_date: new Date(), 
        status: 'ACTIVE'
    });

    console.log("\n✅ SUCCESS! Test User Created.");
    console.log("------------------------------------------------");
    console.log(`📧 Login ID :  ${email}`);
    console.log(`🔑 Password :  ${password}`);
    console.log(`🚢 Vessel   :  ${vessel.name}`);
    console.log(`🏢 Company  :  ${company.name} (ID: ${companyId})`);
    console.log("------------------------------------------------");
    console.log("👉 ACTION: Open Mobile App, Login, and verify 'Join Ship' button appears.");

    process.exit(0);
  } catch (e) {
    console.error("❌ SETUP FAILED:", e);
    process.exit(1);
  }
};

prepareTest();