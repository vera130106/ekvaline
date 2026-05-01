const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL не задан. Укажите подключение к PostgreSQL в .env.');
}

class PgStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = String(sql || '').trim();
  }

  async get(...args) {
    const { rows } = await this.db._query(this.sql, args);
    return rows[0];
  }

  async all(...args) {
    const { rows } = await this.db._query(this.sql, args);
    return rows;
  }

  async run(...args) {
    const isInsert = /^\s*insert\s/i.test(this.sql);
    let text = this.sql;
    if (isInsert && !/\breturning\b/i.test(text)) {
      text = `${text} RETURNING id`;
    }
    const result = await this.db._query(text, args);
    const first = result.rows[0];
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: first && first.id != null ? Number(first.id) : undefined,
    };
  }
}

class PgDatabase {
  constructor(pool, client = null) {
    this.pool = pool;
    this.client = client;
    this.initPromise = null;
  }

  prepare(sql) {
    return new PgStatement(this, sql);
  }

  async _query(rawSql, args) {
    if (!this.client) {
      await this._ensureInit();
    }
    const { text, values } = this._normalizeSql(rawSql, args);
    if (this.client) return this.client.query(text, values);
    return this.pool.query(text, values);
  }

  async withTransaction(fn) {
    await this._ensureInit();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txDb = new PgDatabase(this.pool, client);
      const out = await fn(txDb);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      client.release();
    }
  }

  async _ensureInit() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  async _init() {
    await this.pool.query('SELECT 1');
    await migrate(this.pool);
    await seedIfEmpty(this.pool);
    await ensureDefaultDeliveryAddresses(this.pool);
    await ensureExtendedCatalog(this.pool);
  }

  _normalizeSql(sql, args) {
    let text = String(sql);
    text = text.replace(/\s+COLLATE\s+NOCASE/gi, '');
    text = text.replace(/datetime\('now'\)/gi, 'NOW()');
    text = text.replace(/IFNULL\(/gi, 'COALESCE(');
    if (/^INSERT\s+OR\s+REPLACE\s+INTO\s+site_settings/i.test(text)) {
      text =
        'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
    }

    let idx = 0;
    text = text.replace(/\?/g, () => {
      idx += 1;
      return `$${idx}`;
    });
    return { text, values: args };
  }
}

async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      patronymic TEXT NOT NULL DEFAULT '',
      bonus_balance INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'client',
      blocked INTEGER NOT NULL DEFAULT 0,
      login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      password_changed_at TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC NOT NULL DEFAULT 0,
      volume_liters NUMERIC,
      photo_path TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      hidden INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      delivery_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      bonuses_used INTEGER NOT NULL DEFAULT 0,
      bonuses_earned INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      courier_note TEXT NOT NULL DEFAULT '',
      zone TEXT,
      driver TEXT,
      pickup INTEGER NOT NULL DEFAULT 0,
      total_sum NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      next_delivery_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      items_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      tariff NUMERIC NOT NULL DEFAULT 0,
      bounds_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS bonus_operations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS feedback_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_addresses (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      address_line TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await ensureIdentityDefault(pool, 'users');
  await ensureIdentityDefault(pool, 'categories');
  await ensureIdentityDefault(pool, 'products');
  await ensureIdentityDefault(pool, 'orders');
  await ensureIdentityDefault(pool, 'subscriptions');
  await ensureIdentityDefault(pool, 'delivery_zones');
  await ensureIdentityDefault(pool, 'bonus_operations');
  await ensureIdentityDefault(pool, 'feedback_messages');
  await ensureIdentityDefault(pool, 'audit_log');
  await ensureIdentityDefault(pool, 'delivery_addresses');

  await ensureColumnDefault(pool, 'feedback_messages', 'created_at', 'NOW()');
  await ensureColumnDefault(pool, 'audit_log', 'created_at', 'NOW()');
  await ensureColumnDefault(pool, 'orders', 'created_at', 'NOW()');
  await ensureColumnDefault(pool, 'orders', 'updated_at', 'NOW()');
  await ensureOrdersCompatibility(pool);
}

async function ensureIdentityDefault(pool, tableName) {
  const col = await pool.query(
    `SELECT column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'`,
    [tableName]
  );
  if (!col.rowCount) return;
  const currentDefault = String(col.rows[0].column_default || '');
  const seqName = `${tableName}_id_seq`;
  if (!currentDefault.includes('nextval')) {
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS "${seqName}"`);
    await pool.query(`ALTER TABLE "${tableName}" ALTER COLUMN id SET DEFAULT nextval('${seqName}')`);
  }
  await pool.query(
    `SELECT setval($1::regclass, COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false)`,
    [seqName]
  );
}

async function ensureColumnDefault(pool, tableName, columnName, defaultExpr) {
  const col = await pool.query(
    `SELECT column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  );
  if (!col.rowCount) return;
  const currentDefault = col.rows[0].column_default;
  if (currentDefault) return;
  await pool.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${defaultExpr}`);
}

async function ensureColumnExists(pool, tableName, columnName, typeSql) {
  const col = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  );
  if (col.rowCount > 0) return;
  await pool.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${typeSql}`);
}

