#!/usr/bin/env node
/**
 * Проверка уже выложенного сайта по URL (без локального deploy:check).
 * node scripts/verify-remote-host.mjs http://45.147.179.211:3001
 */
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = String(process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\//i.test(base)) {
  console.error('Укажите URL: node scripts/verify-remote-host.mjs http://IP:3001');
  process.exit(1);
}

let failed = 0;

function ok(msg) {
  console.log(`OK ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.log(`FAIL ${msg}`);
}

async function head(path) {
  const r = await fetch(`${base}${path}`, { redirect: 'follow' });
  return r;
}

console.log(`\n=== Проверка хоста: ${base} ===\n`);

const assets = [
  '/cabinet.html',
  '/styles.css',
  '/responsive-mobile.css',
  '/cabinet-pg.js',
  '/operator.html',
  '/operator-mobile.css',
  '/staff-mobile.css',
];

for (const path of assets) {
  try {
    const r = await head(path);
    if (r.ok) ok(`${path} → ${r.status}`);
    else fail(`${path} → HTTP ${r.status}`);
  } catch (e) {
    fail(`${path} → ${e.message}`);
  }
}

try {
  const r = await head('/cabinet.html');
  const csp = r.headers.get('content-security-policy') || '';
  if (csp.includes('fonts.googleapis.com') && csp.includes('fonts.gstatic.com')) {
    ok('CSP разрешает Google Fonts (шрифты Manrope)');
  } else {
    fail('CSP без fonts.googleapis.com — шрифты блокируются, обновите код на сервере (git pull + docker compose up -d --build)');
  }
  if (csp.includes('upgrade-insecure-requests')) {
    fail('CSP upgrade-insecure-requests на HTTP — отключите USE_SECURE_COOKIES и APP_BASE_URL=https в .env');
  } else {
    ok('CSP без upgrade-insecure-requests (норма для http://IP:3001)');
  }
} catch (e) {
  fail(`CSP: ${e.message}`);
}

try {
  const r = await fetch(`${base}/api/public/deploy-status`);
  const j = await r.json();
  if (j.ok) {
    ok(`deploy-status APP_BASE_URL=${j.appBaseUrl || '—'}`);
    if (j.secureCookies) {
      fail('USE_SECURE_COOKIES=true при HTTP — сессия и сохранение заказов не работают');
    } else {
      ok('USE_SECURE_COOKIES выключен (норма для HTTP)');
    }
    if (j.appBaseUrl && !j.appBaseUrl.startsWith(base) && !base.startsWith(j.appBaseUrl.replace(/\/+$/, ''))) {
      console.log(
        `WARN APP_BASE_URL (${j.appBaseUrl}) не совпадает с проверяемым URL — письма и ссылки ведут на другой адрес`
      );
    }
  } else {
    fail('deploy-status недоступен — обновите сервер до последней версии');
  }
} catch (e) {
  fail(`deploy-status: ${e.message}`);
}

console.log('\n--- Полный сценарий (вход, заказ, staff) ---\n');
const flow = spawnSync(process.execPath, [join(ROOT, 'scripts', 'verify-full-site-flow.mjs'), base], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (flow.stdout) process.stdout.write(flow.stdout);
if (flow.stderr) process.stderr.write(flow.stderr);
if (flow.status !== 0) failed += 1;

console.log(failed ? `\nИтого: ${failed} проблем(ы). Обновите .env и выполните sh deploy/update-on-server.sh\n` : '\nХост в порядке.\n');
process.exit(failed ? 1 : 0);
