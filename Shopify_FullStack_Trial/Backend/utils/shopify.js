const axios = require("axios");

async function fetchOrders(db, store, token) {
  const res = await axios.get(
    `https://${store}/admin/api/2024-01/orders.json?limit=20`,
    { headers: { "X-Shopify-Access-Token": token } }
  );

  const orders = res.data.orders;

  orders.forEach(order => {
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
  });
  console.log("Orders saved!");
}

module.exports = { fetchOrders };
