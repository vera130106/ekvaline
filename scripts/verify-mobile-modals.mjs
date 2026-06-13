/**
 * Проверка адаптива модальных окон и карт на телефоне (CSS-правила).
 * node scripts/verify-mobile-modals.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function must(file, pattern, label) {
  const src = read(file);
  if (!src.includes(pattern) && !(pattern instanceof RegExp && pattern.test(src))) {
    fails.push(`${file}: ${label}`);
  }
}

console.log('\n=== Проверка mobile CSS (модалки и карты) ===\n');

must('responsive-mobile.css', 'max-height: calc(100dvh', 'bottom sheet max-height');
must('responsive-mobile.css', 'checkout-modal-card', 'оформление заказа');
must('responsive-mobile.css', 'map-picker-card', 'карта адреса в модалке');
must('responsive-mobile.css', 'checkout-map-root', 'высота карты в модалке');
must('responsive-mobile.css', 'order-success-card', 'модалка успеха заказа');
must('responsive-mobile.css', 'env(safe-area-inset-bottom', 'safe-area для iPhone');
must('responsive-mobile.css', 'font-size: 16px', 'inputs 16px (без zoom iOS)');
must('responsive-mobile.css', 'delivery-map-board', 'карта на странице доставки');
must('responsive-mobile.css', 'auth-form .auth-submit', 'кнопка входа на mobile');
must('responsive-mobile.css', 'notif-dropdown-open .notif-dropdown', 'панель уведомлений mobile');
must('responsive-mobile.css', 'notif-mobile-portal', 'портал уведомлений mobile');
must('responsive-mobile.css', 'checkout-modal-card', 'оформление заказа mobile');
must('app-core.js', 'ekvalineNotifPortal', 'док уведомлений в body');
must('mobile-nav.js', 'EkvalineSiteNav', 'закрытие меню перед входом');
must('script.js', 'EkvalineSiteNav?.close', 'вход закрывает мобильное меню');
must('script.js', 'bindCheckoutDatePickerEvents', 'выбор даты оформления на mobile');
must('responsive-mobile.css', 'checkout-map-panel-fields', 'прокрутка полей адреса');
must('responsive-mobile.css', 'map-picker-actions-bar', 'кнопки карты адреса');
must('responsive-mobile.css', 'map-picker-map-zone', 'карта сверху в модалке');
must('responsive-mobile.css', 'map-picker-actions-row', 'кнопки выбрать и сброс');
must('styles.css', 'map-picker-map-zone', 'зона карты в модалке');
must('styles.css', 'map-picker-fields-zone', 'форма адреса под картой');
must('styles.css', 'map-picker-head', 'шапка модалки с крестиком');
must('styles.css', 'map-picker-map-zone .checkout-map-root.ek-map-host', 'контейнер карты не схлопывается');

must('operator-mobile.css', 'opx-map-card', 'карта адреса оператора');
must('operator-mobile.css', 'opx-zone-map-canvas', 'карта зон оператора');
must('operator-mobile.css', 'opx-zone-map-overlay', 'полноэкранная карта заказов');
must('operator-mobile.css', '--opx-mobile-dock-h', 'нижний dock оператора');

must('responsive-mobile.css', 'community-page .blogv2-comment-form-meta', 'форма комментариев блога');
must('responsive-mobile.css', 'community-page .blogv2-water-controls', 'трекер воды на блоге');
must('styles.css', 'blogv2-comment-form-meta', 'мета-строка формы комментария');
must('styles.css', 'blogv2-post-reactions', 'реакции поста блога');
must('styles.css', 'checkout-map-root', 'контейнер карты оформления');
must('styles.css', 'delivery-yandex-map', 'карта доставки');

for (const page of ['catalog.html', 'delivery.html', 'cabinet.html', 'operator.html']) {
  const html = read(page);
  if (!html.includes('viewport-fit=cover')) {
    fails.push(`${page}: нет viewport-fit=cover`);
  }
  if (!html.includes('responsive-mobile.css')) {
    fails.push(`${page}: нет responsive-mobile.css`);
  }
}

if (read('styles.css').includes('word-break: break-word;\n}\n}\n\n@media (max-width: 900px)')) {
  fails.push('styles.css: лишняя закрывающая скобка у opx-map (сломает CSS ниже)');
}

if (fails.length) {
  fails.forEach((f) => console.error('FAIL', f));
  console.log(`\nИтого: ${fails.length} ошибок\n`);
  process.exit(1);
}

console.log('OK responsive-mobile: корзина, оформление, карта адреса, auth, success');
console.log('OK operator-mobile: карта зон, карта клиента, dock');
console.log('OK HTML: viewport-fit + mobile CSS на catalog/delivery/cabinet/operator');
console.log('\nВсе проверки mobile CSS пройдены.\n');
