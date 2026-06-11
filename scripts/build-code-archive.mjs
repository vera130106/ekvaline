/**
 * Собирает JS-код приложения в один файл без пояснений.
 * Запуск: node scripts/build-code-archive.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CODE_FILES = [
  'server.js',
  'db.js',
  'schemas.js',
  'security-middleware.js',
  'auth-security.js',
  'client-guard.js',
  'order-pricing.js',
  'order-payment.js',
  'delivery-slots.js',
  'delivery-availability.js',
  'orenburg-address.js',
  'geocode-proxy.js',
  'mailer.js',
  'bonusProgram.js',
  'pollVotes.js',
  'clientNotifications.js',
  'app-core.js',
  'api-client.js',
  'catalog-cart-boot.js',
  'script.js',
  'auth-password.js',
  'notifications-client.js',
  'orders-sync.js',
  'maps-runtime.js',
  'mobile-nav.js',
  'community.js',
  'waterCalcEngine.js',
  'cabinet-pg.js',
  'reset-password-page.js',
  'operator.js',
  'manager.js',
  'admin.js',
  'driver.js',
  'opx-field-limits.js',
];

function main() {
  const parts = [];
  for (const file of CODE_FILES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      console.warn('Skip missing:', file);
      continue;
    }
    let content = fs.readFileSync(full, 'utf8');
    parts.push(content);
    if (!content.endsWith('\n')) parts.push('\n');
  }
  const out = parts.join('');
  const outPath = path.join(ROOT, 'docs', 'СКРИПТЫ-И-КОД-ПРИЛОЖЕНИЯ.txt');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`OK: ${outPath} (${(out.length / 1024).toFixed(1)} KB, ${CODE_FILES.length} files)`);
}

main();
