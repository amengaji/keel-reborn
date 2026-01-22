import sequelize from '../config/database';
import User from '../models/User';
import Role from '../models/Role';
import bcrypt from 'bcryptjs';

const createCTO = async () => {
  try {
    await sequelize.authenticate();
    console.log('⚓ Connected to DB...');

    // 1. Find the CTO role
    const ctoRole = await Role.findOne({ where: { name: 'CTO' } });
    
    if (!ctoRole) {
      console.error('❌ Error: CTO role does not exist. Run seed.ts first.');
      process.exit(1);
    }

    // 2. Create the User
    const passwordHash = await bcrypt.hash('cto123', 10);
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'cto@keel.com' },
      defaults: {
        first_name: 'Chief',
        last_name: 'Engineer',
        email: 'cto@keel.com',
        password_hash: passwordHash,
        role_id: ctoRole.id,
        status: 'Active',
        nationality: 'India',
        rank: 'Chief Engineer',
        department: 'Engine' // Assigning default department
      }
    });

    if (created) {
        console.log('✅ SUCCESS: CTO user created!');
    } else {
        console.log('ℹ️  User cto@keel.com already exists. resetting password...');
        user.password_hash = passwordHash;
        user.role_id = ctoRole.id;
        await user.save();
        console.log('✅ SUCCESS: Password reset to cto123');
    }

    console.log('👉 Login: cto@keel.com');
    console.log('👉 Pass:  cto123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createCTO();
