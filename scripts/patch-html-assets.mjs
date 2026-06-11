/**
 * Безопасное обновление HTML (UTF-8): viewport, cache-bust, guard, mobile CSS.
 * node scripts/patch-html-assets.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = process.argv[2] || '20260611host';

const GUARD_PAGES = new Set(['admin.html', 'operator.html', 'manager.html', 'driver.html', 'cabinet.html']);

function patchHtml(name) {
  const path = join(ROOT, name);
  let html = readFileSync(path, 'utf8');
  let changed = false;

  const viewportOld = 'content="width=device-width, initial-scale=1.0"';
  const viewportNew = 'content="width=device-width, initial-scale=1.0, viewport-fit=cover"';
  if (html.includes(viewportOld) && !html.includes('viewport-fit=cover')) {
    html = html.replaceAll(viewportOld, viewportNew);
    changed = true;
  }

  const assetKeys = [
    'styles.css',
    'responsive-mobile.css',
    'operator-mobile.css',
    'staff-mobile.css',
    'script.js',
    'operator.js',
    'admin.js',
    'manager.js',
    'community.js',
    'driver.js',
    'mobile-nav.js',
    'maps-runtime.js',
    'catalog-cart-boot.js',
    'client-guard.js',
    'auth-password.js',
    'cabinet-pg.js',
    'reset-password-page.js',
    'notifications-client.js',
    'orders-sync.js',
  ];

  for (const key of assetKeys) {
    const re = new RegExp(`(${key.replace(/\./g, '\\.')})(\\?[^"']*)?(?=["'])`, 'g');
    html = html.replace(re, (_, file, q) => {
      const next = `${file}?v=${V}`;
      if (`${file}${q || ''}` === next) return `${file}${q || ''}`;
      changed = true;
      return next;
    });
  }

  if (name === 'operator.html' && !html.includes('operator-mobile.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="responsive-mobile\.css\?v=[^"]+"\s*\/>)/,
      `$1\n    <link rel="stylesheet" href="operator-mobile.css?v=${V}" />`
    );
    changed = true;
  }

  if ((name === 'admin.html' || name === 'manager.html') && !html.includes('staff-mobile.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="responsive-mobile\.css\?v=[^"]+"\s*\/>)/,
      `$1\n    <link rel="stylesheet" href="staff-mobile.css?v=${V}" />`
    );
    changed = true;
  }

  if (GUARD_PAGES.has(name) && !html.includes('client-guard.js')) {
    html = html.replace(
      /(<script src="api-client\.js(?:\?[^"]*)?"[^>]*><\/script>)/,
      `$1\n    <script src="client-guard.js?v=${V}"></script>`
    );
    changed = true;
  }

  if (!html.includes('ЭкваЛайн')) {
    throw new Error(`${name}: после патча пропала кириллица — отмена`);
  }

  if (changed) {
    writeFileSync(path, html, 'utf8');
    console.log(`patched ${name}`);
  } else {
    console.log(`skip ${name} (уже актуально)`);
  }
}

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html') && f !== 'HTML-ВСЕ-СТРАНИЦЫ.html');
for (const name of pages) patchHtml(name);
console.log(`\nГотово. Версия ассетов: ${V}\n`);
