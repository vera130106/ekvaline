(function () {
  const api = window.EkvalineAPI;

  const adminRestrictedEl = document.getElementById('adminRestricted');
  const adminAppRoot = document.getElementById('adminAppRoot');

  const createUserForm = document.getElementById('adminCreateUserForm');
  const createUserRoleSelect = document.getElementById('adminCreateUserRole');
  const driverLabelWrap = document.getElementById('adminStaffDriverLabelWrap');
  const driverRouteLabelInput = document.getElementById('adminStaffDriverRouteLabel');
  const createProductForm = document.getElementById('adminCreateProductForm');
  const settingsForm = document.getElementById('adminSettingsForm');
  const categorySelect = document.getElementById('adminProductCategory');
  const userMsg = document.getElementById('adminUserMsg');
  const productMsg = document.getElementById('adminProductMsg');
  const settingsMsg = document.getElementById('adminSettingsMsg');
  const productsList = document.getElementById('adminProductsList');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  const adminConfirmModal = document.getElementById('adminConfirmModal');
  const adminConfirmTitle = document.getElementById('adminConfirmTitle');
  const adminConfirmMessage = document.getElementById('adminConfirmMessage');
  const adminConfirmOk = document.getElementById('adminConfirmOk');
  const adminConfirmCancel = document.getElementById('adminConfirmCancel');

  const adminStaffPasswordModal = document.getElementById('adminStaffPasswordModal');
  const adminStaffPasswordWho = document.getElementById('adminStaffPasswordWho');
  const adminStaffPasswordForm = document.getElementById('adminStaffPasswordForm');
  const adminStaffGateCode = document.getElementById('adminStaffGateCode');
  const adminStaffNewPassword = document.getElementById('adminStaffNewPassword');
  const adminStaffNewPasswordConfirm = document.getElementById('adminStaffNewPasswordConfirm');
  const adminStaffPasswordStrength = document.getElementById('adminStaffPasswordStrength');
  const adminStaffPasswordMsg = document.getElementById('adminStaffPasswordMsg');

  const listEls = {
    admin: document.getElementById('adminListAdmin'),
    manager: document.getElementById('adminListManager'),
    operator: document.getElementById('adminListOperator'),
    driver: document.getElementById('adminListDriver'),
  };

  const statsGridEl = document.getElementById('adminStatsGrid');
  const statsOrdersEl = document.getElementById('adminStatsOrders');
  const statsZonesEl = document.getElementById('adminStatsZones');
  const statsPaymentEl = document.getElementById('adminStatsPayment');
  const statsDriversEl = document.getElementById('adminStatsDrivers');
  const statsUsersEl = document.getElementById('adminStatsUsers');
  const statsFromEl = document.getElementById('adminStatsFrom');
  const statsToEl = document.getElementById('adminStatsTo');
  const statsBuildBtn = document.getElementById('adminStatsBuildBtn');
  const statsPdfBtn = document.getElementById('adminStatsPdfBtn');
  const statsPeriodMetaEl = document.getElementById('adminStatsPeriodMeta');
  const statsMsgEl = document.getElementById('adminStatsMsg');
  const statsReportRootEl = document.getElementById('adminStatsReportRoot');
  const statsPrintEl = document.getElementById('adminStatsReportPrint');

  /** Последний успешно сформированный отчёт (для экспорта). */
  let lastStatsReport = null;
  let statsLiveTimer = null;
  let statsLiveUnsub = null;
  let statsRefreshInFlight = false;

  const editModal = document.getElementById('adminProductEditModal');
  const editForm = document.getElementById('adminProductEditForm');
  const editCategory = document.getElementById('adminProductEditCategory');
  const editMsg = document.getElementById('adminProductEditMsg');

  const deliveryFaqNav = document.getElementById('adminDeliveryFaqNav');
  const deliveryFaqAddBtn = document.getElementById('adminDeliveryFaqAdd');
  const adminFaqEditModal = document.getElementById('adminFaqEditModal');
  const adminFaqEditNum = document.getElementById('adminFaqEditNum');
  const adminFaqEditCode = document.getElementById('adminFaqEditCode');
  const adminFaqEditTag = document.getElementById('adminFaqEditTag');
  const adminFaqEditQuestion = document.getElementById('adminFaqEditQuestion');
  const adminFaqEditAnswer = document.getElementById('adminFaqEditAnswer');
  const adminFaqEditConfirm = document.getElementById('adminFaqEditConfirm');
  const adminFaqEditDelete = document.getElementById('adminFaqEditDelete');
  const adminFaqEditModalMsg = document.getElementById('adminFaqEditModalMsg');
  const adminFaqAddModal = document.getElementById('adminFaqAddModal');
  const adminFaqAddCode = document.getElementById('adminFaqAddCode');
  const adminFaqAddTag = document.getElementById('adminFaqAddTag');
  const adminFaqAddQuestion = document.getElementById('adminFaqAddQuestion');
  const adminFaqAddAnswer = document.getElementById('adminFaqAddAnswer');
  const adminFaqAddConfirm = document.getElementById('adminFaqAddConfirm');
  const adminFaqAddModalMsg = document.getElementById('adminFaqAddModalMsg');

  const adminAboutCertsNav = document.getElementById('adminAboutCertsNav');
  const adminAboutCertAddBtn = document.getElementById('adminAboutCertAdd');
  const adminAboutCertEditModal = document.getElementById('adminAboutCertEditModal');
  const adminAboutCertEditNum = document.getElementById('adminAboutCertEditNum');
  const adminAboutCertEditImage = document.getElementById('adminAboutCertEditImage');
  const adminAboutCertEditAlt = document.getElementById('adminAboutCertEditAlt');
  const adminAboutCertEditBadge = document.getElementById('adminAboutCertEditBadge');
  const adminAboutCertEditTitleLine = document.getElementById('adminAboutCertEditTitleLine');
  const adminAboutCertEditDesc = document.getElementById('adminAboutCertEditDesc');
  const adminAboutCertEditPdf = document.getElementById('adminAboutCertEditPdf');
  const adminAboutCertEditConfirm = document.getElementById('adminAboutCertEditConfirm');
  const adminAboutCertEditDelete = document.getElementById('adminAboutCertEditDelete');
  const adminAboutCertEditModalMsg = document.getElementById('adminAboutCertEditModalMsg');
  const adminAboutCertAddModal = document.getElementById('adminAboutCertAddModal');
  const adminAboutCertAddImage = document.getElementById('adminAboutCertAddImage');
  const adminAboutCertAddAlt = document.getElementById('adminAboutCertAddAlt');
  const adminAboutCertAddBadge = document.getElementById('adminAboutCertAddBadge');
  const adminAboutCertAddTitleLine = document.getElementById('adminAboutCertAddTitleLine');
  const adminAboutCertAddDesc = document.getElementById('adminAboutCertAddDesc');
  const adminAboutCertAddPdf = document.getElementById('adminAboutCertAddPdf');
  const adminAboutCertAddConfirm = document.getElementById('adminAboutCertAddConfirm');
  const adminAboutCertAddModalMsg = document.getElementById('adminAboutCertAddModalMsg');
  const adminAboutCertEditImageFile = document.getElementById('adminAboutCertEditImageFile');
  const adminAboutCertAddImageFile = document.getElementById('adminAboutCertAddImageFile');

  const adminCoverageCardsNav = document.getElementById('adminCoverageCardsNav');
  const adminDeliveryCoverageTitle = document.getElementById('adminDeliveryCoverageTitle');
  const adminCoverageCardAddBtn = document.getElementById('adminCoverageCardAdd');
  const adminCoverageCardEditModal = document.getElementById('adminCoverageCardEditModal');
  const adminCoverageCardEditNum = document.getElementById('adminCoverageCardEditNum');
  const adminCoverageCardEditItemTitle = document.getElementById('adminCoverageCardEditItemTitle');
  const adminCoverageCardEditItemText = document.getElementById('adminCoverageCardEditItemText');
  const adminCoverageCardEditConfirm = document.getElementById('adminCoverageCardEditConfirm');
  const adminCoverageCardEditDelete = document.getElementById('adminCoverageCardEditDelete');
  const adminCoverageCardEditModalMsg = document.getElementById('adminCoverageCardEditModalMsg');
  const adminCoverageCardAddModal = document.getElementById('adminCoverageCardAddModal');
  const adminCoverageCardAddItemTitle = document.getElementById('adminCoverageCardAddItemTitle');
  const adminCoverageCardAddItemText = document.getElementById('adminCoverageCardAddItemText');
  const adminCoverageCardAddConfirm = document.getElementById('adminCoverageCardAddConfirm');
  const adminCoverageCardAddModalMsg = document.getElementById('adminCoverageCardAddModalMsg');

  const DEFAULT_ADMIN_FAQ = Object.freeze([
    {
      code: 'Заявки',
      tag: 'Оператор',
      question: 'Во сколько можно принять заказ сегодня?',
      answer:
        'Прием заявок оператором: с 8:00 до 19:00. Заказы после 19:00 переносим на ближайшее доступное окно.',
    },
    {
      code: 'Интервал',
      tag: 'Квартира',
      question: 'Какие интервалы доставки доступны для частных клиентов?',
      answer: 'Для квартиры доступны окна 9:00-14:00, 14:00-17:00 и 17:00-21:00.',
    },
    {
      code: 'График',
      tag: 'Офис',
      question: 'Как оформить регулярную доставку воды для офиса?',
      answer:
        'Нужно связаться с оператором, выбрать удобные дни и интервал, после этого оператор сам проставит вам регулярные доставки.',
    },
    {
      code: 'Тара',
      tag: 'Обмен',
      question: 'Что делать с пустой тарой?',
      answer:
        'Курьер заберет пустые бутыли во время следующей доставки. Отдельно везти тару в офис не нужно.',
    },
  ]);

  const DEFAULT_ADMIN_ABOUT_CERTIFICATES = Object.freeze([
    {
      image: 'assets/certificate-declaration-eac-2025-preview.jpg',
      alt: 'Декларация о соответствии ЕАЭС',
      badge: 'Документ',
      title: 'Декларация о соответствии',
      description:
        'Подтверждение соответствия продукции «ЭкваЛайн» требованиям технических регламентов ЕАЭС.',
      pdf: 'assets/certificate-declaration-eac-2025.pdf',
    },
  ]);

  const DEFAULT_ADMIN_DELIVERY_COVERAGE = Object.freeze({
    title: 'Зоны покрытия Оренбурга',
    cards: Object.freeze([
      Object.freeze({
        title: 'Интервалы доставки',
        text: 'Утро: 9:00-14:00, День: 14:00-17:00, Вечер: 17:00-21:00',
      }),
      Object.freeze({
        title: 'Доставка для организаций',
        text: 'Отдельное окно: 9:00-17:00',
      }),
      Object.freeze({
        title: 'Прием заказов',
        text: 'Оператор принимает заявки: 8:00-19:00',
      }),
    ]),
  });

  const CURRENT_USER_KEY = 'ekvaline_current_user';

  const STAFF_ROLES_DISPLAY = ['admin', 'manager', 'operator', 'driver'];
  const ROLE_SECTION_TITLE = {
    admin: 'Администраторы',
    manager: 'Менеджеры',
    operator: 'Операторы',
    driver: 'Водители',
  };

  const ORDER_STATUS_LABELS = {
    new: 'Новый',
    pending_operator: 'У оператора',
    confirmed: 'Подтверждён',
    processing: 'В обработке',
    courier: 'Курьер',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };

  const PAYMENT_METHOD_LABELS = {
    cash: 'Наличные',
    card: 'Карта',
    noncash: 'Безналичный',
    settlement: 'Расчётный счёт',
    invoice: 'Расчётный счёт',
  };

  /** Дата «по» в отчёте: учитываем доставку на ближайшие дни (как у оператора). */
  const STATS_MAX_FUTURE_DAYS = 60;
  const STATS_FORWARD_DELIVERY_DAYS = 14;

  function maxStatsToIso() {
    return shiftIsoDateLocal(isoDateLocal(new Date()), STATS_MAX_FUTURE_DAYS);
  }

  function isoDateLocal(d) {
    const x = d instanceof Date ? d : new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function shiftIsoDateLocal(iso, deltaDays) {
    const parts = String(iso || '')
      .trim()
      .split('-')
      .map((s) => Number(s));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return isoDateLocal(new Date());
    const base = new Date(parts[0], parts[1] - 1, parts[2]);
    base.setDate(base.getDate() + deltaDays);
    return isoDateLocal(base);
  }

  function formatMoneyRub(n) {
    const v = Number(n) || 0;
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: v % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(v);
  }

  function ruDateFromIso(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return String(iso || '—');
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  function paymentLabel(raw) {
    const p = String(raw || '').trim();
    if (!p) return 'Не указан';
    const low = p.toLowerCase().replace(/ё/g, 'е');
    if (low === 'cash' || low.includes('налич')) return 'Наличная';
    if (low === 'noncash' || low.includes('безнал')) return 'Безнал';
    if (low === 'card' || low.includes('карт')) return 'Карта';
    if (low.includes('расч') && (low.includes('сч') || low.includes('счет') || low.includes('счёт'))) {
      return 'Расчётный счёт';
    }
    if (PAYMENT_METHOD_LABELS[low]) return PAYMENT_METHOD_LABELS[low];
    return p;
  }

  function formatStatsPeriodLabel(period) {
    const from = period?.from ? ruDateFromIso(period.from) : null;
    const to = period?.to ? ruDateFromIso(period.to) : null;
    if (from && to) return `Период: ${from} — ${to}`;
    if (from) return `Период: с ${from}`;
    if (to) return `Период: по ${to}`;
    return 'Период: всё время';
  }

  function showStatsMsg(text, ok) {
    if (!(statsMsgEl instanceof HTMLElement)) return;
    statsMsgEl.textContent = String(text || '');
    statsMsgEl.classList.toggle('is-ok', Boolean(ok));
    statsMsgEl.classList.toggle('is-error', !ok && Boolean(text));
  }

  function readStatsPeriodFromForm() {
    const from = statsFromEl instanceof HTMLInputElement ? statsFromEl.value.trim() : '';
    const to = statsToEl instanceof HTMLInputElement ? statsToEl.value.trim() : '';
    return { from: from || null, to: to || null };
  }

  /** Ограничение календаря: «по» — до +60 дней (дата доставки может быть впереди). */
  function syncStatsDateInputLimits() {
    const maxTo = maxStatsToIso();
    [statsFromEl, statsToEl].forEach((el) => {
      if (!(el instanceof HTMLInputElement)) return;
      el.max = maxTo;
      const v = el.value.trim();
      if (v && v > maxTo) el.value = maxTo;
    });
    if (statsFromEl instanceof HTMLInputElement && statsToEl instanceof HTMLInputElement) {
      const from = statsFromEl.value.trim();
      const to = statsToEl.value.trim();
      if (from && to && from > to) statsFromEl.value = to;
    }
  }

  /** Проверка периода перед запросом отчёта. */
  function validateStatsPeriodForReport() {
    syncStatsDateInputLimits();
    const maxTo = maxStatsToIso();
    const { from, to } = readStatsPeriodFromForm();
    if (from && from > maxTo) {
      showStatsMsg(`Дата «с» не может быть позже ${ruDateFromIso(maxTo)}.`, false);
      return false;
    }
    if (to && to > maxTo) {
      showStatsMsg(
        `Дата «по» не может быть позже ${ruDateFromIso(maxTo)} (доставка планируется не более чем на ${STATS_MAX_FUTURE_DAYS} дней вперёд).`,
        false
      );
      return false;
    }
    if (from && to && from > to) {
      showStatsMsg('Дата «с» не может быть позже даты «по».', false);
      return false;
    }
    return true;
  }

  function applyStatsPreset(kind) {
    const today = isoDateLocal(new Date());
    const forwardTo = shiftIsoDateLocal(today, STATS_FORWARD_DELIVERY_DAYS);
    const maxTo = maxStatsToIso();
    if (!(statsFromEl instanceof HTMLInputElement) || !(statsToEl instanceof HTMLInputElement)) return;
    if (kind === 'all') {
      statsFromEl.value = '';
      statsToEl.value = '';
      syncStatsDateInputLimits();
      return;
    }
    if (kind === 'month') {
      const d = new Date();
      const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthEndIso = isoDateLocal(monthEnd);
      statsFromEl.value = first;
      statsToEl.value = forwardTo > monthEndIso ? forwardTo : monthEndIso;
      if (statsToEl.value > maxTo) statsToEl.value = maxTo;
      syncStatsDateInputLimits();
      return;
    }
    const days = kind === '7' ? 7 : 30;
    statsFromEl.value = shiftIsoDateLocal(today, -(days - 1));
    statsToEl.value = forwardTo > maxTo ? maxTo : forwardTo;
    syncStatsDateInputLimits();
  }

  function buildDeliverySpanHint(report) {
    const span = report?.deliverySpan;
    if (!span || !(Number(span.count) > 0)) return '';
    const min = span.minDate ? ruDateFromIso(span.minDate) : '';
    const max = span.maxDate ? ruDateFromIso(span.maxDate) : '';
    const range = min && max && min !== max ? `${min} — ${max}` : min || max;
    return `В выбранном периоде нет заказов. В системе ${span.count} по дате доставки${range ? ` (${range})` : ''} — расширьте дату «по».`;
  }

  function statsBarRow(label, count, sum, maxCount) {
    const c = Number(count) || 0;
    const pct = maxCount > 0 ? Math.round((c / maxCount) * 100) : 0;
    return `<tr>
      <td>${escHtml(label)}</td>
      <td class="admin-stats-num">${c}</td>
      <td class="admin-stats-num">${formatMoneyRub(sum)} ₽</td>
      <td class="admin-stats-bar-cell">
        <div class="admin-stats-bar" style="width:${pct}%" title="${pct}%"></div>
      </td>
    </tr>`;
  }

  function buildStatsBreakdownTable(rows, labelHeader, labelFn) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<p class="admin-empty-note">Нет данных за выбранный период.</p>';
    const maxC = Math.max(...list.map((x) => Number(x.count) || 0), 1);
    const body = list
      .map((x) => {
        const label = labelFn ? labelFn(x) : String(x.label || x.status || '—');
        return statsBarRow(label, x.count, x.sum, maxC);
      })
      .join('');
    return `<div class="admin-stats-table-wrap"><table class="admin-stats-table">
      <thead><tr>
        <th>${escHtml(labelHeader)}</th>
        <th class="admin-stats-num">Заказов</th>
        <th class="admin-stats-num">Сумма</th>
        <th>Доля</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function buildStatsUsersTable(usersByRole) {
    const ur = usersByRole || {};
    const keys = Object.keys(ur).sort((a, b) => a.localeCompare(b, 'ru'));
    if (!keys.length) return '<p class="admin-empty-note">Нет данных.</p>';
    const maxC = Math.max(...keys.map((k) => Number(ur[k]) || 0), 1);
    const body = keys
      .map((r) =>
        statsBarRow(
          roleLabel(r) + (r === 'client' ? ' (регистрация)' : ''),
          ur[r],
          0,
          maxC
        )
      )
      .join('');
    return `<div class="admin-stats-table-wrap"><table class="admin-stats-table">
      <thead><tr><th>Роль</th><th class="admin-stats-num">Учёток</th><th class="admin-stats-num">—</th><th>Доля</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  function buildStatsPrintHtml(report) {
    const period = formatStatsPeriodLabel(report.period);
    const s = report.summary || {};
    const mkTable = (title, rows, labelFn) => {
      const list = Array.isArray(rows) ? rows : [];
      if (!list.length) return `<h3>${escHtml(title)}</h3><p>Нет данных.</p>`;
      const tr = list
        .map((x) => {
          const label = labelFn ? labelFn(x) : x.label || x.status;
          return `<tr><td>${escHtml(label)}</td><td>${Number(x.count) || 0}</td><td>${formatMoneyRub(x.sum)} ₽</td></tr>`;
        })
        .join('');
      return `<h3>${escHtml(title)}</h3><table><thead><tr><th>Показатель</th><th>Заказов</th><th>Сумма</th></tr></thead><tbody>${tr}</tbody></table>`;
    };
    return `<div class="admin-stats-print-inner">
      <h1>ЭкваЛайн — отчёт администратора</h1>
      <p>${escHtml(period)}</p>
      <p>Сформировано: ${escHtml(new Date().toLocaleString('ru-RU'))}</p>
      <h3>Сводка</h3>
      <table>
        <tr><td>Заказов в периоде</td><td>${Number(s.ordersTotal) || 0}</td></tr>
        <tr><td>Сумма заказов</td><td>${formatMoneyRub(s.ordersSum)} ₽</td></tr>
        <tr><td>Доставлено (шт.)</td><td>${Number(s.deliveredCount) || 0}</td></tr>
        <tr><td>Сумма доставленных</td><td>${formatMoneyRub(s.deliveredSum)} ₽</td></tr>
        <tr><td>Отменено</td><td>${Number(s.cancelledCount) || 0}</td></tr>
        <tr><td>Товаров в базе / на витрине</td><td>${Number(report.productsTotal) || 0} / ${Number(report.productsVisible) || 0}</td></tr>
      </table>
      ${mkTable('Заказы по статусам', report.ordersByStatus, (x) => ORDER_STATUS_LABELS[x.status] || x.status)}
      ${mkTable('По зонам доставки', report.ordersByZone)}
      ${mkTable('По способу оплаты', report.ordersByPayment, (x) => paymentLabel(x.label))}
      ${mkTable('По экспедиторам', report.ordersByDriver)}
      ${mkTable('Учётные записи по ролям', Object.keys(report.usersByRole || {}).map((k) => ({ label: roleLabel(k), count: report.usersByRole[k], sum: 0 })))}
    </div>`;
  }

  let users = [];
  let currentAdminUserId = null;
  let products = [];
  let categories = [];
  /** Черновик блока вопросов для страницы «Доставка»; сохранение через API настроек. */
  let faqDraft = [];
  /** Индекс открытого модального редактирования; −1 если окно закрыто. */
  let faqEditModalIdx = -1;
  /** Опросы для блога (sitePolls): редактирование у менеджера; при сохранении настроек админом уходит копия с сервера. */
  let pollsDraft = [];
  /** Настройки с сервера загружены — без этого полное сохранение не отправляем (не затираем опросы пустым массивом). */
  let settingsHydrated = false;
  const DEFAULT_HIDDEN_WORKLINE = 'Пн–Сб 8:00–21:00, Вс 9:00–18:00';
  const DEFAULT_HIDDEN_SLOTS_TEXT = '09:00 – 14:00\n14:00 – 17:00\n17:00 – 21:00';
  /** Сертификаты блока «О компании». */
  let aboutCertsDraft = [];
  /** Индекс открытого модального редактирования сертификата; −1 если окно закрыто. */
  let aboutCertEditModalIdx = -1;
  /** Карточки справа от карты на странице «Доставка». */
  let coverageCardsDraft = [];
  /** Индекс открытого модального редактирования карточки «Зоны покрытия»; −1 если окно закрыто. */
  let coverageCardEditModalIdx = -1;
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncOneCharCounter(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const sid = el.getAttribute('data-char-count-for');
    const span = sid ? document.getElementById(sid) : null;
    const max = el.maxLength > 0 ? el.maxLength : 0;
    if (!(span instanceof HTMLElement) || max <= 0) return;
    span.textContent = `${el.value.length}/${max}`;
  }

  /** Обновить счётчики «текущее/лимит» у полей с data-char-count-for внутри узла (или всей админки). */
  function refreshCharCounters(scope) {
    const root =
      scope instanceof HTMLElement
        ? scope
        : adminAppRoot instanceof HTMLElement
          ? adminAppRoot
          : document.body;
    root.querySelectorAll('input[data-char-count-for], textarea[data-char-count-for]').forEach((field) => {
      syncOneCharCounter(field);
    });
  }

  const ABOUT_CERT_IMAGE_MAX_LEN = 600000;

  function aboutCertPdfAllowed(pdf) {
    const s = String(pdf ?? '').trim();
    if (!s) return true;
    if (/^(javascript:|vbscript:|data:)/i.test(s)) return false;
    return /^(assets\/|\/assets\/)[^?\s#]+\.pdf$/i.test(s);
  }

  function aboutCertImageAllowed(image) {
    const s = String(image ?? '').trim();
    if (!s) return false;
    if (/^(javascript:|vbscript:)/i.test(s)) return false;
    if (/^data:/i.test(s)) return /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(s);
    return true;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
      reader.readAsDataURL(file);
    });
  }

  async function imageFileToJpegDataUrl(file, maxSide = 1400, quality = 0.85) {
    const raw = await readFileAsDataUrl(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (!w || !h) {
            reject(new Error('Не удалось определить размер изображения.'));
            return;
          }
          if (w > maxSide || h > maxSide) {
            if (w >= h) {
              h = Math.round((h * maxSide) / w);
              w = maxSide;
            } else {
              w = Math.round((w * maxSide) / h);
              h = maxSide;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Не удалось подготовить изображение.'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      img.onerror = () => reject(new Error('Файл не похож на поддерживаемое изображение.'));
      img.src = raw;
    });
  }

  async function applyAboutCertPickedImageFile(fileInput, textInput, msgEl, modalScope) {
    if (!(fileInput instanceof HTMLInputElement) || !(textInput instanceof HTMLInputElement)) return;
    const file = fileInput.files?.[0];
    if (!file) return;
    showMsg(msgEl, '');
    try {
      const dataUrl = await imageFileToJpegDataUrl(file);
      if (dataUrl.length > ABOUT_CERT_IMAGE_MAX_LEN) {
        showMsg(msgEl, 'Файл после сжатия всё ещё слишком большой. Выберите другое изображение.');
        fileInput.value = '';
        return;
      }
      textInput.value = dataUrl;
      syncOneCharCounter(textInput);
      const scope =
        modalScope instanceof HTMLElement
          ? modalScope
          : adminAboutCertEditModal instanceof HTMLElement
            ? adminAboutCertEditModal
            : adminAppRoot instanceof HTMLElement
              ? adminAppRoot
              : document.body;
      refreshCharCounters(scope);
    } catch (e) {
      showMsg(msgEl, e instanceof Error ? e.message : 'Не удалось обработать файл.');
      fileInput.value = '';
    }
  }

  function showMsg(el, text, ok = false) {
    if (!(el instanceof HTMLElement)) return;
    el.textContent = text || '';
    el.style.color = ok ? '#177245' : '#b71c1c';
  }

  const PRODUCT_LIMITS = {
    nameMin: 2,
    nameMax: 180,
    descMax: 400,
    priceMax: 1_000_000,
    volumeMax: 1000,
    sortMax: 99999,
  };

  function productCatalogMode(p) {
    if (Number(p.hidden)) return 'hidden';
    if (Number(p.preorder)) return 'preorder';
    return 'visible';
  }

  function productStatusLabel(p) {
    const mode = productCatalogMode(p);
    if (mode === 'hidden') return 'Скрыт';
    if (mode === 'preorder') return 'Под заказ';
    return 'В каталоге';
  }

  function productStatusClass(p) {
    const mode = productCatalogMode(p);
    if (mode === 'hidden') return 'admin-product-hidden';
    if (mode === 'preorder') return 'admin-product-preorder';
    return 'admin-product-visible';
  }

  function formatAdminProductPrice(p) {
    const price = Math.round(Number(p.price) || 0);
    if (Number(p.preorder) && price <= 0) return 'Уточнять у оператора';
    return `${price.toLocaleString('ru-RU')} ₽`;
  }

  function adminCatalogCategorySlug(categoryName) {
    const n = String(categoryName || '').toLowerCase();
    if (n.includes('вода')) return 'water';
    if (n.includes('аксессуар')) return 'accessories';
    if (n.includes('оборуд')) return 'equipment';
    return 'other';
  }

  function adminCatalogImageForProduct(product, index) {
    const photo = String(product?.photo_path || '').trim();
    if (photo && !/^javascript:/i.test(photo)) return photo;
    const name = String(product?.name || '').toLowerCase();
    if (/vatten|l\s*45/.test(name)) return 'assets/vatten-l45-ne.png';
    if (/ael|47c/.test(name)) return 'assets/ael-lk-ael-47c.png';
    if (/электрическ.*помп/.test(name)) return 'assets/electric-pump.png';
    if (/помпа механическ/.test(name)) return 'assets/mechanical-pump.png';
    if (/тара|пуст/.test(name)) return 'assets/empty-bottle.png';
    if (/стакан/.test(name)) return 'assets/preorder-cups.png';
    if (/18\.?9|19\s*л/.test(name)) return 'assets/product-18-9-white.png';
    if (/кулер/.test(name)) return 'assets/vatten-l45-ne.png';
    return 'assets/one-bottle.png';
  }

  /** HTML карточки товара как в публичном каталоге (для превью в админке). */
  function adminCatalogCardHtml(product, index) {
    const cat = adminCatalogCategorySlug(product.category_name);
    const bg = ['image-bg-a', 'image-bg-b', 'image-bg-c', 'image-bg-d'][index % 4];
    const sizes = ['size-md', 'size-lg', 'size-sm', 'size-md'];
    const img = adminCatalogImageForProduct(product, index);
    const name = String(product.name || 'Товар');
    const desc = String(product.description || '').trim();
    const vol =
      product.volume_liters != null && product.volume_liters !== ''
        ? ` · ${String(product.volume_liters).replace(/\.?0+$/, '')} л`
        : '';
    const typeLabel = `${String(product.category_name || 'Товар').toUpperCase()}${vol}`;
    const preorder = Number(product.preorder) === 1;
    const typeExtra = preorder ? ' · <span class="preorder-mark">ПОД ЗАКАЗ</span>' : '';
    const hidden = Number(product.hidden) === 1;
    const statusClass = productStatusClass(product);
    const statusLabel = productStatusLabel(product);

    return `<article class="full-catalog-card admin-catalog-preview-card${hidden ? ' is-admin-hidden-product' : ''}" data-category="${escHtml(cat)}" data-product-id="${escHtml(product.id)}">
    <div class="full-card-image-wrap ${bg}">
      <img src="${escHtml(img)}" alt="${escHtml(name)}" class="full-card-image ${sizes[index % sizes.length]}" loading="lazy" />
    </div>
    <p class="full-card-type">${escHtml(typeLabel)}${typeExtra}</p>
    <h3>${escHtml(name)}</h3>
    ${desc ? `<p class="full-card-desc">${escHtml(desc)}</p>` : ''}
    <div class="full-card-bottom admin-catalog-preview-bottom">
      <p class="full-card-price">${escHtml(formatAdminProductPrice(product))}</p>
      <div class="admin-catalog-preview-actions">
        <span class="admin-catalog-preview-status ${statusClass}">${escHtml(statusLabel)}</span>
        <button type="button" data-edit-product="${escHtml(product.id)}" class="ghost-btn admin-btn-edit">Изменить</button>
        <button type="button" data-delete-product="${escHtml(product.id)}" class="ghost-btn">Удалить</button>
      </div>
    </div>
  </article>`;
  }

  function visibilityFromCatalogMode(mode) {
    if (mode === 'hidden') return { hidden: 1, preorder: 0 };
    if (mode === 'preorder') return { hidden: 0, preorder: 1 };
    return { hidden: 0, preorder: 0 };
  }

  /** Те же правила, что passwordSchema на сервере. */
  function validateStaffPasswordClient(password) {
    const api = window.EkvalineAuthPassword;
    if (api?.validatePassword) {
      const r = api.validatePassword(password);
      return r.ok ? null : r.error;
    }
    const p = String(password || '');
    if (p.length < 8) return 'Пароль: минимум 8 символов.';
    if (p.length > 128) return 'Пароль: не более 128 символов.';
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(p)) {
      return 'Пароль: только латинские буквы (A–Z, a–z), цифры и спецсимволы (!@#$…).';
    }
    if (!/[A-Z]/.test(p)) return 'Пароль: нужна заглавная латинская буква (A–Z).';
    if (!/[a-z]/.test(p)) return 'Пароль: нужна строчная латинская буква (a–z).';
    if (!/\d/.test(p)) return 'Пароль: нужна цифра.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) return 'Пароль: нужен спецсимвол (!@#$…).';
    return null;
  }

  function localizeApiError(raw) {
    const s = String(raw || '').trim();
    if (!s) return 'Не удалось выполнить операцию.';
    if (s === 'Не найдено.' || s === 'Not Found') {
      return 'Сервис недоступен. Перезапустите сервер и обновите страницу (Ctrl+F5).';
    }
    if (/[а-яё]/i.test(s)) return s;
    if (/safe number/i.test(s)) return 'Число слишком большое. Для цены максимум 1 000 000 ₽.';
    if (/must be a number/i.test(s)) return 'Укажите корректное число.';
    if (/is required/i.test(s)) return 'Заполните обязательные поля.';
    return 'Ошибка проверки данных. Проверьте все поля формы.';
  }

  function parseProductNumericField(raw, { label, min = 0, max, required, integer }) {
    const s = String(raw ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.');
    if (!s) {
      if (required) return { ok: false, error: `${label}: укажите значение.` };
      return { ok: true, value: null };
    }
    if (s.length > 15) return { ok: false, error: `${label}: слишком большое число.` };
    if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, error: `${label}: только цифры.` };
    const n = integer ? Number.parseInt(s, 10) : Number(s);
    if (!Number.isFinite(n)) return { ok: false, error: `${label}: должно быть числом.` };
    if (integer && !Number.isInteger(n)) return { ok: false, error: `${label}: укажите целое число.` };
    if (n < min) return { ok: false, error: `${label}: не меньше ${min.toLocaleString('ru-RU')}.` };
    if (n > max) return { ok: false, error: `${label}: не больше ${max.toLocaleString('ru-RU')}.` };
    return { ok: true, value: n };
  }

  function readProductPayloadFromForm(form) {
    if (!(form instanceof HTMLFormElement)) return { ok: false, error: 'Форма товара не найдена.' };

    const priceParsed = parseProductNumericField(form.elements.namedItem('price')?.value, {
      label: 'Цена',
      min: 0,
      max: PRODUCT_LIMITS.priceMax,
      required: true,
      integer: true,
    });
    if (!priceParsed.ok) return priceParsed;

    const volParsed = parseProductNumericField(form.elements.namedItem('volume_liters')?.value, {
      label: 'Объём',
      min: 0,
      max: PRODUCT_LIMITS.volumeMax,
      required: false,
      integer: false,
    });
    if (!volParsed.ok) return volParsed;

    const sortParsed = parseProductNumericField(form.elements.namedItem('sort_order')?.value, {
      label: 'Сортировка',
      min: 0,
      max: PRODUCT_LIMITS.sortMax,
      required: false,
      integer: true,
    });
    if (!sortParsed.ok) return sortParsed;

    const category_id = Number(form.elements.namedItem('category_id')?.value || 0);
    if (!Number.isInteger(category_id) || category_id <= 0) {
      return { ok: false, error: 'Выберите категорию.' };
    }

    const name = String(form.elements.namedItem('name')?.value || '').trim();
    if (name.length < PRODUCT_LIMITS.nameMin) return { ok: false, error: 'Название: минимум 2 символа.' };
    if (name.length > PRODUCT_LIMITS.nameMax) {
      return { ok: false, error: `Название: не более ${PRODUCT_LIMITS.nameMax} символов.` };
    }

    const description = String(form.elements.namedItem('description')?.value || '').trim();
    if (description.length > PRODUCT_LIMITS.descMax) {
      return { ok: false, error: `Описание: не более ${PRODUCT_LIMITS.descMax} символов.` };
    }

    const catalogMode = String(form.elements.namedItem('catalog_mode')?.value || 'visible');
    const { hidden, preorder } = visibilityFromCatalogMode(catalogMode);

    return {
      ok: true,
      payload: {
        category_id,
        name,
        description,
        price: priceParsed.value,
        sort_order: sortParsed.value ?? 0,
        hidden,
        preorder,
        volume_liters: volParsed.value,
        stock: 1_000_000,
      },
    };
  }

  function bindProductNumericInputs(form) {
    if (!(form instanceof HTMLFormElement)) return;
    const rules = [
      { name: 'price', maxLen: 7, maxVal: PRODUCT_LIMITS.priceMax },
      { name: 'volume_liters', maxLen: 8, maxVal: PRODUCT_LIMITS.volumeMax },
      { name: 'sort_order', maxLen: 5, maxVal: PRODUCT_LIMITS.sortMax },
    ];
    rules.forEach(({ name, maxLen, maxVal }) => {
      const el = form.elements.namedItem(name);
      if (!(el instanceof HTMLInputElement)) return;
      el.addEventListener('input', () => {
        let v = el.value.replace(/[^\d.,]/g, '');
        if (v.length > maxLen) v = v.slice(0, maxLen);
        const n = Number(v.replace(',', '.'));
        if (Number.isFinite(n) && n > maxVal) v = String(maxVal);
        if (el.value !== v) el.value = v;
      });
    });
  }

  let adminConfirmResolve = null;
  let staffPasswordTargetId = null;

  function closeAdminStaffPasswordModal() {
    if (!(adminStaffPasswordModal instanceof HTMLElement)) return;
    adminStaffPasswordModal.hidden = true;
    adminStaffPasswordModal.setAttribute('aria-hidden', 'true');
    staffPasswordTargetId = null;
    if (adminStaffPasswordForm instanceof HTMLFormElement) adminStaffPasswordForm.reset();
    if (adminStaffPasswordMsg instanceof HTMLElement) adminStaffPasswordMsg.textContent = '';
    if (adminStaffPasswordStrength instanceof HTMLElement) adminStaffPasswordStrength.textContent = '';
    window.EkvalinePasswordVisibility?.init(adminStaffPasswordModal);
  }

  function openAdminStaffPasswordModal(user) {
    if (!(adminStaffPasswordModal instanceof HTMLElement) || !user) return;
    staffPasswordTargetId = Number(user.id);
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    if (adminStaffPasswordWho instanceof HTMLElement) {
      adminStaffPasswordWho.textContent = `${name} · ${user.email}`;
    }
    if (adminStaffPasswordMsg instanceof HTMLElement) adminStaffPasswordMsg.textContent = '';
    adminStaffPasswordModal.hidden = false;
    adminStaffPasswordModal.setAttribute('aria-hidden', 'false');
    window.EkvalinePasswordVisibility?.init(adminStaffPasswordModal);
    window.setTimeout(() => adminStaffGateCode?.focus?.(), 0);
  }

  async function saveStaffPasswordFromModal() {
    if (!staffPasswordTargetId) return;
    const gateCode = String(adminStaffGateCode?.value || '').trim();
    if (!gateCode) {
      if (adminStaffPasswordMsg instanceof HTMLElement) {
        adminStaffPasswordMsg.textContent = 'Введите секретный код.';
      }
      return;
    }
    const pwd = String(adminStaffNewPassword?.value || '');
    const pwd2 = String(adminStaffNewPasswordConfirm?.value || '');
    const authPw = window.EkvalineAuthPassword;
    if (authPw?.validatePassword) {
      const check = authPw.validatePassword(pwd);
      if (!check.ok) {
        if (adminStaffPasswordMsg instanceof HTMLElement) adminStaffPasswordMsg.textContent = check.error;
        return;
      }
    } else if (pwd.length < 8) {
      if (adminStaffPasswordMsg instanceof HTMLElement) {
        adminStaffPasswordMsg.textContent = 'Пароль: минимум 8 символов.';
      }
      return;
    }
    if (pwd !== pwd2) {
      if (adminStaffPasswordMsg instanceof HTMLElement) adminStaffPasswordMsg.textContent = 'Пароли не совпадают.';
      return;
    }
    const r = await api.json(`/api/admin/users/${encodeURIComponent(staffPasswordTargetId)}/staff-password`, {
      method: 'POST',
      body: { password: pwd, gate_code: gateCode },
    });
    if (!r.ok) {
      if (adminStaffPasswordMsg instanceof HTMLElement) {
        adminStaffPasswordMsg.textContent = localizeApiError(r.data?.error) || 'Не удалось сохранить пароль.';
      }
      return;
    }
    api.resetCsrf();
    closeAdminStaffPasswordModal();
    showMsg(userMsg, r.data?.message || 'Пароль сотрудника обновлён.', true);
  }

  function closeAdminConfirmModal(result) {
    if (!(adminConfirmModal instanceof HTMLElement)) return;
    adminConfirmModal.hidden = true;
    adminConfirmModal.setAttribute('aria-hidden', 'true');
    const cb = adminConfirmResolve;
    adminConfirmResolve = null;
    if (typeof cb === 'function') cb(Boolean(result));
  }

  /**
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
   * @returns {Promise<boolean>}
   */
  function openAdminConfirmModal(opts) {
    const title = opts?.title || 'Подтверждение';
    const message = opts?.message || '';
    const okLabel = opts?.confirmLabel || 'ОК';
    const cancelLabel = opts?.cancelLabel || 'Отмена';
    const danger = Boolean(opts?.danger);

    if (!(adminConfirmModal instanceof HTMLElement)) return Promise.resolve(false);

    if (adminConfirmTitle instanceof HTMLElement) adminConfirmTitle.textContent = title;
    if (adminConfirmMessage instanceof HTMLElement) adminConfirmMessage.textContent = message;
    if (adminConfirmOk instanceof HTMLButtonElement) {
      adminConfirmOk.textContent = okLabel;
      adminConfirmOk.classList.toggle('admin-confirm-btn-del', danger);
      adminConfirmOk.classList.toggle('admin-confirm-btn-primary', !danger);
    }
    if (adminConfirmCancel instanceof HTMLButtonElement) adminConfirmCancel.textContent = cancelLabel;

    return new Promise((resolve) => {
      adminConfirmResolve = resolve;
      adminConfirmModal.hidden = false;
      adminConfirmModal.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => {
        if (adminConfirmCancel instanceof HTMLButtonElement) adminConfirmCancel.focus();
      }, 0);
    });
  }

  function roleLabel(role) {
    if (role === 'client') return 'Клиент';
    if (role === 'admin') return 'Админ';
    if (role === 'manager') return 'Менеджер';
    if (role === 'operator') return 'Оператор';
    if (role === 'driver') return 'Водитель';
    return role || '—';
  }

  function redirectUnauthorizedToHome(sessionExpired) {
    const q = sessionExpired ? 'session-expired=1' : 'need-login=1';
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      /* ignore */
    }
    window.location.replace(new URL(`index.html?${q}`, window.location.href).href);
  }

  function showAppWorkspace() {
    if (adminRestrictedEl instanceof HTMLElement) adminRestrictedEl.hidden = true;
    if (adminAppRoot instanceof HTMLElement) adminAppRoot.hidden = false;
    initBackToTopButton();
  }

  function initBackToTopButton() {
    if (document.querySelector('.back-to-top-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top-btn admin-back-to-top';
    button.setAttribute('aria-label', 'Наверх');
    button.title = 'Наверх';
    button.textContent = '↑';
    document.body.appendChild(button);

    const updateVisibility = () => {
      button.classList.toggle('is-visible', (window.scrollY || 0) > 280);
    };

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  async function ensureAdmin() {
    if (!api) {
      redirectUnauthorizedToHome();
      return false;
    }
    const me = await api.json('/api/auth/me');
    if (me.ok && me.data?.user?.role === 'admin') {
      currentAdminUserId = me.data.user.id != null ? Number(me.data.user.id) : null;
      return true;
    }

    if (me.status === 0 || me.status >= 500) {
      redirectUnauthorizedToHome(false);
      return false;
    }
    redirectUnauthorizedToHome(!!me.data?.sessionExpired);
    return false;
  }

  function userInitials(u) {
    const fn = String(u.first_name || '').trim();
    const ln = String(u.last_name || '').trim();
    const first = fn.charAt(0);
    const second = ln.charAt(0) || fn.charAt(1);
    if (first && second) return (first + second).toUpperCase();
    const one = fn || ln;
    if (one.length >= 2) return one.slice(0, 2).toUpperCase();
    if (one.length === 1) return one.toUpperCase();
    const mail = String(u.email || '').trim();
    const local = mail.split('@')[0] || '';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
    return '?';
  }

  function deriveDriverRouteLabelPreview() {
    if (!(createUserForm instanceof HTMLFormElement)) return '';
    const first = String(createUserForm.elements.namedItem('first_name')?.value || '').trim();
    const last = String(createUserForm.elements.namedItem('last_name')?.value || '').trim();
    return [first, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function syncAdminDriverLabelField() {
    const isDriver = String(createUserRoleSelect?.value || '') === 'driver';
    if (driverLabelWrap instanceof HTMLElement) driverLabelWrap.hidden = !isDriver;
    if (!isDriver || !(driverRouteLabelInput instanceof HTMLInputElement)) return;
    if (!String(driverRouteLabelInput.value || '').trim()) {
      driverRouteLabelInput.placeholder = deriveDriverRouteLabelPreview() || 'Имя Фамилия';
    }
  }

  function renderUserCardHtml(u) {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
    const statusText = u.blocked ? 'Заблокирован' : 'Активен';
    const driverLabel =
      String(u.role || '') === 'driver'
        ? String(u.driver_route_label || name).trim() || name
        : '';
    const isSelf = currentAdminUserId != null && Number(u.id) === Number(currentAdminUserId);
    const roleKey = String(u.role || '').trim();
    const statusTagCls = u.blocked ? 'admin-person-tag-muted' : 'admin-person-tag-ok';
    return `<article class="admin-person-card" data-staff-role="${escHtml(roleKey)}">
      <div class="admin-person-top">
        <div class="admin-person-avatar" aria-hidden="true">${escHtml(userInitials(u))}</div>
        <div class="admin-person-lines">
          <div class="admin-person-name-row">
            <div class="admin-person-name">${escHtml(name)}</div>
            <div class="admin-person-tags">
              <span class="admin-person-tag admin-person-tag-role">${escHtml(roleLabel(u.role))}</span>
              <span class="admin-person-tag ${statusTagCls}">${statusText}</span>
            </div>
          </div>
          <div class="admin-person-contact">${escHtml(u.email)} · ${escHtml(u.phone || '—')}</div>
          ${
            driverLabel
              ? `<div class="admin-person-meta">В списке оператора: <strong>${escHtml(driverLabel)}</strong></div>`
              : ''
          }
        </div>
      </div>
      <div class="admin-person-toolbar">
        <label class="admin-person-field">
          <span class="admin-person-field-lbl">Роль</span>
          <select data-role-id="${escHtml(u.id)}" aria-label="Сменить роль пользователя">
            ${STAFF_ROLES_DISPLAY.map(
              (r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleLabel(r)}</option>`
            ).join('')}
          </select>
        </label>
        <div class="admin-person-actions">
          <button type="button" data-staff-pw-change="${escHtml(u.id)}" class="admin-person-btn">Сменить пароль</button>
          <button type="button" data-block-id="${escHtml(u.id)}" class="admin-person-btn">${u.blocked ? 'Разблокировать' : 'Блокировать'}</button>
          ${
            isSelf
              ? ''
              : `<button type="button" data-staff-delete="${escHtml(u.id)}" class="admin-person-btn admin-person-btn-del">Удалить</button>`
          }
        </div>
      </div>
    </article>`;
  }

  function renderStaffByRoleLists() {
    const staffUsers = users.filter((u) => STAFF_ROLES_DISPLAY.includes(String(u.role)));
    STAFF_ROLES_DISPLAY.forEach((role) => {
      const container = listEls[role];
      if (!(container instanceof HTMLElement)) return;
      const slice = staffUsers.filter((u) => u.role === role);
      if (!slice.length) {
        container.innerHTML = `<p class="admin-empty-note">Нет записей.</p>`;
        return;
      }
      container.innerHTML = slice.map(renderUserCardHtml).join('');
    });
  }

  function renderCategoriesInto(selectEl) {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    selectEl.innerHTML = categories.map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
  }

  function renderProducts() {
    if (!(productsList instanceof HTMLElement)) return;
    if (!products.length) {
      productsList.innerHTML = '<p class="admin-empty-note">Товаров пока нет. Добавьте позицию формой выше.</p>';
      return;
    }
    productsList.innerHTML = products.map((p, i) => adminCatalogCardHtml(p, i)).join('');
  }

  function renderStats(report) {
    if (!report) return;
    const s = report.summary || {};
    const totalStaff = ['admin', 'manager', 'operator', 'driver'].reduce(
      (acc, k) => acc + Number(report.usersByRole?.[k] || 0),
      0
    );
    const totalClients = Number(report.usersByRole?.client || 0);

    if (statsGridEl instanceof HTMLElement) {
      statsGridEl.innerHTML = `
        <article class="admin-stat-card admin-stat-card--accent"><span class="admin-stat-k">Заказов в периоде</span><strong class="admin-stat-v">${escHtml(String(s.ordersTotal ?? 0))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Сумма заказов</span><strong class="admin-stat-v">${escHtml(formatMoneyRub(s.ordersSum))} ₽</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Доставлено</span><strong class="admin-stat-v">${escHtml(String(s.deliveredCount ?? 0))}</strong><small class="admin-stat-sub">${escHtml(formatMoneyRub(s.deliveredSum))} ₽</small></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Отменено</span><strong class="admin-stat-v">${escHtml(String(s.cancelledCount ?? 0))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Товаров / витрина</span><strong class="admin-stat-v">${escHtml(String(report.productsTotal ?? 0))} / ${escHtml(String(report.productsVisible ?? 0))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Сотрудников</span><strong class="admin-stat-v">${escHtml(String(totalStaff))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Клиентов</span><strong class="admin-stat-v">${escHtml(String(totalClients))}</strong></article>
      `;
    }

    if (statsOrdersEl instanceof HTMLElement) {
      statsOrdersEl.innerHTML = buildStatsBreakdownTable(report.ordersByStatus, 'Статус', (x) =>
        ORDER_STATUS_LABELS[x.status] || x.status || x.label
      );
    }
    if (statsZonesEl instanceof HTMLElement) {
      statsZonesEl.innerHTML = buildStatsBreakdownTable(report.ordersByZone, 'Зона');
    }
    if (statsPaymentEl instanceof HTMLElement) {
      statsPaymentEl.innerHTML = buildStatsBreakdownTable(report.ordersByPayment, 'Оплата', (x) =>
        paymentLabel(x.label)
      );
    }
    if (statsDriversEl instanceof HTMLElement) {
      statsDriversEl.innerHTML = buildStatsBreakdownTable(report.ordersByDriver, 'Экспедитор');
    }
    if (statsUsersEl instanceof HTMLElement) {
      statsUsersEl.innerHTML = buildStatsUsersTable(report.usersByRole);
    }

    if (statsPeriodMetaEl instanceof HTMLElement) {
      statsPeriodMetaEl.textContent = formatStatsPeriodLabel(report.period);
    }
    if (statsPrintEl instanceof HTMLElement) {
      statsPrintEl.innerHTML = buildStatsPrintHtml(report);
    }
  }

  async function buildAdminStatsReport(options) {
    const silent = options && options.silent === true;
    if (!validateStatsPeriodForReport()) return null;
    const { from, to } = readStatsPeriodFromForm();
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const path = q.toString() ? `/api/admin/stats?${q.toString()}` : '/api/admin/stats';
    if (!silent) showStatsMsg('Формируем отчёт…', false);
    if (statsBuildBtn instanceof HTMLButtonElement) statsBuildBtn.disabled = true;
    const r = await api.json(path);
    if (statsBuildBtn instanceof HTMLButtonElement) statsBuildBtn.disabled = false;
    if (!r.ok) {
      if (!silent) showStatsMsg(String(r.data?.error || 'Не удалось загрузить статистику.'), false);
      return null;
    }
    lastStatsReport = r.data;
    renderStats(lastStatsReport);
    if (statsReportRootEl instanceof HTMLElement) statsReportRootEl.hidden = false;
    if (statsPdfBtn instanceof HTMLButtonElement) statsPdfBtn.disabled = false;
    if (!silent) {
      const zeroHint =
        Number(lastStatsReport?.summary?.ordersTotal) === 0 ? buildDeliverySpanHint(lastStatsReport) : '';
      showStatsMsg(zeroHint || 'Отчёт сформирован. Можно скачать PDF.', true);
    }
    return lastStatsReport;
  }

  function isStatsPaneActive() {
    const pane = document.getElementById('adminPaneStats');
    return Boolean(pane && !pane.classList.contains('hidden'));
  }

  async function refreshStatsLive() {
    if (!lastStatsReport || !isStatsPaneActive() || statsRefreshInFlight) return;
    statsRefreshInFlight = true;
    try {
      await buildAdminStatsReport({ silent: true });
    } finally {
      statsRefreshInFlight = false;
    }
  }

  function startStatsLiveRefresh() {
    if (statsLiveTimer) return;
    statsLiveTimer = window.setInterval(() => {
      void refreshStatsLive();
    }, 15000);
    if (typeof window.EkvalineOrdersSync?.subscribeOrdersDataChanged === 'function') {
      statsLiveUnsub = window.EkvalineOrdersSync.subscribeOrdersDataChanged(() => {
        void refreshStatsLive();
      });
    }
  }

  function stopStatsLiveRefresh() {
    if (statsLiveTimer) {
      window.clearInterval(statsLiveTimer);
      statsLiveTimer = null;
    }
    if (typeof statsLiveUnsub === 'function') {
      statsLiveUnsub();
      statsLiveUnsub = null;
    }
  }

  function statsExportFilenameBase() {
    const from = statsFromEl instanceof HTMLInputElement ? statsFromEl.value : '';
    const to = statsToEl instanceof HTMLInputElement ? statsToEl.value : '';
    return `ekvaline-admin-stats_${from || 'all'}_${to || 'all'}`;
  }

  async function downloadAdminStatsPdf() {
    if (!lastStatsReport) {
      showStatsMsg('Сначала нажмите «Сформировать отчёт».', false);
      return;
    }
    if (!(statsPrintEl instanceof HTMLElement) || !statsPrintEl.innerHTML.trim()) {
      showStatsMsg('Нет данных для PDF.', false);
      return;
    }
    if (statsPdfBtn instanceof HTMLButtonElement) statsPdfBtn.disabled = true;
    showStatsMsg('Готовим PDF…', false);

    const pdfBoot = window.EkvalinePdfExport;
    const ready = pdfBoot?.ensureHtml2pdfReady ? await pdfBoot.ensureHtml2pdfReady() : false;
    const h2p = pdfBoot?.getHtml2pdfFn?.() || (typeof window.html2pdf === 'function' ? window.html2pdf : null);
    if (!ready || typeof h2p !== 'function') {
      showStatsMsg('Не удалось загрузить генератор PDF. Обновите страницу (Ctrl+F5).', false);
      if (statsPdfBtn instanceof HTMLButtonElement) statsPdfBtn.disabled = false;
      return;
    }

    /** html2canvas не захватывает #adminStatsReportPrint (left: -14000px) — копия на экран. */
    let exportSheet = document.getElementById('adminStatsPdfExportSheet');
    if (!(exportSheet instanceof HTMLElement)) {
      exportSheet = document.createElement('div');
      exportSheet.id = 'adminStatsPdfExportSheet';
      exportSheet.className = 'admin-stats-pdf-export-sheet';
      exportSheet.setAttribute('aria-hidden', 'true');
      exportSheet.hidden = true;
      document.body.appendChild(exportSheet);
    }
    exportSheet.innerHTML = statsPrintEl.innerHTML;
    exportSheet.hidden = false;
    exportSheet.style.display = 'block';
    document.body.classList.add('admin-exporting-stats-pdf');

    if (pdfBoot?.waitNextPaintFrames) await pdfBoot.waitNextPaintFrames(3);
    else {
      await new Promise((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
      });
    }

    void exportSheet.offsetHeight;
    const contentW = Math.max(exportSheet.scrollWidth || 0, exportSheet.offsetWidth || 0, 720);
    const contentH = Math.max(exportSheet.scrollHeight || 0, exportSheet.offsetHeight || 0, 120);
    const hasRows = exportSheet.querySelector('table tr, .admin-stats-print-inner h1');
    const hasText = pdfBoot?.sheetHasVisibleText ? pdfBoot.sheetHasVisibleText(exportSheet) : contentH >= 80;
    if (!hasRows || !hasText || contentH < 80) {
      showStatsMsg('Нет данных для PDF — сначала сформируйте отчёт.', false);
      exportSheet.innerHTML = '';
      exportSheet.hidden = true;
      document.body.classList.remove('admin-exporting-stats-pdf');
      if (statsPdfBtn instanceof HTMLButtonElement) statsPdfBtn.disabled = false;
      return;
    }

    try {
      await h2p()
        .set({
          margin: [6, 8, 8, 8],
          filename: `${statsExportFilenameBase()}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: Math.min(2, window.devicePixelRatio > 1 ? 2 : 1.5),
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            width: contentW,
            height: contentH,
            windowWidth: contentW,
            windowHeight: contentH,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(exportSheet)
        .save();
      showStatsMsg('PDF сохранён.', true);
    } catch (err) {
      console.error('[admin] stats pdf:', err);
      showStatsMsg('Не удалось сформировать PDF.', false);
    } finally {
      exportSheet.innerHTML = '';
      exportSheet.hidden = true;
      document.body.classList.remove('admin-exporting-stats-pdf');
      if (statsPdfBtn instanceof HTMLButtonElement) statsPdfBtn.disabled = false;
    }
  }

  function initStatsPanel() {
    syncStatsDateInputLimits();
    [statsFromEl, statsToEl].forEach((el) => {
      el?.addEventListener('change', () => {
        syncStatsDateInputLimits();
        if (!validateStatsPeriodForReport()) return;
      });
      el?.addEventListener('input', syncStatsDateInputLimits);
    });
    applyStatsPreset('30');
    statsBuildBtn?.addEventListener('click', () => {
      void buildAdminStatsReport();
    });
    statsPdfBtn?.addEventListener('click', () => {
      void downloadAdminStatsPdf();
    });
    void window.EkvalinePdfExport?.ensureHtml2pdfReady?.();
    void buildAdminStatsReport();
    startStatsLiveRefresh();
  }
  function coerceAdminFaqItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const code = String(raw.code ?? '').trim().slice(0, 40);
    const tag = String(raw.tag ?? '').trim().slice(0, 60);
    const question = String(raw.question ?? '').trim().slice(0, 180);
    const answer = String(raw.answer ?? '').trim().slice(0, 900);
    if (!code || !tag || question.length < 3 || answer.length < 3) return null;
    return { code, tag, question, answer };
  }

  function normalizeAdminFaqLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceAdminFaqItem(x);
      if (row) out.push(row);
      if (out.length >= 30) break;
    }
    return out;
  }

  function cloneFaqList(items) {
    return (items || []).map((x) => ({
      code: String(x.code ?? ''),
      tag: String(x.tag ?? ''),
      question: String(x.question ?? ''),
      answer: String(x.answer ?? ''),
    }));
  }

  function coerceSitePollItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? '').trim().slice(0, 56);
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const question = String(raw.question ?? '').trim().slice(0, 400);
    const active = Boolean(raw.active);
    const optsIn = Array.isArray(raw.options) ? raw.options : [];
    const options = [];
    for (const o of optsIn) {
      if (!o || typeof o !== 'object') continue;
      const oid = String(o.id ?? '').trim().slice(0, 48);
      const text = String(o.text ?? '').trim().slice(0, 160);
      if (oid.length < 1 || text.length < 1) continue;
      options.push({ id: oid, text });
      if (options.length >= 12) break;
    }
    if (id.length < 1 || question.length < 3 || options.length < 2) return null;
    return { id, title, question, active, options };
  }

  function normalizeAdminPollsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceSitePollItem(x);
      if (row) out.push(row);
      if (out.length >= 10) break;
    }
    return out;
  }

  function clonePollList(items) {
    return (items || []).map((p) => ({
      id: String(p.id ?? ''),
      title: String(p.title ?? ''),
      question: String(p.question ?? ''),
      active: Boolean(p.active),
      options: Array.isArray(p.options)
        ? p.options.map((o) => ({ id: String(o.id ?? ''), text: String(o.text ?? '') }))
        : [],
    }));
  }

  function coerceAboutCertificateItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const image = String(raw.image ?? '').trim().slice(0, ABOUT_CERT_IMAGE_MAX_LEN);
    if (!aboutCertImageAllowed(image)) return null;
    const alt = String(raw.alt ?? '').trim().slice(0, 200);
    const badge = String(raw.badge ?? '').trim().slice(0, 80);
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const description = String(raw.description ?? '').trim().slice(0, 400);
    if (image.length < 3 || alt.length < 1 || title.length < 1 || description.length < 1) return null;
    const pdfRaw = String(raw.pdf ?? '').trim().slice(0, 280);
    const pdf = aboutCertPdfAllowed(pdfRaw) ? pdfRaw.replace(/^\/+/, '') : '';
    const row = { image, alt, badge, title, description };
    if (pdf) row.pdf = pdf;
    return row;
  }

  function normalizeAboutCertsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceAboutCertificateItem(x);
      if (row) out.push(row);
      if (out.length >= 12) break;
    }
    return out;
  }

  function cloneAboutCertsList(items) {
    return (items || []).map((c) => {
      const row = {
        image: String(c.image ?? ''),
        alt: String(c.alt ?? ''),
        badge: String(c.badge ?? ''),
        title: String(c.title ?? ''),
        description: String(c.description ?? ''),
      };
      if (c.pdf) row.pdf = String(c.pdf);
      return row;
    });
  }

  /** @returns {{ image:string,alt:string,badge:string,title:string,description:string }[]} */
  function buildAboutCertificatesPayload() {
    return aboutCertsDraft.map((item) => coerceAboutCertificateItem(item)).filter(Boolean);
  }

  function coerceCoverageCardItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const text = String(raw.text ?? '').trim().slice(0, 100);
    if (title.length < 1 || text.length < 1) return null;
    return { title, text };
  }

  function normalizeCoverageCardsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceCoverageCardItem(x);
      if (row) out.push(row);
      if (out.length >= 8) break;
    }
    return out;
  }

  function cloneCoverageCardsList(items) {
    return (items || []).map((x) => ({
      title: String(x.title ?? ''),
      text: String(x.text ?? ''),
    }));
  }

  function cloneDefaultCoverageCards() {
    return DEFAULT_ADMIN_DELIVERY_COVERAGE.cards.map((c) => ({ title: c.title, text: c.text }));
  }

  /** @returns {{ title:string,text:string }[]} */
  function buildCoverageCardsPayload() {
    return coverageCardsDraft.map((item) => coerceCoverageCardItem(item)).filter(Boolean);
  }

  /** @returns {{ title:string,cards:{title:string,text:string}[]}|null} */
  function buildDeliveryCoverageForPayload() {
    if (!(settingsForm instanceof HTMLFormElement)) return null;
    const title = String(settingsForm.elements.namedItem('deliveryCoverageTitle')?.value || '').trim();
    const cards = buildCoverageCardsPayload();
    if (title.length < 3 || cards.length < 1) return null;
    return {
      title: title.slice(0, 160),
      cards,
    };
  }

  /** @returns {{ code:string,tag:string,question:string,answer:string }[]} */
  function buildDeliveryFaqPayload() {
    return faqDraft.map((item) =>
      coerceAdminFaqItem({
        code: item.code,
        tag: item.tag,
        question: item.question,
        answer: item.answer,
      })
    ).filter(Boolean);
  }

  let coverageTitleSaveTimer = null;
  let coverageTitleSaveBusy = false;

  async function saveCoverageTitleNow() {
    window.clearTimeout(coverageTitleSaveTimer);
    coverageTitleSaveTimer = null;
    if (!settingsHydrated || coverageTitleSaveBusy) return;
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) return;
    coverageTitleSaveBusy = true;
    try {
      await persistDeliveryCoveragePanel(settingsMsg);
    } finally {
      coverageTitleSaveBusy = false;
    }
  }

  function scheduleCoverageTitleAutoSave() {
    window.clearTimeout(coverageTitleSaveTimer);
    coverageTitleSaveTimer = window.setTimeout(() => void saveCoverageTitleNow(), 800);
  }

  /** Сохранить блок «Зоны покрытия» (карточки у карты на «Доставка»). */
  async function persistDeliveryCoveragePanel(errorEl) {
    const el = errorEl instanceof HTMLElement ? errorEl : settingsMsg;
    const deliveryCoverage = buildDeliveryCoverageForPayload();
    if (!deliveryCoverage) {
      showMsg(
        el,
        'Не удалось сохранить блок «Зоны покрытия»: заголовок секции — не короче 3 символов; нужна хотя бы одна карточка с непустым заголовком и текстом.'
      );
      return false;
    }
    try {
      const r = await api.json('/api/manager/settings/delivery-coverage', { method: 'PATCH', body: deliveryCoverage });
      if (!r.ok) {
        showMsg(el, r.data?.error || 'Сервер отклонил сохранение блока «Зоны покрытия».');
        return false;
      }
      api.resetCsrf();
      await loadSettings();
      if (el !== settingsMsg) showMsg(el, 'Сохранено.', true);
      return true;
    } catch {
      showMsg(
        el,
        'Не удалось отправить запрос. Откройте админку через запущенный сервер сайта, не через file://.'
      );
      return false;
    }
  }

  /** Сохранить только FAQ для страницы «Доставка». */
  async function persistDeliveryFaqPanel(errorEl) {
    const el = errorEl instanceof HTMLElement ? errorEl : settingsMsg;
    const deliveryFaq = buildDeliveryFaqPayload();
    if (!deliveryFaq.length) {
      showMsg(el, 'Нужен хотя бы один корректный вопрос: код, тег, вопрос и ответ (от 3 символов).');
      return false;
    }
    try {
      const r = await api.json('/api/manager/settings/delivery-faq', { method: 'PATCH', body: deliveryFaq });
      if (!r.ok) {
        showMsg(el, r.data?.error || 'Сервер отклонил сохранение блока вопросов.');
        return false;
      }
      api.resetCsrf();
      await loadSettings();
      if (el !== settingsMsg) showMsg(el, 'Сохранено.', true);
      return true;
    } catch {
      showMsg(
        el,
        'Не удалось отправить запрос. Откройте админку через запущенный сервер сайта, не через file://.'
      );
      return false;
    }
  }

  /** Сохранить только сертификаты для страницы «О компании». */
  async function persistAboutCertificatesPanel(errorEl) {
    const el = errorEl instanceof HTMLElement ? errorEl : settingsMsg;
    const aboutCertificates = buildAboutCertificatesPayload();
    try {
      const r = await api.json('/api/manager/settings/about-certificates', {
        method: 'PATCH',
        body: aboutCertificates,
      });
      if (!r.ok) {
        showMsg(el, r.data?.error || 'Сервер отклонил сохранение сертификатов.');
        return false;
      }
      api.resetCsrf();
      await loadSettings();
      if (el !== settingsMsg) showMsg(el, 'Сохранено.', true);
      return true;
    } catch {
      showMsg(
        el,
        'Не удалось отправить запрос. Откройте админку через запущенный сервер сайта, не через file://.'
      );
      return false;
    }
  }

  function closeFaqEditModal(skipListRefresh = false) {
    if (!(adminFaqEditModal instanceof HTMLElement)) return;
    adminFaqEditModal.hidden = true;
    adminFaqEditModal.setAttribute('aria-hidden', 'true');
    faqEditModalIdx = -1;
    if (!skipListRefresh && deliveryFaqNav instanceof HTMLElement) renderFaqDraftList();
  }

  function faqEditModalIsOpen() {
    return adminFaqEditModal instanceof HTMLElement && !adminFaqEditModal.hidden;
  }

  function aboutCertEditModalIsOpen() {
    return adminAboutCertEditModal instanceof HTMLElement && !adminAboutCertEditModal.hidden;
  }

  function aboutCertAddModalIsOpen() {
    return adminAboutCertAddModal instanceof HTMLElement && !adminAboutCertAddModal.hidden;
  }

  function coverageCardEditModalIsOpen() {
    return adminCoverageCardEditModal instanceof HTMLElement && !adminCoverageCardEditModal.hidden;
  }

  function coverageCardAddModalIsOpen() {
    return adminCoverageCardAddModal instanceof HTMLElement && !adminCoverageCardAddModal.hidden;
  }

  function fillFaqEditModal(idx) {
    const item = faqDraft[idx];
    if (!item) return;
    if (adminFaqEditNum instanceof HTMLElement) {
      const n = faqDraft.length;
      adminFaqEditNum.textContent = n ? `Вопрос ${idx + 1} из ${n}` : `Вопрос ${idx + 1}`;
    }
    if (adminFaqEditCode instanceof HTMLInputElement) adminFaqEditCode.value = item.code || '';
    if (adminFaqEditTag instanceof HTMLInputElement) adminFaqEditTag.value = item.tag || '';
    if (adminFaqEditQuestion instanceof HTMLInputElement) adminFaqEditQuestion.value = item.question || '';
    if (adminFaqEditAnswer instanceof HTMLTextAreaElement) adminFaqEditAnswer.value = item.answer || '';
    if (adminFaqEditDelete instanceof HTMLButtonElement) adminFaqEditDelete.disabled = faqDraft.length <= 1;
    if (adminFaqEditModal instanceof HTMLElement) refreshCharCounters(adminFaqEditModal);
  }

  function readFaqEditModalIntoDraft() {
    if (faqEditModalIdx < 0 || !faqDraft[faqEditModalIdx]) return false;
    const code = adminFaqEditCode instanceof HTMLInputElement ? adminFaqEditCode.value : '';
    const tag = adminFaqEditTag instanceof HTMLInputElement ? adminFaqEditTag.value : '';
    const question = adminFaqEditQuestion instanceof HTMLInputElement ? adminFaqEditQuestion.value : '';
    const answer = adminFaqEditAnswer instanceof HTMLTextAreaElement ? adminFaqEditAnswer.value : '';
    const coerced = coerceAdminFaqItem({ code, tag, question, answer });
    if (!coerced) return false;
    faqDraft[faqEditModalIdx] = coerced;
    return true;
  }

  function openFaqEditModal(idx) {
    if (!(adminFaqEditModal instanceof HTMLElement)) return;
    if (!faqDraft[idx]) return;
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата («Сохранить», «Отмена» или «Добавить»).');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса.');
      return;
    }
    showMsg(adminFaqEditModalMsg, '');
    faqEditModalIdx = idx;
    fillFaqEditModal(idx);
    renderFaqDraftList();
    adminFaqEditModal.hidden = false;
    adminFaqEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminFaqEditCode instanceof HTMLInputElement) adminFaqEditCode.focus();
    }, 0);
  }

  async function submitFaqEditModal() {
    if (faqEditModalIdx < 0) return;
    const idx = faqEditModalIdx;
    const backup = { ...faqDraft[idx] };
    if (!readFaqEditModalIntoDraft()) {
      showMsg(
        adminFaqEditModalMsg,
        'Проверьте поля: код, тег, вопрос и ответ (не короче 3 символов в вопросе и ответе).'
      );
      return;
    }
    const saved = await persistDeliveryFaqPanel(adminFaqEditModalMsg);
    if (!saved) {
      faqDraft[idx] = backup;
      fillFaqEditModal(idx);
      return;
    }
    closeFaqEditModal();
    showMsg(
      settingsMsg,
      'Вопрос сохранён на сервере. Откройте delivery.html и обновите страницу (Ctrl+F5).',
      true
    );
  }

  async function deleteFaqFromEditModal() {
    if (faqEditModalIdx < 0) return;
    if (faqDraft.length <= 1) {
      showMsg(adminFaqEditModalMsg, 'Нужен хотя бы один вопрос в этом блоке.');
      return;
    }
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить вопрос?',
      message: 'Вопрос будет убран из блока на странице «Доставка». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneFaqList(faqDraft);
    const idx = faqEditModalIdx;
    faqDraft.splice(idx, 1);
    closeFaqEditModal(true);
    renderFaqDraftList();

    const saved = await persistDeliveryFaqPanel(settingsMsg);
    if (!saved) {
      faqDraft = backup;
      renderFaqDraftList();
      return;
    }
    showMsg(settingsMsg, 'Вопрос удалён на сервере.', true);
  }

  function renderFaqDraftList() {
    if (!(deliveryFaqNav instanceof HTMLElement)) return;
    deliveryFaqNav.innerHTML = '';
    faqDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-delivery-faq-preview-card';
      if (faqEditModalIdx >= 0 && idx === faqEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const codeEl = document.createElement('span');
      codeEl.className = 'delivery-faq-nav-code';
      codeEl.textContent = item.code || '—';

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const tagEl = document.createElement('span');
      tagEl.className = 'delivery-faq-nav-tag';
      tagEl.textContent = item.tag || '—';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-faq-edit-idx', String(idx));

      actions.appendChild(tagEl);
      actions.appendChild(editBtn);
      top.appendChild(codeEl);
      top.appendChild(actions);

      const qEl = document.createElement('p');
      qEl.className = 'delivery-faq-nav-text';
      qEl.style.marginTop = '0.34rem';
      qEl.textContent = item.question || '';

      const aEl = document.createElement('p');
      aEl.className = 'admin-delivery-faq-card-answer-preview';
      aEl.textContent = item.answer || '';

      wrap.appendChild(top);
      wrap.appendChild(qEl);
      wrap.appendChild(aEl);
      deliveryFaqNav.appendChild(wrap);
    });
  }

  function initFaqDraftFromLoaded(listFromApi) {
    closeFaqEditModal(true);
    const normalized = normalizeAdminFaqLoaded(listFromApi);
    faqDraft = cloneFaqList(normalized.length ? normalized : [...DEFAULT_ADMIN_FAQ]);
    renderFaqDraftList();
  }

  function resetFaqAddModalFields() {
    if (adminFaqAddCode instanceof HTMLInputElement) adminFaqAddCode.value = 'Тема';
    if (adminFaqAddTag instanceof HTMLInputElement) adminFaqAddTag.value = 'Метка';
    if (adminFaqAddQuestion instanceof HTMLInputElement) adminFaqAddQuestion.value = 'Новый вопрос?';
    if (adminFaqAddAnswer instanceof HTMLTextAreaElement)
      adminFaqAddAnswer.value = 'Краткий ответ для клиента будет показан справа на странице доставки.';
    if (adminFaqAddModal instanceof HTMLElement) refreshCharCounters(adminFaqAddModal);
  }

  function openFaqAddModal() {
    if (!(adminFaqAddModal instanceof HTMLElement)) return;
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования («Сохранить» или «Отмена»).');
      return;
    }
    if (faqDraft.length >= 30) {
      showMsg(settingsMsg, 'Не больше 30 вопросов в этом блоке.');
      return;
    }
    showMsg(adminFaqAddModalMsg, '');
    resetFaqAddModalFields();
    adminFaqAddModal.hidden = false;
    adminFaqAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminFaqAddCode instanceof HTMLInputElement) adminFaqAddCode.focus();
    }, 0);
  }

  function closeFaqAddModal() {
    if (!(adminFaqAddModal instanceof HTMLElement)) return;
    adminFaqAddModal.hidden = true;
    adminFaqAddModal.setAttribute('aria-hidden', 'true');
  }

  async function submitFaqAddFromModal() {
    const code = adminFaqAddCode instanceof HTMLInputElement ? adminFaqAddCode.value : '';
    const tag = adminFaqAddTag instanceof HTMLInputElement ? adminFaqAddTag.value : '';
    const question = adminFaqAddQuestion instanceof HTMLInputElement ? adminFaqAddQuestion.value : '';
    const answer = adminFaqAddAnswer instanceof HTMLTextAreaElement ? adminFaqAddAnswer.value : '';
    const coerced = coerceAdminFaqItem({ code, tag, question, answer });
    if (!coerced) {
      showMsg(
        adminFaqAddModalMsg,
        'Заполните код, тег, вопрос и ответ (не короче 3 символов в вопросе и ответе).'
      );
      return;
    }
    faqDraft.push(coerced);
    const saved = await persistDeliveryFaqPanel(adminFaqAddModalMsg);
    if (!saved) {
      faqDraft.pop();
      return;
    }
    closeFaqAddModal();
    renderFaqDraftList();
    showMsg(
      settingsMsg,
      'Новый вопрос сохранён на сервере. Обновите страницу «Доставка», если она уже открыта.',
      true
    );
  }

  function initPollDraftFromLoaded(listFromApi) {
    const normalized = normalizeAdminPollsLoaded(listFromApi);
    pollsDraft = clonePollList(normalized);
  }

  function closeCoverageCardEditModal(skipListRefresh = false) {
    if (!(adminCoverageCardEditModal instanceof HTMLElement)) return;
    adminCoverageCardEditModal.hidden = true;
    adminCoverageCardEditModal.setAttribute('aria-hidden', 'true');
    coverageCardEditModalIdx = -1;
    if (!skipListRefresh && adminCoverageCardsNav instanceof HTMLElement) renderCoverageCardsDraftList();
  }

  function fillCoverageCardEditModal(idx) {
    const item = coverageCardsDraft[idx];
    if (!item) return;
    if (adminCoverageCardEditNum instanceof HTMLElement) {
      const n = coverageCardsDraft.length;
      adminCoverageCardEditNum.textContent = n ? `Карточка ${idx + 1} из ${n}` : `Карточка ${idx + 1}`;
    }
    if (adminCoverageCardEditItemTitle instanceof HTMLInputElement)
      adminCoverageCardEditItemTitle.value = item.title || '';
    if (adminCoverageCardEditItemText instanceof HTMLTextAreaElement)
      adminCoverageCardEditItemText.value = item.text || '';
    if (adminCoverageCardEditDelete instanceof HTMLButtonElement)
      adminCoverageCardEditDelete.disabled = coverageCardsDraft.length <= 1;
    if (adminCoverageCardEditModal instanceof HTMLElement) refreshCharCounters(adminCoverageCardEditModal);
  }

  function readCoverageCardEditModalIntoDraft() {
    if (coverageCardEditModalIdx < 0 || !coverageCardsDraft[coverageCardEditModalIdx]) return false;
    const title =
      adminCoverageCardEditItemTitle instanceof HTMLInputElement ? adminCoverageCardEditItemTitle.value : '';
    const text =
      adminCoverageCardEditItemText instanceof HTMLTextAreaElement ? adminCoverageCardEditItemText.value : '';
    const coerced = coerceCoverageCardItem({ title, text });
    if (!coerced) return false;
    coverageCardsDraft[coverageCardEditModalIdx] = coerced;
    return true;
  }

  function openCoverageCardEditModal(idx) {
    if (!(adminCoverageCardEditModal instanceof HTMLElement)) return;
    if (!coverageCardsDraft[idx]) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно «Новая карточка».');
      return;
    }
    showMsg(adminCoverageCardEditModalMsg, '');
    coverageCardEditModalIdx = idx;
    fillCoverageCardEditModal(idx);
    renderCoverageCardsDraftList();
    adminCoverageCardEditModal.hidden = false;
    adminCoverageCardEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminCoverageCardEditItemTitle instanceof HTMLInputElement) adminCoverageCardEditItemTitle.focus();
    }, 0);
  }

  async function submitCoverageCardEditModal() {
    if (coverageCardEditModalIdx < 0) return;
    const idx = coverageCardEditModalIdx;
    const backup = cloneCoverageCardsList([coverageCardsDraft[idx]])[0];
    if (!readCoverageCardEditModalIntoDraft()) {
      showMsg(adminCoverageCardEditModalMsg, 'Заголовок и текст карточки не должны быть пустыми.');
      return;
    }
    const saved = await persistDeliveryCoveragePanel(adminCoverageCardEditModalMsg);
    if (!saved) {
      coverageCardsDraft[idx] = backup;
      fillCoverageCardEditModal(idx);
      return;
    }
    closeCoverageCardEditModal();
    showMsg(settingsMsg, 'Блок «Зоны покрытия» сохранён на сервере. Обновите страницу «Доставка».', true);
  }

  async function deleteCoverageCardFromEditModal() {
    if (coverageCardEditModalIdx < 0) return;
    if (coverageCardsDraft.length <= 1) {
      showMsg(adminCoverageCardEditModalMsg, 'Нужна хотя бы одна карточка в этом блоке.');
      return;
    }
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить карточку?',
      message: 'Карточка будет убрана из блока «Зоны покрытия» на странице «Доставка». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneCoverageCardsList(coverageCardsDraft);
    const idx = coverageCardEditModalIdx;
    coverageCardsDraft.splice(idx, 1);
    closeCoverageCardEditModal(true);
    renderCoverageCardsDraftList();

    const saved = await persistDeliveryCoveragePanel(settingsMsg);
    if (!saved) {
      coverageCardsDraft = backup;
      renderCoverageCardsDraftList();
      return;
    }
    showMsg(settingsMsg, 'Карточка удалена на сервере.', true);
  }

  function renderCoverageCardsDraftList() {
    if (!(adminCoverageCardsNav instanceof HTMLElement)) return;
    adminCoverageCardsNav.innerHTML = '';
    coverageCardsDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-site-poll-preview-card admin-delivery-faq-preview-card';
      if (coverageCardEditModalIdx >= 0 && idx === coverageCardEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const titleBadge = document.createElement('span');
      titleBadge.className = 'delivery-faq-nav-code';
      titleBadge.textContent = `${idx + 1}`;

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-coverage-card-edit-idx', String(idx));

      actions.appendChild(editBtn);
      top.appendChild(titleBadge);
      top.appendChild(actions);

      const titleEl = document.createElement('p');
      titleEl.className = 'delivery-faq-nav-text';
      titleEl.style.marginTop = '0.34rem';
      titleEl.style.fontWeight = '600';
      titleEl.textContent = item.title || '';

      const textEl = document.createElement('p');
      textEl.className = 'admin-delivery-faq-card-answer-preview';
      textEl.textContent = item.text || '';

      wrap.appendChild(top);
      wrap.appendChild(titleEl);
      wrap.appendChild(textEl);
      adminCoverageCardsNav.appendChild(wrap);
    });
  }

  function initCoveragePanelFromLoaded(panelFromApi) {
    closeCoverageCardEditModal(true);
    let title = DEFAULT_ADMIN_DELIVERY_COVERAGE.title;
    let cards = cloneDefaultCoverageCards();
    if (panelFromApi && typeof panelFromApi === 'object') {
      const t = String(panelFromApi.title ?? '').trim();
      const normalized = normalizeCoverageCardsLoaded(panelFromApi.cards);
      if (t.length >= 3 && normalized.length >= 1) {
        title = t.slice(0, 160);
        cards = normalized;
      }
    }
    const ti = settingsForm instanceof HTMLFormElement ? settingsForm.elements.namedItem('deliveryCoverageTitle') : null;
    if (ti instanceof HTMLInputElement) ti.value = title;
    coverageCardsDraft = cloneCoverageCardsList(cards);
    renderCoverageCardsDraftList();
    const shell = document.querySelector('.admin-delivery-coverage-block');
    if (shell instanceof HTMLElement) refreshCharCounters(shell);
  }

  function resetCoverageCardAddModalFields() {
    if (adminCoverageCardAddItemTitle instanceof HTMLInputElement) adminCoverageCardAddItemTitle.value = 'Новая строка';
    if (adminCoverageCardAddItemText instanceof HTMLTextAreaElement)
      adminCoverageCardAddItemText.value = 'Текст для посетителей страницы «Доставка».';
    if (adminCoverageCardAddModal instanceof HTMLElement) refreshCharCounters(adminCoverageCardAddModal);
  }

  function closeCoverageCardAddModal() {
    if (!(adminCoverageCardAddModal instanceof HTMLElement)) return;
    adminCoverageCardAddModal.hidden = true;
    adminCoverageCardAddModal.setAttribute('aria-hidden', 'true');
  }

  function openCoverageCardAddModal() {
    if (!(adminCoverageCardAddModal instanceof HTMLElement)) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования карточки.');
      return;
    }
    if (coverageCardsDraft.length >= 8) {
      showMsg(settingsMsg, 'Не больше 8 карточек.');
      return;
    }
    showMsg(adminCoverageCardAddModalMsg, '');
    resetCoverageCardAddModalFields();
    adminCoverageCardAddModal.hidden = false;
    adminCoverageCardAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminCoverageCardAddItemTitle instanceof HTMLInputElement) adminCoverageCardAddItemTitle.focus();
    }, 0);
  }

  async function submitCoverageCardAddFromModal() {
    const title =
      adminCoverageCardAddItemTitle instanceof HTMLInputElement ? adminCoverageCardAddItemTitle.value : '';
    const text = adminCoverageCardAddItemText instanceof HTMLTextAreaElement ? adminCoverageCardAddItemText.value : '';
    const coerced = coerceCoverageCardItem({ title, text });
    if (!coerced) {
      showMsg(adminCoverageCardAddModalMsg, 'Заголовок и текст карточки не должны быть пустыми.');
      return;
    }
    coverageCardsDraft.push(coerced);
    const saved = await persistDeliveryCoveragePanel(adminCoverageCardAddModalMsg);
    if (!saved) {
      coverageCardsDraft.pop();
      return;
    }
    closeCoverageCardAddModal();
    renderCoverageCardsDraftList();
    showMsg(settingsMsg, 'Карточка добавлена на сервере.', true);
  }

  function closeAboutCertEditModal(skipListRefresh = false) {
    if (!(adminAboutCertEditModal instanceof HTMLElement)) return;
    adminAboutCertEditModal.hidden = true;
    adminAboutCertEditModal.setAttribute('aria-hidden', 'true');
    aboutCertEditModalIdx = -1;
    if (!skipListRefresh && adminAboutCertsNav instanceof HTMLElement) renderAboutCertsDraftList();
  }

  function fillAboutCertEditModal(idx) {
    const item = aboutCertsDraft[idx];
    if (!item) return;
    if (adminAboutCertEditNum instanceof HTMLElement) {
      const n = aboutCertsDraft.length;
      adminAboutCertEditNum.textContent = n ? `Сертификат ${idx + 1} из ${n}` : `Сертификат ${idx + 1}`;
    }
    if (adminAboutCertEditImage instanceof HTMLInputElement) adminAboutCertEditImage.value = item.image || '';
    if (adminAboutCertEditImageFile instanceof HTMLInputElement) adminAboutCertEditImageFile.value = '';
    if (adminAboutCertEditAlt instanceof HTMLInputElement) adminAboutCertEditAlt.value = item.alt || '';
    if (adminAboutCertEditBadge instanceof HTMLInputElement) adminAboutCertEditBadge.value = item.badge || '';
    if (adminAboutCertEditTitleLine instanceof HTMLInputElement) adminAboutCertEditTitleLine.value = item.title || '';
    if (adminAboutCertEditDesc instanceof HTMLTextAreaElement) adminAboutCertEditDesc.value = item.description || '';
    if (adminAboutCertEditPdf instanceof HTMLInputElement) adminAboutCertEditPdf.value = item.pdf || '';
    if (adminAboutCertEditModal instanceof HTMLElement) refreshCharCounters(adminAboutCertEditModal);
  }

  function readAboutCertEditModalIntoDraft() {
    if (aboutCertEditModalIdx < 0 || !aboutCertsDraft[aboutCertEditModalIdx]) return false;
    const image = adminAboutCertEditImage instanceof HTMLInputElement ? adminAboutCertEditImage.value : '';
    const alt = adminAboutCertEditAlt instanceof HTMLInputElement ? adminAboutCertEditAlt.value : '';
    const badge = adminAboutCertEditBadge instanceof HTMLInputElement ? adminAboutCertEditBadge.value : '';
    const title = adminAboutCertEditTitleLine instanceof HTMLInputElement ? adminAboutCertEditTitleLine.value : '';
    const description = adminAboutCertEditDesc instanceof HTMLTextAreaElement ? adminAboutCertEditDesc.value : '';
    const pdf = adminAboutCertEditPdf instanceof HTMLInputElement ? adminAboutCertEditPdf.value : '';
    const coerced = coerceAboutCertificateItem({ image, alt, badge, title, description, pdf });
    if (!coerced) return false;
    aboutCertsDraft[aboutCertEditModalIdx] = coerced;
    return true;
  }

  function openAboutCertEditModal(idx) {
    if (!(adminAboutCertEditModal instanceof HTMLElement)) return;
    if (!aboutCertsDraft[idx]) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно «Новый сертификат».');
      return;
    }
    showMsg(adminAboutCertEditModalMsg, '');
    aboutCertEditModalIdx = idx;
    fillAboutCertEditModal(idx);
    renderAboutCertsDraftList();
    adminAboutCertEditModal.hidden = false;
    adminAboutCertEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminAboutCertEditAlt instanceof HTMLInputElement) adminAboutCertEditAlt.focus();
    }, 0);
  }

  async function submitAboutCertEditModal() {
    if (aboutCertEditModalIdx < 0) return;
    const idx = aboutCertEditModalIdx;
    const backup = cloneAboutCertsList([aboutCertsDraft[idx]])[0];
    if (!readAboutCertEditModalIntoDraft()) {
      showMsg(
        adminAboutCertEditModalMsg,
        'Нужно допустимое изображение (выберите файл или оставьте уже сохранённое), заполнены alt, заголовок и описание; без javascript:/vbscript:.'
      );
      return;
    }
    const saved = await persistAboutCertificatesPanel(adminAboutCertEditModalMsg);
    if (!saved) {
      aboutCertsDraft[idx] = backup;
      fillAboutCertEditModal(idx);
      return;
    }
    closeAboutCertEditModal();
    showMsg(settingsMsg, 'Сертификаты сохранены. Откройте about.html и обновите страницу (Ctrl+F5).', true);
  }

  async function deleteAboutCertFromEditModal() {
    if (aboutCertEditModalIdx < 0) return;
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить сертификат?',
      message: 'Карточка будет убрана со страницы «О компании». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneAboutCertsList(aboutCertsDraft);
    const idx = aboutCertEditModalIdx;
    aboutCertsDraft.splice(idx, 1);
    closeAboutCertEditModal(true);
    renderAboutCertsDraftList();

    const saved = await persistAboutCertificatesPanel(settingsMsg);
    if (!saved) {
      aboutCertsDraft = backup;
      renderAboutCertsDraftList();
      return;
    }
    showMsg(settingsMsg, 'Сертификат удалён на сервере.', true);
  }

  function renderAboutCertsDraftList() {
    if (!(adminAboutCertsNav instanceof HTMLElement)) return;
    adminAboutCertsNav.innerHTML = '';
    if (!aboutCertsDraft.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty-note';
      empty.textContent =
        'Список пуст на сервере — у посетителей покажутся карточки по умолчанию. Добавьте элемент или сохраните пустой список через «Сохранить настройки».';
      adminAboutCertsNav.appendChild(empty);
      return;
    }
    aboutCertsDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-site-poll-preview-card admin-delivery-faq-preview-card';
      if (aboutCertEditModalIdx >= 0 && idx === aboutCertEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const badgeEl = document.createElement('span');
      badgeEl.className = 'delivery-faq-nav-code';
      badgeEl.textContent = item.badge?.trim() ? item.badge : 'Без бейджа';

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const thumb = document.createElement('img');
      thumb.alt = '';
      thumb.decoding = 'async';
      thumb.loading = 'lazy';
      thumb.style.maxHeight = '40px';
      thumb.style.maxWidth = '56px';
      thumb.style.objectFit = 'cover';
      thumb.style.borderRadius = '6px';
      thumb.src = item.image || '';
      thumb.addEventListener('error', () => {
        thumb.hidden = true;
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-about-cert-edit-idx', String(idx));

      actions.appendChild(thumb);
      actions.appendChild(editBtn);
      top.appendChild(badgeEl);
      top.appendChild(actions);

      const titleEl = document.createElement('p');
      titleEl.className = 'delivery-faq-nav-text';
      titleEl.style.marginTop = '0.34rem';
      titleEl.style.fontWeight = '600';
      titleEl.textContent = item.title || '';

      const imgPath = document.createElement('p');
      imgPath.className = 'admin-delivery-faq-card-answer-preview';
      imgPath.style.fontSize = '0.85rem';
      imgPath.textContent = item.image || '';

      wrap.appendChild(top);
      wrap.appendChild(titleEl);
      wrap.appendChild(imgPath);

      if (item.pdf) {
        const pdfPath = document.createElement('p');
        pdfPath.className = 'admin-delivery-faq-card-answer-preview';
        pdfPath.style.fontSize = '0.85rem';
        pdfPath.style.color = '#1f6fd4';
        pdfPath.textContent = `PDF: ${item.pdf}`;
        wrap.appendChild(pdfPath);
      }
      adminAboutCertsNav.appendChild(wrap);
    });
  }

  function initAboutCertsDraftFromLoaded(listFromApi) {
    closeAboutCertEditModal(true);
    const normalized = normalizeAboutCertsLoaded(listFromApi);
    aboutCertsDraft = cloneAboutCertsList(normalized.length ? normalized : [...DEFAULT_ADMIN_ABOUT_CERTIFICATES]);
    renderAboutCertsDraftList();
  }

  function resetAboutCertAddModalFields() {
    const sample = DEFAULT_ADMIN_ABOUT_CERTIFICATES[0];
    if (adminAboutCertAddImage instanceof HTMLInputElement) adminAboutCertAddImage.value = sample?.image || '';
    if (adminAboutCertAddImageFile instanceof HTMLInputElement) adminAboutCertAddImageFile.value = '';
    if (adminAboutCertAddAlt instanceof HTMLInputElement) adminAboutCertAddAlt.value = sample?.alt || '';
    if (adminAboutCertAddBadge instanceof HTMLInputElement) adminAboutCertAddBadge.value = '';
    if (adminAboutCertAddTitleLine instanceof HTMLInputElement) adminAboutCertAddTitleLine.value = 'Новый сертификат';
    if (adminAboutCertAddDesc instanceof HTMLTextAreaElement)
      adminAboutCertAddDesc.value = 'Краткое описание для карточки на странице «О компании».';
    if (adminAboutCertAddPdf instanceof HTMLInputElement) adminAboutCertAddPdf.value = '';
    if (adminAboutCertAddModal instanceof HTMLElement) refreshCharCounters(adminAboutCertAddModal);
  }

  function closeAboutCertAddModal() {
    if (!(adminAboutCertAddModal instanceof HTMLElement)) return;
    adminAboutCertAddModal.hidden = true;
    adminAboutCertAddModal.setAttribute('aria-hidden', 'true');
  }

  function openAboutCertAddModal() {
    if (!(adminAboutCertAddModal instanceof HTMLElement)) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (aboutCertEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования сертификата.');
      return;
    }
    if (aboutCertsDraft.length >= 12) {
      showMsg(settingsMsg, 'Не больше 12 сертификатов.');
      return;
    }
    showMsg(adminAboutCertAddModalMsg, '');
    resetAboutCertAddModalFields();
    adminAboutCertAddModal.hidden = false;
    adminAboutCertAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminAboutCertAddTitleLine instanceof HTMLInputElement) adminAboutCertAddTitleLine.focus();
    }, 0);
  }

  async function submitAboutCertAddFromModal() {
    const image = adminAboutCertAddImage instanceof HTMLInputElement ? adminAboutCertAddImage.value : '';
    const alt = adminAboutCertAddAlt instanceof HTMLInputElement ? adminAboutCertAddAlt.value : '';
    const badge = adminAboutCertAddBadge instanceof HTMLInputElement ? adminAboutCertAddBadge.value : '';
    const title = adminAboutCertAddTitleLine instanceof HTMLInputElement ? adminAboutCertAddTitleLine.value : '';
    const description = adminAboutCertAddDesc instanceof HTMLTextAreaElement ? adminAboutCertAddDesc.value : '';
    const pdf = adminAboutCertAddPdf instanceof HTMLInputElement ? adminAboutCertAddPdf.value : '';
    const coerced = coerceAboutCertificateItem({ image, alt, badge, title, description, pdf });
    if (!coerced) {
      showMsg(
        adminAboutCertAddModalMsg,
        'Нужно допустимое изображение (выберите файл или оставьте подставленный образец), заполнены alt, заголовок и описание; без javascript:/vbscript:.'
      );
      return;
    }
    aboutCertsDraft.push(coerced);
    const saved = await persistAboutCertificatesPanel(adminAboutCertAddModalMsg);
    if (!saved) {
      aboutCertsDraft.pop();
      return;
    }
    closeAboutCertAddModal();
    renderAboutCertsDraftList();
    showMsg(settingsMsg, 'Сертификат добавлен на сервере.', true);
  }

  async function loadUsers() {
    const r = await api.json('/api/admin/users');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки пользователей');
    users = Array.isArray(r.data?.users) ? r.data.users : [];
    renderStaffByRoleLists();
  }

  async function loadProducts() {
    const r = await api.json('/api/admin/products');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки товаров');
    categories = Array.isArray(r.data?.categories) ? r.data.categories : [];
    products = Array.isArray(r.data?.products) ? r.data.products : [];
    renderCategoriesInto(categorySelect);
    renderCategoriesInto(editCategory);
    renderProducts();
  }

  async function refreshStatsIfActive() {
    if (lastStatsReport) await buildAdminStatsReport();
  }

  async function loadSettings() {
    const r = await api.json('/api/manager/settings');
    if (!r.ok || !(settingsForm instanceof HTMLFormElement)) {
      settingsHydrated = false;
      if (!faqDraft.length) initFaqDraftFromLoaded(null);
      initPollDraftFromLoaded(null);
      initAboutCertsDraftFromLoaded(null);
      initCoveragePanelFromLoaded(null);
      showMsg(
        settingsMsg,
        'Не удалось загрузить настройки с сервера. Обновите страницу. Сохранение на сайт временно недоступно.',
        false
      );
      return;
    }
    settingsHydrated = true;
    showMsg(settingsMsg, '');
    settingsForm.elements.namedItem('workLine').value = r.data.workLine || '';
    settingsForm.elements.namedItem('communityIntro').value = r.data.communityIntro || '';
    settingsForm.elements.namedItem('deliverySlotsText').value = Array.isArray(r.data.deliverySlots)
      ? r.data.deliverySlots.join('\n')
      : '';
    initFaqDraftFromLoaded(r.data.deliveryFaq);
    initPollDraftFromLoaded(r.data.sitePolls);
    initAboutCertsDraftFromLoaded(r.data.aboutCertificates);
    initCoveragePanelFromLoaded(r.data.deliveryCoverage);
  }

  /** @param {'stats'|'staff'|'products'|'settings'} pane */
  function setActivePane(pane) {
    document.querySelectorAll('.admin-pane').forEach((el) => {
      el.classList.toggle('hidden', el.getAttribute('data-pane') !== pane);
    });
    document.querySelectorAll('.admin-subtab').forEach((btn) => {
      const isSame = btn.getAttribute('data-admin-pane') === pane;
      btn.classList.toggle('is-active', Boolean(isSame));
    });
    if (pane === 'stats') startStatsLiveRefresh();
    else stopStatsLiveRefresh();
    try {
      localStorage.setItem('ekvaline_admin_pane', pane);
    } catch {
      /* ignore */
    }
  }

  function openEditProduct(pid) {
    const p = products.find((x) => String(x.id) === String(pid));
    if (!p || !(editForm instanceof HTMLFormElement) || !(editModal instanceof HTMLElement)) return;
    editForm.elements.namedItem('product_id').value = String(p.id);
    editForm.elements.namedItem('name').value = p.name || '';
    editForm.elements.namedItem('description').value = p.description || '';
    editForm.elements.namedItem('price').value = String(Number(p.price || 0));
    const vol =
      p.volume_liters !== null && p.volume_liters !== undefined && `${p.volume_liters}` !== '' ? String(p.volume_liters) : '';
    editForm.elements.namedItem('volume_liters').value = vol;
    editForm.elements.namedItem('sort_order').value = String(p.sort_order ?? 0);
    editForm.elements.namedItem('catalog_mode').value = productCatalogMode(p);
    if (editCategory instanceof HTMLSelectElement) {
      renderCategoriesInto(editCategory);
      editCategory.value = String(p.category_id || '');
    }
    showMsg(editMsg, '');
    editModal.hidden = false;
    editModal.setAttribute('aria-hidden', 'false');
    refreshCharCounters(editModal);
  }

  function closeEditProduct() {
    if (!(editModal instanceof HTMLElement)) return;
    editModal.hidden = true;
    editModal.setAttribute('aria-hidden', 'true');
  }

  async function submitCreateUser(event) {
    event.preventDefault();
    if (!(createUserForm instanceof HTMLFormElement)) return;
    const role = String(createUserForm.elements.namedItem('role')?.value || '');
    const email = String(createUserForm.elements.namedItem('email')?.value || '').trim().toLowerCase();
    const phone = String(createUserForm.elements.namedItem('phone')?.value || '').replace(/\D/g, '');
    const password = String(createUserForm.elements.namedItem('password')?.value || '');
    const pwdErr = validateStaffPasswordClient(password);
    if (pwdErr) return showMsg(userMsg, pwdErr);
    if (!/^7\d{10}$/.test(phone)) {
      return showMsg(userMsg, 'Телефон: 11 цифр, начинается с 7 (например 79001234567).');
    }
    if (['operator', 'manager', 'admin', 'driver'].includes(role) && !email.includes('@')) {
      return showMsg(userMsg, 'Для сотрудника укажите email — вход только по email.');
    }
    const payload = {
      first_name: String(createUserForm.elements.namedItem('first_name')?.value || '').trim(),
      last_name: String(createUserForm.elements.namedItem('last_name')?.value || '').trim(),
      email,
      phone,
      password,
      role,
    };
    if (role === 'driver') {
      const manualLabel = String(createUserForm.elements.namedItem('driver_route_label')?.value || '').trim();
      const autoLabel = deriveDriverRouteLabelPreview();
      payload.driver_route_label = manualLabel || autoLabel;
    }
    const r = await api.json('/api/admin/users', { method: 'POST', body: payload });
    if (!r.ok) return showMsg(userMsg, localizeApiError(r.data?.error) || 'Не удалось создать пользователя');
    api.resetCsrf();
    createUserForm.reset();
    refreshCharCounters(createUserForm);
    syncAdminDriverLabelField();
    const routeLabel =
      role === 'driver'
        ? String(r.data?.user?.driver_route_label || payload.driver_route_label || deriveDriverRouteLabelPreview()).trim()
        : '';
    showMsg(
      userMsg,
      role === 'driver'
        ? `Водитель создан. Вход: ${email} и заданный пароль (страница driver.html). В списке оператора: «${routeLabel || 'Имя Фамилия'}».`
        : `Учётная запись создана. Вход: email ${email}, пароль — как задали при создании.`,
      true
    );
    await Promise.all([loadUsers(), refreshStatsIfActive()]);
    if (role === 'driver') window.EkvalineOrdersSync?.notifyOrdersDataChanged?.();
  }

  async function submitCreateProduct(event) {
    event.preventDefault();
    if (!(createProductForm instanceof HTMLFormElement)) return;
    const built = readProductPayloadFromForm(createProductForm);
    if (!built.ok) return showMsg(productMsg, built.error);
    const r = await api.json('/api/admin/products', { method: 'POST', body: built.payload });
    if (!r.ok) return showMsg(productMsg, localizeApiError(r.data?.error) || 'Не удалось создать товар');
    api.resetCsrf();
    createProductForm.reset();
    refreshCharCounters(createProductForm);
    showMsg(productMsg, 'Товар добавлен.', true);
    await Promise.all([loadProducts(), refreshStatsIfActive()]);
  }

  async function submitProductEdit(event) {
    event.preventDefault();
    if (!(editForm instanceof HTMLFormElement)) return;
    const id = Number(editForm.elements.namedItem('product_id')?.value || 0);
    if (!id) return;
    const built = readProductPayloadFromForm(editForm);
    if (!built.ok) return showMsg(editMsg, built.error);
    const { stock: _drop, ...body } = built.payload;
    const r = await api.json(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body });
    if (!r.ok) {
      showMsg(editMsg, localizeApiError(r.data?.error) || 'Не сохранено');
      return;
    }
    api.resetCsrf();
    showMsg(editMsg, 'Сохранено.', true);
    closeEditProduct();
    await Promise.all([loadProducts(), refreshStatsIfActive()]);
  }

  async function patchStaffUser(userId, body, errorHint) {
    const r = await api.json(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body });
    if (!r.ok) {
      showMsg(userMsg, localizeApiError(r.data?.error) || errorHint || 'Не удалось сохранить изменения.');
      return false;
    }
    api.resetCsrf();
    await Promise.all([loadUsers(), refreshStatsIfActive()]);
    return true;
  }

  async function deleteStaffUser(userId) {
    const user = users.find((u) => String(u.id) === String(userId));
    if (!user) return;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'сотрудника';
    const ok = await openAdminConfirmModal({
      title: 'Удалить сотрудника?',
      message: `Учётная запись «${name}» будет удалена без возможности восстановления.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!ok) return;
    const r = await api.json(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    if (!r.ok) {
      showMsg(userMsg, localizeApiError(r.data?.error) || 'Не удалось удалить учётную запись.');
      return;
    }
    api.resetCsrf();
    await Promise.all([loadUsers(), refreshStatsIfActive()]);
    showMsg(userMsg, r.data?.message || 'Учётная запись удалена.', true);
  }

  async function onStaffListsClick(ev) {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;

    const changePwBtn = target.closest('[data-staff-pw-change]');
    const changePwId = changePwBtn instanceof HTMLElement ? changePwBtn.getAttribute('data-staff-pw-change') : null;
    if (changePwId) {
      const user = users.find((u) => String(u.id) === changePwId);
      if (!user) return;
      openAdminStaffPasswordModal(user);
      return;
    }

    const blockBtn = target.closest('[data-block-id]');
    const blockId = blockBtn instanceof HTMLElement ? blockBtn.getAttribute('data-block-id') : null;
    if (blockId) {
      const user = users.find((u) => String(u.id) === blockId);
      if (!user) return;
      const wasBlocked = Boolean(user.blocked);
      const ok = await patchStaffUser(blockId, { blocked: wasBlocked ? 0 : 1 }, 'Не удалось изменить блокировку.');
      if (ok) {
        showMsg(userMsg, wasBlocked ? 'Пользователь разблокирован.' : 'Пользователь заблокирован.', true);
      }
      return;
    }

    const deleteBtn = target.closest('[data-staff-delete]');
    const deleteId = deleteBtn instanceof HTMLElement ? deleteBtn.getAttribute('data-staff-delete') : null;
    if (deleteId) {
      await deleteStaffUser(deleteId);
      return;
    }

    const selEl = target instanceof HTMLSelectElement ? target : null;
    if (selEl && selEl.hasAttribute('data-role-id')) {
      const userId = selEl.getAttribute('data-role-id');
      const user = users.find((u) => String(u.id) === userId);
      const prevRole = String(user?.role || selEl.value);
      const nextRole = selEl.value;
      if (prevRole === nextRole) return;
      const ok = await patchStaffUser(userId, { role: nextRole }, 'Не удалось сменить роль.');
      if (!ok) selEl.value = prevRole;
      else showMsg(userMsg, `Роль изменена на «${roleLabel(nextRole)}».`, true);
      return;
    }
  }

  async function onProductsClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteId = target.getAttribute('data-delete-product');
    if (deleteId) {
      const ok = await openAdminConfirmModal({
        title: 'Удалить товар?',
        message: 'Товар будет удалён из базы каталога. Отменить удаление через эту панель нельзя.',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        danger: true,
      });
      if (!ok) return;
      const r = await api.json(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      if (r.ok) {
        api.resetCsrf();
        await Promise.all([loadProducts(), refreshStatsIfActive()]);
      }
      return;
    }
    const editId = target.getAttribute('data-edit-product');
    if (editId) openEditProduct(editId);
  }

  adminAppRoot?.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLSelectElement && t.hasAttribute('data-role-id')) onStaffListsClick(ev);
  });
  if (adminStaffPasswordForm instanceof HTMLFormElement) {
    adminStaffPasswordForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      void saveStaffPasswordFromModal();
    });
  }
  if (adminStaffNewPassword instanceof HTMLInputElement) {
    adminStaffNewPassword.addEventListener('input', () => {
      const authPw = window.EkvalineAuthPassword;
      if (adminStaffPasswordStrength instanceof HTMLElement && authPw?.getPasswordStrength) {
        adminStaffPasswordStrength.textContent = authPw.getPasswordStrength(adminStaffNewPassword.value).line;
      }
    });
  }

  adminAppRoot?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLElement && t.closest('[data-close-staff-password]')) {
      closeAdminStaffPasswordModal();
      return;
    }
    if (t instanceof HTMLElement && t.closest('#adminPaneStaff')) onStaffListsClick(ev);
    if (t instanceof HTMLElement && t.closest('#adminProductsList')) onProductsClick(ev);
    if (t instanceof HTMLElement && t.getAttribute('data-close-product-modal') === 'true') closeEditProduct();
    if (t instanceof HTMLElement && t.closest('[data-close-faq-add-modal]')) closeFaqAddModal();
    if (t instanceof HTMLElement && t.closest('[data-close-faq-edit-modal]')) closeFaqEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-about-cert-edit-modal]')) closeAboutCertEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-about-cert-add-modal]')) closeAboutCertAddModal();
    if (t instanceof HTMLElement && t.closest('[data-close-coverage-card-edit-modal]')) closeCoverageCardEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-coverage-card-add-modal]')) closeCoverageCardAddModal();
  });

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      if (api) {
        try {
          await api.json('/api/auth/logout', { method: 'POST', body: {} });
          api.resetCsrf?.();
        } catch {
          /* ignore */
        }
      }
      try {
        localStorage.removeItem(CURRENT_USER_KEY);
      } catch {
        /* ignore */
      }
      window.location.replace(new URL('index.html', window.location.href).href);
    });
  }

  document.querySelectorAll('.admin-subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pane = btn.getAttribute('data-admin-pane');
      if (pane) setActivePane(/** @type {'stats'|'staff'|'products'|'settings'} */ (pane));
    });
  });

  editForm?.addEventListener('submit', submitProductEdit);

  async function init() {
    const ok = await ensureAdmin();
    if (!ok) return;
    showAppWorkspace();

    let savedPane = 'stats';
    try {
      const p = localStorage.getItem('ekvaline_admin_pane');
      if (p === 'staff' || p === 'products' || p === 'settings' || p === 'stats') savedPane = p;
    } catch {
      /* ignore */
    }
    setActivePane(savedPane);

    createUserForm?.addEventListener('submit', submitCreateUser);
    createUserRoleSelect?.addEventListener('change', syncAdminDriverLabelField);
    createUserForm?.addEventListener('input', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      if (String(createUserRoleSelect?.value || '') !== 'driver') return;
      if (!['first_name', 'last_name'].includes(String(t.getAttribute('name') || ''))) return;
      syncAdminDriverLabelField();
    });
    createProductForm?.addEventListener('submit', submitCreateProduct);
    bindProductNumericInputs(createProductForm);
    bindProductNumericInputs(editForm);
    settingsForm?.addEventListener('submit', (ev) => ev.preventDefault());

    deliveryFaqNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-faq-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-faq-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= faqDraft.length) return;
      openFaqEditModal(idx);
    });

    deliveryFaqAddBtn?.addEventListener('click', () => openFaqAddModal());

    adminAboutCertsNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-about-cert-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-about-cert-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= aboutCertsDraft.length) return;
      openAboutCertEditModal(idx);
    });

    adminAboutCertAddBtn?.addEventListener('click', () => openAboutCertAddModal());

    adminCoverageCardsNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-coverage-card-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-coverage-card-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= coverageCardsDraft.length) return;
      openCoverageCardEditModal(idx);
    });

    adminCoverageCardAddBtn?.addEventListener('click', () => openCoverageCardAddModal());
    adminDeliveryCoverageTitle?.addEventListener('input', () => scheduleCoverageTitleAutoSave());
    adminDeliveryCoverageTitle?.addEventListener('blur', () => void saveCoverageTitleNow());

    adminFaqEditConfirm?.addEventListener('click', () => void submitFaqEditModal());
    adminFaqEditDelete?.addEventListener('click', () => void deleteFaqFromEditModal());
    adminFaqAddConfirm?.addEventListener('click', () => void submitFaqAddFromModal());

    adminAboutCertEditImageFile?.addEventListener('change', () => {
      const card =
        adminAboutCertEditModal instanceof HTMLElement
          ? adminAboutCertEditModal.querySelector('.admin-edit-modal-card')
          : null;
      void applyAboutCertPickedImageFile(
        adminAboutCertEditImageFile,
        adminAboutCertEditImage,
        adminAboutCertEditModalMsg,
        card instanceof HTMLElement ? card : adminAboutCertEditModal
      );
    });
    adminAboutCertAddImageFile?.addEventListener('change', () => {
      const card =
        adminAboutCertAddModal instanceof HTMLElement
          ? adminAboutCertAddModal.querySelector('.admin-edit-modal-card')
          : null;
      void applyAboutCertPickedImageFile(
        adminAboutCertAddImageFile,
        adminAboutCertAddImage,
        adminAboutCertAddModalMsg,
        card instanceof HTMLElement ? card : adminAboutCertAddModal
      );
    });

    adminAboutCertEditConfirm?.addEventListener('click', () => void submitAboutCertEditModal());
    adminAboutCertEditDelete?.addEventListener('click', () => void deleteAboutCertFromEditModal());
    adminAboutCertAddConfirm?.addEventListener('click', () => void submitAboutCertAddFromModal());

    adminCoverageCardEditConfirm?.addEventListener('click', () => void submitCoverageCardEditModal());
    adminCoverageCardEditDelete?.addEventListener('click', () => void deleteCoverageCardFromEditModal());
    adminCoverageCardAddConfirm?.addEventListener('click', () => void submitCoverageCardAddFromModal());

    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      if (adminConfirmModal instanceof HTMLElement && !adminConfirmModal.hidden) {
        closeAdminConfirmModal(false);
        return;
      }
      if (editModal instanceof HTMLElement && !editModal.hidden) return;
      if (adminFaqEditModal instanceof HTMLElement && !adminFaqEditModal.hidden) {
        closeFaqEditModal();
        return;
      }
      if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
        closeFaqAddModal();
        return;
      }
      if (adminAboutCertEditModal instanceof HTMLElement && !adminAboutCertEditModal.hidden) {
        closeAboutCertEditModal();
        return;
      }
      if (adminAboutCertAddModal instanceof HTMLElement && !adminAboutCertAddModal.hidden) {
        closeAboutCertAddModal();
        return;
      }
      if (adminCoverageCardEditModal instanceof HTMLElement && !adminCoverageCardEditModal.hidden) {
        closeCoverageCardEditModal();
        return;
      }
      if (adminCoverageCardAddModal instanceof HTMLElement && !adminCoverageCardAddModal.hidden) {
        closeCoverageCardAddModal();
        return;
      }
    });

    await Promise.all([loadUsers(), loadProducts(), loadSettings()]);
    initStatsPanel();
    refreshCharCounters(adminAppRoot);
    syncAdminDriverLabelField();
    adminAppRoot?.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) syncOneCharCounter(t);
    });
  }

  adminConfirmModal?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-admin-confirm-dismiss]')) closeAdminConfirmModal(false);
  });
  adminConfirmOk?.addEventListener('click', () => closeAdminConfirmModal(true));

  init();
})();
