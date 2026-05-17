/* ── Auth + cabinet (frontend only, no DB) ── */
(function redirectDriverAwayFromMarketingSite() {
  try {
    const path = (window.location.pathname || '').replace(/\\/g, '/');
    const leaf = path.split(/[/?]/).pop() || '';
    if (/^driver\.html$/i.test(leaf)) return;
    const raw = window.localStorage.getItem('ekvaline_current_user');
    if (!raw) return;
    const u = JSON.parse(raw);
    if (String(u?.role || '').toLowerCase() !== 'driver') return;
    window.location.replace(new URL('driver.html', window.location.href).href);
  } catch {
    /* ignore */
  }
})();

(function initAuthAndCabinet() {
  const USERS_KEY = 'ekvaline_users';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const STAFF_DEMO_ACCOUNTS = {
    'manager@ekvaline.local': { password: 'AquaManager2026', role: 'manager', name: 'Менеджер блога', redirect: 'manager.html' },
    'managerekva@mail.ru': { password: 'ManagerEkva2026!', role: 'manager', name: 'Менеджер блога', redirect: 'manager.html' },
    'operatorekva@mail.ru': { password: 'OperatorEkva2026!', role: 'operator', name: 'Оператор', redirect: 'operator.html' },
    'adminekva@mail.ru': { password: 'AdminEkva2026!', role: 'admin', name: 'Администратор', redirect: 'admin.html' },
  };

  const loginTrigger = document.querySelector('[data-auth-login]');
  const registerTrigger = document.querySelector('[data-auth-register]');
  const contactArea = document.querySelector('.contact-area');
  if (!loginTrigger || !registerTrigger || !contactArea) return;

  const cabinetTrigger = document.createElement('button');
  cabinetTrigger.type = 'button';
  cabinetTrigger.className = 'solid-btn cabinet-trigger';
  cabinetTrigger.textContent = 'Личный кабинет';
  contactArea.appendChild(cabinetTrigger);

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="auth-modal" id="authModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
      <div class="auth-modal-overlay" data-auth-close="true"></div>
      <div class="auth-modal-card" role="document">
        <button class="auth-close" type="button" id="authClose" aria-label="Закрыть окно">×</button>
        <h3 id="authModalTitle">Вход в аккаунт</h3>
        <div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab active" data-auth-tab="login">Вход</button>
          <button type="button" class="auth-tab" data-auth-tab="register">Регистрация</button>
        </div>

        <form id="authLoginForm" class="auth-form" novalidate>
          <label>Email или телефон
            <input type="text" id="authLoginValue" placeholder="Сотрудники: xxxekva@mail.ru (см. консоль npm start); клиент — телефон или email" autocomplete="username" />
          </label>
          <label>Пароль
            <span class="auth-password-wrap">
              <input type="password" id="authLoginPassword" placeholder="Введите пароль" autocomplete="current-password" />
              <button type="button" class="auth-password-toggle" id="authLoginPasswordToggle" aria-label="Показать пароль" aria-pressed="false">
                <svg class="auth-pw-icon auth-pw-icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg class="auth-pw-icon auth-pw-icon-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </span>
          </label>
          <p class="auth-error" id="authLoginError"></p>
          <button type="submit" class="auth-submit">Войти</button>
        </form>

        <form id="authRegisterForm" class="auth-form hidden" novalidate>
          <label>Имя
            <input type="text" id="authRegName" maxlength="40" placeholder="Ваше имя" autocomplete="name" />
          </label>
          <label>Email
            <input type="email" id="authRegEmail" placeholder="example@mail.ru" autocomplete="email" />
          </label>
          <label>Телефон
            <input type="tel" id="authRegPhone" maxlength="18" placeholder="+7 (999) 123-45-67" autocomplete="tel" />
          </label>
          <label>Пароль
            <span class="auth-password-wrap">
              <input type="password" id="authRegPassword" minlength="8" maxlength="128" placeholder="По требованиям сервера: буквы, цифра, символ" autocomplete="new-password" />
              <button type="button" class="auth-password-toggle" id="authRegPasswordToggle" aria-label="Показать пароль" aria-pressed="false">
                <svg class="auth-pw-icon auth-pw-icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg class="auth-pw-icon auth-pw-icon-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </span>
          </label>
          <div class="auth-password-strength" id="authPasswordStrength" aria-live="polite">
            <p class="auth-password-strength-line" id="authPasswordStrengthLine"></p>
            <ul class="auth-password-strength-missing" id="authPasswordStrengthMissing" hidden></ul>
          </div>
          <label>Повторите пароль
            <span class="auth-password-wrap">
              <input type="password" id="authRegPasswordConfirm" minlength="8" maxlength="128" placeholder="Повторите пароль" autocomplete="new-password" />
              <button type="button" class="auth-password-toggle" id="authRegPasswordConfirmToggle" aria-label="Показать пароль" aria-pressed="false">
                <svg class="auth-pw-icon auth-pw-icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg class="auth-pw-icon auth-pw-icon-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </span>
          </label>
          <p class="auth-error" id="authRegisterError"></p>
          <button type="submit" class="auth-submit">Создать аккаунт</button>
        </form>
      </div>
    </div>

    <div class="cabinet" id="cabinet" aria-hidden="true">
      <div class="cabinet-overlay" data-cabinet-close="true"></div>
      <aside class="cabinet-panel">
        <div class="cabinet-head">
          <div>
            <p class="cabinet-kicker">Личный кабинет</p>
            <h3 id="cabinetUserName">Пользователь</h3>
            <p id="cabinetUserMeta">email@example.com</p>
          </div>
          <button type="button" class="cabinet-close" id="cabinetClose" aria-label="Закрыть кабинет">×</button>
        </div>

        <div class="cabinet-layout">
          <nav class="cabinet-nav" aria-label="Разделы кабинета">
            <button type="button" class="cabinet-nav-btn active" data-cabinet-section="notifications">Уведомления</button>
            <button type="button" class="cabinet-nav-btn" data-cabinet-section="orders">Текущие заказы</button>
            <button type="button" class="cabinet-nav-btn" data-cabinet-section="history">История заказов</button>
            <button type="button" class="cabinet-nav-btn" data-cabinet-section="profile">Профиль</button>
          </nav>
          <section class="cabinet-content" id="cabinetContent"></section>
        </div>

        <button type="button" class="cabinet-logout" id="cabinetLogout">Выйти из аккаунта</button>
      </aside>
    </div>
    `
  );

  const authModal = document.getElementById('authModal');
  const authClose = document.getElementById('authClose');
  const authTabs = Array.from(document.querySelectorAll('.auth-tab'));
  const authLoginForm = document.getElementById('authLoginForm');
  const authRegisterForm = document.getElementById('authRegisterForm');

  const authLoginValue = document.getElementById('authLoginValue');
  const authLoginPassword = document.getElementById('authLoginPassword');
  const authLoginError = document.getElementById('authLoginError');

  const authRegName = document.getElementById('authRegName');
  const authRegEmail = document.getElementById('authRegEmail');
  const authRegPhone = document.getElementById('authRegPhone');
  const authRegPassword = document.getElementById('authRegPassword');
  const authRegPasswordConfirm = document.getElementById('authRegPasswordConfirm');
  const authRegisterError = document.getElementById('authRegisterError');
  const authPasswordStrength = document.getElementById('authPasswordStrength');
  const authPasswordStrengthLine = document.getElementById('authPasswordStrengthLine');
  const authPasswordStrengthMissing = document.getElementById('authPasswordStrengthMissing');
  const authRegSubmit = authRegisterForm.querySelector('.auth-submit');

  function wireAuthPasswordToggle(toggleBtn, input) {
    if (!(toggleBtn instanceof HTMLButtonElement) || !(input instanceof HTMLInputElement)) return;
    function syncUi() {
      const visible = input.type === 'text';
      toggleBtn.classList.toggle('is-visible', visible);
      toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
    }
    toggleBtn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      syncUi();
    });
    syncUi();
  }

  wireAuthPasswordToggle(document.getElementById('authLoginPasswordToggle'), authLoginPassword);
  wireAuthPasswordToggle(document.getElementById('authRegPasswordToggle'), authRegPassword);
  wireAuthPasswordToggle(document.getElementById('authRegPasswordConfirmToggle'), authRegPasswordConfirm);

  const cabinet = document.getElementById('cabinet');
  const cabinetClose = document.getElementById('cabinetClose');
  const cabinetLogout = document.getElementById('cabinetLogout');
  const cabinetUserName = document.getElementById('cabinetUserName');
  const cabinetUserMeta = document.getElementById('cabinetUserMeta');
  const cabinetContent = document.getElementById('cabinetContent');
  const cabinetNavButtons = Array.from(document.querySelectorAll('.cabinet-nav-btn'));

  function readUsers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function readCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function normalizeName(value) {
    return value.replace(/\s+/g, ' ').trim();
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

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
  }

  const PASSWORD_MIN = 8;
  const PASSWORD_MAX = 128;
  const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  function getRegisterPasswordStrength(value) {
    const s = String(value || '');
    const len = s.length;
    if (len > PASSWORD_MAX) {
      return {
        level: 'weak',
        line: `Слишком длинный пароль: максимум ${PASSWORD_MAX} символов (сейчас ${len}).`,
        missing: [],
      };
    }
    if (len < PASSWORD_MIN) {
      const need = PASSWORD_MIN - len;
      const line =
        len === 0
          ? `Минимум ${PASSWORD_MIN} символов.`
          : `Не хватает символов: ещё ${need} до ${PASSWORD_MIN} (сейчас ${len}).`;
      return { level: 'weak', line, missing: [] };
    }
    const missing = [];
    if (!/[A-ZА-ЯЁ]/.test(s)) {
      missing.push('заглавную букву (русскую или латинскую)');
    }
    if (!/[a-zа-яё]/.test(s)) {
      missing.push('строчную букву (русскую или латинскую)');
    }
    if (!/\d/.test(s)) {
      missing.push('цифру');
    }
    if (!PASSWORD_SPECIAL_RE.test(s)) {
      missing.push('спецсимвол из набора !@#$%^&*…');
    }
    if (missing.length > 0) {
      return {
        level: 'medium',
        line: 'Условия почти выполнены — добавьте:',
        missing,
      };
    }
    return {
      level: 'strong',
      line: 'Пароль подходит — можно создавать учётную запись.',
      missing: [],
    };
  }

  function isStrongPassword(value) {
    return getRegisterPasswordStrength(value).level === 'strong';
  }

  function syncRegisterPasswordStrength() {
    if (
      !(authPasswordStrength instanceof HTMLElement) ||
      !(authPasswordStrengthLine instanceof HTMLElement) ||
      !(authPasswordStrengthMissing instanceof HTMLElement) ||
      !(authRegSubmit instanceof HTMLButtonElement) ||
      !(authRegPassword instanceof HTMLInputElement)
    ) {
      return;
    }
    const strength = getRegisterPasswordStrength(authRegPassword.value);
    authPasswordStrength.classList.remove('is-weak', 'is-medium', 'is-strong');
    authPasswordStrength.classList.add(
      strength.level === 'strong' ? 'is-strong' : strength.level === 'medium' ? 'is-medium' : 'is-weak',
    );
    authPasswordStrengthLine.textContent = strength.line;
    if (strength.missing.length > 0) {
      authPasswordStrengthMissing.hidden = false;
      authPasswordStrengthMissing.innerHTML = '';
      for (const m of strength.missing) {
        const li = document.createElement('li');
        li.textContent = m;
        authPasswordStrengthMissing.appendChild(li);
      }
    } else {
      authPasswordStrengthMissing.hidden = true;
      authPasswordStrengthMissing.innerHTML = '';
    }
    authRegSubmit.disabled = strength.level !== 'strong';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function validateProfileData(data) {
    if (!data.name || data.name.length < 2 || !/^[A-Za-zА-Яа-яЁё\s\-']{2,40}$/.test(data.name)) {
      return 'Имя должно содержать 2-40 символов и только буквы.';
    }
    const mail = String(data.email ?? '').trim();
    if (!mail) {
      return 'Поле email пустое — заполните его.';
    }
    if (!isValidEmail(mail)) {
      return 'Введите корректный email.';
    }
    if (data.phone.length !== 11 || data.phone[0] !== '7') {
      return 'Введите телефон в формате +7 (999) 123-45-67.';
    }
    return '';
  }

  function saveProfileData(userId, data) {
    const users = readUsers();
    const duplicated = users.some((item) => (item.email === data.email || item.phone === data.phone) && item.id !== userId);
    if (duplicated) {
      return { ok: false, error: 'Этот email или телефон уже используется другим аккаунтом.' };
    }

    const index = users.findIndex((item) => item.id === userId);
    if (index < 0) {
      return { ok: false, error: 'Не удалось найти профиль пользователя.' };
    }

    users[index] = {
      ...users[index],
      name: data.name,
      email: data.email,
      phone: data.phone,
    };
    saveUsers(users);

    const current = {
      id: users[index].id,
      name: users[index].name,
      email: users[index].email,
      phone: users[index].phone,
    };
    saveCurrentUser(current);
    return { ok: true, user: current };
  }

  function openAuthModal(tab) {
    switchAuthTab(tab);
    authModal.classList.add('open');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    authModal.classList.remove('open');
    authModal.setAttribute('aria-hidden', 'true');
    if (!cabinet.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function renderCabinetSection(section, user) {
    const sections = {
      notifications: `
        <div class="cabinet-card-head">
          <h4>Уведомления</h4>
          <span class="cabinet-pill">3 новых</span>
        </div>
        <div class="cabinet-card-list">
          <article class="cabinet-list-item">
            <p>Ваш последний заказ №4821 принят в обработку.</p>
            <small>2 минуты назад</small>
          </article>
          <article class="cabinet-list-item">
            <p>Доставка по городу бесплатная для всех заказов.</p>
            <small>сегодня</small>
          </article>
          <article class="cabinet-list-item">
            <p>Напоминание: у вас осталось мало воды по прогнозу потребления.</p>
            <small>вчера</small>
          </article>
        </div>
      `,
      orders: `
        <div class="cabinet-card-head">
          <h4>Текущие заказы</h4>
          <span class="cabinet-pill">1 активный</span>
        </div>
        <div class="cabinet-order-card">
          <p><strong>Заказ №4821</strong></p>
          <p>Состав: 2 x 19л</p>
          <p>Статус: <span class="cabinet-status">Курьер выехал</span></p>
          <p>Адрес: Оренбург, ул. Ветеранов труда, 15а</p>
          <p>Окно доставки: сегодня с 16:00 до 18:00</p>
        </div>
      `,
      history: `
        <div class="cabinet-card-head">
          <h4>История заказов</h4>
          <span class="cabinet-pill">3 заказа</span>
        </div>
        <div class="cabinet-history-list">
          <article class="cabinet-history-item"><span>№4718</span><span>26.03.2026</span><span>3 x 19л</span><strong>450 ₽</strong></article>
          <article class="cabinet-history-item"><span>№4651</span><span>11.03.2026</span><span>2 x 19л</span><strong>400 ₽</strong></article>
          <article class="cabinet-history-item"><span>№4593</span><span>25.02.2026</span><span>1 x 19л</span><strong>200 ₽</strong></article>
        </div>
      `,
      profile: `
        <div class="cabinet-card-head">
          <h4>Профиль</h4>
          <span class="cabinet-pill">Редактирование</span>
        </div>
        <p class="cabinet-muted">Обновляйте контактные данные для корректных уведомлений и доставки.</p>
        <form id="cabinetProfileForm" class="cabinet-profile-form" novalidate>
          <label>Имя
            <input type="text" id="cabinetProfileName" maxlength="40" value="${escapeHtml(user.name)}" />
          </label>
          <label>Email
            <input type="email" id="cabinetProfileEmail" value="${escapeHtml(user.email)}" />
          </label>
          <label>Телефон
            <input type="tel" id="cabinetProfilePhone" maxlength="18" value="${escapeHtml(formatPhoneMask(user.phone))}" />
          </label>
          <p class="cabinet-profile-error" id="cabinetProfileError"></p>
          <p class="cabinet-profile-success" id="cabinetProfileSuccess"></p>
          <button type="submit" class="cabinet-profile-save">Сохранить изменения</button>
        </form>
      `,
    };
    cabinetContent.innerHTML = `<div class="cabinet-section">${sections[section] || sections.notifications}</div>`;

    if (section === 'profile') {
      const profileForm = document.getElementById('cabinetProfileForm');
      const profileName = document.getElementById('cabinetProfileName');
      const profileEmail = document.getElementById('cabinetProfileEmail');
      const profilePhone = document.getElementById('cabinetProfilePhone');
      const profileError = document.getElementById('cabinetProfileError');
      const profileSuccess = document.getElementById('cabinetProfileSuccess');

      if (!profileForm || !profileName || !profileEmail || !profilePhone || !profileError || !profileSuccess) return;

      profilePhone.addEventListener('input', () => {
        profilePhone.value = formatPhoneMask(profilePhone.value);
      });

      profileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        profileError.textContent = '';
        profileSuccess.textContent = '';

        const payload = {
          name: normalizeName(profileName.value),
          email: profileEmail.value.trim().toLowerCase(),
          phone: normalizePhoneDigits(profilePhone.value),
        };

        const validationError = validateProfileData(payload);
        if (validationError) {
          profileError.textContent = validationError;
          return;
        }

        const result = saveProfileData(user.id, payload);
        if (!result.ok) {
          profileError.textContent = result.error;
          return;
        }

        profileName.value = result.user.name;
        profileEmail.value = result.user.email;
        profilePhone.value = formatPhoneMask(result.user.phone);
        cabinetUserName.textContent = result.user.name;
        cabinetUserMeta.textContent = `${result.user.email} · ${formatPhoneMask(result.user.phone)}`;
        profileSuccess.textContent = 'Профиль успешно обновлен.';
      });
    }
  }

  function openCabinet() {
    const user = readCurrentUser();
    if (!user) {
      openAuthModal('login');
      return;
    }
    const roleLc = String(user.role || 'client').toLowerCase();
    if (roleLc === 'manager') {
      window.location.href = 'manager.html';
      return;
    }
    if (roleLc === 'admin') {
      window.location.href = 'admin.html';
      return;
    }
    if (roleLc === 'operator') {
      window.location.href = 'operator.html';
      return;
    }
    if (roleLc === 'driver') {
      window.location.href = 'driver.html';
      return;
    }
    /** Отложить навигацию на тик цикла — чтобы браузер успел записать cookie сессии после login/register. */
    window.setTimeout(() => {
      window.location.href = 'cabinet.html';
    }, 0);
  }

  function closeCabinet() {
    cabinet.classList.remove('open');
    cabinet.setAttribute('aria-hidden', 'true');
    if (!authModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    authTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.authTab === tab));
    authLoginForm.classList.toggle('hidden', !isLogin);
    authRegisterForm.classList.toggle('hidden', isLogin);
    document.getElementById('authModalTitle').textContent = isLogin ? 'Вход в аккаунт' : 'Регистрация аккаунта';
    authLoginError.textContent = '';
    authRegisterError.textContent = '';
    if (!isLogin) {
      syncRegisterPasswordStrength();
    }
  }

  authRegPassword.addEventListener('input', () => syncRegisterPasswordStrength());
  syncRegisterPasswordStrength();

  function isStandaloneCabinetPage() {
    try {
      const name = (window.location.pathname || '').replace(/\\/g, '/').split('/').pop() || '';
      return /^cabinet\.html$/i.test(name);
    } catch {
      return false;
    }
  }

  /** Колокольчик уведомлений в шапке — только при сохранённом аккаунте (вход или регистрация). */
  function syncTopbarNotifications() {
    const mount = document.getElementById('topbarNotifications');
    if (!(mount instanceof HTMLElement)) return;

    const app = window.EkvalineApp;

    const user = readCurrentUser();
    if (!user) {
      if (app && typeof app.teardownNotificationsUI === 'function') {
        app.teardownNotificationsUI(mount);
      } else {
        mount.innerHTML = '';
        delete mount.dataset.notifInited;
      }
      delete mount.dataset.notifBootstrapped;
      mount.setAttribute('aria-hidden', 'true');
      return;
    }

    mount.removeAttribute('aria-hidden');
    if (!(app && typeof app.initNotificationsUI === 'function')) return;
    mount.dataset.notifBootstrapped = '1';
    app.initNotificationsUI(mount);
  }

  function updateHeaderAuth() {
    const user = readCurrentUser();
    const roleLc = String(user?.role || '').toLowerCase();
    const isLoggedIn = Boolean(user) && roleLc !== 'manager';
    loginTrigger.style.display = isLoggedIn ? 'none' : 'inline-flex';
    registerTrigger.style.display = isLoggedIn ? 'none' : 'inline-flex';
    const onCabinetPage = isStandaloneCabinetPage();
    cabinetTrigger.style.display = isLoggedIn && !onCabinetPage ? 'inline-flex' : 'none';
    syncTopbarNotifications();
  }

  window.__ekvalineUpdateHeaderAuth = updateHeaderAuth;

  loginTrigger.addEventListener('click', () => openAuthModal('login'));
  registerTrigger.addEventListener('click', () => openAuthModal('register'));
  cabinetTrigger.addEventListener('click', openCabinet);

  authTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
  });

  authRegPhone.addEventListener('input', () => {
    authRegPhone.value = formatPhoneMask(authRegPhone.value);
  });

  authModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.authClose === 'true') {
      closeAuthModal();
    }
  });
  authClose.addEventListener('click', closeAuthModal);

  /**
   * После POST /api/auth/register клиент видит только: валидация полей (400), занят email/телефон (409),
   * просьба обновить страницу при проблеме сессии (403); прочие сбои — одна нейтральная фраза без технических деталей.
   */
  function registerSubmitErrorFromApi(status, data) {
    const st = Number(status) || 0;
    const raw = data && typeof data.error === 'string' ? data.error.trim() : '';
    if (st === 400 && raw) return raw;
    if (st === 409) return 'Этот email или телефон уже зарегистрированы.';
    if (st === 403) return 'Сессия устарела. Обновите страницу и попробуйте снова.';
    return 'Сейчас регистрацию оформить не получилось. Попробуйте чуть позже или обновите страницу.';
  }

  authLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authLoginError.textContent = '';

    const credential = authLoginValue.value.trim();
    const password = authLoginPassword.value;
    const byEmail = credential.toLowerCase();
    const byPhone = normalizePhoneDigits(credential);

    if (!credential || !password) {
      authLoginError.textContent = 'Укажите логин (email организации или телефон/email для клиента) и пароль.';
      return;
    }

    const looksLikeEmail = /\S@\S/.test(credential);
    const staff = looksLikeEmail ? STAFF_DEMO_ACCOUNTS[byEmail] : undefined;
    if (staff) {
      if (password !== staff.password) {
        authLoginError.textContent = 'Неверный пароль сотрудника.';
        return;
      }
      const skipServerSession = byEmail === 'manager@ekvaline.local';
      if (skipServerSession) {
        saveCurrentUser({
          id: staff.role,
          name: staff.name,
          email: byEmail,
          phone: '',
          role: staff.role,
        });
        closeAuthModal();
        window.location.href = staff.redirect;
        return;
      }
      const api = window.EkvalineAPI;
      if (!api || typeof api.json !== 'function') {
        authLoginError.textContent =
          'Вход сотрудника требует сервер: в папке проекта npm start и адрес http://localhost:3001 (не файл с диска).';
        return;
      }
      const r = await api.json('/api/auth/login', {
        method: 'POST',
        body: { credential, password },
      });
      if (!r.ok) {
        authLoginError.textContent = String(
          r.data?.error || 'Сервер отклонил вход. Проверьте, что БД запущена и есть демо-пользователи (см. вывод npm start).'
        );
        return;
      }
      const u = r.data?.user;
      if (!u || String(u.role || '').toLowerCase() !== staff.role) {
        authLoginError.textContent = 'Учётная запись в базе не совпадает с ролью оператора/админа. Обратитесь к администратору БД.';
        return;
      }
      api.resetCsrf?.();
      const displayName =
        String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() || u.email || staff.name;
      saveCurrentUser({
        id: u.id,
        name: displayName,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
        bonus_balance: u.bonus_balance,
      });
      closeAuthModal();
      window.location.href = staff.redirect;
      return;
    }

    const user = readUsers().find((item) => item.email === byEmail || item.phone === byPhone);
    const apiCli = window.EkvalineAPI;
    if (apiCli?.json) {
      let rApi;
      try {
        rApi = await apiCli.json('/api/auth/login', {
          method: 'POST',
          body: { credential, password },
        });
      } catch {
        authLoginError.textContent =
          'Не удалось связаться с сервером. Запустите в папке проекта команду запуска и откройте сайт по адресу с номером порта (не файл с диска и не режим предпросмотра без сервера).';
        return;
      }
      if (rApi.ok && rApi.data?.user) {
        const u = rApi.data.user;
        apiCli.resetCsrf?.();
        const displayName =
          String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() || u.email;
        saveCurrentUser({
          id: u.id,
          name: displayName,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          first_name: u.first_name,
          last_name: u.last_name,
          bonus_balance: u.bonus_balance,
        });
        updateHeaderAuth();
        closeAuthModal();
        const roleAfterLogin = String(u.role || '').toLowerCase();
        if (roleAfterLogin === 'driver') {
          window.location.href = 'driver.html';
          return;
        }
        window.setTimeout(() => openCabinet(), 50);
        return;
      }
      if (rApi.status === 401) {
        authLoginError.textContent = String(rApi.data?.error || 'Неверный логин или пароль.');
        return;
      }
      if (rApi.status === 423) {
        authLoginError.textContent = String(rApi.data?.error || 'Вход временно заблокирован.');
        return;
      }
      if (rApi.status === 403) {
        const raw = String(rApi.data?.error || '');
        authLoginError.textContent = /csrf|токен/i.test(raw)
          ? 'Сессия устарела. Обновите страницу и войдите снова.'
          : raw || 'Вход сейчас недоступен. Попробуйте позже.';
        return;
      }
      if (Number(rApi.status) > 0 && rApi.status !== 401) {
        authLoginError.textContent = 'Не удалось войти. Проверьте подключение к интернету или попробуйте позже.';
        return;
      }
    }

    if (!user || user.password !== password) {
      authLoginError.textContent = 'Неверные данные для входа.';
      return;
    }

    saveCurrentUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
    updateHeaderAuth();
    closeAuthModal();
    openCabinet();
  });

  authRegisterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authRegisterError.textContent = '';

    const name = normalizeName(authRegName.value);
    const email = authRegEmail.value.trim().toLowerCase();
    const phone = normalizePhoneDigits(authRegPhone.value);
    const password = authRegPassword.value;
    const passwordConfirm = authRegPasswordConfirm.value;

    if (!name) {
      authRegisterError.textContent = 'Поле «Имя» пустое — заполните его.';
      return;
    }
    if (name.length < 2 || name.length > 40 || !/^[A-Za-zА-Яа-яЁё\s\-']{2,40}$/.test(name)) {
      authRegisterError.textContent = 'Имя должно содержать 2–40 символов и только буквы, пробел, дефис или апостроф.';
      return;
    }
    if (!email) {
      authRegisterError.textContent = 'Поле email пустое — заполните его.';
      return;
    }
    if (!isValidEmail(email)) {
      authRegisterError.textContent = 'Введите корректный email.';
      return;
    }
    if (STAFF_DEMO_ACCOUNTS[email]) {
      authRegisterError.textContent = 'Этот логин зарезервирован для служебного аккаунта.';
      return;
    }
    if (!phone.length) {
      authRegisterError.textContent = 'Поле телефона пустое — заполните его.';
      return;
    }
    if (phone.length !== 11 || phone[0] !== '7') {
      authRegisterError.textContent = 'Введите телефон в формате +7 (999) 123-45-67.';
      return;
    }
    if (!String(password || '').trim()) {
      authRegisterError.textContent = 'Поле «Пароль» пустое — заполните его.';
      return;
    }
    if (!isStrongPassword(password)) {
      authRegisterError.textContent =
        'Пароль: 8–128 символов, нужны заглавная и строчная буквы, цифра и спецсимвол (!@#$…).';
      return;
    }
    if (!String(passwordConfirm || '').trim()) {
      authRegisterError.textContent = 'Поле «Повторите пароль» пустое — его нужно заполнить.';
      return;
    }
    if (password !== passwordConfirm) {
      authRegisterError.textContent = 'Пароли не совпадают.';
      return;
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    const first_name = nameParts[0] || name;
    const last_name = nameParts.slice(1).join(' ');
    const apiReg = window.EkvalineAPI;
    if (apiReg?.json) {
      let rReg;
      try {
        rReg = await apiReg.json('/api/auth/register', {
          method: 'POST',
          body: { first_name, last_name: last_name || '', email, phone, password },
        });
      } catch {
        authRegisterError.textContent =
          'Сейчас регистрацию оформить не получилось. Попробуйте чуть позже или обновите страницу.';
        return;
      }
      if (!rReg || typeof rReg !== 'object') {
        authRegisterError.textContent =
          'Сейчас регистрацию оформить не получилось. Попробуйте чуть позже или обновите страницу.';
        return;
      }
      if (rReg.ok && rReg.data?.user) {
        const u = rReg.data.user;
        apiReg.resetCsrf?.();
        const displayName =
          String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() || u.email;
        const registeredAt = new Date().toISOString();
        saveCurrentUser({
          id: u.id,
          name: displayName,
          email: u.email,
          phone: u.phone || '',
          role: u.role || 'client',
          first_name: u.first_name,
          last_name: u.last_name,
          bonus_balance: u.bonus_balance,
        });
        window.EkvalineApp?.stampRegistrationWelcomeNotifications?.(registeredAt);
        updateHeaderAuth();
        closeAuthModal();
        openCabinet();
        return;
      }
      authRegisterError.textContent = registerSubmitErrorFromApi(rReg.status, rReg.data);
      return;
    }

    const users = readUsers();
    const exists = users.some((item) => item.email === email || item.phone === phone);
    if (exists) {
      authRegisterError.textContent = 'Этот email или телефон уже зарегистрированы.';
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);
    const registeredAt = new Date().toISOString();
    saveCurrentUser({ id: newUser.id, name, email, phone });
    window.EkvalineApp?.stampRegistrationWelcomeNotifications?.(registeredAt);
    updateHeaderAuth();
    closeAuthModal();
    openCabinet();
  });

  cabinet.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.cabinetClose === 'true') {
      closeCabinet();
    }
  });
  cabinetClose.addEventListener('click', closeCabinet);

  cabinetNavButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      cabinetNavButtons.forEach((item) => item.classList.remove('active'));
      btn.classList.add('active');
      const user = readCurrentUser();
      if (!user) return;
      renderCabinetSection(btn.dataset.cabinetSection, user);
    });
  });

  cabinetLogout.addEventListener('click', async () => {
    try {
      if (window.EkvalineAPI?.json) {
        await window.EkvalineAPI.json('/api/auth/logout', { method: 'POST', body: {} });
        window.EkvalineAPI.resetCsrf?.();
      }
    } catch {
      /* ignore */
    }
    clearCurrentUser();
    closeCabinet();
    updateHeaderAuth();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (cabinet.classList.contains('open')) closeCabinet();
    if (authModal.classList.contains('open')) closeAuthModal();
  });

  updateHeaderAuth();

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('need-login') === '1') {
      openAuthModal('login');
      if (typeof history.replaceState === 'function') {
        history.replaceState({}, '', window.location.pathname || '/');
      }
    }
  } catch {
    /* ignore */
  }
})();

/* ── Cart + checkout (frontend only, no DB) ── */
(function initCartAndCheckout() {
  const CART_KEY = 'ekvaline_cart_items';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_KEY = 'ekvaline_orders_by_user';
  const ORDER_SEQ_KEY = 'ekvaline_order_seq';
  const ADDRESSES_KEY = 'ekvaline_addresses_by_user';
  const BONUSES_KEY = 'ekvaline_bonuses_by_user';
  const WATER_MAX_QTY = 50;
  const CHECKOUT_ADDRESS_MAX = 220;
  const CHECKOUT_COMMENT_MAX = 500;
  const MAP_DEFAULT_CENTER = [51.768199, 55.096955];
  const MAP_DEFAULT_ZOOM = 12;
  const DEFAULT_CITY = 'Оренбург';
  const ORENBURG_VIEWBOX = '54.95,51.95,55.55,51.55';
  const ORENBURG_STREETS = [
    { name: 'Салмышская', type: 'улица', popularity: 10 },
    { name: 'Родимцева', type: 'улица', popularity: 9 },
    { name: 'Пролетарская', type: 'улица', popularity: 9 },
    { name: 'Просторная', type: 'улица', popularity: 8 },
    { name: 'Терешковой', type: 'улица', popularity: 8 },
    { name: 'Чкалова', type: 'улица', popularity: 8 },
    { name: 'Советская', type: 'улица', popularity: 8 },
    { name: 'Туркестанская', type: 'улица', popularity: 7 },
    { name: 'Брестская', type: 'улица', popularity: 7 },
    { name: 'Комсомольская', type: 'улица', popularity: 7 },
    { name: 'Победы', type: 'проспект', popularity: 7 },
    { name: 'Донгузская', type: 'улица', popularity: 6 },
    { name: 'Монтажников', type: 'улица', popularity: 6 },
    { name: 'Новая', type: 'улица', popularity: 6 },
    { name: 'Гаранькина', type: 'улица', popularity: 6 },
    { name: 'Ткачева', type: 'улица', popularity: 6 },
    { name: 'Автомобилистов', type: 'улица', popularity: 6 },
    { name: 'Поляничко', type: 'улица', popularity: 6 },
    { name: 'Дзержинского', type: 'проспект', popularity: 6 },
    { name: 'Больничный', type: 'переулок', popularity: 6 },
    { name: 'Почтовый', type: 'переулок', popularity: 5 },
  ];

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

  function readCart() {
    const raw = safeParse(localStorage.getItem(CART_KEY), []);
    if (!Array.isArray(raw)) return [];
    const normalized = normalizeCartItems(raw);
    return normalized;
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
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

  function extractOrderNumber(rawId) {
    if (typeof rawId === 'number' && Number.isFinite(rawId)) return Math.max(0, Math.floor(rawId));
    const text = String(rawId || '').trim();
    let match = text.match(/^ЛС-(\d{1,12})$/i);
    if (match) return Number(match[1]) || 0;
    match = text.match(/^ORD-(\d{6,})$/i);
    if (match) return Number(match[1].slice(-6)) || 0;
    match = text.match(/(\d{3,12})/);
    if (match) return Number(match[1]) || 0;
    return 0;
  }

  function formatOrderId(numberValue) {
    const n = Math.max(1, Math.floor(Number(numberValue) || 1));
    return `ЛС-${String(n).padStart(6, '0')}`;
  }

  function normalizeAllOrderIds() {
    const allOrders = safeParse(localStorage.getItem(ORDERS_KEY), {});
    if (!allOrders || typeof allOrders !== 'object') return;
    let maxNum = Math.max(253000, Number(localStorage.getItem(ORDER_SEQ_KEY)) || 0);

    Object.keys(allOrders).forEach((uid) => {
      const list = Array.isArray(allOrders[uid]) ? allOrders[uid] : [];
      list.forEach((order) => {
        const num = extractOrderNumber(order?.id);
        if (num > maxNum) maxNum = num;
      });
    });

    const used = new Set();
    let changed = false;
    Object.keys(allOrders).forEach((uid) => {
      const list = Array.isArray(allOrders[uid]) ? allOrders[uid] : [];
      allOrders[uid] = list.map((order) => {
        const currentId = String(order?.id || '');
        const currentNum = extractOrderNumber(currentId);
        const isGoodFormat = /^ЛС-\d{6,}$/i.test(currentId);
        const canKeep = isGoodFormat && currentNum > 0 && !used.has(currentNum);
        if (canKeep) {
          used.add(currentNum);
          return order;
        }
        if (isGoodFormat && currentNum > 0 && !used.has(currentNum)) {
          used.add(currentNum);
          return order;
        }
        maxNum += 1;
        while (used.has(maxNum)) maxNum += 1;
        used.add(maxNum);
        changed = true;
        return { ...order, id: formatOrderId(maxNum) };
      });
    });

    if (changed) localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
    localStorage.setItem(ORDER_SEQ_KEY, String(maxNum));
  }

  function nextOrderId() {
    let seq = Math.max(253000, Number(localStorage.getItem(ORDER_SEQ_KEY)) || 0);
    seq += 1;
    localStorage.setItem(ORDER_SEQ_KEY, String(seq));
    return formatOrderId(seq);
  }

  function parsePrice(value) {
    const matches = String(value || '')
      .replace(/\s/g, '')
      .match(/(\d+)/g);
    if (!matches || !matches.length) return 0;
    return Number(matches[matches.length - 1]) || 0;
  }

  normalizeAllOrderIds();

  function isWaterProduct(title) {
    return /вода\s*18\.?9л/i.test(String(title || ''));
  }

  function getWaterUnitPrice(qty) {
    if (qty >= 5) return 175;
    if (qty >= 2) return 190;
    return 220;
  }

  function hasPreorderMark(card) {
    if (!(card instanceof HTMLElement)) return false;
    return Boolean(card.querySelector('.preorder-mark'));
  }

  function buildCartItemFromCard(card) {
    if (!(card instanceof HTMLElement)) return null;
    const title = card.querySelector('h3')?.textContent?.trim() || 'Товар';
    const priceText = card.querySelector('.full-card-price, .catalog-price')?.textContent || '';
    const preorder = hasPreorderMark(card) || /уточнять/i.test(priceText);
    const water = isWaterProduct(title);
    const id = water ? 'water_18_9' : title.toLowerCase().replace(/\s+/g, '_');
    const price = preorder ? 0 : parsePrice(priceText);
    return { id, title, price, qty: 1, water, preorder };
  }

  function normalizeCartItems(items) {
    const merged = new Map();
    items.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const title = String(item.title || 'Товар').trim();
      const qty = Math.max(0, Number(item.qty) || 0);
      if (!qty) return;
      const legacyWater =
        item.water === true || isWaterProduct(title) || String(item.id || '').toLowerCase().includes('water');
      const preorder = item.preorder === true;
      const id = legacyWater
        ? 'water_18_9'
        : String(item.id || title.toLowerCase().replace(/\s+/g, '_'));
      const price = preorder ? 0 : Math.max(0, Number(item.price) || 0);
      const key = preorder ? `${id}__preorder` : id;
      const prev = merged.get(key);
      if (prev) {
        prev.qty += qty;
        if (!prev.price && price) prev.price = price;
      } else {
        merged.set(key, { id, title, price, qty, water: legacyWater, preorder });
      }
    });
    return Array.from(merged.values()).map((item) =>
      item.water ? { ...item, qty: Math.min(item.qty, WATER_MAX_QTY) } : item
    );
  }

  const isCatalogPage = document.body.classList.contains('catalog-page');
  const contactArea = document.querySelector('.contact-area');
  if (!isCatalogPage || !contactArea) return;
  const cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'cart-floating-btn cart-trigger-btn';
  cartBtn.textContent = 'Корзина (0)';
  document.body.classList.add('has-floating-cart');
  document.body.appendChild(cartBtn);

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="cart-modal" id="cartModal" aria-hidden="true">
      <div class="cart-modal-overlay" data-cart-close="true"></div>
      <div class="cart-modal-card" role="dialog" aria-modal="true" aria-labelledby="cartModalTitle">
        <button type="button" class="cart-modal-close" data-cart-close="true">×</button>
        <h3 id="cartModalTitle">Корзина</h3>
        <div id="cartItemsList" class="cart-items-list"></div>
        <p id="cartErrorText" class="cart-error-text" aria-live="polite"></p>
        <div class="cart-total-row"><span>Итого:</span><strong id="cartTotalPrice">0 ₽</strong></div>
        <button type="button" class="auth-submit" id="openCheckoutBtn">Оформить заказ</button>
      </div>
    </div>

    <div class="cart-modal" id="checkoutModal" aria-hidden="true">
      <div class="cart-modal-overlay" data-checkout-close="true"></div>
      <div class="cart-modal-card checkout-modal-card" role="dialog" aria-modal="true" aria-labelledby="checkoutModalTitle">
        <button type="button" class="cart-modal-close" data-checkout-close="true">×</button>
        <h3 id="checkoutModalTitle">Оформление заказа</h3>
        <p class="checkout-subtitle">Проверьте данные перед подтверждением заказа.</p>
        <form id="checkoutForm" class="checkout-form" novalidate>
          <label class="checkout-field">Адрес доставки
            <input type="text" id="checkoutAddressInput" name="address" maxlength="${CHECKOUT_ADDRESS_MAX}" required placeholder="Сначала выберите адрес на карте" readonly />
            <button type="button" class="checkout-map-btn" id="openMapPickerBtn">Выбрать на карте</button>
          </label>
          <label class="checkout-field">Дата доставки
            <input type="date" id="checkoutDeliveryDate" name="deliveryDate" required />
          </label>
          <label class="checkout-field">Интервал доставки
            <select id="checkoutDeliverySlot" name="deliverySlot" required>
              <option value="09:00-14:00">09:00–14:00</option>
              <option value="14:00-17:00">14:00–17:00</option>
              <option value="17:00-21:00">17:00–21:00</option>
              <option value="09:00-17:00">Для организации: 09:00–17:00</option>
            </select>
          </label>
          <label class="checkout-field">Комментарий к заказу
            <textarea id="checkoutCommentField" name="comment" maxlength="${CHECKOUT_COMMENT_MAX}" placeholder="Например: позвонить за 30 минут"></textarea>
            <span class="checkout-field-hint" id="checkoutCommentCounter">0/${CHECKOUT_COMMENT_MAX}</span>
          </label>
          <label class="checkout-field">Списать бонусы
            <input type="number" name="bonusSpend" min="0" step="1" value="0" />
          </label>
          <p class="checkout-meta" id="checkoutMetaText"></p>
          <button type="submit" class="auth-submit">Подтвердить заказ</button>
        </form>
      </div>
    </div>

    <div class="cart-modal" id="mapPickerModal" aria-hidden="true">
      <div class="cart-modal-overlay" data-map-close="true"></div>
      <div class="cart-modal-card map-picker-card" role="dialog" aria-modal="true" aria-labelledby="mapPickerTitle">
        <button type="button" class="cart-modal-close" data-map-close="true">×</button>
        <h3 id="mapPickerTitle">Выбор адреса на карте</h3>
        <p class="checkout-subtitle">Заполните поля адреса, карта автоматически покажет точку.</p>
        <div class="checkout-map-form">
          <label class="checkout-field">Город
            <input type="text" id="mapCityInput" maxlength="60" placeholder="Например: Москва" list="mapCitySuggestions" autocomplete="off" />
          </label>
          <label class="checkout-field">Улица
            <div class="address-suggest-wrap">
              <input type="text" id="mapStreetInput" maxlength="80" placeholder="Например: Тверская" autocomplete="off" />
              <button type="button" id="clearMapStreetBtn" class="address-input-clear" aria-label="Очистить улицу" title="Очистить">×</button>
              <div id="mapStreetDropdown" class="address-suggest-dropdown" hidden></div>
            </div>
          </label>
          <label class="checkout-field">Дом
            <input type="text" id="mapHouseInput" maxlength="20" placeholder="Например: 12" />
          </label>
          <label class="checkout-field">Квартира
            <input type="text" id="mapApartmentInput" maxlength="10" placeholder="Например: 45" />
          </label>
          <label class="checkout-field">Этаж
            <input type="text" id="mapFloorInput" maxlength="10" placeholder="Например: 6" />
          </label>
          <label class="checkout-field">Подъезд
            <input type="text" id="mapEntranceInput" maxlength="10" placeholder="Например: 2" />
          </label>
        </div>
        <p id="mapApartmentRequirementsHint" class="checkout-map-validation-hint" hidden>
          Если указана квартира, обязательно заполните этаж и подъезд.
        </p>
        <datalist id="mapCitySuggestions"></datalist>
        <div id="checkoutMapRoot" class="checkout-map-root"></div>
        <p id="checkoutMapAddress" class="checkout-map-address">Адрес не выбран.</p>
        <p class="checkout-map-picker-hint">Если адрес не находится, выберите точку на карте сами.</p>
        <div class="checkout-map-actions">
          <button type="button" class="catalog-more-btn" data-map-close="true">Отмена</button>
          <button type="button" class="auth-submit" id="applyMapAddressBtn" disabled>Использовать адрес</button>
        </div>
      </div>
    </div>
    <div id="appToast" class="app-toast" hidden>
      <div class="app-toast-card" role="status" aria-live="polite">
        <p id="appToastText" class="app-toast-text"></p>
        <button type="button" id="appToastClose" class="app-toast-close" aria-label="Закрыть уведомление">×</button>
      </div>
    </div>
  `
  );

  const cartModal = document.getElementById('cartModal');
  const checkoutModal = document.getElementById('checkoutModal');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalPrice = document.getElementById('cartTotalPrice');
  const cartErrorText = document.getElementById('cartErrorText');
  const openCheckoutBtn = document.getElementById('openCheckoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutAddressInput = document.getElementById('checkoutAddressInput');
  const openMapPickerBtn = document.getElementById('openMapPickerBtn');
  const checkoutDeliveryDate = document.getElementById('checkoutDeliveryDate');
  const checkoutDeliverySlot = document.getElementById('checkoutDeliverySlot');
  const checkoutMetaText = document.getElementById('checkoutMetaText');
  const checkoutCommentField = document.getElementById('checkoutCommentField');
  const checkoutCommentCounter = document.getElementById('checkoutCommentCounter');
  const mapPickerModal = document.getElementById('mapPickerModal');
  const checkoutMapRoot = document.getElementById('checkoutMapRoot');
  const checkoutMapAddress = document.getElementById('checkoutMapAddress');
  const applyMapAddressBtn = document.getElementById('applyMapAddressBtn');
  const mapCityInput = document.getElementById('mapCityInput');
  const mapStreetInput = document.getElementById('mapStreetInput');
  const mapHouseInput = document.getElementById('mapHouseInput');
  const mapApartmentInput = document.getElementById('mapApartmentInput');
  const mapFloorInput = document.getElementById('mapFloorInput');
  const mapEntranceInput = document.getElementById('mapEntranceInput');
  const mapApartmentRequirementsHint = document.getElementById('mapApartmentRequirementsHint');
  const mapCitySuggestions = document.getElementById('mapCitySuggestions');
  const mapStreetDropdown = document.getElementById('mapStreetDropdown');
  const clearMapStreetBtn = document.getElementById('clearMapStreetBtn');
  const appToast = document.getElementById('appToast');
  const appToastText = document.getElementById('appToastText');
  const appToastClose = document.getElementById('appToastClose');

  let checkoutMapCtl = null;
  let mapSearchTimer = null;
  let citySuggestTimer = null;
  let streetSuggestTimer = null;
  let streetSuggestGen = 0;
  /** Отмена запроса подсказок при новом вводе (не подмешивать старый ответ). */
  let streetSuggestAbort = null;
  let latestGeocodeRequestId = 0;
  let latestStreetPreviewId = 0;
  let remoteOrenburgStreetsCache = null;
  let remoteOrenburgStreetsPromise = null;
  let appToastTimer = null;

  function showAppToast(message, variant = 'success') {
    if (!(appToast instanceof HTMLElement) || !(appToastText instanceof HTMLElement)) return;
    appToastText.textContent = String(message || '').trim();
    appToast.dataset.variant = variant === 'error' ? 'error' : 'success';
    appToast.hidden = false;
    appToast.classList.add('is-visible');
    if (appToastTimer) window.clearTimeout(appToastTimer);
    appToastTimer = window.setTimeout(() => {
      appToast.classList.remove('is-visible');
      appToast.hidden = true;
    }, 4200);
  }

  function updateCheckoutCommentCounter() {
    if (!(checkoutCommentField instanceof HTMLTextAreaElement) || !(checkoutCommentCounter instanceof HTMLElement)) {
      return;
    }
    checkoutCommentCounter.textContent = `${checkoutCommentField.value.length}/${CHECKOUT_COMMENT_MAX}`;
  }

  function currentIsoDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function setCartError(message) {
    if (!(cartErrorText instanceof HTMLElement)) return;
    cartErrorText.textContent = message || '';
    cartErrorText.style.display = message ? 'block' : 'none';
  }

  function readAddressParts() {
    return {
      city: String(mapCityInput instanceof HTMLInputElement ? mapCityInput.value : '').trim(),
      street: String(mapStreetInput instanceof HTMLInputElement ? mapStreetInput.value : '').trim(),
      house: String(mapHouseInput instanceof HTMLInputElement ? mapHouseInput.value : '').trim(),
      apartment: String(mapApartmentInput instanceof HTMLInputElement ? mapApartmentInput.value : '').trim(),
      floor: String(mapFloorInput instanceof HTMLInputElement ? mapFloorInput.value : '').trim(),
      entrance: String(mapEntranceInput instanceof HTMLInputElement ? mapEntranceInput.value : '').trim(),
    };
  }

  function toTitleCase(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/(^|[\s-])([a-zа-яё])/gi, (m, sep, letter) => `${sep}${letter.toUpperCase()}`);
  }

  function applyTitleCaseInput(input) {
    if (!(input instanceof HTMLInputElement)) return;
    const prev = input.value;
    const next = toTitleCase(prev);
    if (prev === next) return;
    const pos = input.selectionStart ?? next.length;
    input.value = next;
    input.setSelectionRange(pos, pos);
  }

  function formatAddressByTemplate(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const chunks = [];
    if (parts.city) chunks.push(`г. ${parts.city}`);
    if (normalizedStreet) chunks.push(`ул. ${normalizedStreet}`);
    if (parts.house) chunks.push(`д. ${parts.house}`);
    if (parts.entrance) chunks.push(`подъезд ${parts.entrance}`);
    if (parts.floor) chunks.push(`этаж ${parts.floor}`);
    if (parts.apartment) chunks.push(`кв. ${parts.apartment}`);
    return chunks.join(', ');
  }

  function geocodeAddress(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const params = new URLSearchParams({
      limit: '10',
      countrycodes: 'ru',
      city: parts.city,
      street: normalizedStreet,
    });
    const house = String(parts.house || '').trim();
    if (house) params.set('house', house);
    if (normalizeAddressToken(parts.city) === normalizeAddressToken(DEFAULT_CITY)) {
      params.set('bounded', '1');
      params.set('viewbox', ORENBURG_VIEWBOX);
    }
    const url = `/api/public/geocode-search?${params.toString()}`;
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('geocode_failed');
        return response.json();
      })
      .then((rows) => (Array.isArray(rows) ? rows : []));
  }

  function searchSuggestions(query, limit = 5, opts = {}) {
    const signal = opts && opts.signal;
    const params = new URLSearchParams({ limit: String(limit), q: query });
    const url = `/api/public/geocode-search?${params.toString()}`;
    return fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('suggest_failed');
        return response.json();
      })
      .then((rows) => (Array.isArray(rows) ? rows : []));
  }

  /** Тот же режим запроса, что у геокода карты: структурно город + улица (точнее и лучше кэшируется). */
  function searchStreetStructured(city, streetQuery, limit = 24, opts = {}) {
    const signal = opts && opts.signal;
    const normalizedStreet = String(streetQuery || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const params = new URLSearchParams({
      limit: String(limit),
      countrycodes: 'ru',
      city: String(city || '').trim(),
      street: normalizedStreet,
    });
    if (normalizeAddressToken(city) === normalizeAddressToken(DEFAULT_CITY)) {
      params.set('bounded', '1');
      params.set('viewbox', ORENBURG_VIEWBOX);
    }
    const url = `/api/public/geocode-search?${params.toString()}`;
    return fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('suggest_failed');
        return response.json();
      })
      .then((rows) => (Array.isArray(rows) ? rows : []));
  }

  function fillDatalist(root, values) {
    if (!(root instanceof HTMLDataListElement)) return;
    root.innerHTML = values
      .filter(Boolean)
      .slice(0, 6)
      .map((v) => `<option value="${String(v).replace(/"/g, '&quot;')}"></option>`)
      .join('');
  }

  function escapeHtmlLocal(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatStreetLabel(item) {
    const title = toTitleCase(item.name || '');
    const type = String(item.type || '').trim().toLowerCase();
    if (!title) return '';
    if (!type) return title;
    return `${type} ${title}`;
  }

  function extractStreetFromRow(row) {
    const address = row?.address || {};
    const direct = address.road || address.pedestrian || address.footway || '';
    if (!direct) return '';
    return toTitleCase(direct);
  }

  function isOrenburgCityAddress(row) {
    const address = row?.address || {};
    const city = normalizeAddressToken(address.city || address.town || address.village || '');
    const stateDistrict = normalizeAddressToken(address.state_district || '');
    const state = normalizeAddressToken(address.state || '');
    if (city === normalizeAddressToken(DEFAULT_CITY)) return true;
    return stateDistrict.includes('оренбург') || state.includes('оренбург');
  }

  function rowMatchesCityLabel(row, cityLabel) {
    const want = normalizeAddressToken(cityLabel);
    if (!want) return true;
    const addr = row?.address || {};
    const city = normalizeAddressToken(addr.city || addr.town || addr.village || '');
    if (city && (city === want || city.includes(want) || want.includes(city))) return true;
    const d = normalizeAddressToken(row.display_name || '');
    return d.includes(want);
  }

  function isValidStreetName(name) {
    const value = String(name || '').trim();
    if (!value) return false;
    // Отсекаем названия маршрутов/магазинов и прочий не-уличный шум.
    if (/[«»"']/u.test(value)) return false;
    if (/\d+\s*км/i.test(value)) return false;
    if (/[—-]/.test(value) && !/\b(пер|проезд|проспект|бульвар|улица|ул)\b/i.test(value)) return false;
    return true;
  }

  async function fetchRemoteOrenburgStreets(force = false) {
    if (!force && Array.isArray(remoteOrenburgStreetsCache)) return remoteOrenburgStreetsCache;
    if (!force && remoteOrenburgStreetsPromise) return remoteOrenburgStreetsPromise;
    remoteOrenburgStreetsPromise = (async () => {
      try {
        const query = [
          '[out:json][timeout:30];',
          'area["name"="Оренбург"]["boundary"="administrative"]->.searchArea;',
          '(',
          '  way["highway"]["name"](area.searchArea);',
          ');',
          'out tags;',
        ].join('\n');
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'text/plain;charset=UTF-8' },
          body: query,
        });
        if (!response.ok) throw new Error('overpass_failed');
        const data = await response.json();
        const rows = Array.isArray(data?.elements) ? data.elements : [];
        const values = rows
          .map((row) => String(row?.tags?.name || '').trim())
          .filter((name) => isValidStreetName(name))
          .map((name) => toTitleCase(name));
        const unique = [...new Set(values)];
        if (unique.length) {
          remoteOrenburgStreetsCache = unique;
          return remoteOrenburgStreetsCache;
        }
        throw new Error('overpass_empty');
      } catch {
        try {
          const rows = await searchSuggestions(`${DEFAULT_CITY}, улица`, 300);
          const values = rows
            .filter((row) => isOrenburgCityAddress(row))
            .map((row) => extractStreetFromRow(row))
            .filter((name) => isValidStreetName(name));
          remoteOrenburgStreetsCache = [...new Set(values)];
          return remoteOrenburgStreetsCache;
        } catch {
          remoteOrenburgStreetsCache = [];
          return remoteOrenburgStreetsCache;
        }
      }
    })();
    return remoteOrenburgStreetsPromise;
  }

  function showStreetDropdown(values) {
    if (!(mapStreetDropdown instanceof HTMLElement)) return;
    if (!values.length) {
      mapStreetDropdown.hidden = true;
      mapStreetDropdown.innerHTML = '';
      return;
    }
    mapStreetDropdown.innerHTML = values
      .slice(0, 120)
      .map(
        (value) =>
          `<button type="button" class="address-suggest-item" data-street-suggest="${escapeHtmlLocal(value)}">${escapeHtmlLocal(value)}</button>`
      )
      .join('');
    mapStreetDropdown.hidden = false;
  }

  function updateStreetClearButton() {
    if (!(clearMapStreetBtn instanceof HTMLButtonElement)) return;
    const hasValue = Boolean(String(mapStreetInput instanceof HTMLInputElement ? mapStreetInput.value : '').trim());
    clearMapStreetBtn.hidden = !hasValue;
  }

  function applyStreetSuggestion(value) {
    if (!(mapStreetInput instanceof HTMLInputElement)) return;
    mapStreetInput.value = String(value || '');
    applyTitleCaseInput(mapStreetInput);
    updateStreetClearButton();
    showStreetDropdown([]);
    updatePickedAddressLabel();
    void syncMapStreetPreview();
    void syncMapByInputs();
  }

  async function updateCitySuggestions() {
    const q = String(mapCityInput instanceof HTMLInputElement ? mapCityInput.value : '').trim();
    if (q.length < 2) {
      fillDatalist(mapCitySuggestions, []);
      return;
    }
    try {
      const rows = await searchSuggestions(q, 6);
      const values = rows.map((row) => row.address?.city || row.address?.town || row.address?.village || '').filter(Boolean);
      fillDatalist(mapCitySuggestions, [...new Set(values)]);
    } catch {
      fillDatalist(mapCitySuggestions, []);
    }
  }

  function stripLeadingStreetWords(value) {
    return String(value || '')
      .replace(/^\s*(ул\.?|улица|проспект|просп\.?|пр-кт|шоссе|бульвар|б-р|переулок|пер\.?)\s+/gi, '')
      .trim();
  }

  function significantStreetTokens(raw) {
    const cleaned = stripLeadingStreetWords(raw)
      .toLowerCase()
      .replace(/ё/g, 'е');
    const words = cleaned.split(/[\s,.]+/).map((w) => w.replace(/[^a-zа-я0-9]/gi, '')).filter((t) => t.length >= 4);
    return [...new Set(words)];
  }

  function tokenMatchesLabelRough(t, suggestionLabel) {
    const label = normalizeAddressToken(suggestionLabel);
    const tn = normalizeAddressToken(t);
    if (!tn) return true;
    if (label.includes(tn)) return true;
    if (tn.length >= 10) return label.includes(tn.slice(0, tn.length - 3));
    if (tn.length >= 8) return label.includes(tn.slice(0, tn.length - 2));
    if (tn.length >= 6) return label.includes(tn.slice(0, Math.max(5, tn.length - 2)));
    return label.includes(tn.slice(0, Math.max(4, tn.length - 1)));
  }

  function streetSuggestionRelevantForNeedle(needleRaw, suggestionLabel) {
    const tokens = significantStreetTokens(needleRaw);
    if (!tokens.length) return true;
    return tokens.every((t) => tokenMatchesLabelRough(t, suggestionLabel));
  }

  function rankStreetSuggestion(needleRaw, label) {
    const needleWhole = normalizeAddressToken(stripLeadingStreetWords(needleRaw));
    const lab = normalizeAddressToken(label);
    let score = lab ? 2 : 0;
    if (needleWhole) {
      if (lab.startsWith(needleWhole)) score += 100;
      else if (lab.includes(needleWhole)) score += 50;
      for (const t of significantStreetTokens(needleRaw)) {
        const tn = normalizeAddressToken(t);
        if (tn && lab.includes(tn)) score += Math.min(40, tn.length * 6);
        else if (tn.length >= 5 && tokenMatchesLabelRough(t, label)) score += Math.min(18, tn.length * 2);
      }
    }
    return score;
  }

  function sortStreetSuggestions(needleRaw, names) {
    const uniq = [...new Set(names.filter(Boolean))];
    return uniq.sort((a, b) => rankStreetSuggestion(needleRaw, b) - rankStreetSuggestion(needleRaw, a));
  }

  async function updateStreetSuggestions() {
    const gen = ++streetSuggestGen;
    if (streetSuggestAbort) {
      try {
        streetSuggestAbort.abort();
      } catch {
        /* ignore */
      }
    }
    streetSuggestAbort = new AbortController();
    const suggestSignal = streetSuggestAbort.signal;

    const streetQ = String(mapStreetInput instanceof HTMLInputElement ? mapStreetInput.value : '').trim();
    const cityQRaw = String(mapCityInput instanceof HTMLInputElement ? mapCityInput.value : '').trim();
    const cityQ = cityQRaw || DEFAULT_CITY;
    const isOrenburgContext = normalizeAddressToken(cityQ) === normalizeAddressToken(DEFAULT_CITY);
    const normalizedNeedle = normalizeAddressToken(streetQ);

    const localMatches = isOrenburgContext
      ? ORENBURG_STREETS.filter((item) => {
          const nName = normalizeAddressToken(item.name);
          const nType = normalizeAddressToken(item.type);
          if (!normalizedNeedle) return true;
          return nName.startsWith(normalizedNeedle) || nName.includes(normalizedNeedle) || nType.startsWith(normalizedNeedle);
        })
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((item) => formatStreetLabel(item))
      : [];

    const remotePromise = isOrenburgContext ? fetchRemoteOrenburgStreets() : Promise.resolve([]);

    const filterBySubstringNeedle = (names) => {
      if (!normalizedNeedle) return names;
      return names.filter((name) => {
        const n = normalizeAddressToken(name);
        return n.startsWith(normalizedNeedle) || n.includes(normalizedNeedle);
      });
    };

    const applyDistinctTokens = (names) => {
      if (!normalizedNeedle) return names;
      return names.filter((name) => streetSuggestionRelevantForNeedle(streetQ, name));
    };

    const renderList = (names) => {
      if (gen !== streetSuggestGen) return;
      showStreetDropdown(sortStreetSuggestions(streetQ, names));
    };

    const mergeLists = (apiNames) => {
      remotePromise
        .then((remoteBase) => {
          if (gen !== streetSuggestGen) return;
          const remoteFiltered =
            normalizedNeedle && remoteBase.length
              ? remoteBase.filter((name) => {
                  const n = normalizeAddressToken(name);
                  return n.startsWith(normalizedNeedle) || n.includes(normalizedNeedle);
                })
              : remoteBase;
          const fuzzyLocal = applyDistinctTokens(
            filterBySubstringNeedle([...new Set([...localMatches, ...(normalizedNeedle ? remoteFiltered : remoteFiltered.slice(0, 60))])])
          );
          const apiClean = normalizedNeedle ? filterBySubstringNeedle(apiNames) : apiNames;
          const combined = [...new Set([...apiClean, ...fuzzyLocal])];
          renderList(combined.length ? combined : apiClean.length ? apiClean : fuzzyLocal);
        })
        .catch(() => {
          if (gen !== streetSuggestGen) return;
          const fuzzyLocal = applyDistinctTokens(
            normalizedNeedle ? filterBySubstringNeedle([...localMatches]) : localMatches
          );
          const apiClean = normalizedNeedle ? filterBySubstringNeedle(apiNames) : apiNames;
          const combined = [...new Set([...apiClean, ...fuzzyLocal])];
          renderList(combined.length ? combined : apiClean.length ? apiClean : fuzzyLocal);
        });
    };

    if (!normalizedNeedle) {
      if (localMatches.length) renderList(localMatches.slice(0, 50));
      mergeLists([]);
      return;
    }

    const quickPick = filterBySubstringNeedle(applyDistinctTokens(localMatches));
    if (quickPick.length) renderList(quickPick);
    else showStreetDropdown([]);

    try {
      let rows = await searchStreetStructured(cityQ, streetQ, 24, { signal: suggestSignal });
      if (gen !== streetSuggestGen) return;

      if (rows.length < 5) {
        try {
          const extra = await searchSuggestions(`${cityQ}, ${streetQ}`.trim(), 18, { signal: suggestSignal });
          rows = [...rows, ...extra];
        } catch (_) {
          /* ignore */
        }
      }
      if (gen !== streetSuggestGen) return;

      const seen = new Set();
      const values = [];
      rows.forEach((row) => {
        const nameRaw = extractStreetFromRow(row);
        if (!nameRaw || !isValidStreetName(nameRaw)) return;
        const prepared = (() => {
          const nm = toTitleCase(nameRaw);
          if (/переулок|пер\.?/i.test(nm)) return nm;
          const matchedLane = ORENBURG_STREETS.find(
            (item) => item.type === 'переулок' && normalizeAddressToken(item.name) === normalizeAddressToken(nm)
          );
          return matchedLane ? formatStreetLabel(matchedLane) : nm;
        })();
        if (!prepared || !filterBySubstringNeedle([prepared]).length) return;
        if (!rowMatchesCityLabel(row, cityQRaw || cityQ)) return;
        const key = normalizeAddressToken(prepared);
        if (seen.has(key)) return;
        seen.add(key);
        values.push(prepared);
      });
      mergeLists(values);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      mergeLists([]);
    }
  }

  async function fallbackGeocode(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const house = String(parts.house || '').trim();
    const qParts = [parts.city, normalizedStreet, house].filter(Boolean);
    const params = new URLSearchParams({
      limit: '8',
      countrycodes: 'ru',
      q: `${qParts.join(', ')}, Россия`,
    });
    if (normalizeAddressToken(parts.city) === normalizeAddressToken(DEFAULT_CITY)) {
      params.set('bounded', '1');
      params.set('viewbox', ORENBURG_VIEWBOX);
    }
    const response = await fetch(`/api/public/geocode-search?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  }

  function pickBestGeocodeMatch(parts, rows) {
    if (!Array.isArray(rows) || !rows.length) return null;
    const srcCity = normalizeAddressToken(parts.city);
    const srcStreet = normalizeAddressToken(parts.street);
    const srcHouse = normalizeAddressToken(parts.house);
    let best = null;
    let bestScore = -1;
    rows.forEach((row) => {
      const addr = row.address || {};
      const city = normalizeAddressToken(addr.city || addr.town || addr.village || addr.state || '');
      const street = normalizeAddressToken(addr.road || addr.pedestrian || addr.footway || '');
      const house = normalizeAddressToken(addr.house_number || '');
      const display = normalizeAddressToken(row.display_name || '');
      let score = 0;
      if (city && city === srcCity) score += 5;
      if (street && (street === srcStreet || street.includes(srcStreet) || srcStreet.includes(street))) score += 6;
      if (house && house === srcHouse) score += 10;
      else if (srcHouse && display.includes(srcHouse)) score += 4;
      if (display.includes(srcStreet)) score += 2;
      if (['building', 'house', 'residential'].includes(String(row.type || '').toLowerCase())) score += 2;
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    });
    return best;
  }

  async function fallbackGeocodeStreetOnly(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const params = new URLSearchParams({
      limit: '8',
      countrycodes: 'ru',
      q: `${parts.city}, ${normalizedStreet}, Россия`,
    });
    if (normalizeAddressToken(parts.city) === normalizeAddressToken(DEFAULT_CITY)) {
      params.set('bounded', '1');
      params.set('viewbox', ORENBURG_VIEWBOX);
    }
    const response = await fetch(`/api/public/geocode-search?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  }

  function pickBestStreetGeocodeMatch(parts, rows) {
    if (!Array.isArray(rows) || !rows.length) return null;
    const srcCity = normalizeAddressToken(parts.city);
    const normalizedStreetLabel = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const srcStreet = normalizeAddressToken(normalizedStreetLabel);
    let best = null;
    let bestScore = -1;
    rows.forEach((row) => {
      const addr = row.address || {};
      const city = normalizeAddressToken(addr.city || addr.town || addr.village || '');
      const street = normalizeAddressToken(addr.road || addr.pedestrian || addr.footway || '');
      const display = normalizeAddressToken(row.display_name || '');
      let score = 0;
      if (srcCity && city && (city === srcCity || city.includes(srcCity) || srcCity.includes(city))) score += 5;
      if (srcStreet && street && (street === srcStreet || street.includes(srcStreet) || srcStreet.includes(street))) score += 10;
      if (srcStreet && display.includes(srcStreet)) score += 3;
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    });
    return bestScore >= 10 ? best : null;
  }

  async function syncMapStreetPreview() {
    const parts = readAddressParts();
    if (!parts.city || !parts.street || !checkoutMapCtl) return;
    if (parts.house) return;
    const requestId = ++latestStreetPreviewId;
    try {
      const streetParts = { ...parts, house: '' };
      let candidates = await geocodeAddress(streetParts);
      if (!candidates.length) {
        candidates = await fallbackGeocodeStreetOnly(streetParts);
      }
      const match = pickBestStreetGeocodeMatch(parts, candidates);
      if (!match) return;
      if (requestId !== latestStreetPreviewId) return;
      const lat = Number(match.lat);
      const lon = Number(match.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      checkoutMapCtl.setMarker(lat, lon);
      checkoutMapCtl.flyToMarker(lat, lon, 15);
    } catch {
      /* silent */
    }
  }

  function reverseGeocode(lat, lon) {
    const url = `/api/public/geocode-reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('geocode_failed');
        return response.json();
      })
      .then((data) => data || null);
  }

  function applyReverseAddress(data) {
    const addr = (data && data.address) || {};
    const city = addr.city || addr.town || addr.village || addr.state || '';
    const street = addr.road || addr.pedestrian || addr.footway || '';
    const house = addr.house_number || '';
    if (mapCityInput instanceof HTMLInputElement && city) mapCityInput.value = city;
    if (mapStreetInput instanceof HTMLInputElement && street) mapStreetInput.value = street;
    if (mapHouseInput instanceof HTMLInputElement && house) mapHouseInput.value = house;
  }

  function normalizeAddressToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]/gi, '');
  }

  function updatePickedAddressLabel() {
    const parts = readAddressParts();
    pickedAddress = formatAddressByTemplate(parts);
    const apartmentFilled = Boolean(parts.apartment);
    const apartmentExtrasOk = apartmentFilled ? Boolean(parts.floor && parts.entrance) : true;
    if (checkoutMapAddress instanceof HTMLElement) {
      checkoutMapAddress.textContent = pickedAddress || 'Заполните: город, улица, дом.';
    }
    if (mapApartmentRequirementsHint instanceof HTMLElement) {
      const needShowWarning = apartmentFilled && !apartmentExtrasOk;
      mapApartmentRequirementsHint.hidden = !needShowWarning;
    }
    if (applyMapAddressBtn instanceof HTMLButtonElement) {
      applyMapAddressBtn.disabled = !parts.city || !parts.street || !parts.house || !apartmentExtrasOk;
    }
  }

  async function syncMapByInputs() {
    const parts = readAddressParts();
    updatePickedAddressLabel();
    if (!parts.city || !parts.street || !parts.house || !checkoutMapCtl) return;
    const requestId = ++latestGeocodeRequestId;
    try {
      let candidates = await geocodeAddress(parts);
      if (!candidates.length) {
        candidates = await fallbackGeocode(parts);
      }
      const match = pickBestGeocodeMatch(parts, candidates);
      if (!match) return;
      if (requestId !== latestGeocodeRequestId) return;
      const lat = Number(match.lat);
      const lon = Number(match.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      checkoutMapCtl.setMarker(lat, lon);
      checkoutMapCtl.flyToMarker(lat, lon, 16);
    } catch {
      /* silent */
    }
  }

  async function initMapPicker() {
    if (!(checkoutMapRoot instanceof HTMLElement)) return;
    const EM = window.EkvalineMaps;
    if (!EM || typeof EM.attachInteractiveMap !== 'function') {
      throw new Error('maps_runtime_missing');
    }
    if (!checkoutMapCtl) {
      checkoutMapCtl = await EM.attachInteractiveMap(
        checkoutMapRoot,
        MAP_DEFAULT_CENTER,
        MAP_DEFAULT_ZOOM,
        {
          onMapClick: async (lat, lng) => {
            if (checkoutMapAddress instanceof HTMLElement) checkoutMapAddress.textContent = 'Определяем адрес...';

            try {
              const data = await reverseGeocode(lat, lng);
              applyReverseAddress(data);
              updatePickedAddressLabel();
            } catch {
              updatePickedAddressLabel();
              if (checkoutMapAddress instanceof HTMLElement) checkoutMapAddress.textContent = 'Не удалось определить адрес. Уточните поля вручную.';
            }
          },
        }
      );
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => checkoutMapCtl?.invalidateSize()));
  }

  async function openMapPicker() {
    const currentAddress = String(checkoutAddressInput instanceof HTMLInputElement ? checkoutAddressInput.value : '').trim();
    if (!currentAddress) {
      if (mapCityInput instanceof HTMLInputElement) mapCityInput.value = DEFAULT_CITY;
      if (mapStreetInput instanceof HTMLInputElement) mapStreetInput.value = '';
      if (mapHouseInput instanceof HTMLInputElement) mapHouseInput.value = '';
      if (mapApartmentInput instanceof HTMLInputElement) mapApartmentInput.value = '';
      if (mapFloorInput instanceof HTMLInputElement) mapFloorInput.value = '';
      if (mapEntranceInput instanceof HTMLInputElement) mapEntranceInput.value = '';
    } else if (mapCityInput instanceof HTMLInputElement && !mapCityInput.value.trim()) {
      mapCityInput.value = DEFAULT_CITY;
    }
    updatePickedAddressLabel();
    mapPickerModal?.classList.add('open');
    mapPickerModal?.setAttribute('aria-hidden', 'false');
    try {
      await initMapPicker();
      const p = readAddressParts();
      if (p.city && p.street) {
        if (p.house) void syncMapByInputs();
        else void syncMapStreetPreview();
      } else {
        checkoutMapCtl?.flyToMarker(MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1], MAP_DEFAULT_ZOOM);
      }
    } catch {
      closeMapPicker();
      showAppToast('Не удалось загрузить карту. Проверьте подключение к интернету.', 'error');
    }
  }

  function closeMapPicker() {
    mapPickerModal?.classList.remove('open');
    mapPickerModal?.setAttribute('aria-hidden', 'true');
  }

  function animateAddToCart(card) {
    if (!(card instanceof HTMLElement) || !(cartBtn instanceof HTMLElement)) return;
    const source = card.querySelector('.full-card-image, .catalog-card-image') || card;
    if (!(source instanceof HTMLElement)) return;
    const from = source.getBoundingClientRect();
    const to = cartBtn.getBoundingClientRect();
    const ghost = source.cloneNode(true);
    if (!(ghost instanceof HTMLElement)) return;

    ghost.classList.add('cart-fly-ghost');
    ghost.style.left = `${from.left + from.width / 2}px`;
    ghost.style.top = `${from.top + from.height / 2}px`;
    ghost.style.width = `${Math.max(36, Math.min(130, from.width * 0.42))}px`;
    ghost.style.height = 'auto';
    ghost.style.transform = 'translate(-50%, -50%) scale(1)';
    document.body.appendChild(ghost);

    const deltaX = to.left + to.width / 2 - (from.left + from.width / 2);
    const deltaY = to.top + to.height / 2 - (from.top + from.height / 2);
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`;
      ghost.style.opacity = '0';
    });
    setTimeout(() => ghost.remove(), 540);

    cartBtn.classList.remove('cart-bump');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('cart-bump');
  }

  function updateCartBadge() {
    const count = readCart().reduce((sum, item) => sum + (item.qty || 0), 0);
    cartBtn.textContent = `Корзина (${count})`;
  }

  function renderCart() {
    const items = readCart();
    if (!cartItemsList || !cartTotalPrice) return 0;
    if (!items.length) {
      cartItemsList.innerHTML = '<p class="cart-empty">Корзина пока пуста.</p>';
      cartTotalPrice.textContent = '0 ₽';
      setCartError('');
      return 0;
    }
    let total = 0;
    cartItemsList.innerHTML = items
      .map((item) => {
        const unitPrice = item.water ? getWaterUnitPrice(item.qty || 0) : item.price || 0;
        const line = item.preorder ? 0 : unitPrice * (item.qty || 0);
        total += line;
        const priceLabel = item.preorder ? 'Под заказ' : `${item.qty} × ${unitPrice} ₽`;
        return `
          <article class="cart-item">
            <div>
              <strong>${item.title}</strong>
              <p>${priceLabel}</p>
            </div>
            <div class="cart-item-actions">
              <button type="button" data-cart-minus="${item.id}">−</button>
              <button type="button" data-cart-plus="${item.id}">+</button>
              <button type="button" data-cart-remove="${item.id}">Удалить</button>
            </div>
          </article>
        `;
      })
      .join('');
    cartTotalPrice.textContent = `${total} ₽`;
    return total;
  }

  function openCartModal() {
    const user = readCurrentUser();
    if (!user || user.role === 'manager') {
      const loginBtn = document.querySelector('[data-auth-login]');
      if (loginBtn instanceof HTMLElement) loginBtn.click();
      return;
    }
    renderCart();
    setCartError('');
    cartModal?.classList.add('open');
    cartModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartModal() {
    cartModal?.classList.remove('open');
    cartModal?.setAttribute('aria-hidden', 'true');
    if (!checkoutModal?.classList.contains('open')) document.body.style.overflow = '';
  }

  function openCheckout() {
    const user = readCurrentUser();
    if (!user || user.role === 'manager') return;
    const items = readCart();
    if (!items.length) return;
    const preorderCount = items.filter((item) => item.preorder).length;
    const subtotal = items.reduce((sum, item) => {
      if (item.preorder) return sum;
      const unitPrice = item.water ? getWaterUnitPrice(item.qty || 0) : item.price || 0;
      return sum + unitPrice * (item.qty || 0);
    }, 0);
    const bonuses = Number(readByUser(BONUSES_KEY, String(user.id), 0)) || 0;
    if (checkoutMetaText) {
      checkoutMetaText.textContent =
        preorderCount > 0
          ? `В корзине есть товары "под заказ". Укажите свою почту в примечании к заказу: компания пришлет всю необходимую информацию и дату доставки. Текущая сумма оплачиваемых позиций: ${subtotal} ₽.`
          : `Сумма: ${subtotal} ₽. Доступно бонусов: ${bonuses}.`;
    }
    if (checkoutDeliveryDate instanceof HTMLInputElement) {
      const minDate = currentIsoDate();
      checkoutDeliveryDate.min = minDate;
      if (!checkoutDeliveryDate.value) checkoutDeliveryDate.value = minDate;
    }
    checkoutModal?.classList.add('open');
    checkoutModal?.setAttribute('aria-hidden', 'false');
    updateCheckoutCommentCounter();
  }

  function closeCheckout() {
    checkoutModal?.classList.remove('open');
    checkoutModal?.setAttribute('aria-hidden', 'true');
    if (!cartModal?.classList.contains('open')) document.body.style.overflow = '';
  }

  cartBtn.addEventListener('click', openCartModal);
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('[data-cart-close="true"]')) {
      closeCartModal();
      setCartError('');
      return;
    }
    if (target.closest('[data-checkout-close="true"]')) {
      closeCheckout();
      return;
    }
    if (target.closest('[data-map-close="true"]')) {
      closeMapPicker();
      return;
    }
    if (target.closest('#openCheckoutBtn')) {
      openCheckout();
      return;
    }
    if (target.closest('#openMapPickerBtn')) {
      openMapPicker();
      return;
    }
    const streetSuggestBtn = target.closest('[data-street-suggest]');
    if (streetSuggestBtn) {
      const value = streetSuggestBtn.getAttribute('data-street-suggest') || '';
      applyStreetSuggestion(value);
      return;
    }

    const addBtn = target.closest('.catalog-add-btn, .cart-btn');
    if (addBtn) {
      const user = readCurrentUser();
      if (!user || user.role === 'manager') {
        const loginBtn = document.querySelector('[data-auth-login]');
        if (loginBtn instanceof HTMLElement) loginBtn.click();
        return;
      }
      const card = addBtn.closest('.full-catalog-card, .catalog-card');
      if (!card) return;
      const nextItem = buildCartItemFromCard(card);
      if (!nextItem) return;
      const items = readCart();
      const idx = items.findIndex((item) => item.id === nextItem.id);
      if (idx >= 0) {
        if (items[idx].water && items[idx].qty >= WATER_MAX_QTY) {
          setCartError('Больше 50 бутылей, договорная цена.');
          return;
        }
        items[idx].qty += 1;
      } else {
        items.push(nextItem);
      }
      setCartError('');
      saveCart(items);
      updateCartBadge();
      animateAddToCart(card);
      return;
    }

    const minus = target.closest('[data-cart-minus]');
    if (minus) {
      const id = minus.getAttribute('data-cart-minus');
      if (!id) return;
      const items = readCart()
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty - 1) } : item))
        .filter((item) => item.qty > 0);
      setCartError('');
      saveCart(items);
      renderCart();
      updateCartBadge();
      return;
    }

    const plus = target.closest('[data-cart-plus]');
    if (plus) {
      const id = plus.getAttribute('data-cart-plus');
      if (!id) return;
      const items = readCart().map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
      const current = items.find((item) => item.id === id);
      if (current?.water && current.qty > WATER_MAX_QTY) {
        current.qty = WATER_MAX_QTY;
        setCartError('Больше 50 бутылей, договорная цена.');
      } else {
        setCartError('');
      }
      saveCart(items);
      renderCart();
      updateCartBadge();
      return;
    }

    const remove = target.closest('[data-cart-remove]');
    if (remove) {
      const id = remove.getAttribute('data-cart-remove');
      if (!id) return;
      const items = readCart().filter((item) => item.id !== id);
      setCartError('');
      saveCart(items);
      renderCart();
      updateCartBadge();
    }
  });

  if (checkoutForm instanceof HTMLFormElement) {
    updateCheckoutCommentCounter();
    checkoutCommentField?.addEventListener('input', updateCheckoutCommentCounter);
    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const user = readCurrentUser();
      if (!user || user.role === 'manager') return;
      const items = readCart();
      if (!items.length) return;

      const address = String(checkoutForm.elements.namedItem('address')?.value || '').trim();
      const comment = String(checkoutForm.elements.namedItem('comment')?.value || '').trim();
      const deliveryDate = String(checkoutForm.elements.namedItem('deliveryDate')?.value || '').trim();
      const deliverySlot = String(checkoutDeliverySlot instanceof HTMLSelectElement ? checkoutDeliverySlot.value : '').trim();
      const bonusSpendRaw = Number(checkoutForm.elements.namedItem('bonusSpend')?.value || 0);
      const hasFloor = /этаж\s+\S+/i.test(address);
      const hasEntrance = /подъезд\s+\S+/i.test(address);
      const hasApartment = /кв\.\s*\S+/i.test(address);
      const apartmentAddressValid = hasApartment ? hasFloor && hasEntrance : true;
      if (
        !address ||
        address.length > CHECKOUT_ADDRESS_MAX ||
        comment.length > CHECKOUT_COMMENT_MAX ||
        !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) ||
        !deliverySlot ||
        !apartmentAddressValid
      ) {
        showAppToast(
          'Проверьте поля: выберите адрес на карте, дату и интервал доставки. Если указана квартира — обязательно заполните этаж и подъезд.',
          'error'
        );
        return;
      }

      const hasPreorderItems = items.some((item) => item.preorder);
      const subtotal = items.reduce((sum, item) => {
        if (item.preorder) return sum;
        const unitPrice = item.water ? getWaterUnitPrice(item.qty || 0) : item.price || 0;
        return sum + unitPrice * (item.qty || 0);
      }, 0);
      const currentBonus = Number(readByUser(BONUSES_KEY, String(user.id), 0)) || 0;
      const bonusSpend = hasPreorderItems
        ? 0
        : Math.max(0, Math.min(currentBonus, Math.floor(bonusSpendRaw)));
      const total = Math.max(0, subtotal - bonusSpend);
      const bonusEarned = Math.floor(total * 0.05);

      const orders = readByUser(ORDERS_KEY, String(user.id), []);
      orders.unshift({
        id: nextOrderId(),
        createdAt: new Date().toISOString(),
        status: hasPreorderItems ? 'pending_operator' : 'new',
        items,
        subtotal,
        bonusSpend,
        bonusEarned,
        total,
        address,
        deliveryDate,
        deliverySlot,
        comment,
        paymentDeferred: hasPreorderItems,
      });
      writeByUser(ORDERS_KEY, String(user.id), orders);

      const addresses = readByUser(ADDRESSES_KEY, String(user.id), []);
      if (!addresses.includes(address)) {
        addresses.unshift(address);
        writeByUser(ADDRESSES_KEY, String(user.id), addresses.slice(0, 10));
      }

      writeByUser(BONUSES_KEY, String(user.id), currentBonus - bonusSpend + bonusEarned);
      saveCart([]);
      updateCartBadge();
      renderCart();
      closeCheckout();
      closeCartModal();
      checkoutForm.reset();
      if (checkoutDeliveryDate instanceof HTMLInputElement) {
        checkoutDeliveryDate.value = currentIsoDate();
      }
      updateCheckoutCommentCounter();
      if (hasPreorderItems) {
        showAppToast(
          'Заказ с товарами "под заказ" принят. Укажите свою почту в примечании: компания пришлет всю необходимую информацию и дату доставки.'
        );
      } else {
        showAppToast(`Заказ оформлен! Начислено бонусов: ${bonusEarned}.`);
      }
    });
  }

  applyMapAddressBtn?.addEventListener('click', () => {
    if (!pickedAddress || !(checkoutAddressInput instanceof HTMLInputElement)) return;
    checkoutAddressInput.value = pickedAddress.slice(0, CHECKOUT_ADDRESS_MAX);
    closeMapPicker();
  });

  [mapCityInput, mapStreetInput, mapHouseInput, mapApartmentInput, mapFloorInput, mapEntranceInput].forEach((input) => {
    input?.addEventListener('input', () => {
      applyTitleCaseInput(input);
      updatePickedAddressLabel();
      if (mapSearchTimer) window.clearTimeout(mapSearchTimer);
      mapSearchTimer = window.setTimeout(() => {
        const p = readAddressParts();
        if (p.house) void syncMapByInputs();
        else void syncMapStreetPreview();
      }, 200);
    });
  });

  mapCityInput?.addEventListener('input', () => {
    if (citySuggestTimer) window.clearTimeout(citySuggestTimer);
    citySuggestTimer = window.setTimeout(() => {
      void updateCitySuggestions();
    }, 220);
  });

  mapStreetInput?.addEventListener('input', () => {
    updateStreetClearButton();
    if (streetSuggestTimer) window.clearTimeout(streetSuggestTimer);
    streetSuggestTimer = window.setTimeout(() => {
      void updateStreetSuggestions();
    }, 120);
  });

  mapStreetInput?.addEventListener('focus', () => {
    updateStreetClearButton();
    void updateStreetSuggestions();
  });

  mapStreetInput?.addEventListener('blur', () => {
    setTimeout(() => showStreetDropdown([]), 120);
  });

  mapStreetDropdown?.addEventListener('mousedown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const streetSuggestBtn = target.closest('[data-street-suggest]');
    if (!(streetSuggestBtn instanceof HTMLElement)) return;
    event.preventDefault();
    const value = streetSuggestBtn.getAttribute('data-street-suggest') || '';
    applyStreetSuggestion(value);
  });

  clearMapStreetBtn?.addEventListener('click', () => {
    if (!(mapStreetInput instanceof HTMLInputElement)) return;
    mapStreetInput.value = '';
    updateStreetClearButton();
    updatePickedAddressLabel();
    void updateStreetSuggestions();
    mapStreetInput.focus();
  });

  appToastClose?.addEventListener('click', () => {
    if (!(appToast instanceof HTMLElement)) return;
    if (appToastTimer) window.clearTimeout(appToastTimer);
    appToast.classList.remove('is-visible');
    appToast.hidden = true;
  });

  updateStreetClearButton();

  updateCartBadge();
  saveCart(readCart());
})();

