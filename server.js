const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Tokens = require('csrf');
const { openDatabase, runTransaction } = require('./db');
const schemas = require('./schemas');

const tokens = new Tokens();
const app = express();
const db = openDatabase();
const feedbackThrottle = new Map();

const ROOT = __dirname;
const PREFERRED_PORT = Number(process.env.PORT) || 3001;
const PORT_FALLBACK_MAX = 10;

app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    name: 'ekvaline.sid',
    secret: process.env.SESSION_SECRET || 'ekvaline-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 2 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

function audit(dbConn, userId, action, detail, ip) {
  try {
    dbConn
      .prepare('INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')
      .run(userId || null, action, detail || '', ip || '');
  } catch {
    /* ignore */
  }
}

function publicUser(row) {
  if (!row) return null;
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: name || row.first_name,
    first_name: row.first_name,
    last_name: row.last_name,
    patronymic: row.patronymic,
    role: row.role,
    bonus_balance: row.bonus_balance,
    blocked: !!row.blocked,
  };
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function normalizeCredential(cred) {
  const c = String(cred || '').trim();
  if (!c) return { kind: 'empty', value: '' };
  const digits = c.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '7') return { kind: 'phone', value: digits };
  return { kind: 'email', value: c.toLowerCase() };
}

function sanitizeFeedbackText(value) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUserByCredential(cred) {
  const n = normalizeCredential(cred);
  if (n.kind === 'phone') return db.prepare('SELECT * FROM users WHERE phone = ?').get(n.value);
  if (n.kind === 'email') return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(n.value);
  return null;
}

function isLocked(row) {
  if (!row.locked_until) return false;
  const t = new Date(row.locked_until).getTime();
  return t > Date.now();
}

function recordLoginFail(userId) {
  const u = getUserById(userId);
  if (!u) return;
  const attempts = (u.login_attempts || 0) + 1;
  let lockedUntil = u.locked_until;
  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }
  db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?').run(
    attempts,
    lockedUntil,
    userId
  );
}

function recordLoginOk(userId) {
  db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(userId);
}

function requireAuth(req, res, next) {
  const uid = req.session && req.session.userId;
  if (!uid) return res.status(401).json({ error: 'Требуется вход в систему.' });
  const user = getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.status(403).json({ error: 'Доступ запрещён.' });
  }
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Требуется вход.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Недостаточно прав.' });
    next();
  };
}

function ensureCsrfSecret(req) {
  if (!req.session.csrfSecret) req.session.csrfSecret = tokens.secretSync();
}

function csrfMiddleware(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  ensureCsrfSecret(req);
  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  if (!token || !tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ error: 'Недействительный или отсутствует CSRF-токен.' });
  }
  next();
}

app.get('/api/csrf', (req, res) => {
  ensureCsrfSecret(req);
  const csrfToken = tokens.create(req.session.csrfSecret);
  res.json({ csrfToken });
});

app.get('/api/public/settings', (req, res) => {
  const keys = ['workLine', 'deliverySlots', 'communityIntro'];
  const out = {};
  const stmt = db.prepare('SELECT value FROM site_settings WHERE key = ?');
  for (const k of keys) {
    const r = stmt.get(k);
    if (!r) continue;
    if (k === 'deliverySlots') {
      try {
        out[k] = JSON.parse(r.value);
      } catch {
        out[k] = [];
      }
    } else {
      out[k] = r.value;
    }
  }
  res.json(out);
});

app.get('/api/public/checkout-options', (req, res) => {
  let deliverySlots = ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'];
  const ds = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliverySlots');
  if (ds) {
    try {
      const parsed = JSON.parse(ds.value);
      if (Array.isArray(parsed) && parsed.length) deliverySlots = parsed;
    } catch {
      /* keep default */
    }
  }
  let addresses = [];
  try {
    addresses = db
      .prepare(
        `SELECT id, label, address_line FROM delivery_addresses WHERE active = 1 ORDER BY sort_order ASC, id ASC`
      )
      .all();
  } catch {
    addresses = [];
  }
  res.json({ deliverySlots, addresses });
});

