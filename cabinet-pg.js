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
  const addressesEmpty = document.getElementById('cabinetAddressesEmpty');
  const addAddressBtn = document.getElementById('cabinetAddAddressBtn');
  const addressEditPanel = document.getElementById('cabinetAddressEditPanel');
  const addressEditHint = document.getElementById('cabinetAddressEditHint');
  const addressCurrentLine = document.getElementById('cabinetAddressCurrentLine');
  const addressChangeMapBtn = document.getElementById('cabinetAddressChangeMapBtn');
  const addressForm = document.getElementById('cabinetAddressForm');
  const addressSubmitBtn = document.getElementById('cabinetAddressSubmitBtn');
  const addressCancelEditBtn = document.getElementById('cabinetAddressCancelEditBtn');
  const addressesError = document.getElementById('cabinetAddressesError');
  const addressesSuccess = document.getElementById('cabinetAddressesSuccess');
  let pendingAddressLine = '';
  const activeOrdersList = document.getElementById('cabinetActiveOrders');
  const historyOrdersList = document.getElementById('cabinetOrdersHistory');
  const bonusValue = document.getElementById('cabinetBonusValue');
  const bonusStatus = document.getElementById('cabinetBonusStatus');
  const bonusStatusHint = document.getElementById('cabinetBonusStatusHint');
  const bonusStats = document.getElementById('cabinetBonusStats');
  const bonusExpiryNote = document.getElementById('cabinetBonusExpiryNote');
  const bonusHistory = document.getElementById('cabinetBonusHistory');
  const logoutBtn = document.getElementById('cabinetFullLogoutBtn');
  const verifySection = document.getElementById('cabinet-verify-email');
  const sendVerifyCodeBtn = document.getElementById('cabinetSendVerifyCodeBtn');
  const verifyEmailForm = document.getElementById('cabinetVerifyEmailForm');
  const verifyError = document.getElementById('cabinetVerifyError');
  const verifySuccess = document.getElementById('cabinetVerifySuccess');
  const verifyDevCode = document.getElementById('cabinetVerifyDevCode');
  const passwordBlockedSection = document.getElementById('cabinet-password-blocked');
  const goVerifyEmailBtn = document.getElementById('cabinetGoVerifyEmailBtn');
  const changePasswordSection = document.getElementById('cabinet-change-password');
  const sendPasswordCodeBtn = document.getElementById('cabinetSendPasswordCodeBtn');
  const verifyPasswordCodeForm = document.getElementById('cabinetVerifyPasswordCodeForm');
  const changePasswordForm = document.getElementById('cabinetChangePasswordForm');
  const passwordError = document.getElementById('cabinetPasswordError');
  const passwordSuccess = document.getElementById('cabinetPasswordSuccess');
  const emailVerifyStatus = document.getElementById('cabinetEmailVerifyStatus');
  const securityEmailNote = document.getElementById('cabinetSecurityEmailNote');
  const api = window.EkvalineAPI;

  let currentUser = null;
  let currentOrders = [];
  let savedAddresses = [];
  let editingAddressId = null;
  let passwordCodeAccepted = false;
  let passwordSendSeq = 0;
  let acceptedPasswordCode = '';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function formatDeliverySlotClient(raw) {
    const s = String(raw || '')
      .trim()
      .replace(/\u2013|\u2014|\u2212/g, '-');
    const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(s);
    if (m) return `${m[1]}–${m[2]}`;
    return s || '';
  }

  /** Подпись статуса в личном кабинете клиента (как видит этапы обработки оператором). */
  function orderStatusLabel(order) {
    const st = String(order?.status || '').toLowerCase();
    const slot = formatDeliverySlotClient(order?.delivery_slot);
    if (st === 'delivered') return 'Доставлен';
    if (st === 'cancelled') return 'Отменён';
    if (['processing', 'courier', 'on_way'].includes(st)) {
      return slot ? `В пути · доставка ${slot}` : 'В пути';
    }
    if (st === 'confirmed') return 'Подтверждён';
    return 'В обработке';
  }

  function orderStatusBadgeClass(order) {
    const st = String(order?.status || '').toLowerCase();
    if (['processing', 'courier', 'on_way'].includes(st)) return 'on_way';
    if (st === 'confirmed') return 'confirmed';
    if (st === 'delivered') return 'delivered';
    if (st === 'cancelled') return 'cancelled';
    return 'new';
  }

  function earliestDeliveryDateIso() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function parseItems(itemsJson) {
    try {
      const parsed = JSON.parse(itemsJson || '[]');
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.lines)) return parsed.lines;
      return [];
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

  function formatShortDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function bonusOperationLabel(type, row) {
    const t = String(type || '').toLowerCase();
    const desc = String(row?.description || '');
    if (t === 'accrual' && desc.includes('Возврат бонусов за отмену')) return 'Возврат';
    if (t === 'accrual') return 'Начисление';
    if (t === 'spend') return 'Списание';
    if (t === 'expire') return 'Сгорание';
    if (t === 'reversal') return 'Отмена начисления';
    return type || 'Операция';
  }

  function bonusOperationClass(type, row) {
    const t = String(type || '').toLowerCase();
    const desc = String(row?.description || '');
    if (t === 'accrual' && desc.includes('Возврат бонусов за отмену')) return 'is-plus';
    if (t === 'accrual') return 'is-plus';
    if (t === 'spend') return 'is-minus';
    if (t === 'expire') return 'is-expire';
    if (t === 'reversal') return 'is-minus';
    return '';
  }

  function renderBonusProgram(summary) {
    if (!summary) return;
    if (bonusValue) bonusValue.textContent = `${Number(summary.balance || 0)}`;
    if (bonusStatus) {
      bonusStatus.textContent = summary.member_status_label || '—';
      bonusStatus.className = `cabinet-bonus-status is-${summary.member_status || 'none'}`;
    }
    if (bonusStatusHint) {
      bonusStatusHint.textContent = summary.member_status_hint || '';
    }
    if (bonusStats) {
      const rate = Number(summary.earn_rate_percent || 5);
      const days = Number(summary.validity_days || 365);
      const totals = summary.totals || {};
      bonusStats.innerHTML = `
        <div class="cabinet-bonus-stat"><span>Начислено всего</span><strong>${Number(totals.earned || 0)}</strong></div>
        <div class="cabinet-bonus-stat"><span>Списано</span><strong>${Number(totals.spent || 0)}</strong></div>
        <div class="cabinet-bonus-stat"><span>Сгорело</span><strong>${Number(totals.expired || 0)}</strong></div>
        <div class="cabinet-bonus-stat"><span>Ставка</span><strong>${rate}% за заказ</strong></div>
        <div class="cabinet-bonus-stat"><span>Срок действия</span><strong>${days} дн.</strong></div>
      `;
    }
    if (bonusExpiryNote) {
      const soon = Number(summary.expires_soon_amount || 0);
      const nearest = summary.nearest_expires_at;
      const nearestAmount = Number(summary.nearest_expiring_amount || 0);
      if (soon > 0) {
        bonusExpiryNote.textContent = `Внимание: ${soon} бонусов сгорят в ближайшие ${Number(summary.expires_soon_days || 30)} дней (ближайшая дата — ${formatShortDate(nearest)}).`;
        bonusExpiryNote.className = 'cabinet-bonus-expiry is-warn';
      } else if (nearest && nearestAmount > 0) {
        bonusExpiryNote.textContent = `Ближайшее сгорание: ${formatShortDate(nearest)} (${nearestAmount} бонусов на счёте с ограниченным сроком).`;
        bonusExpiryNote.className = 'cabinet-bonus-expiry';
      } else if (Number(summary.balance || 0) > 0) {
        bonusExpiryNote.textContent = 'Срок действия бонусов отслеживается автоматически — просроченные списываются из баланса.';
        bonusExpiryNote.className = 'cabinet-bonus-expiry';
      } else {
        bonusExpiryNote.textContent = 'Оформите заказ, чтобы получить первые бонусы.';
        bonusExpiryNote.className = 'cabinet-bonus-expiry';
      }
    }
    if (bonusHistory instanceof HTMLElement) {
      const rows = Array.isArray(summary.history) ? summary.history : [];
      bonusHistory.innerHTML = rows.length
        ? rows
            .map((row) => {
              const amount = Number(row.amount || 0);
              const sign = amount > 0 ? '+' : '';
              const expires =
                row.type === 'accrual' && row.expires_at
                  ? `<span class="cabinet-bonus-history-exp">до ${formatShortDate(row.expires_at)}</span>`
                  : '';
              return `
                <li class="cabinet-bonus-history-item ${bonusOperationClass(row.type, row)}">
                  <div class="cabinet-bonus-history-main">
                    <strong>${bonusOperationLabel(row.type, row)}</strong>
                    <span class="cabinet-bonus-history-amount">${sign}${amount}</span>
                  </div>
                  <p class="cabinet-bonus-history-desc">${escapeHtml(row.description || '')}${expires}</p>
                  <time class="cabinet-bonus-history-date">${formatDate(row.created_at)}</time>
                </li>
              `;
            })
            .join('')
        : '<li class="cabinet-full-muted">Операций с бонусами пока не было.</li>';
    }
    if (currentUser) {
      currentUser.bonus_balance = summary.balance;
      writeCurrentUser(currentUser);
    }
  }

  async function reloadBonusProgram() {
    if (!api) return;
    const response = await api.json('/api/profile/bonus-program');
    if (!response.ok) return;
    renderBonusProgram(response.data);
  }

  const passwordDevCode = document.getElementById('cabinetPasswordDevCode');

  function clearVerifyDevCode() {
    if (!(verifyDevCode instanceof HTMLElement)) return;
    verifyDevCode.hidden = true;
    verifyDevCode.innerHTML = '';
  }

  function clearPasswordDevCode() {
    if (!(passwordDevCode instanceof HTMLElement)) return;
    passwordDevCode.hidden = true;
    passwordDevCode.innerHTML = '';
  }

  function renderDevCodeBox(boxEl, code, hint) {
    if (!(boxEl instanceof HTMLElement) || !code) return;
    boxEl.hidden = false;
    boxEl.innerHTML = `
      <p class="cabinet-dev-code-title">Режим без SMTP (разработка)</p>
      <p class="cabinet-dev-code-value">${escapeHtml(String(code))}</p>
      <p class="cabinet-dev-code-hint">${escapeHtml(hint || 'Письмо на ящик не отправлено — введите код вручную.')}</p>
    `;
  }

  function applyEmailCodeDeliveryResponse(data, successEl, errorEl) {
    if (errorEl) errorEl.textContent = '';
    if (!data || typeof data !== 'object') return;
    if (data.devMode && data.devCode) {
      renderDevCodeBox(
        verifyDevCode,
        data.devCode,
        'Настройте SMTP в .env на сервере, чтобы коды приходили на реальную почту.'
      );
    } else {
      clearVerifyDevCode();
    }
    if (successEl && data.message) {
      successEl.textContent = data.message;
    }
  }

  function applyPasswordCodeDeliveryResponse(data) {
    if (passwordError) passwordError.textContent = '';
    if (!data || typeof data !== 'object') return;
    if (data.devMode && data.devCode) {
      renderDevCodeBox(
        passwordDevCode,
        data.devCode,
        'Настройте SMTP_HOST, SMTP_USER, SMTP_PASS в .env — тогда код придёт на email.'
      );
    } else {
      clearPasswordDevCode();
    }
    if (passwordSuccess && data.message) {
      passwordSuccess.textContent = data.message;
    }
  }

  function normalizeAuthCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function bindAuthCodeInput(input) {
    if (!(input instanceof HTMLInputElement)) return;
    input.addEventListener('input', () => {
      input.value = normalizeAuthCode(input.value);
    });
  }

  function setButtonLoading(btn, loading) {
    if (!(btn instanceof HTMLButtonElement)) return;
    const spinner = btn.querySelector('.cabinet-btn-spinner');
    btn.classList.toggle('is-loading', !!loading);
    btn.disabled = !!loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (spinner instanceof HTMLElement) {
      spinner.hidden = !loading;
    }
  }

  function getPasswordStrengthApi() {
    return window.EkvalineAuthPassword || null;
  }

  function validatePasswordForSubmit(password) {
    const api = getPasswordStrengthApi();
    if (api?.validatePassword) return api.validatePassword(password);
    const p = String(password || '');
    if (p.length < 8) return { ok: false, error: 'Пароль: минимум 8 символов.' };
    return { ok: false, error: api?.PASSWORD_RULES_HINT || 'Пароль не соответствует требованиям системы.' };
  }

  function setCabinetPasswordFieldsEnabled(enabled) {
    if (!(changePasswordForm instanceof HTMLFormElement)) return;
    const pwd = changePasswordForm.elements.namedItem('password');
    const pwd2 = changePasswordForm.elements.namedItem('passwordConfirm');
    const saveBtn = document.getElementById('cabinetSavePasswordBtn');
    if (pwd instanceof HTMLInputElement) pwd.disabled = !enabled;
    if (pwd2 instanceof HTMLInputElement) pwd2.disabled = !enabled;
    if (!enabled) {
      if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = true;
      const line = document.getElementById('cabinetPasswordStrengthLine');
      if (line instanceof HTMLElement) line.textContent = '';
      return;
    }
    syncCabinetPasswordSubmitState();
  }

  function syncCabinetPasswordSubmitState() {
    if (!(changePasswordForm instanceof HTMLFormElement)) return;
    const saveBtn = document.getElementById('cabinetSavePasswordBtn');
    const line = document.getElementById('cabinetPasswordStrengthLine');
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    if (!passwordCodeAccepted) {
      saveBtn.disabled = true;
      return;
    }
    const password = String(changePasswordForm.elements.namedItem('password')?.value || '');
    const passwordConfirm = String(changePasswordForm.elements.namedItem('passwordConfirm')?.value || '');
    const st = getPasswordStrengthApi()?.getPasswordStrength?.(password);
    if (line instanceof HTMLElement && st?.line) {
      line.textContent = st.line;
      line.className = `cabinet-password-strength-line is-${st.level || 'weak'}`;
    }
    const pwdCheck = validatePasswordForSubmit(password);
    saveBtn.disabled = !pwdCheck.ok || password !== passwordConfirm;
  }

  function resetPasswordChangeFlow() {
    passwordCodeAccepted = false;
    acceptedPasswordCode = '';
    if (verifyPasswordCodeForm instanceof HTMLFormElement) {
      verifyPasswordCodeForm.hidden = true;
      verifyPasswordCodeForm.reset();
      const codeInput = verifyPasswordCodeForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) codeInput.readOnly = false;
      verifyPasswordCodeForm.querySelectorAll('button[type="submit"]').forEach((node) => {
        if (node instanceof HTMLButtonElement) node.disabled = false;
      });
    }
    if (changePasswordForm instanceof HTMLFormElement) {
      changePasswordForm.hidden = true;
      changePasswordForm.reset();
    }
    setCabinetPasswordFieldsEnabled(false);
    clearPasswordDevCode();
  }

  function showPasswordStepAfterCodeSent(devCode) {
    resetPasswordChangeFlow();
    if (verifyPasswordCodeForm instanceof HTMLFormElement) {
      verifyPasswordCodeForm.hidden = false;
      const codeInput = verifyPasswordCodeForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) {
        codeInput.value = devCode ? String(devCode) : '';
        codeInput.focus();
      }
    }
    if (passwordSuccess) {
      passwordSuccess.textContent =
        'Код отправлен. Если нажимали кнопку несколько раз — введите код из последнего письма.';
    }
  }

  function showPasswordStepAfterCodeVerified(code) {
    passwordCodeAccepted = true;
    acceptedPasswordCode = code;
    if (verifyPasswordCodeForm instanceof HTMLFormElement) {
      verifyPasswordCodeForm.hidden = false;
      const codeInput = verifyPasswordCodeForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) {
        codeInput.value = code;
        codeInput.readOnly = true;
      }
      verifyPasswordCodeForm.querySelectorAll('button[type="submit"]').forEach((node) => {
        if (node instanceof HTMLButtonElement) node.disabled = true;
      });
    }
    if (changePasswordForm instanceof HTMLFormElement) {
      changePasswordForm.hidden = false;
      setCabinetPasswordFieldsEnabled(true);
      const pwdInput = changePasswordForm.elements.namedItem('password');
      if (pwdInput instanceof HTMLInputElement) pwdInput.focus();
    }
  }

  function scrollToCabinetHash() {
    const hash = String(window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!(el instanceof HTMLElement)) return;
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('is-highlight');
      window.setTimeout(() => el.classList.remove('is-highlight'), 2200);
    });
  }

  function updateSecurityBlocks(user) {
    const verified = !!user?.email_verified;
    if (verifySection instanceof HTMLElement) {
      verifySection.hidden = verified;
    }
    if (emailVerifyStatus) {
      emailVerifyStatus.textContent = verified
        ? ''
        : `Код отправляется на ${user?.email || 'ваш email'}. Если письма нет — проверьте «Спам».`;
    }

    if (passwordBlockedSection instanceof HTMLElement) {
      passwordBlockedSection.hidden = verified;
    }
    if (changePasswordSection instanceof HTMLElement) {
      changePasswordSection.hidden = !verified;
    }

    if (!verified) {
      resetPasswordChangeFlow();
      if (passwordError) passwordError.textContent = '';
      if (passwordSuccess) passwordSuccess.textContent = '';
    } else if (securityEmailNote) {
      securityEmailNote.textContent =
        'Сначала отправьте код, затем подтвердите его. Поля нового пароля появятся только после успешной проверки кода.';
    }
  }

  function renderProfile(user) {
    if (!user) return;
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.name || '';
    const verified = !!user.email_verified;
    const verifyBadge = verified
      ? '<span class="cabinet-email-badge is-ok">email подтверждён</span>'
      : '<span class="cabinet-email-badge is-warn">email не подтверждён</span>';
    if (userMeta) {
      userMeta.innerHTML = `${name} · ${user.email || '—'} ${verifyBadge} · ${formatPhoneMask(user.phone || '')}`;
    }
    updateSecurityBlocks(user);
    if (bonusValue && currentUser?.bonus_balance != null) {
      bonusValue.textContent = `${Number(currentUser.bonus_balance || 0)}`;
    }

    if (profileForm instanceof HTMLFormElement) {
      const nameInput = profileForm.elements.namedItem('name');
      const emailInput = profileForm.elements.namedItem('email');
      const phoneInput = profileForm.elements.namedItem('phone');
      if (nameInput instanceof HTMLInputElement) nameInput.value = name;
      if (emailInput instanceof HTMLInputElement) emailInput.value = user.email || '';
      if (phoneInput instanceof HTMLInputElement) phoneInput.value = formatPhoneMask(user.phone || '');
    }
  }

  function isActiveOrder(order) {
    const st = String(order?.status || '').toLowerCase();
    return !['delivered', 'cancelled'].includes(st);
  }

  function renderOrderCard(order) {
    const items = parseItems(order.items_json).map((item) => `${item.qty} × ${item.title}`).join(', ');
    const editable = ['new', 'pending_operator', 'confirmed'].includes(String(order.status || ''));
    const statusText = orderStatusLabel(order);
    const badgeClass = orderStatusBadgeClass(order);
    const slotLine = formatDeliverySlotClient(order.delivery_slot);
    const delRu = order.delivery_date ? String(order.delivery_date).split('-').reverse().join('.') : '—';
    return `
      <article class="cabinet-full-order">
        <div class="cabinet-full-order-head">
          <strong>Заявка №${order.id}</strong>
          <span>${formatDate(order.created_at)}</span>
        </div>
        <p>Статус: <span class="cabinet-status-badge is-${badgeClass}">${statusText}</span></p>
        <p>Доставка: <strong>${delRu}</strong>${slotLine ? ` · интервал ${slotLine}` : ''}</p>
        <p>Состав: ${items || '—'}</p>
        <p>Адрес: ${escapeHtml(order.address || '—')}</p>
        <p>Итого: <strong>${Number(order.total_sum || 0)} ₽</strong> · Списано бонусов: ${Number(order.bonuses_used || 0)} · Начислено: ${Number(
          order.bonuses_earned || 0
        )}</p>
        ${
          editable
            ? `<form class="cabinet-order-edit-form" data-order-id="${order.id}">
                <label>Изменить адрес
                  <input type="text" name="address" maxlength="180" value="${escapeHtml(order.address || '')}" />
                </label>
                <label>Дата доставки
                  <input type="date" name="delivery_date" min="${earliestDeliveryDateIso()}" value="${order.delivery_date || ''}" />
                </label>
                <label>Интервал
                  <input type="text" name="delivery_slot" maxlength="64" value="${escapeHtml(order.delivery_slot || '')}" />
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
  }

  function renderOrders() {
    const active = currentOrders.filter(isActiveOrder);
    const history = currentOrders.filter((order) => !isActiveOrder(order));
    if (activeOrdersList instanceof HTMLElement) {
      activeOrdersList.innerHTML = active.length
        ? active.map(renderOrderCard).join('')
        : '<p class="cabinet-full-muted">Нет активных доставок — оформите заказ в каталоге.</p>';
    }
    if (historyOrdersList instanceof HTMLElement) {
      historyOrdersList.innerHTML = history.length
        ? history.map(renderOrderCard).join('')
        : '<p class="cabinet-full-muted">История покупок пуста.</p>';
    }
  }

  function resetAddressForm() {
    editingAddressId = null;
    pendingAddressLine = '';
    if (addressEditPanel instanceof HTMLElement) addressEditPanel.hidden = true;
    if (!(addressForm instanceof HTMLFormElement)) return;
    addressForm.reset();
    const editIdInput = addressForm.elements.namedItem('edit_id');
    if (editIdInput instanceof HTMLInputElement) editIdInput.value = '';
    if (addressCurrentLine instanceof HTMLElement) addressCurrentLine.textContent = '';
    if (addressSubmitBtn instanceof HTMLButtonElement) addressSubmitBtn.textContent = 'Сохранить';
  }

  function fillAddressForm(address) {
    if (!(addressForm instanceof HTMLFormElement) || !address) return;
    editingAddressId = Number(address.id);
    pendingAddressLine = String(address.address_line || '').trim();
    const labelInput = addressForm.elements.namedItem('label');
    const defaultInput = addressForm.elements.namedItem('is_default');
    const editIdInput = addressForm.elements.namedItem('edit_id');
    if (labelInput instanceof HTMLInputElement) labelInput.value = address.label || '';
    if (defaultInput instanceof HTMLInputElement) defaultInput.checked = !!address.is_default;
    if (editIdInput instanceof HTMLInputElement) editIdInput.value = String(address.id);
    if (addressEditHint instanceof HTMLElement) {
      addressEditHint.textContent = 'Измените название или отметьте адрес основным. Адрес на карте — кнопкой ниже.';
    }
    if (addressCurrentLine instanceof HTMLElement) {
      addressCurrentLine.textContent = pendingAddressLine || '—';
    }
    if (addressesEmpty instanceof HTMLElement) addressesEmpty.hidden = true;
    if (addressEditPanel instanceof HTMLElement) {
      addressEditPanel.hidden = false;
      addressEditPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function openCabinetAddressMap(initialAddress, onPicked) {
    const picker = window.EkvalineMapPicker;
    if (!picker || typeof picker.open !== 'function') {
      window.alert('Карта недоступна. Обновите страницу или откройте каталог.');
      return;
    }
    picker.open({
      initialAddress,
      maxLength: 500,
      onApply: onPicked,
    });
  }

  async function saveAddressToServer({ label, addressLine, isDefault, editId }) {
    if (!api) return false;
    const line = String(addressLine || '').trim();
    if (line.length < 8) {
      if (addressesError) addressesError.textContent = 'Укажите полный адрес доставки по Оренбургу на карте.';
      return false;
    }
    const payload = {
      label: String(label || '').trim(),
      address_line: line,
      is_default: !!isDefault,
    };
    const isEdit = Number.isInteger(editId) && editId > 0;
    const response = isEdit
      ? await api.json(`/api/profile/addresses/${editId}`, { method: 'PATCH', body: payload })
      : await api.json('/api/profile/addresses', { method: 'POST', body: payload });
    if (!response.ok) {
      if (addressesError) {
        addressesError.textContent = response.data?.error || 'Не удалось сохранить адрес.';
      }
      return false;
    }
    api.resetCsrf();
    return true;
  }

  function startAddAddressFlow() {
    if (addressesError) addressesError.textContent = '';
    if (addressesSuccess) addressesSuccess.textContent = '';
    resetAddressForm();
    openCabinetAddressMap('', async (line) => {
      const isFirst = !savedAddresses.length;
      const ok = await saveAddressToServer({
        label: '',
        addressLine: line,
        isDefault: isFirst,
        editId: null,
      });
      if (!ok) return;
      await reloadAddresses();
      if (addressesSuccess) addressesSuccess.textContent = 'Адрес добавлен.';
    });
  }

  function renderAddresses() {
    const hasAny = savedAddresses.length > 0;
    if (addressesEmpty instanceof HTMLElement) addressesEmpty.hidden = hasAny;
    if (addressesList instanceof HTMLElement) {
      addressesList.hidden = !hasAny;
      addressesList.innerHTML = hasAny
        ? `${savedAddresses
            .map((addr) => {
              const label = String(addr.label || '').trim();
              const title = label || 'Адрес';
              const defaultBadge = addr.is_default
                ? '<span class="cabinet-saved-address-badge">по умолчанию</span>'
                : '';
              return `
              <li class="cabinet-saved-address-item" data-address-id="${addr.id}">
                <div class="cabinet-saved-address-body">
                  <strong class="cabinet-saved-address-label">${escapeHtml(title)}</strong>
                  <p class="cabinet-saved-address-line">${escapeHtml(addr.address_line || '')}</p>
                  ${defaultBadge}
                </div>
                <div class="cabinet-saved-address-actions">
                  ${
                    addr.is_default
                      ? ''
                      : `<button type="button" class="ghost-btn cabinet-address-default" data-address-id="${addr.id}">Сделать основным</button>`
                  }
                  <button type="button" class="ghost-btn cabinet-address-edit" data-address-id="${addr.id}">Настройки</button>
                  <button type="button" class="ghost-btn cabinet-address-delete" data-address-id="${addr.id}">Удалить</button>
                </div>
              </li>`;
            })
            .join('')}
          <li class="cabinet-saved-address-add-row">
            <button type="button" class="ghost-btn" id="cabinetAddAddressInlineBtn">+ Добавить адрес</button>
          </li>`
        : '';
    }
    if (!hasAny) resetAddressForm();
    const inlineAdd = document.getElementById('cabinetAddAddressInlineBtn');
    if (inlineAdd instanceof HTMLButtonElement) {
      inlineAdd.addEventListener('click', () => startAddAddressFlow());
    }
  }

  async function reloadAddresses() {
    if (!api) return;
    const response = await api.json('/api/profile/addresses');
    if (!response.ok) {
      if (addressesError) {
        addressesError.textContent = response.data?.error || 'Не удалось загрузить адреса.';
      }
      return;
    }
    savedAddresses = Array.isArray(response.data?.addresses) ? response.data.addresses : [];
    renderAddresses();
  }

  async function reloadOrders() {
    if (!api) return;
    const response = await api.json('/api/orders/my');
    if (!response.ok) return;
    currentOrders = Array.isArray(response.data?.orders) ? response.data.orders : [];
    renderOrders();
    window.EkvalineNotificationsSync?.refresh?.();
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
    await Promise.all([reloadOrders(), reloadAddresses(), reloadBonusProgram()]);
    scrollToCabinetHash();
    if (currentUser && !currentUser.email_verified) {
      try {
        const hint = sessionStorage.getItem('ekvaline_email_verify_dev');
        if (hint) {
          const parsed = JSON.parse(hint);
          sessionStorage.removeItem('ekvaline_email_verify_dev');
          applyEmailCodeDeliveryResponse(parsed, verifySuccess, verifyError);
          if (parsed?.devCode && verifyEmailForm instanceof HTMLFormElement) {
            const codeInput = verifyEmailForm.elements.namedItem('code');
            if (codeInput instanceof HTMLInputElement) codeInput.value = String(parsed.devCode);
          }
        }
      } catch {
        /* ignore */
      }
    }
    const ORDERS_POLL_MS = 10000;
    window.setInterval(() => {
      if (!document.hidden) {
        void reloadOrders();
        void reloadBonusProgram();
      }
    }, ORDERS_POLL_MS);
    if (typeof window.EkvalineOrdersSync?.subscribeOrdersDataChanged === 'function') {
      window.EkvalineOrdersSync.subscribeOrdersDataChanged(() => {
        void reloadOrders();
      });
    }
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
      if (response.data?.emailVerificationRequired) {
        applyEmailCodeDeliveryResponse(response.data, profileSuccess, profileError);
        if (response.data?.devCode && verifyEmailForm instanceof HTMLFormElement) {
          const codeInput = verifyEmailForm.elements.namedItem('code');
          if (codeInput instanceof HTMLInputElement) codeInput.value = String(response.data.devCode);
        }
        window.location.hash = 'cabinet-verify-email';
        scrollToCabinetHash();
      }
    });
  }

  if (verifyEmailForm instanceof HTMLFormElement) {
    const verifyCodeInput = verifyEmailForm.elements.namedItem('code');
    bindAuthCodeInput(verifyCodeInput instanceof HTMLInputElement ? verifyCodeInput : null);
    verifyEmailForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api || !currentUser) return;
      if (verifyError) verifyError.textContent = '';
      if (verifySuccess) verifySuccess.textContent = '';
      const code = normalizeAuthCode(String(verifyEmailForm.elements.namedItem('code')?.value || ''));
      if (code.length !== 6) {
        if (verifyError) verifyError.textContent = 'Введите 6-значный код из письма.';
        return;
      }
      const response = await api.json('/api/auth/confirm-email-code', {
        method: 'POST',
        body: { code },
      });
      if (!response.ok) {
        if (verifyError) verifyError.textContent = response.data?.error || 'Не удалось подтвердить email.';
        return;
      }
      api.resetCsrf();
      currentUser = response.data?.user || currentUser;
      writeCurrentUser(currentUser);
      renderProfile(currentUser);
      if (verifySuccess) {
        verifySuccess.textContent = response.data?.message || 'Email подтверждён и сохранён в базе данных.';
      }
      clearVerifyDevCode();
      verifyEmailForm.reset();
      resetPasswordChangeFlow();
    });
  }

  if (goVerifyEmailBtn instanceof HTMLButtonElement) {
    goVerifyEmailBtn.addEventListener('click', () => {
      window.location.hash = 'cabinet-verify-email';
      scrollToCabinetHash();
    });
  }

  async function runWithButtonLoading(btn, task) {
    if (btn instanceof HTMLButtonElement && btn.disabled) return null;
    setButtonLoading(btn, true);
    try {
      return await task();
    } finally {
      setButtonLoading(btn, false);
    }
  }

  if (sendVerifyCodeBtn instanceof HTMLButtonElement) {
    sendVerifyCodeBtn.addEventListener('click', async () => {
      if (!api || !currentUser) return;
      await runWithButtonLoading(sendVerifyCodeBtn, async () => {
        if (verifyError) verifyError.textContent = '';
        if (verifySuccess) verifySuccess.textContent = '';
        clearVerifyDevCode();
        const response = await api.json('/api/auth/send-email-verify-code', { method: 'POST' });
        if (!response.ok) {
          if (verifyError) verifyError.textContent = response.data?.error || 'Не удалось отправить код.';
          return;
        }
        api.resetCsrf();
        applyEmailCodeDeliveryResponse(response.data, verifySuccess, verifyError);
        if (verifySuccess) {
          verifySuccess.textContent =
            (response.data?.message || 'Код отправлен.') +
            ' Если нажимали кнопку повторно — используйте код из последнего письма.';
        }
        if (response.data?.devCode && verifyEmailForm instanceof HTMLFormElement) {
          const codeInput = verifyEmailForm.elements.namedItem('code');
          if (codeInput instanceof HTMLInputElement) codeInput.value = String(response.data.devCode);
        }
      });
    });
  }

  if (sendPasswordCodeBtn instanceof HTMLButtonElement) {
    sendPasswordCodeBtn.addEventListener('click', async () => {
      if (!api || !currentUser || !currentUser.email_verified) return;
      const seq = ++passwordSendSeq;
      await runWithButtonLoading(sendPasswordCodeBtn, async () => {
        if (passwordError) passwordError.textContent = '';
        if (passwordSuccess) passwordSuccess.textContent = '';
        const response = await api.json('/api/auth/send-password-code', { method: 'POST' });
        if (seq !== passwordSendSeq) return;
        if (!response.ok) {
          if (passwordError) passwordError.textContent = response.data?.error || 'Не удалось отправить код.';
          return;
        }
        api.resetCsrf();
        applyPasswordCodeDeliveryResponse(response.data);
        showPasswordStepAfterCodeSent(response.data?.devCode);
      });
    });
  }

  if (verifyPasswordCodeForm instanceof HTMLFormElement) {
    const pwdCheckCodeInput = verifyPasswordCodeForm.elements.namedItem('code');
    bindAuthCodeInput(pwdCheckCodeInput instanceof HTMLInputElement ? pwdCheckCodeInput : null);
    verifyPasswordCodeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api || !currentUser || !currentUser.email_verified) return;
      const checkBtn = document.getElementById('cabinetCheckPasswordCodeBtn');
      await runWithButtonLoading(checkBtn, async () => {
        if (passwordError) passwordError.textContent = '';
        const code = normalizeAuthCode(String(verifyPasswordCodeForm.elements.namedItem('code')?.value || ''));
        if (code.length !== 6) {
          if (passwordError) passwordError.textContent = 'Введите 6-значный код из письма.';
          return;
        }
        const response = await api.json('/api/auth/verify-password-code', {
          method: 'POST',
          body: { code },
        });
        if (!response.ok) {
          if (passwordError) passwordError.textContent = response.data?.error || 'Код не принят.';
          return;
        }
        api.resetCsrf();
        if (passwordSuccess) {
          passwordSuccess.textContent = response.data?.message || 'Код принят. Задайте новый пароль.';
        }
        showPasswordStepAfterCodeVerified(code);
      });
    });
  }

  if (changePasswordForm instanceof HTMLFormElement) {
    const pwdInputWatch = changePasswordForm.elements.namedItem('password');
    const pwdConfirmWatch = changePasswordForm.elements.namedItem('passwordConfirm');
    [pwdInputWatch, pwdConfirmWatch].forEach((node) => {
      if (node instanceof HTMLInputElement) {
        node.addEventListener('input', () => syncCabinetPasswordSubmitState());
      }
    });
    changePasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api || !currentUser || !currentUser.email_verified) return;
      if (!passwordCodeAccepted || !acceptedPasswordCode) {
        if (passwordError) {
          passwordError.textContent = 'Сначала отправьте код и нажмите «Проверить код».';
        }
        return;
      }
      const saveBtn = document.getElementById('cabinetSavePasswordBtn');
      await runWithButtonLoading(saveBtn, async () => {
        if (passwordError) passwordError.textContent = '';
        const password = String(changePasswordForm.elements.namedItem('password')?.value || '');
        const passwordConfirm = String(changePasswordForm.elements.namedItem('passwordConfirm')?.value || '');
        const pwdCheck = validatePasswordForSubmit(password);
        if (!pwdCheck.ok) {
          if (passwordError) passwordError.textContent = pwdCheck.error;
          return;
        }
        if (password !== passwordConfirm) {
          if (passwordError) passwordError.textContent = 'Пароли не совпадают.';
          return;
        }
        const response = await api.json('/api/auth/change-password-with-code', {
          method: 'POST',
          body: { code: acceptedPasswordCode, password },
        });
        if (!response.ok) {
          if (passwordError) passwordError.textContent = response.data?.error || 'Не удалось сменить пароль.';
          if (String(response.data?.error || '').includes('истёк') || String(response.data?.error || '').includes('Неверный')) {
            resetPasswordChangeFlow();
          }
          return;
        }
        api.resetCsrf();
        if (passwordSuccess) {
          passwordSuccess.textContent = response.data?.message || 'Пароль обновлён и сохранён в базе данных.';
        }
        resetPasswordChangeFlow();
        if (sendPasswordCodeBtn instanceof HTMLButtonElement) {
          sendPasswordCodeBtn.disabled = false;
        }
      });
    });
  }

  window.addEventListener('hashchange', scrollToCabinetHash);

  if (addAddressBtn instanceof HTMLButtonElement) {
    addAddressBtn.addEventListener('click', () => startAddAddressFlow());
  }

  if (addressChangeMapBtn instanceof HTMLButtonElement) {
    addressChangeMapBtn.addEventListener('click', () => {
      openCabinetAddressMap(pendingAddressLine, (line) => {
        pendingAddressLine = String(line || '').trim();
        if (addressCurrentLine instanceof HTMLElement) {
          addressCurrentLine.textContent = pendingAddressLine || '—';
        }
      });
    });
  }

  if (addressCancelEditBtn instanceof HTMLButtonElement) {
    addressCancelEditBtn.addEventListener('click', () => {
      if (addressesError) addressesError.textContent = '';
      resetAddressForm();
    });
  }

  if (addressForm instanceof HTMLFormElement) {
    addressForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api || !currentUser) return;
      if (addressesError) addressesError.textContent = '';
      if (addressesSuccess) addressesSuccess.textContent = '';

      const label = String(addressForm.elements.namedItem('label')?.value || '').trim();
      const isDefault = !!addressForm.elements.namedItem('is_default')?.checked;
      const isEdit = Number.isInteger(editingAddressId) && editingAddressId > 0;
      if (!isEdit) return;

      const ok = await saveAddressToServer({
        label,
        addressLine: pendingAddressLine,
        isDefault,
        editId: editingAddressId,
      });
      if (!ok) return;

      resetAddressForm();
      await reloadAddresses();
      if (addressesSuccess) addressesSuccess.textContent = 'Адрес обновлён.';
    });
  }

  document.addEventListener('click', async (event) => {
    const target = event.target;
    const editBtn = target instanceof Element ? target.closest('.cabinet-address-edit') : null;
    const deleteBtn = target instanceof Element ? target.closest('.cabinet-address-delete') : null;
    const defaultBtn = target instanceof Element ? target.closest('.cabinet-address-default') : null;
    const cancelOrderBtn = target instanceof Element ? target.closest('.cabinet-order-cancel') : null;

    if (editBtn instanceof HTMLButtonElement && api) {
      const id = Number(editBtn.getAttribute('data-address-id'));
      const address = savedAddresses.find((item) => Number(item.id) === id);
      if (address) {
        if (addressesError) addressesError.textContent = '';
        if (addressesSuccess) addressesSuccess.textContent = '';
        fillAddressForm(address);
      }
      return;
    }

    if (defaultBtn instanceof HTMLButtonElement && api) {
      const id = Number(defaultBtn.getAttribute('data-address-id'));
      if (!Number.isInteger(id)) return;
      if (addressesError) addressesError.textContent = '';
      if (addressesSuccess) addressesSuccess.textContent = '';
      const response = await api.json(`/api/profile/addresses/${id}`, {
        method: 'PATCH',
        body: { is_default: true },
      });
      if (!response.ok) {
        if (addressesError) {
          addressesError.textContent = response.data?.error || 'Не удалось назначить основной адрес.';
        }
        return;
      }
      api.resetCsrf();
      await reloadAddresses();
      if (addressesSuccess) addressesSuccess.textContent = 'Основной адрес обновлён.';
      return;
    }

    if (deleteBtn instanceof HTMLButtonElement && api) {
      const id = Number(deleteBtn.getAttribute('data-address-id'));
      if (!Number.isInteger(id)) return;
      const address = savedAddresses.find((item) => Number(item.id) === id);
      const label = address?.label || address?.address_line || 'адрес';
      if (!window.confirm(`Удалить «${label}» из сохранённых адресов?`)) return;
      if (addressesError) addressesError.textContent = '';
      if (addressesSuccess) addressesSuccess.textContent = '';
      const response = await api.json(`/api/profile/addresses/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        if (addressesError) addressesError.textContent = response.data?.error || 'Не удалось удалить адрес.';
        return;
      }
      api.resetCsrf();
      if (editingAddressId === id) resetAddressForm();
      await reloadAddresses();
      if (addressesSuccess) addressesSuccess.textContent = 'Адрес удалён из базы данных.';
      return;
    }

    if (!(cancelOrderBtn instanceof HTMLButtonElement) || !api) return;
    const orderId = Number(cancelOrderBtn.getAttribute('data-order-id'));
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
    await loadBonusProgram();
    const me = await api.json('/api/auth/me');
    if (me.ok && me.data?.user) {
      currentUser = me.data.user;
      if (bonusValue) bonusValue.textContent = `${Number(currentUser.bonus_balance || 0)}`;
    }
  });

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

  bootstrap();
})();
