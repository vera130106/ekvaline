require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Tokens = require('csrf');
const { openDatabase, checkPostgresConnection } = require('./db');
const schemas = require('./schemas');
const { estimateWaterConsumption } = require('./waterCalcEngine');
const { aggregatePaymentRows } = require('./order-payment');
const { mountGeocodeRoutes } = require('./geocode-proxy');
const deliveryAvailability = require('./delivery-availability');
const orenburgAddress = require('./orenburg-address');
const orderPricing = require('./order-pricing');
const {
  deliveryDateStoredChanged,
  deliverySlotStoredChanged,
} = require('./delivery-slots');
const {
  securityHeaders,
  noCacheProtectedHtml,
  denySensitiveStaticFiles,
  createRateLimiter,
  assertProductionSessionSecret,
} = require('./security-middleware');
const {
  isStaffRole,
  canSelfServicePasswordReset,
  PASSWORD_RESET_NOT_FOUND_MSG,
} = require('./auth-security');
const mailer = require('./mailer');
const bonusProgram = require('./bonusProgram');
const pollVotes = require('./pollVotes');
const clientNotifications = require('./clientNotifications');

assertProductionSessionSecret();

const http = require('http');
const tokens = new Tokens();
/** Уникальный идентификатор каждого запуска процесса (сброс «запомненного» входа на клиентах). */
const CLIENT_BOOT_ID = crypto.randomBytes(12).toString('hex');
/** Завершение сессии при отсутствии действий пользователя (не продлевается фоновым опросом). */
const SESSION_IDLE_MINUTES = Math.max(5, Math.min(24 * 60, Number(process.env.SESSION_IDLE_MINUTES) || 30));
const SESSION_IDLE_MS = SESSION_IDLE_MINUTES * 60 * 1000;
const app = express();
const db = openDatabase();

/** Заказы принимаются только на следующий календарный день и позже (не на сегодня). */
function isoCalendarDayLocal(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function earliestDeliveryDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoCalendarDayLocal(d);
}

function validateDeliveryDateFormat(deliveryDate) {
  const raw = String(deliveryDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: 'Дата доставки: формат ГГГГ-ММ-ДД.' };
  }
  return { ok: true, value: raw };
}

function validateDeliveryDateForBooking(deliveryDate) {
  const raw = String(deliveryDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: 'Дата доставки: формат ГГГГ-ММ-ДД.' };
  }
  const min = earliestDeliveryDateIso();
  if (raw < min) {
    return {
      ok: false,
      error: `Заказы принимаются с ${min.split('-').reverse().join('.')} (на следующий день, не на сегодня).`,
    };
  }
  return { ok: true, value: raw };
}

async function loadDeliveryAvailabilityRecord() {
  const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'deliveryAvailability'").get();
  return deliveryAvailability.parseAvailabilityRecord(row?.value);
}

async function loadDeliveryAvailability() {
  const record = await loadDeliveryAvailabilityRecord();
  return deliveryAvailability.pruneAvailabilityToBookingWindow(
    record.availability || deliveryAvailability.emptyAvailability()
  );
}

async function saveDeliveryAvailability(payload, actorUser) {
  const normalized = deliveryAvailability.pruneAvailabilityToBookingWindow(
    deliveryAvailability.parseAvailabilityStored(payload)
  );
  const meta = actorUser ? deliveryAvailability.buildChangeMeta(actorUser) : null;
  const stored = meta ? { ...normalized, meta } : normalized;
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run('deliveryAvailability', JSON.stringify(stored));
  return { availability: normalized, meta };
}

/** Базовые вопросы FAQ на странице «Доставка» при пустой настройке в БД. */
const DEFAULT_DELIVERY_FAQ = Object.freeze([
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

/** Сертификаты на странице «О компании» при отсутствии данных в БД. */
const DEFAULT_ABOUT_CERTIFICATES = Object.freeze([
  {
    image: 'assets/certificate-card.jpg',
    alt: 'Карточка предприятия',
    badge: 'Документ',
    title: 'Карточка предприятия',
    description: 'Реквизиты организации, контакты, банковские данные и юридическая информация.',
  },
  {
    image: 'assets/certificate-declaration-eac-2025-preview.jpg',
    alt: 'Декларация о соответствии ЕАЭС',
    badge: 'Документ',
    title: 'Декларация о соответствии',
    description: 'Подтверждение соответствия продукции требованиям технических регламентов.',
    pdf: 'assets/certificate-declaration-eac-2025.pdf',
  },
  {
    image: 'assets/certificate-lab.jpg',
    alt: 'Протокол лабораторных испытаний',
    badge: 'Лаборатория',
    title: 'Протокол испытаний',
    description: 'Результаты лабораторных проверок качества и безопасности питьевой воды.',
  },
]);

/** Тексты блока «Зоны покрытия» на странице «Доставка» (карта + карточки справа). */
const DEFAULT_DELIVERY_COVERAGE = Object.freeze({
  title: 'Зоны покрытия Оренбурга',
  cards: Object.freeze([
    Object.freeze({
      title: 'Интервалы доставки',
      text: 'Утро: 9:00-14:00, День: 14:00-17:00, Вечер: 17:00-21:00',
    }),
    Object.freeze({
      title: 'Доставка для организаций',
      text: 'Отдельное окно: 9:00-17:00',
    }),
    Object.freeze({
      title: 'Прием заказов',
      text: 'Оператор принимает заявки: 8:00-19:00',
    }),
  ]),
});

function sanitizeDeliveryFaqLoaded(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const code = String(raw.code ?? '').trim().slice(0, 40);
    const tag = String(raw.tag ?? '').trim().slice(0, 60);
    const question = String(raw.question ?? '').trim().slice(0, 180);
    const answer = String(raw.answer ?? '').trim().slice(0, 900);
    if (code.length < 1 || tag.length < 1 || question.length < 3 || answer.length < 3) continue;
    out.push({ code, tag, question, answer });
    if (out.length >= 30) break;
  }
  return out;
}

/** Гарантированно непустой список для витрины (если админ сохранил пустышки — всё равно показываем дефолт). */
function deliveryFaqForPublic(storedParsed) {
  const cleaned = sanitizeDeliveryFaqLoaded(storedParsed);
  return cleaned.length ? cleaned : [...DEFAULT_DELIVERY_FAQ];
}

/** Опросы для блога (настройки сайта): режем поля и лимиты перед сохранением/выдачей. */
function sanitizeSitePollsLoaded(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id ?? '').trim().slice(0, 56);
    const title = String(item.title ?? '').trim().slice(0, 120);
    const question = String(item.question ?? '').trim().slice(0, 400);
    const active = Boolean(item.active);
    const optsIn = Array.isArray(item.options) ? item.options : [];
    const options = [];
    for (const o of optsIn) {
      if (!o || typeof o !== 'object') continue;
      const oid = String(o.id ?? '').trim().slice(0, 48);
      const text = String(o.text ?? '').trim().slice(0, 160);
      if (oid.length < 1 || text.length < 1) continue;
      options.push({ id: oid, text });
      if (options.length >= 12) break;
    }
    if (id.length < 1 || question.length < 3 || options.length < 2) continue;
    out.push({ id, title, question, active, options });
    if (out.length >= 10) break;
  }
  return out;
}

function sitePollsForPublic(storedParsed) {
  return sanitizeSitePollsLoaded(storedParsed).filter((p) => p.active);
}

const pollVoteHelpers = {
  sanitizeSitePolls: sanitizeSitePollsLoaded,
  sitePollsForPublic,
};

function aboutCertImageAllowed(image) {
  const s = String(image ?? '').trim();
  if (!s) return false;
  if (/^(javascript:|vbscript:)/i.test(s)) return false;
  if (/^data:/i.test(s)) return /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(s);
  return true;
}

function aboutCertPdfAllowed(pdf) {
  const s = String(pdf ?? '').trim();
  if (!s) return true;
  if (/^(javascript:|vbscript:|data:)/i.test(s)) return false;
  return /^(assets\/|\/assets\/)[^?\s#]+\.pdf$/i.test(s);
}

function sanitizeAboutCertificatesLoaded(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    let image = String(item.image ?? '').trim().slice(0, 600000);
    if (!aboutCertImageAllowed(image)) continue;
    const alt = String(item.alt ?? '').trim().slice(0, 200);
    const badge = String(item.badge ?? '').trim().slice(0, 80);
    const title = String(item.title ?? '').trim().slice(0, 120);
    const description = String(item.description ?? '').trim().slice(0, 400);
    if (image.length < 3 || alt.length < 1 || title.length < 1 || description.length < 1) continue;
    const pdfRaw = String(item.pdf ?? '').trim().slice(0, 280);
    const pdf = aboutCertPdfAllowed(pdfRaw) ? pdfRaw.replace(/^\/+/, '') : '';
    const row = { image, alt, badge, title, description };
    if (pdf) row.pdf = pdf;
    out.push(row);
    if (out.length >= 12) break;
  }
  return out;
}

function aboutCertificatesForPublic(storedParsed) {
  const cleaned = sanitizeAboutCertificatesLoaded(storedParsed);
  return cleaned.length ? cleaned : [...DEFAULT_ABOUT_CERTIFICATES];
}

function sanitizeDeliveryCoverageLoaded(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title ?? '').trim().slice(0, 160);
  const cardsIn = Array.isArray(raw.cards) ? raw.cards : [];
  const cards = [];
  for (const c of cardsIn) {
    if (!c || typeof c !== 'object') continue;
    const cardTitle = String(c.title ?? '').trim().slice(0, 120);
    const text = String(c.text ?? '').trim().slice(0, 100);
    if (cardTitle.length < 1 || text.length < 1) continue;
    cards.push({ title: cardTitle, text });
    if (cards.length >= 8) break;
  }
  if (title.length < 3 || cards.length < 1) return null;
  return { title, cards };
}

function parseStoredDeliveryCoverage(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return null;
  try {
    return sanitizeDeliveryCoverageLoaded(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

/** Витрина: при битых данных в БД подставляем весь блок по умолчанию. */
function deliveryCoverageForPublic(rawValue) {
  const cleaned = parseStoredDeliveryCoverage(rawValue);
  if (cleaned) return cleaned;
  return {
    title: DEFAULT_DELIVERY_COVERAGE.title,
    cards: DEFAULT_DELIVERY_COVERAGE.cards.map((c) => ({ title: c.title, text: c.text })),
  };
}

function parseStoredJsonArray(kind, rawValue) {
  if (kind === 'deliverySlots') {
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (kind === 'sitePolls') {
    try {
      const parsed = JSON.parse(rawValue);
      return sanitizeSitePollsLoaded(parsed);
    } catch {
      return [];
    }
  }
  if (kind === 'aboutCertificates') {
    try {
      const parsed = JSON.parse(rawValue);
      return sanitizeAboutCertificatesLoaded(parsed);
    } catch {
      return [];
    }
  }
  try {
    const parsed = JSON.parse(rawValue);
    return sanitizeDeliveryFaqLoaded(parsed);
  } catch {
    return [];
  }
}

const ROOT = __dirname;
/** Первый порт из env PORT или 3001; при занятости последовательно пробуются следующие (см. PORT_FALLBACK_STEPS). */
const LISTEN_PREF = (() => {
  const n = Number(process.env.PORT);
  if (Number.isFinite(n) && n >= 1 && n <= 65535) return Math.floor(n);
  return 3001;
})();
/** Сколько портов перебрать подряд: LISTEN_PREF, LISTEN_PREF+1, … */
const PORT_FALLBACK_STEPS = (() => {
  const n = Number(process.env.PORT_FALLBACK_STEPS || 40);
  if (!Number.isFinite(n) || n < 1) return 40;
  return Math.min(Math.floor(n), 500);
})();

let resolvedListenPort = LISTEN_PREF;

app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(noCacheProtectedHtml);

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Слишком много попыток входа. Подождите 15 минут.',
  keyFn: (req) => `auth:${req.ip || req.socket?.remoteAddress || 'unknown'}`,
});

const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  message: 'Слишком много запросов. Подождите минуту.',
  keyFn: (req) => `api:${req.ip || req.socket?.remoteAddress || 'unknown'}`,
});

app.use('/api', apiRateLimit);

const feedbackRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 6,
  message: 'Слишком много сообщений. Повторите через минуту.',
  keyFn: (req) => `feedback:${req.ip || req.socket?.remoteAddress || 'unknown'}`,
});

/** Настройки сайта одним PUT включают FAQ, опросы и сертификаты с data:image — типичный лимит 1mb режет запрос без явной ошибки в UI. */
app.use(express.json({ limit: '15mb' }));
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

