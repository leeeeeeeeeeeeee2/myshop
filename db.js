const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// Database file path
const dbPath = path.join(dataDir, 'myshop.db');
console.log('Database path:', dbPath);

// Create/open database
const db = new Database(dbPath, {
  verbose: console.log
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log('✓ SQLite database connected');

// Helper function for queries
const query = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return { rows: stmt.all(params) };
    }
    
    const result = stmt.run(params);
    return { 
      rows: result.changes > 0 ? [{ id: result.lastInsertRowid }] : [],
      changes: result.changes
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  query,
  db
};
