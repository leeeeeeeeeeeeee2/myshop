const express = require("express");
const { initDb, query } = require("./db");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

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

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/shops", (req, res) => {
  try {
    const result = query("SELECT * FROM shops ORDER BY created_at DESC");
    res.json({
      success: true,
      count: result.rows.length,
      shops: result.rows
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shops"
    });
  }
});

app.get("/api/shops/:subdomain", (req, res) => {
  try {
    const { subdomain } = req.params;
    const result = query("SELECT * FROM shops WHERE subdomain = ?", [subdomain]);

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
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shop"
    });
  }
});

app.post("/api/shops", (req, res) => {
  try {
    const { name, subdomain, owner_email } = req.body;

    if (!name || !subdomain || !owner_email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, subdomain, owner_email"
      });
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({
        success: false,
        error: "Subdomain must contain only lowercase letters, numbers, and hyphens"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    const existing = query("SELECT id FROM shops WHERE subdomain = ?", [subdomain]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Subdomain already taken"
      });
    }

    query(
      "INSERT INTO shops (name, subdomain, owner_email) VALUES (?, ?, ?)",
      [name, subdomain, owner_email]
    );

    const result = query("SELECT * FROM shops WHERE subdomain = ?", [subdomain]);

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop: result.rows[0]
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create shop"
    });
  }
});

app.get("/api/products", (req, res) => {
  try {
    const { shop_id } = req.query;

    let result;
    if (shop_id) {
      const shopExists = query("SELECT id FROM shops WHERE id = ?", [shop_id]);

      if (shopExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Shop not found"
        });
      }

      result = query(
        "SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC",
        [shop_id]
      );
    } else {
      result = query("SELECT * FROM products ORDER BY created_at DESC");
    }

    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products"
    });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const { shop_id, name, description, price, stock } = req.body;

    if (!shop_id || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: shop_id, name, price"
      });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Price must be a positive number"
      });
    }

    const stockNum = stock !== undefined ? parseInt(stock) : 0;
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Stock must be a non-negative integer"
      });
    }

    const shopExists = query("SELECT id FROM shops WHERE id = ?", [shop_id]);

    if (shopExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Shop not found"
      });
    }

    query(
      "INSERT INTO products (shop_id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)",
      [shop_id, name, description || "", priceNum, stockNum]
    );

    const result = query(
      "SELECT * FROM products WHERE shop_id = ? ORDER BY id DESC LIMIT 1",
      [shop_id]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: result.rows[0]
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create product"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found",
    path: req.path
  });
});

const port = process.env.PORT || 8080;

async function startServer() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log("Server running on port " + port);
      console.log("Database: SQLite");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