function destroySessionPromise(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

function sessionIdleExpired(req) {
  if (!req.session?.userId) return false;
  const last = Number(req.session.lastActivityAt) || 0;
  if (!last) return false;
  return Date.now() - last > SESSION_IDLE_MS;
}

/** Продление сессии только при явных действиях пользователя (см. X-User-Activity на клиенте) или мутациях API. */
function maybeTouchSessionActivity(req) {
  if (!req.session?.userId) return;
  const method = String(req.method || 'GET').toUpperCase();
  const userActive = String(req.headers['x-user-activity'] || '') === '1';
  if (method !== 'GET' && method !== 'HEAD') {
    req.session.lastActivityAt = Date.now();
    return;
  }
  if (userActive) req.session.lastActivityAt = Date.now();
}

function markSessionActive(req) {
  if (req.session?.userId) req.session.lastActivityAt = Date.now();
}

async function rejectIfSessionIdle(req, res) {
  if (!req.session?.userId) return false;
  if (!sessionIdleExpired(req)) return false;
  const uid = req.session.userId;
  try {
    await destroySessionPromise(req);
  } catch {
    /* ignore */
  }
  audit(db, uid, 'session_idle_expired', `idle_min=${SESSION_IDLE_MINUTES}`, req.ip);
  res.status(401).json({
    error: 'Сессия завершена из‑за бездействия. Войдите снова.',
    sessionExpired: true,
  });
  return true;
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
    email_verified: !!Number(row.email_verified),
    created_at: row.created_at || null,
  };
  if (row.role === 'driver') {
    base.driver_route_label = drl || '';
    base.driver_on_duty = !!Number(row.driver_on_duty);
  } else if (drl) base.driver_route_label = drl;
  return base;
}

/** Отображаются у водителей: заказы, которые оператор ведёт как «в работе», уже с назначенным экспедитором. */
const DRIVER_ORDER_STATUSES = ['pending_operator', 'confirmed', 'processing', 'courier', 'on_way'];
const DRIVER_ROUTE_TZ = 'Europe/Moscow';
/** Статусы, которые водитель может видеть в маршруте на сегодня (без отменённых и «новых»). */
const DRIVER_VISIBLE_STATUSES = [...DRIVER_ORDER_STATUSES, 'delivered'];

function moscowTodayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: DRIVER_ROUTE_TZ });
}

function driverOrderDaySql(alias = 'o') {
  const p = alias ? `${alias}.` : '';
  return `COALESCE(NULLIF(trim(${p}delivery_date), ''), to_char(${p}created_at AT TIME ZONE '${DRIVER_ROUTE_TZ}', 'YYYY-MM-DD'))`;
}

function driverTodayMoscowSql() {
  return `to_char((NOW() AT TIME ZONE '${DRIVER_ROUTE_TZ}')::date, 'YYYY-MM-DD')`;
}

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

function deriveDriverRouteLabelFromProfile(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function isDriverRole(role) {
  return String(role || '').trim().toLowerCase() === 'driver';
}

function normalizeDriverRouteKey(raw) {
  return String(raw || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('ru');
}

async function ensureDriverRouteLabelForUser(targetId) {
  const row = await getUserById(targetId);
  if (!row || !isDriverRole(row.role)) return;
  let lbl = String(row.driver_route_label || '').trim().replace(/\s+/g, ' ');
  if (lbl.length >= 2) return;
  lbl = deriveDriverRouteLabelFromProfile(row);
  if (lbl.length < 2) return;
  await assertDriverRouteLabelUnique(lbl, targetId);
  await db.prepare('UPDATE users SET driver_route_label = ? WHERE id = ?').run(lbl, targetId);
}

function driverAssignedLabel(row) {
  if (!row) return '';
  if (row.role != null && !isDriverRole(row.role)) return '';
  let lbl = String(row.driver_route_label || '').trim().replace(/\s+/g, ' ');
  if (lbl.length >= 2) return lbl;
  return deriveDriverRouteLabelFromProfile(row);
}

async function loadDriverRouteLabelIndex() {
  const rows = await db
    .prepare(
      `SELECT first_name, last_name, driver_route_label, role FROM users
       WHERE lower(role) = 'driver' AND COALESCE(blocked, 0) = 0`
    )
    .all();
  const byLower = new Map();
  for (const row of rows) {
    const lbl = driverAssignedLabel(row);
    if (lbl.length < 2) continue;
    byLower.set(normalizeDriverRouteKey(lbl), lbl);
    const profileKey = normalizeDriverRouteKey(deriveDriverRouteLabelFromProfile(row));
    if (profileKey.length >= 2 && !byLower.has(profileKey)) {
      byLower.set(profileKey, lbl);
    }
  }
  return byLower;
}

async function resolveDriverRouteLabel(raw) {
  const key = normalizeDriverRouteKey(raw);
  if (!key) return '';
  const idx = await loadDriverRouteLabelIndex();
  return idx.get(key) || null;
}

/** Назначение экспедитора: каноническая метка из учётки водителя + перевод «новый» → «в обработке». */
const ORDER_ZONE_NAME_ALIASES = new Map([
  ['доп.зона', 'Доп. зона'],
  ['доп зона', 'Доп. зона'],
]);

/** Согласование зоны заказа со справочником delivery_zones (FK orders.zone). */
async function resolveOrderZoneForDb(rawZone) {
  let zone = String(rawZone ?? '').trim();
  if (!zone) return { ok: true, zone: '' };
  const alias = ORDER_ZONE_NAME_ALIASES.get(zone.toLowerCase());
  if (alias) zone = alias;
  const row = await db.prepare('SELECT name FROM delivery_zones WHERE name = ? LIMIT 1').get(zone);
  if (row?.name) return { ok: true, zone: String(row.name) };
  try {
    await db.prepare('INSERT INTO delivery_zones (name, tariff, bounds_json) VALUES (?, 0, ?)').run(zone, '{}');
    return { ok: true, zone };
  } catch {
    return {
      ok: false,
      error: `Зона «${zone}» отсутствует в справочнике. Обновите страницу (F5) или выберите зону из списка.`,
    };
  }
}

async function normalizeOperatorOrderDriverInput(rawDriver, currentStatus) {
  const raw = String(rawDriver ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return { driver: '', statusBump: null };
  const resolved = await resolveDriverRouteLabel(raw);
  if (!resolved) {
    return {
      error:
        `Водитель «${raw}» не найден. Создайте учётную запись с ролью «Водитель» в админке (ФИО как в списке) и обновите страницу оператора (F5).`,
    };
  }
  const statusBump =
    String(currentStatus || 'new').trim().toLowerCase() === 'new' ? 'pending_operator' : null;
  return { driver: resolved, statusBump };
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

/** Если БД недоступна — заявка не теряется; админ может забрать из файла. */
function appendFeedbackFallback(record) {
  try {
    const dir = path.join(ROOT, 'data');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'feedback-fallback.ndjson'), `${JSON.stringify(record)}\n`, {
      encoding: 'utf8',
    });
    // eslint-disable-next-line no-console
    console.warn('[feedback] сохранено в data/feedback-fallback.ndjson');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[feedback] не удалось записать fallback:', e && e.message);
  }
}

/**
 * Пытается записать в БД; при любой ошибке — дублирует во внешний файл и не бросает наружу.
 * Для клиента после валидации заявка считается принятой (см. ответ маршрута).
 */
async function savePublicFeedbackRow({ userId, name, phone, message }, req) {
  const fbRec = {
    at: new Date().toISOString(),
    userId,
    name,
    phone,
    message,
    ip: String(req.ip || req.socket?.remoteAddress || '').slice(0, 80),
    ua: String(req.headers['user-agent'] || '').slice(0, 500),
    source: 'callback_form',
  };

  try {
    let storedUserId = userId;
    let dbSaved = false;
    try {
      await db
        .prepare('INSERT INTO feedback_messages (user_id, name, phone, message) VALUES (?, ?, ?, ?)')
        .run(storedUserId, name, phone, message);
      dbSaved = true;
    } catch (err) {
      const code = err && err.code;
      // eslint-disable-next-line no-console
      console.error('[feedback] INSERT', code || '', err && err.message);
      if (code === '23503' && storedUserId != null) {
        try {
          await db
            .prepare('INSERT INTO feedback_messages (user_id, name, phone, message) VALUES (?, ?, ?, ?)')
            .run(null, name, phone, message);
          storedUserId = null;
          dbSaved = true;
        } catch (err2) {
          // eslint-disable-next-line no-console
          console.error('[feedback] INSERT без user_id', err2 && err2.code, err2 && err2.message);
        }
      }
      if (!dbSaved) appendFeedbackFallback(fbRec);
    }

    if (dbSaved) audit(db, storedUserId, 'feedback', `phone=${phone}`, req.ip);
  } catch (fatal) {
    // eslint-disable-next-line no-console
    console.error('[feedback] savePublicFeedbackRow', fatal && fatal.message);
    appendFeedbackFallback(fbRec);
  }
}

async function handlePublicFeedbackSubmit(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    const raw =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    /** Строками: номер может прилететь числом из других клиентов. */
    const payloadIn = {
      name: raw.name != null ? String(raw.name) : '',
      phone: raw.phone != null ? String(raw.phone) : '',
      message: raw.message != null ? String(raw.message) : '',
    };

    const v = schemas.validate(schemas.feedbackSchema, payloadIn);
    if (!v.ok) {
      // eslint-disable-next-line no-console
      console.warn('[feedback] Joi validation:', v.error || '(detail omitted)');
      res.status(400).json({ ok: false });
      return;
    }

    const name = sanitizeFeedbackText(v.value.name);
    const phone = String(v.value.phone || '').replace(/\D/g, '');
    const message = sanitizeFeedbackText(v.value.message);
    if (name.length < 2 || phone.length !== 11 || message.length < 10) {
      // eslint-disable-next-line no-console
      console.warn('[feedback] Отклонено после санитизации (длины полей).');
      res.status(400).json({ ok: false });
      return;
    }

    let userId = null;
    try {
      if (req.session && req.session.userId) {
        const uid = Number(req.session.userId);
        if (Number.isFinite(uid) && uid > 0) {
          const exists = await db.prepare('SELECT 1 AS ok FROM users WHERE id = ?').get(uid);
          if (exists) userId = uid;
        }
      }
    } catch (sessionErr) {
      // eslint-disable-next-line no-console
      console.warn('[feedback] пользователь для привязки:', sessionErr && sessionErr.message);
    }

    await savePublicFeedbackRow({ userId, name, phone, message }, req);
    res.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[feedback] критическая ошибка:', e && e.stack);
    try {
      const raw =
        req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      const nameFallback = sanitizeFeedbackText(String(raw.name ?? '')).slice(0, 160);
      const phoneFallback = String(raw.phone ?? '')
        .replace(/\D/g, '')
        .slice(0, 15);
      const messageFallback = sanitizeFeedbackText(String(raw.message ?? '')).slice(0, 2200);
      if (messageFallback.length >= 5) {
        appendFeedbackFallback({
          at: new Date().toISOString(),
          userId: null,
          name: nameFallback,
          phone: phoneFallback,
          message: messageFallback,
          ip: String(req.ip || '').slice(0, 80),
          ua: String(req.headers['user-agent'] || '').slice(0, 500),
          source: 'callback_form_critical',
          detail: String(e && e.message ? e.message : e).slice(0, 500),
        });
      }
    } catch (_) {
      /* ignore */
    }
    if (!res.headersSent) res.json({ ok: true });
  }
}

async function findUserByCredential(cred) {
  const n = normalizeCredential(cred);
  if (n.kind === 'phone') return db.prepare('SELECT * FROM users WHERE phone = ?').get(n.value);
  if (n.kind === 'email') return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(n.value);
  return null;
}

async function findUserByEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(e);
}

function authToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function generateAuthCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashAuthCode(code) {
  return bcrypt.hashSync(String(code), 10);
}

function verifyAuthCode(code, hash) {
  if (!code || !hash) return false;
  return bcrypt.compareSync(String(code), String(hash));
}

function emailCodeDeliveryPayload(mailResult, email) {
  const addr = String(email || '').trim();
  if (!mailer.isMailConfigured() || mailResult?.dev) {
    return {
      ok: false,
      status: 503,
      error: mailer.formatSmtpClientError(
        new Error('SMTP не настроен или письмо ушло только в консоль (режим без SMTP)')
      ),
    };
  }
  return {
    ok: true,
    message: `Код отправлен на ${addr}. Проверьте входящие и папку «Спам».`,
    email: addr,
  };
}

