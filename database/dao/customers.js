const { getDbConnection } = require('../connection');

function getAllCustomers(filters = {}) {
  const db = getDbConnection();
  let query = "SELECT * FROM customers WHERE 1=1";
  const params = [];

  if (filters.search) {
    query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  query += " ORDER BY name ASC";
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

function getCustomerById(id) {
  const db = getDbConnection();
  const stmt = db.prepare("SELECT * FROM customers WHERE id = ?");
  return stmt.get(id);
}

function createCustomer(data) {
  const db = getDbConnection();
  const stmt = db.prepare(`
    INSERT INTO customers (id, name, phone, email, address, total_due)
    VALUES (@id, @name, @phone, @email, @address, @total_due)
  `);
  
  const result = stmt.run({
    id: data.id,
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    total_due: data.total_due || 0
  });
  
  return result.changes > 0 ? getCustomerById(data.id) : null;
}

function updateCustomer(id, data) {
  const db = getDbConnection();
  const fields = [];
  const params = {};

  Object.keys(data).forEach(key => {
    fields.push(`${key} = @${key}`);
    params[key] = data[key];
  });

  if (fields.length === 0) return getCustomerById(id);

  fields.push("updated_at = datetime('now', 'localtime')");
  fields.push("synced = 0"); // Mark for sync update
  params.id = id;

  const stmt = db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = @id`);
  stmt.run(params);

  return getCustomerById(id);
}

function deleteCustomer(id) {
  const db = getDbConnection();
  const stmt = db.prepare("DELETE FROM customers WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

function searchCustomers(query) {
  return getAllCustomers({ search: query });
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};
