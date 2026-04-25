const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.APP_DATA_PATH || path.join(__dirname, 'data', 'app-data.json');

function nowIso() {
  return new Date().toISOString();
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveState(filePath, state) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

function baseState() {
  return {
    users: [],
    categories: [],
    products: [],
    orders: [],
    subscriptions: [],
    delivery_zones: [],
    bonus_operations: [],
    feedback_messages: [],
    site_settings: [],
    audit_log: [],
    delivery_addresses: [],
    counters: {
      users: 1,
      categories: 1,
      products: 1,
      orders: 1,
      subscriptions: 1,
      delivery_zones: 1,
      bonus_operations: 1,
      feedback_messages: 1,
      audit_log: 1,
      delivery_addresses: 1,
    },
  };
}

function nextId(state, table) {
  const id = state.counters[table] || 1;
  state.counters[table] = id + 1;
  return id;
}

function insertWithId(state, table, row) {
  const item = { id: nextId(state, table), ...row };
  state[table].push(item);
  return item;
}

function seedState(state) {
  const rounds = 12;
  const createdAt = nowIso();
  const staff = [
    {
      email: 'admin@ekvaline.demo',
      phone: '70000000001',
      pass: 'AdminEkva2026!',
      first_name: 'Администратор',
      last_name: 'Системы',
      role: 'admin',
    },
    {
      email: 'manager@ekvaline.demo',
      phone: '70000000002',
      pass: 'ManagerEkva2026!',
      first_name: 'Менеджер',
      last_name: 'Контента',
      role: 'manager',
    },
    {
      email: 'operator@ekvaline.demo',
      phone: '70000000003',
      pass: 'OperatorEkva2026!',
      first_name: 'Оператор',
      last_name: 'Линии',
      role: 'operator',
    },
  ];

  for (const s of staff) {
    insertWithId(state, 'users', {
      email: s.email,
      phone: s.phone,
      password_hash: bcrypt.hashSync(s.pass, rounds),
      first_name: s.first_name,
      last_name: s.last_name,
      patronymic: '',
      bonus_balance: 0,
      role: s.role,
      blocked: 0,
      login_attempts: 0,
      locked_until: null,
      password_changed_at: createdAt,
      created_at: createdAt,
    });
  }

  const catWater = insertWithId(state, 'categories', { name: 'Вода в бутылях', description: 'Питьевая вода' });
  const catAcc = insertWithId(state, 'categories', { name: 'Аксессуары', description: 'Крышки, помпы' });
  const catEq = insertWithId(state, 'categories', { name: 'Оборудование', description: 'Кулеры и прочее' });

  const products = [
    { category_id: catWater.id, name: 'ЭкваЛайн 19 л', description: 'Классическая бутыль для кулера', price: 220, volume_liters: 19, stock: 120, hidden: 0, sort_order: 1 },
    { category_id: catWater.id, name: 'ЭкваЛайн 11 л', description: 'Компактный формат', price: 180, volume_liters: 11, stock: 80, hidden: 0, sort_order: 2 },
    { category_id: catAcc.id, name: 'Помпа механическая', description: 'Универсальная помпа', price: 350, volume_liters: null, stock: 40, hidden: 0, sort_order: 1 },
    { category_id: catEq.id, name: 'Кулер напольный', description: 'С охлаждением и нагревом', price: 8900, volume_liters: null, stock: 5, hidden: 0, sort_order: 1 },
    { category_id: catAcc.id, name: 'Электрическая помпа Smart', description: '', price: 1800, volume_liters: null, stock: 25, hidden: 0, sort_order: 10 },
    { category_id: catWater.id, name: 'Упаковка воды 0.5л (12 шт)', description: '', price: 540, volume_liters: 0.5, stock: 80, hidden: 0, sort_order: 11 },
    { category_id: catEq.id, name: 'Напольный кулер AquaOS', description: '', price: 12500, volume_liters: null, stock: 5, hidden: 0, sort_order: 11 },
    { category_id: catWater.id, name: 'Лимонный инфуз 1.5л', description: '', price: 280, volume_liters: 1.5, stock: 100, hidden: 0, sort_order: 12 },
    { category_id: catAcc.id, name: 'Стеклянная бутылка Eco', description: '', price: 950, volume_liters: null, stock: 40, hidden: 0, sort_order: 13 },
    { category_id: catWater.id, name: 'Luxury Water Obsidian', description: '', price: 1500, volume_liters: null, stock: 30, hidden: 0, sort_order: 14 },
  ];
  for (const p of products) insertWithId(state, 'products', p);

  insertWithId(state, 'delivery_zones', { name: 'Центр', tariff: 0, bounds_json: '{}' });
  insertWithId(state, 'delivery_zones', { name: 'Степной', tariff: 150, bounds_json: '{}' });
  insertWithId(state, 'delivery_zones', { name: 'Доп. зона', tariff: 250, bounds_json: '{}' });

  state.site_settings.push({ key: 'workLine', value: 'Пн–Сб 8:00–21:00, Вс 9:00–18:00' });
  state.site_settings.push({ key: 'deliverySlots', value: JSON.stringify(['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00']) });
  state.site_settings.push({ key: 'communityIntro', value: 'Новости, советы о воде и здоровом образе жизни от ЭкваЛайн.' });

  const defaults = [
    ['Центр — ул. Чкалова', 'Оренбург, ул. Чкалова, д. 15', 10],
    ['Степной — Салмышская', 'Оренбург, ул. Салмышская, д. 42', 20],
    ['Окраина — Ростоши', 'Оренбург, мкр. Ростоши-1, д. 8', 30],
    ['Доп. зона — Подгород', 'Оренбург, пос. Подгородный, ул. Южная, д. 3', 40],
  ];
  for (const [label, address_line, sort_order] of defaults) {
    insertWithId(state, 'delivery_addresses', {
      label,
      address_line,
      sort_order,
      active: 1,
      notes: '',
      created_at: createdAt,
    });
  }
}

function loadState(filePath) {
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.users && parsed.products && parsed.counters) return parsed;
  }
  const fresh = baseState();
  seedState(fresh);
  saveState(filePath, fresh);
  return fresh;
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, ' ').trim();
}

