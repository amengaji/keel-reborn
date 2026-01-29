// keel-backend/src/scripts/createVesselMasters.ts

import sequelize from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import Company from '../models/Company'; // ✅ Added Company import
import bcrypt from 'bcrypt'; 

const createVesselMasters = async () => {
  try {
    await sequelize.authenticate();
    console.log('⚓ Connected to DB...');

    // 1. Find the MASTER role
    const masterRole = await Role.findOne({ where: { name: 'MASTER' } });
    if (!masterRole) {
      console.error('❌ Error: MASTER role does not exist. Run seed.ts first.');
      process.exit(1);
    }

    // 2. Ensure at least one default company exists to prevent FK errors
    const [defaultCompany] = await Company.findOrCreate({
      where: { name: 'Keel Global Fleet' },
      defaults: { name: 'Keel Global Fleet', domain: 'keel.com', status: 'Active' }
    });

    // 3. Get all vessels
    const vessels = await Vessel.findAll();
    console.log(`🚢 Found ${vessels.length} vessels. Starting Master account generation...`);

    const passwordHash = await bcrypt.hash('master123', 10);

    for (const vessel of vessels) {
      const masterEmail = `master.${vessel.imo_number}@keel.com`;

      // ✅ Use Vessel's company if it exists, otherwise use the default one
      const targetCompanyId = vessel.company_id || defaultCompany.id; 

      const [user, created] = await User.findOrCreate({
        where: { email: masterEmail },
        defaults: {
          first_name: 'Master',
          last_name: vessel.name,
          email: masterEmail,
          password_hash: passwordHash,
          role_id: masterRole.id,
          company_id: targetCompanyId, 
          vessel_id: vessel.id,
          status: 'Active',
          rank: 'Master'
        }
      });

      if (created) {
          console.log(`✅ CREATED: ${masterEmail} (Vessel: ${vessel.name})`);
      } else {
          // Update existing records to ensure they are correctly linked
          user.vessel_id = vessel.id;
          user.company_id = targetCompanyId; 
          user.password_hash = passwordHash;
          await user.save();
          console.log(`ℹ️  UPDATED: ${masterEmail} (Vessel: ${vessel.name})`);
      }
    }

    console.log('\n🚀 BATCH CREATION COMPLETE.');
    console.log('👉 Password for all: master123');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createVesselMasters();