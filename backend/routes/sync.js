const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Endpoint for the Electron app to push locally un-synced data.
 * Structure of incoming mapping:
 * {
 *   products: [ {...}, {...} ],
 *   customers: [ {...} ],
 *   sales: [ {...} ],
 *   sale_items: [ {...} ],
 *   payments: [ {...} ]
 * }
 */
router.post('/push', async (req, res) => {
  const payload = req.body;
  
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid payload format' });
  }

  // Start a transaction in PostgreSQL
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Sync Products (Upsert: Update if exists, Insert if new)
    if (payload.products && payload.products.length > 0) {
      for (const prod of payload.products) {
        await client.query(`
          INSERT INTO products (id, name, category, unit, price, cost_price, stock, low_stock_threshold, barcode, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name, category = EXCLUDED.category, unit = EXCLUDED.unit,
            price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock,
            low_stock_threshold = EXCLUDED.low_stock_threshold, barcode = EXCLUDED.barcode,
            updated_at = EXCLUDED.updated_at
        `, [prod.id, prod.name, prod.category, prod.unit, prod.price, prod.cost_price, prod.stock, prod.low_stock_threshold, prod.barcode, prod.created_at, prod.updated_at]);
      }
    }

    // 2. Sync Customers
    if (payload.customers && payload.customers.length > 0) {
      for (const cust of payload.customers) {
        await client.query(`
          INSERT INTO customers (id, name, phone, email, address, total_due, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
            address = EXCLUDED.address, total_due = EXCLUDED.total_due, updated_at = EXCLUDED.updated_at
        `, [cust.id, cust.name, cust.phone, cust.email, cust.address, cust.total_due, cust.created_at, cust.updated_at]);
      }
    }

    // 3. Sync Sales
    if (payload.sales && payload.sales.length > 0) {
      for (const sale of payload.sales) {
        await client.query(`
          INSERT INTO sales (id, customer_id, subtotal, discount, tax, total, paid, due, payment_method, status, note, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [sale.id, sale.customer_id, sale.subtotal, sale.discount, sale.tax, sale.total, sale.paid, sale.due, sale.payment_method, sale.status, sale.note, sale.created_at]);
      }
    }

    // 4. Sync Sale Items
    if (payload.sale_items && payload.sale_items.length > 0) {
      for (const item of payload.sale_items) {
        await client.query(`
          INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [item.id, item.sale_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total]);
      }
    }

    // 5. Sync Payments
    if (payload.payments && payload.payments.length > 0) {
      for (const pmt of payload.payments) {
        await client.query(`
          INSERT INTO payments (id, customer_id, sale_id, amount, method, note, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [pmt.id, pmt.customer_id, pmt.sale_id, pmt.amount, pmt.method, pmt.note, pmt.created_at]);
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Batch sync processed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Sync Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  } finally {
    client.release();
  }
});

/**
 * Endpoint to fetch down data from the server (Pull Sync)
 * Can be used for multi-device sync or restoring an offline tablet.
 */
router.get('/pull', async (req, res) => {
  // A robust system would use timestamp tracking (last_sync_time).
  // This serves all data for Phase 8 demonstration of full Cloud DB REST mapping.
  try {
    const products = await db.query('SELECT * FROM products');
    const customers = await db.query('SELECT * FROM customers');
    res.status(200).json({ 
      success: true, 
      data: {
        products: products.rows,
        customers: customers.rows
      }
    });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
