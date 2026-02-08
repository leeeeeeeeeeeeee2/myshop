sconst express = require("express");
const db = require("./db");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "myshop API",
    version: "3.0.0",
    status: "running",
    database: "SQLite",
    endpoints: {
      shops: {
        list: "GET /api/shops",
        getBySubdomain: "GET /api/shops/:subdomain",
        create: "POST /api/shops"
      },
      products: {
        list: "GET /api/products",
        listByShop: "GET /api/products?shop_id=1",
        create: "POST /api/products"
      }
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SHOPS ENDPOINTS
// ============================================

// Get all shops
app.get("/api/shops", (req, res) => {
  try {
    const result = db.query('SELECT * FROM shops ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      shops: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shops"
    });
  }
});

// Get single shop by subdomain
app.get("/api/shops/:subdomain", (req, res) => {
  try {
    const { subdomain } = req.params;
    const result = db.query(
      'SELECT * FROM shops WHERE subdomain = ?',
      [subdomain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Shop not found"
      });
    }

    res.json({
      success: true,
      shop: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shop"
    });
  }
});

// Create a new shop
app.post("/api/shops", (req, res) => {
  try {
    const { name, subdomain, owner_email } = req.body;

    // Validate required fields
    if (!name || !subdomain || !owner_email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, subdomain, owner_email"
      });
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({
        success: false,
        error: "Subdomain must contain only lowercase letters, numbers, and hyphens"
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    // Check if subdomain already exists
    const existing = db.query(
      'SELECT id FROM shops WHERE subdomain = ?',
      [subdomain]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Subdomain already taken"
      });
    }

    // Insert new shop
    db.query(
      'INSERT INTO shops (name, subdomain, owner_email) VALUES (?, ?, ?)',
      [name, subdomain, owner_email]
    );

    // Get the created shop
    const result = db.query(
      'SELECT * FROM shops WHERE subdomain = ?',
      [subdomain]
    );

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create shop"
    });
  }
});

// ============================================
// PRODUCTS ENDPOINTS
// ============================================

// Get all products (with optional shop filter)
app.get("/api/products", (req, res) => {
  try {
    const { shop_id } = req.query;

    let result;
    if (shop_id) {
      // Verify shop exists
      const shopExists = db.query(
        'SELECT id FROM shops WHERE id = ?',
        [shop_id]
      );

      if (shopExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Shop not found"
        });
      }

      result = db.query(
        'SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC',
        [shop_id]
      );
    } else {
      result = db.query('SELECT * FROM products ORDER BY created_at DESC');
    }

    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products"
    });
  }
});

// Create a new product
app.post("/api/products", (req, res) => {
  try {
    const { shop_id, name, description, price, stock } = req.body;

    // Validate required fields
    if (!shop_id || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: shop_id, name, price"
      });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Price must be a positive number"
      });
    }

    // Validate stock if provided
    const stockNum = stock !== undefined ? parseInt(stock) : 0;
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Stock must be a non-negative integer"
      });
    }

    // Check if shop exists
    const shopExists = db.query(
      'SELECT id FROM shops WHERE id = ?',
      [shop_id]
    );

    if (shopExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Shop not found"
      });
    }

    // Insert product
    db.query(
      'INSERT INTO products (shop_id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)',
      [shop_id, name, description || '', priceNum, stockNum]
    );

    // Get the created product
    const result = db.query(
      'SELECT * FROM products WHERE shop_id = ? ORDER BY id DESC LIMIT 1',
      [shop_id]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create product"
    });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found",
    path: req.path
  });
});

// ============================================
// START SERVER
// ============================================
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 myshop API Server Running        ║
║   Port: ${port}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}       ║
║   Database: SQLite                     ║
╚════════════════════════════════════════╝
  `);
});
