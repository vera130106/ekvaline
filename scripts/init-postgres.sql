CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