const peopleRange = document.getElementById('peopleRange');
const peopleValue = document.getElementById('peopleValue');
const litersValue = document.getElementById('litersValue');
const bottlesValue = document.getElementById('bottlesValue');
const bottleWater = document.getElementById('bottleWater');
const activityText = document.getElementById('activityText');
const seasonText = document.getElementById('seasonText');
const usageText = document.getElementById('usageText');
const drinkNormValue = document.getElementById('drinkNormValue');
const householdReserveValue = document.getElementById('householdReserveValue');
const monthlyLitersValue = document.getElementById('monthlyLitersValue');
const orderIntervalValue = document.getElementById('orderIntervalValue');
const calcNote = document.getElementById('calcNote');
const planLineOne = document.getElementById('planLineOne');
const planLineTwo = document.getElementById('planLineTwo');
const planLineFive = document.getElementById('planLineFive');
const planTierValue = document.getElementById('planTierValue');
const calcPriceTotal = document.getElementById('calcPriceTotal');

if (
  peopleRange &&
  peopleValue &&
  litersValue &&
  bottlesValue &&
  bottleWater &&
  usageText &&
  activityText &&
  seasonText &&
  drinkNormValue &&
  householdReserveValue &&
  monthlyLitersValue &&
  orderIntervalValue &&
  calcNote &&
  planLineOne &&
  planLineTwo &&
  planLineFive &&
  planTierValue &&
  calcPriceTotal
) {
  const calcSection = document.getElementById('water-calc');
  const calcResultCard = calcSection && calcSection.querySelector('.calc-result-card');

  const usageLabels = {
    drink: 'Только питье',
    cook: 'Только готовка',
    both: 'Питье и готовка',
  };

  let state = {
    people: Number(peopleRange.value),
    usage: 'both',
    activity: 'medium',
    season: 'spring-autumn',
  };

  let debounceTimer = null;
  let abortController = null;

  function setDependentControlsDisabled(disabled) {
    document.querySelectorAll('.option-btn[data-group="activity"], .option-btn[data-group="season"]').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function setGroupActive(group, value) {
    document.querySelectorAll(`.option-btn[data-group="${group}"]`).forEach((button) => {
      const isActive = button.dataset.value === value;
      button.classList.toggle('active', isActive);
    });
  }

  /** Применить ответ сервера — подмена в DevTools без нового запроса не является «доверенными» данными надолго. */
  function applyWaterCalcPayload(payload) {
    peopleValue.textContent = String(payload.people);
    litersValue.textContent = payload.litersPerDay;
    bottlesValue.textContent = payload.bottlesLabel;
    bottleWater.style.height = `${payload.bottleWaterPercent}%`;
    bottleWater.classList.remove('season-winter', 'season-spring-autumn', 'season-summer');
    const seasonClass =
      typeof payload.bottleWaterSeasonClass === 'string'
        ? payload.bottleWaterSeasonClass.replace(/[^a-z-]/gi, '')
        : 'winter';
    bottleWater.classList.add(`season-${seasonClass}`);

    usageText.textContent = payload.usageLabel;
    activityText.textContent = payload.activityLabel;
    seasonText.textContent = payload.seasonLabel;

    drinkNormValue.textContent = payload.drinkNormPerDay;
    householdReserveValue.textContent = payload.householdPerDay;
    monthlyLitersValue.textContent = payload.monthlyLiters;
    orderIntervalValue.textContent = payload.orderInterval;
    planLineOne.textContent = payload.planLineOne;
    planLineTwo.textContent = payload.planLineTwo;
    planLineFive.textContent = payload.planLineFive;
    planTierValue.textContent = payload.planTier;
    calcPriceTotal.textContent = payload.priceTotalApprox;
    calcNote.textContent = payload.note;
    setDependentControlsDisabled(Boolean(payload.restrictActivitySeason));
  }

  async function fetchWaterCalcFromServer() {
    abortController?.abort();
    abortController = new AbortController();

    calcResultCard?.classList.add('is-calc-loading');
    calcResultCard?.setAttribute('aria-busy', 'true');

    const params = new URLSearchParams({
      people: String(state.people),
      usage: state.usage,
      activity: state.activity,
      season: state.season,
    });

    try {
      const res = await fetch(`/api/public/water-calc?${params}`, {
        credentials: 'same-origin',
        signal: abortController.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Ошибка расчёта');
      }
      applyWaterCalcPayload(body);
    } catch (e) {
      if (e.name === 'AbortError') return;
      // eslint-disable-next-line no-console
      console.warn('[water-calc]', e);
      calcNote.textContent =
        'Не удалось получить расчёт с сервера. Проверьте подключение и обновите страницу.';
    } finally {
      calcResultCard?.classList.remove('is-calc-loading');
      calcResultCard?.setAttribute('aria-busy', 'false');
    }
  }

  function scheduleWaterCalc(immediate) {
    if (debounceTimer) window.clearTimeout(debounceTimer);
    if (immediate) {
      debounceTimer = null;
      void fetchWaterCalcFromServer();
      return;
    }
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      void fetchWaterCalcFromServer();
    }, 140);
  }

  peopleRange.addEventListener('input', (event) => {
    state.people = Number(event.target.value);
    scheduleWaterCalc(false);
  });

  document.querySelectorAll('#water-calc .option-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { group, value } = button.dataset;
      state[group] = value;
      setGroupActive(group, value);

      /** Пока ждём ответ, синхронно обновляем подпись сценария (видна до ответа). */
      if (group === 'usage' && value && usageLabels[value]) {
        usageText.textContent = usageLabels[value];
      }
      scheduleWaterCalc(false);
    });
  });

  scheduleWaterCalc(true);
}

