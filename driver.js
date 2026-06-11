(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_AUTO_REFRESH_MS = 12000;

  const loginCard = document.getElementById('drvLoginCard');
  const mainCard = document.getElementById('drvMainCard');
  const loginForm = document.getElementById('drvLoginForm');
  const loginError = document.getElementById('drvLoginError');
  const userMeta = document.getElementById('drvUserMeta');
  const hint = document.getElementById('drvHint');
  const listEl = document.getElementById('drvOrdersList');
  const statsEl = document.getElementById('drvStats');
  const syncEl = document.getElementById('drvSyncAt');
  const refreshBtn = document.getElementById('drvRefreshBtn');
  const logoutBtn = document.getElementById('drvLogoutBtn');
  const toastEl = document.getElementById('drvToast');
  const toastText = document.getElementById('drvToastText');
  const confirmModal = document.getElementById('drvConfirmModal');
  const confirmTitle = document.getElementById('drvConfirmTitle');
  const confirmMessage = document.getElementById('drvConfirmMessage');
  const confirmOkBtn = document.getElementById('drvConfirmOkBtn');
  const confirmCancelBtn = document.getElementById('drvConfirmCancelBtn');

  const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;

  let toastTimer = null;
  let ordersPollTimer = null;
  let ordersSyncUnsub = null;
  let lastOrdersSignature = '';
  let ordersRefreshing = false;
  let confirmResolve = null;
  let currentDriverOrders = [];
  let lastMarkedDeliveredId = '';
  let driverRouteDay = '';

  function normalizeCredential(raw) {
    return String(raw || '').trim();
  }

  function readLocalUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveLocalUser(u) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
  }

  function clearLocalUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
    try {
      localStorage.removeItem('ekvaline_users');
    } catch {
      /* ignore */
    }
  }

  function showToast(text) {
    if (!(toastText instanceof HTMLElement) || !(toastEl instanceof HTMLElement)) return;
    toastText.textContent = String(text || '');
    toastEl.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  function closeDrvConfirm(result) {
    if (confirmModal instanceof HTMLElement) {
      confirmModal.hidden = true;
      confirmModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drv-confirm-open');
    }
    if (confirmResolve) {
      const done = confirmResolve;
      confirmResolve = null;
      done(Boolean(result));
    }
  }

  function showDrvConfirm(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const title = String(opts.title || 'Подтверждение');
    const message = String(opts.message || '');
    const okLabel = String(opts.okLabel || 'Да, доставлен');
    const cancelLabel = String(opts.cancelLabel || 'Отмена');

    if (!(confirmModal instanceof HTMLElement)) {
      return Promise.resolve(window.confirm(message || title));
    }

    return new Promise((resolve) => {
      confirmResolve = resolve;
      if (confirmTitle instanceof HTMLElement) confirmTitle.textContent = title;
      if (confirmMessage instanceof HTMLElement) confirmMessage.textContent = message;
      if (confirmOkBtn instanceof HTMLButtonElement) confirmOkBtn.textContent = okLabel;
      if (confirmCancelBtn instanceof HTMLButtonElement) confirmCancelBtn.textContent = cancelLabel;
      confirmModal.hidden = false;
      confirmModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drv-confirm-open');
      window.requestAnimationFrame(() => {
        if (confirmOkBtn instanceof HTMLButtonElement) confirmOkBtn.focus();
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(n) {
    const v = Number(n) || 0;
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 1 }).format(
      v
    );
  }

  function formatRuDate(isoLike) {
    const s = String(isoLike || '').trim().slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return '—';
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  function todayIsoLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Только маршрут на сегодня; отменённые и вчерашние не показываем. */
  function filterOrdersForDriverRoute(orders, routeDay) {
    const day = String(routeDay || driverRouteDay || todayIsoLocal()).trim().slice(0, 10);
    return (Array.isArray(orders) ? orders : []).filter((o) => {
      const st = String(o.status || '').trim().toLowerCase();
      if (st === 'cancelled') return false;
      const od = String(o.delivery_date || '').trim().slice(0, 10);
      if (od && od !== day) return false;
      return true;
    });
  }

  function syncDriverRouteDay(routeDay) {
    const next = String(routeDay || todayIsoLocal()).trim().slice(0, 10);
    if (driverRouteDay && driverRouteDay !== next) {
      lastOrdersSignature = '';
      currentDriverOrders = [];
    }
    driverRouteDay = next;
    return next;
  }

  function parseProductLine(itemsJson) {
    try {
      const arr = JSON.parse(itemsJson || '[]');
      if (!Array.isArray(arr) || !arr.length) return '—';
      return arr.map((it) => `${it.qty}× ${String(it.title || '').trim()}`).join('; ');
    } catch {
      return '—';
    }
  }

  function phoneDigits(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 11 && d.startsWith('8')) return `7${d.slice(1)}`;
    if (d.length === 10) return `7${d}`;
    return d;
  }

  function mapsUrlForAddress(addr) {
    const q = String(addr || '').trim();
    if (!q) return '';
    return `https://yandex.ru/maps/?text=${encodeURIComponent(q)}`;
  }

  const STATUS_LABEL = {
    new: 'Новый',
    pending_operator: 'У оператора',
    confirmed: 'Подтверждён',
    processing: 'В работе',
    courier: 'Передан курьеру',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };

  /** Жёлтая подсветка — заказ уже в доставке у водителя. */
  const DRIVER_ON_ROUTE_STATUSES = new Set(['courier', 'on_way', 'processing']);

  function orderCardTone(status) {
    const st = String(status || '');
    if (st === 'delivered') return 'done';
    if (DRIVER_ON_ROUTE_STATUSES.has(st)) return 'way';
    return 'wait';
  }

  function compareOrdersForDriverList(a, b) {
    const toneRank = { way: 0, wait: 1, done: 2 };
    const ta = toneRank[orderCardTone(a.status)] ?? 1;
    const tb = toneRank[orderCardTone(b.status)] ?? 1;
    if (ta !== tb) return ta - tb;
    if (ta === 2 && tb === 2) {
      const ua = Number(a.updated_at ? new Date(a.updated_at).getTime() : 0);
      const ub = Number(b.updated_at ? new Date(b.updated_at).getTime() : 0);
      if (ua !== ub) return ua - ub;
      return Number(a.id) - Number(b.id);
    }
    const td = String(a.delivery_date || '').localeCompare(String(b.delivery_date || ''));
    if (td !== 0) return td;
    const ca = Number(a.created_at ? new Date(a.created_at).getTime() : 0);
    const cb = Number(b.created_at ? new Date(b.created_at).getTime() : 0);
    if (cb !== ca) return cb - ca;
    return Number(b.id) - Number(a.id);
  }

  function ordersListSignature(orders) {
    if (!Array.isArray(orders) || !orders.length) return 'empty';
    return orders
      .map((o) => `${o.id}:${String(o.status || '')}:${String(o.updated_at || '')}`)
      .join('|');
  }

  function setSyncLabel() {
    if (!(syncEl instanceof HTMLElement)) return;
    const now = new Date();
    const t = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    syncEl.textContent = `Обновлено в ${t}.`;
  }

  function renderStats(orders) {
    if (!(statsEl instanceof HTMLElement)) return;
    const way = orders.filter((o) => orderCardTone(o.status) === 'way').length;
    const done = orders.filter((o) => orderCardTone(o.status) === 'done').length;
    const wait = orders.filter((o) => orderCardTone(o.status) === 'wait').length;
    statsEl.innerHTML = `
      <div class="drv-stat drv-stat--way"><span class="drv-stat-num">${way}</span><span class="drv-stat-lbl">в пути</span></div>
      <div class="drv-stat drv-stat--wait"><span class="drv-stat-num">${wait}</span><span class="drv-stat-lbl">ожидают</span></div>
      <div class="drv-stat drv-stat--done"><span class="drv-stat-num">${done}</span><span class="drv-stat-lbl">сдано</span></div>`;
  }

  function buildDriverOrderCardHtml(o) {
    const st = String(o.status || '');
    const tone = orderCardTone(st);
    const stLabel = STATUS_LABEL[st] || st || '—';
    const idStr = String(o.id);
    const freshDone = tone === 'done' && idStr === lastMarkedDeliveredId;
    const phoneRaw = String(o.phone || '').trim();
    const tel = phoneDigits(phoneRaw);
    const phoneHtml = tel
      ? `<a class="drv-order-phone" href="tel:+${escapeHtml(tel)}">${escapeHtml(phoneRaw || `+${tel}`)}</a>`
      : `<span class="drv-order-phone drv-order-phone--muted">Телефон не указан</span>`;
    const addr = String(o.address || '').trim();
    const mapUrl = mapsUrlForAddress(addr);
    const addrHtml = mapUrl
      ? `<a class="drv-order-addr" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(addr)}</a>`
      : `<p class="drv-order-addr">${escapeHtml(addr || '—')}</p>`;
    const badgeClass =
      tone === 'way' ? 'drv-order-badge--way' : tone === 'done' ? 'drv-order-badge--done' : 'drv-order-badge--wait';
    const badgeText = tone === 'way' ? 'В пути' : tone === 'done' ? 'Доставлен' : 'Ожидает';
    const doneBtn =
      tone === 'done'
        ? ''
        : `<button type="button" class="drv-btn drv-btn-done" data-drv-done="${escapeHtml(idStr)}">
            Доставлен
          </button>`;
    const note = String(o.courier_note || '').trim();
    const noteHtml = note
      ? `<p class="drv-order-note"><span class="drv-order-note-lbl">Комментарий:</span> ${escapeHtml(note)}</p>`
      : '';
    const footClass = tone === 'done' ? 'drv-order-card__foot drv-order-card__foot--done' : 'drv-order-card__foot';
    const footInner =
      tone === 'done'
        ? `<span class="drv-order-sum">${formatMoney(o.total_sum)} ₽</span>
           <span class="drv-order-done-mark">✓ ${escapeHtml(stLabel)}</span>`
        : `<span class="drv-order-sum">${formatMoney(o.total_sum)} ₽</span>
           <span class="drv-order-status-text">${escapeHtml(stLabel)}</span>
           ${doneBtn}`;

    return `
      <article class="drv-order-card drv-order-card--${tone}${freshDone ? ' drv-order-card--fresh-done' : ''}" role="listitem" data-order-id="${escapeHtml(idStr)}" data-order-tone="${tone}">
        <header class="drv-order-card__head">
          <span class="drv-order-id">№ ${escapeHtml(idStr)}</span>
          <span class="drv-order-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
        </header>
        <p class="drv-order-client">${escapeHtml(o.client || 'Клиент')}</p>
        ${phoneHtml}
        ${addrHtml}
        <dl class="drv-order-facts">
          <div><dt>Дата</dt><dd>${escapeHtml(formatRuDate(o.delivery_date))}</dd></div>
          <div><dt>Интервал</dt><dd>${escapeHtml(String(o.delivery_slot || '—'))}</dd></div>
          <div class="drv-order-facts--wide"><dt>Товар</dt><dd>${escapeHtml(parseProductLine(o.items_json))}</dd></div>
        </dl>
        ${noteHtml}
        <footer class="${footClass}">
          ${footInner}
        </footer>
      </article>`;
  }

  function buildSectionHtml(title, caption, rows, extraClass) {
    if (!rows.length) return '';
    const cards = rows.map(buildDriverOrderCardHtml).join('');
    return `
      <section class="drv-section ${extraClass || ''}">
        <header class="drv-section__head">
          <h2 class="drv-section__title">${escapeHtml(title)}</h2>
          <p class="drv-section__caption">${escapeHtml(caption)}</p>
        </header>
        <div class="drv-section__list">${cards}</div>
      </section>`;
  }

  function renderOrdersList(orders) {
    if (!(listEl instanceof HTMLElement)) return;
    const sorted = [...orders].sort(compareOrdersForDriverList);
    const way = sorted.filter((o) => orderCardTone(o.status) === 'way');
    const wait = sorted.filter((o) => orderCardTone(o.status) === 'wait');
    const done = sorted.filter((o) => orderCardTone(o.status) === 'done');

    const parts = [];
    if (way.length) {
      parts.push(
        buildSectionHtml(
          'В пути',
          'Заказ у вас на доставке — после вручения клиенту нажмите «Доставлен».',
          way,
          'drv-section--way'
        )
      );
    }
    if (wait.length) {
      parts.push(
        buildSectionHtml(
          'Ожидают этапа',
          'Назначены на вас, но ещё у оператора или в подготовке.',
          wait,
          'drv-section--wait'
        )
      );
    }
    if (done.length) {
      parts.push(
        buildSectionHtml(
          'Доставлены',
          'Внизу списка — уже выполненные заказы (зелёная подсветка).',
          done,
          'drv-section--done'
        )
      );
    }
    listEl.innerHTML = parts.join('');
    renderStats(sorted);
    setSyncLabel();
    if (lastMarkedDeliveredId) {
      const card = listEl.querySelector(`[data-order-id="${CSS.escape(lastMarkedDeliveredId)}"]`);
      if (card instanceof HTMLElement) {
        window.requestAnimationFrame(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
      window.setTimeout(() => {
        lastMarkedDeliveredId = '';
      }, 900);
    }
  }

  function applyDeliveredLocally(restId, serverOrder) {
    const idStr = String(restId);
    const idx = currentDriverOrders.findIndex((o) => String(o.id) === idStr);
    if (idx >= 0) {
      currentDriverOrders[idx] = {
        ...currentDriverOrders[idx],
        ...(serverOrder && typeof serverOrder === 'object' ? serverOrder : {}),
        status: 'delivered',
        updated_at: serverOrder?.updated_at || new Date().toISOString(),
      };
    }
    lastMarkedDeliveredId = idStr;
    lastOrdersSignature = ordersListSignature(currentDriverOrders);
    renderOrdersList(currentDriverOrders);
  }

  function stopOrdersAutoRefresh() {
    if (ordersPollTimer) {
      window.clearInterval(ordersPollTimer);
      ordersPollTimer = null;
    }
    if (typeof ordersSyncUnsub === 'function') {
      ordersSyncUnsub();
      ordersSyncUnsub = null;
    }
  }

  function startOrdersAutoRefresh() {
    stopOrdersAutoRefresh();
    ordersPollTimer = window.setInterval(() => {
      if (document.hidden) return;
      void refreshOrdersUi({ silent: true });
    }, ORDERS_AUTO_REFRESH_MS);
    if (typeof window.EkvalineOrdersSync?.subscribeOrdersDataChanged === 'function') {
      ordersSyncUnsub = window.EkvalineOrdersSync.subscribeOrdersDataChanged(() => {
        if (mainCard instanceof HTMLElement && !mainCard.hidden) {
          lastOrdersSignature = '';
          void refreshOrdersUi({ silent: true });
        }
      });
    }
  }

  function uiShowLogin() {
    stopOrdersAutoRefresh();
    if (loginCard instanceof HTMLElement) loginCard.hidden = false;
    if (mainCard instanceof HTMLElement) mainCard.hidden = true;
    if (userMeta instanceof HTMLElement) userMeta.hidden = true;
    if (refreshBtn instanceof HTMLElement) refreshBtn.hidden = true;
    if (logoutBtn instanceof HTMLElement) logoutBtn.hidden = true;
  }

  function uiShowMain(displayName) {
    if (loginCard instanceof HTMLElement) loginCard.hidden = true;
    if (mainCard instanceof HTMLElement) mainCard.hidden = false;
    if (userMeta instanceof HTMLElement) {
      userMeta.hidden = false;
      userMeta.textContent = displayName;
    }
    if (refreshBtn instanceof HTMLElement) refreshBtn.hidden = false;
    if (logoutBtn instanceof HTMLElement) logoutBtn.hidden = false;
    startOrdersAutoRefresh();
  }

  async function hydrateSessionFromServer() {
    if (!api) return null;
    const me = await api.json('/api/auth/me');
    if (!me.ok || !me.data?.user) return null;
    const u = me.data.user;
    saveLocalUser(u);
    return u;
  }

  async function refreshOrdersUi(opts) {
    const silent = Boolean(opts && opts.silent);
    if (!(listEl instanceof HTMLElement)) return;
    if (ordersRefreshing) return;
    ordersRefreshing = true;
    try {
      if (!api) {
        listEl.innerHTML = `<p class="drv-empty">Нет связи с сервером (api-client).</p>`;
        return;
      }
      if (!silent && refreshBtn instanceof HTMLButtonElement) refreshBtn.disabled = true;

      const r = await api.json('/api/driver/orders');
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          clearLocalUser();
          if (r.data?.sessionExpired) {
            window.location.href = 'index.html?session-expired=1';
            return;
          }
          uiShowLogin();
        }
        listEl.innerHTML = `<p class="drv-empty">${escapeHtml(
          String(r.data?.error || 'Не удалось загрузить заказы.')
        )}</p>`;
        if (statsEl instanceof HTMLElement) statsEl.innerHTML = '';
        return;
      }

      const w = String(r.data?.warn || '').trim();
      const routeDay = syncDriverRouteDay(r.data?.route_day || todayIsoLocal());
      if (hint instanceof HTMLElement) {
        hint.textContent = w
          ? w
          : `Сегодня ${formatRuDate(routeDay)}. Жёлтым — в пути, зелёным — доставлен. Вчерашние и отменённые не показываются.`;
      }

      const list = filterOrdersForDriverRoute(
        Array.isArray(r.data?.orders) ? r.data.orders : [],
        routeDay
      );
      const sig = ordersListSignature(list);
      if (sig === lastOrdersSignature && silent) return;
      lastOrdersSignature = sig;

      if (!list.length) {
        listEl.innerHTML = `<p class="drv-empty">На сегодня заказов нет. Нажмите «Обновить» или подождите — список обновится сам.</p>`;
        if (statsEl instanceof HTMLElement) statsEl.innerHTML = '';
        currentDriverOrders = [];
        setSyncLabel();
        return;
      }

      currentDriverOrders = list;
      renderOrdersList(list);
    } finally {
      ordersRefreshing = false;
      if (refreshBtn instanceof HTMLButtonElement) refreshBtn.disabled = false;
    }
  }

  async function confirmDelivered(restId) {
    if (!api) return;
    const r = await api.json(`/api/driver/orders/${encodeURIComponent(restId)}/mark-delivered`, {
      method: 'POST',
      body: {},
    });
    if (r.ok) {
      window.EkvalineAPI.resetCsrf?.();
      window.EkvalineOrdersSync?.notifyOrdersDataChanged?.();
      applyDeliveredLocally(restId, r.data?.order);
      showToast('Заказ отмечен как доставлен');
      await refreshOrdersUi({ silent: true });
    } else {
      const err = String(r.data?.error || 'Не удалось обновить');
      if (r.status === 404 || /отмен|не найден|не на сегодня/i.test(err)) {
        currentDriverOrders = currentDriverOrders.filter((o) => String(o.id) !== String(restId));
        lastOrdersSignature = ordersListSignature(currentDriverOrders);
        renderOrdersList(currentDriverOrders);
      }
      showToast(err);
    }
  }

  listEl?.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-drv-done]') : null;
    if (!(btn instanceof HTMLButtonElement)) return;
    const id = btn.getAttribute('data-drv-done');
    if (!id) return;
    void (async () => {
      const ok = await showDrvConfirm({
        title: 'Отметить доставку?',
        message: `Заказ №${id} будет отмечен как доставленный. Оператор увидит это в списке.`,
        okLabel: 'Да, доставлен',
        cancelLabel: 'Отмена',
      });
      if (!ok) return;
      btn.disabled = true;
      try {
        await confirmDelivered(id);
      } finally {
        btn.disabled = false;
      }
    })();
  });

  confirmOkBtn?.addEventListener('click', () => closeDrvConfirm(true));
  confirmCancelBtn?.addEventListener('click', () => closeDrvConfirm(false));
  confirmModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('[data-drv-confirm-dismiss="backdrop"]')) closeDrvConfirm(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (confirmModal instanceof HTMLElement && !confirmModal.hidden) {
      event.preventDefault();
      closeDrvConfirm(false);
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    stopOrdersAutoRefresh();
    if (logoutBtn instanceof HTMLButtonElement) logoutBtn.disabled = true;
    try {
      if (api) {
        await api.json('/api/auth/logout', { method: 'POST', body: {} });
        window.EkvalineAPI?.resetCsrf?.();
      }
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.setItem('ekvaline_driver_logout', '1');
    } catch {
      /* ignore */
    }
    clearLocalUser();
    lastOrdersSignature = '';
    window.location.replace(new URL('index.html', window.location.href).href);
  });

  refreshBtn?.addEventListener('click', () => {
    void refreshOrdersUi();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && mainCard && !mainCard.hidden) void refreshOrdersUi({ silent: true });
  });

  loginForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    loginError.textContent = '';
    if (!api || !(loginForm instanceof HTMLFormElement)) {
      loginError.textContent = 'Сервер недоступен. Откройте сайт через npm start.';
      return;
    }
    const cred = normalizeCredential(loginForm.elements.namedItem('credential')?.value || '');
    const pwd = String(loginForm.elements.namedItem('password')?.value || '');
    if (!cred || !pwd) {
      loginError.textContent = 'Введите логин и пароль.';
      return;
    }
    const r = await api.json('/api/auth/login', { method: 'POST', body: { credential: cred, password: pwd } });
    if (!r.ok) {
      loginError.textContent = String(r.data?.error || 'Ошибка входа.');
      return;
    }
    const u = r.data?.user;
    if (!u || String(u.role || '').toLowerCase() !== 'driver') {
      loginError.textContent = 'Эта страница только для аккаунта с ролью «Водитель».';
      return;
    }
    window.EkvalineAPI.resetCsrf?.();
    saveLocalUser(u);
    loginForm.reset();
    const name = String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim();
    uiShowMain(name || u.email);
    await refreshOrdersUi();
  });

  async function boot() {
    if (!api) {
      loginError.textContent = 'Подключите api-client.js и откройте сайт через сервер.';
      return;
    }

    try {
      if (sessionStorage.getItem('ekvaline_driver_logout')) {
        sessionStorage.removeItem('ekvaline_driver_logout');
        uiShowLogin();
        return;
      }
    } catch {
      /* ignore */
    }

    const lu = readLocalUser();
    if (!lu || String(lu.role || '').toLowerCase() !== 'driver') {
      const serverUser = await hydrateSessionFromServer();
      if (serverUser && String(serverUser.role || '').toLowerCase() === 'driver') {
        const name =
          String(serverUser.name || [serverUser.first_name, serverUser.last_name].filter(Boolean).join(' ') || '').trim();
        uiShowMain(name || serverUser.email);
        await refreshOrdersUi();
        return;
      }
      uiShowLogin();
      return;
    }
    const synced = await hydrateSessionFromServer();
    if (!synced || String(synced.role || '').toLowerCase() !== 'driver') {
      uiShowLogin();
      return;
    }
    const name = String(synced.name || [synced.first_name, synced.last_name].filter(Boolean).join(' ') || '').trim();
    uiShowMain(name || synced.email);
    await refreshOrdersUi();
  }

  void boot();
})();