async function sendEmailVerificationForUser(user) {
  if (!user || !user.id) return null;
  const code = generateAuthCode();
  const codeHash = hashAuthCode(code);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare(
      `UPDATE users SET email_verify_token = ?, email_verify_expires = ?, email_verified = 0 WHERE id = ?`
    )
    .run(codeHash, expires, user.id);
  const mailResult = await mailer.sendVerificationCodeEmail({
    email: user.email,
    code,
    firstName: user.first_name,
    lastName: user.last_name,
  });
  return { code, mailResult };
}

async function sendPasswordResetForUser(user) {
  if (!canSelfServicePasswordReset(user)) {
    const err = new Error('password_self_service_denied');
    err.status = 403;
    throw err;
  }
  if (!user || !user.id) return null;
  const code = generateAuthCode();
  const codeHash = hashAuthCode(code);
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await db
    .prepare(`UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?`)
    .run(codeHash, expires, user.id);
  const mailResult = await mailer.sendPasswordCodeEmail({
    email: user.email,
    code,
    firstName: user.first_name,
    lastName: user.last_name,
  });
  return { code, mailResult };
}

const CLIENT_SAVED_ADDRESS_LIMIT = 20;

function publicClientSavedAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label || '',
    address_line: row.address_line,
    is_default: !!Number(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listClientSavedAddresses(userId) {
  return db
    .prepare(
      `SELECT * FROM client_saved_addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC, id DESC`
    )
    .all(userId);
}

async function backfillClientSavedAddressesFromOrders(userId) {
  const countRow = await db
    .prepare('SELECT COUNT(*) AS c FROM client_saved_addresses WHERE user_id = ?')
    .get(userId);
  if (Number(countRow?.c || 0) > 0) return;
  const rows = await db
    .prepare(
      `SELECT address AS address_line FROM orders
       WHERE user_id = ? AND trim(address) <> ''
       GROUP BY address
       ORDER BY MAX(id) DESC
       LIMIT 10`
    )
    .all(userId);
  let first = true;
  for (const row of rows) {
    const line = String(row.address_line || '').trim();
    if (line.length < 8) continue;
    await db
      .prepare(
        `INSERT INTO client_saved_addresses (user_id, label, address_line, is_default) VALUES (?, ?, ?, ?)`
      )
      .run(userId, '', line, first ? 1 : 0);
    first = false;
  }
}

async function rememberClientDeliveryAddress(userId, addressLine) {
  const line = String(addressLine || '').trim();
  if (line.length < 8) return;
  const existing = await db
    .prepare(
      `SELECT id FROM client_saved_addresses WHERE user_id = ? AND lower(trim(address_line)) = lower(trim(?))`
    )
    .get(userId, line);
  if (existing) {
    await db.prepare(`UPDATE client_saved_addresses SET updated_at = NOW() WHERE id = ?`).run(existing.id);
    return;
  }
  const countRow = await db
    .prepare('SELECT COUNT(*) AS c FROM client_saved_addresses WHERE user_id = ?')
    .get(userId);
  const count = Number(countRow?.c || 0);
  if (count >= CLIENT_SAVED_ADDRESS_LIMIT) return;
  const isDefault = count === 0 ? 1 : 0;
  await db
    .prepare(
      `INSERT INTO client_saved_addresses (user_id, label, address_line, is_default) VALUES (?, ?, ?, ?)`
    )
    .run(userId, '', line, isDefault);
}

async function setClientSavedAddressDefault(userId, addressId) {
  await db.withTransaction(async (tx) => {
    await tx.prepare('UPDATE client_saved_addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    await tx
      .prepare(
        'UPDATE client_saved_addresses SET is_default = 1, updated_at = NOW() WHERE id = ? AND user_id = ?'
      )
      .run(addressId, userId);
  });
}

function authCodeExpired(expiresIso) {
  const exp = expiresIso ? new Date(expiresIso).getTime() : 0;
  return !exp || exp < Date.now();
}

function clientNeedsEmailVerification() {
  return false;
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
  if (await rejectIfSessionIdle(req, res)) return;
  const user = await getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.status(403).json({ error: 'Доступ запрещён.' });
  }
  req.user = user;
  if (!req.session.lastActivityAt) markSessionActive(req);
  maybeTouchSessionActivity(req);
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
  /** Публичная форма на лендинге: без проверки CSRF, чтобы отправка не ломалась из-за сессии. */
  const pathOnly = req.path || (typeof req.originalUrl === 'string' ? req.originalUrl.replace(/\?.*$/, '') : '');
  if (pathOnly === '/api/feedback') return next();

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
  res.json({
    bootId: CLIENT_BOOT_ID,
    sessionIdleMinutes: SESSION_IDLE_MINUTES,
    mailConfigured: mailer.isMailConfigured(),
  });
});

/** Без секретов: проверка .env на VPS после выкладки (verify-remote-host.mjs). */
app.get('/api/public/deploy-status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const baseUrl = String(process.env.APP_BASE_URL || '').trim();
  const secureCookies = String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true';
  const nodeEnv = String(process.env.NODE_ENV || '').trim();
  const secretLen = String(process.env.SESSION_SECRET || '').trim().length;
  res.json({
    ok: true,
    appBaseUrl: baseUrl || null,
    nodeEnv: nodeEnv || null,
    secureCookies,
    sessionSecretOk: secretLen >= 32,
    mailConfigured: mailer.isMailConfigured(),
    mapsKeyConfigured: Boolean(String(process.env.YANDEX_MAPS_API_KEY || '').trim()),
  });
});

app.get('/api/public/settings', asyncHandler(async (req, res) => {
  const keys = ['workLine', 'deliverySlots', 'communityIntro', 'deliveryFaq', 'sitePolls', 'aboutCertificates'];
  const jsonKeys = new Set(['deliverySlots', 'deliveryFaq', 'sitePolls', 'aboutCertificates']);
  const out = {};
  const stmt = db.prepare('SELECT value FROM site_settings WHERE key = ?');
  for (const k of keys) {
    const r = await stmt.get(k);
    if (!r) continue;
    if (jsonKeys.has(k)) out[k] = parseStoredJsonArray(k, r.value);
    else out[k] = r.value;
  }
  out.deliveryFaq = deliveryFaqForPublic(Array.isArray(out.deliveryFaq) ? out.deliveryFaq : []);
  out.sitePolls = sitePollsForPublic(Array.isArray(out.sitePolls) ? out.sitePolls : []);
  out.aboutCertificates = aboutCertificatesForPublic(Array.isArray(out.aboutCertificates) ? out.aboutCertificates : []);
  const covRow = await stmt.get('deliveryCoverage');
  out.deliveryCoverage = deliveryCoverageForPublic(covRow?.value);
  const blogPollRow = await stmt.get('blogHydrationPoll');
  if (blogPollRow?.value) {
    try {
      const parsed = pollVotes.sanitizeBlogHydrationPoll(JSON.parse(blogPollRow.value));
      if (parsed?.active) out.blogHydrationPoll = parsed;
    } catch {
      /* ignore */
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json(out);
}));

app.get('/api/public/poll-aggregates', asyncHandler(async (req, res) => {
  const polls = await pollVotes.loadPollDefinitions(db, pollVoteHelpers);
  const pollIds = polls.map((p) => p.id);
  const aggregates = await pollVotes.getPollAggregates(db, pollIds);
  res.set('Cache-Control', 'no-store');
  res.json({ aggregates });
}));

app.post('/api/polls/vote', csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.pollVoteSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const voterKey = pollVotes.getVoterKey(req);
  const userId = req.session?.userId || null;
  try {
    const result = await pollVotes.castPollVote(
      db,
      v.value.poll_id,
      v.value.option_id,
      voterKey,
      userId,
      pollVoteHelpers
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    const status = Number(e?.status) || 500;
    if (status >= 500) {
      return res.status(500).json({ error: 'Не удалось сохранить голос.' });
    }
    return res.status(status).json({ error: String(e.message || 'Не удалось проголосовать.') });
  }
}));

mountGeocodeRoutes(app, { asyncHandler });

app.get('/api/public/water-calc', asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.waterCalcQuerySchema, req.query);
  if (!v.ok) return res.status(400).json({ error: v.error });
  res.set('Cache-Control', 'no-store');
  res.json(estimateWaterConsumption(v.value));
}));

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
  const availability = await loadDeliveryAvailability();
  res.json({ deliverySlots, addresses, availability });
}));

app.get('/api/public/delivery-availability', asyncHandler(async (_req, res) => {
  const record = await loadDeliveryAvailabilityRecord();
  const availability = deliveryAvailability.pruneAvailabilityToBookingWindow(
    record.availability || deliveryAvailability.emptyAvailability()
  );
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.json({
    closedDays: availability.closedDays,
    closedSlots: availability.closedSlots,
    updatedAt: record.meta?.updatedAt || null,
  });
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
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
  if (sessionIdleExpired(req)) {
    try {
      await destroySessionPromise(req);
    } catch {
      /* ignore */
    }
    return res.json({ user: null, sessionExpired: true });
  }
  let user = await getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.json({ user: null });
  }
  if (String(user.role || '').toLowerCase() === 'client') {
    await bonusProgram.expireUserBonuses(db, uid);
    await bonusProgram.syncBonusBalanceFromLots(db, uid);
    user = await getUserById(uid);
  }
  maybeTouchSessionActivity(req);
  res.json({ user: publicUser(user) });
}));

async function getRegistrationEmailAvailability(email) {
  const row = await db
    .prepare('SELECT id, role FROM users WHERE lower(email) = lower(?)')
    .get(email);
  if (!row) {
    return {
      available: true,
      message:
        'Email свободен. Нажмите «Отправить код» — на этот адрес придёт письмо для подтверждения.',
    };
  }
  const role = String(row.role || '').toLowerCase();
  if (isStaffRole(role)) {
    return {
      available: false,
      reason: 'staff',
      message:
        'Этот email зарезервирован для служебного входа. Используйте форму «Вход», а не регистрацию.',
    };
  }
  return {
    available: false,
    reason: 'taken',
    message:
      'Этот email уже зарегистрирован. Войдите в аккаунт или нажмите «Забыли пароль?» на вкладке входа.',
  };
}

app.post('/api/auth/check-registration', authRateLimit, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.checkRegistrationSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const out = {};

  if (v.value.email) {
    out.email = await getRegistrationEmailAvailability(v.value.email);
  }

  if (v.value.phone) {
    const phone = v.value.phone;
    const row = await db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (row) {
      out.phone = {
        available: false,
        reason: 'taken',
        message: 'Этот телефон уже привязан к аккаунту. Войдите или укажите другой номер.',
      };
    } else {
      out.phone = {
        available: true,
        message: 'Номер свободен.',
      };
    }
  }

  res.json(out);
}));

