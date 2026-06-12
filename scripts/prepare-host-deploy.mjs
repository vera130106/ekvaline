/**
 * Подготовка проекта к выкладке на VPS (локально, перед git push).
 * node scripts/prepare-host-deploy.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_VERSION = '20260618opxbtn';

function run(label, args) {
  process.stdout.write(`→ ${label}… `);
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  if (r.status !== 0) {
    console.log('FAIL');
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    process.exit(1);
  }
  console.log('OK');
}

console.log(`\n=== Подготовка к выкладке на хостинг (v=${ASSET_VERSION}) ===\n`);

run('patch-html-assets', ['scripts/patch-html-assets.mjs', ASSET_VERSION]);

const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const name of htmlFiles) {
  const text = readFileSync(join(ROOT, name), 'utf8');
  if (!text.includes('ЭкваЛайн') && name !== 'verify-email.html') {
    console.error(`FAIL ${name}: повреждена кодировка UTF-8`);
    process.exit(1);
  }
}
console.log(`→ UTF-8 HTML (${htmlFiles.length} файлов)… OK`);

const required = [
  'Dockerfile',
  'docker-compose.yml',
  'docker/entrypoint.sh',
  'docker/nginx/ekvaline.conf.example',
  'deploy/update-on-server.sh',
  '.env.docker.example',
  'client-guard.js',
  'operator-mobile.css',
  'staff-mobile.css',
  'auth-security.js',
];
for (const f of required) {
  if (!existsSync(join(ROOT, f))) {
    console.error(`FAIL нет файла ${f}`);
    process.exit(1);
  }
}
console.log('→ deploy-файлы… OK');

run('npm run verify', ['scripts/verify.mjs']);
run('verify-mobile-modals', ['scripts/verify-mobile-modals.mjs']);

console.log(`
=== Готово к push на GitHub ===

На вашем ПК:
  1. git add . && git commit -m "..." && git push

На VPS (первый раз):
  git clone <repo> /opt/ekvaline
  cd /opt/ekvaline
  cp .env.docker.example .env
  # заполните SESSION_SECRET, SMTP, APP_BASE_URL, ключи Яндекс
  npm run deploy:check
  docker compose up -d --build

После каждого обновления на VPS:
  sh deploy/update-on-server.sh

Проверка на сервере:
  npm run verify:all http://127.0.0.1:3001

Корзина и заказы: только catalog.html, нужен HTTPS → USE_SECURE_COOKIES=true
`);
