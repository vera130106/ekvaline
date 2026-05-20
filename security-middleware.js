'use strict';

/**
 * Заголовки безопасности и ограничение частоты запросов (без внешних зависимостей).
 */

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (req.secure || String(process.env.USE_SECURE_COOKIES || '').toLowerCase() === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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

module.exports = {
  securityHeaders,
  createRateLimiter,
  assertProductionSessionSecret,
};
