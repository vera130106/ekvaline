require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Tokens = require('csrf');
const { openDatabase } = require('./db');
const { checkPostgresConnection } = require('./postgres');
const schemas = require('./schemas');
const { mountGeocodeRoutes } = require('./geocode-proxy');

const tokens = new Tokens();
/** Уникальный идентификатор каждого запуска процесса (сброс «запомненного» входа на клиентах). */
const CLIENT_BOOT_ID = crypto.randomBytes(12).toString('hex');
const app = express();
const db = openDatabase();
const feedbackThrottle = new Map();

const ROOT = __dirname;
/** Фиксированный порт: только из env PORT или 3001 (без автоматического перебора). */
const LISTEN_PORT = Number(process.env.PORT) || 3001;

app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const sessionPgStore =
  db && db.pool
    ? new pgSession({
        pool: db.pool,
        tableName: 'express_session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15,
      })
    : null;

app.use(
  session({
    store: sessionPgStore || undefined,
    name: 'ekvaline.sid',
    secret: process.env.SESSION_SECRET || 'ekvaline-dev-secret-change-in-production',
    resave: false,
    /** false: не засорять БД анонимными сессиями; после первого изменения sess (csrf/login) сохраняем. */
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 2 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      /**
       * По умолчанию false: иначе при NODE_ENV=production на http://localhost cookie с флагом Secure
       * не сохраняется и «обычный» вход через POST /api/auth/login перестаёт создавать сессию.
       * Для боевого HTTPS задайте в .env: USE_SECURE_COOKIES=true
       */
      secure: String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true',
    },
  })
);

function audit(dbConn, userId, action, detail, ip) {
  dbConn
    .prepare('INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')
    .run(userId || null, action, detail || '', ip || '')
    .catch(() => {});
}