/** Второй запрос на 127.0.0.1 / localhost — если страница с Live Server/Vite на том же ПК по LAN-IP или нестандартному порту. */
function shouldOfferFeedbackApiFallback(pageOrigin) {
  try {
    const u = new URL(pageOrigin);
    const h = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
    const ipv4 =
      /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h) ||
      /^(?:ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(h);
    if (ipv4) {
      const a = Number(ipv4[1]);
      const b = Number(ipv4[2]);
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 127) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function resolveFeedbackApiPort() {
  const w = typeof window !== 'undefined' ? window : {};
  const fromWin = w.__EKVALINE_LISTEN_PORT__;
  if (typeof fromWin === 'number' && Number.isFinite(fromWin) && fromWin > 0 && fromWin < 65536) return fromWin;
  const portMeta = document.querySelector('meta[name="ekvaline-api-port"]');
  const n = Number(portMeta && typeof portMeta.content === 'string' ? portMeta.content.trim() : '');
  if (Number.isFinite(n) && n > 0 && n < 65536) return n;
  return 3001;
}

function feedbackFallbackApiOrigins(apiPort) {
  const port = typeof apiPort === 'number' && apiPort > 0 ? apiPort : 3001;
  const o1 = `http://127.0.0.1:${port}`;
  const o2 = `http://localhost:${port}`;
  return o1 === o2 ? [o1] : [o1, o2];
}

/** URL POST /api/feedback (порт через /ekvaline-runtime.js или meta ekvaline-api-port). */
function getCallbackFeedbackPostUrls() {
  const apiPort = resolveFeedbackApiPort();
  const meta = document.querySelector('meta[name="ekvaline-api-origin"]');
  const rawMeta = meta && typeof meta.content === 'string' ? meta.content.trim() : '';
  if (rawMeta) {
    try {
      const o = new URL(rawMeta).origin;
      return [`${o}/api/feedback`];
    } catch {
      /* ниже общий режим */
    }
  }

  const proto = window.location.protocol;
  const origin = window.location.origin;
  const urls = [];
  const add = (u) => {
    if (typeof u === 'string' && !urls.includes(u)) urls.push(u);
  };

  if (proto === 'file:' || origin === 'null') {
    feedbackFallbackApiOrigins(apiPort).forEach((b) => add(`${b}/api/feedback`));
    return urls;
  }

  add(`${origin}/api/feedback`);
  if (shouldOfferFeedbackApiFallback(origin)) {
    for (const b of feedbackFallbackApiOrigins(apiPort)) {
      add(`${b}/api/feedback`);
    }
  }
  return urls;
}

function fetchOptionsForFeedbackUrl(url, bodyJson) {
  let crossSite = true;
  try {
    crossSite = new URL(url).origin !== new URL(window.location.href).origin;
  } catch {
    crossSite = true;
  }
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: crossSite ? 'omit' : 'same-origin',
    body: bodyJson,
    cache: 'no-store',
  };
}

/** Достаём JSON даже при мусоре до/после (прокси, лишние символы). Не цепляемся за первый «{» в HTML/CSS. */
function parseBalancedJsonObjectFrom(s, start) {
  if (!s || start < 0 || start >= s.length || s[start] !== '{') return null;
  const len = s.length;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < len; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          const o = JSON.parse(s.slice(start, i + 1));
          return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function tryParseFeedbackJsonEnvelope(text) {
  const s = String(text != null ? text : '').replace(/^\uFEFF/, '').trimStart();
  if (!s) return null;
  try {
    const o = JSON.parse(s);
    return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
  } catch {
    const okKey = /\{\s*"ok"\s*:/g;
    let m;
    while ((m = okKey.exec(s)) !== null) {
      const o = parseBalancedJsonObjectFrom(s, m.index);
      if (o) return o;
    }
    const okSucc = /\{\s*"success"\s*:/g;
    okSucc.lastIndex = 0;
    while ((m = okSucc.exec(s)) !== null) {
      const o = parseBalancedJsonObjectFrom(s, m.index);
      if (o) return o;
    }
    return null;
  }
}

function feedbackResponseAccepted(obj, status, rOk) {
  if ((status === 204 || status === 205) && rOk) return true;
  if (!obj || typeof obj !== 'object') return false;
  if (obj.ok === false) return false;
  if (obj.ok === true) return true;
  if (obj.success === true) return true;
  const v = obj.ok;
  if (v === 1 || v === '1' || v === 'true') return true;
  return false;
}

/** Успех по разобранному JSON или 204 (без зависимости от Content-Type). */
function parseFeedbackFetchResult(r, text) {
  const status = r.status;
  const obj = tryParseFeedbackJsonEnvelope(text);
  const accepted = feedbackResponseAccepted(obj, status, Boolean(r.ok));
  return { accepted, rawOk: Boolean(r.ok), status };
}

/* ── Callback form ── */
const callbackForm = document.getElementById('callbackForm');
if (callbackForm) {
  const cbName = document.getElementById('cbName');
  const cbPhone = document.getElementById('cbPhone');
  const cbMessage = document.getElementById('cbMessage');
  const cbNameError = document.getElementById('cbNameError');
  const cbPhoneError = document.getElementById('cbPhoneError');
  const cbMessageError = document.getElementById('cbMessageError');
  const cbMessageCount = document.getElementById('cbMessageCount');
  const callbackModal = document.getElementById('callbackModal');
  const callbackModalClose = document.getElementById('callbackModalClose');
  const callbackModalOk = document.getElementById('callbackModalOk');
  const cbSuccess = document.getElementById('cbSuccess');

  function normalizeName(value) {
    return value.replace(/\s+/g, ' ').trim();
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';

    const normalized = digits[0] === '8' ? `7${digits.slice(1)}` : digits;
    const cleaned = normalized.slice(0, 11);
    const country = cleaned[0] ? '+7' : '';
    const p1 = cleaned.slice(1, 4);
    const p2 = cleaned.slice(4, 7);
    const p3 = cleaned.slice(7, 9);
    const p4 = cleaned.slice(9, 11);

    let result = country;
    if (p1) result += ` (${p1}`;
    if (p1.length === 3) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  }

  function getPhoneDigits(value) {
    const digits = value.replace(/\D/g, '');
    return digits[0] === '8' ? `7${digits.slice(1)}` : digits;
  }

  function openSuccessModal() {
    if (!callbackModal) return;
    callbackModal.classList.add('open');
    callbackModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSuccessModal() {
    if (!callbackModal) return;
    callbackModal.classList.remove('open');
    callbackModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateMessageCount() {
    if (!cbMessage || !cbMessageCount) return;
    cbMessageCount.textContent = `${cbMessage.value.length}/400`;
  }

  function clearErrors() {
    if (cbNameError) cbNameError.textContent = '';
    if (cbPhoneError) cbPhoneError.textContent = '';
    if (cbMessageError) cbMessageError.textContent = '';
    if (cbName) cbName.classList.remove('input-error');
    if (cbPhone) cbPhone.classList.remove('input-error');
    if (cbMessage) cbMessage.classList.remove('input-error');
    if (cbSuccess) cbSuccess.textContent = '';
  }

  cbPhone.addEventListener('input', () => {
    cbPhone.value = formatPhone(cbPhone.value);
  });

  cbMessage.addEventListener('input', updateMessageCount);
  updateMessageCount();

  if (callbackModal) {
    callbackModal.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeModal === 'true') {
        closeSuccessModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && callbackModal.classList.contains('open')) {
        closeSuccessModal();
      }
    });

    callbackModalClose?.addEventListener('click', closeSuccessModal);
    callbackModalOk?.addEventListener('click', closeSuccessModal);
  }

  callbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    clearErrors();
    cbName.value = normalizeName(cbName.value);
    cbMessage.value = cbMessage.value.replace(/\s+/g, ' ').trim();
    updateMessageCount();

    if (!cbName.value) {
      cbNameError.textContent = 'Введите имя';
      cbName.classList.add('input-error');
      valid = false;
    } else if (cbName.value.length < 2) {
      cbNameError.textContent = 'Минимум 2 символа';
      cbName.classList.add('input-error');
      valid = false;
    } else if (!/^[\p{L}]+(?: [\p{L}]+)*$/u.test(cbName.value)) {
      cbNameError.textContent = 'Только буквы; несколько слов — через один пробел';
      cbName.classList.add('input-error');
      valid = false;
    } else if (cbName.value.length > 40) {
      cbNameError.textContent = 'Не более 40 символов';
      cbName.classList.add('input-error');
      valid = false;
    }

    const phoneDigits = getPhoneDigits(cbPhone.value);
    if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
      cbPhoneError.textContent = 'Введите номер в формате +7 (999) 123-45-67';
      cbPhone.classList.add('input-error');
      valid = false;
    }

    if (!cbMessage.value) {
      cbMessageError.textContent = 'Опишите ваш вопрос';
      cbMessage.classList.add('input-error');
      valid = false;
    } else if (cbMessage.value.length < 10) {
      cbMessageError.textContent = 'Минимум 10 символов';
      cbMessage.classList.add('input-error');
      valid = false;
    } else if (cbMessage.value.length > 400) {
      cbMessageError.textContent = 'Максимум 400 символов';
      cbMessage.classList.add('input-error');
      valid = false;
    } else if (/[<>]/.test(cbMessage.value)) {
      cbMessageError.textContent = 'Уберите символы < и >';
      cbMessage.classList.add('input-error');
      valid = false;
    }

    if (!valid) return;

    const btn = callbackForm.querySelector('.cb-submit-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = 'Отправляем...';

    try {
      const payload = {
        name: cbName.value,
        phone: String(phoneDigits),
        message: cbMessage.value,
      };

      let result = { accepted: false, rawOk: false, status: 0 };
      const urls = getCallbackFeedbackPostUrls();
      const bodyJson = JSON.stringify(payload);

      outer: for (let i = 0; i < urls.length; i += 1) {
        try {
          const r = await fetch(urls[i], fetchOptionsForFeedbackUrl(urls[i], bodyJson));
          const text = await r.text();
          const one = parseFeedbackFetchResult(r, text);
          result = one;
          if (one.accepted) break outer;
          if (one.status === 400) break outer;
        } catch {
          result = { accepted: false, rawOk: false, status: 0 };
          if (i === urls.length - 1) break outer;
        }
      }

      if (result.accepted) {
        callbackForm.reset();
        updateMessageCount();
        openSuccessModal();
        return;
      }

      if (result.status === 400) {
        cbName.classList.add('input-error');
        cbPhone.classList.add('input-error');
        cbMessage.classList.add('input-error');
        cbMessageError.textContent =
          'Проверьте имя, телефон и текст сообщения по подсказкам под полями.';
        return;
      }

      /** Любой иной код (редко) — без сообщений про сервер: повторная попытка через исправление полей / обновление страницы. */
      cbName.classList.add('input-error');
      cbPhone.classList.add('input-error');
      cbMessage.classList.add('input-error');
      cbMessageError.textContent =
        'Проверьте данные в полях и попробуйте отправить форму ещё раз.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Отправить <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    }
  });
}

/* ── Catalog page interactions ── */
const catalogFilters = document.getElementById('catalogFilters');
const catalogCards = Array.from(document.querySelectorAll('.full-catalog-card'));
const heroBubbles = document.getElementById('catalogHeroBubbles');
const coolerDetailsModal = document.getElementById('coolerDetailsModal');
const aelDetailsModal = document.getElementById('aelDetailsModal');

if (heroBubbles) {
  for (let i = 0; i < 14; i += 1) {
    const bubble = document.createElement('span');
    const size = 8 + Math.random() * 14;
    bubble.className = 'bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.setProperty('--bubble-delay', `${Math.random() * 4}s`);
    bubble.style.setProperty('--bubble-duration', `${5 + Math.random() * 5}s`);
    heroBubbles.appendChild(bubble);
  }
}

if (catalogFilters && catalogCards.length > 0) {
  const filterButtons = Array.from(catalogFilters.querySelectorAll('.catalog-filter-btn'));

  function applyCatalogFilter(category) {
    catalogCards.forEach((card) => {
      const isVisible = category === 'all' || card.dataset.category === category;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) {
        card.animate(
          [
            { opacity: 0, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 280, easing: 'ease-out' }
        );
      }
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      applyCatalogFilter(category);
    });
  });
}

function setupCatalogModal(modalElement, openSelector, closeSelector) {
  if (!modalElement) return;
  const openButtons = Array.from(document.querySelectorAll(openSelector));
  const closeButtons = Array.from(modalElement.querySelectorAll(closeSelector));

  function closeModal() {
    modalElement.classList.remove('open');
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openModal() {
    modalElement.classList.add('open');
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalElement.classList.contains('open')) {
      closeModal();
    }
  });
}

