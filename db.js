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
    /** У таблиц без столбца id (например site_settings) RETURNING id ломает INSERT в PostgreSQL. */
    if (isInsert && !/\breturning\b/i.test(text)) {
      text = `${text} RETURNING *`;
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
    await migrateDemoStaffEmails(this.pool);
    await seedIfEmpty(this.pool);
    await ensureDefaultDeliveryAddresses(this.pool);
    await ensureDeliveryAddressesBackfillZoneId(this.pool);
    await ensureExtendedCatalog(this.pool);
    await ensureDemoClientUser(this.pool);
    await ensureDemoOperatorOrders(this.pool);
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
  await ensureUsersRegisterColumns(pool);
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
  await ensureOrderAuditEvents(pool);
  await ensureIdentityDefault(pool, 'order_audit_events');
  await ensureUserDriverRouteLabel(pool);
  await ensureOrdersZoneForeignKey(pool);
  await ensureDeliveryAddressesZoneForeignKey(pool);
  await ensureLegacyClientsOrdersFk(pool);
  await ensureDeclarativeForeignKeysPublic(pool);
  await ensurePublicRussianTableComments(pool);
}

/** Метка в учётке водителя = точное совпадение с полем orders.driver из панели оператора. */
async function ensureUserDriverRouteLabel(pool) {
  await ensureColumnExists(pool, 'users', 'driver_route_label', 'TEXT');
}

/**
 * Связка заказа со справочником зон: orders.zone было свободным текстом без FK —
 * диаграмма ER и целостность в СУБД требуют явной ссылки на delivery_zones(name).
 */

/** Postgres требует UNIQUE/PRIMARY именно по ссылаемым столбцам; старый delivery_zones часто без UNIQUE(name) → 42830. */
async function ensureDeliveryZonesNameUnique(pool) {
  if (!(await pgTableExists(pool, 'delivery_zones'))) return false;
  const chk = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      INNER JOIN pg_class t ON c.conrelid = t.oid
      INNER JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
      INNER JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey) AND NOT a.attisdropped
      WHERE t.relname = 'delivery_zones'
        AND c.contype IN ('u', 'p')
        AND cardinality(c.conkey) = 1
        AND a.attname = 'name'
    ) AS ex
  `);
  if (chk.rows[0] && chk.rows[0].ex) return true;

  try {
    await pool.query(`ALTER TABLE delivery_zones ADD CONSTRAINT delivery_zones_name_uq UNIQUE (name)`);
    return true;
  } catch (e) {
    const code = e && e.code;
    if (code === '42P07' || code === '42710' || /already exists/i.test(String(e.message || ''))) return true;
    if (code === '23505') {
      console.warn(
        '[db] UNIQUE(delivery_zones.name): в таблице есть дубликаты name — удалите повторные строки вручную.'
      );
      return false;
    }
    console.warn('[db] delivery_zones UNIQUE(name):', e && e.message);
    return false;
  }
}

async function ensureOrdersZoneForeignKey(pool) {
  /** Без ON CONFLICT: в старых БД у delivery_zones может не быть UNIQUE(name) — тогда 42P10 и падает вся инициализация (в т.ч. регистрация). */
  await pool.query(`
    INSERT INTO delivery_zones (name, tariff, bounds_json)
    SELECT DISTINCT trim(o.zone), 0, '{}'
    FROM orders o
    WHERE o.zone IS NOT NULL AND trim(o.zone) <> ''
      AND NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.name = trim(o.zone))
  `);
  await pool.query(`UPDATE orders SET zone = NULL WHERE zone IS NOT NULL AND trim(zone) = ''`);
  await pool.query(`UPDATE orders SET zone = trim(zone) WHERE zone IS NOT NULL`);
  await pool.query(`
    UPDATE orders o
    SET zone = NULL
    WHERE o.zone IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.name = o.zone)
  `);

  if (!(await ensureDeliveryZonesNameUnique(pool))) {
    console.warn('[db] Пропуск orders_zone_fkey: на delivery_zones(name) нужен UNIQUE без дубликатов.');
    return;
  }

  const fk = await pool.query(
    `SELECT c.conname
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND c.contype = 'f'
       AND t.relname = 'orders'
       AND c.conname = 'orders_zone_fkey'`
  );
  if (fk.rowCount > 0) return;
  await pool.query(`
    ALTER TABLE orders
      ADD CONSTRAINT orders_zone_fkey
      FOREIGN KEY (zone) REFERENCES delivery_zones (name)
      ON DELETE SET NULL
  `  ).catch(async (err) => {
    if (err && err.code === '23503') {
      await pool.query(`
        UPDATE orders o
        SET zone = NULL
        WHERE o.zone IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.name = o.zone)
      `).catch(() => {});
      await pool.query(`
        ALTER TABLE orders
          ADD CONSTRAINT orders_zone_fkey
          FOREIGN KEY (zone) REFERENCES delivery_zones (name)
          ON DELETE SET NULL
      `);
      return;
    }
    if (err && err.code === '42830') {
      console.warn(
        '[db] orders_zone_fkey не добавлен: на delivery_zones(name) должно быть уникальное ограничение.',
        err.detail || ''
      );
      return;
    }
    throw err;
  });
}

async function ensureOrderAuditEvents(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_audit_events (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool
    .query(`CREATE INDEX IF NOT EXISTS idx_order_audit_events_created ON order_audit_events (created_at DESC)`)
    .catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_audit_events_order ON order_audit_events (order_id)`).catch(() => {});
}

