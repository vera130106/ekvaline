(function initCabinetPage() {
  try {
    const raw = window.localStorage.getItem('ekvaline_current_user');
    if (raw) {
      const cu = JSON.parse(raw);
      if (String(cu?.role || '').toLowerCase() === 'driver') {
        window.location.replace(new URL('driver.html', window.location.href).href);
        return;
      }
    }
  } catch {
    /* ignore */
  }

  const CURRENT_USER_KEY = 'ekvaline_current_user';

  const userMeta = document.getElementById('cabinetFullUserMeta');
  const profileForm = document.getElementById('cabinetFullProfileForm');
  const profileError = document.getElementById('cabinetFullProfileError');
  const profileSuccess = document.getElementById('cabinetFullProfileSuccess');
  const addressesList = document.getElementById('cabinetAddressesList');
  const ordersList = document.getElementById('cabinetOrdersList');
  const bonusValue = document.getElementById('cabinetBonusValue');
  const logoutBtn = document.getElementById('cabinetFullLogoutBtn');
  const api = window.EkvalineAPI;

  let currentUser = null;
  let currentOrders = [];

  function writeCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function normalizePhoneDigits(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits[0] === '8' ? `7${digits.slice(1)}` : digits;
  }

  function formatPhoneMask(value) {
    const cleaned = normalizePhoneDigits(value).slice(0, 11);
    if (!cleaned) return '';
    const p1 = cleaned.slice(1, 4);
    const p2 = cleaned.slice(4, 7);
    const p3 = cleaned.slice(7, 9);
    const p4 = cleaned.slice(9, 11);
    let result = '+7';
    if (p1) result += ` (${p1}`;
    if (p1.length === 3) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim());
  }

  function formatDate(value) {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function orderStatusLabel(status) {
    const map = {
      new: 'Новый',
      pending_operator: 'Требует оператора',
      processing: 'В обработке',
      confirmed: 'Подтвержден',
      courier: 'Передан курьеру',
      on_way: 'В пути',
      delivered: 'Доставлен',
      cancelled: 'Отменен',
    };
    return map[String(status || '')] || String(status || '—');
  }

  function parseItems(itemsJson) {
    try {
      const arr = JSON.parse(itemsJson || '[]');
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch {
      return [];
    }
  }

  function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' '),
    };
  }

  function renderProfile(user) {
    if (!user) return;
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.name || '';
    if (userMeta) userMeta.textContent = `${name} · ${user.email || '—'} · ${formatPhoneMask(user.phone || '')}`;
    if (bonusValue) bonusValue.textContent = `${Number(user.bonus_balance || 0)} бонусов`;

    if (profileForm instanceof HTMLFormElement) {
      const nameInput = profileForm.elements.namedItem('name');
      const emailInput = profileForm.elements.namedItem('email');
      const phoneInput = profileForm.elements.namedItem('phone');
      if (nameInput instanceof HTMLInputElement) nameInput.value = name;
      if (emailInput instanceof HTMLInputElement) emailInput.value = user.email || '';
      if (phoneInput instanceof HTMLInputElement) phoneInput.value = formatPhoneMask(user.phone || '');
    }
  }

  function renderOrders() {
    if (!(ordersList instanceof HTMLElement)) return;
    ordersList.innerHTML = currentOrders.length
      ? currentOrders
          .map((order) => {
            const items = parseItems(order.items_json).map((item) => `${item.qty} × ${item.title}`).join(', ');
            const editable = ['processing', 'confirmed'].includes(String(order.status || ''));
            return `
              <article class="cabinet-full-order">
                <div class="cabinet-full-order-head">
                  <strong>${order.id}</strong>
                  <span>${formatDate(order.created_at)}</span>
                </div>
                <p>Статус: <span class="cabinet-status-badge is-${String(order.status || '').toLowerCase()}">${orderStatusLabel(order.status)}</span></p>
                <p>Состав: ${items || '—'}</p>
                <p>Адрес: ${order.address || '—'}</p>
                <p>Итого: <strong>${Number(order.total_sum || 0)} ₽</strong> · Списано бонусов: ${Number(order.bonuses_used || 0)} · Начислено: ${Number(
                  order.bonuses_earned || 0
                )}</p>
                ${
                  editable
                    ? `<form class="cabinet-order-edit-form" data-order-id="${order.id}">
                        <label>Изменить адрес
                          <input type="text" name="address" maxlength="180" value="${order.address || ''}" />
                        </label>
                        <label>Дата доставки
                          <input type="date" name="delivery_date" value="${order.delivery_date || ''}" />
                        </label>
                        <label>Интервал
                          <input type="text" name="delivery_slot" maxlength="64" value="${order.delivery_slot || ''}" />
                        </label>
                        <label>Причина изменения или переноса (обязательно при сохранении)
                          <textarea name="change_reason" maxlength="2000" rows="3" placeholder="Укажите, почему меняются адрес или доставка"></textarea>
                        </label>
                        <button type="submit" class="ghost-btn">Сохранить изменения</button>
                      </form>
                      <button type="button" class="ghost-btn cabinet-order-cancel" data-order-id="${order.id}">Отменить заказ…</button>`
                    : ''
                }
              </article>
            `;
          })
          .join('')
      : '<p class="cabinet-full-muted">Заказов пока нет.</p>';
  }

  function renderAddresses() {
    if (!(addressesList instanceof HTMLElement)) return;
    const unique = [];
    for (const order of currentOrders) {
      const addr = String(order.address || '').trim();
      if (!addr || unique.includes(addr)) continue;
      unique.push(addr);
    }
    addressesList.innerHTML = unique.length
      ? unique.slice(0, 10).map((addr) => `<li>${addr}</li>`).join('')
      : '<li>Пока нет сохраненных адресов.</li>';
  }

  async function reloadOrders() {
    if (!api) return;
    const response = await api.json('/api/orders/my');
    if (!response.ok) return;
    currentOrders = Array.isArray(response.data?.orders) ? response.data.orders : [];
    renderOrders();
    renderAddresses();
  }

  async function bootstrap() {
    if (!api) {
      if (userMeta) userMeta.textContent = 'Не удалось открыть кабинет. Обновите страницу или зайдите с главной.';
      return;
    }
    const me = await api.json('/api/auth/me');
    if (!me.ok || !me.data?.user) {
      clearCurrentUser();
      window.location.href = 'index.html?need-login=1';
      return;
    }
    currentUser = me.data.user;
    writeCurrentUser(currentUser);
    if (typeof window.__ekvalineUpdateHeaderAuth === 'function') {
      window.__ekvalineUpdateHeaderAuth();
    }
    renderProfile(currentUser);
    await reloadOrders();
  }

  if (logoutBtn instanceof HTMLButtonElement) {
    logoutBtn.addEventListener('click', async () => {
      if (api) {
        try {
          await api.json('/api/auth/logout', { method: 'POST' });
          api.resetCsrf();
        } catch {
          /* ignore */
        }
      }
      clearCurrentUser();
      window.location.href = 'index.html';
    });
  }

  if (profileForm instanceof HTMLFormElement) {
    const phoneInput = profileForm.elements.namedItem('phone');
    if (phoneInput instanceof HTMLInputElement) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = formatPhoneMask(phoneInput.value);
      });
    }

    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api || !currentUser) return;
      if (profileError) profileError.textContent = '';
      if (profileSuccess) profileSuccess.textContent = '';

      const name = String(profileForm.elements.namedItem('name')?.value || '').trim();
      const email = String(profileForm.elements.namedItem('email')?.value || '').trim().toLowerCase();
      const phoneDigits = normalizePhoneDigits(String(profileForm.elements.namedItem('phone')?.value || ''));

      if (name.length < 2) {
        if (profileError) profileError.textContent = 'Имя должно содержать минимум 2 символа.';
        return;
      }
      if (!validateEmail(email)) {
        if (profileError) profileError.textContent = 'Введите корректный email.';
        return;
      }
      if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
        if (profileError) profileError.textContent = 'Введите корректный телефон.';
        return;
      }

      const split = splitName(name);
      const response = await api.json('/api/profile', {
        method: 'PATCH',
        body: {
          first_name: split.first_name,
          last_name: split.last_name,
          email,
          phone: phoneDigits,
        },
      });
      if (!response.ok) {
        if (profileError) profileError.textContent = response.data?.error || 'Не удалось сохранить профиль.';
        return;
      }
      api.resetCsrf();
      currentUser = response.data?.user || currentUser;
      writeCurrentUser(currentUser);
      renderProfile(currentUser);
      if (profileSuccess) profileSuccess.textContent = 'Профиль сохранен в базе данных.';
    });
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.matches('.cabinet-order-edit-form')) return;
    event.preventDefault();
    if (!api) return;
    const orderId = Number(form.getAttribute('data-order-id'));
    if (!Number.isInteger(orderId)) return;
    const address = String(form.elements.namedItem('address')?.value || '').trim();
    const deliveryDate = String(form.elements.namedItem('delivery_date')?.value || '').trim();
    const deliverySlot = String(form.elements.namedItem('delivery_slot')?.value || '').trim();
    const changeReasonRaw = form.elements.namedItem('change_reason');
    const changeReason =
      changeReasonRaw instanceof HTMLTextAreaElement ? String(changeReasonRaw.value || '').trim() : '';
    const payload = {};
    if (address) payload.address = address;
    if (deliveryDate) payload.delivery_date = deliveryDate;
    if (deliverySlot) payload.delivery_slot = deliverySlot;
    if (!Object.keys(payload).length) return;
    if (changeReason.length < 3) {
      window.alert('Укажите причину изменения заказа (не менее 3 символов).');
      return;
    }
    payload.change_reason = changeReason;
    const response = await api.json(`/api/orders/${orderId}`, { method: 'PATCH', body: payload });
    if (!response.ok) return;
    api.resetCsrf();
    await reloadOrders();
  });

  document.addEventListener('click', async (event) => {
    const target = event.target;
    const btn = target instanceof Element ? target.closest('.cabinet-order-cancel') : null;
    if (!(btn instanceof HTMLButtonElement) || !api) return;
    const orderId = Number(btn.getAttribute('data-order-id'));
    if (!Number.isInteger(orderId)) return;
    const entered = window.prompt('Укажите причину отмены заказа (обязательно, не менее 3 символов):', '');
    const reason = String(entered || '').trim();
    if (reason.length < 3) {
      window.alert('Без указания причины отмена невозможна.');
      return;
    }
    const response = await api.json(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: { reason },
    });
    if (!response.ok) {
      window.alert(response.data?.error || 'Не удалось отменить заказ.');
      return;
    }
    api.resetCsrf();
    await reloadOrders();
  });

  bootstrap();
})();