setupCatalogModal(coolerDetailsModal, '[data-cooler-open]', '[data-cooler-close]');
setupCatalogModal(aelDetailsModal, '[data-ael-open]', '[data-ael-close]');

catalogCards.forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 6;
    const rotateX = (0.5 - y) * 4;
    card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

document.querySelectorAll('.catalog-add-btn').forEach((button) => {
  button.addEventListener('click', (event) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 750);
  });
});

/* ── Delivery page interactions ── */
const deliveryPlanner = document.getElementById('deliveryPlanner');

const DEFAULT_DELIVERY_FAQ_CLIENT = Object.freeze([
  {
    code: 'Заявки',
    tag: 'Оператор',
    question: 'Во сколько можно принять заказ сегодня?',
    answer:
      'Прием заявок оператором: с 8:00 до 19:00. Заказы после 19:00 переносим на ближайшее доступное окно.',
  },
  {
    code: 'Интервал',
    tag: 'Квартира',
    question: 'Какие интервалы доставки доступны для частных клиентов?',
    answer: 'Для квартиры доступны окна 9:00-14:00, 14:00-17:00 и 17:00-21:00.',
  },
  {
    code: 'График',
    tag: 'Офис',
    question: 'Как оформить регулярную доставку воды для офиса?',
    answer:
      'Нужно связаться с оператором, выбрать удобные дни и интервал, после этого оператор сам проставит вам регулярные доставки.',
  },
  {
    code: 'Тара',
    tag: 'Обмен',
    question: 'Что делать с пустой тарой?',
    answer:
      'Курьер заберет пустые бутыли во время следующей доставки. Отдельно везти тару в офис не нужно.',
  },
]);