/** Колонка zone_id + FK к delivery_zones для пресетов адресов доставки (связь в ERD с зонами). */
async function ensureDeliveryAddressesZoneForeignKey(pool) {
  await ensureColumnExists(pool, 'delivery_addresses', 'zone_id', 'INTEGER');
  await pool
    .query(
      `UPDATE delivery_addresses da SET zone_id = NULL
       WHERE zone_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.id = da.zone_id)`
    )
    .catch(() => {});
  const fk = await pool.query(
    `SELECT c.conname
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND c.contype = 'f'
       AND t.relname = 'delivery_addresses'
       AND c.conname = 'delivery_addresses_zone_id_fkey'`
  );
  if (fk.rowCount > 0) return;
  await pool
    .query(
      `ALTER TABLE delivery_addresses
        ADD CONSTRAINT delivery_addresses_zone_id_fkey
        FOREIGN KEY (zone_id) REFERENCES delivery_zones (id)
        ON DELETE SET NULL`
    )
    .catch(() => {});
}

/**
 * Подбор zone_id по совпадению названия зоны с началом метки («Центр — …», «Доп. зона — …»).
 * Вызывать после insert пресетов и заполнения delivery_zones.
 */
async function ensureDeliveryAddressesBackfillZoneId(pool) {
  await pool
    .query(
      `
    UPDATE delivery_addresses da
    SET zone_id = dz.id
    FROM delivery_zones dz
    WHERE da.zone_id IS NULL
      AND dz.name <> ''
      AND strpos(da.label, dz.name) = 1
      AND substring(da.label FROM char_length(dz.name) + 1) ~ '^[[:space:]]*[—–-]'
  `
    )
    .catch(() => {});
}

/**
 * Если остался легаси init-postgres (таблица clients и колонка orders.client_id) — включаем FK.
 * Рабочее приложение опирается на orders.user_id; client_id может быть пустым.
 */
