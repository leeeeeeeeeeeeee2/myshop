const { initDb, query, saveDb } = require('./db');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    await initDb();
    
    console.log('Creating tables...');

    query(`
      CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subdomain TEXT UNIQUE NOT NULL,
        owner_email TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Shops table ready');

    query(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);
    console.log('Products table ready');

    query(`CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id)`);
    console.log('Database indexes ready');

    saveDb();
    
    const shopCount = query('SELECT COUNT(*) as count FROM shops');
    const productCount = query('SELECT COUNT(*) as count FROM products');
    
    console.log('Database stats: ' + shopCount.rows[0].count + ' shops, ' + productCount.rows[0].count + ' products');
    console.log('Database initialization complete');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