/** Сохранить сессию в хранилище до ответа (для PostgreSQL-стора иначе редирект в кабинет может опередить запись). */
function saveSessionPromise(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

async function insertOrderAuditEvent(dbConn, orderId, action, reason, actorUserId, detail) {
  const oid = Number(orderId);
  if (!Number.isFinite(oid) || oid <= 0) return;
  try {
    await dbConn
      .prepare(
        `INSERT INTO order_audit_events (order_id, action, reason, actor_user_id, detail) VALUES (?, ?, ?, ?, ?)`
      )
      .run(oid, String(action || 'event'), String(reason || '').slice(0, 2000), actorUserId ?? null, String(detail || '').slice(0, 8000));
  } catch {
    /* таблица может ещё не существовать до миграции */
  }
}

function publicUser(row) {
  if (!row) return null;
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  const drl = String(row.driver_route_label || '').trim();
  const base = {
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
  if (row.role === 'driver') base.driver_route_label = drl || '';
  else if (drl) base.driver_route_label = drl;
  return base;
}

/** Отображаются у водителей: заказы, которые оператор ведёт как «в работе», уже с назначенным экспедитором. */
const DRIVER_ORDER_STATUSES = ['pending_operator', 'confirmed', 'processing', 'courier', 'on_way'];

async function assertDriverRouteLabelUnique(label, excludeUserId) {
  const t = String(label || '').trim();
  if (!t || t.length < 2) return;
  const ex = Number(excludeUserId);
  const x = Number.isFinite(ex) ? ex : 0;
  const hit = await db
    .prepare(
      `SELECT id FROM users
       WHERE trim(COALESCE(driver_route_label, '')) = trim(?)
         AND COALESCE(trim(COALESCE(driver_route_label, '')), '') <> ''
         AND id <> ?`
    )
    .get(t, x);
  if (hit)
    throw Object.assign(new Error('Метка экспедитора уже занята другим пользователем.'), {
      status: 409,
    });
}

function driverAssignedLabel(row) {
  return row && row.role === 'driver' ? String(row.driver_route_label || '').trim() : '';
}

async function getUserById(id) {
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

async function findUserByCredential(cred) {
  const n = normalizeCredential(cred);
  if (n.kind === 'phone') return db.prepare('SELECT * FROM users WHERE phone = ?').get(n.value);
  if (n.kind === 'email') return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(n.value);
  return null;
}

function isLocked(row) {
  if (!row.locked_until) return false;
  const t = new Date(row.locked_until).getTime();
  return t > Date.now();
}

async function recordLoginFail(userId) {
  const u = await getUserById(userId);
  if (!u) return;
  const attempts = (u.login_attempts || 0) + 1;
  let lockedUntil = u.locked_until;
  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }
  await db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?').run(
    attempts,
    lockedUntil,
    userId
  );
}

async function recordLoginOk(userId) {
  await db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(userId);
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function ensurePhoneCallerUser(customerPhoneDigits, customerName) {
  const existing = await db.prepare('SELECT * FROM users WHERE phone = ?').get(customerPhoneDigits);
  if (existing) return existing;
  const firstRaw = String(customerName || 'Клиент')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, schemas.NAME_MAX || 60);
  const first = firstRaw.length >= 2 ? firstRaw : 'Клиент';
  const email = `caller.${customerPhoneDigits}@phone.ekvaline.local`;
  const randomPw = crypto.randomBytes(32).toString('base64url');
  const password_hash = await bcrypt.hash(randomPw, 10);
  try {
    const r = await db
      .prepare(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, patronymic, role)
         VALUES (?, ?, ?, ?, '', '', 'client')`
      )
      .run(email, customerPhoneDigits, password_hash, first);
    const id = r.lastInsertRowid;
    return await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  } catch (e) {
    const dup = await db.prepare('SELECT * FROM users WHERE phone = ?').get(customerPhoneDigits);
    if (dup) return dup;
    throw e;
  }
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const uid = req.session && req.session.userId;
  if (!uid) return res.status(401).json({ error: 'Требуется вход в систему.' });
  const user = await getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.status(403).json({ error: 'Доступ запрещён.' });
  }
  req.user = user;
  next();
});

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

app.get('/api/client-boot', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ bootId: CLIENT_BOOT_ID });
});

app.get('/api/public/settings', asyncHandler(async (req, res) => {
  const keys = ['workLine', 'deliverySlots', 'communityIntro'];
  const out = {};
  const stmt = db.prepare('SELECT value FROM site_settings WHERE key = ?');
  for (const k of keys) {
    const r = await stmt.get(k);
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
}));

mountGeocodeRoutes(app, { asyncHandler });

app.get('/api/public/checkout-options', asyncHandler(async (req, res) => {
  let deliverySlots = ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'];
  const ds = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliverySlots');
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
    addresses = await db
      .prepare(
        `SELECT id, label, address_line FROM delivery_addresses WHERE active = 1 ORDER BY sort_order ASC, id ASC`
      )
      .all();
  } catch {
    addresses = [];
  }
  res.json({ deliverySlots, addresses });
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT p.*, c.name AS category_name FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.hidden = 0 ORDER BY c.id, p.sort_order, p.id`
    )
    .all();
  res.json({ products: rows });
}));