class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = normalizeSql(sql);
  }

  get(...args) {
    return this.db._queryGet(this.sql, args);
  }

  all(...args) {
    return this.db._queryAll(this.sql, args);
  }

  run(...args) {
    return this.db._queryRun(this.sql, args);
  }
}

class JsonDatabase {
  constructor(filePath, state) {
    this.filePath = filePath;
    this.state = state;
    this.txDepth = 0;
    this.txSnapshot = null;
  }

  prepare(sql) {
    return new Statement(this, sql);
  }

  _persistIfNeeded() {
    if (this.txDepth === 0) saveState(this.filePath, this.state);
  }

  _begin() {
    if (this.txDepth === 0) this.txSnapshot = clone(this.state);
    this.txDepth += 1;
  }

  _commit() {
    this.txDepth = Math.max(0, this.txDepth - 1);
    if (this.txDepth === 0) {
      this.txSnapshot = null;
      saveState(this.filePath, this.state);
    }
  }

  _rollback() {
    if (this.txSnapshot) this.state = this.txSnapshot;
    this.txDepth = 0;
    this.txSnapshot = null;
    saveState(this.filePath, this.state);
  }

  _userById(id) {
    return this.state.users.find((u) => u.id === Number(id)) || null;
  }

  _queryGet(sql, args) {
    if (sql === 'SELECT * FROM users WHERE id = ?') return this._userById(args[0]);
    if (sql === 'SELECT * FROM users WHERE phone = ?') return this.state.users.find((u) => u.phone === String(args[0])) || null;
    if (sql === 'SELECT * FROM users WHERE email = ? COLLATE NOCASE') {
      const email = String(args[0]).toLowerCase();
      return this.state.users.find((u) => String(u.email).toLowerCase() === email) || null;
    }
    if (sql === 'SELECT value FROM site_settings WHERE key = ?') {
      const row = this.state.site_settings.find((s) => s.key === args[0]);
      return row ? { value: row.value } : undefined;
    }
    if (sql === 'SELECT id FROM users WHERE email = ? COLLATE NOCASE OR phone = ?') {
      const email = String(args[0]).toLowerCase();
      const phone = String(args[1]);
      const row = this.state.users.find((u) => String(u.email).toLowerCase() === email || u.phone === phone);
      return row ? { id: row.id } : undefined;
    }
    if (sql === 'SELECT id FROM users WHERE (email = ? COLLATE NOCASE OR phone = ?) AND id != ?') {
      const email = String(args[0]).toLowerCase();
      const phone = String(args[1]);
      const excluded = Number(args[2]);
      const row = this.state.users.find(
        (u) => u.id !== excluded && (String(u.email).toLowerCase() === email || u.phone === phone)
      );
      return row ? { id: row.id } : undefined;
    }
    if (sql === 'SELECT id, price, stock, hidden FROM products WHERE id = ?') {
      const p = this.state.products.find((r) => r.id === Number(args[0]));
      return p ? { id: p.id, price: p.price, stock: p.stock, hidden: p.hidden } : undefined;
    }
    if (sql === 'SELECT * FROM orders WHERE id = ?') {
      return this.state.orders.find((o) => o.id === Number(args[0])) || null;
    }
    if (sql === 'SELECT * FROM orders WHERE id = ? AND user_id = ?') {
      return this.state.orders.find((o) => o.id === Number(args[0]) && o.user_id === Number(args[1])) || null;
    }
    if (sql === 'SELECT IFNULL(MAX(sort_order), 0) AS m FROM delivery_addresses') {
      const max = this.state.delivery_addresses.reduce((m, r) => Math.max(m, Number(r.sort_order) || 0), 0);
      return { m: max };
    }
    if (sql === 'SELECT * FROM delivery_addresses WHERE id = ?') {
      return this.state.delivery_addresses.find((a) => a.id === Number(args[0])) || null;
    }
    if (sql === 'SELECT * FROM delivery_zones WHERE id = ?') {
      return this.state.delivery_zones.find((z) => z.id === Number(args[0])) || null;
    }
    throw new Error(`Unsupported get SQL: ${sql}`);
  }

