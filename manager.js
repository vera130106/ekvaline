(function () {
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const FEED_KEY = 'ekvaline_blog_v2_posts';
  const POST_READS_MAP_KEY = 'ekvaline_blog_post_reads_v1';
  const BLOG_ADMIN_KEY = 'ekvaline_blog_manager_data';
  const BLOG_ARCHIVE_KEY = 'ekvaline_blog_archive_posts';
  const MAX_PUBLIC_POSTS = 5;
  const DEFAULT_TIPS = [
    'Начинайте утро со стакана воды.',
    'Пейте небольшими порциями каждые 1-2 часа.',
    'Держите бутылку воды всегда под рукой.',
  ];
  const DEFAULT_RECIPES = ['Вода + лимон + мята.', 'Вода + огурец + лайм.', 'Вода + ягоды + базилик.'];
  const DEFAULT_FACTS = [
    'Даже легкое обезвоживание снижает концентрацию на 20%.',
    'Стакан воды утром помогает мягко запустить обмен веществ.',
    'Во время тренировки полезно пить воду каждые 15-20 минут.',
    'Недостаток воды чаще всего ощущается как усталость и сонливость.',
  ];

  let state = {
    posts: [],
    admin: {
      factOfDay: '',
      hiddenPostIds: [],
      extraStories: [],
      storyOverrides: {},
      tips: [],
      recipes: [],
      popular: [],
      blockTitles: {},
      hydrationPoll: null,
    },
  };

  function safeJsonParse(raw, fallback) {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readCurrentUser() {
    return safeJsonParse(localStorage.getItem(CURRENT_USER_KEY), null);
  }

  function sortByDateDesc(posts) {
    return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function readAdminData() {
    const fallback = {
      factOfDay: '',
      hiddenPostIds: [],
      extraStories: [],
      storyOverrides: {},
      tips: [],
      recipes: [],
      popular: [],
      blockTitles: {},
      hydrationPoll: null,
    };
    const data = safeJsonParse(localStorage.getItem(BLOG_ADMIN_KEY), fallback);
    return {
      factOfDay: typeof data?.factOfDay === 'string' ? data.factOfDay : '',
      hiddenPostIds: Array.isArray(data?.hiddenPostIds) ? data.hiddenPostIds.filter(Boolean) : [],
      extraStories: Array.isArray(data?.extraStories) ? data.extraStories : [],
      storyOverrides: typeof data?.storyOverrides === 'object' && data.storyOverrides ? data.storyOverrides : {},
      tips: Array.isArray(data?.tips) ? data.tips.filter(Boolean).map(String) : [],
      recipes: Array.isArray(data?.recipes) ? data.recipes.filter(Boolean).map(String) : [],
      popular: Array.isArray(data?.popular) ? data.popular.filter(Boolean).map(String) : [],
      blockTitles: typeof data?.blockTitles === 'object' && data.blockTitles ? data.blockTitles : {},
      hydrationPoll:
        data?.hydrationPoll && typeof data.hydrationPoll === 'object'
          ? {
              id: String(data.hydrationPoll.id || ''),
              title: String(data.hydrationPoll.title || 'Опрос дня'),
              question: String(data.hydrationPoll.question || ''),
              options: Array.isArray(data.hydrationPoll.options) ? data.hydrationPoll.options : [],
              active: Boolean(data.hydrationPoll.active),
            }
          : null,
    };
  }

  function saveAdminData() {
    localStorage.setItem(BLOG_ADMIN_KEY, JSON.stringify(state.admin));
    try {
      window.dispatchEvent(new CustomEvent('ekvaline-blog-admin-updated'));
    } catch {
      /* ignore */
    }
  }

  function saveArchivePosts() {
    localStorage.setItem(BLOG_ARCHIVE_KEY, JSON.stringify(state.posts));
  }

  function readReadsMapRaw() {
    const m = safeJsonParse(localStorage.getItem(POST_READS_MAP_KEY), null);
    return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  }

  function saveReadsMap(map) {
    try {
      localStorage.setItem(POST_READS_MAP_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  /** Одна точка синхронизации: карта просмотров (клиент) и поле views в архивных постах. */
  function reconcileManagerPostReads() {
    const map = readReadsMapRaw();
    let mapDirty = false;
    let archiveDirty = false;
    state.posts.forEach((p) => {
      if (!p?.id) return;
      const fromPost = Math.max(0, Number(p.views) || 0);
      const fromMap = Math.max(0, Number(map[p.id]) || 0);
      if (fromPost > fromMap) {
        map[p.id] = fromPost;
        mapDirty = true;
      }
      const best = Math.max(fromPost, fromMap);
      if (Number(p.views) !== best) {
        p.views = best;
        archiveDirty = true;
      }
    });
    if (mapDirty) saveReadsMap(map);
    return archiveDirty;
  }

  function effectivePostReads(post) {
    if (!post?.id) return 0;
    return Math.max(
      Math.max(0, Number(readReadsMapRaw()[post.id]) || 0),
      Math.max(0, Number(post.views) || 0)
    );
  }

  function publishToClient() {
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const visible = sortByDateDesc(state.posts).filter((post) => !hidden.has(post.id)).slice(0, MAX_PUBLIC_POSTS);
    localStorage.setItem(FEED_KEY, JSON.stringify(visible));
    try {
      window.dispatchEvent(new CustomEvent('ekvaline-blog-admin-updated'));
    } catch {
      /* ignore */
    }
  }

  function initState() {
    const archive = safeJsonParse(localStorage.getItem(BLOG_ARCHIVE_KEY), null);
    const live = safeJsonParse(localStorage.getItem(FEED_KEY), []);
    state.posts = Array.isArray(archive) && archive.length ? archive : (Array.isArray(live) ? live : []);
    state.posts = sortByDateDesc(state.posts);
    state.admin = readAdminData();
    reconcileManagerPostReads();
    saveArchivePosts();
    publishToClient();
  }

  function getPublishedIds() {
    const hidden = new Set(state.admin.hiddenPostIds || []);
    return new Set(sortByDateDesc(state.posts).filter((post) => !hidden.has(post.id)).slice(0, MAX_PUBLIC_POSTS).map((post) => post.id));
  }

  function updateLimitCounter(field, counter, max) {
    const len = field.value.length;
    counter.textContent = `${len}/${max}`;
  }

  function bindLimitForField(field, counter, max) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || !counter) return;
    const update = () => updateLimitCounter(field, counter, max);
    field.addEventListener('input', update);
    update();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
      reader.readAsDataURL(file);
    });
  }

  function truncate(value, max) {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trim()}…`;
  }

  function normalizeMultilineList(value, maxItems) {
    return String(value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  function updateInlineLimitCounters(form) {
    if (!(form instanceof HTMLFormElement)) return;
    form.querySelectorAll('[data-inline-limit]').forEach((counter) => {
      if (!(counter instanceof HTMLElement)) return;
      const fieldName = counter.getAttribute('data-inline-limit') || '';
      if (!fieldName) return;
      const field = form.elements.namedItem(fieldName);
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
      const max = Number(field.getAttribute('maxlength') || '0');
      const len = field.value.length;
      counter.textContent = max > 0 ? `${len}/${max}` : `${len}`;
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function ensureSuccessModal() {
    let modal = document.getElementById('managerSuccessModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.id = 'managerSuccessModal';
    wrapper.className = 'manager-success-modal';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.innerHTML = `
      <div class="manager-success-backdrop" data-success-close="true"></div>
      <div class="manager-success-card" role="dialog" aria-modal="true" aria-labelledby="managerSuccessTitle">
        <h3 id="managerSuccessTitle">Успешно</h3>
        <p id="managerSuccessText">Изменения сохранены.</p>
        <button type="button" class="manager-btn" id="managerSuccessOkBtn">Понятно</button>
      </div>
    `;
    document.body.appendChild(wrapper);
    const okBtn = wrapper.querySelector('#managerSuccessOkBtn');
    if (okBtn instanceof HTMLButtonElement) {
      okBtn.addEventListener('click', () => hideSuccessModal());
    }
    wrapper.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.successClose === 'true') {
        hideSuccessModal();
      }
    });
    return wrapper;
  }

  function showSuccessModal(message, opts) {
    const keepFormOpen = Boolean(opts && opts.keepFormOpen);
    if (!keepFormOpen) closeLaunchFormModals();
    const modal = ensureSuccessModal();
    const text = modal.querySelector('#managerSuccessText');
    if (text) text.textContent = message || 'Изменения сохранены.';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function showManagerFormError(message) {
    showSuccessModal(message || 'Заполните все обязательные поля.', { keepFormOpen: true });
  }

  function prepareLaunchFormModal(modalId) {
    if (modalId === 'managerFactFormModal') renderFactForm();
    if (modalId === 'managerBlocksFormModal') {
      renderBlocksForm();
      renderBlocksPreview();
    }
    if (modalId === 'managerStoryFormModal') renderStorySelect();
  }

  function openLaunchFormModal(modalId) {
    if (!modalId) return;
    const modal = document.getElementById(modalId);
    if (!(modal instanceof HTMLElement)) return;
    prepareLaunchFormModal(modalId);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const focusTarget = modal.querySelector('input, textarea, select, button');
    if (focusTarget instanceof HTMLElement) {
      window.requestAnimationFrame(() => focusTarget.focus());
    }
  }

  function hideSuccessModal() {
    const modal = document.getElementById('managerSuccessModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    const openLaunch = document.querySelector('.manager-modal[id$="FormModal"].open');
    document.body.style.overflow = openLaunch instanceof HTMLElement ? 'hidden' : '';
  }

  function getEffectiveFact() {
    const custom = String(state.admin.factOfDay || '').trim();
    if (custom) return custom;
    const idx = new Date().getDate() % DEFAULT_FACTS.length;
    return DEFAULT_FACTS[idx];
  }

  function renderStorySelect() {
    const select = document.getElementById('storyPostSelect');
    if (!(select instanceof HTMLSelectElement)) return;
    const options = sortByDateDesc(state.posts)
      .map((post) => `<option value="${escapeHtml(post.id)}">${escapeHtml(post.title)}</option>`)
      .join('');
    select.innerHTML = `<option value="">Без привязки</option>${options}`;
  }

  function renderStoriesList() {
    const root = document.getElementById('managerStoriesList');
    if (!root) return;
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const autoStories = sortByDateDesc(state.posts)
      .filter((post) => !hidden.has(post.id))
      .slice(0, MAX_PUBLIC_POSTS)
      .map((post) => {
        const override = state.admin.storyOverrides?.[post.id] || {};
        return {
          kind: 'auto',
          id: `auto_${post.id}`,
          postId: post.id,
          title: override.title || String(post.title || 'История'),
          text: override.text || String(post.excerpt || ''),
          image: override.image || post.image,
        };
      });
    const manualStories = (state.admin.extraStories || []).map((story) => ({
      kind: 'manual',
      id: story.id,
      postId: story.postId || '',
      title: story.title || 'История',
      text: story.text || '',
      image: story.image || '',
    }));
    const allStories = [...manualStories, ...autoStories];
    if (!allStories.length) {
      root.innerHTML = '<p class="manager-empty">Дополнительных историй пока нет.</p>';
      return;
    }
    root.innerHTML = allStories
      .map(
        (story) => `
        <article class="manager-mini-item">
          <img class="manager-story-thumb" src="${escapeHtml(story.image || '')}" alt="${escapeHtml(story.title || 'История')}" />
          <div>
            <strong>${escapeHtml(story.title || 'История')} ${story.kind === 'auto' ? '<span class="manager-story-kind">Авто</span>' : '<span class="manager-story-kind">Ручная</span>'}</strong>
            <p>${escapeHtml(story.text || '')}</p>
          </div>
          <div class="manager-story-actions">
            <button type="button" class="manager-btn" data-edit-story="${escapeHtml(story.id)}" data-story-kind="${escapeHtml(story.kind)}" data-story-post="${escapeHtml(story.postId || '')}">Редактировать</button>
            ${
              story.kind === 'manual'
                ? `<button type="button" class="manager-btn is-danger" data-delete-story="${escapeHtml(story.id)}">Удалить</button>`
                : ''
            }
          </div>
        </article>
      `
      )
      .join('');
  }

  function ensureStoryModal() {
    let modal = document.getElementById('managerStoryModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.id = 'managerStoryModal';
    wrapper.className = 'manager-modal';
    wrapper.innerHTML = `
      <div class="manager-modal-backdrop" data-close-story-modal="true"></div>
      <div class="manager-modal-card">
        <button type="button" class="manager-modal-close" data-close-story-modal="true">×</button>
        <div id="managerStoryModalBody" class="manager-modal-body"></div>
      </div>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function closeStoryModal() {
    const modal = document.getElementById('managerStoryModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openStoryModal({ storyId, kind, postId }) {
    const modal = ensureStoryModal();
    const body = document.getElementById('managerStoryModalBody');
    if (!body) return;
    let current = null;
    if (kind === 'manual') {
      current = (state.admin.extraStories || []).find((story) => story.id === storyId) || null;
    } else {
      const post = state.posts.find((item) => item.id === postId);
      const override = state.admin.storyOverrides?.[postId] || {};
      if (post) {
        current = {
          id: storyId,
          postId,
          title: override.title || post.title || 'История',
          text: override.text || post.excerpt || '',
          image: override.image || post.image || '',
          kind: 'auto',
        };
      }
    }
    if (!current) return;
    body.innerHTML = `
      <h3 class="manager-modal-title">Редактирование истории (${kind === 'auto' ? 'авто' : 'ручная'})</h3>
      <form class="manager-story-edit-form" data-story-edit="${escapeHtml(current.id)}" data-story-kind="${escapeHtml(kind)}" data-story-post="${escapeHtml(current.postId || '')}">
        <label>Заголовок (до 40)
          <input type="text" name="title" maxlength="40" required value="${escapeHtml(current.title || '')}" />
          <span class="manager-limit manager-limit-inline" data-inline-limit="title">0/40</span>
        </label>
        <label>Текст (до 180)
          <textarea name="text" maxlength="180" required>${escapeHtml(current.text || '')}</textarea>
          <span class="manager-limit manager-limit-inline" data-inline-limit="text">0/180</span>
        </label>
        <label>Новое фото (необязательно)
          <input type="file" name="image" accept="image/*" />
        </label>
        <div class="manager-post-edit-actions">
          ${
            kind === 'auto'
              ? '<button type="button" class="manager-btn is-secondary" data-reset-auto-story="true">Сбросить к авто</button>'
              : ''
          }
          <button type="submit" class="manager-btn is-green">Сохранить историю</button>
        </div>
      </form>
    `;
    updateInlineLimitCounters(body.querySelector('.manager-story-edit-form'));
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderPosts() {
    const root = document.getElementById('managerPostsList');
    if (!root) return;
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const published = getPublishedIds();
    const posts = sortByDateDesc(state.posts);

    if (!posts.length) {
      root.innerHTML = '<p class="manager-empty">Постов пока нет.</p>';
      return;
    }

    root.innerHTML = posts
      .map((post) => {
        const isHidden = hidden.has(post.id);
        const isPublished = published.has(post.id);
        const reactions = post.reactions || {};
        const commentsCount = (post.comments || []).length;
        return `
          <article class="manager-post-tile ${isHidden || !isPublished ? 'is-dim' : ''}" data-open-post="${escapeHtml(post.id)}">
            <img src="${escapeHtml(post.image || '')}" alt="${escapeHtml(post.title)}" />
            <div class="manager-post-tile-overlay">
              <h3>${escapeHtml(post.title)}</h3>
              <p>${isHidden ? 'Скрыт у клиента' : isPublished ? 'Видим клиенту' : 'В архиве (старый)'}</p>
              <div class="manager-post-tile-stats">
                <span>👁 ${effectivePostReads(post)}</span>
                <span>Нравится: ${post.likes || 0}</span>
                <span>Полезно: ${reactions.useful || 0}</span>
                <span>Интересно: ${reactions.new || 0}</span>
                <span>💬 ${commentsCount}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
    updateArchiveArrowsState();
  }

  function renderComments() {
    const root = document.getElementById('managerCommentsList');
    if (!root) return;
    const all = [];
    for (const post of sortByDateDesc(state.posts)) {
      for (const comment of post.comments || []) {
        all.push({ post, comment });
      }
    }
    root.innerHTML = `
      <div class="manager-comments-summary">
        <p>Всего комментариев: <strong>${all.length}</strong></p>
        <button type="button" class="manager-btn is-green" id="openCommentsModalBtn">Открыть комментарии</button>
      </div>
    `;
  }

  function ensurePostModal() {
    let modal = document.getElementById('managerPostModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.id = 'managerPostModal';
    wrapper.className = 'manager-modal';
    wrapper.innerHTML = `
      <div class="manager-modal-backdrop" data-close-post-modal="true"></div>
      <div class="manager-modal-card">
        <button type="button" class="manager-modal-close" data-close-post-modal="true">×</button>
        <div id="managerPostModalBody" class="manager-modal-body"></div>
      </div>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function closePostModal() {
    const modal = document.getElementById('managerPostModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openPostModal(postId) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const isHidden = hidden.has(post.id);
    const modal = ensurePostModal();
    const body = document.getElementById('managerPostModalBody');
    if (!body) return;
    body.innerHTML = `
      <div class="manager-modal-post-head">
        <img src="${escapeHtml(post.image || '')}" alt="${escapeHtml(post.title)}" />
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${formatDate(post.createdAt)}</p>
          <p class="manager-modal-reads-note">Открыли полный текст («Читать»): <strong>${effectivePostReads(post)}</strong></p>
          <div class="manager-modal-post-actions">
            <button type="button" class="manager-btn is-secondary" data-toggle-post="${escapeHtml(post.id)}">
              ${isHidden ? 'Показать клиенту' : 'Скрыть у клиента'}
            </button>
            <button type="button" class="manager-btn is-danger" data-delete-post="${escapeHtml(post.id)}">Удалить пост</button>
          </div>
        </div>
      </div>
      <form class="manager-post-edit-form" data-edit-form="${escapeHtml(post.id)}">
        <label>Заголовок (до 80)
          <input type="text" name="title" maxlength="80" required value="${escapeHtml(post.title || '')}" />
          <span class="manager-limit manager-limit-inline" data-inline-limit="title">0/80</span>
        </label>
        <label>Краткий текст (до 180)
          <textarea name="excerpt" maxlength="180" required>${escapeHtml(post.excerpt || '')}</textarea>
          <span class="manager-limit manager-limit-inline" data-inline-limit="excerpt">0/180</span>
        </label>
        <label>Полный текст (до 1200)
          <textarea name="details" maxlength="1200" required>${escapeHtml(post.details || '')}</textarea>
          <span class="manager-limit manager-limit-inline" data-inline-limit="details">0/1200</span>
        </label>
        <label>Новое фото (необязательно)
          <input type="file" name="image" accept="image/*" />
        </label>
        <div class="manager-post-edit-actions">
          <button type="submit" class="manager-btn is-green">Сохранить изменения</button>
        </div>
      </form>
    `;
    updateInlineLimitCounters(body.querySelector('.manager-post-edit-form'));
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function ensureCommentsModal() {
    let modal = document.getElementById('managerCommentsModal');
    if (modal) return modal;
    const wrapper = document.createElement('div');
    wrapper.id = 'managerCommentsModal';
    wrapper.className = 'manager-modal';
    wrapper.innerHTML = `
      <div class="manager-modal-backdrop" data-close-comments-modal="true"></div>
      <div class="manager-modal-card">
        <button type="button" class="manager-modal-close" data-close-comments-modal="true">×</button>
        <h3 class="manager-modal-title">Комментарии и ответы</h3>
        <div id="managerCommentsModalBody" class="manager-modal-body"></div>
      </div>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function closeCommentsModal() {
    const modal = document.getElementById('managerCommentsModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openCommentsModal() {
    const modal = ensureCommentsModal();
    const body = document.getElementById('managerCommentsModalBody');
    if (!body) return;
    const all = [];
    for (const post of sortByDateDesc(state.posts)) {
      for (const comment of post.comments || []) all.push({ post, comment });
    }
    if (!all.length) {
      body.innerHTML = '<p class="manager-empty">Комментариев пока нет.</p>';
    } else {
      body.innerHTML = all
        .map(
          ({ post, comment }) => `
          <article class="manager-comment">
            <p class="manager-comment-post">Пост: ${escapeHtml(post.title)}</p>
            <p><strong>${escapeHtml(comment.name || 'Пользователь')}:</strong> ${escapeHtml(comment.text || '')}</p>
            <p class="manager-comment-like">Лайков комментария: ${comment.likes || 0}</p>
            ${
              Array.isArray(comment.replies) && comment.replies.length
                ? `<div class="manager-replies">${comment.replies
                    .map((reply) => `<p><strong>${escapeHtml(reply.name || 'Менеджер')}:</strong> ${escapeHtml(reply.text || '')}</p>`)
                    .join('')}</div>`
                : ''
            }
            <form class="manager-reply-form" data-reply-post="${escapeHtml(post.id)}" data-reply-comment="${escapeHtml(comment.id)}">
              <textarea name="replyText" maxlength="300" placeholder="Ответить на комментарий..." required></textarea>
              <div class="manager-reply-meta">
                <span class="manager-limit" data-reply-limit>0/300</span>
                <button type="submit" class="manager-btn is-green">Ответить</button>
              </div>
            </form>
          </article>
        `
        )
        .join('');
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderFactForm() {
    const form = document.getElementById('managerFactForm');
    if (!(form instanceof HTMLFormElement)) return;
    const textarea = form.elements.namedItem('fact');
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    textarea.value = getEffectiveFact();
    const counter = form.querySelector('[data-limit-for="fact"]');
    if (counter) counter.textContent = `${textarea.value.length}/160`;
  }

  function getEffectivePopular() {
    if (Array.isArray(state.admin.popular) && state.admin.popular.length) {
      return state.admin.popular.slice(0, 10);
    }
    return sortByDateDesc(state.posts)
      .slice(0, 3)
      .map((post) => String(post.title || '').trim())
      .filter(Boolean);
  }

  function getEffectiveTips() {
    if (Array.isArray(state.admin.tips) && state.admin.tips.length) {
      return state.admin.tips.slice(0, 12);
    }
    return DEFAULT_TIPS;
  }

  function getEffectiveRecipes() {
    if (Array.isArray(state.admin.recipes) && state.admin.recipes.length) {
      return state.admin.recipes.slice(0, 12);
    }
    return DEFAULT_RECIPES;
  }

  function renderBlocksForm() {
    const form = document.getElementById('managerBlocksForm');
    if (!(form instanceof HTMLFormElement)) return;
    const popular = form.elements.namedItem('popular');
    const tips = form.elements.namedItem('tips');
    const recipes = form.elements.namedItem('recipes');
    const factTitle = form.elements.namedItem('factTitle');
    const popularTitle = form.elements.namedItem('popularTitle');
    const tipsTitle = form.elements.namedItem('tipsTitle');
    const recipesTitle = form.elements.namedItem('recipesTitle');
    if (factTitle instanceof HTMLInputElement) {
      factTitle.value = String(state.admin.blockTitles?.fact || 'Факт дня');
      const counter = form.querySelector('[data-limit-for="fact-title"]');
      if (counter) counter.textContent = `${factTitle.value.length}/40`;
    }
    if (popularTitle instanceof HTMLInputElement) {
      popularTitle.value = String(state.admin.blockTitles?.popular || 'Популярное');
      const counter = form.querySelector('[data-limit-for="popular-title"]');
      if (counter) counter.textContent = `${popularTitle.value.length}/40`;
    }
    if (tipsTitle instanceof HTMLInputElement) {
      tipsTitle.value = String(state.admin.blockTitles?.tips || 'Советы дня');
      const counter = form.querySelector('[data-limit-for="tips-title"]');
      if (counter) counter.textContent = `${tipsTitle.value.length}/40`;
    }
    if (recipesTitle instanceof HTMLInputElement) {
      recipesTitle.value = String(state.admin.blockTitles?.recipes || 'Рецепты с водой');
      const counter = form.querySelector('[data-limit-for="recipes-title"]');
      if (counter) counter.textContent = `${recipesTitle.value.length}/40`;
    }
    if (popular instanceof HTMLTextAreaElement) {
      popular.value = getEffectivePopular().join('\n');
      const counter = form.querySelector('[data-limit-for="popular"]');
      if (counter) counter.textContent = `${popular.value.length}/700`;
    }
    if (tips instanceof HTMLTextAreaElement) {
      tips.value = getEffectiveTips().join('\n');
      const counter = form.querySelector('[data-limit-for="tips"]');
      if (counter) counter.textContent = `${tips.value.length}/900`;
    }
    if (recipes instanceof HTMLTextAreaElement) {
      recipes.value = getEffectiveRecipes().join('\n');
      const counter = form.querySelector('[data-limit-for="recipes"]');
      if (counter) counter.textContent = `${recipes.value.length}/900`;
    }
  }

  function renderBlocksPreview() {
    const root = document.getElementById('managerBlocksPreview');
    if (!root) return;
    const popular = getEffectivePopular();
    const tips = getEffectiveTips();
    const recipes = getEffectiveRecipes();
    root.innerHTML = `
      <div class="manager-preview-col">
        <h4>${escapeHtml(state.admin.blockTitles?.fact || 'Факт дня')}</h4>
        <ul><li>${escapeHtml(getEffectiveFact())}</li></ul>
      </div>
      <div class="manager-preview-col">
        <h4>${escapeHtml(state.admin.blockTitles?.popular || 'Популярное')}</h4>
        <ul>${popular.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
      <div class="manager-preview-col">
        <h4>${escapeHtml(state.admin.blockTitles?.tips || 'Советы дня')}</h4>
        <ul>${tips.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
      <div class="manager-preview-col">
        <h4>${escapeHtml(state.admin.blockTitles?.recipes || 'Рецепты с водой')}</h4>
        <ul>${recipes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
    `;
  }

  async function syncBlogPollToServer(poll) {
    const api = window.EkvalineAPI;
    if (!api?.json) return;
    try {
      const payload = poll
        ? {
            poll: {
              id: poll.id,
              title: poll.title || 'Опрос дня',
              question: poll.question,
              active: !!poll.active,
              options: (poll.options || []).map((opt) => ({
                id: opt.id,
                text: opt.text,
              })),
            },
          }
        : { poll: null };
      await api.json('/api/manager/blog-poll', { method: 'PUT', body: payload });
      api.resetCsrf?.();
    } catch {
      /* ignore */
    }
  }

  function renderPollResultCard(poll) {
    const active = !!poll.active;
    const badge = active
      ? '<span class="manager-poll-result-badge is-active">активен</span>'
      : '<span class="manager-poll-result-badge is-archived">архив</span>';
    const sourceLabel = poll.source === 'blog' ? 'опрос блога' : 'клиентский опрос';
    const bars = (poll.options || [])
      .map(
        (opt) => `
        <div class="manager-poll-result-row">
          <div class="manager-poll-result-row-top">
            <span>${escapeHtml(opt.text || '')}</span>
            <strong>${Number(opt.votes || 0)} (${Number(opt.percent || 0)}%)</strong>
          </div>
          <div class="manager-poll-result-bar"><span style="width:${Math.max(0, Math.min(100, Number(opt.percent || 0)))}%"></span></div>
        </div>`
      )
      .join('');
    return `
      <article class="manager-poll-result-card">
        <div class="manager-poll-result-head">
          <h3>${escapeHtml(poll.title || 'Опрос')}</h3>
          <div>${badge}<span class="manager-poll-result-badge">${escapeHtml(sourceLabel)}</span></div>
        </div>
        <p class="manager-poll-result-question">${escapeHtml(poll.question || '')}</p>
        <div class="manager-poll-result-bars">${bars || '<p class="manager-note">Нет вариантов ответа.</p>'}</div>
        <p class="manager-poll-result-meta">Всего голосов: <strong>${Number(poll.total_votes || 0)}</strong></p>
      </article>
    `;
  }

  async function renderPollResults() {
    const root = document.getElementById('managerPollResults');
    if (!(root instanceof HTMLElement)) return;
    const api = window.EkvalineAPI;
    if (!api?.json) {
      root.innerHTML = '<p class="manager-note">Подключите сервер, чтобы видеть результаты опросов из базы данных.</p>';
      return;
    }
    try {
      const r = await api.json('/api/manager/content-insights');
      if (!r.ok) {
        root.innerHTML = '<p class="manager-note">Не удалось загрузить результаты опросов.</p>';
        return;
      }
      const polls = Array.isArray(r.data?.polls) ? r.data.polls : [];
      const engagement = r.data?.engagement || {};
      if (!polls.length) {
        root.innerHTML =
          '<p class="manager-note">Опросов пока нет. Создайте опрос в блоке «Опрос» или в настройках админ-панели — голоса клиентов появятся здесь автоматически.</p>';
        return;
      }
      root.innerHTML = `
        <p class="manager-note">Активных опросов: <strong>${Number(engagement.active_polls || 0)}</strong> · Всего голосов в системе: <strong>${Number(engagement.total_poll_votes || 0)}</strong></p>
        ${polls.map(renderPollResultCard).join('')}
      `;
    } catch {
      root.innerHTML = '<p class="manager-note">Не удалось загрузить результаты опросов.</p>';
    }
  }

  let managerFeedbackItems = [];

  function formatRuPhoneDisplay(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '7') {
      return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
    }
    return String(raw || '').trim() || '—';
  }

  function formatFeedbackWhen(iso) {
    const d = new Date(iso || 0);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderManagerFeedbackItem(row) {
    const id = Number(row?.id);
    const contacted = Boolean(row?.contacted);
    const name = escapeHtml(String(row?.name || '—').trim() || '—');
    const phoneRaw = String(row?.phone || '').trim();
    const phoneShown = escapeHtml(formatRuPhoneDisplay(phoneRaw));
    const telHref = phoneRaw ? `tel:+${String(phoneRaw).replace(/\D/g, '')}` : '';
    const message = escapeHtml(String(row?.message || '').trim() || '—');
    const when = escapeHtml(formatFeedbackWhen(row?.created_at));
    const cls = contacted ? 'is-yes' : 'is-no';
    const itemCls = contacted ? 'is-contacted' : 'is-pending';
    return `<article class="manager-feedback-item ${itemCls}" data-mgr-feedback-id="${id}">
      <div class="manager-feedback-main">
        <div class="manager-feedback-head">
          <span class="manager-feedback-name">${name}</span>
          <time class="manager-feedback-time" datetime="${escapeHtml(String(row?.created_at || ''))}">${when}</time>
        </div>
        ${
          telHref
            ? `<a class="manager-feedback-phone" href="${escapeHtml(telHref)}">${phoneShown}</a>`
            : `<span class="manager-feedback-phone">${phoneShown}</span>`
        }
        <p class="manager-feedback-message">${message}</p>
      </div>
      <button
        type="button"
        class="manager-feedback-contact-btn ${cls}"
        data-mgr-feedback-toggle="${id}"
        aria-pressed="${contacted ? 'true' : 'false'}"
      >Связались</button>
    </article>`;
  }

  function renderManagerFeedbackList() {
    const root = document.getElementById('managerFeedbackList');
    if (!(root instanceof HTMLElement)) return;
    if (!managerFeedbackItems.length) {
      root.innerHTML = '<p class="manager-note">Пока нет обращений с сайта.</p>';
      return;
    }
    root.innerHTML = managerFeedbackItems.map(renderManagerFeedbackItem).join('');
  }

  function setManagerFeedbackStatus(text, visible = false) {
    const el = document.getElementById('managerFeedbackStatus');
    if (!(el instanceof HTMLElement)) return;
    el.textContent = String(text || '');
    el.hidden = !visible;
  }

  async function loadManagerFeedback() {
    const api = window.EkvalineAPI;
    if (!api?.json) {
      setManagerFeedbackStatus('Подключите сервер, чтобы видеть обращения.', true);
      return;
    }
    try {
      const r = await api.json('/api/manager/feedback');
      if (!r.ok) {
        setManagerFeedbackStatus(r.data?.error || 'Не удалось загрузить обращения.', true);
        return;
      }
      managerFeedbackItems = Array.isArray(r.data?.messages) ? r.data.messages : [];
      setManagerFeedbackStatus('', false);
      renderManagerFeedbackList();
    } catch {
      setManagerFeedbackStatus('Не удалось загрузить обращения.', true);
    }
  }

  async function toggleManagerFeedbackContacted(id, contacted) {
    const api = window.EkvalineAPI;
    if (!api?.json) return;
    const key = Number(id);
    if (!Number.isFinite(key) || key <= 0) return;
    const btn = document.querySelector(`[data-mgr-feedback-toggle="${key}"]`);
    if (btn instanceof HTMLButtonElement) btn.disabled = true;
    try {
      const r = await api.json(`/api/manager/feedback/${encodeURIComponent(String(key))}/contacted`, {
        method: 'PATCH',
        body: { contacted: Boolean(contacted) },
      });
      if (!r.ok) {
        setManagerFeedbackStatus(r.data?.error || 'Не удалось обновить статус.', true);
        return;
      }
      const updated = r.data?.message;
      if (updated && typeof updated === 'object') {
        const idx = managerFeedbackItems.findIndex((x) => Number(x.id) === key);
        if (idx >= 0) managerFeedbackItems[idx] = updated;
        else managerFeedbackItems.unshift(updated);
        managerFeedbackItems.sort((a, b) => {
          const ac = a.contacted ? 1 : 0;
          const bc = b.contacted ? 1 : 0;
          if (ac !== bc) return ac - bc;
          return Number(b.id) - Number(a.id);
        });
        renderManagerFeedbackList();
      } else {
        await loadManagerFeedback();
      }
      setManagerFeedbackStatus('', false);
    } catch {
      setManagerFeedbackStatus('Не удалось обновить статус.', true);
    } finally {
      if (btn instanceof HTMLButtonElement) btn.disabled = false;
    }
  }

  function renderAll() {
    renderStorySelect();
    renderStoriesList();
    renderPosts();
    renderComments();
    renderFactForm();
    renderBlocksForm();
    renderBlocksPreview();
    void renderPollResults();
    updateArchiveArrowsState();
  }

  function getArchiveViewport() {
    const viewport = document.getElementById('managerPostsViewport');
    return viewport instanceof HTMLElement ? viewport : null;
  }

  function updateArchiveArrowsState() {
    const viewport = getArchiveViewport();
    const prevBtn = document.getElementById('managerPostsPrevBtn');
    const nextBtn = document.getElementById('managerPostsNextBtn');
    if (!(prevBtn instanceof HTMLButtonElement) || !(nextBtn instanceof HTMLButtonElement)) return;
    if (!viewport) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const scrollLeft = Math.max(0, viewport.scrollLeft);
    prevBtn.disabled = scrollLeft <= 4;
    nextBtn.disabled = scrollLeft >= maxScroll - 4;
  }

  function setupArchiveCarousel() {
    const viewport = getArchiveViewport();
    const prevBtn = document.getElementById('managerPostsPrevBtn');
    const nextBtn = document.getElementById('managerPostsNextBtn');
    if (!viewport || !(prevBtn instanceof HTMLButtonElement) || !(nextBtn instanceof HTMLButtonElement)) return;

    const scrollStep = () => Math.max(220, Math.round(viewport.clientWidth * 0.8));

    prevBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: scrollStep(), behavior: 'smooth' });
    });
    viewport.addEventListener('scroll', updateArchiveArrowsState, { passive: true });
    window.addEventListener('resize', updateArchiveArrowsState);
    updateArchiveArrowsState();
  }

  function closeLaunchFormModals() {
    document.querySelectorAll('.manager-modal[id$="FormModal"]').forEach((modal) => {
      if (!(modal instanceof HTMLElement)) return;
      modal.classList.remove('open');
    });
    document.body.style.overflow = '';
  }

  function initLaunchFormModals() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const openBtn = target.closest('[data-open-form-modal]');
      if (openBtn instanceof HTMLButtonElement) {
        const id = openBtn.getAttribute('data-open-form-modal');
        openLaunchFormModal(id);
        return;
      }
      const closeBtn = target.closest('[data-close-form-modal]');
      if (closeBtn instanceof HTMLElement) {
        closeLaunchFormModals();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openLaunch = document.querySelector('.manager-modal[id$="FormModal"].open');
      if (openLaunch instanceof HTMLElement) {
        event.preventDefault();
        closeLaunchFormModals();
        return;
      }
      const success = document.getElementById('managerSuccessModal');
      if (success instanceof HTMLElement && success.classList.contains('open')) {
        event.preventDefault();
        hideSuccessModal();
      }
    });
  }

  function initBackToTopButton() {
    if (document.querySelector('.back-to-top-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top-btn';
    button.setAttribute('aria-label', 'Наверх');
    button.textContent = '↑';
    document.body.appendChild(button);

    const updateVisibility = () => {
      button.classList.toggle('is-visible', window.scrollY > 320);
    };

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  function addPost(post) {
    state.posts.unshift(post);
    state.posts = sortByDateDesc(state.posts);
    saveArchivePosts();
    publishToClient();
  }

  function togglePostVisibility(postId) {
    const hidden = new Set(state.admin.hiddenPostIds || []);
    if (hidden.has(postId)) hidden.delete(postId);
    else hidden.add(postId);
    state.admin.hiddenPostIds = Array.from(hidden);
    saveAdminData();
    publishToClient();
  }

  function removePost(postId) {
    state.posts = state.posts.filter((post) => post.id !== postId);
    state.admin.hiddenPostIds = (state.admin.hiddenPostIds || []).filter((id) => id !== postId);
    state.admin.extraStories = (state.admin.extraStories || []).filter((story) => story.postId !== postId);
    saveArchivePosts();
    saveAdminData();
    publishToClient();
  }

  function initManagerMobileDock() {
    const dock = document.querySelector('.mgr-mobile-dock');
    if (!(dock instanceof HTMLElement)) return;
    const links = [...dock.querySelectorAll('.mgr-mobile-dock-btn')];
    if (!links.length) return;

    const sectionByKey = {
      tools: document.getElementById('managerToolsSection'),
      polls: document.getElementById('managerPollResultsSection'),
      archive: document.getElementById('managerPostsSection'),
    };

    function setActive(key) {
      links.forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-mgr-section') === key);
      });
    }

    links.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-mgr-section');
        if (key) setActive(key);
      });
    });

    if (typeof IntersectionObserver !== 'function') {
      setActive('tools');
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) {
            best = { id: e.target.id, ratio: e.intersectionRatio };
          }
        }
        if (!best) return;
        if (best.id === 'managerToolsSection') setActive('tools');
        else if (best.id === 'managerPollResultsSection') setActive('polls');
        else if (best.id === 'managerPostsSection') setActive('archive');
      },
      { root: null, rootMargin: '-35% 0px -42% 0px', threshold: [0, 0.12, 0.35] }
    );
    Object.values(sectionByKey).forEach((el) => {
      if (el instanceof HTMLElement) obs.observe(el);
    });
  }

  function bindEvents() {
    initManagerMobileDock();

    document.getElementById('managerFeedbackList')?.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest('[data-mgr-feedback-toggle]');
      if (!(btn instanceof HTMLButtonElement)) return;
      const id = Number(btn.getAttribute('data-mgr-feedback-toggle'));
      if (!Number.isFinite(id) || id <= 0) return;
      const row = managerFeedbackItems.find((x) => Number(x.id) === id);
      const next = !Boolean(row?.contacted);
      void toggleManagerFeedbackContacted(id, next);
    });

    const postForm = document.getElementById('managerPostForm');
    const factForm = document.getElementById('managerFactForm');
    const blocksForm = document.getElementById('managerBlocksForm');
    const storyForm = document.getElementById('managerStoryForm');
    const pollForm = document.getElementById('managerPollForm');
    const deactivatePollBtn = document.getElementById('deactivatePollBtn');
    const logoutBtn = document.getElementById('managerLogoutBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const api = window.EkvalineAPI;
        if (api?.json) {
          try {
            await api.json('/api/auth/logout', { method: 'POST', body: {} });
          } catch {
            /* ignore */
          }
          api.resetCsrf?.();
        }
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = 'index.html';
      });
    }

    if (postForm instanceof HTMLFormElement) {
      const titleField = postForm.elements.namedItem('title');
      const excerptField = postForm.elements.namedItem('excerpt');
      const detailsField = postForm.elements.namedItem('details');
      bindLimitForField(titleField, postForm.querySelector('[data-limit-for="title"]'), 80);
      bindLimitForField(excerptField, postForm.querySelector('[data-limit-for="excerpt"]'), 180);
      bindLimitForField(detailsField, postForm.querySelector('[data-limit-for="details"]'), 1200);

      postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = String(postForm.elements.namedItem('title')?.value || '').trim();
        const excerpt = String(postForm.elements.namedItem('excerpt')?.value || '').trim();
        const details = String(postForm.elements.namedItem('details')?.value || '').trim();
        const imageInput = postForm.elements.namedItem('image');

        if (!title || !excerpt || !details || !(imageInput instanceof HTMLInputElement) || !imageInput.files?.[0]) {
          showManagerFormError('Заполните заголовок, тексты и выберите фото поста.');
          return;
        }
        const image = await fileToDataUrl(imageInput.files[0]);
        const createdAt = new Date().toISOString();
        const id = `p_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;

        addPost({
          id,
          title: truncate(title, 80),
          excerpt: truncate(excerpt, 180),
          details: truncate(details, 1200),
          image,
          imageMode: 'cover',
          imageBg: '#ffffff',
          createdAt,
          views: 0,
          likes: 0,
          comments: [],
          reactions: { useful: 0, new: 0, tryIt: 0 },
          saved: false,
        });

        postForm.reset();
        renderAll();
        showSuccessModal('Пост успешно опубликован.');
      });
    }

    if (factForm instanceof HTMLFormElement) {
      const factField = factForm.elements.namedItem('fact');
      bindLimitForField(factField, factForm.querySelector('[data-limit-for="fact"]'), 160);

      factForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = String(factForm.elements.namedItem('fact')?.value || '').trim();
        if (!value) {
          showManagerFormError('Введите текст факта дня.');
          return;
        }
        state.admin.factOfDay = truncate(value, 160);
        saveAdminData();
        renderFactForm();
        renderBlocksPreview();
        showSuccessModal('Факт дня успешно сохранён.');
      });
    }

    if (blocksForm instanceof HTMLFormElement) {
      const popularField = blocksForm.elements.namedItem('popular');
      const tipsField = blocksForm.elements.namedItem('tips');
      const recipesField = blocksForm.elements.namedItem('recipes');
      const factTitleField = blocksForm.elements.namedItem('factTitle');
      const popularTitleField = blocksForm.elements.namedItem('popularTitle');
      const tipsTitleField = blocksForm.elements.namedItem('tipsTitle');
      const recipesTitleField = blocksForm.elements.namedItem('recipesTitle');
      bindLimitForField(factTitleField, blocksForm.querySelector('[data-limit-for="fact-title"]'), 40);
      bindLimitForField(popularTitleField, blocksForm.querySelector('[data-limit-for="popular-title"]'), 40);
      bindLimitForField(tipsTitleField, blocksForm.querySelector('[data-limit-for="tips-title"]'), 40);
      bindLimitForField(recipesTitleField, blocksForm.querySelector('[data-limit-for="recipes-title"]'), 40);
      bindLimitForField(popularField, blocksForm.querySelector('[data-limit-for="popular"]'), 700);
      bindLimitForField(tipsField, blocksForm.querySelector('[data-limit-for="tips"]'), 900);
      bindLimitForField(recipesField, blocksForm.querySelector('[data-limit-for="recipes"]'), 900);

      blocksForm.addEventListener('submit', (event) => {
        event.preventDefault();
        state.admin.blockTitles = {
          fact: truncate(String(factTitleField?.value || '').trim() || 'Факт дня', 40),
          popular: truncate(String(popularTitleField?.value || '').trim() || 'Популярное', 40),
          tips: truncate(String(tipsTitleField?.value || '').trim() || 'Советы дня', 40),
          recipes: truncate(String(recipesTitleField?.value || '').trim() || 'Рецепты с водой', 40),
        };
        state.admin.popular = normalizeMultilineList(popularField?.value, 10);
        state.admin.tips = normalizeMultilineList(tipsField?.value, 12);
        state.admin.recipes = normalizeMultilineList(recipesField?.value, 12);
        saveAdminData();
        renderBlocksForm();
        renderBlocksPreview();
        showSuccessModal('Боковые блоки успешно сохранены.');
      });
    }

    if (storyForm instanceof HTMLFormElement) {
      const titleField = storyForm.elements.namedItem('title');
      const textField = storyForm.elements.namedItem('text');
      bindLimitForField(titleField, storyForm.querySelector('[data-limit-for="story-title"]'), 40);
      bindLimitForField(textField, storyForm.querySelector('[data-limit-for="story-text"]'), 180);

      storyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = String(storyForm.elements.namedItem('title')?.value || '').trim();
        const text = String(storyForm.elements.namedItem('text')?.value || '').trim();
        const postId = String(storyForm.elements.namedItem('postId')?.value || '').trim();
        const imageInput = storyForm.elements.namedItem('image');
        if (!title || !text || !(imageInput instanceof HTMLInputElement) || !imageInput.files?.[0]) {
          showManagerFormError('Заполните заголовок, текст и выберите фото истории.');
          return;
        }
        const image = await fileToDataUrl(imageInput.files[0]);
        state.admin.extraStories.unshift({
          id: `s_extra_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title: truncate(title, 40),
          text: truncate(text, 180),
          image,
          postId,
          imageMode: 'cover',
          imageBg: '#ffffff',
        });
        saveAdminData();
        storyForm.reset();
        renderAll();
        showSuccessModal('История успешно добавлена.');
      });
    }

    if (pollForm instanceof HTMLFormElement) {
      const titleField = pollForm.elements.namedItem('title');
      const questionField = pollForm.elements.namedItem('question');
      const optionsContainer = document.getElementById('pollOptionsContainer');
      const addOptionBtn = document.getElementById('addPollOptionBtn');
      const maxPollOptions = 8;
      const minPollOptions = 2;
      bindLimitForField(titleField, pollForm.querySelector('[data-limit-for="poll-title"]'), 40);
      bindLimitForField(questionField, pollForm.querySelector('[data-limit-for="poll-question"]'), 120);

      const renderPollOptionFields = (values) => {
        if (!(optionsContainer instanceof HTMLElement)) return;
        const normalized = (Array.isArray(values) ? values : [])
          .map((item) => truncate(String(item || '').trim(), 60))
          .filter(Boolean);
        while (normalized.length < minPollOptions) normalized.push('');
        optionsContainer.innerHTML = normalized
          .map(
            (value, index) => `
            <label class="manager-poll-option-row">
              <span>Вариант ${index + 1} (до 60)</span>
              <div class="manager-poll-option-input-wrap">
                <input type="text" name="pollOption_${index + 1}" maxlength="60" value="${escapeHtml(value)}" required />
                <button type="button" class="manager-btn is-secondary manager-poll-remove-btn" data-remove-poll-option="${index}" ${
                  normalized.length <= minPollOptions ? 'disabled' : ''
                }>−</button>
              </div>
              <span class="manager-limit" data-poll-option-limit="${index}">${value.length}/60</span>
            </label>
          `
          )
          .join('');
        if (addOptionBtn instanceof HTMLButtonElement) {
          addOptionBtn.disabled = normalized.length >= maxPollOptions;
        }
      };

      const collectPollOptionValues = () => {
        if (!(optionsContainer instanceof HTMLElement)) return [];
        return Array.from(optionsContainer.querySelectorAll('input[name^="pollOption_"]'))
          .map((input) => (input instanceof HTMLInputElement ? truncate(input.value.trim(), 60) : ''))
          .filter(Boolean);
      };

      const syncPollOptionLimits = () => {
        if (!(optionsContainer instanceof HTMLElement)) return;
        Array.from(optionsContainer.querySelectorAll('input[name^="pollOption_"]')).forEach((input, index) => {
          if (!(input instanceof HTMLInputElement)) return;
          const limit = optionsContainer.querySelector(`[data-poll-option-limit="${index}"]`);
          if (limit) limit.textContent = `${input.value.length}/60`;
        });
      };

      const current = state.admin.hydrationPoll;
      if (current && current.question) {
        if (titleField instanceof HTMLInputElement) titleField.value = current.title || 'Опрос дня';
        if (questionField instanceof HTMLTextAreaElement) questionField.value = current.question || '';
        renderPollOptionFields((current.options || []).map((item) => item.text));
        [titleField, questionField].forEach((field) => {
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            field.dispatchEvent(new Event('input'));
          }
        });
        syncPollOptionLimits();
      } else {
        renderPollOptionFields(['', '']);
      }

      if (addOptionBtn instanceof HTMLButtonElement) {
        addOptionBtn.addEventListener('click', () => {
          const values = collectPollOptionValues();
          if (values.length >= maxPollOptions) return;
          values.push('');
          renderPollOptionFields(values);
          syncPollOptionLimits();
        });
      }

      if (optionsContainer instanceof HTMLElement) {
        optionsContainer.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const removeBtn = target.closest('[data-remove-poll-option]');
          if (!(removeBtn instanceof HTMLButtonElement)) return;
          const index = Number(removeBtn.getAttribute('data-remove-poll-option'));
          if (!Number.isInteger(index)) return;
          const values = collectPollOptionValues();
          if (values.length <= minPollOptions) return;
          values.splice(index, 1);
          renderPollOptionFields(values);
          syncPollOptionLimits();
        });

        optionsContainer.addEventListener('input', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLInputElement)) return;
          syncPollOptionLimits();
        });
      }

      pollForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = truncate(String(titleField?.value || 'Опрос дня').trim() || 'Опрос дня', 40);
        const question = truncate(String(questionField?.value || '').trim(), 120);
        const values = collectPollOptionValues();
        if (!question || values.length < 2) {
          showManagerFormError('Укажите вопрос и минимум два варианта ответа.');
          return;
        }

        const prev = state.admin.hydrationPoll;
        const prevMap = new Map((prev?.options || []).map((opt) => [String(opt.text || '').trim(), Number(opt.votes) || 0]));
        state.admin.hydrationPoll = {
          id: `poll_${Date.now()}`,
          title,
          question,
          active: true,
          options: values.map((text, idx) => ({
            id: `o${idx + 1}`,
            text,
            votes: prevMap.get(text) || 0,
          })),
        };
        saveAdminData();
        void syncBlogPollToServer(state.admin.hydrationPoll);
        void renderPollResults();
        showSuccessModal('Опрос сохранён и опубликован.');
      });
    }

    if (deactivatePollBtn instanceof HTMLButtonElement) {
      deactivatePollBtn.addEventListener('click', () => {
        if (!state.admin.hydrationPoll) {
          showManagerFormError('Сначала сохраните опрос.');
          return;
        }
        state.admin.hydrationPoll = { ...state.admin.hydrationPoll, active: false };
        saveAdminData();
        void syncBlogPollToServer(state.admin.hydrationPoll);
        void renderPollResults();
        showSuccessModal('Опрос скрыт с блога.');
      });
    }

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const closePost = target.closest('[data-close-post-modal]');
      if (closePost) {
        closePostModal();
        return;
      }

      const closeComments = target.closest('[data-close-comments-modal]');
      if (closeComments) {
        closeCommentsModal();
        return;
      }

      const openCommentsBtn = target.closest('#openCommentsModalBtn');
      if (openCommentsBtn) {
        openCommentsModal();
        return;
      }

      const openPostBtn = target.closest('[data-open-post]');
      if (openPostBtn) {
        const postId = openPostBtn.getAttribute('data-open-post');
        if (!postId) return;
        openPostModal(postId);
        return;
      }

      const toggleBtn = target.closest('[data-toggle-post]');
      if (toggleBtn) {
        const postId = toggleBtn.getAttribute('data-toggle-post');
        if (!postId) return;
        togglePostVisibility(postId);
        renderAll();
        openPostModal(postId);
        return;
      }

      const deleteBtn = target.closest('[data-delete-post]');
      if (deleteBtn) {
        const postId = deleteBtn.getAttribute('data-delete-post');
        if (!postId) return;
        removePost(postId);
        renderAll();
        closePostModal();
        return;
      }

      const deleteStoryBtn = target.closest('[data-delete-story]');
      if (deleteStoryBtn) {
        const storyId = deleteStoryBtn.getAttribute('data-delete-story');
        if (!storyId) return;
        state.admin.extraStories = state.admin.extraStories.filter((story) => story.id !== storyId);
        saveAdminData();
        renderAll();
        showSuccessModal('История удалена.');
        return;
      }

      const openStoryEditorBtn = target.closest('[data-edit-story]');
      if (openStoryEditorBtn) {
        const storyId = openStoryEditorBtn.getAttribute('data-edit-story');
        const kind = openStoryEditorBtn.getAttribute('data-story-kind') || 'manual';
        const postId = openStoryEditorBtn.getAttribute('data-story-post') || '';
        if (!storyId) return;
        openStoryModal({ storyId, kind, postId });
        return;
      }

      const closeStory = target.closest('[data-close-story-modal]');
      if (closeStory) {
        closeStoryModal();
        return;
      }

      const resetAuto = target.closest('[data-reset-auto-story]');
      if (resetAuto) {
        const form = target.closest('.manager-story-edit-form');
        if (!(form instanceof HTMLFormElement)) return;
        const postId = form.getAttribute('data-story-post');
        if (!postId) return;
        const overrides = { ...(state.admin.storyOverrides || {}) };
        delete overrides[postId];
        state.admin.storyOverrides = overrides;
        saveAdminData();
        closeStoryModal();
        renderAll();
        showSuccessModal('Авто-настройки истории сброшены.');
      }
    });

    document.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) return;
      const editForm = target.closest('.manager-post-edit-form, .manager-story-edit-form');
      if (editForm instanceof HTMLFormElement) {
        updateInlineLimitCounters(editForm);
      }
      if (!(target instanceof HTMLTextAreaElement)) return;
      const form = target.closest('.manager-reply-form');
      if (!(form instanceof HTMLFormElement)) return;
      const counter = form.querySelector('[data-reply-limit]');
      if (counter) counter.textContent = `${target.value.length}/300`;
    });

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('.manager-post-edit-form')) {
        event.preventDefault();
        const postId = form.getAttribute('data-edit-form');
        if (!postId) return;

        const title = String(form.elements.namedItem('title')?.value || '').trim();
        const excerpt = String(form.elements.namedItem('excerpt')?.value || '').trim();
        const details = String(form.elements.namedItem('details')?.value || '').trim();
        const imageInput = form.elements.namedItem('image');

        if (!title || !excerpt || !details) return;

        const applyUpdate = (nextImage) => {
          state.posts = state.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  title: truncate(title, 80),
                  excerpt: truncate(excerpt, 180),
                  details: truncate(details, 1200),
                  image: nextImage || post.image,
                }
              : post
          );
          saveArchivePosts();
          publishToClient();
          renderAll();
          closePostModal();
          showSuccessModal('Пост успешно обновлен.');
        };

        if (imageInput instanceof HTMLInputElement && imageInput.files?.[0]) {
          fileToDataUrl(imageInput.files[0]).then((dataUrl) => applyUpdate(dataUrl));
        } else {
          applyUpdate('');
        }
        return;
      }
      if (form.matches('.manager-story-edit-form')) {
        event.preventDefault();
        const kind = form.getAttribute('data-story-kind') || 'manual';
        const storyId = form.getAttribute('data-story-edit');
        const postId = form.getAttribute('data-story-post') || '';
        const title = truncate(String(form.elements.namedItem('title')?.value || '').trim(), 40);
        const text = truncate(String(form.elements.namedItem('text')?.value || '').trim(), 180);
        const imageInput = form.elements.namedItem('image');
        if (!title || !text || !storyId) return;

        const applyStoryUpdate = (nextImage) => {
          if (kind === 'manual') {
            state.admin.extraStories = (state.admin.extraStories || []).map((story) =>
              story.id === storyId
                ? {
                    ...story,
                    title,
                    text,
                    image: nextImage || story.image,
                  }
                : story
            );
          } else if (postId) {
            state.admin.storyOverrides = {
              ...(state.admin.storyOverrides || {}),
              [postId]: {
                title,
                text,
                ...(nextImage ? { image: nextImage } : {}),
              },
            };
          }
          saveAdminData();
          closeStoryModal();
          renderAll();
          showSuccessModal('История успешно обновлена.');
        };

        if (imageInput instanceof HTMLInputElement && imageInput.files?.[0]) {
          fileToDataUrl(imageInput.files[0]).then((dataUrl) => applyStoryUpdate(dataUrl));
        } else {
          applyStoryUpdate('');
        }
        return;
      }
      if (!form.matches('.manager-reply-form')) return;
      event.preventDefault();

      const postId = form.getAttribute('data-reply-post');
      const commentId = form.getAttribute('data-reply-comment');
      const textarea = form.querySelector('textarea[name="replyText"]');
      if (!postId || !commentId || !(textarea instanceof HTMLTextAreaElement)) return;
      const text = textarea.value.trim();
      if (!text) return;

      state.posts = state.posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: (post.comments || []).map((comment) => {
            if (comment.id !== commentId) return comment;
            return {
              ...comment,
              replies: [
                ...(Array.isArray(comment.replies) ? comment.replies : []),
                {
                  id: `r_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
                  name: 'Менеджер',
                  text: truncate(text, 300),
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }),
        };
      });

      saveArchivePosts();
      publishToClient();
      textarea.value = '';
      renderAll();
      openCommentsModal();
      showSuccessModal('Ответ на комментарий успешно отправлен.');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeLaunchFormModals();
      closePostModal();
      closeStoryModal();
      closeCommentsModal();
      hideSuccessModal();
    });
  }

  function persistManagerUserFromApi(u) {
    if (!u || typeof u !== 'object') return;
    const name =
      String(u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '').trim() ||
      String(u.email || 'Менеджер');
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({
        id: u.id,
        name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
        bonus_balance: u.bonus_balance,
      })
    );
  }

  /** Сессия cookie + профиль с сервера (не только localStorage после входа). */
  async function hydrateManagerFromServerSession() {
    const api = window.EkvalineAPI?.json ? window.EkvalineAPI : null;
    if (!api) return;
    try {
      const r = await api.json('/api/auth/me');
      if (!r.ok) {
        if (Number(r.status) === 401 || Number(r.status) === 403) {
          const cur = readCurrentUser();
          const role = String(cur?.role || '').toLowerCase();
          if (cur && (role === 'manager' || role === 'admin')) {
            localStorage.removeItem(CURRENT_USER_KEY);
          }
        }
        return;
      }
      const u = r.data?.user;
      if (u && typeof u === 'object') {
        persistManagerUserFromApi(u);
        syncManagerHeadForRole(u);
        return;
      }
      const cur = readCurrentUser();
      const role = String(cur?.role || '').toLowerCase();
      if (cur && (role === 'manager' || role === 'admin')) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch {
      /* сеть недоступна — оставляем localStorage */
    }
  }

  function syncManagerHeadForRole(user) {
    const backBtn = document.getElementById('managerBackToAdminBtn');
    if (!(backBtn instanceof HTMLElement)) return;
    const role = String(user?.role || readCurrentUser()?.role || '').trim().toLowerCase();
    const showForAdmin = role === 'admin';
    backBtn.hidden = !showForAdmin;
    backBtn.setAttribute('aria-hidden', showForAdmin ? 'false' : 'true');
  }

  function enforceAccess() {
    const user = readCurrentUser();
    const role = String(user?.role || '').toLowerCase();
    if (!user || (role !== 'manager' && role !== 'admin')) {
      window.location.href = 'index.html';
      return false;
    }
    const id = Number(user.id);
    if (!Number.isFinite(id) || id <= 0) {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = 'index.html';
      return false;
    }
    syncManagerHeadForRole(user);
    return true;
  }

  async function initManagerApp() {
    try {
      await window.EkvalineAPI?.awaitBootReconciliation?.();
    } catch {
      /* ignore */
    }
    await hydrateManagerFromServerSession();
    if (!enforceAccess()) return;
    initState();
    void loadManagerFeedback();
    void syncBlogPollToServer(state.admin.hydrationPoll);
    renderAll();
    initLaunchFormModals();
    setupArchiveCarousel();
    initBackToTopButton();
    bindEvents();
    ensureSuccessModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    void initManagerApp();
  });
})();
