import sequelize from '../config/database';
import Vessel from '../models/Vessel';
import User from '../models/User';
import Role from '../models/Role';
import bcrypt from 'bcryptjs';

const repairAccounts = async () => {
  try {
    await sequelize.authenticate();
    console.log('🛠️ Scanning for vessels with missing command accounts...');

    const vessels = await Vessel.findAll();
    const ctoRole = await Role.findOne({ where: { name: 'CTO' } });
    const defaultPass = await bcrypt.hash('Keel@123', 10);

    if (!ctoRole) {
        console.error('❌ CTO Role missing.');
        process.exit(1);
    }

    let fixedCount = 0;

    for (const v of vessels) {
        const imo = v.imo_number;
        const expectedId = `ctodeck.${imo}`; 
        
        // Check if accounts exist
        const exists = await User.findOne({ where: { email: expectedId } });
        
        if (!exists) {
            console.log(`⚠️ Fixing accounts for Vessel: ${v.name} (IMO: ${imo})`);
            
            const ctoAccounts = [
                { id: `ctodeck.${imo}`, name: 'CTO Deck', dept: 'Deck' },
                { id: `ctoeng.${imo}`, name: 'CTO Engine', dept: 'Engine' },
                { id: `ctoeto.${imo}`, name: 'CTO Electrical', dept: 'Electrical' },
                { id: `ctocat.${imo}`, name: 'CTO Catering', dept: 'Catering' },
            ];

            for (const cto of ctoAccounts) {
                await User.create({
                    email: cto.id,
                    password_hash: defaultPass,
                    first_name: 'Chief Training Officer',
                    last_name: `(${cto.dept})`,
                    role_id: ctoRole.id,
                    rank: cto.name,
                    vessel_id: v.id,
                    status: 'Onboard',
                    company_id: v.company_id,
                    department: cto.dept
                }).catch(err => console.error(`Error creating ${cto.id}:`, err.message));
            }
            fixedCount++;
        }
    }

    console.log(`✅ Repair Complete. Fixed ${fixedCount} vessels.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

repairAccounts();