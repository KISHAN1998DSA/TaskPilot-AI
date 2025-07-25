require('dotenv').config();
const { sequelize, testConnection } = require('../config/sequelize');

async function checkConnection() {
  try {
    console.log('Attempting to connect to the database...');
    await testConnection();
    
    // Get list of all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nDatabase tables:');
    if (results.length === 0) {
      console.log('No tables found. You may need to run migrations.');
    } else {
      results.forEach(result => {
        console.log(`- ${result.table_name}`);
      });
    }
    
    await sequelize.close();
    console.log('\nConnection closed successfully.');
  } catch (error) {
    console.error('Error checking database connection:', error);
    process.exit(1);
  }
}

checkConnection(); 