async function hydrateDeliveryFaqSection() {
  const nav = document.getElementById('deliveryFaqNav');
  if (!(deliveryPlanner instanceof HTMLElement) || !(nav instanceof HTMLElement)) return;

  let items = [...DEFAULT_DELIVERY_FAQ_CLIENT];
  try {
    const r = await fetch(`/api/public/settings?_=${Date.now()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data.deliveryFaq) && data.deliveryFaq.length) items = data.deliveryFaq;
    }
  } catch {
    /* без сервера остаётся локальный набор */
  }

  const loadingEl = document.getElementById('deliveryFaqLoading');
  if (loadingEl && loadingEl.parentNode === nav) loadingEl.remove();
  nav.innerHTML = '';

  const faqTitle = document.getElementById('deliveryFaqTitle');
  const faqText = document.getElementById('deliveryFaqText');
  const faqBadge = document.getElementById('deliveryFaqBadge');
  const faqCode = document.getElementById('deliveryFaqCode');

  function setActiveFaq(btn) {
    if (!(faqTitle && faqText) || !(btn instanceof HTMLButtonElement)) return;
    const title = btn.dataset.faqQuestion || '';
    const text = btn.dataset.faqAnswer || '';
    const badge = btn.dataset.faqTag || 'Инфо';
    const code = btn.dataset.faqCode || 'Запрос';
    nav.querySelectorAll('.delivery-faq-nav-btn').forEach((b) => {
      if (b instanceof HTMLButtonElement) b.classList.toggle('is-active', b === btn);
    });
    faqTitle.textContent = title;
    faqText.textContent = text;
    if (faqBadge) faqBadge.textContent = badge;
    if (faqCode) faqCode.textContent = code;
  }

  const faqButtons = [];
  items.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const code = String(raw.code ?? '').trim();
    const tag = String(raw.tag ?? '').trim();
    const question = String(raw.question ?? '').trim();
    const answer = String(raw.answer ?? '').trim();
    if (!code || !tag || !question || !answer) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `delivery-faq-nav-btn${faqButtons.length === 0 ? ' is-active' : ''}`;
    btn.dataset.faqCode = code;
    btn.dataset.faqTag = tag;
    btn.dataset.faqQuestion = question;
    btn.dataset.faqAnswer = answer;

    const top = document.createElement('span');
    top.className = 'delivery-faq-nav-top';
    const codeSpan = document.createElement('span');
    codeSpan.className = 'delivery-faq-nav-code';
    codeSpan.textContent = code;
    const tagSpan = document.createElement('span');
    tagSpan.className = 'delivery-faq-nav-tag';
    tagSpan.textContent = tag;
    top.appendChild(codeSpan);
    top.appendChild(tagSpan);

    const questionSpan = document.createElement('span');
    questionSpan.className = 'delivery-faq-nav-text';
    questionSpan.textContent = question;

    btn.appendChild(top);
    btn.appendChild(questionSpan);
    btn.addEventListener('click', () => setActiveFaq(btn));
    nav.appendChild(btn);
    faqButtons.push(btn);
  });

  if (!faqButtons.length) {
    nav.innerHTML = '<p class="delivery-faq-loading">Не удалось показать вопросы. Проверьте соединение и обновите страницу.</p>';
    return;
  }

  setActiveFaq(faqButtons[0]);
}

void hydrateDeliveryFaqSection();

const DEFAULT_DELIVERY_COVERAGE_CLIENT = Object.freeze({
  title: 'Зоны покрытия Оренбурга',
  cards: Object.freeze([
    Object.freeze({
      title: 'Интервалы доставки',
      text: 'Утро: 9:00-14:00, День: 14:00-17:00, Вечер: 17:00-21:00',
    }),
    Object.freeze({
      title: 'Доставка для организаций',
      text: 'Отдельное окно: 9:00-17:00',
    }),
    Object.freeze({
      title: 'Прием заказов',
      text: 'Оператор принимает заявки: 8:00-19:00',
    }),
  ]),
});

function coerceDeliveryCoverageCard(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title ?? '').trim().slice(0, 120);
  const text = String(raw.text ?? '').trim().slice(0, 100);
  if (title.length < 1 || text.length < 1) return null;
  return { title, text };
}

async function hydrateDeliveryCoverageSection() {
  const root = document.getElementById('deliveryCoverageCardsRoot');
  const heading = document.getElementById('deliveryCoverageHeading');
  if (!root || !heading) return;

  let panel = {
    title: DEFAULT_DELIVERY_COVERAGE_CLIENT.title,
    cards: DEFAULT_DELIVERY_COVERAGE_CLIENT.cards.map((c) => ({ title: c.title, text: c.text })),
  };

  try {
    const r = await fetch(`/api/public/settings?_=${Date.now()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      const raw = data?.deliveryCoverage;
      if (raw && typeof raw === 'object') {
        const title = String(raw.title ?? '').trim();
        const cardsIn = Array.isArray(raw.cards) ? raw.cards : [];
        const cards = [];
        for (const c of cardsIn) {
          const row = coerceDeliveryCoverageCard(c);
          if (row) cards.push(row);
          if (cards.length >= 8) break;
        }
        if (title.length >= 3 && cards.length >= 1) {
          panel = { title: title.slice(0, 160), cards };
        }
      }
    }
  } catch {
    /* офлайн — дефолтный текст */
  }

  heading.textContent = panel.title;

  root.replaceChildren();

  function setActiveZone(idx) {
    Array.from(root.querySelectorAll('.delivery-zone-item')).forEach((el, i) => {
      el.classList.toggle('is-active', i === idx);
    });
  }

  panel.cards.forEach((card, idx) => {
    const art = document.createElement('article');
    art.className = 'delivery-zone-item';
    if (idx === 0) art.classList.add('is-active');

    const dot = document.createElement('div');
    dot.className = 'zone-dot';

    const inner = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = card.title;
    const p = document.createElement('p');
    p.textContent = card.text;

    inner.appendChild(h3);
    inner.appendChild(p);
    art.appendChild(dot);
    art.appendChild(inner);

    art.addEventListener('click', () => setActiveZone(idx));
    art.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        setActiveZone(idx);
      }
    });
    art.tabIndex = 0;
    art.setAttribute('role', 'button');

    root.appendChild(art);
  });
}

