(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const BODY = document.getElementById('opxOrdersBody');
  function notifyOrdersChanged() {
    window.EkvalineOrdersSync?.notifyOrdersDataChanged?.();
  }
  const BULK_SELECT_ALL = document.getElementById('opxBulkSelectAll');
  const BULK_STATUS_SELECT = document.getElementById('opxBulkStatusSelect');
  const BULK_APPLY_BTN = document.getElementById('opxBulkApplyBtn');
  const BULK_CLEAR_BTN = document.getElementById('opxBulkClearBtn');
  const SEARCH = document.getElementById('opxSearchInput');
  const DATE = document.getElementById('opxDateFilter');
  const DATE_PREV_BTN = document.getElementById('opxDatePrevBtn');
  const DATE_NEXT_BTN = document.getElementById('opxDateNextBtn');
  const CLEAR_DATE = document.getElementById('opxClearDateBtn');
  const DAY_BTNS = Array.from(document.querySelectorAll('[data-opx-day]'));
  const REFRESH = document.getElementById('opxRefreshBtn');
  const LOGOUT = document.getElementById('opxLogoutBtn');
  const NEW_ORDERS_INBOX_BTN = document.getElementById('opxNewOrdersInboxBtn');
  const NEW_ORDERS_MODAL = document.getElementById('opxNewOrdersModal');
  const NEW_ORDERS_MODAL_LIST = document.getElementById('opxNewOrdersModalList');
  const NEW_ORDERS_MODAL_CLOSE = document.getElementById('opxNewOrdersModalClose');
  const NEW_ORDERS_MODAL_DISMISS = document.getElementById('opxNewOrdersModalDismiss');
  const COUNT = document.getElementById('opxOrdersCount');
  const TOTAL_SUM = document.getElementById('opxTotalSum');
  const FOOTER_PAY_CASH = document.getElementById('opxFooterPayCash');
  const FOOTER_PAY_NONCASH = document.getElementById('opxFooterPayNoncash');
  const FOOTER_PAY_SETTLEMENT = document.getElementById('opxFooterPaySettlement');
  const FOOTER_PAY_CARD = document.getElementById('opxFooterPayCard');
  const FOOTER_BOTTLES = document.getElementById('opxFooterBottles');
  const FOOTER_SUM_HINT = document.getElementById('opxFooterSumHint');
  const ORDERS_LIVE_HINT = document.getElementById('opxOrdersLiveHint');
  const NEW_COUNT = document.getElementById('opxNewCount');
  const TAB_ORDERS = document.getElementById('opxTabOrders');
  const TAB_MAP = document.getElementById('opxTabMap');
  const TAB_REPORTS = document.getElementById('opxTabReports');
  const TAB_SETTINGS = document.getElementById('opxTabSettings');
  const SETTINGS_OVERLAY = document.getElementById('opxSettingsOverlay');
  const SETTINGS_DAYS_LIST = document.getElementById('opxSettingsDaysList');
  const SETTINGS_STATUS = document.getElementById('opxSettingsStatus');
  const SETTINGS_LAST_CHANGE = document.getElementById('opxSettingsLastChange');
  const SETTINGS_CLOSE = document.getElementById('opxCloseSettings');
  const TOAST = document.getElementById('opxToast');
  const TOAST_TAG = document.getElementById('opxToastTag');
  const TOAST_TEXT = document.getElementById('opxToastText');
  const TOAST_CLOSE = document.getElementById('opxToastClose');
  const CONFIRM_MODAL = document.getElementById('opxConfirmModal');
  const CONFIRM_TITLE = document.getElementById('opxConfirmTitle');
  const CONFIRM_MESSAGE = document.getElementById('opxConfirmMessage');
  const CONFIRM_OK_BTN = document.getElementById('opxConfirmOkBtn');
  const CONFIRM_CANCEL_BTN = document.getElementById('opxConfirmCancelBtn');
  const ZONE_MAP_OVERLAY = document.getElementById('opxZoneMapOverlay');
  const ZONE_MAP_CANVAS = document.getElementById('opxZoneMapCanvas');
  const ZONE_MAP_ADDRESS_LIST = document.getElementById('opxZoneMapAddressList');
  const ZONE_MAP_CLOSE = document.getElementById('opxCloseZoneMap');
  const REPORTS_OVERLAY = document.getElementById('opxReportsOverlay');
  const REPORTS_DATE_FROM = document.getElementById('opxReportsDateFrom');
  const REPORTS_DATE_TO = document.getElementById('opxReportsDateTo');
  const REPORTS_BUILD_BTN = document.getElementById('opxReportsBuildBtn');
  const REPORTS_HEADING = document.getElementById('opxReportsHeading');
  const REPORTS_THEAD = document.getElementById('opxReportsThead');
  const REPORTS_BODY = document.getElementById('opxReportsBody');
  const REPORTS_TFOOT = document.getElementById('opxReportsTfoot');
  const REPORTS_ORDERS = document.getElementById('opxReportOrdersCount');
  const REPORTS_ITEMS = document.getElementById('opxReportItemsCount');
  const REPORTS_SUM = document.getElementById('opxReportTotalSum');
  const REPORTS_DELIVERED = document.getElementById('opxReportDeliveredCount');
  const REPORTS_CANCELLED = document.getElementById('opxReportCancelledCount');
  const REPORTS_JOURNAL_META = document.getElementById('opxReportsJournalMeta');
  const REPORTS_JOURNAL_BODY = document.getElementById('opxJournalReportBody');
  const REPORTS_CATEGORIES_META = document.getElementById('opxReportsCategoriesMeta');
  const REPORTS_CATEGORIES_MOUNT = document.getElementById('opxReportsCategoriesMount');
  const REPORTS_CATEGORIES_DAY = document.getElementById('opxReportsCategoriesDay');
  const REPORTS_CANCEL_META = document.getElementById('opxReportsCancelMeta');
  const REPORTS_CANCEL_BODY = document.getElementById('opxCancelReportBody');
  const REPORTS_PRINT_AREA = document.getElementById('opxReportsPrintArea');
  const REPORTS_PRINT_BTN = document.getElementById('opxReportsPrintBtn');
  const REPORTS_PDF_BTN = document.getElementById('opxReportsPdfBtn');
  const ORDER_MODAL = document.getElementById('opxOrderModal');
  const ORDER_TAB_BTNS = Array.from(document.querySelectorAll('[data-opx-ord-tab]'));
  const ORDER_PANELS = Array.from(document.querySelectorAll('[data-opx-ord-panel]'));
  const ORDER_PANELS_WRAP = document.getElementById('opxOrdPanels');
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
  const ORDER_CART_LIST = document.getElementById('opxOrderCartList');
  const ORDER_CART_ADD_BTN = document.getElementById('opxOrderCartAddBtn');
  const ORDER_CART_WATER_BTN = document.getElementById('opxOrderCartWaterBtn');
  const ORDER_CART_CATALOG_PICKER = document.getElementById('opxOrderCartCatalogPicker');
  const ORDER_CART_CATALOG_PICKER_BODY = document.getElementById('opxOrderCartCatalogPickerBody');
  const ORDER_CART_TOTAL = document.getElementById('opxOrderCartTotal');
  const ORDER_CART_EMPTY = document.getElementById('opxOrderCartEmpty');
  const MODAL_DRIVER = document.getElementById('opxModalDriver');
  const MODAL_NOTE = document.getElementById('opxModalNote');
  const ORDER_REASON_OVERLAY = document.getElementById('opxOrderReasonOverlay');
  const ORDER_REASON_TITLE = document.getElementById('opxOrderReasonTitle');
  const ORDER_REASON_HINT = document.getElementById('opxOrderReasonHint');
  const ORDER_REASON_SPAN_LABEL = document.getElementById('opxOrderReasonSpanLabel');
  const ORDER_REASON_TEXT = document.getElementById('opxOrderReasonText');
  const ORDER_REASON_CONFIRM = document.getElementById('opxOrderReasonConfirm');
  const ORDER_REASON_DISMISS = document.getElementById('opxOrderReasonDismiss');
  const MODAL_RESCHEDULE_BTN = document.getElementById('opxModalRescheduleBtn');
  const MODAL_CANCEL_ORDER_BTN = document.getElementById('opxModalCancelOrderBtn');
  const MODAL_DELETE_ORDER_BTN = document.getElementById('opxModalDeleteOrderBtn');
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
  const CREATE_ORDER_BTN = document.getElementById('opxCreateOrderBtn');
  const CLIENT_SUGGEST = document.getElementById('opxModalClientSuggest');
  const ORDER_NOTES_TBODY = document.getElementById('opxOrderNotesTbody');
  const ORDER_NOTES_ADD = document.getElementById('opxOrderNotesAdd');
  const ORDER_NOTES_DELETE = document.getElementById('opxOrderNotesDelete');
  const ORDER_NOTES_BULLETS = document.getElementById('opxOrderNotesBullets');
  const ORDER_NOTES_DOCK = document.getElementById('opxOrderNotesDock');
  const ORDER_NOTES_DOCK_LIST = document.getElementById('opxOrderNotesDockList');
  const ORDER_NOTES_DOCK_DETAILS = document.getElementById('opxOrderNotesDockDetails');
  const FILTERS_MODAL = document.getElementById('opxFiltersModal');
  const FILTERS_TITLE = document.getElementById('opxFiltersModalTitle');
  const FILTERS_OPEN_BTN = document.getElementById('opxOpenFiltersBtn');
  const ORDERS_EXPORT_BTN = document.getElementById('opxOrdersExportBtn');
  const ORDERS_PRINT_SHEET = document.getElementById('opxOrdersPrintSheet');
  const ORDERS_PDF_EXPORT_SHEET = document.getElementById('opxOrdersPdfExportSheet');
  const REPORTS_PDF_SHEET = document.getElementById('opxReportsPdfSheet');
  const FILTERS_CLOSE_BTN = document.getElementById('opxFiltersCloseBtn');
  const FILTERS_CLOSE_FOOTER = document.getElementById('opxFiltersCloseFooterBtn');
  const FILTERS_DISABLE_BTN = document.getElementById('opxFiltersDisableBtn');
  const FILTERS_SLOT_BTNS = Array.from(document.querySelectorAll('[data-opx-adv-slot]'));
  const FILTERS_ADV_PAYMENT = document.getElementById('opxAdvPayment');
  const FILTERS_ADV_ZONE = document.getElementById('opxAdvZone');
  const FILTERS_ADV_STATUS = document.getElementById('opxAdvOrderStatus');
  const FILTERS_ADV_DRIVER = document.getElementById('opxAdvDriver');
  const FILTERS_ADV_PRODUCT = document.getElementById('opxAdvProduct');
  const FILTERS_ADV_WEEKDAY = document.getElementById('opxAdvWeekday');
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
    /** Заказ открыт из балуна карты — после «Сохранить» вернуться на карту */
    orderModalFromMap: false,
    /** Уже подставлены данные повторного клиента (по телефону) */
    clientRepeatAppliedKey: '',
    reportsOpen: false,
    settingsOpen: false,
    /** Активный лист отчёта на оверлее: journal | forwarders | categories | cancellations */
    reportsPane: 'journal',
    /** Заказы в текущем отчёте: доставка в периоде + из журнала */
    reportsScopeOrders: [],
    reportsAuditEvents: [],
    /** Куда записать адрес после выбора на карте — поля клиентской карточки или модалки заказа (черновик) */
    clientMapApplyTarget: 'client',
    /** Открыто создание заказа в общей модалке #opxOrderModal без id в базе */
    creatingOrder: false,
    /** Позиции во вкладке «Товары» (как корзина на сайте) */
    orderModalCartLines: [],
    modalClientSuggestTimer: null,
    advanced: {
      /** Один выбранный интервал: ключ data-opx-adv-slot ('all' | morning | …). */
      slot: 'all',
      payment: 'all',
      zone: 'all',
      driver: 'all',
      weekday: 'all',
      product: 'all',
      sumKind: 'all',
    },
  };

  function defaultAdvancedFilters() {
    return {
      slot: 'all',
      payment: 'all',
      zone: 'all',
      driver: 'all',
      weekday: 'all',
      product: 'all',
      sumKind: 'all',
    };
  }

  const CLIENT_PRICE_OVERRIDES_KEY = 'ekvaline_client_price_overrides';
  const CLIENT_PRODUCT_PRICES_KEY = 'ekvaline_client_product_prices';
  const ORDER_JOURNAL_KEY = 'ekvaline_order_journal';
  /** События отчётов офлайн (если PATCH не дошёл до сервера) */
  const OPERATOR_AUDIT_LOCAL_KEY = 'ekvaline_operator_audit_events_local';
  const CLIENT_OPERATOR_NOTES_KEY = 'ekvaline_operator_client_notes_v1';
  const ORDER_PINNED_NOTE_TYPE = 'order_pinned';
  const ORDER_PINNED_DRAFT_BUCKET = '__draft_ord';

  const WEEKDAY_OPTS = [
    { v: '0', label: 'Понедельник' },
    { v: '1', label: 'Вторник' },
    { v: '2', label: 'Среда' },
    { v: '3', label: 'Четверг' },
    { v: '4', label: 'Пятница' },
    { v: '5', label: 'Суббота' },
    { v: '6', label: 'Воскресенье' },
  ];

  let modalClientSuggestList = [];
  let modalClientSuggestActiveIdx = -1;
  let modalClientSuggestPinned = false;
  /** Выбранные заказы для массовой смены статуса (ключ — id как в таблице, trim). */
  let bulkSelectedIds = new Set();
  let bulkHeaderProgrammatic = false;
  let bulkApplyRunning = false;
  let orderModalSaveBusy = false;
  /** Отдельно от сохранения правки: создание заказа не должно блокироваться залипшим busy от PATCH. */
  let orderModalCreateBusy = false;
  /** Вкладка «Заметки»: выбранная строка таблицы (data-note-id) */
  let selectedOrderNoteRowId = '';
  /** Ключи localStorage: заметки клиента и закреплённые заметки конкретного заказа */
  let orderNotesActiveClientBucket = '';
  let orderNotesActiveOrderBucket = '';
  /** Открывали «Заметки» в этом открытии модалки — иначе при закрытии не перезаписываем хранилище пустой таблицей. */
  let orderNotesVisitedThisOpen = false;
  /** Сценарий всплывающего окна причины: перенос или отмена заказа */
  let orderReasonOverlayIntent = null;
  /** Кэш полей поиска по заказам — не пересобирать haystack на каждый символ в строке поиска. */
  let orderSearchHayCache = new Map();
  function clearOrderSearchHayCache() {
    orderSearchHayCache.clear();
  }
  /** Счётчик запросов loadOrders — отбрасываем устаревший ответ при гонках. */
  let loadOrdersSeq = 0;
  let searchInputDebounceTimer = null;
  let filtersModalOpen = false;
  let newOrdersInboxOpen = false;
  let filtersModalStaticReady = false;

  /** Имена из заказов для фильтров; в модалке — только водители из БД (роль driver). */
  let mergedDriverChoices = [];
  /** Водители из БД — единственный источник для назначения заказа. */
  let operatorRegisteredDrivers = [];
  const OPERATOR_NOTE_TYPES = [
    { value: 'simple', label: 'Простая заметка' },
    { value: 'order_info', label: 'Информация для заказа' },
    { value: 'call_reminder', label: 'Напоминание позвонить клиенту' },
    { value: 'delete_reason', label: 'Причина удаления клиента' },
    { value: 'order_pinned', label: 'Закреплённое примечание к заказу' },
  ];
  /** Позиции как на catalog.html (отображаемые названия + сопоставление с API). */
  const CLIENT_CATALOG_DEFS = [
    {
      displayName: 'Вода 18.9л',
      categoryKey: 'water',
      water: true,
      tierPrice: true,
      defaultPrice: 220,
      match: (n) => /эквалайн|19\s*л|18\.?9|^вода$/i.test(String(n || '')),
    },
    {
      displayName: 'Кулер для воды Vatten L 45 NE',
      categoryKey: 'equipment',
      defaultPrice: 29900,
      match: (n) => /vatten|l\s*45|l45/i.test(String(n || '')),
    },
    {
      displayName: 'Кулер для воды AEL LK-AEL-47c black/silver',
      categoryKey: 'equipment',
      defaultPrice: 7450,
      match: (n) => /ael|lk-ael|47c/i.test(String(n || '')),
    },
    {
      displayName: 'Электрическая помпа',
      categoryKey: 'equipment',
      defaultPrice: 2100,
      match: (n) => /электр.*помп|помп.*электр|smart/i.test(String(n || '')),
    },
    {
      displayName: 'Помпа механическая',
      categoryKey: 'accessories',
      defaultPrice: 600,
      match: (n) => /механ.*помп|помп.*механ/i.test(String(n || '')),
    },
    {
      displayName: 'Пустая тара',
      categoryKey: 'accessories',
      defaultPrice: 400,
      match: (n) => /пуст.*тар|(^|\s)тара(\s|$)/i.test(String(n || '')),
    },
    {
      displayName: 'Одноразовые стаканы',
      categoryKey: 'accessories',
      defaultPrice: 0,
      match: (n) => /стакан|одноразов/i.test(String(n || '')),
    },
  ];
  let operatorCatalogRows = CLIENT_CATALOG_DEFS.map((def) => ({
    ...def,
    id: null,
    apiName: def.displayName,
    price: def.defaultPrice,
    categoryName: '',
  }));
  let products = operatorCatalogRows.map((entry) => entry.displayName);
  const districts = ['Подхват', 'Степной', 'Центр', 'доп.зона'];
  const streetFallback = [
    'Салмышская', 'Родимцева', 'Пролетарская', 'Просторная', 'Терешковой', 'Чкалова', 'Советская',
    'Туркестанская', 'Брестская', 'Комсомольская', 'Победы', 'Донгузская', 'Монтажников', 'Новая',
    'Гаранькина', 'Ткачева', 'Автомобилистов', 'Поляничко', 'Дзержинского', 'Карпова', 'Красносельная', 'Нежинское',
    'Степная', 'Станкостроителей', 'Студенческая', 'Строителей', 'Северная', 'Самолетная', 'Саморядова'
  ];
  let clientMapCtl = null;
  let zoneMapCtl = null;
  /** orderId → [lat, lng] для списка адресов и фокуса на карте */
  const zoneMapOrderCoords = new Map();
  /** Координаты, выбранные оператором на «Карте клиента» (если авто-геокод не нашёл дом). */
  const ZONE_ORDER_COORD_OVERRIDE = new Map();
  /** Успешно геокодированные точки по нормализованному ключу адреса */
  const ZONE_ADDRESS_COORD_CACHE = new Map();
  /** Адрес геокодировался без результата — не дергать Nominatim повторно в сессии */
  const ZONE_ADDRESS_GEO_NO_RESULT = new Set();
  let zoneMarkersBuildGeneration = 0;
  let zoneMarkersRedrawTimer = null;
  let zoneNominatimLastCall = 0;
  let zoneCoordsPrefetchGeneration = 0;
  let zoneCoordsPrefetchTimer = null;
  /** За один debounced prefetch — лимит реальных запросов к Nominatim (без этого фон может грузить тысячи адресов × ~1 с). */
  const MAX_ZONE_PREFETCH_GEO_CALLS_PER_RUN = 42;

  const statusLabels = {
    new: 'В обработке',
    pending_operator: 'В обработке',
    confirmed: 'Подтверждён',
    processing: 'В пути',
    courier: 'В пути',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };
  const SLOT_PRESETS = {
    '09:00-14:00': { from: '09:00', to: '14:00' },
    '14:00-17:00': { from: '14:00', to: '17:00' },
    '17:00-21:00': { from: '17:00', to: '21:00' },
    '09:00-17:00': { from: '09:00', to: '17:00' },
  };

  function padHmToken(raw) {
    const [hRaw, mRaw] = String(raw ?? '')
      .split(':')
      .map((x) => String(x ?? '').trim().replace(/^0+(?=\d)/, ''));
    const h = Number.parseInt(String(hRaw || '0'), 10);
    const m = Number.parseInt(String(mRaw || '0'), 10);
    const hh = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
    const mm = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  function slotKey(raw) {
    const fn = window.DeliverySlots?.normalizeDeliverySlotKey;
    return typeof fn === 'function' ? fn(raw) : String(raw ?? '').trim();
  }

  /** Интервал доставки как ключ SLOT_PRESETS (тире, пробелы, «правильное» или «нетипичное» тире из кабинета). */
  function normalizeDeliverySlotStored(raw) {
    const text = String(raw ?? '').trim();
    if (text && SLOT_PRESETS[text]) return text;
    const flat = String(text)
      .replace(/\u2013|\u2014|\u2212/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    const m = /(\d{1,2}\s*:\s*\d{2})\s*-\s*(\d{1,2}\s*:\s*\d{2})/.exec(flat);
    if (m) {
      const cand = `${padHmToken(m[1])}-${padHmToken(m[2])}`;
      if (SLOT_PRESETS[cand]) return cand;
    }
    return '09:00-14:00';
  }
  const ZONE_COLORS = {
    Подхват: '#c62828',
    Степной: '#ef6c00',
    Центр: '#1565c0',
    'доп.зона': '#7b1fa2',
    delivered: '#2e7d32',
  };
  const ZONE_CENTERS = {
    Подхват: [51.805, 55.108],
    Степной: [51.838, 55.165],
    Центр: [51.772, 55.102],
    'доп.зона': [51.728, 55.158],
  };

  /** Статусы «в пути» (жёлтая строка при назначенном водителе). */
  const WORK_ORDER_STATUSES = new Set(['on_way', 'processing', 'courier']);

  const MAP_STATUS_COLORS = {
    confirmed: '#f57c00',
    onWay: '#e53935',
    delivered: '#2e7d32',
  };

  function normalizeOrderStatus(raw) {
    return String(raw || 'new').trim().toLowerCase();
  }

  function orderIsCancelled(orderLike) {
    return normalizeOrderStatus(orderLike?.status) === 'cancelled';
  }

  function orderHasAssignedDriver(orderLike) {
    const d = String(orderLike?.driver ?? '').trim();
    return d.length > 0 && !/^не\s*назначен/i.test(d);
  }

  function orderIsInWorkStatus(orderLike) {
    return WORK_ORDER_STATUSES.has(normalizeOrderStatus(orderLike?.status));
  }

  /** Водитель отметил доставку — зелёная строка (обновляется при авто-опросе списка). */
  function orderShowsDeliveredHighlight(orderLike) {
    if (orderIsCancelled(orderLike)) return false;
    return normalizeOrderStatus(orderLike?.status) === 'delivered';
  }

  /** Статус «В пути» или назначен водитель — жёлтая строка. */
  function orderShowsInWorkHighlight(orderLike) {
    if (orderIsCancelled(orderLike)) return false;
    if (orderShowsDeliveredHighlight(orderLike)) return false;
    if (orderIsInWorkStatus(orderLike)) return true;
    return orderHasAssignedDriver(orderLike);
  }

  /** Не в пути и без водителя — красная строка. */
  function orderShowsUnassignedHighlight(orderLike) {
    if (orderIsCancelled(orderLike)) return false;
    if (orderShowsDeliveredHighlight(orderLike)) return false;
    if (orderShowsInWorkHighlight(orderLike)) return false;
    return true;
  }

  function operatorRowHighlightClass(order) {
    if (orderShowsDeliveredHighlight(order)) return 'opx-row-delivered';
    if (orderShowsInWorkHighlight(order)) return 'opx-row-in-work';
    if (orderShowsUnassignedHighlight(order)) return 'opx-row-unassigned';
    return '';
  }

  function refreshOperatorRowHighlight(order) {
    if (!(BODY instanceof HTMLElement) || !order) return;
    const key = String(order.id ?? '').trim();
    if (!key) return;
    const rows = BODY.querySelectorAll('tr[data-opx-order-id]');
    for (const row of rows) {
      if (!(row instanceof HTMLTableRowElement)) continue;
      if (String(row.getAttribute('data-opx-order-id') || '').trim() !== key) continue;
      row.className = operatorRowHighlightClass(order);
      row.setAttribute('data-opx-status', normalizeOrderStatus(order.status));
      break;
    }
  }

  function operatorOrdersTableRefresh() {
    applyFilters();
    render();
    notifyOrdersChanged();
  }

  /** Базовые цены каталога; вода — поштучно через baseUnitPrice (220 / 190 / 175). */
  const PRODUCT_PRICE_MAP = Object.fromEntries(
    operatorCatalogRows.map((entry) => [entry.displayName, entry.defaultPrice])
  );
  PRODUCT_PRICE_MAP['Вода'] = 220;

  function rebuildOperatorCatalogFromApi(apiProducts) {
    const rows = Array.isArray(apiProducts) ? apiProducts : [];
    operatorCatalogRows = CLIENT_CATALOG_DEFS.map((def) => {
      const hit = rows.find((p) => def.match(String(p?.name || '').trim()));
      const price = hit ? Math.round(Number(hit.price) || 0) : def.defaultPrice;
      return {
        ...def,
        id: hit?.id ?? null,
        apiName: hit ? String(hit.name || '').trim() : def.displayName,
        price,
        categoryName: hit?.category_name || '',
      };
    });
    operatorCatalogRows.forEach((entry) => {
      PRODUCT_PRICE_MAP[entry.displayName] = entry.price;
      if (entry.water) PRODUCT_PRICE_MAP['Вода'] = entry.price;
    });
    products = operatorCatalogRows.map((r) => r.displayName);
    ensureProductOptions();
    renderOrderCartCatalogPicker();
  }

  function findCatalogRowByName(rawName, productId) {
    const pid = Number(productId);
    if (Number.isFinite(pid) && pid > 0) {
      const byId = operatorCatalogRows.find((r) => Number(r.id) === pid);
      if (byId) return byId;
    }
    const norm = String(rawName || '').trim().toLowerCase();
    if (!norm) return operatorCatalogRows[0] || null;
    const exact = operatorCatalogRows.find(
      (r) => r.displayName.toLowerCase() === norm || String(r.apiName || '').toLowerCase() === norm
    );
    if (exact) return exact;
    if (norm === 'вода' || norm === 'тара' || norm === 'стаканчики') {
      if (norm === 'вода') return operatorCatalogRows.find((r) => r.water) || operatorCatalogRows[0];
      if (norm === 'тара') return operatorCatalogRows.find((r) => /тара/i.test(r.displayName));
      if (norm === 'стаканчики') return operatorCatalogRows.find((r) => /стакан/i.test(r.displayName));
    }
    for (const row of operatorCatalogRows) {
      if (row.match(String(rawName || ''))) return row;
    }
    return (
      operatorCatalogRows.find(
        (r) =>
          r.displayName.toLowerCase().includes(norm) || norm.includes(r.displayName.toLowerCase())
      ) || operatorCatalogRows[0]
    );
  }

  function clientPriceProductKey(displayName) {
    const row = findCatalogRowByName(displayName);
    if (row?.water) return 'Вода';
    return row?.displayName || String(displayName || '').trim();
  }

  async function loadOperatorCatalogFromApi() {
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) return;
    try {
      const response = await api.json('/api/products');
      if (!response.ok || !Array.isArray(response.data?.products)) return;
      rebuildOperatorCatalogFromApi(response.data.products);
    } catch {
      /* значения по умолчанию из catalog.html */
    }
  }

  /** Как сохраняется в order.payment при выборе в #opxModalPayment («Рассчетный счет») */
  const PAYMENT_SETTLEMENT_INVOICE_VALUE = 'Рассчетный счет';
  const PAYMENT_MODAL_CASH = 'Наличная';
  const PAYMENT_MODAL_NONCASH = 'Безнал';
  const PAYMENT_MODAL_CARD = 'Карта';
  /** Варианты «Форма оплаты» в модалке фильтров (всегда все три). */
  const PAYMENT_FILTER_OPTS = [
    ['cash', PAYMENT_MODAL_CASH],
    ['noncash', PAYMENT_MODAL_NONCASH],
    [PAYMENT_SETTLEMENT_INVOICE_VALUE, PAYMENT_SETTLEMENT_INVOICE_VALUE],
  ];
  const DEFAULT_CITY = 'Оренбург';
  const ORENBURG_VIEWBOX = {
    left: 54.82,
    top: 51.94,
    right: 55.38,
    bottom: 51.58,
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
    if (k) return `${k}@geov6`;
    return `__orphan:${String(order?.id ?? '')}`;
  }

  function geoCacheKeysForAddressRaw(addressRaw, orderLike) {
    const keys = new Set();
    const norm = normalizedGeoKey(addressRaw);
    if (norm) keys.add(`${norm}@geov6`);
    if (orderLike) {
      const ok = geoCacheKeyForOrder(orderLike);
      if (ok && !ok.startsWith('__orphan:')) keys.add(ok);
    }
    return keys;
  }

  /** Запомнить точку с «Карты клиента» для карты заказов (обходит «Адрес не найден»). */
  function rememberZoneAddressCoords(addressRaw, lat, lng, orderIdOpt) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !coordsInOrenburgView(lat, lng)) return;
    const coord = { lat, lng };
    const orderKey = orderIdOpt != null ? String(orderIdOpt).trim() : String(getActiveOrder()?.id ?? '').trim();
    const orderLike = orderKey ? { id: orderKey, address: addressRaw } : getActiveOrder();
    if (orderKey) ZONE_ORDER_COORD_OVERRIDE.set(orderKey, coord);
    geoCacheKeysForAddressRaw(addressRaw, orderLike).forEach((key) => {
      ZONE_ADDRESS_COORD_CACHE.set(key, coord);
      ZONE_ADDRESS_GEO_NO_RESULT.delete(key);
    });
    if (state.zoneMapOpen) renderZoneMapMarkers();
  }

  function resolveZoneMapCoordsForOrder(order) {
    const orderKey = String(order?.id ?? '').trim();
    if (orderKey) {
      const manual = ZONE_ORDER_COORD_OVERRIDE.get(orderKey);
      if (
        manual &&
        Number.isFinite(manual.lat) &&
        Number.isFinite(manual.lng) &&
        coordsInOrenburgView(manual.lat, manual.lng)
      ) {
        return manual;
      }
    }
    const geoKey = geoCacheKeyForOrder(order);
    const cached = ZONE_ADDRESS_COORD_CACHE.get(geoKey);
    if (
      cached &&
      Number.isFinite(cached.lat) &&
      Number.isFinite(cached.lng) &&
      coordsInOrenburgView(cached.lat, cached.lng)
    ) {
      return cached;
    }
    return null;
  }

  function zoneMapAddressListItemMeta(order, onMap, geoMiss) {
    const dotColor = mapMarkerStrokeColor(order);
    const ui = operatorUiStatusFromDb(order?.status);
    let rowClass = '';
    if (ui === 'delivered') rowClass = ' is-status-delivered';
    else if (ui === 'on_way') rowClass = ' is-status-in-work';
    else if (ui === 'confirmed') rowClass = ' is-status-confirmed';
    let statusHint = onMap ? 'На карте' : geoMiss ? 'Адрес не найден' : 'Уточняется…';
    if (onMap) {
      if (ui === 'delivered') statusHint = 'Доставлен · на карте';
      else if (ui === 'on_way') statusHint = 'В пути · на карте';
      else if (ui === 'confirmed') statusHint = 'Подтверждён · на карте';
    }
    return { dotColor, rowClass, statusHint };
  }

  function zoneColorForName(zoneName) {
    const z = normalizeZoneName(zoneName);
    return ZONE_COLORS[z] || ZONE_COLORS['Подхват'];
  }

  /** Улица/микрорайон для структурированного геокодера. */
  function formatStreetForGeocode(parsed, addressRaw) {
    if (!parsed?.street) return '';
    const street = String(parsed.street).trim();
    const raw = cleanOrderAddressForGeocode(addressRaw);
    if (/мкр\.?|микрорайон/i.test(raw) && !/микр|мкр/i.test(street)) {
      return `микрорайон ${street}`;
    }
    return street;
  }

  function addressImpliesMicrodistrict(addressRaw) {
    return /мкр\.?|микрорайон/i.test(cleanOrderAddressForGeocode(addressRaw));
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

  function inferCityFromAddress(_addressRaw) {
    return DEFAULT_CITY;
  }

  function isOrenburgCityName(city) {
    const t = normalizeToken(city);
    return t === 'оренбург' || t.includes('оренбург');
  }

  function enforceOrenburgCityField() {
    if (CLIENT_MAP_CITY instanceof HTMLInputElement) {
      if (!isOrenburgCityName(CLIENT_MAP_CITY.value)) CLIENT_MAP_CITY.value = DEFAULT_CITY;
    }
  }

  function normalizeStreetTokenForMatch(name) {
    return normalizeToken(stripRussianStreetPrefix(name));
  }

  function streetNameMatchesKnown(street, candidates) {
    const want = normalizeStreetTokenForMatch(street);
    if (!want || want.length < 2) return false;
    for (let i = 0; i < candidates.length; i += 1) {
      const got = normalizeStreetTokenForMatch(candidates[i]);
      if (!got) continue;
      if (got === want || got.startsWith(want) || want.startsWith(got)) return true;
    }
    return false;
  }

  async function collectOrenburgStreetCandidates(query) {
    const q = normalizeAddressPart(query);
    const local = getLocalStreetSuggestions(q);
    let remote = [];
    try {
      remote = await suggestStreets(q);
    } catch {
      remote = [];
    }
    return Array.from(new Set([...local, ...remote, ...streetFallback]));
  }

  async function validateStreetInOrenburg(street) {
    const st = normalizeStreetName(street);
    if (st.length < 2) return false;
    const candidates = await collectOrenburgStreetCandidates(st);
    if (streetNameMatchesKnown(st, candidates)) return true;
    const probe = await geocodeByFields(DEFAULT_CITY, st, '1', `${DEFAULT_CITY}, ул. ${st}`);
    return Boolean(probe && coordsInOrenburgView(probe.lat, probe.lon));
  }

  function validateClientMapAddressSync() {
    enforceOrenburgCityField();
    const city = normalizeAddressPart(CLIENT_MAP_CITY instanceof HTMLInputElement ? CLIENT_MAP_CITY.value : DEFAULT_CITY) || DEFAULT_CITY;
    const street = normalizeStreetName(CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : '');
    const house = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
    if (!isOrenburgCityName(city)) {
      return { ok: false, error: 'Доставка только по Оренбургу.' };
    }
    if (street.length < 2) {
      return { ok: false, error: 'Укажите улицу из подсказки (улицы Оренбурга).' };
    }
    if (!house) {
      return { ok: false, error: 'Укажите номер дома.' };
    }
    if (state.mapSelectedCoords) {
      const lat = Number(state.mapSelectedCoords.lat);
      const lon = Number(state.mapSelectedCoords.lon);
      if (!coordsInOrenburgView(lat, lon)) {
        return { ok: false, error: 'Точка на карте вне зоны доставки Оренбурга.' };
      }
    }
    return { ok: true, city, street, house };
  }

  function normalizeParsedHouse(raw) {
    if (raw == null || raw === '') return '';
    let h = String(raw).trim().replace(/^[\s,;-]+/, '');
    h = h.replace(/\s+/g, '');
    return h;
  }

  /** Убираем тип улицы, остаётся имя для сопоставления с Nominatim. */
  function stripRussianStreetPrefix(line) {
    return String(line || '').replace(
      /^(ул\.?|улица|проспект|пр-кт|пр\.|переулок|пер\.|шоссе|бульвар|б-р\.?|мкр\.?|микрорайон|набережная|наб\.?)\s+/iu,
      ''
    ).trim();
  }

  /** «Салмышская 41» / «..., д. 5» без отдельного фрагмента с домом. */
  function trailingHouseFromLine(line) {
    let l = String(line || '').trim();
    let house = '';
    let m = /\b(?:д(?:ом)?\.?)\s*(\d+[\w\-\/а-яА-Я]*)$/iu.exec(l);
    if (m) {
      house = normalizeParsedHouse(m[1]);
      l = l.slice(0, m.index).trim();
      return { line: l, house };
    }
    m = /^(.*?)\s+(\d+[а-яА-Я]?|\d+\/\d+)$/u.exec(l);
    if (m && m[1].trim().length >= 2)
      return { line: m[1].trim(), house: normalizeParsedHouse(m[2]) };
    return { line: l, house: '' };
  }

  /**
   * Токены адреса (без города и индекса) для скоринга результатов Nominatim,
   * если основной парсер улицы не сработал.
   */
  function addressTokensForLoosePick(addressRaw) {
    const parts = cleanOrderAddressForGeocode(addressRaw)
      .split(/[,;]/u)
      .map((p) => p.trim())
      .filter(Boolean);
    const out = [];
    for (const rawPart of parts) {
      let p = rawPart.replace(/^\d{6}\s*,?\s*/, '');
      if (/^(?:г\.?\s*)?оренбург$/iu.test(p) || /^россия$/iu.test(p)) continue;
      if (/^\+?\d[\d\s().\-]{9,}$/.test(rawPart.trim())) continue;
      let t = normalizeStreetToken(stripRussianStreetPrefix(p)).replace(/\s/g, '');
      if (/^\d{1,5}$/.test(t)) continue;
      if (
        !/^д(?:ом)?.?$/.test(t) &&
        t.length >= 4 &&
        !/^дом/.test(normalizeStreetToken(p))
      )
        out.push(t);
    }
    return out;
  }

  /** Улица и дом для второго запроса к API (узкий поиск дома по Оренбургу). */
  function parseRussianStreetHouseFromAddress(addressRaw) {
    const s0 = cleanOrderAddressForGeocode(addressRaw);
    if (!s0) return null;
    const s = s0.replace(/^\s*\d{6}\s*,?\s*/, '').trim();

    const typedPatterns = [
      /(?:^|[,\s])(?:ул\.?|улица)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])(?:проспект|пр-кт|пр\.)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])(?:переулок|пер\.)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])шоссе\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])(?:бульвар|б-р\.?)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])(?:микрорайон|мкр\.?)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
      /(?:^|[,\s])(?:набережная|наб\.?)\s+([^,]+?),?\s*(?:д\.?|дом)?\s*([\d]+\s*[\d\/\-а-яА-Я]*)?/iu,
    ];
    for (let ri = 0; ri < typedPatterns.length; ri += 1) {
      const m = s.match(typedPatterns[ri]);
      if (!m || !m[1]) continue;
      const th = trailingHouseFromLine(m[1].trim());
      const hn = normalizeParsedHouse(m[2]) || th.house;
      const street = stripRussianStreetPrefix(th.line).replace(/\.$/, '').trim();
      if (street.length >= 2) return { street, house: hn };
    }

    const inlinePatterns = [
      /\b(?:ул\.?|улица)\s+([А-Яа-яЁё\s\-«»"']{2,80}?)\s+(?:д\.?|дом\.?)?\s*(\d+[\w\-\/а-яА-Я]*)/iu,
      /\b(?:проспект|пр-кт|пр\.)\s+([А-Яа-яЁё\s\-«»"']{2,80}?)\s+(?:д\.?|дом\.?)?\s*(\d+[\w\-\/а-яА-Я]*)/iu,
      /\bпереулок\s+([А-Яа-яЁё\s\-«»"']{2,80}?)\s+(?:д\.?|дом\.?)?\s*(\d+[\w\-\/а-яА-Я]*)/iu,
    ];
    for (let ii = 0; ii < inlinePatterns.length; ii += 1) {
      const m = s.match(inlinePatterns[ii]);
      if (!m || !m[1]) continue;
      return {
        street: stripRussianStreetPrefix(m[1].trim()).replace(/\.$/, '').trim(),
        house: normalizeParsedHouse(m[2]),
      };
    }

    const body = s0.split(/[,;]/u).map((p) => p.trim()).filter(Boolean);
    const parts = body.filter(
      (p) => !/^\d{6}$/.test(p) && !/^(?:г\.?\s*)?оренбург$/iu.test(p) && !/^россия$/iu.test(p)
    );
    if (!parts.length) return null;

    if (parts.length === 1) {
      const splitOnce = trailingHouseFromLine(stripRussianStreetPrefix(parts[0]));
      const hs = normalizeParsedHouse(splitOnce.house);
      const nm = stripRussianStreetPrefix(splitOnce.line || '').replace(/\.$/, '').trim();
      return nm.length >= 2 ? { street: nm, house: hs } : null;
    }

    let lastPart = parts[parts.length - 1];
    let house = '';
    let streetBlob = '';

    const dmEnd = /^(?:д\.?|дом\.?)\s*(\d+[\w\-\/а-яА-Я]*)$/iu.exec(lastPart);
    const loneNum = /^(\d+[а-яА-Я]?|\d+\/\d+)$/u.exec(lastPart);
    if (dmEnd) {
      house = dmEnd[1];
      streetBlob = parts.length >= 2 ? parts[parts.length - 2] : '';
    } else if (loneNum) {
      house = loneNum[1];
      streetBlob = parts.length >= 2 ? parts[parts.length - 2] : '';
    } else {
      streetBlob = lastPart;
    }

    const split = trailingHouseFromLine(stripRussianStreetPrefix(streetBlob || ''));
    house = normalizeParsedHouse(house) || split.house;
    const street = split.line.replace(/\.$/, '').trim();
    return street.length >= 2 ? { street, house } : null;
  }

  /** Очередь: один межзапросный интервал Nominatim на все источники (карта + prefetch). */
  let nominatimQueueTailZone = Promise.resolve();

  function nominatimResultFromItem(item) {
    if (!item) return null;
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      lat,
      lon,
      address: String(item.display_name || '').trim(),
      details: item.address || {},
    };
  }

  function normalizeStreetToken(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\b(улица|ул\.?|проспект|пр-кт|переулок|пер\.?|шоссе|бульвар|б-р|микрорайон|мкр\.?)\b/g, ' ')
      .replace(/[^а-яё0-9\s/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function streetTokensMatch(roadField, displayName, wantedStreet) {
    const w = normalizeStreetToken(wantedStreet).replace(/\s/g, '');
    if (w.length < 3) return false;
    const bundle = normalizeStreetToken(`${roadField || ''} ${displayName || ''}`).replace(/\s/g, '');
    if (!bundle) return false;
    if (bundle.includes(w)) return true;
    const stem = w.slice(0, Math.min(8, w.length));
    return stem.length >= 5 && bundle.includes(stem);
  }

  function houseTokensMatch(houseFromApi, wantedHouse) {
    if (!wantedHouse) return true;
    const w = String(wantedHouse).replace(/\s/g, '').toLowerCase();
    if (!w) return true;
    const h = String(houseFromApi || '')
      .replace(/\s/g, '')
      .toLowerCase();
    if (!h) return false;
    return h === w || h.includes(w) || w.includes(h);
  }

  /**
   * Nominatim часто ставит на первое место не тот объект. Берём лучший кандидат по совпадению улицы/дома.
   */
  function pickBestNominatimItem(list, addressRaw) {
    if (!Array.isArray(list) || !list.length) return null;
    const parsed = parseRussianStreetHouseFromAddress(addressRaw);
    const wantedStreet = parsed?.street || '';
    const wantedHouse = parsed?.house ? String(parsed.house).trim() : '';

    if (!wantedStreet) {
      const looseTokens = addressTokensForLoosePick(addressRaw);
      let hnLoose =
        parsed && parsed.house ? normalizeParsedHouse(parsed.house).toLowerCase() : '';
      if (!hnLoose) {
        const segs = cleanOrderAddressForGeocode(addressRaw)
          .split(/[,;]/u)
          .map((x) => x.trim())
          .filter(Boolean);
        const lm = /^(\d+[а-яА-Я]?|\d+\/\d+)$/iu.exec(segs[segs.length - 1] || '');
        if (lm) hnLoose = lm[1].replace(/\s/g, '').toLowerCase();
      }

      let bestLoose = null;
      let bestLooseScore = -1;
      for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (!isOrenburgAddress(item)) continue;
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!coordsInOrenburgView(lat, lon)) continue;

        let score = Number(item.importance);
        score = Number.isFinite(score) ? Math.min(8, score * 5) : 0;

        if (looseTokens.length) {
          const disp = normalizedGeoKey(String(item.display_name || '')).replace(/\s/g, '');
          for (let ti = 0; ti < looseTokens.length; ti += 1) {
            const tok = looseTokens[ti];
            if (!tok || tok.length < 4) continue;
            if (disp.includes(tok)) score += 38;
            else {
              const st = tok.slice(0, Math.min(7, tok.length));
              if (st.length >= 5 && disp.includes(st)) score += 23;
            }
          }
        }
        if (hnLoose) {
          const apiH = String((item.address || {}).house_number || '')
            .replace(/\s/g, '')
            .toLowerCase();
          if (apiH && (apiH === hnLoose || apiH.includes(hnLoose) || hnLoose.includes(apiH))) score += 30;
        }

        const tCls = `${item.class || ''} ${item.type || ''}`;
        if (/building|house|residential|address/i.test(tCls)) score += 8;

        if (score > bestLooseScore) {
          bestLooseScore = score;
          bestLoose = item;
        }
      }
      /* Не принимаем случайную первую точку в bbox без совпадения с текстом адреса. */
      const minLoose = looseTokens.length >= 2 ? 44 : looseTokens.length === 1 ? 30 : -1;
      if (bestLoose && looseTokens.length && bestLooseScore >= minLoose) return nominatimResultFromItem(bestLoose);
      return null;
    }

    let best = null;
    let bestScore = -1;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (!isOrenburgAddress(item)) continue;
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!coordsInOrenburgView(lat, lon)) continue;
      const addr = item.address || {};
      const road = [addr.road, addr.street, addr.pedestrian, addr.residential, addr.neighbourhood].filter(Boolean).join(' ');
      const suburb = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district].filter(Boolean).join(' ');
      const disp = String(item.display_name || '');
      let score = 0;
      if (streetTokensMatch(road, disp, wantedStreet)) score += 55;
      else if (streetTokensMatch(suburb, disp, wantedStreet)) score += 50;
      else if (normalizedGeoKey(disp).includes(normalizedGeoKey(wantedStreet).replace(/\s/g, ''))) score += 38;
      if (addressImpliesMicrodistrict(addressRaw) && suburb && streetTokensMatch(suburb, disp, wantedStreet)) score += 18;

      const hn = String(addr.house_number || addr.house || '').trim();
      if (wantedHouse && houseTokensMatch(hn, wantedHouse)) score += 45;
      else if (wantedHouse && normalizedGeoKey(disp).includes(String(wantedHouse).toLowerCase())) score += 28;

      const t = `${item.class || ''} ${item.type || ''} ${addr.type || ''}`;
      if (/building|house|residential|address|place/i.test(t)) score += 10;
      if (/^house$/i.test(String(item.osm_type)) || String(item.category || '') === 'building') score += 4;

      const imp = Number(item.importance);
      if (Number.isFinite(imp)) score += Math.min(10, imp * 6);

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    let minOk = 38;
    if (wantedStreet && wantedHouse) minOk = 48;
    else if (wantedStreet) minOk = 36;

    if (!best || bestScore < minOk) return null;
    return nominatimResultFromItem(best);
  }

  async function nominatimThrottleZoneMap() {
    const exec = nominatimQueueTailZone.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, 1120 - (now - zoneNominatimLastCall));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      zoneNominatimLastCall = Date.now();
    });
    nominatimQueueTailZone = exec.catch(() => {});
    await exec;
  }

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  /** Снимок профиля в LS — совпадает с cookie-сессией; иначе после входа клиентом «залипает» прошлый оператор. */
  function persistStaffUserFromApi(u) {
    if (!u || typeof u !== 'object') return;
    const name =
      String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() || String(u.email || '');
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({
        id: u.id,
        name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
        bonus_balance: u.bonus_balance,
      })
    );
  }

  /** Подтверждённая сессия на сервере (не доверяем только localStorage — защита от подмены в DevTools). */
  let staffSessionOk = false;

  /** Синхронизация с сессией сервера после POST /api/auth/login (и при смене localhost ↔ 127.0.0.1 с отдельными localStorage). */
  async function hydrateStaffFromServerSession() {
    staffSessionOk = false;
    const api = window.EkvalineAPI?.json ? window.EkvalineAPI : null;
    if (!api) return;
    try {
      const r = await api.json('/api/auth/me');
      if (!r.ok) {
        if (Number(r.status) === 401 || Number(r.status) === 403) {
          const cur = readUser();
          const curRole = String(cur?.role || '').toLowerCase();
          if (cur && ['operator', 'manager', 'admin'].includes(curRole)) {
            try {
              localStorage.removeItem(CURRENT_USER_KEY);
            } catch {
              /* ignore */
            }
          }
        }
        return;
      }

      const u = r.data?.user;
      if (u && typeof u === 'object') {
        const role = String(u.role || '').toLowerCase();
        if (['operator', 'manager', 'admin'].includes(role)) staffSessionOk = true;
        persistStaffUserFromApi(u);
        return;
      }

      /** Сессии нет, а в LS остался оператор/админ после выхода или истечения cookie — не открываем панель «вхолостую». */
      const cur = readUser();
      const curRole = String(cur?.role || '').toLowerCase();
      if (cur && ['operator', 'manager', 'admin'].includes(curRole)) localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      /* сеть недоступна — оставляем только localStorage */
    }
  }

  function ensureAccess() {
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (api && !staffSessionOk) {
      window.location.href = 'index.html';
      return false;
    }
    const user = readUser();
    const role = String(user?.role || '').toLowerCase();
    if (!user || !['operator', 'manager', 'admin'].includes(role)) {
      window.location.href = 'index.html';
      return false;
    }
    /** Старый «фейковый» вход сохранял id как строку роли — API давал 401 и сразу выкидывал на главную. */
    if (role === 'operator' || role === 'admin' || role === 'manager') {
      const id = Number(user.id);
      if (!Number.isFinite(id) || id <= 0) {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = 'index.html';
        return false;
      }
    }
    return true;
  }

  function opxLimits() {
    return typeof window.OpxFieldLimits === 'object' && window.OpxFieldLimits ? window.OpxFieldLimits : null;
  }

  const OPERATOR_TOAST_PHRASES = {
    'API недоступен': 'Сервер не отвечает. Запустите npm start и обновите страницу (F5).',
    'Ошибка сети при загрузке заказов.': 'Заказы не загрузились — нет связи с сервером. Нажмите «Обновить» (⟳).',
    'Ошибка сети при сохранении заказа.': 'Заказ не сохранился — нет связи с сервером. Повторите через несколько секунд.',
    'Ошибка сети при создании заказа': 'Заказ не создан — нет связи с сервером. Проверьте интернет и повторите.',
    'Ошибка при обновлении.': 'Список не обновился. Нажмите «Обновить» (⟳) ещё раз.',
    'Сбой при загрузке — проверьте консоль или сеть.': 'Не всё загрузилось. Обновите страницу (F5) или проверьте npm start.',
    'Не удалось получить заказы. Проверьте сервер или ответ не JSON.':
      'Сервер ответил с ошибкой. Перезагрузите страницу (F5) и проверьте npm start.',
    'Не удалось сохранить настройки': 'Настройки приёма заказов не сохранились. Повторите или обновите страницу.',
    'Не удалось выполнить сохранение': 'Изменения не сохранились. Повторите действие.',
    'Адрес не найден': 'Адрес не найден. Проверьте улицу и дом или выберите точку на карте.',
    'Заказ не найден в списке': 'Такого заказа нет в таблице. Нажмите «Обновить» (⟳).',
    'Готовим PDF…': 'Формируем PDF…',
    'PDF сохранён': 'Файл PDF сохранён на компьютер.',
    'Сохраняем PDF (альбом)…': 'Сохраняем PDF…',
    'PDF недоступен — открываем печать': 'PDF не получился — открываем окно печати.',
    'PDF не сохранился — открываем печать': 'PDF не сохранился — открываем окно печати.',
    'Отчёт пересчитан': 'Отчёт пересчитан за выбранный период.',
    'Список обновлён': 'Список заказов обновлён.',
    'Фильтр отключён': 'Фильтр снят — показаны все заказы.',
    'Выбор снят': 'Отметки с заказов сняты.',
    'Подставлен состав прошлого заказа клиента': 'В заказ подставлен состав прошлой покупки клиента.',
    'Этот интервал недоступен на выбранную дату': 'На эту дату выбранный интервал доставки недоступен.',
    'Точка на карте ещё не определена — дождитесь геокодирования адреса':
      'Адрес ещё ищется на карте. Подождите несколько секунд.',
    'Выберите допустимый статус': 'Выберите статус из списка.',
    'Отметьте заказы или включите «Все на экране»': 'Отметьте заказы галочками или включите «Все на экране».',
    'Нет отмеченных заказов': 'Нет отмеченных заказов — сначала выберите строки в таблице.',
    'Заполните дату доставки, интервал и форму оплаты':
      'Укажите дату доставки, интервал и способ оплаты.',
    'Заполните дату доставки, интервал и оплату': 'Укажите дату доставки, интервал и способ оплаты.',
    'Укажите дату доставки в формате ГГГГ-ММ-ДД': 'Дата доставки: формат ГГГГ-ММ-ДД (например, 2026-06-15).',
    'Сервер не вернул id заказа — список будет обновлён.':
      'Заказ, похоже, создан — обновляем список заказов.',
    'Заказ мог быть создан — нажмите «Обновить» (⟳) в таблице.':
      'Если заказ не появился — нажмите «Обновить» (⟳) в таблице.',
  };

  function operatorToastVariantLabel(variant) {
    if (variant === 'success') return 'Готово';
    if (variant === 'error') return 'Ошибка';
    return 'Сообщение';
  }

  function clarifyOperatorToastMessage(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    if (OPERATOR_TOAST_PHRASES[raw]) return OPERATOR_TOAST_PHRASES[raw];
    if (/не JSON/i.test(raw)) {
      return 'Сервер ответил с ошибкой. Перезагрузите страницу (F5) и проверьте npm start.';
    }
    if (/^изменено:/i.test(raw)) {
      return raw
        .replace(/^изменено:\s*(\d+)/i, 'Статус обновлён у $1')
        .replace(/без изменений:\s*(\d+)/i, 'без изменений: $1')
        .replace(/ошибок:\s*(\d+)/i, 'ошибок: $1');
    }
    return raw;
  }

  function paintOperatorToastChrome(variant) {
    const v = variant === 'success' || variant === 'error' ? variant : 'info';
    if (TOAST instanceof HTMLElement) TOAST.dataset.variant = v;
    if (TOAST_TAG instanceof HTMLElement) {
      TOAST_TAG.textContent = operatorToastVariantLabel(v);
      TOAST_TAG.hidden = false;
    }
  }

  function showToast(text, hideAfterMs = 2800, variant = 'info') {
    if (!(TOAST instanceof HTMLElement) || !(TOAST_TEXT instanceof HTMLElement)) return;
    const msg = clarifyOperatorToastMessage(text);
    if (!msg) return;
    if (TOAST.parentElement !== document.body) document.body.appendChild(TOAST);
    TOAST_TEXT.textContent = msg;
    const v = variant === 'success' || variant === 'error' ? variant : 'info';
    paintOperatorToastChrome(v);
    TOAST.hidden = false;
    TOAST.classList.remove('is-visible');
    const ms =
      typeof hideAfterMs === 'number' && hideAfterMs > 0
        ? hideAfterMs
        : v === 'error'
          ? 5200
          : 3200;
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    window.requestAnimationFrame(() => {
      TOAST.classList.add('is-visible');
    });
    state.toastTimer = window.setTimeout(() => {
      TOAST.classList.remove('is-visible');
      TOAST.hidden = true;
    }, ms);
  }

  function showToastHtml(html, hideAfterMs = 3200, variant = 'info') {
    if (!(TOAST instanceof HTMLElement) || !(TOAST_TEXT instanceof HTMLElement)) return;
    const markup = String(html || '').trim();
    if (!markup) return;
    if (TOAST.parentElement !== document.body) document.body.appendChild(TOAST);
    TOAST_TEXT.innerHTML = markup;
    const v = variant === 'success' || variant === 'error' ? variant : 'info';
    paintOperatorToastChrome(v);
    TOAST.hidden = false;
    TOAST.classList.remove('is-visible');
    const ms =
      typeof hideAfterMs === 'number' && hideAfterMs > 0
        ? hideAfterMs
        : v === 'error'
          ? 5200
          : 3200;
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    window.requestAnimationFrame(() => {
      TOAST.classList.add('is-visible');
    });
    state.toastTimer = window.setTimeout(() => {
      TOAST.classList.remove('is-visible');
      TOAST.hidden = true;
    }, ms);
  }

  function showOrderSavedToast(orderId, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const idKey = String(orderId || '').trim();
    const prefix = String(opts.prefix || 'Заказ сохранён').trim();
    const suffix = opts.localOnly ? ' (локально)' : '';
    if (!idKey) {
      showToast(`${prefix}${suffix}.`, opts.duration ?? 3600, 'success');
      return;
    }
    const idLabel = displayOrderId(idKey);
    const html = `${escapeHtml(prefix)}${escapeHtml(suffix)} <button type="button" class="opx-toast-order-link" data-opx-open-order="${escapeHtml(idKey)}">${escapeHtml(idLabel)}</button>`;
    showToastHtml(html, opts.duration ?? 4800, 'success');
  }

  let confirmResolve = null;

  function closeOpxConfirm(result) {
    if (!(CONFIRM_MODAL instanceof HTMLElement)) {
      if (confirmResolve) {
        const done = confirmResolve;
        confirmResolve = null;
        done(Boolean(result));
      }
      return;
    }
    CONFIRM_MODAL.classList.remove('is-open');
    CONFIRM_MODAL.hidden = true;
    CONFIRM_MODAL.setAttribute('aria-hidden', 'true');
    refreshBodyBackdropClass();
    if (confirmResolve) {
      const done = confirmResolve;
      confirmResolve = null;
      done(Boolean(result));
    }
  }

  function showOpxConfirm(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const title = String(opts.title || 'Подтверждение');
    const message = String(opts.message || '');
    const okLabel = String(opts.okLabel || 'Да');
    const cancelLabel = String(opts.cancelLabel || 'Отмена');
    const danger = opts.variant === 'danger';

    if (!(CONFIRM_MODAL instanceof HTMLElement)) {
      return Promise.resolve(window.confirm(message || title));
    }

    return new Promise((resolve) => {
      confirmResolve = resolve;
      if (CONFIRM_TITLE instanceof HTMLElement) CONFIRM_TITLE.textContent = title;
      if (CONFIRM_MESSAGE instanceof HTMLElement) CONFIRM_MESSAGE.textContent = message;
      if (CONFIRM_OK_BTN instanceof HTMLButtonElement) {
        CONFIRM_OK_BTN.textContent = okLabel;
        CONFIRM_OK_BTN.classList.toggle('opx-modal-btn-danger', danger);
        CONFIRM_OK_BTN.classList.toggle('opx-modal-btn-primary', !danger);
      }
      if (CONFIRM_CANCEL_BTN instanceof HTMLButtonElement) CONFIRM_CANCEL_BTN.textContent = cancelLabel;
      CONFIRM_MODAL.hidden = false;
      CONFIRM_MODAL.classList.add('is-open');
      CONFIRM_MODAL.setAttribute('aria-hidden', 'false');
      refreshBodyBackdropClass();
      window.requestAnimationFrame(() => {
        if (CONFIRM_OK_BTN instanceof HTMLButtonElement) CONFIRM_OK_BTN.focus();
      });
    });
  }

  /** Состояние кнопки «Сохранить» пока PATCH/POST в карточке заказа. */
  function setOrderModalSaveBusy(busy, labelBusy = 'Сохранение…') {
    if (!(MODAL_SAVE_BTN instanceof HTMLButtonElement)) return;
    if (busy) {
      if (!MODAL_SAVE_BTN.dataset.opxIdleLabel) {
        MODAL_SAVE_BTN.dataset.opxIdleLabel = (MODAL_SAVE_BTN.textContent || '').trim() || 'Сохранить';
      }
      MODAL_SAVE_BTN.textContent = labelBusy;
      MODAL_SAVE_BTN.classList.add('is-busy');
      MODAL_SAVE_BTN.setAttribute('aria-busy', 'true');
      MODAL_SAVE_BTN.disabled = true;
    } else {
      MODAL_SAVE_BTN.textContent = MODAL_SAVE_BTN.dataset.opxIdleLabel || 'Сохранить';
      MODAL_SAVE_BTN.classList.remove('is-busy');
      MODAL_SAVE_BTN.removeAttribute('aria-busy');
      MODAL_SAVE_BTN.disabled = false;
    }
  }

  /** Ответ API 401/403: нет сессии или недостаточно прав — на главную. */
  function redirectOnUnauthorized(status, data) {
    const s = Number(status);
    if (s !== 401 && s !== 403) return false;
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      /* ignore */
    }
    const q = data && data.sessionExpired ? 'session-expired=1' : 'need-login=1';
    window.location.href = `index.html?${q}`;
    return true;
  }

  function isoDate(value) {
    if (value == null || value === '') {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const d = value;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const s = String(value).trim();
    /** Поле даты вида YYYY-MM-DD нельзя гнать только через Date('YYYY-MM-DD') — в ряде зон это UTC‑полночь и календарный день «плывёт». */
    const ym = /^(\d{4})-(\d{2})-(\d{2})/;
    let m = ym.exec(s);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s.replace(/\//g, '.'));
    if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function earliestDeliveryDateIso() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoDate(d);
  }

  const MODAL_DELIVERY_DATE_HINT = document.getElementById('opxModalDeliveryDateHint');

  /** Числовой id строки в БД (только заказы, загруженные/созданные через API). */
  function orderDbId(orderLike) {
    if (!orderLike || typeof orderLike !== 'object') return 0;
    const sid = Number(orderLike._serverId);
    if (Number.isFinite(sid) && sid > 0) return Math.trunc(sid);
    const id = orderLike.id;
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) return Math.trunc(id);
    if (typeof id === 'string' && /^\d+$/.test(id.trim())) return Number(id.trim());
    return 0;
  }

  function orderIsServerPersisted(orderLike) {
    return orderDbId(orderLike) > 0;
  }

  function stampOrderServerId(orderLike) {
    if (!orderLike || typeof orderLike !== 'object') return orderLike;
    const n = orderDbId(orderLike);
    if (n > 0) orderLike._serverId = n;
    return orderLike;
  }

  function applyModalDeliveryDateConstraints() {
    if (!(MODAL_DELIVERY_DATE instanceof HTMLInputElement)) return;
    MODAL_DELIVERY_DATE.removeAttribute('min');
    const cur = String(MODAL_DELIVERY_DATE.value || '').trim();
    if (!cur) {
      MODAL_DELIVERY_DATE.value = state.creatingOrder ? earliestDeliveryDateIso() : isoDate(new Date());
    }
    if (MODAL_DATE_TODAY instanceof HTMLButtonElement) {
      MODAL_DATE_TODAY.hidden = false;
      MODAL_DATE_TODAY.disabled = false;
      MODAL_DATE_TODAY.title = '';
    }
    if (MODAL_DELIVERY_DATE_HINT instanceof HTMLElement) {
      MODAL_DELIVERY_DATE_HINT.textContent = state.creatingOrder
        ? 'Оператор может назначить любую дату доставки.'
        : 'Оператор может изменить дату доставки.';
    }
  }

  function operatorDeliveryDateValid(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || '').trim());
  }

  function deliveryDateAllowed(iso) {
    const d = String(iso || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    return d >= earliestDeliveryDateIso();
  }

  /** Та же дата, что в форме при открытии заказа (не «сегодня» при пустом delivery_date в БД). */
  function effectiveDeliveryDateIsoForOrder(order) {
    if (!order || typeof order !== 'object') return '';
    const fromDelivery = String(order.delivery_date ?? '').trim();
    if (fromDelivery) {
      const iso = isoDate(fromDelivery);
      if (iso) return iso;
    }
    return isoDate(order.created_at) || '';
  }

  function orderDeliveryRescheduleChanged(order, deliveryDateInput, slotInput) {
    const storedDateRaw = String(order?.delivery_date ?? '').trim();
    const storedDateIso = storedDateRaw ? isoDate(storedDateRaw) : '';
    const deliveryIso = isoDate(deliveryDateInput);
    const dateChanged = Boolean(storedDateIso) && storedDateIso !== deliveryIso;

    const storedSlotRaw = String(order?.delivery_slot ?? '').trim();
    const slotChanged = Boolean(storedSlotRaw) && slotKey(storedSlotRaw) !== slotKey(slotInput);

    return dateChanged || slotChanged;
  }

  /** Сместить календарную дату ISO (локальный день Y-M-D), не полагаясь на парсинг строки браузером. */
  function shiftIsoCalendarDay(dateStr, deltaDays) {
    const parts = String(dateStr || '')
      .trim()
      .split('-')
      .map((s) => Number(s.trim()));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return isoDate(new Date());
    const [yy, mm, dd] = parts;
    const base = new Date(yy, mm - 1, dd);
    if (Number.isNaN(base.getTime())) return isoDate(new Date());
    base.setDate(base.getDate() + deltaDays);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const day = String(base.getDate()).padStart(2, '0');
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

  /** В панели оператора в журнале всегда «Оператор …», не «Администратор Системы». */
  function getOperatorActorLabel() {
    const user = readUser();
    let name = user ? String(user.name || user.email || '').trim() : '';
    if (/^администратор\s+системы$/i.test(name)) name = '';
    if (name.startsWith('Оператор ')) return name;
    if (name) return `Оператор ${name}`;
    return 'Оператор';
  }

  function displayJournalActorName(entry) {
    const role = String(entry?.actor_role || '').toLowerCase();
    let name = String(entry?.actor_name || entry?.actor || '').trim();
    name = name.replace(/^\[(admin|operator|manager|driver)\]\s*/i, '').trim();
    if (/^администратор\s+системы$/i.test(name)) name = '';
    if (role === 'driver') {
      if (name.startsWith('Водитель ')) return name;
      if (name) return `Водитель ${name}`;
      return 'Водитель';
    }
    if (['operator', 'manager', 'admin', 'system', ''].includes(role) || !name || /^администратор/i.test(name)) {
      if (name.startsWith('Оператор ')) return name;
      if (name) return `Оператор ${name}`;
      return 'Оператор';
    }
    return name || 'Система';
  }

  function journalWhoCellHtml(entry) {
    const role = String(entry?.actor_role || '').toLowerCase();
    const who = displayJournalActorName(entry);
    let chip = 'is-operator';
    if (role === 'driver') chip = 'is-driver';
    else if (role === 'manager') chip = 'is-manager';
    return `<span class="opx-reports-who ${chip}">${escapeHtml(who)}</span>`;
  }

  function auditEventVisibleInOperatorReport(entry) {
    const action = String(entry?.action || '').trim();
    if (action.startsWith('admin_') || action === 'manager_settings') return false;
    const role = String(entry?.actor_role || '').toLowerCase();
    if (role === 'admin') return false;
    return true;
  }

  function paymentLabelDisplay(raw) {
    const p = String(raw ?? '').trim();
    if (!p) return '—';
    const low = p.toLowerCase().replace(/ё/g, 'е');
    if (low === 'cash') return PAYMENT_MODAL_CASH;
    if (low === 'noncash') return PAYMENT_MODAL_NONCASH;
    if (low === 'card' || low === 'карта') return 'Карта';
    if (orderLooksLikeSettlementInvoicePayment(p)) return PAYMENT_SETTLEMENT_INVOICE_VALUE;
    const modal = paymentRawToModalSelectValue(p);
    return modal || p;
  }

  function slotLabelDisplay(raw) {
    const key = normalizeDeliverySlotStored(raw);
    const preset = SLOT_PRESETS[key];
    if (!preset) return String(raw || '—').trim() || '—';
    return `${preset.from} – ${preset.to}`;
  }

  function journalFieldChange(label, fromVal, toVal, format = (v) => String(v ?? '—')) {
    const a = format(fromVal);
    const b = format(toVal);
    if (a === b) return '';
    return `${label}: ${a} → ${b}`;
  }

  function appendOrderJournal(orderId, message) {
    const map = readStore(ORDER_JOURNAL_KEY, {});
    const idKey = String(orderId || '').trim();
    const list = Array.isArray(map[idKey]) ? map[idKey] : [];
    list.unshift({
      at: new Date().toISOString(),
      actor: getOperatorActorLabel(),
      message: String(message || '').trim(),
    });
    map[idKey] = list.slice(0, 120);
    writeStore(ORDER_JOURNAL_KEY, map);
  }

  function getOrderJournal(orderId) {
    const map = readStore(ORDER_JOURNAL_KEY, {});
    return Array.isArray(map[String(orderId || '').trim()]) ? map[String(orderId || '').trim()] : [];
  }

  function journalActionLabel(action) {
    const map = {
      order_create: 'Заказ оформлен клиентом',
      order_operator_create: 'Заказ создан оператором',
      order_patch: 'Изменён заказ',
      operator_patch: 'Изменён заказ оператором',
      order_reschedule: 'Перенос даты или интервала доставки',
      order_status_cancelled: 'Заказ отменён',
      order_delete: 'Заказ удалён оператором',
      order_client_update: 'Клиент изменил заказ',
      order_cancel: 'Заказ отменён клиентом',
      client_patch: 'Клиент изменил заказ',
      driver_mark_delivered: 'Заказ отмечен доставленным',
      admin_address_create: 'Добавлен адрес доставки',
      admin_address_patch: 'Изменён адрес доставки',
      admin_address_delete: 'Удалён адрес доставки',
      admin_zone_patch: 'Изменена зона доставки',
      manager_settings: 'Изменены настройки менеджером',
      delivery_availability: 'Закрыты дни или интервалы приёма заказов',
      admin_delivery_availability: 'Закрыты дни или интервалы (администратор)',
      admin_user_patch: 'Изменён пользователь администратором',
      login: 'Вход в систему',
      logout: 'Выход из системы',
    };
    const key = String(action || '').trim();
    return map[key] || 'Изменение по заказу';
  }

  function journalDetailIsTechnicalOnly(detail) {
    const d = String(detail || '').trim();
    if (!d) return true;
    if (/^id=\d+$/i.test(d)) return true;
    if (/^[a-z][a-z0-9_]*$/i.test(d) && d.includes('_')) return true;
    return false;
  }

  function journalPatchFieldsHuman(changedKeys) {
    const labels = {
      status: 'статус',
      address: 'адрес',
      delivery_date: 'дата доставки',
      delivery_slot: 'интервал доставки',
      payment_method: 'оплата',
      zone: 'зона',
      driver: 'экспедитор',
      pickup: 'самовывоз',
      total_sum: 'сумма',
      items_json: 'товары',
      courier_note: 'примечание',
    };
    return (Array.isArray(changedKeys) ? changedKeys : [])
      .map((k) => labels[String(k)] || String(k))
      .filter(Boolean);
  }

  function dedupeJournalEntries(entries) {
    const list = Array.isArray(entries) ? entries : [];
    const afterPatchDedupe = list.filter((entry, i, arr) => {
      const action = String(entry.action || '');
      const detail = String(entry.detail || entry.message || '').trim();
      if (action !== 'order_patch' || !/^id=\d+$/i.test(detail)) return true;
      const t = new Date(entry.created_at || entry.at || 0).getTime();
      return !arr.some((other, j) => {
        if (j === i) return false;
        const oa = String(other.action || '');
        if (!['operator_patch', 'order_status_cancelled', 'order_reschedule', 'order_cancel'].includes(oa)) {
          return false;
        }
        const ot = new Date(other.created_at || other.at || 0).getTime();
        return Number.isFinite(t) && Number.isFinite(ot) && Math.abs(ot - t) < 120000;
      });
    });
    const afterIdDedupe = afterPatchDedupe.filter((entry, i, arr) => {
      const detail = String(entry.detail || entry.message || '').trim();
      if (!/^id=\d+$/i.test(detail)) return true;
      const action = String(entry.action || '');
      const t = new Date(entry.created_at || entry.at || 0).getTime();
      return !arr.some((other, j) => {
        if (j === i) return false;
        if (String(other.action || '') !== action) return false;
        const od = String(other.detail || other.message || '').trim();
        if (/^id=\d+$/i.test(od)) return false;
        const ot = new Date(other.created_at || other.at || 0).getTime();
        return Number.isFinite(t) && Number.isFinite(ot) && Math.abs(ot - t) < 180000;
      });
    });
    return afterIdDedupe.filter((entry, i, arr) => {
      if (!entry.action) return true;
      const shortMsg = journalEntryMessage(entry).trim().toLowerCase();
      if (shortMsg !== 'заказ создан оператором' && shortMsg !== 'создан оператором') return true;
      const t = new Date(entry.created_at || entry.at || 0).getTime();
      return !arr.some((other, j) => {
        if (j === i) return false;
        if (other.action) return false;
        const om = String(other.message || '').trim().toLowerCase();
        if (!om.includes('оператор')) return false;
        const ot = new Date(other.created_at || other.at || 0).getTime();
        return Number.isFinite(t) && Number.isFinite(ot) && Math.abs(ot - t) < 180000;
      });
    });
  }

  function auditEventIsJsonMeta(text) {
    const s = String(text || '').trim();
    if (!s.startsWith('{')) return false;
    try {
      const o = JSON.parse(s);
      return Boolean(o && typeof o === 'object' && ('changed' in o || 'fields' in o || 'source' in o));
    } catch {
      return false;
    }
  }

  function auditEventReasonText(entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    const action = String(e.action || '').trim();
    const reason = String(e.reason || e.message || '').trim();
    const detail = String(e.detail || '').trim();

    if (reason && !auditEventIsJsonMeta(reason) && !journalDetailIsTechnicalOnly(reason)) {
      return reason;
    }

    if (detail.startsWith('{')) {
      try {
        const parsed = JSON.parse(detail);
        const changed = journalPatchFieldsHuman(parsed?.changed || parsed?.fields);
        if (parsed?.source === 'cabinet_cancel') {
          return reason && !auditEventIsJsonMeta(reason) ? reason : 'Отмена из личного кабинета';
        }
        if (changed.length) {
          if (action === 'order_status_cancelled' || action === 'order_cancel') {
            if (changed.includes('статус')) return 'Отмена заказа';
            return `Изменены: ${changed.join(', ')}`;
          }
          if (action === 'order_reschedule') {
            return `Перенос: ${changed.join(', ')}`;
          }
          return `Изменены поля: ${changed.join(', ')}`;
        }
      } catch {
        /* ignore */
      }
    }

    if (detail && !auditEventIsJsonMeta(detail) && !journalDetailIsTechnicalOnly(detail)) {
      return detail;
    }
    return reason && !auditEventIsJsonMeta(reason) ? reason : '';
  }

  function journalEntryMessage(entry) {
    const action = String(entry.action || '');
    const reasonText = auditEventReasonText(entry);
    const genericReasons = new Set([
      'изменение заказа (без переноса/отмены)',
      'изменение по заказу',
      'изменение оператором',
    ]);

    if (action === 'order_status_cancelled' || action === 'order_cancel') {
      if (!reasonText || genericReasons.has(reasonText.toLowerCase())) {
        return journalActionLabel(action);
      }
      if (/^заказ отменён/i.test(reasonText)) return reasonText;
      return `Заказ отменён. Причина: ${reasonText}`;
    }
    if (action === 'order_reschedule') {
      if (!reasonText || genericReasons.has(reasonText.toLowerCase())) {
        return journalActionLabel(action);
      }
      if (/^перенос/i.test(reasonText)) return reasonText;
      return `Перенос доставки. Причина: ${reasonText}`;
    }
    if (reasonText && !genericReasons.has(reasonText.toLowerCase())) {
      return reasonText;
    }
    return journalActionLabel(action);
  }

  function renderJournalListHtml(entries) {
    const rows = dedupeJournalEntries(entries);
    if (!rows.length) return '<p class="opx-cc-empty">Изменений пока нет.</p>';
    return rows
      .map((entry) => {
        const ts = entry.created_at || entry.at;
        const dt = ruDateTime(ts);
        const dtText = typeof dt === 'object' ? `${dt.datePart} ${dt.timePart}` : String(ts || '');
        if (entry.action) {
          const actor = displayJournalActorName(entry);
          const msg = journalEntryMessage(entry);
          return `<div class="opx-cc-item"><strong>${escapeHtml(dtText)}</strong><span>${escapeHtml(actor)}: ${escapeHtml(msg)}</span></div>`;
        }
        return `<div class="opx-cc-item"><strong>${escapeHtml(dtText)}</strong><span>${escapeHtml(
          displayJournalActorName(entry)
        )}: ${escapeHtml(String(entry.message || 'Изменение'))}</span></div>`;
      })
      .join('');
  }

  async function fetchServerJournal(orderId) {
    const api = window.EkvalineAPI;
    if (!api || !orderId) return [];
    const rid = typeof orderId === 'object' ? orderRestIdForApi(orderId) : orderRestIdForApi(orderId);
    if (!rid || !/^\d+$/.test(rid)) return [];
    const response = await api.json(`/api/orders/${encodeURIComponent(rid)}/journal`);
    if (!response.ok) {
      if (redirectOnUnauthorized(response.status, response.data)) return [];
      return [];
    }
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
      const merged = dedupeJournalEntries(
        [...serverEntries, ...localEntries].sort(
          (a, b) => new Date(b.created_at || b.at || 0).getTime() - new Date(a.created_at || a.at || 0).getTime()
        )
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

  function modalDeliveryDateIso() {
    const raw = MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '';
    return String(raw || '').trim() || isoDate(new Date());
  }

  function slotEndMinutes(slotKey) {
    const preset = SLOT_PRESETS[normalizeDeliverySlotStored(slotKey)];
    if (!preset) return 0;
    const [h, m] = String(preset.to || '0:0')
      .split(':')
      .map((x) => Number.parseInt(x, 10));
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  }

  /** Слот недоступен, если дата доставки — сегодня и окно интервала уже закончилось. */
  function isSlotExpiredForDate(slotKey, deliveryDateIso) {
    const day = String(deliveryDateIso || '').trim();
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const today = isoDate(new Date());
    if (day !== today) return false;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= slotEndMinutes(slotKey);
  }

  function isModalSlotUnavailable(slotKey, deliveryDateIso) {
    const key = normalizeDeliverySlotStored(slotKey);
    if (!key) return true;
    if (isSlotExpiredForDate(key, deliveryDateIso)) return true;
    if (isBookingDayClosed(deliveryDateIso)) return true;
    if (isBookingSlotClosed(deliveryDateIso, key)) return true;
    return false;
  }

  function firstAvailableModalSlot(deliveryDateIso) {
    for (const btn of MODAL_SLOT_BTNS) {
      const key = normalizeDeliverySlotStored(btn.getAttribute('data-opx-slot'));
      if (!isModalSlotUnavailable(key, deliveryDateIso)) return key;
    }
    return null;
  }

  function applyModalSlot(slotValue) {
    const slot = normalizeDeliverySlotStored(slotValue);
    setModalValue(MODAL_SLOT, slot);
    const preset = SLOT_PRESETS[slot];
    setModalValue(MODAL_TIME_FROM, preset.from);
    setModalValue(MODAL_TIME_TO, preset.to);
    MODAL_SLOT_BTNS.forEach((btn) => {
      const key = normalizeDeliverySlotStored(btn.getAttribute('data-opx-slot'));
      btn.classList.toggle('is-active', key === slot && !btn.disabled);
    });
  }

  function syncModalSlotAvailability() {
    const deliveryDate = modalDeliveryDateIso();
    MODAL_SLOT_BTNS.forEach((btn) => {
      const key = normalizeDeliverySlotStored(btn.getAttribute('data-opx-slot'));
      const unavailable = isModalSlotUnavailable(key, deliveryDate);
      btn.disabled = unavailable;
      btn.classList.toggle('is-disabled', unavailable);
      btn.setAttribute('aria-disabled', unavailable ? 'true' : 'false');
    });
    const current = normalizeDeliverySlotStored(
      String(MODAL_SLOT instanceof HTMLInputElement ? MODAL_SLOT.value : '')
    );
    if (isModalSlotUnavailable(current, deliveryDate)) {
      const next = firstAvailableModalSlot(deliveryDate);
      if (next) applyModalSlot(next);
      else applyModalSlot(current);
    } else {
      applyModalSlot(current);
    }
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
    syncModalSlotAvailability();
  }

  function setModalSlot(slotValue, options = {}) {
    const silent = Boolean(options.silent);
    const deliveryDate = modalDeliveryDateIso();
    let slot = normalizeDeliverySlotStored(slotValue);
    if (isModalSlotUnavailable(slot, deliveryDate)) {
      const next = firstAvailableModalSlot(deliveryDate);
      if (next) {
        slot = next;
        if (!silent) showToast('Этот интервал недоступен на выбранную дату');
      }
    }
    applyModalSlot(slot);
    syncModalSlotAvailability();
  }

  function setOrderModalTab(tabId) {
    const prev = state.orderModalTab;
    if (prev === 'notes' && tabId !== 'notes') {
      const notesSaved = tryFinalizeOrderNotesOnSave();
      if (notesSaved) showToast('Заметки сохранены.', 3200, 'success');
    }
    state.orderModalTab = tabId;
    if (tabId === 'notes') orderNotesVisitedThisOpen = true;
    ORDER_TAB_BTNS.forEach((btn) => {
      const active = btn.getAttribute('data-opx-ord-tab') === tabId;
      btn.classList.toggle('is-active', active);
    });
    ORDER_PANELS.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-opx-ord-panel') !== tabId;
    });
    if (tabId === 'notes') hydrateOrderNotesPanel();
  }

  /** Фиксируем высоту тела модалки по вкладке «Основное», чтобы при смене вкладок окно не прыгало. */
  function syncOrderModalPanelsHeight() {
    const wrap = ORDER_PANELS_WRAP;
    const basic = ORDER_PANELS.find((p) => p.getAttribute('data-opx-ord-panel') === 'basic');
    if (!(wrap instanceof HTMLElement) || !(basic instanceof HTMLElement)) return;
    if (!(ORDER_MODAL instanceof HTMLElement) || ORDER_MODAL.hidden || !ORDER_MODAL.classList.contains('is-open')) {
      return;
    }
    const savedTab = state.orderModalTab || 'basic';
    ORDER_PANELS.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-opx-ord-panel') !== 'basic';
    });
    basic.hidden = false;
    const h = Math.ceil(basic.scrollHeight);
    ORDER_PANELS.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-opx-ord-panel') !== savedTab;
    });
    if (h > 0) wrap.style.setProperty('--opx-ord-panels-min-h', `${h}px`);
  }

  function scheduleOrderModalPanelsHeightSync() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => syncOrderModalPanelsHeight());
    });
  }

  function ensureProductOptions() {
    const cur =
      MODAL_PRODUCT instanceof HTMLSelectElement && MODAL_PRODUCT.value
        ? MODAL_PRODUCT.value
        : products[0] || 'Вода 18.9л';
    if (MODAL_PRODUCT instanceof HTMLSelectElement) {
      MODAL_PRODUCT.innerHTML = productSelectOptionsHtml(cur, null);
    }
    if (CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement) {
      CLIENT_PRICE_PRODUCT.innerHTML = productSelectOptionsHtml(
        CLIENT_PRICE_PRODUCT.value || products[0] || 'Вода 18.9л',
        null
      );
    }
  }

  function catalogPickerPriceHint(row) {
    if (!row) return '';
    if (row.water || row.tierPrice) return '220 / 190 / 175 ₽ по количеству';
    const p = Number(row.price);
    return Number.isFinite(p) && p > 0 ? `${money(p)} ₽` : 'по запросу';
  }

  let orderCartCatalogPickLineIndex = null;

  function positionOrderCartCatalogPicker(anchorEl) {
    if (!(ORDER_CART_CATALOG_PICKER instanceof HTMLElement)) return;
    const anchor =
      anchorEl instanceof HTMLElement
        ? anchorEl
        : ORDER_CART_ADD_BTN instanceof HTMLElement
          ? ORDER_CART_ADD_BTN
          : null;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(420, Math.max(240, window.innerWidth - 16));
    let left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    let top = r.bottom + 6;
    const maxH = Math.min(420, window.innerHeight * 0.52);
    if (top + maxH > window.innerHeight - 8) top = Math.max(8, r.top - maxH - 6);
    ORDER_CART_CATALOG_PICKER.style.position = 'fixed';
    ORDER_CART_CATALOG_PICKER.style.top = `${top}px`;
    ORDER_CART_CATALOG_PICKER.style.left = `${left}px`;
    ORDER_CART_CATALOG_PICKER.style.right = 'auto';
    ORDER_CART_CATALOG_PICKER.style.width = `${width}px`;
    ORDER_CART_CATALOG_PICKER.style.zIndex = '5700';
  }

  function resetOrderCartCatalogPickerPosition() {
    if (!(ORDER_CART_CATALOG_PICKER instanceof HTMLElement)) return;
    ORDER_CART_CATALOG_PICKER.style.position = '';
    ORDER_CART_CATALOG_PICKER.style.top = '';
    ORDER_CART_CATALOG_PICKER.style.left = '';
    ORDER_CART_CATALOG_PICKER.style.right = '';
    ORDER_CART_CATALOG_PICKER.style.width = '';
    ORDER_CART_CATALOG_PICKER.style.zIndex = '';
  }

  function openOrderCartCatalogPicker(lineIndex, anchorEl) {
    orderCartCatalogPickLineIndex =
      lineIndex == null || !Number.isFinite(Number(lineIndex)) ? null : Number(lineIndex);
    setOrderCartCatalogPickerOpen(true);
    positionOrderCartCatalogPicker(anchorEl);
    ORDER_CART_LIST?.querySelectorAll('[data-opx-cart-product]').forEach((el) => {
      if (el instanceof HTMLElement) el.setAttribute('aria-expanded', 'false');
    });
    if (anchorEl instanceof HTMLElement && anchorEl.hasAttribute('data-opx-cart-product')) {
      anchorEl.setAttribute('aria-expanded', 'true');
    }
  }

  function applyOrderCartCatalogPick(title, product_id) {
    const order = getActiveOrder();
    const rowPreset = findCatalogRowByName(title, product_id);
    const normalizedTitle = rowPreset?.displayName || normalizeProductName(title, product_id);
    const pid = rowPreset?.id ?? product_id ?? null;
    if (orderCartCatalogPickLineIndex == null) {
      addOrderModalCartLine({ title: normalizedTitle, product_id: pid }, order);
      return;
    }
    const lines = readOrderModalCartFromDom();
    const ix = orderCartCatalogPickLineIndex;
    if (!lines[ix]) return;
    const qty = lines[ix].qty;
    lines[ix] = {
      title: normalizedTitle,
      product_id: pid,
      qty,
      unit_price: order ? getDefaultPriceForOrder(order, normalizedTitle, qty) : baseUnitPrice(normalizedTitle, qty),
    };
    setOrderModalCartLines(lines, order);
  }

  function renderOrderCartCatalogPicker() {
    if (!(ORDER_CART_CATALOG_PICKER_BODY instanceof HTMLElement)) return;
    const groups = [
      ['Вода в бутылях', 'water'],
      ['Оборудование', 'equipment'],
      ['Аксессуары', 'accessories'],
    ];
    ORDER_CART_CATALOG_PICKER_BODY.innerHTML = groups
      .map(([label, categoryKey]) => {
        const items = operatorCatalogRows.filter((r) => r.categoryKey === categoryKey);
        if (!items.length) return '';
        return `<div class="opx-cart-catalog-group">
          <div class="opx-cart-catalog-group-title">${escapeHtml(label)}</div>
          <div class="opx-cart-catalog-group-items">
            ${items
              .map((row) => {
                const pickVal = row.id != null ? String(row.id) : row.displayName;
                return `<button type="button" class="opx-cart-catalog-item" role="option" data-opx-cart-pick-product="${escapeHtml(pickVal)}" data-opx-cart-pick-name="${escapeHtml(row.displayName)}">
                  <span class="opx-cart-catalog-item-name">${escapeHtml(row.displayName)}</span>
                  <span class="opx-cart-catalog-item-price">${escapeHtml(catalogPickerPriceHint(row))}</span>
                </button>`;
              })
              .join('')}
          </div>
        </div>`;
      })
      .join('');
  }

  function setOrderCartCatalogPickerOpen(open) {
    if (!(ORDER_CART_CATALOG_PICKER instanceof HTMLElement)) return;
    const on = Boolean(open);
    ORDER_CART_CATALOG_PICKER.hidden = !on;
    if (ORDER_CART_ADD_BTN instanceof HTMLButtonElement) {
      ORDER_CART_ADD_BTN.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    if (on) renderOrderCartCatalogPicker();
  }

  function hideOrderCartCatalogPicker() {
    orderCartCatalogPickLineIndex = null;
    resetOrderCartCatalogPickerPosition();
    ORDER_CART_LIST?.querySelectorAll('[data-opx-cart-product]').forEach((el) => {
      if (el instanceof HTMLElement) el.setAttribute('aria-expanded', 'false');
    });
    setOrderCartCatalogPickerOpen(false);
  }

  function toggleOrderCartCatalogPicker() {
    if (!(ORDER_CART_CATALOG_PICKER instanceof HTMLElement)) return;
    if (!ORDER_CART_CATALOG_PICKER.hidden && orderCartCatalogPickLineIndex == null) {
      hideOrderCartCatalogPicker();
      return;
    }
    openOrderCartCatalogPicker(null, ORDER_CART_ADD_BTN);
  }

  function readClientProductPrices() {
    return readStore(CLIENT_PRODUCT_PRICES_KEY, {});
  }

  function getClientProductPrice(clientKey, productName) {
    const store = readClientProductPrices();
    const byClient = store[clientKey];
    if (!byClient || typeof byClient !== 'object') return null;
    const value = Number(byClient[productName]);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  function normalizeProductName(rawName, productId) {
    const row = findCatalogRowByName(rawName, productId);
    return row ? row.displayName : String(rawName || '').trim() || products[0] || 'Вода 18.9л';
  }

  function baseUnitPrice(productName, qty) {
    const row = findCatalogRowByName(productName);
    if (row?.tierPrice || row?.water) {
      const single = Number(row?.price) || PRODUCT_PRICE_MAP['Вода'] || 220;
      const q = Math.max(1, Number(qty) || 1);
      if (q <= 1) return single;
      if (q <= 4) return 190;
      if (q <= 50) return 175;
      return 175;
    }
    if (row?.displayName === 'Одноразовые стаканы') {
      const p = Number(row.price);
      return Number.isFinite(p) && p > 0 ? p : 0;
    }
    return Number(row?.price) || PRODUCT_PRICE_MAP[productName] || 0;
  }

  function getDefaultPriceForOrder(order, productName, qtyHint) {
    const key = order ? normalizeClientKey(order) : '';
    const qty = Math.min(
      50,
      Math.max(1, Number(qtyHint != null ? qtyHint : MODAL_QTY instanceof HTMLInputElement ? MODAL_QTY.value : 1) || 1)
    );
    const priceKey = clientPriceProductKey(productName);
    return (order && getClientProductPrice(key, priceKey)) || baseUnitPrice(productName, qty);
  }

  function productSelectOptionsHtml(selectedName, selectedId) {
    const sel = findCatalogRowByName(selectedName, selectedId);
    const groups = [
      ['Вода в бутылях', 'water'],
      ['Оборудование', 'equipment'],
      ['Аксессуары', 'accessories'],
    ];
    return groups
      .map(([label, categoryKey]) => {
        const items = operatorCatalogRows.filter((r) => r.categoryKey === categoryKey);
        if (!items.length) return '';
        const opts = items
          .map((row) => {
            const val = row.id != null ? String(row.id) : row.displayName;
            const selected =
              sel &&
              ((row.id != null && Number(sel.id) === Number(row.id)) || sel.displayName === row.displayName);
            return `<option value="${escapeHtml(val)}" data-display-name="${escapeHtml(row.displayName)}" data-api-name="${escapeHtml(row.apiName)}"${selected ? ' selected' : ''}>${escapeHtml(row.displayName)}</option>`;
          })
          .join('');
        return `<optgroup label="${escapeHtml(label)}">${opts}</optgroup>`;
      })
      .join('');
  }

  function extractOrderItemsArray(itemsJson) {
    if (itemsJson == null || itemsJson === '') return [];
    try {
      const parsed = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.lines)) return parsed.lines;
      return [];
    } catch {
      return [];
    }
  }

  function parseOrderItemsFromJson(itemsJson) {
    try {
      const items = extractOrderItemsArray(itemsJson);
      if (!items.length) return [];
      return items
        .map((it) => ({
          title: normalizeProductName(String(it?.title || it?.name || '').trim(), it?.product_id),
          product_id: it?.product_id != null ? Number(it.product_id) : null,
          qty: Math.min(50, Math.max(1, Number(it?.qty) || 1)),
          unit_price: Math.max(0, Math.round(Number(it?.unit_price ?? it?.price) || 0)),
        }))
        .filter((it) => it.title);
    } catch {
      return [];
    }
  }

  function computeOrderCartTotal(lines) {
    const list = Array.isArray(lines) ? lines : [];
    return list.reduce((sum, it) => sum + Math.round((Number(it.qty) || 0) * (Number(it.unit_price) || 0)), 0);
  }

  function buildOrderItemsJson(lines) {
    return JSON.stringify(prepareOperatorCartLinesForApi(lines));
  }

  /** Строки корзины для POST: имя из каталога БД, цена и product_id — чтобы сервер не отклонял «Вода 18.9л». */
  function prepareOperatorCartLinesForApi(lines) {
    return (Array.isArray(lines) ? lines : [])
      .map((it) => {
        const row = findCatalogRowByName(it?.title, it?.product_id);
        const displayTitle = row?.displayName || normalizeProductName(it?.title, it?.product_id);
        const qty = Math.min(50, Math.max(1, Number(it?.qty) || 1));
        let unit_price = Math.max(0, Math.round(Number(it?.unit_price) || 0));
        if (!unit_price) unit_price = baseUnitPrice(displayTitle, qty);
        const product_id = row?.id ?? (Number(it?.product_id) > 0 ? Number(it.product_id) : null);
        return {
          title: row?.apiName || displayTitle,
          qty,
          unit_price,
          product_id: product_id ?? undefined,
        };
      })
      .filter((it) => it.title)
      .slice(0, opxLimits()?.CART_LINES_MAX ?? 30);
  }

  function enrichCreatedOperatorOrderRow(created, form) {
    const row = stampOrderServerId({
      ...(created && typeof created === 'object' ? created : {}),
      client: form?.client || resolveClientName(created, null),
    });
    if (form?.phone) row.phone = formatRuMobileFromDigits7(form.phone);
    if (form?.address) row.address = form.address;
    if (form?.zone) row.zone = form.zone;
    if (created && created.driver != null && String(created.driver).trim()) row.driver = String(created.driver).trim();
    else if (form?.driver) row.driver = form.driver;
    if (form?.delivery_date) row.delivery_date = form.delivery_date;
    if (form?.delivery_slot) row.delivery_slot = form.delivery_slot;
    if (form?.payment_method) row.payment_method = form.payment_method;
    if (form?.courier_note != null) row.courier_note = form.courier_note;
    if (form?.items_json) row.items_json = form.items_json;
    if (form?.total_sum != null) row.total_sum = form.total_sum;
    row.create_action = String(created?.create_action || 'order_operator_create');
    if (!row.status) row.status = 'new';
    return row;
  }

  function focusOperatorListOnSavedOrder(deliveryDateIso, orderId) {
    if (deliveryDateIso) {
      state.date = deliveryDateIso;
      if (DATE instanceof HTMLInputElement) DATE.value = deliveryDateIso;
      syncDayPresetHighlightsFromState();
    }
    applyFilters();
    render();
    if (!orderId || !(BODY instanceof HTMLElement)) return;
    const idKey = String(orderId).trim();
    window.requestAnimationFrame(() => {
      const tr = BODY.querySelector(`tr[data-opx-order-id="${CSS.escape(idKey)}"]`);
      if (!(tr instanceof HTMLElement)) return;
      tr.classList.add('opx-row-just-created');
      tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      window.setTimeout(() => tr.classList.remove('opx-row-just-created'), 3200);
    });
  }

  function formatOrderItemsForJournal(itemsJson) {
    const items = parseOrderItemsFromJson(itemsJson);
    if (!items.length) return '—';
    return items.map((it) => `${it.title} ×${it.qty}`).join(', ');
  }

  function describeOrderItemsChange(prevItemsJson, nextItemsJson) {
    const prevText = formatOrderItemsForJournal(prevItemsJson);
    const nextText = formatOrderItemsForJournal(nextItemsJson);
    if (prevText === nextText) return '';
    return `товары: ${prevText} → ${nextText}`;
  }

  function syncLegacyGoodsFieldsFromCart(lines) {
    const list = Array.isArray(lines) ? lines : [];
    const first = list[0];
    if (first) {
      setModalValue(MODAL_PRODUCT, first.title);
      setModalValue(MODAL_QTY, String(first.qty));
      setModalValue(MODAL_UNIT_PRICE, String(first.unit_price));
    }
    const total = computeOrderCartTotal(list);
    setModalValue(MODAL_SUM, `${money(total)} ₽`);
    if (ORDER_CART_TOTAL instanceof HTMLElement) ORDER_CART_TOTAL.textContent = `${money(total)} ₽`;
  }

  function defaultOrderCartLine(order) {
    const row = operatorCatalogRows.find((r) => r.water) || operatorCatalogRows[0];
    const title = row?.displayName || products[0] || 'Вода 18.9л';
    const qty = 2;
    return {
      title,
      product_id: row?.id ?? null,
      qty,
      unit_price: order ? getDefaultPriceForOrder(order, title, qty) : baseUnitPrice(title, qty),
    };
  }

  function setOrderModalCartLines(lines, orderForPricing) {
    const normalized = (Array.isArray(lines) ? lines : [])
      .map((it) => {
        const row = findCatalogRowByName(it?.title, it?.product_id);
        const title = row?.displayName || normalizeProductName(it?.title, it?.product_id);
        const qty = Math.min(50, Math.max(1, Number(it?.qty) || 1));
        let unit = Math.max(0, Math.round(Number(it?.unit_price) || 0));
        if (!unit) unit = orderForPricing ? getDefaultPriceForOrder(orderForPricing, title, qty) : baseUnitPrice(title, qty);
        return { title, product_id: row?.id ?? it?.product_id ?? null, qty, unit_price: unit };
      })
      .filter((it) => it.title);
    state.orderModalCartLines = normalized.length ? normalized : [defaultOrderCartLine(orderForPricing)];
    renderOrderModalCart(orderForPricing);
  }

  function readOrderModalCartFromDom() {
    if (!(ORDER_CART_LIST instanceof HTMLElement)) return state.orderModalCartLines || [];
    const priceMax = opxLimits()?.PRICE_MAX ?? 1_000_000;
    const rows = Array.from(ORDER_CART_LIST.querySelectorAll('[data-opx-cart-line]'));
    return rows
      .map((row) => {
        const productEl = row.querySelector('[data-opx-cart-product]');
        const qtyEl = row.querySelector('[data-opx-cart-qty]');
        const priceEl = row.querySelector('[data-opx-cart-price]');
        let product_id = null;
        let rawTitle = '';
        const idEl = row.querySelector('[data-opx-cart-product-id]');
        const titleEl = row.querySelector('[data-opx-cart-product-title]');
        if (idEl instanceof HTMLInputElement && String(idEl.value || '').trim()) {
          product_id = Number(idEl.value) || null;
        }
        if (titleEl instanceof HTMLInputElement && String(titleEl.value || '').trim()) {
          rawTitle = titleEl.value;
        } else if (productEl instanceof HTMLButtonElement) {
          rawTitle = String(productEl.textContent || '').trim();
        } else if (productEl instanceof HTMLSelectElement) {
          const opt = productEl.selectedOptions[0];
          const valNum = Number(productEl.value);
          product_id = Number.isFinite(valNum) && valNum > 0 ? valNum : Number(opt?.value) || null;
          rawTitle =
            opt?.getAttribute('data-display-name') ||
            opt?.getAttribute('data-api-name') ||
            productEl.value ||
            '';
        } else {
          rawTitle = String(productEl?.textContent || '');
        }
        const catRow = findCatalogRowByName(rawTitle, product_id);
        const title = catRow?.displayName || normalizeProductName(rawTitle, product_id);
        if (catRow?.id != null) product_id = catRow.id;
        const qty = Math.min(50, Math.max(1, Number(qtyEl instanceof HTMLInputElement ? qtyEl.value : 1) || 1));
        const unit_price = Math.min(
          priceMax,
          Math.max(0, Math.round(Number(priceEl instanceof HTMLInputElement ? priceEl.value : 0) || 0))
        );
        return { title, product_id, qty, unit_price };
      })
      .filter((it) => it.title)
      .slice(0, opxLimits()?.CART_LINES_MAX ?? 30);
  }

  function renderOrderModalCart(orderForPricing) {
    if (!(ORDER_CART_LIST instanceof HTMLElement)) return;
    const lines = state.orderModalCartLines || [];
    if (ORDER_CART_EMPTY instanceof HTMLElement) ORDER_CART_EMPTY.hidden = lines.length > 0;
    if (!lines.length) {
      ORDER_CART_LIST.innerHTML = '';
      syncLegacyGoodsFieldsFromCart([]);
      return;
    }
    const priceMax = opxLimits()?.PRICE_MAX ?? 1_000_000;
    ORDER_CART_LIST.innerHTML = lines
      .map((line, index) => {
        const lineSum = Math.round(line.qty * line.unit_price);
        return `
        <div class="opx-cart-line" data-opx-cart-line="${index}" role="listitem">
          <label class="opx-cart-line-field opx-cart-line-product">
            <span class="opx-modal-label">Товар</span>
            <button
              type="button"
              class="opx-modal-input opx-cart-product-select"
              data-opx-cart-product
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-controls="opxOrderCartCatalogPicker"
            >${escapeHtml(line.title)}</button>
            <input type="hidden" data-opx-cart-product-id value="${line.product_id != null ? escapeHtml(String(line.product_id)) : ''}" />
            <input type="hidden" data-opx-cart-product-title value="${escapeHtml(line.title)}" />
          </label>
          <label class="opx-cart-line-field">
            <span class="opx-modal-label">Кол-во</span>
            <input class="opx-modal-input" type="number" min="1" max="50" step="1" value="${line.qty}" data-opx-cart-qty />
          </label>
          <label class="opx-cart-line-field">
            <span class="opx-modal-label">Цена, ₽</span>
            <input class="opx-modal-input" type="number" min="0" max="${priceMax}" step="1" value="${line.unit_price}" data-opx-cart-price />
          </label>
          <div class="opx-cart-line-sum" data-opx-cart-sum>${money(lineSum)} ₽</div>
          <button type="button" class="opx-cart-line-remove" data-opx-cart-remove aria-label="Удалить позицию">×</button>
        </div>`;
      })
      .join('');
    syncLegacyGoodsFieldsFromCart(lines);
  }

  function refreshOrderCartLineSum(row) {
    if (!(row instanceof HTMLElement)) return;
    const qty = Math.min(50, Math.max(1, Number(row.querySelector('[data-opx-cart-qty]')?.value) || 1));
    const unit = Math.max(0, Math.round(Number(row.querySelector('[data-opx-cart-price]')?.value) || 0));
    const sumEl = row.querySelector('[data-opx-cart-sum]');
    if (sumEl instanceof HTMLElement) sumEl.textContent = `${money(Math.round(qty * unit))} ₽`;
  }

  function currentGoodsTotal() {
    return computeOrderCartTotal(readOrderModalCartFromDom());
  }

  function updateGoodsSumPreview() {
    state.orderModalCartLines = readOrderModalCartFromDom();
    syncLegacyGoodsFieldsFromCart(state.orderModalCartLines);
  }

  function addOrderModalCartLine(preset, orderForPricing) {
    const linesNow = readOrderModalCartFromDom();
    const cartMax = opxLimits()?.CART_LINES_MAX ?? 30;
    if (linesNow.length >= cartMax) {
      showToast(`В заказе не более ${cartMax} позиций`, 3200, 'error');
      return;
    }
    const order = orderForPricing || getActiveOrder();
    const priceMax = opxLimits()?.PRICE_MAX ?? 1_000_000;
    const rowPreset = findCatalogRowByName(preset?.title, preset?.product_id);
    const title = rowPreset?.displayName || normalizeProductName(preset?.title, preset?.product_id) || products[0] || 'Вода 18.9л';
    const qty = Math.min(50, Math.max(1, Number(preset?.qty) || 1));
    let unit_price =
      Math.max(0, Math.round(Number(preset?.unit_price) || 0)) ||
      (order ? getDefaultPriceForOrder(order, title, qty) : baseUnitPrice(title, qty));
    unit_price = Math.min(priceMax, unit_price);
    state.orderModalCartLines = [
      ...linesNow,
      { title, product_id: rowPreset?.id ?? preset?.product_id ?? null, qty, unit_price },
    ];
    renderOrderModalCart(order);
  }

  function formatOrderProductsLabel(itemsJson, fallbackIndex) {
    const items = parseOrderItemsFromJson(itemsJson);
    if (!items.length) return parseProduct(itemsJson, fallbackIndex);
    if (items.length === 1) return items[0].title;
    return `${items[0].title} +${items.length - 1}`;
  }

  function statusLabel(status) {
    const key = String(status || '').trim().toLowerCase();
    return statusLabels[key] || '—';
  }

  /** Ключи UI: четыре этапа для оператора (отмена — отдельной кнопкой). */
  function operatorUiStatusFromDb(raw) {
    const st = String(raw || 'new').trim().toLowerCase();
    if (st === 'delivered') return 'delivered';
    if (st === 'cancelled') return 'cancelled';
    if (st === 'confirmed') return 'confirmed';
    if (st === 'on_way' || st === 'processing' || st === 'courier') return 'on_way';
    return 'in_processing';
  }

  function operatorDbStatusFromUi(uiValue, previousDb) {
    const ui = String(uiValue || '').trim().toLowerCase();
    const prev = String(previousDb || '').trim().toLowerCase();
    if (ui === 'delivered') return 'delivered';
    if (ui === 'cancelled') return 'cancelled';
    if (ui === 'confirmed') return 'confirmed';
    if (ui === 'on_way') return 'on_way';
    if (ui === 'in_processing') return prev === 'new' ? 'new' : 'pending_operator';
    return prev === 'new' ? 'new' : 'pending_operator';
  }

  function statusForModalSelect(raw) {
    return operatorUiStatusFromDb(raw);
  }

  function normalizeZoneName(value) {
    const z = String(value || '').toLowerCase().trim().replace(/^["']+|["']+$/g, '');
    if (!z) return 'Подхват';
    /** Согласовано с #opxModalZone и фильтром «★ Зона доставки» (`districts`). */
    if (z.includes('доп') || z.includes('окраин')) return 'доп.зона';
    if (z.includes('степ')) return 'Степной';
    if (z.includes('центр')) return 'Центр';
    if (z.includes('подхват')) return 'Подхват';
    return String(value || '').trim() || 'Подхват';
  }

  /** Цвет маркера на карте: оранжевый — подтверждён, красный — в пути, зелёный — доставлен. */
  function mapMarkerStrokeColor(order) {
    if (orderIsCancelled(order)) return '#9e9e9e';
    const ui = operatorUiStatusFromDb(order?.status);
    if (ui === 'delivered') return MAP_STATUS_COLORS.delivered;
    if (ui === 'on_way') return MAP_STATUS_COLORS.onWay;
    if (ui === 'confirmed') return MAP_STATUS_COLORS.confirmed;
    return '#9e9e9e';
  }

  function markerStrokeColorForOrder(order) {
    return mapMarkerStrokeColor(order);
  }

  /** На карте — только подтверждён, в пути и доставлен (без «в обработке»). */
  function orderVisibleOnZoneMap(order) {
    if (orderIsCancelled(order)) return false;
    const ui = operatorUiStatusFromDb(order?.status);
    return ui === 'confirmed' || ui === 'on_way' || ui === 'delivered';
  }

  /** Заказы на карте — та же выборка, что в таблице (день, поиск, фильтры), без «в обработке». */
  function ordersForZoneMap() {
    return (Array.isArray(state.filtered) ? state.filtered : []).filter(orderVisibleOnZoneMap);
  }

  async function ensureZoneMap() {
    if (!(ZONE_MAP_CANVAS instanceof HTMLElement)) return false;
    if (zoneMapCtl) return true;
    const EM = window.EkvalineMaps;
    if (!EM || typeof EM.createOrdersMapHost !== 'function') return false;

    function handlePopupAction(payload) {
      if (!payload || !(payload.btn instanceof HTMLElement)) return;
      const readOrderId = (el) => {
        let raw = el.getAttribute('data-opx-zone-open-order') || el.getAttribute('data-opx-zone-open-client') || '';
        if (!raw) {
          const wrap = el.closest('[data-opx-zone-order-id]');
          raw = wrap?.getAttribute('data-opx-zone-order-id') || '';
        }
        if (!raw) return '';
        try {
          return decodeURIComponent(raw).trim();
        } catch {
          return String(raw).trim();
        }
      };
      if (payload.type === 'order') {
        const key = readOrderId(payload.btn);
        if (!key) return;
        if (!state.orders.some((o) => String(o.id).trim() === key)) {
          showToast('Заказ не найден в списке');
          return;
        }
        zoneMapCtl?.closePopup?.();
        openOrderModalById(key, { fromMap: true });
        return;
      }
      if (payload.type === 'client') {
        const key = readOrderId(payload.btn);
        if (!key) return;
        zoneMapCtl?.closePopup?.();
        openClientCardFromMap(key);
      }
    }

    try {
      zoneMapCtl = await EM.createOrdersMapHost(
        ZONE_MAP_CANVAS,
        [51.78, 55.11],
        12,
        handlePopupAction,
        null
      );
      return Boolean(zoneMapCtl);
    } catch {
      zoneMapCtl = null;
      return false;
    }
  }

  function zoneMapMarkerHint(order) {
    const idPart = displayOrderId(order.id);
    const addr = String(order.address || '').trim();
    const hint = addr ? `${idPart} · ${addr}` : idPart;
    return hint.length > 140 ? `${hint.slice(0, 137)}…` : hint;
  }

  function fitZoneMapToMarkerBounds(latLngPairs) {
    if (!zoneMapCtl?.map || !window.ymaps) return;
    const points = Array.isArray(latLngPairs) ? latLngPairs.filter((p) => Array.isArray(p) && p.length === 2) : [];
    if (!points.length) {
      try {
        zoneMapCtl.map.setCenter([51.78, 55.11], 12);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      if (points.length === 1) {
        zoneMapCtl.map.setCenter(points[0], 16, { duration: 200 });
        return;
      }
      const yBounds = window.ymaps.util.bounds.fromPoints(points);
      zoneMapCtl.map.setBounds(yBounds, { checkZoomRange: true, zoomMargin: 48, duration: 200 });
    } catch {
      try {
        zoneMapCtl.map.setCenter([51.78, 55.11], 12);
      } catch {
        /* ignore */
      }
    }
  }

  function renderZoneMapAddressList() {
    if (!(ZONE_MAP_ADDRESS_LIST instanceof HTMLElement)) return;
    const source = ordersForZoneMap();
    if (!source.length) {
      ZONE_MAP_ADDRESS_LIST.hidden = true;
      ZONE_MAP_ADDRESS_LIST.innerHTML = '';
      return;
    }
    ZONE_MAP_ADDRESS_LIST.hidden = false;
    const dayHint = state.date && String(state.date).trim() ? ` · ${ruDate(state.date)}` : '';
    ZONE_MAP_ADDRESS_LIST.innerHTML = `
      <div class="opx-zone-map-address-head">Адреса заказов (${source.length})${escapeHtml(dayHint)}</div>
      <ul class="opx-zone-map-address-items">
        ${source
          .map((o) => {
            const addr = escapeHtml(String(o.address || '').trim() || 'Адрес не указан');
            const oid = escapeHtml(displayOrderId(o.id));
            const oidEnc = encodeURIComponent(String(o.id ?? '').trim());
            const zone = escapeHtml(normalizeZoneName(o.zone));
            const orderKey = String(o.id ?? '').trim();
            const onMap = zoneMapOrderCoords.has(orderKey);
            const hasManualCoords = ZONE_ORDER_COORD_OVERRIDE.has(orderKey);
            const geoKey = geoCacheKeyForOrder(o);
            const geoMiss =
              !onMap &&
              !hasManualCoords &&
              !geoKey.startsWith('__orphan:') &&
              ZONE_ADDRESS_GEO_NO_RESULT.has(geoKey) &&
              !ZONE_ADDRESS_COORD_CACHE.has(geoKey);
            const onMapUi = onMap || hasManualCoords;
            const meta = zoneMapAddressListItemMeta(o, onMapUi, geoMiss);
            const statusHint = meta.statusHint;
            return `<li class="opx-zone-map-address-item${onMapUi ? ' is-on-map' : geoMiss ? ' is-geo-miss' : ''}${meta.rowClass}" tabindex="0" role="button" data-opx-zone-focus-order="${oidEnc}" title="${escapeHtml(statusHint)}">
              <span class="opx-zone-map-address-dot" style="background:${meta.dotColor}" aria-hidden="true"></span>
              <div class="opx-zone-map-address-text">
                <span class="opx-zone-map-address-id">${oid} · ${zone}</span>
                <span class="opx-zone-map-address-addr">${addr}</span>
                <span class="opx-zone-map-address-status">${escapeHtml(statusHint)}</span>
              </div>
            </li>`;
          })
          .join('')}
      </ul>
    `.trim();
  }

  function focusZoneMapOrder(orderId) {
    const key = String(orderId ?? '').trim();
    if (!key) return;
    const coords = zoneMapOrderCoords.get(key) || ZONE_ORDER_COORD_OVERRIDE.get(key);
    if (!coords || !zoneMapCtl?.map) {
      showToast('Точка на карте ещё не определена — дождитесь геокодирования адреса');
      return;
    }
    try {
      zoneMapCtl.map.setCenter(coords, 16, { duration: 220 });
    } catch {
      /* ignore */
    }
  }

  function renderZoneFallback() {
    if (!(ZONE_MAP_CANVAS instanceof HTMLElement)) return;
    const zoneOrder = ['Подхват', 'Степной', 'Центр', 'доп.зона'];
    const source = ordersForZoneMap();
    const grouped = { Подхват: [], Степной: [], Центр: [], 'доп.зона': [] };
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
                          const color = mapMarkerStrokeColor(o);
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
    const oidEnc = encodeURIComponent(String(order.id ?? '').trim());
    const zoneColor = zoneColorForName(zone);
    return `
      <div class="opx-zone-popup" data-opx-zone-order-id="${oidEnc}">
        <div class="opx-zone-popup-head">
          <span class="opx-zone-popup-num">${orderId}</span>
          <span class="opx-zone-popup-zone" style="--opx-zone-ring:${zoneColor}">${escapeHtml(zone)}</span>
        </div>
        <div class="opx-zone-popup-client">${client}</div>
        <div class="opx-zone-popup-addr"><span class="opx-zone-popup-addr-label">Адрес</span>${addr}</div>
        <div class="opx-zone-popup-actions">
          <a href="#" class="opx-zone-popup-order" data-opx-zone-open-order="${oidEnc}" role="button">Открыть заказ</a>
          <a href="#" class="opx-zone-popup-cc" data-opx-zone-open-client="${oidEnc}" role="button">Карта клиента</a>
        </div>
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
    refreshBodyBackdropClass();
  }

  function renderZoneMapMarkers() {
    if (!state.zoneMapOpen || !zoneMapCtl) return;
    if (zoneMarkersRedrawTimer) window.clearTimeout(zoneMarkersRedrawTimer);
    zoneMarkersRedrawTimer = window.setTimeout(() => {
      zoneMarkersRedrawTimer = null;
      void rebuildZoneMarkersInternal();
    }, 90);
  }

  function openZoneMapOverlay() {
    if (!(ZONE_MAP_OVERLAY instanceof HTMLElement)) return;
    closeOperatorModalsBlockingFullScreenUi();
    closeReportsOverlay();
    closeSettingsOverlay();
    state.zoneMapOpen = true;
    ZONE_MAP_OVERLAY.hidden = false;
    ZONE_ADDRESS_GEO_NO_RESULT.clear();
    document.getElementById('opxZoneMapGeoHint')?.remove();
    TAB_MAP?.classList.add('is-active');
    TAB_ORDERS?.classList.remove('is-active');
    TAB_REPORTS?.classList.remove('is-active');
    TAB_SETTINGS?.classList.remove('is-active');
    const showMap = () => {
      void (async () => {
        const ok = await ensureZoneMap();
        renderZoneMapAddressList();
        if (ok && zoneMapCtl?.engine === 'yandex') {
          zoneMapCtl.invalidateSize();
          renderZoneMapMarkers();
        } else if (!ok) {
          renderZoneFallback();
        }
      })();
    };
    window.requestAnimationFrame(() => window.requestAnimationFrame(showMap));
    syncOperatorFullscreenBodyClass();
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
    if (!state.reportsOpen && !state.settingsOpen) TAB_ORDERS?.classList.add('is-active');
    if (zoneMapCtl) {
      try {
        zoneMapCtl.destroy();
      } catch (_) {
        /* ignore */
      }
      zoneMapCtl = null;
    }
    if (ZONE_MAP_CANVAS instanceof HTMLElement) {
      ZONE_MAP_CANVAS.innerHTML = '';
    }
    if (ZONE_MAP_ADDRESS_LIST instanceof HTMLElement) {
      ZONE_MAP_ADDRESS_LIST.hidden = true;
      ZONE_MAP_ADDRESS_LIST.innerHTML = '';
    }
    zoneMapOrderCoords.clear();
    document.getElementById('opxZoneMapGeoHint')?.remove();
    syncOperatorFullscreenBodyClass();
    refreshBodyBackdropClass();
  }

  function syncEmbeddedReportsNav(activeSection) {
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    const nav = REPORTS_OVERLAY.querySelector('[data-opx-reports-tabs]');
    if (!nav) return;
    nav.querySelectorAll('[data-opx-reports-switch]').forEach((b) => {
      if (!(b instanceof HTMLElement)) return;
      if (b.matches(':disabled')) return;
      const k = String(b.getAttribute('data-opx-reports-switch') || '');
      b.classList.toggle('is-active', k === activeSection);
    });
  }

  function closeReportsOverlay() {
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    state.reportsOpen = false;
    REPORTS_OVERLAY.hidden = true;
    TAB_REPORTS?.classList.remove('is-active');
    if (!state.zoneMapOpen && !state.settingsOpen) TAB_ORDERS?.classList.add('is-active');
    syncOperatorFullscreenBodyClass();
    refreshBodyBackdropClass();
  }

  /** Закрыть модальные окна, которые перекрывают полноэкранные экраны (отчёт, карта) выше по z-index — иначе клики «не доходят». */
  function closeOperatorModalsBlockingFullScreenUi() {
    closeOrderModal();
    closeFiltersModal();
    closeClientCardModal();
    closeClientMapModal();
    closeNewOrdersInboxModal();
    closeOrderReasonOverlay();
  }

  /** Сброс состояния после гонок/обрыва загрузки — иначе shell остаётся с opx-modal-open / inert и не кликается. */
  function resetOperatorChromeOnBoot() {
    filtersModalOpen = false;
    newOrdersInboxOpen = false;
    closeOperatorModalsBlockingFullScreenUi();
    switchToOrdersView();
    refreshBodyBackdropClass();
  }

  function switchToOrdersView() {
    closeZoneMapOverlay();
    closeReportsOverlay();
    closeSettingsOverlay();
    TAB_ORDERS?.classList.add('is-active');
    TAB_MAP?.classList.remove('is-active');
    TAB_REPORTS?.classList.remove('is-active');
    TAB_SETTINGS?.classList.remove('is-active');
  }

  const BOOKING_SLOT_UI = [
    { key: '09:00-14:00', label: '09:00–14:00' },
    { key: '14:00-17:00', label: '14:00–17:00' },
    { key: '17:00-21:00', label: '17:00–21:00' },
    { key: '09:00-17:00', label: 'Для организаций: 09:00–17:00' },
  ];

  const SETTINGS_BOOKING_DAYS = 30;
  const SETTINGS_AUTO_SAVE_MS = 200;

  function enumerateSettingsBookingDays(count = SETTINGS_BOOKING_DAYS) {
    const out = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const n = Math.min(Math.max(Number(count) || 30, 1), 90);
    for (let i = 0; i < n; i += 1) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${day}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  let settingsSlotDefs = BOOKING_SLOT_UI.slice();
  let settingsDaysList = [];
  let settingsDaysWindowAnchor = '';
  let settingsAvailabilityDraft = { closedDays: [], closedSlots: [] };
  /** Актуальные закрытые дни/интервалы для модалки заказа и проверки при сохранении. */
  let bookingAvailability = { closedDays: [], closedSlots: [] };
  let settingsLastChangeMeta = null;
  let settingsAutoSaveTimer = null;
  let settingsAutoSaveBusy = false;
  let settingsAutoSavePending = false;
  let settingsDaysRefreshTimer = null;

  function pruneSettingsAvailabilityDraft(raw) {
    const allowed = new Set(enumerateSettingsBookingDays(SETTINGS_BOOKING_DAYS));
    const closedDays = [];
    const daySet = new Set();
    (Array.isArray(raw?.closedDays) ? raw.closedDays : []).forEach((d) => {
      const iso = String(d || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !allowed.has(iso) || daySet.has(iso)) return;
      daySet.add(iso);
      closedDays.push(iso);
    });
    closedDays.sort();
    const closedSlots = [];
    const slotSet = new Set();
    (Array.isArray(raw?.closedSlots) ? raw.closedSlots : []).forEach((row) => {
      const date = String(row?.date ?? '').trim();
      const slot = normalizeDeliverySlotStored(row?.slot ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !slot || !allowed.has(date) || daySet.has(date)) return;
      const sig = `${date}|${slot}`;
      if (slotSet.has(sig)) return;
      slotSet.add(sig);
      closedSlots.push({ date, slot });
    });
    closedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
    return { closedDays, closedSlots };
  }

  function syncSettingsBookingDaysList() {
    settingsDaysList = enumerateSettingsBookingDays(SETTINGS_BOOKING_DAYS);
    settingsDaysWindowAnchor = settingsDaysList[0] || '';
  }

  /** При смене календарного дня обновить окно 30 дней (верх уходит, снизу новый). */
  function refreshSettingsDaysWindowIfNeeded() {
    const nextDays = enumerateSettingsBookingDays(SETTINGS_BOOKING_DAYS);
    const anchor = nextDays[0] || '';
    if (anchor === settingsDaysWindowAnchor && settingsDaysList.length === nextDays.length) return false;
    settingsDaysList = nextDays.slice();
    settingsDaysWindowAnchor = anchor;
    settingsAvailabilityDraft = pruneSettingsAvailabilityDraft(settingsAvailabilityDraft);
    bookingAvailability = {
      closedDays: settingsAvailabilityDraft.closedDays.slice(),
      closedSlots: settingsAvailabilityDraft.closedSlots.map((r) => ({ ...r })),
    };
    renderSettingsDaysList();
    return true;
  }

  function buildSettingsAvailabilityPayload() {
    settingsAvailabilityDraft = pruneSettingsAvailabilityDraft(settingsAvailabilityDraft);
    return {
      closedDays: settingsAvailabilityDraft.closedDays.slice(),
      closedSlots: settingsAvailabilityDraft.closedSlots.map((r) => ({ ...r })),
    };
  }

  function scheduleSettingsAvailabilitySave() {
    if (settingsAutoSaveTimer) window.clearTimeout(settingsAutoSaveTimer);
    if (SETTINGS_STATUS instanceof HTMLElement) SETTINGS_STATUS.textContent = 'Сохранение…';
    settingsAutoSaveTimer = window.setTimeout(() => {
      settingsAutoSaveTimer = null;
      void flushSettingsAvailabilitySave({ silent: true });
    }, SETTINGS_AUTO_SAVE_MS);
  }

  async function flushSettingsAvailabilitySave(opts = {}) {
    if (settingsAutoSaveBusy) {
      settingsAutoSavePending = true;
      return;
    }
    settingsAutoSaveBusy = true;
    try {
      await saveSettingsAvailability(opts);
    } finally {
      settingsAutoSaveBusy = false;
      if (settingsAutoSavePending) {
        settingsAutoSavePending = false;
        void flushSettingsAvailabilitySave(opts);
      }
    }
  }

  function startSettingsDaysRefreshTimer() {
    stopSettingsDaysRefreshTimer();
    settingsDaysRefreshTimer = window.setInterval(() => {
      if (!state.settingsOpen) return;
      if (refreshSettingsDaysWindowIfNeeded()) {
        void flushSettingsAvailabilitySave({ silent: true });
      }
    }, 60000);
  }

  function stopSettingsDaysRefreshTimer() {
    if (settingsDaysRefreshTimer) {
      window.clearInterval(settingsDaysRefreshTimer);
      settingsDaysRefreshTimer = null;
    }
  }

  function applyBookingAvailability(av) {
    const parsed =
      av && typeof av === 'object'
        ? {
            closedDays: Array.isArray(av.closedDays) ? av.closedDays.slice() : [],
            closedSlots: Array.isArray(av.closedSlots) ? av.closedSlots.map((r) => ({ ...r })) : [],
          }
        : { closedDays: [], closedSlots: [] };
    bookingAvailability = parsed;
    settingsAvailabilityDraft = {
      closedDays: parsed.closedDays.slice(),
      closedSlots: parsed.closedSlots.map((r) => ({ ...r })),
    };
  }

  function isBookingDayClosed(iso) {
    const d = String(iso || '').trim();
    return bookingAvailability.closedDays.includes(d);
  }

  function isBookingSlotClosed(iso, slotKey) {
    const d = String(iso || '').trim();
    const slot = normalizeDeliverySlotStored(slotKey);
    if (!d || !slot) return false;
    if (isBookingDayClosed(d)) return true;
    return bookingAvailability.closedSlots.some((r) => r.date === d && r.slot === slot);
  }

  async function loadBookingAvailabilityFromServer() {
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) return;
    try {
      const response = await api.json(`/api/orders/operator/delivery-availability?_=${Date.now()}`, {
        method: 'GET',
      });
      if (response.ok && response.data?.availability) {
        applyBookingAvailability(response.data.availability);
        return;
      }
      const pub = await fetch(`/api/public/delivery-availability?_=${Date.now()}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (pub.ok) {
        const data = await pub.json();
        const root = data?.availability && typeof data.availability === 'object' ? data.availability : data;
        applyBookingAvailability(root);
      }
    } catch (e) {
      console.warn('[operator] delivery availability', e);
    }
  }

  function formatSettingsLastChangeText(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const label = String(meta.label || '').trim();
    const role = String(meta.role || '').trim().toLowerCase();
    const updatedAt = String(meta.updatedAt || '').trim();
    if (!label || !updatedAt) return '';
    const at = new Date(updatedAt);
    const when = Number.isNaN(at.getTime())
      ? updatedAt
      : at.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    if (role === 'admin') {
      return `${label} изменил(а) настройки приёма заказов · ${when}`;
    }
    return `${label} сохранил(а) изменения · ${when}`;
  }

  function renderSettingsLastChange(meta) {
    if (!(SETTINGS_LAST_CHANGE instanceof HTMLElement)) return;
    const text = formatSettingsLastChangeText(meta);
    if (!text) {
      SETTINGS_LAST_CHANGE.hidden = true;
      SETTINGS_LAST_CHANGE.textContent = '';
      return;
    }
    SETTINGS_LAST_CHANGE.hidden = false;
    SETTINGS_LAST_CHANGE.textContent = text;
    SETTINGS_LAST_CHANGE.classList.toggle('is-admin', String(meta?.role || '').toLowerCase() === 'admin');
  }

  function weekdayLabelRu(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const names = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return names[d.getDay()] || '';
  }

  function isDayClosedInDraft(iso) {
    return settingsAvailabilityDraft.closedDays.includes(iso);
  }

  function isSlotClosedInDraft(iso, slotKey) {
    if (isDayClosedInDraft(iso)) return true;
    return settingsAvailabilityDraft.closedSlots.some((r) => r.date === iso && r.slot === slotKey);
  }

  function renderSettingsDaysList() {
    if (!(SETTINGS_DAYS_LIST instanceof HTMLElement)) return;
    const days = settingsDaysList.length ? settingsDaysList : [];
    if (!days.length) {
      SETTINGS_DAYS_LIST.innerHTML = '<p class="opx-settings-empty">Загрузка…</p>';
      return;
    }
    const slots = settingsSlotDefs.length ? settingsSlotDefs : BOOKING_SLOT_UI;
    SETTINGS_DAYS_LIST.innerHTML = days
      .map((iso) => {
        const dayClosed = isDayClosedInDraft(iso);
        const wd = weekdayLabelRu(iso);
        const slotChecks = slots
          .map((s) => {
            const checked = isSlotClosedInDraft(iso, s.key);
            const dis = dayClosed ? ' disabled' : '';
            const chk = checked ? ' checked' : '';
            return `<label class="opx-settings-slot${dayClosed ? ' is-muted' : ''}">
              <input type="checkbox" data-opx-slot-close="${escapeHtml(iso)}" data-slot-key="${escapeHtml(s.key)}"${chk}${dis} />
              <span>${escapeHtml(s.label)}</span>
            </label>`;
          })
          .join('');
        return `<article class="opx-settings-day${dayClosed ? ' is-day-closed' : ''}" data-date="${escapeHtml(iso)}">
          <div class="opx-settings-day-head">
            <div class="opx-settings-day-date">
              <strong>${escapeHtml(ruShortDateFromIsoDay(iso))}</strong>
              <span class="opx-settings-weekday">${escapeHtml(wd)}</span>
            </div>
            <label class="opx-settings-day-all">
              <input type="checkbox" data-opx-close-day="${escapeHtml(iso)}"${dayClosed ? ' checked' : ''} />
              <span>Закрыть весь день</span>
            </label>
          </div>
          <div class="opx-settings-slots"${dayClosed ? ' hidden' : ''}>${slotChecks}</div>
        </article>`;
      })
      .join('');
  }

  function applySettingsAvailabilityPayload(payload) {
    const av = payload?.availability;
    if (Array.isArray(payload?.slotDefs) && payload.slotDefs.length) {
      settingsSlotDefs = payload.slotDefs.map((s) => ({
        key: String(s.key || ''),
        label: String(s.label || s.key || ''),
      }));
    } else {
      settingsSlotDefs = BOOKING_SLOT_UI.slice();
    }
    syncSettingsBookingDaysList();
    applyBookingAvailability(pruneSettingsAvailabilityDraft(av));
    settingsLastChangeMeta = payload?.lastChange || null;
    renderSettingsDaysList();
    renderSettingsLastChange(settingsLastChangeMeta);
    if (SETTINGS_STATUS instanceof HTMLElement) SETTINGS_STATUS.textContent = '';
  }

  function settingsLoadErrorHtml(message) {
    const msg = escapeHtml(String(message || 'Не удалось загрузить настройки'));
    return `<p class="opx-settings-empty">${msg} <a href="index.html" data-auth-login>Войти с главной</a></p>`;
  }

  async function loadSettingsAvailability() {
    if (!(SETTINGS_DAYS_LIST instanceof HTMLElement)) return;
    SETTINGS_DAYS_LIST.innerHTML = '<p class="opx-settings-empty">Загрузка…</p>';
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) {
      SETTINGS_DAYS_LIST.innerHTML =
        '<p class="opx-settings-empty">Сервер не отвечает. Запустите npm start и обновите страницу.</p>';
      return;
    }
    try {
      await hydrateStaffFromServerSession();
      const response = await api.json('/api/orders/operator/delivery-availability', { method: 'GET' });
      if (response.ok && response.data) {
        applySettingsAvailabilityPayload(response.data);
        return;
      }
      const serverErr =
        typeof response?.data?.error === 'string' && response.data.error.trim()
          ? response.data.error.trim()
          : '';
      let hint = serverErr || 'Не удалось загрузить настройки';
      if (response.status === 401 || response.status === 403) {
        hint = 'Сессия истекла или нет прав. Выйдите и войдите снова с главной страницы.';
      } else if (response.status >= 500) {
        hint = 'Ошибка сервера при загрузке настроек. Проверьте, что PostgreSQL запущен.';
      }
      SETTINGS_DAYS_LIST.innerHTML = settingsLoadErrorHtml(hint);
    } catch (e) {
      console.error(e);
      SETTINGS_DAYS_LIST.innerHTML = settingsLoadErrorHtml(
        'Нет связи с сервером. Запустите npm start и обновите страницу.'
      );
    }
  }

  async function saveSettingsAvailability(opts = {}) {
    const silent = Boolean(opts.silent);
    const payload = buildSettingsAvailabilityPayload();
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) {
      showToast('API недоступен');
      return;
    }
    try {
      const response = await api.json('/api/orders/operator/delivery-availability', {
        method: 'PUT',
        body: payload,
      });
      if (!response.ok) {
        const err = typeof response?.data?.error === 'string' ? response.data.error : 'Сервер отклонил сохранение';
        showToast(err, 3200, 'error');
        if (SETTINGS_STATUS instanceof HTMLElement) SETTINGS_STATUS.textContent = 'Не удалось сохранить';
        void loadSettingsAvailability();
        return;
      }
      applyBookingAvailability(response.data?.availability || payload);
      settingsLastChangeMeta = response.data?.lastChange || settingsLastChangeMeta;
      renderSettingsDaysList();
      syncModalSlotAvailability();
      renderSettingsLastChange(settingsLastChangeMeta);
      notifyOrdersChanged();
      if (SETTINGS_STATUS instanceof HTMLElement) {
        const who = formatSettingsLastChangeText(settingsLastChangeMeta);
        SETTINGS_STATUS.textContent = who
          ? who
          : `Сохранено · ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
      }
      if (!silent) {
        showToast('Настройки приёма заказов сохранены.', 2800, 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Не удалось сохранить настройки');
      if (SETTINGS_STATUS instanceof HTMLElement) SETTINGS_STATUS.textContent = 'Ошибка сохранения';
    }
  }

  function syncSettingsTabsNav(active) {
    if (!(SETTINGS_OVERLAY instanceof HTMLElement)) return;
    SETTINGS_OVERLAY.querySelectorAll('[data-opx-settings-switch]').forEach((b) => {
      if (!(b instanceof HTMLElement) || b.matches(':disabled')) return;
      const k = String(b.getAttribute('data-opx-settings-switch') || '');
      b.classList.toggle('is-active', k === active);
    });
  }

  function syncOperatorFullscreenBodyClass() {
    const on =
      state.settingsOpen ||
      state.reportsOpen ||
      state.zoneMapOpen;
    document.body.classList.toggle('opx-operator-fullscreen', on);
  }

  function openSettingsOverlay() {
    if (!(SETTINGS_OVERLAY instanceof HTMLElement)) return;
    closeOperatorModalsBlockingFullScreenUi();
    closeZoneMapOverlay();
    closeReportsOverlay();
    state.settingsOpen = true;
    SETTINGS_OVERLAY.hidden = false;
    TAB_SETTINGS?.classList.add('is-active');
    TAB_ORDERS?.classList.remove('is-active');
    TAB_MAP?.classList.remove('is-active');
    TAB_REPORTS?.classList.remove('is-active');
    syncSettingsTabsNav('settings');
    syncOperatorFullscreenBodyClass();
    refreshSettingsDaysWindowIfNeeded();
    startSettingsDaysRefreshTimer();
    void loadSettingsAvailability();
    refreshBodyBackdropClass();
  }

  function closeSettingsOverlay() {
    if (!(SETTINGS_OVERLAY instanceof HTMLElement)) return;
    state.settingsOpen = false;
    SETTINGS_OVERLAY.hidden = true;
    stopSettingsDaysRefreshTimer();
    if (settingsAutoSaveTimer) {
      window.clearTimeout(settingsAutoSaveTimer);
      settingsAutoSaveTimer = null;
      void flushSettingsAvailabilitySave({ silent: true });
    }
    TAB_SETTINGS?.classList.remove('is-active');
    if (!state.zoneMapOpen && !state.reportsOpen && !state.settingsOpen) TAB_ORDERS?.classList.add('is-active');
    syncOperatorFullscreenBodyClass();
    refreshBodyBackdropClass();
  }

  function onSettingsDaysListChange(event) {
    const t = event.target;
    if (!(t instanceof HTMLInputElement)) return;
    const dayIso = t.getAttribute('data-opx-close-day');
    if (dayIso && t.type === 'checkbox') {
      const iso = String(dayIso).trim();
      if (t.checked) {
        if (!settingsAvailabilityDraft.closedDays.includes(iso)) {
          settingsAvailabilityDraft.closedDays.push(iso);
        }
        settingsAvailabilityDraft.closedSlots = settingsAvailabilityDraft.closedSlots.filter((r) => r.date !== iso);
      } else {
        settingsAvailabilityDraft.closedDays = settingsAvailabilityDraft.closedDays.filter((d) => d !== iso);
      }
      settingsAvailabilityDraft.closedDays.sort();
      renderSettingsDaysList();
      scheduleSettingsAvailabilitySave();
      return;
    }
    const slotDate = t.getAttribute('data-opx-slot-close');
    const slotKey = t.getAttribute('data-slot-key');
    if (slotDate && slotKey && t.type === 'checkbox') {
      const iso = String(slotDate).trim();
      const key = String(slotKey).trim();
      if (t.checked) {
        if (!settingsAvailabilityDraft.closedSlots.some((r) => r.date === iso && r.slot === key)) {
          settingsAvailabilityDraft.closedSlots.push({ date: iso, slot: key });
        }
      } else {
        settingsAvailabilityDraft.closedSlots = settingsAvailabilityDraft.closedSlots.filter(
          (r) => !(r.date === iso && r.slot === key)
        );
      }
      settingsAvailabilityDraft.closedSlots.sort(
        (a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot)
      );
      scheduleSettingsAvailabilitySave();
      return;
    }
  }

  function normalizeRuPaymentComparable(s) {
    return String(s ?? '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\u00a0/g, ' ')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Явная оплата по расчётному счёту (колонка «Форма оплаты»); один только «безнал.» сюда не входит. */
  function orderLooksLikeSettlementInvoicePayment(rawPayment) {
    const raw = String(rawPayment ?? '').trim();
    if (!raw) return false;
    if (normalizeRuPaymentComparable(raw) === normalizeRuPaymentComparable(PAYMENT_SETTLEMENT_INVOICE_VALUE)) return true;
    const low = raw.toLowerCase().replace(/ё/g, 'е');
    if (/р\s*[/\\]\s*с/.test(low)) return true;
    if (/расч\s*[/\\]\s*с/.test(low)) return true;
    const v = normalizeRuPaymentComparable(raw);
    if ((v.includes('расчет') || v.includes('расч')) && v.includes('счет')) return true;
    if (v.includes('счет') && (low.includes('перевод') || low.includes('безнал') || low.includes('организац'))) return true;
    return false;
  }

  /** Одно из значений `<option>` в #opxModalPayment по строке из таблицы/API/демо. */
  function paymentRawToModalSelectValue(raw) {
    const p = String(raw ?? '').trim();
    if (!p) return PAYMENT_MODAL_CASH;
    const low = p.toLowerCase().replace(/ё/g, 'е');
    if (low === 'cash') return PAYMENT_MODAL_CASH;
    if (low === 'card' || low === 'карта') return PAYMENT_MODAL_CARD;
    if (low === 'noncash') return PAYMENT_MODAL_NONCASH;
    if (orderLooksLikeSettlementInvoicePayment(p)) return PAYMENT_SETTLEMENT_INVOICE_VALUE;
    const v = normalizeRuPaymentComparable(p);
    if (v.includes('безнал')) return PAYMENT_MODAL_NONCASH;
    if (v.includes('карт') || v.includes('терминал')) return PAYMENT_MODAL_CARD;
    if (v.includes('налич')) return PAYMENT_MODAL_CASH;
    return PAYMENT_MODAL_CASH;
  }

  /** Группа для итога в подвале по колонке «Форма оплаты». */
  function footerPaymentBucket(rawPayment) {
    const p = String(rawPayment ?? '').trim();
    if (!p) return 'cash';
    if (orderLooksLikeSettlementInvoicePayment(p)) return 'settlement';
    const modal = paymentRawToModalSelectValue(p);
    if (modal === PAYMENT_SETTLEMENT_INVOICE_VALUE) return 'settlement';
    if (modal === PAYMENT_MODAL_CARD) return 'card';
    if (modal === PAYMENT_MODAL_NONCASH) {
      const low = p.toLowerCase().replace(/ё/g, 'е').replace(/\u00a0/g, ' ');
      if (low === 'card' || low === 'карта' || /(?:^|\s)карт|visa|mir|терминал/i.test(low)) return 'card';
      return 'noncash';
    }
    if (modal === PAYMENT_MODAL_CASH) return 'cash';
    const low = p.toLowerCase().replace(/ё/g, 'е').replace(/\u00a0/g, ' ');
    if (low === 'cash' || /налич/i.test(low)) return 'cash';
    if (low === 'card' || low === 'карта' || /(?:^|\s)карт|visa|mir|терминал/i.test(low)) return 'card';
    if (low === 'noncash' || /безнал/i.test(low)) return 'noncash';
    return 'cash';
  }

  /** Сумма заказа для подвала: total_sum или пересчёт по позициям, если в БД 0. */
  function orderBillableTotalSum(order) {
    const stored = Number(order?.total_sum);
    if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
    try {
      const items = extractOrderItemsArray(order?.items_json);
      if (items.length) {
        const computed = computeOrderCartTotal(items);
        if (computed > 0) return computed;
      }
    } catch {
      /* ignore */
    }
    return Math.max(0, Math.round(Number.isFinite(stored) ? stored : 0));
  }

  function orderDisplayTotalSum(order) {
    return orderBillableTotalSum(order);
  }

  function readModalPickupForSave(orderFallback) {
    if (MODAL_PICKUP instanceof HTMLInputElement) return MODAL_PICKUP.checked;
    if (orderFallback && typeof orderFallback === 'object') return Boolean(orderFallback.pickup);
    return false;
  }

  /** Итоги подвала по текущей выборке таблицы (отменённые не входят в суммы). */
  function computeOperatorFooterStats(rows) {
    const list = Array.isArray(rows) ? rows : [];
    let orderCount = list.length;
    let cancelledCount = 0;
    let total = 0;
    const payTotals = { cash: 0, noncash: 0, settlement: 0, card: 0 };
    let bottleQty = 0;
    for (const o of list) {
      if (orderIsCancelled(o)) {
        cancelledCount += 1;
        continue;
      }
      const sumOrder = orderBillableTotalSum(o);
      total += sumOrder;
      payTotals[footerPaymentBucket(o.payment_method)] += sumOrder;
      bottleQty += footerBottleQtyFromOrder(o);
    }
    return { orderCount, cancelledCount, total, payTotals, bottleQty };
  }

  function syncOperatorFooterDom(stats) {
    const s = stats || computeOperatorFooterStats([]);
    const activeCount = s.orderCount - s.cancelledCount;
    if (COUNT instanceof HTMLElement) {
      COUNT.textContent = String(activeCount);
      if (s.cancelledCount > 0) {
        COUNT.title = `На экране ${s.orderCount} заказов, из них отменено: ${s.cancelledCount}`;
      } else {
        COUNT.removeAttribute('title');
      }
    }
    if (TOTAL_SUM instanceof HTMLElement) {
      TOTAL_SUM.textContent = `${money(s.total)} ₽`;
      if (s.cancelledCount > 0) {
        TOTAL_SUM.title = `Сумма по ${s.orderCount - s.cancelledCount} заказам без отменённых (${s.cancelledCount} отменено на экране)`;
      } else {
        TOTAL_SUM.removeAttribute('title');
      }
    }
    if (FOOTER_SUM_HINT instanceof HTMLElement) {
      FOOTER_SUM_HINT.hidden = !(s.cancelledCount > 0);
      FOOTER_SUM_HINT.textContent =
        s.cancelledCount > 0 ? ` · без ${s.cancelledCount} отменённых` : '';
    }
    if (FOOTER_PAY_CASH instanceof HTMLElement) FOOTER_PAY_CASH.textContent = `${money(s.payTotals.cash)} ₽`;
    if (FOOTER_PAY_NONCASH instanceof HTMLElement) FOOTER_PAY_NONCASH.textContent = `${money(s.payTotals.noncash)} ₽`;
    if (FOOTER_PAY_SETTLEMENT instanceof HTMLElement) {
      FOOTER_PAY_SETTLEMENT.textContent = `${money(s.payTotals.settlement)} ₽`;
    }
    if (FOOTER_PAY_CARD instanceof HTMLElement) FOOTER_PAY_CARD.textContent = `${money(s.payTotals.card)} ₽`;
    if (FOOTER_BOTTLES instanceof HTMLElement) FOOTER_BOTTLES.textContent = String(s.bottleQty);
  }

  function footerBottleQtyFromOrder(order) {
    try {
      const items = extractOrderItemsArray(order.items_json);
      if (!items.length) return 0;
      return items.reduce((s, it) => {
        if (!findCatalogRowByName(it.title || it.name, it.product_id)?.water) return s;
        return s + (Number(it.qty) || 0);
      }, 0);
    } catch {
      return 0;
    }
  }

  function advancedFilterSelectionMeansSettlementInvoice(filtRaw) {
    return normalizeRuPaymentComparable(PAYMENT_SETTLEMENT_INVOICE_VALUE) === normalizeRuPaymentComparable(filtRaw);
  }

  function orderItems(order) {
    return extractOrderItemsArray(order.items_json);
  }

  /** Строки заказа для отчётов — с fallback, как в финансовой сводке. */
  function orderReportLineItems(order) {
    const parsed = parseOrderItemsFromJson(order?.items_json);
    if (parsed.length) return parsed;
    let items = orderItems(order);
    if (items.length) {
      return items.map((it) => ({
        title: String(it?.title || it?.name || '').trim(),
        qty: Math.min(50, Math.max(1, Number(it?.qty) || 1)),
        unit_price: it?.unit_price,
      })).filter((it) => it.title);
    }
    const fallbackTitle = parseProduct(order?.items_json, 0);
    const title = String(fallbackTitle || '').trim();
    if (!title || title === '—') return [];
    return [{ title: fallbackTitle, qty: Math.max(1, parseQty(order?.items_json) || 1), unit_price: NaN }];
  }

  function orderItemsQtyForReport(order) {
    return orderReportLineItems(order).reduce((s, it) => s + (Number(it.qty) || 0), 0);
  }

  /** Колонка отчёта: наличные; карта — в безнал. */
  function reportPaymentLaneForFinancial(rawPayment) {
    const b = footerPaymentBucket(rawPayment);
    if (b === 'settlement') return 'settlement';
    if (b === 'noncash' || b === 'card') return 'noncash';
    return 'cash';
  }

  function emptyReportLane() {
    return { qty: 0, sum: 0 };
  }

  function pushLocalAuditEvent(entry) {
    const cur = readStore(OPERATOR_AUDIT_LOCAL_KEY, []);
    const next = Array.isArray(cur) ? cur : [];
    next.unshift(entry);
    writeStore(OPERATOR_AUDIT_LOCAL_KEY, next.slice(0, 3000));
  }

  function eventInReportRange(e, from, to) {
    const d = isoDate(e.created_at || e.at);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  function normalizeAuditReportEvent(entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    return {
      ...e,
      detail: String(e.detail || '').trim(),
      reason: String(e.reason || '').trim(),
      message: String(e.message || e.reason || '').trim(),
    };
  }

  function reportAuditActionLabel(action) {
    return journalActionLabel(action);
  }

  function reportAuditCommentHuman(entry) {
    const e = normalizeAuditReportEvent(entry);
    const action = String(e.action || '').trim();
    const eventLabel = reportAuditActionLabel(e.action);
    let msg =
      action === 'order_status_cancelled' || action === 'order_cancel' || action === 'order_delete'
        ? auditEventReasonText(e) || journalActionLabel(action)
        : journalEntryMessage(e);
    if (/^изменение заказа \(без переноса\/отмены\)$/i.test(msg)) {
      msg = 'Изменены данные заказа';
    }
    if (/^изменение оператором$/i.test(msg)) {
      msg = 'Изменены данные заказа';
    }
    if (!msg || msg === '—') return '—';
    if (msg.toLowerCase() === eventLabel.toLowerCase()) return '—';
    if (msg.toLowerCase() === 'изменение по заказу') return '—';
    return msg;
  }

  function mergeAuditEventsForReport(serverRows, from, to) {
    const localRaw = readStore(OPERATOR_AUDIT_LOCAL_KEY, []);
    const localArr = Array.isArray(localRaw) ? localRaw : [];
    const normLocal = localArr
      .filter((e) => eventInReportRange(e, from, to) && auditEventVisibleInOperatorReport(e))
      .map(normalizeAuditReportEvent);
    const srv = (Array.isArray(serverRows) ? serverRows : [])
      .filter(auditEventVisibleInOperatorReport)
      .map(normalizeAuditReportEvent);
    return dedupeJournalEntries(
      [...srv, ...normLocal].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    );
  }

  async function fetchReportAuditEvents(from, to) {
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) return [];
    try {
      const r = await api.json(
        `/api/orders/operator/audit-report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!r.ok) {
        redirectOnUnauthorized(r.status, r.data);
        return [];
      }
      if (!Array.isArray(r.data?.events)) return [];
      return r.data.events;
    } catch {
      return [];
    }
  }

  function setReportsPeriodDays(days) {
    const span = Math.max(1, Number(days) || 30);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (span - 1));
    if (REPORTS_DATE_FROM instanceof HTMLInputElement) REPORTS_DATE_FROM.value = isoDate(from);
    if (REPORTS_DATE_TO instanceof HTMLInputElement) REPORTS_DATE_TO.value = isoDate(to);
    renderReports();
  }

  function productCategoryBucketKey(rawTitle) {
    const p = normalizeProductName(rawTitle || '');
    const s = String(p || '');
    if (s === 'Вода') return 'water';
    if (s === 'Тара') return 'tara';
    if (/кулер/i.test(s)) return 'coolers';
    if (/помп/i.test(s)) return 'pumps';
    return 'other';
  }

  function categoryReportColgroupHtml() {
    return `<colgroup class="opx-reports-cat-cols">
        <col class="opx-cat-col-category" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-pay" />
        <col class="opx-cat-col-total" />
        <col class="opx-cat-col-total" />
      </colgroup>`;
  }

  function productSummaryHeaderRows() {
    return `
      <tr>
        <th rowspan="2">Категория</th>
        <th colspan="3">Наличный расчёт</th>
        <th colspan="3">Безналичный расчёт</th>
        <th colspan="3">Расчётный счёт</th>
        <th colspan="2">Итого</th>
      </tr>
      <tr>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
      </tr>
    `;
  }

  function renderProductSummaryTableHtml(filtered) {
    const labels = {
      water: 'Вода',
      tara: 'Тара',
      coolers: 'Кулеры',
      pumps: 'Помпы',
      other: 'Прочее',
    };
    const order = ['water', 'tara', 'coolers', 'pumps', 'other'];
    const agg = {
      water: { cash: emptyReportLane(), noncash: emptyReportLane(), settlement: emptyReportLane() },
      tara: { cash: emptyReportLane(), noncash: emptyReportLane(), settlement: emptyReportLane() },
      coolers: { cash: emptyReportLane(), noncash: emptyReportLane(), settlement: emptyReportLane() },
      pumps: { cash: emptyReportLane(), noncash: emptyReportLane(), settlement: emptyReportLane() },
      other: { cash: emptyReportLane(), noncash: emptyReportLane(), settlement: emptyReportLane() },
    };
    filtered.forEach((o) => {
      const lane = reportPaymentLaneForFinancial(o.payment_method);
      let items = orderItems(o);
      if (!items.length) {
        const fallbackTitle = parseProduct(o.items_json, 0);
        const fq = parseQty(o.items_json) || 1;
        items = [{ title: fallbackTitle, qty: fq, unit_price: NaN }];
      }
      items.forEach((it) => {
        const cat = productCategoryBucketKey(it.title || '');
        const qty = Number(it.qty) || 0;
        let unit = Number(it.unit_price);
        if (!(Number.isFinite(unit) && unit >= 0)) unit = baseUnitPrice(normalizeProductName(it.title), Math.max(1, qty));
        const sum = Math.round(unit * qty);
        agg[cat][lane].qty += qty;
        agg[cat][lane].sum += sum;
      });
    });
    const grandTotal = {
      cash: emptyReportLane(),
      noncash: emptyReportLane(),
      settlement: emptyReportLane(),
    };
    let body = '';
    order.forEach((key) => {
      const slice = agg[key];
      addReportLanes(grandTotal, slice.cash, slice.noncash, slice.settlement);
      body += `<tr>
        <td>${escapeHtml(labels[key])}</td>
        ${formatReportLaneTriple(slice.cash)}
        ${formatReportLaneTriple(slice.noncash)}
        ${formatReportLaneTriple(slice.settlement)}
        ${lanesTotalTwoCols(slice.cash, slice.noncash, slice.settlement)}
      </tr>`;
    });
    const foot = `<tr class="opx-reports-grand-total">
      <td><strong>Всего</strong></td>
      ${formatReportLaneTriple(grandTotal.cash)}
      ${formatReportLaneTriple(grandTotal.noncash)}
      ${formatReportLaneTriple(grandTotal.settlement)}
      ${lanesTotalTwoCols(grandTotal.cash, grandTotal.noncash, grandTotal.settlement)}
    </tr>`;
    return `<div class="opx-reports-table-wrap opx-reports-table-wrap--modern opx-reports-table-wrap--category"><table class="opx-reports-table opx-reports-table--dense opx-reports-table--category">${categoryReportColgroupHtml()}<thead>${productSummaryHeaderRows()}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
  }

  function auditEventIsCancellation(e) {
    return ['order_cancel', 'order_status_cancelled', 'order_delete'].includes(String(e.action || ''));
  }

  function auditEventOrderDisplayId(entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    const rawId = e.order_id;
    try {
      const parsed = JSON.parse(String(e.detail || ''));
      if (parsed && typeof parsed === 'object' && String(parsed.display_id || '').trim()) {
        return String(parsed.display_id).trim();
      }
    } catch {
      /**/
    }
    return displayOrderId(rawId);
  }

  function auditEventOrderLinkable(entry) {
    const e = entry && typeof entry === 'object' ? entry : {};
    if (String(e.action || '') === 'order_delete') return false;
    const openId = resolveOrderStateId(e.order_id);
    if (!openId) return false;
    return state.orders.some((o) => String(o.id).trim() === openId);
  }

  let html2pdfLoadPromise = null;

  function ensureHtml2pdfReady() {
    if (window.EkvalinePdfExport?.ensureHtml2pdfReady) {
      return window.EkvalinePdfExport.ensureHtml2pdfReady();
    }
    const g = typeof globalThis !== 'undefined' ? globalThis : window;
    if (typeof g.html2pdf === 'function') return Promise.resolve(true);
    if (html2pdfLoadPromise) return html2pdfLoadPromise;
    html2pdfLoadPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[data-ekvaline-html2pdf], script[src*="html2pdf"]');
      if (existing instanceof HTMLScriptElement) {
        existing.addEventListener('load', () => resolve(typeof g.html2pdf === 'function'), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        queueMicrotask(() => {
          if (typeof g.html2pdf === 'function') resolve(true);
        });
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/html2pdf.bundle.min.js?v=20260611pdf';
      script.async = true;
      script.dataset.ekvalineHtml2pdf = '1';
      script.onload = () => resolve(typeof g.html2pdf === 'function');
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    return html2pdfLoadPromise;
  }

  function findOrderForReportEvent(orderIdRaw) {
    const key = String(orderIdRaw ?? '').trim();
    if (!key) return null;
    return (
      state.orders.find((o) => {
        const id = String(o.id ?? '').trim();
        return id === key || displayOrderId(o.id) === key;
      }) || null
    );
  }

  /** Сводка: заказы по дате доставки в периоде + заказы из журнала событий (дата записи). */
  function ordersForReportSummaryCards(filteredByDelivery, auditEvents) {
    const out = Array.isArray(filteredByDelivery) ? filteredByDelivery.slice() : [];
    const seen = new Set(out.map((o) => String(o.id ?? '').trim()));
    (auditEvents || []).forEach((e) => {
      const o = findOrderForReportEvent(e.order_id);
      if (!o) return;
      const id = String(o.id ?? '').trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push(o);
    });
    return out;
  }

  function updateReportSummaryCards(scopeOrders, auditEvents) {
    const totals = summarizeReportTotals(Array.isArray(scopeOrders) ? scopeOrders : []);
    if (REPORTS_ORDERS) REPORTS_ORDERS.textContent = String(totals.ordersCount);
    if (REPORTS_ITEMS) REPORTS_ITEMS.textContent = String(totals.itemsCount);
    if (REPORTS_SUM) REPORTS_SUM.textContent = `${money(totals.totalSum)} ₽`;
    if (REPORTS_DELIVERED) REPORTS_DELIVERED.textContent = String(totals.delivered);
    if (REPORTS_CANCELLED) {
      const cancelFromEvents = (Array.isArray(auditEvents) ? auditEvents : []).filter(auditEventIsCancellation).length;
      REPORTS_CANCELLED.textContent = String(
        state.reportsPane === 'cancellations' ? cancelFromEvents : totals.cancelled || 0
      );
    }
  }

  async function populateReportsSupportingSections(from, to, filtered, fromRu, toRu) {
    if (REPORTS_JOURNAL_META instanceof HTMLElement) {
      REPORTS_JOURNAL_META.textContent = `События с датой записи в периоде ${fromRu} — ${toRu}. В карточках сверху учитываются и эти заказы, даже если доставка позже.`;
    }
    if (REPORTS_CATEGORIES_META instanceof HTMLElement) {
      REPORTS_CATEGORIES_META.textContent = `По заказам с датой доставки в периоде ${fromRu} — ${toRu} и заказам из журнала за период; отменённые включены.`;
    }
    if (REPORTS_CANCEL_META instanceof HTMLElement) {
      REPORTS_CANCEL_META.textContent = `Отмены и удаления оператором с датой записи события в периоде ${fromRu} — ${toRu} (включая отмены клиентом).`;
    }
    if (!(REPORTS_JOURNAL_BODY instanceof HTMLElement) || !(REPORTS_CANCEL_BODY instanceof HTMLElement)) {
      return { merged: [], scopeOrders: Array.isArray(filtered) ? filtered.slice() : [], auditEvents: [] };
    }
    if (!(REPORTS_CATEGORIES_MOUNT instanceof HTMLElement)) {
      return { merged: [], scopeOrders: Array.isArray(filtered) ? filtered.slice() : [], auditEvents: [] };
    }

    const serverEv = await fetchReportAuditEvents(from, to);
    const merged = mergeAuditEventsForReport(serverEv, from, to);
    const scopeOrders = ordersForReportSummaryCards(filtered, merged);
    const canc = merged.filter(auditEventIsCancellation);
    const journalBody = merged.length
      ? merged
          .map((e) => {
            const dt = ruDateTime(e.created_at);
            const dtText = typeof dt === 'object' ? `${dt.datePart} ${dt.timePart}` : String(e.created_at || '');
            return `<tr>
              <td>${escapeHtml(dtText)}</td>
              <td class="opx-num">${reportOrderLinkHtml(e)}</td>
              <td><span class="opx-reports-event">${escapeHtml(reportAuditActionLabel(e.action))}</span></td>
              <td>${journalWhoCellHtml(e)}</td>
              <td>${escapeHtml(reportAuditCommentHuman(e))}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="5" class="opx-reports-empty">Нет записей за период (по дате события).</td></tr>`;

    REPORTS_JOURNAL_BODY.innerHTML = journalBody;

    const cancelBody = canc.length
      ? canc
          .map((e) => {
            const dt = ruDateTime(e.created_at);
            const dtText = typeof dt === 'object' ? `${dt.datePart} ${dt.timePart}` : String(e.created_at || '');
            const reason = reportAuditCommentHuman(e);
            return `<tr>
              <td>${escapeHtml(dtText)}</td>
              <td class="opx-num">${reportOrderLinkHtml(e)}</td>
              <td>${journalWhoCellHtml(e)}</td>
              <td>${escapeHtml(reason !== '—' ? reason : reportAuditActionLabel(e.action))}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="4" class="opx-reports-empty">Нет отмен и удалений за выбранный период.</td></tr>`;
    REPORTS_CANCEL_BODY.innerHTML = cancelBody;
    const buildCategoriesSectionsHtml = () => {
      const days = reportDeliveryDaysFromOrders(scopeOrders);
      if (!days.length) {
        return `<p class="opx-reports-categories-placeholder">Нет заказов за выбранный период (по дате доставки и журналу).</p>`;
      }
      return days
        .map((dayIso) => {
          const dayRu = ruShortDateFromIsoDay(dayIso);
          const dayOrders = filterOrdersDeliveryOnDay(scopeOrders, dayIso);
          const tableBlock = dayOrders.length
            ? renderProductSummaryTableHtml(dayOrders)
            : `<p class="opx-reports-empty-day">Нет заказов на доставку за ${escapeHtml(dayRu)}.</p>`;
          return `<section class="opx-reports-categories-day" aria-label="Дата доставки ${escapeHtml(dayRu)}">
              <h3 class="opx-reports-categories-day-title">Дата доставки: ${escapeHtml(dayRu)}</h3>
              ${tableBlock}
            </section>`;
        })
        .join('');
    };

    REPORTS_CATEGORIES_MOUNT.innerHTML = buildCategoriesSectionsHtml();
    return { merged, scopeOrders, auditEvents: merged };
  }

  function reportsScopeOrdersForExport(from, to) {
    if (Array.isArray(state.reportsScopeOrders) && state.reportsScopeOrders.length) {
      return state.reportsScopeOrders;
    }
    return filterOrdersForReports(from, to);
  }

  function syncReportsPaneNavAndPanes() {
    const pane = state.reportsPane || 'journal';
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    REPORTS_OVERLAY.querySelectorAll('[data-opx-report-pane]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      const k = String(btn.getAttribute('data-opx-report-pane') || '');
      const on = k === pane;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    REPORTS_OVERLAY.querySelectorAll('.opx-reports-pane[data-report-pane]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const k = String(el.getAttribute('data-report-pane') || '');
      const on = k === pane;
      el.classList.toggle('is-active', on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  /** Активная вкладка отчёта для PDF/печати — по state, не по CSS-селектору. */
  function activeReportsPaneElement() {
    if (!(REPORTS_PRINT_AREA instanceof HTMLElement)) return null;
    const key = String(state.reportsPane || 'journal').trim() || 'journal';
    const pane = REPORTS_PRINT_AREA.querySelector(`.opx-reports-pane[data-report-pane="${key}"]`);
    if (pane instanceof HTMLElement) return pane;
    return REPORTS_PRINT_AREA.querySelector('.opx-reports-pane.is-active');
  }

  function setReportsPane(kind) {
    const allowed = new Set(['journal', 'forwarders', 'categories', 'cancellations']);
    state.reportsPane = allowed.has(kind) ? kind : 'journal';
    syncReportsPaneNavAndPanes();
    if (Array.isArray(state.reportsScopeOrders) && state.reportsScopeOrders.length) {
      updateReportSummaryCards(reportSummaryOrdersForPane(state.reportsScopeOrders), state.reportsAuditEvents);
    }
  }


  function exportReportsFilenameBase() {
    const from = REPORTS_DATE_FROM instanceof HTMLInputElement ? REPORTS_DATE_FROM.value : '';
    const to = REPORTS_DATE_TO instanceof HTMLInputElement ? REPORTS_DATE_TO.value : '';
    const pn = state.reportsPane || 'report';
    return { from, to, pn, base: `ekvaline-${pn}-${from || 'from'}_${to || 'to'}` };
  }

  function exportedPaneTitle(pane) {
    if (!(pane instanceof HTMLElement)) return 'Отчёт';
    const kind = String(pane.getAttribute('data-report-pane') || '').trim();
    const reportsHeading = pane.querySelector('#opxReportsHeading');
    if (kind === 'forwarders' && reportsHeading instanceof HTMLElement) {
      const t = String(reportsHeading.innerText || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (t) return t;
    }
    const h2 = pane.querySelector('.opx-reports-pane-title');
    if (h2 instanceof HTMLElement) {
      const t = String(h2.innerText || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (t) return t;
    }
    const headBox = pane.querySelector('#opxReportsHeading');
    if (headBox instanceof HTMLElement) {
      const t = String(headBox.innerText || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (t) return t.split('\n')[0].trim() || t;
    }
    return 'Отчёт';
  }

  function reportsPdfSubtitleForPane(pane) {
    if (!(pane instanceof HTMLElement)) return '';
    const from = REPORTS_DATE_FROM instanceof HTMLInputElement ? String(REPORTS_DATE_FROM.value || '').trim() : '';
    const to = REPORTS_DATE_TO instanceof HTMLInputElement ? String(REPORTS_DATE_TO.value || '').trim() : '';
    const fromRu = from ? ruDate(from) : '—';
    const toRu = to ? ruDate(to) : '—';
    const kind = String(pane.getAttribute('data-report-pane') || state.reportsPane || '').trim();
    if (kind === 'journal') {
      return `События с датой записи ${fromRu} — ${toRu}. Дата доставки заказа может отличаться.`;
    }
    if (kind === 'forwarders') {
      const scope = reportsScopeOrdersForExport(from, to);
      const financial = ordersForFinancialReport(scope);
      const dayCount = reportDeliveryDaysFromOrders(financial).length;
      if (!financial.length) {
        const fromRuSub = from ? ruDate(from) : '—';
        const toRuSub = to ? ruDate(to) : '—';
        return financialReportEmptyMessage(scope, fromRuSub, toRuSub);
      }
      if (dayCount > 1) {
        return `По каждому дню с заказами (${dayCount}). Только с назначенным водителем, без отменённых.`;
      }
      return 'Только заказы с назначенным водителем. Отменённые не входят.';
    }
    if (kind === 'categories') {
      const scopeCat = reportsScopeOrdersForExport(from, to);
      const dayCount = reportDeliveryDaysFromOrders(scopeCat).length;
      if (!dayCount) return 'Нет заказов за выбранный период (по дате доставки и журналу).';
      if (dayCount > 1) return `По каждому дню доставки в периоде (${dayCount}). Отменённые включены.`;
      return 'Отменённые включены.';
    }
    if (kind === 'cancellations') {
      return `Отмены с датой записи ${fromRu} — ${toRu}.`;
    }
    return from && to ? `Период ${fromRu} — ${toRu}.` : '';
  }

  function reportsPdfExportBlockedReason(pane) {
    if (!(pane instanceof HTMLElement)) return 'Нечего сохранять';
    const kind = String(pane.getAttribute('data-report-pane') || '').trim();
    if (kind === 'categories') {
      const from = REPORTS_DATE_FROM instanceof HTMLInputElement ? String(REPORTS_DATE_FROM.value || '').trim() : '';
      const to = REPORTS_DATE_TO instanceof HTMLInputElement ? String(REPORTS_DATE_TO.value || '').trim() : '';
      if (!reportDeliveryDaysFromOrders(reportsScopeOrdersForExport(from, to)).length) {
        return 'Нет заказов за выбранный период (по дате доставки и журналу)';
      }
    }
    const hasTable = pane.querySelector('table') instanceof HTMLTableElement;
    const hasCategoryBlock = Boolean(pane.querySelector('.opx-reports-categories-day'));
    if (!hasTable && !hasCategoryBlock) return 'В этом разделе нет данных для PDF';
    return '';
  }

  function buildReportsPdfHeaderHtml(pane) {
    const title = exportedPaneTitle(pane);
    const subtitle = reportsPdfSubtitleForPane(pane);
    let html = `<div class="opx-reports-pdf-brand">ЭкваЛайн · отчёты оператора</div>`;
    html += `<h2 class="opx-reports-pdf-title">${escapeHtml(title)}</h2>`;
    if (subtitle) {
      html += `<p class="opx-reports-pdf-meta">${escapeHtml(subtitle)}</p>`;
    }
    return html;
  }

  /** Содержимое активной вкладки отчёта — в отдельный лист для PDF (без пустого flex-оверлея). */
  function mountReportsPdfSheet(pane) {
    let sheet = REPORTS_PDF_SHEET;
    if (!(sheet instanceof HTMLElement)) {
      sheet = document.createElement('div');
      sheet.id = 'opxReportsPdfSheet';
      sheet.className = 'opx-reports-pdf-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = buildReportsPdfHeaderHtml(pane);
    const body = document.createElement('div');
    body.className = 'opx-reports-pdf-body';
    const kind = String(pane?.getAttribute('data-report-pane') || '').trim();
    const mount = pane.querySelector('.opx-reports-categories-mount');
    const wrap = pane.querySelector('.opx-reports-table-wrap');
    if (kind === 'categories' && mount instanceof HTMLElement) {
      const clone = mount.cloneNode(true);
      clone.querySelectorAll('.opx-reports-categories-placeholder').forEach((el) => el.remove());
      body.appendChild(clone);
    } else if (wrap instanceof HTMLElement) {
      body.appendChild(wrap.cloneNode(true));
    } else if (mount instanceof HTMLElement) {
      const clone = mount.cloneNode(true);
      clone.querySelectorAll('.opx-reports-categories-placeholder').forEach((el) => el.remove());
      body.appendChild(clone);
    } else {
      pane.querySelectorAll('table').forEach((table) => {
        if (!(table instanceof HTMLTableElement)) return;
        const box = document.createElement('div');
        box.className = 'opx-reports-table-wrap opx-reports-table-wrap--modern';
        box.appendChild(table.cloneNode(true));
        body.appendChild(box);
      });
    }
    sheet.appendChild(body);
    sheet.removeAttribute('hidden');
    sheet.style.display = 'block';
    return sheet;
  }

  function measureReportsPdfSheetSize(sheet) {
    if (!(sheet instanceof HTMLElement)) return { w: 780, h: 0 };
    void sheet.offsetHeight;
    const landscape = reportsPdfUsesLandscape(sheet);
    const minW = landscape ? 1060 : 780;
    let h = Math.max(sheet.scrollHeight || 0, sheet.offsetHeight || 0, 0);
    const table = sheet.querySelector('table');
    if (table instanceof HTMLElement) {
      const tRect = table.getBoundingClientRect();
      const sRect = sheet.getBoundingClientRect();
      h = Math.max(h, Math.ceil(tRect.bottom - sRect.top + 24));
    }
    sheet.querySelectorAll('.opx-reports-categories-day').forEach((day) => {
      if (!(day instanceof HTMLElement)) return;
      const dRect = day.getBoundingClientRect();
      const sRect = sheet.getBoundingClientRect();
      h = Math.max(h, Math.ceil(dRect.bottom - sRect.top + 24));
    });
    const w = Math.max(sheet.scrollWidth || 0, sheet.offsetWidth || 0, minW);
    return { w, h: Math.max(h, 0) };
  }

  function reportsPdfSheetHasContent(sheet) {
    if (!(sheet instanceof HTMLElement)) return false;
    if (sheet.querySelector('.opx-reports-categories-day')) return true;
    const rows = sheet.querySelectorAll('table tbody tr');
    if (!rows.length) return false;
    if (rows.length === 1 && rows[0].querySelector('.opx-reports-empty, .opx-reports-empty-day')) return false;
    return true;
  }

  function clearReportsPdfSheet() {
    if (REPORTS_PDF_SHEET instanceof HTMLElement) {
      REPORTS_PDF_SHEET.innerHTML = '';
      REPORTS_PDF_SHEET.setAttribute('hidden', '');
    }
  }

  function reportsPdfUsesLandscape(sheet) {
    if (!(sheet instanceof HTMLElement)) return false;
    if (sheet.querySelector('.opx-reports-table--financial, .opx-reports-table--category')) return true;
    const table = sheet.querySelector('table');
    if (table instanceof HTMLTableElement) {
      const cols = table.querySelectorAll('colgroup col').length;
      if (cols >= 10 || table.rows[0]?.cells?.length >= 10) return true;
    }
    return (sheet.scrollWidth || 0) > 900;
  }

  function waitNextPaintFrames(n = 2) {
    return new Promise((resolve) => {
      let left = n;
      const tick = () => {
        left -= 1;
        if (left <= 0) resolve();
        else window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });
  }

  function printActiveReportsPane() {
    const pane = activeReportsPaneElement();
    const blockReason = reportsPdfExportBlockedReason(pane);
    if (blockReason) {
      showToast(blockReason, 3600, 'error');
      return;
    }
    document.body.classList.add('opx-printing-reports');
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove('opx-printing-reports'), 500);
    }, 120);
  }

  async function downloadReportsPdf() {
    const pane = activeReportsPaneElement();
    const blockReason = reportsPdfExportBlockedReason(pane);
    if (blockReason) {
      showToast(blockReason, 3600, 'error');
      if (String(pane?.getAttribute('data-report-pane') || '') === 'categories') setReportsPane('categories');
      return;
    }
    const ready = await ensureHtml2pdfReady();
    const g = typeof globalThis !== 'undefined' ? globalThis : window;
    const h2p = g.html2pdf;
    if (!ready || typeof h2p !== 'function') {
      showToast('Не удалось загрузить модуль PDF. Обновите страницу (F5) или используйте «Печать».', 4800, 'error');
      return;
    }
    const { base } = exportReportsFilenameBase();
    document.body.classList.add('opx-printing-reports', 'opx-exporting-pdf');
    const sheet = mountReportsPdfSheet(pane);
    await waitNextPaintFrames(3);
    if (!reportsPdfSheetHasContent(sheet)) {
      showToast('Нет данных для PDF — сначала сформируйте отчёт за период', 4200, 'error');
      clearReportsPdfSheet();
      document.body.classList.remove('opx-printing-reports', 'opx-exporting-pdf');
      return;
    }
    const landscape = reportsPdfUsesLandscape(sheet);
    const { w: contentW, h: contentHRaw } = measureReportsPdfSheetSize(sheet);
    const contentH = Math.max(contentHRaw, 120);
    const hasText = window.EkvalinePdfExport?.sheetHasVisibleText
      ? window.EkvalinePdfExport.sheetHasVisibleText(sheet)
      : contentH >= 80;
    if (contentH < 80 || !hasText) {
      showToast('Не удалось подготовить PDF — обновите страницу и попробуйте снова', 4200, 'error');
      clearReportsPdfSheet();
      document.body.classList.remove('opx-printing-reports', 'opx-exporting-pdf');
      return;
    }
    const opt = {
      margin: [4, 4, 4, 4],
      filename: `${base}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
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
      jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.opx-reports-driver-subtotal'] },
    };
    try {
      if (REPORTS_PDF_BTN instanceof HTMLButtonElement) REPORTS_PDF_BTN.disabled = true;
      showToast('Готовим PDF…');
      await h2p().set(opt).from(sheet).save();
      showToast('PDF сохранён');
    } catch (e) {
      console.error(e);
      showToast('Не удалось сформировать PDF');
    } finally {
      clearReportsPdfSheet();
      document.body.classList.remove('opx-printing-reports', 'opx-exporting-pdf');
      if (REPORTS_PDF_BTN instanceof HTMLButtonElement) REPORTS_PDF_BTN.disabled = false;
    }
  }

  function ordersPrintStatusCaption() {
    const f = String(state.status || 'all');
    const map = {
      all: 'все статусы',
      in_processing: 'в обработке',
      new: 'в обработке',
      confirmed: 'подтверждён',
      on_way: 'в пути',
      work: 'в пути',
      delivered: 'доставлен',
      cancelled: 'отменён',
    };
    return map[f] || f;
  }

  function ordersPrintAdvSlotLabel(mode) {
    const map = {
      morning: 'утро',
      day: 'день',
      evening: 'вечер',
      work: '9–17',
      unset: 'не задано',
    };
    return map[String(mode || '').trim()] || String(mode || '').trim();
  }

  function ordersPrintFilterLines() {
    const lines = [];
    const adv = state.advanced || {};

    if (state.date && String(state.date).trim()) {
      lines.push(`Дата доставки: ${ruDate(state.date)}`);
    }
    if (state.status && state.status !== 'all') {
      lines.push(`Статус: ${ordersPrintStatusCaption()}`);
    }
    const q = String(state.query || '').trim();
    if (q) lines.push(`Поиск: «${q}»`);

    if (adv.slot && adv.slot !== 'all') {
      lines.push(`Интервал: ${ordersPrintAdvSlotLabel(adv.slot)}`);
    }
    if (adv.payment && adv.payment !== 'all') {
      lines.push(`Оплата: ${paymentLabelForFilterKey(adv.payment)}`);
    }
    if (adv.zone && adv.zone !== 'all') {
      lines.push(`Зона: ${String(adv.zone).trim()}`);
    }
    if (adv.driver && adv.driver !== 'all') {
      lines.push(
        `Водитель: ${adv.driver === '__none' ? 'Не назначен' : String(adv.driver).trim()}`
      );
    }
    if (adv.weekday && adv.weekday !== 'all') {
      const wd = WEEKDAY_OPTS.find((o) => o.v === String(adv.weekday));
      lines.push(`День недели: ${wd?.label || adv.weekday}`);
    }
    if (adv.product && adv.product !== 'all') {
      lines.push(`Продукция: ${String(adv.product).trim()}`);
    }

    return lines;
  }

  function ordersPrintTotals() {
    const stats = computeOperatorFooterStats(state.filtered);
    return { n: stats.orderCount, sum: stats.total, cancelled: stats.cancelledCount };
  }

  function ordersPrintHeaderHtml() {
    const filters = ordersPrintFilterLines();
    const { n, sum, cancelled } = ordersPrintTotals();
    const filterBlock = filters.length
      ? `<div class="opx-orders-print-filters">${filters.map((f) => escapeHtml(f)).join(' · ')}</div>`
      : '';
    const cancelNote = cancelled > 0 ? ` · без отменённых (${cancelled})` : '';
    const summary = `<div class="opx-orders-print-summary">Заказов: <strong>${escapeHtml(String(n))}</strong> · Сумма: <strong>${escapeHtml(money(sum))} ₽</strong>${escapeHtml(cancelNote)}</div>`;
    return `${filterBlock}${summary}`;
  }

  function ordersPrintRowHtml(o, i) {
    const product = parseProduct(o.items_json, i);
    const qty = parseQty(o.items_json);
    const zoneName = normalizeZoneName(o.zone);
    const dt = ruDateTime(o.created_at);
    const createdDate = typeof dt === 'object' ? dt.datePart : '—';
    const createdTime = typeof dt === 'object' ? dt.timePart : '—';
    const phone = String(o.phone || '').trim();
    const phoneFrag = phone ? `<br/><span class="opx-orders-print-phone">${escapeHtml(phone)}</span>` : '';
    const orderId = displayOrderId(o.id);
    const exp = String(o.driver ?? '').trim();
    return `
      <tr>
        <td class="opx-orders-print-id">${escapeHtml(orderId)}</td>
        <td>${escapeHtml(periodBySlot(o.delivery_slot))}</td>
        <td class="opx-orders-print-dt">${escapeHtml(createdDate)}<br />${escapeHtml(createdTime)}</td>
        <td class="opx-orders-print-clip">${escapeHtml(String(o.client || ''))}</td>
        <td class="opx-orders-print-addr">${escapeHtml(String(o.address || ''))}${phoneFrag}</td>
        <td>${escapeHtml(String(ruDate(o.delivery_date || o.created_at)))}</td>
        <td class="opx-orders-print-clip">${escapeHtml(product)}</td>
        <td>${escapeHtml(String(qty))}</td>
        <td class="opx-orders-print-num">${escapeHtml(money(orderDisplayTotalSum(o)))}</td>
        <td>${escapeHtml(paymentLabelDisplay(o.payment_method))}</td>
        <td>${escapeHtml(zoneName)}</td>
        <td class="opx-orders-print-clip">${escapeHtml(exp || 'Не назначен')}</td>
        <td class="opx-orders-print-note">${escapeHtml(formatCourierNote(o.courier_note))}</td>
      </tr>`;
  }

  function rebuildOrdersPrintSheet() {
    if (!(ORDERS_PRINT_SHEET instanceof HTMLElement)) return;
    const thead = `
      <tr>
        <th>№ заказа</th>
        <th>Период</th>
        <th>Дата и время заказа</th>
        <th>Клиент</th>
        <th>Адрес / телефон</th>
        <th>Дата доставки</th>
        <th>Продукция</th>
        <th>Кол-во</th>
        <th>Сумма ₽</th>
        <th>Форма оплаты</th>
        <th>Зона</th>
        <th>Экспедитор</th>
        <th>Примечание</th>
      </tr>`;
    const body = state.filtered.length
      ? state.filtered.map((o, idx) => ordersPrintRowHtml(o, idx)).join('')
      : `<tr><td colspan="13" class="opx-orders-print-empty">Нет заказов по текущему фильтру.</td></tr>`;
    const colgroup = `
      <colgroup>
        <col class="opx-pc-id" />
        <col class="opx-pc-period" />
        <col class="opx-pc-dt" />
        <col class="opx-pc-client" />
        <col class="opx-pc-addr" />
        <col class="opx-pc-dd" />
        <col class="opx-pc-prod" />
        <col class="opx-pc-qty" />
        <col class="opx-pc-sum" />
        <col class="opx-pc-pay" />
        <col class="opx-pc-zone" />
        <col class="opx-pc-driver" />
        <col class="opx-pc-note" />
      </colgroup>`;
    ORDERS_PRINT_SHEET.innerHTML = `
      <div class="opx-orders-print-brand">ЭкваЛайн · панель оператора</div>
      <h2 class="opx-orders-print-h">Список заказов</h2>
      ${ordersPrintHeaderHtml()}
      <table class="opx-orders-print-table">${colgroup}<thead>${thead}</thead><tbody>${body}</tbody></table>`;
  }

  function ordersPdfFilenameBase() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    const day = state.date && String(state.date).trim() ? String(state.date).trim().replace(/\s+/g, '') : 'all';
    return `zakazy_${day}_${stamp}`;
  }

  /** Копия макета на экран — html2canvas не захватывает #opxOrdersPrintSheet (left: -13000px). */
  function mountOrdersPdfExportSheet() {
    let sheet = ORDERS_PDF_EXPORT_SHEET;
    if (!(sheet instanceof HTMLElement)) {
      sheet = document.getElementById('opxOrdersPdfExportSheet');
    }
    if (!(sheet instanceof HTMLElement)) {
      sheet = document.createElement('div');
      sheet.id = 'opxOrdersPdfExportSheet';
      sheet.className = 'opx-orders-pdf-export-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sheet);
    }
    if (!(ORDERS_PRINT_SHEET instanceof HTMLElement)) return sheet;
    sheet.innerHTML = ORDERS_PRINT_SHEET.innerHTML;
    sheet.removeAttribute('hidden');
    return sheet;
  }

  function clearOrdersPdfExportSheet() {
    const sheet =
      ORDERS_PDF_EXPORT_SHEET instanceof HTMLElement
        ? ORDERS_PDF_EXPORT_SHEET
        : document.getElementById('opxOrdersPdfExportSheet');
    if (sheet instanceof HTMLElement) {
      sheet.innerHTML = '';
      sheet.setAttribute('hidden', '');
    }
  }

  function measureOrdersPdfSheetSize(sheet) {
    if (!(sheet instanceof HTMLElement)) return { w: 1150, h: 120 };
    void sheet.offsetHeight;
    const table = sheet.querySelector('.opx-orders-print-table');
    let h = Math.max(sheet.scrollHeight || 0, sheet.offsetHeight || 0, 0);
    if (table instanceof HTMLElement) {
      const tRect = table.getBoundingClientRect();
      const sRect = sheet.getBoundingClientRect();
      h = Math.max(h, Math.ceil(tRect.bottom - sRect.top + 20));
    }
    const w = Math.max(sheet.scrollWidth || 0, sheet.offsetWidth || 0, 1150);
    return { w, h: Math.max(h, 120) };
  }

  async function downloadOrdersListPdf() {
    if (!(ORDERS_PRINT_SHEET instanceof HTMLElement)) return;
    const ready = await ensureHtml2pdfReady();
    const g = typeof globalThis !== 'undefined' ? globalThis : window;
    const h2p = g.html2pdf;
    if (!ready || typeof h2p !== 'function') throw new Error('no html2pdf');

    rebuildOrdersPrintSheet();
    document.body.classList.add('opx-exporting-orders-pdf');
    const sheet = mountOrdersPdfExportSheet();
    await waitNextPaintFrames(3);

    const { w: contentW, h: contentH } = measureOrdersPdfSheetSize(sheet);
    const rowCount = sheet.querySelectorAll('.opx-orders-print-table tbody tr, .opx-orders-print-table tr').length;
    const hasText = window.EkvalinePdfExport?.sheetHasVisibleText
      ? window.EkvalinePdfExport.sheetHasVisibleText(sheet)
      : contentH >= 80;
    if (contentH < 80 || !rowCount || !hasText) {
      clearOrdersPdfExportSheet();
      document.body.classList.remove('opx-exporting-orders-pdf');
      throw new Error('orders pdf export sheet empty');
    }

    const opt = {
      margin: [4, 4, 4, 4],
      filename: `${ordersPdfFilenameBase()}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
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
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] },
    };
    try {
      await h2p().set(opt).from(sheet).save();
    } finally {
      clearOrdersPdfExportSheet();
      document.body.classList.remove('opx-exporting-orders-pdf');
    }
  }

  async function exportOrdersPdfAndPrint() {
    if (!(ORDERS_PRINT_SHEET instanceof HTMLElement)) return;
    rebuildOrdersPrintSheet();
    if (!state.filtered.length) {
      showToast('Нет строк по текущему фильтру — нечего печатать');
      return;
    }
    const g = typeof globalThis !== 'undefined' ? globalThis : window;
    const btn = ORDERS_EXPORT_BTN;
    if (btn instanceof HTMLButtonElement) btn.disabled = true;
    try {
      if (await ensureHtml2pdfReady() && typeof g.html2pdf === 'function') {
        showToast('Сохраняем PDF (альбом)…');
        await downloadOrdersListPdf();
        showToast('PDF сохранён');
        return;
      }
      showToast('PDF недоступен — открываем печать');
    } catch (e) {
      console.error(e);
      showToast('PDF не сохранился — открываем печать');
    } finally {
      if (btn instanceof HTMLButtonElement) btn.disabled = false;
    }
    document.body.classList.add('opx-printing-orders');
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove('opx-printing-orders'), 500);
    }, 160);
  }

  function filterOrdersForReports(dateFrom, dateTo) {
    const from = String(dateFrom || '').trim();
    const to = String(dateTo || '').trim();
    return state.orders.filter((o) => {
      const d = isoDate(o.delivery_date || o.created_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  /** Заказы для финансовой таблицы по экспедиторам — не отменённые и с назначенным водителем. */
  function ordersForFinancialReport(orders) {
    return (Array.isArray(orders) ? orders : []).filter(
      (o) => !orderIsCancelled(o) && orderHasAssignedDriver(o)
    );
  }

  function financialReportEmptyMessage(scopeOrders, fromRu, toRu) {
    const scope = Array.isArray(scopeOrders) ? scopeOrders : [];
    const nonCancelled = scope.filter((o) => !orderIsCancelled(o));
    const withDriver = nonCancelled.filter((o) => orderHasAssignedDriver(o));
    if (!scope.length) {
      return `Нет заказов за период ${fromRu} — ${toRu} (по дате доставки и журналу).`;
    }
    if (!nonCancelled.length) {
      return `В периоде ${fromRu} — ${toRu} только отменённые заказы — финансовая сводка пуста.`;
    }
    if (!withDriver.length) {
      return `В периоде ${fromRu} — ${toRu} нет заказов с назначенным водителем — назначьте экспедитора в карточке заказа.`;
    }
    return `Нет данных для финансовой сводки за период ${fromRu} — ${toRu}.`;
  }

  function reportSummaryOrdersForPane(scopeOrders) {
    const scope = Array.isArray(scopeOrders) ? scopeOrders : [];
    return state.reportsPane === 'forwarders' ? ordersForFinancialReport(scope) : scope;
  }

  /** Все календарные дни доставки (или создания) по списку заказов. */
  function reportDeliveryDaysFromOrders(orders) {
    const days = new Set();
    (Array.isArray(orders) ? orders : []).forEach((o) => {
      const d = isoDate(o.delivery_date || o.created_at);
      if (d) days.add(d);
    });
    return [...days].sort();
  }

  /** Дни доставки, на которые есть хотя бы один неотменённый заказ в периоде. */
  function reportDeliveryDaysInPeriod(filteredOrders, fromIso, toIso) {
    const from = String(fromIso || '').trim();
    const to = String(toIso || '').trim();
    const days = new Set();
    ordersForFinancialReport(filteredOrders).forEach((o) => {
      const d = isoDate(o.delivery_date || o.created_at);
      if (!d) return;
      if (from && d < from) return;
      if (to && d > to) return;
      days.add(d);
    });
    return [...days].sort();
  }

  /** Список календарных дней YYYY-MM-DD от from до to включительно (только если обе границы валидны). */
  function enumerateIsoDatesInclusive(fromIso, toIso) {
    const a = String(fromIso || '').trim();
    const b = String(toIso || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return [];
    let start = a;
    let end = b;
    if (start > end) {
      const t = start;
      start = end;
      end = t;
    }
    const out = [];
    let cur = start;
    while (cur && cur <= end) {
      out.push(cur);
      cur = shiftIsoCalendarDay(cur, 1);
    }
    return out;
  }

  /** Подмножество заказов с датой доставки (или датой создания) = dayIso. */
  function filterOrdersDeliveryOnDay(filteredOrders, dayIso) {
    const d = String(dayIso || '').trim();
    return filteredOrders.filter((o) => isoDate(o.delivery_date || o.created_at) === d);
  }

  /** Короткая подпись dd.mm.yy без сдвига часового пояса. */
  function ruShortDateFromIsoDay(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return String(iso || '—');
    return `${m[3]}.${m[2]}.${m[1].slice(2)}`;
  }

  function summarizeReportTotals(filtered) {
    let ordersCount = filtered.length;
    let itemsCount = 0;
    let totalSum = 0;
    let delivered = 0;
    let cancelled = 0;
    filtered.forEach((o) => {
      const st = String(o.status || '').trim().toLowerCase();
      if (st === 'delivered') delivered += 1;
      if (st === 'cancelled') {
        cancelled += 1;
        return;
      }
      totalSum += Number(o.total_sum) || 0;
      itemsCount += orderItemsQtyForReport(o);
    });
    return { ordersCount, itemsCount, totalSum, delivered, cancelled };
  }

  function addReportLanes(acc, cash, noncash, settlement) {
    acc.cash.qty += cash.qty;
    acc.cash.sum += cash.sum;
    acc.noncash.qty += noncash.qty;
    acc.noncash.sum += noncash.sum;
    acc.settlement.qty += settlement.qty;
    acc.settlement.sum += settlement.sum;
  }

  function buildFinancialByDriverStructured(filtered) {
    const byDriver = new Map();

    filtered.forEach((o) => {
      if (!orderHasAssignedDriver(o)) return;
      const driver = String(o.driver ?? '').trim();
      const lane = reportPaymentLaneForFinancial(o.payment_method);
      let items = orderItems(o);
      if (!items.length) {
        const fallbackTitle = parseProduct(o.items_json, 0);
        const fq = parseQty(o.items_json) || 1;
        items = [{ title: fallbackTitle, qty: fq, unit_price: NaN }];
      }

      items.forEach((it) => {
        const product = normalizeProductName(it.title || 'Товар');
        const qty = Number(it.qty) || 0;
        let unit = Number(it.unit_price);
        if (!(Number.isFinite(unit) && unit >= 0)) unit = baseUnitPrice(product, Math.max(1, qty));
        const sum = Math.round(unit * qty);
        if (!byDriver.has(driver)) byDriver.set(driver, new Map());
        const pmap = byDriver.get(driver);
        if (!pmap.has(product)) {
          pmap.set(product, {
            cash: emptyReportLane(),
            noncash: emptyReportLane(),
            settlement: emptyReportLane(),
          });
        }
        const agg = pmap.get(product);
        agg[lane].qty += qty;
        agg[lane].sum += sum;
      });
    });

    return byDriver;
  }

  /**
   * Строки финансового отчёта по водителям/продукции для подмножества заказов.
   * @param {{ n: number }} serialRef счётчик «№ п.п.» (передаётся по ссылке)
   * @returns {boolean} true, если добавлены строки с продукцией
   */
  function appendFinancialReportDriverRows(bodyRows, grandTotal, subsetOrders, serialRef) {
    const byDriver = buildFinancialByDriverStructured(subsetOrders);
    const driversSorted = [...byDriver.keys()]
      .filter((driver) => orderHasAssignedDriver({ driver }))
      .sort((a, b) => a.localeCompare(b, 'ru'));
    if (!driversSorted.length) return false;
    driversSorted.forEach((driver) => {
      const pmap = byDriver.get(driver);
      const productsSorted = [...pmap.keys()].sort((a, b) => a.localeCompare(b, 'ru'));
      const rowSpan = productsSorted.length + 1;
      const driverTot = {
        cash: emptyReportLane(),
        noncash: emptyReportLane(),
        settlement: emptyReportLane(),
      };

      productsSorted.forEach((productKey, pi) => {
        const { cash, noncash, settlement } = pmap.get(productKey);
        addReportLanes(driverTot, cash, noncash, settlement);
        addReportLanes(grandTotal, cash, noncash, settlement);
        serialRef.n += 1;
        bodyRows.push(`<tr>
            <td class="opx-num">${serialRef.n}</td>
            ${pi === 0 ? `<td rowspan="${rowSpan}" class="opx-reports-driver-cell">${escapeHtml(driver)}</td>` : ''}
            <td>${escapeHtml(productKey)}</td>
            ${formatReportLaneTriple(cash)}
            ${formatReportLaneTriple(noncash)}
            ${formatReportLaneTriple(settlement)}
            ${lanesTotalTwoCols(cash, noncash, settlement)}
          </tr>`);
      });

      bodyRows.push(`<tr class="opx-reports-driver-subtotal">
          <td></td>
          <td class="opx-reports-subtotal-label"><strong>Итого:</strong></td>
          ${formatReportLaneTriple(driverTot.cash)}
          ${formatReportLaneTriple(driverTot.noncash)}
          ${formatReportLaneTriple(driverTot.settlement)}
          ${lanesTotalTwoCols(driverTot.cash, driverTot.noncash, driverTot.settlement)}
        </tr>`);
    });
    return true;
  }

  function formatReportLaneTriple(lane) {
    const qty = lane.qty;
    const sum = lane.sum;
    const priceTxt = qty > 0 ? money(Math.round(sum / qty)) : '—';
    const qtyTxt = qty > 0 ? String(qty) : '—';
    const sumTxt = sum > 0 ? money(sum) : '—';
    return `<td class="opx-num">${priceTxt}</td><td class="opx-num">${qtyTxt}</td><td class="opx-num">${sumTxt}</td>`;
  }

  function lanesTotalTwoCols(cash, noncash, settlement) {
    const q = cash.qty + noncash.qty + settlement.qty;
    const s = cash.sum + noncash.sum + settlement.sum;
    return `<td class="opx-num">${q > 0 ? String(q) : '—'}</td><td class="opx-num">${s > 0 ? money(s) : '—'}</td>`;
  }

  function financialReportHeaderRows() {
    return `
      <tr>
        <th rowspan="2" class="opx-num">№ п.п.</th>
        <th rowspan="2">Водитель-экспедитор</th>
        <th rowspan="2">Продукция</th>
        <th colspan="3">Наличный расчёт</th>
        <th colspan="3">Безналичный расчёт</th>
        <th colspan="3">Расчётный счёт</th>
        <th colspan="2">Итого</th>
      </tr>
      <tr>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Цена</th><th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
        <th class="opx-num">Кол-во</th><th class="opx-num">Сумма</th>
      </tr>
    `;
  }

  async function renderReports() {
    if (!(REPORTS_OVERLAY instanceof HTMLElement) || REPORTS_OVERLAY.hidden) return;
    if (!(REPORTS_BODY instanceof HTMLElement)) {
      showToast('Не найдена таблица отчёта — обновите страницу');
      return;
    }

    const from = REPORTS_DATE_FROM instanceof HTMLInputElement ? REPORTS_DATE_FROM.value : '';
    const to = REPORTS_DATE_TO instanceof HTMLInputElement ? REPORTS_DATE_TO.value : '';
    const filtered = filterOrdersForReports(from, to);
    const fromRu = from ? ruDate(from) : '—';
    const toRu = to ? ruDate(to) : '—';

    const { scopeOrders, auditEvents } = await populateReportsSupportingSections(from, to, filtered, fromRu, toRu);
    state.reportsScopeOrders = scopeOrders;
    state.reportsAuditEvents = auditEvents;
    const financialOrders = ordersForFinancialReport(scopeOrders);
    const reportDays = reportDeliveryDaysFromOrders(financialOrders);

    if (REPORTS_HEADING instanceof HTMLElement) {
      const dayNote =
        reportDays.length > 1
          ? ' <span class="opx-reports-dates-notes">— по каждому дню с заказами</span>'
          : '';
      REPORTS_HEADING.innerHTML = `<strong class="opx-reports-kicker">Отчёт:</strong> <span class="opx-reports-name">Финансовый по экспедиторам</span> <span class="opx-reports-dates">(доставка ${fromRu} — ${toRu})</span>${dayNote}`;
    }

    if (REPORTS_THEAD instanceof HTMLElement) REPORTS_THEAD.innerHTML = financialReportHeaderRows();

    const grandTotal = {
      cash: emptyReportLane(),
      noncash: emptyReportLane(),
      settlement: emptyReportLane(),
    };

    let serialRef = { n: 0 };
    const bodyRows = [];

    if (!scopeOrders.length) {
      REPORTS_BODY.innerHTML = `<tr><td colspan="14" class="opx-reports-empty">Нет заказов за период ${escapeHtml(fromRu)} — ${escapeHtml(toRu)} (по дате доставки и журналу).</td></tr>`;
      if (REPORTS_TFOOT instanceof HTMLElement) REPORTS_TFOOT.innerHTML = '';
    } else if (!financialOrders.length) {
      REPORTS_BODY.innerHTML = `<tr><td colspan="14" class="opx-reports-empty">${escapeHtml(financialReportEmptyMessage(scopeOrders, fromRu, toRu))}</td></tr>`;
      if (REPORTS_TFOOT instanceof HTMLElement) REPORTS_TFOOT.innerHTML = '';
    } else if (reportDays.length) {
      reportDays.forEach((dayIso) => {
        const dayRu = ruShortDateFromIsoDay(dayIso);
        const dayOrders = filterOrdersDeliveryOnDay(financialOrders, dayIso);
        if (!dayOrders.length) return;
        bodyRows.push(`<tr class="opx-reports-day-head">
            <td colspan="14" class="opx-reports-day-head-cell"><strong>Дата доставки: ${escapeHtml(dayRu)}</strong></td>
          </tr>`);
        const hadRows = appendFinancialReportDriverRows(bodyRows, grandTotal, dayOrders, serialRef);
        if (!hadRows) {
          bodyRows.push(`<tr class="opx-reports-day-empty">
            <td colspan="14" class="opx-reports-empty">Нет позиций для сводки за ${escapeHtml(dayRu)}.</td>
          </tr>`);
        }
      });

      REPORTS_BODY.innerHTML = bodyRows.join('');

      if (REPORTS_TFOOT instanceof HTMLElement) {
        REPORTS_TFOOT.innerHTML = `<tr class="opx-reports-grand-total">
          <td colspan="3"><strong>Всего за период</strong></td>
          ${formatReportLaneTriple(grandTotal.cash)}
          ${formatReportLaneTriple(grandTotal.noncash)}
          ${formatReportLaneTriple(grandTotal.settlement)}
          ${lanesTotalTwoCols(grandTotal.cash, grandTotal.noncash, grandTotal.settlement)}
        </tr>`;
      }
    } else {
      const added = appendFinancialReportDriverRows(bodyRows, grandTotal, financialOrders, serialRef);

      if (!added) {
        REPORTS_BODY.innerHTML = `<tr><td colspan="14" class="opx-reports-empty">Нет данных для финансовой сводки за выбранный период.</td></tr>`;
        if (REPORTS_TFOOT instanceof HTMLElement) REPORTS_TFOOT.innerHTML = '';
      } else {
        REPORTS_BODY.innerHTML = bodyRows.join('');
        if (REPORTS_TFOOT instanceof HTMLElement) {
          REPORTS_TFOOT.innerHTML = `<tr class="opx-reports-grand-total">
          <td colspan="3"><strong>Всего</strong></td>
          ${formatReportLaneTriple(grandTotal.cash)}
          ${formatReportLaneTriple(grandTotal.noncash)}
          ${formatReportLaneTriple(grandTotal.settlement)}
          ${lanesTotalTwoCols(grandTotal.cash, grandTotal.noncash, grandTotal.settlement)}
        </tr>`;
        }
      }
    }

    syncReportsPaneNavAndPanes();
    updateReportSummaryCards(reportSummaryOrdersForPane(scopeOrders), auditEvents);
  }

  function openReportsOverlay() {
    if (!(REPORTS_OVERLAY instanceof HTMLElement)) return;
    closeOperatorModalsBlockingFullScreenUi();
    closeZoneMapOverlay();
    closeSettingsOverlay();
    TAB_MAP?.classList.remove('is-active');
    TAB_SETTINGS?.classList.remove('is-active');
    state.reportsOpen = true;
    REPORTS_OVERLAY.hidden = false;
    TAB_REPORTS?.classList.add('is-active');
    TAB_ORDERS?.classList.remove('is-active');
    if (REPORTS_CATEGORIES_DAY instanceof HTMLInputElement) REPORTS_CATEGORIES_DAY.value = '';
    setReportsPeriodDays(30);
    syncEmbeddedReportsNav('reports');
    syncOperatorFullscreenBodyClass();
    refreshBodyBackdropClass();
  }

  function setModalValue(el, value) {
    const prepared = value === undefined || value === null ? '—' : String(value);
    if (!el) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.value = prepared;
      if (el instanceof HTMLSelectElement && el.value !== prepared && el.options.length) {
        el.selectedIndex = 0;
      }
      if (el === CLIENT_NAME_INPUT) syncClientCardNameCounter();
      return;
    }
    el.textContent = prepared;
  }

  function setPhoneInputValue(el, raw) {
    if (!(el instanceof HTMLInputElement)) return;
    const lim = opxLimits();
    const text = raw === undefined || raw === null ? '' : String(raw).trim();
    if (!text || text === '—' || text === 'Телефон не указан') {
      el.value = '';
    } else {
      el.value = lim?.formatPhoneMaskRu?.(text) ?? text;
    }
    const counterId = el.getAttribute('data-phone-digits-count-for');
    const counterEl = counterId ? document.getElementById(counterId) : null;
    lim?.syncPhoneDigitCounter?.(el, counterEl);
  }

  function syncClientCardNameCounter() {
    if (!(CLIENT_NAME_INPUT instanceof HTMLInputElement)) return;
    const counter = document.getElementById('opxClientNameCount');
    if (!(counter instanceof HTMLElement)) return;
    const max = CLIENT_NAME_INPUT.maxLength > 0 ? CLIENT_NAME_INPUT.maxLength : opxLimits()?.NAME_MAX ?? 60;
    counter.textContent = `${CLIENT_NAME_INPUT.value.length}/${max}`;
  }

  const SLOT_FILTER_MODE_BY_KEY = {
    '09:00-14:00': 'morning',
    '14:00-17:00': 'day',
    '17:00-21:00': 'evening',
    '09:00-17:00': 'work',
  };

  /** delivery_slot строки клиента ↔ ключ кнопок расширенного фильтра по интервалу */
  function deliverySlotToFilterMode(ds) {
    const raw = String(ds ?? '').trim();
    if (!raw) return 'unset';
    const key = normalizeDeliverySlotStored(raw);
    return SLOT_FILTER_MODE_BY_KEY[key] || 'unset';
  }

  /** Подпись колонки «Период» — интервал доставки (без слова «рабочее», чтобы не путать со статусом «В работе»). */
  function periodBySlot(ds) {
    const label = {
      morning: 'утро',
      day: 'день',
      evening: 'вечер',
      work: '9–17',
      unset: 'не задано',
    };
    const mode = deliverySlotToFilterMode(ds);
    if (label[mode]) return label[mode];
    const s = String(ds ?? '').trim();
    return s || 'не задано';
  }

  function parseQty(itemsJson) {
    try {
      const items = extractOrderItemsArray(itemsJson);
      if (!items.length) return 0;
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

  /** Единый ключ заметок: совпадает для черновика по телефону и для сохранённого заказа */
  function operatorClientNotesBucketFromOrder(orderLike) {
    const d = normalizePhoneRuDigits(String(orderLike?.phone || ''));
    if (d.length >= 10) return `ph:${d}`;
    const nm = normalizeToken(String(orderLike?.client || '').trim());
    if (nm.length >= 2) return `nm:${nm}`;
    return '';
  }

  function operatorClientNotesBucketKey() {
    if (!state.creatingOrder) {
      const o = getActiveOrder();
      const k = o ? operatorClientNotesBucketFromOrder(o) : '';
      return k || '__none';
    }
    const digits = normalizePhoneRuDigits(MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : '');
    if (digits.length >= 10) return `ph:${digits}`;
    const nm = normalizeToken(MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value : '');
    if (nm.length >= 2) return `nm:${nm}`;
    return '__draft';
  }

  function isOrderPinnedNoteType(noteType) {
    return String(noteType || '') === ORDER_PINNED_NOTE_TYPE;
  }

  function splitOperatorNotesByScope(rows) {
    const client = [];
    const orderPinned = [];
    (rows || []).forEach((row) => {
      if (isOrderPinnedNoteType(row?.noteType)) orderPinned.push(row);
      else client.push(row);
    });
    return { client, orderPinned };
  }

  function normalizeOperatorOrderNotesBucket(orderLike) {
    const id = resolveOrderStateId(orderLike?.id ?? orderLike?.order_id ?? '');
    return id ? `ord:${id}` : '';
  }

  function operatorOrderNotesBucketKey() {
    if (state.creatingOrder) return ORDER_PINNED_DRAFT_BUCKET;
    const o = getActiveOrder();
    return o ? normalizeOperatorOrderNotesBucket(o) : '';
  }

  function orderNotesBucketsMatchActiveDom() {
    const clientNow = operatorClientNotesBucketKey();
    const orderNow = operatorOrderNotesBucketKey() || '';
    return (
      Boolean(orderNotesActiveClientBucket) &&
      orderNotesActiveClientBucket !== '__none' &&
      orderNotesActiveClientBucket === clientNow &&
      String(orderNotesActiveOrderBucket || '') === String(orderNow || '')
    );
  }

  function operatorNoteTypeLabel(value) {
    const hit = OPERATOR_NOTE_TYPES.find((t) => t.value === value);
    return hit ? hit.label : OPERATOR_NOTE_TYPES[0].label;
  }

  function readAllOperatorClientNotes() {
    return readStore(CLIENT_OPERATOR_NOTES_KEY, {});
  }

  function writeAllOperatorClientNotes(map) {
    writeStore(CLIENT_OPERATOR_NOTES_KEY, map);
  }

  function mergeOperatorClientNoteBuckets(map, fromKey, toKey) {
    if (!fromKey || !toKey || fromKey === toKey) return;
    const src = Array.isArray(map[fromKey]) ? map[fromKey] : [];
    const frag = src.filter((r) => !isOrderPinnedNoteType(r?.noteType));
    const pinnedLeft = src.filter((r) => isOrderPinnedNoteType(r?.noteType));
    if (!frag.length) {
      if (pinnedLeft.length) map[fromKey] = pinnedLeft;
      else delete map[fromKey];
      return;
    }
    const cur = (Array.isArray(map[toKey]) ? map[toKey] : []).filter((r) => !isOrderPinnedNoteType(r?.noteType));
    map[toKey] = [...frag, ...cur];
    if (pinnedLeft.length) map[fromKey] = pinnedLeft;
    else delete map[fromKey];
  }

  function mergeOperatorOrderPinnedNoteBuckets(map, fromKey, toKey) {
    if (!fromKey || !toKey || fromKey === toKey) return;
    const src = Array.isArray(map[fromKey]) ? map[fromKey] : [];
    const frag = src.filter((r) => isOrderPinnedNoteType(r?.noteType));
    if (!frag.length) return;
    const cur = (Array.isArray(map[toKey]) ? map[toKey] : []).filter((r) => isOrderPinnedNoteType(r?.noteType));
    map[toKey] = [...frag, ...cur];
    const rest = src.filter((r) => !isOrderPinnedNoteType(r?.noteType));
    if (rest.length) map[fromKey] = rest;
    else delete map[fromKey];
  }

  function writeOperatorNotesBucket(map, bucket, rows) {
    if (!bucket || bucket === '__none') return;
    const kept = (rows || []).filter((r) => String(r.text || '').trim().length > 0);
    if (kept.length) map[bucket] = kept;
    else delete map[bucket];
  }

  function scrapeOrderNotesDom() {
    const out = [];
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return out;
    ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]').forEach((tr) => {
      if (!(tr instanceof HTMLElement)) return;
      const id = String(tr.getAttribute('data-note-id') || '').trim();
      const sel = tr.querySelector('select[data-opx-note-type]');
      const ta = tr.querySelector('textarea[data-opx-note-info]');
      const noteType = sel instanceof HTMLSelectElement ? String(sel.value || 'simple') : 'simple';
      const rawText = ta instanceof HTMLTextAreaElement ? ta.value : '';
      const noteMax = opxLimits()?.ORDER_NOTE_TEXT_MAX ?? 2000;
      const text = opxLimits()?.clampText(rawText, noteMax) ?? String(rawText ?? '').slice(0, noteMax);
      if (!id) return;
      out.push({ id, noteType, text });
    });
    return out;
  }

  function persistOrderNotesToDisk(clientBucketOverride, orderBucketOverride) {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    const clientBucket =
      clientBucketOverride != null ? clientBucketOverride : orderNotesActiveClientBucket;
    const orderBucket = orderBucketOverride != null ? orderBucketOverride : orderNotesActiveOrderBucket;
    const scraped = scrapeOrderNotesDom();
    const { client, orderPinned } = splitOperatorNotesByScope(scraped);
    const all = readAllOperatorClientNotes();
    writeOperatorNotesBucket(all, clientBucket, client);
    writeOperatorNotesBucket(all, orderBucket, orderPinned);
    writeAllOperatorClientNotes(all);
    if (ORDER_MODAL instanceof HTMLElement && ORDER_MODAL.classList.contains('is-open')) refreshOrderNotesPreviews();
  }

  function noteTypeSelectHtml(selected) {
    const s = String(selected || 'simple');
    return OPERATOR_NOTE_TYPES.map((t) => {
      const sel = t.value === s ? ' selected' : '';
      return `<option value="${escapeHtml(t.value)}"${sel}>${escapeHtml(t.label)}</option>`;
    }).join('');
  }

  function resetOrderNotesSelection() {
    selectedOrderNoteRowId = '';
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]').forEach((row) => row.classList.remove('is-selected'));
  }

  function setOrderNotesSelectedRow(tr) {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]').forEach((row) => row.classList.remove('is-selected'));
    if (tr instanceof HTMLElement) {
      selectedOrderNoteRowId = String(tr.getAttribute('data-note-id') || '');
      tr.classList.add('is-selected');
    } else {
      selectedOrderNoteRowId = '';
    }
  }

  function normalizeStoredOperatorNoteRow(r) {
    if (!r || typeof r !== 'object' || r.id == null || r.text === undefined) return null;
    return {
      id: String(r.id || ''),
      noteType: String(r.noteType || 'simple'),
      text: String(r.text || ''),
    };
  }

  function pickClientNotesFromLocalStorage(bucket) {
    if (!bucket || bucket === '__none') return [];
    const all = readAllOperatorClientNotes();
    const arr = Array.isArray(all[bucket]) ? all[bucket] : [];
    return arr
      .map(normalizeStoredOperatorNoteRow)
      .filter(Boolean)
      .filter((r) => String(r.text || '').trim())
      .filter((r) => !isOrderPinnedNoteType(r.noteType));
  }

  function pickOrderPinnedNotesFromLocalStorage(bucket) {
    if (!bucket || bucket === '__none') return [];
    const all = readAllOperatorClientNotes();
    const arr = Array.isArray(all[bucket]) ? all[bucket] : [];
    return arr
      .map(normalizeStoredOperatorNoteRow)
      .filter(Boolean)
      .filter((r) => String(r.text || '').trim())
      .filter((r) => isOrderPinnedNoteType(r.noteType));
  }

  function pickOrderNotesFromLocalStorage(clientBucket, orderBucket) {
    return [
      ...pickClientNotesFromLocalStorage(clientBucket),
      ...pickOrderPinnedNotesFromLocalStorage(orderBucket),
    ];
  }

  /** Строки для превью: из таблицы только если DOM относится к текущим бакетам; иначе LS. */
  function getOrderNotesPreviewRows() {
    const clientBucket = operatorClientNotesBucketKey();
    if (!clientBucket || clientBucket === '__none') return [];
    const orderBucket = operatorOrderNotesBucketKey() || '';
    const hasDomRows =
      ORDER_NOTES_TBODY instanceof HTMLElement &&
      !!ORDER_NOTES_TBODY.querySelector('tr[data-note-id]');
    const liveFromTable =
      hasDomRows &&
      orderNotesBucketsMatchActiveDom() &&
      (orderNotesVisitedThisOpen || state.orderModalTab === 'notes');
    if (liveFromTable) {
      return scrapeOrderNotesDom().filter((r) => String(r.text || '').trim());
    }
    return pickOrderNotesFromLocalStorage(clientBucket, orderBucket);
  }

  function removeOperatorClientNoteById(noteId) {
    const id = String(noteId || '').trim();
    if (!id) return;
    let removed = false;
    if (ORDER_NOTES_TBODY instanceof HTMLElement) {
      const hit = ORDER_NOTES_TBODY.querySelector(`tr[data-note-id="${id}"]`);
      if (hit instanceof HTMLElement) {
        hit.remove();
        removed = true;
        resetOrderNotesSelection();
        renumberOrderNotesRows();
        if (!ORDER_NOTES_TBODY.querySelector('tr[data-note-id]')) orderNotesHydrateDomFromRows([]);
      }
    }
    if (removed) {
      persistOrderNotesToDisk();
      refreshOrderNotesPreviews();
      return;
    }
    const clientBucket = operatorClientNotesBucketKey();
    const orderBucket = operatorOrderNotesBucketKey() || ORDER_PINNED_DRAFT_BUCKET;
    const all = readAllOperatorClientNotes();
    let changed = false;
    for (const bucket of [clientBucket, orderBucket]) {
      if (!bucket || bucket === '__none') continue;
      const arr = Array.isArray(all[bucket]) ? all[bucket] : [];
      const next = arr.filter((r) => String(r?.id || '') !== id);
      if (next.length === arr.length) continue;
      changed = true;
      if (next.length) all[bucket] = next;
      else delete all[bucket];
    }
    if (!changed) return;
    writeAllOperatorClientNotes(all);
    refreshOrderNotesPreviews();
  }

  function orderNotesPreviewListMarkup(rows, emptyKind) {
    if (!rows.length) {
      if (emptyKind === 'bucket') {
        return '<li class="opx-order-notes-empty opx-order-notes-dock-empty">Укажите телефон (10 цифр) или имя клиента — заметки привязаны к карточке.</li>';
      }
      return '<li class="opx-order-notes-empty">Нет сохранённых заметок</li>';
    }
    return rows
      .map((r) => {
        const lbl = operatorNoteTypeLabel(r.noteType);
        const body = escapeHtml(String(r.text || '').trim()).replaceAll('\n', '<br />');
        return `<li class="opx-order-notes-li"><span class="opx-order-notes-bullet-type">${escapeHtml(lbl)}:</span> <span class="opx-order-notes-bullet-text">${body}</span></li>`;
      })
      .join('');
  }

  function refreshOrderNotesBullets() {
    if (!(ORDER_NOTES_BULLETS instanceof HTMLElement)) return;
    const bucket = operatorClientNotesBucketKey();
    if (bucket === '__none') {
      ORDER_NOTES_BULLETS.innerHTML = orderNotesPreviewListMarkup([], 'bucket');
      return;
    }
    ORDER_NOTES_BULLETS.innerHTML = orderNotesPreviewListMarkup(getOrderNotesPreviewRows(), undefined);
  }

  function refreshOrderNotesDock() {
    const dock = ORDER_NOTES_DOCK;
    const ul = ORDER_NOTES_DOCK_LIST;
    if (!(dock instanceof HTMLElement) || !(ul instanceof HTMLElement)) return;
    const modalOpen =
      ORDER_MODAL instanceof HTMLElement &&
      !ORDER_MODAL.hidden &&
      ORDER_MODAL.classList.contains('is-open');
    if (!modalOpen) {
      dock.hidden = true;
      ul.innerHTML = '';
      return;
    }
    const rows = getOrderNotesPreviewRows();
    if (!rows.length) {
      dock.hidden = true;
      ul.innerHTML = '';
      return;
    }
    dock.hidden = false;
    ul.innerHTML = rows
      .map((r) => {
        const lbl = operatorNoteTypeLabel(r.noteType);
        const body = escapeHtml(String(r.text || '').trim());
        const id = escapeHtml(String(r.id || ''));
        return `<li class="opx-order-notes-dock-li" data-note-id="${id}">
          <div class="opx-order-notes-dock-item">
            <p class="opx-order-notes-dock-text"><span class="opx-order-notes-bullet-type">${escapeHtml(lbl)}:</span> ${body}</p>
            <button type="button" class="opx-order-notes-dock-dismiss" data-opx-note-dismiss="${id}" aria-label="Убрать заметку" title="Убрать заметку">✕</button>
          </div>
        </li>`;
      })
      .join('');
  }

  function refreshOrderNotesPreviews() {
    refreshOrderNotesBullets();
    refreshOrderNotesDock();
  }

  function renumberOrderNotesRows() {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]').forEach((row, ix) => {
      const td = row.querySelector('.opx-order-notes-num');
      if (td instanceof HTMLElement) td.textContent = String(ix + 1);
    });
  }

  function newOperatorNoteUid() {
    return `n_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  }

  function buildOrderNotesRowMarkup(index, note) {
    const id = escapeHtml(note.id);
    const noteTypeVal = String(note.noteType || 'simple');
    const sel = noteTypeSelectHtml(noteTypeVal);
    return `<tr data-note-id="${id}">
        <td class="opx-order-notes-num">${index}</td>
        <td><select class="opx-modal-input" data-opx-note-type>${sel}</select></td>
        <td><textarea class="opx-modal-input opx-order-notes-area" rows="3" maxlength="${opxLimits()?.ORDER_NOTE_TEXT_MAX ?? 2000}" data-opx-note-info placeholder="${escapeHtml(
          `${operatorNoteTypeLabel(noteTypeVal)}: `
        )}"></textarea></td>
      </tr>`;
  }

  /** Заполнить textarea после innerHTML — без интерпретации тегов */
  function orderNotesHydrateDomFromRows(rows) {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    const list =
      rows && rows.length ? rows.slice() : [{ id: newOperatorNoteUid(), noteType: 'simple', text: '' }];
    ORDER_NOTES_TBODY.innerHTML = list.map((note, ix) => buildOrderNotesRowMarkup(ix + 1, note)).join('');
    list.forEach((note, ix) => {
      const row = ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]')[ix];
      const ta = row?.querySelector('textarea[data-opx-note-info]');
      if (ta instanceof HTMLTextAreaElement) ta.value = String(note.text || '');
    });
    resetOrderNotesSelection();
    refreshOrderNotesPreviews();
  }

  function hydrateOrderNotesPanel() {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
    const clientBucketNow = operatorClientNotesBucketKey();
    const orderBucketNow = operatorOrderNotesBucketKey() || '';
    const clientChanged =
      Boolean(orderNotesActiveClientBucket) &&
      orderNotesActiveClientBucket !== '__none' &&
      orderNotesActiveClientBucket !== clientBucketNow;
    const orderChanged =
      Boolean(orderNotesActiveOrderBucket) &&
      orderNotesActiveOrderBucket !== '__none' &&
      orderNotesActiveOrderBucket !== orderBucketNow;
    if (clientChanged || orderChanged) {
      persistOrderNotesToDisk(orderNotesActiveClientBucket, orderNotesActiveOrderBucket);
      if (clientChanged && clientBucketNow !== '__none') {
        const merged = readAllOperatorClientNotes();
        mergeOperatorClientNoteBuckets(merged, orderNotesActiveClientBucket, clientBucketNow);
        writeAllOperatorClientNotes(merged);
      }
    }
    orderNotesActiveClientBucket = clientBucketNow;
    orderNotesActiveOrderBucket = orderBucketNow;
    if (!clientBucketNow || clientBucketNow === '__none') {
      ORDER_NOTES_TBODY.innerHTML = '';
      refreshOrderNotesPreviews();
      return;
    }
    const loaded = pickOrderNotesFromLocalStorage(clientBucketNow, orderBucketNow);
    orderNotesHydrateDomFromRows(loaded);
  }

  /** Смена телефона/имени в модалке: сливаем только клиентские заметки (не закреплённые к заказу). */
  function orderNotesMigrateStorageWhenIdentityChanges() {
    if (!(ORDER_MODAL instanceof HTMLElement && ORDER_MODAL.classList.contains('is-open'))) return;
    const nextClient = operatorClientNotesBucketKey();
    const nextOrder = operatorOrderNotesBucketKey() || '';
    const prevClient = orderNotesActiveClientBucket || '';
    const prevOrder = orderNotesActiveOrderBucket || '';
    if (!prevClient || prevClient === '__none') {
      orderNotesActiveClientBucket = nextClient;
      orderNotesActiveOrderBucket = nextOrder;
      refreshOrderNotesPreviews();
      return;
    }
    if (prevClient === nextClient && prevOrder === nextOrder) return;

    persistOrderNotesToDisk(prevClient, prevOrder);
    if (prevClient !== nextClient && nextClient !== '__none') {
      const all = readAllOperatorClientNotes();
      mergeOperatorClientNoteBuckets(all, prevClient, nextClient);
      writeAllOperatorClientNotes(all);
    }
    orderNotesActiveClientBucket = nextClient;
    orderNotesActiveOrderBucket = nextOrder;

    if (state.orderModalTab === 'notes') hydrateOrderNotesPanel();
    else refreshOrderNotesPreviews();
  }

  function tryFinalizeOrderNotesOnSave() {
    if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return false;
    if (!orderNotesVisitedThisOpen) return false;
    const clientBucket = operatorClientNotesBucketKey();
    if (clientBucket === '__none') return false;
    const orderBucket = operatorOrderNotesBucketKey() || '';
    const allBefore = readAllOperatorClientNotes();
    const snapBefore = JSON.stringify({
      client: allBefore[clientBucket] || allBefore[orderNotesActiveClientBucket] || [],
      order: orderBucket ? allBefore[orderBucket] || allBefore[orderNotesActiveOrderBucket] || [] : [],
    });
    if (
      orderNotesActiveClientBucket &&
      orderNotesActiveClientBucket !== clientBucket &&
      orderNotesActiveClientBucket !== '__none'
    ) {
      persistOrderNotesToDisk(orderNotesActiveClientBucket, orderNotesActiveOrderBucket);
      const all = readAllOperatorClientNotes();
      mergeOperatorClientNoteBuckets(all, orderNotesActiveClientBucket, clientBucket);
      writeAllOperatorClientNotes(all);
    } else if (
      orderNotesActiveOrderBucket &&
      orderBucket &&
      orderNotesActiveOrderBucket !== orderBucket
    ) {
      persistOrderNotesToDisk(orderNotesActiveClientBucket, orderNotesActiveOrderBucket);
    }
    orderNotesActiveClientBucket = clientBucket;
    orderNotesActiveOrderBucket = orderBucket;
    persistOrderNotesToDisk(clientBucket, orderBucket);
    refreshOrderNotesPreviews();
    const allAfter = readAllOperatorClientNotes();
    const snapAfter = JSON.stringify({
      client: allAfter[clientBucket] || [],
      order: orderBucket ? allAfter[orderBucket] || [] : [],
    });
    return snapBefore !== snapAfter;
  }

  function migrateOperatorDraftNotes(orderRowLike) {
    const clientNk = operatorClientNotesBucketFromOrder(orderRowLike) || '__draft';
    const orderNk = normalizeOperatorOrderNotesBucket(orderRowLike);
    const all = readAllOperatorClientNotes();
    mergeOperatorClientNoteBuckets(all, '__draft', clientNk);
    if (orderNk) mergeOperatorOrderPinnedNoteBuckets(all, ORDER_PINNED_DRAFT_BUCKET, orderNk);
    const bk = orderNotesActiveClientBucket || '';
    if (bk && bk !== clientNk && bk !== '__none') mergeOperatorClientNoteBuckets(all, bk, clientNk);
    writeAllOperatorClientNotes(all);
    orderNotesActiveClientBucket = clientNk;
    orderNotesActiveOrderBucket = orderNk || '';
    if (ORDER_MODAL instanceof HTMLElement && ORDER_MODAL.classList.contains('is-open')) refreshOrderNotesPreviews();
  }

  function resetOrderNotesSessionState() {
    selectedOrderNoteRowId = '';
    orderNotesActiveClientBucket = '';
    orderNotesActiveOrderBucket = '';
    orderNotesVisitedThisOpen = false;
    if (ORDER_NOTES_TBODY instanceof HTMLElement) ORDER_NOTES_TBODY.innerHTML = '';
  }

  function escapeRegExp(text) {
    return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function aggregateClientProfilesFromOrders() {
    const map = new Map();
    const sorted = [...state.orders].sort(
      (a, b) =>
        Number(new Date(String(b.created_at ?? '')).getTime()) -
        Number(new Date(String(a.created_at ?? '')).getTime())
    );
    for (const o of sorted) {
      const key = normalizeClientKey(o);
      const client = String(o.client || '').trim();
      const phone = String(o.phone || '').trim();
      const address = String(o.address || '').trim();
      if (!key || (!client && !phone && !address)) continue;

      if (map.has(key)) {
        map.get(key).orderCount += 1;
        continue;
      }

      let cartLines = parseOrderItemsFromJson(o.items_json);
      if (!cartLines.length) {
        const title = parseProduct(o.items_json, 0);
        if (title) {
          cartLines = [
            {
              title,
              qty: Math.max(1, parseQty(o.items_json) || 1),
              unit_price:
                parseUnitPrice(o.items_json) ??
                getDefaultPriceForOrder(o, title, Math.max(1, parseQty(o.items_json) || 1)),
            },
          ];
        }
      }

      map.set(key, {
        client: client || 'Клиент',
        phone,
        address,
        zone: String(o.zone || '').trim(),
        payment_method: String(o.payment_method || '').trim(),
        cartLines,
        orderCount: 1,
      });
    }

    const out = [];
    map.forEach((p) => {
      const phoneDigits = String(p.phone || '').replace(/\D/g, '');
      const norm = normalizePhoneRuDigits(p.phone || (phoneDigits.length ? `+${phoneDigits}` : ''));
      const tailNorm = norm.slice(-10);
      p.phoneDigits = phoneDigits;
      p.searchHay = normalizeOpSearchString(
        `${p.client} ${p.phone} ${phoneDigits} ${norm} ${tailNorm} ${p.address}`
      ).replace(/\s+/g, ' ');
      out.push(p);
    });
    return out;
  }

  function clientProfileZoneToModalValue(zoneRaw) {
    const z = normalizeZoneName(zoneRaw);
    return districts.includes(z) ? z : '';
  }

  function applyClientRepeatOrderDefaults(prof, opts) {
    if (!prof || !state.creatingOrder) return false;
    const o = opts || {};
    if (MODAL_CLIENT instanceof HTMLInputElement && (o.fillClient || !MODAL_CLIENT.value.trim())) {
      MODAL_CLIENT.value = prof.client || MODAL_CLIENT.value;
    }
    if (MODAL_PHONE instanceof HTMLInputElement && prof.phone) setPhoneInputValue(MODAL_PHONE, prof.phone);
    if (MODAL_ADDRESS instanceof HTMLInputElement && prof.address) MODAL_ADDRESS.value = prof.address;
    const zoneVal = clientProfileZoneToModalValue(prof.zone);
    if (MODAL_ZONE instanceof HTMLSelectElement && zoneVal && [...MODAL_ZONE.options].some((opt) => opt.value === zoneVal)) {
      MODAL_ZONE.value = zoneVal;
    }
    if (MODAL_PAYMENT instanceof HTMLSelectElement && prof.payment_method) {
      MODAL_PAYMENT.value = paymentRawToModalSelectValue(prof.payment_method);
    }
    if (!o.skipCart && Array.isArray(prof.cartLines) && prof.cartLines.length) {
      setOrderModalCartLines(prof.cartLines, null);
    }
    updateGoodsSumPreview();
    orderNotesMigrateStorageWhenIdentityChanges();
    return true;
  }

  function findClientProfileByPhoneDigits(digits) {
    const norm = normalizePhoneRuDigits(digits);
    if (!norm) return null;
    const matches = aggregateClientProfilesFromOrders().filter((p) => normalizePhoneRuDigits(p.phone) === norm);
    if (!matches.length) return null;
    matches.sort((a, b) => b.orderCount - a.orderCount);
    return matches[0];
  }

  function findClientProfileForCreateOrder() {
    const byPhone = findClientProfileByPhoneDigits(
      MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : ''
    );
    if (byPhone) return byPhone;
    const clientName = normalizeToken(MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value : '');
    if (clientName.length < 2) return null;
    const matches = aggregateClientProfilesFromOrders().filter((p) => normalizeToken(p.client) === clientName);
    if (!matches.length) return null;
    matches.sort((a, b) => b.orderCount - a.orderCount);
    return matches[0];
  }

  function defaultWaterCartLinePreset() {
    const waterRow = operatorCatalogRows.find((r) => r.water) || operatorCatalogRows[0];
    const title = waterRow?.displayName || 'Вода 18.9л';
    const qty = 2;
    return {
      title,
      product_id: waterRow?.id ?? null,
      qty,
      unit_price: baseUnitPrice(title, qty),
    };
  }

  function applyOrderCartWaterQuick() {
    hideOrderCartCatalogPicker();
    const prof = findClientProfileForCreateOrder();
    const orderForPricing = getActiveOrder();
    if (state.creatingOrder) {
      if (prof && prof.orderCount > 0) {
        applyClientRepeatOrderDefaults(prof, { fillClient: true });
        const phoneDig = normalizePhoneRuDigits(prof.phone);
        if (phoneDig) state.clientRepeatAppliedKey = `phone:${phoneDig}`;
        setOrderModalTab('goods');
        return;
      }
      setOrderModalCartLines([defaultWaterCartLinePreset()], null);
      setOrderModalTab('goods');
      return;
    }
    if (prof && prof.orderCount > 0 && Array.isArray(prof.cartLines) && prof.cartLines.length) {
      setOrderModalCartLines(prof.cartLines, orderForPricing);
      updateGoodsSumPreview();
      setOrderModalTab('goods');
      showToast('Подставлен состав прошлого заказа клиента', 2800, 'info');
      return;
    }
    const current = readOrderModalCartFromDom();
    setOrderModalCartLines([...current, defaultWaterCartLinePreset()], orderForPricing);
    updateGoodsSumPreview();
    setOrderModalTab('goods');
    showToast('Вода добавлена в заказ', 2400, 'success');
  }

  function tryAutoFillClientRepeatOrder() {
    if (!state.creatingOrder) return;
    const prof = findClientProfileForCreateOrder();
    if (!prof) return;
    const phoneDig = normalizePhoneRuDigits(prof.phone || (MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : ''));
    const key = phoneDig ? `phone:${phoneDig}` : `client:${normalizeToken(prof.client)}`;
    if (state.clientRepeatAppliedKey === key) return;
    applyClientRepeatOrderDefaults(prof, { fillClient: true });
    state.clientRepeatAppliedKey = key;
  }

  function resetCreateOrderFormFields() {
    state.clientRepeatAppliedKey = '';
    hideModalClientSuggest();
    resetOrderNotesSessionState();
    if (MODAL_CLIENT instanceof HTMLInputElement) MODAL_CLIENT.value = '';
    if (MODAL_PHONE instanceof HTMLInputElement) setPhoneInputValue(MODAL_PHONE, '');
    if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.value = '';
    if (MODAL_NOTE instanceof HTMLTextAreaElement) MODAL_NOTE.value = '';
    setModalValue(MODAL_ZONE, 'Подхват');
    setModalValue(MODAL_DELIVERY_DATE, earliestDeliveryDateIso());
    applyModalDeliveryDateConstraints();
    updateQuickDateButtons();
    if (MODAL_DRIVER instanceof HTMLSelectElement) MODAL_DRIVER.value = '';
    setModalValue(MODAL_PAYMENT, 'Наличная');
    if (MODAL_PICKUP instanceof HTMLInputElement) MODAL_PICKUP.checked = false;
    setOrderModalCartLines([defaultOrderCartLine(null)], null);
    setModalSlot('09:00-14:00', { silent: true });
    updateGoodsSumPreview();
    renderCreateOrderJournalPlaceholder();
    orderNotesMigrateStorageWhenIdentityChanges();
    refreshOrderNotesPreviews();
  }

  function modalClientSuggestGatherCombined() {
    const c = MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value : '';
    const p = MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : '';
    const a = MODAL_ADDRESS instanceof HTMLInputElement ? MODAL_ADDRESS.value : '';
    return String(`${c} ${p} ${a}`.trim());
  }

  function modalClientSuggestEffectiveWords() {
    const combined = modalClientSuggestGatherCombined();
    const condensed = normalizeOpSearchString(combined);
    const letters = condensed.replace(/[^a-zа-яё]/giu, '');
    const digitsAll = combined.replace(/\D/g, '');
    if (letters.length < 2 && digitsAll.length < 3) return null;

    const words = condensed.split(/\s+/).filter((tok) => tok.length >= 2);
    (combined.match(/\d+/g) || []).forEach((run) => {
      if (run.length >= 2) words.push(run);
    });
    words.sort((a, b) => String(b).length - String(a).length);
    return [...new Set(words)].filter(Boolean);
  }

  function modalClientSuggestProfileMatches(p, words) {
    return words.every((tok) => {
      if (/^\d+$/.test(tok)) {
        return Boolean(p.phoneDigits && p.phoneDigits.includes(tok)) || p.searchHay.includes(tok);
      }
      return p.searchHay.includes(normalizeOpSearchString(tok));
    });
  }

  function highlightSuggestText(textRaw, needles) {
    const text = String(textRaw ?? '');
    let parts = needles.filter((n) => String(n).trim().length >= 2).map((n) => String(n));
    parts.sort((a, b) => b.length - a.length);
    parts = [...new Set(parts)];
    const patternBody = parts.map((n) => escapeRegExp(n)).filter(Boolean).join('|');
    if (!patternBody.trim()) return escapeHtml(text);
    try {
      const reSpl = new RegExp(`(${patternBody})`, 'giu');
      return text
        .split(reSpl)
        .map((bit, ix) =>
          ix % 2 === 1
            ? `<mark class="opx-modal-client-suggest-hit">${escapeHtml(bit)}</mark>`
            : escapeHtml(bit)
        )
        .join('');
    } catch {
      return escapeHtml(text);
    }
  }

  function detachModalSuggestViewportListeners() {
    if (!modalClientSuggestPinned) return;
    modalClientSuggestPinned = false;
    window.removeEventListener('resize', repositionModalClientSuggest);
    document.removeEventListener('scroll', repositionModalClientSuggest, true);
  }

  function repositionModalClientSuggest() {
    if (!(MODAL_CLIENT instanceof HTMLElement) || !(CLIENT_SUGGEST instanceof HTMLElement)) return;
    if (CLIENT_SUGGEST.hidden) return;
    const r = MODAL_CLIENT.getBoundingClientRect();
    const pad = 8;
    const width = Math.min(
      window.innerWidth - pad * 2,
      Math.max(220, Number.isFinite(r.width) ? r.width : 260)
    );
    CLIENT_SUGGEST.style.position = 'fixed';
    CLIENT_SUGGEST.style.left = `${Math.max(pad, Math.min(r.left, window.innerWidth - width - pad))}px`;
    CLIENT_SUGGEST.style.top = `${r.bottom + 4}px`;
    CLIENT_SUGGEST.style.width = `${width}px`;
    CLIENT_SUGGEST.style.zIndex = '5680';
    const spaceBelow = window.innerHeight - r.bottom - pad;
    CLIENT_SUGGEST.style.maxHeight = `${Math.min(320, Math.max(80, spaceBelow - 8))}px`;
  }

  function attachModalSuggestViewportListeners() {
    if (modalClientSuggestPinned) return;
    modalClientSuggestPinned = true;
    window.addEventListener('resize', repositionModalClientSuggest);
    document.addEventListener('scroll', repositionModalClientSuggest, true);
  }

  function hideModalClientSuggest() {
    detachModalSuggestViewportListeners();
    window.clearTimeout(state.modalClientSuggestTimer);
    state.modalClientSuggestTimer = null;
    modalClientSuggestList = [];
    modalClientSuggestActiveIdx = -1;
    if (!(CLIENT_SUGGEST instanceof HTMLElement)) return;
    CLIENT_SUGGEST.hidden = true;
    CLIENT_SUGGEST.innerHTML = '';
    ['position', 'left', 'top', 'width', 'max-height', 'maxHeight', 'z-index', 'zIndex'].forEach((k) =>
      CLIENT_SUGGEST.style.removeProperty(k)
    );
    if (MODAL_CLIENT instanceof HTMLElement) {
      MODAL_CLIENT.setAttribute('aria-expanded', 'false');
    }
  }

  function modalClientSuggestSetActiveHighlight() {
    if (!(CLIENT_SUGGEST instanceof HTMLElement)) return;
    CLIENT_SUGGEST.querySelectorAll('[data-opx-modal-client-i]').forEach((btn, ix) => {
      if (!(btn instanceof HTMLElement)) return;
      btn.classList.toggle('is-active', ix === modalClientSuggestActiveIdx);
      btn.setAttribute('aria-selected', ix === modalClientSuggestActiveIdx ? 'true' : 'false');
    });
  }

  function modalClientSuggestShouldOfferCreateNew() {
    if (modalClientSuggestList.length > 0) return false;
    if (findClientProfileForCreateOrder()) return false;
    return true;
  }

  function modalClientSuggestRender(words) {
    if (!(CLIENT_SUGGEST instanceof HTMLElement)) return;

    if (!modalClientSuggestList.length) {
      if (!modalClientSuggestShouldOfferCreateNew()) {
        hideModalClientSuggest();
        return;
      }
      CLIENT_SUGGEST.innerHTML = `<div class="opx-modal-client-suggest-actions" style="border-top: 0">
          <button type="button" class="opx-modal-client-suggest-new" data-opx-modal-client-new>Создать нового клиента?</button>
        </div>`;
      CLIENT_SUGGEST.hidden = false;
      if (MODAL_CLIENT instanceof HTMLElement) MODAL_CLIENT.setAttribute('aria-expanded', 'true');
      attachModalSuggestViewportListeners();
      repositionModalClientSuggest();
      modalClientSuggestActiveIdx = -1;
      modalClientSuggestSetActiveHighlight();
      return;
    }

    const needles = words || [];
    let html = '';
    modalClientSuggestList.forEach((prof, idx) => {
      html += `<button type="button" class="opx-modal-client-suggest-item" role="option" tabindex="-1" data-opx-modal-client-i="${idx}" aria-selected="${
        idx === modalClientSuggestActiveIdx
      }">
          <span class="opx-modal-client-suggest-title">${highlightSuggestText(prof.client, needles)}</span>
          <span class="opx-modal-client-suggest-meta">${highlightSuggestText(
            prof.address || 'адрес не указан',
            needles
          )}</span>
          <span class="opx-modal-client-suggest-count">кол-во заказов: ${prof.orderCount}</span>
        </button>`;
    });
    if (modalClientSuggestShouldOfferCreateNew()) {
      html += `<div class="opx-modal-client-suggest-actions">
        <button type="button" class="opx-modal-client-suggest-new" data-opx-modal-client-new>Создать нового клиента?</button>
      </div>`;
    }

    CLIENT_SUGGEST.innerHTML = html;
    CLIENT_SUGGEST.hidden = false;
    if (MODAL_CLIENT instanceof HTMLElement) MODAL_CLIENT.setAttribute('aria-expanded', 'true');
    attachModalSuggestViewportListeners();
    repositionModalClientSuggest();
    modalClientSuggestSetActiveHighlight();
  }

  function modalClientSuggestPickIndex(idx) {
    const prof = modalClientSuggestList[idx];
    if (!prof) return;
    applyClientRepeatOrderDefaults(prof, { fillClient: true });
    const phoneDig = normalizePhoneRuDigits(prof.phone);
    if (phoneDig) state.clientRepeatAppliedKey = `phone:${phoneDig}`;
    hideModalClientSuggest();
    setOrderModalTab('goods');
    MODAL_PRODUCT?.focus();
  }

  /** Режим «новый клиент»: оставить введённое имя, сбросить телефон/адрес под новую карточку. */
  function modalClientSuggestChooseCreateNew() {
    if (!state.creatingOrder) return;
    window.clearTimeout(state.modalClientSuggestTimer);
    state.modalClientSuggestTimer = null;
    const keepName =
      MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value.trim() : '';
    modalClientSuggestList = [];
    modalClientSuggestActiveIdx = -1;
    hideModalClientSuggest();
    state.clientRepeatAppliedKey = '';
    if (MODAL_CLIENT instanceof HTMLInputElement && keepName) MODAL_CLIENT.value = keepName;
    if (MODAL_PHONE instanceof HTMLInputElement) setPhoneInputValue(MODAL_PHONE, '');
    if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.value = '';
    orderNotesMigrateStorageWhenIdentityChanges();
    window.requestAnimationFrame(() => {
      MODAL_PHONE?.focus();
    });
  }

  function modalClientSuggestRunSearch() {
    if (!state.creatingOrder || !(CLIENT_SUGGEST instanceof HTMLElement)) return;

    const words = modalClientSuggestEffectiveWords();
    if (!words) {
      hideModalClientSuggest();
      return;
    }

    let pool = aggregateClientProfilesFromOrders().filter((p) => modalClientSuggestProfileMatches(p, words));
    pool.sort((a, b) => b.orderCount - a.orderCount || String(a.client || '').localeCompare(String(b.client || ''), 'ru'));
    modalClientSuggestList = pool.slice(0, 16);
    if (!modalClientSuggestList.length) {
      const known = findClientProfileForCreateOrder();
      if (known) modalClientSuggestList = [known];
    }
    modalClientSuggestActiveIdx = modalClientSuggestList.length ? 0 : -1;
    modalClientSuggestRender(words);
  }

  function scheduleModalClientSuggestRefresh() {
    if (!state.creatingOrder) return;
    window.clearTimeout(state.modalClientSuggestTimer);
    state.modalClientSuggestTimer = window.setTimeout(() => {
      state.modalClientSuggestTimer = null;
      modalClientSuggestRunSearch();
    }, 200);
  }

  function modalClientSuggestDismissOutside(ev) {
    const target = ev.target;
    if (!state.creatingOrder || !(CLIENT_SUGGEST instanceof HTMLElement)) return;
    if (CLIENT_SUGGEST.hidden || CLIENT_SUGGEST.hasAttribute('hidden')) return;
    if (!(target instanceof Node)) return;
    if (CLIENT_SUGGEST.contains(target)) return;
    if (MODAL_CLIENT?.contains(target)) return;
    if (MODAL_PHONE instanceof HTMLElement && MODAL_PHONE.contains(target)) return;
    if (MODAL_ADDRESS instanceof HTMLElement && MODAL_ADDRESS.contains(target)) return;
    hideModalClientSuggest();
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

  /** Числовой id для REST (`/api/orders/:id`) — только для заказов из БД, не для демо `ЛС-…`. */
  function orderRestIdForApi(rawId) {
    if (rawId != null && typeof rawId === 'object') {
      const n = orderDbId(rawId);
      return n > 0 ? String(n) : '';
    }
    if (rawId == null || rawId === '') return '';
    if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId > 0) return String(Math.trunc(rawId));
    const s = String(rawId).trim();
    if (/^\d+$/.test(s)) return s;
    return '';
  }

  function displayOrderId(rawId) {
    const text = String(rawId || '').trim();
    if (/^ЛС-\d{3,}$/i.test(text)) return text.toUpperCase();
    const n = extractOrderNumber(rawId);
    return n > 0 ? `ЛС-${String(n).padStart(6, '0')}` : 'ЛС-000000';
  }

  /** Ключ заказа в state.orders (число или ЛС-…) для открытия карточки из отчётов и toast. */
  function resolveOrderStateId(rawId) {
    const key = String(rawId ?? '').trim();
    if (!key) return '';
    const direct = state.orders.find((o) => String(o.id).trim() === key);
    if (direct) return String(direct.id).trim();
    const num = extractOrderNumber(key);
    if (num > 0) {
      const byNum = state.orders.find((o) => extractOrderNumber(o.id) === num);
      if (byNum) return String(byNum.id).trim();
    }
    return key;
  }

  function reportOrderLinkHtml(rawOrderIdOrEvent) {
    const entry =
      rawOrderIdOrEvent && typeof rawOrderIdOrEvent === 'object' ? rawOrderIdOrEvent : { order_id: rawOrderIdOrEvent };
    const label = auditEventOrderDisplayId(entry);
    if (!auditEventOrderLinkable(entry)) {
      const title =
        String(entry.action || '') === 'order_delete' ? 'Заказ удалён из базы' : 'Заказ не найден в списке';
      return `<span class="opx-order-link is-muted" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
    }
    const openId = resolveOrderStateId(entry.order_id);
    return `<button type="button" class="opx-order-link" data-opx-open-order="${escapeHtml(openId)}">${escapeHtml(label)}</button>`;
  }

  function normalizePhoneRuDigits(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.length === 10 && /^9\d{9}$/.test(d)) d = `7${d}`;
    if (d.length === 11 && d[0] === '8') d = `7${d.slice(1)}`;
    if (d.length === 11 && d[0] === '7') return d;
    return '';
  }

  function formatRuMobileFromDigits7(digits) {
    const d = String(digits || '');
    if (!(d.length === 11 && d[0] === '7')) return d ? `+${d}` : '';
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
  }

  function parseProduct(itemsJson, fallbackIndex) {
    try {
      const items = extractOrderItemsArray(itemsJson);
      if (items.length) {
        const label = String(items[0].title || items[0].name || '').trim();
        if (label) return normalizeProductName(label);
      }
    } catch {
      /* noop */
    }
    return products[fallbackIndex % products.length];
  }

  function parseUnitPrice(itemsJson) {
    try {
      const items = extractOrderItemsArray(itemsJson);
      if (items.length) {
        const unit = Number(items[0].unit_price);
        if (Number.isFinite(unit) && unit >= 0) return Math.round(unit);
      }
    } catch {
      /* noop */
    }
    return null;
  }

  function pickFirstFilled(values) {
    for (let i = 0; i < values.length; i += 1) {
      const value = String(values[i] || '').trim();
      if (value) return value;
    }
    return '';
  }

  function stripDemoNoteTags(note) {
    return String(note || '')
      .replace(/\s*§demo_(mo|op)\b/gi, '')
      .replace(/\s*§ekva_seed\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function formatCourierNote(note) {
    return stripDemoNoteTags(note);
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
      [order?.first_name, order?.last_name, order?.patronymic].filter(Boolean).join(' ').trim(),
      [order?.last_name, order?.first_name].filter(Boolean).join(' ').trim(),
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
      [fallbackUser?.first_name, fallbackUser?.last_name].filter(Boolean).join(' ').trim(),
      [fallbackUser?.last_name, fallbackUser?.first_name].filter(Boolean).join(' ').trim(),
    ]);
    return fallbackName || 'КЛИЕНТ';
  }

  /** Плейсхолдер в tbody до первого render() — иначе таблица выглядит «мертвой», пока висит fetch. */
  function renderOrdersPlaceholder(message) {
    if (!(BODY instanceof HTMLElement)) return;
    const text = String(message || '').trim() || 'Загрузка…';
    BODY.innerHTML = `<tr><td colspan="14" class="operator-empty-cell opx-orders-loading">${escapeHtml(text)}</td></tr>`;
  }

  const LOAD_ORDERS_TIMEOUT_MS = 28000;
  /** Фоновое обновление списка — статус «доставлен» от водителя без перезагрузки страницы. */
  const ORDERS_AUTO_REFRESH_MS = 10000;
  let ordersPollTimer = null;
  let ordersRefreshPaused = false;

  function findOrderInStateByKey(idKey) {
    const key = String(idKey ?? '').trim();
    if (!key) return null;
    const direct = state.orders.find((o) => String(o.id).trim() === key);
    if (direct) return direct;
    const num = extractOrderNumber(key);
    if (num > 0) {
      return state.orders.find((o) => extractOrderNumber(o.id) === num) || null;
    }
    return null;
  }

  function applyOrderRowFromServer(order, row, fallbackStatus) {
    if (row && typeof row === 'object') {
      Object.assign(order, row);
      stampOrderServerId(order);
      order.client = resolveClientName(order, null);
    } else if (fallbackStatus != null) {
      order.status = normalizeOrderStatus(fallbackStatus);
    }
    if (order.status != null) order.status = normalizeOrderStatus(order.status);
    refreshOperatorRowHighlight(order);
  }

  function ordersListSignature(orders) {
    if (!Array.isArray(orders) || !orders.length) return '';
    return orders
      .map(
        (o) =>
          `${o.id}:${String(o.status || '')}:${String(o.driver || '').trim()}:${String(o.updated_at || '')}`
      )
      .join('|');
  }

  function stopOrdersAutoRefresh() {
    if (ordersPollTimer) {
      window.clearInterval(ordersPollTimer);
      ordersPollTimer = null;
    }
  }

  function startOrdersAutoRefresh() {
    stopOrdersAutoRefresh();
    ordersPollTimer = window.setInterval(() => {
      if (document.hidden) return;
      void pollOrdersForRealtime();
    }, ORDERS_AUTO_REFRESH_MS);
  }

  function setOrdersLiveHint() {
    if (!(ORDERS_LIVE_HINT instanceof HTMLElement)) return;
    const t = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    ORDERS_LIVE_HINT.textContent = `Обновлено в ${t}.`;
  }

  async function pollOrdersForRealtime() {
    if (bulkApplyRunning || ordersRefreshPaused) return;
    const before = ordersListSignature(state.orders);
    await loadOrders();
    const after = ordersListSignature(state.orders);
    if (before === after) return;
    applyFilters();
    render();
    setOrdersLiveHint();
  }

  function emptyOrdersFallback() {
    clearOrderSearchHayCache();
    state.orders = [];
  }

  async function loadOrders() {
    if (ordersRefreshPaused) return;
    const seq = (loadOrdersSeq += 1);
    try {
      const api = window.EkvalineAPI;
      if (!api) {
        emptyOrdersFallback();
        return;
      }

      let r;
      try {
        r = await Promise.race([
          api.json('/api/orders'),
          new Promise((resolve) =>
            window.setTimeout(() => resolve({ __opxTimedOut: true }), LOAD_ORDERS_TIMEOUT_MS)
          ),
        ]);
      } catch {
        if (seq !== loadOrdersSeq) return;
        emptyOrdersFallback();
        showToast('Ошибка сети при загрузке заказов.');
        return;
      }

      if (r && r.__opxTimedOut) {
        if (seq !== loadOrdersSeq) return;
        emptyOrdersFallback();
        showToast('Сервер не ответил вовремя. Нажмите «Обновить» (⟳) или повторите позже.');
        return;
      }

      if (seq !== loadOrdersSeq) return;
      if (!r.ok) {
        emptyOrdersFallback();
        if (redirectOnUnauthorized(r.status, r.data)) return;
        if (String(r.data?.error || '').trim()) showToast(String(r.data.error).trim());
        else if (!state.orders.length) showToast('Не удалось получить заказы. Проверьте сервер или ответ не JSON.');
        return;
      }
      const rows = Array.isArray(r.data?.orders) ? r.data.orders : [];
      clearOrderSearchHayCache();
      state.orders = rows.map((o) =>
        stampOrderServerId({
          ...o,
          id: o.id != null ? o.id : o.order_id,
          status: normalizeOrderStatus(o.status),
          create_action: String(o.create_action || '').trim(),
          client: resolveClientName(o, null),
        })
      );
    } finally {
      if (seq === loadOrdersSeq) {
        await refreshOperatorDriverChoices();
        rebuildFilterSelectsFromOrders();
        setOrdersLiveHint();
      }
    }
  }

  /** Поиск в таблице: работает поверх уже выбранного дня доставки и статуса. */
  function normalizeOpSearchString(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildOrderSearchHaystack(o, orderIndexHint) {
    const cacheKey = `${String(o?.id ?? '')}:${orderIndexHint ?? ''}`;
    if (orderSearchHayCache.has(cacheKey)) return orderSearchHayCache.get(cacheKey);
    const idShown = displayOrderId(o.id);
    const idNum = extractOrderNumber(o.id);
    const idNumStr = idNum > 0 ? String(idNum) : '';
    const phoneDig = String(o.phone || '').replace(/\D/g, '');
    let productLine = '';
    try {
      productLine = String(parseProduct(o.items_json, orderIndexHint) || '');
    } catch {
      productLine = '';
    }
    const parts = [
      idShown,
      idNumStr,
      phoneDig,
      o.client || '',
      o.address || '',
      o.courier_note || '',
      o.phone || '',
      productLine,
      o.driver || '',
      o.zone || '',
    ];
    const hay = normalizeOpSearchString(parts.filter(Boolean).join(' ')).replace(/\s+/g, ' ');
    orderSearchHayCache.set(cacheKey, hay);
    return hay;
  }

  function orderMatchesOpSearchQuery(o, rawQuery, orderIndexHint) {
    const rawTrim = String(rawQuery ?? '').trim();
    const normalized = normalizeOpSearchString(rawQuery);
    if (!normalized) return true;
    const hay = buildOrderSearchHaystack(o, orderIndexHint);

    /** Только цифры (и типичное форматирование телефона) — номер заказа и телефон */
    const onlyDigitsCompact = rawTrim.replace(/\D/g, '');
    const looksDigitsOnly =
      onlyDigitsCompact.length >= 4 &&
      !/[а-яёa-z.:;_]/iu.test(rawTrim) &&
      /^[\s+\d().\-–—]+$/.test(rawTrim);
    if (looksDigitsOnly) {
      const idNumVal = extractOrderNumber(o.id);
      const idNumStr = idNumVal > 0 ? String(idNumVal) : '';
      const phoneDig = String(o.phone || '').replace(/\D/g, '');
      const rawIdLetters = normalizeOpSearchString(String(o.id ?? '')).replace(/^лс-/, '');
      return (
        (idNumStr && idNumStr.includes(onlyDigitsCompact)) ||
        (phoneDig && phoneDig.includes(onlyDigitsCompact)) ||
        hay.includes(onlyDigitsCompact) ||
        (rawIdLetters && rawIdLetters.includes(onlyDigitsCompact))
      );
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;

    /** Каждое слово запроса (например «карпова» и «3») есть в суммарном поле заказа */
    return tokens.every((tok) => {
      if (tok.length === 1) return /^\d$/.test(tok) && hay.includes(tok);
      return hay.includes(tok);
    });
  }

  /** Соответствие заказа фильтру: в обработке | подтверждён | в пути | доставлен (+ все). */
  function orderMatchesStatusFilter(order, filterValue) {
    if (!filterValue || filterValue === 'all') return true;
    const st = String(order?.status || '').trim().toLowerCase();
    const f = String(filterValue);
    if (f === 'in_processing' || f === 'new') return st === 'new' || st === 'pending_operator';
    if (f === 'confirmed') return st === 'confirmed';
    if (f === 'on_way' || f === 'work')
      return st === 'on_way' || st === 'processing' || st === 'courier';
    if (f === 'delivered') return st === 'delivered';
    if (f === 'cancelled') return st === 'cancelled';
    return st === f;
  }

  function weekdayMonday0FromDelivery(order) {
    const cal = isoDate(order.delivery_date || order.created_at);
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(cal);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return null;
    const js = d.getDay();
    return (js + 6) % 7;
  }

  function orderMatchesAdvSlot(order, slotSel) {
    const sel = String(slotSel || 'all');
    if (!sel || sel === 'all') return true;
    return deliverySlotToFilterMode(order.delivery_slot) === sel;
  }

  function districtKeyForFilter(order) {
    return normalizeZoneName(order.zone);
  }

  function orderMatchesAdvZone(order, zoneSel) {
    if (!zoneSel || zoneSel === 'all') return true;
    return normalizeZoneName(order.zone) === normalizeZoneName(zoneSel);
  }

  /** Ключ оплаты для сравнения в фильтре (cash | noncash | расчётный счёт). */
  function paymentCanonForFilter(raw) {
    const p = String(raw ?? '').trim();
    if (!p) return 'cash';
    if (orderLooksLikeSettlementInvoicePayment(p)) return PAYMENT_SETTLEMENT_INVOICE_VALUE;
    const low = p.toLowerCase().replace(/ё/g, 'е');
    if (low === 'cash' || low.includes('налич')) return 'cash';
    if (low === 'noncash' || low === 'card' || low.includes('безнал') || low.includes('карт')) return 'noncash';
    const modal = paymentRawToModalSelectValue(p);
    if (modal === PAYMENT_MODAL_NONCASH) return 'noncash';
    if (modal === PAYMENT_SETTLEMENT_INVOICE_VALUE) return PAYMENT_SETTLEMENT_INVOICE_VALUE;
    return 'cash';
  }

  function paymentLabelForFilterKey(key) {
    const k = String(key || '').trim();
    if (k === 'cash') return PAYMENT_MODAL_CASH;
    if (k === 'noncash') return PAYMENT_MODAL_NONCASH;
    if (advancedFilterSelectionMeansSettlementInvoice(k) || k === PAYMENT_SETTLEMENT_INVOICE_VALUE) {
      return PAYMENT_SETTLEMENT_INVOICE_VALUE;
    }
    return k || '—';
  }

  function paymentMethodMatchesAdv(order, filt) {
    if (!filt || filt === 'all') return true;
    const fv = String(filt).trim();
    if (advancedFilterSelectionMeansSettlementInvoice(fv)) {
      return paymentCanonForFilter(order.payment_method) === PAYMENT_SETTLEMENT_INVOICE_VALUE;
    }
    return paymentCanonForFilter(order.payment_method) === paymentCanonForFilter(fv);
  }

  function orderMatchesAdvDriver(order, driverSel) {
    if (!driverSel || driverSel === 'all') return true;
    const d = String(order.driver ?? '').trim();
    if (driverSel === '__none') return !d;
    return d === driverSel;
  }

  function orderMatchesAdvWeekday(order, wdSel) {
    if (!wdSel || wdSel === 'all') return true;
    const w = weekdayMonday0FromDelivery(order);
    if (w == null) return false;
    return String(w) === String(wdSel);
  }

  function orderMatchesAdvProductFilter(order, prodSel, orderIndexHint) {
    if (!prodSel || prodSel === 'all') return true;
    const want = normalizeProductName(prodSel);
    const items = orderItems(order);
    if (items.length) {
      return items.some((it) => normalizeProductName(it.title, it.product_id) === want);
    }
    return normalizeProductName(parseProduct(order.items_json, orderIndexHint)) === want;
  }

  function orderMatchesAdvSum(order, sumKind) {
    if (!sumKind || sumKind === 'all') return true;
    const t = Number(order.total_sum) || 0;
    if (sumKind === 'positive') return t > 0;
    if (sumKind === 'zero') return t === 0;
    return true;
  }

  function advancedFiltersActive() {
    const a = state.advanced;
    if (!a) return false;
    if (a.slot && a.slot !== 'all') return true;
    if (a.payment !== 'all') return true;
    if (a.zone !== 'all') return true;
    if (a.driver !== 'all') return true;
    if (a.weekday !== 'all') return true;
    if (a.product !== 'all') return true;
    if (a.sumKind !== 'all') return true;
    return false;
  }

  function rebuildDriverFilterSelect() {
    if (!(FILTERS_ADV_DRIVER instanceof HTMLSelectElement)) return;
    const opts = mergedDriverChoices
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('');
    FILTERS_ADV_DRIVER.innerHTML = `<option value="all">Все</option><option value="__none">Не назначен</option>${opts}`;
  }

  function rebuildModalDriverSelect() {
    if (!(MODAL_DRIVER instanceof HTMLSelectElement)) return;
    const prev = MODAL_DRIVER.value;
    const choices = operatorRegisteredDrivers;
    const opts = choices
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('');
    const emptyHint =
      choices.length === 0
        ? '<option value="" disabled>Нет водителей — создайте в админке и обновите страницу (F5)</option>'
        : '';
    MODAL_DRIVER.innerHTML = `<option value="">Не выбран</option>${emptyHint}${opts}`;
    if (prev && selectHasValue(MODAL_DRIVER, prev)) MODAL_DRIVER.value = prev;
  }

  function normalizeOperatorDriverKey(name) {
    return String(name || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('ru');
  }

  function isRegisteredOperatorDriver(name) {
    const key = normalizeOperatorDriverKey(name);
    if (!key) return true;
    return operatorRegisteredDrivers.some((d) => normalizeOperatorDriverKey(d) === key);
  }

  function rebuildUiDriverSelectsFromMerged() {
    rebuildDriverFilterSelect();
    rebuildModalDriverSelect();
  }

  function driversDistinctFromOrders() {
    const s = new Set();
    state.orders.forEach((o) => {
      const d = String(o.driver || '').trim();
      if (d) s.add(d);
    });
    return [...s];
  }

  function buildMergedDriverChoices(apiDrivers) {
    const registered = new Set();
    const list = [];
    (apiDrivers || []).forEach((d) => {
      const t = (typeof d === 'string' ? d : String(d?.label || '')).trim();
      if (!t) return;
      const key = t.toLocaleLowerCase('ru');
      if (registered.has(key)) return;
      registered.add(key);
      list.push(t);
    });
    driversDistinctFromOrders().forEach((d) => {
      const key = d.toLocaleLowerCase('ru');
      if (registered.has(key)) return;
      registered.add(key);
      list.push(d);
    });
    return list.sort((a, b) => a.localeCompare(b, 'ru'));
  }

  const DRIVER_LIST_TIMEOUT_MS = 12000;

  async function refreshOperatorDriverChoices() {
    let apiDrivers = [];
    const api = window.EkvalineAPI;
    if (api && typeof api.json === 'function') {
      try {
        const r = await Promise.race([
          api.json('/api/orders/operator/drivers'),
          new Promise((resolve) =>
            window.setTimeout(() => resolve({ __opxTimedOut: true }), DRIVER_LIST_TIMEOUT_MS)
          ),
        ]);
        if (r && !r.__opxTimedOut && r.ok && Array.isArray(r.data?.drivers)) apiDrivers = r.data.drivers;
      } catch {
        apiDrivers = [];
      }
    }
    operatorRegisteredDrivers = (apiDrivers || [])
      .map((d) => (typeof d === 'string' ? d : String(d?.label || '')).trim())
      .filter((t) => t.length >= 2)
      .sort((a, b) => a.localeCompare(b, 'ru'));
    mergedDriverChoices = buildMergedDriverChoices(apiDrivers);
    rebuildUiDriverSelectsFromMerged();
    syncAdvDriverSelectFromState();
  }

  /** Текст в пустой таблице: объясняет, где адреса и почему нет строк. */
  function operatorEmptyGridHintHtml() {
    if (!state.orders.length) {
      return 'Заказы не загружены или список пуст. Нажмите «Обновить» (⟳) или создайте заказ — адреса отображаются в колонке «Адрес» у каждой строки.';
    }
    const chunks = [];
    chunks.push(
      'Сейчас нет строк: выбраны день доставки и фильтры, под которые не попадает ни один заказ. Адреса показываются только в строках таблицы, в колонке «Адрес».'
    );
    if (state.status === 'on_way' || state.status === 'work') {
      chunks.push(
        ' Фильтр «В пути» не включает заказы «В обработке» и «Подтверждён»: выберите «Все статусы» или другой этап, либо отключите фильтр.'
      );
    } else if (String(state.status || 'all') !== 'all') {
      chunks.push(' Смягчите «Состояние заказа» или отключите фильтры.');
    }
    if (advancedFiltersActive())
      chunks.push(' Проверьте ограничения по зоне, водителю, интервалу и сумме или сбросьте фильтр.');
    return chunks.join('');
  }

  function toolbarFiltersBeyondDefaults() {
    return advancedFiltersActive() || (!!state.status && state.status !== 'all');
  }

  function syncFiltersModalTitleDom() {
    if (!(FILTERS_TITLE instanceof HTMLElement)) return;
    if (toolbarFiltersBeyondDefaults()) {
      FILTERS_TITLE.innerHTML = `Фильтр <span class="opx-filters-title-on">включён</span>`;
    } else {
      FILTERS_TITLE.textContent = 'Фильтр выключен';
    }
  }

  function refreshFiltersIndicators() {
    syncFiltersModalTitleDom();
    if (FILTERS_OPEN_BTN instanceof HTMLElement) {
      FILTERS_OPEN_BTN.classList.toggle('is-lit', toolbarFiltersBeyondDefaults());
    }
  }

  function ensureFiltersModalStaticSelects() {
    if (filtersModalStaticReady) return;

    if (FILTERS_ADV_ZONE instanceof HTMLSelectElement) {
      FILTERS_ADV_ZONE.innerHTML = `<option value="all">Все</option>${districts
        .map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`)
        .join('')}`;
    }
    if (FILTERS_ADV_WEEKDAY instanceof HTMLSelectElement) {
      FILTERS_ADV_WEEKDAY.innerHTML = `<option value="all">Все</option>${WEEKDAY_OPTS.map((o) => {
          return `<option value="${escapeHtml(o.v)}">${escapeHtml(o.label)}</option>`;
        }).join('')}`;
    }
    if (FILTERS_ADV_PRODUCT instanceof HTMLSelectElement) {
      FILTERS_ADV_PRODUCT.innerHTML = `<option value="all">Все</option>${products
        .map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
        .join('')}`;
    }
    if (FILTERS_ADV_PAYMENT instanceof HTMLSelectElement) {
      FILTERS_ADV_PAYMENT.innerHTML = `<option value="all">Все</option>${PAYMENT_FILTER_OPTS.map(
        ([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
      ).join('')}`;
    }
    filtersModalStaticReady = true;
  }

  function rebuildAdvStatusSelectFromToolbar() {
    ensureFiltersModalStaticSelects();
    if (!(FILTERS_ADV_STATUS instanceof HTMLSelectElement)) return;
    const rows = [
      ['all', 'Все статусы'],
      ['in_processing', 'В обработке'],
      ['confirmed', 'Подтверждён'],
      ['on_way', 'В пути'],
      ['delivered', 'Доставлен'],
      ['cancelled', 'Отменён'],
    ];
    FILTERS_ADV_STATUS.innerHTML = rows
      .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
      .join('');
    if (state.status === 'work') state.status = 'on_way';
    if (state.status === 'new') state.status = 'in_processing';
    const sv = String(state.status || 'all');
    if (!selectHasValue(FILTERS_ADV_STATUS, sv)) {
      FILTERS_ADV_STATUS.value = 'all';
      state.status = 'all';
    } else FILTERS_ADV_STATUS.value = sv;
  }

  function rebuildAdvZoneSelect() {
    ensureFiltersModalStaticSelects();
    if (!(FILTERS_ADV_ZONE instanceof HTMLSelectElement)) return;
    const zones = new Set(districts.map((z) => normalizeZoneName(z)));
    state.orders.forEach((o) => {
      const z = String(o.zone || '').trim();
      if (z) zones.add(normalizeZoneName(z));
    });
    const sorted = [...zones].sort((a, b) => a.localeCompare(b, 'ru'));
    FILTERS_ADV_ZONE.innerHTML = `<option value="all">Все</option>${sorted
      .map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`)
      .join('')}`;
    const zv = state.advanced.zone || 'all';
    if (zv !== 'all' && !selectHasValue(FILTERS_ADV_ZONE, zv)) {
      FILTERS_ADV_ZONE.value = 'all';
      state.advanced.zone = 'all';
    } else FILTERS_ADV_ZONE.value = zv;
  }

  function rebuildAdvPaymentSelect() {
    ensureFiltersModalStaticSelects();
    if (!(FILTERS_ADV_PAYMENT instanceof HTMLSelectElement)) return;

    const pv = state.advanced.payment || 'all';
    const canonPv = pv === 'all' ? 'all' : paymentCanonForFilter(pv);
    if (canonPv !== pv) state.advanced.payment = canonPv;
    if (canonPv !== 'all' && !selectHasValue(FILTERS_ADV_PAYMENT, canonPv)) {
      FILTERS_ADV_PAYMENT.value = 'all';
      state.advanced.payment = 'all';
    } else FILTERS_ADV_PAYMENT.value = canonPv;
  }

  function rebuildFilterSelectsFromOrders() {
    rebuildAdvPaymentSelect();
    rebuildAdvZoneSelect();
  }

  function selectHasValue(sel, wanted) {
    if (!(sel instanceof HTMLSelectElement)) return false;
    const w = String(wanted ?? '');
    return [...sel.options].some((o) => o.value === w);
  }

  function syncAdvDriverSelectFromState() {
    const v = String(state.advanced.driver || 'all');
    if (FILTERS_ADV_DRIVER instanceof HTMLSelectElement && FILTERS_ADV_DRIVER.options.length) {
      if (!selectHasValue(FILTERS_ADV_DRIVER, v)) {
        FILTERS_ADV_DRIVER.value = 'all';
        state.advanced.driver = 'all';
      } else FILTERS_ADV_DRIVER.value = v;
    }
  }

  function syncAdvSlotButtonsFromState() {
    const mode = String(state.advanced.slot || 'all');
    FILTERS_SLOT_BTNS.forEach((b) => {
      const slot = String(b.getAttribute('data-opx-adv-slot') || '');
      b.classList.toggle('is-active', slot === mode);
    });
  }

  function filtersBackdropShouldStay() {
    /** Ориентируемся только на реальное состояние DOM. Флаги вроде newOrdersInboxOpen при расхождении с модалкой
     * оставляли body.opx-modal-open и блокировали весь main.opx-shell (pointer-events: none). */
    return Boolean(
      (ORDER_MODAL instanceof HTMLElement &&
        ORDER_MODAL.classList.contains('is-open') &&
        !ORDER_MODAL.hidden) ||
        (FILTERS_MODAL instanceof HTMLElement && !FILTERS_MODAL.hidden && FILTERS_MODAL.classList.contains('is-open')) ||
        (CLIENT_CARD_MODAL instanceof HTMLElement &&
          CLIENT_CARD_MODAL.classList.contains('is-open') &&
          !CLIENT_CARD_MODAL.hidden) ||
        (CLIENT_MAP_MODAL instanceof HTMLElement &&
          CLIENT_MAP_MODAL.classList.contains('is-open') &&
          !CLIENT_MAP_MODAL.hidden) ||
        (ORDER_REASON_OVERLAY instanceof HTMLElement && !ORDER_REASON_OVERLAY.hidden) ||
        (NEW_ORDERS_MODAL instanceof HTMLElement &&
          NEW_ORDERS_MODAL.classList.contains('is-open') &&
          !NEW_ORDERS_MODAL.hidden) ||
        (CONFIRM_MODAL instanceof HTMLElement &&
          CONFIRM_MODAL.classList.contains('is-open') &&
          !CONFIRM_MODAL.hidden) ||
        (ZONE_MAP_OVERLAY instanceof HTMLElement && !ZONE_MAP_OVERLAY.hidden) ||
        (REPORTS_OVERLAY instanceof HTMLElement && !REPORTS_OVERLAY.hidden) ||
        (SETTINGS_OVERLAY instanceof HTMLElement && !SETTINGS_OVERLAY.hidden)
    );
  }

  function refreshBodyBackdropClass() {
    const block = filtersBackdropShouldStay();
    if (block) {
      document.body.classList.add('opx-modal-open');
    } else {
      document.body.classList.remove('opx-modal-open');
      const shell = document.querySelector('main.opx-shell');
      if (shell instanceof HTMLElement) {
        shell.removeAttribute('inert');
      }
    }
  }

  function syncFiltersModalUiFromState() {
    rebuildAdvStatusSelectFromToolbar();
    rebuildFilterSelectsFromOrders();
    syncAdvSlotButtonsFromState();

    if (FILTERS_ADV_STATUS instanceof HTMLSelectElement && selectHasValue(FILTERS_ADV_STATUS, state.status)) {
      FILTERS_ADV_STATUS.value = state.status || 'all';
    }
    if (FILTERS_ADV_ZONE instanceof HTMLSelectElement && selectHasValue(FILTERS_ADV_ZONE, state.advanced.zone)) {
      FILTERS_ADV_ZONE.value = state.advanced.zone || 'all';
    }
    syncAdvDriverSelectFromState();
    if (FILTERS_ADV_WEEKDAY instanceof HTMLSelectElement && selectHasValue(FILTERS_ADV_WEEKDAY, state.advanced.weekday)) {
      FILTERS_ADV_WEEKDAY.value = state.advanced.weekday || 'all';
    }
    if (FILTERS_ADV_PRODUCT instanceof HTMLSelectElement && selectHasValue(FILTERS_ADV_PRODUCT, state.advanced.product)) {
      FILTERS_ADV_PRODUCT.value = state.advanced.product || 'all';
    }
  }

  function openFiltersModal() {
    if (!(FILTERS_MODAL instanceof HTMLElement)) return;
    closeNewOrdersInboxModal();
    filtersModalOpen = true;
    FILTERS_MODAL.hidden = false;
    FILTERS_MODAL.classList.add('is-open');
    FILTERS_MODAL.setAttribute('aria-hidden', 'false');
    syncFiltersModalUiFromState();
    refreshBodyBackdropClass();
  }

  function closeFiltersModal() {
    if (!(FILTERS_MODAL instanceof HTMLElement)) return;
    filtersModalOpen = false;
    FILTERS_MODAL.classList.remove('is-open');
    FILTERS_MODAL.hidden = true;
    FILTERS_MODAL.setAttribute('aria-hidden', 'true');
    refreshBodyBackdropClass();
  }

  function disableAllAdvancedFiltersUi() {
    state.advanced = defaultAdvancedFilters();
    state.status = 'all';
    rebuildAdvStatusSelectFromToolbar();
    syncAdvDriverSelectFromState();
    syncAdvSlotButtonsFromState();
    if (filtersModalOpen) syncFiltersModalUiFromState();
    applyFilters();
    render();
    showToast('Фильтр отключён', 2400, 'success');
  }

  function applyFilters() {
    const qRaw = state.query;
    const adv = state.advanced;
    state.filtered = state.orders.filter((o, orderIndexHint) => {
      if (!orderMatchesStatusFilter(o, state.status)) return false;
      /** День «Сегодня» / календарь — по дате доставки (если её нет, по дате создания). */
      if (state.date && isoDate(o.delivery_date || o.created_at) !== state.date) return false;
      if (!orderMatchesOpSearchQuery(o, qRaw, orderIndexHint)) return false;

      if (!orderMatchesAdvSlot(o, adv.slot)) return false;
      if (!paymentMethodMatchesAdv(o, adv.payment)) return false;
      if (!orderMatchesAdvZone(o, adv.zone)) return false;
      if (!orderMatchesAdvDriver(o, adv.driver)) return false;
      if (!orderMatchesAdvWeekday(o, adv.weekday)) return false;
      if (!orderMatchesAdvProductFilter(o, adv.product, orderIndexHint)) return false;
      if (!orderMatchesAdvSum(o, adv.sumKind)) return false;

      return true;
    });
  }

  function orderCreateAction(orderLike) {
    return String(orderLike?.create_action || '').trim();
  }

  function orderIsOperatorCreated(orderLike) {
    return orderCreateAction(orderLike) === 'order_operator_create';
  }

  function incomingNewOrderSourceLabel(orderLike) {
    return orderIsOperatorCreated(orderLike) ? 'Заказ оператора' : 'Заказ от клиента';
  }

  function orderCountsAsIncomingNew(orderLike) {
    const st = normalizeOrderStatus(orderLike?.status);
    if (st === 'delivered' || st === 'cancelled') return false;
    /** Только «в обработке»; подтверждён / в пути / доставлен — не во входящих. */
    return st === 'new' || st === 'pending_operator';
  }

  /** Входящие на проверку: с сайта/кабинета и оформленные оператором (без фильтра по дню в шапке). */
  function incomingNewOrdersList() {
    return state.orders
      .filter((o) => orderCountsAsIncomingNew(o))
      .sort((a, b) => {
        const tb = new Date(b.created_at || 0).getTime();
        const ta = new Date(a.created_at || 0).getTime();
        return tb - ta;
      });
  }

  function populateNewOrdersInboxModal() {
    if (!(NEW_ORDERS_MODAL_LIST instanceof HTMLElement)) return;
    const list = incomingNewOrdersList();
    if (!list.length) {
      NEW_ORDERS_MODAL_LIST.innerHTML =
        '<p class="opx-new-inbox-empty">Сейчас нет новых заказов на проверку.</p>';
      return;
    }
    NEW_ORDERS_MODAL_LIST.innerHTML = list
      .map((o) => {
        const idKey = String(o.id).trim();
        const idShown = displayOrderId(o.id);
        const stHuman = statusLabel(String(o.status || ''));
        const client = String(o.client || '—');
        const addr = String(o.address || '—');
        const hi = state.orders.findIndex((x) => String(x.id).trim() === idKey);
        const product = parseProduct(o.items_json, hi >= 0 ? hi : 0);
        const qty = parseQty(o.items_json);
        const srcLabel = incomingNewOrderSourceLabel(o);
        return `<button type="button" class="opx-new-inbox-item" data-opx-inbox-order-id="${escapeHtml(idKey)}">
          <span class="opx-new-inbox-item-top">
            <span class="opx-new-inbox-item-id">${escapeHtml(idShown)}</span>
            <span class="opx-new-inbox-item-src">${escapeHtml(srcLabel)}</span>
            <span class="opx-new-inbox-item-st">${escapeHtml(stHuman)}</span>
          </span>
          <span class="opx-new-inbox-item-client">${escapeHtml(client)}</span>
          <span class="opx-new-inbox-item-addr">${escapeHtml(addr)}</span>
          <span class="opx-new-inbox-item-goods">${escapeHtml(product)} · ${escapeHtml(String(qty))} шт.</span>
        </button>`;
      })
      .join('');
  }

  function openNewOrdersInboxModal() {
    if (!(NEW_ORDERS_MODAL instanceof HTMLElement)) return;
    switchToOrdersView();
    closeFiltersModal();
    populateNewOrdersInboxModal();
    newOrdersInboxOpen = true;
    NEW_ORDERS_MODAL.hidden = false;
    NEW_ORDERS_MODAL.classList.add('is-open');
    NEW_ORDERS_MODAL.setAttribute('aria-hidden', 'false');
    refreshBodyBackdropClass();
    window.setTimeout(() => NEW_ORDERS_MODAL_LIST?.querySelector('.opx-new-inbox-item')?.focus(), 40);
  }

  function closeNewOrdersInboxModal() {
    if (!(NEW_ORDERS_MODAL instanceof HTMLElement)) return;
    newOrdersInboxOpen = false;
    NEW_ORDERS_MODAL.classList.remove('is-open');
    NEW_ORDERS_MODAL.hidden = true;
    NEW_ORDERS_MODAL.setAttribute('aria-hidden', 'true');
    refreshBodyBackdropClass();
  }

  function openOrderFromNewInbox(orderId) {
    const key = String(orderId || '').trim();
    if (!key) return;
    closeNewOrdersInboxModal();
    switchToOrdersView();
    if (state.status !== 'all') {
      state.status = 'all';
      rebuildAdvStatusSelectFromToolbar();
    }
    applyFilters();
    render();
    openOrderModalById(key);
  }

  function configureOrderModalClientFields(editable) {
    const ro = !editable;
    if (MODAL_CLIENT instanceof HTMLInputElement) MODAL_CLIENT.readOnly = ro;
    if (MODAL_PHONE instanceof HTMLInputElement) MODAL_PHONE.readOnly = ro;
    if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.readOnly = ro;
  }

  function renderCreateOrderJournalPlaceholder() {
    if (!(ORDER_JOURNAL_LIST instanceof HTMLElement)) return;
    ORDER_JOURNAL_LIST.innerHTML =
      '<p class="opx-cc-empty">После сохранения заказа здесь появятся записи журнала.</p>';
  }

  function fillOrderModal(order, fallbackIndex) {
    if (!order) return;
    resetOrderNotesSessionState();
    hideModalClientSuggest();
    configureOrderModalClientFields(false);
    const orderId = displayOrderId(order.id);
    const cartItems = parseOrderItemsFromJson(order.items_json);
    const dateParts = ruDateTime(order.created_at);
    const createdAt =
      typeof dateParts === 'object' ? `${dateParts.datePart} ${dateParts.timePart}` : String(dateParts || '—');
    if (ORDER_MODAL_TITLE instanceof HTMLElement) ORDER_MODAL_TITLE.textContent = `Заказ ${orderId}`;
    setModalValue(MODAL_ORDER_ID, orderId);
    const uiSt = statusForModalSelect(order.status || 'new');
    setModalValue(MODAL_STATUS, uiSt);
    if (MODAL_STATUS instanceof HTMLSelectElement) {
      MODAL_STATUS.disabled = orderIsCancelled(order);
      if (orderIsCancelled(order)) MODAL_STATUS.value = 'cancelled';
    }
    setModalValue(MODAL_CLIENT, String(order.client || '—'));
    setPhoneInputValue(MODAL_PHONE, order.phone || '');
    setModalValue(MODAL_ADDRESS, String(order.address || '—'));
    setModalValue(MODAL_ZONE, normalizeZoneName(order.zone));
    setModalValue(MODAL_DELIVERY_DATE, effectiveDeliveryDateIsoForOrder(order));
    applyModalDeliveryDateConstraints();
    updateQuickDateButtons();
    setModalSlot(String(order.delivery_slot || '09:00-14:00'), { silent: true });
    setModalValue(MODAL_PAYMENT, paymentRawToModalSelectValue(String(order.payment_method || '')));
    if (MODAL_PICKUP instanceof HTMLInputElement) MODAL_PICKUP.checked = Boolean(order.pickup);
    setOrderModalCartLines(
      cartItems.length
        ? cartItems
        : [
            {
              title: parseProduct(order.items_json, fallbackIndex),
              qty: Math.max(1, parseQty(order.items_json) || 1),
              unit_price:
                parseUnitPrice(order.items_json) ??
                getDefaultPriceForOrder(order, parseProduct(order.items_json, fallbackIndex)),
            },
          ],
      order
    );
    setModalValue(MODAL_DRIVER, String(order.driver || ''));
    if (
      MODAL_DRIVER instanceof HTMLSelectElement &&
      String(order.driver || '').trim() &&
      !selectHasValue(MODAL_DRIVER, String(order.driver || '').trim())
    ) {
      MODAL_DRIVER.value = '';
    }
    setModalValue(MODAL_NOTE, formatCourierNote(order.courier_note));
    updateGoodsSumPreview();
    setOrderModalTab(state.orderModalTab || 'basic');
    refreshOrderNotesPreviews();
    syncOrderModalCommitButtonsVisibility();
  }


  function closeOrderReasonOverlay() {
    orderReasonOverlayIntent = null;
    if (ORDER_REASON_OVERLAY instanceof HTMLElement) {
      ORDER_REASON_OVERLAY.hidden = true;
      ORDER_REASON_OVERLAY.setAttribute('aria-hidden', 'true');
    }
    refreshBodyBackdropClass();
  }

  /** Сравнение даты и интервала из полей модалки с сохранённым заказом (для «Перенести»). */
  function readOrderModalDeliveryCompare() {
    const order = getActiveOrder();
    if (!order) return { ok: false, rescheduleOrSlot: false };
    const deliveryDate = String(MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '').trim();
    let slot = normalizeDeliverySlotStored(
      String(MODAL_SLOT instanceof HTMLInputElement ? MODAL_SLOT.value : '').trim()
    );
    if (MODAL_SLOT instanceof HTMLInputElement) MODAL_SLOT.value = slot;
    if (!deliveryDate || !slot) return { ok: false, rescheduleOrSlot: false };
    const rescheduleOrSlot = orderDeliveryRescheduleChanged(order, deliveryDate, slot);
    return { ok: true, rescheduleOrSlot, deliveryIso: isoDate(deliveryDate), prevIso: isoDate(order.delivery_date) };
  }

  function openOrderReasonOverlay(intent) {
    if (!(ORDER_REASON_OVERLAY instanceof HTMLElement)) return;
    orderReasonOverlayIntent = intent;
    const hint = ORDER_REASON_HINT;
    const lbl = ORDER_REASON_SPAN_LABEL;
    const ta = ORDER_REASON_TEXT;
    if (intent === 'cancel') {
      if (ORDER_REASON_TITLE instanceof HTMLElement) ORDER_REASON_TITLE.textContent = 'Отмена заказа';
      if (hint instanceof HTMLElement) {
        hint.textContent = 'Заказ будет переведён в статус «Отменён». Укажите причину (не менее 3 символов).';
      }
      if (lbl instanceof HTMLElement) lbl.textContent = 'Причина отмены';
      if (ta instanceof HTMLTextAreaElement) {
        ta.placeholder = 'Для журнала и отчётов оператора';
      }
    } else if (intent === 'delete') {
      if (ORDER_REASON_TITLE instanceof HTMLElement) ORDER_REASON_TITLE.textContent = 'Удаление заказа';
      if (hint instanceof HTMLElement) {
        hint.textContent =
          'Заказ будет удалён из базы безвозвратно (исчезнет из списка и отчётов). Укажите причину (не менее 3 символов).';
      }
      if (lbl instanceof HTMLElement) lbl.textContent = 'Причина удаления';
      if (ta instanceof HTMLTextAreaElement) {
        ta.placeholder = 'Например: дубликат, тестовый заказ, ошибка оператора…';
      }
    } else {
      if (ORDER_REASON_TITLE instanceof HTMLElement) ORDER_REASON_TITLE.textContent = 'Перенос доставки';
      if (hint instanceof HTMLElement) {
        hint.textContent =
          'Укажите причину изменения даты или интервала. Сохранится вся карточка как сейчас в форме.';
      }
      if (lbl instanceof HTMLElement) lbl.textContent = 'Причина переноса';
      if (ta instanceof HTMLTextAreaElement) {
        ta.placeholder = 'Например: просьба клиента, нет машины на исходную дату…';
      }
    }
    if (ta instanceof HTMLTextAreaElement) ta.value = '';
    ORDER_REASON_OVERLAY.hidden = false;
    ORDER_REASON_OVERLAY.setAttribute('aria-hidden', 'false');
    refreshBodyBackdropClass();
    window.setTimeout(() => ta instanceof HTMLTextAreaElement && ta.focus(), 30);
  }

  /** «Перенести», «Отменить» и «Удалить» не показываем в режиме создания нового заказа. */
  function syncOrderModalCommitButtonsVisibility() {
    const modalOpen = ORDER_MODAL instanceof HTMLElement && ORDER_MODAL.classList.contains('is-open');
    const showDanger = modalOpen && !state.creatingOrder;
    if (MODAL_RESCHEDULE_BTN instanceof HTMLElement) MODAL_RESCHEDULE_BTN.hidden = !showDanger;
    if (MODAL_CANCEL_ORDER_BTN instanceof HTMLElement) MODAL_CANCEL_ORDER_BTN.hidden = !showDanger;
    if (MODAL_DELETE_ORDER_BTN instanceof HTMLElement) MODAL_DELETE_ORDER_BTN.hidden = !showDanger;
  }

  async function deleteOrderFromModal(reason) {
    if (state.creatingOrder || orderModalSaveBusy) return;
    const order = getActiveOrder();
    if (!order) {
      showToast('Заказ не найден в списке — обновите таблицу');
      return;
    }
    const orderLabel = displayOrderId(order.id);
    const restId = orderRestIdForApi(order);
    const key = String(order.id).trim();
    orderModalSaveBusy = true;
    setOrderModalSaveBusy(true, 'Удаление…');
    try {
      if (restId) {
        const api = window.EkvalineAPI;
        if (!api?.json) {
          showToast('Удаление недоступно — обновите страницу', 3600, 'error');
          return;
        }
        const response = await api.json(`/api/orders/${encodeURIComponent(restId)}`, {
          method: 'DELETE',
          body: { reason },
        });
        if (!response.ok) {
          showToast(String(response.data?.error || 'Не удалось удалить заказ'), 4200, 'error');
          return;
        }
        api.resetCsrf?.();
      }
      state.orders = state.orders.filter((o) => String(o.id).trim() !== key);
      state.filtered = state.filtered.filter((o) => String(o.id).trim() !== key);
      if (String(state.activeOrderId || '').trim() === key) state.activeOrderId = '';
      closeOrderModal();
      operatorOrdersTableRefresh();
      notifyOrdersChanged();
      if (state.reportsOpen) void renderReports();
      showToast(`Заказ ${orderLabel} удалён`, 3800, 'success');
    } catch (err) {
      console.error('[operator] deleteOrderFromModal:', err);
      showToast('Не удалось удалить заказ. Проверьте связь с сервером.', 4200, 'error');
    } finally {
      orderModalSaveBusy = false;
      setOrderModalSaveBusy(false);
    }
  }

  async function saveOrderModalChanges(opts = {}) {
    const injectedReason = opts && Object.prototype.hasOwnProperty.call(opts, 'injectedReason') ? opts.injectedReason : undefined;
    const forceCancelled = Boolean(opts && opts.forceCancelled);
    if (state.creatingOrder) {
      if (orderModalCreateBusy) return;
      orderModalCreateBusy = true;
      setOrderModalSaveBusy(true, 'Создание заказа…');
      try {
        await saveNewOperatorOrder();
      } catch (e) {
        console.error(e);
        showToast(e && typeof e.message === 'string' && String(e.message).trim() ? e.message.trim() : 'Не удалось создать заказ');
      } finally {
        orderModalCreateBusy = false;
        if (!orderModalSaveBusy) setOrderModalSaveBusy(false);
      }
      return;
    }
    if (orderModalSaveBusy) return;
    const order = getActiveOrder();
    if (!order) {
      showToast('Заказ не найден в списке — обновите страницу или откройте заказ снова');
      return;
    }
    const prevDate = order.delivery_date;
    const prevStatus = String(order.status || '');
    const prevSlot = order.delivery_slot;
    const prevPayment = order.payment_method;
    const prevZone = order.zone;
    const prevPickup = Boolean(order.pickup);
    const prevDriver = order.driver;
    const prevTotal = Number(order.total_sum) || 0;
    const prevNote = order.courier_note;
    const prevItemsJson = String(order.items_json || '');
    const zone = String(MODAL_ZONE instanceof HTMLSelectElement ? MODAL_ZONE.value : '').trim();
    const deliveryDate = String(MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '').trim();
    const slot = normalizeDeliverySlotStored(
      String(MODAL_SLOT instanceof HTMLInputElement ? MODAL_SLOT.value : '').trim()
    );
    if (MODAL_SLOT instanceof HTMLInputElement) MODAL_SLOT.value = slot;
    let payment = paymentRawToModalSelectValue(
      String(MODAL_PAYMENT instanceof HTMLSelectElement ? MODAL_PAYMENT.value : '')
    );
    if (MODAL_PAYMENT instanceof HTMLSelectElement) MODAL_PAYMENT.value = payment;
    const pickup = readModalPickupForSave(order);
    const driver = String(MODAL_DRIVER instanceof HTMLSelectElement ? MODAL_DRIVER.value : '').trim();
    if (driver && !isRegisteredOperatorDriver(driver)) {
      showToast(
        'Выбранный водитель не найден в системе. Обновите страницу (F5) или выберите имя из списка.',
        4800,
        'error'
      );
      void refreshOperatorDriverChoices();
      return;
    }
    const note = String(MODAL_NOTE instanceof HTMLTextAreaElement ? MODAL_NOTE.value : '').trim();
    let statusUi = String(
      MODAL_STATUS instanceof HTMLSelectElement ? MODAL_STATUS.value || order.status : order.status
    );
    let status = forceCancelled ? 'cancelled' : operatorDbStatusFromUi(statusUi, order.status);
    const cartLines = readOrderModalCartFromDom();
    if (!deliveryDate || !slot || !payment || !zone) {
      showToast('Заполните дату доставки, интервал и форму оплаты');
      return;
    }
    if (!operatorDeliveryDateValid(deliveryDate)) {
      showToast('Укажите дату доставки в формате ГГГГ-ММ-ДД', 3200, 'error');
      return;
    }
    const itemsJson = buildOrderItemsJson(cartLines);
    const goodsTotal = computeOrderCartTotal(cartLines);
    const rescheduleOrSlot = orderDeliveryRescheduleChanged(order, deliveryDate, slot);
    const prevSlotNorm = normalizeDeliverySlotStored(String(prevSlot ?? ''));
    const prevStatusNorm = String(prevStatus || '').trim().toLowerCase();
    const toCancelled =
      String(status || '').trim().toLowerCase() === 'cancelled' && prevStatusNorm !== 'cancelled';
    let changeReasonOp = '';
    const needsReasonBecause = toCancelled || rescheduleOrSlot;
    if (needsReasonBecause) {
      if (injectedReason !== undefined) {
        changeReasonOp = String(injectedReason ?? '').trim();
      } else if (toCancelled) {
        changeReasonOp = 'Отмена оператором';
      } else if (rescheduleOrSlot) {
        changeReasonOp = 'Изменение даты или интервала оператором';
      }
      if (changeReasonOp.length < 3) changeReasonOp = 'Изменение оператором';
      const reasonCheck = opxLimits()?.validateChangeReason?.(changeReasonOp, false);
      if (reasonCheck && !reasonCheck.ok) {
        showToast(reasonCheck.message, 3200, 'error');
        return;
      }
      if (reasonCheck?.value) changeReasonOp = reasonCheck.value;
    }

    const patchCheck = opxLimits()?.validateOperatorOrderPatch?.({
      note,
      cartLines,
      itemsJson,
      changeReason: changeReasonOp,
      requireReason: false,
    });
    if (patchCheck && !patchCheck.ok) {
      showToast(patchCheck.message, 3200, 'error');
      return;
    }
    const noteToSave = patchCheck?.note ?? note;

    orderModalSaveBusy = true;
    setOrderModalSaveBusy(true, 'Сохранение…');
    try {
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
        courier_note: noteToSave,
        change_reason: changeReasonOp,
      };

      let serverSaved = false;
      let serverOrder = null;
      const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
      const serverPersisted = orderIsServerPersisted(order);
      const restOrderId = serverPersisted ? orderRestIdForApi(order) : '';
      const orderLabel = displayOrderId(order.id);
      if (api && restOrderId && /^\d+$/.test(restOrderId)) {
        try {
          const response = await api.json(`/api/orders/${encodeURIComponent(restOrderId)}`, {
            method: 'PATCH',
            body: payload,
          });
          if (response.ok) {
            serverSaved = true;
            serverOrder =
              response.data?.order && typeof response.data.order === 'object'
                ? stampOrderServerId(response.data.order)
                : null;
            api.resetCsrf?.();
          } else {
            const st = Number(response.status || 0);
            const errTxt = typeof response?.data?.error === 'string' ? response.data.error.trim() : '';
            /** Не подменяем данные локально, если сервер явно отклонил запрос */
            if (st === 401) {
              redirectOnUnauthorized(st, response?.data);
              return;
            }
            if (st === 403 || st === 422 || st === 404 || st === 400) {
              showToast(
                st === 404
                  ? `Заказ ${orderLabel} не найден на сервере — нажмите «Обновить» в таблице.`
                  : errTxt || 'Не удалось сохранить заказ на сервере.'
              );
              return;
            }
          }
        } catch {
          showToast('Ошибка сети при сохранении заказа.', 3600, 'error');
          return;
        }
      } else if (serverPersisted && restOrderId && /^\d+$/.test(restOrderId)) {
        showToast('Нет связи с сервером. Обновите страницу и повторите.', 3600, 'error');
        return;
      }

      const mustPersistOnServer = Boolean(api && serverPersisted && restOrderId && /^\d+$/.test(restOrderId));
      if (mustPersistOnServer && !serverSaved) {
        showToast('Изменения не сохранены в базе. Обновите страницу и повторите.', 3600, 'error');
        return;
      }

      order.zone = zone;
      order.status = normalizeOrderStatus(serverOrder?.status != null ? serverOrder.status : status);
      refreshOperatorRowHighlight(order);
      order.delivery_date = deliveryDate;
      order.delivery_slot = slot;
      order.payment_method = payment;
      order.pickup = pickup;
      order.driver =
        serverOrder?.driver != null && String(serverOrder.driver).trim()
          ? String(serverOrder.driver).trim()
          : driver;
      order.items_json = itemsJson;
      order.total_sum = nextTotal;
      order.courier_note = noteToSave;
      const changes = [];
      const statusCh = journalFieldChange('статус', prevStatus, order.status, (s) => statusLabel(s));
      if (statusCh && !toCancelled) changes.push(statusCh);
      const zoneCh = journalFieldChange('зона', prevZone, order.zone);
      if (zoneCh) changes.push(zoneCh);
      const dateCh = journalFieldChange('дата доставки', prevDate, order.delivery_date, (d) => ruDate(d));
      if (dateCh) changes.push(dateCh);
      const slotCh = journalFieldChange('интервал', prevSlotNorm, slot, slotLabelDisplay);
      if (slotCh) changes.push(slotCh);
      const payCh = journalFieldChange('оплата', prevPayment, order.payment_method, paymentLabelDisplay);
      if (payCh) changes.push(payCh);
      if (prevPickup !== Boolean(order.pickup)) changes.push(`самовывоз: ${order.pickup ? 'да' : 'нет'}`);
      const driverCh = journalFieldChange('водитель', prevDriver, order.driver);
      if (driverCh) changes.push(driverCh);
      const itemsChange = describeOrderItemsChange(prevItemsJson, itemsJson);
      if (itemsChange) changes.push(itemsChange);
      else if (prevTotal !== (Number(order.total_sum) || 0)) {
        changes.push(`сумма: ${money(prevTotal)} → ${money(order.total_sum)}`);
      }
      if (prevNote !== order.courier_note) changes.push('примечание изменено');
      if (toCancelled) {
        const extra = changes.length ? ` (${changes.join('; ')})` : '';
        appendOrderJournal(order.id, `Заказ отменён. Причина: ${changeReasonOp}${extra}`);
      } else if (changes.length) {
        const suffix = changeReasonOp && rescheduleOrSlot ? ` · причина: ${changeReasonOp}` : '';
        appendOrderJournal(order.id, `Изменены поля заказа (${changes.join('; ')}${suffix})`);
      } else if (itemsChange) {
        appendOrderJournal(order.id, itemsChange);
      }
      const nid = Number(restOrderId);
      if (!serverSaved && (toCancelled || rescheduleOrSlot) && Number.isFinite(nid) && nid > 0) {
        pushLocalAuditEvent({
          created_at: new Date().toISOString(),
          order_id: nid,
          action: toCancelled ? 'order_status_cancelled' : 'order_reschedule',
          reason: changeReasonOp,
          actor_name: getOperatorActorLabel(),
          actor_role: 'operator',
          detail: JSON.stringify({ localOnly: true }),
        });
      }
      const notesSaved = tryFinalizeOrderNotesOnSave();
      operatorOrdersTableRefresh();
      const savedOrderId = String(order.id ?? '').trim();
      const savedSuffix = serverSaved ? '' : ' (локально)';
      const showSavedFeedback = () => {
        if (toCancelled) {
          showOrderSavedToast(savedOrderId, {
            prefix: serverSaved ? 'Заказ отменён' : 'Заказ отменён (локально)',
          });
        } else if (rescheduleOrSlot && changeReasonOp) {
          showOrderSavedToast(savedOrderId, {
            prefix: serverSaved ? 'Перенос сохранён' : 'Перенос сохранён (локально)',
          });
        } else if (notesSaved) {
          showOrderSavedToast(savedOrderId, {
            prefix: `Заказ и заметки сохранены${savedSuffix}`,
          });
        } else {
          showOrderSavedToast(savedOrderId, { localOnly: !serverSaved });
        }
      };
      const returnToMap = Boolean(state.orderModalFromMap && state.zoneMapOpen);
      if (returnToMap) {
        state.orderModalFromMap = false;
        closeOrderModal();
        renderZoneMapMarkers();
        window.setTimeout(() => {
          showSavedFeedback();
          focusZoneMapOrder(savedOrderId);
        }, 120);
        if (serverSaved) notifyOrdersChanged();
        return;
      }
      closeOrderModal();
      window.requestAnimationFrame(() => showSavedFeedback());
      if (serverSaved) notifyOrdersChanged();
    } finally {
      orderModalSaveBusy = false;
      setOrderModalSaveBusy(false);
    }
  }

  function openOrderFromReports(orderId) {
    const key = resolveOrderStateId(orderId);
    if (!key) return;
    if (!state.orders.some((o) => String(o.id).trim() === key)) {
      showToast('Заказ не найден в списке. Откройте «Заказы» и нажмите «Обновить» (⟳).', 3600, 'info');
      return;
    }
    openOrderModalById(key, { fromReports: true });
  }

  function openOrderModalById(orderId, opts) {
    if (!(ORDER_MODAL instanceof HTMLElement)) return;
    setOrderModalSaveBusy(false);
    closeNewOrdersInboxModal();
    closeFiltersModal();
    const key = resolveOrderStateId(orderId);
    const order = state.orders.find((o) => String(o.id).trim() === key);
    if (!order) {
      showToast('Заказ не найден в списке');
      return;
    }

    state.orderModalFromMap = Boolean(opts && opts.fromMap);
    const overReports = Boolean(opts && opts.fromReports && state.reportsOpen);
    ORDER_MODAL.classList.toggle('is-over-reports', overReports);

    const modalAlreadyOpen =
      ORDER_MODAL.classList.contains('is-open') && !ORDER_MODAL.hidden;
    const prevKey = state.activeOrderId ? String(state.activeOrderId).trim() : '';
    if (
      modalAlreadyOpen &&
      (state.creatingOrder || (prevKey !== '' && prevKey !== key))
    ) {
      tryFinalizeOrderNotesOnSave();
    }

    state.creatingOrder = false;
    state.activeOrderId = key;
    const index = Math.max(0, state.filtered.findIndex((o) => String(o.id).trim() === key));
    state.activeOrderIndex = index;
    if (!getOrderJournal(order.id).length) {
      const dt = ruDateTime(order.created_at);
      appendOrderJournal(
        order.id,
        `Создан заказ (${ruDate(order.created_at)} ${typeof dt === 'object' ? dt.timePart : ''})`.trim()
      );
    }
    ORDER_MODAL.classList.add('is-open');
    ORDER_MODAL.hidden = false;
    ORDER_MODAL.setAttribute('aria-hidden', 'false');
    refreshBodyBackdropClass();
    fillOrderModal(order, index);
    renderOrderJournal(order);
    scheduleOrderModalPanelsHeightSync();
    void refreshOperatorDriverChoices().then(() => {
      if (!(MODAL_DRIVER instanceof HTMLSelectElement)) return;
      const saved = String(order.driver || '').trim();
      if (!saved) return;
      if (selectHasValue(MODAL_DRIVER, saved)) MODAL_DRIVER.value = saved;
      else {
        MODAL_DRIVER.value = '';
        showToast(
          `Водитель «${saved}» не найден в системе. Выберите имя из списка или обновите страницу (F5).`,
          4500,
          'info'
        );
      }
    });
    void loadBookingAvailabilityFromServer().then(() => syncModalSlotAvailability());
  }

  function openCreateOrderModal() {
    if (!(ORDER_MODAL instanceof HTMLElement)) return;
    state.orderModalFromMap = false;
    closeNewOrdersInboxModal();
    closeFiltersModal();
    hideModalClientSuggest();
    resetOrderNotesSessionState();
    orderModalSaveBusy = false;
    orderModalCreateBusy = false;
    setOrderModalSaveBusy(false);
    state.creatingOrder = true;
    state.activeOrderId = '';
    state.activeOrderIndex = -1;
    ensureProductOptions();
    configureOrderModalClientFields(true);
    if (ORDER_MODAL_TITLE instanceof HTMLElement) ORDER_MODAL_TITLE.textContent = 'Новый заказ';
    setModalValue(MODAL_ORDER_ID, '');
    setModalValue(MODAL_STATUS, 'in_processing');
    resetCreateOrderFormFields();
    setOrderModalTab('basic');
    ORDER_MODAL.classList.add('is-open');
    ORDER_MODAL.hidden = false;
    ORDER_MODAL.setAttribute('aria-hidden', 'false');
    refreshBodyBackdropClass();
    syncOrderModalCommitButtonsVisibility();
    window.requestAnimationFrame(() => {
      refreshOrderNotesPreviews();
      MODAL_CLIENT?.focus();
      scheduleOrderModalPanelsHeightSync();
      void loadBookingAvailabilityFromServer().then(() => syncModalSlotAvailability());
    });
  }

  async function saveNewOperatorOrder() {
    const client = normalizeAddressPart(MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value : '').trim();
    const phoneDig = normalizePhoneRuDigits(MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : '');
    const address = String(MODAL_ADDRESS instanceof HTMLInputElement ? MODAL_ADDRESS.value : '').trim();
    const noteDraft = String(MODAL_NOTE instanceof HTMLTextAreaElement ? MODAL_NOTE.value : '').trim();
    const cartLinesDraft = readOrderModalCartFromDom();
    const fieldCheck = opxLimits()?.validateOperatorOrderCreate?.({
      client,
      phoneDigits: phoneDig,
      address,
      note: noteDraft,
      cartLines: cartLinesDraft,
    });
    if (fieldCheck && !fieldCheck.ok) {
      showToast(fieldCheck.message, 3200, 'error');
      return;
    }
    const zone = String(MODAL_ZONE instanceof HTMLSelectElement ? MODAL_ZONE.value : '').trim();
    const deliveryDate = String(MODAL_DELIVERY_DATE instanceof HTMLInputElement ? MODAL_DELIVERY_DATE.value : '').trim();
    const slot = normalizeDeliverySlotStored(
      String(MODAL_SLOT instanceof HTMLInputElement ? MODAL_SLOT.value : '').trim()
    );
    if (MODAL_SLOT instanceof HTMLInputElement) MODAL_SLOT.value = slot;
    let payment = paymentRawToModalSelectValue(
      String(MODAL_PAYMENT instanceof HTMLSelectElement ? MODAL_PAYMENT.value : '')
    );
    if (MODAL_PAYMENT instanceof HTMLSelectElement) MODAL_PAYMENT.value = payment;
    const driver = String(MODAL_DRIVER instanceof HTMLSelectElement ? MODAL_DRIVER.value : '').trim();
    if (driver && !isRegisteredOperatorDriver(driver)) {
      showToast(
        'Выбранный водитель не найден в системе. Обновите страницу (F5) или выберите имя из списка.',
        4800,
        'error'
      );
      void refreshOperatorDriverChoices();
      return;
    }
    const note = fieldCheck?.note ?? String(MODAL_NOTE instanceof HTMLTextAreaElement ? MODAL_NOTE.value : '').trim();
    const cartLines = prepareOperatorCartLinesForApi(cartLinesDraft);
    if (!cartLines.length) {
      showToast('Добавьте хотя бы один товар на вкладке «Товары».', 3600, 'error');
      setOrderModalTab('goods');
      return;
    }
    if (!deliveryDate || !slot || !payment || !zone) {
      showToast('Заполните дату доставки, интервал и оплату');
      return;
    }
    if (!operatorDeliveryDateValid(deliveryDate)) {
      showToast('Укажите дату доставки в формате ГГГГ-ММ-ДД', 3200, 'error');
      return;
    }
    const total = computeOrderCartTotal(cartLines);
    const itemsJson = buildOrderItemsJson(cartLines);
    const firstLine = cartLines[0];
    const goodsTitle = firstLine.title;
    const goodsQty = firstLine.qty;
    const goodsUnit = firstLine.unit_price;
    const nowIso = new Date().toISOString();
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    if (!api) {
      showToast('Нет связи с сервером. Обновите страницу.', 3600, 'error');
      return;
    }
    let newIdStr = '';

    try {
        const response = await api.json('/api/orders/operator', {
          method: 'POST',
          body: {
            customer_name: client,
            customer_phone: phoneDig,
            address,
            delivery_date: deliveryDate,
            delivery_slot: slot,
            payment_method: payment,
            zone,
            driver,
            courier_note: note,
            pickup: 0,
            product_title: goodsTitle,
            qty: goodsQty,
            unit_price: goodsUnit,
            items: cartLines,
          },
        });
        if (!response.ok) {
          if (redirectOnUnauthorized(response.status, response.data)) return;
          const errTxt = typeof response.data?.error === 'string' ? response.data.error.trim() : '';
          if (/каталог/i.test(errTxt)) {
            showToast(`${errTxt}. Откройте вкладку «Товары» и выберите позицию из каталога.`, 4800, 'error');
            setOrderModalTab('goods');
          } else {
            showToast(errTxt || 'Не удалось сохранить заказ на сервере', 3600, 'error');
          }
          return;
        }
        api.resetCsrf?.();
        notifyOrdersChanged();
        const created = response.data?.order;
        newIdStr = created != null && created.id != null ? String(created.id) : '';
        const formSnapshot = {
          client,
          phone: phoneDig,
          address,
          zone,
          driver,
          delivery_date: deliveryDate,
          delivery_slot: slot,
          payment_method: payment,
          courier_note: note,
          items_json: itemsJson,
          total_sum: total,
        };
        if (!newIdStr) {
          showToast('Сервер не вернул id заказа — список будет обновлён.');
        } else {
          const row = enrichCreatedOperatorOrderRow(created, formSnapshot);
          const ix = state.orders.findIndex((o) => String(o.id).trim() === newIdStr);
          if (ix >= 0) state.orders[ix] = row;
          else state.orders = [row, ...state.orders];
        }
        /** Не ждём полный GET /api/orders здесь: долгий запрос или 401 «ломали» кнопку и карточку после успешного POST. */
        void loadOrders().catch(() => {});
        if (!newIdStr) {
          await loadOrders();
          newIdStr =
            created != null && created.id != null ? String(created.id) : String(response.data?.order?.id ?? '');
        }
        if (!newIdStr) {
          showToast('Заказ мог быть создан — нажмите «Обновить» (⟳) в таблице.');
          state.creatingOrder = false;
          closeOrderModal();
          applyFilters();
          render();
          return;
        }
        /** Убедиться что строка в state после возможного асинхронного loadOrders */
        if (!state.orders.some((o) => String(o.id).trim() === newIdStr)) {
          if (created && created.id != null) {
            const row = enrichCreatedOperatorOrderRow(created, formSnapshot);
            state.orders = [row, ...state.orders];
          }
        }
    } catch {
      showToast('Ошибка сети при создании заказа');
      return;
    }

    if (newIdStr) {
      appendOrderJournal(newIdStr, `Заказ оформлен оператором по звонку (тел. ${phoneDig})`);
      if (state.mapSelectedCoords) {
        rememberZoneAddressCoords(
          address,
          state.mapSelectedCoords.lat,
          state.mapSelectedCoords.lon,
          newIdStr
        );
      }
    }
    const createdRow = newIdStr
      ? state.orders.find((r) => String(r.id).trim() === String(newIdStr).trim())
      : null;
    if (createdRow && !orderMatchesStatusFilter(createdRow, state.status)) {
      state.status = 'all';
      rebuildAdvStatusSelectFromToolbar();
      if (filtersModalOpen) syncFiltersModalUiFromState();
    }
    focusOperatorListOnSavedOrder(deliveryDate, newIdStr);
    if (newIdStr) {
      const saved = state.orders.find((r) => String(r.id).trim() === String(newIdStr));
      if (saved) migrateOperatorDraftNotes(saved);
      tryFinalizeOrderNotesOnSave();
    }
    closeOrderModal();
    showOrderSavedToast(newIdStr, { prefix: 'Заказ создан' });
  }

  function closeOrderModal() {
    if (!(ORDER_MODAL instanceof HTMLElement)) return;
    hideOrderCartCatalogPicker();
    state.orderModalFromMap = false;
    ORDER_MODAL.classList.remove('is-over-reports');
    tryFinalizeOrderNotesOnSave();
    resetOrderNotesSessionState();
    closeOrderReasonOverlay();
    ORDER_MODAL.classList.remove('is-open');
    ORDER_MODAL.hidden = true;
    ORDER_MODAL.setAttribute('aria-hidden', 'true');
    state.creatingOrder = false;
    hideModalClientSuggest();
    refreshBodyBackdropClass();
    refreshOrderNotesDock();
  }

  function getActiveOrder() {
    if (!state.activeOrderId) return null;
    return state.orders.find((o) => String(o.id).trim() === state.activeOrderId) || null;
  }

  function openClientCardModal() {
    if (!(CLIENT_CARD_MODAL instanceof HTMLElement)) return;
    if (state.creatingOrder) {
      const nameDraft = MODAL_CLIENT instanceof HTMLInputElement ? MODAL_CLIENT.value : '';
      const phoneDraft = MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : '';
      const addrDraft = MODAL_ADDRESS instanceof HTMLInputElement ? MODAL_ADDRESS.value : '';
      setModalValue(CLIENT_NAME_INPUT, nameDraft);
      setPhoneInputValue(CLIENT_PHONE_INPUT, phoneDraft);
      setModalValue(CLIENT_ADDRESS_INPUT, addrDraft);
      if (CLIENT_ORDERS_HISTORY instanceof HTMLElement) {
        CLIENT_ORDERS_HISTORY.innerHTML = '<p class="opx-cc-empty">Клиент сохранится вместе с заказом.</p>';
      }
      if (CLIENT_JOURNAL_LIST instanceof HTMLElement) {
        CLIENT_JOURNAL_LIST.innerHTML =
          '<p class="opx-cc-empty">После сохранения заказа здесь появятся даты оформления заказов клиента.</p>';
      }
      if (CLIENT_PRICE_MODE instanceof HTMLSelectElement) CLIENT_PRICE_MODE.value = 'none';
      if (CLIENT_PRICE_VALUE instanceof HTMLInputElement) CLIENT_PRICE_VALUE.value = '';
      if (CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement) CLIENT_PRICE_PRODUCT.value = products[0] || 'Вода';
      const pk = normalizeProductName(String(CLIENT_PRICE_PRODUCT instanceof HTMLSelectElement ? CLIENT_PRICE_PRODUCT.value : ''));
      if (CLIENT_PRICE_PRODUCT_VALUE instanceof HTMLInputElement)
        CLIENT_PRICE_PRODUCT_VALUE.value = String(PRODUCT_PRICE_MAP[pk] || 0);
      if (CLIENT_PRICE_ITEMS instanceof HTMLElement) CLIENT_PRICE_ITEMS.innerHTML = '';
      setClientCardTab(state.clientCardTab || 'client');
      CLIENT_CARD_MODAL.classList.add('is-open');
      CLIENT_CARD_MODAL.hidden = false;
      CLIENT_CARD_MODAL.setAttribute('aria-hidden', 'false');
      refreshBodyBackdropClass();
      return;
    }
    const order = getActiveOrder();
    if (!order) return;
    setModalValue(CLIENT_NAME_INPUT, String(order.client || ''));
    setPhoneInputValue(CLIENT_PHONE_INPUT, String(order.phone || ''));
    setModalValue(CLIENT_ADDRESS_INPUT, String(order.address || ''));
    renderClientOrdersHistory(order);
    renderClientJournal(order);
    fillClientPrice(order);
    setClientCardTab(state.clientCardTab || 'client');
    CLIENT_CARD_MODAL.classList.add('is-open');
    CLIENT_CARD_MODAL.hidden = false;
    CLIENT_CARD_MODAL.setAttribute('aria-hidden', 'false');
    refreshBodyBackdropClass();
  }

  function closeClientCardModal() {
    if (!(CLIENT_CARD_MODAL instanceof HTMLElement)) return;
    CLIENT_CARD_MODAL.classList.remove('is-open');
    CLIENT_CARD_MODAL.hidden = true;
    CLIENT_CARD_MODAL.setAttribute('aria-hidden', 'true');
    refreshBodyBackdropClass();
  }

  function setClientCardTab(tabId) {
    state.clientCardTab = tabId;
    CLIENT_CARD_TAB_BTNS.forEach((btn) => {
      const active = btn.getAttribute('data-opx-cc-tab') === tabId;
      btn.classList.toggle('is-active', active);
    });
    CLIENT_CARD_PANELS.forEach((panel) => {
      const panelId = panel.getAttribute('data-opx-cc-panel');
      panel.hidden = panelId !== tabId;
    });
    if (tabId === 'journal' && !state.creatingOrder) {
      const order = getActiveOrder();
      if (order) void renderClientJournal(order);
    }
  }

  function clientOrdersForKey(order) {
    const key = normalizeClientKey(order);
    if (!key) return [];
    return state.orders
      .filter((o) => normalizeClientKey(o) === key)
      .sort((a, b) => {
        const tb = new Date(b.created_at || b.delivery_date || 0).getTime();
        const ta = new Date(a.created_at || a.delivery_date || 0).getTime();
        return tb - ta;
      });
  }

  function formatClientJournalDateTime(raw) {
    const dt = ruDateTime(raw);
    if (dt && typeof dt === 'object') return `${dt.datePart} ${dt.timePart}`;
    if (raw) return ruDate(raw);
    return '—';
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
    const list = clientOrdersForKey(order);
    if (!list.length) {
      CLIENT_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Клиент ещё не оформлял заказов.</p>';
      return;
    }

    CLIENT_JOURNAL_LIST.innerHTML = '<p class="opx-cc-empty">Загрузка журнала…</p>';

    const rows = list.map((o) => ({
      at: o.created_at || o.delivery_date,
      sortKey: new Date(o.created_at || o.delivery_date || 0).getTime(),
      order: o,
      createAction: '',
    }));

    const api = window.EkvalineAPI;
    if (api?.json) {
      await Promise.all(
        list.slice(0, 15).map(async (o) => {
          try {
            const entries = await fetchServerJournal(o.id);
            const createEvt = entries.find((e) => e.action === 'order_create' || e.action === 'order_operator_create');
            if (!createEvt) return;
            const idx = rows.findIndex((r) => r.order && String(r.order.id) === String(o.id));
            if (idx < 0) return;
            if (createEvt.created_at) {
              rows[idx].at = createEvt.created_at;
              rows[idx].sortKey = new Date(createEvt.created_at).getTime();
            }
            rows[idx].createAction = String(createEvt.action || '');
          } catch {
            /* ignore */
          }
        })
      );
    }

    rows.sort((a, b) => b.sortKey - a.sortKey);

    CLIENT_JOURNAL_LIST.innerHTML = rows
      .map((row) => {
        const o = row.order;
        const when = formatClientJournalDateTime(row.at);
        let headline = 'Заказ оформлен';
        if (row.createAction === 'order_create') headline = 'Клиент оформил заказ';
        else if (row.createAction === 'order_operator_create') headline = 'Оператор оформил заказ';
        const oid = escapeHtml(displayOrderId(o.id));
        const openAttr = escapeHtml(String(o.id ?? ''));
        return `<div class="opx-cc-item opx-cc-journal-order">
          <strong>${escapeHtml(when)}</strong>
          <span>${escapeHtml(headline)}: <button type="button" class="opx-link-btn" data-opx-open-order="${openAttr}">${oid}</button></span>
          <span class="opx-cc-journal-meta">Доставка ${escapeHtml(ruDate(o.delivery_date))}, ${escapeHtml(
            slotLabelDisplay(o.delivery_slot)
          )} · ${escapeHtml(statusLabel(o.status))} · ${escapeHtml(money(o.total_sum))} ₽</span>
        </div>`;
      })
      .join('');
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
    state.clientMapApplyTarget = 'client';
    refreshBodyBackdropClass();
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
    const street = normalizeAddressPart(details.road || details.street || details.pedestrian || '');
    const house = normalizeAddressPart(details.house_number || details.building || '');
    if (CLIENT_MAP_CITY instanceof HTMLInputElement) CLIENT_MAP_CITY.value = DEFAULT_CITY;
    if (CLIENT_MAP_STREET instanceof HTMLInputElement && street) CLIENT_MAP_STREET.value = street;
    if (CLIENT_MAP_HOUSE instanceof HTMLInputElement && house) CLIENT_MAP_HOUSE.value = house;
    if (!preserveOptional) {
      if (CLIENT_MAP_APARTMENT instanceof HTMLInputElement) CLIENT_MAP_APARTMENT.value = '';
      if (CLIENT_MAP_ENTRANCE instanceof HTMLInputElement) CLIENT_MAP_ENTRANCE.value = '';
      if (CLIENT_MAP_FLOOR instanceof HTMLInputElement) CLIENT_MAP_FLOOR.value = '';
    }
  }

  function parseRussianAddressExtras(addressRaw) {
    const s = cleanOrderAddressForGeocode(addressRaw);
    const apartment =
      /(?:кв\.?|квартира|офис)\s*([^,;]+)/iu.exec(s)?.[1]?.trim() ||
      /(?:кв\.?|квартира|офис)\s*(\d+[\w\-]*)/iu.exec(s)?.[1]?.trim() ||
      '';
    const entrance = /(?:подъезд)\s*([^,;]+)/iu.exec(s)?.[1]?.trim() || '';
    const floor = /(?:этаж)\s*([^,;]+)/iu.exec(s)?.[1]?.trim() || '';
    return { apartment, entrance, floor };
  }

  /** Подставить в форму карты адрес из карточки клиента / заказа. */
  function hydrateClientMapFormFromAddress(addressRaw) {
    const raw = normalizeAddressPart(addressRaw);
    if (!raw || raw === '—') return false;

    const city = DEFAULT_CITY;
    const parsed = parseRussianStreetHouseFromAddress(raw);
    const extras = parseRussianAddressExtras(raw);

    if (CLIENT_MAP_CITY instanceof HTMLInputElement) CLIENT_MAP_CITY.value = city;
    if (CLIENT_MAP_STREET instanceof HTMLInputElement) CLIENT_MAP_STREET.value = parsed?.street || '';
    if (CLIENT_MAP_HOUSE instanceof HTMLInputElement) CLIENT_MAP_HOUSE.value = parsed?.house || '';
    if (CLIENT_MAP_APARTMENT instanceof HTMLInputElement) CLIENT_MAP_APARTMENT.value = extras.apartment || '';
    if (CLIENT_MAP_ENTRANCE instanceof HTMLInputElement) CLIENT_MAP_ENTRANCE.value = extras.entrance || '';
    if (CLIENT_MAP_FLOOR instanceof HTMLInputElement) CLIENT_MAP_FLOOR.value = extras.floor || '';

    const composed = composeAddressFromFields() || raw;
    if (CLIENT_MAP_SEARCH instanceof HTMLInputElement) CLIENT_MAP_SEARCH.value = composed;
    if (CLIENT_MAP_SELECTED instanceof HTMLElement) CLIENT_MAP_SELECTED.textContent = composed;
    state.mapSelectedAddress = composed;
    return true;
  }

  function getClientMapSeedAddress() {
    const fromClient = normalizeAddressPart(
      CLIENT_ADDRESS_INPUT instanceof HTMLInputElement ? CLIENT_ADDRESS_INPUT.value : ''
    );
    if (fromClient && fromClient !== '—') return fromClient;

    const fromModal = normalizeAddressPart(MODAL_ADDRESS instanceof HTMLInputElement ? MODAL_ADDRESS.value : '');
    if (fromModal && fromModal !== '—') return fromModal;

    const order = getActiveOrder();
    return normalizeAddressPart(order?.address || '');
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
    if (state.creatingOrder) {
      const addrLine = state.mapSelectedAddress || '';
      if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.value = addrLine;
      if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) CLIENT_ADDRESS_INPUT.value = addrLine;
      scheduleModalClientSuggestRefresh();
    } else if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) {
      CLIENT_ADDRESS_INPUT.value = state.mapSelectedAddress || '';
    }
    if (CLIENT_MAP_SEARCH instanceof HTMLInputElement) CLIENT_MAP_SEARCH.value = composeAddressFromFields();
    rememberZoneAddressCoords(
      state.mapSelectedAddress || composed,
      lat,
      lon,
      getActiveOrder()?.id
    );
  }

  async function reverseGeocode(lat, lon) {
    const response = await fetch(
      `/api/public/geocode-reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      { credentials: 'same-origin', headers: { Accept: 'application/json' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      address: String(data?.display_name || '').trim(),
      details: data?.address || {},
    };
  }

  async function geocodeAddress(query, addressRawForPick) {
    const pickSrc = addressRawForPick != null && String(addressRawForPick).trim() ? String(addressRawForPick) : String(query);
    const params = new URLSearchParams({
      limit: '14',
      bounded: '1',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      countrycodes: 'ru',
      q: query,
    });
    const response = await fetch(`/api/public/geocode-search?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) {
      const parsed = parseRussianStreetHouseFromAddress(pickSrc);
      if (parsed?.street) {
        return geocodeByFields(inferCityFromAddress(pickSrc), parsed.street, parsed.house || '', pickSrc);
      }
      return null;
    }
    return pickBestNominatimItem(list, pickSrc);
  }

  function paintZoneMapMarkersFromCache(source, generation) {
    if (!zoneMapCtl || generation !== zoneMarkersBuildGeneration) return 0;
    zoneMapCtl.clear();
    zoneMapOrderCoords.clear();
    const duplicateIndexByKey = Object.create(null);
    let placed = 0;
    const bounds = [];

    for (const order of source) {
      if (generation !== zoneMarkersBuildGeneration) return placed;
      const cached = resolveZoneMapCoordsForOrder(order);
      if (!cached) continue;

      const geoKey = geoCacheKeyForOrder(order);
      const dupIdx = duplicateIndexByKey[geoKey] || 0;
      duplicateIndexByKey[geoKey] = dupIdx + 1;
      const latLng = microJitterLatLng(cached.lat, cached.lng, dupIdx);
      const zone = normalizeZoneName(order.zone);
      const ringColor = markerStrokeColorForOrder(order);
      zoneMapCtl.addOrderMarker(
        latLng[0],
        latLng[1],
        ringColor,
        zoneMapPopupHtml(order, zone, ringColor),
        zoneMapMarkerHint(order)
      );
      zoneMapOrderCoords.set(String(order.id ?? '').trim(), latLng);
      bounds.push(latLng);
      placed += 1;
    }

    fitZoneMapToMarkerBounds(bounds);
    renderZoneMapAddressList();
    return placed;
  }

  async function rebuildZoneMarkersInternal() {
    const generation = ++zoneMarkersBuildGeneration;
    if (!state.zoneMapOpen || !zoneMapCtl) return;

    const source = ordersForZoneMap();
    zoneMapCtl.clear();
    zoneMapOrderCoords.clear();
    renderZoneMapAddressList();
    if (!source.length) return;

    const addrRawByGeoKey = new Map();
    for (const order of source) {
      const gk = geoCacheKeyForOrder(order);
      if (!addrRawByGeoKey.has(gk)) addrRawByGeoKey.set(gk, String(order.address || ''));
    }

    const keysToResolve = [...addrRawByGeoKey.keys()].filter(
      (gk) =>
        !gk.startsWith('__orphan:') && !ZONE_ADDRESS_COORD_CACHE.has(gk) && !ZONE_ADDRESS_GEO_NO_RESULT.has(gk)
    );

    paintZoneMapMarkersFromCache(source, generation);

    const MAP_GEO_CONCURRENCY = 4;
    for (let i = 0; i < keysToResolve.length; i += MAP_GEO_CONCURRENCY) {
      if (generation !== zoneMarkersBuildGeneration) return;
      const chunk = keysToResolve.slice(i, i + MAP_GEO_CONCURRENCY);
      await Promise.all(
        chunk.map(async (geoKey) => {
          const rawAddr = addrRawByGeoKey.get(geoKey) || '';
          let coord = null;
          try {
            coord = await geocodeDeliveryAddressOnce(rawAddr);
          } catch {
            coord = null;
          }
          if (generation !== zoneMarkersBuildGeneration) return;
          if (coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
            ZONE_ADDRESS_COORD_CACHE.set(geoKey, coord);
          } else {
            ZONE_ADDRESS_GEO_NO_RESULT.add(geoKey);
          }
        })
      );
      if (generation !== zoneMarkersBuildGeneration) return;
      paintZoneMapMarkersFromCache(source, generation);
    }

    if (generation !== zoneMarkersBuildGeneration) return;
    paintZoneMapMarkersFromCache(source, generation);
  }

  async function geocodeByFields(city, street, house, addressRawForPick) {
    const cityUse = isOrenburgCityName(city) ? city : DEFAULT_CITY;
    const pickSrc =
      addressRawForPick != null && String(addressRawForPick).trim()
        ? String(addressRawForPick)
        : `${cityUse}, ${street} ${house}`;
    const parsed = parseRussianStreetHouseFromAddress(pickSrc);
    const streetUse = parsed ? formatStreetForGeocode(parsed, pickSrc) : street;
    const params = new URLSearchParams({
      limit: '12',
      bounded: '1',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      countrycodes: 'ru',
      city: cityUse,
      street: [streetUse, house].filter(Boolean).join(', '),
    });
    const response = await fetch(`/api/public/geocode-search?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) return null;
    return pickBestNominatimItem(list, pickSrc);
  }

  /**
   * Координаты дома: сначала city+street (Nominatim не понимает «ул./д.» в q),
   * затем упрощённый текстовый запрос.
   */
  async function geocodeDeliveryAddressOnce(addressRaw) {
    const cleaned = cleanOrderAddressForGeocode(addressRaw);
    const parsed = parseRussianStreetHouseFromAddress(addressRaw);
    const city = inferCityFromAddress(addressRaw);
    const housePart = parsed?.house ? String(parsed.house).trim() : '';

    if (cleaned) {
      await nominatimThrottleZoneMap();
      const direct = await geocodeAddress(buildZoneMapGeocodeQuery(cleaned), addressRaw);
      if (
        direct &&
        Number.isFinite(direct.lat) &&
        Number.isFinite(direct.lon) &&
        coordsInOrenburgView(direct.lat, direct.lon)
      ) {
        return { lat: direct.lat, lng: direct.lon };
      }
    }

    if (parsed?.street) {
      await nominatimThrottleZoneMap();
      const streetUse = formatStreetForGeocode(parsed, addressRaw);
      const byFields = await geocodeByFields(city, streetUse, housePart, addressRaw);
      if (
        byFields &&
        Number.isFinite(byFields.lat) &&
        Number.isFinite(byFields.lon) &&
        coordsInOrenburgView(byFields.lat, byFields.lon)
      ) {
        return { lat: byFields.lat, lng: byFields.lon };
      }
    }

    await nominatimThrottleZoneMap();
    const streetUse = parsed?.street ? formatStreetForGeocode(parsed, addressRaw) : '';
    const simpleQ = streetUse
      ? `${city}, ${streetUse}${housePart ? `, ${housePart}` : ''}, Россия`
      : buildZoneMapGeocodeQuery(addressRaw);
    const hit = await geocodeAddress(simpleQ, addressRaw);
    if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lon) && coordsInOrenburgView(hit.lat, hit.lon)) {
      return { lat: hit.lat, lng: hit.lon };
    }

    return null;
  }

  function scheduleZoneCoordinatesPrefetch(orderList) {
    if (zoneCoordsPrefetchTimer) window.clearTimeout(zoneCoordsPrefetchTimer);
    zoneCoordsPrefetchTimer = window.setTimeout(() => {
      zoneCoordsPrefetchTimer = null;
      void prefetchZoneCoordinatesInBackground(orderList);
    }, 380);
  }

  async function prefetchZoneCoordinatesInBackground(orderList) {
    const batchId = ++zoneCoordsPrefetchGeneration;
    const list = Array.isArray(orderList) ? orderList : [];
    const uniq = new Map();
    for (const o of list) {
      const gk = geoCacheKeyForOrder(o);
      if (uniq.has(gk) || gk.startsWith('__orphan:')) continue;
      uniq.set(gk, String(o.address || ''));
    }

    let geoCallsThisRun = 0;
    for (const [gk, raw] of uniq) {
      if (batchId !== zoneCoordsPrefetchGeneration) return;
      if (ZONE_ADDRESS_COORD_CACHE.has(gk) || ZONE_ADDRESS_GEO_NO_RESULT.has(gk)) continue;
      if (geoCallsThisRun >= MAX_ZONE_PREFETCH_GEO_CALLS_PER_RUN) break;
      geoCallsThisRun += 1;
      let coord = null;
      try {
        coord = await geocodeDeliveryAddressOnce(raw);
      } catch {
        coord = null;
      }
      if (batchId !== zoneCoordsPrefetchGeneration) return;
      if (coord) ZONE_ADDRESS_COORD_CACHE.set(gk, coord);
      else ZONE_ADDRESS_GEO_NO_RESULT.add(gk);
    }

    if (batchId !== zoneCoordsPrefetchGeneration) return;
    if (state.zoneMapOpen) renderZoneMapMarkers();
  }

  async function suggestStreets(query) {
    enforceOrenburgCityField();
    const city = DEFAULT_CITY;
    const key = `${city}|${query}`.toLowerCase();
    if (state.streetCache[key]) return state.streetCache[key];
    const params = new URLSearchParams({
      limit: '8',
      bounded: '1',
      countrycodes: 'ru',
      viewbox: `${ORENBURG_VIEWBOX.left},${ORENBURG_VIEWBOX.top},${ORENBURG_VIEWBOX.right},${ORENBURG_VIEWBOX.bottom}`,
      q: `${query}, ${city}`,
    });
    const response = await fetch(`/api/public/geocode-search?${params.toString()}`, {
      credentials: 'same-origin',
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

  async function ensureClientMap() {
    if (!CLIENT_MAP_CANVAS) return false;
    if (clientMapCtl) return true;
    const EM = window.EkvalineMaps;
    if (!EM || typeof EM.attachInteractiveMap !== 'function') return false;
    try {
      const mapHost = await EM.attachInteractiveMap(
        CLIENT_MAP_CANVAS,
        [51.7682, 55.0969],
        12,
        {
          onMapClick: async (lat, lon) => {
            if (!coordsInOrenburgView(lat, lon)) {
              showToast('Можно выбрать адрес только в пределах Оренбурга.');
              return;
            }
            const reverse = await reverseGeocode(lat, lon);
            if (
              !reverse ||
              !isOrenburgAddress({ address: reverse.details || {}, display_name: reverse.address || '' })
            ) {
              showToast('Эта точка вне зоны доставки по Оренбургу.');
              return;
            }
            const address = reverse.address || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            updateMapSelection(lat, lon, address, reverse.details || null);
          },
        }
      );
      clientMapCtl = mapHost;
      return Boolean(clientMapCtl);
    } catch {
      clientMapCtl = null;
      return false;
    }
  }

  function openClientMapModal() {
    if (!(CLIENT_MAP_MODAL instanceof HTMLElement)) return;
    enforceOrenburgCityField();
    const seed = getClientMapSeedAddress();
    if (seed) {
      hydrateClientMapFormFromAddress(seed);
    } else if (CLIENT_MAP_CITY instanceof HTMLInputElement && !normalizeAddressPart(CLIENT_MAP_CITY.value)) {
      CLIENT_MAP_CITY.value = 'Оренбург';
    }
    CLIENT_MAP_MODAL.classList.add('is-open');
    CLIENT_MAP_MODAL.hidden = false;
    CLIENT_MAP_MODAL.setAttribute('aria-hidden', 'false');
    void (async () => {
      const ok = await ensureClientMap();
      if (!ok) {
        showToast('Карта не загрузилась — введите адрес полями слева и нажмите «Найти».');
      } else if (clientMapCtl?.engine !== 'yandex') {
        showToast('Карты не настроены — введите адрес в полях слева и нажмите «Найти».', 4200, 'info');
      }
      if (clientMapCtl?.invalidateSize) {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => clientMapCtl?.invalidateSize()));
      }
      if (seed) {
        const street = normalizeAddressPart(
          CLIENT_MAP_STREET instanceof HTMLInputElement ? CLIENT_MAP_STREET.value : ''
        );
        const house = normalizeAddressPart(CLIENT_MAP_HOUSE instanceof HTMLInputElement ? CLIENT_MAP_HOUSE.value : '');
        if (street.length >= 2 || seed.length >= 8) {
          await searchOnClientMap();
        }
      }
    })();
    refreshBodyBackdropClass();
  }


  async function searchOnClientMap() {
    enforceOrenburgCityField();
    const searchValue = normalizeAddressPart(CLIENT_MAP_SEARCH instanceof HTMLInputElement ? CLIENT_MAP_SEARCH.value : '');
    const cityValue = DEFAULT_CITY;
    if (CLIENT_MAP_CITY instanceof HTMLInputElement) CLIENT_MAP_CITY.value = DEFAULT_CITY;
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
      result = await geocodeByFields(cityValue, streetValue, houseValue, structuredQuery);
    }
    for (let i = 0; i < uniqAttempts.length; i += 1) {
      // Пробуем несколько форматов адреса, чтобы быстрее находить дом на карте.
      // eslint-disable-next-line no-await-in-loop
      if (!result) result = await geocodeAddress(uniqAttempts[i], structuredQuery || uniqAttempts[i]);
      if (result) break;
    }
    if (!result || !clientMapCtl) {
      showToast('Адрес не найден');
      return;
    }
    clientMapCtl.flyToMarker(result.lat, result.lon, 16);
    clientMapCtl.setMarker(result.lat, result.lon);
    updateMapSelection(result.lat, result.lon, result.address, result.details || null);
  }

  function saveClientCardChanges() {
    const nextClient = String(CLIENT_NAME_INPUT instanceof HTMLInputElement ? CLIENT_NAME_INPUT.value : '').trim();
    const nextPhone = String(CLIENT_PHONE_INPUT instanceof HTMLInputElement ? CLIENT_PHONE_INPUT.value : '').trim();
    const nextAddress = String(CLIENT_ADDRESS_INPUT instanceof HTMLInputElement ? CLIENT_ADDRESS_INPUT.value : '').trim();
    const cardCheck = opxLimits()?.validateClientCardFields?.({
      client: nextClient,
      phoneRaw: nextPhone,
      address: nextAddress,
    });
    if (cardCheck && !cardCheck.ok) {
      showToast(cardCheck.message, 3200, 'error');
      return;
    }
    const clientName = cardCheck?.client ?? nextClient;
    const clientAddress = cardCheck?.address ?? nextAddress;
    if (state.creatingOrder) {
      if (MODAL_CLIENT instanceof HTMLInputElement) MODAL_CLIENT.value = clientName;
      if (MODAL_PHONE instanceof HTMLInputElement) setPhoneInputValue(MODAL_PHONE, nextPhone);
      if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.value = clientAddress;
      scheduleModalClientSuggestRefresh();
      closeClientMapModal();
      closeClientCardModal();
      return;
    }
    const order = getActiveOrder();
    if (!order) return;
    const prevClient = order.client;
    const prevPhone = order.phone;
    const prevAddress = order.address;
    const prevTotal = Number(order.total_sum) || 0;
    order.client = clientName || order.client || 'КЛИЕНТ';
    order.phone = nextPhone;
    order.address = clientAddress || order.address;
    if (state.mapSelectedCoords) {
      rememberZoneAddressCoords(
        order.address,
        state.mapSelectedCoords.lat,
        state.mapSelectedCoords.lon,
        order.id
      );
    }
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

  function syncBulkBarUi() {
    const vis = state.filtered;
    const n = vis.length;
    let onScreen = 0;
    vis.forEach((o) => {
      if (bulkSelectedIds.has(String(o.id).trim())) onScreen += 1;
    });
    if (BULK_SELECT_ALL instanceof HTMLInputElement) {
      bulkHeaderProgrammatic = true;
      BULK_SELECT_ALL.checked = n > 0 && onScreen === n;
      BULK_SELECT_ALL.indeterminate = onScreen > 0 && onScreen < n;
      bulkHeaderProgrammatic = false;
    }
  }

  async function patchOrderStatusForBulk(order, newStatus) {
    const prev = normalizeOrderStatus(order.status);
    const next = normalizeOrderStatus(newStatus);
    if (prev === 'cancelled') return { outcome: 'skip' };
    if (prev === next) return { outcome: 'skip' };
    const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;
    const serverPersisted = orderIsServerPersisted(order);
    const restId = serverPersisted ? orderRestIdForApi(order) : '';
    const orderLabel = displayOrderId(order.id);
    if (api && restId && /^\d+$/.test(restId)) {
      try {
        const response = await api.json(`/api/orders/${encodeURIComponent(restId)}`, {
          method: 'PATCH',
          body: { status: next, change_reason: '' },
        });
        if (response.ok) {
          api.resetCsrf?.();
          applyOrderRowFromServer(order, response.data?.order, next);
          return { outcome: 'ok' };
        }
        const st = Number(response.status || 0);
        const errTxt = typeof response?.data?.error === 'string' ? response.data.error.trim() : '';
        if (st === 401) {
          redirectOnUnauthorized(st, response?.data);
          return { outcome: 'auth' };
        }
        if (st === 403 || st === 422 || st === 404 || st === 400) {
          const err =
            st === 404
              ? `Заказ ${orderLabel} не найден на сервере — обновите список.`
              : errTxt || 'Сервер отклонил изменение';
          return { outcome: 'fail', error: err, orderId: orderLabel };
        }
      } catch {
        return { outcome: 'fail', error: 'Ошибка сети при сохранении статуса.' };
      }
    }
    if (!serverPersisted || !restId) {
      return { outcome: 'fail', error: 'Заказ не синхронизирован с сервером — обновите список.' };
    }
    return { outcome: 'fail', error: 'Не удалось сохранить статус на сервере.' };
  }

  async function runBulkStatusApply() {
    if (bulkApplyRunning) return;
    const selUi =
      BULK_STATUS_SELECT instanceof HTMLSelectElement ? String(BULK_STATUS_SELECT.value || '').trim() : 'in_processing';
    const allowedUi = new Set(['in_processing', 'confirmed', 'on_way', 'delivered']);
    if (!allowedUi.has(selUi)) {
      showToast('Выберите допустимый статус');
      return;
    }
    const ids = [...bulkSelectedIds];
    if (!ids.length) {
      showToast('Отметьте заказы или включите «Все на экране»');
      return;
    }
    bulkApplyRunning = true;
    ordersRefreshPaused = true;
    if (BULK_APPLY_BTN instanceof HTMLButtonElement) BULK_APPLY_BTN.disabled = true;
    let ok = 0;
    let fail = 0;
    let skip = 0;
    const errs = [];
    try {
      for (const id of ids) {
        const resolvedId = resolveOrderStateId(id) || id;
        const order = findOrderInStateByKey(resolvedId);
        if (!order) {
          fail += 1;
          errs.push(`Заказ ${displayOrderId(resolvedId)} не найден в списке — обновите таблицу.`);
          continue;
        }
        const dbStatus = operatorDbStatusFromUi(selUi, order.status);
        const r = await patchOrderStatusForBulk(order, dbStatus);
        if (r.outcome === 'auth') {
          bulkSelectedIds.clear();
          syncBulkBarUi();
          return;
        }
        if (r.outcome === 'skip') skip += 1;
        else if (r.outcome === 'ok') {
          ok += 1;
          applyFilters();
          render();
        } else {
          fail += 1;
          if (r.error) errs.push(r.error);
        }
      }
    } finally {
      ordersRefreshPaused = false;
      bulkApplyRunning = false;
      if (BULK_APPLY_BTN instanceof HTMLButtonElement) BULK_APPLY_BTN.disabled = false;
    }
    try {
      await loadOrders();
    } catch {
      /* локальные правки уже в state.orders */
    }
    operatorOrdersTableRefresh();
    let msg = 'Готово';
    let toastKind = 'success';
    if (fail && !ok) {
      msg = errs.length ? errs[0] : `Не удалось изменить статус (${fail})`;
      toastKind = 'error';
    } else if (ok && !skip && !fail) {
      msg = ok === 1 ? 'Статус изменён у 1 заказа' : `Статус изменён у ${ok} заказов`;
    } else if (ok && (skip || fail)) {
      const bits = [`Статус обновлён у ${ok}`];
      if (skip) bits.push(`без изменений: ${skip}`);
      if (fail) bits.push(`ошибок: ${fail}`);
      msg = bits.join(' · ');
      if (fail && errs.length) msg += ` — ${errs[0]}`;
      toastKind = fail ? 'error' : 'info';
    } else if (skip && !ok && !fail) {
      msg = 'Выбранные заказы уже в этом статусе';
      toastKind = 'info';
    } else if (fail) {
      msg = errs.length ? errs[0] : `Ошибок: ${fail}`;
      toastKind = 'error';
    }
    showToast(msg, 3600, toastKind);
    bulkSelectedIds.clear();
    syncBulkBarUi();
  }

  let renderOrdersFrame = 0;

  function renderOrdersTableNow() {
    if (!(BODY instanceof HTMLElement)) return;
    refreshFiltersIndicators();
    const newCount = incomingNewOrdersList().length;
    if (NEW_COUNT instanceof HTMLElement) NEW_COUNT.textContent = String(newCount);
    const footerStats = computeOperatorFooterStats(state.filtered);
    syncOperatorFooterDom(footerStats);

    if (!state.filtered.length) {
      BODY.innerHTML = `<tr><td colspan="14" class="operator-empty-cell">${operatorEmptyGridHintHtml()}</td></tr>`;
      syncBulkBarUi();
    } else {
      BODY.innerHTML = state.filtered
        .map((o, i) => {
          const product = formatOrderProductsLabel(o.items_json, i);
          const qty = parseQty(o.items_json);
          const zoneName = normalizeZoneName(o.zone);
          const dt = ruDateTime(o.created_at);
          const createdDate = typeof dt === 'object' ? dt.datePart : '—';
          const createdTime = typeof dt === 'object' ? dt.timePart : '—';
          const phone = String(o.phone || '').trim();
          const phoneLine = `<span class="opx-phone">${phone || 'Телефон не указан'}</span>`;
          const mobVal = (inner) => `<span class="opx-mob-val">${inner}</span>`;
          const orderId = displayOrderId(o.id);
          const exp = String(o.driver ?? '').trim();
          const expTitle = escapeHtml(exp || 'Не назначен');
          const idKey = String(o.id).trim();
          const checked = bulkSelectedIds.has(idKey) ? ' checked' : '';
          return `
          <tr data-opx-order-id="${escapeHtml(String(o.id))}" data-opx-status="${escapeHtml(normalizeOrderStatus(o.status))}" class="${escapeHtml(operatorRowHighlightClass(o))}">
            <td class="opx-bulk-cb opx-mob-card-head" data-label="">
              <label class="opx-bulk-cb">
                <input type="checkbox" data-opx-bulk-cb="${escapeHtml(idKey)}"${checked} aria-label="Выбрать заказ ${escapeHtml(
            orderId
          )}" />
              </label>
            </td>
            <td class="opx-mob-card-head" data-label="№ заказа" title="${orderId}"><button type="button" class="opx-order-link" data-opx-open-order="${escapeHtml(String(o.id))}">${orderId}</button></td>
            <td class="opx-mob-card-head" data-label="Период">${mobVal(escapeHtml(periodBySlot(o.delivery_slot)))}</td>
            <td data-label="Дата заказа">${mobVal(`<span class="opx-dt"><span class="opx-dt-date">${createdDate}</span><span class="opx-dt-time">${createdTime}</span></span>`)}</td>
            <td class="opx-wrap" data-label="Клиент" title="${escapeHtml(String(o.client || 'КЛИЕНТ'))}">${mobVal(escapeHtml(String(o.client || 'КЛИЕНТ')))}</td>
            <td class="opx-wrap" data-label="Адрес" title="${String(o.address || '')}">${mobVal(`${String(o.address || '')}${phoneLine}`)}</td>
            <td data-label="Доставка">${mobVal(escapeHtml(ruDate(o.delivery_date || o.created_at)))}</td>
            <td class="opx-wrap" data-label="Продукция" title="${product}">${mobVal(product)}</td>
            <td data-label="Кол-во">${mobVal(String(qty))}</td>
            <td class="opx-mob-card-head" data-label="Сумма">${mobVal(money(orderDisplayTotalSum(o)))}</td>
            <td data-label="Оплата">${mobVal(escapeHtml(paymentLabelDisplay(o.payment_method)))}</td>
            <td data-label="Зона">${mobVal(escapeHtml(zoneName))}</td>
            <td data-label="Экспедитор" title="${expTitle}">${mobVal(exp ? escapeHtml(exp) : 'Не назначен')}</td>
            <td class="opx-wrap opx-note" data-label="Примечание" title="${escapeHtml(formatCourierNote(o.courier_note))}">${mobVal(escapeHtml(formatCourierNote(o.courier_note)))}</td>
          </tr>
        `;
        })
        .join('');
      renderZoneMapMarkers();
      if (state.reportsOpen) renderReports();
      syncBulkBarUi();
    }
    /** Геокод только по текущей выборке таблицы, не по всей базе (иначе тысячи обращений к Nominatim). */
    scheduleZoneCoordinatesPrefetch(state.filtered);
  }

  function render() {
    if (renderOrdersFrame) return;
    renderOrdersFrame = requestAnimationFrame(() => {
      renderOrdersFrame = 0;
      renderOrdersTableNow();
    });
  }

  function syncDayPresetHighlightsFromState() {
    if (!state.date) {
      DAY_BTNS.forEach((b) => b.classList.remove('is-active'));
      return;
    }
    const todayIso = isoDate(new Date());
    const yesterdayIso = shiftIsoCalendarDay(todayIso, -1);
    const tomorrowIso = shiftIsoCalendarDay(todayIso, 1);
    const kind =
      state.date === todayIso ? 'today' :
      state.date === yesterdayIso ? 'yesterday' :
      state.date === tomorrowIso ? 'tomorrow' : null;
    DAY_BTNS.forEach((b) => {
      const d = b.getAttribute('data-opx-day');
      b.classList.toggle('is-active', kind !== null && d === kind);
    });
  }

  function stepFilterDeliveryDay(delta) {
    let base =
      typeof state.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(state.date.trim())
        ? state.date.trim()
        : '';
    if (!base && DATE instanceof HTMLInputElement && /^\d{4}-\d{2}-\d{2}$/.test(String(DATE.value || '').trim())) {
      base = String(DATE.value).trim();
    }
    if (!base) base = isoDate(new Date());
    const next = shiftIsoCalendarDay(base, delta);
    state.date = next;
    if (DATE instanceof HTMLInputElement) DATE.value = next;
    syncDayPresetHighlightsFromState();
    applyFilters();
    render();
  }

  function setRelativeDay(kind) {
    const now = new Date();
    if (kind === 'yesterday') now.setDate(now.getDate() - 1);
    if (kind === 'tomorrow') now.setDate(now.getDate() + 1);
    state.date = isoDate(now);
    if (DATE instanceof HTMLInputElement) DATE.value = state.date;
    syncDayPresetHighlightsFromState();
    applyFilters();
    render();
  }

  function resetOrdersSearchInput() {
    state.query = '';
    if (SEARCH instanceof HTMLInputElement) SEARCH.value = '';
  }

  function purgeUnexpectedOrdersSearchAutofill() {
    if (!(SEARCH instanceof HTMLInputElement)) return;
    if (state.query) return;
    if (!String(SEARCH.value || '').trim()) return;
    resetOrdersSearchInput();
    applyFilters();
    render();
  }

  function bindOrdersSearchInput() {
    if (!(SEARCH instanceof HTMLInputElement)) return;
    resetOrdersSearchInput();
    SEARCH.setAttribute('autocomplete', 'off');
    SEARCH.setAttribute('readonly', 'readonly');
    const unlockSearchInput = () => {
      SEARCH.removeAttribute('readonly');
    };
    SEARCH.addEventListener('focus', unlockSearchInput, { once: true });
    SEARCH.addEventListener('pointerdown', unlockSearchInput, { once: true });
    SEARCH.addEventListener('input', () => {
      const searchMax = opxLimits()?.SEARCH_MAX ?? 120;
      let q = String(SEARCH.value || '');
      if (q.length > searchMax) {
        q = q.slice(0, searchMax);
        SEARCH.value = q;
      }
      if (searchInputDebounceTimer) window.clearTimeout(searchInputDebounceTimer);
      searchInputDebounceTimer = window.setTimeout(() => {
        searchInputDebounceTimer = null;
        state.query = q;
        applyFilters();
        render();
      }, 100);
    });
    window.requestAnimationFrame(() => purgeUnexpectedOrdersSearchAutofill());
    window.setTimeout(() => purgeUnexpectedOrdersSearchAutofill(), 350);
  }

  function bind() {
    TOAST_CLOSE?.addEventListener('click', () => {
      if (!(TOAST instanceof HTMLElement)) return;
      if (state.toastTimer) window.clearTimeout(state.toastTimer);
      TOAST.classList.remove('is-visible');
      TOAST.hidden = true;
    });
    TOAST?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const trigger = target.closest('[data-opx-open-order]');
      if (!(trigger instanceof HTMLButtonElement)) return;
      event.preventDefault();
      const orderId = trigger.getAttribute('data-opx-open-order');
      if (!orderId) return;
      if (state.toastTimer) window.clearTimeout(state.toastTimer);
      TOAST.classList.remove('is-visible');
      TOAST.hidden = true;
      openOrderModalById(orderId);
    });
    ensureProductOptions();
    renderOrderCartCatalogPicker();
    ensureFiltersModalStaticSelects();
    opxLimits()?.bindOperatorFormLimits?.({
      modalClient: MODAL_CLIENT,
      modalPhone: MODAL_PHONE,
      modalAddress: MODAL_ADDRESS,
      modalNote: MODAL_NOTE,
      reasonText: ORDER_REASON_TEXT,
      search: SEARCH,
      clientName: CLIENT_NAME_INPUT,
      clientPhone: CLIENT_PHONE_INPUT,
      clientAddress: CLIENT_ADDRESS_INPUT,
      mapStreet: CLIENT_MAP_STREET,
      mapHouse: CLIENT_MAP_HOUSE,
      mapApartment: CLIENT_MAP_APARTMENT,
      mapEntrance: CLIENT_MAP_ENTRANCE,
      mapFloor: CLIENT_MAP_FLOOR,
      mapSearch: CLIENT_MAP_SEARCH,
      onTrim: (max) => showToast(`Не более ${max} символов`, 2400, 'info'),
      onPhoneTrim: () => showToast('Не более 11 цифр', 2400, 'info'),
    });
    CLIENT_NAME_INPUT?.addEventListener('input', syncClientCardNameCounter);
    syncClientCardNameCounter();
    bindOrdersSearchInput();
    DATE?.addEventListener('change', () => {
      state.date = String(DATE.value || '');
      syncDayPresetHighlightsFromState();
      applyFilters();
      render();
    });
    CLEAR_DATE?.addEventListener('click', () => {
      state.date = '';
      if (DATE instanceof HTMLInputElement) DATE.value = '';
      syncDayPresetHighlightsFromState();
      applyFilters();
      render();
    });
    DATE_PREV_BTN?.addEventListener('click', () => stepFilterDeliveryDay(-1));
    DATE_NEXT_BTN?.addEventListener('click', () => stepFilterDeliveryDay(1));
    DAY_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => setRelativeDay(String(btn.getAttribute('data-opx-day') || 'today')));
    });
    REFRESH?.addEventListener('click', async () => {
      renderOrdersPlaceholder('Обновление списка…');
      try {
        await loadOrders();
      } catch {
        emptyOrdersFallback();
        showToast('Ошибка при обновлении.');
      }
      applyFilters();
      render();
      const total = state.orders.length;
      const vis = state.filtered.length;
      if (!total) {
        showToast('Список обновлён: заказов нет');
      } else if (!vis) {
        showToast(
          `Загружено заказов: ${total}. На экране пусто — действуют день доставки и фильтры (кнопка «Фильтры»). Статус у «Все» — для массовой смены, не для отбора таблицы.`
        );
      } else {
        showToast('Список обновлён');
      }
    });
    TAB_MAP?.addEventListener('click', openZoneMapOverlay);
    TAB_ORDERS?.addEventListener('click', switchToOrdersView);
    TAB_REPORTS?.addEventListener('click', openReportsOverlay);
    TAB_SETTINGS?.addEventListener('click', openSettingsOverlay);
    SETTINGS_CLOSE?.addEventListener('click', closeSettingsOverlay);
    SETTINGS_DAYS_LIST?.addEventListener('change', onSettingsDaysListChange);
    SETTINGS_OVERLAY?.addEventListener('click', (event) => {
      const t = event.target;
      const btn = t instanceof Element ? t.closest('[data-opx-settings-switch]') : null;
      if (!(btn instanceof HTMLButtonElement) || btn.disabled) return;
      const sw = String(btn.getAttribute('data-opx-settings-switch') || '');
      if (sw === 'orders') switchToOrdersView();
      else if (sw === 'map') openZoneMapOverlay();
      else if (sw === 'reports') openReportsOverlay();
      else if (sw === 'settings') openSettingsOverlay();
    });
    ZONE_MAP_CLOSE?.addEventListener('click', closeZoneMapOverlay);
    ZONE_MAP_ADDRESS_LIST?.addEventListener('click', (event) => {
      const t = event.target;
      const row = t instanceof Element ? t.closest('[data-opx-zone-focus-order]') : null;
      if (!(row instanceof HTMLElement)) return;
      let oid = row.getAttribute('data-opx-zone-focus-order') || '';
      try {
        oid = decodeURIComponent(oid);
      } catch {
        /* keep raw */
      }
      focusZoneMapOrder(oid);
    });
    ZONE_MAP_ADDRESS_LIST?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const t = event.target;
      const row = t instanceof Element ? t.closest('[data-opx-zone-focus-order]') : null;
      if (!(row instanceof HTMLElement)) return;
      event.preventDefault();
      let oid = row.getAttribute('data-opx-zone-focus-order') || '';
      try {
        oid = decodeURIComponent(oid);
      } catch {
        /* keep raw */
      }
      focusZoneMapOrder(oid);
    });
    REPORTS_BUILD_BTN?.addEventListener('click', () => {
      renderReports();
      showToast('Отчёт пересчитан');
    });
    REPORTS_PRINT_BTN?.addEventListener('click', () => printActiveReportsPane());
    REPORTS_PDF_BTN?.addEventListener('click', () => void downloadReportsPdf());
    REPORTS_DATE_FROM?.addEventListener('change', renderReports);
    REPORTS_DATE_TO?.addEventListener('change', renderReports);
    REPORTS_OVERLAY?.addEventListener('click', (event) => {
      const t = event.target;
      const orderTrigger = t instanceof Element ? t.closest('[data-opx-open-order]') : null;
      if (orderTrigger instanceof HTMLElement) {
        event.preventDefault();
        const orderId = orderTrigger.getAttribute('data-opx-open-order');
        if (orderId) openOrderFromReports(orderId);
        return;
      }
      const paneBtn = t instanceof Element ? t.closest('[data-opx-report-pane]') : null;
      if (paneBtn instanceof HTMLButtonElement) {
        event.preventDefault();
        setReportsPane(String(paneBtn.getAttribute('data-opx-report-pane') || ''));
        return;
      }
      const btn =
        t instanceof Element ? t.closest('[data-opx-reports-switch]') : null;
      if (!(btn instanceof HTMLButtonElement) || btn.disabled) return;
      const sw = String(btn.getAttribute('data-opx-reports-switch') || '');
      if (sw === 'orders') switchToOrdersView();
      else if (sw === 'map') openZoneMapOverlay();
      else if (sw === 'reports') openReportsOverlay();
      else if (sw === 'settings') openSettingsOverlay();
    });
    CREATE_ORDER_BTN?.addEventListener('click', () => openCreateOrderModal());
    ORDERS_EXPORT_BTN?.addEventListener('click', () => void exportOrdersPdfAndPrint());
    NEW_ORDERS_INBOX_BTN?.addEventListener('click', () => openNewOrdersInboxModal());
    NEW_ORDERS_MODAL_CLOSE?.addEventListener('click', () => closeNewOrdersInboxModal());
    NEW_ORDERS_MODAL_DISMISS?.addEventListener('click', () => closeNewOrdersInboxModal());
    NEW_ORDERS_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-opx-new-inbox-dismiss="backdrop"]')) {
        closeNewOrdersInboxModal();
        return;
      }
      const pick = target.closest('[data-opx-inbox-order-id]');
      if (pick instanceof HTMLElement) {
        const id = pick.getAttribute('data-opx-inbox-order-id');
        if (id) openOrderFromNewInbox(id);
      }
    });
    FILTERS_OPEN_BTN?.addEventListener('click', () => openFiltersModal());
    FILTERS_CLOSE_BTN?.addEventListener('click', () => closeFiltersModal());
    FILTERS_CLOSE_FOOTER?.addEventListener('click', () => closeFiltersModal());
    FILTERS_DISABLE_BTN?.addEventListener('click', () => disableAllAdvancedFiltersUi());
    FILTERS_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-opx-filters-dismiss="backdrop"]')) closeFiltersModal();
    });
    FILTERS_SLOT_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = String(btn.getAttribute('data-opx-adv-slot') || 'all');
        state.advanced.slot = slot;
        syncAdvSlotButtonsFromState();
        refreshFiltersIndicators();
        applyFilters();
        render();
      });
    });
    function onAdvancedFilterChange() {
      refreshFiltersIndicators();
      applyFilters();
      render();
    }
    FILTERS_ADV_STATUS?.addEventListener('change', () => {
      if (!(FILTERS_ADV_STATUS instanceof HTMLSelectElement)) return;
      state.status = String(FILTERS_ADV_STATUS.value || 'all');
      onAdvancedFilterChange();
    });
    FILTERS_ADV_PAYMENT?.addEventListener('change', () => {
      state.advanced.payment =
        FILTERS_ADV_PAYMENT instanceof HTMLSelectElement ? String(FILTERS_ADV_PAYMENT.value || 'all') : 'all';
      onAdvancedFilterChange();
    });
    FILTERS_ADV_ZONE?.addEventListener('change', () => {
      state.advanced.zone =
        FILTERS_ADV_ZONE instanceof HTMLSelectElement ? String(FILTERS_ADV_ZONE.value || 'all') : 'all';
      onAdvancedFilterChange();
    });
    FILTERS_ADV_DRIVER?.addEventListener('change', () => {
      state.advanced.driver =
        FILTERS_ADV_DRIVER instanceof HTMLSelectElement ? String(FILTERS_ADV_DRIVER.value || 'all') : 'all';
      onAdvancedFilterChange();
    });
    FILTERS_ADV_WEEKDAY?.addEventListener('change', () => {
      state.advanced.weekday =
        FILTERS_ADV_WEEKDAY instanceof HTMLSelectElement ? String(FILTERS_ADV_WEEKDAY.value || 'all') : 'all';
      onAdvancedFilterChange();
    });
    FILTERS_ADV_PRODUCT?.addEventListener('change', () => {
      state.advanced.product =
        FILTERS_ADV_PRODUCT instanceof HTMLSelectElement ? String(FILTERS_ADV_PRODUCT.value || 'all') : 'all';
      onAdvancedFilterChange();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.zoneMapOpen) closeZoneMapOverlay();
      if (event.key === 'Escape' && state.reportsOpen) closeReportsOverlay();
      if (event.key === 'Escape' && state.settingsOpen) closeSettingsOverlay();
      if (event.key === 'Escape' && newOrdersInboxOpen) closeNewOrdersInboxModal();
      if (
        event.key === 'Escape' &&
        CONFIRM_MODAL instanceof HTMLElement &&
        CONFIRM_MODAL.classList.contains('is-open') &&
        !CONFIRM_MODAL.hidden
      ) {
        closeOpxConfirm(false);
      }
    });
    CONFIRM_OK_BTN?.addEventListener('click', () => closeOpxConfirm(true));
    CONFIRM_CANCEL_BTN?.addEventListener('click', () => closeOpxConfirm(false));
    CONFIRM_MODAL?.addEventListener('click', (event) => {
      const t = event.target;
      if (t instanceof Element && t.closest('[data-opx-confirm-dismiss]')) closeOpxConfirm(false);
    });
    LOGOUT?.addEventListener('click', async () => {
      const ok = await showOpxConfirm({
        title: 'Выход из системы',
        message: 'Выйти из учётной записи?',
        okLabel: 'Выйти',
        cancelLabel: 'Отмена',
        variant: 'danger',
      });
      if (!ok) return;
      const api = window.EkvalineAPI;
      if (api?.json) {
        try {
          await api.json('/api/auth/logout', { method: 'POST', body: {} });
        } catch {
          /* ignore */
        }
        api.resetCsrf?.();
      }
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
    BODY?.addEventListener('change', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      const idAttr = t.getAttribute('data-opx-bulk-cb');
      if (idAttr == null) return;
      if (t.checked) bulkSelectedIds.add(idAttr);
      else bulkSelectedIds.delete(idAttr);
      syncBulkBarUi();
    });
    BULK_SELECT_ALL?.addEventListener('change', () => {
      if (bulkHeaderProgrammatic) return;
      if (BULK_SELECT_ALL instanceof HTMLInputElement && BULK_SELECT_ALL.checked) {
        state.filtered.forEach((o) => bulkSelectedIds.add(String(o.id).trim()));
      } else {
        state.filtered.forEach((o) => bulkSelectedIds.delete(String(o.id).trim()));
      }
      render();
    });
    BULK_CLEAR_BTN?.addEventListener('click', () => {
      if (!bulkSelectedIds.size) {
        showToast('Нет отмеченных заказов', 2200, 'info');
        return;
      }
      bulkSelectedIds.clear();
      render();
      showToast('Выбор снят', 2200, 'success');
    });
    BULK_APPLY_BTN?.addEventListener('click', () => {
      void runBulkStatusApply();
    });
    BODY?.addEventListener('dblclick', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('.opx-bulk-cb')) return;
      const row = target.closest('tr[data-opx-order-id]');
      if (!(row instanceof HTMLElement)) return;
      const orderId = row.getAttribute('data-opx-order-id');
      if (!orderId) return;
      openOrderModalById(orderId);
    });
    ORDER_MODAL_CLOSE?.addEventListener('click', closeOrderModal);
    window.addEventListener('resize', () => {
      if (ORDER_MODAL instanceof HTMLElement && !ORDER_MODAL.hidden && ORDER_MODAL.classList.contains('is-open')) {
        scheduleOrderModalPanelsHeightSync();
      }
    });
    MODAL_SAVE_BTN?.addEventListener('click', () => {
      void saveOrderModalChanges().catch((e) => {
        console.error(e);
        showToast('Не удалось выполнить сохранение');
      });
    });
    MODAL_CANCEL_BTN?.addEventListener('click', closeOrderModal);
    MODAL_RESCHEDULE_BTN?.addEventListener('click', () => {
      if (state.creatingOrder) return;
      const cmp = readOrderModalDeliveryCompare();
      if (!cmp.ok) {
        showToast('Заполните дату доставки и интервал');
        return;
      }
      if (!cmp.rescheduleOrSlot) {
        showToast('Сначала измените дату доставки или интервал');
        return;
      }
      openOrderReasonOverlay('reschedule');
    });
    MODAL_CANCEL_ORDER_BTN?.addEventListener('click', () => {
      if (state.creatingOrder) return;
      const orderNow = getActiveOrder();
      if (!orderNow) return;
      if (String(orderNow.status || '').trim().toLowerCase() === 'cancelled') {
        showToast('Заказ уже отменён');
        return;
      }
      openOrderReasonOverlay('cancel');
    });
    MODAL_DELETE_ORDER_BTN?.addEventListener('click', () => {
      if (state.creatingOrder) return;
      if (!getActiveOrder()) return;
      openOrderReasonOverlay('delete');
    });
    ORDER_REASON_DISMISS?.addEventListener('click', () => closeOrderReasonOverlay());
    ORDER_REASON_CONFIRM?.addEventListener('click', async () => {
      const intent = orderReasonOverlayIntent;
      const ta = ORDER_REASON_TEXT;
      const raw = ta instanceof HTMLTextAreaElement ? ta.value.trim() : '';
      const reasonCheck = opxLimits()?.validateChangeReason?.(raw, true);
      if (reasonCheck && !reasonCheck.ok) {
        showToast(reasonCheck.message, 3200, 'error');
        if (ta instanceof HTMLTextAreaElement) ta.focus();
        return;
      }
      const reasonVal = reasonCheck?.value ?? raw;
      closeOrderReasonOverlay();
      if (MODAL_STATUS instanceof HTMLSelectElement && intent === 'cancel') {
        MODAL_STATUS.value = 'cancelled';
      }
      if (intent === 'cancel') await saveOrderModalChanges({ injectedReason: reasonVal, forceCancelled: true });
      else if (intent === 'reschedule') await saveOrderModalChanges({ injectedReason: reasonVal });
      else if (intent === 'delete') await deleteOrderFromModal(reasonVal);
    });
    ORDER_REASON_OVERLAY?.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('[data-opx-order-reason-close]')) closeOrderReasonOverlay();
    });
    ORDER_TAB_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = String(btn.getAttribute('data-opx-ord-tab') || 'basic');
        setOrderModalTab(tabId);
        if (tabId === 'journal') {
          if (state.creatingOrder) renderCreateOrderJournalPlaceholder();
          else {
            const order = getActiveOrder();
            if (order) renderOrderJournal(order);
          }
        }
      });
    });
    ORDER_NOTES_ADD?.addEventListener('click', () => {
      if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
      const nid = newOperatorNoteUid();
      const ix = ORDER_NOTES_TBODY.querySelectorAll('tr[data-note-id]').length + 1;
      ORDER_NOTES_TBODY.insertAdjacentHTML(
        'beforeend',
        buildOrderNotesRowMarkup(ix, { id: nid, noteType: 'simple', text: '' })
      );
      refreshOrderNotesPreviews();
      renumberOrderNotesRows();
      const row = ORDER_NOTES_TBODY.querySelector(`tr[data-note-id="${nid}"]`);
      const ta = row?.querySelector('textarea[data-opx-note-info]');
      if (ta instanceof HTMLTextAreaElement) ta.focus();
    });
    ORDER_NOTES_DELETE?.addEventListener('click', () => {
      if (!(ORDER_NOTES_TBODY instanceof HTMLElement)) return;
      const id = selectedOrderNoteRowId;
      if (!id) {
        showToast('Выберите заметку в списке', 2800, 'info');
        return;
      }
      removeOperatorClientNoteById(id);
      showToast('Заметка удалена', 2400, 'success');
    });
    ORDER_NOTES_TBODY?.addEventListener('click', (e) => {
      const tr =
        e.target instanceof HTMLElement ? e.target.closest('tr[data-note-id]') : null;
      if (!(tr instanceof HTMLElement)) return;
      setOrderNotesSelectedRow(tr);
    });
    ORDER_NOTES_TBODY?.addEventListener('input', () => refreshOrderNotesPreviews());
    ORDER_NOTES_TBODY?.addEventListener('change', (e) => {
      if (!(e.target instanceof HTMLSelectElement)) return;
      if (!e.target.hasAttribute('data-opx-note-type')) return;
      const row = e.target.closest('tr[data-note-id]');
      const ta = row instanceof HTMLElement ? row.querySelector('textarea[data-opx-note-info]') : null;
      const v = e.target.value || 'simple';
      if (ta instanceof HTMLTextAreaElement) ta.setAttribute('placeholder', `${operatorNoteTypeLabel(v)}: `);
      refreshOrderNotesPreviews();
    });
    ORDER_NOTES_DOCK_DETAILS?.addEventListener('click', () => {
      orderNotesVisitedThisOpen = true;
      setOrderModalTab('notes');
    });
    ORDER_NOTES_DOCK_LIST?.addEventListener('click', (e) => {
      const btn =
        e.target instanceof HTMLElement ? e.target.closest('[data-opx-note-dismiss]') : null;
      if (!(btn instanceof HTMLButtonElement)) return;
      e.preventDefault();
      removeOperatorClientNoteById(btn.getAttribute('data-opx-note-dismiss') || '');
    });
    ORDER_CART_WATER_BTN?.addEventListener('click', (event) => {
      event.preventDefault();
      applyOrderCartWaterQuick();
    });
    ORDER_CART_ADD_BTN?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleOrderCartCatalogPicker();
    });
    ORDER_CART_CATALOG_PICKER?.addEventListener('click', (event) => {
      const target = event.target;
      const btn = target instanceof Element ? target.closest('[data-opx-cart-pick-product]') : null;
      if (!(btn instanceof HTMLButtonElement)) return;
      event.preventDefault();
      const title = btn.getAttribute('data-opx-cart-pick-name') || '';
      const rawId = btn.getAttribute('data-opx-cart-pick-product') || '';
      const product_id = /^\d+$/.test(rawId) ? Number(rawId) : null;
      applyOrderCartCatalogPick(title, product_id);
      hideOrderCartCatalogPicker();
      setOrderModalTab('goods');
    });
    document.addEventListener('click', (event) => {
      if (!(ORDER_CART_CATALOG_PICKER instanceof HTMLElement) || ORDER_CART_CATALOG_PICKER.hidden) return;
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (ORDER_CART_CATALOG_PICKER.contains(t) || ORDER_CART_ADD_BTN?.contains(t)) return;
      if (t instanceof Element) {
        const productHit = t.closest('[data-opx-cart-product]');
        if (productHit instanceof HTMLElement && ORDER_CART_LIST instanceof HTMLElement && ORDER_CART_LIST.contains(productHit)) {
          return;
        }
      }
      hideOrderCartCatalogPicker();
    });
    ORDER_CART_LIST?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const productBtn = target.closest('[data-opx-cart-product]');
      if (productBtn instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopPropagation();
        const row = productBtn.closest('[data-opx-cart-line]');
        const index = row instanceof HTMLElement ? Number(row.getAttribute('data-opx-cart-line')) : NaN;
        if (
          ORDER_CART_CATALOG_PICKER instanceof HTMLElement &&
          !ORDER_CART_CATALOG_PICKER.hidden &&
          orderCartCatalogPickLineIndex === index
        ) {
          hideOrderCartCatalogPicker();
        } else {
          openOrderCartCatalogPicker(Number.isFinite(index) ? index : null, productBtn);
        }
        return;
      }
      const removeBtn = target.closest('[data-opx-cart-remove]');
      if (removeBtn instanceof HTMLButtonElement) {
        const row = removeBtn.closest('[data-opx-cart-line]');
        const index = row instanceof HTMLElement ? Number(row.getAttribute('data-opx-cart-line')) : NaN;
        const lines = readOrderModalCartFromDom();
        if (lines.length <= 1) {
          showToast('В заказе должен остаться хотя бы один товар');
          return;
        }
        if (Number.isFinite(index)) lines.splice(index, 1);
        else lines.pop();
        setOrderModalCartLines(lines, getActiveOrder());
        return;
      }
    });
    ORDER_CART_LIST?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const row = target.closest('[data-opx-cart-line]');
      if (!(row instanceof HTMLElement)) return;
      const order = getActiveOrder();
      if (target.matches('[data-opx-cart-qty]') && target instanceof HTMLInputElement) {
        const lineRow = target.closest('[data-opx-cart-line]');
        const idEl = lineRow?.querySelector('[data-opx-cart-product-id]');
        const titleEl = lineRow?.querySelector('[data-opx-cart-product-title]');
        let title = products[0] || 'Вода 18.9л';
        if (titleEl instanceof HTMLInputElement && String(titleEl.value || '').trim()) {
          title = normalizeProductName(titleEl.value, idEl instanceof HTMLInputElement ? Number(idEl.value) || null : null);
        }
        const qty = Math.min(50, Math.max(1, Number(target.value) || 1));
        target.value = String(qty);
        const priceEl = lineRow?.querySelector('[data-opx-cart-price]');
        const catRow = findCatalogRowByName(title);
        if (priceEl instanceof HTMLInputElement && catRow?.water) {
          priceEl.value = String(order ? getDefaultPriceForOrder(order, title, qty) : baseUnitPrice(title, qty));
        }
      }
      refreshOrderCartLineSum(row);
      updateGoodsSumPreview();
    });
    ORDER_CART_LIST?.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches('[data-opx-cart-qty], [data-opx-cart-price]')) return;
      const row = target.closest('[data-opx-cart-line]');
      if (row instanceof HTMLElement) refreshOrderCartLineSum(row);
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
        if (btn.disabled) return;
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
    MODAL_DELIVERY_DATE?.addEventListener('change', () => {
      updateQuickDateButtons();
    });
    MODAL_CLIENT?.addEventListener('input', () => {
      if (state.creatingOrder) scheduleModalClientSuggestRefresh();
      orderNotesMigrateStorageWhenIdentityChanges();
    });
    MODAL_PHONE?.addEventListener('input', () => {
      if (state.creatingOrder) {
        const dig = normalizePhoneRuDigits(MODAL_PHONE instanceof HTMLInputElement ? MODAL_PHONE.value : '');
        if (!dig || state.clientRepeatAppliedKey !== `phone:${dig}`) state.clientRepeatAppliedKey = '';
        scheduleModalClientSuggestRefresh();
        if (dig.length === 11) tryAutoFillClientRepeatOrder();
      }
      orderNotesMigrateStorageWhenIdentityChanges();
    });
    MODAL_PHONE?.addEventListener('blur', () => {
      if (state.creatingOrder) tryAutoFillClientRepeatOrder();
    });
    MODAL_ADDRESS?.addEventListener('input', () => {
      if (state.creatingOrder) scheduleModalClientSuggestRefresh();
    });
    MODAL_CLIENT?.addEventListener('focus', () => {
      if (state.creatingOrder) scheduleModalClientSuggestRefresh();
    });
    MODAL_CLIENT?.addEventListener('blur', () => {
      window.setTimeout(() => {
        const ae = document.activeElement;
        if (!(CLIENT_SUGGEST instanceof HTMLElement)) return;
        if (ae instanceof Node && CLIENT_SUGGEST.contains(ae)) return;
        hideModalClientSuggest();
      }, 220);
    });
    MODAL_CLIENT?.addEventListener('keydown', (e) => {
      if (!(CLIENT_SUGGEST instanceof HTMLElement) || CLIENT_SUGGEST.hidden) return;
      if (!state.creatingOrder) return;
      const itemBtns = CLIENT_SUGGEST.querySelectorAll('[data-opx-modal-client-i]');
      const navKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
      if (navKeys.includes(e.key)) e.stopPropagation();
      if (!itemBtns.length) {
        if (e.key === 'Escape') {
          e.preventDefault();
          hideModalClientSuggest();
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIdx = itemBtns.length - 1;
        modalClientSuggestActiveIdx =
          modalClientSuggestActiveIdx < 0 ? 0 : Math.min(modalClientSuggestActiveIdx + 1, maxIdx);
        modalClientSuggestSetActiveHighlight();
        itemBtns[modalClientSuggestActiveIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        modalClientSuggestActiveIdx =
          modalClientSuggestActiveIdx <= 0 ? 0 : modalClientSuggestActiveIdx - 1;
        modalClientSuggestSetActiveHighlight();
        itemBtns[modalClientSuggestActiveIdx]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        if (modalClientSuggestActiveIdx >= 0 && modalClientSuggestActiveIdx < modalClientSuggestList.length) {
          e.preventDefault();
          modalClientSuggestPickIndex(modalClientSuggestActiveIdx);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideModalClientSuggest();
      }
    });
    CLIENT_SUGGEST?.addEventListener('mousedown', (e) => {
      const bt =
        e.target instanceof Element
          ? e.target.closest('[data-opx-modal-client-i], [data-opx-modal-client-new]')
          : null;
      if (!(bt instanceof HTMLElement)) return;
      e.preventDefault();
      if (bt.hasAttribute('data-opx-modal-client-new')) {
        modalClientSuggestChooseCreateNew();
        return;
      }
      const rawIdx = bt.getAttribute('data-opx-modal-client-i');
      const idx = rawIdx != null ? Number(rawIdx) : NaN;
      if (Number.isFinite(idx)) modalClientSuggestPickIndex(idx);
    });
    document.addEventListener('mousedown', modalClientSuggestDismissOutside, true);
    OPEN_CLIENT_CARD_BTN?.addEventListener('click', openClientCardModal);
    CLIENT_CARD_CLOSE?.addEventListener('click', closeClientCardModal);
    CLIENT_CARD_CANCEL?.addEventListener('click', closeClientCardModal);
    CLIENT_CARD_SAVE?.addEventListener('click', saveClientCardChanges);
    CLIENT_CARD_TAB_BTNS.forEach((btn) => {
      btn.addEventListener('click', () => {
        setClientCardTab(String(btn.getAttribute('data-opx-cc-tab') || 'client'));
      });
    });
    OPEN_CLIENT_MAP_BTN?.addEventListener('click', () => {
      state.clientMapApplyTarget = 'client';
      openClientMapModal();
    });
    CLIENT_MAP_CLOSE?.addEventListener('click', closeClientMapModal);
    CLIENT_MAP_CANCEL?.addEventListener('click', closeClientMapModal);
    CLIENT_MAP_APPLY?.addEventListener('click', () => {
      void (async () => {
        const pre = validateClientMapAddressSync();
        if (!pre.ok) {
          showToast(pre.error, 3600, 'error');
          return;
        }
        const streetOk = await validateStreetInOrenburg(pre.street);
        if (!streetOk) {
          showToast('Улица не найдена в Оренбурге. Выберите из списка подсказок.', 3800, 'error');
          return;
        }
        if (!state.mapSelectedCoords) {
          await searchOnClientMap();
        }
        if (!state.mapSelectedCoords) {
          showToast('Не удалось найти дом на карте. Проверьте улицу и номер дома.', 3800, 'error');
          return;
        }
        const address = composeAddressFromFields();
        if (!address) {
          showToast('Заполните адрес доставки.', 3200, 'error');
          return;
        }
        state.mapSelectedAddress = address;
        if (CLIENT_MAP_SELECTED instanceof HTMLElement) CLIENT_MAP_SELECTED.textContent = address;
        rememberZoneAddressCoords(address, state.mapSelectedCoords.lat, state.mapSelectedCoords.lon, getActiveOrder()?.id);
        if (state.creatingOrder) {
          if (MODAL_ADDRESS instanceof HTMLInputElement) MODAL_ADDRESS.value = address;
          if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) CLIENT_ADDRESS_INPUT.value = address;
          scheduleModalClientSuggestRefresh();
        } else if (CLIENT_ADDRESS_INPUT instanceof HTMLInputElement) {
          CLIENT_ADDRESS_INPUT.value = address;
        }
        closeClientMapModal();
      })();
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
      clientMapCtl?.clearMarker?.();
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
      if (target.closest('[data-opx-modal-close="backdrop"]')) closeOrderModal();
    });
    CLIENT_CARD_MODAL?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-opx-client-close="backdrop"]')) closeClientCardModal();
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
      if (target.closest('[data-opx-map-close="backdrop"]')) closeClientMapModal();
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
      if (ORDER_REASON_OVERLAY instanceof HTMLElement && !ORDER_REASON_OVERLAY.hidden) {
        closeOrderReasonOverlay();
        event.preventDefault();
        return;
      }
      if (filtersModalOpen && FILTERS_MODAL instanceof HTMLElement && !FILTERS_MODAL.hidden) {
        closeFiltersModal();
        event.preventDefault();
        return;
      }
      if (
        state.creatingOrder &&
        CLIENT_SUGGEST instanceof HTMLElement &&
        !CLIENT_SUGGEST.hidden &&
        CLIENT_SUGGEST.innerHTML.trim()
      ) {
        hideModalClientSuggest();
        event.preventDefault();
        return;
      }
      if (ORDER_MODAL instanceof HTMLElement && !ORDER_MODAL.hidden) closeOrderModal();
    });
    rebuildUiDriverSelectsFromMerged();
    syncAdvSlotButtonsFromState();
    syncAdvDriverSelectFromState();
  }

  async function init() {
    resetOperatorChromeOnBoot();
    if (window.EkvalineMaps && typeof window.EkvalineMaps.prefetch === 'function') {
      window.EkvalineMaps.prefetch();
    }
    if (CLIENT_MAP_CANVAS instanceof HTMLElement) {
      const warmClientMap = () => {
        void ensureClientMap();
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(warmClientMap, { timeout: 3000 });
      } else {
        window.setTimeout(warmClientMap, 800);
      }
    }

    const hydratePromise = (async () => {
      try {
        await window.EkvalineAPI?.awaitBootReconciliation?.();
      } catch {
        /* ignore */
      }
      await hydrateStaffFromServerSession();
    })();

    await hydratePromise;
    if (!ensureAccess()) return;

    bind();
    state.date = isoDate(new Date());
    if (DATE instanceof HTMLInputElement) DATE.value = state.date;
    syncDayPresetHighlightsFromState();

    renderOrdersPlaceholder('Загрузка заказов…');

    try {
      await Promise.all([
        hydratePromise,
        loadOrders(),
        loadOperatorCatalogFromApi(),
        loadBookingAvailabilityFromServer(),
      ]);
    } catch {
      emptyOrdersFallback();
      showToast('Сбой при загрузке — проверьте консоль или сеть.');
    }
    if (!ensureAccess()) return;
    applyFilters();
    /** На выбранный день нет строк — снимаем ограничение по дате. */
    if (state.orders.length > 0 && state.filtered.length === 0 && String(state.date || '').trim()) {
      state.date = '';
      if (DATE instanceof HTMLInputElement) DATE.value = '';
      syncDayPresetHighlightsFromState();
      applyFilters();
      showToast('Нет заказов на выбранную дату доставки — включён показ всех дней.');
    }
    render();
    startOrdersAutoRefresh();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      void pollOrdersForRealtime();
      void refreshOperatorDriverChoices();
    }
  });

  window.addEventListener('pagehide', stopOrdersAutoRefresh);

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
})();
