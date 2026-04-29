(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_LOCAL_KEY = 'ekvaline_orders_by_user';
  const ORDERS_BODY = document.getElementById('operatorOrdersBody');
  const DETAILS_ROOT = document.getElementById('operatorDetailsRoot');
  const SEARCH_INPUT = document.getElementById('operatorSearchInput');
  const STATUS_FILTER = document.getElementById('operatorStatusFilter');
  const ORDERS_COUNT = document.getElementById('operatorOrdersCount');
  const REFRESH_BTN = document.getElementById('operatorRefreshBtn');
  const LOGOUT_BTN = document.getElementById('operatorLogoutBtn');
  const TOAST = document.getElementById('operatorToast');
  const TOAST_TEXT = document.getElementById('operatorToastText');
  const STATUS_LABELS = {
    new: 'Новый',
    pending_operator: 'Требует оператора',
    processing: 'В обработке',
    confirmed: 'Подтвержден',
    courier: 'Передан курьеру',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
  };

  const state = {
    orders: [],
    filtered: [],
    activeOrderId: null,
    query: '',
    status: 'all',
    toastTimer: null,
  };

  function readCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function enforceAccess() {
    const user = readCurrentUser();
    const allowed = user && ['operator', 'manager', 'admin'].includes(String(user.role || '').toLowerCase());
    if (!allowed) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function showToast(message, error) {
    if (!(TOAST instanceof HTMLElement) || !(TOAST_TEXT instanceof HTMLElement)) return;
    TOAST_TEXT.textContent = String(message || '');
    TOAST.dataset.variant = error ? 'error' : 'ok';
    TOAST.hidden = false;
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      TOAST.hidden = true;
    }, 2600);
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  }

  function formatCurrency(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0 ₽';
    return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
  }

  function getClientName(order) {
    const first = String(order.first_name || '').trim();
    const last = String(order.last_name || '').trim();
    const joined = `${last} ${first}`.trim();
    return joined || 'Клиент';
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || status || '—';
  }

  function parseItemsCount(order) {
    try {
      const items = JSON.parse(order.items_json || '[]');
      if (!Array.isArray(items)) return 0;
      return items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    } catch {
      return 0;
    }
  }

  function mapLocalOrders() {
    let all = {};
    try {
      all = JSON.parse(localStorage.getItem(ORDERS_LOCAL_KEY) || '{}') || {};
    } catch {
      all = {};
    }
    const out = [];
    Object.keys(all).forEach((uid) => {
      const list = Array.isArray(all[uid]) ? all[uid] : [];
      list.forEach((order, index) => {
        out.push({
          id: Number(index + 1),
          address: order.address || '',
          delivery_date: order.deliveryDate || '',
          delivery_slot: order.deliverySlot || '',
          status: order.status || 'new',
          payment_method: order.paymentDeferred ? 'deferred' : 'cash',
          total_sum: Number(order.total) || 0,
          courier_note: order.comment || '',
          created_at: order.createdAt || new Date().toISOString(),
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          items_json: JSON.stringify(order.items || []),
        });
      });
    });
    return out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async function loadOrders() {
    const api = window.EkvalineAPI;
    if (!api) {
      state.orders = mapLocalOrders();
      return;
    }
    const response = await api.json('/api/orders');
    if (!response.ok) {
      state.orders = mapLocalOrders();
      showToast((response.data && response.data.error) || 'Не удалось загрузить заказы', true);
      return;
    }
    state.orders = Array.isArray(response.data?.orders) ? response.data.orders : [];
  }

  function applyFilters() {
    const q = state.query.toLowerCase().trim();
    state.filtered = state.orders.filter((order) => {
      if (state.status !== 'all' && String(order.status) !== state.status) return false;
      if (!q) return true;
      const haystack = [
        String(order.id || ''),
        getClientName(order),
        String(order.phone || ''),
        String(order.email || ''),
        String(order.address || ''),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    if (!state.filtered.some((item) => String(item.id) === String(state.activeOrderId))) {
      state.activeOrderId = state.filtered[0] ? state.filtered[0].id : null;
    }
  }

  function renderOrders() {
    if (!(ORDERS_BODY instanceof HTMLElement)) return;
    ORDERS_COUNT.textContent = String(state.filtered.length);
    if (!state.filtered.length) {
      ORDERS_BODY.innerHTML = '<tr><td colspan="7" class="operator-empty-cell">Заказов не найдено.</td></tr>';
      return;
    }
    ORDERS_BODY.innerHTML = state.filtered
      .map((order) => {
        const active = String(order.id) === String(state.activeOrderId);
        return `
          <tr data-order-row="${order.id}" class="${active ? 'is-active' : ''}">
            <td>#${order.id}</td>
            <td>${getClientName(order)}</td>
            <td>${String(order.address || '—')}</td>
            <td>${formatDate(order.delivery_date || order.created_at)}</td>
            <td>${String(order.delivery_slot || '—')}</td>
            <td><span class="operator-status is-${String(order.status || '').toLowerCase()}">${statusLabel(order.status)}</span></td>
            <td>${formatCurrency(order.total_sum)}</td>
          </tr>
        `;
      })
      .join('');
  }

  function renderDetails() {
    if (!(DETAILS_ROOT instanceof HTMLElement)) return;
    const order = state.filtered.find((item) => String(item.id) === String(state.activeOrderId));
    if (!order) {
      DETAILS_ROOT.innerHTML = '<p class="operator-empty">Выберите заказ в списке.</p>';
      return;
    }
    DETAILS_ROOT.innerHTML = `
      <div class="operator-client-card">
        <div class="operator-client-head">
          <h2>Клиент</h2>
          <span class="operator-order-id">Заказ #${order.id}</span>
        </div>
        <div class="operator-client-grid">
          <div><small>ФИО</small><strong>${getClientName(order)}</strong></div>
          <div><small>Телефон</small><strong>${String(order.phone || '—')}</strong></div>
          <div><small>Email</small><strong>${String(order.email || '—')}</strong></div>
          <div><small>Оплата</small><strong>${String(order.payment_method || '—')}</strong></div>
        </div>
      </div>
      <div class="operator-order-card">
        <div class="operator-current-status-wrap">
          <small>Текущий статус</small>
          <span class="operator-status operator-status-lg is-${String(order.status || '').toLowerCase()}">${statusLabel(order.status)}</span>
        </div>
        <label>Адрес доставки
          <textarea readonly>${String(order.address || '')}</textarea>
        </label>
        <div class="operator-order-meta">
          <div><small>Дата доставки</small><strong>${formatDate(order.delivery_date || order.created_at)}</strong></div>
          <div><small>Интервал</small><strong>${String(order.delivery_slot || '—')}</strong></div>
          <div><small>Позиций</small><strong>${parseItemsCount(order)}</strong></div>
          <div><small>Сумма</small><strong>${formatCurrency(order.total_sum)}</strong></div>
        </div>
        <label>Статус
          <select id="operatorOrderStatusSelect">
            ${Object.keys(STATUS_LABELS)
              .map(
                (status) =>
                  `<option value="${status}" ${status === order.status ? 'selected' : ''}>${STATUS_LABELS[status]}</option>`
              )
              .join('')}
          </select>
        </label>
        <label>Примечание оператора
          <textarea id="operatorCourierNoteInput" maxlength="500">${String(order.courier_note || '')}</textarea>
        </label>
        <div class="operator-card-actions">
          <button type="button" class="operator-btn is-primary" id="operatorSaveOrderBtn">Сохранить</button>
        </div>
      </div>
    `;

    const saveBtn = document.getElementById('operatorSaveOrderBtn');
    const statusSelect = document.getElementById('operatorOrderStatusSelect');
    const noteInput = document.getElementById('operatorCourierNoteInput');
    if (saveBtn instanceof HTMLButtonElement) {
      saveBtn.addEventListener('click', async () => {
        const api = window.EkvalineAPI;
        if (!api) {
          showToast('API недоступен. Изменения не сохранены.', true);
          return;
        }
        const status = statusSelect instanceof HTMLSelectElement ? statusSelect.value : String(order.status || 'processing');
        const courier_note = noteInput instanceof HTMLTextAreaElement ? noteInput.value.trim() : '';
        const response = await api.json(`/api/orders/${order.id}`, {
          method: 'PATCH',
          body: { status, courier_note },
        });
        if (!response.ok) {
          showToast((response.data && response.data.error) || 'Ошибка сохранения', true);
          return;
        }
        const idx = state.orders.findIndex((item) => String(item.id) === String(order.id));
        if (idx >= 0) state.orders[idx] = { ...state.orders[idx], status, courier_note };
        applyFilters();
        renderOrders();
        renderDetails();
        showToast('Изменения сохранены');
      });
    }
  }

  function bindEvents() {
    SEARCH_INPUT?.addEventListener('input', () => {
      state.query = String(SEARCH_INPUT.value || '');
      applyFilters();
      renderOrders();
      renderDetails();
    });
    STATUS_FILTER?.addEventListener('change', () => {
      state.status = String(STATUS_FILTER.value || 'all');
      applyFilters();
      renderOrders();
      renderDetails();
    });
    ORDERS_BODY?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const row = target.closest('[data-order-row]');
      if (!(row instanceof HTMLElement)) return;
      state.activeOrderId = row.getAttribute('data-order-row');
      renderOrders();
      renderDetails();
    });
    REFRESH_BTN?.addEventListener('click', async () => {
      await loadOrders();
      applyFilters();
      renderOrders();
      renderDetails();
      showToast('Список обновлен');
    });
    LOGOUT_BTN?.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = 'index.html';
    });
  }

  async function init() {
    if (!enforceAccess()) return;
    await loadOrders();
    applyFilters();
    renderOrders();
    renderDetails();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
})();
