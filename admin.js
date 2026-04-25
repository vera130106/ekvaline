(function () {
  const API = window.EkvalineAPI;
  if (!API) return;

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem('ekvaline_current_user') || 'null');
    } catch {
      return null;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showApp(show) {
    const gate = document.getElementById('adminGate');
    const app = document.getElementById('adminApp');
    if (gate) gate.classList.toggle('hidden', show);
    if (app) app.classList.toggle('hidden', !show);
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('#adminApp .staff-tab');
    const panels = document.querySelectorAll('#adminApp .staff-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        panels.forEach((p) => p.classList.toggle('hidden', p.getAttribute('data-panel') !== id));
      });
    });
  }

  const ROLE_OPTS = [
    { v: 'client', t: 'Клиент' },
    { v: 'operator', t: 'Оператор' },
    { v: 'manager', t: 'Менеджер' },
    { v: 'admin', t: 'Админ' },
  ];

  async function loadUsers() {
    const wrap = document.getElementById('adminTableWrap');
    if (!wrap) return;
    const { ok, data } = await API.json('/api/admin/users');
    if (!ok) {
      wrap.innerHTML = `<p class="cabinet-profile-error">${escapeHtml(data.error || 'Ошибка')}</p>`;
      return;
    }
    const users = data.users || [];
    if (!users.length) {
      wrap.innerHTML = '<p class="cabinet-muted">Нет пользователей.</p>';
      return;
    }
    const rows = users
      .map((u) => {
        const roleSel = ROLE_OPTS.map(
          (o) => `<option value="${o.v}" ${u.role === o.v ? 'selected' : ''}>${escapeHtml(o.t)}</option>`
        ).join('');
        return `<tr data-uid="${u.id}">
          <td>${u.id}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.phone)}</td>
          <td>${escapeHtml([u.first_name, u.last_name].filter(Boolean).join(' ') || '—')}</td>
          <td><select class="admin-role" data-uid="${u.id}">${roleSel}</select></td>
          <td>${u.bonus_balance}</td>
          <td><input type="checkbox" class="admin-blocked" data-uid="${u.id}" ${u.blocked ? 'checked' : ''} /></td>
          <td><button type="button" class="solid-btn small-btn admin-save" data-uid="${u.id}">Сохранить</button></td>
        </tr>`;
      })
      .join('');
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>ID</th><th>Email</th><th>Телефон</th><th>Имя</th><th>Роль</th><th>Бонусы</th><th>Блок</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    wrap.querySelectorAll('.admin-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-uid'));
        const row = wrap.querySelector(`tr[data-uid="${id}"]`);
        const role = row.querySelector('.admin-role').value;
        const blocked = row.querySelector('.admin-blocked').checked ? 1 : 0;
        const { ok: ok2, data: d2 } = await API.json(`/api/admin/users/${id}`, {
          method: 'PATCH',
          body: { role, blocked },
        });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        alert('Сохранено.');
      });
    });
  }

  async function loadAddresses() {
    const wrap = document.getElementById('adminAddrWrap');
    if (!wrap) return;
    const { ok, data } = await API.json('/api/admin/delivery-addresses');
    if (!ok) {
      wrap.innerHTML = `<p class="cabinet-profile-error">${escapeHtml(data.error || 'Ошибка')}</p>`;
      return;
    }
    const list = data.addresses || [];
    if (!list.length) {
      wrap.innerHTML = '<p class="cabinet-muted">Адресов пока нет — добавьте первую запись.</p>';
      return;
    }
    const rows = list
      .map((a) => {
        return `<tr data-aid="${a.id}">
          <td>${a.id}</td>
          <td><input type="text" class="addr-inp addr-label" value="${escapeHtml(a.label)}" maxlength="120" /></td>
          <td><input type="text" class="addr-inp addr-line" value="${escapeHtml(a.address_line)}" maxlength="500" /></td>
          <td><input type="number" class="addr-inp addr-sort" value="${a.sort_order}" min="0" max="99999" /></td>
          <td><input type="checkbox" class="addr-active" ${a.active ? 'checked' : ''} /></td>
          <td><button type="button" class="solid-btn small-btn addr-save">OK</button></td>
          <td><button type="button" class="ghost-btn small-btn addr-del">Удалить</button></td>
        </tr>`;
      })
      .join('');
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>ID</th><th>Название</th><th>Адрес</th><th>Порядок</th><th>Активен</th><th></th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    wrap.querySelectorAll('.addr-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = Number(tr.getAttribute('data-aid'));
        const body = {
          label: tr.querySelector('.addr-label').value.trim(),
          address_line: tr.querySelector('.addr-line').value.trim(),
          sort_order: Number(tr.querySelector('.addr-sort').value) || 0,
          active: tr.querySelector('.addr-active').checked ? 1 : 0,
        };з
        const { ok: ok2, data: d2 } = await API.json(`/api/admin/delivery-addresses/${id}`, {
          method: 'PATCH',
          body,
        });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        alert('Адрес обновлён.');
      });
    });
    wrap.querySelectorAll('.addr-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить запись из справочника?')) return;
        const tr = btn.closest('tr');
        const id = Number(tr.getAttribute('data-aid'));
        const { ok: ok2, data: d2 } = await API.json(`/api/admin/delivery-addresses/${id}`, { method: 'DELETE' });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        void loadAddresses();
      });
    });
  }

  async function loadZones() {
    const wrap = document.getElementById('adminZonesWrap');
    if (!wrap) return;
    const { ok, data } = await API.json('/api/admin/delivery-zones');
    if (!ok) {
      wrap.innerHTML = `<p class="cabinet-profile-error">${escapeHtml(data.error || 'Ошибка')}</p>`;
      return;
    }
    const zones = data.zones || [];
    const rows = zones
      .map((z) => {
        return `<tr data-zid="${z.id}">
          <td>${z.id}</td>
          <td><input type="text" class="zone-name" value="${escapeHtml(z.name)}" maxlength="120" /></td>
          <td><input type="number" class="zone-tariff" value="${z.tariff}" min="0" step="1" /></td>
          <td><input type="text" class="zone-bounds" value="${escapeHtml(z.bounds_json || '{}')}" /></td>
          <td><button type="button" class="solid-btn small-btn zone-save">Сохранить</button></td>
        </tr>`;
      })
      .join('');
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>ID</th><th>Зона</th><th>Тариф, ₽</th><th>bounds_json</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    wrap.querySelectorAll('.zone-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = Number(tr.getAttribute('data-zid'));
        const body = {
          name: tr.querySelector('.zone-name').value.trim(),
          tariff: Number(tr.querySelector('.zone-tariff').value),
          bounds_json: tr.querySelector('.zone-bounds').value.trim(),
        };
        const { ok: ok2, data: d2 } = await API.json(`/api/admin/delivery-zones/${id}`, {
          method: 'PATCH',
          body,
        });
        API.resetCsrf();
        if (!ok2) {
          alert(d2.error || 'Ошибка');
          return;
        }
        alert('Зона обновлена.');
      });
    });
  }

  async function loadFeedback() {
    const wrap = document.getElementById('adminFeedbackWrap');
    if (!wrap) return;
    const { ok, data } = await API.json('/api/admin/feedback');
    if (!ok) {
      wrap.innerHTML = `<p class="cabinet-profile-error">${escapeHtml(data.error || 'Ошибка')}</p>`;
      return;
    }
    const messages = data.messages || [];
    if (!messages.length) {
      wrap.innerHTML = '<p class="cabinet-muted">Обращений пока нет.</p>';
      return;
    }
    const rows = messages
      .map((m) => {
        return `<tr>
          <td>${m.id}</td>
          <td>${escapeHtml(m.created_at || '')}</td>
          <td>${escapeHtml(m.name)}</td>
          <td>${escapeHtml(m.phone)}</td>
          <td class="admin-msg-cell">${escapeHtml(m.message)}</td>
          <td>${escapeHtml(m.user_email || '—')}</td>
        </tr>`;
      })
      .join('');
    wrap.innerHTML = `<table class="admin-table"><thead><tr>
      <th>№</th><th>Дата</th><th>Имя</th><th>Телефон</th><th>Сообщение</th><th>Email в ЛК</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
  }

  document.getElementById('addrAddForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = document.getElementById('addrNewLabel').value.trim();
    const address_line = document.getElementById('addrNewLine').value.trim();
    const rawOrd = document.getElementById('addrNewOrder').value.trim();
    if (label.length < 2 || address_line.length < 5) {
      alert('Укажите название и полный адрес.');
      return;
    }
    const body = { label, address_line };
    if (rawOrd) body.sort_order = Number(rawOrd);
    const { ok, data } = await API.json('/api/admin/delivery-addresses', { method: 'POST', body });
    API.resetCsrf();
    if (!ok) {
      alert(data.error || 'Ошибка');
      return;
    }
    document.getElementById('addrNewLabel').value = '';
    document.getElementById('addrNewLine').value = '';
    document.getElementById('addrNewOrder').value = '';
    void loadAddresses();
  });

  document.getElementById('staffLogoutBtn')?.addEventListener('click', async () => {
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
    if (u && u.role === 'admin') {
      showApp(true);
      const w = document.getElementById('adminWelcome');
      if (w) w.textContent = `${u.name || 'Администратор'} · полный доступ к справочникам и пользователям`;
      setupTabs();
      void loadUsers();
      void loadAddresses();
      void loadZones();
      void loadFeedback();
    } else {
      showApp(false);
    }
  });
})();
