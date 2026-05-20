/**
 * Регрессионные проверки: синтаксис JS, обязательная разметка/скрипты на публичных страницах.
 * Запуск: npm run verify
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

const CLIENT_PAGES_RESPONSIVE = [
  ...PUBLIC_WITH_TOPBAR,
  'cabinet.html',
  'reset-password.html',
];

const STAFF_PAGES_RESPONSIVE = ['operator.html', 'admin.html', 'manager.html', 'driver.html'];

const ROOT_JS = [
  'server.js',
  'db.js',
  'schemas.js',
  'security-middleware.js',
  'order-pricing.js',
  'delivery-slots.js',
  'delivery-availability.js',
  'orenburg-address.js',
  'geocode-proxy.js',
  'opx-field-limits.js',
  'app-core.js',
  'api-client.js',
  'script.js',
  'community.js',
  'operator.js',
  'manager.js',
  'admin.js',
  'driver.js',
  'cabinet-pg.js',
  'reset-password-page.js',
  'auth-password.js',
  'notifications-client.js',
  'clientNotifications.js',
  'mailer.js',
  'waterCalcEngine.js',
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

/** Индекс тега <script src="file.js"...> допускает cache-bust query: file.js?v=1 */
function scriptSrcIndex(html, file) {
  const esc = file.replace(/\./g, '\\.');
  const re = new RegExp(`<script[^>]*\\bsrc=["']${esc}(?:\\?[^"']*)?["']`, 'i');
  const m = re.exec(html);
  return m ? m.index : -1;
}

function checkPublicHtml() {
  for (const name of PUBLIC_WITH_TOPBAR) {
    const html = read(name);
    if (!html.includes('id="topbarNotifications"')) {
      fail(`${name}: нет #topbarNotifications (колокольчик не подключится)`);
    }
    const a = scriptSrcIndex(html, 'app-core.js');
    const b = scriptSrcIndex(html, 'api-client.js');
    const c = scriptSrcIndex(html, 'script.js');
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
    'id="water-calc"',
    'id="bottleMeter"',
    'id="calcPriceTotal"',
    'id="litersValue"',
    'id="planLineOne"',
    'assets/one-bottle.png',
    'assets/two-bottles.png',
    'assets/five-bottles.png',
  ]) {
    if (!html.includes(s)) fail(`index.html: ожидалось "${s}"`);
  }
  const js = read('script.js');
  if (!js.includes('fetchWaterCalcFromServer') || !js.includes('/api/public/water-calc')) {
    fail('script.js: калькулятор воды должен запрашивать /api/public/water-calc');
  }
  const srv = read('server.js');
  if (!srv.includes("'/api/public/water-calc'")) fail('server.js: нет GET /api/public/water-calc');
  if (!read('waterCalcEngine.js').includes('estimateWaterConsumption')) {
    fail('waterCalcEngine.js: ожидалась серверная логика калькулятора');
  }
  if (!js.includes('syncTopbarNotifications')) fail('script.js: нет syncTopbarNotifications для колокольчика');
  if (!js.includes('initNotificationsUI')) fail('script.js: нет вызова initNotificationsUI');
  if (!js.includes('calcPriceTotal')) fail('script.js: нет обновления ориентировочной суммы');
  ok('Главная + script.js: калькулятор и уведомления');
}

