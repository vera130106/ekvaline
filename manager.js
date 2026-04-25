(function () {
  const E = window.EkvalineApp;
  if (!E) return;

  function isManagerRole(u) {
    return u && (u.role === 'manager' || u.role === 'admin');
  }

  function readUser() {
    try {
      return JSON.parse(localStorage.getItem('ekvaline_current_user') || 'null');
    } catch {
      return null;
    }
  }

  function showApp(show) {
    const gate = document.getElementById('managerGate');
    const app = document.getElementById('managerApp');
    if (gate) gate.classList.toggle('hidden', show);
    if (app) app.classList.toggle('hidden', !show);
  }

  async function loadSettingsForm() {
    if (window.EkvalineAPI) {
      const { ok, data } = await window.EkvalineAPI.json('/api/manager/settings');
      if (ok && data) {
        const wl = document.getElementById('mgrWorkLine');
        const intro = document.getElementById('mgrIntro');
        const slots = document.getElementById('mgrSlots');
        if (wl) wl.value = data.workLine || '';
        if (intro) intro.value = data.communityIntro || '';
        if (slots) slots.value = (data.deliverySlots || []).join('\n');
        E.saveSettings({
          workLine: data.workLine || '',
          communityIntro: data.communityIntro || '',
          deliverySlots: data.deliverySlots || [],
        });
        return;
      }
    }
    const s = E.getSettings();
    const wl = document.getElementById('mgrWorkLine');
    const intro = document.getElementById('mgrIntro');
    const slots = document.getElementById('mgrSlots');
    if (wl) wl.value = s.workLine || '';
    if (intro) intro.value = s.communityIntro || '';
    if (slots) slots.value = (s.deliverySlots || []).join('\n');
  }

  async function saveSettingsForm() {
    const slotsRaw = document.getElementById('mgrSlots').value;
    const slots = slotsRaw
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    const payload = {
      workLine: document.getElementById('mgrWorkLine').value.trim(),
      communityIntro: document.getElementById('mgrIntro').value.trim(),
      deliverySlots: slots.length ? slots : ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'],
    };
    if (window.EkvalineAPI) {
      const { ok, data } = await window.EkvalineAPI.json('/api/manager/settings', {
        method: 'PUT',
        body: payload,
      });
      if (!ok) {
        alert(data.error || 'Ошибка сохранения (нужен вход менеджера и сервер npm start).');
        return;
      }
      window.EkvalineAPI.resetCsrf();
      E.saveSettings({
        workLine: payload.workLine,
        communityIntro: payload.communityIntro,
        deliverySlots: payload.deliverySlots,
      });
      alert('Сохранено в базе данных.');
      return;
    }
    E.saveSettings(payload);
    alert('Сохранено локально (без сервера).');
  }

  function renderPostList() {
    const root = document.getElementById('mgrPostList');
    if (!root) return;
    const posts = E.getPosts();
    root.innerHTML = posts
      .map(
        (p) => `
      <div class="mgr-row">
        <div>
          <strong>${E.escapeHtml(p.title)}</strong>
          <p class="mgr-row-meta">${E.formatTime(p.createdAt)}</p>
        </div>
        <button type="button" class="ghost-btn small-btn" data-del-post="${E.escapeHtml(p.id)}">Удалить</button>
      </div>
    `
      )
      .join('');
    root.querySelectorAll('[data-del-post]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Удалить публикацию?')) {
          E.deletePost(btn.getAttribute('data-del-post'));
          renderPostList();
        }
      });
    });
  }

  function renderPollList() {
    const root = document.getElementById('mgrPollList');
    if (!root) return;
    const polls = E.getPolls();
    root.innerHTML = polls
      .map(
        (p) => `
      <div class="mgr-row">
        <div>
          <strong>${E.escapeHtml(p.question)}</strong>
          <p class="mgr-row-meta">${E.formatTime(p.createdAt)}</p>
        </div>
        <button type="button" class="ghost-btn small-btn" data-del-poll="${E.escapeHtml(p.id)}">Удалить</button>
      </div>
    `
      )
      .join('');
    root.querySelectorAll('[data-del-poll]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Удалить опрос?')) {
          E.deletePoll(btn.getAttribute('data-del-poll'));
          renderPollList();
        }
      });
    });
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.manager-tab');
    const panels = document.querySelectorAll('.manager-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        panels.forEach((p) => p.classList.toggle('hidden', p.getAttribute('data-panel') !== id));
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const user = readUser();
    if (isManagerRole(user)) {
      showApp(true);
      const w = document.getElementById('managerWelcome');
      if (w) w.textContent = `${user.name || 'Менеджер'} — редактирование ленты и уведомлений`;
      loadSettingsForm();
      renderPostList();
      renderPollList();
      setupTabs();

      document.getElementById('mgrSaveSettings').addEventListener('click', saveSettingsForm);

      document.getElementById('mgrAddPost').addEventListener('click', () => {
        const title = document.getElementById('mgrPostTitle').value.trim();
        const body = document.getElementById('mgrPostBody').value.trim();
        if (title.length < 2 || body.length < 10) {
          alert('Заполните заголовок и текст (от 10 символов).');
          return;
        }
        E.addPost({ title, body });
        document.getElementById('mgrPostTitle').value = '';
        document.getElementById('mgrPostBody').value = '';
        renderPostList();
      });

      document.getElementById('mgrAddPoll').addEventListener('click', () => {
        const q = document.getElementById('mgrPollQ').value.trim();
        const lines = document
          .getElementById('mgrPollOpts')
          .value.split('\n')
          .map((x) => x.trim())
          .filter(Boolean);
        if (q.length < 3 || lines.length < 2) {
          alert('Нужен вопрос и минимум 2 варианта.');
          return;
        }
        const options = lines.map((t, i) => ({
          id: `opt_${i}_${Date.now()}`,
          text: t,
          votes: [],
        }));
        E.addPoll({ question: q, options });
        document.getElementById('mgrPollQ').value = '';
        document.getElementById('mgrPollOpts').value = '';
        renderPollList();
      });

      document.getElementById('mgrSendNotif').addEventListener('click', () => {
        const title = document.getElementById('mgrNTitle').value.trim();
        const body = document.getElementById('mgrNBody').value.trim();
        if (title.length < 2 || body.length < 5) {
          alert('Заполните заголовок и текст.');
          return;
        }
        E.addNotification({ title, body, type: 'promo' });
        document.getElementById('mgrNTitle').value = '';
        document.getElementById('mgrNBody').value = '';
        alert('Уведомление добавлено в шапку у всех пользователей.');
      });
    } else {
      showApp(false);
    }

    window.addEventListener('storage', () => {
      const u = readUser();
      if (isManagerRole(u)) location.reload();
    });

    document.getElementById('mgrLogoutBtn')?.addEventListener('click', async () => {
      try {
        if (window.EkvalineAPI) await window.EkvalineAPI.json('/api/auth/logout', { method: 'POST' });
      } catch {
        /* ignore */
      }
      window.EkvalineAPI?.resetCsrf();
      localStorage.removeItem('ekvaline_current_user');
      showApp(false);
      location.reload();
    });
  });
})();