app.get('/api/auth/me', asyncHandler(async (req, res) => {
  const uid = req.session && req.session.userId;
  if (!uid) return res.json({ user: null });
  const user = await getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/register', csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.registerSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone, password } = v.value;
  const exists = await db
    .prepare('SELECT id FROM users WHERE lower(email) = lower(?) OR phone = ?')
    .get(email, phone);
  if (exists) return res.status(409).json({ error: 'Email или телефон уже зарегистрированы.' });

  const password_hash = bcrypt.hashSync(password, 12);
  const info = await db
    .prepare(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES (?, ?, ?, ?, ?, 'client', datetime('now'))`
    )
    .run(email, phone, password_hash, first_name, last_name || '');

  const user = await getUserById(info.lastInsertRowid);
  req.session.userId = user.id;
  audit(db, user.id, 'register', `email=${email}`, req.ip);
  await saveSessionPromise(req);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/login', csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.loginSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { credential, password } = v.value;
  const user = await findUserByCredential(credential);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль.' });
  if (user.blocked) return res.status(403).json({ error: 'Учётная запись заблокирована.' });
  if (isLocked(user)) {
    return res.status(423).json({ error: 'Вход временно заблокирован после неудачных попыток. Попробуйте позже.' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    await recordLoginFail(user.id);
    return res.status(401).json({ error: 'Неверный логин или пароль.' });
  }

  await recordLoginOk(user.id);
  req.session.userId = user.id;
  audit(db, user.id, 'login', '', req.ip);
  await saveSessionPromise(req);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', csrfMiddleware, (req, res) => {
  const uid = req.session && req.session.userId;
  req.session.destroy(() => {
    if (uid) audit(db, uid, 'logout', '', req.ip);
    res.json({ ok: true });
  });
});

app.patch('/api/profile', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.profileSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone } = v.value;
  const dup = await db
    .prepare(
      `SELECT id FROM users WHERE (lower(email) = lower(?) OR phone = ?) AND id != ?`
    )
    .get(email, phone, req.user.id);
  if (dup) return res.status(409).json({ error: 'Этот email или телефон уже заняты.' });

  await db.prepare(
    `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?`
  ).run(first_name, last_name || '', email, phone, req.user.id);

  const user = await getUserById(req.user.id);
  audit(db, req.user.id, 'profile_update', '', req.ip);
  res.json({ user: publicUser(user) });
}));

app.post('/api/feedback', csrfMiddleware, asyncHandler(async (req, res) => {
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

  await db.prepare('INSERT INTO feedback_messages (user_id, name, phone, message) VALUES (?, ?, ?, ?)').run(
    userId,
    name,
    phone,
    message
  );
  audit(db, userId, 'feedback', `phone=${phone}`, req.ip);
  res.json({ ok: true });
}));

app.get('/api/orders/my', requireAuth, asyncHandler(async (req, res) => {
  const rows = await db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200')
    .all(req.user.id);
  res.json({ orders: rows });
}));

app.post('/api/orders', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.orderCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { address, delivery_date, delivery_slot, payment_method, bonuses_used, items } = v.value;

  let subtotal = 0;
  const lineItems = [];
  for (const it of items) {
    const p = await db.prepare('SELECT id, price, stock, hidden FROM products WHERE id = ?').get(it.product_id);
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
    await db.withTransaction(async (tx) => {
      const o = await tx
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
        await tx.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(it.qty, it.product_id);
      }

      if (bonusSpend > 0) {
        await tx.prepare('UPDATE users SET bonus_balance = bonus_balance - ? WHERE id = ?').run(bonusSpend, req.user.id);
        await tx.prepare(
          'INSERT INTO bonus_operations (user_id, type, amount, description) VALUES (?, ?, ?, ?)'
        ).run(req.user.id, 'spend', -bonusSpend, `Заказ #${orderId}`);
      }
      if (earn > 0) {
        await tx.prepare('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?').run(earn, req.user.id);
        await tx.prepare(
          'INSERT INTO bonus_operations (user_id, type, amount, description) VALUES (?, ?, ?, ?)'
        ).run(req.user.id, 'accrual', earn, `Начисление за заказ #${orderId}`);
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Не удалось сохранить заказ.' });
  }

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  audit(db, req.user.id, 'order_create', `id=${order.id}`, req.ip);
  const user = await getUserById(req.user.id);
  res.json({ order, user: publicUser(user) });
}));