app.post('/api/auth/register', authRateLimit, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.registerSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone, password } = v.value;

  const availability = await getRegistrationEmailAvailability(email);
  if (!availability.available) {
    return res.status(409).json({
      error: availability.message,
      field: 'email',
    });
  }

  const phoneRow = await db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (phoneRow) {
    return res.status(409).json({
      error: 'Этот телефон уже привязан к другому аккаунту. Войдите или укажите другой номер.',
      field: 'phone',
    });
  }

  const password_hash = bcrypt.hashSync(password, 12);
  let info;
  try {
    info = await db
      .prepare(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at, email_verified, email_verify_token, email_verify_expires)
         VALUES (?, ?, ?, ?, ?, 'client', NOW()::text, 1, NULL, NULL)`
      )
      .run(email, phone, password_hash, first_name, last_name || '');
  } catch (e) {
    const code = e && e.code;
    // eslint-disable-next-line no-console
    console.error('[register] INSERT', code || '', e && e.message);
    if (code === '23505') {
      return res.status(409).json({ error: 'Email или телефон уже зарегистрированы.' });
    }
    return res.status(500).json({
      error:
        'Не удалось зарегистрироваться. Обновите страницу и попробуйте снова. Если уже создавали аккаунт — войдите через «Вход».',
    });
  }

  let newId = info && info.lastInsertRowid;
  if (newId == null) {
    try {
      const row = await db
        .prepare('SELECT id FROM users WHERE lower(email) = lower(?) ORDER BY id DESC LIMIT 1')
        .get(email);
      if (row && row.id != null) newId = Number(row.id);
    } catch (_) {
      /* noop */
    }
  }
  if (newId == null) {
    // eslint-disable-next-line no-console
    console.error('[register] INSERT не вернул id (RETURNING), info=', info);
    return res.status(500).json({
      error: 'Не удалось завершить регистрацию. Проверьте консоль сервера или попробуйте войти.',
    });
  }

  const user = await getUserById(newId);
  if (!user) {
    // eslint-disable-next-line no-console
    console.error('[register] Пользователь не найден сразу после INSERT, id=', newId);
    return res.status(500).json({
      error: 'Запись не прочиталась из базы. Попробуйте войти через форму «Вход».',
    });
  }

  audit(db, user.id, 'register', `email=${email}`, req.ip);

  try {
    await clientNotifications.notifyWelcomeRegistration(db, user.id);
  } catch (notifErr) {
    // eslint-disable-next-line no-console
    console.error('[register] welcome notification', notifErr && notifErr.message);
  }

  req.session.userId = user.id;
  markSessionActive(req);
  try {
    await saveSessionPromise(req);
  } catch (sessErr) {
    // eslint-disable-next-line no-console
    console.error('[register] Ошибка сохранения сессии:', sessErr);
  }

  const updated = await getUserById(user.id);
  res.json({
    user: publicUser(updated || user),
    message: 'Регистрация успешна. Можно оформлять заказы.',
  });
}));

app.post('/api/auth/login', authRateLimit, csrfMiddleware, asyncHandler(async (req, res) => {
  const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
  const hasEmailField = rawBody.email != null && String(rawBody.email).trim() !== '';
  const v = hasEmailField
    ? schemas.validate(schemas.clientLoginSchema, rawBody)
    : schemas.validate(schemas.loginSchema, rawBody);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const password = v.value.password;
  let user = null;
  if (hasEmailField) {
    user = await findUserByEmail(v.value.email);
  } else {
    const { credential } = v.value;
    const credNorm = normalizeCredential(credential);
    user = await findUserByCredential(credential);
    const roleLower = String(user?.role || '').toLowerCase();
    if (user && roleLower === 'client' && credNorm.kind === 'phone') {
      return res.status(401).json({ error: 'Вход в личный кабинет возможен только по email.' });
    }
    if (['operator', 'manager', 'admin', 'driver'].includes(roleLower) && credNorm.kind === 'phone') {
      return res.status(401).json({ error: 'Вход сотрудника и водителя возможен только по email.' });
    }
  }

  if (!user) return res.status(401).json({ error: 'Неверный email или пароль.' });
  const roleLower = String(user.role || '').toLowerCase();
  if (roleLower === 'client' && schemas.isPseudoClientEmail(user.email)) {
    return res.status(401).json({ error: 'Для этого номера оформите полную регистрацию с вашим email на сайте.' });
  }
  if (user.blocked) return res.status(403).json({ error: 'Учётная запись заблокирована.' });
  if (isLocked(user)) {
    return res.status(423).json({ error: 'Вход временно заблокирован после неудачных попыток. Попробуйте позже.' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    await recordLoginFail(user.id);
    return res.status(401).json({ error: 'Неверный email или пароль.' });
  }

  await recordLoginOk(user.id);
  req.session.userId = user.id;
  markSessionActive(req);
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

app.get('/api/auth/verify-email', asyncHandler(async (req, res) => {
  res.redirect('/cabinet.html#cabinet-verify-email');
}));

app.post('/api/auth/send-email-verify-code', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (String(user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Подтверждение email доступно только клиентам.' });
  }
  if (Number(user.email_verified)) {
    return res.json({ ok: true, message: 'Email уже подтверждён.' });
  }
  if (schemas.isPseudoClientEmail(user.email)) {
    return res.status(400).json({ error: 'Для этой учётной записи подтверждение недоступно.' });
  }

  let sent;
  try {
    sent = await sendEmailVerificationForUser(user);
  } catch (mailErr) {
    // eslint-disable-next-line no-console
    console.error('[send-email-verify-code]', mailErr && mailErr.message);
    console.error('[send-email-verify-code] SMTP:', mailer.formatSmtpUserError(mailErr));
    return res.status(500).json({ error: mailer.formatSmtpClientError(mailErr) });
  }

  const delivery = emailCodeDeliveryPayload(sent?.mailResult, user.email);
  if (!delivery.ok) {
    console.error('[send-email-verify-code] delivery:', delivery.error);
    return res.status(delivery.status || 503).json({ error: delivery.error });
  }

  res.json({ ok: true, email: delivery.email, message: delivery.message });
}));

app.post('/api/auth/confirm-email-code', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.confirmEmailCodeSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (Number(user.email_verified)) {
    return res.json({ ok: true, user: publicUser(user), message: 'Email уже подтверждён.' });
  }
  if (!user.email_verify_token || authCodeExpired(user.email_verify_expires)) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый код на email.' });
  }
  if (!verifyAuthCode(v.value.code, user.email_verify_token)) {
    return res.status(400).json({ error: 'Неверный код. Проверьте письмо и попробуйте снова.' });
  }

  await db
    .prepare(
      `UPDATE users SET email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL WHERE id = ?`
    )
    .run(user.id);
  const updated = await getUserById(user.id);
  audit(db, user.id, 'email_verified', user.email, req.ip);
  res.json({
    ok: true,
    user: publicUser(updated),
    message: 'Email подтверждён и сохранён в базе данных.',
  });
}));

app.post('/api/auth/resend-verification', authRateLimit, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.forgotPasswordSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await findUserByEmail(v.value.email);
  if (user && String(user.role || '').toLowerCase() === 'client' && !Number(user.email_verified)) {
    try {
      await sendEmailVerificationForUser(user);
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('[resend-verification]', mailErr && mailErr.message);
    }
  }

  res.json({
    ok: true,
    message: 'Если аккаунт с таким email зарегистрирован и ещё не подтверждён, мы отправили новый код.',
  });
}));

app.post('/api/auth/forgot-password', authRateLimit, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.forgotPasswordSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await findUserByEmail(v.value.email);
  if (!canSelfServicePasswordReset(user)) {
    return res.status(404).json({ error: PASSWORD_RESET_NOT_FOUND_MSG });
  }

  let delivery;
  try {
    const sent = await sendPasswordResetForUser(user);
    delivery = emailCodeDeliveryPayload(sent?.mailResult, user.email);
  } catch (mailErr) {
    // eslint-disable-next-line no-console
    console.error('[forgot-password]', mailErr && mailErr.message);
    console.error('[forgot-password] SMTP:', mailer.formatSmtpUserError(mailErr));
    return res.status(500).json({ error: mailer.formatSmtpClientError(mailErr) });
  }
  if (!delivery?.ok) {
    console.error('[forgot-password] mail not sent:', delivery?.error);
    return res.status(delivery?.status || 500).json({
      error: delivery?.error || mailer.formatSmtpClientError(new Error('mail_not_sent')),
    });
  }

  res.json({
    ok: true,
    message: delivery.message || 'Код отправлен на email. Введите его ниже.',
  });
}));

app.post('/api/auth/send-password-code', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (!canSelfServicePasswordReset(user)) {
    return res.status(403).json({
      error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
    });
  }

  let sent;
  try {
    sent = await sendPasswordResetForUser(user);
  } catch (mailErr) {
    if (Number(mailErr?.status) === 403) {
      return res.status(403).json({
        error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
      });
    }
    // eslint-disable-next-line no-console
    console.error('[send-password-code]', mailErr && mailErr.message);
    console.error('[send-password-code] SMTP:', mailer.formatSmtpUserError(mailErr));
    return res.status(500).json({ error: mailer.formatSmtpClientError(mailErr) });
  }

  const delivery = emailCodeDeliveryPayload(sent?.mailResult, user.email);
  if (!delivery.ok) {
    console.error('[send-password-code] delivery:', delivery.error);
    return res.status(delivery.status || 503).json({ error: delivery.error });
  }

  audit(db, user.id, 'password_reset_requested', user.email, req.ip);
  res.json({ ok: true, email: delivery.email, message: delivery.message });
}));

app.post('/api/auth/verify-password-reset-code', authRateLimit, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.checkPasswordResetByEmailSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await findUserByEmail(v.value.email);
  if (!canSelfServicePasswordReset(user)) {
    return res.status(400).json({ error: 'Неверный код или email. Запросите новый код.' });
  }
  if (!user.password_reset_token || authCodeExpired(user.password_reset_expires)) {
    return res.status(400).json({ error: 'Код истёк. Нажмите «Отправить код» ещё раз.' });
  }
  if (!verifyAuthCode(v.value.code, user.password_reset_token)) {
    return res.status(400).json({ error: 'Неверный код. Действует только последний код из письма.' });
  }

  res.json({
    ok: true,
    message: 'Код принят. Задайте новый пароль.',
  });
}));

app.post('/api/auth/verify-password-code', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.confirmEmailCodeSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (!canSelfServicePasswordReset(user)) {
    return res.status(403).json({
      error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
    });
  }
  if (!user.password_reset_token || authCodeExpired(user.password_reset_expires)) {
    return res.status(400).json({ error: 'Код истёк. Нажмите «Отправить код на email» ещё раз.' });
  }
  if (!verifyAuthCode(v.value.code, user.password_reset_token)) {
    return res.status(400).json({ error: 'Неверный код. Действует только последний код из письма.' });
  }

  res.json({
    ok: true,
    message: 'Код верный. Задайте новый пароль на шаге 3.',
  });
}));

app.post('/api/auth/change-password-with-code', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.changePasswordWithCodeSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (!canSelfServicePasswordReset(user)) {
    return res.status(403).json({
      error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
    });
  }
  if (!user.password_reset_token || authCodeExpired(user.password_reset_expires)) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый код на email.' });
  }
  if (!verifyAuthCode(v.value.code, user.password_reset_token)) {
    return res.status(400).json({ error: 'Неверный код. Проверьте письмо и попробуйте снова.' });
  }

  const password_hash = bcrypt.hashSync(v.value.password, 12);
  await db
    .prepare(
      `UPDATE users SET password_hash = ?, password_changed_at = NOW()::text, password_reset_token = NULL, password_reset_expires = NULL, login_attempts = 0, locked_until = NULL WHERE id = ?`
    )
    .run(password_hash, user.id);

  audit(db, user.id, 'password_reset', '', req.ip);
  res.json({ ok: true, message: 'Пароль обновлён и сохранён в базе данных.' });
}));

app.post('/api/auth/request-password-reset', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Требуется вход.' });
  if (!canSelfServicePasswordReset(user)) {
    return res.status(403).json({
      error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
    });
  }

  let sent;
  try {
    sent = await sendPasswordResetForUser(user);
  } catch (mailErr) {
    if (Number(mailErr?.status) === 403) {
      return res.status(403).json({
        error: 'Смена пароля по email недоступна. Обратитесь к администратору.',
      });
    }
    // eslint-disable-next-line no-console
    console.error('[request-password-reset]', mailErr && mailErr.message);
    console.error('[request-password-reset] SMTP:', mailer.formatSmtpUserError(mailErr));
    return res.status(500).json({ error: mailer.formatSmtpClientError(mailErr) });
  }

  const delivery = emailCodeDeliveryPayload(sent?.mailResult, user.email);
  if (!delivery.ok) {
    console.error('[request-password-reset] delivery:', delivery.error);
    return res.status(delivery.status || 503).json({ error: delivery.error });
  }

  audit(db, user.id, 'password_reset_requested', user.email, req.ip);
  res.json({
    ok: true,
    email: delivery.email,
    message: delivery.message,
  });
}));

async function handleResetPasswordByEmail(req, res) {
  const v = schemas.validate(schemas.resetPasswordByEmailSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await findUserByEmail(v.value.email);
  if (!canSelfServicePasswordReset(user)) {
    return res.status(400).json({ error: 'Неверный код или email. Запросите новый код на email.' });
  }
  if (!user.password_reset_token || authCodeExpired(user.password_reset_expires)) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый код на email.' });
  }
  if (!verifyAuthCode(v.value.code, user.password_reset_token)) {
    return res.status(400).json({ error: 'Неверный код. Проверьте письмо и попробуйте снова.' });
  }

  const password_hash = bcrypt.hashSync(v.value.password, 12);
  await db
    .prepare(
      `UPDATE users SET password_hash = ?, password_changed_at = NOW()::text, password_reset_token = NULL, password_reset_expires = NULL, login_attempts = 0, locked_until = NULL WHERE id = ?`
    )
    .run(password_hash, user.id);
  audit(db, user.id, 'password_reset', 'by_email', req.ip);
  res.json({ ok: true, message: 'Пароль обновлён. Войдите с новым паролем.' });
}

app.post('/api/auth/reset-password-by-email', authRateLimit, asyncHandler(handleResetPasswordByEmail));

app.post('/api/auth/reset-password', authRateLimit, asyncHandler(async (req, res) => {
  const byEmail = schemas.validate(schemas.resetPasswordByEmailSchema, req.body);
  if (byEmail.ok) {
    req.body = byEmail.value;
    return handleResetPasswordByEmail(req, res);
  }

  const legacy = schemas.validate(schemas.resetPasswordSchema, req.body);
  if (legacy.ok) {
    const { token, password } = legacy.value;
    const user = await db.prepare('SELECT * FROM users WHERE password_reset_token = ?').get(token);
    if (!user || authCodeExpired(user.password_reset_expires) || !canSelfServicePasswordReset(user)) {
      return res.status(400).json({ error: 'Код или ссылка недействительны. Запросите новый код.' });
    }
    const password_hash = bcrypt.hashSync(password, 12);
    await db
      .prepare(
        `UPDATE users SET password_hash = ?, password_changed_at = NOW()::text, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?`
      )
      .run(password_hash, user.id);
    return res.json({ ok: true, message: 'Пароль обновлён.' });
  }

  return res.status(400).json({
    error: 'Укажите email, 6-значный код из письма и новый пароль (страница reset-password.html).',
  });
}));

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

  const prev = await getUserById(req.user.id);
  const emailChanged = prev && String(prev.email || '').toLowerCase() !== String(email).toLowerCase();
  const isClient = String(prev?.role || '').toLowerCase() === 'client';

  if (emailChanged && isStaffRole(prev?.role)) {
    return res.status(403).json({ error: 'Email сотрудника может изменить только администратор.' });
  }

  if (emailChanged && isClient) {
    await db
      .prepare(
        `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL WHERE id = ?`
      )
      .run(first_name, last_name || '', email, phone, req.user.id);
  } else {
    await db.prepare(
      `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?`
    ).run(first_name, last_name || '', email, phone, req.user.id);
  }

  const user = await getUserById(req.user.id);
  audit(db, req.user.id, 'profile_update', emailChanged ? `email_changed=${email}` : '', req.ip);
  const out = { user: publicUser(user) };
  if (emailChanged) {
    out.message = 'Профиль сохранён. Email обновлён.';
  }
  res.json(out);
}));

app.get('/api/profile/addresses', requireAuth, asyncHandler(async (req, res) => {
  if (String(req.user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Раздел доступен только клиентам.' });
  }
  await backfillClientSavedAddressesFromOrders(req.user.id);
  const rows = await listClientSavedAddresses(req.user.id);
  res.json({ addresses: rows.map(publicClientSavedAddress) });
}));

app.post('/api/profile/addresses', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  if (String(req.user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Раздел доступен только клиентам.' });
  }
  const v = schemas.validate(schemas.clientSavedAddressCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const addrCheck = orenburgAddress.validateDeliveryAddressLine(v.value.address_line);
  if (!addrCheck.ok) return res.status(400).json({ error: addrCheck.error });

  const countRow = await db
    .prepare('SELECT COUNT(*) AS c FROM client_saved_addresses WHERE user_id = ?')
    .get(req.user.id);
  if (Number(countRow?.c || 0) >= CLIENT_SAVED_ADDRESS_LIMIT) {
    return res.status(400).json({ error: `Можно сохранить не более ${CLIENT_SAVED_ADDRESS_LIMIT} адресов.` });
  }

  const dup = await db
    .prepare(
      `SELECT id FROM client_saved_addresses WHERE user_id = ? AND lower(trim(address_line)) = lower(trim(?))`
    )
    .get(req.user.id, v.value.address_line);
  if (dup) return res.status(409).json({ error: 'Такой адрес уже есть в списке.' });

  const wantDefault = !!v.value.is_default || Number(countRow?.c || 0) === 0;
  if (wantDefault) {
    await db.prepare('UPDATE client_saved_addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  const info = await db
    .prepare(
      `INSERT INTO client_saved_addresses (user_id, label, address_line, is_default) VALUES (?, ?, ?, ?)`
    )
    .run(req.user.id, v.value.label || '', v.value.address_line, wantDefault ? 1 : 0);
  const row = await db.prepare('SELECT * FROM client_saved_addresses WHERE id = ?').get(info.lastInsertRowid);
  audit(db, req.user.id, 'client_address_create', `id=${row.id}`, req.ip);
  res.json({ address: publicClientSavedAddress(row) });
}));

app.patch('/api/profile/addresses/:id', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  if (String(req.user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Раздел доступен только клиентам.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Некорректный адрес.' });

  const cur = await db
    .prepare('SELECT * FROM client_saved_addresses WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);
  if (!cur) return res.status(404).json({ error: 'Адрес не найден.' });

  const v = schemas.validate(schemas.clientSavedAddressPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const label = v.value.label != null ? v.value.label : cur.label;
  const address_line = v.value.address_line != null ? v.value.address_line : cur.address_line;
  if (v.value.address_line != null) {
    const addrCheck = orenburgAddress.validateDeliveryAddressLine(address_line);
    if (!addrCheck.ok) return res.status(400).json({ error: addrCheck.error });
  }

  if (v.value.address_line != null && v.value.address_line !== cur.address_line) {
    const dup = await db
      .prepare(
        `SELECT id FROM client_saved_addresses WHERE user_id = ? AND lower(trim(address_line)) = lower(trim(?)) AND id != ?`
      )
      .get(req.user.id, address_line, id);
    if (dup) return res.status(409).json({ error: 'Такой адрес уже есть в списке.' });
  }

  if (v.value.is_default === true) {
    await setClientSavedAddressDefault(req.user.id, id);
  }

  await db
    .prepare(
      `UPDATE client_saved_addresses SET label = ?, address_line = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`
    )
    .run(label || '', address_line, id, req.user.id);

  if (v.value.is_default === false && Number(cur.is_default)) {
    await db.prepare('UPDATE client_saved_addresses SET is_default = 0 WHERE id = ?').run(id);
    const next = await db
      .prepare(
        `SELECT id FROM client_saved_addresses WHERE user_id = ? AND id != ? ORDER BY updated_at DESC, id DESC LIMIT 1`
      )
      .get(req.user.id, id);
    if (next) {
      await db.prepare('UPDATE client_saved_addresses SET is_default = 1 WHERE id = ?').run(next.id);
    }
  }

  const row = await db.prepare('SELECT * FROM client_saved_addresses WHERE id = ?').get(id);
  audit(db, req.user.id, 'client_address_patch', `id=${id}`, req.ip);
  res.json({ address: publicClientSavedAddress(row) });
}));

app.delete('/api/profile/addresses/:id', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  if (String(req.user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Раздел доступен только клиентам.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Некорректный адрес.' });

  const cur = await db
    .prepare('SELECT * FROM client_saved_addresses WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);
  if (!cur) return res.status(404).json({ error: 'Адрес не найден.' });

  await db.prepare('DELETE FROM client_saved_addresses WHERE id = ? AND user_id = ?').run(id, req.user.id);

  if (Number(cur.is_default)) {
    const next = await db
      .prepare(
        `SELECT id FROM client_saved_addresses WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1`
      )
      .get(req.user.id);
    if (next) {
      await db.prepare('UPDATE client_saved_addresses SET is_default = 1 WHERE id = ?').run(next.id);
    }
  }

  audit(db, req.user.id, 'client_address_delete', `id=${id}`, req.ip);
  res.json({ ok: true });
}));

app.get('/api/manager/content-insights', requireAuth, requireRole('manager', 'admin'), asyncHandler(async (req, res) => {
  const insights = await pollVotes.buildManagerContentInsights(db, pollVoteHelpers);
  res.json(insights);
}));

app.put('/api/manager/blog-poll', requireAuth, requireRole('manager', 'admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.blogHydrationPollPutSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const sanitized = v.value.poll ? pollVotes.sanitizeBlogHydrationPoll(v.value.poll) : null;
  if (v.value.poll && !sanitized) {
    return res.status(400).json({ error: 'Некорректные данные опроса блога.' });
  }
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run('blogHydrationPoll', JSON.stringify(sanitized));
  audit(db, req.user.id, 'manager_blog_poll', sanitized?.id || 'cleared', req.ip);
  res.json({ ok: true, poll: sanitized });
}));

app.get('/api/profile/bonus-program', requireAuth, asyncHandler(async (req, res) => {
  if (String(req.user.role || '').toLowerCase() !== 'client') {
    return res.status(403).json({ error: 'Бонусная программа доступна только клиентам.' });
  }
  const summary = await bonusProgram.getBonusProgramSummary(db, req.user.id);
  res.json(summary);
}));

/** Анонимная форма: страница может быть с file:// или с другого порта — без этого браузер блокирует POST. */
function publicFeedbackCors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
}

app.options('/api/feedback', publicFeedbackCors, (req, res) => {
  res.sendStatus(204);
});

app.post('/api/feedback', publicFeedbackCors, feedbackRateLimit, (req, res) => {
  handlePublicFeedbackSubmit(req, res).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[feedback] необработанный reject:', err);
    if (!res.headersSent) res.status(200).json({ ok: true });
  });
});

app.get('/api/orders/my', requireAuth, asyncHandler(async (req, res) => {
  const rows = await db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200')
    .all(req.user.id);
  res.json({ orders: rows });
}));

app.get('/api/notifications/my', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await clientNotifications.listClientNotifications(db, req.user.id);
  res.json({ notifications });
}));

app.patch('/api/notifications/:id/read', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id.' });
  await clientNotifications.markClientNotificationRead(db, req.user.id, id);
  res.json({ ok: true });
}));

app.post('/api/notifications/read-all', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  await clientNotifications.markAllClientNotificationsRead(db, req.user.id);
  res.json({ ok: true });
}));

app.post('/api/orders', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.orderCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { address, delivery_date, delivery_slot, payment_method, bonuses_used, items, courier_note } = v.value;
  const availability = await loadDeliveryAvailability();
  const bookCheck = deliveryAvailability.validateDeliveryBooking(delivery_date, delivery_slot, availability);
  if (!bookCheck.ok) return res.status(400).json({ error: bookCheck.error });
  const addrCheck = orenburgAddress.validateDeliveryAddressLine(address);
  if (!addrCheck.ok) return res.status(400).json({ error: addrCheck.error });

  const priced = await orderPricing.resolveClientOrderLines(db, items);
  if (!priced.ok) return res.status(400).json({ error: priced.error });
  const { lineItems, subtotal, itemsJson } = priced;

  const freshBalance = await bonusProgram.getAvailableBonusBalance(db, req.user.id);
  const bonusSpend = Math.min(bonuses_used || 0, freshBalance, Math.floor(subtotal));
  let payable = Math.max(0, subtotal - bonusSpend);

  const earn = bonusProgram.computeOrderBonusEarn(subtotal, bonusSpend);

  let orderId;
  try {
    await db.withTransaction(async (tx) => {
      const o = await tx
        .prepare(
          `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method, bonuses_used, bonuses_earned, items_json, courier_note, total_sum)
         VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?)`
        )
        .run(
          req.user.id,
          address,
          bookCheck.value.date,
          bookCheck.value.slot,
          payment_method,
          bonusSpend,
          earn,
          itemsJson,
          String(courier_note || '').trim(),
          payable
        );
      orderId = o.lastInsertRowid;

      for (const it of items) {
        await tx.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(it.qty, it.product_id);
      }

      if (bonusSpend > 0) {
        await bonusProgram.spendUserBonuses(db, req.user.id, bonusSpend, orderId, tx);
      }
      if (earn > 0) {
        await bonusProgram.accrueUserBonuses(db, req.user.id, earn, orderId, tx);
      }
    });
  } catch (e) {
    if (Number(e?.status) === 400) {
      return res.status(400).json({ error: String(e.message || 'Не удалось списать бонусы.') });
    }
    return res.status(500).json({ error: 'Не удалось сохранить заказ.' });
  }

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  await insertOrderAuditEvent(db, order.id, 'order_create', 'Заказ оформлен клиентом', req.user.id, '');
  audit(db, req.user.id, 'order_create', `id=${order.id}`, req.ip);
  try {
    await clientNotifications.notifyOrderCreated(db, order);
  } catch (notifErr) {
    // eslint-disable-next-line no-console
    console.error('[order] client notification', notifErr && notifErr.message);
  }
  try {
    await rememberClientDeliveryAddress(req.user.id, address);
  } catch (addrErr) {
    // eslint-disable-next-line no-console
    console.error('[order] save client address', addrErr && addrErr.message);
  }
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
    const dateCheck = validateDeliveryDateFormat(v.value.delivery_date);
    if (!dateCheck.ok) return res.status(400).json({ error: dateCheck.error });
    const addrCheckOp = orenburgAddress.validateDeliveryAddressLine(v.value.address);
    if (!addrCheckOp.ok) return res.status(400).json({ error: addrCheckOp.error });

    let phoneDigits = String(v.value.customer_phone || '').replace(/\D/g, '');
    if (phoneDigits.length === 11 && phoneDigits[0] === '8') phoneDigits = `7${phoneDigits.slice(1)}`;
    if (phoneDigits.length === 10 && phoneDigits[0] === '9') phoneDigits = `7${phoneDigits}`;
    if (!(phoneDigits.length === 11 && phoneDigits[0] === '7')) {
      return res.status(400).json({ error: 'Телефон: нужны 11 цифр в формате России (+7…).' });
    }

    const pickupVal = Number(v.value.pickup) === 1 ? 1 : 0;
    const zoneVal = String(v.value.zone || '').trim() || null;
    let driverVal = String(v.value.driver || '').trim() || null;
    let insertStatus = 'new';
    if (driverVal) {
      const driverNorm = await normalizeOperatorOrderDriverInput(driverVal, 'new');
      if (driverNorm.error) return res.status(400).json({ error: driverNorm.error });
      driverVal = driverNorm.driver || null;
      if (driverNorm.statusBump) insertStatus = driverNorm.statusBump;
    }

    const customer = await ensurePhoneCallerUser(phoneDigits, v.value.customer_name);
    const priced = await orderPricing.resolveOperatorOrderLines(db, v.value);
    if (!priced.ok) return res.status(400).json({ error: priced.error });
    const { lineItems, total_sum, itemsJson } = priced;

    let orderId;
    try {
      const o = await db
        .prepare(
          `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method,
            bonuses_used, bonuses_earned, items_json, courier_note, zone, driver, pickup, total_sum)
           VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          customer.id,
          v.value.address,
          dateCheck.value,
          v.value.delivery_slot,
          insertStatus,
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
    await insertOrderAuditEvent(db, orderId, 'order_operator_create', 'Создан оператором', req.user.id, '');
    audit(db, req.user.id, 'order_operator_create', `id=${orderId}`, req.ip);
    try {
      await clientNotifications.notifyOrderCreated(db, orderRow);
    } catch (notifErr) {
      // eslint-disable-next-line no-console
      console.error('[order] operator create notification', notifErr && notifErr.message);
    }
    res.json({ order: { ...orderRow, create_action: 'order_operator_create' } });
  })
);

