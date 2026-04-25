(function () {
  const E = window.EkvalineApp;
  if (!E) return;

  const HEART_SVG = `<svg class="like-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="like-icon-path" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

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
    const posts = E.getPosts();
    const gk = guestKey();

    if (!posts.length) {
      root.innerHTML = '<p class="community-empty">Публикаций пока нет.</p>';
      return;
    }

    root.innerHTML = posts
      .map((p) => {
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
          <div class="community-post-body feed-post-text">${E.escapeHtml(p.body).replace(/\n/g, '<br/>')}</div>
          <div class="feed-actions">
            <button type="button" class="like-btn ${liked ? 'is-liked' : ''}" data-like="${E.escapeHtml(p.id)}" aria-pressed="${liked}">
              ${HEART_SVG}
              <span class="like-count">${likeCount}</span>
            </button>
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

    root.querySelectorAll('[data-like]').forEach((btn) => {
      btn.addEventListener('click', () => {
        E.toggleLike(btn.getAttribute('data-like'), gk);
        renderPosts();
      });
    });

    root.querySelectorAll('.community-comment-form').forEach((form) => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const pid = form.getAttribute('data-post-id');
        const ta = form.querySelector('textarea');
        if (E.addComment(pid, gk, displayName(), ta.value)) {
          ta.value = '';
          renderPosts();
        }
      });
    });
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

    root.querySelectorAll('.poll-vote-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        E.votePoll(btn.getAttribute('data-poll'), btn.getAttribute('data-opt'), vk);
        renderPolls();
      });
    });
  }

  function showManagerLink() {
    const link = document.getElementById('managerNavLink');
    if (!link) return;
    try {
      const u = JSON.parse(localStorage.getItem('ekvaline_current_user') || 'null');
      const ok = u && (u.role === 'manager' || u.role === 'admin');
      link.classList.toggle('hidden', !ok);
    } catch {
      link.classList.add('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSettings();
    renderPosts();
    renderPolls();
    showManagerLink();
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
