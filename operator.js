(function () {
  const API = window.EkvalineAPI;
  if (!API) return;

  const STATUSES = [
    { v: 'processing', t: 'В обработке' },
    { v: 'confirmed', t: 'Подтверждён' },
    { v: 'courier', t: 'Передан курьеру' },
    { v: 'on_way', t: 'В пути' },
    { v: 'delivered', t: 'Доставлен' },
    { v: 'cancelled', t: 'Отменён' },
  ];

  let allOrders = [];

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem('ekvaline_current_user') || 'null');
    } catch {
      return null;
    }
  }

  function canOperate(u) {
    return u && ['operator', 'manager', 'admin'].includes(u.role);
  }

  function showApp(show) {
    document.getElementById('opGate')?.classList.toggle('hidden', show);
    document.getElementById('opApp')?.classList.toggle('hidden', !show);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStats(orders) {
    const el = document.getElementById('opStats');
    if (!el) return;
    const by = (st) => orders.filter((o) => o.status === st).length;
    el.innerHTML = `
      <div class="staff-stat"><span class="staff-stat-val">${orders.length}</span><span class="staff-stat-lbl">всего заявок</span></div>
      <div class="staff-stat staff-stat--accent"><span class="staff-stat-val">${by('processing') + by('confirmed')}</span><span class="staff-stat-lbl">ожидают</span></div>
      <div class="staff-stat"><span class="staff-stat-val">${by('courier') + by('on_way')}</span><span class="staff-stat-lbl">у курьера / в пути</span></div>
      <div class="staff-stat"><span class="staff-stat-val">${by('delivered')}</span><span class="staff-stat-lbl">доставлено</span></div>
    `;
  }

  function getFiltered() {
    const st = document.getElementById('opFilterStatus')?.value || '';
    const q = (document.getElementById('opSearch')?.value || '').trim().toLowerCase();
    return allOrders.filter((o) => {
      if (st && o.status !== st) return false;
      if (!q) return true;
      const hay = `${o.id} ${o.phone || ''} ${o.address || ''} ${o.first_name || ''} ${o.last_name || ''} ${o.email || ''} ${o.delivery_slot || ''}`
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function renderOrders() {
    const wrap = document.getElementById('opTableWrap');
    if (!wrap) return;
    const orders = getFiltered();
    renderStats(allOrders);
    if (!orders.length) {
      wrap.innerHTML = '<p class="cabinet-muted">Нет заказов по фильтру.</p>';
      return;
    }
    const rows = orders
      .map((o) => {
        const sel = STATUSES.map(
          (s) => `<option value="${s.v}" ${o.status === s.v ? 'selected' : ''}>${s.t}</option>`
        ).join('');
        const who = escapeHtml(`${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email);
        const note = escapeHtml(o.courier_note || '');
        return `<tr class="op-main-row" data-oid="${o.id}">
          <td><strong>#${o.id}</strong></td>
          <td>${who}<div class="op-mini">${escapeHtml(o.email || '')}</div></td>
          <td>${escapeHtml(o.phone)}</td>
          <td class="op-addr">${escapeHtml(o.address || '')}</td>
          <td>${escapeHtml(o.delivery_date)}<div class="op-mini">${escapeHtml(o.delivery_slot)}</div></td>
          <td><select class="op-status staff-select-inline" data-oid="${o.id}">${sel}</select></td>
          <td><button type="button" class="solid-btn small-btn op-save-status" data-oid="${o.id}">Статус</button></td>
        </tr>
        <tr class="op-note-row" data-oid="${o.id}">
          <td colspan="7" class="op-note-wrap">
            <label class="op-note-label">Заметка курьеру
              <textarea class="op-note" data-oid="${o.id}" rows="2" maxlength="500" placeholder="Подъезд, домофон, пожелания">${note}</textarea>
            </label>
            <button type="button" class="ghost-btn small-btn op-save-note" data-oid="${o.id}">Сохранить заметку</button>
          </td>
        </tr>`;
      })
      .join('');
    wrap.innerHTML = `<table class="admin-table op-table"><thead><tr>
      <th>№</th><th>Клиент</th><th>Телефон</th><th>Адрес</th><th>Дата / слот</th><th>Статус</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    wrap.querySelectorAll('.op-save-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-oid');
        const sel = wrap.querySelector(`.op-status[data-oid="${id}"]`);
        const status = sel.value;
        const { ok: ok2, data: d2 } = await API.json(`/api/orders/${id}`, {
          method: 'PATCH',
          body: { status },
        });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        const row = allOrders.find((x) => String(x.id) === id);
        if (row) row.status = status;
        renderOrders();
      });
    });

    wrap.querySelectorAll('.op-save-note').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-oid');
        const ta = wrap.querySelector(`.op-note[data-oid="${id}"]`);
        const courier_note = ta.value.trim();
        const { ok: ok2, data: d2 } = await API.json(`/api/orders/${id}`, {
          method: 'PATCH',
          body: { courier_note },
        });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        const row = allOrders.find((x) => String(x.id) === id);
        if (row) row.courier_note = courier_note;
        btn.textContent = 'Сохранено';
        setTimeout(() => {
          btn.textContent = 'Сохранить заметку';
        }, 1200);
      });
    });
  }

  async function loadOrders() {
    const wrap = document.getElementById('opTableWrap');
    if (!wrap) return;
    const { ok, data } = await API.json('/api/orders');
    if (!ok) {
      wrap.innerHTML = `<p class="cabinet-profile-error">${escapeHtml(data.error || 'Ошибка')}</p>`;
      return;
    }
    allOrders = data.orders || [];
    if (!allOrders.length) {
      wrap.innerHTML = '<p class="cabinet-muted">Заказов пока нет.</p>';
      renderStats([]);
      return;
    }
    renderOrders();
  }

  document.getElementById('opRefreshBtn')?.addEventListener('click', () => {
    void loadOrders();
  });

  document.getElementById('opFilterStatus')?.addEventListener('change', renderOrders);
  document.getElementById('opSearch')?.addEventListener('input', (e) => {
    const t = e.target;
    window.clearTimeout(t._deb);
    t._deb = window.setTimeout(renderOrders, 180);
  });

  document.getElementById('opLogoutBtn')?.addEventListener('click', async () => {
    try {
      await API.json('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    API.resetCsrf();
    localStorage.removeItem('ekvaline_current_user');
    showApp(false);
    location.reload();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const u = readUser();
    if (canOperate(u)) {
      showApp(true);
      const w = document.getElementById('opWelcome');
      if (w) w.textContent = `${u.name || 'Сотрудник'} — статусы заказов и заметки для курьера`;
      void loadOrders();
      window.addEventListener('focus', () => {
        if (canOperate(readUser())) void loadOrders();
      });
    } else {
      showApp(false);
    }
  });
})();
