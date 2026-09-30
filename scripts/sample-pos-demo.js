const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const db = new Database('./local_data.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const now = () => new Date().toISOString();

const schema = `
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
`;

db.exec(schema);

const insertProduct = db.prepare(`
  INSERT INTO products (id, name, category, unit, price, cost_price, stock, low_stock_threshold, barcode)
  VALUES (@id, @name, @category, @unit, @price, @cost_price, @stock, @low_stock_threshold, @barcode)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    unit = excluded.unit,
    price = excluded.price,
    cost_price = excluded.cost_price,
    stock = excluded.stock,
    low_stock_threshold = excluded.low_stock_threshold,
    barcode = excluded.barcode,
    updated_at = datetime('now', 'localtime')
`);

const insertCustomer = db.prepare(`
  INSERT INTO customers (id, name, phone, email, address, total_due)
  VALUES (@id, @name, @phone, @email, @address, @total_due)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    address = excluded.address,
    updated_at = datetime('now', 'localtime')
`);

const insertSale = db.prepare(`
  INSERT INTO sales (id, customer_id, subtotal, discount, tax, total, paid, due, payment_method, status, note)
  VALUES (@id, @customer_id, @subtotal, @discount, @tax, @total, @paid, @due, @payment_method, @status, @note)
`);

const insertSaleItem = db.prepare(`
  INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total)
  VALUES (@id, @sale_id, @product_id, @product_name, @quantity, @unit_price, @total)
`);

const updateStock = db.prepare(`
  UPDATE products SET stock = stock - @qty, updated_at = datetime('now', 'localtime') WHERE id = @product_id
`);

const productCatalog = [
  ['Cement Bag', 'Building', 'bag', 520, 430, 30],
  ['Brick', 'Building', 'pcs', 18, 12, 120],
  ['Sand', 'Construction', 'kg', 65, 50, 50],
  ['Steel Rod 12mm', 'Metal', 'pcs', 210, 180, 25],
  ['Paint White', 'Finish', 'liter', 650, 500, 20],
  ['Tile 60x60', 'Finish', 'pcs', 110, 88, 60],
  ['PVC Pipe 1 inch', 'Plumbing', 'pcs', 340, 285, 18],
  ['Cement Mixer', 'Tools', 'pcs', 1850, 1600, 10],
  ['Gravel', 'Construction', 'kg', 80, 60, 40],
  ['Wire 2.5mm', 'Electrical', 'roll', 420, 350, 22],
];

for (const [name, category, unit, price, costPrice, stock] of productCatalog) {
  const id = randomUUID();
  insertProduct.run({
    id,
    name,
    category,
    unit,
    price,
    cost_price: costPrice,
    stock,
    low_stock_threshold: 5,
    barcode: `BAR-${name.replace(/\s+/g, '').slice(0, 8).toUpperCase()}`
  });
}

const customerId = randomUUID();
insertCustomer.run({
  id: customerId,
  name: 'Rahim Traders',
  phone: '01700000000',
  email: 'rahim@example.com',
  address: 'Dhaka, Bangladesh',
  total_due: 0,
});

const productRows = db.prepare('SELECT * FROM products ORDER BY name LIMIT 10').all();
const soldItems = [
  { product_id: productRows[0].id, quantity: 2, unit_price: productRows[0].price },
  { product_id: productRows[1].id, quantity: 6, unit_price: productRows[1].price },
  { product_id: productRows[2].id, quantity: 3, unit_price: productRows[2].price },
];

const subtotal = soldItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
const tax = subtotal * 0.05;
const total = subtotal + tax;
const saleId = randomUUID();

insertSale.run({
  id: saleId,
  customer_id: customerId,
  subtotal,
  discount: 0,
  tax,
  total,
  paid: total,
  due: 0,
  payment_method: 'cash',
  status: 'completed',
  note: 'Sample POS sale validation'
});

for (const item of soldItems) {
  const product = productRows.find((p) => p.id === item.product_id);
  const totalPrice = item.unit_price * item.quantity;
  insertSaleItem.run({
    id: randomUUID(),
    sale_id: saleId,
    product_id: item.product_id,
    product_name: product.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: totalPrice
  });
  updateStock.run({ product_id: item.product_id, qty: item.quantity });
}

const countProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
const countSales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
const totalStock = db.prepare('SELECT SUM(stock) as total FROM products').get().total;
const revenue = db.prepare('SELECT SUM(total) as total FROM sales').get().total;

console.log('POS sample test complete.');
console.log(`Products added: ${countProducts}`);
console.log(`Sales created: ${countSales}`);
console.log(`Total stock remaining: ${totalStock}`);
console.log(`Revenue recorded: ${revenue}`);
console.log(`Sample sale total: ${total}`);
console.log('Sample flow: 10 products inserted, sale recorded, stock updated successfully.');

db.close();
