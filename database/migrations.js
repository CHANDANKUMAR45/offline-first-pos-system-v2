const { getDbConnection } = require('./connection');

function runMigrations() {
  const db = getDbConnection();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'pcs',
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      low_stock_threshold REAL DEFAULT 5,
      barcode TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      total_due REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      paid REAL DEFAULT 0,
      due REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed',
      note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      sale_id TEXT,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash',
      note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ── Add image column to products (safe migration) ──
  try {
    db.exec(`ALTER TABLE products ADD COLUMN image TEXT DEFAULT NULL`);
    console.log('[Database] Added image column to products table.');
  } catch (e) {
    // Column already exists — ignore
  }

  console.log('[Database] Migrations completed.');
}

module.exports = { runMigrations };
