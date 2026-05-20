/**
 * Клиент API (сессия + CSRF). Работает при открытии сайта через node server.js.
 */
(function () {
  let csrfToken = null;
  let lastUserActivityAt = Date.now();
  let sessionIdleMs = 30 * 60 * 1000;
  let sessionWatchStarted = false;
  let redirectingForSession = false;

  const PUBLIC_API_PATHS = [
    '/api/public/',
    '/api/csrf',
    '/api/client-boot',
    '/api/products',
    '/api/feedback',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/verify-password-reset-code',
    '/api/auth/reset-password-by-email',
    '/api/auth/reset-password',
  ];

  function isPublicApiPath(path) {
    const p = String(path || '').split('?')[0];
    return PUBLIC_API_PATHS.some((prefix) => p === prefix || p.startsWith(prefix));
  }

  function hadStoredUser() {
    try {
      return !!localStorage.getItem('ekvaline_current_user');
    } catch {
      return false;
    }
  }

  function clearStoredAuth() {
    try {
      localStorage.removeItem('ekvaline_current_user');
      localStorage.removeItem('ekvaline_users');
    } catch {
      /* ignore */
    }
    resetCsrf();
  }

  function loginPageUrl() {
    try {
      return new URL('index.html', window.location.href).href;
    } catch {
      return 'index.html';
    }
  }

  function redirectToLoginAfterSessionExpiry() {
    if (redirectingForSession) return;
    redirectingForSession = true;
    clearStoredAuth();
    const target = `${loginPageUrl()}?session-expired=1`;
    const here = String(window.location.pathname || '').replace(/\\/g, '/');
    if (/\/index\.html$/i.test(here) || here.endsWith('/')) {
      const u = new URL(window.location.href);
      if (u.searchParams.get('session-expired') !== '1') {
        u.searchParams.set('session-expired', '1');
        window.location.replace(u.href);
      } else {
        window.dispatchEvent(new CustomEvent('ekvaline:session-expired'));
      }
      return;
    }
    window.location.replace(target);
  }

  function handleSessionAuthFailure(path, status, data) {
    if (Number(status) !== 401) return;
    if (isPublicApiPath(path)) return;
    const expired = data && data.sessionExpired === true;
    if (!expired && !hadStoredUser()) return;
    redirectToLoginAfterSessionExpiry();
  }

  function markUserActivity() {
    lastUserActivityAt = Date.now();
  }

  function shouldSendUserActivityHeader() {
    return Date.now() - lastUserActivityAt < 2 * 60 * 1000;
  }

  function bindUserActivityListeners() {
    if (typeof document === 'undefined') return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => {
      document.addEventListener(ev, markUserActivity, { passive: true, capture: true });
    });
  }

  function startSessionIdleWatch() {
    if (sessionWatchStarted) return;
    sessionWatchStarted = true;
    window.setInterval(() => {
      if (Date.now() - lastUserActivityAt < sessionIdleMs) return;
      if (!hadStoredUser()) return;
      void fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data && data.sessionExpired) redirectToLoginAfterSessionExpiry();
          else if (!data || !data.user) {
            if (hadStoredUser()) redirectToLoginAfterSessionExpiry();
          }
        })
        .catch(() => {
          /* сеть недоступна */
        });
    }, 45000);
  }

  async function ensureCsrf(forceRefresh) {
    if (csrfToken && !forceRefresh) return csrfToken;
    if (forceRefresh) csrfToken = null;
    try {
      const r = await fetch(`/api/csrf?_=${Date.now()}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!r.ok) return null;
      const j = await r.json();
      csrfToken = j.csrfToken || null;
      return csrfToken;
    } catch {
      return null;
    }
  }

  function resetCsrf() {
    csrfToken = null;
  }

  async function apiFetch(path, options = {}) {
    const opts = { ...options };
    const headers = { ...(opts.headers || {}) };
    const method = (opts.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      let t = await ensureCsrf(false);
      if (!t) t = await ensureCsrf(true);
      if (t) headers['X-CSRF-Token'] = t;
    }
    if (opts.markUserActivity !== false && shouldSendUserActivityHeader()) {
      headers['X-User-Activity'] = '1';
    }
    let body = opts.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    const r = await fetch(path, {
      ...opts,
      body,
      credentials: 'same-origin',
      headers,
    });
    return r;
  }

  async function apiJson(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isMutating = method !== 'GET' && method !== 'HEAD';

    async function doFetch() {
      const r = await apiFetch(path, options);
      const text = await r.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        return {
          r,
          parsed: {
            ok: false,
            status: r.status,
            /** Текст не показываем конечному пользователю — страницы сами подставляют нейтральное сообщение. */
            data: { error: '' },
          },
        };
      }
      return { r, parsed: { ok: r.ok, status: r.status, data } };
    }

    let { r, parsed } = await doFetch();
    if (isMutating && !r.ok && r.status === 403) {
      const errText = String(parsed?.data?.error || '').toLowerCase();
      if (errText.includes('csrf') || errText.includes('токен')) {
        resetCsrf();
        await ensureCsrf(true);
        ({ r, parsed } = await doFetch());
      }
    }
    if (!parsed.ok) {
      handleSessionAuthFailure(path, parsed.status, parsed.data);
    }
    return parsed;
  }

  /** С каждым перезапуском сервера — выход из «запомненных» аккаунтов на этом браузере + одно обновление вкладки. */
  async function reconcileServerBoot() {
    const SESSION_BOOT_KEY = 'ekvaline_server_boot';
    try {
      const r = await fetch('/api/client-boot', { credentials: 'same-origin' });
      if (!r.ok) return;
      const j = await r.json();
      const bootId = j && typeof j.bootId === 'string' ? j.bootId.trim() : '';
      const idleMin = Number(j?.sessionIdleMinutes);
      if (Number.isFinite(idleMin) && idleMin >= 5) {
        sessionIdleMs = idleMin * 60 * 1000;
      }
      if (!bootId) return;
      const prev = sessionStorage.getItem(SESSION_BOOT_KEY);
      if (prev === bootId) {
        bindUserActivityListeners();
        startSessionIdleWatch();
        return;
      }

      sessionStorage.setItem(SESSION_BOOT_KEY, bootId);

      if (prev !== null) {
        try {
          localStorage.removeItem('ekvaline_current_user');
          localStorage.removeItem('ekvaline_users');
        } catch {
          /* ignore */
        }
        resetCsrf();
        window.location.reload();
        return;
      }
      bindUserActivityListeners();
      startSessionIdleWatch();
    } catch {
      /* не тот origin / файл с диска */
      bindUserActivityListeners();
      startSessionIdleWatch();
    }
  }

  const bootReconciliationPromise = reconcileServerBoot();

  window.EkvalineAPI = {
    ensureCsrf,
    resetCsrf,
    fetch: apiFetch,
    json: apiJson,
    markUserActivity,
    redirectToLoginAfterSessionExpiry,
    /** Дождаться проверки перезапуска сервера (очистка LS / reload) до инициализации панелей. */
    awaitBootReconciliation: () => bootReconciliationPromise,
  };
})();
