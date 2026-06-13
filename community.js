(function () {
  const FEED_KEY = 'ekvaline_blog_v2_posts';
  const ENGAGEMENT_RESET_KEY = 'ekvaline_blog_engagement_reset_v1';
  const POST_READS_MAP_KEY = 'ekvaline_blog_post_reads_v1';
  /** Один браузер — одно добавление просмотра на пост («Читать» в первый раз). */
  const FULLREAD_ONCE_PREFIX = 'ekvaline_blog_fullread_once_v1__';
  const WATER_KEY = 'ekvaline_blog_v2_water_liters';
  const WATER_DATE_KEY = 'ekvaline_blog_v2_water_date';
  const SORT_KEY = 'ekvaline_blog_v2_sort';
  const BLOG_ADMIN_KEY = 'ekvaline_blog_manager_data';
  const CURRENT_USER_KEY = 'ekvaline_current_user';
  const POLL_VOTES_KEY = 'ekvaline_blog_poll_votes';
  /** Голоса в опросах из настроек сайта (только локально в браузере). */
  const SITE_POLL_USER_VOTES_KEY = 'ekvaline_site_poll_user_vote_v1';
  const SITE_POLL_AGG_KEY = 'ekvaline_site_poll_agg_v1';
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
      likes: 0,
      comments: [
        { id: 'c11', name: 'Марина', text: 'Очень полезная статья, спасибо!', likes: 0 },
        { id: 'c12', name: 'Олег', text: 'С утра стакан воды реально помогает.', likes: 0 },
      ],
      reactions: { useful: 0, new: 0, tryIt: 0 },
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
      likes: 0,
      comments: [{ id: 'c21', name: 'Ирина', text: 'Сделала трекер и стало проще держать режим.', likes: 0 }],
      reactions: { useful: 0, new: 0, tryIt: 0 },
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
      likes: 0,
      comments: [{ id: 'c31', name: 'Даниил', text: 'Нужный материал для тех, кто тренируется.', likes: 0 }],
      reactions: { useful: 0, new: 0, tryIt: 0 },
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
      likes: 0,
      comments: [],
      reactions: { useful: 0, new: 0, tryIt: 0 },
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
      likes: 0,
      comments: [{ id: 'c51', name: 'Алёна', text: 'Очень понравился формат с маленькими шагами.', likes: 0 }],
      reactions: { useful: 0, new: 0, tryIt: 0 },
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
    /** Активные опросы из GET /api/public/settings (sitePolls). */
    sitePolls: [],
    /** Агрегаты голосов с сервера GET /api/public/poll-aggregates. */
    pollAggregates: {},
  };

  let openPostReaderId = null;
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

  function applyServerFeed(data) {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(data.posts) && data.posts.length) {
      state.posts = enforcePostsLimit(data.posts);
    }
    if (data.admin && typeof data.admin === 'object') {
      state.admin = { ...readAdminData(), ...data.admin };
      localStorage.setItem(BLOG_ADMIN_KEY, JSON.stringify(state.admin));
    }
    if (data.reads && typeof data.reads === 'object' && !Array.isArray(data.reads)) {
      saveReadsMap(data.reads);
      migrateReadsFromPostObjects(state.posts);
    }
    savePosts();
    return true;
  }

  async function hydrateBlogFromServer() {
    try {
      const res = await fetch('/api/public/blog-feed', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) return false;
      const data = await res.json();
      return applyServerFeed(data);
    } catch {
      return false;
    }
  }

  async function persistEngagementToServer(postId, payload) {
    const api = window.EkvalineAPI?.json ? window.EkvalineAPI : null;
    if (!api) return null;
    try {
      const r = await api.json(`/api/blog/posts/${encodeURIComponent(String(postId))}/engagement`, {
        method: 'PATCH',
        body: payload,
      });
      api.resetCsrf?.();
      if (!r.ok) return null;
      return r.data;
    } catch {
      return null;
    }
  }

  function syncPostFromServerResult(postId, result) {
    if (!result || !result.post) return;
    const i = state.posts.findIndex((p) => p.id === postId);
    if (i < 0) return;
    state.posts[i] = result.post;
    if (result.reads && typeof result.reads === 'object') {
      saveReadsMap(result.reads);
    }
    savePosts();
  }

  function initCommentFormStates(root = document) {
    const scope = root instanceof HTMLElement || root instanceof Document ? root : document;
    scope.querySelectorAll('.blogv2-comment-form').forEach((form) => {
      if (!(form instanceof HTMLFormElement)) return;
      const textarea = form.querySelector('textarea[name="text"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const limitEl = form.querySelector('[data-comment-limit]');
      if (!(textarea instanceof HTMLTextAreaElement) || !(submitBtn instanceof HTMLButtonElement)) return;
      const max = Number(textarea.getAttribute('maxlength') || '500');
      const len = textarea.value.length;
      const user = readCurrentUser();
      if (limitEl) limitEl.textContent = `${len}/${max}`;
      submitBtn.disabled = !user?.id || len === 0 || len > max;
    });
  }

  function readReadsMapRaw() {
    const m = safeJsonParse(localStorage.getItem(POST_READS_MAP_KEY), null);
    return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  }

  function saveReadsMap(map) {
    try {
      localStorage.setItem(POST_READS_MAP_KEY, JSON.stringify(map));
    } catch {
      /* private mode или переполнение */
    }
  }

  /** Подтягивает устаревшее поле post.views в общую карту (для статистики в менеджере). */
  function migrateReadsFromPostObjects(posts) {
    const map = readReadsMapRaw();
    let changed = false;
    (Array.isArray(posts) ? posts : []).forEach((p) => {
      if (!p || !p.id) return;
      const v = Math.max(0, Number(p.views) || 0);
      const cur = Math.max(0, Number(map[p.id]) || 0);
      if (v > cur) {
        map[p.id] = v;
        changed = true;
      }
    });
    if (changed) saveReadsMap(map);
  }

  function zeroPostEngagement(post) {
    if (!post || typeof post !== 'object') return;
    post.likes = 0;
    post.reactions = { useful: 0, new: 0, tryIt: 0 };
    if (Array.isArray(post.comments)) {
      post.comments.forEach((comment) => {
        if (comment && typeof comment === 'object') comment.likes = 0;
      });
    }
  }

  function migrateDemoEngagementToZero(posts) {
    if (localStorage.getItem(ENGAGEMENT_RESET_KEY) === '1') return false;
    (Array.isArray(posts) ? posts : []).forEach(zeroPostEngagement);
    localStorage.setItem(ENGAGEMENT_RESET_KEY, '1');
    return true;
  }

  function getPostReadsForDisplay(post) {
    if (!post?.id) return 0;
    const mapVal = Math.max(0, Number(readReadsMapRaw()[post.id]) || 0);
    const postVal = Math.max(0, Number(post.views) || 0);
    return Math.max(mapVal, postVal);
  }

  function incrementPostFullRead(postId) {
    const id = String(postId || '');
    if (!id) return 0;
    const map = readReadsMapRaw();
    const next = Math.max(0, Number(map[id]) || 0) + 1;
    map[id] = next;
    saveReadsMap(map);
    return next;
  }

  function cssEscapeSel(value) {
    const v = String(value || '');
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(v);
    return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function saveSort() {
    localStorage.setItem(SORT_KEY, state.sort);
  }

  function saveWater() {
    localStorage.setItem(WATER_KEY, String(state.water));
    localStorage.setItem(WATER_DATE_KEY, currentDateKey());
  }

  function currentDateKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  function readSitePollUserVotes() {
    return safeJsonParse(localStorage.getItem(SITE_POLL_USER_VOTES_KEY), {});
  }

  function saveSitePollUserVotes(map) {
    localStorage.setItem(SITE_POLL_USER_VOTES_KEY, JSON.stringify(map));
  }

  function readSitePollAgg() {
    return safeJsonParse(localStorage.getItem(SITE_POLL_AGG_KEY), {});
  }

  function saveSitePollAgg(map) {
    localStorage.setItem(SITE_POLL_AGG_KEY, JSON.stringify(map));
  }

  async function hydratePollAggregatesFromApi() {
    try {
      const res = await fetch('/api/public/poll-aggregates', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      state.pollAggregates =
        data?.aggregates && typeof data.aggregates === 'object' ? data.aggregates : {};
    } catch {
      /* ignore */
    }
  }

  function pollVoteCount(pollId, optionId) {
    const bucket = state.pollAggregates[String(pollId || '')];
    if (!bucket || typeof bucket !== 'object') return 0;
    return Math.max(0, Number(bucket[String(optionId || '')]) || 0);
  }

  async function submitPollVoteToServer(pollId, optionId) {
    const api = window.EkvalineAPI;
    if (!api?.json) return false;
    try {
      const r = await api.json('/api/polls/vote', {
        method: 'POST',
        body: { poll_id: pollId, option_id: optionId },
      });
      if (r.ok && r.data?.counts) {
        state.pollAggregates[String(pollId)] = r.data.counts;
        api.resetCsrf?.();
        return true;
      }
      if (Number(r.status) === 409) return 'already';
    } catch {
      /* ignore */
    }
    return false;
  }

  function markLocalPollVote(pollId, optionId, useSitePollKeys) {
    if (useSitePollKeys) {
      const vm = readSitePollUserVotes();
      vm[pollId] = optionId;
      saveSitePollUserVotes(vm);
      return;
    }
    const votesMap = readPollVotes();
    votesMap[pollId] = optionId;
    savePollVotes(votesMap);
  }

  function hasLocalPollVote(pollId, useSitePollKeys) {
    if (useSitePollKeys) {
      const vm = readSitePollUserVotes();
      return Boolean(vm[pollId]);
    }
    const votesMap = readPollVotes();
    return Boolean(votesMap[pollId]);
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

  function requireAuthorizedAction() {
    const user = readCurrentUser();
    if (user && user.id) return true;
    const loginBtn = document.querySelector('[data-auth-login]');
    if (loginBtn instanceof HTMLElement) loginBtn.click();
    return false;
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
    const alreadyVoted = Boolean(votesMap[poll.id]) || hasLocalPollVote(poll.id, false);
    let totalVotes = 0;
    const optionsWithVotes = poll.options.map((item) => {
      const votes = pollVoteCount(poll.id, item.id);
      totalVotes += votes;
      return { ...item, votes };
    });
    titleEl.textContent = poll.title || 'Опрос дня';
    questionEl.textContent = poll.question;
    optionsEl.innerHTML = optionsWithVotes
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

  function renderSitePollsFromSettings() {
    const mount = document.getElementById('communitySitePollsMount');
    if (!mount) return;
    const polls = Array.isArray(state.sitePolls) ? state.sitePolls : [];
    if (!polls.length) {
      mount.innerHTML = '';
      return;
    }
    mount.innerHTML = polls
      .map((poll) => {
        const voted = hasLocalPollVote(poll.id, true);
        const buckets =
          state.pollAggregates[poll.id] && typeof state.pollAggregates[poll.id] === 'object'
            ? state.pollAggregates[poll.id]
            : readSitePollAgg()[poll.id] && typeof readSitePollAgg()[poll.id] === 'object'
              ? readSitePollAgg()[poll.id]
              : {};
        let total = 0;
        for (const o of poll.options) {
          total += pollVoteCount(poll.id, o.id) || Number(buckets[o.id]) || 0;
        }
        const heading = String(poll.title || '').trim() || 'Опрос';
        const optionsHtml = poll.options
          .map((item) => {
            const votes = pollVoteCount(poll.id, item.id) || Number(buckets[item.id]) || 0;
            const percent = total > 0 ? Math.round((votes / total) * 100) : 0;
            return `
          <button type="button" class="blogv2-action blogv2-poll-option" data-site-poll-option="1" data-site-poll-id="${escapeHtml(
            poll.id
          )}" data-site-option-id="${escapeHtml(item.id)}" ${voted ? 'disabled' : ''} style="--poll-percent:${percent}%">
            <span class="blogv2-poll-option-fill" aria-hidden="true"></span>
            <span class="blogv2-poll-option-label">${escapeHtml(item.text || '')}</span>
            <strong class="blogv2-poll-option-value">${votes} (${percent}%)</strong>
          </button>`;
          })
          .join('');
        return `
        <section class="blogv2-card blogv2-site-poll-card">
          <h3>${escapeHtml(heading)}</h3>
          <p>${escapeHtml(poll.question || '')}</p>
          <div class="blogv2-poll-options">${optionsHtml}</div>
        </section>`;
      })
      .join('');
    initScrollReveal();
  }

  async function hydrateSitePollsFromApi() {
    const mount = document.getElementById('communitySitePollsMount');
    if (!mount) return;
    try {
      const res = await fetch('/api/public/settings', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      state.sitePolls = Array.isArray(data.sitePolls) ? data.sitePolls : [];
      if (data.blogHydrationPoll && typeof data.blogHydrationPoll === 'object') {
        state.admin.hydrationPoll = {
          id: String(data.blogHydrationPoll.id || ''),
          title: String(data.blogHydrationPoll.title || 'Опрос дня'),
          question: String(data.blogHydrationPoll.question || ''),
          active: Boolean(data.blogHydrationPoll.active),
          options: Array.isArray(data.blogHydrationPoll.options) ? data.blogHydrationPoll.options : [],
        };
      }
      await hydratePollAggregatesFromApi();
      renderSitePollsFromSettings();
      renderHydrationPoll();
    } catch {
      /* ignore */
    }
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

  function reactionMeta(kind) {
    if (kind === 'like') return { emoji: '❤️', label: 'Нравится' };
    if (kind === 'useful') return { emoji: '👍', label: 'Полезно' };
    if (kind === 'new') return { emoji: '🔥', label: 'Интересно' };
    return { emoji: '💧', label: 'Попробую' };
  }

  function renderPostReactionsHtml(post) {
    const reactions = post.reactions || {};
    const like = reactionMeta('like');
    const useful = reactionMeta('useful');
    const interesting = reactionMeta('new');
    return `
      <div class="blogv2-actions blogv2-post-reactions">
        <button class="blogv2-action blogv2-like-btn" type="button" data-like="${escapeHtml(post.id)}" aria-label="${like.label}">
          <span class="blogv2-action-emoji" aria-hidden="true">${like.emoji}</span>
          <span class="blogv2-action-count">${post.likes || 0}</span>
        </button>
        <button class="blogv2-action blogv2-reaction useful" type="button" data-react-kind="useful" data-react-post="${escapeHtml(post.id)}" aria-label="${useful.label}">
          <span class="blogv2-action-emoji" aria-hidden="true">${useful.emoji}</span>
          <span class="blogv2-action-count">${reactions.useful || 0}</span>
        </button>
        <button class="blogv2-action blogv2-reaction new" type="button" data-react-kind="new" data-react-post="${escapeHtml(post.id)}" aria-label="${interesting.label}">
          <span class="blogv2-action-emoji" aria-hidden="true">${interesting.emoji}</span>
          <span class="blogv2-action-count">${reactions.new || 0}</span>
        </button>
      </div>
    `;
  }

  function renderPostCommentsHtml(post, isAuthorized) {
    const comments = post.comments || [];
    return `
      <div class="blogv2-comments" id="comments-${escapeHtml(post.id)}">
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
            <button type="button" class="blogv2-comment-like" data-comment-like="${escapeHtml(post.id)}:${escapeHtml(c.id)}" aria-label="Нравится комментарий">
              <span class="blogv2-action-emoji" aria-hidden="true">❤️</span>
              <span class="blogv2-action-count">${c.likes || 0}</span>
            </button>
          </div>
        `
          )
          .join('')}
        <form class="blogv2-comment-form" data-comment-form="${escapeHtml(post.id)}">
          <textarea name="text" maxlength="500" placeholder="${isAuthorized ? 'Написать комментарий...' : 'Только для зарегистрированных пользователей'}" ${isAuthorized ? '' : 'disabled'} required></textarea>
          <div class="blogv2-comment-form-meta">
            <span class="blogv2-comment-limit" data-comment-limit>0/500</span>
            <button type="submit" class="blogv2-btn small"${isAuthorized ? '' : ' disabled title="Требуется вход"'}>Отправить</button>
          </div>
        </form>
      </div>
    `;
  }

  function findPostById(postId) {
    return state.posts.find((p) => p.id === postId) || null;
  }

  function registerPostFullRead(postId) {
    if (!postId) return;
    try {
      if (localStorage.getItem(FULLREAD_ONCE_PREFIX + postId) === '1') return;
      localStorage.setItem(FULLREAD_ONCE_PREFIX + postId, '1');
    } catch {
      /* private mode */
    }
    void persistEngagementToServer(postId, { op: 'fullRead' }).then((result) => {
      if (result?.post) {
        syncPostFromServerResult(postId, result);
        renderFeed();
        renderPopular();
        if (openPostReaderId === postId) fillPostReader(postId);
      } else {
        const total = incrementPostFullRead(postId);
        const i = state.posts.findIndex((p) => p.id === postId);
        if (i >= 0) {
          state.posts[i] = { ...state.posts[i], views: total };
          savePosts();
        }
      }
    });
  }

  function buildPostReaderHtml(post) {
    const isAuthorized = Boolean(readCurrentUser()?.id);
    const fullText = post.details || post.excerpt || '';
    return `
      <article class="blogv2-post blogv2-post-reader-inner" data-post-id="${escapeHtml(post.id)}">
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
            <div class="blogv2-post-meta">
              <span class="blogv2-post-date">${formatDate(post.createdAt)}</span>
              <span class="blogv2-post-reads">Просмотры: ${getPostReadsForDisplay(post)}</span>
            </div>
          </div>
          <p class="blogv2-post-details blogv2-post-reader-text">${escapeHtml(fullText)}</p>
          ${renderPostReactionsHtml(post)}
          ${renderPostCommentsHtml(post, isAuthorized)}
        </div>
      </article>
    `;
  }

  function fillPostReader(postId) {
    const body = document.getElementById('postReaderBody');
    const post = findPostById(postId);
    if (!(body instanceof HTMLElement) || !post) return;
    body.innerHTML = buildPostReaderHtml(post);
    initCommentFormStates(body);
  }

  function openPostReader(postId) {
    const id = String(postId || '').trim();
    const post = findPostById(id);
    const modal = document.getElementById('postReaderModal');
    if (!post || !(modal instanceof HTMLElement)) return;
    closeStory();
    openPostReaderId = id;
    registerPostFullRead(id);
    fillPostReader(id);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const card = modal.querySelector('.blogv2-post-reader-card');
    if (card instanceof HTMLElement) {
      card.scrollTop = 0;
    }
  }

  function closePostReader() {
    const modal = document.getElementById('postReaderModal');
    if (!(modal instanceof HTMLElement)) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    openPostReaderId = null;
    const storyModal = document.getElementById('storyModal');
    if (!storyModal?.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function renderFeed() {
    const root = document.getElementById('blogFeed');
    if (!root) return;
    const isAuthorized = Boolean(readCurrentUser()?.id);
    const posts = sortedPosts();
    if (!posts.length) {
      root.innerHTML = '<p class="blogv2-empty">Постов пока нет.</p>';
      return;
    }

    root.innerHTML = posts
      .map((post) => {
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
                <div class="blogv2-post-meta">
                  <span class="blogv2-post-date">${formatDate(post.createdAt)}</span>
                  <span class="blogv2-post-reads" title="Сколько раз открыли полный текст («Читать»)">
                    Просмотры: ${getPostReadsForDisplay(post)}
                  </span>
                </div>
              </div>
              <p class="blogv2-post-excerpt">${escapeHtml(post.excerpt)}</p>

              ${renderPostReactionsHtml(post)}

              <div class="blogv2-post-footer">
                <button type="button" class="blogv2-read-btn" data-read-post="${escapeHtml(post.id)}">Читать</button>
              </div>

              ${renderPostCommentsHtml(post, isAuthorized)}
            </div>
          </article>
        `;
      })
      .join('');
    initScrollReveal();
    initCommentFormStates(root);
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
    const revealTargets = Array.from(document.querySelectorAll('.blogv2-post'));
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
    closePostReader();
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

  function updatePost(postId, updater, engagementPayload) {
    const beforeEl = document.querySelector(`[data-post-id="${cssEscapeSel(postId)}"]`);
    const beforeTop = beforeEl instanceof HTMLElement ? beforeEl.getBoundingClientRect().top : null;
    const i = state.posts.findIndex((p) => p.id === postId);
    if (i < 0) return;
    const next = updater({ ...state.posts[i] });
    state.posts[i] = next;
    savePosts();
    renderFeed();
    renderPopular();
    if (openPostReaderId === postId) {
      fillPostReader(postId);
    }
    if (beforeTop != null && !openPostReaderId) {
      const afterEl = document.querySelector(`[data-post-id="${cssEscapeSel(postId)}"]`);
      if (afterEl instanceof HTMLElement) {
        const afterTop = afterEl.getBoundingClientRect().top;
        window.scrollBy({ top: afterTop - beforeTop, left: 0, behavior: 'auto' });
      }
    }
    if (engagementPayload) {
      void persistEngagementToServer(postId, engagementPayload).then((result) => {
        if (result?.post) {
          syncPostFromServerResult(postId, result);
          renderFeed();
          renderPopular();
          if (openPostReaderId === postId) fillPostReader(postId);
        }
      });
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

  function parseHydrationInputValue(raw) {
    const normalized = String(raw || '')
      .trim()
      .replace(',', '.')
      .replace(/[^\d.]/g, '');
    const parts = normalized.split('.');
    const intPart = (parts[0] || '').slice(0, 1);
    const fracPart = (parts[1] || '').slice(0, 1);
    const compact = fracPart ? `${intPart}.${fracPart}` : intPart;
    const value = Number(compact);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.min(HYDRATION_MAX, value);
  }

  function showHydrationHint(message) {
    const hint = document.getElementById('hydrationInputHint');
    const input = document.getElementById('hydrationInput');
    if (!(hint instanceof HTMLElement)) return;
    if (!message) {
      hint.textContent = '';
      hint.hidden = true;
      hint.classList.remove('is-visible');
      if (input instanceof HTMLInputElement) input.removeAttribute('aria-invalid');
      return;
    }
    hint.textContent = message;
    hint.hidden = false;
    hint.classList.add('is-visible');
    if (input instanceof HTMLInputElement) input.setAttribute('aria-invalid', 'true');
  }

  function submitHydrationForm(form) {
    if (!(form instanceof HTMLFormElement)) return false;
    const input = form.querySelector('#hydrationInput');
    if (!(input instanceof HTMLInputElement)) return false;
    const value = parseHydrationInputValue(input.value);
    if (value == null) {
      showHydrationHint('Введите объём, например 0.3');
      input.focus();
      return false;
    }
    showHydrationHint('');
    state.water = Math.max(0, Math.min(HYDRATION_MAX, state.water + value));
    input.value = '';
    saveWater();
    renderHydration();
    return true;
  }

  function bindHydrationControls(root = document) {
    const scope = root instanceof HTMLElement || root instanceof Document ? root : document;
    scope.querySelectorAll('[data-hydration-form]').forEach((form) => {
      if (!(form instanceof HTMLFormElement)) return;
      const input = form.querySelector('#hydrationInput');
      if (!(input instanceof HTMLInputElement)) return;
      if (input.dataset.hydrationBound === '1') return;
      input.dataset.hydrationBound = '1';
      input.addEventListener('input', () => {
        const compact = String(input.value || '')
          .replace(',', '.')
          .replace(/[^\d.]/g, '');
        const parts = compact.split('.');
        const intPart = (parts[0] || '').slice(0, 1);
        const fracPart = (parts[1] || '').slice(0, 1);
        const normalized = fracPart ? `${intPart}.${fracPart}` : intPart;
        input.value = normalized.slice(0, 3);
        if (input.value.trim()) showHydrationHint('');
      });
    });
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.closest('[data-hydration-form], .blogv2-hydration-card')) {
        return;
      }

      if (target.closest('[data-post-reader-close="true"]')) {
        closePostReader();
        return;
      }

      const readBtn = target.closest('[data-read-post]');
      if (readBtn) {
        const postId = String(readBtn.getAttribute('data-read-post') || '').trim();
        if (postId) openPostReader(postId);
        return;
      }

      const storyBtn = target.closest('button.blogv2-story[data-story-index]');
      if (storyBtn && !target.closest('[data-hydration-form], .blogv2-hydration-card')) {
        event.preventDefault();
        event.stopPropagation();
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
        event.stopPropagation();
        if (!requireAuthorizedAction()) return;
        const postId = likeBtn.getAttribute('data-like');
        animateReaction(likeBtn, event);
        updatePost(postId, (post) => ({ ...post, likes: (post.likes || 0) + 1 }), { op: 'like' });
        return;
      }

      const saveBtn = target.closest('[data-save]');
      if (saveBtn) {
        event.stopPropagation();
        if (!requireAuthorizedAction()) return;
        const postId = saveBtn.getAttribute('data-save');
        animateReaction(saveBtn, event);
        updatePost(postId, (post) => ({ ...post, saved: !post.saved }));
        return;
      }

      const reactBtn = target.closest('[data-react-kind]');
      if (reactBtn) {
        event.stopPropagation();
        if (!requireAuthorizedAction()) return;
        const postId = reactBtn.getAttribute('data-react-post');
        const reactionType = reactBtn.getAttribute('data-react-kind');
        if (!postId || !reactionType) return;
        animateReaction(reactBtn, event);
        const normalizedType = reactionType === 'try' ? 'tryIt' : reactionType;
        updatePost(
          postId,
          (post) => {
            const reactions = post.reactions || {};
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
          },
          { op: 'react', kind: normalizedType }
        );
        return;
      }

      const sitePollBtn = target.closest('[data-site-poll-option]');
      if (sitePollBtn) {
        const pollId = sitePollBtn.getAttribute('data-site-poll-id');
        const optionId = sitePollBtn.getAttribute('data-site-option-id');
        if (!pollId || !optionId) return;
        const polls = Array.isArray(state.sitePolls) ? state.sitePolls : [];
        const poll = polls.find((p) => String(p.id) === String(pollId));
        if (!poll || !Array.isArray(poll.options)) return;
        if (hasLocalPollVote(pollId, true)) return;
        void (async () => {
          const result = await submitPollVoteToServer(pollId, optionId);
          if (result === 'already') {
            markLocalPollVote(pollId, optionId, true);
            renderSitePollsFromSettings();
            return;
          }
          if (result === true) {
            markLocalPollVote(pollId, optionId, true);
            renderSitePollsFromSettings();
            return;
          }
          const vm = readSitePollUserVotes();
          if (vm[pollId]) return;
          vm[pollId] = optionId;
          saveSitePollUserVotes(vm);
          const agg = readSitePollAgg();
          const prevBucket =
            agg[pollId] && typeof agg[pollId] === 'object' ? agg[pollId] : {};
          const bucket = { ...prevBucket };
          bucket[optionId] = (Number(bucket[optionId]) || 0) + 1;
          agg[pollId] = bucket;
          saveSitePollAgg(agg);
          renderSitePollsFromSettings();
        })();
        return;
      }

      const pollBtn = target.closest('[data-poll-option]');
      if (pollBtn) {
        const optionId = pollBtn.getAttribute('data-poll-option');
        const poll = state.admin.hydrationPoll;
        if (!optionId || !poll || !poll.id || !poll.active) return;
        if (hasLocalPollVote(poll.id, false)) return;
        void (async () => {
          const result = await submitPollVoteToServer(poll.id, optionId);
          if (result === 'already') {
            markLocalPollVote(poll.id, optionId, false);
            renderHydrationPoll();
            return;
          }
          if (result === true) {
            markLocalPollVote(poll.id, optionId, false);
            renderHydrationPoll();
            return;
          }
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
        })();
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
        event.stopPropagation();
        if (!requireAuthorizedAction()) return;
        const payload = commentLikeBtn.getAttribute('data-comment-like') || '';
        const [postId, commentId] = payload.split(':');
        animateReaction(commentLikeBtn, event);
        updatePost(
          postId,
          (post) => ({
            ...post,
            comments: (post.comments || []).map((comment) =>
              comment.id === commentId ? { ...comment, likes: (comment.likes || 0) + 1 } : comment
            ),
          }),
          { op: 'commentLike', commentId }
        );
        return;
      }
    });

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      if (form.matches('[data-hydration-form]')) {
        event.preventDefault();
        event.stopPropagation();
        submitHydrationForm(form);
        return;
      }

      const postId = form.getAttribute('data-comment-form');
      if (!postId) return;
      event.preventDefault();
      if (!requireAuthorizedAction()) return;
      const textarea = form.querySelector('textarea[name="text"]');
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      const text = textarea.value.trim();
      if (!text) return;
      updatePost(
        postId,
        (post) => ({
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
        }),
        { op: 'addComment', text }
      );
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

    bindHydrationControls();

    document.addEventListener('keydown', (event) => {
      const storyModal = document.getElementById('storyModal');
      const readerModal = document.getElementById('postReaderModal');
      if (readerModal?.classList.contains('open') && event.key === 'Escape') {
        closePostReader();
        return;
      }
      if (!storyModal || !storyModal.classList.contains('open')) return;
      if (event.key === 'Escape') closeStory();
    });
  }

  function initState() {
    state.admin = readAdminData();
    const saved = safeJsonParse(localStorage.getItem(FEED_KEY), null);
    state.posts = Array.isArray(saved) && saved.length ? saved : DEFAULT_POSTS;
    state.posts = enforcePostsLimit(state.posts);
    migrateReadsFromPostObjects(state.posts);
    if (migrateDemoEngagementToZero(state.posts)) {
      savePosts();
    }
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
          likes: 0,
          comments: [{ id: `c51_${Date.now()}`, name: 'Алёна', text: 'Очень понравился формат с маленькими шагами.', likes: 0 }],
          reactions: { useful: 0, new: 0, tryIt: 0 },
          views: 0,
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
    const savedDate = String(localStorage.getItem(WATER_DATE_KEY) || '');
    if (savedDate !== currentDateKey()) {
      state.water = 0;
      saveWater();
      return;
    }
    const waterRaw = Number(localStorage.getItem(WATER_KEY));
    state.water = Number.isFinite(waterRaw) ? Math.max(0, Math.min(HYDRATION_MAX, waterRaw)) : 0;
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

  function onBlogAdminDataUpdated() {
    state.admin = readAdminData();
    const saved = safeJsonParse(localStorage.getItem(FEED_KEY), null);
    if (Array.isArray(saved)) {
      state.posts = enforcePostsLimit(saved);
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initState();
    void hydrateBlogFromServer().then((loaded) => {
      if (loaded) {
        renderAll();
      }
    });
    renderAll();
    lockBlogForManager();
    bindEvents();
    initHeroParallax();
    void hydrateSitePollsFromApi();
    window.addEventListener('ekvaline-blog-admin-updated', onBlogAdminDataUpdated);
    window.addEventListener('storage', (event) => {
      if (event.key === BLOG_ADMIN_KEY || event.key === FEED_KEY) onBlogAdminDataUpdated();
    });
    const storyCtaBtn = document.getElementById('storyCtaBtn');
    const storyShell = document.querySelector('.blogv2-story-shell');
    if (storyCtaBtn) {
      storyCtaBtn.addEventListener('click', () => {
        const postId = String(storyCtaBtn.getAttribute('data-story-post-id') || '').trim();
        closeStory();
        if (postId) openPostReader(postId);
      });
    }
    if (storyShell instanceof HTMLElement) {
      const pauseEvents = ['pointerdown', 'touchstart', 'mousedown'];
      const resumeEvents = ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'mouseup', 'mouseleave'];
      pauseEvents.forEach((eventName) => {
        storyShell.addEventListener(eventName, (event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.closest('[data-story-close="true"], #storyCtaBtn')) {
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
