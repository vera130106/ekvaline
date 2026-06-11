/**
 * Защита от подмены в DevTools (localStorage, DOM): доступ только по сессии сервера.
 * F12 нельзя «закрыть», но без валидной cookie сессии API не выполнит действие.
 */
(function () {
  'use strict';

  const CURRENT_USER_KEY = 'ekvaline_current_user';

  const PAGE_ROLES = Object.freeze({
    'admin.html': ['admin'],
    'operator.html': ['operator', 'manager', 'admin'],
    'manager.html': ['manager', 'admin'],
    'driver.html': ['driver'],
    'cabinet.html': ['client'],
  });

  let pageSessionPromise = null;
  let integrityWatchStarted = false;

  function currentPageLeaf() {
    try {
      return String(window.location.pathname || '')
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .toLowerCase();
    } catch {
      return '';
    }
  }

  function allowedRolesForPage() {
    return PAGE_ROLES[currentPageLeaf()] || null;
  }

  function roleAllowed(role, allowed) {
    const r = String(role || '').toLowerCase();
    return allowed.some((a) => a === r);
  }

  function clearStoredUser() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('ekvaline_users');
    } catch {
      /* ignore */
    }
    window.EkvalineAPI?.resetCsrf?.();
  }

  function persistUser(user) {
    if (!user || !user.id) return;
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }

  function reconcileStoredUserWithServer(user) {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) {
        persistUser(user);
        return;
      }
      const stored = JSON.parse(raw);
      const sameRole = String(stored?.role || '').toLowerCase() === String(user.role || '').toLowerCase();
      const sameId = Number(stored?.id) === Number(user.id);
      if (!sameRole || !sameId) {
        clearStoredUser();
      }
      persistUser(user);
    } catch {
      clearStoredUser();
      persistUser(user);
    }
  }

  function redirectHome(sessionExpired) {
    const q = sessionExpired ? 'session-expired=1' : 'need-login=1';
    try {
      window.location.replace(new URL(`index.html?${q}`, window.location.href).href);
    } catch {
      window.location.replace(`index.html?${q}`);
    }
  }

  async function requirePageSession() {
    const allowed = allowedRolesForPage();
    if (!allowed) return { ok: true, user: null, page: currentPageLeaf() };

    const api = window.EkvalineAPI;
    if (!api?.json) {
      redirectHome(false);
      return { ok: false, user: null, page: currentPageLeaf() };
    }

    try {
      await api.awaitBootReconciliation?.();
    } catch {
      /* ignore */
    }

    const me = await api.json('/api/auth/me');
    if (!me.ok || !me.data?.user) {
      clearStoredUser();
      redirectHome(!!me.data?.sessionExpired);
      return { ok: false, user: null, page: currentPageLeaf() };
    }

    const user = me.data.user;
    if (!roleAllowed(user.role, allowed)) {
      clearStoredUser();
      redirectHome(false);
      return { ok: false, user: null, page: currentPageLeaf() };
    }

    reconcileStoredUserWithServer(user);
    return { ok: true, user, page: currentPageLeaf() };
  }

  function ensurePageSession() {
    if (!pageSessionPromise) pageSessionPromise = requirePageSession();
    return pageSessionPromise;
  }

  function startIntegrityWatch() {
    if (integrityWatchStarted || !allowedRolesForPage()) return;
    integrityWatchStarted = true;
    window.setInterval(() => {
      pageSessionPromise = null;
      void requirePageSession();
    }, 45000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        pageSessionPromise = null;
        void requirePageSession();
      }
    });
  }

  async function bootProtectedPage() {
    const result = await ensurePageSession();
    if (result.ok && allowedRolesForPage()) startIntegrityWatch();
    window.dispatchEvent(new CustomEvent('ekvaline:page-session-ready', { detail: result }));
    return result;
  }

  window.EkvalineClientGuard = {
    allowedRolesForPage,
    ensurePageSession,
    requirePageSession,
    clearStoredUser,
    persistUser,
    bootProtectedPage,
  };

  if (allowedRolesForPage()) {
    try {
      const style = document.createElement('style');
      style.textContent = 'html.ek-guard-pending body{visibility:hidden}';
      (document.head || document.documentElement).appendChild(style);
      document.documentElement.classList.add('ek-guard-pending');
    } catch {
      /* ignore */
    }
    void bootProtectedPage().then((result) => {
      if (result.ok) {
        document.documentElement.classList.remove('ek-guard-pending');
        document.documentElement.classList.add('ek-guard-ready');
      }
    });
  }
})();