app.get('/api/orders', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT o.*, u.email, u.phone, u.first_name, u.last_name,
              (SELECT e.action FROM order_audit_events e
               WHERE e.order_id = o.id
                 AND e.action IN ('order_create', 'order_operator_create')
               ORDER BY e.id ASC
               LIMIT 1) AS create_action
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC LIMIT 5000`
    )
    .all();
  res.json({ orders: rows });
}));

app.get('/api/orders/operator/drivers', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT first_name, last_name, driver_route_label, driver_on_duty, role
       FROM users
       WHERE lower(role) = 'driver'
         AND COALESCE(blocked, 0) = 0
       ORDER BY id ASC`
    )
    .all();
  const list = [];
  const seenLower = new Set();
  for (const row of rows) {
    const lbl = driverAssignedLabel(row);
    if (lbl.length < 2) continue;
    const key = normalizeDriverRouteKey(lbl);
    if (seenLower.has(key)) continue;
    seenLower.add(key);
    list.push({ label: lbl, on_duty: !!Number(row.driver_on_duty) });
  }
  list.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  res.json({ drivers: list });
}));

app.get(
  '/api/orders/operator/delivery-availability',
  requireAuth,
  requireRole('operator', 'manager', 'admin'),
  asyncHandler(async (_req, res) => {
    try {
      const record = await loadDeliveryAvailabilityRecord();
      const availability = deliveryAvailability.pruneAvailabilityToBookingWindow(
        record.availability || deliveryAvailability.emptyAvailability()
      );
      res.set('Cache-Control', 'no-store');
      res.json({
        availability,
        lastChange: record.meta,
        slotDefs: deliveryAvailability.BOOKING_SLOT_DEFS,
        days: deliveryAvailability.enumerateBookingDays(30),
      });
    } catch (err) {
      console.error('[delivery-availability GET]', err);
      res.status(500).json({ error: 'Не удалось загрузить настройки приёма заказов.' });
    }
  })
);

