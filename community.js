(function () {
  const FEED_KEY = 'ekvaline_blog_v2_posts';
  const WATER_KEY = 'ekvaline_blog_v2_water_liters';
  const SORT_KEY = 'ekvaline_blog_v2_sort';
  const BLOG_ADMIN_KEY = 'ekvaline_blog_manager_data';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const POLL_VOTES_KEY = 'ekvaline_blog_poll_votes';
  const STORY_MS = 7000;
  const MAX_POSTS = 5;
  const DAILY_TARGET = 2.0;
  const HYDRATION_MAX = 5.0;

  const DEFAULT_FACTS = [
    'Даже легкое обезвоживание снижает концентрацию на 20%.',
    'Стакан воды утром помогает мягко запустить обмен веществ.',
    'Во время тренировки полезно пить воду каждые 15-20 минут.',
    'Недостаток воды чаще всего ощущается как усталость и сонливость.',
  ];

  const STORY_PRESETS = [
    {
      match: /почему важно пить воду/i,
      title: 'Почему важно пить воду',
      text: 'Вода поддерживает энергию, работу мозга и нормальный обмен веществ. Начните с 1 стакана утром.',
      ring: 'ring-water',
      mood: 'story-bg-water',
    },
    {
      match: /спорт|трениров/i,
      title: 'Вода и спорт',
      text: 'Во время нагрузки организм теряет жидкость быстрее. Делайте небольшие глотки до, во время и после тренировки.',
      ring: 'ring-sport',
      mood: 'story-bg-sport',
    },
    {
      match: /детокс/i,
      title: 'Детокс привычки',
      text: 'Добавляйте в воду лимон, мяту или ягоды. Так проще соблюдать питьевой режим каждый день.',
      ring: 'ring-detox',
      mood: 'story-bg-detox',
    },
    {
      match: /привычек|гидратац/i,
      title: '5 привычек гидратации',
      text: 'Коротко про привычки, которые помогают пить воду регулярно и без лишнего стресса.',
      ring: 'ring-summer',
      mood: 'story-bg-summer',
    },
    {
      match: /рецепт/i,
      title: 'Рецепты воды',
      text: 'Попробуйте воду с лимоном, мятой и ягодами. Это помогает пить больше воды без сахара.',
      ring: 'ring-water',
      mood: 'story-bg-water',
    },
    {
      match: /семь/i,
      title: 'Вода для семьи',
      text: 'Семейный режим питья проще держать, если вода всегда в доступе дома и в дороге.',
      ring: 'ring-detox',
      mood: 'story-bg-detox',
    },
  ];

  const DEFAULT_POSTS = [
    {
      id: 'p1',
      title: 'Почему важно пить воду каждый день',
      excerpt: 'Вода влияет на энергию, концентрацию и общее состояние организма. Несколько простых привычек помогут пить достаточно.',
      details:
        'Регулярное питье поддерживает работу мозга, концентрацию и нормальную терморегуляцию. Начинайте день со стакана воды, держите бутылку рядом во время работы и распределяйте объем небольшими порциями каждые 1-2 часа. Так организм лучше усваивает воду без ощущения тяжести.',
      image: 'assets/story-ocean-world.png',
      readTime: '2 мин',
      createdAt: '2026-04-26T10:20:00.000Z',
      likes: 128,
      comments: [
        { id: 'c11', name: 'Марина', text: 'Очень полезная статья, спасибо!', likes: 4 },
        { id: 'c12', name: 'Олег', text: 'С утра стакан воды реально помогает.', likes: 2 },
      ],
      reactions: { useful: 29, new: 18, tryIt: 10 },
      saved: false,
    },
    {
      id: 'p2',
      title: '5 привычек для здорового питьевого режима',
      excerpt: 'Поставьте воду на видное место, начните утро со стакана воды и добавьте мягкие напоминания в течение дня.',
      details:
        '1) Начинайте утро со стакана воды сразу после пробуждения. 2) Держите бутылку воды на рабочем столе, чтобы она всегда была перед глазами. 3) Пейте небольшими порциями каждые 60-90 минут, а не большими объемами редко. 4) Привяжите воду к привычным действиям: перед едой, после прогулки, после звонка. 5) Делайте вкус воды приятнее: добавляйте лимон, мяту, огурец или ягоды без сахара. Такая система помогает держать стабильный питьевой режим, снижает усталость и улучшает концентрацию в течение дня.',
      image: 'assets/story-5-habits-eco.png',
      readTime: '3 мин',
      createdAt: '2026-04-25T17:04:00.000Z',
      likes: 94,
      comments: [{ id: 'c21', name: 'Ирина', text: 'Сделала трекер и стало проще держать режим.', likes: 1 }],
      reactions: { useful: 24, new: 9, tryIt: 15 },
      saved: false,
    },
    {
      id: 'p3',
      title: 'Вода и спорт: как пить до и после тренировки',
      excerpt: 'Гидратация в спорте помогает держать выносливость и быстрее восстанавливаться после нагрузки.',
      details:
        'Грамотная гидратация напрямую влияет на результат тренировки и скорость восстановления. За 20-30 минут до старта выпейте 200-300 мл воды, а во время занятия делайте небольшие глотки каждые 10-15 минут. После тренировки важно восполнить потерю жидкости в течение первого часа, особенно если была интенсивная нагрузка или жаркая погода. Для удобства держите бутылку рядом и ориентируйтесь на самочувствие: сухость во рту, спад энергии и снижение концентрации часто говорят о нехватке воды.',
      image: 'assets/story-water-sport-runner.png',
      imageMode: 'contain',
      imageBg: '#ffffff',
      readTime: '5 мин',
      createdAt: '2026-04-24T13:30:00.000Z',
      likes: 76,
      comments: [{ id: 'c31', name: 'Даниил', text: 'Нужный материал для тех, кто тренируется.', likes: 3 }],
      reactions: { useful: 18, new: 6, tryIt: 12 },
      saved: false,
    },
    {
      id: 'p4',
      title: '3 рецепта detox-воды на каждый день',
      excerpt: 'Лимон и мята, огурец и лайм, ягоды и базилик — попробуйте разные вкусы и найдите свой любимый.',
      details:
        'Detox-вода помогает разнообразить питьевой режим без сахара и газировки. Базовая формула простая: холодная вода + цитрус + травы/ягоды, затем настаивание 20-30 минут. Вариант 1: лимон + мята для свежести и бодрости утром. Вариант 2: огурец + лайм для мягкого вкуса в течение рабочего дня. Вариант 3: ягоды + базилик для яркого аромата к вечеру. Готовьте напиток в прозрачной бутылке и держите рядом — так проще поддерживать регулярное питье.',
      image: 'assets/story-detox-lemon-black.png',
      imageMode: 'contain',
      imageBg: '#000000',
      readTime: '2 мин',
      createdAt: '2026-04-23T09:10:00.000Z',
      likes: 62,
      comments: [],
      reactions: { useful: 12, new: 14, tryIt: 20 },
      saved: false,
    },
    {
      id: 'p5',
      title: 'Детокс привычки на каждый день',
      excerpt: 'Маленькие ежедневные шаги с водой помогают чувствовать лёгкость и поддерживать стабильный питьевой режим.',
      details:
        'Detox-привычки не требуют жёстких ограничений: ключ в регулярности и удобстве. Начните утро со стакана воды комнатной температуры, затем распределяйте объем небольшими порциями в течение дня. Добавляйте в воду лимон, лайм, мяту или ягоды для мягкого вкуса без сахара. Держите бутылку рядом в зоне видимости и используйте простые триггеры: вода после прогулки, перед едой и после длительных звонков. Такой режим помогает снизить усталость, поддерживать концентрацию и избежать резких провалов энергии в течение дня.',
      image: 'assets/story-detox-nature-water.png',
      imageMode: 'cover',
      imageBg: '#ffffff',
      readTime: '4 мин',
      createdAt: '2026-04-22T12:10:00.000Z',
      likes: 58,
      comments: [{ id: 'c51', name: 'Алёна', text: 'Очень понравился формат с маленькими шагами.', likes: 1 }],
      reactions: { useful: 17, new: 10, tryIt: 11 },
      saved: false,
    },
  ];

  let state = {
    sort: 'new',
    posts: [],
    storyIndex: -1,
    storyTimer: null,
    storyProgressTimer: null,
    storyProgressStart: 0,
    storyRemainingMs: STORY_MS,
    storyPaused: false,
    storyPauseStartedAt: 0,
    water: 1.2,
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
  let revealObserver = null;

  function safeJsonParse(raw, fallback) {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function savePosts() {
    localStorage.setItem(FEED_KEY, JSON.stringify(state.posts));
  }

  function saveSort() {
    localStorage.setItem(SORT_KEY, state.sort);
  }

  function saveWater() {
    localStorage.setItem(WATER_KEY, String(state.water));
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

  function readPollVotes() {
    return safeJsonParse(localStorage.getItem(POLL_VOTES_KEY), {});
  }

  function savePollVotes(votes) {
    localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(votes));
  }

  function readCurrentUser() {
    return safeJsonParse(localStorage.getItem(CURRENT_USER_KEY), null);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function userName() {
    const user = safeJsonParse(localStorage.getItem('ekvaline_current_user'), null);
    return user && user.name ? user.name : 'Гость';
  }

  function initials(name) {
    const s = String(name || '?').trim();
    return (s[0] || '?').toUpperCase();
  }

  function formatDate(iso) {
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
  }

  function postPopularity(post) {
    const commentsCount = (post.comments || []).length;
    const reactions = post.reactions || {};
    const reactionScore = (reactions.useful || 0) + (reactions.new || 0);
    return post.likes * 2 + commentsCount * 3 + reactionScore;
  }

  function sortedPosts() {
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const copy = state.posts.filter((post) => !hidden.has(post.id));
    if (state.sort === 'popular') {
      return copy.sort((a, b) => postPopularity(b) - postPopularity(a));
    }
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function enforcePostsLimit(posts) {
    const ordered = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ordered.slice(0, MAX_POSTS);
  }

  function getStories() {
    const posts = enforcePostsLimit(state.posts);
    const hidden = new Set(state.admin.hiddenPostIds || []);
    const autoStories = posts
      .filter((post) => !hidden.has(post.id))
      .map((post, index) => {
      const preset = STORY_PRESETS.find((item) => item.match.test(post.title || ''));
      const override = state.admin.storyOverrides?.[post.id] || {};
      return {
        id: `s_auto_${post.id || index}`,
        title: (override.title || preset?.title || String(post.title || 'История')).slice(0, 60),
        text: (override.text || preset?.text || post.excerpt || 'Короткая история по материалу блога.').slice(0, 220),
        ring: preset?.ring || 'ring-water',
        mood: preset?.mood || 'story-bg-water',
        image: override.image || post.image,
        thumb: override.image || post.image,
        postId: post.id,
        postTitleHint: post.title,
        imageMode: override.imageMode === 'contain' ? 'contain' : post.imageMode,
        imageBg: override.imageBg || post.imageBg,
      };
    });
    const extraStories = (state.admin.extraStories || []).map((story, index) => ({
      id: story.id || `s_extra_${index}_${Date.now()}`,
      title: String(story.title || 'История').slice(0, 60),
      text: String(story.text || '').slice(0, 220),
      ring: story.ring || 'ring-water',
      mood: story.mood || 'story-bg-water',
      image: story.image || 'assets/popular-1.png',
      thumb: story.image || 'assets/popular-1.png',
      postId: story.postId || '',
      postTitleHint: story.postTitleHint || '',
      imageMode: story.imageMode === 'contain' ? 'contain' : 'cover',
      imageBg: story.imageBg || '#ffffff',
    }));
    return [...extraStories, ...autoStories];
  }


  function renderStories() {
    const root = document.getElementById('blogStories');
    if (!root) return;
    const stories = getStories();
    const shortLabel = (value) => {
      const text = String(value || '').trim().replace(/\s+/g, ' ');
      if (text.length <= 32) return text;
      return `${text.slice(0, 31).trimEnd()}…`;
    };
    root.innerHTML = stories.map(
      (story, idx) => `
      <button type="button" class="blogv2-story" data-story-index="${idx}">
        <span class="blogv2-story-ring ${escapeHtml(story.ring || '')}">
          <span class="blogv2-story-inner ${escapeHtml(story.mood || '')}" style="--story-thumb:url('${escapeHtml(story.thumb || story.image || 'assets/popular-1.png')}')">
          </span>
        </span>
        <span>${escapeHtml(shortLabel(story.title))}</span>
      </button>
    `
    ).join('');
  }

  function renderPopular() {
    const root = document.getElementById('popularList');
    if (!root) return;
    if (Array.isArray(state.admin.popular) && state.admin.popular.length) {
      root.innerHTML = state.admin.popular.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return;
    }
    const top = [...state.posts].sort((a, b) => postPopularity(b) - postPopularity(a)).slice(0, 3);
    root.innerHTML = top
      .map((post) => `<li>${escapeHtml(post.title)}</li>`)
      .join('');
  }

  function renderFact() {
    const root = document.getElementById('factOfDayText');
    if (!root) return;
    if (state.admin.factOfDay && state.admin.factOfDay.trim()) {
      root.textContent = state.admin.factOfDay.trim();
      return;
    }
    const idx = new Date().getDate() % DEFAULT_FACTS.length;
    root.textContent = DEFAULT_FACTS[idx];
  }

  function renderHydration() {
    const valueEl = document.getElementById('hydrationValueText');
    const fillEl = document.getElementById('hydrationFill');
    const limitEl = document.getElementById('hydrationLimitText');
    if (!valueEl || !fillEl || !limitEl) return;
    const normalized = Math.max(0, Math.min(HYDRATION_MAX, state.water));
    valueEl.textContent = normalized.toFixed(1);
    const percent = Math.min(100, Math.round((normalized / DAILY_TARGET) * 100));
    fillEl.style.width = `${percent}%`;
    const isOver = normalized > DAILY_TARGET;
    fillEl.classList.toggle('is-overlimit', isOver);
    if (isOver) {
      const extra = (normalized - DAILY_TARGET).toFixed(1);
      limitEl.textContent = `Норма: до ${DAILY_TARGET.toFixed(1)} л/день. Превышение: +${extra} л. Лимит индикатора: ${HYDRATION_MAX.toFixed(1)} л.`;
      limitEl.classList.add('is-overlimit');
    } else {
      limitEl.textContent = `Норма: до ${DAILY_TARGET.toFixed(1)} л/день. Лимит индикатора: ${HYDRATION_MAX.toFixed(1)} л.`;
      limitEl.classList.remove('is-overlimit');
    }
  }

  function renderTipsAndRecipes() {
    const tipsRoot = document.getElementById('tipsList');
    const recipesRoot = document.getElementById('recipesList');
    if (tipsRoot && Array.isArray(state.admin.tips) && state.admin.tips.length) {
      tipsRoot.innerHTML = state.admin.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
    }
    if (recipesRoot && Array.isArray(state.admin.recipes) && state.admin.recipes.length) {
      recipesRoot.innerHTML = state.admin.recipes.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }
  }

  function renderHydrationPoll() {
    const card = document.getElementById('hydrationPollCard');
    const questionEl = document.getElementById('hydrationPollQuestion');
    const optionsEl = document.getElementById('hydrationPollOptions');
    const titleEl = document.getElementById('hydrationPollTitle');
    if (!card || !questionEl || !optionsEl || !titleEl) return;

    const poll = state.admin.hydrationPoll;
    if (!poll || !poll.active || !poll.question || !Array.isArray(poll.options) || poll.options.length < 2) {
      card.hidden = true;
      return;
    }

    const votesMap = readPollVotes();
    const alreadyVoted = Boolean(votesMap[poll.id]);
    const totalVotes = poll.options.reduce((sum, item) => sum + (Number(item.votes) || 0), 0);
    titleEl.textContent = poll.title || 'Опрос дня';
    questionEl.textContent = poll.question;
    optionsEl.innerHTML = poll.options
      .map((item) => {
        const votes = Number(item.votes) || 0;
        const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return `
          <button type="button" class="blogv2-action blogv2-poll-option" data-poll-option="${escapeHtml(item.id)}" ${
            alreadyVoted ? 'disabled' : ''
          } style="--poll-percent:${percent}%">
            <span class="blogv2-poll-option-fill" aria-hidden="true"></span>
            <span class="blogv2-poll-option-label">${escapeHtml(item.text || '')}</span>
            <strong class="blogv2-poll-option-value">${votes} (${percent}%)</strong>
          </button>
        `;
      })
      .join('');
    card.hidden = false;
  }

  function renderSidebarBlockTitles() {
    const titles = state.admin.blockTitles || {};
    const factTitle = document.getElementById('factBlockTitle');
    const popularTitle = document.getElementById('popularBlockTitle');
    const tipsTitle = document.getElementById('tipsBlockTitle');
    const recipesTitle = document.getElementById('recipesBlockTitle');
    if (factTitle) factTitle.textContent = String(titles.fact || '').trim() || 'Факт дня';
    if (popularTitle) popularTitle.textContent = String(titles.popular || '').trim() || 'Популярное';
    if (tipsTitle) tipsTitle.textContent = String(titles.tips || '').trim() || 'Советы дня';
    if (recipesTitle) recipesTitle.textContent = String(titles.recipes || '').trim() || 'Рецепты с водой';
  }

  function reactionLabel(type) {
    if (type === 'useful') return 'Полезно';
    if (type === 'new') return 'Узнал новое';
    return 'Попробую';
  }

  function reactionIcon(type) {
    if (type === 'useful') return '💧';
    if (type === 'new') return '💡';
    return '🔥';
  }

  function renderFeed() {
    const root = document.getElementById('blogFeed');
    if (!root) return;
    const posts = sortedPosts();
    if (!posts.length) {
      root.innerHTML = '<p class="blogv2-empty">Постов пока нет.</p>';
      return;
    }

    root.innerHTML = posts
      .map((post) => {
        const comments = post.comments || [];
        return `
          <article class="blogv2-post" data-post-id="${post.id}">
            <div class="blogv2-post-media">
              <img
                src="${escapeHtml(post.image)}"
                alt="${escapeHtml(post.title)}"
                loading="lazy"
                style="object-fit:${post.imageMode === 'contain' ? 'contain' : 'cover'};background:${escapeHtml(post.imageBg || '#ffffff')};"
              />
            </div>
            <div class="blogv2-post-body">
              <div class="blogv2-post-head">
                <h3>${escapeHtml(post.title)}</h3>
                <span class="blogv2-post-date">${formatDate(post.createdAt)}</span>
              </div>
              <p class="blogv2-post-excerpt">${escapeHtml(post.excerpt)}</p>
              <p class="blogv2-post-details" hidden>${escapeHtml(post.details || post.excerpt)}</p>

              <div class="blogv2-actions">
                <button class="blogv2-action" type="button" data-like="${post.id}">❤️ ${post.likes}</button>
                <button class="blogv2-action blogv2-reaction useful" type="button" data-react-kind="useful" data-react-post="${post.id}"><span class="blogv2-reaction-icon">${reactionIcon('useful')}</span><span>${reactionLabel('useful')}</span><strong>${post.reactions.useful || 0}</strong></button>
                <button class="blogv2-action blogv2-reaction new" type="button" data-react-kind="new" data-react-post="${post.id}"><span class="blogv2-reaction-icon">${reactionIcon('new')}</span><span>${reactionLabel('new')}</span><strong>${post.reactions.new || 0}</strong></button>
              </div>

              <div class="blogv2-post-footer">
                <span></span>
                <button type="button" class="blogv2-read-btn" data-read-post="${post.id}">Читать</button>
              </div>

              <div class="blogv2-comments" id="comments-${post.id}">
                ${comments
                  .map(
                    (c) => `
                  <div class="blogv2-comment">
                    <div class="blogv2-avatar">${escapeHtml(initials(c.name))}</div>
                    <div class="blogv2-comment-body">
                      <strong>${escapeHtml(c.name)}</strong>
                      <p>${escapeHtml(c.text)}</p>
                      ${
                        Array.isArray(c.replies) && c.replies.length
                          ? c.replies
                              .map(
                                (reply) => `
                        <div class="blogv2-comment-reply">
                          <strong>${escapeHtml(reply.name || 'Менеджер')}</strong>
                          <p>${escapeHtml(reply.text || '')}</p>
                        </div>
                      `
                              )
                              .join('')
                          : ''
                      }
                    </div>
                    <button type="button" class="blogv2-comment-like" data-comment-like="${post.id}:${c.id}">❤️ ${c.likes || 0}</button>
                  </div>
                `
                  )
                  .join('')}
                <form class="blogv2-comment-form" data-comment-form="${post.id}">
                  <textarea name="text" maxlength="500" placeholder="Написать комментарий..." required></textarea>
                  <div class="blogv2-comment-form-meta">
                    <span class="blogv2-comment-limit" data-comment-limit>0/500</span>
                    <button type="submit" class="blogv2-btn small" disabled>Отправить</button>
                  </div>
                </form>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
    initScrollReveal();
  }

  function renderAll() {
    renderStories();
    renderFeed();
    renderPopular();
    renderFact();
    renderHydration();
    renderTipsAndRecipes();
    renderSidebarBlockTitles();
    renderHydrationPoll();
    initScrollReveal();
  }

  function initScrollReveal() {
    const revealTargets = Array.from(document.querySelectorAll('.blogv2-story, .blogv2-post, .blogv2-card'));
    if (!revealTargets.length) return;

    revealTargets.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.add('blogv2-reveal');
      }
    });

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((element) => {
        if (element instanceof HTMLElement) element.classList.add('is-visible');
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const target = entry.target;
            if (target instanceof HTMLElement) {
              target.classList.add('is-visible');
              revealObserver?.unobserve(target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      );
    }

    revealTargets.forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      if (element.classList.contains('is-visible')) return;
      revealObserver?.observe(element);
    });
  }

  function lockBlogForManager() {
    const user = readCurrentUser();
    if (!user || user.role !== 'manager') return;

    document.querySelectorAll('[data-auth-login], [data-auth-register], .cabinet-trigger').forEach((button) => {
      if (button instanceof HTMLElement) button.remove();
    });

    const menuLinks = Array.from(document.querySelectorAll('.menu a'));
    menuLinks.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute('href') || '';
      if (href !== 'community.html') {
        link.setAttribute('href', '#');
        link.classList.add('is-manager-locked');
      }
    });

    const outsideLinks = Array.from(document.querySelectorAll('a[href]')).filter((link) => {
      if (!(link instanceof HTMLAnchorElement)) return false;
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#')) return false;
      if (href === 'community.html' || href === 'manager.html') return false;
      if (href.startsWith('tel:')) return false;
      return true;
    });
    outsideLinks.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.setAttribute('href', '#');
      link.classList.add('is-manager-locked');
    });

    const returnBtn = document.createElement('a');
    returnBtn.href = 'manager.html';
    returnBtn.className = 'blogv2-manager-back-btn';
    returnBtn.textContent = 'Вернуться к менеджеру';
    document.body.appendChild(returnBtn);
  }

  function setSort(sortType) {
    state.sort = sortType === 'popular' ? 'popular' : 'new';
    saveSort();
    document.querySelectorAll('[data-sort]').forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-sort') === state.sort);
    });
    renderFeed();
    initScrollReveal();
  }

  function openStory(index) {
    const stories = getStories();
    if (!Number.isInteger(index) || index < 0 || index >= stories.length) return;
    state.storyIndex = index;
    const modal = document.getElementById('storyModal');
    const title = document.getElementById('storyTitle');
    const body = document.getElementById('storyBody');
    const kicker = document.getElementById('storyKicker');
    const ctaBtn = document.getElementById('storyCtaBtn');
    if (!modal || !title || !body || !kicker || !ctaBtn) return;

    const story = stories[index];
    const resolvedPostId = resolveStoryPostId(story);
    title.textContent = story.title;
    body.textContent = story.text;
    kicker.textContent = `История ${index + 1} из ${stories.length}`;
    modal.style.setProperty('--story-image', `url("${story.image || 'assets/popular-1.png'}")`);
    modal.style.setProperty('--story-image-bg', story.imageBg || '#ffffff');
    modal.classList.toggle('is-contain', story.imageMode === 'contain');
    ctaBtn.setAttribute('data-story-post-id', resolvedPostId || '');
    state.storyRemainingMs = STORY_MS;
    state.storyPaused = false;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    restartStoryProgress();
  }

  function closeStory() {
    const modal = document.getElementById('storyModal');
    const progress = document.getElementById('storyProgress');
    if (!modal || !progress) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    progress.style.width = '0%';
    clearTimeout(state.storyTimer);
    clearInterval(state.storyProgressTimer);
    state.storyTimer = null;
    state.storyProgressTimer = null;
    state.storyPaused = false;
    state.storyRemainingMs = STORY_MS;
  }

  function goNextStory() {
    const stories = getStories();
    const next = state.storyIndex + 1;
    if (next >= stories.length) {
      closeStory();
      return;
    }
    openStory(next);
  }

  function goPrevStory() {
    const prev = state.storyIndex - 1;
    if (prev < 0) return;
    openStory(prev);
  }

  function restartStoryProgress() {
    const progress = document.getElementById('storyProgress');
    if (!progress) return;
    clearTimeout(state.storyTimer);
    clearInterval(state.storyProgressTimer);
    progress.style.width = '0%';
    state.storyProgressStart = Date.now();
    state.storyRemainingMs = STORY_MS;
    state.storyProgressTimer = setInterval(() => {
      const elapsed = Date.now() - state.storyProgressStart;
      const pct = Math.min(100, Math.round((elapsed / state.storyRemainingMs) * 100));
      progress.style.width = `${pct}%`;
      if (pct >= 100) {
        clearInterval(state.storyProgressTimer);
      }
    }, 60);
    state.storyTimer = setTimeout(goNextStory, state.storyRemainingMs);
  }

  function pauseStoryPlayback() {
    const modal = document.getElementById('storyModal');
    const progress = document.getElementById('storyProgress');
    if (!modal || !progress || !modal.classList.contains('open') || state.storyPaused) return;
    const elapsed = Date.now() - state.storyProgressStart;
    state.storyRemainingMs = Math.max(500, state.storyRemainingMs - elapsed);
    clearTimeout(state.storyTimer);
    clearInterval(state.storyProgressTimer);
    state.storyTimer = null;
    state.storyProgressTimer = null;
    state.storyPaused = true;
    state.storyPauseStartedAt = Date.now();
  }

  function resumeStoryPlayback() {
    const modal = document.getElementById('storyModal');
    const progress = document.getElementById('storyProgress');
    if (!modal || !progress || !modal.classList.contains('open') || !state.storyPaused) return;
    state.storyPaused = false;
    const currentProgress = Number.parseFloat(progress.style.width || '0') || 0;
    const remainingPct = Math.max(0, 100 - currentProgress) / 100;
    state.storyRemainingMs = Math.max(500, Math.round(STORY_MS * remainingPct));
    state.storyProgressStart = Date.now();
    clearTimeout(state.storyTimer);
    clearInterval(state.storyProgressTimer);
    state.storyProgressTimer = setInterval(() => {
      const elapsed = Date.now() - state.storyProgressStart;
      const addPct = Math.min(remainingPct, elapsed / state.storyRemainingMs) * 100;
      const nextPct = Math.min(100, currentProgress + addPct);
      progress.style.width = `${nextPct}%`;
      if (nextPct >= 100) {
        clearInterval(state.storyProgressTimer);
      }
    }, 60);
    state.storyTimer = setTimeout(goNextStory, state.storyRemainingMs);
  }

  function updatePost(postId, updater) {
    const beforeEl = document.querySelector(`[data-post-id="${postId}"]`);
    const beforeTop = beforeEl instanceof HTMLElement ? beforeEl.getBoundingClientRect().top : null;
    const i = state.posts.findIndex((p) => p.id === postId);
    if (i < 0) return;
    const next = updater({ ...state.posts[i] });
    state.posts[i] = next;
    savePosts();
    renderFeed();
    renderPopular();
    if (beforeTop != null) {
      const afterEl = document.querySelector(`[data-post-id="${postId}"]`);
      if (afterEl instanceof HTMLElement) {
        const afterTop = afterEl.getBoundingClientRect().top;
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' });
      }
    }
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function resolveStoryPostId(story) {
    if (!story) return '';
    const byId = state.posts.find((post) => post.id === story.postId);
    if (byId) return byId.id;
    const hint = normalizeText(story.postTitleHint || story.title);
    if (!hint) return '';
    const byTitle = state.posts.find((post) => normalizeText(post.title).includes(hint) || hint.includes(normalizeText(post.title)));
    return byTitle ? byTitle.id : '';
  }

  function animateReaction(button, mouseEvent) {
    if (!(button instanceof HTMLElement)) return;
    const rect = button.getBoundingClientRect();
    const x = mouseEvent?.clientX ?? rect.left + rect.width / 2;
    const y = mouseEvent?.clientY ?? rect.top + rect.height / 2;
    const burst = document.createElement('span');
    burst.className = 'blogv2-tap-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    document.body.appendChild(burst);
    setTimeout(() => {
      burst.remove();
    }, 520);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const storyBtn = target.closest('[data-story-index]');
      if (storyBtn) {
        openStory(Number(storyBtn.getAttribute('data-story-index')));
        return;
      }

      if (target.matches('[data-story-close="true"]')) {
        closeStory();
        return;
      }

      const sortBtn = target.closest('[data-sort]');
      if (sortBtn) {
        setSort(sortBtn.getAttribute('data-sort'));
        return;
      }

      const likeBtn = target.closest('[data-like]');
      if (likeBtn) {
        const postId = likeBtn.getAttribute('data-like');
        animateReaction(likeBtn, event);
        updatePost(postId, (post) => ({ ...post, likes: (post.likes || 0) + 1 }));
        return;
      }

      const saveBtn = target.closest('[data-save]');
      if (saveBtn) {
        const postId = saveBtn.getAttribute('data-save');
        animateReaction(saveBtn, event);
        updatePost(postId, (post) => ({ ...post, saved: !post.saved }));
        return;
      }

      const reactBtn = target.closest('[data-react-kind]');
      if (reactBtn) {
        const postId = reactBtn.getAttribute('data-react-post');
        const reactionType = reactBtn.getAttribute('data-react-kind');
        if (!postId || !reactionType) return;
        animateReaction(reactBtn, event);
        updatePost(postId, (post) => {
          const reactions = post.reactions || {};
          const normalizedType = reactionType === 'try' ? 'tryIt' : reactionType;
          const currentValue =
            normalizedType === 'tryIt'
              ? (reactions.tryIt || reactions.try || 0)
              : (reactions[normalizedType] || 0);
          return {
            ...post,
            reactions: {
              ...reactions,
              [normalizedType]: currentValue + 1,
            },
          };
        });
        return;
      }

      const pollBtn = target.closest('[data-poll-option]');
      if (pollBtn) {
        const optionId = pollBtn.getAttribute('data-poll-option');
        const poll = state.admin.hydrationPoll;
        if (!optionId || !poll || !poll.id || !poll.active) return;
        const votesMap = readPollVotes();
        if (votesMap[poll.id]) return;
        const nextOptions = (poll.options || []).map((item) =>
          item.id === optionId ? { ...item, votes: (Number(item.votes) || 0) + 1 } : item
        );
        state.admin.hydrationPoll = { ...poll, options: nextOptions };
        localStorage.setItem(BLOG_ADMIN_KEY, JSON.stringify(state.admin));
        votesMap[poll.id] = optionId;
        savePollVotes(votesMap);
        renderHydrationPoll();
        return;
      }

      const readBtn = target.closest('[data-read-post]');
      if (readBtn) {
        const postId = readBtn.getAttribute('data-read-post');
        const article = document.querySelector(`[data-post-id="${postId}"] .blogv2-post-excerpt`);
        const details = document.querySelector(`[data-post-id="${postId}"] .blogv2-post-details`);
        if (article && details instanceof HTMLElement) {
          article.hidden = true;
          details.hidden = false;
          readBtn.textContent = 'Открыто';
          readBtn.setAttribute('disabled', 'true');
        }
        return;
      }

      const focusBtn = target.closest('[data-focus-comments]');
      if (focusBtn) {
        const postId = focusBtn.getAttribute('data-focus-comments');
        const input = document.querySelector(`[data-comment-form="${postId}"] textarea`);
        if (input instanceof HTMLTextAreaElement) input.focus();
        return;
      }

      const commentLikeBtn = target.closest('[data-comment-like]');
      if (commentLikeBtn) {
        const payload = commentLikeBtn.getAttribute('data-comment-like') || '';
        const [postId, commentId] = payload.split(':');
        animateReaction(commentLikeBtn, event);
        updatePost(postId, (post) => ({
          ...post,
          comments: (post.comments || []).map((comment) =>
            comment.id === commentId ? { ...comment, likes: (comment.likes || 0) + 1 } : comment
          ),
        }));
        return;
      }
    });

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const postId = form.getAttribute('data-comment-form');
      if (!postId) return;
      event.preventDefault();
      const textarea = form.querySelector('textarea[name="text"]');
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      const text = textarea.value.trim();
      if (!text) return;
      updatePost(postId, (post) => ({
        ...post,
        comments: [
          ...(post.comments || []),
          {
            id: `c_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
            name: userName(),
            text,
            likes: 0,
          },
        ],
      }));
      textarea.value = '';
      const limitEl = form.querySelector('[data-comment-limit]');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (limitEl) limitEl.textContent = '0/500';
      if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = true;
    });

    document.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!target.matches('.blogv2-comment-form textarea[name="text"]')) return;

      const form = target.closest('.blogv2-comment-form');
      if (!(form instanceof HTMLFormElement)) return;
      const limitEl = form.querySelector('[data-comment-limit]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const max = Number(target.getAttribute('maxlength') || '500');
      const len = target.value.length;

      if (limitEl) limitEl.textContent = `${len}/${max}`;
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = len === 0 || len > max;
      }
    });

    const hydrationAddBtn = document.getElementById('hydrationAddBtn');
    const hydrationInput = document.getElementById('hydrationInput');
    if (hydrationAddBtn && hydrationInput) {
      hydrationAddBtn.addEventListener('click', () => {
        const value = Number(hydrationInput.value);
        if (!Number.isFinite(value) || value <= 0) return;
        state.water = Math.max(0, Math.min(HYDRATION_MAX, state.water + value));
        hydrationInput.value = '';
        saveWater();
        renderHydration();
      });
    }

    document.addEventListener('keydown', (event) => {
      const modal = document.getElementById('storyModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (event.key === 'Escape') closeStory();
      if (event.key === 'ArrowRight') goNextStory();
      if (event.key === 'ArrowLeft') openStory(Math.max(0, state.storyIndex - 1));
    });
  }

  function initState() {
    state.admin = readAdminData();
    const saved = safeJsonParse(localStorage.getItem(FEED_KEY), null);
    state.posts = Array.isArray(saved) && saved.length ? saved : DEFAULT_POSTS;
    state.posts = enforcePostsLimit(state.posts);
    if (!saved || !saved.length) {
      savePosts();
    } else {
      // Синхронизируем ключевые данные для связки "история -> пост".
      let changedAny = false;
      const first = state.posts.find((post) => normalizeText(post.title).includes(normalizeText('Почему важно пить воду')));
      if (first) {
        let changed = false;
        if (first.image !== 'assets/story-ocean-world.png') {
          first.image = 'assets/story-ocean-world.png';
          changed = true;
        }
        if (!first.details) {
          first.details =
            'Регулярное питье поддерживает работу мозга, концентрацию и нормальную терморегуляцию. Начинайте день со стакана воды, держите бутылку рядом во время работы и распределяйте объем небольшими порциями каждые 1-2 часа. Так организм лучше усваивает воду без ощущения тяжести.';
          changed = true;
        }
        if (changed) changedAny = true;
      }

      const second = state.posts.find((post) =>
        normalizeText(post.title).includes(normalizeText('5 привычек для здорового питьевого режима'))
      );
      if (second) {
        let changed = false;
        if (second.image !== 'assets/story-5-habits-eco.png') {
          second.image = 'assets/story-5-habits-eco.png';
          changed = true;
        }
        if (!second.details || second.details.length < 260) {
          second.details =
            '1) Начинайте утро со стакана воды сразу после пробуждения. 2) Держите бутылку воды на рабочем столе, чтобы она всегда была перед глазами. 3) Пейте небольшими порциями каждые 60-90 минут, а не большими объемами редко. 4) Привяжите воду к привычным действиям: перед едой, после прогулки, после звонка. 5) Делайте вкус воды приятнее: добавляйте лимон, мяту, огурец или ягоды без сахара. Такая система помогает держать стабильный питьевой режим, снижает усталость и улучшает концентрацию в течение дня.';
          changed = true;
        }
        if (changed) changedAny = true;
      }

      if (changedAny) {
        savePosts();
      }

      const sport = state.posts.find((post) =>
        normalizeText(post.title).includes(normalizeText('Вода и спорт'))
      );
      if (sport) {
        let changed = false;
        if (sport.image !== 'assets/story-water-sport-runner.png') {
          sport.image = 'assets/story-water-sport-runner.png';
          changed = true;
        }
        if (sport.imageMode !== 'contain') {
          sport.imageMode = 'contain';
          changed = true;
        }
        if (sport.imageBg !== '#ffffff') {
          sport.imageBg = '#ffffff';
          changed = true;
        }
        if (!sport.details || sport.details.length < 300) {
          sport.details =
            'Грамотная гидратация напрямую влияет на результат тренировки и скорость восстановления. За 20-30 минут до старта выпейте 200-300 мл воды, а во время занятия делайте небольшие глотки каждые 10-15 минут. После тренировки важно восполнить потерю жидкости в течение первого часа, особенно если была интенсивная нагрузка или жаркая погода. Для удобства держите бутылку рядом и ориентируйтесь на самочувствие: сухость во рту, спад энергии и снижение концентрации часто говорят о нехватке воды.';
          changed = true;
        }
        if (changed) savePosts();
      }

      const detox = state.posts.find((post) =>
        normalizeText(post.title).includes(normalizeText('3 рецепта detox-воды'))
      );
      if (detox) {
        let changed = false;
        if (detox.image !== 'assets/story-detox-lemon-black.png') {
          detox.image = 'assets/story-detox-lemon-black.png';
          changed = true;
        }
        if (detox.imageMode !== 'contain') {
          detox.imageMode = 'contain';
          changed = true;
        }
        if (detox.imageBg !== '#000000') {
          detox.imageBg = '#000000';
          changed = true;
        }
        if (!detox.details || detox.details.length < 320) {
          detox.details =
            'Detox-вода помогает разнообразить питьевой режим без сахара и газировки. Базовая формула простая: холодная вода + цитрус + травы/ягоды, затем настаивание 20-30 минут. Вариант 1: лимон + мята для свежести и бодрости утром. Вариант 2: огурец + лайм для мягкого вкуса в течение рабочего дня. Вариант 3: ягоды + базилик для яркого аромата к вечеру. Готовьте напиток в прозрачной бутылке и держите рядом — так проще поддерживать регулярное питье.';
          changed = true;
        }
        if (changed) savePosts();
      }

      const detoxHabits = state.posts.find((post) =>
        normalizeText(post.title).includes(normalizeText('Детокс привычки на каждый день'))
      );
      if (!detoxHabits) {
        state.posts.unshift({
          id: `p5_${Date.now()}`,
          title: 'Детокс привычки на каждый день',
          excerpt:
            'Маленькие ежедневные шаги с водой помогают чувствовать лёгкость и поддерживать стабильный питьевой режим.',
          details:
            'Detox-привычки не требуют жёстких ограничений: важна регулярность. Начните с простого ритуала утром — стакан воды комнатной температуры. Днём добавляйте в воду ломтик лимона, лайма или несколько ягод для мягкого вкуса без сахара. Держите бутылку воды в зоне видимости и пополняйте её 2-3 раза в день. Хорошо работает правило: несколько глотков перед каждым приёмом пищи и после прогулки. Так питьевой режим становится естественной частью дня, а не отдельной сложной задачей.',
          image: 'assets/story-detox-digital-drop.png',
          imageMode: 'contain',
          imageBg: '#041a3d',
          readTime: '4 мин',
          createdAt: new Date().toISOString(),
          likes: 58,
          comments: [{ id: `c51_${Date.now()}`, name: 'Алёна', text: 'Очень понравился формат с маленькими шагами.', likes: 1 }],
          reactions: { useful: 17, new: 10, tryIt: 11 },
          saved: false,
        });
        savePosts();
      } else {
        let changed = false;
        if (detoxHabits.image !== 'assets/story-detox-nature-water.png') {
          detoxHabits.image = 'assets/story-detox-nature-water.png';
          changed = true;
        }
        if (detoxHabits.imageMode !== 'cover') {
          detoxHabits.imageMode = 'cover';
          changed = true;
        }
        if (detoxHabits.imageBg !== '#ffffff') {
          detoxHabits.imageBg = '#ffffff';
          changed = true;
        }
        if (!detoxHabits.details || detoxHabits.details.length < 320) {
          detoxHabits.details =
            'Detox-привычки не требуют жёстких ограничений: ключ в регулярности и удобстве. Начните утро со стакана воды комнатной температуры, затем распределяйте объем небольшими порциями в течение дня. Добавляйте в воду лимон, лайм, мяту или ягоды для мягкого вкуса без сахара. Держите бутылку рядом в зоне видимости и используйте простые триггеры: вода после прогулки, перед едой и после длительных звонков. Такой режим помогает снизить усталость, поддерживать концентрацию и избежать резких провалов энергии в течение дня.';
          changed = true;
        }
        if (changed) savePosts();
      }

      const limited = enforcePostsLimit(state.posts);
      if (limited.length !== state.posts.length || limited.some((post, idx) => post.id !== state.posts[idx]?.id)) {
        state.posts = limited;
        savePosts();
      }
    }

    const sort = localStorage.getItem(SORT_KEY);
    state.sort = sort === 'popular' ? 'popular' : 'new';
    const waterRaw = Number(localStorage.getItem(WATER_KEY));
    state.water = Number.isFinite(waterRaw) ? Math.max(0, Math.min(HYDRATION_MAX, waterRaw)) : 1.2;
  }

  function initHeroParallax() {
    const hero = document.querySelector('.blogv2-hero-inner');
    if (!(hero instanceof HTMLElement)) return;
    const water = hero.querySelector('[data-parallax-layer="water"]');
    const glow = hero.querySelector('[data-parallax-layer="glow"]');
    if (!(water instanceof HTMLElement) || !(glow instanceof HTMLElement)) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = Math.max(-1, Math.min(1, (vh * 0.5 - rect.top) / vh));
      const waterShift = progress * 24;
      const glowShift = progress * 12;
      water.style.transform = `translate3d(0, ${waterShift}px, 0)`;
      glow.style.transform = `translate3d(0, ${glowShift}px, 0)`;
    };

    const requestTick = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    requestTick();
  }

  function jumpToPost(postId) {
    if (!postId) return;
    const el = document.querySelector(`[data-post-id="${postId}"]`);
    if (!(el instanceof HTMLElement)) return;
    closeStory();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.animate(
      [{ boxShadow: '0 0 0 0 rgba(86, 204, 242, 0)' }, { boxShadow: '0 0 0 8px rgba(86, 204, 242, 0.25)' }, { boxShadow: '0 0 0 0 rgba(86, 204, 242, 0)' }],
      { duration: 900, easing: 'ease-out' }
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    initState();
    renderAll();
    lockBlogForManager();
    bindEvents();
    initHeroParallax();
    const storyCtaBtn = document.getElementById('storyCtaBtn');
    const storyPrevZone = document.getElementById('storyPrevZone');
    const storyNextZone = document.getElementById('storyNextZone');
    const storyShell = document.querySelector('.blogv2-story-shell');
    if (storyCtaBtn) {
      storyCtaBtn.addEventListener('click', () => {
        jumpToPost(storyCtaBtn.getAttribute('data-story-post-id'));
      });
    }
    if (storyPrevZone) {
      storyPrevZone.addEventListener('click', () => {
        goPrevStory();
      });
    }
    if (storyNextZone) {
      storyNextZone.addEventListener('click', () => {
        goNextStory();
      });
    }
    if (storyShell instanceof HTMLElement) {
      const pauseEvents = ['pointerdown', 'touchstart', 'mousedown'];
      const resumeEvents = ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'mouseup', 'mouseleave'];
      pauseEvents.forEach((eventName) => {
        storyShell.addEventListener(eventName, (event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.closest('[data-story-close="true"], #storyPrevZone, #storyNextZone, #storyCtaBtn')) {
            return;
          }
          pauseStoryPlayback();
        }, { passive: true });
      });
      resumeEvents.forEach((eventName) => {
        storyShell.addEventListener(eventName, () => {
          resumeStoryPlayback();
        }, { passive: true });
      });
    }
  });
})();
