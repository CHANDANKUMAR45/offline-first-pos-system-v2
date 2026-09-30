const { getDbConnection } = require('../connection');

function createPayment(data) {
  const db = getDbConnection();

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, customer_id, sale_id, amount, method, note)
    VALUES (@id, @customer_id, @sale_id, @amount, @method, @note)
  `);

  const updateCustomerDue = db.prepare(`
    UPDATE customers SET total_due = total_due - @amount, synced = 0 WHERE id = @customer_id
  `);
  
  // Optional: update specific sale status regarding payment if business logic requires
  const updateSalePaid = db.prepare(`
    UPDATE sales SET paid = paid + @amount, due = MAX(0, due - @amount), synced = 0 WHERE id = @sale_id
  `);

  const executeTransaction = db.transaction(() => {
    // 1. Insert payment record
    insertPayment.run({
      id: data.id,
      customer_id: data.customer_id,
      sale_id: data.sale_id || null, // Optional if it's a general customer due payment
      amount: data.amount,
      method: data.method || 'cash',
      note: data.note || null
    });

    // 2. Reduce the customer due
    updateCustomerDue.run({
      customer_id: data.customer_id,
      amount: data.amount
    });

    // 3. If there is a specific sale attached, update its paid and due amount tracking
    if (data.sale_id) {
       updateSalePaid.run({
         sale_id: data.sale_id,
         amount: data.amount
       });
    }

    return getPaymentById(data.id);
  });

  return executeTransaction();
}

function getPaymentById(id) {
  const db = getDbConnection();
  const stmt = db.prepare("SELECT * FROM payments WHERE id = ?");
  return stmt.get(id);
}

function getPaymentsByCustomer(customerId) {
  const db = getDbConnection();
  const stmt = db.prepare("SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC");
  return stmt.all(customerId);
}

function getPaymentsBySale(saleId) {
  const db = getDbConnection();
  const stmt = db.prepare("SELECT * FROM payments WHERE sale_id = ? ORDER BY created_at DESC");
  return stmt.all(saleId);
}

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentsByCustomer,
  getPaymentsBySale
};
