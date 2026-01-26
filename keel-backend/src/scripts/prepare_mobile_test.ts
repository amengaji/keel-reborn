//keel-backend/src/scripts/prepare_mobile_test.ts

import path from 'path';
import dotenv from 'dotenv';

// FIX: Explicitly load .env from keel-backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User';
import Vessel from '../models/Vessel';
import Role from '../models/Role';
import TraineeAssignment from '../models/TraineeAssignment';
import bcrypt from 'bcrypt';

const prepareTest = async () => {
  try {
    console.log("🔄 Setting up Mobile Test Environment...");

    // 1. Find Cadet Role
    const role = await Role.findOne({ where: { name: 'CADET' } });
    if (!role) throw new Error("Role 'CADET' not found. Please run seed script first.");

    // 2. Find or Create a Test Vessel
    let vessel = await Vessel.findOne({ where: { name: 'MV TEST SHIP' } });
    if (!vessel) {
        vessel = await Vessel.create({ 
            name: "MV TEST SHIP", 
            imo_number: "9999999",
            vessel_type: "Oil Tanker",
            company_id: 1 
        });
    }

    // 3. Create Test User
    const email = "cadet@mobile.test";
    const password = "Keel@123"; // <--- UPDATED PASSWORD

    // Cleanup existing test user
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
        company_id: 1,
        rank: "Deck Cadet",
        status: "Ready", 
        vessel_id: vessel.id, // Assigned but not joined
        department: "Deck"
    });

    // 4. Create the 'Shore Admin' Assignment Record
    await TraineeAssignment.create({
        trainee_id: user.id,
        vessel_id: vessel.id,
        company_id: 1,
        sign_on_date: new Date(), 
        status: 'ACTIVE'
    });

    console.log("\n✅ SUCCESS! Test User Created.");
    console.log("------------------------------------------------");
    console.log(`📧 Login ID :  ${email}`);
    console.log(`🔑 Password :  ${password}`);
    console.log(`🚢 Vessel   :  ${vessel.name}`);
    console.log("------------------------------------------------");
    console.log("👉 ACTION: Open Mobile App, Login, and verify 'Join Ship' button appears.");

  } catch (e) {
    console.error("❌ SETUP FAILED:", e);
  }
};

prepareTest();