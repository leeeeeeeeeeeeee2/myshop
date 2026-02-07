const express = require("express");
const app = express();

// Middleware - allows Express to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - Fly.io uses this to verify app is alive
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("myshop backend v2 is live");
});

// API endpoints (placeholders for future features)
app.get("/api/shops", (req, res) => {
  res.json({ 
    message: "Shop listing endpoint",
    shops: []
  });
});

app.get("/api/products", (req, res) => {
  res.json({ 
    message: "Product listing endpoint",
    products: []
  });
});

// 404 handler - catches routes that don't exist
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`myshop server running on port ${port}`);
});