app.get('/api/products', (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.hidden = 0 ORDER BY c.id, p.sort_order, p.id`
    )
    .all();
  res.json({ products: rows });
});

app.get('/api/auth/me', (req, res) => {
  const uid = req.session && req.session.userId;
  if (!uid) return res.json({ user: null });
  const user = getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/register', csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.registerSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone, password } = v.value;
  const exists = db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE OR phone = ?')
    .get(email, phone);
  if (exists) return res.status(409).json({ error: 'Email или телефон уже зарегистрированы.' });

  const password_hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES (?, ?, ?, ?, ?, 'client', datetime('now'))`
    )
    .run(email, phone, password_hash, first_name, last_name || '');

  const user = getUserById(info.lastInsertRowid);
  req.session.userId = user.id;
  audit(db, user.id, 'register', `email=${email}`, req.ip);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/login', csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.loginSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { credential, password } = v.value;
  const user = findUserByCredential(credential);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль.' });
  if (user.blocked) return res.status(403).json({ error: 'Учётная запись заблокирована.' });
  if (isLocked(user)) {
    return res.status(423).json({ error: 'Вход временно заблокирован после неудачных попыток. Попробуйте позже.' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    recordLoginFail(user.id);
    return res.status(401).json({ error: 'Неверный логин или пароль.' });
  }

  recordLoginOk(user.id);
  req.session.userId = user.id;
  audit(db, user.id, 'login', '', req.ip);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', csrfMiddleware, (req, res) => {
  const uid = req.session && req.session.userId;
  req.session.destroy(() => {
    if (uid) audit(db, uid, 'logout', '', req.ip);
    res.json({ ok: true });
  });
});

app.patch('/api/profile', requireAuth, csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.profileSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone } = v.value;
  const dup = db
    .prepare(
      `SELECT id FROM users WHERE (email = ? COLLATE NOCASE OR phone = ?) AND id != ?`
    )
    .get(email, phone, req.user.id);
  if (dup) return res.status(409).json({ error: 'Этот email или телефон уже заняты.' });

  db.prepare(
    `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?`
  ).run(first_name, last_name || '', email, phone, req.user.id);

  const user = getUserById(req.user.id);
  audit(db, req.user.id, 'profile_update', '', req.ip);
  res.json({ user: publicUser(user) });
});

app.post('/api/feedback', csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.feedbackSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const key = `${req.ip || 'ip'}:${String(v.value.phone || '')}`;
  const now = Date.now();
  const prev = feedbackThrottle.get(key) || 0;
  if (now - prev < 15_000) {
    return res.status(429).json({ error: 'Слишком часто. Повторите отправку через 15 секунд.' });
  }
  feedbackThrottle.set(key, now);

  const name = sanitizeFeedbackText(v.value.name);
  const phone = String(v.value.phone || '').replace(/\D/g, '');
  const message = sanitizeFeedbackText(v.value.message);
  if (name.length < 2 || phone.length !== 11 || message.length < 10) {
    return res.status(400).json({ error: 'Некорректные данные формы.' });
  }

  let userId = null;
  if (req.session && req.session.userId) userId = req.session.userId;

  db.prepare('INSERT INTO feedback_messages (user_id, name, phone, message) VALUES (?, ?, ?, ?)').run(
    userId,
    name,
    phone,
    message
  );
  audit(db, userId, 'feedback', `phone=${phone}`, req.ip);
  res.json({ ok: true });
});

app.get('/api/orders/my', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200')
    .all(req.user.id);
  res.json({ orders: rows });
});

