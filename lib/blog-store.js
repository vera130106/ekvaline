/**
 * Блог: посты, комментарии и реакции в site_settings (PostgreSQL).
 */
const MAX_PUBLIC_POSTS = 5;

const KEYS = {
  archive: 'blogArchivePosts',
  admin: 'blogAdminData',
  reads: 'blogPostReadsV1',
};

function getDefaultPosts() {
  return [
    {
      id: 'p1',
      title: 'Почему важно пить воду каждый день',
      excerpt:
        'Вода влияет на энергию, концентрацию и общее состояние организма. Несколько простых привычек помогут пить достаточно.',
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
      excerpt:
        'Поставьте воду на видное место, начните утро со стакана воды и добавьте мягкие напоминания в течение дня.',
      details:
        '1) Начинайте утро со стакана воды сразу после пробуждения. 2) Держите бутылку воды на рабочем столе, чтобы она всегда была перед глазами. 3) Пейте небольшими порциями каждые 60-90 минут, а не большими объемами редко. 4) Привяжите воду к привычным действиям: перед едой, после прогулки, после звонка. 5) Делайте вкус воды приятнее: добавляйте лимон, мяту, огурец или ягоды без сахара.',
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
        'Грамотная гидратация напрямую влияет на результат тренировки и скорость восстановления. За 20-30 минут до старта выпейте 200-300 мл воды, а во время занятия делайте небольшие глотки каждые 10-15 минут.',
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
        'Detox-вода помогает разнообразить питьевой режим без сахара и газировки. Базовая формула: холодная вода + цитрус + травы/ягоды, затем настаивание 20-30 минут.',
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
        'Detox-привычки не требуют жёстких ограничений: ключ в регулярности и удобстве. Начните утро со стакана воды комнатной температуры, затем распределяйте объем небольшими порциями в течение дня.',
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
}

function getDefaultAdmin() {
  return {
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
}

function parseJson(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function readSetting(db, key) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key);
  return row?.value ?? null;
}

async function writeSetting(db, key, value) {
  await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

function sortPosts(posts) {
  return [...(Array.isArray(posts) ? posts : [])].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function sanitizeAdmin(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    factOfDay: typeof data.factOfDay === 'string' ? data.factOfDay : '',
    hiddenPostIds: Array.isArray(data.hiddenPostIds) ? data.hiddenPostIds.filter(Boolean).map(String) : [],
    extraStories: Array.isArray(data.extraStories) ? data.extraStories : [],
    storyOverrides: typeof data.storyOverrides === 'object' && data.storyOverrides ? data.storyOverrides : {},
    tips: Array.isArray(data.tips) ? data.tips.filter(Boolean).map(String) : [],
    recipes: Array.isArray(data.recipes) ? data.recipes.filter(Boolean).map(String) : [],
    popular: Array.isArray(data.popular) ? data.popular.filter(Boolean).map(String) : [],
    blockTitles: typeof data.blockTitles === 'object' && data.blockTitles ? data.blockTitles : {},
    hydrationPoll:
      data.hydrationPoll && typeof data.hydrationPoll === 'object'
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

async function ensureSeeded(db) {
  const raw = await readSetting(db, KEYS.archive);
  if (raw) return;
  await writeSetting(db, KEYS.archive, getDefaultPosts());
  await writeSetting(db, KEYS.admin, getDefaultAdmin());
  await writeSetting(db, KEYS.reads, {});
}

async function readArchive(db) {
  await ensureSeeded(db);
  const posts = parseJson(await readSetting(db, KEYS.archive), getDefaultPosts());
  return sortPosts(Array.isArray(posts) ? posts : getDefaultPosts());
}

async function readAdmin(db) {
  await ensureSeeded(db);
  return sanitizeAdmin(parseJson(await readSetting(db, KEYS.admin), getDefaultAdmin()));
}

async function readReads(db) {
  await ensureSeeded(db);
  const map = parseJson(await readSetting(db, KEYS.reads), {});
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

async function readBlogHydrationPoll(db) {
  const raw = await readSetting(db, 'blogHydrationPoll');
  if (!raw) return null;
  try {
    const parsed = parseJson(raw, null);
    if (!parsed || typeof parsed !== 'object') return null;
    return sanitizeAdmin({ hydrationPoll: parsed }).hydrationPoll;
  } catch {
    return null;
  }
}

async function writeManagerState(db, { posts, admin, reads }) {
  if (Array.isArray(posts)) {
    await writeSetting(db, KEYS.archive, sortPosts(posts));
  }
  if (admin && typeof admin === 'object') {
    const sanitized = sanitizeAdmin(admin);
    await writeSetting(db, KEYS.admin, sanitized);
    await writeSetting(db, 'blogHydrationPoll', sanitized.hydrationPoll || null);
  }
  if (reads && typeof reads === 'object' && !Array.isArray(reads)) {
    await writeSetting(db, KEYS.reads, reads);
  }
}

function getPublicPosts(posts, admin) {
  const hidden = new Set((admin?.hiddenPostIds || []).map(String));
  return sortPosts(posts).filter((post) => post?.id && !hidden.has(String(post.id))).slice(0, MAX_PUBLIC_POSTS);
}

function displayName(user) {
  const parts = [user?.first_name, user?.last_name].map((x) => String(x || '').trim()).filter(Boolean);
  if (parts.length) return parts.join(' ');
  const email = String(user?.email || '').trim();
  if (email) return email.split('@')[0];
  return 'Клиент';
}

async function applyEngagement(db, postId, payload, user) {
  const id = String(postId || '').trim();
  if (!id) return { error: 'Некорректный пост.' };

  const posts = await readArchive(db);
  const index = posts.findIndex((p) => String(p.id) === id);
  if (index < 0) return { error: 'Пост не найден.' };

  const post = { ...posts[index] };
  post.comments = Array.isArray(post.comments) ? [...post.comments] : [];
  post.reactions = post.reactions && typeof post.reactions === 'object' ? { ...post.reactions } : { useful: 0, new: 0, tryIt: 0 };

  const op = String(payload?.op || '').trim();

  if (op === 'like') {
    post.likes = Math.max(0, Number(post.likes) || 0) + 1;
  } else if (op === 'react') {
    const kind = payload.kind === 'try' ? 'tryIt' : String(payload.kind || '');
    if (!['useful', 'new', 'tryIt'].includes(kind)) return { error: 'Некорректная реакция.' };
    post.reactions[kind] = Math.max(0, Number(post.reactions[kind]) || 0) + 1;
  } else if (op === 'addComment') {
    const text = String(payload.text || '').trim();
    if (text.length < 1 || text.length > 500) return { error: 'Комментарий от 1 до 500 символов.' };
    post.comments.push({
      id: `c_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name: displayName(user),
      text,
      likes: 0,
      userId: user?.id || null,
      createdAt: new Date().toISOString(),
    });
  } else if (op === 'commentLike') {
    const commentId = String(payload.commentId || '').trim();
    if (!commentId) return { error: 'Некорректный комментарий.' };
    let found = false;
    post.comments = post.comments.map((comment) => {
      if (String(comment.id) !== commentId) return comment;
      found = true;
      return { ...comment, likes: Math.max(0, Number(comment.likes) || 0) + 1 };
    });
    if (!found) return { error: 'Комментарий не найден.' };
  } else if (op === 'fullRead') {
    const reads = await readReads(db);
    reads[id] = Math.max(0, Number(reads[id]) || 0) + 1;
    post.views = reads[id];
    posts[index] = post;
    await writeSetting(db, KEYS.archive, posts);
    await writeSetting(db, KEYS.reads, reads);
    return { ok: true, post, reads };
  } else {
    return { error: 'Неизвестная операция.' };
  }

  posts[index] = post;
  await writeSetting(db, KEYS.archive, posts);
  return { ok: true, post, reads: await readReads(db) };
}

async function getPublicFeed(db) {
  const [posts, admin, reads] = await Promise.all([readArchive(db), readAdmin(db), readReads(db)]);
  return {
    posts: getPublicPosts(posts, admin),
    admin,
    reads,
  };
}

async function getManagerFeed(db) {
  const [posts, admin, reads, blogPoll] = await Promise.all([
    readArchive(db),
    readAdmin(db),
    readReads(db),
    readBlogHydrationPoll(db),
  ]);
  const mergedAdmin = blogPoll ? { ...admin, hydrationPoll: blogPoll } : admin;
  return { posts, admin: mergedAdmin, reads };
}

module.exports = {
  KEYS,
  MAX_PUBLIC_POSTS,
  getDefaultPosts,
  getDefaultAdmin,
  getPublicFeed,
  getManagerFeed,
  writeManagerState,
  applyEngagement,
  getPublicPosts,
};