app.post(
  '/api/orders/operator',
  requireAuth,
  requireRole('operator', 'manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.operatorOrderCreateSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });

    let phoneDigits = String(v.value.customer_phone || '').replace(/\D/g, '');
    if (phoneDigits.length === 11 && phoneDigits[0] === '8') phoneDigits = `7${phoneDigits.slice(1)}`;
    if (phoneDigits.length === 10 && phoneDigits[0] === '9') phoneDigits = `7${phoneDigits}`;
    if (!(phoneDigits.length === 11 && phoneDigits[0] === '7')) {
      return res.status(400).json({ error: 'Телефон: нужны 11 цифр в формате России (+7…).' });
    }

    const pickupVal = Number(v.value.pickup) === 1 ? 1 : 0;
    const zoneVal = String(v.value.zone || '').trim() || null;
    const driverVal = String(v.value.driver || '').trim() || null;

    const customer = await ensurePhoneCallerUser(phoneDigits, v.value.customer_name);
    const qty = Number(v.value.qty);
    const unit = Number(v.value.unit_price);
    const total_sum = Math.round(qty * unit);
    const itemsJson = JSON.stringify([
      {
        title: String(v.value.product_title).trim(),
        qty,
        unit_price: unit,
      },
    ]);

    let orderId;
    try {
      const o = await db
        .prepare(
          `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method,
            bonuses_used, bonuses_earned, items_json, courier_note, zone, driver, pickup, total_sum)
           VALUES (?, ?, ?, ?, 'new', ?, 0, 0, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          customer.id,
          v.value.address,
          v.value.delivery_date,
          v.value.delivery_slot,
          v.value.payment_method,
          itemsJson,
          String(v.value.courier_note || '').trim(),
          zoneVal,
          driverVal,
          pickupVal,
          total_sum
        );
      orderId = o.lastInsertRowid;
    } catch {
      return res.status(500).json({ error: 'Не удалось сохранить заказ.' });
    }

    const orderRow = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    audit(db, req.user.id, 'order_operator_create', `id=${orderId}`, req.ip);
    res.json({ order: orderRow });
  })
);

app.get('/api/orders', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT o.*, u.email, u.phone, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC LIMIT 5000`
    )
    .all();
  res.json({ orders: rows });
}));

app.get('/api/orders/:id/journal', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id заказа.' });
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });

  const staffRoles = ['operator', 'manager', 'admin'];
  if (!staffRoles.includes(req.user.role) && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав.' });
  }

  const rows = await db
    .prepare(
      `SELECT a.id, a.action, a.detail, a.created_at,
              COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email, 'Система') AS actor_name,
              COALESCE(u.role, 'system') AS actor_role,
              COALESCE(u.email, '') AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.detail LIKE ?
       ORDER BY a.id DESC
       LIMIT 300`
    )
    .all(`%id=${id}%`);
  res.json({ journal: rows });
}));

app.get('/api/orders/operator/audit-report', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (req, res) => {
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ error: 'Укажите период from и to в формате ГГГГ-ММ-ДД.' });
  }
  const rows = await db
    .prepare(
      `SELECT e.id, e.order_id, e.action, e.reason, e.detail, e.created_at,
              COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email, 'Пользователь') AS actor_name,
              COALESCE(u.role, '') AS actor_role
       FROM order_audit_events e
       LEFT JOIN users u ON u.id = e.actor_user_id
       WHERE (e.created_at AT TIME ZONE 'Europe/Moscow')::date >= ?::date
         AND (e.created_at AT TIME ZONE 'Europe/Moscow')::date <= ?::date
       ORDER BY e.created_at DESC
       LIMIT 3000`
    )
    .all(from, to);
  res.json({ events: rows });
}));

