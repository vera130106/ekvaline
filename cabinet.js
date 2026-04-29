(function initCabinetPage() {
  const USERS_KEY = 'ekvaline_users';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_KEY = 'ekvaline_orders_by_user';
  const ADDRESSES_KEY = 'ekvaline_addresses_by_user';
  const BONUSES_KEY = 'ekvaline_bonuses_by_user';

  const userMeta = document.getElementById('cabinetFullUserMeta');
  const profileForm = document.getElementById('cabinetFullProfileForm');
  const profileError = document.getElementById('cabinetFullProfileError');
  const profileSuccess = document.getElementById('cabinetFullProfileSuccess');
  const addressesList = document.getElementById('cabinetAddressesList');
  const ordersList = document.getElementById('cabinetOrdersList');
  const bonusValue = document.getElementById('cabinetBonusValue');
  const logoutBtn = document.getElementById('cabinetFullLogoutBtn');

  function safeParse(raw, fallback) {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function readCurrentUser() {
    return safeParse(localStorage.getItem(CURRENT_USER_KEY), null);
  }

  function writeCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function readUsers() {
    return safeParse(localStorage.getItem(USERS_KEY), []);
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function readByUser(key, userId, fallback) {
    const all = safeParse(localStorage.getItem(key), {});
    return all[userId] ?? fallback;
  }

  function writeByUser(key, userId, value) {
    const all = safeParse(localStorage.getItem(key), {});
    all[userId] = value;
    localStorage.setItem(key, JSON.stringify(all));
  }

  function normalizePhoneDigits(value) {
    const digits = value.replace(/\D/g, '');
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
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

  function render(user) {
    if (!user || user.role === 'manager') {
      window.location.href = 'index.html';
      return;
    }
    if (userMeta) userMeta.textContent = `${user.name} · ${user.email} · ${formatPhoneMask(user.phone)}`;
    if (profileForm instanceof HTMLFormElement) {
      const name = profileForm.elements.namedItem('name');
      const email = profileForm.elements.namedItem('email');
      const phone = profileForm.elements.namedItem('phone');
      if (name instanceof HTMLInputElement) name.value = user.name || '';
      if (email instanceof HTMLInputElement) email.value = user.email || '';
      if (phone instanceof HTMLInputElement) phone.value = formatPhoneMask(user.phone || '');
    }

    const uid = String(user.id);
    const bonuses = Number(readByUser(BONUSES_KEY, uid, 0)) || 0;
    if (bonusValue) bonusValue.textContent = `${bonuses} бонусов`;

    const addresses = readByUser(ADDRESSES_KEY, uid, []);
    if (addressesList) {
      addressesList.innerHTML = addresses.length
        ? addresses.map((addr) => `<li>${addr}</li>`).join('')
        : '<li>Пока нет сохраненных адресов.</li>';
    }

    const orders = readByUser(ORDERS_KEY, uid, []);
    if (ordersList) {
      ordersList.innerHTML = orders.length
        ? orders
            .map((order, index) => {
              const items = (order.items || []).map((item) => `${item.qty} × ${item.title}`).join(', ');
              const editable = order.status === 'new';
              return `
                <article class="cabinet-full-order">
                  <div class="cabinet-full-order-head">
                    <strong>${order.id}</strong>
                    <span>${formatDate(order.createdAt)}</span>
                  </div>
                  <p>Статус: <span class="cabinet-status-badge is-${String(order.status || '').toLowerCase()}">${orderStatusLabel(order.status)}</span></p>
                  <p>Состав: ${items}</p>
                  <p>Адрес: ${order.address}</p>
                  <p>Итого: <strong>${order.total} ₽</strong> · Списано бонусов: ${order.bonusSpend || 0} · Начислено: ${
                order.bonusEarned || 0
              }</p>
                  ${
                    editable
                      ? `<form class="cabinet-order-edit-form" data-order-index="${index}">
                          <label>Изменить адрес (пока заказ не в работе)
                            <input type="text" name="address" maxlength="180" value="${order.address || ''}" />
                          </label>
                          <label>Комментарий
                            <input type="text" name="comment" maxlength="240" value="${order.comment || ''}" />
                          </label>
                          <button type="submit" class="ghost-btn">Сохранить изменения</button>
                        </form>`
                      : ''
                  }
                </article>
              `;
            })
            .join('')
        : '<p class="cabinet-full-muted">Заказов пока нет.</p>';
    }
  }

  const current = readCurrentUser();
  render(current);

  if (logoutBtn instanceof HTMLButtonElement) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      window.location.href = 'index.html';
    });
  }

  if (profileForm instanceof HTMLFormElement) {
    const phone = profileForm.elements.namedItem('phone');
    if (phone instanceof HTMLInputElement) {
      phone.addEventListener('input', () => {
        phone.value = formatPhoneMask(phone.value);
      });
    }

    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const user = readCurrentUser();
      if (!user) return;
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

      const users = readUsers();
      const duplicate = users.some((u) => (u.email === email || u.phone === phoneDigits) && u.id !== user.id);
      if (duplicate) {
        if (profileError) profileError.textContent = 'Этот email или телефон уже используются.';
        return;
      }

      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, name, email, phone: phoneDigits } : u));
      writeUsers(updatedUsers);
      const updatedCurrent = { ...user, name, email, phone: phoneDigits };
      writeCurrentUser(updatedCurrent);
      render(updatedCurrent);
      if (profileSuccess) profileSuccess.textContent = 'Профиль сохранен.';
    });
  }

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.matches('.cabinet-order-edit-form')) return;
    event.preventDefault();
    const user = readCurrentUser();
    if (!user) return;
    const idx = Number(form.getAttribute('data-order-index'));
    if (!Number.isInteger(idx)) return;
    const address = String(form.elements.namedItem('address')?.value || '').trim();
    const comment = String(form.elements.namedItem('comment')?.value || '').trim();
    if (!address) return;

    const uid = String(user.id);
    const orders = readByUser(ORDERS_KEY, uid, []);
    if (!orders[idx] || orders[idx].status !== 'new') return;
    orders[idx] = { ...orders[idx], address, comment };
    writeByUser(ORDERS_KEY, uid, orders);

    const addresses = readByUser(ADDRESSES_KEY, uid, []);
    if (!addresses.includes(address)) {
      addresses.unshift(address);
      writeByUser(ADDRESSES_KEY, uid, addresses.slice(0, 10));
    }
    render(user);
  });
})();