app.put(
  '/api/orders/operator/delivery-availability',
  requireAuth,
  requireRole('operator', 'manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.operatorDeliveryAvailabilitySchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const saved = await saveDeliveryAvailability(v.value, req.user);
    const auditAction =
      req.user.role === 'admin' ? 'admin_delivery_availability' : 'delivery_availability';
    audit(db, req.user.id, auditAction, saved.meta?.label || 'update', req.ip);
    res.json({ ok: true, availability: saved.availability, lastChange: saved.meta });
  })
);

app.get('/api/orders/:id/journal', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id заказа.' });
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });

  const staffRoles = ['operator', 'manager', 'admin'];
  if (!staffRoles.includes(req.user.role) && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав.' });
  }

  const auditRows = await db
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

  let eventRows = [];
  try {
    eventRows = await db
      .prepare(
        `SELECT e.id, e.action, e.reason, e.detail, e.created_at,
                COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email, 'Система') AS actor_name,
                COALESCE(u.role, 'system') AS actor_role
         FROM order_audit_events e
         LEFT JOIN users u ON u.id = e.actor_user_id
         WHERE e.order_id = ?
         ORDER BY e.id DESC
         LIMIT 300`
      )
      .all(id);
  } catch {
    eventRows = [];
  }

  const journal = [
    ...eventRows.map((row) => ({
      id: row.id,
      action: row.action,
      detail: String(row.reason || row.detail || '').trim(),
      created_at: row.created_at,
      actor_name: row.actor_name,
      actor_role: row.actor_role,
    })),
    ...auditRows.filter((row) => !/^id=\d+$/i.test(String(row.detail || '').trim())),
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  res.json({ journal: journal.slice(0, 300) });
}));