app.post('/api/orders/:id/cancel', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const vr = schemas.validate(schemas.orderCancelReasonSchema, req.body || {});
  if (!vr.ok) return res.status(400).json({ error: vr.error });
  const order = await db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
  if (!['processing', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Этот заказ уже нельзя отменить.' });
  }
  await db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  const reason = String(vr.value.reason || '').trim();
  await insertOrderAuditEvent(db, id, 'order_cancel', reason, req.user.id, JSON.stringify({ source: 'cabinet_cancel' }));
  audit(db, req.user.id, 'order_cancel', `id=${id}`, req.ip);
  res.json({ order: await db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
}));

/** Маршруты до параметрических `/api/orders/:id`. */
app.get('/api/driver/orders', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const label = driverAssignedLabel(req.user);
  if (!label) return res.json({ orders: [], warn: 'Администратор не указал вашу метку экспедитора.' });
  const rows = await db
    .prepare(
      `SELECT o.*,
              trim(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS join_client_name,
              u.email AS join_client_email,
              u.phone AS join_client_phone
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE trim(COALESCE(o.driver, '')) = trim(?)
         AND trim(COALESCE(o.driver, '')) <> ''
         AND o.status IN ('pending_operator', 'confirmed', 'processing', 'courier', 'on_way')
       ORDER BY CASE WHEN trim(COALESCE(o.delivery_date, '')) <> '' THEN 0 ELSE 1 END,
              o.delivery_date ASC NULLS LAST,
              o.created_at DESC,
              o.id DESC`
    )
    .all(label);
  const orders = rows.map((r) => {
    const { join_client_name, join_client_email, join_client_phone, ...order } = r;
    const nm = join_client_name && String(join_client_name).trim();
    const clientDisp = nm && nm.length >= 2 ? nm : join_client_email || 'Клиент';
    return {
      ...order,
      client: clientDisp,
      phone: join_client_phone || null,
      email_hint: join_client_email || null,
    };
  });
  res.json({ orders });
}));

