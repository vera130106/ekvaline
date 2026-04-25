/**
 * Общие данные (localStorage): уведомления, лента сообщества, опросы, режим работы.
 * Для демонстрации без бэкенда; в продакшене — API + HTTPS + серверный bcrypt.
 */
(function () {
  const NS = 'ekvaline_';
  const KEYS = {
    notifs: NS + 'notifications',
    posts: NS + 'community_posts',
    polls: NS + 'community_polls',
    settings: NS + 'site_settings',
    seeded: NS + 'data_seeded_v2',
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('ekvaline-storage'));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function uid() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function seedIfNeeded() {
    if (localStorage.getItem(KEYS.seeded)) return;

    const now = new Date().toISOString();
    writeJson(KEYS.notifs, [
      {
        id: uid(),
        title: 'Добро пожаловать в ЭкваЛайн',
        body: 'Следите за акциями и статусом заказов в этом центре уведомлений.',
        createdAt: now,
        read: false,
        type: 'info',
      },
      {
        id: uid(),
        title: 'Доставка в удобном окне',
        body: 'Выберите интервал 09:00 – 14:00, 14:00 – 17:00 или 17:00 – 21:00 при оформлении заказа.',
        createdAt: now,
        read: false,
        type: 'delivery',
      },
    ]);

    writeJson(KEYS.settings, {
      workLine: 'Пн–Сб 8:00–21:00, Вс 9:00–18:00',
      deliverySlots: ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'],
      communityIntro: 'Новости, советы о воде и здоровом образе жизни от ЭкваЛайн.',
    });

    writeJson(KEYS.posts, [
      {
        id: uid(),
        title: 'Почему важно пить воду утром',
        body: 'Стакан чистой воды после сна запускает обмен веществ и помогает организму проснуться без лишней нагрузки на сердце.',
        createdAt: now,
        likes: [],
        comments: [],
      },
      {
        id: uid(),
        title: 'Как хранить бутилированную воду',
        body: 'Держите бутыль в прохладном месте, вдали от прямых солнечных лучей и бытовой химии.',
        createdAt: now,
        likes: [],
        comments: [],
      },
    ]);

    writeJson(KEYS.polls, [
      {
        id: uid(),
        question: 'Сколько литров воды вы пьёте в день?',
        options: [
          { id: 'a', text: 'До 1 л', votes: [] },
          { id: 'b', text: '1–2 л', votes: [] },
          { id: 'c', text: 'Более 2 л', votes: [] },
        ],
        createdAt: now,
      },
    ]);

    localStorage.setItem(KEYS.seeded, '1');
  }

  /** Одноразово обновляет текст старых уведомлений про интервалы доставки. */
  function migrateNotifDeliveryIntervals() {
    const mkey = NS + 'migrate_delivery_intervals_v1';
    if (localStorage.getItem(mkey)) return;
    const list = readJson(KEYS.notifs, []);
    const newBody = 'Выберите интервал 09:00 – 14:00, 14:00 – 17:00 или 17:00 – 21:00 при оформлении заказа.';
    let changed = false;
    for (const n of list) {
      if (n && typeof n.body === 'string' && /9[–-]14/.test(n.body) && /17[–-]21/.test(n.body)) {
        n.body = newBody;
        changed = true;
      }
    }
    if (changed) writeJson(KEYS.notifs, list);
    localStorage.setItem(mkey, '1');
  }

  const Api = {
    getNotifications() {
      return readJson(KEYS.notifs, []);
    },
    addNotification(item) {
      const list = this.getNotifications();
      list.unshift({
        id: uid(),
        read: false,
        createdAt: new Date().toISOString(),
        ...item,
      });
      writeJson(KEYS.notifs, list);
    },
    markNotificationRead(id) {
      const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
      writeJson(KEYS.notifs, list);
    },
    markAllNotificationsRead() {
      const list = this.getNotifications().map((n) => ({ ...n, read: true }));
      writeJson(KEYS.notifs, list);
    },
    unreadCount() {
      return this.getNotifications().filter((n) => !n.read).length;
    },

    getSettings() {
      return readJson(KEYS.settings, {});
    },
    saveSettings(partial) {
      writeJson(KEYS.settings, { ...this.getSettings(), ...partial });
    },

    getPosts() {
      return readJson(KEYS.posts, []);
    },
    savePosts(posts) {
      writeJson(KEYS.posts, posts);
    },
    addPost(post) {
      const posts = this.getPosts();
      posts.unshift({
        id: uid(),
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        ...post,
      });
      this.savePosts(posts);
    },
    updatePost(id, patch) {
      const posts = this.getPosts().map((p) => (p.id === id ? { ...p, ...patch } : p));
      this.savePosts(posts);
    },
    deletePost(id) {
      this.savePosts(this.getPosts().filter((p) => p.id !== id));
    },

    toggleLike(postId, userKey) {
      const posts = this.getPosts();
      const i = posts.findIndex((p) => p.id === postId);
      if (i < 0) return;
      const likes = posts[i].likes || [];
      const has = likes.includes(userKey);
      posts[i].likes = has ? likes.filter((x) => x !== userKey) : [...likes, userKey];
      this.savePosts(posts);
    },

    addComment(postId, userKey, displayName, text) {
      const t = String(text || '').trim();
      if (!t || t.length > 800) return false;
      const posts = this.getPosts();
      const i = posts.findIndex((p) => p.id === postId);
      if (i < 0) return false;
      posts[i].comments = posts[i].comments || [];
      posts[i].comments.push({
        id: uid(),
        userKey,
        displayName: displayName || 'Гость',
        text: t,
        createdAt: new Date().toISOString(),
      });
      this.savePosts(posts);
      return true;
    },

    getPolls() {
      return readJson(KEYS.polls, []);
    },
    savePolls(polls) {
      writeJson(KEYS.polls, polls);
    },
    addPoll(poll) {
      const polls = this.getPolls();
      polls.unshift({ id: uid(), createdAt: new Date().toISOString(), ...poll });
      this.savePolls(polls);
    },
    deletePoll(id) {
      this.savePolls(this.getPolls().filter((p) => p.id !== id));
    },
    votePoll(pollId, optionId, voterKey) {
      const polls = this.getPolls();
      const pi = polls.findIndex((p) => p.id === pollId);
      if (pi < 0) return false;
      const poll = polls[pi];
      poll.options.forEach((opt) => {
        opt.votes = (opt.votes || []).filter((v) => v !== voterKey);
      });
      const opt = poll.options.find((o) => o.id === optionId);
      if (!opt) return false;
      opt.votes = opt.votes || [];
      if (!opt.votes.includes(voterKey)) opt.votes.push(voterKey);
      this.savePolls(polls);
      return true;
    },
  };

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    } catch {
      return '';
    }
  }

  function renderNotificationsPanel(wrap, dropdown) {
    const list = Api.getNotifications();
    const unread = Api.unreadCount();
    wrap.querySelector('.notif-bell-badge').style.display = unread > 0 ? 'inline-flex' : 'none';
    wrap.querySelector('.notif-bell-badge').textContent = unread > 9 ? '9+' : String(unread);

    if (!list.length) {
      dropdown.innerHTML = '<p class="notif-empty">Пока нет уведомлений</p>';
      return;
    }
    dropdown.innerHTML = list
      .slice(0, 12)
      .map(
        (n) => `
      <button type="button" class="notif-item ${n.read ? 'is-read' : ''}" data-notif-id="${escapeHtml(n.id)}">
        <span class="notif-item-title">${escapeHtml(n.title)}</span>
        <span class="notif-item-body">${escapeHtml(n.body)}</span>
        <span class="notif-item-time">${formatTime(n.createdAt)}</span>
      </button>
    `
      )
      .join('');

    dropdown.querySelectorAll('[data-notif-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Api.markNotificationRead(btn.getAttribute('data-notif-id'));
        renderNotificationsPanel(wrap, dropdown);
      });
    });
  }

  function initNotificationsUI(mountEl) {
    if (!mountEl || mountEl.dataset.notifInited === '1') return;
    mountEl.dataset.notifInited = '1';
    seedIfNeeded();

    mountEl.innerHTML = `
      <div class="notifications-wrap">
        <button type="button" class="notif-bell" id="notifBell" aria-expanded="false" aria-haspopup="true" aria-label="Уведомления">
          <span class="notif-bell-icon" aria-hidden="true">
            <svg class="notif-bell-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="notif-bell-badge" style="display:none">0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown" hidden role="menu">
          <div class="notif-dropdown-head">
            <span>Уведомления</span>
            <button type="button" class="notif-read-all" id="notifReadAll">Прочитать все</button>
          </div>
          <div class="notif-dropdown-body" id="notifList"></div>
        </div>
      </div>
    `;

    const wrap = mountEl.querySelector('.notifications-wrap');
    const bell = mountEl.querySelector('#notifBell');
    const dropdown = mountEl.querySelector('#notifDropdown');
    const listEl = mountEl.querySelector('#notifList');
    const readAll = mountEl.querySelector('#notifReadAll');

    function toggle(open) {
      const isOpen = open != null ? open : dropdown.hasAttribute('hidden');
      if (isOpen) {
        dropdown.removeAttribute('hidden');
        bell.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.setAttribute('hidden', '');
        bell.setAttribute('aria-expanded', 'false');
      }
    }

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
      if (!dropdown.hasAttribute('hidden')) renderNotificationsPanel(wrap, listEl);
    });

    readAll.addEventListener('click', (e) => {
      e.stopPropagation();
      Api.markAllNotificationsRead();
      renderNotificationsPanel(wrap, listEl);
    });

    document.addEventListener('click', () => {
      if (!dropdown.hasAttribute('hidden')) toggle(false);
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());

    window.addEventListener('ekvaline-storage', () => renderNotificationsPanel(wrap, listEl));

    renderNotificationsPanel(wrap, listEl);
  }

  seedIfNeeded();
  migrateNotifDeliveryIntervals();

  window.EkvalineApp = {
    ...Api,
    escapeHtml,
    uid,
    initNotificationsUI,
    formatTime,
  };
})();
