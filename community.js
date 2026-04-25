(function () {
  const E = window.EkvalineApp;
  if (!E) return;

  const HEART_SVG = `<svg class="like-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="like-icon-path" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const EXTRA_REACTIONS = [
    { id: 'fire', icon: '🔥', label: 'Полезно' },
    { id: 'idea', icon: '💡', label: 'Идея' },
    { id: 'wow', icon: '😮', label: 'Вау' },
    { id: 'check', icon: '✅', label: 'Нужно' },
    { id: 'care', icon: '🤝', label: 'Поддерживаю' },
  ];
  const REACTION_KEY = 'ekvaline_blog_reactions_v1';
  const SAVED_KEY = 'ekvaline_blog_saved_posts_v1';
  const VIEWS_KEY = 'ekvaline_blog_views_v1';
  const PINNED_KEY = 'ekvaline_blog_pinned_v1';
  const ENRICH_KEY = 'ekvaline_blog_seed_enriched_v1';

  const state = {
    topic: 'all',
    search: '',
    tab: 'all',
  };

  function guestKey() {
    let k = sessionStorage.getItem('ekvaline_guest_key');
    if (!k) {
      k = `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('ekvaline_guest_key', k);
    }
    return k;
  }

  function displayName() {
    try {
      const u = JSON.parse(localStorage.getItem('ekvaline_current_user') || 'null');
      if (u && u.name) return u.name;
    } catch {
      /* ignore */
    }
    return 'Гость';
  }

  /** Короткое время для ленты (как в соцсетях). */
  function formatFeedTime(iso) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      const now = new Date();
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 50) return 'только что';
      if (diffSec < 3600) {
        const m = Math.floor(diffSec / 60);
        return m < 1 ? 'только что' : `${m} мин назад`;
      }
      if (diffSec < 86400) {
        const h = Math.floor(diffSec / 3600);
        return `${h} ч назад`;
      }
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yestStart = new Date(dayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      if (d >= yestStart && d < dayStart) {
        return `вчера в ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      }
      return E.formatTime(iso);
    } catch {
      return '';
    }
  }

  function initialFromName(name) {
    const s = String(name || '?').trim();
    const ch = s[0] || '?';
    return ch.toLocaleUpperCase('ru-RU');
  }

  function readJsonSafe(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function writeJsonSafe(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getReactionsMap() {
    return readJsonSafe(REACTION_KEY, {});
  }

  function setReactionsMap(v) {
    writeJsonSafe(REACTION_KEY, v);
  }

  function getSavedSet() {
    return new Set(readJsonSafe(SAVED_KEY, []));
  }

  function setSavedSet(set) {
    writeJsonSafe(SAVED_KEY, Array.from(set));
  }

  function getViewsMap() {
    return readJsonSafe(VIEWS_KEY, {});
  }

  function setViewsMap(v) {
    writeJsonSafe(VIEWS_KEY, v);
  }

  function ensureViews(posts, viewerKey) {
    const map = getViewsMap();
    let changed = false;
    posts.forEach((post) => {
      const arr = Array.isArray(map[post.id]) ? map[post.id] : [];
      if (!arr.includes(viewerKey)) {
        map[post.id] = [...arr, viewerKey];
        changed = true;
      }
    });
    if (changed) setViewsMap(map);
  }

  function getPinnedIds() {
    return readJsonSafe(PINNED_KEY, []);
  }

  function initPinnedIds(posts) {
    const current = getPinnedIds();
    if (current.length) return current;
    const seeded = [...posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .map((p) => p.id);
    writeJsonSafe(PINNED_KEY, seeded);
    return seeded;
  }

  function inferTopic(post) {
    const text = `${post.title || ''} ${post.body || ''}`.toLowerCase();
    if (/достав|оператор|сервис|заказ|клиент|поддерж/.test(text)) return 'service';
    if (/новост|запуск|обновл|акци|анонс/.test(text)) return 'news';
    if (/здоров|сон|энерг|привыч|стресс/.test(text)) return 'zog';
    return 'analysis';
  }

  function topicLabel(topic) {
    if (topic === 'zog') return 'зож';
    if (topic === 'service') return 'сервис';
    if (topic === 'news') return 'новости';
    return 'разбор';
  }

  function enrichBlogData() {
    if (localStorage.getItem(ENRICH_KEY)) return;
    const posts = E.getPosts();
    if (posts.length < 4) {
      E.addPost({
        title: '5 привычек для здорового питьевого режима',
        body: 'Поставьте воду на видное место, начинайте утро со стакана воды, пейте маленькими порциями, добавьте напоминания и выбирайте удобную тару.',
        image: 'assets/popular-2.png',
      });
      E.addPost({
        title: 'Как работает доставка ЭкваЛайн: от заявки до двери',
        body: 'Оператор подтверждает заказ, логист подбирает маршрут, курьер привозит в выбранное окно доставки. Можно оформить регулярный график.',
        image: 'assets/popular-3.png',
      });
      E.addPost({
        title: 'Что проверяет лаборатория перед розливом воды',
        body: 'Каждая партия проходит контроль прозрачности, минерального состава и микробиологических показателей. Это основа стабильного качества.',
        image: 'assets/popular-1.png',
      });
    }
    const polls = E.getPolls();
    if (polls.length < 2) {
      E.addPoll({
        question: 'Какой формат постов вам удобнее читать?',
        options: [
          { id: 'a', text: 'Короткие советы', votes: [] },
          { id: 'b', text: 'Подробные разборы', votes: [] },
          { id: 'c', text: 'Чек-листы и инструкции', votes: [] },
        ],
      });
    }
    localStorage.setItem(ENRICH_KEY, '1');
  }

  function filteredPosts() {
    const all = E.getPosts();
    return all.filter((post) => {
      const topic = inferTopic(post);
      const byTopic = state.topic === 'all' || topic === state.topic;
      const q = state.search.trim().toLowerCase();
      const bySearch = !q || `${post.title || ''} ${post.body || ''}`.toLowerCase().includes(q);
      const saved = getSavedSet();
      const byTab = state.tab === 'saved' ? saved.has(post.id) : true;
      return byTopic && bySearch && byTab;
    });
  }

  function postMetrics(post, reactionsMap, viewsMap) {
    const views = Array.isArray(viewsMap[post.id]) ? viewsMap[post.id].length : 0;
    const likes = (post.likes || []).length;
    const comments = (post.comments || []).length;
    const extra = EXTRA_REACTIONS.reduce((sum, r) => {
      const arr = (reactionsMap[post.id] && reactionsMap[post.id][r.id]) || [];
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
    return { views, likes, comments, extra, score: likes * 2 + comments * 2 + extra + views };
  }

  function buildReactionButton(postId, reactionId, label, icon, currentMap, viewerKey) {
    const byPost = currentMap[postId] || {};
    const voters = Array.isArray(byPost[reactionId]) ? byPost[reactionId] : [];
    const active = voters.includes(viewerKey);
    return `
      <button type="button" class="reaction-btn ${active ? 'is-active' : ''}" data-reaction-post="${E.escapeHtml(postId)}" data-reaction-id="${reactionId}" aria-pressed="${active}">
        <span class="reaction-emoji" aria-hidden="true">${icon}</span>
        <span class="reaction-label">${label}</span>
        <span class="reaction-count">${voters.length}</span>
      </button>
    `;
  }

  function getPostImage(post, index) {
    if (post && post.image) return post.image;
    const byTopic = {
      water: ['assets/popular-1.png', 'assets/product-18-9-white.png', 'assets/two-bottles.png'],
      zog: ['assets/popular-2.png', 'assets/one-bottle.png', 'assets/product-5.png'],
      service: ['assets/popular-3.png', 'assets/cooler-vatten.png', 'assets/vatten-l45-ne.png'],
      news: ['assets/product-2-4.png', 'assets/five-bottles.png', 'assets/popular-3.png'],
      analysis: ['assets/logo.png', 'assets/product-18-9-white.png', 'assets/popular-1.png'],
    };
    const topic = inferTopic(post);
    const pool = byTopic[topic] || byTopic.water;
    return pool[index % pool.length];
  }

  function renderPinnedPosts(allPosts) {
    const root = document.getElementById('communityPinnedFeed');
    if (!root) return;
    const pinnedIds = initPinnedIds(allPosts);
    const map = new Map(allPosts.map((p) => [p.id, p]));
    const items = pinnedIds.map((id) => map.get(id)).filter(Boolean).slice(0, 2);
    if (!items.length) {
      root.innerHTML = '<p class="community-empty">Закреплённых постов пока нет.</p>';
      return;
    }
    root.innerHTML = items
      .map(
        (p, idx) => `
      <article class="feed-card feed-card--pinned" id="post-${E.escapeHtml(p.id)}" data-post-link="${E.escapeHtml(p.id)}">
        <div class="pinned-mark">Закреплено</div>
        <h3 class="feed-post-title">${E.escapeHtml(p.title)}</h3>
        <p class="feed-post-text">${E.escapeHtml(p.body).slice(0, 140)}...</p>
        <img class="pinned-thumb" src="${E.escapeHtml(getPostImage(p, idx))}" alt="${E.escapeHtml(p.title)}" loading="lazy" />
      </article>
    `
      )
      .join('');
  }

  function renderWeeklyPopular(allPosts) {
    const root = document.getElementById('weeklyPopularList');
    if (!root) return;
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const reactions = getReactionsMap();
    const views = getViewsMap();
    const recent = allPosts.filter((p) => new Date(p.createdAt).getTime() >= weekAgo);
    const source = recent.length ? recent : allPosts;
    const ranked = [...source]
      .map((post) => ({ post, metrics: postMetrics(post, reactions, views) }))
      .sort((a, b) => b.metrics.score - a.metrics.score)
      .slice(0, 4);
    if (!ranked.length) {
      root.innerHTML = '<p class="community-empty">Пока нет статистики за неделю.</p>';
      return;
    }
    root.innerHTML = ranked
      .map(
        ({ post, metrics }, idx) => `
      <article class="popular-row" data-post-link="${E.escapeHtml(post.id)}">
        <span class="popular-rank">${idx + 1}</span>
        <div class="popular-body">
          <strong>${E.escapeHtml(post.title)}</strong>
          <span>${metrics.views} просмотров · ${metrics.likes + metrics.extra} реакций</span>
        </div>
      </article>
    `
      )
      .join('');
  }

  function jumpToPost(postId) {
    let el = Array.from(document.querySelectorAll('.community-post')).find((node) => node.getAttribute('data-post-id') === postId);
    if (!el) {
      // Если пост скрыт фильтром/поиском/вкладкой, сначала возвращаем полную ленту.
      state.tab = 'all';
      state.topic = 'all';
      state.search = '';
      const search = document.getElementById('feedSearchInput');
      if (search) search.value = '';
      const tabsWrap = document.getElementById('feedTabs');
      if (tabsWrap) {
        tabsWrap.querySelectorAll('[data-tab]').forEach((btn) => {
          btn.classList.toggle('is-active', btn.getAttribute('data-tab') === 'all');
        });
      }
      const topicsWrap = document.getElementById('communityTopics');
      if (topicsWrap) {
        topicsWrap.querySelectorAll('[data-topic]').forEach((btn) => {
          btn.classList.toggle('is-active', btn.getAttribute('data-topic') === 'all');
        });
      }
      renderPosts();
      el = Array.from(document.querySelectorAll('.community-post')).find((node) => node.getAttribute('data-post-id') === postId);
      if (!el) return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-focused');
    setTimeout(() => el.classList.remove('is-focused'), 1400);
  }

  function bindPostLinks() {
    document.querySelectorAll('[data-post-link]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        const pid = el.getAttribute('data-post-link');
        if (pid) jumpToPost(pid);
      });
    });
  }

  function applySettingsPayload(s) {
    const intro = document.getElementById('communityIntro');
    const wl = document.getElementById('workLine');
    const sl = document.getElementById('deliverySlots');
    if (intro) intro.textContent = s.communityIntro || '';
    if (wl) wl.textContent = s.workLine || '—';
    if (sl) {
      const slots = s.deliverySlots || [];
      sl.innerHTML = slots.map((t) => `<li><span class="hours-pill">${E.escapeHtml(t)}</span></li>`).join('');
    }
  }

  async function renderSettings() {
    try {
      const r = await fetch('/api/public/settings', { credentials: 'same-origin' });
      if (r.ok) {
        const s = await r.json();
        let slots = s.deliverySlots;
        if (typeof slots === 'string') {
          try {
            slots = JSON.parse(slots);
          } catch {
            slots = [];
          }
        }
        applySettingsPayload({ ...s, deliverySlots: slots });
        E.saveSettings({
          workLine: s.workLine || '',
          communityIntro: s.communityIntro || '',
          deliverySlots: Array.isArray(slots) ? slots : [],
        });
        return;
      }
    } catch {
      /* офлайн или без сервера */
    }
    const s = E.getSettings();
    applySettingsPayload(s);
  }

  function renderPosts() {
    const root = document.getElementById('communityFeed');
    if (!root) return;
    const posts = filteredPosts();
    const allPosts = E.getPosts();
    const gk = guestKey();
    const reactions = getReactionsMap();
    const saved = getSavedSet();
    const views = getViewsMap();
    ensureViews(allPosts, gk);
    const viewsAfter = getViewsMap();
    renderPinnedPosts(allPosts);
    renderWeeklyPopular(allPosts);

    if (!posts.length) {
      root.innerHTML = '<p class="community-empty">По вашему фильтру постов пока нет. Попробуйте выбрать другую тему.</p>';
      return;
    }

    root.innerHTML = posts
      .map((p, idx) => {
        const likes = p.likes || [];
        const liked = likes.includes(gk);
        const likeCount = likes.length;
        const comments = p.comments || [];
        let safeId = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '_') || 'post';
        if (/^\d/.test(safeId)) safeId = 'p' + safeId;
        return `
        <article class="feed-card community-post" data-post-id="${E.escapeHtml(p.id)}">
          <header class="feed-card-header">
            <div class="feed-avatar feed-avatar--brand" aria-hidden="true">Э</div>
            <div class="feed-card-headline">
              <div class="feed-author-line">
                <span class="feed-author-name">ЭкваЛайн</span>
                <span class="feed-sep" aria-hidden="true">·</span>
                <time class="feed-time" datetime="${E.escapeHtml(p.createdAt)}">${formatFeedTime(p.createdAt)}</time>
              </div>
              <h3 class="feed-post-title">${E.escapeHtml(p.title)}</h3>
            </div>
          </header>
          <figure class="feed-cover">
            <img src="${E.escapeHtml(getPostImage(p, idx))}" alt="${E.escapeHtml(p.title || 'Пост ЭкваЛайн')}" loading="lazy" />
          </figure>
          <div class="community-post-body feed-post-text">${E.escapeHtml(p.body).replace(/\n/g, '<br/>')}</div>
          <div class="feed-post-topic">#${topicLabel(inferTopic(p))}</div>
          <div class="feed-post-meta-inline">👁 ${(Array.isArray(viewsAfter[p.id]) ? viewsAfter[p.id].length : (Array.isArray(views[p.id]) ? views[p.id].length : 0))} просмотров</div>
          <div class="feed-actions">
            <button type="button" class="like-btn ${liked ? 'is-liked' : ''}" data-like="${E.escapeHtml(p.id)}" aria-pressed="${liked}">
              ${HEART_SVG}
              <span class="like-count">${likeCount}</span>
            </button>
            ${EXTRA_REACTIONS.map((r) => buildReactionButton(p.id, r.id, r.label, r.icon, reactions, gk)).join('')}
            <button type="button" class="feed-action-btn ${saved.has(p.id) ? 'is-saved' : ''}" data-save-post="${E.escapeHtml(p.id)}">
              ${saved.has(p.id) ? 'Сохранено' : 'Сохранить'}
            </button>
            <button type="button" class="feed-action-btn" data-share-post="${E.escapeHtml(p.id)}">Поделиться</button>
          </div>
          <div class="community-comments feed-comments">
            ${comments
              .map(
                (c) => `
              <div class="feed-comment">
                <div class="feed-avatar feed-avatar--user" aria-hidden="true">${E.escapeHtml(initialFromName(c.displayName))}</div>
                <div class="feed-comment-body">
                  <div class="feed-comment-meta">
                    <strong>${E.escapeHtml(c.displayName)}</strong>
                    <time datetime="${E.escapeHtml(c.createdAt)}">${formatFeedTime(c.createdAt)}</time>
                  </div>
                  <p class="feed-comment-text">${E.escapeHtml(c.text)}</p>
                </div>
              </div>
            `
              )
              .join('')}
            <form class="community-comment-form feed-comment-form" data-post-id="${E.escapeHtml(p.id)}">
              <label class="sr-only" for="c_${safeId}">Комментарий</label>
              <div class="feed-compose">
                <div class="feed-avatar feed-avatar--ghost" aria-hidden="true">${E.escapeHtml(initialFromName(displayName()))}</div>
                <div class="feed-compose-fields">
                  <textarea id="c_${safeId}" name="text" rows="2" maxlength="800" placeholder="Написать комментарий…" required></textarea>
                  <button type="submit" class="solid-btn small-btn feed-send-btn">Отправить</button>
                </div>
              </div>
            </form>
          </div>
        </article>
      `;
      })
      .join('');

    bindPostLinks();
  }

  function renderPolls() {
    const root = document.getElementById('communityPolls');
    if (!root) return;
    const polls = E.getPolls();
    const vk = guestKey();

    if (!polls.length) {
      root.innerHTML = '<p class="community-empty">Опросов пока нет.</p>';
      return;
    }

    root.innerHTML = polls
      .map((poll) => {
        const opts = poll.options || [];
        const totalVotes = opts.reduce((s, o) => s + (o.votes || []).length, 0);
        return `
        <div class="feed-card community-poll" data-poll-id="${E.escapeHtml(poll.id)}">
          <div class="poll-card-head">
            <span class="poll-badge" aria-hidden="true">Опрос</span>
            <time class="feed-time poll-card-time" datetime="${E.escapeHtml(poll.createdAt)}">${formatFeedTime(poll.createdAt)}</time>
          </div>
          <h3 class="poll-question">${E.escapeHtml(poll.question)}</h3>
          <p class="poll-votes-meta">Всего голосов: <strong>${totalVotes}</strong></p>
          <ul class="poll-options poll-options--bars">
            ${opts
              .map((o) => {
                const cnt = (o.votes || []).length;
                const pct = totalVotes ? Math.round((cnt / totalVotes) * 100) : 0;
                const v = (o.votes || []).includes(vk);
                return `
                <li class="poll-option-row">
                  <button type="button" class="poll-vote-btn ${v ? 'is-voted' : ''}" data-poll="${E.escapeHtml(poll.id)}" data-opt="${E.escapeHtml(o.id)}">
                    <span class="poll-bar-track" aria-hidden="true"><span class="poll-bar-fill" style="width:${pct}%"></span></span>
                    <span class="poll-option-row-inner">
                      <span class="poll-opt-text">${E.escapeHtml(o.text)}</span>
                      <span class="poll-opt-stat">${pct}% <span class="poll-opt-n">(${cnt})</span></span>
                    </span>
                  </button>
                </li>
              `;
              })
              .join('')}
          </ul>
        </div>
      `;
      })
      .join('');

  }

  function setupToolbar() {
    const search = document.getElementById('feedSearchInput');
    const topicsWrap = document.getElementById('communityTopics');
    const tabsWrap = document.getElementById('feedTabs');
    if (search) {
      search.addEventListener('input', () => {
        state.search = search.value;
        renderPosts();
      });
    }
    if (topicsWrap) {
      topicsWrap.querySelectorAll('[data-topic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.topic = btn.getAttribute('data-topic') || 'all';
          topicsWrap.querySelectorAll('[data-topic]').forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          renderPosts();
        });
      });
    }
    if (tabsWrap) {
      tabsWrap.querySelectorAll('[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.tab = btn.getAttribute('data-tab') || 'all';
          tabsWrap.querySelectorAll('[data-tab]').forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          renderPosts();
        });
      });
    }
  }

  function setupInteractions() {
    document.addEventListener('click', async (event) => {
      const likeBtn = event.target.closest('[data-like]');
      if (likeBtn) {
        E.toggleLike(likeBtn.getAttribute('data-like'), guestKey());
        renderPosts();
        return;
      }

      const reactionBtn = event.target.closest('[data-reaction-post]');
      if (reactionBtn) {
        const pid = reactionBtn.getAttribute('data-reaction-post');
        const rid = reactionBtn.getAttribute('data-reaction-id');
        const map = getReactionsMap();
        map[pid] = map[pid] || {};
        const arr = Array.isArray(map[pid][rid]) ? map[pid][rid] : [];
        map[pid][rid] = arr.includes(guestKey()) ? arr.filter((x) => x !== guestKey()) : [...arr, guestKey()];
        setReactionsMap(map);
        renderPosts();
        return;
      }

      const saveBtn = event.target.closest('[data-save-post]');
      if (saveBtn) {
        const pid = saveBtn.getAttribute('data-save-post');
        const set = getSavedSet();
        if (set.has(pid)) set.delete(pid);
        else set.add(pid);
        setSavedSet(set);
        renderPosts();
        return;
      }

      const shareBtn = event.target.closest('[data-share-post]');
      if (shareBtn) {
        const pid = shareBtn.getAttribute('data-share-post');
        const url = `${location.origin}${location.pathname}#post-${pid}`;
        try {
          await navigator.clipboard.writeText(url);
          shareBtn.textContent = 'Ссылка скопирована';
          setTimeout(() => {
            shareBtn.textContent = 'Поделиться';
          }, 1500);
        } catch {
          shareBtn.textContent = 'Не удалось скопировать';
        }
        return;
      }

      const pollBtn = event.target.closest('.poll-vote-btn');
      if (pollBtn) {
        E.votePoll(pollBtn.getAttribute('data-poll'), pollBtn.getAttribute('data-opt'), guestKey());
        renderPolls();
      }
    });

    document.addEventListener('submit', (event) => {
      const form = event.target.closest('.community-comment-form');
      if (!form) return;
      event.preventDefault();
      const pid = form.getAttribute('data-post-id');
      const ta = form.querySelector('textarea');
      if (E.addComment(pid, guestKey(), displayName(), ta.value)) {
        ta.value = '';
        renderPosts();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enrichBlogData();
    renderSettings();
    setupToolbar();
    setupInteractions();
    renderPosts();
    renderPolls();
    window.addEventListener('ekvaline-storage', () => {
      renderSettings();
      renderPosts();
      renderPolls();
    });
    window.addEventListener('storage', () => {
      renderSettings();
      renderPosts();
      renderPolls();
    });
  });
})();
