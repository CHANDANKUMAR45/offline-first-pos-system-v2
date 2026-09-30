-- PostgreSQL Schema matching the Local SQLite Architecture mapping
-- Intended for deployment on Supabase, Neon, or Railway

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  unit VARCHAR(50) DEFAULT 'pcs',
  price NUMERIC(15,2) NOT NULL,
  cost_price NUMERIC(15,2) DEFAULT 0,
  stock NUMERIC(15,2) DEFAULT 0,
  low_stock_threshold NUMERIC(15,2) DEFAULT 5,
  barcode VARCHAR(50),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_due NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  tax NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  paid NUMERIC(15,2) DEFAULT 0,
  due NUMERIC(15,2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash',
  status VARCHAR(50) DEFAULT 'completed',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255),
  quantity NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total NUMERIC(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'cash',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
