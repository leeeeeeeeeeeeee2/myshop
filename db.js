const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, 'data', 'myshop.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

async function initDb() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }
  
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

setInterval(saveDb, 5000);

process.on('exit', saveDb);
process.on('SIGINT', () => {
  saveDb();
  process.exit(0);
});

const query = (sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = db.exec(sql, params);
      if (result.length === 0) {
        return { rows: [] };
      }
      const columns = result[0].columns;
      const values = result[0].values;
      const rows = values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
      return { rows };
    } else {
      db.run(sql, params);
      saveDb();
      
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
        const lastId = lastIdResult[0].values[0][0];
        return { rows: [{ id: lastId }], changes: 1 };
      }
      
      return { rows: [], changes: db.getRowsModified() };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  initDb,
  query,
  saveDb
};
  db
};
