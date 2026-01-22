import sequelize from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import bcrypt from 'bcryptjs';

const createMaster = async () => {
  try {
    await sequelize.authenticate();
    console.log('⚓ Connected to DB...');

    // 1. Find the MASTER role
    const masterRole = await Role.findOne({ where: { name: 'MASTER' } });
    
    if (!masterRole) {
      console.error('❌ Error: MASTER role does not exist. Run seed.ts first.');
      process.exit(1);
    }

    // 2. Create the User
    const passwordHash = await bcrypt.hash('master123', 10);
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'master@keel.com' },
      defaults: {
        first_name: 'Captain',
        last_name: 'Haddock',
        email: 'master@keel.com',
        password_hash: passwordHash,
        role_id: masterRole.id,
        status: 'Active',
        nationality: 'India',
        rank: 'Master'
      }
    });

    if (created) {
        console.log('✅ SUCCESS: Master user created!');
    } else {
        console.log('ℹ️  User master@keel.com already exists. resetting password...');
        user.password_hash = passwordHash;
        user.role_id = masterRole.id;
        await user.save();
        console.log('✅ SUCCESS: Password reset to master123');
    }

    console.log('👉 Login: master@keel.com');
    console.log('👉 Pass:  master123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createMaster();