async function ensureOrdersCompatibility(pool) {
  await ensureColumnExists(pool, 'orders', 'user_id', 'INTEGER');
  await ensureColumnExists(pool, 'orders', 'address', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'orders', 'delivery_date', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'orders', 'delivery_slot', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'orders', 'payment_method', "TEXT NOT NULL DEFAULT 'cash'");
  await ensureColumnExists(pool, 'orders', 'bonuses_used', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'orders', 'bonuses_earned', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'orders', 'items_json', "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumnExists(pool, 'orders', 'courier_note', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'orders', 'zone', 'TEXT');
  await ensureColumnExists(pool, 'orders', 'driver', 'TEXT');
  await ensureColumnExists(pool, 'orders', 'pickup', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'orders', 'total_sum', 'NUMERIC NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'orders', 'updated_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  await ensureColumnExists(pool, 'orders', 'created_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');

  // Поддержка старого столбца total -> total_sum.
  await pool.query(
    `UPDATE orders
     SET total_sum = COALESCE(total_sum, total, 0)
     WHERE total_sum IS NULL OR total_sum = 0`
  ).catch(() => {});

  await pool.query(`ALTER TABLE "orders" ALTER COLUMN "total_sum" SET DEFAULT 0`).catch(() => {});
}

async function seedIfEmpty(pool) {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (count.rows[0].c > 0) return;

  const rounds = 12;
  const staff = [
    ['admin@ekvaline.demo', '70000000001', 'AdminEkva2026!', 'Администратор', 'Системы', 'admin'],
    ['manager@ekvaline.demo', '70000000002', 'ManagerEkva2026!', 'Менеджер', 'Контента', 'manager'],
    ['operator@ekvaline.demo', '70000000003', 'OperatorEkva2026!', 'Оператор', 'Линии', 'operator'],
  ];

  for (const s of staff) {
    await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()::text)`,
      [s[0], s[1], bcrypt.hashSync(s[2], rounds), s[3], s[4], s[5]]
    );
  }

  const catWater = (await pool.query('INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING id', ['Вода в бутылях', 'Питьевая вода'])).rows[0].id;
  const catAcc = (await pool.query('INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING id', ['Аксессуары', 'Крышки, помпы'])).rows[0].id;
  const catEq = (await pool.query('INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING id', ['Оборудование', 'Кулеры и прочее'])).rows[0].id;

  await pool.query(
    `INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order)
     VALUES
     ($1,'ЭкваЛайн 19 л','Классическая бутыль для кулера',220,19,120,1),
     ($1,'ЭкваЛайн 11 л','Компактный формат',180,11,80,2),
     ($2,'Помпа механическая','Универсальная помпа',350,NULL,40,1),
     ($3,'Кулер напольный','С охлаждением и нагревом',8900,NULL,5,1)`,
    [catWater, catAcc, catEq]
  );

  await pool.query(
    `INSERT INTO delivery_zones (name, tariff, bounds_json) VALUES
     ('Центр',0,'{}'),('Степной',150,'{}'),('Доп. зона',250,'{}')
     ON CONFLICT (name) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES
     ('workLine',$1),
     ('deliverySlots',$2),
     ('communityIntro',$3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [
      'Пн–Сб 8:00–21:00, Вс 9:00–18:00',
      JSON.stringify(['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00']),
      'Новости, советы о воде и здоровом образе жизни от ЭкваЛайн.',
    ]
  );
}

async function ensureDefaultDeliveryAddresses(pool) {
  const row = await pool.query('SELECT COUNT(*)::int AS c FROM delivery_addresses');
  if (row.rows[0].c > 0) return;
  const defaults = [
    ['Центр — ул. Чкалова', 'Оренбург, ул. Чкалова, д. 15', 10],
    ['Степной — Салмышская', 'Оренбург, ул. Салмышская, д. 42', 20],
    ['Окраина — Ростоши', 'Оренбург, мкр. Ростоши-1, д. 8', 30],
    ['Доп. зона — Подгород', 'Оренбург, пос. Подгородный, ул. Южная, д. 3', 40],
  ];
  for (const d of defaults) {
    await pool.query(
      'INSERT INTO delivery_addresses (label, address_line, sort_order, active, notes) VALUES ($1,$2,$3,1,\'\')',
      d
    );
  }
}

async function ensureExtendedCatalog(pool) {
  const rows = [
    ['Электрическая помпа Smart', 1800, null, 25, 10, 'Аксессуары'],
    ['Упаковка воды 0.5л (12 шт)', 540, 0.5, 80, 11, 'Вода в бутылях'],
    ['Напольный кулер AquaOS', 12500, null, 5, 11, 'Оборудование'],
    ['Лимонный инфуз 1.5л', 280, 1.5, 100, 12, 'Вода в бутылях'],
    ['Стеклянная бутылка Eco', 950, null, 40, 13, 'Аксессуары'],
    ['Luxury Water Obsidian', 1500, null, 30, 14, 'Вода в бутылях'],
  ];
  for (const r of rows) {
    const ex = await pool.query('SELECT id FROM products WHERE name = $1', [r[0]]);
    if (ex.rowCount > 0) continue;
    const cat = await pool.query('SELECT id FROM categories WHERE name = $1', [r[5]]);
    if (!cat.rowCount) continue;
    await pool.query(
      `INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order, hidden)
       VALUES ($1,$2,'',$3,$4,$5,$6,0)`,
      [cat.rows[0].id, r[0], r[1], r[2], r[3], r[4]]
    );
  }
}

let singleton;

function openDatabase() {
  if (singleton) return singleton;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  singleton = new PgDatabase(pool);
  return singleton;
}

module.exports = { openDatabase };
