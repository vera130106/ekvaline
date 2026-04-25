/**
 * Клиент API (сессия + CSRF). Работает при открытии сайта через node server.js.
 */
(function () {
  let csrfToken = null;

  async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    try {
      const r = await fetch('/api/csrf', { credentials: 'same-origin' });
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
      const t = await ensureCsrf();
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
    const r = await apiFetch(path, options);
    const text = await r.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: r.status,
        data: {
          error:
            'Ответ сервера не JSON (часто это HTML страницы). Запустите в папке проекта npm start и откройте http://localhost:3001 — не Live Server и не открытие HTML-файла с диска.',
        },
      };
    }
    return { ok: r.ok, status: r.status, data };
  }

  window.EkvalineAPI = {
    ensureCsrf,
    resetCsrf,
    fetch: apiFetch,
    json: apiJson,
  };
})();