app.post('/api/orders', requireAuth, csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.orderCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { address, delivery_date, delivery_slot, payment_method, bonuses_used, items } = v.value;

  let subtotal = 0;
  const lineItems = [];
  for (const it of items) {
    const p = db.prepare('SELECT id, price, stock, hidden FROM products WHERE id = ?').get(it.product_id);
    if (!p || p.hidden) return res.status(400).json({ error: `Товар #${it.product_id} недоступен.` });
    if (p.stock < it.qty) return res.status(400).json({ error: `Недостаточно остатка для товара #${it.product_id}.` });
    subtotal += p.price * it.qty;
    lineItems.push({ ...it, unit_price: p.price });
  }

  let bonusSpend = Math.min(bonuses_used || 0, req.user.bonus_balance, Math.floor(subtotal));
  let payable = Math.max(0, subtotal - bonusSpend);

  const earn = Math.floor(subtotal * 0.05);
  const itemsJson = JSON.stringify({ lines: lineItems, subtotal, payable, bonusSpend });

  let orderId;
  try {
    runTransaction(db, () => {
      const o = db
        .prepare(
          `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method, bonuses_used, bonuses_earned, items_json)
         VALUES (?, ?, ?, ?, 'processing', ?, ?, ?, ?)`
        )
        .run(
          req.user.id,
          address,
          delivery_date,
          delivery_slot,
          payment_method,
          bonusSpend,
          earn,
          itemsJson
        );
      orderId = o.lastInsertRowid;

      for (const it of items) {
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(it.qty, it.product_id);
      }

      if (bonusSpend > 0) {
        db.prepare('UPDATE users SET bonus_balance = bonus_balance - ? WHERE id = ?').run(bonusSpend, req.user.id);
        db.prepare(
          'INSERT INTO bonus_operations (user_id, type, amount, description) VALUES (?, ?, ?, ?)'
        ).run(req.user.id, 'spend', -bonusSpend, `Заказ #${orderId}`);
      }
      if (earn > 0) {
        db.prepare('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?').run(earn, req.user.id);
        db.prepare(
          'INSERT INTO bonus_operations (user_id, type, amount, description) VALUES (?, ?, ?, ?)'
        ).run(req.user.id, 'accrual', earn, `Начисление за заказ #${orderId}`);
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Не удалось сохранить заказ.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  audit(db, req.user.id, 'order_create', `id=${order.id}`, req.ip);
  const user = getUserById(req.user.id);
  res.json({ order, user: publicUser(user) });
});

app.get('/api/orders', requireAuth, requireRole('operator', 'manager', 'admin'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT o.*, u.email, u.phone, u.first_name, u.last_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC LIMIT 5000`
    )
    .all();
  res.json({ orders: rows });
});

app.post('/api/orders/:id/cancel', requireAuth, csrfMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
  if (!['processing', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Этот заказ уже нельзя отменить.' });
  }
  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  audit(db, req.user.id, 'order_cancel', `id=${id}`, req.ip);
  res.json({ order: db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
});

app.patch('/api/orders/:id', requireAuth, csrfMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });

  const staffRoles = ['operator', 'manager', 'admin'];
  if (staffRoles.includes(req.user.role)) {
    const v = schemas.validate(schemas.orderPatchSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const { status, courier_note } = v.value;
    if (status != null) {
      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
    }
    if (courier_note != null) {
      db.prepare('UPDATE orders SET courier_note = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
        courier_note,
        id
      );
    }
    audit(db, req.user.id, 'order_patch', `id=${id}`, req.ip);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return res.json({ order: updated });
  }

  if (order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав.' });
  }
  const v = schemas.validate(schemas.orderClientPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (!['processing', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Заказ на этой стадии нельзя изменить.' });
  }
  const { address, delivery_date, delivery_slot } = v.value;
  const parts = [];
  const vals = [];
  if (address != null) {
    parts.push('address = ?');
    vals.push(address);
  }
  if (delivery_date != null) {
    parts.push('delivery_date = ?');
    vals.push(delivery_date);
  }
  if (delivery_slot != null) {
    parts.push('delivery_slot = ?');
    vals.push(delivery_slot);
  }
  if (!parts.length) {
    return res.status(400).json({ error: 'Укажите адрес, дату или интервал доставки.' });
  }
  vals.push(id);
  db.prepare(`UPDATE orders SET ${parts.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
  audit(db, req.user.id, 'order_client_update', `id=${id}`, req.ip);
  res.json({ order: db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
});

app.get('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, email, phone, first_name, last_name, patronymic, role, blocked, bonus_balance, created_at,
              login_attempts, locked_until
       FROM users ORDER BY id DESC LIMIT 2000`
    )
    .all();
  res.json({ users: rows });
});

app.patch('/api/admin/users/:id', requireAuth, requireRole('admin'), csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.adminUserPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const targetId = Number(req.params.id);
  if (targetId === req.user.id && v.value.blocked === 1) {
    return res.status(400).json({ error: 'Нельзя заблокировать собственную учётную запись.' });
  }

  const target = getUserById(targetId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден.' });

  if (v.value.role != null) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(v.value.role, targetId);
  }
  if (v.value.blocked != null) {
    db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(v.value.blocked, targetId);
  }
  audit(db, req.user.id, 'admin_user_patch', `target=${targetId} ${JSON.stringify(v.value)}`, req.ip);
  const updated = getUserById(targetId);
  res.json({ user: publicUser(updated) });
});

app.get('/api/manager/settings', requireAuth, requireRole('manager', 'admin'), (req, res) => {
  const wl = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('workLine');
  const ds = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliverySlots');
  const intro = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('communityIntro');
  let slots = [];
  try {
    slots = ds ? JSON.parse(ds.value) : [];
  } catch {
    slots = [];
  }
  res.json({
    workLine: wl ? wl.value : '',
    deliverySlots: slots,
    communityIntro: intro ? intro.value : '',
  });
});

app.put('/api/manager/settings', requireAuth, requireRole('manager', 'admin'), csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.managerSettingsSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { workLine, communityIntro, deliverySlots } = v.value;
  db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('workLine', workLine);
  db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run(
    'deliverySlots',
    JSON.stringify(deliverySlots)
  );
  db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('communityIntro', communityIntro);
  audit(db, req.user.id, 'manager_settings', '', req.ip);
  res.json({ ok: true });
});

app.get('/api/admin/delivery-addresses', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM delivery_addresses ORDER BY sort_order ASC, id ASC').all();
  res.json({ addresses: rows });
});

app.post('/api/admin/delivery-addresses', requireAuth, requireRole('admin'), csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.deliveryAddressCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { label, address_line, sort_order, active, notes } = v.value;
  let orderVal = sort_order;
  if (orderVal == null) {
    const m = db.prepare('SELECT IFNULL(MAX(sort_order), 0) AS m FROM delivery_addresses').get();
    orderVal = (m.m || 0) + 10;
  }
  const info = db
    .prepare(`INSERT INTO delivery_addresses (label, address_line, sort_order, active, notes) VALUES (?, ?, ?, ?, ?)`)
    .run(label, address_line, orderVal, active ?? 1, notes ?? '');
  const row = db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(info.lastInsertRowid);
  audit(db, req.user.id, 'admin_address_create', `id=${row.id}`, req.ip);
  res.json({ address: row });
});

app.patch('/api/admin/delivery-addresses/:id', requireAuth, requireRole('admin'), csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.deliveryAddressPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Запись не найдена.' });
  const p = v.value;
  const label = p.label != null ? p.label : cur.label;
  const address_line = p.address_line != null ? p.address_line : cur.address_line;
  const sort_order = p.sort_order != null ? p.sort_order : cur.sort_order;
  const active = p.active != null ? p.active : cur.active;
  const notes = p.notes != null ? p.notes : cur.notes;
  db.prepare(
    `UPDATE delivery_addresses SET label = ?, address_line = ?, sort_order = ?, active = ?, notes = ? WHERE id = ?`
  ).run(label, address_line, sort_order, active, notes, id);
  audit(db, req.user.id, 'admin_address_patch', `id=${id}`, req.ip);
  res.json({ address: db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id) });
});

app.delete('/api/admin/delivery-addresses/:id', requireAuth, requireRole('admin'), csrfMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Запись не найдена.' });
  db.prepare('DELETE FROM delivery_addresses WHERE id = ?').run(id);
  audit(db, req.user.id, 'admin_address_delete', `id=${id}`, req.ip);
  res.json({ ok: true });
});

app.get('/api/admin/delivery-zones', requireAuth, requireRole('admin'), (req, res) => {
  const zones = db.prepare('SELECT * FROM delivery_zones ORDER BY id ASC').all();
  res.json({ zones });
});

app.patch('/api/admin/delivery-zones/:id', requireAuth, requireRole('admin'), csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.deliveryZonePatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Зона не найдена.' });
  const p = v.value;
  const name = p.name != null ? p.name : cur.name;
  const tariff = p.tariff != null ? p.tariff : cur.tariff;
  const bounds_json = p.bounds_json != null ? p.bounds_json : cur.bounds_json;
  db.prepare('UPDATE delivery_zones SET name = ?, tariff = ?, bounds_json = ? WHERE id = ?').run(
    name,
    tariff,
    bounds_json,
    id
  );
  audit(db, req.user.id, 'admin_zone_patch', `id=${id}`, req.ip);
  res.json({ zone: db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id) });
});

app.get('/api/admin/feedback', requireAuth, requireRole('admin', 'manager', 'operator'), (req, res) => {
  const messages = db
    .prepare(
      `SELECT f.id, f.user_id, f.name, f.phone, f.message, f.created_at, u.email AS user_email
       FROM feedback_messages f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.id DESC LIMIT 300`
    )
    .all();
  res.json({ messages });
});

app.use(express.static(ROOT, { index: 'index.html' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Не найдено.' });
    return;
  }
  res.sendFile(path.join(ROOT, 'index.html'));
});

let listenPort = PREFERRED_PORT;
const server = app.listen(listenPort);

server.on('listening', () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : listenPort;
  // eslint-disable-next-line no-console
  console.log(`ЭкваЛайн: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log('Учётные записи (вход через форму «Вход»):');
  // eslint-disable-next-line no-console
  console.log('  admin@ekvaline.demo     / AdminEkva2026!');
  // eslint-disable-next-line no-console
  console.log('  manager@ekvaline.demo   / ManagerEkva2026!');
  // eslint-disable-next-line no-console
  console.log('  operator@ekvaline.demo  / OperatorEkva2026!');
});

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  if (process.env.PORT) {
    // eslint-disable-next-line no-console
    console.error(
      `Порт ${listenPort} занят (задан PORT=${process.env.PORT}). Закройте другой процесс или укажите другой PORT.`
    );
    process.exit(1);
  }
  const taken = err.port;
  listenPort += 1;
  if (listenPort > PREFERRED_PORT + PORT_FALLBACK_MAX) {
    // eslint-disable-next-line no-console
    console.error(`Не удалось занять порт: ${PREFERRED_PORT}–${PREFERRED_PORT + PORT_FALLBACK_MAX} заняты.`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.warn(`Порт ${taken} занят, запуск на ${listenPort}...`);
  server.listen(listenPort);
});
