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

  const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;

  let toastTimer = null;
  let ordersPollTimer = null;
  let lastOrdersSignature = '';
  let ordersRefreshing = false;

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
    syncEl.textContent = `Обновлено в ${t}. Список подтягивается автоматически.`;
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
      st === 'delivered'
        ? ''
        : `<button type="button" class="drv-btn drv-btn-done" data-drv-done="${escapeHtml(String(o.id))}">
            Доставлен
          </button>`;
    const note = String(o.courier_note || '').trim();
    const noteHtml = note
      ? `<p class="drv-order-note"><span class="drv-order-note-lbl">Комментарий:</span> ${escapeHtml(note)}</p>`
      : '';

    return `
      <article class="drv-order-card drv-order-card--${tone}" role="listitem" data-order-id="${escapeHtml(String(o.id))}">
        <header class="drv-order-card__head">
          <span class="drv-order-id">№ ${escapeHtml(String(o.id))}</span>
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
        <footer class="drv-order-card__foot">
          <span class="drv-order-sum">${formatMoney(o.total_sum)} ₽</span>
          <span class="drv-order-status-text">${escapeHtml(stLabel)}</span>
          ${doneBtn}
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
        buildSectionHtml('Доставлены сегодня', 'Отмечены вами или оператором как выполненные.', done, 'drv-section--done')
      );
    }
    listEl.innerHTML = parts.join('');
    renderStats(sorted);
    setSyncLabel();
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
      void refreshOrdersUi({ silent: true });
    }, ORDERS_AUTO_REFRESH_MS);
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
          uiShowLogin();
        }
        listEl.innerHTML = `<p class="drv-empty">${escapeHtml(
          String(r.data?.error || 'Не удалось загрузить заказы.')
        )}</p>`;
        if (statsEl instanceof HTMLElement) statsEl.innerHTML = '';
        return;
      }

      const w = String(r.data?.warn || '').trim();
      if (hint instanceof HTMLElement) {
        hint.textContent = w
          ? w
          : `Сегодня ${formatRuDate(todayIsoLocal())}. Жёлтым — в пути, зелёным — доставлен.`;
      }

      const list = Array.isArray(r.data?.orders) ? r.data.orders : [];
      const sig = ordersListSignature(list);
      if (sig === lastOrdersSignature && silent) return;
      lastOrdersSignature = sig;

      if (!list.length) {
        listEl.innerHTML = `<p class="drv-empty">На сегодня заказов нет. Нажмите «Обновить» или подождите — список обновится сам.</p>`;
        if (statsEl instanceof HTMLElement) statsEl.innerHTML = '';
        setSyncLabel();
        return;
      }

      renderOrdersList(list);
    } finally {
      ordersRefreshing = false;
      if (refreshBtn instanceof HTMLButtonElement) refreshBtn.disabled = false;
    }
  }

  function markCardDeliveredLocally(restId) {
    const card = listEl?.querySelector?.(`[data-order-id="${CSS.escape(String(restId))}"]`);
    if (!(card instanceof HTMLElement)) return;
    card.classList.remove('drv-order-card--way', 'drv-order-card--wait');
    card.classList.add('drv-order-card--done');
    const badge = card.querySelector('.drv-order-badge');
    if (badge instanceof HTMLElement) {
      badge.className = 'drv-order-badge drv-order-badge--done';
      badge.textContent = 'Доставлен';
    }
    const btn = card.querySelector('[data-drv-done]');
    if (btn instanceof HTMLButtonElement) btn.remove();
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
      markCardDeliveredLocally(restId);
      showToast('Заказ отмечен как доставлен');
      await refreshOrdersUi({ silent: false });
    } else showToast(String(r.data?.error || 'Не удалось обновить'));
  }

  listEl?.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-drv-done]') : null;
    if (!(btn instanceof HTMLButtonElement)) return;
    const id = btn.getAttribute('data-drv-done');
    if (!id) return;
    if (!window.confirm(`Отметить заказ №${id} как доставленный?`)) return;
    btn.disabled = true;
    void confirmDelivered(id).finally(() => {
      btn.disabled = false;
    });
  });

  logoutBtn?.addEventListener('click', async () => {
    try {
      if (api) await api.json('/api/auth/logout', { method: 'POST', body: {} });
    } catch {
      /* ignore */
    }
    window.EkvalineAPI.resetCsrf?.();
    clearLocalUser();
    lastOrdersSignature = '';
    if (loginError instanceof HTMLElement) loginError.textContent = '';
    uiShowLogin();
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
