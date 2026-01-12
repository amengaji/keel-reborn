import User from '../models/User';
import Role from '../models/Role';
import sequelize from '../config/database';
import { setupAssociations } from '../models/associations';

const reset = async () => {
  await sequelize.authenticate();
  setupAssociations();
  
  // Find Admin Role
  const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
  
  if (adminRole) {
    // Delete existing admin to be sure
    await User.destroy({ where: { email: 'admin@keel.com' } });
    
    // Create fresh admin
    await User.create({
      first_name: 'System',
      last_name: 'Administrator',
      email: 'admin@keel.com',
      password_hash: 'admin123',
      role_id: adminRole.id
    });
    console.log('✨ SUCCESS: Admin user reset to admin@keel.com / admin123');
  }
  process.exit(0);
};
reset();
