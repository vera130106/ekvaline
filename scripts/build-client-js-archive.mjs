/**
 * Клиентский JS: важные модули, без комментариев, компактно по строкам.
 * Запуск: node scripts/build-client-js-archive.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CLIENT_JS = [
  'api-client.js',
  'app-core.js',
  'auth-password.js',
  'orders-sync.js',
  'catalog-cart-boot.js',
  'script.js',
  'cabinet-pg.js',
];

function stripComments(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch;
      out += ch;
      i += 1;
      while (i < n) {
        const c = code[i];
        if (c === '\\') {
          out += c + (code[i + 1] || '');
          i += 2;
          continue;
        }
        if (q === '`' && c === '$' && code[i + 1] === '{') {
          out += '${';
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            if (code[i] === '{') depth += 1;
            else if (code[i] === '}') depth -= 1;
            out += code[i];
            i += 1;
          }
          continue;
        }
        out += c;
        i += 1;
        if (c === q) break;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function compact(code) {
  return stripComments(code)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, '').replace(/^\s+/, '').replace(/\t/g, ' ').replace(/ {2,}/g, ' '))
    .filter((line) => line.length > 0)
    .join('\n');
}

function main() {
  const parts = [];
  for (const file of CLIENT_JS) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      console.warn('Skip missing:', file);
      continue;
    }
    parts.push(compact(fs.readFileSync(full, 'utf8')));
  }
  const out = `${parts.join('\n')}\n`;
  const outPath = path.join(ROOT, 'docs', 'JS-КЛИЕНТСКИЕ-СТРАНИЦЫ.txt');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  const lines = out.split('\n').length - 1;
  console.log(
    `OK: ${outPath} (${(out.length / 1024).toFixed(1)} KB, ${lines} lines, ${CLIENT_JS.length} files)`
  );
}

main();
