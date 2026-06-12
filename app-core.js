/**
 * Клиентский кэш уведомлений (localStorage); контент блога и заказы — с сервера.
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

  /** Уведомления в колокольчике живут 3 суток с момента события. */
  const NOTIFICATION_TTL_MS = 3 * 24 * 60 * 60 * 1000;

  function notificationTimestampMs(n) {
    const t = new Date(n?.createdAt || 0).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  function isNotificationFresh(n) {
    return notificationTimestampMs(n) >= Date.now() - NOTIFICATION_TTL_MS;
  }

  function pruneExpiredNotifications(list, persist) {
    const src = Array.isArray(list) ? list : [];
    const fresh = src.filter(isNotificationFresh);
    if (persist && fresh.length !== src.length) {
      writeJson(KEYS.notifs, fresh);
    }
    return fresh;
  }

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
    /* Демо-данные отключены: уведомления приходят с сервера после входа. */
  }

  /** Совпадает с приветственной парой из seed / старыми записями без preset. */
  function isRegistrationWelcomeNotification(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.preset === 'welcome' || n.preset === 'delivery_intro') return true;
    if (n.title === 'Добро пожаловать в ЭкваЛайн') return true;
    if (n.title === 'Доставка в удобном окне') return true;
    return false;
  }

  function ensurePresetFlags(n) {
    if (!n || typeof n !== 'object') return;
    if (n.preset) return;
    if (n.title === 'Добро пожаловать в ЭкваЛайн') n.preset = 'welcome';
    else if (n.title === 'Доставка в удобном окне') n.preset = 'delivery_intro';
  }

  /** Вызывается после успешной регистрации: время двух приветственных уведомлений = момент регистрации. */
  function stampRegistrationWelcomeNotifications(isoTime) {
    const at = typeof isoTime === 'string' && isoTime ? isoTime : new Date().toISOString();

    if (!localStorage.getItem(KEYS.seeded)) {
      seedIfNeeded({ notificationCreatedAt: at });
      return;
    }

    const list = Api.getNotifications();
    let changed = false;
    for (const n of list) {
      if (!isRegistrationWelcomeNotification(n)) continue;
      n.createdAt = at;
      ensurePresetFlags(n);
      changed = true;
    }
    if (changed) {
      writeJson(KEYS.notifs, list);
      window.dispatchEvent(new CustomEvent('ekvaline-storage'));
    }
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
      return pruneExpiredNotifications(readJson(KEYS.notifs, []), true);
    },
    addNotification(item) {
      const list = this.getNotifications();
      list.unshift({
        id: uid(),
        read: false,
        createdAt: new Date().toISOString(),
        ...item,
      });
      writeJson(KEYS.notifs, pruneExpiredNotifications(list, false));
    },
    markNotificationRead(id) {
      const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
      writeJson(KEYS.notifs, list);
      if (typeof window.EkvalineNotificationsSync?.markReadOnServer === 'function') {
        void window.EkvalineNotificationsSync.markReadOnServer(id);
      }
    },
    markAllNotificationsRead() {
      const list = this.getNotifications().map((n) => ({ ...n, read: true }));
      writeJson(KEYS.notifs, list);
      if (typeof window.EkvalineNotificationsSync?.markAllOnServer === 'function') {
        void window.EkvalineNotificationsSync.markAllOnServer();
      }
    },
    mergeServerNotifications(serverRows) {
      const fromServer = (Array.isArray(serverRows) ? serverRows : [])
        .map((s) => ({
          id: `srv_${s.id}`,
          serverId: s.id,
          title: s.title || '',
          body: s.body || '',
          read: !!s.read,
          createdAt: s.created_at || new Date().toISOString(),
          type: s.type || 'order',
          orderId: s.order_id != null ? Number(s.order_id) : null,
        }))
        .filter(isNotificationFresh);
      const serverWelcomeTitles = new Set(
        fromServer
          .filter((n) => n.type === 'info' || n.type === 'delivery' || isRegistrationWelcomeNotification(n))
          .map((n) => n.title)
      );
      const localPresets = this.getNotifications()
        .filter((n) => isRegistrationWelcomeNotification(n))
        .filter((n) => !serverWelcomeTitles.has(n.title));
      const merged = pruneExpiredNotifications([...fromServer, ...localPresets], false);
      merged.sort((a, b) => notificationTimestampMs(b) - notificationTimestampMs(a));
      writeJson(KEYS.notifs, merged.slice(0, 60));
      window.dispatchEvent(new CustomEvent('ekvaline-storage'));
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

  function teardownNotificationsUI(mountEl) {
    if (!mountEl || mountEl.nodeType !== 1) return;
    if (mountEl._ekvalineNotifAbort instanceof AbortController) {
      try {
        mountEl._ekvalineNotifAbort.abort();
      } catch {
        /* ignore */
      }
    }
    mountEl._ekvalineNotifAbort = null;
    mountEl.innerHTML = '';
    delete mountEl.dataset.notifInited;
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

    const ac = new AbortController();
    mountEl._ekvalineNotifAbort = ac;

    const notifMobileMq = window.matchMedia('(max-width: 1020px)');

    function isNotifMobileSheet() {
      return notifMobileMq.matches;
    }

    function getNotifMobilePortal() {
      let portal = document.getElementById('ekvalineNotifPortal');
      if (!portal) {
        portal = document.createElement('div');
        portal.id = 'ekvalineNotifPortal';
        portal.className = 'notif-mobile-portal';
        portal.setAttribute('aria-hidden', 'true');
        document.body.appendChild(portal);
      }
      return portal;
    }

    function dockNotifDropdown() {
      if (!isNotifMobileSheet()) return;
      if (!dropdown._notifDock) {
        dropdown._notifDock = {
          parent: dropdown.parentElement,
          next: dropdown.nextElementSibling,
        };
      }
      const portal = getNotifMobilePortal();
      portal.setAttribute('aria-hidden', 'false');
      if (dropdown.parentElement !== portal) {
        portal.appendChild(dropdown);
      }
    }

    function restoreNotifDropdown() {
      const dock = dropdown._notifDock;
      const portal = document.getElementById('ekvalineNotifPortal');
      if (portal) portal.setAttribute('aria-hidden', 'true');
      if (!dock?.parent) return;
      if (dropdown.parentElement !== portal && dropdown.parentElement !== document.body) return;
      const { parent, next } = dock;
      if (next && next.parentElement === parent) {
        parent.insertBefore(dropdown, next);
      } else {
        parent.appendChild(dropdown);
      }
    }

    function syncNotifDropdownPlacement() {
      if (dropdown.hasAttribute('hidden')) {
        restoreNotifDropdown();
        return;
      }
      if (isNotifMobileSheet()) dockNotifDropdown();
      else restoreNotifDropdown();
    }

    function toggle(open) {
      const willOpen = open != null ? open : dropdown.hasAttribute('hidden');
      if (willOpen) {
        dockNotifDropdown();
        dropdown.removeAttribute('hidden');
        bell.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.setAttribute('hidden', '');
        bell.setAttribute('aria-expanded', 'false');
        restoreNotifDropdown();
      }
      document.body.classList.toggle('notif-dropdown-open', !dropdown.hasAttribute('hidden'));
    }

    notifMobileMq.addEventListener('change', () => syncNotifDropdownPlacement(), { signal: ac.signal });

    const notifPortal = getNotifMobilePortal();
    notifPortal.addEventListener(
      'click',
      (e) => {
        if (e.target === notifPortal) toggle(false);
      },
      { signal: ac.signal },
    );

    bell.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        toggle();
        if (!dropdown.hasAttribute('hidden')) renderNotificationsPanel(wrap, listEl);
      },
      { signal: ac.signal },
    );

    readAll.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        Api.markAllNotificationsRead();
        renderNotificationsPanel(wrap, listEl);
      },
      { signal: ac.signal },
    );

    document.addEventListener(
      'click',
      () => {
        if (!dropdown.hasAttribute('hidden')) toggle(false);
      },
      { signal: ac.signal },
    );

    dropdown.addEventListener('click', (e) => e.stopPropagation(), { signal: ac.signal });

    window.addEventListener('ekvaline-storage', () => renderNotificationsPanel(wrap, listEl), { signal: ac.signal });

    renderNotificationsPanel(wrap, listEl);
  }

  migrateNotifDeliveryIntervals();

  window.EkvalineApp = {
    ...Api,
    escapeHtml,
    uid,
    initNotificationsUI,
    teardownNotificationsUI,
    formatTime,
    stampRegistrationWelcomeNotifications,
  };
})();
