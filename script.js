/* ── Auth + cabinet (frontend only, no DB) ── */
(function initAuthAndCabinet() {
  const USERS_KEY = 'ekvaline_users';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const MANAGER_LOGIN = 'manager@ekvaline.local';
  const MANAGER_PASSWORD = 'AquaManager2026';

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
          <label>Телефон или email
            <input type="text" id="authLoginValue" placeholder="+7 (999) 123-45-67 или email" />
          </label>
          <label>Пароль
            <input type="password" id="authLoginPassword" placeholder="Введите пароль" />
          </label>
          <p class="auth-error" id="authLoginError"></p>
          <button type="submit" class="auth-submit">Войти</button>
        </form>

        <form id="authRegisterForm" class="auth-form hidden" novalidate>
          <label>Имя
            <input type="text" id="authRegName" maxlength="40" placeholder="Ваше имя" />
          </label>
          <label>Email
            <input type="email" id="authRegEmail" placeholder="example@mail.ru" />
          </label>
          <label>Телефон
            <input type="tel" id="authRegPhone" maxlength="18" placeholder="+7 (999) 123-45-67" />
          </label>
          <label>Пароль
            <input type="password" id="authRegPassword" minlength="8" maxlength="32" placeholder="Минимум 8 символов" />
          </label>
          <label>Повторите пароль
            <input type="password" id="authRegPasswordConfirm" minlength="8" maxlength="32" placeholder="Повторите пароль" />
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

  function isStrongPassword(value) {
    return /^(?=.*[A-Za-zА-Яа-я])(?=.*\d).{8,32}$/.test(value);
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
    if (!isValidEmail(data.email)) {
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
    if (user.role === 'manager') {
      window.location.href = 'manager.html';
      return;
    }
    window.location.href = 'cabinet.html';
    return;

    cabinetUserName.textContent = user.name;
    cabinetUserMeta.textContent = `${user.email} · ${formatPhoneMask(user.phone)}`;
    cabinet.classList.add('open');
    cabinet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const active = cabinetNavButtons.find((btn) => btn.classList.contains('active'));
    renderCabinetSection(active?.dataset.cabinetSection || 'notifications', user);
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
  }

  function updateHeaderAuth() {
    const user = readCurrentUser();
    const isLoggedIn = Boolean(user) && user.role !== 'manager';
    loginTrigger.style.display = isLoggedIn ? 'none' : 'inline-flex';
    registerTrigger.style.display = isLoggedIn ? 'none' : 'inline-flex';
    cabinetTrigger.style.display = isLoggedIn ? 'inline-flex' : 'none';
  }

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

  authLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    authLoginError.textContent = '';

    const credential = authLoginValue.value.trim();
    const password = authLoginPassword.value;
    const byEmail = credential.toLowerCase();
    const byPhone = normalizePhoneDigits(credential);

    if (!credential || !password) {
      authLoginError.textContent = 'Заполните телефон/email и пароль.';
      return;
    }

    if (byEmail === MANAGER_LOGIN) {
      if (password !== MANAGER_PASSWORD) {
        authLoginError.textContent = 'Неверный пароль менеджера.';
        return;
      }
      saveCurrentUser({
        id: 'manager',
        name: 'Менеджер блога',
        email: MANAGER_LOGIN,
        phone: '',
        role: 'manager',
      });
      closeAuthModal();
      window.location.href = 'manager.html';
      return;
    }

    const user = readUsers().find((item) => item.email === byEmail || item.phone === byPhone);
    if (!user || user.password !== password) {
      authLoginError.textContent = 'Неверные данные для входа.';
      return;
    }

    saveCurrentUser({ id: user.id, name: user.name, email: user.email, phone: user.phone });
    updateHeaderAuth();
    closeAuthModal();
    openCabinet();
  });

  authRegisterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    authRegisterError.textContent = '';

    const name = normalizeName(authRegName.value);
    const email = authRegEmail.value.trim().toLowerCase();
    const phone = normalizePhoneDigits(authRegPhone.value);
    const password = authRegPassword.value;
    const passwordConfirm = authRegPasswordConfirm.value;

    if (!name || name.length < 2 || !/^[A-Za-zА-Яа-яЁё\s\-']{2,40}$/.test(name)) {
      authRegisterError.textContent = 'Имя должно содержать 2-40 символов и только буквы.';
      return;
    }
    if (!isValidEmail(email)) {
      authRegisterError.textContent = 'Введите корректный email.';
      return;
    }
    if (email === MANAGER_LOGIN) {
      authRegisterError.textContent = 'Этот логин зарезервирован для менеджера блога.';
      return;
    }
    if (phone.length !== 11 || phone[0] !== '7') {
      authRegisterError.textContent = 'Введите телефон в формате +7 (999) 123-45-67.';
      return;
    }
    if (!isStrongPassword(password)) {
      authRegisterError.textContent = 'Пароль: 8-32 символа, минимум 1 буква и 1 цифра.';
      return;
    }
    if (password !== passwordConfirm) {
      authRegisterError.textContent = 'Пароли не совпадают.';
      return;
    }

    const users = readUsers();
    const exists = users.some((item) => item.email === email || item.phone === phone);
    if (exists) {
      authRegisterError.textContent = 'Пользователь с таким email или телефоном уже существует.';
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
    saveCurrentUser({ id: newUser.id, name, email, phone });
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

  cabinetLogout.addEventListener('click', () => {
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
})();

/* ── Cart + checkout (frontend only, no DB) ── */
(function initCartAndCheckout() {
  const CART_KEY = 'ekvaline_cart_items';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ORDERS_KEY = 'ekvaline_orders_by_user';
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

  function parsePrice(value) {
    const matches = String(value || '')
      .replace(/\s/g, '')
      .match(/(\d+)/g);
    if (!matches || !matches.length) return 0;
    return Number(matches[matches.length - 1]) || 0;
  }

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
        <datalist id="mapCitySuggestions"></datalist>
        <div id="checkoutMapRoot" class="checkout-map-root"></div>
        <p id="checkoutMapAddress" class="checkout-map-address">Адрес не выбран.</p>
        <div class="checkout-map-actions">
          <button type="button" class="catalog-more-btn" data-map-close="true">Отмена</button>
          <button type="button" class="auth-submit" id="applyMapAddressBtn" disabled>Использовать адрес</button>
        </div>
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
  const mapCitySuggestions = document.getElementById('mapCitySuggestions');
  const mapStreetDropdown = document.getElementById('mapStreetDropdown');

  let leafletReadyPromise = null;
  let mapInstance = null;
  let mapMarker = null;
  let pickedAddress = '';
  let mapSearchTimer = null;
  let citySuggestTimer = null;
  let streetSuggestTimer = null;
  let latestGeocodeRequestId = 0;

  function updateCheckoutCommentCounter() {
    if (!(checkoutCommentField instanceof HTMLTextAreaElement) || !(checkoutCommentCounter instanceof HTMLElement)) {
      return;
    }
    checkoutCommentCounter.textContent = `${checkoutCommentField.value.length}/${CHECKOUT_COMMENT_MAX}`;
  }

  function setCartError(message) {
    if (!(cartErrorText instanceof HTMLElement)) return;
    cartErrorText.textContent = message || '';
    cartErrorText.style.display = message ? 'block' : 'none';
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletReadyPromise) return leafletReadyPromise;
    leafletReadyPromise = new Promise((resolve, reject) => {
      const cssExists = document.querySelector('link[data-leaflet-css="true"]');
      if (!cssExists) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(css);
      }

      const existingScript = document.querySelector('script[data-leaflet-js="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.L));
        existingScript.addEventListener('error', () => reject(new Error('leaflet_load_error')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.setAttribute('data-leaflet-js', 'true');
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('leaflet_load_error'));
      document.head.appendChild(script);
    });
    return leafletReadyPromise;
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
      format: 'jsonv2',
      limit: '6',
      'accept-language': 'ru',
      addressdetails: '1',
      countrycodes: 'ru',
      city: parts.city,
      street: `${parts.house} ${normalizedStreet}`.trim(),
    });
    if (normalizeAddressToken(parts.city) === normalizeAddressToken(DEFAULT_CITY)) {
      params.set('bounded', '1');
      params.set('viewbox', ORENBURG_VIEWBOX);
    }
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('geocode_failed');
        return response.json();
      })
      .then((rows) => (Array.isArray(rows) ? rows : []));
  }

  function searchSuggestions(query, limit = 5) {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&accept-language=ru&q=${q}`;
    return fetch(url, { headers: { Accept: 'application/json' } })
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

  function showStreetDropdown(values) {
    if (!(mapStreetDropdown instanceof HTMLElement)) return;
    if (!values.length) {
      mapStreetDropdown.hidden = true;
      mapStreetDropdown.innerHTML = '';
      return;
    }
    mapStreetDropdown.innerHTML = values
      .slice(0, 8)
      .map(
        (value) =>
          `<button type="button" class="address-suggest-item" data-street-suggest="${escapeHtmlLocal(value)}">${escapeHtmlLocal(value)}</button>`
      )
      .join('');
    mapStreetDropdown.hidden = false;
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

  async function updateStreetSuggestions() {
    const streetQ = String(mapStreetInput instanceof HTMLInputElement ? mapStreetInput.value : '').trim();
    const cityQRaw = String(mapCityInput instanceof HTMLInputElement ? mapCityInput.value : '').trim();
    const cityQ = cityQRaw || DEFAULT_CITY;
    if (streetQ.length < 1) {
      showStreetDropdown([]);
      return;
    }
    const normalizedNeedle = normalizeAddressToken(streetQ);
    const localMatches = ORENBURG_STREETS.filter((item) => {
      const nName = normalizeAddressToken(item.name);
      const nType = normalizeAddressToken(item.type);
      return nName.startsWith(normalizedNeedle) || nName.includes(normalizedNeedle) || nType.startsWith(normalizedNeedle);
    })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((item) => formatStreetLabel(item));
    if (localMatches.length) {
      const uniqLocal = [...new Set(localMatches)].slice(0, 10);
      showStreetDropdown(uniqLocal);
    }
    try {
      const rows = await searchSuggestions(`${cityQ}, ${streetQ}`.trim(), 20);
      const values = rows
        .map((row) => row.address?.road || row.address?.pedestrian || row.address?.footway || '')
        .filter(Boolean)
        .map((name) => {
          const prepared = toTitleCase(name);
          if (/переулок|пер\.?/i.test(prepared)) return prepared;
          const matchedLane = ORENBURG_STREETS.find(
            (item) => item.type === 'переулок' && normalizeAddressToken(item.name) === normalizeAddressToken(prepared)
          );
          return matchedLane ? formatStreetLabel(matchedLane) : prepared;
        })
        .filter((name) => {
          const n = normalizeAddressToken(name);
          return n.startsWith(normalizedNeedle) || n.includes(normalizedNeedle);
        });
      const unique = [...new Set([...localMatches, ...values])].slice(0, 10);
      showStreetDropdown(unique);
    } catch {
      if (!localMatches.length) {
        showStreetDropdown([]);
      }
    }
  }

  async function fallbackGeocode(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const q = encodeURIComponent(`${parts.city}, ${normalizedStreet}, ${parts.house}, Россия`);
    let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=ru&addressdetails=1&countrycodes=ru&q=${q}`;
    if (normalizeAddressToken(parts.city) === normalizeAddressToken(DEFAULT_CITY)) {
      url += `&bounded=1&viewbox=${encodeURIComponent(ORENBURG_VIEWBOX)}`;
    }
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
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

  function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ru&addressdetails=1`;
    return fetch(url, { headers: { Accept: 'application/json' } })
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

  function isGeocodeMatchAccurate(parts, match) {
    if (!match) return false;
    const addr = match.address || {};
    const matchStreet = normalizeAddressToken(addr.road || addr.pedestrian || addr.footway || '');
    const matchHouse = normalizeAddressToken(addr.house_number || '');
    const srcStreet = normalizeAddressToken(parts.street);
    const srcHouse = normalizeAddressToken(parts.house);
    const display = normalizeAddressToken(match.display_name || '');
    const streetOk = srcStreet && (matchStreet.includes(srcStreet) || srcStreet.includes(matchStreet) || display.includes(srcStreet));
    const houseOk = srcHouse && (matchHouse === srcHouse || display.includes(srcHouse));
    return Boolean(streetOk && houseOk);
  }

  function updatePickedAddressLabel() {
    const parts = readAddressParts();
    pickedAddress = formatAddressByTemplate(parts);
    if (checkoutMapAddress instanceof HTMLElement) {
      checkoutMapAddress.textContent = pickedAddress || 'Заполните: город, улица, дом.';
    }
    if (applyMapAddressBtn instanceof HTMLButtonElement) {
      const apartmentFilled = Boolean(parts.apartment);
      const apartmentExtrasOk = apartmentFilled ? Boolean(parts.floor && parts.entrance) : true;
      applyMapAddressBtn.disabled = !parts.city || !parts.street || !parts.house || !apartmentExtrasOk;
    }
  }

  async function syncMapByInputs() {
    const parts = readAddressParts();
    updatePickedAddressLabel();
    if (!parts.city || !parts.street || !parts.house || !mapInstance) return;
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
      if (!window.L) return;
      if (!mapMarker) mapMarker = window.L.marker([lat, lon]).addTo(mapInstance);
      else mapMarker.setLatLng([lat, lon]);
      mapInstance.setView([lat, lon], 16);
      const accurate = isGeocodeMatchAccurate(parts, match);
      if (!accurate && checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent =
          `Внимание: карта нашла похожий адрес. Проверьте улицу и дом. Сейчас: ${pickedAddress || 'адрес не собран'}`;
      }
    } catch {
      /* silent */
    }
  }

  async function initMapPicker() {
    if (!(checkoutMapRoot instanceof HTMLElement)) return;
    const L = await loadLeaflet();
    if (!mapInstance) {
      mapInstance = L.map(checkoutMapRoot).setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapInstance);

      mapInstance.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        if (!mapMarker) mapMarker = L.marker([lat, lng]).addTo(mapInstance);
        else mapMarker.setLatLng([lat, lng]);
        if (checkoutMapAddress instanceof HTMLElement) checkoutMapAddress.textContent = 'Определяем адрес...';

        try {
          const data = await reverseGeocode(lat, lng);
          applyReverseAddress(data);
          updatePickedAddressLabel();
        } catch {
          updatePickedAddressLabel();
          if (checkoutMapAddress instanceof HTMLElement) checkoutMapAddress.textContent = 'Не удалось определить адрес. Уточните поля вручную.';
        }
      });
    }
    setTimeout(() => mapInstance?.invalidateSize(), 30);
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
      mapInstance?.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
      void syncMapByInputs();
    } catch {
      closeMapPicker();
      alert('Не удалось загрузить карту. Проверьте подключение к интернету.');
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
      if (mapStreetInput instanceof HTMLInputElement) {
        mapStreetInput.value = value;
        applyTitleCaseInput(mapStreetInput);
        showStreetDropdown([]);
        updatePickedAddressLabel();
        void syncMapByInputs();
      }
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
        !deliverySlot ||
        !apartmentAddressValid
      ) {
        alert(
          `Проверьте поля: выберите адрес на карте, интервал доставки, адрес до ${CHECKOUT_ADDRESS_MAX} символов, комментарий до ${CHECKOUT_COMMENT_MAX} символов. Если указана квартира — обязательно заполните этаж и подъезд.`
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
        id: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: hasPreorderItems ? 'pending_operator' : 'new',
        items,
        subtotal,
        bonusSpend,
        bonusEarned,
        total,
        address,
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
      updateCheckoutCommentCounter();
      if (hasPreorderItems) {
        alert('Заказ с товарами "под заказ" принят. Укажите свою почту в примечании: компания пришлет всю необходимую информацию и дату доставки.');
      } else {
        alert(`Заказ оформлен! Начислено бонусов: ${bonusEarned}.`);
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
        void syncMapByInputs();
      }, 450);
    });
  });

  mapCityInput?.addEventListener('input', () => {
    if (citySuggestTimer) window.clearTimeout(citySuggestTimer);
    citySuggestTimer = window.setTimeout(() => {
      void updateCitySuggestions();
    }, 220);
  });

  mapStreetInput?.addEventListener('input', () => {
    if (streetSuggestTimer) window.clearTimeout(streetSuggestTimer);
    streetSuggestTimer = window.setTimeout(() => {
      void updateStreetSuggestions();
    }, 220);
  });

  mapStreetInput?.addEventListener('focus', () => {
    void updateStreetSuggestions();
  });

  mapStreetInput?.addEventListener('blur', () => {
    setTimeout(() => showStreetDropdown([]), 120);
  });

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

if (
  peopleRange &&
  peopleValue &&
  litersValue &&
  bottlesValue &&
  bottleWater &&
  usageText &&
  drinkNormValue &&
  householdReserveValue &&
  monthlyLitersValue &&
  orderIntervalValue &&
  calcNote &&
  planLineOne &&
  planLineTwo &&
  planLineFive &&
  planTierValue
) {
  const activityMultiplier = {
    low: 0.88,
    medium: 1,
    high: 1.16,
  };

  const seasonMultiplier = {
    winter: 0.93,
    'spring-autumn': 1,
    summer: 1.12,
  };

  const activityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  };

  const seasonLabels = {
    winter: 'Зима',
    'spring-autumn': 'Весна/Осень',
    summer: 'Лето',
  };

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

  function toOneDecimal(value) {
    return Math.round(value * 10) / 10;
  }

  function formatDecimal(value) {
    return toOneDecimal(value).toFixed(1).replace('.', ',');
  }

  function formatMoney(value) {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  }

  function pluralOrders(value) {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return 'заказ';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заказа';
    return 'заказов';
  }

  function pluralDays(days) {
    const mod10 = days % 10;
    const mod100 = days % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
  }

  function setDependentControlsDisabled(disabled) {
    document.querySelectorAll('.option-btn[data-group="activity"], .option-btn[data-group="season"]').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function updateCalc() {
    const isDrinking = state.usage === 'drink' || state.usage === 'both';
    const isCooking = state.usage === 'cook' || state.usage === 'both';

    // Базовая питьевая норма на человека: 2 л/сутки + поправки на активность/сезон.
    const baseDrinkPerPerson = 2;
    const activityFactor = isDrinking ? activityMultiplier[state.activity] : 1;
    const seasonFactor = isDrinking ? seasonMultiplier[state.season] : 1;
    const dailyDrinkLiters =
      isDrinking ? state.people * baseDrinkPerPerson * activityFactor * seasonFactor : 0;

    // Расход на готовку/напитки для кухни из той же воды.
    const cookPerPerson = 0.8;
    const householdReserveLiters = isCooking ? state.people * cookPerPerson : 0;
    const dailyLiters = dailyDrinkLiters + householdReserveLiters;
    const monthlyLiters = dailyLiters * 30;
    const reserveCoefficient = 1.1;
    const monthlyWithReserve = monthlyLiters * reserveCoefficient;

    const dailyForDisplay = Math.max(1, toOneDecimal(dailyLiters));
    const monthlyForDisplay = Math.round(monthlyWithReserve);
    const monthlyBottles = Math.max(1, Math.ceil(monthlyWithReserve / 19));
    const daysPerBottle = Math.max(1, Math.round(19 / dailyForDisplay));
    const waterPercent = Math.min(80, Math.max(24, dailyForDisplay * 6.5));

    // Тарифы: 1 шт = 220, 2-4 шт = 190, 5+ шт = 175.
    // Учитываем минимальные количества, чтобы расчёт оставался реалистичным.
    const onePurchased = monthlyBottles;
    const oneQty = 1;
    const oneOrders = onePurchased;
    const oneTotal = onePurchased * 220;

    const twoPurchased = monthlyBottles === 1 ? 2 : monthlyBottles;
    const twoOrders = Math.max(1, Math.ceil(twoPurchased / 4));
    const twoQty = Math.min(4, Math.max(2, Math.ceil(twoPurchased / twoOrders)));
    const twoTotal = twoPurchased * 190;

    const fivePurchased = Math.max(5, monthlyBottles);
    const fiveOrders = Math.max(1, Math.ceil(fivePurchased / 8));
    const fiveQty = Math.max(5, Math.ceil(fivePurchased / fiveOrders));
    const fiveTotal = fivePurchased * 175;

    const tierLabel = fiveTotal <= twoTotal && fiveTotal <= oneTotal
      ? 'от 5 бутылей по 175 ₽'
      : twoTotal <= oneTotal
        ? '2-4 бутыли по 190 ₽'
        : '1 бутыль по 220 ₽';

    const activityHint = {
      low: 'низкая активность',
      medium: 'средняя активность',
      high: 'высокая активность',
    };
    const seasonHint = {
      winter: 'зимний период',
      'spring-autumn': 'весна/осень',
      summer: 'летний период',
    };

    peopleValue.textContent = String(state.people);
    litersValue.textContent = formatDecimal(dailyForDisplay);
    bottlesValue.textContent = `${monthlyBottles} шт`;
    bottleWater.style.height = `${waterPercent}%`;
    bottleWater.classList.remove('season-winter', 'season-spring-autumn', 'season-summer');
    if (isDrinking) {
      bottleWater.classList.add(`season-${state.season}`);
    } else {
      // Для режима "только готовка" оставляем базовый зимний (синий) цвет.
      bottleWater.classList.add('season-winter');
    }
    usageText.textContent = usageLabels[state.usage];
    activityText.textContent = isDrinking ? activityLabels[state.activity] : 'Не учитывается';
    seasonText.textContent = isDrinking ? seasonLabels[state.season] : 'Не учитывается';
    drinkNormValue.textContent = `${formatDecimal(dailyDrinkLiters)} л/день`;
    householdReserveValue.textContent = `${formatDecimal(householdReserveLiters)} л/день`;
    monthlyLitersValue.textContent = `${monthlyForDisplay} л`;
    orderIntervalValue.textContent = `каждые ${daysPerBottle} ${pluralDays(daysPerBottle)}`;
    planLineOne.textContent = `${oneQty} бут./заказ • ${oneOrders} ${pluralOrders(oneOrders)}/мес • ${formatMoney(oneTotal)}/мес`;
    planLineTwo.textContent = `${twoQty} бут./заказ • ${twoOrders} ${pluralOrders(twoOrders)}/мес • ${formatMoney(twoTotal)}/мес`;
    planLineFive.textContent = `${fiveQty} бут./заказ • ${fiveOrders} ${pluralOrders(fiveOrders)}/мес • ${formatMoney(fiveTotal)}/мес`;
    planTierValue.textContent = tierLabel;

    if (state.usage === 'both') {
      calcNote.textContent = `Расчет для ${state.people} чел.: ${activityHint[state.activity]}, ${seasonHint[state.season]}, с запасом 10% на непредвиденное потребление.`;
    } else if (state.usage === 'drink') {
      calcNote.textContent = `Расчет для ${state.people} чел. только на питьевую воду: ${activityHint[state.activity]}, ${seasonHint[state.season]}, с запасом 10%.`;
    } else {
      calcNote.textContent = `Расчет для ${state.people} чел. только на готовку и кухонные напитки с запасом 10%. Питьевая норма не учитывается.`;
    }

    setDependentControlsDisabled(!isDrinking);
  }

  function setGroupActive(group, value) {
    document.querySelectorAll(`.option-btn[data-group="${group}"]`).forEach((button) => {
      const isActive = button.dataset.value === value;
      button.classList.toggle('active', isActive);
    });
  }

  peopleRange.addEventListener('input', (event) => {
    state.people = Number(event.target.value);
    updateCalc();
  });

  document.querySelectorAll('.option-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { group, value } = button.dataset;
      state[group] = value;
      setGroupActive(group, value);
      updateCalc();
    });
  });

  updateCalc();
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
    cbNameError.textContent = '';
    cbPhoneError.textContent = '';
    cbMessageError.textContent = '';
    cbName.classList.remove('input-error');
    cbPhone.classList.remove('input-error');
    cbMessage.classList.remove('input-error');
    cbSuccess.textContent = '';
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
    } else if (!/^[A-Za-zА-Яа-яЁё\s\-']+$/.test(cbName.value)) {
      cbNameError.textContent = 'Только буквы, пробел, дефис и апостроф';
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
    btn.disabled = true;
    btn.innerHTML = 'Отправляем...';

    try {
      const api = window.EkvalineAPI;
      const payload = {
        name: cbName.value,
        phone: phoneDigits,
        message: cbMessage.value,
      };
      const result = api
        ? await api.json('/api/feedback', { method: 'POST', body: payload })
        : { ok: false, data: { error: 'API недоступен. Откройте сайт через npm start.' } };

      if (!result.ok) {
        cbMessageError.textContent = (result.data && result.data.error) || 'Не удалось отправить форму.';
        cbMessage.classList.add('input-error');
        return;
      }

      callbackForm.reset();
      updateMessageCount();
      openSuccessModal();
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

if (deliveryPlanner) {
  const faqButtons = Array.from(deliveryPlanner.querySelectorAll('.delivery-faq-nav-btn'));
  const faqTitle = document.getElementById('deliveryFaqTitle');
  const faqText = document.getElementById('deliveryFaqText');
  const faqBadge = document.getElementById('deliveryFaqBadge');
  const faqCode = document.getElementById('deliveryFaqCode');

  function setActiveFaq(button) {
    if (!faqTitle || !faqText) return;
    const title = button.dataset.faqQuestion || '';
    const text = button.dataset.faqAnswer || '';
    const badge = button.dataset.faqTag || 'Инфо';
    const code = button.dataset.faqCode || 'Запрос';
    faqButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
    faqTitle.textContent = title;
    faqText.textContent = text;
    if (faqBadge) faqBadge.textContent = badge;
    if (faqCode) faqCode.textContent = code;
  }

  faqButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveFaq(button);
    });
  });

  if (faqButtons[0]) setActiveFaq(faqButtons[0]);
}

const deliveryLeafletMap = document.getElementById('deliveryLeafletMap');

if (deliveryLeafletMap && window.L) {
  const map = L.map(deliveryLeafletMap, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([51.768, 55.102], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
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
