'use strict';

/**
 * Заголовки безопасности и ограничение частоты запросов (без внешних зависимостей).
 */

/** Домены Яндекс.Карт (JavaScript API 2.1 + CSP 202512). Документация: yandex.ru/maps-api/docs/js-api/common/connection/csp.html */
const YANDEX_MAPS_CSP_SCRIPT = [
  "'self'",
  'https://api-maps.yandex.ru',
  'https://*.api-maps.yandex.ru',
  'https://suggest-maps.yandex.ru',
  'https://yastatic.net',
  "'unsafe-eval'",
].join(' ');

const YANDEX_MAPS_CSP_CONNECT = [
  "'self'",
  'https://api-maps.yandex.ru',
  'https://*.api-maps.yandex.ru',
  'https://*.maps.yandex.net',
  'https://suggest-maps.yandex.ru',
  'https://search-maps.yandex.ru',
  'https://api.routing.yandex.net',
  'https://overpass-api.de',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
].join(' ');

const YANDEX_MAPS_CSP_STYLE = [
  "'self'",
  "'unsafe-inline'",
  'blob:',
  'https://api-maps.yandex.ru',
  'https://*.api-maps.yandex.ru',
  'https://yastatic.net',
  'https://fonts.googleapis.com',
].join(' ');

const YANDEX_MAPS_CSP_FONT = ["'self'", 'data:', 'https://yastatic.net', 'https://fonts.gstatic.com'].join(' ');

const YANDEX_MAPS_CSP_IMG = [
  "'self'",
  'data:',
  'blob:',
  'https:',
  'https://api-maps.yandex.ru',
  'https://*.api-maps.yandex.ru',
  'https://*.maps.yandex.net',
  'https://yastatic.net',
].join(' ');

const YANDEX_MAPS_CSP_WORKER = [
  "'self'",
  'data:',
  'blob:',
  'https://api-maps.yandex.ru',
  'https://*.api-maps.yandex.ru',
  'https://yastatic.net',
].join(' ');

function buildContentSecurityPolicy() {
  const baseUrl = String(process.env.APP_BASE_URL || '').trim();
  const secureCookies = String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true';
  const httpsSite = baseUrl.startsWith('https://') || secureCookies;
  const parts = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${YANDEX_MAPS_CSP_SCRIPT}`,
    `style-src ${YANDEX_MAPS_CSP_STYLE}`,
    `img-src ${YANDEX_MAPS_CSP_IMG}`,
    `font-src ${YANDEX_MAPS_CSP_FONT}`,
    `connect-src ${YANDEX_MAPS_CSP_CONNECT}`,
    "media-src 'self'",
    `worker-src ${YANDEX_MAPS_CSP_WORKER}`,
    'child-src https://api-maps.yandex.ru',
    'frame-src https://api-maps.yandex.ru',
  ];
  /* На http://IP:3001 upgrade-insecure-requests ломает загрузку ресурсов — только для HTTPS. */
  if (httpsSite) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy());
  if (req.secure || String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

/** HTML кабинета и staff — не кэшировать (меньше риска устаревшего UI после смены прав). */
function noCacheProtectedHtml(req, res, next) {
  const leaf = String(req.path || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .toLowerCase();
  if (/^(admin|operator|manager|driver|cabinet)\.html$/.test(leaf)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

function createRateLimiter({ windowMs = 60_000, max = 60, message, keyFn }) {
  const buckets = new Map();
  const window = Math.max(1000, Number(windowMs) || 60_000);
  const limit = Math.max(1, Number(max) || 60);
  const resolveKey =
    typeof keyFn === 'function'
      ? keyFn
      : (req) => `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.path}`;

  return function rateLimitMiddleware(req, res, next) {
    const key = resolveKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + window };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({
        error: message || 'Слишком много запросов. Повторите позже.',
      });
    }
    next();
  };
}

function assertProductionSessionSecret() {
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  const secret = String(process.env.SESSION_SECRET || '').trim();
  if (isProd && secret.length < 32) {
    // eslint-disable-next-line no-console
    console.error(
      '[security] В production задайте SESSION_SECRET (минимум 32 символа) в .env'
    );
    process.exit(1);
  }
  if (!isProd && secret.length < 8) {
    // eslint-disable-next-line no-console
    console.warn(
      '[security] Используется SESSION_SECRET по умолчанию — только для разработки.'
    );
  }
}

/** Запрет отдачи серверных и конфигурационных файлов через express.static. */
const BLOCKED_STATIC_BASENAMES = new Set([
  '.env',
  '.env.example',
  '.env.docker.example',
  'server.js',
  'db.js',
  'schemas.js',
  'mailer.js',
  'auth-security.js',
  'bonusprogram.js',
  'geocode-proxy.js',
  'order-pricing.js',
  'security-middleware.js',
  'delivery-availability.js',
  'orenburg-address.js',
  'delivery-slots.js',
  'clientnotifications.js',
  'pollvotes.js',
  'watercalcengine.js',
  'order-payment.js',
  'opx-field-limits.js',
  'package.json',
  'package-lock.json',
  'docker-compose.yml',
  'dockerfile',
  '.dockerignore',
]);

const BLOCKED_STATIC_PREFIXES = ['scripts/', 'node_modules/', '.git/', 'docker/', 'docs/'];

function denySensitiveStaticFiles(req, res, next) {
  let rel = String(req.path || '').split('?')[0];
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return res.status(404).type('text/plain').send('Not found');
  }
  rel = rel.replace(/^[/\\]+/, '').replace(/\\/g, '/').toLowerCase();
  if (!rel) return next();

  const base = rel.split('/').pop() || '';
  if (base.startsWith('.env')) {
    return res.status(404).type('text/plain').send('Not found');
  }
  if (BLOCKED_STATIC_BASENAMES.has(base)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  if (/\.(sql|mjs|cjs)$/i.test(base) && !/^vendor\//.test(rel)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  for (const prefix of BLOCKED_STATIC_PREFIXES) {
    if (rel === prefix.slice(0, -1) || rel.startsWith(prefix)) {
      return res.status(404).type('text/plain').send('Not found');
    }
  }
  next();
}

module.exports = {
  securityHeaders,
  buildContentSecurityPolicy,
  noCacheProtectedHtml,
  denySensitiveStaticFiles,
  createRateLimiter,
  assertProductionSessionSecret,
};
