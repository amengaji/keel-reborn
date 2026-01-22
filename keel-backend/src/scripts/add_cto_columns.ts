import sequelize from '../config/database';

const upgradeAssignments = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    
    console.log('🛠️ Adding CTO columns to assignments table...');
    
    try {
      await sequelize.query('ALTER TABLE assignments ADD COLUMN cto_id INTEGER REFERENCES users(id) ON DELETE SET NULL;');
      await sequelize.query('ALTER TABLE assignments ADD COLUMN cto_signed_at TIMESTAMP WITH TIME ZONE;');
      console.log('✅ SUCCESS: CTO columns added.');
    } catch (err: any) {
      if (err.message.includes('duplicate column') || err.original?.code === '42701') {
        console.log('ℹ️ NOTICE: Columns already exist.');
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

upgradeAssignments();
