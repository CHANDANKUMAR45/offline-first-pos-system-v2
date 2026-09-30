const { Pool, types } = require('pg');
require('dotenv').config();

// Convert PostgreSQL NUMERIC values to JavaScript numbers
types.setTypeParser(1700, function (val) {
  return parseFloat(val);
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : false
});

// Handle unexpected database errors
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
  process.exit(-1);
});

// Export database functions
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};