app.get('/api/orders/operator/audit-report', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (req, res) => {
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ error: 'Укажите период from и to в формате ГГГГ-ММ-ДД.' });
  }
  const operatorView = req.user.role === 'operator';
  const rows = await db
    .prepare(
      `SELECT e.id, e.order_id, e.action, e.reason, e.detail, e.created_at,
              COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email, 'Пользователь') AS actor_name,
              COALESCE(u.role, '') AS actor_role
       FROM order_audit_events e
       LEFT JOIN users u ON u.id = e.actor_user_id
       WHERE (e.created_at AT TIME ZONE 'Europe/Moscow')::date >= ?::date
         AND (e.created_at AT TIME ZONE 'Europe/Moscow')::date <= ?::date
         ${operatorView ? "AND e.action NOT LIKE 'admin_%' AND e.action <> 'manager_settings'" : ''}
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
  const prevStatus = order.status;
  await db.withTransaction(async (tx) => {
    await tx.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
    await bonusProgram.reverseBonusesForCancelledOrder(tx, order, tx);
  });
  const reason = String(vr.value.reason || '').trim();
  await insertOrderAuditEvent(db, id, 'order_cancel', reason, req.user.id, JSON.stringify({ source: 'cabinet_cancel' }));
  audit(db, req.user.id, 'order_cancel', `id=${id}`, req.ip);
  const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  try {
    await clientNotifications.notifyOrderStatusChange(db, updated, prevStatus, 'cancelled');
  } catch (notifErr) {
    // eslint-disable-next-line no-console
    console.error('[order] cancel notification', notifErr && notifErr.message);
  }
  res.json({ order: updated });
}));

app.delete(
  '/api/orders/:id',
  requireAuth,
  requireRole('operator', 'manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id заказа.' });
    const vr = schemas.validate(schemas.orderCancelReasonSchema, req.body || {});
    if (!vr.ok) return res.status(400).json({ error: vr.error });
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Заказ не найден.' });

    const reason = String(vr.value.reason || '').trim();
    const prevStatus = String(order.status || '').toLowerCase();
    const displayId = `ЛС-${String(id).padStart(6, '0')}`;
    const deleteDetail = JSON.stringify({
      deleted: true,
      display_id: displayId,
      status: prevStatus,
      address: String(order.address || '').trim(),
      delivery_date: String(order.delivery_date || '').trim(),
    });

    await insertOrderAuditEvent(db, id, 'order_delete', reason, req.user.id, deleteDetail);

    await db.withTransaction(async (tx) => {
      if (prevStatus !== 'cancelled') {
        await bonusProgram.reverseBonusesForCancelledOrder(tx, order, tx);
      }
      await tx.prepare('DELETE FROM bonus_operations WHERE order_id = ?').run(id);
      await tx.prepare('DELETE FROM orders WHERE id = ?').run(id);
    });

    audit(db, req.user.id, 'order_delete', `id=${id}; reason=${reason}`, req.ip);
    res.json({ ok: true, deletedId: id });
  })
);

/** Маршруты до параметрических `/api/orders/:id`. */
app.patch('/api/driver/duty', requireAuth, requireRole('driver'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.driverDutySchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const on = v.value.on_duty ? 1 : 0;
  await db.prepare('UPDATE users SET driver_on_duty = ? WHERE id = ?').run(on, req.user.id);
  audit(db, req.user.id, 'driver_duty', on ? 'on' : 'off', req.ip);
  const updated = await getUserById(req.user.id);
  res.json({ user: publicUser(updated) });
}));

app.get('/api/driver/orders', requireAuth, requireRole('driver'), asyncHandler(async (req, res) => {
  const label = driverAssignedLabel(req.user);
  if (!label) return res.json({ orders: [], warn: 'Администратор не указал вашу метку экспедитора.' });
  const routeDay = moscowTodayIso();
  const orderDaySql = driverOrderDaySql('o');
  const todaySql = driverTodayMoscowSql();
  const statusPlaceholders = DRIVER_VISIBLE_STATUSES.map(() => '?').join(', ');
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
         AND lower(trim(o.status)) <> 'cancelled'
         AND o.status IN (${statusPlaceholders})
         AND ${orderDaySql} = ${todaySql}
       ORDER BY CASE WHEN o.status = 'delivered' THEN 2 WHEN o.status IN ('courier', 'on_way', 'processing') THEN 0 ELSE 1 END,
              o.delivery_date ASC NULLS LAST,
              o.created_at DESC,
              o.id DESC`
    )
    .all(label, ...DRIVER_VISIBLE_STATUSES);
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
  res.json({ orders, route_day: routeDay });
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
    if (String(order.status || '').trim().toLowerCase() === 'cancelled') {
      return res.status(400).json({ error: 'Заказ отменён и больше не в маршруте.' });
    }
    const orderDriver = String(order.driver || '').trim();
    if (
      !orderDriver ||
      orderDriver.toLocaleLowerCase('ru') !== label.toLocaleLowerCase('ru')
    ) {
      return res.status(403).json({ error: 'Это не ваш заказ.' });
    }
    if (!DRIVER_ORDER_STATUSES.includes(order.status)) {
      return res.status(400).json({
        error: 'Заказ уже доставлен, отменён или ещё не передан водителю оператором.',
      });
    }
    const orderDayRaw = String(order.delivery_date || '').trim().slice(0, 10);
    const orderDay =
      orderDayRaw ||
      (order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-CA', { timeZone: DRIVER_ROUTE_TZ })
        : '');
    if (orderDay && orderDay !== moscowTodayIso()) {
      return res.status(400).json({ error: 'Этот заказ не на сегодня — отметить доставку нельзя.' });
    }
    const prevStatus = order.status;
    await db
      .prepare(`UPDATE orders SET status = 'delivered', updated_at = datetime('now') WHERE id = ?`)
      .run(id);
    const updatedOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    try {
      await clientNotifications.notifyOrderStatusChange(db, updatedOrder, prevStatus, 'delivered');
    } catch (notifErr) {
      // eslint-disable-next-line no-console
      console.error('[order] delivered notification', notifErr && notifErr.message);
    }
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
    if (v.value.delivery_date != null) {
      const dateCheck = validateDeliveryDateFormat(v.value.delivery_date);
      if (!dateCheck.ok) return res.status(400).json({ error: dateCheck.error });
      v.value.delivery_date = dateCheck.value;
    }
    let changeReason = String(v.value.change_reason || '').trim();
    const requiresReason =
      (v.value.delivery_date != null &&
        deliveryDateStoredChanged(order.delivery_date, v.value.delivery_date)) ||
      (v.value.delivery_slot != null &&
        deliverySlotStoredChanged(order.delivery_slot, v.value.delivery_slot)) ||
      (v.value.status != null && v.value.status === 'cancelled' && order.status !== 'cancelled');
    if (requiresReason && changeReason.length < 3) {
      changeReason =
        v.value.status === 'cancelled' && order.status !== 'cancelled'
          ? 'Отмена оператором'
          : 'Изменение оператором';
    }

    if (v.value.items_json != null) {
      if (orderPricing.itemsJsonSemanticallyEqual(v.value.items_json, order.items_json)) {
        delete v.value.items_json;
        delete v.value.total_sum;
      } else {
        const pricedPatch = await orderPricing.resolveStaffOrderItemsPatch(db, v.value.items_json);
        if (!pricedPatch.ok) return res.status(400).json({ error: pricedPatch.error });
        v.value.items_json = pricedPatch.itemsJson;
        v.value.total_sum = pricedPatch.total_sum;
      }
    } else {
      delete v.value.total_sum;
    }

    if (v.value.driver !== undefined) {
      const driverNorm = await normalizeOperatorOrderDriverInput(
        v.value.driver,
        v.value.status != null ? v.value.status : order.status
      );
      if (driverNorm.error) return res.status(400).json({ error: driverNorm.error });
      v.value.driver = driverNorm.driver;
      if (
        driverNorm.statusBump &&
        (v.value.status == null || String(v.value.status).trim().toLowerCase() === 'new')
      ) {
        v.value.status = driverNorm.statusBump;
      }
    }

    if (v.value.zone != null) {
      const zoneNorm = await resolveOrderZoneForDb(v.value.zone);
      if (!zoneNorm.ok) return res.status(400).json({ error: zoneNorm.error });
      v.value.zone = zoneNorm.zone || null;
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
    const prevStatus = order.status;
    const toCancelled = v.value.status === 'cancelled' && order.status !== 'cancelled';
    await db.withTransaction(async (tx) => {
      await tx.prepare(`UPDATE orders SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
      if (toCancelled) {
        await bonusProgram.reverseBonusesForCancelledOrder(tx, order, tx);
      }
    });
    let evtAction = 'operator_patch';
    if (toCancelled) evtAction = 'order_status_cancelled';
    else if (
      (v.value.delivery_date != null &&
        deliveryDateStoredChanged(order.delivery_date, v.value.delivery_date)) ||
      (v.value.delivery_slot != null &&
        deliverySlotStoredChanged(order.delivery_slot, v.value.delivery_slot))
    ) {
      evtAction = 'order_reschedule';
    }
    const reasonForLog = changeReason || (requiresReason ? '—' : 'Изменение заказа (без переноса/отмены)');
    await insertOrderAuditEvent(db, id, evtAction, reasonForLog, req.user.id, JSON.stringify({ changed: changedKeys }));
    audit(db, req.user.id, 'order_patch', `id=${id}`, req.ip);
    const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (v.value.status != null && String(v.value.status) !== String(prevStatus)) {
      try {
        await clientNotifications.notifyOrderStatusChange(db, updated, prevStatus, v.value.status);
      } catch (notifErr) {
        // eslint-disable-next-line no-console
        console.error('[order] status notification', notifErr && notifErr.message);
      }
    }
    return res.json({ order: updated });
  }

  if (order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав.' });
  }
  const v = schemas.validate(schemas.orderClientPatchSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (!['new', 'pending_operator', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Заказ на этой стадии нельзя изменить.' });
  }
  const { address, delivery_date, delivery_slot, change_reason } = v.value;
  const availability = await loadDeliveryAvailability();
  const nextDate = delivery_date != null ? String(delivery_date).trim() : String(order.delivery_date || '').trim();
  const nextSlot = delivery_slot != null ? String(delivery_slot).trim() : String(order.delivery_slot || '').trim();
  const bookCheck = deliveryAvailability.validateDeliveryBooking(nextDate, nextSlot, availability);
  if (!bookCheck.ok) return res.status(400).json({ error: bookCheck.error });
  const parts = [];
  const vals = [];
  const touched = [];
  if (address != null) {
    const addrCheckClient = orenburgAddress.validateDeliveryAddressLine(address);
    if (!addrCheckClient.ok) return res.status(400).json({ error: addrCheckClient.error });
    parts.push('address = ?');
    vals.push(address);
    touched.push('address');
  }
  if (delivery_date != null) {
    parts.push('delivery_date = ?');
    vals.push(bookCheck.value.date);
    touched.push('delivery_date');
  }
  if (delivery_slot != null) {
    parts.push('delivery_slot = ?');
    vals.push(bookCheck.value.slot);
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

/** Дата заказа для отчётов: доставка или дата создания. */
const ADMIN_ORDER_DATE_EXPR = `COALESCE(NULLIF(trim(o.delivery_date), ''), to_char(o.created_at, 'YYYY-MM-DD'))`;
/** В статистику админа — только реальные заказы (без демо-маркеров и demo-клиентов). */
const ADMIN_STATS_DEMO_EXCLUDE = `(
  COALESCE(o.courier_note, '') NOT LIKE '%§ekva_seed%'
  AND COALESCE(o.courier_note, '') NOT LIKE '%§demo_op%'
  AND COALESCE(o.courier_note, '') NOT LIKE '%§demo_mo%'
  AND lower(COALESCE(u.email, '')) NOT LIKE 'demo.%@ekvaline.local'
  AND lower(COALESCE(u.email, '')) <> 'clienteekva@mail.ru'
)`;
/** Заказы на доставку планируются вперёд — «дата по» может быть в будущем. */
const ADMIN_STATS_MAX_FUTURE_DAYS = 60;

function shiftIsoDateLocalServer(iso, deltaDays) {
  const parts = String(iso || '')
    .trim()
    .split('-')
    .map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return todayIsoLocal();
  const base = new Date(parts[0], parts[1] - 1, parts[2]);
  base.setDate(base.getDate() + deltaDays);
  return todayIsoLocalFromDate(base);
}

function todayIsoLocalFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function maxAdminStatsToIso() {
  return shiftIsoDateLocalServer(todayIsoLocal(), ADMIN_STATS_MAX_FUTURE_DAYS);
}

function todayIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseAdminStatsPeriodQuery(req) {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  let from = iso.test(String(req.query.from || '').trim()) ? String(req.query.from).trim() : null;
  let to = iso.test(String(req.query.to || '').trim()) ? String(req.query.to).trim() : null;
  const maxTo = maxAdminStatsToIso();
  if (from && from > maxTo) {
    return { error: `Дата «с» не может быть позже ${maxTo}.` };
  }
  if (to && to > maxTo) {
    return {
      error: `Дата «по» не может быть позже ${maxTo} (доставка планируется не более чем на ${ADMIN_STATS_MAX_FUTURE_DAYS} дней вперёд).`,
    };
  }
  if (from && to && from > to) {
    return { error: 'Дата «с» не может быть позже даты «по».' };
  }
  return { from, to };
}

function adminStatsOrderPeriodClause(from, to) {
  const parts = [ADMIN_STATS_DEMO_EXCLUDE];
  const vals = [];
  if (from) {
    parts.push(`${ADMIN_ORDER_DATE_EXPR} >= ?`);
    vals.push(from);
  }
  if (to) {
    parts.push(`${ADMIN_ORDER_DATE_EXPR} <= ?`);
    vals.push(to);
  }
  const where = `WHERE ${parts.join(' AND ')}`;
  return { where, vals };
}

app.get('/api/admin/stats', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const parsed = parseAdminStatsPeriodQuery(req);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { from, to } = parsed;
  const { where, vals } = adminStatsOrderPeriodClause(from, to);

  const byRoleRows = await db
    .prepare(
      `SELECT role, COUNT(*)::int AS c FROM users
       WHERE lower(COALESCE(role, '')) IN ('admin', 'operator', 'manager', 'driver')
          OR (
            lower(role) = 'client'
            AND lower(COALESCE(email, '')) NOT LIKE 'demo.%@ekvaline.local'
            AND lower(COALESCE(email, '')) <> 'clienteekva@mail.ru'
          )
       GROUP BY role ORDER BY role`
    )
    .all();
  const usersByRole = {};
  for (const row of byRoleRows || []) usersByRole[String(row.role)] = Number(row.c) || 0;

  const statsFrom = `FROM orders o JOIN users u ON u.id = o.user_id ${where}`;

  const summaryRow =
    (await db
      .prepare(
        `SELECT COUNT(*)::int AS orders_total,
                COALESCE(SUM(o.total_sum), 0)::float AS orders_sum,
                COUNT(*) FILTER (WHERE o.status = 'delivered')::int AS delivered_count,
                COALESCE(SUM(o.total_sum) FILTER (WHERE o.status = 'delivered'), 0)::float AS delivered_sum,
                COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled_count
         ${statsFrom}`
      )
      .get(...vals)) || {};

  const ordersByStatus = await db
    .prepare(
      `SELECT o.status AS status,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       ${statsFrom}
       GROUP BY o.status
       ORDER BY c DESC, o.status`
    )
    .all(...vals);

  const ordersByZone = await db
    .prepare(
      `SELECT COALESCE(NULLIF(trim(o.zone), ''), 'Не указана') AS label,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       ${statsFrom}
       GROUP BY 1
       ORDER BY c DESC, label`
    )
    .all(...vals);

  const ordersByPaymentRaw = await db
    .prepare(
      `SELECT o.payment_method,
              o.total_sum::float AS sum
       ${statsFrom}`
    )
    .all(...vals);

  const ordersByPayment = aggregatePaymentRows(ordersByPaymentRaw);

  const ordersByDriver = await db
    .prepare(
      `SELECT COALESCE(NULLIF(trim(o.driver), ''), 'Не назначен') AS label,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       ${statsFrom}
       GROUP BY 1
       ORDER BY c DESC, label
       LIMIT 20`
    )
    .all(...vals);

  const prodRow =
    (await db
      .prepare(
        `SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE COALESCE(hidden, 0) = 0)::int AS visible
         FROM products`
      )
      .get()) || {};

  const mapRows = (rows) =>
    (rows || []).map((x) => ({
      label: x.label != null ? String(x.label) : String(x.status || ''),
      status: x.status != null ? String(x.status) : undefined,
      count: Number(x.c) || 0,
      sum: Math.round((Number(x.sum) || 0) * 100) / 100,
    }));

  let deliverySpan = null;
  const ordersTotal = Number(summaryRow.orders_total ?? 0);
  if (ordersTotal === 0) {
    const spanRow =
      (await db
        .prepare(
          `SELECT COUNT(*)::int AS c,
                  MIN(${ADMIN_ORDER_DATE_EXPR}) AS min_d,
                  MAX(${ADMIN_ORDER_DATE_EXPR}) AS max_d
           FROM orders o
           JOIN users u ON u.id = o.user_id
           WHERE ${ADMIN_STATS_DEMO_EXCLUDE}`
        )
        .get()) || {};
    const spanCount = Number(spanRow.c) || 0;
    if (spanCount > 0) {
      deliverySpan = {
        count: spanCount,
        minDate: spanRow.min_d != null ? String(spanRow.min_d) : null,
        maxDate: spanRow.max_d != null ? String(spanRow.max_d) : null,
      };
    }
  }

  res.json({
    period: { from, to },
    usersByRole,
    summary: {
      ordersTotal,
      ordersSum: Math.round((Number(summaryRow.orders_sum) || 0) * 100) / 100,
      deliveredCount: Number(summaryRow.delivered_count ?? 0),
      deliveredSum: Math.round((Number(summaryRow.delivered_sum) || 0) * 100) / 100,
      cancelledCount: Number(summaryRow.cancelled_count ?? 0),
    },
    deliverySpan,
    ordersByStatus: mapRows(ordersByStatus).map((x) => ({
      status: x.status || x.label,
      count: x.count,
      sum: x.sum,
    })),
    ordersByZone: mapRows(ordersByZone),
    ordersByPayment: ordersByPayment.map((x) => ({
      label: x.label,
      count: x.count,
      sum: x.sum,
    })),
    ordersByDriver: mapRows(ordersByDriver),
    productsTotal: Number(prodRow.total ?? 0),
    productsVisible: Number(prodRow.visible ?? prodRow.total ?? 0),
  });
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

    await ensureDriverRouteLabelForUser(targetId);
  } catch (e) {
    if (e && e.status === 409) return res.status(409).json({ error: e.message });
    throw e;
  }
  audit(db, req.user.id, 'admin_user_patch', `target=${targetId} ${JSON.stringify(v.value)}`, req.ip);
  const updated = await getUserById(targetId);
  res.json({ user: publicUser(updated) });
}));

app.delete('/api/admin/users/:id', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ error: 'Некорректный пользователь.' });
  }
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись.' });
  }

  const target = await getUserById(targetId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден.' });
  if (!isStaffRole(target.role)) {
    return res.status(400).json({ error: 'Удалять можно только учётные записи сотрудников.' });
  }

  if (String(target.role || '').toLowerCase() === 'admin') {
    const row = await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).get();
    if (Number(row?.n) <= 1) {
      return res.status(400).json({ error: 'Нельзя удалить последнего администратора.' });
    }
  }

  await db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  audit(db, req.user.id, 'admin_user_delete', `target=${targetId} email=${target.email}`, req.ip);
  res.json({ ok: true, message: 'Учётная запись удалена.' });
}));

app.post(
  '/api/admin/users/:id/staff-password',
  requireAuth,
  requireRole('admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.adminStaffPasswordSetSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const targetId = Number(req.params.id);
    const target = await getUserById(targetId);
    if (!target) return res.status(404).json({ error: 'Пользователь не найден.' });
    if (!isStaffRole(target.role)) {
      return res.status(400).json({ error: 'Пароль можно менять только у сотрудников.' });
    }

    const password_hash = bcrypt.hashSync(v.value.password, 12);
    await db
      .prepare(
        `UPDATE users SET password_hash = ?, password_changed_at = NOW()::text, login_attempts = 0, locked_until = NULL, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?`
      )
      .run(password_hash, targetId);

    audit(db, req.user.id, 'admin_staff_password_set', `target=${targetId}`, req.ip);
    res.json({
      ok: true,
      message: 'Новый пароль сохранён. Сообщите его сотруднику.',
    });
  })
);

app.post('/api/admin/users', requireAuth, requireRole('admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.adminUserCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { first_name, last_name, email, phone, password, role } = v.value;
  let drvLbl = String(v.value.driver_route_label || '').trim();
  if (role === 'driver') {
    if (drvLbl.length < 2) {
      drvLbl = deriveDriverRouteLabelFromProfile({ first_name, last_name });
    }
    if (drvLbl.length < 2) {
      return res.status(400).json({
        error: 'Для водителя укажите имя и фамилию так же, как оператор заносит ФИО в поле «Экспедитор».',
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
  if (role === 'driver') await ensureDriverRouteLabelForUser(user.id);
  audit(db, req.user.id, 'admin_user_create', `target=${user.id} role=${role}`, req.ip);
  res.json({ user: publicUser(await getUserById(user.id)) });
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
      `INSERT INTO products (category_id, name, description, price, volume_liters, stock, sort_order, hidden, preorder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.category_id,
      p.name,
      p.description || '',
      p.price,
      p.volume_liters ?? null,
      p.stock,
      p.sort_order ?? 0,
      p.hidden ?? 0,
      p.preorder ?? 0
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
  const keys = ['category_id', 'name', 'description', 'price', 'volume_liters', 'stock', 'sort_order', 'hidden', 'preorder'];
  keys.forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(p, k)) return;
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
  const fqRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliveryFaq');
  const pollsRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('sitePolls');
  const certsRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('aboutCertificates');
  const covRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliveryCoverage');
  let slots = [];
  try {
    slots = ds ? JSON.parse(ds.value) : [];
  } catch {
    slots = [];
  }
  const faqFromDb = fqRow?.value ? parseStoredJsonArray('deliveryFaq', fqRow.value) : [];
  const pollsFromDb = pollsRow?.value ? parseStoredJsonArray('sitePolls', pollsRow.value) : [];
  const certsFromDb = certsRow?.value ? parseStoredJsonArray('aboutCertificates', certsRow.value) : [];
  const covSan = parseStoredDeliveryCoverage(covRow?.value);
  const deliveryCoverage = covSan || deliveryCoverageForPublic(null);
  res.json({
    workLine: wl ? wl.value : '',
    deliverySlots: slots,
    communityIntro: intro ? intro.value : '',
    deliveryFaq: faqFromDb.length ? faqFromDb : [...DEFAULT_DELIVERY_FAQ],
    sitePolls: pollsFromDb,
    aboutCertificates: certsFromDb.length ? certsFromDb : [...DEFAULT_ABOUT_CERTIFICATES],
    deliveryCoverage,
  });
}));

