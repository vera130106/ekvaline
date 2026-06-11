#!/usr/bin/env node
/**
 * Проверка готовности к выкладке на VPS (production).
 * Запуск: npm run deploy:check
 * На сервере: cd /opt/ekvaline && npm run deploy:check
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const path = resolve(root, '.env');
  const env = { ...process.env };
  if (!existsSync(path)) return { env, path, found: false };
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return { env, path, found: true };
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
}

const { env, path: envPath, found } = loadEnv();
let errors = 0;
let warnings = 0;
const localOnly = process.argv.includes('--local');

console.log('\n=== Проверка готовности к production ===\n');
if (localOnly) {
  console.log('(режим --local: только файлы и npm run verify, без .env production)\n');
}

if (!found) {
  if (localOnly) warn('Файл .env не найден — на VPS создайте из .env.docker.example');
  else {
    fail(`Файл .env не найден (${envPath})`);
    console.log('  Скопируйте: cp .env.docker.example .env');
    errors += 1;
  }
} else {
  ok('.env найден');
}

if (!localOnly) {
  const nodeEnv = String(env.NODE_ENV || '').trim().toLowerCase();
  if (nodeEnv === 'production') ok('NODE_ENV=production');
  else {
    warn('NODE_ENV не production — на VPS задайте NODE_ENV=production');
    warnings += 1;
  }

  const secret = String(env.SESSION_SECRET || '').trim();
  if (secret.length >= 32) ok(`SESSION_SECRET (${secret.length} символов)`);
  else {
    fail('SESSION_SECRET короче 32 символов (openssl rand -hex 24)');
    errors += 1;
  }

  if (
    secret === 'change-me-use-openssl-rand-hex-32-characters-min' ||
    secret === 'docker-local-dev-secret-min-32-chars!!' ||
    secret.includes('change-in-production')
  ) {
    fail('SESSION_SECRET — шаблон из примера, замените на уникальный');
    errors += 1;
  }

  const baseUrl = String(env.APP_BASE_URL || '').trim();
  if (!baseUrl) {
    fail('APP_BASE_URL не задан');
    errors += 1;
  } else if (/localhost|127\.0\.0\.1/i.test(baseUrl)) {
    warn('APP_BASE_URL указывает на localhost — на сервере укажите IP или домен');
    warnings += 1;
  } else {
    ok(`APP_BASE_URL=${baseUrl}`);
  }

  const isHttps = baseUrl.startsWith('https://');
  const secureCookies = String(env.USE_SECURE_COOKIES || '').toLowerCase() === 'true';
  if (isHttps && secureCookies) ok('USE_SECURE_COOKIES=true (HTTPS)');
  else if (isHttps && !secureCookies) {
    fail('При APP_BASE_URL=https задайте USE_SECURE_COOKIES=true (иначе вход и заказы не работают)');
    errors += 1;
  } else if (!isHttps && secureCookies) {
    warn('USE_SECURE_COOKIES=true при HTTP — cookie сессии не сохранятся, оформление заказа сломается');
    warnings += 1;
  }

  const smtpHost = String(env.SMTP_HOST || '').trim();
  const smtpUser = String(env.SMTP_USER || '').trim();
  const smtpPass = String(env.SMTP_PASS || '').trim();
  if (smtpHost && smtpUser && smtpPass) ok('SMTP настроен (письма с кодами)');
  else {
    fail('SMTP не заполнен — регистрация и сброс пароля клиентов не будут работать');
    errors += 1;
  }

  const mapsKey = String(env.YANDEX_MAPS_API_KEY || '').trim();
  const geoKey = String(env.YANDEX_GEOCODER_API_KEY || '').trim();
  if (mapsKey && geoKey) ok('Ключи Яндекс.Карт заданы');
  else {
    warn('YANDEX_MAPS_API_KEY или YANDEX_GEOCODER_API_KEY пусты — карта/адреса могут не работать');
    warnings += 1;
  }

  if (String(env.SEED_DEMO_ORDERS || '').trim() === '1') {
    warn('SEED_DEMO_ORDERS=1 — отключите на боевом сайте');
    warnings += 1;
  }
}

console.log('\n--- Проверка файлов проекта ---\n');
const required = [
  'Dockerfile',
  'docker-compose.yml',
  'docker/entrypoint.sh',
  'docker/nginx/ekvaline.conf.example',
  'deploy/update-on-server.sh',
  '.env.docker.example',
  'server.js',
  'client-guard.js',
  'operator-mobile.css',
  'staff-mobile.css',
];
for (const f of required) {
  if (existsSync(resolve(root, f))) ok(f);
  else {
    fail(`нет файла ${f}`);
    errors += 1;
  }
}

console.log('\n--- npm run verify ---\n');
const verify = spawnSync(process.execPath, ['scripts/verify.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (verify.status !== 0) {
  fail('verify.mjs завершился с ошибкой');
  errors += 1;
} else {
  ok('Синтаксис JS-файлов');
}

console.log('\n=== Итог ===\n');
if (errors === 0 && warnings === 0) {
  console.log('Готово к выкладке. Дальше: docs/ВЫКЛАДКА-GIT-И-VPS.md\n');
} else if (errors === 0) {
  console.log(`Можно выкладывать с ${warnings} предупреждением(ями).\n`);
} else {
  console.log(`Исправьте ${errors} ошибку(и), затем повторите npm run deploy:check\n`);
  process.exit(1);
}
