const { getDbConnection } = require('../connection');

function getUnsyncedData() {
  const db = getDbConnection();
  
  const payload = {
    products: db.prepare("SELECT * FROM products WHERE synced = 0").all(),
    customers: db.prepare("SELECT * FROM customers WHERE synced = 0").all(),
    sales: db.prepare("SELECT * FROM sales WHERE synced = 0").all(),
    sale_items: db.prepare("SELECT * FROM sale_items WHERE synced = 0").all(),
    payments: db.prepare("SELECT * FROM payments WHERE synced = 0").all(),
  };

  const totalUnsynced = 
    payload.products.length + 
    payload.customers.length + 
    payload.sales.length + 
    payload.sale_items.length + 
    payload.payments.length;

  return { payload, totalUnsynced };
}

function markAsSynced(payload) {
  const db = getDbConnection();
  const recordsByTable = {
    products: payload.products,
    customers: payload.customers,
    sales: payload.sales,
    sale_items: payload.sale_items,
    payments: payload.payments,
  };

  const markTransaction = db.transaction(() => {
    for (const [table, records] of Object.entries(recordsByTable)) {
      if (records.length === 0) continue;

      const columns = Object.keys(records[0]).filter(column => column !== 'synced');
      const matchesSnapshot = columns.map(column => `"${column}" IS @${column}`).join(' AND ');
      const update = db.prepare(`UPDATE "${table}" SET synced = 1 WHERE synced = 0 AND ${matchesSnapshot}`);

      for (const record of records) {
        const values = Object.fromEntries(columns.map(column => [column, record[column]]));
        update.run(values);
      }
    }
  });

  markTransaction();
}

function getSyncStatus() {
  const db = getDbConnection();
  
  const counts = {
    products: db.prepare("SELECT COUNT(*) as count FROM products WHERE synced = 0").get().count,
    customers: db.prepare("SELECT COUNT(*) as count FROM customers WHERE synced = 0").get().count,
    sales: db.prepare("SELECT COUNT(*) as count FROM sales WHERE synced = 0").get().count,
    sale_items: db.prepare("SELECT COUNT(*) as count FROM sale_items WHERE synced = 0").get().count,
    payments: db.prepare("SELECT COUNT(*) as count FROM payments WHERE synced = 0").get().count,
  };
  
  const pending = Object.values(counts).reduce((a, b) => a + b, 0);
  
  return { pending, details: counts };
}

function getLastSyncTime() {
  const db = getDbConnection();
  return db.prepare("SELECT value FROM sync_metadata WHERE key = 'last_sync'").get()?.value || null;
}

function setLastSyncTime(value) {
  const db = getDbConnection();
  db.prepare(`
    INSERT INTO sync_metadata (key, value) VALUES ('last_sync', ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `).run(value);
}

module.exports = {
  getUnsyncedData,
  markAsSynced,
  getSyncStatus,
  getLastSyncTime,
  setLastSyncTime
};
