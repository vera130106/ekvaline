/* ── Auth modal + header (вход/регистрация через API сервера) ── */
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
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const STAFF_RESERVED_EMAILS = new Set([
    'menekva@mail.ru',
    'managerekva@mail.ru',
    'opekva@mail.ru',
    'operatorekva@mail.ru',
    'admekva@mail.ru',
    'adminekva@mail.ru',
  ]);

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
          <div id="authLoginFields">
            <label>Email
              <input type="email" id="authLoginValue" placeholder="example@mail.ru" autocomplete="username" />
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
            <p class="auth-info" id="authLoginInfo" hidden></p>
            <button type="submit" class="auth-submit">Войти</button>
            <p><button type="button" class="auth-forgot-link" id="authForgotToggle">Забыли пароль?</button></p>
          </div>

          <div class="auth-forgot-panel" id="authForgotPanel" hidden>
            <p class="auth-forgot-hint">Только для клиентских аккаунтов. Сотрудники (админ, менеджер, оператор, водитель) — пароль задаёт администратор.</p>
            <label>Email
              <input type="email" id="authForgotEmail" placeholder="example@mail.ru" autocomplete="email" />
            </label>
            <div class="auth-forgot-step auth-forgot-step-send">
              <p class="auth-step-label">Шаг 1. Код на email</p>
              <button type="button" class="ghost-btn auth-btn-loading" id="authForgotSendCode">
                <span class="auth-btn-label">Отправить код на email</span>
                <span class="auth-btn-spinner" hidden aria-hidden="true"></span>
              </button>
            </div>
            <p class="auth-error" id="authForgotError"></p>
            <p class="auth-info" id="authForgotInfo" hidden></p>
            <form id="authForgotVerifyForm" class="auth-forgot-step auth-forgot-step-verify" hidden novalidate>
              <p class="auth-step-label">Шаг 2. Проверка кода</p>
              <label>Код из письма
                <input type="text" id="authForgotCode" class="auth-code-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" />
              </label>
              <button type="submit" class="auth-submit auth-btn-loading" id="authForgotCheckCode">
                <span class="auth-btn-label">Проверить код</span>
                <span class="auth-btn-spinner" hidden aria-hidden="true"></span>
              </button>
            </form>
            <form id="authForgotPasswordForm" class="auth-forgot-step auth-forgot-step-password" hidden novalidate>
              <p class="auth-step-label">Шаг 3. Новый пароль</p>
              <p class="auth-forgot-hint auth-password-rules-hint" id="authForgotPasswordRulesHint">
                Поля откроются после проверки кода. Пароль только на латинице (A–Z, a–z): заглавная, строчная, цифра, спецсимвол (!@#$…), от 8 символов.
              </p>
              <label>Новый пароль
                <input type="password" id="authForgotNewPassword" minlength="8" maxlength="128" autocomplete="new-password" disabled />
              </label>
              <p class="auth-password-strength-line" id="authForgotPasswordStrengthLine" aria-live="polite"></p>
              <label>Повторите пароль
                <input type="password" id="authForgotNewPasswordConfirm" minlength="8" maxlength="128" autocomplete="new-password" disabled />
              </label>
              <button type="submit" class="auth-submit auth-btn-loading" id="authForgotSavePassword" disabled>
                <span class="auth-btn-label">Сохранить пароль</span>
                <span class="auth-btn-spinner" hidden aria-hidden="true"></span>
              </button>
            </form>
            <button type="button" class="auth-forgot-link" id="authForgotBack">← Вернуться ко входу</button>
          </div>
        </form>

        <form id="authRegisterForm" class="auth-form hidden" novalidate>
          <label>Имя
            <input type="text" id="authRegName" maxlength="40" placeholder="Ева" autocomplete="name" />
          </label>
          <label>Email
            <input type="email" id="authRegEmail" placeholder="example@mail.ru" autocomplete="email" />
          </label>
          <p class="auth-info auth-reg-field-hint" id="authRegEmailHint" hidden aria-live="polite"></p>
          <label>Телефон
            <input type="tel" id="authRegPhone" maxlength="18" placeholder="+7 (999) 123-45-67" autocomplete="tel" />
          </label>
          <p class="auth-info auth-reg-field-hint" id="authRegPhoneHint" hidden aria-live="polite"></p>
          <label>Пароль
            <span class="auth-password-wrap">
              <input type="password" id="authRegPassword" minlength="8" maxlength="128" placeholder="Латиница A–Z: заглавная, строчная, цифра, символ" autocomplete="new-password" />
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
          <p class="auth-info" id="authRegisterInfo" hidden></p>
          <button type="submit" class="auth-submit">Создать аккаунт</button>
        </form>
      </div>
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
  const authLoginInfo = document.getElementById('authLoginInfo');
  const authLoginFields = document.getElementById('authLoginFields');
  const authForgotToggle = document.getElementById('authForgotToggle');
  const authForgotPanel = document.getElementById('authForgotPanel');
  const authForgotEmail = document.getElementById('authForgotEmail');
  const authForgotError = document.getElementById('authForgotError');
  const authForgotInfo = document.getElementById('authForgotInfo');
  const authForgotSendCode = document.getElementById('authForgotSendCode');
  const authForgotVerifyForm = document.getElementById('authForgotVerifyForm');
  const authForgotCode = document.getElementById('authForgotCode');
  const authForgotPasswordForm = document.getElementById('authForgotPasswordForm');
  const authForgotNewPassword = document.getElementById('authForgotNewPassword');
  const authForgotNewPasswordConfirm = document.getElementById('authForgotNewPasswordConfirm');
  const authForgotBack = document.getElementById('authForgotBack');
  let forgotSendSeq = 0;
  let forgotCodeAccepted = '';

  const authRegName = document.getElementById('authRegName');
  const authRegEmail = document.getElementById('authRegEmail');
  const authRegEmailHint = document.getElementById('authRegEmailHint');
  const authRegPhoneHint = document.getElementById('authRegPhoneHint');
  const authRegPhone = document.getElementById('authRegPhone');
  const authRegPassword = document.getElementById('authRegPassword');
  const authRegPasswordConfirm = document.getElementById('authRegPasswordConfirm');
  const authRegisterError = document.getElementById('authRegisterError');
  const authRegisterInfo = document.getElementById('authRegisterInfo');
  const authPasswordStrength = document.getElementById('authPasswordStrength');
  const authPasswordStrengthLine = document.getElementById('authPasswordStrengthLine');
  const authPasswordStrengthMissing = document.getElementById('authPasswordStrengthMissing');
  const authRegSubmit = authRegisterForm.querySelector('.auth-submit');

  function wireBuiltInAuthPasswordToggles() {
    const pairs = [
      [document.getElementById('authLoginPasswordToggle'), authLoginPassword],
      [document.getElementById('authRegPasswordToggle'), authRegPassword],
      [document.getElementById('authRegPasswordConfirmToggle'), authRegPasswordConfirm],
    ];
    pairs.forEach(([btn, input]) => {
      if (!(btn instanceof HTMLButtonElement) || !(input instanceof HTMLInputElement)) return;
      if (btn.dataset.pwToggleWired === '1') return;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        btn.classList.toggle('is-visible', visible);
        btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
        btn.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
      });
      btn.dataset.pwToggleWired = '1';
      input.dataset.pwToggleWired = '1';
    });
  }

  function refreshAuthPasswordVisibility(scope) {
    if (window.EkvalinePasswordVisibility?.init) {
      window.EkvalinePasswordVisibility.init(scope || authModal || document);
    }
    wireBuiltInAuthPasswordToggles();
  }

  refreshAuthPasswordVisibility(authModal);

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

  function isPseudoClientEmail(value) {
    const e = String(value || '').trim().toLowerCase();
    return e.endsWith('@phone.ekvaline.local') || e.endsWith('@ekvaline.local');
  }

  const PASSWORD_MIN = 8;
  const PASSWORD_MAX = 128;
  const PASSWORD_ALLOWED_CHARS_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
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
          ? `Минимум ${PASSWORD_MIN} символов, только латиница (A–Z, a–z).`
          : `Не хватает символов: ещё ${need} до ${PASSWORD_MIN} (сейчас ${len}).`;
      return { level: 'weak', line, missing: [] };
    }
    if (!PASSWORD_ALLOWED_CHARS_RE.test(s)) {
      return {
        level: 'weak',
        line: 'Пароль: только латинские буквы (A–Z, a–z), цифры и спецсимволы (!@#$…).',
        missing: ['только латинские буквы'],
      };
    }
    const missing = [];
    if (!/[A-Z]/.test(s)) {
      missing.push('заглавную латинскую букву (A–Z)');
    }
    if (!/[a-z]/.test(s)) {
      missing.push('строчную латинскую букву (a–z)');
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

  function openAuthModal(tab) {
    window.EkvalineSiteNav?.close?.();
    switchAuthTab(tab);
    authModal.classList.add('open');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    refreshAuthPasswordVisibility(authModal);
  }

  function closeAuthModal() {
    closeForgotPasswordMode();
    authModal.classList.remove('open');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (!window.EkvalineSiteNav?.isOpen?.()) {
      document.documentElement.style.overflow = '';
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

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    authTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.authTab === tab));
    authLoginForm.classList.toggle('hidden', !isLogin);
    authRegisterForm.classList.toggle('hidden', isLogin);
    document.getElementById('authModalTitle').textContent = isLogin ? 'Вход в аккаунт' : 'Регистрация аккаунта';
    authLoginError.textContent = '';
    authRegisterError.textContent = '';
    if (authLoginInfo) {
      authLoginInfo.hidden = true;
      authLoginInfo.textContent = '';
    }
    if (authRegisterInfo) {
      authRegisterInfo.hidden = true;
      authRegisterInfo.textContent = '';
    }
    closeForgotPasswordMode();
    if (!isLogin) {
      syncRegisterPasswordStrength();
      resetRegistrationFieldHints();
    }
  }

  function normalizeAuthCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function setAuthButtonLoading(btn, loading) {
    if (!(btn instanceof HTMLButtonElement)) return;
    const spinner = btn.querySelector('.auth-btn-spinner');
    btn.classList.toggle('is-loading', !!loading);
    btn.disabled = !!loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (spinner instanceof HTMLElement) spinner.hidden = !loading;
  }

  async function runAuthButtonLoading(btn, task) {
    if (btn instanceof HTMLButtonElement && btn.disabled) return null;
    setAuthButtonLoading(btn, true);
    try {
      return await task();
    } finally {
      setAuthButtonLoading(btn, false);
    }
  }

  function validateAuthPasswordForSubmit(password) {
    const api = window.EkvalineAuthPassword;
    if (api?.validatePassword) return api.validatePassword(password);
    const p = String(password || '');
    if (p.length < 8) return { ok: false, error: 'Пароль: минимум 8 символов.' };
    return {
      ok: false,
      error: api?.PASSWORD_RULES_HINT || 'Пароль: только латиница (A–Z, a–z), заглавная, строчная, цифра и спецсимвол (!@#$…).',
    };
  }

  function setForgotPasswordFieldsEnabled(enabled) {
    if (authForgotNewPassword instanceof HTMLInputElement) authForgotNewPassword.disabled = !enabled;
    if (authForgotNewPasswordConfirm instanceof HTMLInputElement) {
      authForgotNewPasswordConfirm.disabled = !enabled;
    }
    const saveBtn = document.getElementById('authForgotSavePassword');
    const line = document.getElementById('authForgotPasswordStrengthLine');
    if (!enabled) {
      if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = true;
      if (line instanceof HTMLElement) line.textContent = '';
      return;
    }
    syncForgotPasswordSubmitState();
    refreshAuthPasswordVisibility(authForgotPasswordForm || authModal);
  }

  function syncForgotPasswordSubmitState() {
    const saveBtn = document.getElementById('authForgotSavePassword');
    const line = document.getElementById('authForgotPasswordStrengthLine');
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    if (!forgotCodeAccepted) {
      saveBtn.disabled = true;
      return;
    }
    const password = String(authForgotNewPassword?.value || '');
    const passwordConfirm = String(authForgotNewPasswordConfirm?.value || '');
    const st = window.EkvalineAuthPassword?.getPasswordStrength?.(password);
    if (line instanceof HTMLElement && st?.line) {
      line.textContent = st.line;
      line.className = `auth-password-strength-line is-${st.level || 'weak'}`;
    }
    const pwdCheck = validateAuthPasswordForSubmit(password);
    saveBtn.disabled = !pwdCheck.ok || password !== passwordConfirm;
  }

  function resetForgotPasswordFlow() {
    forgotCodeAccepted = '';
    forgotSendSeq = 0;
    if (authForgotVerifyForm instanceof HTMLElement) authForgotVerifyForm.hidden = true;
    if (authForgotPasswordForm instanceof HTMLElement) authForgotPasswordForm.hidden = true;
    if (authForgotCode instanceof HTMLInputElement) {
      authForgotCode.value = '';
      authForgotCode.readOnly = false;
    }
    if (authForgotPasswordForm instanceof HTMLFormElement) authForgotPasswordForm.reset();
    setForgotPasswordFieldsEnabled(false);
    const checkBtn = document.getElementById('authForgotCheckCode');
    if (checkBtn instanceof HTMLButtonElement) checkBtn.disabled = false;
  }

  function openForgotPasswordMode() {
    resetForgotPasswordFlow();
    if (authLoginFields instanceof HTMLElement) authLoginFields.hidden = true;
    if (authForgotPanel instanceof HTMLElement) authForgotPanel.hidden = false;
    if (authForgotError) authForgotError.textContent = '';
    if (authForgotInfo) {
      authForgotInfo.hidden = true;
      authForgotInfo.textContent = '';
    }
    const loginEmail = authLoginValue.value.trim().toLowerCase();
    if (authForgotEmail instanceof HTMLInputElement && loginEmail) {
      authForgotEmail.value = loginEmail;
    }
    document.getElementById('authModalTitle').textContent = 'Восстановление пароля';
    authTabs.forEach((btn) => {
      btn.disabled = true;
    });
  }

  function closeForgotPasswordMode() {
    if (authLoginFields instanceof HTMLElement) authLoginFields.hidden = false;
    if (authForgotPanel instanceof HTMLElement) authForgotPanel.hidden = true;
    if (authForgotError) authForgotError.textContent = '';
    if (authForgotInfo) {
      authForgotInfo.hidden = true;
      authForgotInfo.textContent = '';
    }
    resetForgotPasswordFlow();
    authTabs.forEach((btn) => {
      btn.disabled = false;
    });
    if (authLoginForm && !authLoginForm.classList.contains('hidden')) {
      document.getElementById('authModalTitle').textContent = 'Вход в аккаунт';
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
    if (typeof window.__ekvalineSyncCartGuestUi === 'function') window.__ekvalineSyncCartGuestUi();
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
    if (st === 409 && raw) return raw;
    if (st === 409) return 'Этот email или телефон уже зарегистрированы.';
    if (st === 403) return 'Сессия устарела. Обновите страницу и попробуйте снова.';
    return 'Сейчас регистрацию оформить не получилось. Попробуйте чуть позже или обновите страницу.';
  }

  let regEmailCheckSeq = 0;
  let regPhoneCheckSeq = 0;
  let regEmailAvailable = null;
  let regPhoneAvailable = null;
  function setRegFieldHint(el, text, tone) {
    if (!(el instanceof HTMLElement)) return;
    if (!text) {
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('is-ok', 'is-error');
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle('is-ok', tone === 'ok');
    el.classList.toggle('is-error', tone === 'error');
  }

  function resetRegistrationFieldHints() {
    regEmailAvailable = null;
    regPhoneAvailable = null;
    regEmailCheckSeq += 1;
    regPhoneCheckSeq += 1;
    setRegFieldHint(authRegEmailHint, '', '');
    setRegFieldHint(authRegPhoneHint, '', '');
  }

  async function checkRegistrationEmailAvailability(emailRaw) {
    const email = String(emailRaw || '').trim().toLowerCase();
    if (!email) {
      regEmailAvailable = null;
      setRegFieldHint(authRegEmailHint, '', '');
      return;
    }
    if (!isValidEmail(email)) {
      regEmailAvailable = null;
      setRegFieldHint(authRegEmailHint, 'Введите корректный email.', 'error');
      return;
    }
    if (isPseudoClientEmail(email)) {
      regEmailAvailable = false;
      setRegFieldHint(authRegEmailHint, 'Укажите ваш настоящий email — служебные адреса не принимаются.', 'error');
      return;
    }
    if (STAFF_RESERVED_EMAILS.has(email)) {
      regEmailAvailable = false;
      setRegFieldHint(authRegEmailHint, 'Этот email зарезервирован для служебного входа.', 'error');
      return;
    }
    const apiCli = window.EkvalineAPI;
    if (!apiCli?.json) return;
    const seq = ++regEmailCheckSeq;
    setRegFieldHint(authRegEmailHint, 'Проверяем email…', 'info');
    let r;
    try {
      r = await apiCli.json('/api/auth/check-registration', { method: 'POST', body: { email } });
    } catch {
      regEmailAvailable = null;
      setRegFieldHint(authRegEmailHint, 'Не удалось проверить email. Попробуйте ещё раз.', 'error');
      return;
    }
    if (seq !== regEmailCheckSeq) return;
    if (!r.ok) {
      regEmailAvailable = null;
      setRegFieldHint(authRegEmailHint, r.data?.error || 'Не удалось проверить email.', 'error');
      return;
    }
    const info = r.data?.email;
    if (!info) {
      regEmailAvailable = null;
      setRegFieldHint(authRegEmailHint, '', '');
      return;
    }
    regEmailAvailable = !!info.available;
    setRegFieldHint(
      authRegEmailHint,
      info.message || (info.available ? 'Email свободен.' : 'Этот email уже зарегистрирован.'),
      info.available ? 'ok' : 'error'
    );
  }

  async function checkRegistrationPhoneAvailability(phoneRaw) {
    const phone = normalizePhoneDigits(phoneRaw);
    if (!phone) {
      regPhoneAvailable = null;
      setRegFieldHint(authRegPhoneHint, '', '');
      return;
    }
    if (phone.length !== 11 || phone[0] !== '7') {
      regPhoneAvailable = null;
      setRegFieldHint(authRegPhoneHint, 'Введите телефон в формате +7 (999) 123-45-67.', 'error');
      return;
    }
    const apiCli = window.EkvalineAPI;
    if (!apiCli?.json) return;
    const seq = ++regPhoneCheckSeq;
    setRegFieldHint(authRegPhoneHint, 'Проверяем номер…', 'info');
    let r;
    try {
      r = await apiCli.json('/api/auth/check-registration', { method: 'POST', body: { phone } });
    } catch {
      regPhoneAvailable = null;
      setRegFieldHint(authRegPhoneHint, 'Не удалось проверить телефон.', 'error');
      return;
    }
    if (seq !== regPhoneCheckSeq) return;
    if (!r.ok) {
      regPhoneAvailable = null;
      setRegFieldHint(authRegPhoneHint, r.data?.error || 'Не удалось проверить телефон.', 'error');
      return;
    }
    const info = r.data?.phone;
    if (!info) {
      regPhoneAvailable = null;
      setRegFieldHint(authRegPhoneHint, '', '');
      return;
    }
    regPhoneAvailable = !!info.available;
    setRegFieldHint(
      authRegPhoneHint,
      info.message || (info.available ? 'Номер свободен.' : 'Этот телефон уже занят.'),
      info.available ? 'ok' : 'error'
    );
  }

  let regEmailCheckTimer = 0;
  let regPhoneCheckTimer = 0;

  function staffPageForRole(role) {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'admin.html';
    if (r === 'operator') return 'operator.html';
    if (r === 'manager') return 'manager.html';
    if (r === 'driver') return 'driver.html';
    return null;
  }

  function persistLoggedInUserFromApi(u) {
    const displayName =
      String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() || u.email || 'Пользователь';
    saveCurrentUser({
      id: u.id,
      name: displayName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      first_name: u.first_name,
      last_name: u.last_name,
      bonus_balance: u.bonus_balance,
      email_verified: u.email_verified,
    });
  }

  authLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authLoginError.textContent = '';
    if (authLoginInfo) {
      authLoginInfo.hidden = true;
      authLoginInfo.textContent = '';
    }

    const email = authLoginValue.value.trim().toLowerCase();
    const password = authLoginPassword.value;
    const byEmail = email;

    if (!email || !password) {
      authLoginError.textContent = 'Укажите email и пароль.';
      return;
    }
    if (!isValidEmail(email)) {
      authLoginError.textContent = 'Введите корректный email.';
      return;
    }

    const apiCli = window.EkvalineAPI;

    /** Сначала всегда сервер (пароль из БД — в т.ч. учётки, созданные админом). */
    if (apiCli?.json) {
      let rApi;
      try {
        rApi = await apiCli.json('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });
      } catch {
        rApi = null;
      }

      if (rApi) {
        if (rApi.ok && rApi.data?.user) {
          const u = rApi.data.user;
          apiCli.resetCsrf?.();
          persistLoggedInUserFromApi(u);
          updateHeaderAuth();
          closeAuthModal();
          const staffPage = staffPageForRole(u.role);
          if (staffPage) {
            window.location.href = staffPage;
            return;
          }
          window.EkvalineNotificationsSync?.refresh?.();
          window.setTimeout(() => openCabinet(), 50);
          return;
        }
        if (rApi.status === 401) {
          authLoginError.textContent = String(rApi.data?.error || 'Неверный email или пароль.');
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
        if (Number(rApi.status) > 0) {
          authLoginError.textContent = 'Не удалось войти. Попробуйте позже.';
          return;
        }
      }
    }

    if (STAFF_RESERVED_EMAILS.has(byEmail)) {
      authLoginError.textContent = 'Этот email зарезервирован для сотрудников. Используйте служебный вход.';
      return;
    }
    if (!apiCli?.json) {
      authLoginError.textContent = 'Сайт временно недоступен. Обновите страницу и попробуйте снова.';
      return;
    }
    authLoginError.textContent = 'Неверный email или пароль.';
  });

  if (authForgotToggle instanceof HTMLButtonElement) {
    authForgotToggle.addEventListener('click', () => {
      openForgotPasswordMode();
    });
  }

  if (authForgotBack instanceof HTMLButtonElement) {
    authForgotBack.addEventListener('click', () => {
      closeForgotPasswordMode();
    });
  }

  if (authForgotCode instanceof HTMLInputElement) {
    authForgotCode.addEventListener('input', () => {
      authForgotCode.value = normalizeAuthCode(authForgotCode.value);
    });
  }

  if (authForgotSendCode instanceof HTMLButtonElement) {
    authForgotSendCode.addEventListener('click', async () => {
      const apiCli = window.EkvalineAPI;
      if (!apiCli?.json) {
        if (authForgotError) authForgotError.textContent = 'Сервер недоступен.';
        return;
      }
      const email = String(authForgotEmail?.value || '').trim().toLowerCase();
      if (!isValidEmail(email)) {
        if (authForgotError) authForgotError.textContent = 'Введите корректный email.';
        return;
      }
      const seq = ++forgotSendSeq;
      await runAuthButtonLoading(authForgotSendCode, async () => {
        if (authForgotError) authForgotError.textContent = '';
        if (authForgotInfo) {
          authForgotInfo.hidden = true;
          authForgotInfo.textContent = '';
        }
        resetForgotPasswordFlow();
        forgotSendSeq = seq;
        const r = await apiCli.json('/api/auth/forgot-password', { method: 'POST', body: { email } });
        if (seq !== forgotSendSeq) return;
        if (!r.ok) {
          if (authForgotError) {
            authForgotError.textContent =
              r.data?.error ||
              (r.status === 404
                ? 'Аккаунт с таким email не найден.'
                : 'Не удалось отправить код.');
          }
          return;
        }
        apiCli.resetCsrf?.();
        if (authForgotInfo) {
          authForgotInfo.hidden = false;
          authForgotInfo.textContent =
            (r.data?.message || 'Код отправлен на email.') +
            ' Если нажимали повторно — введите код из последнего письма.';
        }
        if (authForgotVerifyForm instanceof HTMLElement) {
          authForgotVerifyForm.hidden = false;
          authForgotCode?.focus();
        }
      });
    });
  }

  if (authForgotVerifyForm instanceof HTMLFormElement) {
    authForgotVerifyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const apiCli = window.EkvalineAPI;
      if (!apiCli?.json) return;
      const email = String(authForgotEmail?.value || '').trim().toLowerCase();
      const code = normalizeAuthCode(authForgotCode?.value || '');
      if (!isValidEmail(email)) {
        if (authForgotError) authForgotError.textContent = 'Введите корректный email.';
        return;
      }
      if (code.length !== 6) {
        if (authForgotError) authForgotError.textContent = 'Введите 6-значный код.';
        return;
      }
      const checkBtn = document.getElementById('authForgotCheckCode');
      await runAuthButtonLoading(checkBtn, async () => {
        if (authForgotError) authForgotError.textContent = '';
        const r = await apiCli.json('/api/auth/verify-password-reset-code', {
          method: 'POST',
          body: { email, code },
        });
        if (!r.ok) {
          if (authForgotError) authForgotError.textContent = r.data?.error || 'Код не принят.';
          return;
        }
        apiCli.resetCsrf?.();
        forgotCodeAccepted = code;
        if (authForgotInfo) {
          authForgotInfo.hidden = false;
          authForgotInfo.textContent = r.data?.message || 'Код принят. Задайте новый пароль.';
        }
        if (authForgotCode instanceof HTMLInputElement) authForgotCode.readOnly = true;
        if (checkBtn instanceof HTMLButtonElement) checkBtn.disabled = true;
        if (authForgotPasswordForm instanceof HTMLElement) {
          authForgotPasswordForm.hidden = false;
          setForgotPasswordFieldsEnabled(true);
          authForgotNewPassword?.focus();
        }
      });
    });
  }

  if (authForgotNewPassword instanceof HTMLInputElement) {
    authForgotNewPassword.addEventListener('input', () => syncForgotPasswordSubmitState());
  }
  if (authForgotNewPasswordConfirm instanceof HTMLInputElement) {
    authForgotNewPasswordConfirm.addEventListener('input', () => syncForgotPasswordSubmitState());
  }

  if (authForgotPasswordForm instanceof HTMLFormElement) {
    authForgotPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const apiCli = window.EkvalineAPI;
      if (!apiCli?.json) return;
      if (!forgotCodeAccepted) {
        if (authForgotError) authForgotError.textContent = 'Сначала проверьте код из письма.';
        return;
      }
      const email = String(authForgotEmail?.value || '').trim().toLowerCase();
      const password = String(authForgotNewPassword?.value || '');
      const passwordConfirm = String(authForgotNewPasswordConfirm?.value || '');
      const pwdCheck = validateAuthPasswordForSubmit(password);
      if (!pwdCheck.ok) {
        if (authForgotError) authForgotError.textContent = pwdCheck.error;
        return;
      }
      if (password !== passwordConfirm) {
        if (authForgotError) authForgotError.textContent = 'Пароли не совпадают.';
        return;
      }
      const saveBtn = document.getElementById('authForgotSavePassword');
      await runAuthButtonLoading(saveBtn, async () => {
        if (authForgotError) authForgotError.textContent = '';
        const r = await apiCli.json('/api/auth/reset-password-by-email', {
          method: 'POST',
          body: { email, code: forgotCodeAccepted, password },
        });
        if (!r.ok) {
          if (authForgotError) authForgotError.textContent = r.data?.error || 'Не удалось сохранить пароль.';
          return;
        }
        apiCli.resetCsrf?.();
        if (authForgotInfo) {
          authForgotInfo.hidden = false;
          authForgotInfo.textContent = (r.data?.message || 'Пароль обновлён.') + ' Войдите с новым паролем.';
        }
        closeForgotPasswordMode();
        switchAuthTab('login');
        authLoginValue.value = email;
        authLoginPassword.value = '';
        authLoginPassword.focus();
      });
    });
  }

  async function submitForgotOrResend(endpoint, email, errEl, okEl) {
    const apiCli = window.EkvalineAPI;
    if (!apiCli?.json) {
      if (errEl) errEl.textContent = 'Восстановление доступно только при работающем сервере.';
      return;
    }
    if (errEl) errEl.textContent = '';
    if (okEl) {
      okEl.hidden = true;
      okEl.textContent = '';
    }
    if (!isValidEmail(email)) {
      if (errEl) errEl.textContent = 'Введите корректный email.';
      return;
    }
    let r;
    try {
      r = await apiCli.json(endpoint, { method: 'POST', body: { email } });
    } catch {
      if (errEl) errEl.textContent = 'Не удалось отправить запрос. Попробуйте позже.';
      return;
    }
    if (r.ok) {
      if (okEl) {
        okEl.hidden = false;
        okEl.textContent = r.data?.message || 'Если аккаунт найден, код отправлен на email.';
      }
      return;
    }
    if (errEl) errEl.textContent = r.data?.error || 'Не удалось отправить письмо.';
  }

  if (authRegEmail instanceof HTMLInputElement) {
    authRegEmail.addEventListener('input', () => {
      regEmailAvailable = null;
      window.clearTimeout(regEmailCheckTimer);
      regEmailCheckTimer = window.setTimeout(() => {
        void checkRegistrationEmailAvailability(authRegEmail.value);
      }, 450);
    });
    authRegEmail.addEventListener('blur', () => {
      window.clearTimeout(regEmailCheckTimer);
      void checkRegistrationEmailAvailability(authRegEmail.value);
    });
  }

  if (authRegPhone instanceof HTMLInputElement) {
    authRegPhone.addEventListener('input', () => {
      regPhoneAvailable = null;
      window.clearTimeout(regPhoneCheckTimer);
      regPhoneCheckTimer = window.setTimeout(() => {
        void checkRegistrationPhoneAvailability(authRegPhone.value);
      }, 450);
    });
    authRegPhone.addEventListener('blur', () => {
      window.clearTimeout(regPhoneCheckTimer);
      void checkRegistrationPhoneAvailability(authRegPhone.value);
    });
  }

  authRegisterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authRegisterError.textContent = '';
    if (authRegisterInfo) {
      authRegisterInfo.hidden = true;
      authRegisterInfo.textContent = '';
    }

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
    if (isPseudoClientEmail(email)) {
      authRegisterError.textContent = 'Укажите ваш настоящий email — служебные адреса не принимаются.';
      return;
    }
    if (STAFF_RESERVED_EMAILS.has(email)) {
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
        'Пароль: 8–128 символов, только латиница (A–Z, a–z): заглавная, строчная, цифра и спецсимвол (!@#$…).';
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

    const apiReg = window.EkvalineAPI;
    if (apiReg?.json) {
      await checkRegistrationEmailAvailability(email);
      if (regEmailAvailable !== true) {
        authRegisterError.textContent =
          regEmailAvailable === false
            ? authRegEmailHint?.textContent ||
              'Этот email уже зарегистрирован. Войдите в аккаунт или восстановите пароль.'
            : 'Дождитесь проверки email или исправьте адрес.';
        authRegEmail?.focus?.();
        return;
      }
      await checkRegistrationPhoneAvailability(phone);
      if (regPhoneAvailable !== true) {
        authRegisterError.textContent =
          regPhoneAvailable === false
            ? authRegPhoneHint?.textContent || 'Этот телефон уже привязан к другому аккаунту.'
            : 'Дождитесь проверки телефона или исправьте номер.';
        authRegPhone?.focus?.();
        return;
      }

    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    const first_name = nameParts[0] || name;
    const last_name = nameParts.slice(1).join(' ');
    if (apiReg?.json) {
      let rReg;
      try {
        const regBody = { first_name, last_name: last_name || '', email, phone, password };
        rReg = await apiReg.json('/api/auth/register', {
          method: 'POST',
          body: regBody,
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
        persistLoggedInUserFromApi(u);
        const registeredAt = u.created_at || new Date().toISOString();
        window.EkvalineApp?.stampRegistrationWelcomeNotifications?.(registeredAt);
        window.EkvalineNotificationsSync?.refresh?.();
        updateHeaderAuth();
        closeAuthModal();
        if (authRegisterInfo) {
          authRegisterInfo.hidden = false;
          authRegisterInfo.textContent = rReg.data.message || 'Регистрация успешна.';
        }
        window.setTimeout(() => {
          window.location.href = 'catalog.html';
        }, 400);
        return;
      }
      authRegisterError.textContent = registerSubmitErrorFromApi(rReg.status, rReg.data);
      if (Number(rReg.status) === 409) {
        const field = String(rReg.data?.field || '').toLowerCase();
        const msg = registerSubmitErrorFromApi(rReg.status, rReg.data);
        if (field === 'email') {
          regEmailAvailable = false;
          setRegFieldHint(authRegEmailHint, msg, 'error');
        } else if (field === 'phone') {
          regPhoneAvailable = false;
          setRegFieldHint(authRegPhoneHint, msg, 'error');
        }
      }
      return;
    }

    authRegisterError.textContent = 'Регистрация временно недоступна. Обновите страницу и попробуйте снова.';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (authModal.classList.contains('open')) closeAuthModal();
  });

  updateHeaderAuth();

  function openLoginFromQuery(reason) {
    openAuthModal('login');
    if (authLoginInfo) {
      authLoginInfo.hidden = false;
      authLoginInfo.textContent =
        reason === 'session-expired'
          ? 'Сессия завершена из‑за бездействия. Войдите снова.'
          : 'Войдите в аккаунт, чтобы продолжить.';
    }
    if (typeof history.replaceState === 'function') {
      history.replaceState({}, '', window.location.pathname || '/');
    }
  }

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('need-login') === '1') openLoginFromQuery('need-login');
    if (q.get('session-expired') === '1') openLoginFromQuery('session-expired');
  } catch {
    /* ignore */
  }

  window.addEventListener('ekvaline:session-expired', () => {
    openLoginFromQuery('session-expired');
  });
})();

