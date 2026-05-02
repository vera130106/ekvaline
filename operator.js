(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_LOCAL_KEY = 'ekvaline_orders_by_user';
  const USERS_LOCAL_KEY = 'ekvaline_users';
  const BODY = document.getElementById('opxOrdersBody');
  const SEARCH = document.getElementById('opxSearchInput');
  const STATUS = document.getElementById('opxStatusFilter');
  const DATE = document.getElementById('opxDateFilter');
  const CLEAR_DATE = document.getElementById('opxClearDateBtn');
  const DAY_BTNS = Array.from(document.querySelectorAll('[data-opx-day]'));
  const REFRESH = document.getElementById('opxRefreshBtn');
  const LOGOUT = document.getElementById('opxLogoutBtn');
  const COUNT = document.getElementById('opxOrdersCount');
  const TOTAL_SUM = document.getElementById('opxTotalSum');
  const TOTAL_ITEMS = document.getElementById('opxTotalItems');
  const NEW_COUNT = document.getElementById('opxNewCount');
  const TAB_ORDERS = document.getElementById('opxTabOrders');
  const TAB_MAP = document.getElementById('opxTabMap');
  const TAB_REPORTS = document.getElementById('opxTabReports');
  const TOAST = document.getElementById('opxToast');
  const TOAST_TEXT = document.getElementById('opxToastText');
  const ZONE_MAP_OVERLAY = document.getElementById('opxZoneMapOverlay');
  const ZONE_MAP_CANVAS = document.getElementById('opxZoneMapCanvas');
  const ZONE_MAP_CLOSE = document.getElementById('opxCloseZoneMap');
  const REPORTS_OVERLAY = document.getElementById('opxReportsOverlay');
  const REPORTS_DATE_FROM = document.getElementById('opxReportsDateFrom');
  const REPORTS_DATE_TO = document.getElementById('opxReportsDateTo');
  const REPORTS_BUILD_BTN = document.getElementById('opxReportsBuildBtn');
  const REPORTS_CLOSE = document.getElementById('opxCloseReports');
  const REPORTS_BODY = document.getElementById('opxReportsBody');
  const REPORTS_ORDERS = document.getElementById('opxReportOrdersCount');
  const REPORTS_ITEMS = document.getElementById('opxReportItemsCount');
  const REPORTS_SUM = document.getElementById('opxReportTotalSum');
  const REPORTS_DELIVERED = document.getElementById('opxReportDeliveredCount');
  const ORDER_MODAL = document.getElementById('opxOrderModal');
  const ORDER_TAB_BTNS = Array.from(document.querySelectorAll('[data-opx-ord-tab]'));
  const ORDER_PANELS = Array.from(document.querySelectorAll('[data-opx-ord-panel]'));
  const ORDER_JOURNAL_LIST = document.getElementById('opxOrderJournalList');
  const ORDER_MODAL_CLOSE = document.getElementById('opxModalClose');
  const ORDER_MODAL_TITLE = document.getElementById('opxModalTitle');
  const MODAL_ORDER_ID = document.getElementById('opxModalOrderId');
  const MODAL_STATUS = document.getElementById('opxModalStatus');
  const MODAL_CLIENT = document.getElementById('opxModalClient');
  const MODAL_PHONE = document.getElementById('opxModalPhone');
  const MODAL_ADDRESS = document.getElementById('opxModalAddress');
  const MODAL_ZONE = document.getElementById('opxModalZone');
  const MODAL_DELIVERY_DATE = document.getElementById('opxModalDeliveryDate');
  const MODAL_DATE_TODAY = document.getElementById('opxModalDateToday');
  const MODAL_DATE_TOMORROW = document.getElementById('opxModalDateTomorrow');
  const MODAL_DATE_MONDAY = document.getElementById('opxModalDateMonday');
  const MODAL_SLOT = document.getElementById('opxModalSlot');
  const MODAL_SLOT_BTNS = Array.from(document.querySelectorAll('[data-opx-slot]'));
  const MODAL_TIME_FROM = document.getElementById('opxModalTimeFrom');
  const MODAL_TIME_TO = document.getElementById('opxModalTimeTo');
  const MODAL_PAYMENT = document.getElementById('opxModalPayment');
  const MODAL_PICKUP = document.getElementById('opxModalPickup');
  const MODAL_PRODUCT = document.getElementById('opxModalProduct');
  const MODAL_QTY = document.getElementById('opxModalQty');
  const MODAL_UNIT_PRICE = document.getElementById('opxModalUnitPrice');
  const MODAL_SUM = document.getElementById('opxModalSum');
  const MODAL_DRIVER = document.getElementById('opxModalDriver');
  const MODAL_NOTE = document.getElementById('opxModalNote');
  const MODAL_SAVE_BTN = document.getElementById('opxModalSaveBtn');
  const MODAL_CANCEL_BTN = document.getElementById('opxModalCancelBtn');
  const OPEN_CLIENT_CARD_BTN = document.getElementById('opxOpenClientCardBtn');
  const CLIENT_CARD_MODAL = document.getElementById('opxClientCardModal');
  const CLIENT_CARD_CLOSE = document.getElementById('opxClientCardClose');
  const CLIENT_CARD_SAVE = document.getElementById('opxClientCardSaveBtn');
  const CLIENT_CARD_CANCEL = document.getElementById('opxClientCardCancelBtn');
  const CLIENT_NAME_INPUT = document.getElementById('opxClientNameInput');
  const CLIENT_PHONE_INPUT = document.getElementById('opxClientPhoneInput');
  const CLIENT_ADDRESS_INPUT = document.getElementById('opxClientAddressInput');
  const CLIENT_CARD_TAB_BTNS = Array.from(document.querySelectorAll('[data-opx-cc-tab]'));
  const CLIENT_CARD_PANELS = Array.from(document.querySelectorAll('[data-opx-cc-panel]'));
  const CLIENT_ORDERS_HISTORY = document.getElementById('opxClientOrdersHistory');
  const CLIENT_PRICE_MODE = document.getElementById('opxClientPriceMode');
  const CLIENT_PRICE_VALUE = document.getElementById('opxClientPriceValue');
  const CLIENT_PRICE_PRODUCT = document.getElementById('opxClientPriceProduct');
  const CLIENT_PRICE_PRODUCT_VALUE = document.getElementById('opxClientPriceProductValue');
  const CLIENT_PRICE_ITEMS = document.getElementById('opxClientPriceItems');
  const CLIENT_JOURNAL_LIST = document.getElementById('opxClientJournalList');
  const OPEN_CLIENT_MAP_BTN = document.getElementById('opxOpenClientMapBtn');
  const CLIENT_MAP_MODAL = document.getElementById('opxClientMapModal');
  const CLIENT_MAP_CLOSE = document.getElementById('opxClientMapClose');
  const CLIENT_MAP_CANCEL = document.getElementById('opxClientMapCancelBtn');
  const CLIENT_MAP_APPLY = document.getElementById('opxClientMapApplyBtn');
  const CLIENT_MAP_CITY = document.getElementById('opxClientMapCity');
  const CLIENT_MAP_STREET = document.getElementById('opxClientMapStreet');
  const CLIENT_MAP_HOUSE = document.getElementById('opxClientMapHouse');
  const CLIENT_MAP_APARTMENT = document.getElementById('opxClientMapApartment');
  const CLIENT_MAP_ENTRANCE = document.getElementById('opxClientMapEntrance');
  const CLIENT_MAP_FLOOR = document.getElementById('opxClientMapFloor');
  const CLIENT_MAP_SEARCH = document.getElementById('opxClientMapSearch');
  const STREET_SUGGEST_BOX = document.getElementById('opxStreetSuggestBox');
  const CLIENT_MAP_SEARCH_BTN = document.getElementById('opxClientMapSearchBtn');
  const CLIENT_MAP_CLEAR_BTN = document.getElementById('opxClientMapClearBtn');
  const CLIENT_MAP_SELECTED = document.getElementById('opxClientMapSelectedAddress');
  const CLIENT_MAP_CANVAS = document.getElementById('opxClientMapCanvas');

  const state = {
    orders: [],
    filtered: [],
    query: '',
    status: 'all',
    date: '',
    toastTimer: null,
    activeOrderId: '',
    activeOrderIndex: -1,
    mapSelectedAddress: '',
    mapSelectedCoords: null,
    streetSuggestTimer: null,
    mapAutoLocateTimer: null,
    streetCache: {},
    clientCardTab: 'client',
    orderModalTab: 'basic',
    zoneMapOpen: false,
    reportsOpen: false,
  };
  const CLIENT_PRICE_OVERRIDES_KEY = 'ekvaline_client_price_overrides';
  const CLIENT_PRODUCT_PRICES_KEY = 'ekvaline_client_product_prices';
  const ORDER_JOURNAL_KEY = 'ekvaline_order_journal';

  const couriers = ['Казаченко Сергей', 'Комаров Сергей', 'Лукашин Евгений', 'Макаров Александр', 'Кравцов Илья'];
  const products = ['Вода', 'Тара', 'Помпа электрическая', 'Помпа механическая', 'Кулер верхний', 'Кулер нижний', 'Стаканчики'];
  const districts = ['Подхват', 'Степной', 'Центр', 'доп.зона'];
  const streetFallback = [
    'Салмышская', 'Родимцева', 'Пролетарская', 'Просторная', 'Терешковой', 'Чкалова', 'Советская',
    'Туркестанская', 'Брестская', 'Комсомольская', 'Победы', 'Донгузская', 'Монтажников', 'Новая',
    'Гаранькина', 'Ткачева', 'Автомобилистов', 'Поляничко', 'Дзержинского', 'Карпова', 'Красносельная', 'Нежинское',
    'Степная', 'Станкостроителей', 'Студенческая', 'Строителей', 'Северная', 'Самолетная', 'Саморядова'
  ];
  let clientMap = null;
  let clientMapMarker = null;
  let zoneMap = null;
  let zoneMapLayer = null;
  /** Успешно геокодированные точки по нормализованному ключу адреса */
  const ZONE_ADDRESS_COORD_CACHE = new Map();
  /** Адрес геокодировался без результата — не дергать Nominatim повторно в сессии */
  const ZONE_ADDRESS_GEO_NO_RESULT = new Set();
  let zoneMarkersBuildGeneration = 0;
  let zoneMarkersRedrawTimer = null;
  let zoneNominatimLastCall = 0;

  const statusLabels = {
    new: 'Новый',
    pending_operator: 'В обработке',
    processing: 'В обработке',
    confirmed: 'Подтвержден',
    courier: 'В работе',
    on_way: 'В работе',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
  };
  const SLOT_PRESETS = {
    '09:00-14:00': { from: '09:00', to: '14:00' },
    '14:00-17:00': { from: '14:00', to: '17:00' },
    '17:00-21:00': { from: '17:00', to: '21:00' },
    '09:00-17:00': { from: '09:00', to: '17:00' },
  };
  const ZONE_COLORS = {
    'Подхват': '#e53935',
    'Степной': '#fb8c00',
    'Центр': '#1e88e5',
    delivered: '#43a047',
  };
  const ZONE_CENTERS = {
    'Подхват': [51.805, 55.108],
    'Степной': [51.838, 55.165],
    'Центр': [51.772, 55.102],
  };
  const PRODUCT_PRICE_MAP = {
    'Вода': 220,
    'Тара': 150,
    'Помпа электрическая': 1800,
    'Помпа механическая': 350,
    'Кулер верхний': 8900,
    'Кулер нижний': 12500,
    'Стаканчики': 120,
  };
  const ORENBURG_VIEWBOX = {
    left: 54.85,
    top: 51.92,
    right: 55.32,
    bottom: 51.62,
  };

  /** Убираем телефон и лишние пробелы из строки адреса перед геокодированием */
  function cleanOrderAddressForGeocode(raw) {
    return String(raw || '')
      .replace(/\+?\d[\d\s().\-–—]{11,}\d/g, '')
      .replace(/8\s*\(\s*\d{3}\s*\)\s*[\d\s().\-–—]{6,}/g, '')
      .replace(/\(?\s*\d{3}\s*\)?\s*[\d\-–—\s]{7,}\d/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function normalizedGeoKey(raw) {
    const c = cleanOrderAddressForGeocode(raw).replace(/,/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    return c;
  }

  function geoCacheKeyForOrder(order) {
    const k = normalizedGeoKey(String(order?.address || ''));
    if (k) return k;
    return `__orphan:${String(order?.id ?? '')}`;
  }

  function buildZoneMapGeocodeQuery(addressRaw) {
    const c = cleanOrderAddressForGeocode(addressRaw);
    if (!c) return 'Оренбург, Россия';
    if (/оренбург/i.test(c)) return `${c}, Россия`;
    return `${c}, Оренбург, Россия`;
  }

  /** Сдвиг точек для нескольких заказов по одному адресу */
  function microJitterLatLng(lat, lng, duplicateIndex) {
    if (!(duplicateIndex > 0)) return [lat, lng];
    const step = 0.000068;
    const a = duplicateIndex * 1.12;
    return [lat + Math.sin(a) * step * duplicateIndex, lng + Math.cos(a) * step * duplicateIndex];
  }

  function coordsInOrenburgView(lat, lng) {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat <= ORENBURG_VIEWBOX.top &&
      lat >= ORENBURG_VIEWBOX.bottom &&
      lng >= ORENBURG_VIEWBOX.left &&
      lng <= ORENBURG_VIEWBOX.right
    );
  }

  async function nominatimThrottleZoneMap() {
    const now = Date.now();
    const wait = Math.max(0, 1120 - (now - zoneNominatimLastCall));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    zoneNominatimLastCall = Date.now();
  }

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function ensureAccess() {
    const user = readUser();
    if (!user || !['operator', 'manager', 'admin'].includes(String(user.role || '').toLowerCase())) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function showToast(text) {
    if (!(TOAST instanceof HTMLElement) || !(TOAST_TEXT instanceof HTMLElement)) return;
    TOAST_TEXT.textContent = String(text || '');
    TOAST.hidden = false;
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      TOAST.hidden = true;
    }, 1800);
  }

  function isoDate(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function ruDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);
  }

  function ruDateTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const datePart = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
    return { datePart, timePart };
  }

  function money(n) {
    const v = Number(n) || 0;
    return `${Math.round(v).toLocaleString('ru-RU')},0`;
  }

  function readStore(key, fallback) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return raw ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeClientKey(order) {
    const phone = String(order?.phone || '').replace(/[^\d+]/g, '');
    const client = normalizeToken(order?.client || '');
    return phone || client || String(order?.id || '');
  }

  function getActorLabel() {
    const user = readUser();
    if (!user) return 'Система';
    return String(user.name || user.email || user.role || 'Оператор');
  }

  function appendOrderJournal(orderId, message) {
    const map = readStore(ORDER_JOURNAL_KEY, {});
    const idKey = String(orderId || '').trim();
    const list = Array.isArray(map[idKey]) ? map[idKey] : [];
    list.unshift({ at: new Date().toISOString(), actor: getActorLabel(), message: String(message || '').trim() });
    map[idKey] = list.slice(0, 120);
    writeStore(ORDER_JOURNAL_KEY, map);
  }

  function getOrderJournal(orderId) {
    const map = readStore(ORDER_JOURNAL_KEY, {});
    return Array.isArray(map[String(orderId || '').trim()]) ? map[String(orderId || '').trim()] : [];
  }

  function journalActionLabel(action) {
    const map = {
      order_create: 'Создан заказ',
      order_patch: 'Изменён заказ',
      order_client_update: 'Изменён заказ клиентом',
      order_cancel: 'Заказ отменён',
      admin_address_create: 'Добавлен адрес доставки',
      admin_address_patch: 'Изменён адрес доставки',
      admin_address_delete: 'Удалён адрес доставки',
      admin_zone_patch: 'Изменена зона доставки',
      manager_settings: 'Изменены настройки менеджером',
      admin_user_patch: 'Изменён пользователь админом',
      login: 'Вход в систему',
      logout: 'Выход из системы',
    };
    return map[String(action || '')] || String(action || 'Изменение');
  }

  function renderJournalListHtml(entries) {
    if (!entries.length) return '<p class="opx-cc-empty">Изменений пока нет.</p>';
    return entries
      .map((entry) => {
        const ts = entry.created_at || entry.at;
        const dt = ruDateTime(ts);
        const dtText = typeof dt === 'object' ? `${dt.datePart} ${dt.timePart}` : String(ts || '');
        if (entry.action) {
          const actor = `[${String(entry.actor_role || 'system')}] ${String(entry.actor_name || 'Система')}`;
          const details = String(entry.detail || '').trim();
          const msg = details ? `${journalActionLabel(entry.action)} (${details})` : journalActionLabel(entry.action);
          return `<div class="opx-cc-item"><strong>${escapeHtml(dtText)}</strong><span>${escapeHtml(actor)}: ${escapeHtml(msg)}</span></div>`;
        }
        return `<div class="opx-cc-item"><strong>${escapeHtml(dtText)}</strong><span>${escapeHtml(
          String(entry.actor || 'Система')
        )}: ${escapeHtml(String(entry.message || 'Изменение'))}</span></div>`;
      })
      .join('');
  }

  async function fetchServerJournal(orderId) {
    const api = window.EkvalineAPI;
    if (!api || !orderId) return [];
    const response = await api.json(`/api/orders/${encodeURIComponent(orderId)}/journal`);
    if (!response.ok) return [];
    return Array.isArray(response.data?.journal) ? response.data.journal : [];
  }

  async function renderOrderJournal(order) {
    if (!(ORDER_JOURNAL_LIST instanceof HTMLElement)) return;
    if (!order?.id) {
      ORDER_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Заказ не выбран.</p>';
      return;
    }
    try {
      const [serverEntries, localEntries] = await Promise.all([
        fetchServerJournal(order.id),
        Promise.resolve(getOrderJournal(order.id)),
      ]);
      const merged = [...serverEntries, ...localEntries].sort(
        (a, b) => new Date(b.created_at || b.at || 0).getTime() - new Date(a.created_at || a.at || 0).getTime()
      );
      ORDER_JOURNAL_LIST.innerHTML = renderJournalListHtml(merged.slice(0, 300));
    } catch {
      ORDER_JOURNAL_LIST.innerHTML = renderJournalListHtml(getOrderJournal(order.id));
    }
  }

  function nextMondayIsoDate() {
    const d = new Date();
    const day = d.getDay();
    const delta = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + delta);
    return isoDate(d);
  }

  function updateQuickDateButtons() {
    const selected = String(MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '');
    const today = isoDate(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = isoDate(tomorrowDate);
    const monday = nextMondayIsoDate();
    MODAL_DATE_TODAY?.classList.toggle('is-active', selected === today);
    MODAL_DATE_TOMORROW?.classList.toggle('is-active', selected === tomorrow);
    MODAL_DATE_MONDAY?.classList.toggle('is-active', selected === monday);
  }

  function setModalSlot(slotValue) {
    const slot = SLOT_PRESETS[slotValue] ? slotValue : '09:00-14:00';
    setModalValue(MODAL_SLOT, slot);
    const preset = SLOT_PRESETS[slot];
    setModalValue(MODAL_TIME_FROM, preset.from);
    setModalValue(MODAL_TIME_TO, preset.to);
    MODAL_SLOT_BTNS.forEach((btn) => btn.classList.toggle('is-active', btn.getAttribute('data-opx-slot') === slot));
  }

  function setOrderModalTab(tabId) {
    state.orderModalTab = tabId;
    ORDER_TAB_BTNS.forEach((btn) => {
      const active = btn.getAttribute('data-opx-ord-tab') === tabId;
      btn.classList.toggle('is-active', active);
    });
    ORDER_PANELS.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-opx-ord-panel') !== tabId;
    });
  }

  function ensureProductOptions() {
    if (MODAL_PRODUCT instanceof HTMLSelectElement) {
      MODAL_PRODUCT.innerHTML = products.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    }
    if (CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement) {
      CLIENT_PRICE_PRODUCT.innerHTML = products.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    }
  }

  function readClientProductPrices() {
    return readStore(CLIENT_PRODUCT_PRICES_KEY, {});
  }

  function normalizeProductName(rawName) {
    const name = String(rawName || '').trim().toLowerCase();
    if (!name) return products[0];
    if (name.includes('вода')) return 'Вода';
    if (name.includes('тара')) return 'Тара';
    if (name.includes('электр') && name.includes('помп')) return 'Помпа электрическая';
    if (name.includes('механ') && name.includes('помп')) return 'Помпа механическая';
    if (name.includes('кулер') && (name.includes('верх') || name.includes('напольн'))) return 'Кулер верхний';
    if (name.includes('кулер') && (name.includes('ниж') || name.includes('aquaos'))) return 'Кулер нижний';
    if (name.includes('стакан')) return 'Стаканчики';
    return products.includes(rawName) ? rawName : products[0];
  }

  function baseUnitPrice(productName, qty) {
    if (productName === 'Вода') {
      if (qty <= 1) return 220;
      if (qty <= 4) return 190;
      if (qty <= 50) return 175;
      return 175;
    }
    return PRODUCT_PRICE_MAP[productName] || 0;
  }

  function getClientProductPrice(clientKey, productName) {
    const store = readClientProductPrices();
    const byClient = store[clientKey];
    if (!byClient || typeof byClient !== 'object') return null;
    const value = Number(byClient[productName]);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  function getDefaultPriceForOrder(order, productName) {
    const key = normalizeClientKey(order);
    const qty = Math.min(50, Math.max(1, Number(MODAL_QTY instanceof HTMLInputElement ? MODAL_QTY.value : 1) || 1));
    return getClientProductPrice(key, productName) || baseUnitPrice(productName, qty);
  }

  function currentGoodsTotal() {
    const title = normalizeProductName(String(MODAL_PRODUCT instanceof HTMLSelectElement ? MODAL_PRODUCT.value : ''));
    const qty = Math.min(50, Math.max(1, Number(MODAL_QTY instanceof HTMLInputElement ? MODAL_QTY.value : 1) || 1));
    if (MODAL_QTY instanceof HTMLInputElement) MODAL_QTY.value = String(qty);
    const unit = Math.max(0, Number(MODAL_UNIT_PRICE instanceof HTMLInputElement ? MODAL_UNIT_PRICE.value : 0) || 0);
    return Math.round(unit * qty);
  }

  function updateGoodsSumPreview() {
    const total = currentGoodsTotal();
    setModalValue(MODAL_SUM, `${money(total)} ₽`);
  }

  function statusLabel(status) {
    const key = String(status || '').toLowerCase();
    return statusLabels[key] || '—';
  }

  function normalizeZoneName(value) {
    const z = String(value || '').toLowerCase().trim();
    if (!z) return 'Подхват';
    if (z.includes('степ')) return 'Степной';
    if (z.includes('центр')) return 'Центр';
    return 'Подхват';
  }

  function markerColorForOrder(order) {
    if (String(order?.status || '').toLowerCase() === 'delivered') return ZONE_COLORS.delivered;
    return ZONE_COLORS[normalizeZoneName(order?.zone)] || ZONE_COLORS['Подхват'];
  }

  function markerCoordsForOrder(order, indexInZone) {
    const zone = normalizeZoneName(order?.zone);
    const center = ZONE_CENTERS[zone] || ZONE_CENTERS['Подхват'];
    const ring = Math.floor(indexInZone / 8);
    const step = (indexInZone % 8) * (Math.PI / 4);
    const delta = 0.003 + ring * 0.0015;
    const lat = center[0] + Math.sin(step) * delta;
    const lng = center[1] + Math.cos(step) * delta;
    return [lat, lng];
  }

  function ensureZoneMap() {
    if (!(ZONE_MAP_CANVAS instanceof HTMLElement) || !window.L) return false;
    if (zoneMap) return true;
    zoneMap = window.L.map(ZONE_MAP_CANVAS, { zoomControl: true, attributionControl: false }).setView([51.78, 55.11], 11);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(zoneMap);
    zoneMapLayer = window.L.layerGroup().addTo(zoneMap);
    if (!zoneMap._opxPopupActionsBound) {
      zoneMap._opxPopupActionsBound = true;
      zoneMap.getContainer().addEventListener('click', (event) => {
        const btn = event.target.closest('[data-opx-zone-open-client]');
        if (!btn || !zoneMap.getContainer().contains(btn)) return;
        event.preventDefault();
        const oid = btn.getAttribute('data-opx-zone-open-client');
        if (!oid) return;
        zoneMap.closePopup();
        openClientCardFromMap(oid);
      });
    }
    return true;
  }

  function renderZoneFallback() {
    if (!(ZONE_MAP_CANVAS instanceof HTMLElement)) return;
    const zoneOrder = ['Подхват', 'Степной', 'Центр'];
    const zoneColors = {
      'Подхват': '#e53935',
      'Степной': '#fb8c00',
      'Центр': '#1e88e5',
      delivered: '#43a047',
    };
    const source = state.filtered.length ? state.filtered : state.orders;
    const grouped = { 'Подхват': [], 'Степной': [], 'Центр': [] };
    source.forEach((o) => {
      const zone = normalizeZoneName(o.zone);
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(o);
    });
    ZONE_MAP_CANVAS.innerHTML = `
      <div class="opx-zone-map-fallback">
        ${zoneOrder
          .map((zone) => {
            const rows = grouped[zone] || [];
            return `<section class="opx-zone-block">
              <h4>${zone}</h4>
              <div class="opx-zone-orders">
                ${
                  rows.length
                    ? rows
                        .slice(0, 40)
                        .map((o) => {
                          const color = String(o.status) === 'delivered' ? zoneColors.delivered : zoneColors[zone];
                          return `<div class="opx-zone-order" style="background:${color}">${displayOrderId(o.id)} · ${escapeHtml(
                            String(o.client || 'Клиент')
                          )}</div>`;
                        })
                        .join('')
                    : '<div class="opx-cc-empty">Нет заказов</div>'
                }
              </div>
            </section>`;
          })
          .join('')}
      </div>
    `;
  }

  function zoneMapPopupHtml(order, zone, ringColor) {
    const orderId = escapeHtml(displayOrderId(order.id));
    const client = escapeHtml(String(order.client || 'Клиент'));
    const addr = escapeHtml(String(order.address || '').trim() || 'Адрес не указан');
    const oid = String(order.id).replace(/"/g, '');
    const status = escapeHtml(statusLabel(order.status));
    return `
      <div class="opx-zone-popup">
        <div class="opx-zone-popup-head">
          <span class="opx-zone-popup-num">${orderId}</span>
          <span class="opx-zone-popup-zone" style="--opx-zone-ring:${ringColor}">${escapeHtml(zone)}</span>
        </div>
        <div class="opx-zone-popup-client">${client}</div>
        <div class="opx-zone-popup-addr"><strong>Адрес:</strong><br/>${addr}</div>
        <div class="opx-zone-popup-meta">Статус: ${status}</div>
        <button type="button" class="opx-zone-popup-cc" data-opx-zone-open-client="${oid}">Карта клиента</button>
      </div>
    `.trim();
  }

  function openClientCardFromMap(orderId) {
    const key = String(orderId ?? '').trim();
    if (!key || !(CLIENT_CARD_MODAL instanceof HTMLElement)) return;
    const order = state.orders.find((o) => String(o.id).trim() === key);
    if (!order) {
      showToast('Заказ не найден в списке');
      return;
    }
    state.activeOrderId = key;
    openClientCardModal();
    document.body.classList.add('opx-modal-open');
  }

  function renderZoneMapMarkers() {
    if (!state.zoneMapOpen || !zoneMap || !zoneMapLayer || !window.L) return;
    if (zoneMarkersRedrawTimer) window.clearTimeout(zoneMarkersRedrawTimer);
    zoneMarkersRedrawTimer = window.setTimeout(() => {
      zoneMarkersRedrawTimer = null;
      void rebuildZoneMarkersInternal();
    }, 220);
  }

  function openZoneMapOverlay() {
    if (!(ZONE_MAP_OVERLAY instanceof HTMLElement)) return;
    closeReportsOverlay();
    state.zoneMapOpen = true;
    ZONE_MAP_OVERLAY.hidden = false;
    TAB_MAP?.classList.add('is-active');
    TAB_ORDERS?.classList.remove('is-active');
    TAB_REPORTS?.classList.remove('is-active');
    window.setTimeout(() => {
      if (ensureZoneMap()) {
        zoneMap?.invalidateSize();
        renderZoneMapMarkers();
      } else {
        renderZoneFallback();
      }
    }, 60);
  }

  function closeZoneMapOverlay() {
    if (!(ZONE_MAP_OVERLAY instanceof HTMLElement)) return;
    zoneMarkersBuildGeneration += 1;
    if (zoneMarkersRedrawTimer) {
      window.clearTimeout(zoneMarkersRedrawTimer);
      zoneMarkersRedrawTimer = null;
    }
    state.zoneMapOpen = false;
    ZONE_MAP_OVERLAY.hidden = true;
    TAB_MAP?.classList.remove('is-active');
    if (!state.reportsOpen) TAB_ORDERS?.classList.add('is-active');
    if (!(window.L) && ZONE_MAP_CANVAS instanceof HTMLElement) {
      ZONE_MAP_CANVAS.innerHTML = '';
    }
  }

  function closeReportsOverlay() {
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    state.reportsOpen = false;
    REPORTS_OVERLAY.hidden = true;
    TAB_REPORTS?.classList.remove('is-active');
    if (!state.zoneMapOpen) TAB_ORDERS?.classList.add('is-active');
  }

  function switchToOrdersView() {
    closeZoneMapOverlay();
    closeReportsOverlay();
    TAB_ORDERS?.classList.add('is-active');
    TAB_MAP?.classList.remove('is-active');
    TAB_REPORTS?.classList.remove('is-active');
  }

  function normalizePaymentKind(value) {
    const v = String(value || '').toLowerCase();
    if (v.includes('нал')) return 'Наличные';
    if (v.includes('безнал') || v.includes('card') || v.includes('карт')) return 'Безнал';
    if (v.includes('бонус')) return 'Бонусы';
    return 'Прочее';
  }

  function orderItems(order) {
    try {
      const parsed = JSON.parse(order.items_json || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function buildReportsData() {
    const from = REPORTS_DATE_FROM instanceof HTMLInputElement ? REPORTS_DATE_FROM.value : '';
    const to = REPORTS_DATE_TO instanceof HTMLInputElement ? REPORTS_DATE_TO.value : '';
    const filtered = state.orders.filter((o) => {
      const d = isoDate(o.delivery_date || o.created_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    const agg = new Map();
    let ordersCount = filtered.length;
    let itemsCount = 0;
    let totalSum = 0;
    let delivered = 0;

    filtered.forEach((o) => {
      if (String(o.status) === 'delivered') delivered += 1;
      totalSum += Number(o.total_sum) || 0;
      const driver = String(o.driver || 'Не назначен').trim() || 'Не назначен';
      const payment = normalizePaymentKind(o.payment_method);
      const items = orderItems(o);
      if (!items.length) items.push({ title: parseProduct(o.items_json, 0), qty: parseQty(o.items_json) || 1 });
      items.forEach((it) => {
        const product = normalizeProductName(it.title || 'Товар');
        const qty = Number(it.qty) || 0;
        const unit = Number(it.unit_price) || baseUnitPrice(product, Math.max(1, qty));
        const sum = Math.round(unit * qty);
        itemsCount += qty;
        const key = `${driver}|${product}|${payment}`;
        const row = agg.get(key) || { driver, product, payment, qty: 0, sum: 0, orders: new Set() };
        row.qty += qty;
        row.sum += sum;
        row.orders.add(String(o.id));
        agg.set(key, row);
      });
    });

    return {
      rows: Array.from(agg.values())
        .map((r) => ({ ...r, orders: r.orders.size }))
        .sort((a, b) => a.driver.localeCompare(b.driver, 'ru') || a.product.localeCompare(b.product, 'ru')),
      totals: { ordersCount, itemsCount, totalSum, delivered },
    };
  }

  function renderReports() {
    if (!(REPORTS_BODY instanceof HTMLElement)) return;
    const { rows, totals } = buildReportsData();
    REPORTS_BODY.innerHTML = rows.length
      ? rows
          .map(
            (r) => `<tr>
        <td>${escapeHtml(r.driver)}</td>
        <td>${escapeHtml(r.product)}</td>
        <td>${escapeHtml(r.payment)}</td>
        <td>${r.qty}</td>
        <td>${money(r.sum)}</td>
        <td>${r.orders}</td>
      </tr>`
          )
          .join('')
      : '<tr><td colspan="6">Нет данных за выбранный период.</td></tr>';
    if (REPORTS_ORDERS) REPORTS_ORDERS.textContent = String(totals.ordersCount);
    if (REPORTS_ITEMS) REPORTS_ITEMS.textContent = String(totals.itemsCount);
    if (REPORTS_SUM) REPORTS_SUM.textContent = `${money(totals.totalSum)} ₽`;
    if (REPORTS_DELIVERED) REPORTS_DELIVERED.textContent = String(totals.delivered);
  }

  function openReportsOverlay() {
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    closeZoneMapOverlay();
    TAB_MAP?.classList.remove('is-active');
    state.reportsOpen = true;
    REPORTS_OVERLAY.hidden = false;
    TAB_REPORTS?.classList.add('is-active');
    TAB_ORDERS?.classList.remove('is-active');
    if (REPORTS_DATE_FROM instanceof HTMLInputElement && !REPORTS_DATE_FROM.value) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      REPORTS_DATE_FROM.value = isoDate(d);
    }
    if (REPORTS_DATE_TO instanceof HTMLInputElement && !REPORTS_DATE_TO.value) {
      REPORTS_DATE_TO.value = isoDate(new Date());
    }
    renderReports();
  }

  function setModalValue(el, value) {
    const prepared = String(value || '—');
    if (!el) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.value = prepared;
      if (el instanceof HTMLSelectElement && el.value !== prepared && el.options.length) {
        el.selectedIndex = 0;
      }
      return;
    }
    el.textContent = prepared;
  }

  function periodBySlot(slot) {
    const s = String(slot || '');
    if (s.startsWith('09')) return 'утро';
    if (s.startsWith('14')) return 'день';
    if (s.startsWith('17')) return 'вечер';
    return 'рабочее';
  }

  function parseQty(itemsJson) {
    try {
      const items = JSON.parse(itemsJson || '[]');
      if (!Array.isArray(items)) return 0;
      return items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    } catch {
      return 0;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function extractOrderNumber(rawId) {
    if (typeof rawId === 'number' && Number.isFinite(rawId)) return Math.max(0, Math.floor(rawId));
    const text = String(rawId || '').trim();
    let match = text.match(/^ЛС-(\d{1,12})$/i);
    if (match) return Number(match[1]) || 0;
    match = text.match(/^ORD-(\d{3,})$/i);
    if (match) return Number(match[1].slice(-6)) || 0;
    match = text.match(/(\d{3,12})/);
    if (match) return Number(match[1]) || 0;
    return 0;
  }

  function displayOrderId(rawId) {
    const text = String(rawId || '').trim();
    if (/^ЛС-\d{3,}$/i.test(text)) return text.toUpperCase();
    const n = extractOrderNumber(rawId);
    return n > 0 ? `ЛС-${String(n).padStart(6, '0')}` : 'ЛС-000000';
  }

  function parseProduct(itemsJson, fallbackIndex) {
    try {
      const items = JSON.parse(itemsJson || '[]');
      if (Array.isArray(items) && items.length && items[0].title) return normalizeProductName(String(items[0].title));
    } catch {
      /* noop */
    }
    return products[fallbackIndex % products.length];
  }

  function parseUnitPrice(itemsJson) {
    try {
      const items = JSON.parse(itemsJson || '[]');
      if (Array.isArray(items) && items.length) {
        const unit = Number(items[0].unit_price);
        if (Number.isFinite(unit) && unit >= 0) return Math.round(unit);
      }
    } catch {
      /* noop */
    }
    return null;
  }

  function readUsersMap() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_LOCAL_KEY) || '[]');
      if (!Array.isArray(users)) return new Map();
      return new Map(users.map((u) => [String(u?.id ?? ''), u || {}]));
    } catch {
      return new Map();
    }
  }

  function pickFirstFilled(values) {
    for (let i = 0; i < values.length; i += 1) {
      const value = String(values[i] || '').trim();
      if (value) return value;
    }
    return '';
  }

  function resolveClientName(order, fallbackUser) {
    const orgName = pickFirstFilled([
      order?.organization_name,
      order?.organization,
      order?.company_name,
      order?.company,
      order?.legal_entity,
    ]);
    if (orgName) return orgName;

    const fullName = pickFirstFilled([
      [order?.last_name, order?.first_name, order?.patronymic].filter(Boolean).join(' ').trim(),
      [order?.first_name, order?.last_name].filter(Boolean).join(' ').trim(),
      order?.customer_name,
      order?.client_name,
      order?.recipient_name,
      order?.name,
      order?.client,
    ]);
    if (fullName) return fullName;

    const fallbackName = pickFirstFilled([
      fallbackUser?.organization,
      fallbackUser?.company_name,
      fallbackUser?.name,
      [fallbackUser?.last_name, fallbackUser?.first_name].filter(Boolean).join(' ').trim(),
    ]);
    return fallbackName || 'КЛИЕНТ';
  }

  function mapLocalOrders() {
    const usersMap = readUsersMap();
    let raw = {};
    try {
      raw = JSON.parse(localStorage.getItem(ORDERS_LOCAL_KEY) || '{}') || {};
    } catch {
      raw = {};
    }
    const out = [];
    Object.keys(raw).forEach((uid) => {
      const fallbackUser = usersMap.get(String(uid)) || null;
      const list = Array.isArray(raw[uid]) ? raw[uid] : [];
      list.forEach((order, index) => {
        out.push({
          id: order.id || Number((Date.now() % 100000) + index + 1),
          status: order.status || 'new',
          client: resolveClientName(order, fallbackUser),
          address: order.address || '',
          delivery_date: order.deliveryDate || isoDate(order.createdAt),
          delivery_slot: order.deliverySlot || '09:00-14:00',
          total_sum: Number(order.total) || 0,
          payment_method: order.paymentDeferred ? 'безнал.' : 'налич.',
          courier_note: order.comment || '',
          created_at: order.createdAt || new Date().toISOString(),
          items_json: JSON.stringify(order.items || []),
          first_name: '',
          last_name: '',
          phone: String(order.phone || fallbackUser?.phone || '').trim(),
        });
      });
    });
    return out;
  }

  function augmentDemoOrders(list) {
    const base = Array.isArray(list) ? [...list] : [];
    const usedNumbers = new Set();
    let maxOrderNumber = 253399;
    base.forEach((item) => {
      const n = extractOrderNumber(item?.id);
      if (n > 0) {
        usedNumbers.add(n);
        if (n > maxOrderNumber) maxOrderNumber = n;
      }
    });
    const need = Math.max(0, 24 - base.length);
    const now = Date.now();
    for (let i = 0; i < need; i += 1) {
      const dayShift = i % 3;
      const created = new Date(now - (i + 1) * 48 * 60000);
      const delivery = new Date(now + dayShift * 24 * 60 * 60000);
      const slot = ['09:00-14:00', '14:00-17:00', '17:00-21:00'][i % 3];
      const qty = 2 + (i % 5);
      const sum = qty * 190;
      maxOrderNumber += 1;
      while (usedNumbers.has(maxOrderNumber)) maxOrderNumber += 1;
      usedNumbers.add(maxOrderNumber);
      base.push({
        id: `ЛС-${String(maxOrderNumber).padStart(6, '0')}`,
        status: ['new', 'new', 'pending_operator', 'processing'][i % 4],
        client: ['ДИРЕКСКИЙ ЦЕНТР', 'ООО "ФЕРРОНФОРГИК МАШИНЫ"', 'Юлия', 'ЕЛЕНА Петренко', 'ВАЛЕРИЙ'][i % 5],
        phone: `+7 900 100-${String(10 + i).padStart(2, '0')}-${String(20 + i).padStart(2, '0')}`,
        address: ['г. Оренбург, ул. Нежинское, 9', 'г. Оренбург, ул. Карпова, 3', 'г. Оренбург, ул. Красносельная, 66', 'г. Оренбург, ул. Монтажников, 8/2'][i % 4],
        delivery_date: isoDate(delivery),
        delivery_slot: slot,
        total_sum: sum,
        payment_method: i % 2 ? 'безнал.' : 'налич.',
        courier_note: i % 3 ? '' : 'ДОКУМЕНТЫ, звонить за 20 минут',
        created_at: created.toISOString(),
        items_json: JSON.stringify([{ title: products[i % products.length], qty }]),
      });
    }
    return base.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async function loadOrders() {
    const api = window.EkvalineAPI;
    if (!api) {
      state.orders = augmentDemoOrders(mapLocalOrders());
      return;
    }
    const r = await api.json('/api/orders');
    if (!r.ok) {
      state.orders = augmentDemoOrders(mapLocalOrders());
      return;
    }
    const rows = Array.isArray(r.data?.orders) ? r.data.orders : [];
    state.orders = rows.map((o) => ({
      ...o,
      client: resolveClientName(o, null),
    }));
  }

  function applyFilters() {
    const q = state.query.toLowerCase().trim();
    state.filtered = state.orders.filter((o) => {
      if (state.status !== 'all' && String(o.status) !== state.status) return false;
      if (state.date && isoDate(o.delivery_date || o.created_at) !== state.date) return false;
      if (!q) return true;
      const row = `${displayOrderId(o.id)} ${o.client || ''} ${o.address || ''} ${o.courier_note || ''}`.toLowerCase();
      return row.includes(q);
    });
  }

  function fillOrderModal(order, fallbackIndex) {
    if (!order) return;
    const orderId = displayOrderId(order.id);
    const product = parseProduct(order.items_json, fallbackIndex);
    const qty = parseQty(order.items_json);
    const unitPrice = parseUnitPrice(order.items_json);
    const dateParts = ruDateTime(order.created_at);
    const createdAt =
      typeof dateParts === 'object' ? `${dateParts.datePart} ${dateParts.timePart}` : String(dateParts || '—');
    if (ORDER_MODAL_TITLE instanceof HTMLElement) ORDER_MODAL_TITLE.textContent = `Заказ ${orderId}`;
    setModalValue(MODAL_ORDER_ID, orderId);
    setModalValue(MODAL_STATUS, String(order.status || 'new'));
    setModalValue(MODAL_CLIENT, String(order.client || '—'));
    setModalValue(MODAL_PHONE, String(order.phone || 'Телефон не указан'));
    setModalValue(MODAL_ADDRESS, String(order.address || '—'));
    setModalValue(MODAL_ZONE, String(order.zone || districts[fallbackIndex % districts.length] || 'Подхват'));
    setModalValue(MODAL_DELIVERY_DATE, isoDate(order.delivery_date || order.created_at));
    updateQuickDateButtons();
    setModalSlot(String(order.delivery_slot || '09:00-14:00'));
    setModalValue(MODAL_PAYMENT, String(order.payment_method || 'налич.'));
    if (MODAL_PICKUP instanceof HTMLInputElement) MODAL_PICKUP.checked = Boolean(order.pickup);
    setModalValue(MODAL_PRODUCT, normalizeProductName(product));
    setModalValue(MODAL_QTY, String(Math.max(1, qty || 1)));
    setModalValue(MODAL_UNIT_PRICE, String(unitPrice != null ? unitPrice : getDefaultPriceForOrder(order, product)));
    setModalValue(MODAL_SUM, `${money(order.total_sum)} ₽`);
    setModalValue(MODAL_DRIVER, String(order.driver || ''));
    setModalValue(MODAL_NOTE, String(order.courier_note || ''));
    updateGoodsSumPreview();
    setOrderModalTab(state.orderModalTab || 'basic');
  }

  async function saveOrderModalChanges() {
    const order = getActiveOrder();
    if (!order) return;
    const prevDate = order.delivery_date;
    const prevStatus = String(order.status || '');
    const prevSlot = order.delivery_slot;
    const prevPayment = order.payment_method;
    const prevZone = order.zone;
    const prevPickup = Boolean(order.pickup);
    const prevDriver = order.driver;
    const prevTotal = Number(order.total_sum) || 0;
    const prevNote = order.courier_note;
    const zone = String(MODAL_ZONE instanceof HTMLSelectElement ? MODAL_ZONE.value : '').trim();
    const deliveryDate = String(MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '').trim();
    const slot = String(MODAL_SLOT instanceof HTMLInputElement ? MODAL_SLOT.value : '').trim();
    const payment = String(MODAL_PAYMENT instanceof HTMLSelectElement ? MODAL_PAYMENT.value : '').trim();
    const pickup = MODAL_PICKUP instanceof HTMLInputElement ? MODAL_PICKUP.checked : false;
    const driver = String(MODAL_DRIVER instanceof HTMLSelectElement ? MODAL_DRIVER.value : '').trim();
    const note = String(MODAL_NOTE instanceof HTMLTextAreaElement ? MODAL_NOTE.value : '').trim();
    const status = String(MODAL_STATUS instanceof HTMLSelectElement ? MODAL_STATUS.value || order.status : order.status);
    const goodsTitle = String(MODAL_PRODUCT instanceof HTMLSelectElement ? MODAL_PRODUCT.value : '').trim();
    const goodsQty = Math.min(50, Math.max(1, Number(MODAL_QTY instanceof HTMLInputElement ? MODAL_QTY.value : 1) || 1));
    if (MODAL_QTY instanceof HTMLInputElement) MODAL_QTY.value = String(goodsQty);
    if (!deliveryDate || !slot || !payment || !zone) {
      showToast('Заполните дату, интервал и форму оплаты');
      return;
    }
    const goodsUnitPrice = Math.max(
      0,
      Number(MODAL_UNIT_PRICE instanceof HTMLInputElement ? MODAL_UNIT_PRICE.value : 0) || 0
    );
    const itemsJson = goodsTitle
      ? JSON.stringify([{ title: goodsTitle, qty: goodsQty, unit_price: goodsUnitPrice }])
      : order.items_json;
    const nextTotal = currentGoodsTotal();
    const payload = {
      status,
      delivery_date: deliveryDate,
      delivery_slot: slot,
      payment_method: payment,
      zone,
      driver,
      pickup: pickup ? 1 : 0,
      items_json: itemsJson,
      total_sum: nextTotal,
      courier_note: note,
    };
    const api = window.EkvalineAPI;
    if (api) {
      try {
        const response = await api.json(`/api/orders/${encodeURIComponent(order.id)}`, {
          method: 'PATCH',
          body: payload,
        });
        if (!response.ok) {
          showToast(response.data?.error || 'Не удалось сохранить заказ в базе');
          return;
        }
        api.resetCsrf();
      } catch {
        showToast('Ошибка сети: не удалось сохранить заказ в базе');
        return;
      }
    }
    order.zone = zone;
    order.status = status;
    order.delivery_date = deliveryDate;
    order.delivery_slot = slot;
    order.payment_method = payment;
    order.pickup = pickup;
    order.driver = driver;
    order.items_json = itemsJson;
    order.total_sum = nextTotal;
    order.courier_note = note;
    const changes = [];
    if (prevStatus !== order.status) changes.push(`статус: ${statusLabel(prevStatus)} -> ${statusLabel(order.status)}`);
    if (prevZone !== order.zone) changes.push(`зона: ${prevZone || '—'} -> ${order.zone}`);
    if (prevDate !== order.delivery_date) changes.push(`дата доставки: ${ruDate(prevDate)} -> ${ruDate(order.delivery_date)}`);
    if (prevSlot !== order.delivery_slot) changes.push(`интервал: ${prevSlot || '—'} -> ${order.delivery_slot}`);
    if (prevPayment !== order.payment_method) changes.push(`оплата: ${prevPayment || '—'} -> ${order.payment_method}`);
    if (prevPickup !== Boolean(order.pickup)) changes.push(`самовывоз: ${order.pickup ? 'да' : 'нет'}`);
    if (prevDriver !== order.driver) changes.push(`водитель: ${prevDriver || '—'} -> ${order.driver || '—'}`);
    if (prevTotal !== (Number(order.total_sum) || 0)) changes.push(`сумма: ${money(prevTotal)} -> ${money(order.total_sum)}`);
    if (prevNote !== order.courier_note) changes.push('примечание изменено');
    if (changes.length) appendOrderJournal(order.id, `Изменены поля заказа (${changes.join('; ')})`);
    applyFilters();
    render();
    const idx = state.filtered.findIndex((o) => String(o.id).trim() === state.activeOrderId);
    fillOrderModal(order, idx >= 0 ? idx : 0);
    renderOrderJournal(order);
    showToast('Заказ обновлен');
  }

  function openOrderModalById(orderId) {
    if (!(ORDER_MODAL instanceof HTMLElement)) return;
    const key = String(orderId || '').trim();
    state.activeOrderId = key;
    const index = state.filtered.findIndex((o) => String(o.id).trim() === key);
    if (index < 0) return;
    state.activeOrderIndex = index;
    if (!getOrderJournal(state.filtered[index].id).length) {
      const initialMessage = 'Оператор создал заказ';
      appendOrderJournal(
        state.filtered[index].id,
        `${initialMessage} (${ruDate(state.filtered[index].created_at)} ${ruDateTime(state.filtered[index].created_at).timePart})`
      );
    }
    fillOrderModal(state.filtered[index], index);
    renderOrderJournal(state.filtered[index]);
    ORDER_MODAL.classList.add('is-open');
    ORDER_MODAL.hidden = false;
    ORDER_MODAL.setAttribute('aria-hidden', 'false');
    document.body.classList.add('opx-modal-open');
  }

  function closeOrderModal() {
    if (!(ORDER_MODAL instanceof HTMLElement)) return;
    ORDER_MODAL.classList.remove('is-open');
    ORDER_MODAL.hidden = true;
    ORDER_MODAL.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('opx-modal-open');
  }

  function getActiveOrder() {
    if (!state.activeOrderId) return null;
    return state.orders.find((o) => String(o.id).trim() === state.activeOrderId) || null;
  }

  function openClientCardModal() {
    const order = getActiveOrder();
    if (!order || !(CLIENT_CARD_MODAL instanceof HTMLElement)) return;
    setModalValue(CLIENT_NAME_INPUT, String(order.client || ''));
    setModalValue(CLIENT_PHONE_INPUT, String(order.phone || ''));
    setModalValue(CLIENT_ADDRESS_INPUT, String(order.address || ''));
    renderClientOrdersHistory(order);
    renderClientJournal(order);
    fillClientPrice(order);
    setClientCardTab(state.clientCardTab || 'client');
    CLIENT_CARD_MODAL.classList.add('is-open');
    CLIENT_CARD_MODAL.hidden = false;
    CLIENT_CARD_MODAL.setAttribute('aria-hidden', 'false');
  }

  function closeClientCardModal() {
    if (!(CLIENT_CARD_MODAL instanceof HTMLElement)) return;
    CLIENT_CARD_MODAL.classList.remove('is-open');
    CLIENT_CARD_MODAL.hidden = true;
    CLIENT_CARD_MODAL.setAttribute('aria-hidden', 'true');
    const orderModalOpen =
      ORDER_MODAL instanceof HTMLElement && ORDER_MODAL.classList.contains('is-open');
    if (!orderModalOpen) document.body.classList.remove('opx-modal-open');
  }

  function setClientCardTab(tabId) {
    state.clientCardTab = tabId;
    CLIENT_CARD_TAB_BTNS.forEach((btn) => {
      const active = btn.getAttribute('data-opx-cc-tab') === tabId;
      btn.classList.toggle('is-active', active);
    });
    CLIENT_CARD_PANELS.forEach((panel) => {
      const panelId = panel.getAttribute('data-opx-cc-panel');
      const shouldShow = panelId === 'client' || panelId === tabId;
      panel.hidden = !shouldShow;
    });
  }

  function renderClientOrdersHistory(order) {
    if (!(CLIENT_ORDERS_HISTORY instanceof HTMLElement)) return;
    const key = normalizeClientKey(order);
    const list = state.orders
      .filter((o) => normalizeClientKey(o) === key)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (!list.length) {
      CLIENT_ORDERS_HISTORY.innerHTML = '<p class="opx-cc-empty">Заказов пока нет.</p>';
      return;
    }
    CLIENT_ORDERS_HISTORY.innerHTML = list
      .map(
        (o) =>
          `<div class="opx-cc-item"><strong>${displayOrderId(o.id)}</strong><span>${ruDate(o.created_at)} • ${money(
            o.total_sum
          )} ₽ • ${statusLabel(o.status)}</span></div>`
      )
      .join('');
  }

  async function renderClientJournal(order) {
    if (!(CLIENT_JOURNAL_LIST instanceof HTMLElement)) return;
    const api = window.EkvalineAPI;
    if (!api || !order?.id) {
      const localEntries = getOrderJournal(order?.id);
      if (!localEntries.length) {
        CLIENT_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Изменений пока нет.</p>';
        return;
      }
      CLIENT_JOURNAL_LIST.innerHTML = localEntries
        .map((entry) => {
          const dt = ruDateTime(entry.at);
          const dtText = typeof dt === 'object' ? `${dt.datePart} ${dt.timePart}` : String(entry.at || '');
          return `<div class="opx-cc-item"><strong>${dtText}</strong><span>${escapeHtml(entry.actor)}: ${escapeHtml(
            entry.message
          )}</span></div>`;
        })
        .join('');
      return;
    }
    try {
      const response = await api.json(`/api/orders/${encodeURIComponent(order.id)}/journal`);
      if (!response.ok) throw new Error(response.data?.error || 'journal_failed');
      const entries = Array.isArray(response.data?.journal) ? response.data.journal : [];
      if (!entries.length) {
        CLIENT_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Изменений пока нет.</p>';
        return;
      }
      CLIENT_JOURNAL_LIST.innerHTML = renderJournalListHtml(entries);
    } catch {
      CLIENT_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Не удалось загрузить журнал изменений.</p>';
    }
  }

  function fillClientPrice(order) {
    const all = readStore(CLIENT_PRICE_OVERRIDES_KEY, {});
    const key = normalizeClientKey(order);
    const saved = all[key] || { mode: 'none', amount: '' };
    if (CLIENT_PRICE_MODE instanceof HTMLSelectElement) CLIENT_PRICE_MODE.value = String(saved.mode || 'none');
    if (CLIENT_PRICE_VALUE instanceof HTMLInputElement) CLIENT_PRICE_VALUE.value = saved.amount ? String(saved.amount) : '';
    const currentProduct = String(CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement ? CLIENT_PRICE_PRODUCT.value : products[0]);
    const itemPrice = getClientProductPrice(key, currentProduct) || PRODUCT_PRICE_MAP[currentProduct] || 0;
    if (CLIENT_PRICE_PRODUCT_VALUE instanceof HTMLInputElement) CLIENT_PRICE_PRODUCT_VALUE.value = String(itemPrice);
    if (CLIENT_PRICE_ITEMS instanceof HTMLElement) {
      const byClient = readClientProductPrices()[key] || {};
      const rows = products.map((p) => `${p}: ${Number(byClient[p] || PRODUCT_PRICE_MAP[p] || 0)} ₽`);
      CLIENT_PRICE_ITEMS.innerHTML = rows.map((r) => `<div class="opx-cc-item"><span>${escapeHtml(r)}</span></div>`).join('');
    }
  }

  function closeClientMapModal() {
    if (!(CLIENT_MAP_MODAL instanceof HTMLElement)) return;
    CLIENT_MAP_MODAL.classList.remove('is-open');
    CLIENT_MAP_MODAL.hidden = true;
    CLIENT_MAP_MODAL.setAttribute('aria-hidden', 'true');
  }

  function normalizeAddressPart(value) {
    return String(value || '').trim();
  }

  function normalizeToken(value) {
    return String(value || '')
      .toLowerCase()
      .replaceAll('ё', 'е')
      .replace(/[^a-zа-я0-9]+/gi, ' ')
      .trim();
  }

  function isStreetLikeName(name) {
    const value = normalizeAddressPart(name);
    if (!value) return false;
    const lowered = value.toLowerCase();
    const forbidden = ['снт', 'днт', 'поселок', 'пос.', 'мкр', 'микрорайон', 'территория', 'квартал'];
    if (forbidden.some((bad) => lowered.includes(bad))) return false;
    return /^[a-zа-я0-9\s\-./]+$/i.test(value);
  }

  function normalizeStreetName(value) {
    const text = normalizeAddressPart(value);
    if (!text) return '';
    return text
      .replace(/^(улица|ул\.?)\s+/i, '')
      .replace(/\s+(улица|ул\.?)$/i, '')
      .trim();
  }

  function isOrenburgAddress(item) {
    const cityField = normalizeToken(
      item?.address?.city || item?.address?.town || item?.address?.village || item?.address?.hamlet || ''
    );
    const display = normalizeToken(item?.display_name || '');
    if (cityField === 'оренбург') return true;
    return display.includes('оренбург');
  }

  function fillMapAddressFields(addressDetails, preserveOptional = true) {
    const details = addressDetails || {};
    const city = normalizeAddressPart(details.city || details.town || details.village || details.hamlet || '');
    const street = normalizeAddressPart(details.road || details.street || details.pedestrian || '');
    const house = normalizeAddressPart(details.house_number || details.building || '');
    if (CLIENT_MAP_CITY instanceof HTMLInputElement && city) CLIENT_MAP_CITY.value = city;
    if (CLIENT_MAP_CITY instanceof HTMLInputElement && !CLIENT_MAP_CITY.value.trim()) CLIENT_MAP_CITY.value = 'Оренбург';
    if (CLIENT_MAP_STREET instanceof HTMLInputElement && street) CLIENT_MAP_STREET.value = street;
    if (CLIENT_MAP_HOUSE instanceof HTMLInputElement && house) CLIENT_MAP_HOUSE.value = house;
    if (!preserveOptional) {
      if (CLIENT_MAP_APARTMENT instanceof HTMLInputElement) CLIENT_MAP_APARTMENT.value = '';
      if (CLIENT_MAP_ENTRANCE instanceof HTMLInputElement) CLIENT_MAP_ENTRANCE.value = '';
      if (CLIENT_MAP_FLOOR instanceof HTMLInputElement) CLIENT_MAP_FLOOR.value = '';
    }
  }

  function composeAddressFromFields() {
    const city = normalizeAddressPart(CLIENT_MAP_CITY instanceof HTMLInputElement ? CLIENT_MAP_CITY.value : 'Оренбург');
    const street = normalizeStreetName(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
    const house = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
    const apartment = normalizeAddressPart(CLIENT_MAP_APARTMENT instanceof HTMLInputElement ? CLIENT_MAP_APARTMENT.value : '');
    const entrance = normalizeAddressPart(CLIENT_MAP_ENTRANCE instanceof HTMLInputElement ? CLIENT_MAP_ENTRANCE.value : '');
    const floor = normalizeAddressPart(CLIENT_MAP_FLOOR instanceof HTMLInputElement ? CLIENT_MAP_FLOOR.value : '');
    const pieces = [city || 'Оренбург', street ? `ул. ${street}` : '', house ? `д. ${house}` : ''];
    if (apartment) pieces.push(`кв. ${apartment}`);
    if (entrance) pieces.push(`подъезд ${entrance}`);
    if (floor) pieces.push(`этаж ${floor}`);
    return pieces.join(', ');
  }

  function updateMapSelection(lat, lon, address, addressDetails) {
    state.mapSelectedCoords = { lat, lon };
    const manualHouse = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
    const manualStreet = normalizeAddressPart(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
    if (addressDetails) fillMapAddressFields(addressDetails, true);
    if (CLIENT_MAP_HOUSE instanceof HTMLInputElement && manualHouse && !normalizeAddressPart(CLIENT_MAP_HOUSE.value)) {
      CLIENT_MAP_HOUSE.value = manualHouse;
    }
    if (CLIENT_MAP_STREET instanceof HTMLInputElement && manualStreet && !normalizeAddressPart(CLIENT_MAP_STREET.value)) {
      CLIENT_MAP_STREET.value = manualStreet;
    }
    const composed = composeAddressFromFields();
    state.mapSelectedAddress = composed || String(address || '').trim();
    if (CLIENT_MAP_SELECTED instanceof HTMLElement) CLIENT_MAP_SELECTED.textContent = state.mapSelectedAddress || '—';
    if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) CLIENT_ADDRESS_INPUT.value = state.mapSelectedAddress || '';
    if (CLIENT_MAP_SEARCH instanceof HTMLInputElement) CLIENT_MAP_SEARCH.value = composeAddressFromFields();
  }

  async function reverseGeocode(lat, lon) {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lon),
      'accept-language': 'ru',
      addressdetails: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      address: String(data?.display_name || '').trim(),
      details: data?.address || {},
    };
  }

  async function geocodeAddress(query) {
    const params = new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      addressdetails: '1',
      bounded: '1',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      'accept-language': 'ru',
      q: query,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) return null;
    const first = list[0];
    return {
      lat: Number(first.lat),
      lon: Number(first.lon),
      address: String(first.display_name || '').trim(),
      details: first.address || {},
    };
  }

  async function rebuildZoneMarkersInternal() {
    const generation = ++zoneMarkersBuildGeneration;
    if (!state.zoneMapOpen || !zoneMapLayer || !window.L) return;

    zoneMapLayer.clearLayers();

    const source = state.filtered.length ? state.filtered : state.orders;
    if (!source.length) return;

    const geoQueryByKey = new Map();
    for (const order of source) {
      const gk = geoCacheKeyForOrder(order);
      if (geoQueryByKey.has(gk)) continue;
      if (!gk.startsWith('__orphan:')) geoQueryByKey.set(gk, buildZoneMapGeocodeQuery(String(order.address || '')));
    }

    for (const geoKey of geoQueryByKey.keys()) {
      if (generation !== zoneMarkersBuildGeneration) return;
      if (ZONE_ADDRESS_COORD_CACHE.has(geoKey) || ZONE_ADDRESS_GEO_NO_RESULT.has(geoKey)) continue;
      const query = geoQueryByKey.get(geoKey);
      await nominatimThrottleZoneMap();
      if (generation !== zoneMarkersBuildGeneration) return;
      try {
        const res = await geocodeAddress(query);
        if (
          res &&
          Number.isFinite(res.lat) &&
          Number.isFinite(res.lon) &&
          coordsInOrenburgView(res.lat, res.lon)
        ) {
          ZONE_ADDRESS_COORD_CACHE.set(geoKey, { lat: res.lat, lng: res.lon });
        } else {
          ZONE_ADDRESS_GEO_NO_RESULT.add(geoKey);
        }
      } catch {
        ZONE_ADDRESS_GEO_NO_RESULT.add(geoKey);
      }
    }

    if (generation !== zoneMarkersBuildGeneration) return;

    const duplicateIndexByKey = Object.create(null);
    const counters = { Подхват: 0, Степной: 0, Центр: 0 };
    const latLngCollected = [];

    for (const order of source) {
      if (generation !== zoneMarkersBuildGeneration) return;
      const zone = normalizeZoneName(order.zone);
      const geoKey = geoCacheKeyForOrder(order);
      const dupIdx = duplicateIndexByKey[geoKey] || 0;
      duplicateIndexByKey[geoKey] = dupIdx + 1;

      const cached = ZONE_ADDRESS_COORD_CACHE.get(geoKey);
      let latLng;
      if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
        latLng = microJitterLatLng(cached.lat, cached.lng, dupIdx);
      } else {
        const idx = counters[zone] || 0;
        counters[zone] = idx + 1;
        latLng = markerCoordsForOrder(order, idx);
      }

      latLngCollected.push(latLng);
      const ringColor = markerColorForOrder(order);
      const marker = window.L.circleMarker(latLng, {
        radius: 20,
        color: ringColor,
        weight: 3,
        fillColor: '#ffffff',
        fillOpacity: 0.95,
      });
      marker.bindPopup(zoneMapPopupHtml(order, zone, ringColor), { maxWidth: 280, className: 'opx-zone-leaflet-popup' });
      marker.addTo(zoneMapLayer);
    }

    if (generation !== zoneMarkersBuildGeneration || !zoneMap || !latLngCollected.length) return;
    try {
      if (latLngCollected.length === 1) {
        zoneMap.setView(latLngCollected[0], 14);
      } else if (latLngCollected.length >= 2) {
        const bounds = window.L.latLngBounds(latLngCollected);
        zoneMap.fitBounds(bounds, { padding: [40, 44], maxZoom: 15 });
      }
    } catch {
      // ignore bounds errors
    }
  }

  async function geocodeByFields(city, street, house) {
    const params = new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      addressdetails: '1',
      bounded: '1',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      'accept-language': 'ru',
      city,
      street: house ? `${house}, ${street}` : street,
      country: 'Россия',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) return null;
    const first = list[0];
    return {
      lat: Number(first.lat),
      lon: Number(first.lon),
      address: String(first.display_name || '').trim(),
      details: first.address || {},
    };
  }

  async function suggestStreets(query) {
    const city = normalizeAddressPart(CLIENT_MAP_CITY instanceof HTMLInputElement ? CLIENT_MAP_CITY.value : 'Оренбург') || 'Оренбург';
    const key = `${city}|${query}`.toLowerCase();
    if (state.streetCache[key]) return state.streetCache[key];
    const params = new URLSearchParams({
      format: 'jsonv2',
      limit: '8',
      addressdetails: '1',
      countrycodes: 'ru',
      bounded: '1',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      'accept-language': 'ru',
      q: `${query}, ${city}`,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const list = await response.json();
    const streets = Array.isArray(list)
      ? Array.from(
          new Set(
            list
              .filter((item) => isOrenburgAddress(item))
              .map((item) => normalizeStreetName(item?.address?.road || item?.address?.street || ''))
              .filter((name) => isStreetLikeName(name))
          )
        )
      : [];
    state.streetCache[key] = streets;
    return streets;
  }

  function renderStreetSuggestBox(streets) {
    if (!(STREET_SUGGEST_BOX instanceof HTMLElement)) return;
    if (!streets.length) {
      STREET_SUGGEST_BOX.hidden = true;
      STREET_SUGGEST_BOX.innerHTML = '';
      return;
    }
    STREET_SUGGEST_BOX.hidden = false;
    STREET_SUGGEST_BOX.innerHTML = streets
      .map((name) => `<button type="button" class="opx-street-suggest-item" data-opx-street="${escapeHtml(name)}">${escapeHtml(name)}</button>`)
      .join('');
  }

  function getLocalStreetSuggestions(query) {
    const q = normalizeToken(query);
    if (!q) return streetFallback.slice(0, 10);
    const starts = streetFallback.filter((s) => normalizeToken(s).startsWith(q));
    const includes = streetFallback.filter((s) => !starts.includes(s) && normalizeToken(s).includes(q));
    const merged = [...starts, ...includes];
    return (merged.length ? merged : streetFallback).slice(0, 10);
  }

  function autoLocateByStreetAndHouse() {
    if (state.mapAutoLocateTimer) window.clearTimeout(state.mapAutoLocateTimer);
    state.mapAutoLocateTimer = window.setTimeout(() => {
      const street = normalizeAddressPart(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
      const house = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
      if (street.length < 2 || !house) return;
      void searchOnClientMap();
    }, 450);
  }

  function syncAddressDraft() {
    const composed = composeAddressFromFields();
    if (CLIENT_MAP_SEARCH instanceof HTMLInputElement) CLIENT_MAP_SEARCH.value = composed;
  }

  function ensureClientMap() {
    if (!CLIENT_MAP_CANVAS || typeof window.L === 'undefined') return false;
    if (clientMap) return true;
    clientMap = window.L.map(CLIENT_MAP_CANVAS).setView([51.7682, 55.0969], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(clientMap);
    clientMap.on('click', async (evt) => {
      const lat = evt.latlng.lat;
      const lon = evt.latlng.lng;
      if (!clientMapMarker) {
        clientMapMarker = window.L.marker([lat, lon]).addTo(clientMap);
      } else {
        clientMapMarker.setLatLng([lat, lon]);
      }
      const reverse = await reverseGeocode(lat, lon);
      const address = reverse?.address || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      updateMapSelection(lat, lon, address, reverse?.details || null);
    });
    return true;
  }

  function openClientMapModal() {
    if (!(CLIENT_MAP_MODAL instanceof HTMLElement)) return;
    if (CLIENT_MAP_CITY instanceof HTMLInputElement && !normalizeAddressPart(CLIENT_MAP_CITY.value)) {
      CLIENT_MAP_CITY.value = 'Оренбург';
    }
    const currentAddress = normalizeAddressPart(CLIENT_ADDRESS_INPUT instanceof HTMLInputElement ? CLIENT_ADDRESS_INPUT.value : '');
    if (CLIENT_MAP_SEARCH instanceof HTMLInputElement && currentAddress && !normalizeAddressPart(CLIENT_MAP_SEARCH.value)) {
      CLIENT_MAP_SEARCH.value = currentAddress;
    }
    CLIENT_MAP_MODAL.classList.add('is-open');
    CLIENT_MAP_MODAL.hidden = false;
    CLIENT_MAP_MODAL.setAttribute('aria-hidden', 'false');
    const hasMap = ensureClientMap();
    if (!hasMap) {
      showToast('Карта недоступна');
      return;
    }
    window.setTimeout(() => {
      clientMap?.invalidateSize();
    }, 60);
  }

  async function searchOnClientMap() {
    const searchValue = normalizeAddressPart(CLIENT_MAP_SEARCH instanceof HTMLInputElement ? CLIENT_MAP_SEARCH.value : '');
    const cityValue = normalizeAddressPart(CLIENT_MAP_CITY instanceof HTMLInputElement ? CLIENT_MAP_CITY.value : 'Оренбург') || 'Оренбург';
    const streetValue = normalizeStreetName(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
    const houseValue = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
    const structuredQuery = composeAddressFromFields();

    const attempts = [];
    if (streetValue && houseValue) attempts.push(`${cityValue}, ${streetValue}, ${houseValue}`);
    if (structuredQuery) attempts.push(structuredQuery);
    if (searchValue) attempts.push(searchValue);
    if (searchValue && !normalizeToken(searchValue).includes(normalizeToken(cityValue))) {
      attempts.push(`${searchValue}, ${cityValue}`);
    }

    const uniqAttempts = Array.from(new Set(attempts.map((v) => normalizeAddressPart(v)).filter(Boolean)));
    if (!uniqAttempts.length) return;

    let result = null;
    if (streetValue) {
      result = await geocodeByFields(cityValue, streetValue, houseValue);
    }
    for (let i = 0; i < uniqAttempts.length; i += 1) {
      // Пробуем несколько форматов адреса, чтобы быстрее находить дом на карте.
      // eslint-disable-next-line no-await-in-loop
      if (!result) result = await geocodeAddress(uniqAttempts[i]);
      if (result) break;
    }
    if (!result || !clientMap) {
      showToast('Адрес не найден');
      return;
    }
    clientMap.setView([result.lat, result.lon], 16);
    if (!clientMapMarker) {
      clientMapMarker = window.L.marker([result.lat, result.lon]).addTo(clientMap);
    } else {
      clientMapMarker.setLatLng([result.lat, result.lon]);
    }
    updateMapSelection(result.lat, result.lon, result.address, result.details || null);
  }

  function saveClientCardChanges() {
    const order = getActiveOrder();
    if (!order) return;
    const prevClient = order.client;
    const prevPhone = order.phone;
    const prevAddress = order.address;
    const prevTotal = Number(order.total_sum) || 0;
    const nextClient = String(CLIENT_NAME_INPUT instanceof HTMLInputElement ? CLIENT_NAME_INPUT.value : '').trim();
    const nextPhone = String(CLIENT_PHONE_INPUT instanceof HTMLInputElement ? CLIENT_PHONE_INPUT.value : '').trim();
    const nextAddress = String(CLIENT_ADDRESS_INPUT instanceof HTMLInputElement ? CLIENT_ADDRESS_INPUT.value : '').trim();
    order.client = nextClient || order.client || 'КЛИЕНТ';
    order.phone = nextPhone;
    order.address = nextAddress || order.address;

    const priceMode = String(CLIENT_PRICE_MODE instanceof HTMLSelectElement ? CLIENT_PRICE_MODE.value : 'none');
    const priceAmount = Number(CLIENT_PRICE_VALUE instanceof HTMLInputElement ? CLIENT_PRICE_VALUE.value : 0);
    const clientKey = normalizeClientKey(order);
    const priceStore = readStore(CLIENT_PRICE_OVERRIDES_KEY, {});
    if (priceMode === 'none' || !Number.isFinite(priceAmount) || priceAmount <= 0) {
      delete priceStore[clientKey];
    } else {
      priceStore[clientKey] = { mode: priceMode, amount: Math.round(priceAmount) };
      if (priceMode === 'fixed') {
        state.orders.forEach((o) => {
          if (normalizeClientKey(o) === clientKey) o.total_sum = Math.round(priceAmount);
        });
      } else if (priceMode === 'one_order') {
        order.total_sum = Math.round(priceAmount);
      }
    }
    writeStore(CLIENT_PRICE_OVERRIDES_KEY, priceStore);

    const productName = String(CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement ? CLIENT_PRICE_PRODUCT.value : '').trim();
    const productPrice = Math.round(
      Number(CLIENT_PRICE_PRODUCT_VALUE instanceof HTMLInputElement ? CLIENT_PRICE_PRODUCT_VALUE.value : 0) || 0
    );
    if (productName) {
      const productStore = readClientProductPrices();
      const byClient = (productStore[clientKey] && typeof productStore[clientKey] === 'object') ? productStore[clientKey] : {};
      if (productPrice > 0) {
        byClient[productName] = productPrice;
      } else {
        delete byClient[productName];
      }
      productStore[clientKey] = byClient;
      writeStore(CLIENT_PRODUCT_PRICES_KEY, productStore);
    }

    const changes = [];
    if (prevClient !== order.client) changes.push(`имя/организация: ${prevClient || '—'} -> ${order.client}`);
    if (prevPhone !== order.phone) changes.push(`телефон: ${prevPhone || '—'} -> ${order.phone || '—'}`);
    if (prevAddress !== order.address) changes.push('адрес изменен');
    if (prevTotal !== (Number(order.total_sum) || 0)) changes.push(`сумма: ${money(prevTotal)} -> ${money(order.total_sum)}`);
    if (changes.length) appendOrderJournal(order.id, `Изменена карточка клиента (${changes.join('; ')})`);
    applyFilters();
    render();
    const idx = state.filtered.findIndex((o) => String(o.id).trim() === state.activeOrderId);
    fillOrderModal(order, idx >= 0 ? idx : 0);
    renderClientJournal(order);
    renderOrderJournal(order);
    renderClientOrdersHistory(order);
    closeClientMapModal();
    closeClientCardModal();
  }

  function render() {
    if (!(BODY instanceof HTMLElement)) return;
    const newCount = state.filtered.filter((o) => ['new', 'pending_operator'].includes(String(o.status))).length;
    if (NEW_COUNT instanceof HTMLElement) NEW_COUNT.textContent = String(newCount);
    if (COUNT instanceof HTMLElement) COUNT.textContent = String(state.filtered.length);
    const total = state.filtered.reduce((s, o) => s + (Number(o.total_sum) || 0), 0);
    if (TOTAL_SUM instanceof HTMLElement) TOTAL_SUM.textContent = `${money(total)} ₽`;
    const items = state.filtered.reduce((s, o) => s + parseQty(o.items_json), 0);
    if (TOTAL_ITEMS instanceof HTMLElement) TOTAL_ITEMS.textContent = `${items} шт.`;

    if (!state.filtered.length) {
      BODY.innerHTML = '<tr><td colspan="13" class="operator-empty-cell">Нет заказов по фильтру.</td></tr>';
      return;
    }

    BODY.innerHTML = state.filtered
      .map((o, i) => {
        const product = parseProduct(o.items_json, i);
        const qty = parseQty(o.items_json);
        const zoneName = normalizeZoneName(o.zone || districts[i % districts.length]);
        const dt = ruDateTime(o.created_at);
        const createdDate = typeof dt === 'object' ? dt.datePart : '—';
        const createdTime = typeof dt === 'object' ? dt.timePart : '—';
        const phone = String(o.phone || '').trim();
        const phoneLine = `<span class="opx-phone">${phone || 'Телефон не указан'}</span>`;
        const orderId = displayOrderId(o.id);
        return `
          <tr data-opx-order-id="${escapeHtml(String(o.id))}" class="${String(o.status) === 'delivered' ? 'opx-row-delivered' : ''}">
            <td title="${orderId}"><button type="button" class="opx-order-link" data-opx-open-order="${escapeHtml(String(o.id))}">${orderId}</button></td>
            <td>${periodBySlot(o.delivery_slot)}</td>
            <td><span class="opx-dt"><span class="opx-dt-date">${createdDate}</span><span class="opx-dt-time">${createdTime}</span></span></td>
            <td class="opx-wrap" title="${o.client}">${o.client}</td>
            <td class="opx-wrap" title="${String(o.address || '')}">${String(o.address || '')}${phoneLine}</td>
            <td>${ruDate(o.delivery_date || o.created_at)}</td>
            <td class="opx-wrap" title="${product}">${product}</td>
            <td>${qty}</td>
            <td>${money(o.total_sum)}</td>
            <td>${o.payment_method || 'налич.'}</td>
            <td>${zoneName}</td>
            <td>${couriers[i % couriers.length]}</td>
            <td class="opx-wrap opx-note" title="${String(o.courier_note || '')}">${String(o.courier_note || '')}</td>
          </tr>
        `;
      })
      .join('');
    renderZoneMapMarkers();
    if (state.reportsOpen) renderReports();
  }

  function setRelativeDay(kind) {
    const now = new Date();
    if (kind === 'yesterday') now.setDate(now.getDate() - 1);
    if (kind === 'tomorrow') now.setDate(now.getDate() + 1);
    state.date = isoDate(now);
    if (DATE instanceof HTMLInputElement) DATE.value = state.date;
    DAY_BTNS.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-opx-day') === kind));
    applyFilters();
    render();
  }

  function bind() {
    ensureProductOptions();
    SEARCH?.addEventListener('input', () => {
      state.query = String(SEARCH.value || '');
      applyFilters();
      render();
    });
    STATUS?.addEventListener('change', () => {
      state.status = String(STATUS.value || 'all');
      applyFilters();
      render();
    });
    DATE?.addEventListener('change', () => {
      state.date = String(DATE.value || '');
      DAY_BTNS.forEach((b) => b.classList.remove('is-active'));
      applyFilters();
      render();
    });
    CLEAR_DATE?.addEventListener('click', () => {
      state.date = '';
      if (DATE instanceof HTMLInputElement) DATE.value = '';
      DAY_BTNS.forEach((b) => b.classList.remove('is-active'));
      applyFilters();
      render();
    });
    DAY_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => setRelativeDay(String(btn.getAttribute('data-opx-day') || 'today')));
    });
    REFRESH?.addEventListener('click', async () => {
      await loadOrders();
      applyFilters();
      render();
      showToast('Список обновлен');
    });
    TAB_MAP?.addEventListener('click', openZoneMapOverlay);
    TAB_ORDERS?.addEventListener('click', switchToOrdersView);
    TAB_REPORTS?.addEventListener('click', openReportsOverlay);
    ZONE_MAP_CLOSE?.addEventListener('click', closeZoneMapOverlay);
    REPORTS_CLOSE?.addEventListener('click', closeReportsOverlay);
    REPORTS_BUILD_BTN?.addEventListener('click', renderReports);
    REPORTS_DATE_FROM?.addEventListener('change', renderReports);
    REPORTS_DATE_TO?.addEventListener('change', renderReports);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.zoneMapOpen) closeZoneMapOverlay();
      if (event.key === 'Escape' && state.reportsOpen) closeReportsOverlay();
    });
    LOGOUT?.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = 'index.html';
    });
    BODY?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const trigger = target.closest('[data-opx-open-order]');
      if (!(trigger instanceof HTMLElement)) return;
      const orderId = trigger.getAttribute('data-opx-open-order');
      if (!orderId) return;
      openOrderModalById(orderId);
    });
    BODY?.addEventListener('dblclick', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const row = target.closest('tr[data-opx-order-id]');
      if (!(row instanceof HTMLElement)) return;
      const orderId = row.getAttribute('data-opx-order-id');
      if (!orderId) return;
      openOrderModalById(orderId);
    });
    ORDER_MODAL_CLOSE?.addEventListener('click', closeOrderModal);
    MODAL_SAVE_BTN?.addEventListener('click', saveOrderModalChanges);
    MODAL_CANCEL_BTN?.addEventListener('click', closeOrderModal);
    ORDER_TAB_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = String(btn.getAttribute('data-opx-ord-tab') || 'basic');
        setOrderModalTab(tabId);
        if (tabId === 'journal') {
          const order = getActiveOrder();
          if (order) renderOrderJournal(order);
        }
      });
    });
    MODAL_PRODUCT?.addEventListener('change', updateGoodsSumPreview);
    MODAL_QTY?.addEventListener('input', updateGoodsSumPreview);
    MODAL_UNIT_PRICE?.addEventListener('input', updateGoodsSumPreview);
    MODAL_PRODUCT?.addEventListener('change', () => {
      const order = getActiveOrder();
      const product = normalizeProductName(String(MODAL_PRODUCT instanceof HTMLSelectElement ? MODAL_PRODUCT.value : ''));
      const defaultPrice = order ? getDefaultPriceForOrder(order, product) : baseUnitPrice(product, 1);
      if (MODAL_UNIT_PRICE instanceof HTMLInputElement) MODAL_UNIT_PRICE.value = String(defaultPrice);
      updateGoodsSumPreview();
    });
    MODAL_QTY?.addEventListener('input', () => {
      const order = getActiveOrder();
      const product = normalizeProductName(String(MODAL_PRODUCT instanceof HTMLSelectElement ? MODAL_PRODUCT.value : ''));
      const defaultPrice = order
        ? getDefaultPriceForOrder(order, product)
        : baseUnitPrice(product, Math.min(50, Math.max(1, Number(MODAL_QTY instanceof HTMLInputElement ? MODAL_QTY.value : 1) || 1)));
      if (MODAL_UNIT_PRICE instanceof HTMLInputElement) MODAL_UNIT_PRICE.value = String(defaultPrice);
      updateGoodsSumPreview();
    });
    CLIENT_PRICE_PRODUCT?.addEventListener('change', () => {
      const order = getActiveOrder();
      if (!order) return;
      const key = normalizeClientKey(order);
      const product = String(CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement ? CLIENT_PRICE_PRODUCT.value : '');
      const price = getClientProductPrice(key, product) || PRODUCT_PRICE_MAP[product] || 0;
      if (CLIENT_PRICE_PRODUCT_VALUE instanceof HTMLInputElement) CLIENT_PRICE_PRODUCT_VALUE.value = String(price);
    });
    MODAL_SLOT_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        setModalSlot(String(btn.getAttribute('data-opx-slot') || '09:00-14:00'));
      });
    });
    MODAL_DATE_TODAY?.addEventListener('click', () => {
      if (MODAL_DELIVERY_DATE instanceof HTMLInputElement) MODAL_DELIVERY_DATE.value = isoDate(new Date());
      updateQuickDateButtons();
    });
    MODAL_DATE_TOMORROW?.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      if (MODAL_DELIVERY_DATE instanceof HTMLInputElement) MODAL_DELIVERY_DATE.value = isoDate(d);
      updateQuickDateButtons();
    });
    MODAL_DATE_MONDAY?.addEventListener('click', () => {
      if (MODAL_DELIVERY_DATE instanceof HTMLInputElement) MODAL_DELIVERY_DATE.value = nextMondayIsoDate();
      updateQuickDateButtons();
    });
    MODAL_DELIVERY_DATE?.addEventListener('change', updateQuickDateButtons);
    OPEN_CLIENT_CARD_BTN?.addEventListener('click', openClientCardModal);
    CLIENT_CARD_CLOSE?.addEventListener('click', closeClientCardModal);
    CLIENT_CARD_CANCEL?.addEventListener('click', closeClientCardModal);
    CLIENT_CARD_SAVE?.addEventListener('click', saveClientCardChanges);
    CLIENT_CARD_TAB_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        setClientCardTab(String(btn.getAttribute('data-opx-cc-tab') || 'orders'));
      });
    });
    OPEN_CLIENT_MAP_BTN?.addEventListener('click', openClientMapModal);
    CLIENT_MAP_CLOSE?.addEventListener('click', closeClientMapModal);
    CLIENT_MAP_CANCEL?.addEventListener('click', closeClientMapModal);
    CLIENT_MAP_APPLY?.addEventListener('click', () => {
      const address = composeAddressFromFields();
      if (address) {
        state.mapSelectedAddress = address;
        if (CLIENT_MAP_SELECTED instanceof HTMLElement) CLIENT_MAP_SELECTED.textContent = address;
        if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) CLIENT_ADDRESS_INPUT.value = address;
      }
      closeClientMapModal();
    });
    CLIENT_MAP_SEARCH_BTN?.addEventListener('click', () => {
      void searchOnClientMap();
    });
    CLIENT_MAP_CLEAR_BTN?.addEventListener('click', () => {
      state.mapSelectedAddress = '';
      state.mapSelectedCoords = null;
      if (CLIENT_MAP_SELECTED instanceof HTMLElement) CLIENT_MAP_SELECTED.textContent = '—';
      if (CLIENT_MAP_SEARCH instanceof HTMLInputElement) CLIENT_MAP_SEARCH.value = '';
      if (CLIENT_MAP_CITY instanceof HTMLInputElement) CLIENT_MAP_CITY.value = 'Оренбург';
      if (CLIENT_MAP_STREET instanceof HTMLInputElement) CLIENT_MAP_STREET.value = '';
      if (CLIENT_MAP_HOUSE instanceof HTMLInputElement) CLIENT_MAP_HOUSE.value = '';
      if (CLIENT_MAP_APARTMENT instanceof HTMLInputElement) CLIENT_MAP_APARTMENT.value = '';
      if (CLIENT_MAP_ENTRANCE instanceof HTMLInputElement) CLIENT_MAP_ENTRANCE.value = '';
      if (CLIENT_MAP_FLOOR instanceof HTMLInputElement) CLIENT_MAP_FLOOR.value = '';
      if (clientMapMarker) {
        clientMap?.removeLayer(clientMapMarker);
        clientMapMarker = null;
      }
    });
    CLIENT_MAP_SEARCH?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void searchOnClientMap();
      }
    });
    CLIENT_MAP_STREET?.addEventListener('input', () => {
      const query = normalizeAddressPart(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
      if (state.streetSuggestTimer) window.clearTimeout(state.streetSuggestTimer);
      if (query.length < 1) {
        renderStreetSuggestBox([]);
        syncAddressDraft();
        return;
      }
      const localNow = getLocalStreetSuggestions(query);
      renderStreetSuggestBox(localNow);
      state.streetSuggestTimer = window.setTimeout(async () => {
        const remote = await suggestStreets(query);
        const local = getLocalStreetSuggestions(query);
        const streets = Array.from(new Set([...local, ...remote])).slice(0, 10);
        renderStreetSuggestBox(streets);
      }, 250);
      syncAddressDraft();
      autoLocateByStreetAndHouse();
    });
    CLIENT_MAP_STREET?.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (document.activeElement === CLIENT_MAP_STREET) return;
        renderStreetSuggestBox([]);
      }, 180);
    });
    [CLIENT_MAP_CITY, CLIENT_MAP_STREET, CLIENT_MAP_HOUSE].forEach((input) => {
      input?.addEventListener('input', autoLocateByStreetAndHouse);
    });
    [CLIENT_MAP_CITY, CLIENT_MAP_STREET, CLIENT_MAP_HOUSE, CLIENT_MAP_APARTMENT, CLIENT_MAP_ENTRANCE, CLIENT_MAP_FLOOR].forEach((input) => {
      input?.addEventListener('input', syncAddressDraft);
    });
    [CLIENT_MAP_CITY, CLIENT_MAP_STREET, CLIENT_MAP_HOUSE].forEach((input) => {
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          void searchOnClientMap();
        }
      });
    });
    ORDER_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target === ORDER_MODAL) {
        closeOrderModal();
        return;
      }
      if (target.getAttribute('data-opx-modal-close') === 'backdrop') closeOrderModal();
    });
    CLIENT_CARD_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.getAttribute('data-opx-client-close') === 'backdrop') closeClientCardModal();
    });
    CLIENT_MAP_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const streetBtn = target.closest('[data-opx-street]');
      if (streetBtn instanceof HTMLElement && CLIENT_MAP_STREET instanceof HTMLInputElement) {
        CLIENT_MAP_STREET.value = normalizeStreetName(String(streetBtn.getAttribute('data-opx-street') || ''));
        renderStreetSuggestBox([]);
        syncAddressDraft();
        autoLocateByStreetAndHouse();
        return;
      }
      if (target.getAttribute('data-opx-map-close') === 'backdrop') closeClientMapModal();
    });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === 'opxModalClose' || target.closest('#opxModalClose')) {
        closeOrderModal();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (CLIENT_MAP_MODAL instanceof HTMLElement && !CLIENT_MAP_MODAL.hidden) {
        closeClientMapModal();
        return;
      }
      if (CLIENT_CARD_MODAL instanceof HTMLElement && !CLIENT_CARD_MODAL.hidden) {
        closeClientCardModal();
        return;
      }
      if (ORDER_MODAL instanceof HTMLElement && !ORDER_MODAL.hidden) closeOrderModal();
    });
  }

  async function init() {
    if (!ensureAccess()) return;
    if (DATE instanceof HTMLInputElement) {
      DATE.value = isoDate(new Date());
      state.date = DATE.value;
    }
    await loadOrders();
    applyFilters();
    render();
    bind();
  }

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
})();