app.post(
  '/api/driver/orders/:id/mark-delivered',
  requireAuth,
  requireRole('driver'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id заказа.' });
    const label = driverAssignedLabel(req.user);
    if (!label) return res.status(403).json({ error: 'Нет метки экспедитора в учётной записи.' });
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
    if (String(order.driver || '').trim() !== label) return res.status(403).json({ error: 'Это не ваш заказ.' });
    if (!DRIVER_ORDER_STATUSES.includes(order.status)) {
      return res.status(400).json({
        error: 'Заказ уже доставлен, отменён или ещё не передан водителю оператором.',
      });
    }
    await db
      .prepare(`UPDATE orders SET status = 'delivered', updated_at = datetime('now') WHERE id = ?`)
      .run(id);
    await insertOrderAuditEvent(
      db,
      id,
      'driver_mark_delivered',
      'Доставлен (водитель)',
      req.user.id,
      JSON.stringify({ from_status: order.status })
    );
    audit(db, req.user.id, 'driver_delivered', `id=${id}`, req.ip);
    res.json({ order: await db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
  })
);

app.patch('/api/orders/:id', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id заказа.' });
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });

  const staffRoles = ['operator', 'manager', 'admin'];
  if (staffRoles.includes(req.user.role)) {
    const v = schemas.validate(schemas.orderPatchSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const changeReason = String(v.value.change_reason || '').trim();
    const requiresReason =
      (v.value.delivery_date != null && v.value.delivery_date !== order.delivery_date) ||
      (v.value.delivery_slot != null && v.value.delivery_slot !== order.delivery_slot) ||
      (v.value.status != null && v.value.status === 'cancelled' && order.status !== 'cancelled');
    if (requiresReason && changeReason.length < 3) {
      return res.status(400).json({
        error: 'Укажите причину переноса доставки или отмены заказа (не менее 3 символов).',
      });
    }
    const fields = [];
    const values = [];
    const allowed = [
      'status',
      'address',
      'delivery_date',
      'delivery_slot',
      'payment_method',
      'zone',
      'driver',
      'pickup',
      'total_sum',
      'items_json',
      'courier_note',
    ];
    const changedKeys = [];
    for (const key of allowed) {
      if (v.value[key] == null) continue;
      fields.push(`${key} = ?`);
      values.push(v.value[key]);
      changedKeys.push(key);
    }
    if (!fields.length) {
      const unchanged = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return res.json({ order: unchanged });
    }
    values.push(id);
    await db.prepare(`UPDATE orders SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
    let evtAction = 'operator_patch';
    if (v.value.status === 'cancelled' && order.status !== 'cancelled') evtAction = 'order_status_cancelled';
    else if (
      (v.value.delivery_date != null && v.value.delivery_date !== order.delivery_date) ||
      (v.value.delivery_slot != null && v.value.delivery_slot !== order.delivery_slot)
    ) {
      evtAction = 'order_reschedule';
    }
    const reasonForLog = changeReason || (requiresReason ? '—' : 'Изменение заказа (без переноса/отмены)');
    await insertOrderAuditEvent(db, id, evtAction, reasonForLog, req.user.id, JSON.stringify({ changed: changedKeys }));
    audit(db, req.user.id, 'order_patch', `id=${id}`, req.ip);
    const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
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
  const { address, delivery_date, delivery_slot, change_reason } = v.value;
  const parts = [];
  const vals = [];
  const touched = [];
  if (address != null) {
    parts.push('address = ?');
    vals.push(address);
    touched.push('address');
  }
  if (delivery_date != null) {
    parts.push('delivery_date = ?');
    vals.push(delivery_date);
    touched.push('delivery_date');
  }
  if (delivery_slot != null) {
    parts.push('delivery_slot = ?');
    vals.push(delivery_slot);
    touched.push('delivery_slot');
  }
  if (!parts.length) {
    return res.status(400).json({ error: 'Укажите адрес, дату или интервал доставки.' });
  }
  const cr = String(change_reason || '').trim();
  if (cr.length < 3) {
    return res.status(400).json({ error: 'Укажите причину изменения заказа (не менее 3 символов).' });
  }
  vals.push(id);
  await db.prepare(`UPDATE orders SET ${parts.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
  await insertOrderAuditEvent(db, id, 'client_patch', cr, req.user.id, JSON.stringify({ fields: touched }));
  audit(db, req.user.id, 'order_client_update', `id=${id}`, req.ip);
  res.json({ order: await db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
}));

app.get('/api/admin/users', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT id, email, phone, first_name, last_name, patronymic, role, blocked, bonus_balance, created_at,
              login_attempts, locked_until, driver_route_label
       FROM users ORDER BY id DESC LIMIT 2000`
    )
    .all();
  res.json({ users: rows });
}));

app.patch('/api/admin/users/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.adminUserPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const targetId = Number(req.params.id);
  if (targetId === req.user.id && v.value.blocked === 1) {
    return res.status(400).json({ error: 'Нельзя заблокировать собственную учётную запись.' });
  }

  const target = await getUserById(targetId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден.' });

  try {
    if (v.value.role != null) {
      await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(v.value.role, targetId);
      if (v.value.role !== 'driver') {
        await db.prepare('UPDATE users SET driver_route_label = NULL WHERE id = ?').run(targetId);
      }
    }

    if (v.value.driver_route_label !== undefined) {
      const mid = await getUserById(targetId);
      const effRole = String(mid.role || '');
      if (effRole !== 'driver') {
        return res.status(400).json({ error: 'Метку экспедитора можно задать только для роли «Водитель».' });
      }
      const lbl = String(v.value.driver_route_label ?? '').trim();
      const store = lbl === '' ? null : lbl;
      if (!store || store.length < 2) {
        return res.status(400).json({
          error: 'Укажите метку экспедитора — точно как ФИО в поле «Экспедитор» у оператора.',
        });
      }
      await assertDriverRouteLabelUnique(store, targetId);
      await db.prepare('UPDATE users SET driver_route_label = ? WHERE id = ?').run(store, targetId);
    }

    if (v.value.blocked != null) {
      await db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(v.value.blocked, targetId);
    }
  } catch (e) {
    if (e && e.status === 409) return res.status(409).json({ error: e.message });
    throw e;
  }
  audit(db, req.user.id, 'admin_user_patch', `target=${targetId} ${JSON.stringify(v.value)}`, req.ip);
  const updated = await getUserById(targetId);
  res.json({ user: publicUser(updated) });
}));

app.post('/api/admin/users', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.adminUserCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { first_name, last_name, email, phone, password, role } = v.value;
  const drvLbl = String(v.value.driver_route_label || '').trim();
  if (role === 'driver') {
    if (drvLbl.length < 2) {
      return res.status(400).json({
        error: 'Для водителя укажите метку экспедитора — как у оператора в заказе (ФИО).',
      });
    }
  }
  const exists = await db
    .prepare('SELECT id FROM users WHERE lower(email) = lower(?) OR phone = ?')
    .get(email, phone);
  if (exists) return res.status(409).json({ error: 'Email или телефон уже заняты.' });

  try {
    if (role === 'driver') await assertDriverRouteLabelUnique(drvLbl, 0);
  } catch (e) {
    if (e && e.status === 409) return res.status(409).json({ error: e.message });
    throw e;
  }

  const password_hash = bcrypt.hashSync(password, 12);
  const info = await db
    .prepare(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at, driver_route_label)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`
    )
    .run(email, phone, password_hash, first_name, last_name || '', role, role === 'driver' ? drvLbl : null);
  const user = await getUserById(info.lastInsertRowid);
  audit(db, req.user.id, 'admin_user_create', `target=${user.id} role=${role}`, req.ip);
  res.json({ user: publicUser(user) });
}));