/* ── Cart + checkout (через API сервера) ── */
(function initCartAndCheckout() {
  const CART_KEY = 'ekvaline_cart_items';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const ADDRESSES_KEY = 'ekvaline_addresses_by_user';
  const BONUSES_KEY = 'ekvaline_bonuses_by_user';
  const WATER_MAX_QTY = 50;
  const CHECKOUT_ADDRESS_MAX = 220;
  const CHECKOUT_COMMENT_MAX = 500;
  const MAP_DEFAULT_CENTER = [51.768199, 55.096955];
  const MAP_DEFAULT_ZOOM = 12;
  const DEFAULT_CITY = 'Оренбург';
  const ORENBURG_VIEWBOX = '54.95,51.95,55.55,51.55';
  const ORENBURG_BBOX = (() => {
    const [minLon, maxLat, maxLon, minLat] = ORENBURG_VIEWBOX.split(',').map(Number);
    return { minLon, maxLat, maxLon, minLat };
  })();
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
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      showAppToast('Не удалось сохранить корзину. Разрешите хранилище в браузере.', 'error');
    }
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
    return /вода\s*18\.?9\s*л/i.test(String(title || ''));
  }

  function isWaterCartItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (item.water === true) return true;
    if (isWaterProduct(item.title)) return true;
    return String(item.id || '')
      .toLowerCase()
      .includes('water');
  }

  /** В БД вода — «ЭкваЛайн 19 л», в корзине — «Вода 18.9л». */
  function findWaterProductId(products) {
    if (!Array.isArray(products) || !products.length) return null;
    let bestId = null;
    let bestScore = 0;
    products.forEach((p) => {
      const name = String(p.name || '').toLowerCase();
      const cat = String(p.category_name || '').toLowerCase();
      const vol = Number(p.volume_liters);
      let score = 0;
      if (/вода/.test(cat)) score += 2;
      if (/вода|эквалайн|ekva/i.test(name)) score += 2;
      if (/18\.?9|19\s*л/.test(name)) score += 3;
      if (Number.isFinite(vol) && vol >= 18 && vol <= 20) score += 5;
      const id = Number(p.id);
      if (score > bestScore && Number.isFinite(id) && id > 0) {
        bestScore = score;
        bestId = id;
      }
    });
    if (bestId) return bestId;
    const fallback = products.find((p) => /вода/i.test(String(p.name || '')));
    return fallback && Number.isFinite(Number(fallback.id)) ? Number(fallback.id) : null;
  }

  function catalogTitleKey(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+smart\b/g, '')
      .replace(/[^a-z\u0430-\u044f\u04510-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findCatalogProductId(item, products) {
    if (!item || !Array.isArray(products) || !products.length) return null;
    const pid = Number(item.productId);
    if (Number.isFinite(pid) && pid > 0 && products.some((p) => Number(p.id) === pid)) return pid;
    if (isWaterCartItem(item)) {
      const waterId = findWaterProductId(products);
      if (waterId) return waterId;
    }
    const title = String(item.title || '').trim().toLowerCase();
    const exact = products.find((p) => String(p.name || '').trim().toLowerCase() === title);
    if (exact) return Number(exact.id);

    const key = catalogTitleKey(item.title);
    if (key) {
      let bestId = null;
      let bestScore = 0;
      products.forEach((p) => {
        const n = catalogTitleKey(p.name);
        if (!n) return;
        if (n === key) {
          bestId = Number(p.id);
          bestScore = 1000;
          return;
        }
        if (n.includes(key) || key.includes(n)) {
          const score = Math.min(n.length, key.length);
          if (score > bestScore && Number.isFinite(Number(p.id))) {
            bestScore = score;
            bestId = Number(p.id);
          }
        }
      });
      if (bestId) return bestId;
    }

    const aliasPairs = [
      [/пуст.*тар|(^|\s)тара(\s|$)|empty/i, /пуст|тара/i],
      [/механ.*помп|помп.*механ/i, /механ.*помп|помп.*механ/i],
      [/электр.*помп|помп.*электр/i, /электр.*помп|помп.*электр/i],
      [/стакан|одноразов/i, /стакан|одноразов/i],
      [/vatten|кулер.*ниж/i, /vatten|l\s*45/i],
      [/ael|кулер.*верх|lk-ael/i, /ael|lk-ael|напольн/i],
    ];
    for (const [titleRe, nameRe] of aliasPairs) {
      if (!titleRe.test(String(item.title || ''))) continue;
      const hit = products.find((p) => nameRe.test(String(p.name || '')));
      if (hit) return Number(hit.id);
    }
    return null;
  }

  async function fetchCatalogProducts() {
    try {
      const api = window.EkvalineAPI;
      if (api && typeof api.json === 'function') {
        const pr = await api.json('/api/products');
        if (pr.ok && Array.isArray(pr.data?.products) && pr.data.products.length) return pr.data.products;
      }
    } catch {
      /* fallback fetch */
    }
    try {
      const r = await fetch(`/api/products?_=${Date.now()}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.products)) return data.products;
      }
    } catch {
      /* noop */
    }
    return [];
  }

  async function hydrateCatalogProductIds() {
    const products = await fetchCatalogProducts();
    if (!products.length) return;
    document.querySelectorAll('.full-catalog-card').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      const title = card.querySelector('h3')?.textContent?.trim() || '';
      if (!title) return;
      const pid = findCatalogProductId({ title, water: isWaterProduct(title) }, products);
      if (pid) card.setAttribute('data-product-id', String(pid));
    });
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
    const preorder =
      card.getAttribute('data-preorder') === '1' || hasPreorderMark(card) || /уточнять/i.test(priceText);
    const water = isWaterProduct(title);
    const productId = card.getAttribute('data-product-id');
    const priceAttr = card.getAttribute('data-price');
    const id = productId
      ? `product_${productId}`
      : water
        ? 'water_18_9'
        : title.toLowerCase().replace(/\s+/g, '_');
    let price = preorder ? 0 : parsePrice(priceText);
    if (!preorder && priceAttr != null && priceAttr !== '') {
      const n = Number(priceAttr);
      if (Number.isFinite(n)) price = n;
    }
    return { id, title, price, qty: 1, water, preorder, productId: productId ? Number(productId) : undefined };
  }

  function persistClientUserFromApi(u) {
    const displayName =
      String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() ||
      u.email ||
      'Пользователь';
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({
        id: u.id,
        name: displayName,
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'client',
        first_name: u.first_name,
        last_name: u.last_name,
        bonus_balance: u.bonus_balance,
        email_verified: u.email_verified,
      }),
    );
    if (typeof window.__ekvalineUpdateHeaderAuth === 'function') {
      window.__ekvalineUpdateHeaderAuth();
    }
  }

  function isCheckoutClientUser(user) {
    if (!user || typeof user !== 'object') return false;
    return String(user.role || 'client').toLowerCase() === 'client';
  }

  /** Синхронизация localStorage с cookie-сессией сервера (важно на VPS после HTTPS/перезапуска). */
  async function syncClientAuthFromServer() {
    const api = window.EkvalineAPI;
    if (!api?.json) {
      return { ok: false, reason: readCurrentUser() ? 'no_api' : 'guest' };
    }
    try {
      const me = await api.json('/api/auth/me');
      if (me.ok && me.data?.user) {
        const role = String(me.data.user.role || 'client').toLowerCase();
        if (['admin', 'operator', 'manager', 'driver'].includes(role)) {
          if (readCurrentUser()) {
            localStorage.removeItem(CURRENT_USER_KEY);
            if (typeof window.__ekvalineUpdateHeaderAuth === 'function') window.__ekvalineUpdateHeaderAuth();
          }
          return { ok: false, reason: 'staff' };
        }
        persistClientUserFromApi(me.data.user);
        return { ok: true, user: me.data.user };
      }
      if (readCurrentUser()) {
        localStorage.removeItem(CURRENT_USER_KEY);
        if (typeof window.__ekvalineUpdateHeaderAuth === 'function') window.__ekvalineUpdateHeaderAuth();
      }
      return { ok: false, reason: me.data?.sessionExpired ? 'expired' : 'guest' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }

  async function restoreClientSessionFromApi() {
    if (readCurrentUser()) return;
    await syncClientAuthFromServer();
  }

  function promptCheckoutLogin(message, options = {}) {
    const msg = message || 'Для оформления заказа войдите или зарегистрируйтесь.';
    showAppToast(msg, 'info');
    if (options.openModal !== true) return;
    const loginBtn = document.querySelector('[data-auth-login]');
    if (loginBtn instanceof HTMLElement) loginBtn.click();
  }

  async function ensureServerSessionForCheckout() {
    const session = await syncClientAuthFromServer();
    if (session.ok || session.reason === 'guest') return true;
    if (session.reason === 'no_api') {
      showAppToast('Оформление заказа временно недоступно. Обновите страницу.', 'error');
      return false;
    }
    if (session.reason === 'expired') {
      setCartError('Сессия истекла — войдите снова, чтобы оформить заказ.');
      promptCheckoutLogin('Сессия истекла — войдите снова, чтобы оформить заказ.', { openModal: true });
      return false;
    }
    if (session.reason === 'network') {
      showAppToast('Нет связи с сервером. Проверьте интернет и обновите страницу.', 'error');
      return false;
    }
    if (session.reason === 'staff') {
      showAppToast(
        'Оформление заказа доступно только клиентам. Выйдите из панели оператора или откройте каталог в другом браузере.',
        'error'
      );
      return false;
    }
    showAppToast('Не удалось проверить вход. Обновите страницу и войдите в аккаунт клиента.', 'error');
    return false;
  }

  function addCatalogItemToCart(card) {
    if (!(card instanceof HTMLElement)) return false;
    const nextItem = buildCartItemFromCard(card);
    if (!nextItem) return false;
    const items = readCart();
    const idx = items.findIndex((item) => item.id === nextItem.id);
    if (idx >= 0) {
      if (items[idx].water && items[idx].qty >= WATER_MAX_QTY) {
        setCartError('Больше 50 бутылей, договорная цена.');
        showAppToast('Больше 50 бутылей — договорная цена. Свяжитесь с оператором.', 'error');
        return false;
      }
      items[idx].qty += 1;
    } else {
      items.push(nextItem);
    }
    setCartError('');
    saveCart(items);
    updateCartBadge();
    animateAddToCart(card);
    showAppToast(`«${nextItem.title}» добавлено в корзину`, 'success');
    return true;
  }

  function requireClientLoginForCheckout(message) {
    const user = readCurrentUser();
    if (isCheckoutClientUser(user)) return true;
    const msg = message || 'Для оформления заказа войдите или зарегистрируйтесь.';
    setCartError(msg);
    promptCheckoutLogin(msg, { openModal: true });
    syncCartGuestUi();
    return false;
  }

  function syncCartGuestUi() {
    const loggedIn = isCheckoutClientUser(readCurrentUser());
    const guestHint = document.querySelector('.cart-guest-hint');
    if (guestHint instanceof HTMLElement) guestHint.hidden = loggedIn;
    const checkoutBtn = document.getElementById('openCheckoutBtn');
    if (checkoutBtn instanceof HTMLButtonElement) {
      checkoutBtn.disabled = !loggedIn;
      checkoutBtn.textContent = loggedIn ? 'Оформить заказ' : 'Оформить заказ (нужен вход)';
      checkoutBtn.title = loggedIn ? '' : 'Войдите или зарегистрируйтесь, чтобы оформить заказ';
    }
  }

  function bindCatalogAddButtons() {
    document.querySelectorAll('.catalog-add-btn').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const newBtn = button.cloneNode(true);
      button.replaceWith(newBtn);
      newBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = newBtn.closest('.full-catalog-card, .catalog-card');
        if (card instanceof HTMLElement) addCatalogItemToCart(card);
      });
    });
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
  const isCabinetPage = document.body.classList.contains('cabinet-page-full');
  if (!isCatalogPage && !isCabinetPage) return;

  function buildMapPickerModalHtml() {
    return `
    <div class="cart-modal" id="mapPickerModal" aria-hidden="true">
      <div class="cart-modal-overlay" data-map-close="true"></div>
      <div class="cart-modal-card map-picker-card" role="dialog" aria-modal="true" aria-labelledby="mapPickerTitle">
        <header class="map-picker-head">
          <div class="map-picker-head-text">
            <h3 id="mapPickerTitle">Выбор адреса на карте</h3>
            <p class="checkout-subtitle">Заполните поля или отметьте дом на карте. Доставка только по Оренбургу.</p>
          </div>
          <button type="button" class="cart-modal-close map-picker-close" data-map-close="true" aria-label="Закрыть">×</button>
        </header>
        <div class="map-picker-map-zone">
          <div id="checkoutMapRoot" class="checkout-map-root" aria-label="Карта выбора адреса"></div>
        </div>
        <div class="map-picker-fields-zone">
          <aside class="checkout-map-panel">
            <div class="checkout-map-panel-fields">
            <label class="checkout-field checkout-map-field">Город
              <input type="text" id="mapCityInput" maxlength="60" value="Оренбург" placeholder="Оренбург" readonly aria-readonly="true" autocomplete="off" />
            </label>
            <label class="checkout-field checkout-map-field">Улица
              <div class="address-suggest-wrap">
                <input type="text" id="mapStreetInput" maxlength="80" placeholder="Например: Салмышская" autocomplete="off" />
                <button type="button" id="clearMapStreetBtn" class="address-input-clear" aria-label="Очистить улицу" title="Очистить">×</button>
                <div id="mapStreetDropdown" class="address-suggest-dropdown" hidden></div>
              </div>
            </label>
            <label class="checkout-field checkout-map-field">Дом
              <input type="text" id="mapHouseInput" maxlength="20" placeholder="Например: 12" />
            </label>
            <label class="checkout-field checkout-map-field">Квартира
              <input type="text" id="mapApartmentInput" maxlength="10" placeholder="Например: 45" />
            </label>
            <div class="checkout-map-inline-fields">
              <label class="checkout-field checkout-map-field">Этаж
                <input type="text" id="mapFloorInput" maxlength="10" placeholder="-" />
              </label>
              <label class="checkout-field checkout-map-field">Подъезд
                <input type="text" id="mapEntranceInput" maxlength="10" placeholder="-" />
              </label>
            </div>
            <p id="mapApartmentRequirementsHint" class="checkout-map-validation-hint" hidden>
              Если указана квартира, обязательно заполните этаж и подъезд.
            </p>
            <datalist id="mapCitySuggestions"></datalist>
            </div>
          </aside>
        </div>
        <div class="map-picker-actions-bar">
          <p id="checkoutMapAddress" class="checkout-map-address">Заполните: город, улица, дом.</p>
          <div class="map-picker-actions-row">
            <button type="button" class="checkout-map-action-btn checkout-map-action-btn-primary" id="applyMapAddressBtn">Выбрать</button>
            <button type="button" class="checkout-map-action-btn checkout-map-action-btn-ghost" id="resetMapPickerBtn">Сброс</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function ensureMapPickerModal() {
    const existing = document.getElementById('mapPickerModal');
    const stale = existing && !existing.querySelector('.map-picker-map-zone');
    if (stale) {
      existing.remove();
    }
    if (!document.getElementById('mapPickerModal')) {
      document.body.insertAdjacentHTML('beforeend', buildMapPickerModalHtml());
    }
  }

  ensureMapPickerModal();

  if (isCatalogPage && document.getElementById('mapPickerModal')) {
    /* catalog inserts its own modals below */
  } else if (isCabinetPage) {
    ensureMapPickerModal();
  }

  let cartBtn = null;

  if (isCatalogPage) {
  void hydrateCatalogProductIds();
  const existingCartBtn = document.querySelector('.cart-floating-btn.cart-trigger-btn');
  if (existingCartBtn instanceof HTMLElement) {
    cartBtn = existingCartBtn;
  } else {
    cartBtn = document.createElement('button');
    cartBtn.type = 'button';
    cartBtn.className = 'cart-floating-btn cart-trigger-btn';
    cartBtn.textContent = 'Корзина (0)';
    document.body.classList.add('has-floating-cart');
    document.body.appendChild(cartBtn);
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="cart-modal" id="cartModal" aria-hidden="true">
      <div class="cart-modal-overlay" data-cart-close="true"></div>
      <div class="cart-modal-card" role="dialog" aria-modal="true" aria-labelledby="cartModalTitle">
        <button type="button" class="cart-modal-close" data-cart-close="true">×</button>
        <h3 id="cartModalTitle">Корзина</h3>
        <p class="cart-guest-hint">Товары можно добавлять без входа. Оформление заказа доступно после входа или регистрации.</p>
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
          <div id="checkoutSavedAddressesWrap" class="checkout-saved-addresses-wrap" hidden>
            <p class="checkout-saved-addresses-title">Сохранённые адреса из личного кабинета</p>
            <div id="checkoutSavedAddressesList" class="checkout-saved-addresses-list" role="listbox" aria-label="Сохранённые адреса"></div>
          </div>
          <label class="checkout-field">Адрес доставки
            <input type="text" id="checkoutAddressInput" name="address" maxlength="${CHECKOUT_ADDRESS_MAX}" required placeholder="Сначала выберите адрес на карте" readonly />
            <button type="button" class="checkout-map-btn" id="openMapPickerBtn">Выбрать на карте</button>
          </label>
          <div class="checkout-field checkout-field-dates">
            <span class="checkout-field-label" id="checkoutDeliveryDateLabel">Дата доставки</span>
            <input type="hidden" id="checkoutDeliveryDate" name="deliveryDate" required aria-labelledby="checkoutDeliveryDateLabel" />
            <div id="checkoutDeliveryDatePicker" class="checkout-delivery-date-picker" role="group" aria-labelledby="checkoutDeliveryDateLabel"></div>
            <span class="checkout-field-hint" id="checkoutDeliveryDateHint">Заказы принимаются на следующий день. Доставка с завтрашнего дня (сегодня выбрать нельзя).</span>
          </div>
          <label class="checkout-field">Интервал доставки
            <select id="checkoutDeliverySlot" name="deliverySlot" required></select>
          </label>
          <label class="checkout-field">Комментарий к заказу
            <textarea id="checkoutCommentField" name="comment" maxlength="${CHECKOUT_COMMENT_MAX}" placeholder="Например: позвонить за 30 минут"></textarea>
            <span class="checkout-field-hint" id="checkoutCommentCounter">0/${CHECKOUT_COMMENT_MAX}</span>
          </label>
          <label class="checkout-field">Списать бонусы
            <input type="number" id="checkoutBonusSpend" name="bonusSpend" min="0" step="1" value="0" inputmode="numeric" />
          </label>
          <p class="checkout-meta" id="checkoutMetaText"></p>
          <button type="submit" class="auth-submit">Подтвердить заказ</button>
        </form>
      </div>
    </div>

    ${buildMapPickerModalHtml()}
    <div id="orderSuccessModal" class="order-success-modal" aria-hidden="true">
      <div class="order-success-backdrop" data-order-success-close="true"></div>
      <div class="order-success-card" role="dialog" aria-modal="true" aria-labelledby="orderSuccessTitle">
        <button type="button" class="order-success-close" data-order-success-close="true" aria-label="Закрыть">×</button>
        <p class="order-success-kicker">Заказ оформлен</p>
        <h3 id="orderSuccessTitle">Заявка принята</h3>
        <dl class="order-success-details" id="orderSuccessDetails"></dl>
        <p class="order-success-note" id="orderSuccessNote"></p>
        <div class="order-success-actions">
          <button
            type="button"
            class="order-success-btn"
            id="orderSuccessContinueBtn"
            data-order-success-close="true"
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  `
  );

    bindCatalogAddButtons();
    if (cartBtn.dataset.cartTriggerBound !== '1') {
      cartBtn.dataset.cartTriggerBound = '1';
      cartBtn.addEventListener('click', openCartModal);
    }
    syncCartGuestUi();
    updateCartBadge();
    saveCart(readCart());
    void syncClientAuthFromServer().then(() => {
      syncCartGuestUi();
      updateCartBadge();
    });
  }

  let cartUiReady = isCatalogPage && cartBtn instanceof HTMLElement;
  let mapPickerOnApply = null;
  let mapPickerMaxLength = CHECKOUT_ADDRESS_MAX;
  let pickedAddress = '';

  const cartModal = isCatalogPage ? document.getElementById('cartModal') : null;
  const checkoutModal = isCatalogPage ? document.getElementById('checkoutModal') : null;
  const cartItemsList = isCatalogPage ? document.getElementById('cartItemsList') : null;
  const cartTotalPrice = isCatalogPage ? document.getElementById('cartTotalPrice') : null;
  const cartErrorText = isCatalogPage ? document.getElementById('cartErrorText') : null;
  const openCheckoutBtn = isCatalogPage ? document.getElementById('openCheckoutBtn') : null;
  const checkoutForm = isCatalogPage ? document.getElementById('checkoutForm') : null;
  const checkoutAddressInput = isCatalogPage ? document.getElementById('checkoutAddressInput') : null;
  const checkoutSavedAddressesWrap = isCatalogPage ? document.getElementById('checkoutSavedAddressesWrap') : null;
  const checkoutSavedAddressesList = isCatalogPage ? document.getElementById('checkoutSavedAddressesList') : null;
  const openMapPickerBtn = isCatalogPage ? document.getElementById('openMapPickerBtn') : null;
  const checkoutDeliveryDate = document.getElementById('checkoutDeliveryDate');
  const checkoutDeliverySlot = document.getElementById('checkoutDeliverySlot');
  const checkoutMetaText = document.getElementById('checkoutMetaText');
  const checkoutCommentField = document.getElementById('checkoutCommentField');
  const checkoutCommentCounter = document.getElementById('checkoutCommentCounter');
  const mapPickerModal = document.getElementById('mapPickerModal');
  const checkoutMapRoot = document.getElementById('checkoutMapRoot');
  const checkoutMapAddress = document.getElementById('checkoutMapAddress');
  const applyMapAddressBtn = document.getElementById('applyMapAddressBtn');
  const resetMapPickerBtn = document.getElementById('resetMapPickerBtn');
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

  function formatOrderSlotLabel(raw) {
    const s = String(raw || '')
      .trim()
      .replace(/\u2013|\u2014|\u2212/g, '-');
    const m = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(s);
    if (m) return `${m[1]}–${m[2]}`;
    return s || '—';
  }

  function hideOrderSuccessModal() {
    const modal = document.getElementById('orderSuccessModal');
    if (!(modal instanceof HTMLElement)) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function parseOrderItemsJson(raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.lines)) return parsed.lines;
    } catch {
      /* ignore */
    }
    return [];
  }

  function computeOrderSuccessPayable(order) {
    const items = parseOrderItemsJson(order?.items_json);
    if (!items.length) return Math.max(0, Math.round(Number(order?.total_sum) || 0));
    const gross = items.reduce((sum, item) => {
      const qty = Math.max(1, Math.floor(Number(item?.qty) || 0));
      const unitStored = Math.round(Number(item?.unit_price ?? item?.price) || 0);
      const unit = isWaterCartItem(item) || isWaterProduct(item?.title) ? getWaterUnitPrice(qty) : unitStored;
      return sum + unit * qty;
    }, 0);
    const bonuses = Math.max(0, Math.floor(Number(order?.bonuses_used) || 0));
    return Math.max(0, gross - bonuses);
  }

  function formatClientOrderId(rawId) {
    const fn = window.EkvalineOrderDisplay?.displayOrderId;
    if (typeof fn === 'function') return fn(rawId);
    const n = Number(rawId);
    return Number.isFinite(n) && n > 0 ? `ЛС-${String(Math.trunc(n)).padStart(6, '0')}` : '—';
  }

  function showOrderSuccessModal(order, extras) {
    const modal = document.getElementById('orderSuccessModal');
    const details = document.getElementById('orderSuccessDetails');
    const note = document.getElementById('orderSuccessNote');
    const title = document.getElementById('orderSuccessTitle');
    if (!(modal instanceof HTMLElement) || !(details instanceof HTMLElement)) return;

    const orderLabel = formatClientOrderId(order?.id);
    const dateRu = order?.delivery_date
      ? String(order.delivery_date).split('-').reverse().join('.')
      : '—';
    const slot = formatOrderSlotLabel(order?.delivery_slot);
    const total = computeOrderSuccessPayable(order);
    const bonusEarned = Number(extras?.bonusEarned ?? order?.bonuses_earned ?? 0);

    if (title instanceof HTMLElement) {
      title.textContent = `Заявка ${orderLabel}`;
    }
    details.innerHTML = `
      <div><dt>Номер заявки</dt><dd>${orderLabel}</dd></div>
      <div><dt>Дата доставки</dt><dd>${dateRu}</dd></div>
      <div><dt>Интервал</dt><dd>${slot}</dd></div>
      <div><dt>Итого к оплате</dt><dd><strong>${total} ₽</strong></dd></div>
    `;
    if (note instanceof HTMLElement) {
      note.textContent = `Статус «В обработке» — оператор подтвердит доставку. Начислено бонусов: ${bonusEarned}. Следите за статусом в уведомлениях на сайте.`;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function showAppToast(message, variant = 'success') {
    const msg = String(message || '').trim();
    if (!msg) return;
    if (!(appToast instanceof HTMLElement) || !(appToastText instanceof HTMLElement)) {
      window.alert(msg);
      return;
    }
    appToastText.textContent = msg;
    const v = variant === 'error' ? 'error' : variant === 'info' ? 'info' : 'success';
    appToast.dataset.variant = v;
    if (appToast.parentElement !== document.body) document.body.appendChild(appToast);
    appToast.hidden = false;
    appToast.classList.remove('is-visible');
    window.requestAnimationFrame(() => appToast.classList.add('is-visible'));
    if (appToastTimer) window.clearTimeout(appToastTimer);
    appToastTimer = window.setTimeout(() => {
      appToast.classList.remove('is-visible');
      appToast.hidden = true;
    }, v === 'error' ? 5200 : 4200);
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

  function earliestDeliveryIsoDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function deliveryDateAllowed(iso) {
    const d = String(iso || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= earliestDeliveryIsoDate();
  }

  const CHECKOUT_SLOT_DEFS = [
    { key: '09:00-14:00', label: '09:00–14:00' },
    { key: '14:00-17:00', label: '14:00–17:00' },
    { key: '17:00-21:00', label: '17:00–21:00' },
    { key: '09:00-17:00', label: 'Для организаций: 09:00–17:00' },
  ];

  let checkoutAvailability = { closedDays: [], closedSlots: [] };
  let checkoutAvailPollTimer = null;
  const CHECKOUT_AVAIL_POLL_MS = 20000;
  const PUBLIC_DATA_POLL_MS = 45000;
  const CHECKOUT_BOOKING_DAYS = 30;
  const CHECKOUT_DELIVERY_HINT_DEFAULT =
    'Заказы принимаются на следующий день. Доставка с завтрашнего дня (сегодня выбрать нельзя). Серые даты и интервалы закрыты оператором.';

  function parseCheckoutAvailabilityPayload(data) {
    const root =
      data && typeof data === 'object' && data.availability && typeof data.availability === 'object'
        ? data.availability
        : data;
    if (!root || typeof root !== 'object') {
      return { closedDays: [], closedSlots: [] };
    }
    const closedDays = Array.isArray(root.closedDays)
      ? root.closedDays.map((d) => String(d).trim()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];
    const closedSlots = Array.isArray(root.closedSlots)
      ? root.closedSlots
          .map((r) => ({
            date: String(r?.date ?? r?.delivery_date ?? '').trim(),
            slot: normalizeCheckoutSlotKey(r?.slot ?? r?.delivery_slot),
          }))
          .filter((r) => r.date && r.slot)
      : [];
    return pruneCheckoutAvailability({ closedDays, closedSlots });
  }

  /** Оставляем только закрытия в окне бронирования (как на сервере /api/public/delivery-availability). */
  function pruneCheckoutAvailability(raw) {
    const allowed = new Set(enumerateCheckoutBookingDays());
    const daySet = new Set();
    const nextClosedDays = [];
    (Array.isArray(raw?.closedDays) ? raw.closedDays : []).forEach((d) => {
      const iso = String(d || '').trim();
      if (!allowed.has(iso) || daySet.has(iso)) return;
      daySet.add(iso);
      nextClosedDays.push(iso);
    });
    nextClosedDays.sort();
    const slotSet = new Set();
    const nextClosedSlots = [];
    (Array.isArray(raw?.closedSlots) ? raw.closedSlots : []).forEach((row) => {
      const date = String(row?.date || '').trim();
      const slot = normalizeCheckoutSlotKey(row?.slot);
      if (!date || !slot || !allowed.has(date) || daySet.has(date)) return;
      const sig = `${date}|${slot}`;
      if (slotSet.has(sig)) return;
      slotSet.add(sig);
      nextClosedSlots.push({ date, slot });
    });
    nextClosedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
    return { closedDays: nextClosedDays, closedSlots: nextClosedSlots };
  }

  function normalizeCheckoutSlotKey(raw) {
    const flat = String(raw || '')
      .trim()
      .replace(/\u2013|\u2014|\u2212/g, '-')
      .replace(/\s+/g, '');
    if (!flat) return '';
    for (const def of CHECKOUT_SLOT_DEFS) {
      const k = def.key.replace(/\s/g, '');
      if (flat === k || flat.includes(k)) return def.key;
    }
    const m = /(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/.exec(flat);
    if (m) {
      const cand = `${m[1]}-${m[2]}`;
      if (CHECKOUT_SLOT_DEFS.some((s) => s.key === cand)) return cand;
    }
    return '';
  }

  function isCheckoutDayClosed(iso) {
    const d = String(iso || '').trim();
    return checkoutAvailability.closedDays.includes(d);
  }

  function isCheckoutSlotClosed(iso, slotKey) {
    const d = String(iso || '').trim();
    const slot = normalizeCheckoutSlotKey(slotKey);
    if (!d || !slot) return false;
    if (isCheckoutDayClosed(d)) return true;
    return checkoutAvailability.closedSlots.some((r) => r.date === d && r.slot === slot);
  }

  function availableCheckoutSlots(iso) {
    if (!deliveryDateAllowed(iso) || isCheckoutDayClosed(iso)) return [];
    return CHECKOUT_SLOT_DEFS.filter((s) => !isCheckoutSlotClosed(iso, s.key));
  }

  function addIsoCalendarDays(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return iso;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  function firstCheckoutDateWithSlots(fromIso) {
    let cur = String(fromIso || earliestDeliveryIsoDate()).trim();
    for (let i = 0; i < 90; i += 1) {
      if (availableCheckoutSlots(cur).length) return cur;
      cur = addIsoCalendarDays(cur, 1);
    }
    return '';
  }

  function checkoutWeekdayShort(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const names = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return names[d.getDay()] || '';
  }

  function checkoutDateChipLabel(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return String(iso || '');
    return `${m[3]}.${m[2]}.${m[1].slice(2)}`;
  }

  function enumerateCheckoutBookingDays(count = CHECKOUT_BOOKING_DAYS) {
    const out = [];
    let cur = earliestDeliveryIsoDate();
    for (let i = 0; i < count; i += 1) {
      out.push(cur);
      cur = addIsoCalendarDays(cur, 1);
    }
    return out;
  }

  function isCheckoutDateSelectable(iso) {
    if (!deliveryDateAllowed(iso)) return false;
    if (isCheckoutDayClosed(iso)) return false;
    return availableCheckoutSlots(iso).length > 0;
  }

  function checkoutDateUnavailableReason(iso) {
    if (!deliveryDateAllowed(iso)) return 'Дата недоступна';
    if (isCheckoutDayClosed(iso)) return 'Приём заказов закрыт';
    if (!availableCheckoutSlots(iso).length) return 'Все интервалы закрыты';
    return '';
  }

  function selectCheckoutDeliveryDate(iso) {
    const d = String(iso || '').trim();
    if (!d || !isCheckoutDateSelectable(d) || !(checkoutDeliveryDate instanceof HTMLInputElement)) return false;
    if (checkoutDeliveryDate.value === d) {
      renderCheckoutDatePicker(d);
      return true;
    }
    checkoutDeliveryDate.value = d;
    refreshCheckoutDeliveryUi();
    return true;
  }

  function bindCheckoutDatePickerEvents() {
    const picker = document.getElementById('checkoutDeliveryDatePicker');
    if (!(picker instanceof HTMLElement) || picker.dataset.checkoutDateBound === '1') return;
    picker.dataset.checkoutDateBound = '1';

    function onPick(event) {
      const chip = event.target instanceof Element ? event.target.closest('[data-checkout-date]') : null;
      if (!chip || chip.tagName !== 'BUTTON' || chip.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      selectCheckoutDeliveryDate(chip.getAttribute('data-checkout-date'));
    }

    picker.addEventListener('click', onPick);
  }

  function renderCheckoutDatePicker(activeIso) {
    const picker = document.getElementById('checkoutDeliveryDatePicker');
    if (!(picker instanceof HTMLElement)) return;
    bindCheckoutDatePickerEvents();
    const days = enumerateCheckoutBookingDays();
    picker.innerHTML = days
      .map((iso) => {
        const selectable = isCheckoutDateSelectable(iso);
        const active = iso === activeIso;
        const reason = checkoutDateUnavailableReason(iso);
        const cls = ['checkout-date-chip', active && selectable ? 'is-active' : '', !selectable ? 'is-unavailable' : '']
          .filter(Boolean)
          .join(' ');
        const dis = selectable ? '' : ' disabled';
        const title = reason ? ` title="${escapeHtmlLocal(reason)}"` : '';
        return `<button type="button" class="${cls}" data-checkout-date="${escapeHtmlLocal(iso)}"${dis}${title} aria-selected="${active && selectable ? 'true' : 'false'}">
          <span class="checkout-date-chip-date">${escapeHtmlLocal(checkoutDateChipLabel(iso))}</span>
          <span class="checkout-date-chip-wd">${escapeHtmlLocal(checkoutWeekdayShort(iso))}</span>
        </button>`;
      })
      .join('');
  }

  function setCheckoutDeliveryHint(text) {
    const el = document.getElementById('checkoutDeliveryDateHint');
    if (el instanceof HTMLElement) el.textContent = text;
  }

  async function loadCheckoutAvailability() {
    try {
      const res = await fetch(`/api/public/delivery-availability?_=${Date.now()}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const data = await res.json();
      checkoutAvailability = parseCheckoutAvailabilityPayload(data);
      return true;
    } catch {
      checkoutAvailability = { closedDays: [], closedSlots: [] };
      return false;
    }
  }

  function stopCheckoutAvailabilityPoll() {
    if (checkoutAvailPollTimer) {
      window.clearInterval(checkoutAvailPollTimer);
      checkoutAvailPollTimer = null;
    }
  }

  function startCheckoutAvailabilityPoll() {
    stopCheckoutAvailabilityPoll();
    checkoutAvailPollTimer = window.setInterval(() => {
      if (document.hidden) return;
      if (!checkoutModal?.classList.contains('open')) return;
      void loadCheckoutAvailability().then(() => refreshCheckoutDeliveryUi());
    }, CHECKOUT_AVAIL_POLL_MS);
  }

  function refreshCheckoutDeliveryUi() {
    if (!(checkoutDeliveryDate instanceof HTMLInputElement) || !(checkoutDeliverySlot instanceof HTMLSelectElement)) {
      return;
    }
    const minDate = earliestDeliveryIsoDate();
    let date = String(checkoutDeliveryDate.value || '').trim() || minDate;
    if (date < minDate) date = minDate;

    const firstOpen = firstCheckoutDateWithSlots(minDate);
    if (!firstOpen) {
      renderCheckoutDatePicker('');
      checkoutDeliveryDate.value = '';
      checkoutDeliverySlot.innerHTML = CHECKOUT_SLOT_DEFS.map(
        (s) => `<option value="${escapeHtmlLocal(s.key)}" disabled>${escapeHtmlLocal(s.label)} — недоступно</option>`
      ).join('');
      checkoutDeliverySlot.disabled = true;
      setCheckoutDeliveryHint('Приём заказов временно закрыт на все даты. Свяжитесь с оператором.');
      return;
    }

    if (!isCheckoutDateSelectable(date)) {
      date = firstOpen;
      checkoutDeliveryDate.value = date;
    }

    renderCheckoutDatePicker(date);

    const slotsOpen = availableCheckoutSlots(date);
    checkoutDeliverySlot.disabled = !slotsOpen.length;
    const prev = normalizeCheckoutSlotKey(checkoutDeliverySlot.value);
    checkoutDeliverySlot.innerHTML = CHECKOUT_SLOT_DEFS.map((s) => {
      const closed = isCheckoutSlotClosed(date, s.key);
      const dis = closed ? ' disabled' : '';
      const suffix = closed ? ' — недоступно' : '';
      return `<option value="${escapeHtmlLocal(s.key)}"${dis}>${escapeHtmlLocal(s.label + suffix)}</option>`;
    }).join('');

    if (prev && !isCheckoutSlotClosed(date, prev)) checkoutDeliverySlot.value = prev;
    else if (slotsOpen.length) checkoutDeliverySlot.value = slotsOpen[0].key;
    else checkoutDeliverySlot.value = '';

    setCheckoutDeliveryHint(CHECKOUT_DELIVERY_HINT_DEFAULT);
  }

  function validateCheckoutBooking(date, slot) {
    if (!deliveryDateAllowed(date)) {
      return 'Проверьте дату доставки (не раньше завтра).';
    }
    if (isCheckoutDayClosed(date)) {
      return 'На выбранную дату приём заказов закрыт оператором.';
    }
    const slotKey = normalizeCheckoutSlotKey(slot);
    if (!slotKey || isCheckoutSlotClosed(date, slotKey)) {
      return 'Выбранный интервал недоступен на эту дату.';
    }
    return '';
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

  function geocodeBoundedParams(city) {
    if (normalizeAddressToken(city) === normalizeAddressToken(DEFAULT_CITY)) {
      return { bounded: '1', viewbox: ORENBURG_VIEWBOX };
    }
    return {};
  }

  function fetchGeocodeSearch(params) {
    const url = `/api/public/geocode-search?${params.toString()}`;
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('geocode_failed');
        return response.json();
      })
      .then((rows) => (Array.isArray(rows) ? rows : []))
      .catch(() => []);
  }

  function geocodeAddress(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const params = new URLSearchParams({
      limit: '12',
      countrycodes: 'ru',
      city: parts.city,
      street: normalizedStreet,
    });
    const house = String(parts.house || '').trim();
    if (house) params.set('house', house);
    const bounded = geocodeBoundedParams(parts.city);
    if (bounded.bounded) params.set('bounded', bounded.bounded);
    if (bounded.viewbox) params.set('viewbox', bounded.viewbox);
    return fetchGeocodeSearch(params);
  }

  function mergeGeocodeRows(...lists) {
    const seen = new Set();
    const out = [];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const row of list) {
        const lat = Number(row?.lat);
        const lon = Number(row?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const key = `${lat.toFixed(5)}|${lon.toFixed(5)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
      }
    }
    return out;
  }

  async function collectGeocodeCandidates(parts) {
    const normalizedStreet = String(parts.street || '')
      .replace(/^\s*(ул\.?|улица)\s+/i, '')
      .trim();
    const house = String(parts.house || '').trim();
    const city = String(parts.city || '').trim();
    const lists = [await geocodeAddress(parts)];
    if (house) {
      const bounded = geocodeBoundedParams(city);
      const qVariants = [
        `${city}, ул. ${normalizedStreet}, д. ${house}, Россия`,
        `${city}, ${normalizedStreet}, дом ${house}, Россия`,
        `${city}, ${normalizedStreet}, ${house}, Россия`,
        `${city}, д. ${house}, ул. ${normalizedStreet}, Россия`,
      ];
      for (const qv of qVariants) {
        const params = new URLSearchParams({
          limit: '12',
          countrycodes: 'ru',
          q: qv,
        });
        if (bounded.bounded) params.set('bounded', bounded.bounded);
        if (bounded.viewbox) params.set('viewbox', bounded.viewbox);
        lists.push(await fetchGeocodeSearch(params));
      }
    }
    lists.push(await fallbackGeocode(parts));
    return mergeGeocodeRows(...lists);
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

  function isOrenburgCityName(city) {
    const t = normalizeAddressToken(city);
    return t === 'оренбург' || t.includes('оренбург');
  }

  function enforceOrenburgCityInput() {
    if (mapCityInput instanceof HTMLInputElement) mapCityInput.value = DEFAULT_CITY;
  }

  function isWithinOrenburgBBox(row) {
    const lat = Number(row?.lat);
    const lon = Number(row?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    const { minLon, maxLat, maxLon, minLat } = ORENBURG_BBOX;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }

  function isOrenburgCityAddress(row) {
    if (!isWithinOrenburgBBox(row)) return false;
    const address = row?.address || {};
    const city = normalizeAddressToken(address.city || address.town || address.village || '');
    const stateDistrict = normalizeAddressToken(address.state_district || '');
    const state = normalizeAddressToken(address.state || '');
    const display = String(row?.display_name || '');
    if (city === normalizeAddressToken(DEFAULT_CITY)) return true;
    if (/оренбург/i.test(display)) return true;
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
    const srcHouse = normalizeHouseToken(parts.house);
    let pool = rows;
    if (srcHouse) {
      const withHouse = rows.filter((row) => rowMatchesHouseToken(row, parts.house));
      if (withHouse.length) pool = withHouse;
      else {
        const displayHouse = rows.filter((row) => {
          const display = normalizeAddressToken(row.display_name || '');
          return display.includes(srcHouse);
        });
        if (displayHouse.length) pool = displayHouse;
        else return null;
      }
    }
    let best = null;
    let bestScore = -1;
    pool.forEach((row) => {
      if (!isOrenburgCityAddress(row)) return;
      const addr = row.address || {};
      const city = normalizeAddressToken(addr.city || addr.town || addr.village || addr.state || '');
      const street = normalizeAddressToken(addr.road || addr.pedestrian || addr.footway || '');
      const house = rowHouseToken(row);
      const display = normalizeAddressToken(row.display_name || '');
      let score = 0;
      if (city && city === srcCity) score += 5;
      if (street && (street === srcStreet || street.includes(srcStreet) || srcStreet.includes(street))) score += 6;
      if (srcHouse && house && housesRoughlyMatch(srcHouse, house)) score += 20;
      else if (srcHouse && display.includes(srcHouse)) score += 8;
      if (display.includes(srcStreet)) score += 2;
      if (['building', 'house', 'residential', 'yes'].includes(String(row.type || '').toLowerCase())) score += 3;
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    });
    if (srcHouse && bestScore < 14) return null;
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
    const cityRaw = addr.city || addr.town || addr.village || addr.state || '';
    if (!isOrenburgCityName(cityRaw) && !/оренбург/i.test(String(data?.display_name || ''))) {
      if (checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent = 'Эта точка вне зоны доставки по Оренбургу.';
      }
      return;
    }
    const street = addr.road || addr.pedestrian || addr.footway || '';
    const house = addr.house_number || '';
    enforceOrenburgCityInput();
    if (mapStreetInput instanceof HTMLInputElement && street) mapStreetInput.value = street;
    if (mapHouseInput instanceof HTMLInputElement && house) mapHouseInput.value = house;
  }

  function normalizeAddressToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]/gi, '');
  }

  function normalizeHouseToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/^д\.?\s*/i, '')
      .replace(/^дом\.?\s*/i, '')
      .replace(/[^a-zа-я0-9/]/gi, '');
  }

  function rowHouseToken(row) {
    const addr = row?.address || {};
    let h = normalizeHouseToken(addr.house_number);
    if (h) return h;
    const display = String(row?.display_name || row?.name || '');
    const dm = /(?:д\.?|дом\.?)\s*(\d+[a-zа-я0-9/\-]*)/iu.exec(display);
    return dm ? normalizeHouseToken(dm[1]) : '';
  }

  function housesRoughlyMatch(wantRaw, gotRaw) {
    const want = normalizeHouseToken(wantRaw);
    const got = normalizeHouseToken(gotRaw);
    if (!want || !got) return false;
    if (want === got) return true;
    const wantNum = (want.match(/^\d+/) || [''])[0];
    const gotNum = (got.match(/^\d+/) || [''])[0];
    if (wantNum && gotNum && wantNum === gotNum) {
      const wantSuffix = want.slice(wantNum.length);
      const gotSuffix = got.slice(gotNum.length);
      if (!wantSuffix || !gotSuffix || wantSuffix === gotSuffix) return true;
      if (wantSuffix.startsWith(gotSuffix) || gotSuffix.startsWith(wantSuffix)) return true;
    }
    return false;
  }

  function rowMatchesHouseToken(row, houseRaw) {
    const want = normalizeHouseToken(houseRaw);
    if (!want) return true;
    const got = rowHouseToken(row);
    if (got && housesRoughlyMatch(want, got)) return true;
    const display = normalizeAddressToken(row?.display_name || row?.name || '');
    return Boolean(display && display.includes(want));
  }

  function updatePickedAddressLabel() {
    enforceOrenburgCityInput();
    const parts = readAddressParts();
    if (!isOrenburgCityName(parts.city)) {
      parts.city = DEFAULT_CITY;
      enforceOrenburgCityInput();
    }
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
  }

  async function geocodeMapFromInputs(options = {}) {
    const feedback = Boolean(options.feedback);
    const parts = readAddressParts();
    updatePickedAddressLabel();
    if (!parts.city || !parts.street) {
      if (feedback && checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent = 'Укажите улицу, чтобы найти адрес на карте.';
      }
      return false;
    }
    if (!checkoutMapCtl) {
      if (feedback) {
        showAppToast('Карта ещё загружается — подождите секунду и нажмите снова.', 'info');
      }
      return false;
    }
    if (!parts.house) {
      if (feedback && checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent = 'Ищем улицу на карте…';
      }
      const requestId = ++latestStreetPreviewId;
      try {
        const streetParts = { ...parts, house: '' };
        let candidates = await geocodeAddress(streetParts);
        if (!candidates.length) {
          candidates = await fallbackGeocodeStreetOnly(streetParts);
        }
        const match = pickBestStreetGeocodeMatch(parts, candidates);
        if (!match || requestId !== latestStreetPreviewId) {
          if (feedback && checkoutMapAddress instanceof HTMLElement) {
            checkoutMapAddress.textContent =
              'Улица не найдена. Проверьте название, укажите дом или отметьте точку на карте.';
          }
          return false;
        }
        const lat = Number(match.lat);
        const lon = Number(match.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
        checkoutMapCtl.setMarker(lat, lon);
        checkoutMapCtl.flyToMarker(lat, lon, 15);
        if (feedback && checkoutMapAddress instanceof HTMLElement) {
          checkoutMapAddress.textContent = 'Улица найдена. Укажите дом или выберите точный дом на карте.';
        }
        return true;
      } catch {
        if (feedback && checkoutMapAddress instanceof HTMLElement) {
          checkoutMapAddress.textContent = 'Не удалось найти улицу. Попробуйте ещё раз или укажите точку на карте.';
        }
        return false;
      }
    }
    const requestId = ++latestGeocodeRequestId;
    if (feedback && checkoutMapAddress instanceof HTMLElement) {
      checkoutMapAddress.textContent = 'Ищем дом на карте…';
    }
    try {
      const candidates = await collectGeocodeCandidates(parts);
      const match = pickBestGeocodeMatch(parts, candidates);
      if (!match || requestId !== latestGeocodeRequestId) {
        if (feedback && checkoutMapAddress instanceof HTMLElement) {
          checkoutMapAddress.textContent =
            'Адрес не найден. Проверьте улицу и дом или отметьте точку на карте вручную.';
        }
        return false;
      }
      const lat = Number(match.lat);
      const lon = Number(match.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        if (feedback && checkoutMapAddress instanceof HTMLElement) {
          checkoutMapAddress.textContent = 'Не удалось определить координаты. Укажите точку на карте.';
        }
        return false;
      }
      checkoutMapCtl.setMarker(lat, lon);
      checkoutMapCtl.flyToMarker(lat, lon, 16);
      updatePickedAddressLabel();
      if (feedback && checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent = pickedAddress || 'Адрес найден на карте.';
      }
      return true;
    } catch {
      if (feedback && checkoutMapAddress instanceof HTMLElement) {
        checkoutMapAddress.textContent = 'Ошибка поиска. Попробуйте ещё раз или укажите точку на карте.';
      }
      return false;
    }
  }

  async function syncMapByInputs() {
    await geocodeMapFromInputs({ feedback: false });
  }

  function resetMapPickerFields() {
    latestGeocodeRequestId += 1;
    latestStreetPreviewId += 1;
    if (mapSearchTimer) {
      window.clearTimeout(mapSearchTimer);
      mapSearchTimer = null;
    }
    if (streetSuggestTimer) {
      window.clearTimeout(streetSuggestTimer);
      streetSuggestTimer = null;
    }
    showStreetDropdown([]);
    applyAddressPartsToMapInputs({
      city: DEFAULT_CITY,
      street: '',
      house: '',
      apartment: '',
      floor: '',
      entrance: '',
    });
    pickedAddress = '';
    updatePickedAddressLabel();
    updateStreetClearButton();
    if (checkoutMapCtl && typeof checkoutMapCtl.clearMarker === 'function') {
      checkoutMapCtl.clearMarker();
      checkoutMapCtl.flyToMarker(MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1], MAP_DEFAULT_ZOOM);
    }
    if (checkoutMapAddress instanceof HTMLElement) {
      checkoutMapAddress.textContent = 'Поля очищены. Введите адрес и нажмите «Найти».';
    }
    if (mapStreetInput instanceof HTMLInputElement) mapStreetInput.focus();
  }

  let mapPickerResizeObserver = null;
  let mapInitedWhileHidden = false;

  function isMapPickerVisible() {
    return mapPickerModal?.classList.contains('open') === true;
  }

  function destroyMapPickerMap() {
    mapPickerResizeObserver?.disconnect?.();
    mapPickerResizeObserver = null;
    if (checkoutMapCtl && typeof checkoutMapCtl.destroy === 'function') {
      try {
        checkoutMapCtl.destroy();
      } catch {
        /**/
      }
    }
    checkoutMapCtl = null;
    mapInitedWhileHidden = false;
  }

  function scheduleMapPickerResize() {
    const run = () => checkoutMapCtl?.invalidateSize?.();
    window.requestAnimationFrame(() => window.requestAnimationFrame(run));
    [120, 350, 700, 1200].forEach((ms) => window.setTimeout(run, ms));
  }

  function bindMapPickerResizeObserver() {
    if (!(checkoutMapRoot instanceof HTMLElement) || typeof ResizeObserver !== 'function') return;
    mapPickerResizeObserver?.disconnect?.();
    mapPickerResizeObserver = new ResizeObserver(() => {
      if (isMapPickerVisible()) checkoutMapCtl?.invalidateSize?.();
    });
    mapPickerResizeObserver.observe(checkoutMapRoot);
  }

  function waitMapPickerPaint() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    });
  }

  async function initMapPicker() {
    if (!(checkoutMapRoot instanceof HTMLElement)) return;
    const EM = window.EkvalineMaps;
    if (!EM || typeof EM.attachInteractiveMap !== 'function') {
      checkoutMapRoot.innerHTML =
        '<div class="ek-map-unavailable" role="status">Карта недоступна — заполните поля адреса ниже (улица, дом, квартира).</div>';
      return;
    }
    if (!isMapPickerVisible()) {
      mapInitedWhileHidden = Boolean(checkoutMapCtl) || mapInitedWhileHidden;
      return;
    }
    if (checkoutMapCtl && mapInitedWhileHidden) {
      destroyMapPickerMap();
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
      mapInitedWhileHidden = false;
      bindMapPickerResizeObserver();
    }
    scheduleMapPickerResize();
  }

  function parseFormattedAddressLine(line) {
    const s = String(line || '').trim();
    const parts = {
      city: DEFAULT_CITY,
      street: '',
      house: '',
      apartment: '',
      floor: '',
      entrance: '',
    };
    if (!s) return parts;
    const streetM = /ул\.?\s*([^,]+)/i.exec(s);
    const houseM = /д\.?\s*([^,]+)/i.exec(s);
    const entranceM = /подъезд\s+([^,]+)/i.exec(s);
    const floorM = /этаж\s+([^,]+)/i.exec(s);
    const aptM = /кв\.?\s*([^,]+)/i.exec(s);
    if (streetM) parts.street = String(streetM[1] || '').trim();
    if (houseM) parts.house = String(houseM[1] || '').trim();
    if (entranceM) parts.entrance = String(entranceM[1] || '').trim();
    if (floorM) parts.floor = String(floorM[1] || '').trim();
    if (aptM) parts.apartment = String(aptM[1] || '').trim();
    return parts;
  }

  function applyAddressPartsToMapInputs(parts) {
    if (mapCityInput instanceof HTMLInputElement) mapCityInput.value = parts.city || DEFAULT_CITY;
    if (mapStreetInput instanceof HTMLInputElement) mapStreetInput.value = parts.street || '';
    if (mapHouseInput instanceof HTMLInputElement) mapHouseInput.value = parts.house || '';
    if (mapApartmentInput instanceof HTMLInputElement) mapApartmentInput.value = parts.apartment || '';
    if (mapFloorInput instanceof HTMLInputElement) mapFloorInput.value = parts.floor || '';
    if (mapEntranceInput instanceof HTMLInputElement) mapEntranceInput.value = parts.entrance || '';
  }

  async function openMapPicker(initialAddress = '') {
    const fromArg = String(initialAddress || '').trim();
    const currentAddress = String(
      fromArg || (checkoutAddressInput instanceof HTMLInputElement ? checkoutAddressInput.value : '')
    ).trim();
    if (!currentAddress) {
      applyAddressPartsToMapInputs(parseFormattedAddressLine(''));
    } else {
      applyAddressPartsToMapInputs(parseFormattedAddressLine(currentAddress));
    }
    updatePickedAddressLabel();
    mapPickerModal?.classList.add('open');
    mapPickerModal?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('map-picker-open');
    document.body.style.overflow = 'hidden';
    await waitMapPickerPaint();
    destroyMapPickerMap();
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
      showAppToast(
        'Карта не загрузилась — укажите адрес полями ниже (улица, дом, при необходимости этаж и подъезд).',
        'info'
      );
    }
    scheduleMapPickerResize();
  }

  function closeMapPicker() {
    mapPickerModal?.classList.remove('open');
    mapPickerModal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('map-picker-open');
    if (!cartModal?.classList.contains('open') && !checkoutModal?.classList.contains('open')) {
      document.body.style.overflow = '';
    }
    window.requestAnimationFrame(() => checkoutMapCtl?.invalidateSize?.());
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
    if (!(cartBtn instanceof HTMLElement)) return;
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
    syncCartGuestUi();
    return total;
  }

  function computeCartSubtotal(items) {
    const list = Array.isArray(items) ? items : [];
    return list.reduce((sum, item) => {
      if (item?.preorder) return sum;
      const unitPrice = item?.water ? getWaterUnitPrice(item.qty || 0) : item?.price || 0;
      return sum + unitPrice * (item?.qty || 0);
    }, 0);
  }

  function getUserBonusBalance(user) {
    if (!user) return 0;
    const fromProfile = Number(user.bonus_balance);
    if (Number.isFinite(fromProfile) && fromProfile >= 0) return Math.floor(fromProfile);
    if (window.EkvalineAPI?.json) return 0;
    return Math.max(0, Math.floor(Number(readByUser(BONUSES_KEY, String(user.id), 0)) || 0));
  }

  /** Нельзя списать больше суммы заказа и больше баланса бонусов. */
  function maxCheckoutBonusSpend(subtotal, balance) {
    const orderSum = Math.max(0, Math.floor(Number(subtotal) || 0));
    const avail = Math.max(0, Math.floor(Number(balance) || 0));
    return Math.min(orderSum, avail);
  }

  function checkoutBonusInputEl() {
    if (!(checkoutForm instanceof HTMLFormElement)) return null;
    const el = checkoutForm.elements.namedItem('bonusSpend');
    return el instanceof HTMLInputElement ? el : null;
  }

  function syncCheckoutBonusUi(user, items) {
    const cartItems = Array.isArray(items) ? items : readCart();
    const subtotal = computeCartSubtotal(cartItems);
    const preorderCount = cartItems.filter((item) => item?.preorder).length;
    const balance = getUserBonusBalance(user);
    const maxSpend = maxCheckoutBonusSpend(subtotal, balance);
    const bonusEl = checkoutBonusInputEl();

    if (bonusEl) {
      bonusEl.min = '0';
      bonusEl.max = String(maxSpend);
      bonusEl.step = '1';
      if (maxSpend <= 0) {
        bonusEl.value = '0';
        bonusEl.disabled = true;
      } else {
        bonusEl.disabled = false;
        const raw = Math.floor(Number(bonusEl.value) || 0);
        bonusEl.value = String(Math.min(maxSpend, Math.max(0, raw)));
      }
    }

    const spent = bonusEl && !bonusEl.disabled ? Math.floor(Number(bonusEl.value) || 0) : 0;
    const payable = Math.max(0, subtotal - spent);

    if (!(checkoutMetaText instanceof HTMLElement)) return;
    if (preorderCount > 0) {
      checkoutMetaText.textContent = `В корзине есть товары "под заказ". Укажите свою почту в примечании к заказу: компания пришлет всю необходимую информацию и дату доставки. Текущая сумма оплачиваемых позиций: ${subtotal} ₽.`;
      return;
    }
    if (balance <= 0) {
      checkoutMetaText.textContent = `Сумма к оплате: ${payable} ₽. Бонусов нет — списание недоступно.`;
      return;
    }
    checkoutMetaText.textContent = `Сумма: ${subtotal} ₽. Доступно бонусов: ${balance}. К оплате: ${payable} ₽ (можно списать до ${maxSpend}).`;
  }

  function openCartModal() {
    renderCart();
    setCartError('');
    syncCartGuestUi();
    cartModal?.classList.add('open');
    cartModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartModal() {
    cartModal?.classList.remove('open');
    cartModal?.setAttribute('aria-hidden', 'true');
    if (!checkoutModal?.classList.contains('open')) document.body.style.overflow = '';
  }

  let checkoutSavedAddresses = [];

  function renderCheckoutSavedAddresses() {
    if (!(checkoutSavedAddressesWrap instanceof HTMLElement) || !(checkoutSavedAddressesList instanceof HTMLElement)) {
      return;
    }
    const rows = Array.isArray(checkoutSavedAddresses) ? checkoutSavedAddresses : [];
    if (!rows.length) {
      checkoutSavedAddressesWrap.hidden = true;
      checkoutSavedAddressesList.innerHTML = '';
      return;
    }
    checkoutSavedAddressesWrap.hidden = false;
    checkoutSavedAddressesList.innerHTML = rows
      .map((addr) => {
        const line = String(addr.address_line || '').trim();
        const title = String(addr.label || '').trim() || line;
        const def = addr.is_default ? ' is-default' : '';
        const selected =
          checkoutAddressInput instanceof HTMLInputElement &&
          checkoutAddressInput.value.trim() === line
            ? ' is-selected'
            : '';
        return `<button type="button" class="checkout-saved-address-chip${def}${selected}" data-saved-address-id="${Number(addr.id) || 0}" role="option">
          <span class="checkout-saved-address-chip-title">${escapeHtmlLocal(title)}</span>
          <span class="checkout-saved-address-chip-line">${escapeHtmlLocal(line)}</span>
        </button>`;
      })
      .join('');
  }

  async function loadCheckoutSavedAddresses() {
    checkoutSavedAddresses = [];
    const api = window.EkvalineAPI;
    if (!api?.json) {
      renderCheckoutSavedAddresses();
      return;
    }
    try {
      const response = await api.json('/api/profile/addresses');
      if (response.ok && Array.isArray(response.data?.addresses)) {
        checkoutSavedAddresses = response.data.addresses.slice().sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return Number(b.id || 0) - Number(a.id || 0);
        });
      }
    } catch {
      checkoutSavedAddresses = [];
    }
    renderCheckoutSavedAddresses();
    const primary = checkoutSavedAddresses.find((a) => a.is_default) || checkoutSavedAddresses[0];
    if (primary && checkoutAddressInput instanceof HTMLInputElement && !checkoutAddressInput.value.trim()) {
      checkoutAddressInput.value = String(primary.address_line || '').trim().slice(0, CHECKOUT_ADDRESS_MAX);
      renderCheckoutSavedAddresses();
    }
  }

  function selectCheckoutSavedAddress(addressId) {
    const id = Number(addressId);
    const row = checkoutSavedAddresses.find((a) => Number(a.id) === id);
    const value = String(row?.address_line || '').trim();
    if (!value || !(checkoutAddressInput instanceof HTMLInputElement)) return;
    checkoutAddressInput.value = value.slice(0, CHECKOUT_ADDRESS_MAX);
    renderCheckoutSavedAddresses();
  }

  function bindOpenCheckoutButton() {
    if (!(openCheckoutBtn instanceof HTMLButtonElement)) return;
    if (openCheckoutBtn.dataset.checkoutBound === '1') return;
    openCheckoutBtn.dataset.checkoutBound = '1';
    openCheckoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      openCheckout();
    });
  }

  function openCheckout() {
    void (async () => {
      const checkoutBtn = openCheckoutBtn instanceof HTMLButtonElement ? openCheckoutBtn : null;
      if (checkoutBtn) checkoutBtn.disabled = true;
      try {
        if (!(await ensureServerSessionForCheckout())) return;
        if (!requireClientLoginForCheckout('Для оформления заказа войдите или зарегистрируйтесь.')) return;
        const user = readCurrentUser();
        const items = readCart();
        if (!items.length) {
          showAppToast('Корзина пуста — добавьте товары из каталога.', 'info');
          return;
        }
        syncCheckoutBonusUi(user, items);
        void loadCheckoutSavedAddresses();
        await loadCheckoutAvailability();
        refreshCheckoutDeliveryUi();
        closeCartModal();
        checkoutModal?.classList.add('open');
        checkoutModal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        startCheckoutAvailabilityPoll();
        updateCheckoutCommentCounter();
      } catch (err) {
        console.error('[cart] openCheckout:', err);
        showAppToast('Не удалось открыть оформление заказа. Обновите страницу (Ctrl+F5).', 'error');
      } finally {
        if (checkoutBtn) checkoutBtn.disabled = false;
      }
    })();
  }

  function closeCheckout() {
    checkoutModal?.classList.remove('open');
    checkoutModal?.setAttribute('aria-hidden', 'true');
    stopCheckoutAvailabilityPoll();
    if (!cartModal?.classList.contains('open')) document.body.style.overflow = '';
  }

  if (!isCabinetPage) {
    if (!(cartBtn instanceof HTMLElement)) return;
    if (!cartUiReady) {
      cartBtn.addEventListener('click', openCartModal);
    }
  }

  bindOpenCheckoutButton();

  try {
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
      event.preventDefault();
      openCheckout();
      return;
    }
    if (target.closest('#openMapPickerBtn')) {
      mapPickerOnApply = null;
      mapPickerMaxLength = CHECKOUT_ADDRESS_MAX;
      void openMapPicker();
      return;
    }
    const savedAddrChip = target.closest('.checkout-saved-address-chip');
    if (savedAddrChip instanceof HTMLElement) {
      selectCheckoutSavedAddress(savedAddrChip.getAttribute('data-saved-address-id'));
      return;
    }
    const dateChip = target.closest('[data-checkout-date]');
    if (dateChip instanceof Element && dateChip.tagName === 'BUTTON' && !dateChip.disabled) {
      if (selectCheckoutDeliveryDate(dateChip.getAttribute('data-checkout-date'))) return;
    }
    const streetSuggestBtn = target.closest('[data-street-suggest]');
    if (streetSuggestBtn) {
      const value = streetSuggestBtn.getAttribute('data-street-suggest') || '';
      applyStreetSuggestion(value);
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

  checkoutDeliverySlot?.addEventListener('change', () => {
    const date = checkoutDeliveryDate instanceof HTMLInputElement ? checkoutDeliveryDate.value : '';
    const slot = normalizeCheckoutSlotKey(checkoutDeliverySlot instanceof HTMLSelectElement ? checkoutDeliverySlot.value : '');
    if (date && slot && isCheckoutSlotClosed(date, slot)) refreshCheckoutDeliveryUi();
  });

  void loadCheckoutAvailability().then(() => refreshCheckoutDeliveryUi());

  window.setInterval(() => {
    if (document.hidden) return;
    void loadCheckoutAvailability().then(() => {
      if (checkoutModal?.classList.contains('open')) refreshCheckoutDeliveryUi();
    });
  }, PUBLIC_DATA_POLL_MS);

  if (typeof window.EkvalineOrdersSync?.subscribeOrdersDataChanged === 'function') {
    window.EkvalineOrdersSync.subscribeOrdersDataChanged(() => {
      void loadCheckoutAvailability().then(() => {
        if (checkoutModal?.classList.contains('open')) refreshCheckoutDeliveryUi();
      });
    });
  }

  if (checkoutForm instanceof HTMLFormElement) {
    updateCheckoutCommentCounter();
    checkoutCommentField?.addEventListener('input', updateCheckoutCommentCounter);
    checkoutBonusInputEl()?.addEventListener('input', () => {
      const user = readCurrentUser();
      if (user) syncCheckoutBonusUi(user);
    });
    checkoutBonusInputEl()?.addEventListener('change', () => {
      const user = readCurrentUser();
      if (user) syncCheckoutBonusUi(user);
    });
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!(await ensureServerSessionForCheckout())) return;
      const user = readCurrentUser();
      if (!isCheckoutClientUser(user)) {
        requireClientLoginForCheckout('Для оформления заказа войдите или зарегистрируйтесь.');
        return;
      }
      const items = readCart();
      if (!items.length) return;

      const address = String(checkoutForm.elements.namedItem('address')?.value || '').trim();
      const comment = String(checkoutForm.elements.namedItem('comment')?.value || '').trim();
      const deliveryDate = String(checkoutForm.elements.namedItem('deliveryDate')?.value || '').trim();
      const deliverySlot = String(checkoutDeliverySlot instanceof HTMLSelectElement ? checkoutDeliverySlot.value : '').trim();
      const hasFloor = /этаж\s+\S+/i.test(address);
      const hasEntrance = /подъезд\s+\S+/i.test(address);
      const hasApartment = /кв\.\s*\S+/i.test(address);
      const apartmentAddressValid = hasApartment ? hasFloor && hasEntrance : true;
      const bookingErr = validateCheckoutBooking(deliveryDate, deliverySlot);
      if (
        !address ||
        address.length > CHECKOUT_ADDRESS_MAX ||
        comment.length > CHECKOUT_COMMENT_MAX ||
        bookingErr ||
        !apartmentAddressValid
      ) {
        showAppToast(
          bookingErr ||
            'Проверьте поля: адрес на карте, дату (не раньше завтра) и интервал. Для квартиры укажите этаж и подъезд.',
          'error'
        );
        return;
      }

      const hasPreorderItems = items.some((item) => item.preorder);
      if (hasPreorderItems) {
        showAppToast('Товары «под заказ» оформляет оператор — уберите их из корзины или оставьте комментарий в поддержке.', 'error');
        return;
      }

      const api = window.EkvalineAPI;
      if (!api || typeof api.json !== 'function') {
        showAppToast('Нет связи с сервером — обновите страницу и войдите в кабинет.', 'error');
        return;
      }

      const products = await fetchCatalogProducts();
      if (!products.length) {
        showAppToast('Не удалось загрузить каталог. Обновите страницу и попробуйте снова.', 'error');
        return;
      }

      const lineItems = [];
      for (const item of items) {
        const pid = findCatalogProductId(item, products);
        if (!pid) {
          showAppToast('Не удалось оформить заказ. Обновите каталог и добавьте товар снова.', 'error');
          return;
        }
        lineItems.push({ product_id: pid, qty: Math.max(1, Number(item.qty) || 1) });
      }

      const subtotal = computeCartSubtotal(items);
      const currentBonus = getUserBonusBalance(user);
      const maxSpend = maxCheckoutBonusSpend(subtotal, currentBonus);
      const bonusSpendRaw = Math.floor(Number(checkoutForm.elements.namedItem('bonusSpend')?.value || 0));
      const bonusSpend = Math.min(maxSpend, Math.max(0, bonusSpendRaw));
      if (bonusSpendRaw > maxSpend) {
        syncCheckoutBonusUi(user, items);
        showAppToast(
          maxSpend <= 0
            ? 'Бонусов нет — списание недоступно.'
            : `Можно списать не больше ${maxSpend} бонусов (не больше суммы заказа).`,
          'error'
        );
        return;
      }

      try {
        const response = await api.json('/api/orders', {
          method: 'POST',
          body: {
            address,
            delivery_date: deliveryDate,
            delivery_slot: deliverySlot,
            payment_method: 'cash',
            bonuses_used: bonusSpend,
            courier_note: comment,
            items: lineItems,
          },
        });
        if (!response.ok) {
          const humanize =
            typeof api.humanizeClientApiError === 'function'
              ? api.humanizeClientApiError
              : (_s, _e, fb) => fb || 'Не удалось оформить заказ.';
          if (response.status === 401 || response.status === 403) {
            await syncClientAuthFromServer();
            showAppToast(
              response.status === 401
                ? 'Сессия истекла. Войдите снова и повторите оформление.'
                : humanize(response.status, response.data?.error, 'Не удалось оформить заказ.'),
              'error'
            );
            if (response.status === 401) {
              promptCheckoutLogin('Сессия истекла — войдите снова и повторите оформление.', { openModal: true });
            }
            return;
          }
          showAppToast(humanize(response.status, response.data?.error, 'Не удалось оформить заказ.'), 'error');
          return;
        }
        api.resetCsrf?.();
        const order = response.data?.order;
        const updatedUser = response.data?.user;
        if (updatedUser) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
          if (typeof window.__ekvalineUpdateHeaderAuth === 'function') window.__ekvalineUpdateHeaderAuth();
        }
        const bonusEarned = Number(
          order?.bonuses_earned ?? Math.floor(Math.max(0, subtotal - bonusSpend) * 0.05)
        );
        window.EkvalineOrdersSync?.notifyOrdersDataChanged?.();

        const addresses = readByUser(ADDRESSES_KEY, String(user.id), []);
        if (!addresses.includes(address)) {
          addresses.unshift(address);
          writeByUser(ADDRESSES_KEY, String(user.id), addresses.slice(0, 10));
        }

        saveCart([]);
        updateCartBadge();
        renderCart();
        closeCheckout();
        closeCartModal();
        checkoutForm.reset();
        refreshCheckoutDeliveryUi();
        const userAfter = readCurrentUser();
        if (userAfter) syncCheckoutBonusUi(userAfter, []);
        updateCheckoutCommentCounter();
        window.EkvalineNotificationsSync?.refresh?.();
        showOrderSuccessModal(order, { bonusEarned });
      } catch {
        showAppToast('Ошибка сети при оформлении заказа.', 'error');
      }
    });
  }

  applyMapAddressBtn?.addEventListener('click', () => {
    void (async () => {
      enforceOrenburgCityInput();
      const parts = readAddressParts();
      if (!isOrenburgCityName(parts.city)) {
        showAppToast('Доставка только по Оренбургу.', 'error');
        return;
      }
      if (!parts.street || !parts.house) {
        showAppToast('Укажите улицу из подсказок и номер дома.', 'error');
        return;
      }
      const apartmentFilled = Boolean(parts.apartment);
      const apartmentExtrasOk = apartmentFilled ? Boolean(parts.floor && parts.entrance) : true;
      if (!apartmentExtrasOk) {
        showAppToast('Если указана квартира, заполните этаж и подъезд.', 'error');
        return;
      }
      if (applyMapAddressBtn instanceof HTMLButtonElement) applyMapAddressBtn.disabled = true;
      try {
        if (!(checkoutMapCtl && checkoutMapRoot instanceof HTMLElement)) {
          await initMapPicker();
        }
        await geocodeMapFromInputs({ feedback: true });
        updatePickedAddressLabel();
        if (!pickedAddress) {
          showAppToast('Не удалось определить адрес. Проверьте поля или отметьте дом на карте.', 'error');
          return;
        }
        if (!/оренбург/i.test(pickedAddress)) {
          showAppToast('Адрес должен быть в Оренбурге.', 'error');
          return;
        }
        const line = pickedAddress.slice(0, mapPickerMaxLength);
        if (typeof mapPickerOnApply === 'function') {
          mapPickerOnApply(line);
          mapPickerOnApply = null;
          closeMapPicker();
          return;
        }
        if (checkoutAddressInput instanceof HTMLInputElement) {
          checkoutAddressInput.value = line;
        }
        closeMapPicker();
      } catch {
        showAppToast('Не удалось найти адрес. Проверьте поля или отметьте дом на карте.', 'error');
      } finally {
        if (applyMapAddressBtn instanceof HTMLButtonElement) applyMapAddressBtn.disabled = false;
      }
    })();
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
    enforceOrenburgCityInput();
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

  resetMapPickerBtn?.addEventListener('click', () => {
    resetMapPickerFields();
  });

  appToastClose?.addEventListener('click', () => {
    if (!(appToast instanceof HTMLElement)) return;
    if (appToastTimer) window.clearTimeout(appToastTimer);
    appToast.classList.remove('is-visible');
    appToast.hidden = true;
  });

  document.getElementById('orderSuccessContinueBtn')?.addEventListener('click', hideOrderSuccessModal);
  document.getElementById('orderSuccessModal')?.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.orderSuccessClose === 'true') {
      hideOrderSuccessModal();
    }
  });

  updateStreetClearButton();

  function warmMapPicker() {
    window.EkvalineMaps?.prefetch?.();
  }

  window.EkvalineMapPicker = {
    open(opts = {}) {
      mapPickerOnApply = typeof opts.onApply === 'function' ? opts.onApply : null;
      mapPickerMaxLength = Math.max(80, Math.floor(Number(opts.maxLength) || CHECKOUT_ADDRESS_MAX));
      void openMapPicker(String(opts.initialAddress || '').trim());
    },
    close: closeMapPicker,
  };

  warmMapPicker();

  window.EkvalineCart = {
    addFromCard: addCatalogItemToCart,
    read: readCart,
    save: saveCart,
    refreshBadge: updateCartBadge,
    open: openCartModal,
    syncGuestUi: syncCartGuestUi,
  };
  window.__ekvalineSyncCartGuestUi = syncCartGuestUi;
  if (window.__ekvalineCatalogCartBoot?.bindAddButtons) {
    window.__ekvalineCatalogCartBoot.bindAddButtons();
  }
  } catch (cartUiErr) {
    console.error('[cart] Ошибка инициализации оформления заказа:', cartUiErr);
    if (isCatalogPage) {
      bindCatalogAddButtons();
      bindOpenCheckoutButton();
      updateCartBadge();
    }
    if (isCabinetPage && !window.EkvalineMapPicker) {
      console.error('[cabinet] EkvalineMapPicker не инициализирован — выбор адреса на карте недоступен.');
    }
  }

  if (!cartUiReady) {
    updateCartBadge();
    saveCart(readCart());
  }
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
  const PEOPLE_MIN = Number(peopleRange.min) || 1;
  const PEOPLE_MAX = Number(peopleRange.max) || 15;
  const allowedUsage = new Set(['drink', 'cook', 'both']);
  const allowedActivity = new Set(['low', 'medium', 'high']);
  const allowedSeason = new Set(['winter', 'spring-autumn', 'summer']);

  const usageLabels = {
    drink: 'Только питье',
    cook: 'Только готовка',
    both: 'Питье и готовка',
  };

  function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const int = Math.round(n);
    return Math.min(max, Math.max(min, int));
  }

  function normalizeState() {
    state.people = clampInt(state.people, PEOPLE_MIN, PEOPLE_MAX, PEOPLE_MIN);
    if (!allowedUsage.has(state.usage)) state.usage = 'both';
    if (!allowedActivity.has(state.activity)) state.activity = 'medium';
    if (!allowedSeason.has(state.season)) state.season = 'spring-autumn';
    peopleRange.value = String(state.people);
  }

  let state = {
    people: clampInt(peopleRange.value, PEOPLE_MIN, PEOPLE_MAX, PEOPLE_MIN),
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
    const peopleSafe = clampInt(payload.people, PEOPLE_MIN, PEOPLE_MAX, state.people);
    state.people = peopleSafe;
    peopleRange.value = String(peopleSafe);
    peopleValue.textContent = String(peopleSafe);
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
    normalizeState();
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
    state.people = clampInt(event.target.value, PEOPLE_MIN, PEOPLE_MAX, PEOPLE_MIN);
    peopleRange.value = String(state.people);
    scheduleWaterCalc(false);
  });

  document.querySelectorAll('#water-calc .option-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const { group, value } = button.dataset;
      if (!group || !value) return;
      if (group === 'usage' && !allowedUsage.has(value)) return;
      if (group === 'activity' && !allowedActivity.has(value)) return;
      if (group === 'season' && !allowedSeason.has(value)) return;
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

/** URL POST /api/feedback (same-origin или meta ekvaline-api-origin). */
function getCallbackFeedbackPostUrls() {
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

  add(`${origin}/api/feedback`);
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

const deliveryZoneMap = document.getElementById('deliveryZoneMap');

if (deliveryZoneMap && window.EkvalineMaps && typeof window.EkvalineMaps.initStaticMap === 'function') {
  void window.EkvalineMaps.initStaticMap(deliveryZoneMap, [51.768, 55.102], 12).catch(() => {});
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
    image: 'assets/certificate-declaration-eac-2025-preview.jpg',
    alt: 'Декларация о соответствии ЕАЭС',
    badge: 'Документ',
    title: 'Декларация о соответствии',
    description: 'Подтверждение соответствия продукции «ЭкваЛайн» требованиям технических регламентов ЕАЭС.',
    pdf: 'assets/certificate-declaration-eac-2025.pdf',
  },
]);

let aboutCertPhotoModalEl = null;
let aboutCertPhotoModalPrevOverflow = '';

function ensureAboutCertPhotoModal() {
  if (aboutCertPhotoModalEl) return aboutCertPhotoModalEl;

  const modal = document.createElement('div');
  modal.className = 'about-cert-photo-modal';
  modal.id = 'aboutCertPhotoModal';
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Просмотр документа');
  modal.innerHTML = `
    <div class="about-cert-photo-modal__scrim" data-cert-photo-close="true"></div>
    <div class="about-cert-photo-modal__dialog">
      <button type="button" class="about-cert-photo-modal__close" aria-label="Закрыть" data-cert-photo-close="true">×</button>
      <div class="about-cert-photo-modal__frame">
        <img class="about-cert-photo-modal__img" alt="" />
      </div>
      <p class="about-cert-photo-modal__caption" hidden></p>
    </div>
  `;

  modal.querySelectorAll('[data-cert-photo-close]').forEach((el) => {
    el.addEventListener('click', closeAboutCertPhotoModal);
  });

  document.body.appendChild(modal);
  aboutCertPhotoModalEl = modal;
  return modal;
}

function openAboutCertPhotoModal({ src, alt, caption }) {
  const modal = ensureAboutCertPhotoModal();
  const img = modal.querySelector('.about-cert-photo-modal__img');
  const cap = modal.querySelector('.about-cert-photo-modal__caption');
  if (!(img instanceof HTMLImageElement)) return;

  img.src = src;
  img.alt = alt || 'Документ';

  if (cap instanceof HTMLElement) {
    const text = String(caption || '').trim();
    cap.textContent = text;
    cap.hidden = !text;
  }

  aboutCertPhotoModalPrevOverflow = document.body.style.overflow;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.about-cert-photo-modal__close')?.focus();
}

function closeAboutCertPhotoModal() {
  if (!aboutCertPhotoModalEl) return;
  aboutCertPhotoModalEl.classList.remove('open');
  aboutCertPhotoModalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = aboutCertPhotoModalPrevOverflow || '';
  const img = aboutCertPhotoModalEl.querySelector('.about-cert-photo-modal__img');
  if (img instanceof HTMLImageElement) img.removeAttribute('src');
}

if (!window.__aboutCertPhotoModalEscBound) {
  window.__aboutCertPhotoModalEscBound = true;
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (aboutCertPhotoModalEl?.classList.contains('open')) closeAboutCertPhotoModal();
  });
}

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
  grid.classList.toggle('about-certs-grid--solo', items.length === 1);

  items.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const image = String(raw.image ?? '').trim();
    const pdf = String(raw.pdf ?? '')
      .trim()
      .replace(/^\/+/, '');
    const alt = String(raw.alt ?? '').trim();
    const badge = String(raw.badge ?? '').trim();
    const title = String(raw.title ?? '').trim();
    const description = String(raw.description ?? '').trim();
    if (!image || !alt) return;

    const art = document.createElement('article');
    art.className = 'about-cert-card';

    const img = document.createElement('img');
    img.src = image;
    img.alt = alt || title || 'Документ';
    img.loading = 'lazy';
    img.decoding = 'async';
    art.appendChild(img);

    const overlay = document.createElement('div');
    overlay.className = 'about-cert-overlay about-cert-overlay--actions';

    if (badge) {
      const badgeEl = document.createElement('span');
      badgeEl.textContent = badge;
      overlay.appendChild(badgeEl);
    }

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      overlay.appendChild(titleEl);
    }

    if (description) {
      const descEl = document.createElement('p');
      descEl.textContent = description;
      overlay.appendChild(descEl);
    }

    const actions = document.createElement('div');
    actions.className = 'about-cert-actions';

    const photoBtn = document.createElement('button');
    photoBtn.type = 'button';
    photoBtn.className = 'about-cert-btn';
    photoBtn.textContent = 'Открыть фото';
    photoBtn.addEventListener('click', () => {
      openAboutCertPhotoModal({
        src: image,
        alt: alt || title || 'Документ',
        caption: title,
      });
    });
    actions.appendChild(photoBtn);

    if (pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.className = 'about-cert-btn about-cert-btn--ghost';
      pdfLink.href = pdf;
      pdfLink.target = '_blank';
      pdfLink.rel = 'noopener noreferrer';
      pdfLink.setAttribute('download', '');
      pdfLink.textContent = 'Скачать PDF';
      actions.appendChild(pdfLink);
    }

    overlay.appendChild(actions);
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
