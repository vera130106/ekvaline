(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';

  const loginCard = document.getElementById('drvLoginCard');
  const mainCard = document.getElementById('drvMainCard');
  const loginForm = document.getElementById('drvLoginForm');
  const loginError = document.getElementById('drvLoginError');
  const userMeta = document.getElementById('drvUserMeta');
  const hint = document.getElementById('drvHint');
  const bodyEl = document.getElementById('drvOrdersBody');
  const refreshBtn = document.getElementById('drvRefreshBtn');
  const logoutBtn = document.getElementById('drvLogoutBtn');
  const toastEl = document.getElementById('drvToast');
  const toastText = document.getElementById('drvToastText');

  const api = typeof window.EkvalineAPI?.json === 'function' ? window.EkvalineAPI : null;

  let toastTimer = null;

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
    }, 2200);
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

  function parseProductLine(itemsJson) {
    try {
      const arr = JSON.parse(itemsJson || '[]');
      if (!Array.isArray(arr) || !arr.length) return '—';
      return arr.map((it) => `${it.qty}× ${String(it.title || '').trim()}`).join('; ');
    } catch {
      return '—';
    }
  }

  const STATUS_LABEL = {
    new: 'Новый',
    pending_operator: 'В работе у оператора',
    confirmed: 'Подтверждён',
    processing: 'В работе',
    courier: 'Передан курьеру',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };

  /** Статусы, когда заказ уже в «поле водителя» — показываем блоком сверху и подсветкой строки. */
  const DRIVER_IN_PROGRESS_STATUSES = new Set(['courier', 'on_way', 'processing']);

  function compareOrdersForDriverList(a, b) {
    const ra = DRIVER_IN_PROGRESS_STATUSES.has(String(a.status || '')) ? 0 : 1;
    const rb = DRIVER_IN_PROGRESS_STATUSES.has(String(b.status || '')) ? 0 : 1;
    if (ra !== rb) return ra - rb;
    const td = String(a.delivery_date || '').localeCompare(String(b.delivery_date || ''));
    if (td !== 0) return td;
    const ca = Number(a.created_at ? new Date(a.created_at).getTime() : 0);
    const cb = Number(b.created_at ? new Date(b.created_at).getTime() : 0);
    if (cb !== ca) return cb - ca;
    return Number(b.id) - Number(a.id);
  }

  /** @returns {string} */
  function buildDriverOrderRowsHtml(rows) {
    return rows
      .map((o) => {
        const st = STATUS_LABEL[o.status] || o.status || '—';
        const phone = escapeHtml(o.phone || '—');
        const hot = DRIVER_IN_PROGRESS_STATUSES.has(String(o.status || ''));
        const rowClass = hot ? 'drv-row drv-row--hot' : 'drv-row';
        const tag = hot
          ? `<span class="drv-status-chip" aria-hidden="true">В работе</span>`
          : '';
        return `
        <tr class="${rowClass}">
          <td><strong>#${escapeHtml(String(o.id))}</strong></td>
          <td>${escapeHtml(o.client || '—')}</td>
          <td>${phone}</td>
          <td class="drv-addr">${escapeHtml(String(o.address || ''))}</td>
          <td>${escapeHtml(formatRuDate(o.delivery_date))}</td>
          <td>${escapeHtml(String(o.delivery_slot || '—'))}</td>
          <td>${escapeHtml(parseProductLine(o.items_json))}</td>
          <td>${formatMoney(o.total_sum)} ₽</td>
          <td class="drv-status-cell">${tag}<span class="drv-status-text">${escapeHtml(st)}</span></td>
          <td>
            <button type="button" class="drv-btn drv-btn-sm drv-btn-done" data-drv-done="${escapeHtml(String(o.id))}">
              Доставлен
            </button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function uiShowLogin() {
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
  }

  async function hydrateSessionFromServer() {
    if (!api) return null;
    const me = await api.json('/api/auth/me');
    if (!me.ok || !me.data?.user) return null;
    const u = me.data.user;
    saveLocalUser(u);
    return u;
  }

  async function refreshOrdersUi() {
    if (!(bodyEl instanceof HTMLElement)) return;
    if (!api) {
      bodyEl.innerHTML = `<tr><td colspan="10" class="drv-empty">Нет связи с сервером (api-client).</td></tr>`;
      return;
    }
    const r = await api.json('/api/driver/orders');
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) {
        clearLocalUser();
        uiShowLogin();
      }
      bodyEl.innerHTML = `<tr><td colspan="10" class="drv-empty">${escapeHtml(
        String(r.data?.error || 'Не удалось загрузить заказы.')
      )}</td></tr>`;
      return;
    }
    if (hint instanceof HTMLElement) {
      const w = String(r.data?.warn || '').trim();
      hint.textContent = w ? w : '';
    }
    const list = Array.isArray(r.data?.orders) ? r.data.orders : [];
    if (!list.length) {
      bodyEl.innerHTML = `<tr><td colspan="10" class="drv-empty">Заказов нет на сегодняшний этап доставки.</td></tr>`;
      return;
    }
    const sorted = [...list].sort(compareOrdersForDriverList);
    const inProg = sorted.filter((o) => DRIVER_IN_PROGRESS_STATUSES.has(String(o.status || '')));
    const queued = sorted.filter((o) => !DRIVER_IN_PROGRESS_STATUSES.has(String(o.status || '')));

    const parts = [];
    if (inProg.length) {
      parts.push(`<tr class="drv-section-head" role="presentation">
          <td colspan="10">
            <span class="drv-section-title">В работе у вас</span>
            <span class="drv-section-caption">передано в доставку — по готовности нажмите «Доставлен»</span>
          </td>
        </tr>`);
      parts.push(buildDriverOrderRowsHtml(inProg));
    }
    if (queued.length) {
      parts.push(`<tr class="drv-section-head drv-section-head--queued" role="presentation">
          <td colspan="10">
            <span class="drv-section-title">Назначены на вас, ожидают этапа</span>
            <span class="drv-section-caption">у оператора / подготовка — кнопка «Доставлен» когда фактически отдали клиенту</span>
          </td>
        </tr>`);
      parts.push(buildDriverOrderRowsHtml(queued));
    }
    bodyEl.innerHTML = parts.join('');
  }

  async function confirmDelivered(restId) {
    if (!api) return;
    const r = await api.json(`/api/driver/orders/${encodeURIComponent(restId)}/mark-delivered`, {
      method: 'POST',
      body: {},
    });
    if (r.ok) {
      window.EkvalineAPI.resetCsrf?.();
      showToast('Статус: доставлен');
      await refreshOrdersUi();
    } else showToast(String(r.data?.error || 'Не удалось обновить'));
  }

  bodyEl?.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-drv-done]') : null;
    if (!(btn instanceof HTMLButtonElement)) return;
    const id = btn.getAttribute('data-drv-done');
    if (!id) return;
    if (!window.confirm(`Отметить заказ №${id} как доставленный?`)) return;
    void confirmDelivered(id);
  });

  logoutBtn?.addEventListener('click', async () => {
    try {
      if (api) await api.json('/api/auth/logout', { method: 'POST', body: {} });
    } catch {
      /* ignore */
    }
    window.EkvalineAPI.resetCsrf?.();
    clearLocalUser();
    if (loginError instanceof HTMLElement) loginError.textContent = '';
    uiShowLogin();
  });

  refreshBtn?.addEventListener('click', () => {
    void refreshOrdersUi();
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