void hydrateDeliveryCoverageSection();

const deliveryLeafletMap = document.getElementById('deliveryLeafletMap');

if (deliveryLeafletMap && window.EkvalineMaps && typeof window.EkvalineMaps.initStaticMap === 'function') {
  void window.EkvalineMaps.initStaticMap(deliveryLeafletMap, [51.768, 55.102], 12).catch(() => {});
}

const aboutSteps = document.getElementById('aboutSteps');

if (aboutSteps) {
  const stepButtons = Array.from(aboutSteps.querySelectorAll('.about-step-btn'));
  const stepPanels = Array.from(aboutSteps.querySelectorAll('.about-step-panel'));
  const progressFill = aboutSteps.querySelector('#aboutStepProgressFill');

  function setActiveAboutStep(stepId) {
    const activeIndex = stepButtons.findIndex((button) => button.dataset.step === stepId);
    if (activeIndex === -1) return;

    stepButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.step === stepId));
    stepPanels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.stepPanel === stepId));

    if (progressFill) {
      const totalSteps = Math.max(1, stepButtons.length - 1);
      progressFill.style.width = `${(activeIndex / totalSteps) * 100}%`;
    }
  }

  stepButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveAboutStep(button.dataset.step);
    });

    button.addEventListener('keydown', (event) => {
      const index = stepButtons.indexOf(button);
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const next = stepButtons[(index + 1) % stepButtons.length];
        next.focus();
        setActiveAboutStep(next.dataset.step);
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const prev = stepButtons[(index - 1 + stepButtons.length) % stepButtons.length];
        prev.focus();
        setActiveAboutStep(prev.dataset.step);
      }
    });
  });

  const initial = stepButtons.find((button) => button.classList.contains('is-active')) || stepButtons[0];
  if (initial) setActiveAboutStep(initial.dataset.step);
}

