/**
 * Проверка карт и геокодера на всех страницах.
 * node scripts/verify-maps.mjs [baseUrl]
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] || 'http://localhost:3010';

const fails = [];
const oks = [];
const warns = [];

function ok(msg) {
  oks.push(msg);
  console.log('OK', msg);
}

function warn(msg) {
  warns.push(msg);
  console.log('WARN', msg);
}

function fail(msg) {
  fails.push(msg);
  console.error('FAIL', msg);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { Accept: 'application/json', ...(opts.headers || {}) },
  });
  let data = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  return { r, data };
}

function checkMapsRuntimeSource() {
  const src = read('maps-runtime.js');
  for (const fn of ['initStaticMap', 'attachInteractiveMap', 'createOrdersMapHost', 'prefetch', 'getConfig']) {
    if (!src.includes(`function ${fn}`) && !src.includes(`${fn}(`)) {
      fail(`maps-runtime.js: нет ${fn}`);
      return;
    }
  }
  if (!src.includes('/api/public/maps-config')) {
    fail('maps-runtime.js: нет запроса maps-config');
    return;
  }
  ok('maps-runtime.js: API карт (initStatic, interactive, orders)');
}

function checkPageMapWiring(spec) {
  const html = read(spec.file);
  if (spec.bodyClass && !html.includes(spec.bodyClass)) {
    fail(`${spec.file}: нет class "${spec.bodyClass}"`);
    return;
  }
  if (!html.includes('maps-runtime.js')) {
    fail(`${spec.file}: не подключён maps-runtime.js`);
    return;
  }
  for (const id of spec.requiredIds || []) {
    if (!html.includes(`id="${id}"`)) {
      fail(`${spec.file}: нет элемента #${id}`);
      return;
    }
  }
  for (const script of spec.requiredScripts || []) {
    if (!html.includes(script)) {
      fail(`${spec.file}: не подключён ${script}`);
      return;
    }
  }
  ok(`${spec.label}: HTML + maps-runtime`);
}

function checkScriptDeliveryInit() {
  const src = read('script.js');
  if (!src.includes('deliveryZoneMap') || !src.includes('initStaticMap')) {
    fail('script.js: нет инициализации deliveryZoneMap');
    return;
  }
  if (!src.includes('EkvalineMapPicker')) {
    fail('script.js: нет EkvalineMapPicker (кабинет / каталог)');
    return;
  }
  ok('script.js: deliveryZoneMap + EkvalineMapPicker');
}

function checkOperatorMapsSource() {
  const src = read('operator.js');
  for (const token of ['createOrdersMapHost', 'attachInteractiveMap', 'ensureZoneMap', 'ensureClientMap']) {
    if (!src.includes(token)) {
      fail(`operator.js: нет ${token}`);
      return;
    }
  }
  ok('operator.js: карта зон и карта адреса клиента');
}

function checkCspAllowsYandex() {
  const src = read('security-middleware.js');
  const need = ['https://api-maps.yandex.ru', 'https://yastatic.net', 'https://*.maps.yandex.net', "'unsafe-eval'"];
  for (const token of need) {
    if (!src.includes(token)) {
      fail(`CSP: нет ${token} для Яндекс.Карт`);
      return;
    }
  }
  const mapsRt = read('maps-runtime.js');
  if (!mapsRt.includes('csp=202512') && !mapsRt.includes('buildYmapsScriptUrl')) {
    fail('maps-runtime.js: нет csp=202512 при загрузке API');
    return;
  }
  ok('CSP + maps-runtime: Яндекс.Карты разрешены');
}

async function checkMapsConfigApi() {
  const { r, data } = await json('/api/public/maps-config');
  if (!r.ok || !data || typeof data !== 'object') {
    fail('GET /api/public/maps-config');
    return null;
  }
  if (!('provider' in data) || !('yandexMapsKey' in data)) {
    fail('maps-config: неверная структура ответа');
    return null;
  }
  const hasKey = Boolean(String(data.yandexMapsKey || '').trim());
  if (hasKey) ok('maps-config: ключ JavaScript API задан (Яндекс.Карты в браузере)');
  else warn('maps-config: YANDEX_MAPS_API_KEY не задан — карты покажут заглушку, адрес можно вводить полями');
  return data;
}

async function checkGeocodeSearch() {
  const q = encodeURIComponent('Оренбург, ул. Салмышская, 10');
  const { r, data } = await json(`/api/public/geocode-search?limit=3&q=${q}&countrycodes=ru`);
  if (!r.ok || !Array.isArray(data)) {
    fail(`geocode-search: ${r.status}`);
    return;
  }
  if (!data.length) {
    fail('geocode-search: пустой ответ для тестового адреса Оренбурга');
    return;
  }
  const hit = data.find((row) => /оренбург/i.test(String(row.display_name || '')));
  if (!hit) warn('geocode-search: результат есть, но без «Оренбург» в display_name');
  else ok(`geocode-search (${data.length} результатов)`);
}

async function checkGeocodeReverse() {
  const { r, data } = await json('/api/public/geocode-reverse?lat=51.768199&lon=55.096955');
  if (!r.ok || !data) {
    fail(`geocode-reverse: ${r.status}`);
    return;
  }
  const name = String(data.display_name || JSON.stringify(data.address || {}));
  if (!/оренбург/i.test(name)) warn('geocode-reverse: ответ без Оренбурга (возможен резерв Nominatim)');
  ok('geocode-reverse');
}

async function checkGeocodeStructured() {
  const params = new URLSearchParams({
    limit: '5',
    countrycodes: 'ru',
    city: 'Оренбург',
    street: 'Салмышская',
    bounded: '1',
    viewbox: '54.95,51.95,55.55,51.55',
  });
  const { r, data } = await json(`/api/public/geocode-search?${params}`);
  if (!r.ok || !Array.isArray(data)) {
    fail('geocode-search (структурный city+street)');
    return;
  }
  ok(`geocode-search структурный (${data.length})`);
}

async function checkOperatorMapsSession() {
  let cookies = [];
  const hdr = () => ({ Cookie: cookies.join('; ') });
  const absorb = (res) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const p = c.split(';')[0];
      const n = p.split('=')[0];
      cookies = cookies.filter((x) => !x.startsWith(`${n}=`));
      cookies.push(p);
    }
  };

  const csrfR = await json('/api/csrf', { headers: hdr() });
  absorb(csrfR.r);
  const csrf = csrfR.data?.csrfToken;
  if (!csrf) {
    fail('оператор: нет CSRF для входа');
    return;
  }

  const loginR = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: 'opekva@mail.ru', password: 'ekva2026E' }),
  });
  absorb(loginR.r);
  if (!loginR.r.ok) {
    fail(`оператор: вход ${loginR.r.status}`);
    return;
  }

  const ordersR = await json('/api/orders', { headers: hdr() });
  if (!ordersR.r.ok) {
    fail('оператор: GET /api/orders для карты зон');
    return;
  }
  ok('оператор: API заказов для карты зон');
}

async function checkPagesLoad() {
  const pages = [
    'delivery.html',
    'catalog.html',
    'cabinet.html',
    'operator.html',
  ];
  for (const page of pages) {
    const r = await fetch(`${base}/${page}`);
    if (r.status !== 200) {
      fail(`страница ${page} → ${r.status}`);
      continue;
    }
    const html = await r.text();
    if (!html.includes('maps-runtime.js')) {
      fail(`${page}: maps-runtime.js не в ответе сервера`);
      continue;
    }
    ok(`страница ${page} отдаётся с maps-runtime`);
  }
}

console.log(`\n=== Проверка карт: ${base} ===\n`);

checkMapsRuntimeSource();
checkScriptDeliveryInit();
checkOperatorMapsSource();
checkCspAllowsYandex();

checkPageMapWiring({
  label: 'Доставка',
  file: 'delivery.html',
  requiredIds: ['deliveryZoneMap'],
  requiredScripts: ['script.js'],
});
checkPageMapWiring({
  label: 'Каталог (оформление)',
  file: 'catalog.html',
  bodyClass: 'catalog-page',
  requiredScripts: ['script.js', 'catalog-cart-boot.js'],
});
checkPageMapWiring({
  label: 'Кабинет (адрес на карте)',
  file: 'cabinet.html',
  bodyClass: 'cabinet-page-full',
  requiredIds: ['cabinetAddressChangeMapBtn'],
  requiredScripts: ['script.js', 'cabinet-pg.js'],
});
checkPageMapWiring({
  label: 'Оператор',
  file: 'operator.html',
  requiredIds: ['opxZoneMapCanvas', 'opxClientMapCanvas'],
  requiredScripts: ['operator.js'],
});

try {
  const ping = await fetch(`${base}/api/client-boot`);
  if (!ping.ok) throw new Error(String(ping.status));
} catch (e) {
  fail(`сервер недоступен (${base}): ${e.message}. Запустите: npm start`);
  console.log(`\n--- Итого: ${oks.length} OK, ${warns.length} WARN, ${fails.length} FAIL ---\n`);
  process.exit(1);
}

await checkMapsConfigApi();
await checkGeocodeSearch();
await checkGeocodeStructured();
await checkGeocodeReverse();
await checkPagesLoad();
await checkOperatorMapsSession();

console.log(`\n--- Итого: ${oks.length} OK, ${warns.length} WARN, ${fails.length} FAIL ---\n`);
if (fails.length) process.exit(1);
