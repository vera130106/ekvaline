/**
 * Регрессионные проверки: синтаксис JS, обязательная разметка/скрипты на публичных страницах.
 * Запуск: npm run verify
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function fail(msg) {
  console.error(`\x1b[31m✖\x1b[0m ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

/** Публичные страницы с шапкой: уведомления + общий стек скриптов. */
const PUBLIC_WITH_TOPBAR = [
  'index.html',
  'catalog.html',
  'about.html',
  'delivery.html',
  'contacts.html',
  'community.html',
];

const ROOT_JS = [
  'server.js',
  'db.js',
  'schemas.js',
  'app-core.js',
  'api-client.js',
  'script.js',
  'community.js',
];

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function checkSyntax() {
  for (const f of ROOT_JS) {
    const p = join(ROOT, f);
    if (!existsSync(p)) fail(`Нет файла: ${f}`);
    const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout);
      fail(`Синтаксис: ${f}`);
    }
  }
  ok(`Синтаксис Node (${ROOT_JS.length} файлов)`);
}

function checkPublicHtml() {
  for (const name of PUBLIC_WITH_TOPBAR) {
    const html = read(name);
    if (!html.includes('id="topbarNotifications"')) {
      fail(`${name}: нет #topbarNotifications (колокольчик не подключится)`);
    }
    const a = html.indexOf('src="app-core.js"');
    const b = html.indexOf('src="api-client.js"');
    const c = html.indexOf('src="script.js"');
    if (a === -1 || b === -1 || c === -1) {
      fail(`${name}: нужны скрипты app-core.js → api-client.js → script.js`);
    }
    if (!(a < b && b < c)) {
      fail(`${name}: неверный порядок скриптов (должен быть app-core → api-client → script)`);
    }
  }
  ok('Публичные HTML: уведомления и порядок скриптов');
}

function checkIndexCalc() {
  const html = read('index.html');
  for (const s of [
    'id="bottleMeter"',
    'id="calcPriceTotal"',
    'assets/one-bottle.png',
    'assets/two-bottles.png',
    'assets/five-bottles.png',
    'id="priceSingleValue"',
    'calc-cost-panel',
  ]) {
    if (!html.includes(s)) fail(`index.html: ожидалось "${s}"`);
  }
  const js = read('script.js');
  if (!js.includes('optimalDeliveryPlan')) fail('script.js: нет optimalDeliveryPlan');
  if (!js.includes('initTopbarNotifications')) fail('script.js: нет initTopbarNotifications');
  if (!js.includes('initNotificationsUI')) fail('script.js: нет вызова initNotificationsUI');
  if (!js.includes('priceSingleValue')) fail('script.js: нет обновления панели стоимости');
  ok('Главная + script.js: калькулятор и уведомления');
}

function checkCatalogImages() {
  const html = read('catalog.html');
  for (const s of ['assets/popular-1.png', 'assets/popular-2.png', 'assets/popular-3.png']) {
    if (!html.includes(s)) fail(`catalog.html: ожидалось изображение "${s}"`);
  }
  ok('Каталог: три картинки popular-1…3');
}

/** Опечатка `bottles.pn` не должна совпадать с корректным `bottles.png` (подстрока). */
const BAD_BOTTLE_EXT = /bottles\.pn(?!g)/;

function checkForbiddenTypos() {
  const scan = (rel, text) => {
    if (BAD_BOTTLE_EXT.test(text)) fail(`${rel}: опечатка bottles.pn → bottles.png`);
  };
  scan('index.html', read('index.html'));
  const walkHtml = (dir, rel = '') => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules') continue;
      const p = join(dir, ent.name);
      const rp = join(rel, ent.name);
      if (ent.isDirectory()) walkHtml(p, rp);
      else if (ent.name.endsWith('.html')) scan(rp.replace(/\\/g, '/'), readFileSync(p, 'utf8'));
    }
  };
  walkHtml(ROOT);
  ok('Нет битого пути bottles.pn (кроме bottles.png)');
}

checkSyntax();
checkForbiddenTypos();
checkPublicHtml();
checkIndexCalc();
checkCatalogImages();

console.log('\n\x1b[32mПроверки пройдены.\x1b[0m');
