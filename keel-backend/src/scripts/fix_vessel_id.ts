import sequelize from '../config/database';

const fixDatabase = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    console.log('✅ Connected.');

    console.log('🛠️ Checking for vessel_id column in users table...');
    
    // Raw SQL to add the column safely
    try {
      await sequelize.query('ALTER TABLE users ADD COLUMN vessel_id INTEGER REFERENCES vessels(id) ON DELETE SET NULL;');
      console.log('✅ SUCCESS: vessel_id column added to users table.');
    } catch (err: any) {
      if (err.message.includes('duplicate column') || err.original?.code === '42701') {
        console.log('ℹ️ NOTICE: vessel_id column already exists. No changes needed.');
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

fixDatabase();
