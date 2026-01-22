import sequelize from '../config/database';

const upgradeUsers = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    
    console.log('🛠️ Adding department column to users table...');
    
    try {
      await sequelize.query('ALTER TABLE users ADD COLUMN department VARCHAR(255);');
      console.log('✅ SUCCESS: department column added.');
    } catch (err: any) {
      if (err.message.includes('duplicate column') || err.original?.code === '42701') {
        console.log('ℹ️ NOTICE: Column already exists.');
      } else {
        throw err;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
};

upgradeUsers();