function checkOperatorHtml() {
  const html = read('operator.html');
  const a = scriptSrcIndex(html, 'api-client.js');
  const slots = scriptSrcIndex(html, 'delivery-slots.js');
  const lim = scriptSrcIndex(html, 'opx-field-limits.js');
  const b = scriptSrcIndex(html, 'operator.js');
  if (a === -1 || slots === -1 || lim === -1 || b === -1) {
    fail('operator.html: нужны api-client, delivery-slots, opx-field-limits, operator.js');
  }
  if (!(a < slots && slots < lim && lim < b)) {
    fail('operator.html: порядок api-client → delivery-slots → opx-field-limits → operator.js');
  }
  for (const id of ['opxOrdersBody', 'opxLogoutBtn', 'opxRefreshBtn', 'opxToast']) {
    if (!html.includes(`id="${id}"`)) fail(`operator.html: нет #${id}`);
  }
  const limits = require(join(ROOT, 'opx-field-limits.js'));
  const checks = [
    ['opxModalClient', limits.NAME_MAX],
    ['opxModalAddress', limits.ADDRESS_MAX],
    ['opxModalNote', limits.NOTE_MAX],
    ['opxOrderReasonText', limits.CHANGE_REASON_MAX],
    ['opxSearchInput', limits.SEARCH_MAX],
  ];
  for (const [id, max] of checks) {
    const re = new RegExp(`id="${id}"[^>]*maxlength="${max}"`, 'i');
    const re2 = new RegExp(`maxlength="${max}"[^>]*id="${id}"`, 'i');
    if (!re.test(html) && !re2.test(html)) {
      fail(`operator.html: у #${id} ожидался maxlength="${max}"`);
    }
  }
  ok('operator.html: скрипты, лимиты полей и ключевые элементы панели');
}

function checkRescheduleDetection() {
  const slots = read('delivery-slots.js');
  if (!slots.includes('function deliveryDateStoredChanged')) {
    fail('delivery-slots.js: нет deliveryDateStoredChanged');
  }
  if (!slots.includes('function deliverySlotStoredChanged')) {
    fail('delivery-slots.js: нет deliverySlotStoredChanged');
  }
  const op = read('operator.js');
  if (!op.includes('window.DeliverySlots')) {
    fail('operator.js: должен использовать DeliverySlots из delivery-slots.js');
  }
  if (op.includes('effectiveDeliveryDateIsoForOrder(order)') && op.includes('orderDeliveryRescheduleChanged')) {
    const fn = op.slice(op.indexOf('function orderDeliveryRescheduleChanged'), op.indexOf('function orderDeliveryRescheduleChanged') + 600);
    if (fn.includes('effectiveDeliveryDateIsoForOrder')) {
      fail('operator.js: orderDeliveryRescheduleChanged не должен сравнивать с датой из created_at');
    }
  }
  ok('Перенос доставки: delivery-slots.js + оператор');
}

