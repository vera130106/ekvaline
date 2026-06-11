/**
 * Статическая проверка operator.html ↔ operator.js (без сервера).
 * node scripts/verify-operator-static.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'operator.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'operator.js'), 'utf8');

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const jsIds = [...new Set([...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]))];
const missingInHtml = jsIds.filter((id) => !htmlIds.has(id));
const optionalMissing = new Set([
  'opxModalOrderId',
  'opxModalTimeFrom',
  'opxModalTimeTo',
  'opxModalPickup',
  'opxModalDateToday',
  'opxZoneMapGeoHint',
]);
const criticalMissing = missingInHtml.filter((id) => !optionalMissing.has(id));

const requiredFns = [
  'computeOperatorFooterStats',
  'syncOperatorFooterDom',
  'orderBillableTotalSum',
  'orderDisplayTotalSum',
  'readModalPickupForSave',
  'footerPaymentBucket',
  'bind',
];
const missingFns = requiredFns.filter((fn) => !js.includes(`function ${fn}`));

let failed = false;
function ok(msg) {
  console.log('OK', msg);
}
function fail(msg) {
  console.error('FAIL', msg);
  failed = true;
}

if (criticalMissing.length) fail(`getElementById без HTML: ${criticalMissing.join(', ')}`);
else ok('все критичные id из JS есть в HTML');

if (missingFns.length) fail(`нет функций: ${missingFns.join(', ')}`);
else ok('ключевые функции на месте');

if (!html.includes('opxClientMapSelectedAddress')) fail('нет #opxClientMapSelectedAddress');
else ok('выбранный адрес на карте в HTML');

if (!html.includes('value="Карта"')) fail('нет опции «Карта» в оплате');
else ok('опция «Карта» в модалке заказа');

if (!js.includes('orderDisplayTotalSum(o)')) fail('таблица не использует orderDisplayTotalSum');
else ok('сумма в таблице через orderDisplayTotalSum');

if (!js.includes('readModalPickupForSave(order)')) fail('pickup не сохраняется через readModalPickupForSave');
else ok('pickup сохраняется без сброса');

if (!js.includes("state.date = isoDate(new Date())")) fail('стартовый фильтр не «Сегодня»');
else ok('фильтр по умолчанию — сегодня');

process.exit(failed ? 1 : 0);