async function ensureLegacyClientsOrdersFk(pool) {
  const clientsTbl = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'clients'`
  );
  if (!clientsTbl.rowCount) return;
  await ensureColumnExists(pool, 'orders', 'client_id', 'INTEGER');
  await pool
    .query(
      `UPDATE orders SET client_id = NULL
       WHERE client_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = orders.client_id)`
    )
    .catch(() => {});
  const fk = await pool.query(
    `SELECT c.conname
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND c.contype = 'f'
       AND t.relname = 'orders'
       AND c.conname = 'orders_client_id_fkey'`
  );
  if (fk.rowCount > 0) return;
  await pool
    .query(
      `ALTER TABLE orders
        ADD CONSTRAINT orders_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON DELETE SET NULL`
    )
    .catch(() => {});
}

async function pgTableExists(pool, tableName) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return r.rowCount > 0;
}

async function pgColumnExists(pool, tableName, columnName) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  );
  return r.rowCount > 0;
}

/** Одностолбцовый FK: есть ли уже связь child(col) → parent. */
async function publicForeignKeyExists(pool, childTable, childColumn, parentTable) {
  const r = await pool.query(
    `
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid AND rel.relkind = 'r'
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord) ON TRUE
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum AND NOT a.attisdropped
    JOIN pg_class frel ON frel.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = frel.relnamespace
    WHERE n.nspname = 'public' AND fn.nspname = 'public'
      AND c.contype = 'f'
      AND rel.relname = $1
      AND a.attname = $2
      AND frel.relname = $3
    LIMIT 1`,
    [childTable, childColumn, parentTable]
  );
  return r.rowCount > 0;
}

async function tryAddForeignKey(pool, sql, label) {
  try {
    await pool.query(sql);
  } catch (e) {
    if (e && (e.code === '42710' || /already exists/i.test(String(e.message || '')))) return;
    if (e && e.code === '23503') {
      console.warn(`[db] FK ${label}: нарушена ссылочная целостность (${e.detail || e.message}). Очистите «битые» строки вручную.`);
      return;
    }
    console.warn(`[db] FK ${label}:`, e.message || e);
  }
}

/**
 * Если таблицы созданы без REFERENCES (старый импорт / ручное DDL), добавляем FK —
 * pgAdmin ERD показывает линии только при реальных ограничениях в БД.
 */
async function ensureDeclarativeForeignKeysPublic(pool) {
  if ((await pgTableExists(pool, 'orders')) && (await pgColumnExists(pool, 'orders', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'orders', 'user_id', 'users');
    if (!has) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM orders o
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id)`);
      if (bad.rows[0].n === 0) {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey
           FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE`,
          'orders.user_id→users'
        );
      } else {
        console.warn(`[db] Пропуск FK orders→users: ${bad.rows[0].n} заказов с несуществующим user_id.`);
      }
    }
  }

  if ((await pgTableExists(pool, 'products')) && (await pgColumnExists(pool, 'products', 'category_id'))) {
    const has = await publicForeignKeyExists(pool, 'products', 'category_id', 'categories');
    if (!has) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM products p
        WHERE p.category_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id)`);
      if (bad.rows[0].n > 0) {
        console.warn(`[db] Пропуск FK products→categories: ${bad.rows[0].n} товаров с несуществующей category_id.`);
      } else {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE products ADD CONSTRAINT products_category_id_fkey
           FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT`,
          'products.category_id→categories'
        );
      }
    }
  }

  if ((await pgTableExists(pool, 'bonus_operations')) && (await pgColumnExists(pool, 'bonus_operations', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'bonus_operations', 'user_id', 'users');
    if (!has) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM bonus_operations b
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.user_id)`);
      if (bad.rows[0].n > 0) {
        console.warn(`[db] Пропуск FK bonus_operations→users: ${bad.rows[0].n} строк с несуществующим user_id.`);
      } else {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE bonus_operations ADD CONSTRAINT bonus_operations_user_id_fkey
           FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE`,
          'bonus_operations.user_id→users'
        );
      }
    }
  }

  if ((await pgTableExists(pool, 'feedback_messages')) && (await pgColumnExists(pool, 'feedback_messages', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'feedback_messages', 'user_id', 'users');
    if (!has) {
      await pool.query(`
        UPDATE feedback_messages SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = feedback_messages.user_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE feedback_messages ADD CONSTRAINT feedback_messages_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL`,
        'feedback_messages.user_id→users'
      );
    }
  }

  if ((await pgTableExists(pool, 'audit_log')) && (await pgColumnExists(pool, 'audit_log', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'audit_log', 'user_id', 'users');
    if (!has) {
      await pool.query(`
        UPDATE audit_log SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = audit_log.user_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL`,
        'audit_log.user_id→users'
      );
    }
  }

  if ((await pgTableExists(pool, 'subscriptions')) && (await pgColumnExists(pool, 'subscriptions', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'subscriptions', 'user_id', 'users');
    if (!has) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM subscriptions s
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)`);
      if (bad.rows[0].n > 0) {
        console.warn(`[db] Пропуск FK subscriptions→users: ${bad.rows[0].n} строк с несуществующим user_id.`);
      } else {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
           FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE`,
          'subscriptions.user_id→users'
        );
      }
    }
  }

  if (
    (await pgTableExists(pool, 'orders')) &&
    (await pgColumnExists(pool, 'orders', 'address_id')) &&
    (await pgTableExists(pool, 'delivery_addresses'))
  ) {
    const has = await publicForeignKeyExists(pool, 'orders', 'address_id', 'delivery_addresses');
    if (!has) {
      await pool.query(`
        UPDATE orders SET address_id = NULL
        WHERE address_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM delivery_addresses d WHERE d.id = orders.address_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE orders ADD CONSTRAINT orders_address_id_fkey
         FOREIGN KEY (address_id) REFERENCES delivery_addresses (id) ON DELETE SET NULL`,
        'orders.address_id→delivery_addresses'
      );
    }
  }

  if (
    (await pgTableExists(pool, 'orders')) &&
    (await pgColumnExists(pool, 'orders', 'delivery_zone_id')) &&
    (await pgTableExists(pool, 'delivery_zones'))
  ) {
    const has = await publicForeignKeyExists(pool, 'orders', 'delivery_zone_id', 'delivery_zones');
    if (!has) {
      await pool.query(`
        UPDATE orders SET delivery_zone_id = NULL
        WHERE delivery_zone_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM delivery_zones z WHERE z.id = orders.delivery_zone_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE orders ADD CONSTRAINT orders_delivery_zone_id_fkey
         FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones (id) ON DELETE SET NULL`,
        'orders.delivery_zone_id→delivery_zones'
      );
    }
  }

  if ((await pgTableExists(pool, 'reviews')) && (await pgColumnExists(pool, 'reviews', 'product_id'))) {
    const has = await publicForeignKeyExists(pool, 'reviews', 'product_id', 'products');
    if (!has && (await pgTableExists(pool, 'products'))) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM reviews r
        WHERE r.product_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = r.product_id)`);
      if (bad.rows[0].n > 0) {
        console.warn(`[db] Пропуск FK reviews→products: «битых» ссылок: ${bad.rows[0].n}.`);
      } else {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_fkey
           FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE`,
          'reviews.product_id→products'
        );
      }
    }
  }

  if ((await pgTableExists(pool, 'reviews')) && (await pgColumnExists(pool, 'reviews', 'client_id'))) {
    if (await pgTableExists(pool, 'clients')) {
      const has = await publicForeignKeyExists(pool, 'reviews', 'client_id', 'clients');
      if (!has) {
        await pool.query(`
          UPDATE reviews SET client_id = NULL
          WHERE client_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM clients cl WHERE cl.id = reviews.client_id)`).catch(() => {});
        await tryAddForeignKey(
          pool,
          `ALTER TABLE reviews ADD CONSTRAINT reviews_client_id_fkey
           FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL`,
          'reviews.client_id→clients'
        );
      }
    } else if (await pgTableExists(pool, 'users')) {
      const has = await publicForeignKeyExists(pool, 'reviews', 'client_id', 'users');
      if (!has) {
        await pool.query(`
          UPDATE reviews SET client_id = NULL
          WHERE client_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = reviews.client_id)`).catch(() => {});
        await tryAddForeignKey(
          pool,
          `ALTER TABLE reviews ADD CONSTRAINT reviews_client_id_users_fkey
           FOREIGN KEY (client_id) REFERENCES users (id) ON DELETE SET NULL`,
          'reviews.client_id→users'
        );
      }
    }
  }

  if ((await pgTableExists(pool, 'delivery_addresses')) && (await pgColumnExists(pool, 'delivery_addresses', 'client_id'))) {
    const has = await publicForeignKeyExists(pool, 'delivery_addresses', 'client_id', 'clients');
    if (!has && (await pgTableExists(pool, 'clients'))) {
      await pool.query(`
        UPDATE delivery_addresses SET client_id = NULL
        WHERE client_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = delivery_addresses.client_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE delivery_addresses ADD CONSTRAINT delivery_addresses_client_id_fkey
         FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE`,
        'delivery_addresses.client_id→clients'
      );
    }
  }

  if ((await pgTableExists(pool, 'promocodes')) && (await pgColumnExists(pool, 'promocodes', 'created_by_user_id'))) {
    const has = await publicForeignKeyExists(pool, 'promocodes', 'created_by_user_id', 'users');
    if (!has) {
      await pool.query(`
        UPDATE promocodes SET created_by_user_id = NULL
        WHERE created_by_user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = promocodes.created_by_user_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE promocodes ADD CONSTRAINT promocodes_created_by_user_id_fkey
         FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL`,
        'promocodes.created_by_user_id→users'
      );
    }
  }
  if ((await pgTableExists(pool, 'promocodes')) && (await pgColumnExists(pool, 'promocodes', 'user_id'))) {
    const has = await publicForeignKeyExists(pool, 'promocodes', 'user_id', 'users');
    if (!has) {
      await pool.query(`
        UPDATE promocodes SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = promocodes.user_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE promocodes ADD CONSTRAINT promocodes_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL`,
        'promocodes.user_id→users'
      );
    }
  }

  /** order_audit_events могли добавить без FK в сторонних скриптах */
  if ((await pgTableExists(pool, 'order_audit_events')) && (await pgColumnExists(pool, 'order_audit_events', 'order_id'))) {
    const has = await publicForeignKeyExists(pool, 'order_audit_events', 'order_id', 'orders');
    if (!has) {
      const bad = await pool.query(`
        SELECT COUNT(*)::int AS n FROM order_audit_events e
        WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = e.order_id)`);
      if (bad.rows[0].n > 0) {
        console.warn(`[db] Пропуск FK order_audit_events→orders: ${bad.rows[0].n} строк без заказа.`);
      } else {
        await tryAddForeignKey(
          pool,
          `ALTER TABLE order_audit_events ADD CONSTRAINT order_audit_events_order_id_decl_fkey
           FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE`,
          'order_audit_events.order_id→orders'
        );
      }
    }
  }
  if (
    (await pgTableExists(pool, 'order_audit_events')) &&
    (await pgColumnExists(pool, 'order_audit_events', 'actor_user_id'))
  ) {
    const has = await publicForeignKeyExists(pool, 'order_audit_events', 'actor_user_id', 'users');
    if (!has) {
      await pool.query(`
        UPDATE order_audit_events SET actor_user_id = NULL
        WHERE actor_user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = order_audit_events.actor_user_id)`).catch(() => {});
      await tryAddForeignKey(
        pool,
        `ALTER TABLE order_audit_events ADD CONSTRAINT order_audit_events_actor_user_id_fkey
         FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL`,
        'order_audit_events.actor_user_id→users'
      );
    }
  }
}

/** Русские подписи таблиц для ERD/pgAdmin; физические имена латиницей (совместимость с Node.js). */
async function ensurePublicRussianTableComments(pool) {
  const esc = (s) => String(s).replace(/'/g, "''");
  const pairs = [
    ['users', 'Пользователи'],
    ['categories', 'Категории товаров'],
    ['products', 'Товары'],
    ['orders', 'Заказы'],
    ['subscriptions', 'Подписки на доставку'],
    ['delivery_zones', 'Зоны доставки'],
    ['bonus_operations', 'Операции с бонусами'],
    ['feedback_messages', 'Сообщения обратной связи'],
    ['site_settings', 'Настройки сайта'],
    ['audit_log', 'Журнал аудита'],
    ['delivery_addresses', 'Пресеты адресов доставки'],
    ['order_audit_events', 'События по заказам (аудит)'],
  ];
  for (const [table, title] of pairs) {
    await pool.query(`COMMENT ON TABLE "${table}" IS '${esc(title)}'`).catch(() => {});
  }
  const clientsTbl = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'clients'`
  );
  if (clientsTbl.rowCount) {
    await pool.query(`COMMENT ON TABLE clients IS '${esc('Клиенты (легаси-схема)')}'`).catch(() => {});
  }
  const sessTbl = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'express_session'`
  );
  if (sessTbl.rowCount) {
    await pool
      .query(`COMMENT ON TABLE express_session IS '${esc('Сессии веб-приложения (Express/connect-pg-simple)')}'`)
      .catch(() => {});
  }
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

/** Старые БД без полного набора колонок users — иначе INSERT при регистрации падает (42P01/23502/42703). */
async function ensureUsersRegisterColumns(pool) {
  await ensureColumnExists(pool, 'users', 'first_name', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'users', 'last_name', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'users', 'patronymic', "TEXT NOT NULL DEFAULT ''");
  await ensureColumnExists(pool, 'users', 'password_changed_at', 'TEXT');
  await ensureColumnExists(pool, 'users', 'bonus_balance', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'users', 'role', "TEXT NOT NULL DEFAULT 'client'");
  await ensureColumnExists(pool, 'users', 'blocked', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'users', 'login_attempts', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(pool, 'users', 'locked_until', 'TEXT');
  await ensureColumnExists(pool, 'users', 'created_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
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

/**
 * Если БД уже создавалась со старыми демо-email (@ekvaline.mail / .demo),
 * синхронизируем их с актуальными адресами @mail.ru, чтобы вход из формы «Вход» совпадал с кодом.
 */
async function migrateDemoStaffEmails(pool) {
  const rows = [
    {
      phone: '70000000001',
      role: 'admin',
      email: 'adminekva@mail.ru',
      legacyEmails: ['admin@ekvaline.mail', 'admin@ekvaline.demo'],
    },
    {
      phone: '70000000002',
      role: 'manager',
      email: 'managerekva@mail.ru',
      legacyEmails: ['manager@ekvaline.mail', 'manager@ekvaline.demo'],
    },
    {
      phone: '70000000003',
      role: 'operator',
      email: 'operatorekva@mail.ru',
      legacyEmails: ['operator@ekvaline.mail', 'operator@ekvaline.demo'],
    },
  ];
  for (const r of rows) {
    const low = r.legacyEmails.map((x) => x.toLowerCase());
    await pool
      .query(
        `UPDATE users SET email = $1 WHERE role = $2 AND (
          phone = $3 OR lower(email) = ANY($4::text[])
        )`,
        [r.email, r.role, r.phone, low],
      )
      .catch(() => {});
  }
}

async function seedIfEmpty(pool) {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (count.rows[0].c > 0) return;

  const rounds = 12;
  const staff = [
    ['adminekva@mail.ru', '70000000001', 'AdminEkva2026!', 'Администратор', 'Системы', 'admin'],
    ['managerekva@mail.ru', '70000000002', 'ManagerEkva2026!', 'Менеджер', 'Контента', 'manager'],
    ['operatorekva@mail.ru', '70000000003', 'OperatorEkva2026!', 'Оператор', 'Линии', 'operator'],
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

  await pool.query(`
    INSERT INTO delivery_zones (name, tariff, bounds_json)
    SELECT v.name, v.tariff, v.b
    FROM (
      VALUES ('Центр'::text, 0::numeric, '{}'::text),
             ('Степной', 150, '{}'),
             ('Доп. зона', 250, '{}')
    ) AS v(name, tariff, b)
    WHERE NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.name = v.name)
  `);

  const demoDeliveryFaq = JSON.stringify([
    {
      code: 'Заявки',
      tag: 'Оператор',
      question: 'Во сколько можно принять заказ сегодня?',
      answer:
        'Прием заявок оператором: с 8:00 до 19:00. Заказы после 19:00 переносим на ближайшее доступное окно.',
    },
    {
      code: 'Интервал',
      tag: 'Квартира',
      question: 'Какие интервалы доставки доступны для частных клиентов?',
      answer: 'Для квартиры доступны окна 9:00-14:00, 14:00-17:00 и 17:00-21:00.',
    },
    {
      code: 'График',
      tag: 'Офис',
      question: 'Как оформить регулярную доставку воды для офиса?',
      answer:
        'Нужно связаться с оператором, выбрать удобные дни и интервал, после этого оператор сам проставит вам регулярные доставки.',
    },
    {
      code: 'Тара',
      tag: 'Обмен',
      question: 'Что делать с пустой тарой?',
      answer:
        'Курьер заберет пустые бутыли во время следующей доставки. Отдельно везти тару в офис не нужно.',
    },
  ]);

  const demoAboutCertificates = JSON.stringify([
    {
      image: 'assets/certificate-card.jpg',
      alt: 'Карточка предприятия',
      badge: 'Документ',
      title: 'Карточка предприятия',
      description:
        'Реквизиты организации, контакты, банковские данные и юридическая информация.',
    },
    {
      image: 'assets/certificate-eac.jpg',
      alt: 'Декларация о соответствии ЕАЭС',
      badge: 'ЕАЭС',
      title: 'Декларация о соответствии',
      description: 'Подтверждение соответствия продукции требованиям технических регламентов.',
    },
    {
      image: 'assets/certificate-lab.jpg',
      alt: 'Протокол лабораторных испытаний',
      badge: 'Лаборатория',
      title: 'Протокол испытаний',
      description: 'Результаты лабораторных проверок качества и безопасности питьевой воды.',
    },
  ]);

  const demoDeliveryCoverage = JSON.stringify({
    title: 'Зоны покрытия Оренбурга',
    cards: [
      {
        title: 'Интервалы доставки',
        text: 'Утро: 9:00-14:00, День: 14:00-17:00, Вечер: 17:00-21:00',
      },
      {
        title: 'Доставка для организаций',
        text: 'Отдельное окно: 9:00-17:00',
      },
      {
        title: 'Прием заказов',
        text: 'Оператор принимает заявки: 8:00-19:00',
      },
    ],
  });

  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES
     ('workLine',$1),
     ('deliverySlots',$2),
     ('communityIntro',$3),
     ('deliveryFaq',$4),
     ('sitePolls',$5),
     ('aboutCertificates',$6),
     ('deliveryCoverage',$7)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [
      'Пн–Сб 8:00–21:00, Вс 9:00–18:00',
      JSON.stringify(['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00']),
      'Новости, советы о воде и здоровом образе жизни от ЭкваЛайн.',
      demoDeliveryFaq,
      '[]',
      demoAboutCertificates,
      demoDeliveryCoverage,
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

/** Общедоступная демо-учётка клиента для входа (если ещё нет в таблице users). */
async function ensureDemoClientUser(pool) {
  const ex = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1) LIMIT 1', [
    'clienteekva@mail.ru',
  ]);
  if (ex.rowCount > 0) return;
  const rounds = 12;
  try {
    await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES ($1,$2,$3,$4,$5,'client', NOW()::text)`,
      [
        'clienteekva@mail.ru',
        '79001112299',
        bcrypt.hashSync('ClientDemo2026!', rounds),
        'Демо',
        'Клиент',
      ]
    );
  } catch (e) {
    if (e && e.code === '23505') return;
    throw e;
  }
}

