/**
 * Синхронизация уведомлений клиента с сервером (статусы заказов).
 */
(function initClientNotificationsSync() {
  const api = window.EkvalineAPI;
  if (!api) return;

  let pollTimer = null;
  let lastFingerprint = '';

  function readCurrentClientUser() {
    try {
      const raw = window.localStorage.getItem('ekvaline_current_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user?.id) return null;
      const role = String(user.role || 'client').toLowerCase();
      if (role && role !== 'client') return null;
      return user;
    } catch {
      return null;
    }
  }

  function fingerprint(rows) {
    return (rows || []).map((r) => `${r.id}:${r.read ? 1 : 0}:${r.created_at || ''}`).join('|');
  }

  async function pull() {
    if (!readCurrentClientUser()) return;
    const response = await api.json('/api/notifications/my');
    if (!response.ok) return;
    const rows = Array.isArray(response.data?.notifications) ? response.data.notifications : [];
    const fp = fingerprint(rows);
    if (fp === lastFingerprint) return;
    lastFingerprint = fp;
    if (typeof window.EkvalineApp?.mergeServerNotifications === 'function') {
      window.EkvalineApp.mergeServerNotifications(rows);
    }
  }

  async function markReadOnServer(localId) {
    const match = /^srv_(\d+)$/.exec(String(localId || ''));
    if (!match) return;
    await api.json(`/api/notifications/${match[1]}/read`, { method: 'PATCH' });
    api.resetCsrf?.();
    lastFingerprint = '';
    void pull();
  }

  async function markAllOnServer() {
    if (!readCurrentClientUser()) return;
    await api.json('/api/notifications/read-all', { method: 'POST' });
    api.resetCsrf?.();
    lastFingerprint = '';
    await pull();
  }

  function startPolling() {
    if (pollTimer != null) return;
    void pull();
    pollTimer = window.setInterval(() => void pull(), 12000);
    window.addEventListener('focus', () => void pull());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void pull();
    });
  }

  function stopPolling() {
    if (pollTimer != null) window.clearInterval(pollTimer);
    pollTimer = null;
    lastFingerprint = '';
  }

  window.EkvalineNotificationsSync = {
    ...(window.EkvalineNotificationsSync || {}),
    refresh: pull,
    markReadOnServer,
    markAllOnServer,
    start: startPolling,
    stop: stopPolling,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPolling, { once: true });
  } else {
    startPolling();
  }
})();
