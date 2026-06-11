import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'catalog.html');

let html = execSync('git show HEAD:catalog.html', { cwd: ROOT, encoding: 'utf8' });

html = html
  .replace('catalog-cart-boot.js?v=20260524', 'catalog-cart-boot.js?v=20260610clientmsg')
  .replace('<script src="api-client.js"></script>', '<script src="api-client.js?v=20260610clientmsg"></script>')
  .replace('maps-runtime.js?v=20260520mapchrome', 'maps-runtime.js?v=20260610maps2')
  .replace('script.js?v=20260524authcart', 'script.js?v=20260610clientmsg');

if (!html.includes('ЭкваЛайн') || /[?]{6,}/.test(html)) {
  console.error('restore-catalog-html: кириллица повреждена в источнике git');
  process.exit(1);
}

writeFileSync(out, html, 'utf8');
console.log('catalog.html восстановлен (UTF-8)');
