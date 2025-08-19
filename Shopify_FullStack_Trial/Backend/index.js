require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const crypto = require("crypto");
const { fetchOrders } = require("./utils/shopify");

const app = express();
app.use(bodyParser.json());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3.Database("./shopify.db");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    created_at TEXT,
    customer_name TEXT,
    order_total REAL,
    line_items TEXT
  )`);
});

// Fetch and save orders manually
app.get("/fetch-orders", async (req, res) => {
  try {
    await fetchOrders(db, SHOPIFY_STORE, ADMIN_API_TOKEN);
    res.json({ message: "Orders fetched and saved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return saved orders
app.get("/orders", (req, res) => {
  db.all("SELECT * FROM orders", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(r => (r.line_items = JSON.parse(r.line_items)));
    res.json(rows);
  });
});

// Shopify webhook
app.post("/webhook/orders/create", (req, res) => {
  const hmac = req.get("X-Shopify-Hmac-Sha256");
  const body = JSON.stringify(req.body);

  const digest = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");

  if (digest !== hmac) {
    return res.status(401).send("Unauthorized");
  }

  const order = req.body;
  const lineItems = order.line_items.map(li => ({
    title: li.title,
    quantity: li.quantity,
  }));

  db.run(
    `INSERT OR REPLACE INTO orders (order_id, created_at, customer_name, order_total, line_items)
     VALUES (?, ?, ?, ?, ?)`,
    [
      order.id,
      order.created_at,
      `${order.customer.first_name} ${order.customer.last_name}`,
      order.total_price,
      JSON.stringify(lineItems),
    ]
  );

  console.log("Webhook processed: ", order.id);
  res.sendStatus(200);
});

// Low stock report
app.get("/report/low-stock", async (req, res) => {
  const threshold = parseInt(req.query.threshold || 5);

  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=50`,
      { headers: { "X-Shopify-Access-Token": ADMIN_API_TOKEN } }
    );

    const lowStock = [];

    response.data.products.forEach(prod => {
      const variants = prod.variants
        .filter(v => v.inventory_quantity < threshold)
        .map(v => ({
          title: v.title,
          inventory_quantity: v.inventory_quantity,
        }));

      if (variants.length > 0) {
        lowStock.push({
          product_id: prod.id,
          title: prod.title,
          variants,
        });
      }
    });

    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