app.get('/api/admin/products', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const categories = await db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  const products = await db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.hidden ASC, p.sort_order ASC, p.id ASC`
    )
    .all();
  res.json({ categories, products });
}));

app.post('/api/admin/products', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.adminProductCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const p = v.value;
  const cat = await db.prepare('SELECT id FROM categories WHERE id = ?').get(p.category_id);
  if (!cat) return res.status(400).json({ error: 'Категория не найдена.' });
  const info = await db
    .prepare(
      `INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order, hidden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.category_id,
      p.name,
      p.description || '',
      p.price,
      p.volume_liters ?? null,
      p.stock,
      p.sort_order ?? 0,
      p.hidden ?? 0
    );
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  audit(db, req.user.id, 'admin_product_create', `id=${product.id}`, req.ip);
  res.json({ product });
}));

app.patch('/api/admin/products/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.adminProductPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const id = Number(req.params.id);
  const cur = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Товар не найден.' });
  const p = v.value;
  if (p.category_id != null) {
    const cat = await db.prepare('SELECT id FROM categories WHERE id = ?').get(p.category_id);
    if (!cat) return res.status(400).json({ error: 'Категория не найдена.' });
  }
  const fields = [];
  const values = [];
  const keys = ['category_id', 'name', 'description', 'price', 'volume_liters', 'stock', 'sort_order', 'hidden'];
  keys.forEach((k) => {
    if (p[k] == null && p[k] !== 0) return;
    fields.push(`${k} = ?`);
    values.push(p[k]);
  });
  if (!fields.length) return res.status(400).json({ error: 'Нет данных для обновления.' });
  values.push(id);
  await db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  audit(db, req.user.id, 'admin_product_patch', `id=${id}`, req.ip);
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product });
}));

app.delete('/api/admin/products/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Товар не найден.' });
  await db.prepare('DELETE FROM products WHERE id = ?').run(id);
  audit(db, req.user.id, 'admin_product_delete', `id=${id}`, req.ip);
  res.json({ ok: true });
}));

app.get('/api/manager/settings', requireAuth, requireRole('manager', 'admin'), asyncHandler(async (req, res) => {
  const wl = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('workLine');
  const ds = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliverySlots');
  const intro = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('communityIntro');
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
}));

app.put('/api/manager/settings', requireAuth, requireRole('manager', 'admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.managerSettingsSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { workLine, communityIntro, deliverySlots } = v.value;
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('workLine', workLine);
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run(
    'deliverySlots',
    JSON.stringify(deliverySlots)
  );
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('communityIntro', communityIntro);
  audit(db, req.user.id, 'manager_settings', '', req.ip);
  res.json({ ok: true });
}));