function checkCatalogImages() {
  const html = read('catalog.html');
  for (const s of ['assets/product-18-9-white.png', 'assets/product-2-4.png', 'assets/product-5.png']) {
    if (!html.includes(s)) fail(`catalog.html: ожидалось изображение "${s}"`);
  }
  ok('Каталог: ключевые изображения 18.9 л');
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
checkOperatorHtml();
checkRescheduleDetection();

function checkSecurityModules() {
  const srv = read('server.js');
  if (!srv.includes("require('./security-middleware')")) {
    fail('server.js: не подключён security-middleware');
  }
  if (!srv.includes("require('./order-pricing')")) {
    fail('server.js: не подключён order-pricing (пересчёт цен на сервере)');
  }
  if (!srv.includes('resolveOperatorOrderLines')) {
    fail('server.js: operator create должен вызывать resolveOperatorOrderLines');
  }
  if (!srv.includes('resolveStaffOrderItemsPatch')) {
    fail('server.js: staff PATCH должен пересчитывать items_json');
  }
  const adminJs = read('admin.js');
  if (/AdminEkva2026!/.test(adminJs) && adminJs.includes('api/auth/login')) {
    fail('admin.js: не должно быть автологина с паролем из исходника');
  }
  const op = read('operator.js');
  if (!op.includes('staffSessionOk')) {
    fail('operator.js: нет проверки staffSessionOk (сессия сервера)');
  }
  const scr = read('script.js');
  if (/OperatorEkva2026!|AdminEkva2026!/.test(scr)) {
    fail('script.js: не должно быть паролей сотрудников в исходнике');
  }
  ok('Безопасность: middleware, цены на сервере, сессия staff');
}

checkSecurityModules();

function checkDockerFiles() {
  for (const f of ['Dockerfile', 'docker-compose.yml', 'docker/entrypoint.sh', '.dockerignore']) {
    if (!existsSync(join(ROOT, f))) fail(`Нет файла Docker: ${f}`);
  }
  ok('Docker: Dockerfile, compose, entrypoint');
}

checkDockerFiles();
checkCatalogImages();

function checkResponsiveCss() {
  for (const name of CLIENT_PAGES_RESPONSIVE) {
    const html = read(name);
    if (!html.includes('responsive-mobile.css')) {
      fail(`${name}: нет responsive-mobile.css`);
    }
    if (!html.includes('width=device-width')) {
      fail(`${name}: нет meta viewport`);
    }
  }
  for (const name of STAFF_PAGES_RESPONSIVE) {
    const html = read(name);
    if (!html.includes('responsive-mobile.css')) {
      fail(`${name}: нет responsive-mobile.css (адаптив staff)`);
    }
  }
  ok('HTML: viewport + responsive-mobile на клиенте и staff');
}

function checkAuthEmailPassword() {
  const cab = read('cabinet-pg.js');
  if (!cab.includes('applyEmailCodeDeliveryResponse')) {
    fail('cabinet-pg.js: нет applyEmailCodeDeliveryResponse');
  }
  if (!cab.includes('change-password-with-code')) {
    fail('cabinet-pg.js: нет вызова change-password-with-code');
  }
  if (!cab.includes('verify-password-code')) {
    fail('cabinet-pg.js: нет вызова verify-password-code');
  }
  if (!read('cabinet.html').includes('cabinet-password-blocked')) {
    fail('cabinet.html: нет блока cabinet-password-blocked');
  }
  const rst = read('reset-password-page.js');
  if (!rst.includes('reset-password-by-email')) {
    fail('reset-password-page.js: нет reset-password-by-email');
  }
  const mail = read('mailer.js');
  if (!mail.includes('isMailConfigured')) {
    fail('mailer.js: нет isMailConfigured');
  }
  const srv = read('server.js');
  for (const route of [
    'confirm-email-code',
    'verify-password-code',
    'verify-password-reset-code',
    'change-password-with-code',
    'reset-password-by-email',
    'send-email-verify-code',
  ]) {
    if (!srv.includes(route)) {
      fail(`server.js: нет маршрута ${route}`);
    }
  }
  if (!srv.includes('Аккаунт с таким email не найден')) {
    fail('server.js: forgot-password должен отклонять несуществующий email');
  }
  const bp = read('bonusProgram.js');
  if (!bp.includes('reverseBonusesForCancelledOrder')) {
    fail('bonusProgram.js: нет reverseBonusesForCancelledOrder');
  }
  if (!bp.includes('computeOrderBonusEarn')) {
    fail('bonusProgram.js: нет computeOrderBonusEarn');
  }
  if (!srv.includes('reverseBonusesForCancelledOrder')) {
    fail('server.js: отмена заказа должна откатывать бонусы');
  }
  const ap = read('auth-password.js');
  if (!ap.includes('validatePassword')) {
    fail('auth-password.js: нет validatePassword');
  }
  if (!mail.includes('mailRecipientGreeting') || !mail.includes("'Клиент'")) {
    fail('mailer.js: приветствие в письме — имя клиента или «Клиент»');
  }
  const scr = read('script.js');
  for (const needle of [
    'authForgotPanel',
    'verify-password-reset-code',
    'openForgotPasswordMode',
    'authForgotPasswordForm',
  ]) {
    if (!scr.includes(needle)) {
      fail(`script.js: нет ${needle} (восстановление пароля во входе)`);
    }
  }
  if (!read('index.html').includes('auth-password.js')) {
    fail('index.html: нет auth-password.js перед script.js');
  }
  if (!read('cabinet.html').includes('cabinetAddressesEmpty')) {
    fail('cabinet.html: нет блока пустых адресов');
  }
  if (!scr.includes('checkoutSavedAddressesWrap')) {
    fail('script.js: нет выбора сохранённых адресов при оформлении');
  }
  if (!scr.includes('EkvalineMapPicker')) {
    fail('script.js: нет EkvalineMapPicker для кабинета');
  }
  ok('Почта и пароли: API, mailer, кабинет, auth-password.js');
}

checkResponsiveCss();
checkAuthEmailPassword();

console.log('\n\x1b[32mПроверки пройдены.\x1b[0m');