const DEFAULT_ABOUT_CERTIFICATES_CLIENT = Object.freeze([
  {
    image: 'assets/certificate-card.jpg',
    alt: 'Карточка предприятия',
    badge: 'Документ',
    title: 'Карточка предприятия',
    description: 'Реквизиты организации, контакты, банковские данные и юридическая информация.',
  },
  {
    image: 'assets/certificate-eac.jpg',
    alt: 'Декларация о соответствии ЕАЭС',
    badge: 'ЕАЭС',
    title: 'Декларация о соответствии',
    description: 'Подтверждение соответствия продукции требованиям технических регламентов.',
  },
  {
    image: 'assets/certificate-lab.jpg',
    alt: 'Протокол лабораторных испытаний',
    badge: 'Лаборатория',
    title: 'Протокол испытаний',
    description: 'Результаты лабораторных проверок качества и безопасности питьевой воды.',
  },
]);

async function hydrateAboutCertificatesSection() {
  const grid = document.getElementById('aboutCertsGrid');
  if (!grid) return;

  let items = [...DEFAULT_ABOUT_CERTIFICATES_CLIENT];
  try {
    const r = await fetch(`/api/public/settings?_=${Date.now()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data.aboutCertificates) && data.aboutCertificates.length) items = data.aboutCertificates;
    }
  } catch {
    /* без сервера — локальный набор */
  }

  grid.replaceChildren();

  items.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const image = String(raw.image ?? '').trim();
    const alt = String(raw.alt ?? '').trim();
    const badge = String(raw.badge ?? '').trim();
    const title = String(raw.title ?? '').trim();
    const description = String(raw.description ?? '').trim();
    if (!image || !alt || !title || !description) return;

    const art = document.createElement('article');
    art.className = 'about-cert-card';

    const img = document.createElement('img');
    img.src = image;
    img.alt = alt;
    img.loading = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'about-cert-overlay';

    const badgeEl = document.createElement('span');
    badgeEl.textContent = badge;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const descEl = document.createElement('p');
    descEl.textContent = description;

    overlay.appendChild(badgeEl);
    overlay.appendChild(titleEl);
    overlay.appendChild(descEl);
    art.appendChild(img);
    art.appendChild(overlay);
    grid.appendChild(art);
  });

  if (!grid.children.length) {
    const fallback = document.createElement('p');
    fallback.className = 'about-certs-empty';
    fallback.textContent = 'Не удалось загрузить блок сертификатов. Обновите страницу позже.';
    grid.appendChild(fallback);
  }
}

void hydrateAboutCertificatesSection();

/* ── Back to top button (all pages) ── */
(function initBackToTopButton() {
  if (!document.body) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top-btn';
  button.setAttribute('aria-label', 'Наверх');
  button.textContent = '↑';
  document.body.appendChild(button);

  const SHOW_OFFSET = 320;

  function updateVisibility() {
    const y = window.scrollY || window.pageYOffset || 0;
    button.classList.toggle('is-visible', y > SHOW_OFFSET);
  }

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
})();
