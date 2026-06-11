/**
 * Собирает все корневые .html в один файл — сплошной исходный код без пояснений.
 * Запуск: node scripts/build-html-archive.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FILES = [
  'index.html',
  'catalog.html',
  'about.html',
  'delivery.html',
  'contacts.html',
  'community.html',
  'cabinet.html',
  'reset-password.html',
  'verify-email.html',
  'operator.html',
  'admin.html',
  'manager.html',
  'driver.html',
];

function main() {
  const parts = [];

  for (const file of FILES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      console.warn('Skip missing:', file);
      continue;
    }
    const content = fs.readFileSync(full, 'utf8');
    parts.push(content);
    if (!content.endsWith('\n')) parts.push('\n');
  }

  const out = parts.join('');
  const docsDir = path.join(ROOT, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  const outHtml = path.join(docsDir, 'HTML-ВСЕ-СТРАНИЦЫ.html');
  fs.writeFileSync(outHtml, out, 'utf8');
  console.log(`OK: ${outHtml} (${(out.length / 1024).toFixed(1)} KB)`);

  const outTxt = path.join(docsDir, 'HTML-ВСЕ-СТРАНИЦЫ.source.txt');
  fs.writeFileSync(outTxt, out, 'utf8');
  console.log(`OK: ${outTxt} (${(out.length / 1024).toFixed(1)} KB)`);
}

main();
