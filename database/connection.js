const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(__dirname, '../../local_data.db') 
  : path.join(app.getPath('userData'), 'pos_data.db');

let db;

function getDbConnection() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath, { verbose: isDev ? console.log : null });
    // Enable Write-Ahead Logging for better concurrent performance
    db.pragma('journal_mode = WAL');
    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');
    
    console.log(`[Database] Connected to SQLite database at ${dbPath}`);
  }
  return db;
}

function closeConnection() {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Connection closed.');
  }
}

module.exports = {
  getDbConnection,
  closeConnection
};