app.get('/api/admin/delivery-addresses', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const rows = await db.prepare('SELECT * FROM delivery_addresses ORDER BY sort_order ASC, id ASC').all();
  res.json({ addresses: rows });
}));

app.post('/api/admin/delivery-addresses', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.deliveryAddressCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { label, address_line, sort_order, active, notes } = v.value;
  let orderVal = sort_order;
  if (orderVal == null) {
    const m = await db.prepare('SELECT IFNULL(MAX(sort_order), 0) AS m FROM delivery_addresses').get();
    orderVal = (m.m || 0) + 10;
  }
  const info = await db
    .prepare(`INSERT INTO delivery_addresses (label, address_line, sort_order, active, notes) VALUES (?, ?, ?, ?, ?)`)
    .run(label, address_line, orderVal, active ?? 1, notes ?? '');
  const row = await db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(info.lastInsertRowid);
  audit(db, req.user.id, 'admin_address_create', `id=${row.id}`, req.ip);
  res.json({ address: row });
}));

app.patch('/api/admin/delivery-addresses/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.deliveryAddressPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const id = Number(req.params.id);
  const cur = await db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Запись не найдена.' });
  const p = v.value;
  const label = p.label != null ? p.label : cur.label;
  const address_line = p.address_line != null ? p.address_line : cur.address_line;
  const sort_order = p.sort_order != null ? p.sort_order : cur.sort_order;
  const active = p.active != null ? p.active : cur.active;
  const notes = p.notes != null ? p.notes : cur.notes;
  await db.prepare(
    `UPDATE delivery_addresses SET label = ?, address_line = ?, sort_order = ?, active = ?, notes = ? WHERE id = ?`
  ).run(label, address_line, sort_order, active, notes, id);
  audit(db, req.user.id, 'admin_address_patch', `id=${id}`, req.ip);
  res.json({ address: await db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id) });
}));

app.delete('/api/admin/delivery-addresses/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await db.prepare('SELECT * FROM delivery_addresses WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Запись не найдена.' });
  await db.prepare('DELETE FROM delivery_addresses WHERE id = ?').run(id);
  audit(db, req.user.id, 'admin_address_delete', `id=${id}`, req.ip);
  res.json({ ok: true });
}));

app.get('/api/admin/delivery-zones', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const zones = await db.prepare('SELECT * FROM delivery_zones ORDER BY id ASC').all();
  res.json({ zones });
}));

app.patch('/api/admin/delivery-zones/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.deliveryZonePatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const id = Number(req.params.id);
  const cur = await db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Зона не найдена.' });
  const p = v.value;
  const name = p.name != null ? p.name : cur.name;
  const tariff = p.tariff != null ? p.tariff : cur.tariff;
  const bounds_json = p.bounds_json != null ? p.bounds_json : cur.bounds_json;
  await db.prepare('UPDATE delivery_zones SET name = ?, tariff = ?, bounds_json = ? WHERE id = ?').run(
    name,
    tariff,
    bounds_json,
    id
  );
  audit(db, req.user.id, 'admin_zone_patch', `id=${id}`, req.ip);
  res.json({ zone: await db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id) });
}));

app.get('/api/admin/feedback', requireAuth, requireRole('admin', 'manager', 'operator'), asyncHandler(async (req, res) => {
  const messages = await db
    .prepare(
      `SELECT f.id, f.user_id, f.name, f.phone, f.message, f.created_at, u.email AS user_email
       FROM feedback_messages f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.id DESC LIMIT 300`
    )
    .all();
  res.json({ messages });
}));

app.use(express.static(ROOT, { index: 'index.html' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Не найдено.' });
    return;
  }
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[api] Необработанная ошибка:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

const server = app.listen(LISTEN_PORT);

server.on('listening', () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : LISTEN_PORT;
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

  checkPostgresConnection();
});

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  // eslint-disable-next-line no-console
  console.error(
    `Порт ${LISTEN_PORT} занят. Останови другой процесс node (старый сервер) или задай другой PORT в .env.`
  );
  process.exit(1);
});
