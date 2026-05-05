/**
 * Клиент API (сессия + CSRF). Работает при открытии сайта через node server.js.
 */
(function () {
  let csrfToken = null;

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
    const headers = { ...(options.headers || {}) };
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      let t = await ensureCsrf(false);
      if (!t) t = await ensureCsrf(true);
      if (t) headers['X-CSRF-Token'] = t;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const r = await fetch(path, {
      ...options,
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
            data: {
              error:
                'Ответ сервера не JSON (часто это HTML страницы). Запустите в папке проекта npm start и откройте http://localhost:3001 — не Live Server и не открытие HTML-файла с диска.',
            },
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
      if (!bootId) return;
      const prev = sessionStorage.getItem(SESSION_BOOT_KEY);
      if (prev === bootId) return;

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
      }
    } catch {
      /* не тот origin / файл с диска */
    }
  }

  window.EkvalineAPI = {
    ensureCsrf,
    resetCsrf,
    fetch: apiFetch,
    json: apiJson,
  };

  void reconcileServerBoot();
})();
