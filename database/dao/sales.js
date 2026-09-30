const { getDbConnection } = require('../connection');

function createSale(saleData, items) {
  const db = getDbConnection();

  const insertSale = db.prepare(`
    INSERT INTO sales (id, customer_id, subtotal, discount, tax, total, paid, due, payment_method, status, note)
    VALUES (@id, @customer_id, @subtotal, @discount, @tax, @total, @paid, @due, @payment_method, @status, @note)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total)
    VALUES (@id, @sale_id, @product_id, @product_name, @quantity, @unit_price, @total)
  `);

  const updateProductStock = db.prepare(`
    UPDATE products SET stock = stock - @quantity, synced = 0 WHERE id = @product_id
  `);

  const updateCustomerDue = db.prepare(`
    UPDATE customers SET total_due = total_due + @due, synced = 0 WHERE id = @customer_id
  `);

  const executeTransaction = db.transaction(() => {
    // 1. Insert into Sales
    insertSale.run({
      id: saleData.id,
      customer_id: saleData.customer_id || null,
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      total: saleData.total,
      paid: saleData.paid || 0,
      due: saleData.due || 0,
      payment_method: saleData.payment_method || 'cash',
      status: saleData.status || 'completed',
      note: saleData.note || null
    });

    // 2. Insert items and update stock
    for (const item of items) {
      insertSaleItem.run({
        id: item.id,
        sale_id: saleData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      });

      // Update product stock if the item is linked to a product ID
      if (item.product_id) {
        updateProductStock.run({
          product_id: item.product_id,
          quantity: item.quantity
        });
      }
    }

    // 3. Update customer total_due if customer_id exists and due > 0
    if (saleData.customer_id && saleData.due > 0) {
      updateCustomerDue.run({
        customer_id: saleData.customer_id,
        due: saleData.due
      });
    }

    return saleData.id;
  });

  return executeTransaction();
}

function getAllSales(filters = {}) {
  const db = getDbConnection();
  let query = `
    SELECT sales.*, customers.name as customer_name 
    FROM sales 
    LEFT JOIN customers ON sales.customer_id = customers.id 
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += " AND sales.status = ?";
    params.push(filters.status);
  }

  if (filters.customer_id) {
    query += " AND sales.customer_id = ?";
    params.push(filters.customer_id);
  }

  // Example Date filter: filters.startDate
  if (filters.startDate && filters.endDate) {
    query += " AND date(sales.created_at) BETWEEN date(?) AND date(?)";
    params.push(filters.startDate, filters.endDate);
  }

  query += " ORDER BY sales.created_at DESC";
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

function getSaleById(id) {
  const db = getDbConnection();
  const saleStmt = db.prepare(`
    SELECT sales.*, customers.name as customer_name 
    FROM sales 
    LEFT JOIN customers ON sales.customer_id = customers.id 
    WHERE sales.id = ?
  `);
  
  const sale = saleStmt.get(id);

  if (!sale) return null;

  const itemsStmt = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?");
  sale.items = itemsStmt.all(id);

  return sale;
}

function getSalesByCustomer(customerId) {
  return getAllSales({ customer_id: customerId });
}

function getDashboardStats() {
  const db = getDbConnection();
  
  // Date constraints
  const today = new Date().toISOString().split('T')[0];
  
  // Today's Sales
  const todayStmt = db.prepare(`
    SELECT SUM(total) as revenue, COUNT(*) as count 
    FROM sales 
    WHERE date(created_at) = date(?) AND status = 'completed'
  `);
  const todaysSales = todayStmt.get(today);

  // Total Products Count
  const prodCountStmt = db.prepare("SELECT COUNT(*) as count FROM products");
  const totalProducts = prodCountStmt.get().count;

  // Low Stock Items Count
  const lowStockStmt = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= low_stock_threshold");
  const lowStockItems = lowStockStmt.get().count;

  // Total Dues from all customers
  const dueStmt = db.prepare("SELECT SUM(total_due) as total FROM customers");
  const totalDues = dueStmt.get().total || 0;

  return {
    todayRevenue: todaysSales.revenue || 0,
    todayCount: todaysSales.count || 0,
    totalProducts,
    lowStockItems,
    totalDues,
  };
}

module.exports = {
  createSale,
  getAllSales,
  getSaleById,
  getSalesByCustomer,
  getDashboardStats
};