app.put('/api/manager/settings', requireAuth, requireRole('manager', 'admin'), csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.managerSettingsSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { workLine, communityIntro, deliverySlots, deliveryFaq, sitePolls, aboutCertificates, deliveryCoverage } =
    v.value;
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('workLine', workLine);
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run(
    'deliverySlots',
    JSON.stringify(deliverySlots)
  );
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('communityIntro', communityIntro);
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run('deliveryFaq', JSON.stringify(deliveryFaq));
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('sitePolls', JSON.stringify(sitePolls));
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run('aboutCertificates', JSON.stringify(aboutCertificates));
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run('deliveryCoverage', JSON.stringify(deliveryCoverage));
  audit(db, req.user.id, 'manager_settings', '', req.ip);
  res.json({ ok: true });
}));

/** Частичное сохранение: блок «Зоны покрытия» без повторной отправки FAQ/опросов/сертификатов (устойчивее к расхождениям с полным PUT). */
app.patch(
  '/api/manager/settings/delivery-coverage',
  requireAuth,
  requireRole('manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.deliveryCoveragePanelSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    await db
      .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
      .run('deliveryCoverage', JSON.stringify(v.value));
    audit(db, req.user.id, 'manager_settings', 'deliveryCoverage', req.ip);
    res.json({ ok: true });
  })
);

app.patch(
  '/api/manager/settings/delivery-faq',
  requireAuth,
  requireRole('manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.deliveryFaqPanelSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    await db
      .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
      .run('deliveryFaq', JSON.stringify(v.value));
    audit(db, req.user.id, 'manager_settings', 'deliveryFaq', req.ip);
    res.json({ ok: true });
  })
);

app.patch(
  '/api/manager/settings/about-certificates',
  requireAuth,
  requireRole('manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.aboutCertificatesPanelSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    await db
      .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
      .run('aboutCertificates', JSON.stringify(v.value));
    audit(db, req.user.id, 'manager_settings', 'aboutCertificates', req.ip);
    res.json({ ok: true });
  })
);

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

function normalizeFeedbackMessageRow(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    contacted: Boolean(Number(row.contacted)),
  };
}

app.get('/api/admin/feedback', requireAuth, requireRole('admin', 'manager', 'operator'), asyncHandler(async (req, res) => {
  const messages = await db
    .prepare(
      `SELECT f.id, f.user_id, f.name, f.phone, f.message, f.contacted, f.created_at, u.email AS user_email
       FROM feedback_messages f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.id DESC LIMIT 300`
    )
    .all();
  res.json({ messages: messages.map(normalizeFeedbackMessageRow) });
}));

app.get('/api/manager/feedback', requireAuth, requireRole('manager', 'admin'), asyncHandler(async (req, res) => {
  const messages = await db
    .prepare(
      `SELECT f.id, f.user_id, f.name, f.phone, f.message, f.contacted, f.created_at, u.email AS user_email
       FROM feedback_messages f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY COALESCE(f.contacted, 0) ASC, f.id DESC
       LIMIT 500`
    )
    .all();
  res.json({ messages: messages.map(normalizeFeedbackMessageRow) });
}));

app.patch(
  '/api/manager/feedback/:id/contacted',
  requireAuth,
  requireRole('manager', 'admin'),
  csrfMiddleware,
  asyncHandler(async (req, res) => {
    const v = schemas.validate(schemas.feedbackContactedPatchSchema, req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Некорректный id.' });
    const existing = await db.prepare('SELECT id FROM feedback_messages WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Обращение не найдено.' });
    const contacted = v.value.contacted ? 1 : 0;
    await db.prepare('UPDATE feedback_messages SET contacted = ? WHERE id = ?').run(contacted, id);
    const row = await db
      .prepare(
        `SELECT f.id, f.user_id, f.name, f.phone, f.message, f.contacted, f.created_at, u.email AS user_email
         FROM feedback_messages f
         LEFT JOIN users u ON u.id = f.user_id
         WHERE f.id = ?`
      )
      .get(id);
    audit(db, req.user.id, 'feedback_contacted', `id=${id} contacted=${contacted}`, req.ip);
    res.json({ message: normalizeFeedbackMessageRow(row) });
  })
);

/** Передаёт клиенту PORT и ключ Яндекс.Карт (fallback, если fetch maps-config недоступен). */
app.get('/ekvaline-runtime.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/javascript');
  const p = Number(resolvedListenPort);
  const mapsKey = String(process.env.YANDEX_MAPS_API_KEY || '').trim();
  const lines = [`window.__EKVALINE_LISTEN_PORT__=${Number.isFinite(p) ? p : 3001};`];
  if (mapsKey) {
    lines.push(`window.__EKVALINE_YANDEX_MAPS_KEY__=${JSON.stringify(mapsKey)};`);
  }
  res.send(`${lines.join('\n')}\n`);
});

/** На VPS/хосте браузер иначе держит старый script.js — корзина «не работает» после деплоя. */
app.use((req, res, next) => {
  if (/\.(html?|js|css)$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

app.use(denySensitiveStaticFiles);
app.use(
  express.static(ROOT, {
    index: 'index.html',
    setHeaders(res, filePath) {
      if (String(filePath || '').toLowerCase().endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    },
  })
);

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

const server = http.createServer(app);

server.on('listening', () => {
  const addr = server.address();
  resolvedListenPort = typeof addr === 'object' && addr ? addr.port : resolvedListenPort;
  const port = resolvedListenPort;
  // eslint-disable-next-line no-console
  console.log(`ЭкваЛайн: http://localhost:${port}`);
  if (port !== LISTEN_PREF) {
    // eslint-disable-next-line no-console
    console.warn(`(порт ${LISTEN_PREF} был занят — слушаем на ${port})`);
  }
  if (!String(process.env.YANDEX_MAPS_API_KEY || '').trim()) {
    // eslint-disable-next-line no-console
    console.warn(
      'Карты: задайте YANDEX_MAPS_API_KEY в .env (JavaScript API) — без ключа карта не загрузится.'
    );
  } else {
    const base = String(process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');
    // eslint-disable-next-line no-console
    console.log(
      `Карты: ключ JavaScript API задан. В кабинете developer.tech.yandex.ru → ключ JS API → HTTP Referer: ${base}/* (и ${base.replace(/^http:/, 'https:')}/* при HTTPS)`
    );
  }
  const geocoderKey = String(
    process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY || ''
  ).trim();
  if (!geocoderKey) {
    // eslint-disable-next-line no-console
    console.warn(
      'Геокодер: задайте YANDEX_GEOCODER_API_KEY в .env (HTTP API Геокодера) — поиск адресов медленнее (резерв Nominatim).'
    );
  }
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const baseUrl = String(process.env.APP_BASE_URL || '').trim();
  const secureCookies = String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true';
  if (isProd && baseUrl.startsWith('https://') && !secureCookies) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deploy] APP_BASE_URL=https, но USE_SECURE_COOKIES не true — вход и оформление заказа могут не работать (cookie сессии).'
    );
  }
  if (isProd && secureCookies && baseUrl.startsWith('http://')) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deploy] USE_SECURE_COOKIES=true при http:// в APP_BASE_URL — cookie не сохранятся. Нужен HTTPS или отключите USE_SECURE_COOKIES.'
    );
  }
  if (!mailer.isMailConfigured()) {
    // eslint-disable-next-line no-console
    console.warn(
      'Почта (SMTP): не настроена — коды подтверждения email и смены пароля не отправляются. Задайте SMTP_HOST, SMTP_USER, SMTP_PASS в .env.'
    );
  } else {
    mailer
      .verifySmtpConnection()
      .then((check) => {
        if (check.ok) {
          // eslint-disable-next-line no-console
          console.log('Почта (SMTP): подключение проверено, письма уходят на реальные ящики.');
        } else {
          // eslint-disable-next-line no-console
          console.error('Почта (SMTP): ошибка проверки —', check.error);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Почта (SMTP):', err && err.message);
      });
  }

  checkPostgresConnection();
});

function tryListenOnPortAttempt(attemptIndex) {
  const port = LISTEN_PREF + attemptIndex;
  const maxAttempts = Math.min(PORT_FALLBACK_STEPS, 65536 - LISTEN_PREF);
  if (attemptIndex >= maxAttempts || port < 1 || port > 65535) {
    const last = LISTEN_PREF + maxAttempts - 1;
    // eslint-disable-next-line no-console
    console.error(
      `Не удалось занять порт: перепробованы ${LISTEN_PREF}–${last} (${maxAttempts} попыток). Укажите свободный PORT в .env или освободите порт.`,
    );
    process.exit(1);
    return;
  }

  server.once('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error('[server] Ошибка при прослушивании порта:', err.message || err);
      process.exit(1);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(`Порт ${port} занят, пробуем ${port + 1}…`);
    tryListenOnPortAttempt(attemptIndex + 1);
  });

  server.listen(port);
}

tryListenOnPortAttempt(0);
