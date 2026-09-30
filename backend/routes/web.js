const express = require('express');
const router = express.Router();
const db = require('../db');

// Dashboard Stats pulling dynamically from Postgres equivalent to SQLite logic
router.get('/stats', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Today's Revenue & Count
    // For simplicity treating Postgres DATE(created_at) matching ISO strings
    const salesRes = await db.query(`SELECT SUM(total) as revenue, COUNT(id) as count FROM sales WHERE created_at::text LIKE $1`, [`${todayStr}%`]);
    const revenue = parseFloat(salesRes.rows[0].revenue) || 0;
    const count = parseInt(salesRes.rows[0].count) || 0;

    // 2. Inventory Stats
    const prodRes = await db.query(`SELECT COUNT(id) as total, SUM(CASE WHEN stock <= low_stock_threshold THEN 1 ELSE 0 END) as low FROM products`);
    const totalProducts = parseInt(prodRes.rows[0].total) || 0;
    const lowStock = parseInt(prodRes.rows[0].low) || 0;

    // 3. Outstanding physical Dues
    const dupRes = await db.query(`SELECT SUM(total_due) as dues FROM customers`);
    const dues = parseFloat(dupRes.rows[0].dues) || 0;

    res.json({
      success: true,
      data: {
        todayRevenue: revenue,
        todayCount: count,
        totalProducts: totalProducts,
        lowStockItems: lowStock,
        totalDues: dues
      }
    });

  } catch(err) {
    console.error('[Web API] Stats Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generic Fetchers
router.get('/products', async (req, res) => {
  try {
     const prods = await db.query(`
      SELECT p.*,
        COALESCE(SUM(si.quantity), 0) as lifetime_sold,
        COALESCE(SUM(si.total), 0) as lifetime_revenue
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      GROUP BY p.id
      ORDER BY p.name ASC
     `);
     res.json({ success: true, data: prods.rows });
  } catch (err) { res.json({ success: false, error: err.message }); }
});

router.get('/customers', async (req, res) => {
  try {
     const reqs = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
     res.json({ success: true, data: reqs.rows });
  } catch (err) { res.json({ success: false, error: err.message }); }
});

router.get('/sales', async (req, res) => {
  try {
      const sales = await db.query(`
        SELECT sales.*, customers.name as customer_name 
        FROM sales 
        LEFT JOIN customers ON sales.customer_id = customers.id 
        ORDER BY sales.created_at DESC
      `);
     res.json({ success: true, data: sales.rows });
  } catch (err) { res.json({ success: false, error: err.message }); }
});

router.get('/sales/:id', async (req, res) => {
  try {
    const saleRes = await db.query(`
      SELECT sales.*, customers.name as customer_name, customers.phone as customer_phone
      FROM sales
      LEFT JOIN customers ON sales.customer_id = customers.id
      WHERE sales.id = $1
    `, [req.params.id]);

    if (saleRes.rows.length === 0) {
      return res.json({ success: false, error: 'Sale not found' });
    }

    const sale = saleRes.rows[0];
    
    // Fetch subset arrays for the Invoice Template
    const itemsRes = await db.query(`SELECT * FROM sale_items WHERE sale_id = $1`, [sale.id]);
    sale.items = itemsRes.rows;

    const paymentsRes = await db.query(`SELECT * FROM payments WHERE sale_id = $1`, [sale.id]);
    sale.payments = paymentsRes.rows;

    res.json({ success: true, data: sale });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
