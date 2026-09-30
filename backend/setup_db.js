const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function runSetup() {
  console.log('[Setup] Connecting to local PostgreSQL database...');

  let client;

  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    client = await pool.connect();

    console.log('[Setup] Connected! Running database schema...');

    await client.query(sqlScript);

    console.log('[Setup] Database setup completed successfully!');
    console.log('[Setup] Cloud DB is ready!');
  } catch (err) {
    console.error('[Setup Error]', err.message);
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
}

runSetup();