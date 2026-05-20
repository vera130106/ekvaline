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
  createRateLimiter,
  assertProductionSessionSecret,
} = require('./security-middleware');

assertProductionSessionSecret();

const http = require('http');
const tokens = new Tokens();
/** Уникальный идентификатор каждого запуска процесса (сброс «запомненного» входа на клиентах). */
const CLIENT_BOOT_ID = crypto.randomBytes(12).toString('hex');
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
  return (await loadDeliveryAvailabilityRecord()).availability;
}

async function saveDeliveryAvailability(payload, actorUser) {
  const normalized = deliveryAvailability.parseAvailabilityStored(payload);
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

function aboutCertImageAllowed(image) {
  const s = String(image ?? '').trim();
  if (!s) return false;
  if (/^(javascript:|vbscript:)/i.test(s)) return false;
  if (/^data:/i.test(s)) return /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(s);
  return true;
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
    out.push({ image, alt, badge, title, description });
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

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Слишком много попыток входа. Подождите 15 минут.',
  keyFn: (req) => `auth:${req.ip || req.socket?.remoteAddress || 'unknown'}`,
});

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

function deriveDriverRouteLabelFromProfile(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

async function ensureDriverRouteLabelForUser(targetId) {
  const row = await getUserById(targetId);
  if (!row || String(row.role) !== 'driver') return;
  let lbl = String(row.driver_route_label || '').trim();
  if (lbl.length >= 2) return;
  lbl = deriveDriverRouteLabelFromProfile(row);
  if (lbl.length < 2) return;
  await assertDriverRouteLabelUnique(lbl, targetId);
  await db.prepare('UPDATE users SET driver_route_label = ? WHERE id = ?').run(lbl, targetId);
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
  res.json({ bootId: CLIENT_BOOT_ID });
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
  res.set('Cache-Control', 'no-store');
  res.json(out);
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
  const availability = await loadDeliveryAvailability();
  res.set('Cache-Control', 'no-store');
  res.json(availability);
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
  const user = await getUserById(uid);
  if (!user || user.blocked) {
    req.session.userId = null;
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/register', authRateLimit, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.registerSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone, password } = v.value;
  const exists = await db
    .prepare('SELECT id FROM users WHERE lower(email) = lower(?) OR phone = ?')
    .get(email, phone);
  if (exists) return res.status(409).json({ error: 'Email или телефон уже зарегистрированы.' });

  const password_hash = bcrypt.hashSync(password, 12);
  let info;
  try {
    info = await db
      .prepare(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
         VALUES (?, ?, ?, ?, ?, 'client', NOW()::text)`
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

  req.session.userId = user.id;
  audit(db, user.id, 'register', `email=${email}`, req.ip);
  try {
    await saveSessionPromise(req);
  } catch (sessErr) {
    // eslint-disable-next-line no-console
    console.error('[register] Ошибка сохранения сессии:', sessErr);
    return res.status(500).json({
      error:
        'Учётная запись создана, но сессия не сохранилась (часто таблица express_session или права к БД). См. консоль сервера.',
    });
  }
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/login', authRateLimit, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.loginSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { credential, password } = v.value;
  const credNorm = normalizeCredential(credential);
  const user = await findUserByCredential(credential);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль.' });
  const roleLower = String(user.role || '').toLowerCase();
  if (['operator', 'manager', 'admin'].includes(roleLower) && credNorm.kind === 'phone') {
    return res.status(401).json({ error: 'Вход оператора, менеджера и администратора возможен только по email.' });
  }
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

app.post('/api/orders', requireAuth, csrfMiddleware, asyncHandler(async (req, res) => {
  const v = schemas.validate(schemas.orderCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { address, delivery_date, delivery_slot, payment_method, bonuses_used, items, courier_note } = v.value;
  const availability = await loadDeliveryAvailability();
  const bookCheck = deliveryAvailability.validateDeliveryBooking(delivery_date, delivery_slot, availability);
  if (!bookCheck.ok) return res.status(400).json({ error: bookCheck.error });
  const addrCheck = orenburgAddress.validateDeliveryAddressLine(address);
  if (!addrCheck.ok) return res.status(400).json({ error: addrCheck.error });

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
  await insertOrderAuditEvent(db, order.id, 'order_create', 'Заказ оформлен клиентом', req.user.id, '');
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
    const dateCheck = validateDeliveryDateForBooking(v.value.delivery_date);
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
    const driverVal = String(v.value.driver || '').trim() || null;

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
           VALUES (?, ?, ?, ?, 'new', ?, 0, 0, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          customer.id,
          v.value.address,
          dateCheck.value,
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
    await insertOrderAuditEvent(db, orderId, 'order_operator_create', 'Создан оператором', req.user.id, '');
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

app.get('/api/orders/operator/drivers', requireAuth, requireRole('operator', 'manager', 'admin'), asyncHandler(async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT first_name, last_name, driver_route_label
       FROM users
       WHERE lower(role) = 'driver'
       ORDER BY id ASC`
    )
    .all();
  const list = [];
  const seenLower = new Set();
  for (const row of rows) {
    let lbl = String(row.driver_route_label || '').trim();
    if (!lbl) lbl = deriveDriverRouteLabelFromProfile(row);
    if (lbl.length < 2) continue;
    const key = lbl.toLocaleLowerCase('ru');
    if (seenLower.has(key)) continue;
    seenLower.add(key);
    list.push(lbl);
  }
  list.sort((a, b) => a.localeCompare(b, 'ru'));
  res.json({ drivers: list });
}));

app.get(
  '/api/orders/operator/delivery-availability',
  requireAuth,
  requireRole('operator', 'manager', 'admin'),
  asyncHandler(async (_req, res) => {
    const record = await loadDeliveryAvailabilityRecord();
    res.set('Cache-Control', 'no-store');
    res.json({
      availability: record.availability,
      lastChange: record.meta,
      slotDefs: deliveryAvailability.BOOKING_SLOT_DEFS,
      days: deliveryAvailability.enumerateBookingDays(30),
    });
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
    ...auditRows,
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
         ${operatorView ? "AND COALESCE(u.role, '') IN ('operator', 'driver', '')" : ''}
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
    if (v.value.delivery_date != null) {
      const dateCheck = validateDeliveryDateForBooking(v.value.delivery_date);
      if (!dateCheck.ok) return res.status(400).json({ error: dateCheck.error });
      v.value.delivery_date = dateCheck.value;
    }
    const changeReason = String(v.value.change_reason || '').trim();
    const requiresReason =
      (v.value.delivery_date != null &&
        deliveryDateStoredChanged(order.delivery_date, v.value.delivery_date)) ||
      (v.value.delivery_slot != null &&
        deliverySlotStoredChanged(order.delivery_slot, v.value.delivery_slot)) ||
      (v.value.status != null && v.value.status === 'cancelled' && order.status !== 'cancelled');
    if (requiresReason && changeReason.length < 3) {
      return res.status(400).json({
        error: 'Укажите причину переноса доставки или отмены заказа (не менее 3 символов).',
      });
    }

    if (v.value.items_json != null) {
      const pricedPatch = await orderPricing.resolveStaffOrderItemsPatch(db, v.value.items_json);
      if (!pricedPatch.ok) return res.status(400).json({ error: pricedPatch.error });
      v.value.items_json = pricedPatch.itemsJson;
      v.value.total_sum = pricedPatch.total_sum;
    } else {
      delete v.value.total_sum;
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

function todayIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseAdminStatsPeriodQuery(req) {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  let from = iso.test(String(req.query.from || '').trim()) ? String(req.query.from).trim() : null;
  let to = iso.test(String(req.query.to || '').trim()) ? String(req.query.to).trim() : null;
  const today = todayIsoLocal();
  if (from && from > today) {
    return { error: 'Дата «с» не может быть позже сегодняшнего дня.' };
  }
  if (to && to > today) {
    return { error: 'Дата «по» не может быть в будущем.' };
  }
  if (from && to && from > to) {
    return { error: 'Дата «с» не может быть позже даты «по».' };
  }
  return { from, to };
}

function adminStatsOrderPeriodClause(from, to) {
  const parts = [];
  const vals = [];
  if (from) {
    parts.push(`${ADMIN_ORDER_DATE_EXPR} >= ?`);
    vals.push(from);
  }
  if (to) {
    parts.push(`${ADMIN_ORDER_DATE_EXPR} <= ?`);
    vals.push(to);
  }
  const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  return { where, vals };
}

app.get('/api/admin/stats', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const parsed = parseAdminStatsPeriodQuery(req);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { from, to } = parsed;
  const { where, vals } = adminStatsOrderPeriodClause(from, to);

  const byRoleRows = await db.prepare(`SELECT role, COUNT(*)::int AS c FROM users GROUP BY role ORDER BY role`).all();
  const usersByRole = {};
  for (const row of byRoleRows || []) usersByRole[String(row.role)] = Number(row.c) || 0;

  const summaryRow =
    (await db
      .prepare(
        `SELECT COUNT(*)::int AS orders_total,
                COALESCE(SUM(o.total_sum), 0)::float AS orders_sum,
                COUNT(*) FILTER (WHERE o.status = 'delivered')::int AS delivered_count,
                COALESCE(SUM(o.total_sum) FILTER (WHERE o.status = 'delivered'), 0)::float AS delivered_sum,
                COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled_count
         FROM orders o ${where}`
      )
      .get(...vals)) || {};

  const ordersByStatus = await db
    .prepare(
      `SELECT o.status AS status,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       FROM orders o ${where}
       GROUP BY o.status
       ORDER BY c DESC, o.status`
    )
    .all(...vals);

  const ordersByZone = await db
    .prepare(
      `SELECT COALESCE(NULLIF(trim(o.zone), ''), 'Не указана') AS label,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       FROM orders o ${where}
       GROUP BY 1
       ORDER BY c DESC, label`
    )
    .all(...vals);

  const ordersByPayment = await db
    .prepare(
      `SELECT COALESCE(NULLIF(trim(o.payment_method), ''), 'Не указан') AS label,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       FROM orders o ${where}
       GROUP BY 1
       ORDER BY c DESC, label`
    )
    .all(...vals);

  const ordersByDriver = await db
    .prepare(
      `SELECT COALESCE(NULLIF(trim(o.driver), ''), 'Не назначен') AS label,
              COUNT(*)::int AS c,
              COALESCE(SUM(o.total_sum), 0)::float AS sum
       FROM orders o ${where}
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

  res.json({
    period: { from, to },
    usersByRole,
    summary: {
      ordersTotal: Number(summaryRow.orders_total ?? 0),
      ordersSum: Math.round((Number(summaryRow.orders_sum) || 0) * 100) / 100,
      deliveredCount: Number(summaryRow.delivered_count ?? 0),
      deliveredSum: Math.round((Number(summaryRow.delivered_sum) || 0) * 100) / 100,
      cancelledCount: Number(summaryRow.cancelled_count ?? 0),
    },
    ordersByStatus: mapRows(ordersByStatus).map((x) => ({
      status: x.status || x.label,
      count: x.count,
      sum: x.sum,
    })),
    ordersByZone: mapRows(ordersByZone),
    ordersByPayment: mapRows(ordersByPayment),
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

/** Передаёт клиенту реальный PORT — fallback формы при Live Server/IP не промахиваются мимо сервера. */
app.get('/ekvaline-runtime.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/javascript');
  const p = Number(resolvedListenPort);
  res.send(`window.__EKVALINE_LISTEN_PORT__=${Number.isFinite(p) ? p : 3001};\n`);
});

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
  // eslint-disable-next-line no-console
  console.log('Учётные записи демо: оператор / менеджер / админ — вход только по email (форма «Вход»):');
  // eslint-disable-next-line no-console
  console.log('  adminekva@mail.ru       / AdminEkva2026!');
  // eslint-disable-next-line no-console
  console.log('  managerekva@mail.ru      / ManagerEkva2026!');
  // eslint-disable-next-line no-console
  console.log('  operatorekva@mail.ru     / OperatorEkva2026!');
  if (!String(process.env.YANDEX_MAPS_API_KEY || '').trim()) {
    // eslint-disable-next-line no-console
    console.warn(
      'Карты: задайте YANDEX_MAPS_API_KEY в .env (см. .env.example) — без ключа Яндекс.Карты не загрузятся.'
    );
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
