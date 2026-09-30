const { getDbConnection } = require('../connection');

function getAllProducts(filters = {}) {
  const db = getDbConnection();
  let query = `
    SELECT p.*,
      COALESCE(SUM(si.quantity), 0) as lifetime_sold,
      COALESCE(SUM(si.total), 0) as lifetime_revenue
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.search) {
    query += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.category) {
    query += " AND p.category = ?";
    params.push(filters.category);
  }

  query += " GROUP BY p.id ORDER BY p.name ASC";
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

function getProductById(id) {
  const db = getDbConnection();
  const stmt = db.prepare("SELECT * FROM products WHERE id = ?");
  return stmt.get(id);
}

function createProduct(data) {
  const db = getDbConnection();
  const stmt = db.prepare(`
    INSERT INTO products (id, name, category, unit, price, cost_price, stock, low_stock_threshold, barcode, image)
    VALUES (@id, @name, @category, @unit, @price, @cost_price, @stock, @low_stock_threshold, @barcode, @image)
  `);
  
  const result = stmt.run({
    id: data.id,
    name: data.name,
    category: data.category || null,
    unit: data.unit || 'pcs',
    price: data.price,
    cost_price: data.cost_price || 0,
    stock: data.stock || 0,
    low_stock_threshold: data.low_stock_threshold || 5,
    barcode: data.barcode || null,
    image: data.image || null
  });
  
  return result.changes > 0 ? getProductById(data.id) : null;
}

function updateProduct(id, data) {
  const db = getDbConnection();
  const fields = [];
  const params = {};

  Object.keys(data).forEach(key => {
    fields.push(`${key} = @${key}`);
    params[key] = data[key];
  });

  if (fields.length === 0) return getProductById(id);

  fields.push("updated_at = datetime('now', 'localtime')");
  fields.push("synced = 0"); // Mark for sync update
  params.id = id;

  const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = @id`);
  stmt.run(params);

  return getProductById(id);
}

function deleteProduct(id) {
  const db = getDbConnection();
  const stmt = db.prepare("DELETE FROM products WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

function searchProducts(query) {
  const db = getDbConnection();
  const stmt = db.prepare(`
    SELECT * FROM products 
    WHERE name LIKE ? OR barcode LIKE ? 
    ORDER BY name ASC 
    LIMIT 20
  `);
  return stmt.all(`%${query}%`, `%${query}%`);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
};