const DEMO_OP_ORDER_NOTE_TAG = '§demo_op';

/** Демо-заказы для панели оператора: при пустой таблице (и пока ни одного ряда с маркером демо). */
async function ensureDemoOperatorOrders(pool) {
  const demoPresent = await pool.query(
    `SELECT 1 FROM orders WHERE position($1 IN coalesce(courier_note, '')) > 0 LIMIT 1`,
    [DEMO_OP_ORDER_NOTE_TAG]
  );
  if (demoPresent.rowCount > 0) return;

  const cnt = await pool.query('SELECT COUNT(*)::int AS n FROM orders');
  if (cnt.rows[0].n > 0) return;

  const products = await pool.query(
    'SELECT id, name, price FROM products WHERE COALESCE(hidden, 0) = 0 ORDER BY id ASC LIMIT 1'
  );
  if (!products.rowCount) return;

  const price = Number(products.rows[0].price) || 220;
  const title = String(products.rows[0].name || 'Товар');
  const mkItems = (qty) =>
    JSON.stringify([{ title, qty: Number(qty), unit_price: price }]);
  /** Маркер в примечании — повторная инициализация без дубликатов. */
  function noteWithDemoTag(note) {
    const s = String(note || '').trim();
    const tag = DEMO_OP_ORDER_NOTE_TAG;
    return s ? `${s} ${tag}` : tag;
  }

  let clientId;
  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [
    'clienteekva@mail.ru',
  ]);
  if (existing.rowCount > 0) {
    clientId = existing.rows[0].id;
  } else {
    const hash = bcrypt.hashSync('ClientDemo2026!', 12);
    const ins = await pool.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES ($1,$2,$3,$4,$5,'client', NOW()::text) RETURNING id`,
      ['clienteekva@mail.ru', '79001112299', hash, 'Демо', 'Клиент']
    );
    clientId = ins.rows[0].id;
  }

  const now = new Date();
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const d0 = iso(now);
  const d1 = iso(new Date(now.getTime() + 86400000));
  const dPrev = iso(new Date(now.getTime() - 86400000));
  const slot1 = '09:00 – 14:00';
  const slot2 = '14:00 – 17:00';
  const slot3 = '17:00 – 21:00';
  const pay = 'cash';

  const rows = [
    [clientId, 'Оренбург, ул. Чкалова, д. 15', d0, slot1, 'new', pay, mkItems(2), noteWithDemoTag(''), 'Центр', null, 0, Math.round(2 * price)],
    [clientId, 'Оренбург, ул. Салмышская, д. 42', d0, slot2, 'pending_operator', pay, mkItems(1), noteWithDemoTag('Перед выездом набрать'), 'Степной', null, 0, Math.round(price)],
    /** «Обработка» на сегодня — чтобы строки были видны в фильтре «В работе» + «Сегодня». */
    [clientId, 'Оренбург, ул. Пушкинская, д. 10', d0, slot3, 'processing', pay, mkItems(2), noteWithDemoTag('Доставить до обеда'), 'Центр', 'Петров Пётр Петрович', 0, Math.round(2 * price)],
    [clientId, 'Оренбург, просп. Гагарина, д. 28', d1, slot1, 'confirmed', 'card', mkItems(3), noteWithDemoTag(''), 'Центр', 'Петров Пётр Петрович', 0, Math.round(3 * price)],
    [clientId, 'Оренбург, ул. Комсомольская, д. 5', d1, slot3, 'processing', pay, mkItems(2), noteWithDemoTag(''), 'Центр', 'Петров Пётр Петрович', 0, Math.round(2 * price)],
    [clientId, 'Оренбург, ул. Пролетарская, д. 100', d0, slot1, 'courier', pay, mkItems(1), noteWithDemoTag(''), 'Доп. зона', 'Петров Пётр Петрович', 0, Math.round(price)],
    [clientId, 'Оренбург, мкр. Ростоши-1, д. 8', d0, slot2, 'on_way', pay, mkItems(4), noteWithDemoTag('Домофон 045'), 'Окраина', 'Сидоров Сергей Сергеевич', 0, Math.round(4 * price)],
    [clientId, 'Оренбург, ул. Кирова, д. 33', dPrev, slot1, 'delivered', pay, mkItems(2), noteWithDemoTag(''), 'Центр', 'Петров Пётр Петрович', 0, Math.round(2 * price)],
    [clientId, 'Оренбург, ул. Ленина, д. 7', d0, slot3, 'cancelled', pay, mkItems(1), noteWithDemoTag(''), 'Центр', null, 0, Math.round(price)],
  ];

  const insertSql = `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method,
    bonuses_used, bonuses_earned, items_json, courier_note, zone, driver, pickup, total_sum)
    VALUES ($1,$2,$3,$4,$5,$6,0,0,$7,$8,$9,$10,$11,$12)`;
  for (const row of rows) {
    await pool.query(insertSql, row);
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

module.exports = { openDatabase, ensureDemoOperatorOrders };