  _queryAll(sql, args) {
    if (sql === 'SELECT id, label, address_line FROM delivery_addresses WHERE active = 1 ORDER BY sort_order ASC, id ASC') {
      return this.state.delivery_addresses
        .filter((a) => Number(a.active) === 1)
        .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
        .map((a) => ({ id: a.id, label: a.label, address_line: a.address_line }));
    }
    if (
      sql ===
      'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.hidden = 0 ORDER BY c.id, p.sort_order, p.id'
    ) {
      const catMap = new Map(this.state.categories.map((c) => [c.id, c]));
      return this.state.products
        .filter((p) => Number(p.hidden) === 0)
        .slice()
        .sort((a, b) => (a.category_id - b.category_id) || (a.sort_order - b.sort_order) || (a.id - b.id))
        .map((p) => ({ ...p, category_name: catMap.get(p.category_id)?.name || '' }));
    }
    if (sql === 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200') {
      const uid = Number(args[0]);
      return this.state.orders
        .filter((o) => o.user_id === uid)
        .slice()
        .sort((a, b) => b.id - a.id)
        .slice(0, 200);
    }
    if (
      sql ===
      'SELECT o.*, u.email, u.phone, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 5000'
    ) {
      const users = new Map(this.state.users.map((u) => [u.id, u]));
      return this.state.orders
        .slice()
        .sort((a, b) => b.id - a.id)
        .slice(0, 5000)
        .map((o) => {
          const u = users.get(o.user_id) || {};
          return {
            ...o,
            email: u.email || '',
            phone: u.phone || '',
            first_name: u.first_name || '',
            last_name: u.last_name || '',
          };
        });
    }
    if (
      sql ===
      'SELECT id, email, phone, first_name, last_name, patronymic, role, blocked, bonus_balance, created_at, login_attempts, locked_until FROM users ORDER BY id DESC LIMIT 2000'
    ) {
      return this.state.users
        .slice()
        .sort((a, b) => b.id - a.id)
        .slice(0, 2000)
        .map((u) => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          first_name: u.first_name,
          last_name: u.last_name,
          patronymic: u.patronymic,
          role: u.role,
          blocked: u.blocked,
          bonus_balance: u.bonus_balance,
          created_at: u.created_at,
          login_attempts: u.login_attempts,
          locked_until: u.locked_until,
        }));
    }
    if (sql === 'SELECT * FROM delivery_addresses ORDER BY sort_order ASC, id ASC') {
      return this.state.delivery_addresses
        .slice()
        .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
    }
    if (sql === 'SELECT * FROM delivery_zones ORDER BY id ASC') {
      return this.state.delivery_zones.slice().sort((a, b) => a.id - b.id);
    }
    if (
      sql ===
      'SELECT f.id, f.user_id, f.name, f.phone, f.message, f.created_at, u.email AS user_email FROM feedback_messages f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.id DESC LIMIT 300'
    ) {
      const users = new Map(this.state.users.map((u) => [u.id, u]));
      return this.state.feedback_messages
        .slice()
        .sort((a, b) => b.id - a.id)
        .slice(0, 300)
        .map((m) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.name,
          phone: m.phone,
          message: m.message,
          created_at: m.created_at,
          user_email: m.user_id ? users.get(m.user_id)?.email || null : null,
        }));
    }
    throw new Error(`Unsupported all SQL: ${sql}`);
  }

  _queryRun(sql, args) {
    if (sql === 'INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)') {
      const row = insertWithId(this.state, 'audit_log', {
        user_id: args[0] == null ? null : Number(args[0]),
        action: String(args[1] || ''),
        detail: String(args[2] || ''),
        ip: String(args[3] || ''),
        created_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (sql === 'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?') {
      const u = this._userById(args[2]);
      if (!u) return { changes: 0 };
      u.login_attempts = Number(args[0]) || 0;
      u.locked_until = args[1] == null ? null : String(args[1]);
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?') {
      const u = this._userById(args[0]);
      if (!u) return { changes: 0 };
      u.login_attempts = 0;
      u.locked_until = null;
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (
      sql ===
      "INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at) VALUES (?, ?, ?, ?, ?, 'client', datetime('now'))"
    ) {
      const row = insertWithId(this.state, 'users', {
        email: String(args[0]),
        phone: String(args[1]),
        password_hash: String(args[2]),
        first_name: String(args[3]),
        last_name: String(args[4] || ''),
        patronymic: '',
        bonus_balance: 0,
        role: 'client',
        blocked: 0,
        login_attempts: 0,
        locked_until: null,
        password_changed_at: nowIso(),
        created_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (sql === 'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?') {
      const u = this._userById(args[4]);
      if (!u) return { changes: 0 };
      u.first_name = String(args[0]);
      u.last_name = String(args[1] || '');
      u.email = String(args[2]);
      u.phone = String(args[3]);
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'INSERT INTO feedback_messages (user_id, name, phone, message) VALUES (?, ?, ?, ?)') {
      const row = insertWithId(this.state, 'feedback_messages', {
        user_id: args[0] == null ? null : Number(args[0]),
        name: String(args[1] || ''),
        phone: String(args[2] || ''),
        message: String(args[3] || ''),
        created_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (
      sql ===
      "INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method, bonuses_used, bonuses_earned, items_json) VALUES (?, ?, ?, ?, 'processing', ?, ?, ?, ?)"
    ) {
      const row = insertWithId(this.state, 'orders', {
        user_id: Number(args[0]),
        address: String(args[1]),
        delivery_date: String(args[2]),
        delivery_slot: String(args[3]),
        status: 'processing',
        payment_method: String(args[4]),
        bonuses_used: Number(args[5]) || 0,
        bonuses_earned: Number(args[6]) || 0,
        items_json: String(args[7] || ''),
        courier_note: '',
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (sql === 'UPDATE products SET stock = stock - ? WHERE id = ?') {
      const p = this.state.products.find((x) => x.id === Number(args[1]));
      if (!p) return { changes: 0 };
      p.stock = Math.max(0, Number(p.stock) - (Number(args[0]) || 0));
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'UPDATE users SET bonus_balance = bonus_balance - ? WHERE id = ?') {
      const u = this._userById(args[1]);
      if (!u) return { changes: 0 };
      u.bonus_balance = Math.max(0, Number(u.bonus_balance) - (Number(args[0]) || 0));
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?') {
      const u = this._userById(args[1]);
      if (!u) return { changes: 0 };
      u.bonus_balance = Number(u.bonus_balance) + (Number(args[0]) || 0);
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'INSERT INTO bonus_operations (user_id, type, amount, description) VALUES (?, ?, ?, ?)') {
      const row = insertWithId(this.state, 'bonus_operations', {
        user_id: Number(args[0]),
        type: String(args[1]),
        amount: Number(args[2]) || 0,
        description: String(args[3] || ''),
        created_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (sql === "UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?") {
      const o = this.state.orders.find((x) => x.id === Number(args[0]));
      if (!o) return { changes: 0 };
      o.status = 'cancelled';
      o.updated_at = nowIso();
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?") {
      const o = this.state.orders.find((x) => x.id === Number(args[1]));
      if (!o) return { changes: 0 };
      o.status = String(args[0]);
      o.updated_at = nowIso();
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === "UPDATE orders SET courier_note = ?, updated_at = datetime('now') WHERE id = ?") {
      const o = this.state.orders.find((x) => x.id === Number(args[1]));
      if (!o) return { changes: 0 };
      o.courier_note = String(args[0] || '');
      o.updated_at = nowIso();
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql.startsWith('UPDATE orders SET ') && sql.endsWith(" WHERE id = ?")) {
      const id = Number(args[args.length - 1]);
      const o = this.state.orders.find((x) => x.id === id);
      if (!o) return { changes: 0 };
      const setClause = sql.slice('UPDATE orders SET '.length, sql.lastIndexOf(' WHERE id = ?'));
      const chunks = setClause.split(',').map((s) => s.trim());
      let argIndex = 0;
      for (const c of chunks) {
        if (c.endsWith('= ?')) {
          const field = c.split('=')[0].trim();
          o[field] = args[argIndex];
          argIndex += 1;
        } else if (c === "updated_at = datetime('now')") {
          o.updated_at = nowIso();
        }
      }
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'UPDATE users SET role = ? WHERE id = ?') {
      const u = this._userById(args[1]);
      if (!u) return { changes: 0 };
      u.role = String(args[0]);
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'UPDATE users SET blocked = ? WHERE id = ?') {
      const u = this._userById(args[1]);
      if (!u) return { changes: 0 };
      u.blocked = Number(args[0]) ? 1 : 0;
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)') {
      const key = String(args[0]);
      const value = String(args[1]);
      const current = this.state.site_settings.find((r) => r.key === key);
      if (current) {
        current.value = value;
      } else {
        this.state.site_settings.push({ key, value });
      }
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'INSERT INTO delivery_addresses (label, address_line, sort_order, active, notes) VALUES (?, ?, ?, ?, ?)') {
      const row = insertWithId(this.state, 'delivery_addresses', {
        label: String(args[0]),
        address_line: String(args[1]),
        sort_order: Number(args[2]) || 0,
        active: Number(args[3]) ? 1 : 0,
        notes: String(args[4] || ''),
        created_at: nowIso(),
      });
      this._persistIfNeeded();
      return { lastInsertRowid: row.id, changes: 1 };
    }

    if (sql === 'UPDATE delivery_addresses SET label = ?, address_line = ?, sort_order = ?, active = ?, notes = ? WHERE id = ?') {
      const row = this.state.delivery_addresses.find((a) => a.id === Number(args[5]));
      if (!row) return { changes: 0 };
      row.label = String(args[0]);
      row.address_line = String(args[1]);
      row.sort_order = Number(args[2]) || 0;
      row.active = Number(args[3]) ? 1 : 0;
      row.notes = String(args[4] || '');
      this._persistIfNeeded();
      return { changes: 1 };
    }

    if (sql === 'DELETE FROM delivery_addresses WHERE id = ?') {
      const id = Number(args[0]);
      const before = this.state.delivery_addresses.length;
      this.state.delivery_addresses = this.state.delivery_addresses.filter((a) => a.id !== id);
      const changes = before - this.state.delivery_addresses.length;
      this._persistIfNeeded();
      return { changes };
    }

    if (sql === 'UPDATE delivery_zones SET name = ?, tariff = ?, bounds_json = ? WHERE id = ?') {
      const zone = this.state.delivery_zones.find((z) => z.id === Number(args[3]));
      if (!zone) return { changes: 0 };
      zone.name = String(args[0]);
      zone.tariff = Number(args[1]) || 0;
      zone.bounds_json = String(args[2] || '{}');
      this._persistIfNeeded();
      return { changes: 1 };
    }

    throw new Error(`Unsupported run SQL: ${sql}`);
  }
}

function runTransaction(db, fn) {
  db._begin();
  try {
    const out = fn();
    db._commit();
    return out;
  } catch (err) {
    db._rollback();
    throw err;
  }
}

function openDatabase() {
  const state = loadState(DATA_PATH);
  return new JsonDatabase(DATA_PATH, state);
}

module.exports = { openDatabase, runTransaction, DATA_PATH };
const { DatabaseSync } = require('node:sqlite');
// Reuse bcrypt, path and fs from the top-level imports.

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'data', 'ekvaline.sqlite');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Транзакция (аналог better-sqlite3). */
function runTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  }
}

function migrate(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      patronymic TEXT NOT NULL DEFAULT '',
      bonus_balance INTEGER NOT NULL DEFAULT 0 CHECK (bonus_balance >= 0),
      role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client','operator','manager','admin')),
      blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0,1)),
      login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (login_attempts >= 0),
      locked_until TEXT,
      password_changed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL CHECK (price >= 0),
      volume_liters REAL,
      photo_path TEXT,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0,1)),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      delivery_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN (
        'processing','confirmed','courier','on_way','delivered','cancelled'
      )),
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','bonuses')),
      bonuses_used INTEGER NOT NULL DEFAULT 0 CHECK (bonuses_used >= 0),
      bonuses_earned INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      courier_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      next_delivery_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      tariff REAL NOT NULL DEFAULT 0 CHECK (tariff >= 0),
      bounds_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS bonus_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('accrual','spend','adjust')),
      amount INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bonus_user ON bonus_operations(user_id);

    CREATE TABLE IF NOT EXISTS feedback_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS delivery_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      address_line TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_delivery_addr_active ON delivery_addresses(active, sort_order);
  `);
}

/** Справочные адреса для оформления заказа (пустая таблица после миграции у существующих БД). */
function ensureDefaultDeliveryAddresses(db) {
  try {
    const row = db.prepare('SELECT COUNT(*) AS c FROM delivery_addresses').get();
    if (row.c > 0) return;
    const ins = db.prepare(`
      INSERT INTO delivery_addresses (label, address_line, sort_order, active, notes)
      VALUES (?, ?, ?, 1, '')
    `);
    const defaults = [
      ['Центр — ул. Чкалова', 'Оренбург, ул. Чкалова, д. 15', 10],
      ['Степной — Салмышская', 'Оренбург, ул. Салмышская, д. 42', 20],
      ['Окраина — Ростоши', 'Оренбург, мкр. Ростоши-1, д. 8', 30],
      ['Доп. зона — Подгород', 'Оренбург, пос. Подгородный, ул. Южная, д. 3', 40],
    ];
    for (const [label, line, ord] of defaults) ins.run(label, line, ord);
  } catch {
    /* ignore */
  }
}

function seedIfEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (row.c > 0) return;

  const rounds = 12;
  const staff = [
    {
      email: 'admin@ekvaline.demo',
      phone: '70000000001',
      pass: 'AdminEkva2026!',
      first_name: 'Администратор',
      last_name: 'Системы',
      role: 'admin',
    },
    {
      email: 'manager@ekvaline.demo',
      phone: '70000000002',
      pass: 'ManagerEkva2026!',
      first_name: 'Менеджер',
      last_name: 'Контента',
      role: 'manager',
    },
    {
      email: 'operator@ekvaline.demo',
      phone: '70000000003',
      pass: 'OperatorEkva2026!',
      first_name: 'Оператор',
      last_name: 'Линии',
      role: 'operator',
    },
  ];

  const insUser = db.prepare(`
    INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  runTransaction(db, () => {
    for (const s of staff) {
      insUser.run(
        s.email,
        s.phone,
        bcrypt.hashSync(s.pass, rounds),
        s.first_name,
        s.last_name,
        s.role
      );
    }

    const catWater = db
      .prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
      .run('Вода в бутылях', 'Питьевая вода').lastInsertRowid;
    const catAcc = db
      .prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
      .run('Аксессуары', 'Крышки, помпы').lastInsertRowid;
    const catEq = db
      .prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
      .run('Оборудование', 'Кулеры и прочее').lastInsertRowid;

    const insP = db.prepare(`
      INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insP.run(catWater, 'ЭкваЛайн 19 л', 'Классическая бутыль для кулера', 220, 19, 120, 1);
    insP.run(catWater, 'ЭкваЛайн 11 л', 'Компактный формат', 180, 11, 80, 2);
    insP.run(catAcc, 'Помпа механическая', 'Универсальная помпа', 350, null, 40, 1);
    insP.run(catEq, 'Кулер напольный', 'С охлаждением и нагревом', 8900, null, 5, 1);

    db.prepare('INSERT INTO delivery_zones (name, tariff, bounds_json) VALUES (?, ?, ?)').run('Центр', 0, '{}');
    db.prepare('INSERT INTO delivery_zones (name, tariff, bounds_json) VALUES (?, ?, ?)').run('Степной', 150, '{}');
    db.prepare('INSERT INTO delivery_zones (name, tariff, bounds_json) VALUES (?, ?, ?)').run('Доп. зона', 250, '{}');

    const settings = {
      workLine: 'Пн–Сб 8:00–21:00, Вс 9:00–18:00',
      deliverySlots: JSON.stringify(['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00']),
      communityIntro: 'Новости, советы о воде и здоровом образе жизни от ЭкваЛайн.',
    };
    const insS = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
    insS.run('workLine', settings.workLine);
    insS.run('deliverySlots', settings.deliverySlots);
    insS.run('communityIntro', settings.communityIntro);
  });

  // eslint-disable-next-line no-console
  console.log('[db] Созданы учётные записи персонала (см. вывод при старте сервера).');
}

/** Позиции каталога с сайта (если ещё нет в БД) — для оформления заказа в ЛК. */
function ensureExtendedCatalog(db) {
  try {
    const cat = (name) => db.prepare('SELECT id FROM categories WHERE name = ?').get(name)?.id;
    const catWater = cat('Вода в бутылях');
    const catAcc = cat('Аксессуары');
    const catEq = cat('Оборудование');
    if (!catWater || !catAcc || !catEq) return;

    const ins = db.prepare(`
      INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order, hidden)
      VALUES (?, ?, '', ?, ?, ?, ?, 0)
    `);
    const rows = [
      { c: catAcc, name: 'Электрическая помпа Smart', price: 1800, vol: null, stock: 25, sort: 10 },
      { c: catWater, name: 'Упаковка воды 0.5л (12 шт)', price: 540, vol: 0.5, stock: 80, sort: 11 },
      { c: catEq, name: 'Напольный кулер AquaOS', price: 12500, vol: null, stock: 5, sort: 11 },
      { c: catWater, name: 'Лимонный инфуз 1.5л', price: 280, vol: 1.5, stock: 100, sort: 12 },
      { c: catAcc, name: 'Стеклянная бутылка Eco', price: 950, vol: null, stock: 40, sort: 13 },
      { c: catWater, name: 'Luxury Water Obsidian', price: 1500, vol: null, stock: 30, sort: 14 },
    ];
    for (const r of rows) {
      const ex = db.prepare('SELECT id FROM products WHERE name = ?').get(r.name);
      if (ex) continue;
      ins.run(r.c, r.name, r.price, r.vol, r.stock, r.sort);
    }
  } catch {
    /* ignore */
  }
}

function openDatabase() {
  ensureDir(DB_PATH);
  const db = new DatabaseSync(DB_PATH);
  migrate(db);
  seedIfEmpty(db);
  ensureDefaultDeliveryAddresses(db);
  ensureExtendedCatalog(db);
  return db;
}

module.exports = { openDatabase, DB_PATH, runTransaction };
