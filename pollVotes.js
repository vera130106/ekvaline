'use strict';

const crypto = require('crypto');

function getVoterKey(req) {
  const uid = req.session && req.session.userId;
  if (uid) return `u_${uid}`;
  const sid = String(req.sessionID || req.session?.id || '').trim();
  const ip = String(req.ip || req.connection?.remoteAddress || '').trim();
  return crypto.createHash('sha256').update(`${sid}:${ip}`).digest('hex').slice(0, 48);
}

const MANAGER_POLL_PERIOD_DAYS = 30;
const MANAGER_POLL_HISTORY_KEY = 'blogPollHistory';
const MANAGER_POLL_HISTORY_LIMIT = 24;

function parsePollIdTimestamp(pollId) {
  const id = String(pollId || '').trim();
  const match = id.match(/^poll_(\d{10,})$/);
  if (!match) return null;
  const ts = Number(match[1]);
  return Number.isFinite(ts) ? ts : null;
}

function parseIsoTimestamp(value) {
  if (!value) return null;
  const ts = new Date(String(value)).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function getPollReferenceTime(poll, activityMap) {
  const candidates = [];
  for (const key of ['updatedAt', 'createdAt', 'archivedAt']) {
    const ts = parseIsoTimestamp(poll?.[key]);
    if (ts != null) candidates.push(ts);
  }
  const fromId = parsePollIdTimestamp(poll?.id);
  if (fromId != null) candidates.push(fromId);
  const activity = activityMap?.[poll?.id];
  if (activity?.lastVote) {
    const ts = parseIsoTimestamp(activity.lastVote);
    if (ts != null) candidates.push(ts);
  }
  return candidates.length ? Math.max(...candidates) : null;
}

function isPollInManagerPeriod(poll, activityMap, windowStartMs) {
  const ref = getPollReferenceTime(poll, activityMap);
  if (ref == null) return Boolean(poll?.active);
  return ref >= windowStartMs;
}

function withPollReferenceMeta(poll, activityMap) {
  const refMs = getPollReferenceTime(poll, activityMap);
  return {
    ...poll,
    reference_at: refMs != null ? new Date(refMs).toISOString() : poll.createdAt || poll.updatedAt || null,
  };
}

function sanitizeBlogHydrationPoll(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 56);
  const title = String(raw.title || 'Опрос дня').trim().slice(0, 40);
  const question = String(raw.question || '').trim().slice(0, 120);
  const active = Boolean(raw.active);
  const createdAt = String(raw.createdAt || '').trim().slice(0, 40);
  const updatedAt = String(raw.updatedAt || '').trim().slice(0, 40);
  const archivedAt = String(raw.archivedAt || '').trim().slice(0, 40);
  const optionsIn = Array.isArray(raw.options) ? raw.options : [];
  const options = [];
  for (const item of optionsIn) {
    if (!item || typeof item !== 'object') continue;
    const oid = String(item.id || '').trim().slice(0, 48);
    const text = String(item.text || '').trim().slice(0, 60);
    if (oid.length < 1 || text.length < 1) continue;
    options.push({ id: oid, text });
    if (options.length >= 8) break;
  }
  if (id.length < 1 || question.length < 3 || options.length < 2) return null;
  const out = { id, title, question, active, options };
  if (createdAt) out.createdAt = createdAt;
  else {
    const inferred = parsePollIdTimestamp(id);
    if (inferred != null) out.createdAt = new Date(inferred).toISOString();
  }
  if (updatedAt) out.updatedAt = updatedAt;
  if (archivedAt) out.archivedAt = archivedAt;
  return out;
}

async function loadPollDefinitions(db, { sanitizeSitePolls, sitePollsForPublic }) {
  const pollsRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('sitePolls');
  const blogRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('blogHydrationPoll');
  let sitePolls = [];
  try {
    sitePolls = pollsRow?.value ? sanitizeSitePolls(JSON.parse(pollsRow.value)) : [];
  } catch {
    sitePolls = [];
  }
  sitePolls = sitePollsForPublic(sitePolls);

  let blogPoll = null;
  if (blogRow?.value) {
    try {
      blogPoll = sanitizeBlogHydrationPoll(JSON.parse(blogRow.value));
    } catch {
      blogPoll = null;
    }
  }
  if (blogPoll && blogPoll.active) {
    return [
      ...sitePolls.map((p) => ({ ...p, source: 'site' })),
      { ...blogPoll, source: 'blog' },
    ];
  }
  return sitePolls.map((p) => ({ ...p, source: 'site' }));
}

async function findPollOption(db, pollId, optionId, helpers) {
  const polls = await loadPollDefinitions(db, helpers);
  const poll = polls.find((p) => String(p.id) === String(pollId));
  if (!poll) return null;
  const option = (poll.options || []).find((o) => String(o.id) === String(optionId));
  if (!option) return null;
  return { poll, option };
}

async function getPollAggregates(db, pollIds) {
  const ids = (Array.isArray(pollIds) ? pollIds : []).map((id) => String(id || '').trim()).filter(Boolean);
  const out = {};
  if (!ids.length) return out;

  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db
    .prepare(
      `SELECT poll_id, option_id, COUNT(*) AS c FROM poll_votes
       WHERE poll_id IN (${placeholders})
       GROUP BY poll_id, option_id`
    )
    .all(...ids);

  for (const row of rows) {
    const pid = String(row.poll_id || '');
    const oid = String(row.option_id || '');
    if (!out[pid]) out[pid] = {};
    out[pid][oid] = Number(row.c || 0);
  }
  return out;
}

async function castPollVote(db, pollId, optionId, voterKey, userId, helpers) {
  const found = await findPollOption(db, pollId, optionId, helpers);
  if (!found) {
    throw Object.assign(new Error('Опрос или вариант ответа не найден.'), { status: 404 });
  }

  const dup = await db
    .prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND voter_key = ?')
    .get(String(pollId), String(voterKey));
  if (dup) {
    throw Object.assign(new Error('Вы уже участвовали в этом опросе.'), { status: 409 });
  }

  await db
    .prepare(
      `INSERT INTO poll_votes (poll_id, option_id, voter_key, user_id) VALUES (?, ?, ?, ?)`
    )
    .run(String(pollId), String(optionId), String(voterKey), userId || null);

  const aggregates = await getPollAggregates(db, [pollId]);
  const votersRow = await db
    .prepare('SELECT COUNT(*) AS c FROM poll_votes WHERE poll_id = ?')
    .get(String(pollId));

  return {
    poll_id: String(pollId),
    counts: aggregates[String(pollId)] || {},
    total_votes: Number(votersRow?.c || 0),
  };
}

function buildPollInsightRow(poll, aggregates, activityMap) {
  const enriched = withPollReferenceMeta(poll, activityMap || {});
  const buckets = aggregates[poll.id] && typeof aggregates[poll.id] === 'object' ? aggregates[poll.id] : {};
  let totalVotes = 0;
  const options = (poll.options || []).map((opt) => {
    const votes = Math.max(0, Number(buckets[opt.id]) || 0);
    totalVotes += votes;
    return { id: opt.id, text: opt.text, votes };
  });
  const withPercent = options.map((opt) => ({
    ...opt,
    percent: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
  }));
  return {
    id: poll.id,
    title: poll.title || 'Опрос',
    question: poll.question || '',
    active: !!poll.active,
    source: poll.source || 'site',
    createdAt: poll.createdAt || null,
    updatedAt: poll.updatedAt || null,
    reference_at: enriched.reference_at || null,
    total_votes: totalVotes,
    options: withPercent,
  };
}

async function getPollActivityMap(db, pollIds) {
  const ids = (Array.isArray(pollIds) ? pollIds : []).map((id) => String(id || '').trim()).filter(Boolean);
  const out = {};
  if (!ids.length) return out;
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db
    .prepare(
      `SELECT poll_id, MAX(created_at) AS last_vote, MIN(created_at) AS first_vote, COUNT(*) AS total
       FROM poll_votes
       WHERE poll_id IN (${placeholders})
       GROUP BY poll_id`
    )
    .all(...ids);
  for (const row of rows) {
    out[String(row.poll_id || '')] = {
      lastVote: row.last_vote || null,
      firstVote: row.first_vote || null,
      total: Number(row.total || 0),
    };
  }
  return out;
}

async function readBlogPollHistory(db) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get(MANAGER_POLL_HISTORY_KEY);
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeBlogHydrationPoll(item))
      .filter(Boolean)
      .slice(0, MANAGER_POLL_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

async function writeBlogPollHistory(db, items) {
  const cleaned = (Array.isArray(items) ? items : [])
    .map((item) => sanitizeBlogHydrationPoll(item))
    .filter(Boolean)
    .slice(0, MANAGER_POLL_HISTORY_LIMIT);
  await db
    .prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
    .run(MANAGER_POLL_HISTORY_KEY, JSON.stringify(cleaned));
  return cleaned;
}

async function archiveBlogPoll(db, poll, reason) {
  const sanitized = sanitizeBlogHydrationPoll(poll);
  if (!sanitized) return;
  const history = await readBlogPollHistory(db);
  const archived = {
    ...sanitized,
    active: false,
    archivedAt: new Date().toISOString(),
    archiveReason: String(reason || 'archived').slice(0, 40),
  };
  const next = [archived, ...history.filter((item) => item.id !== archived.id)].slice(0, MANAGER_POLL_HISTORY_LIMIT);
  await writeBlogPollHistory(db, next);
}

async function buildManagerContentInsights(db, helpers) {
  const windowStartMs = Date.now() - MANAGER_POLL_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const windowStartIso = new Date(windowStartMs).toISOString();

  const allPollsRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('sitePolls');
  let allSitePolls = [];
  try {
    allSitePolls = allPollsRow?.value ? helpers.sanitizeSitePolls(JSON.parse(allPollsRow.value)) : [];
  } catch {
    allSitePolls = [];
  }

  const blogRow = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('blogHydrationPoll');
  let blogPollStored = null;
  if (blogRow?.value) {
    try {
      blogPollStored = sanitizeBlogHydrationPoll(JSON.parse(blogRow.value));
    } catch {
      blogPollStored = null;
    }
  }

  const blogHistory = await readBlogPollHistory(db);
  const candidatePolls = [
    ...allSitePolls.map((p) => ({ ...p, source: 'site' })),
    ...(blogPollStored ? [{ ...blogPollStored, source: 'blog' }] : []),
    ...blogHistory.map((p) => ({ ...p, source: 'blog', active: false })),
  ];

  const pollIds = [...new Set(candidatePolls.map((p) => p.id).filter(Boolean))];
  const aggregates = await getPollAggregates(db, pollIds);
  const activityMap = await getPollActivityMap(db, pollIds);

  const filteredPolls = candidatePolls.filter((poll) => isPollInManagerPeriod(poll, activityMap, windowStartMs));
  const deduped = [];
  const seen = new Set();
  for (const poll of filteredPolls) {
    if (!poll?.id || seen.has(poll.id)) continue;
    seen.add(poll.id);
    deduped.push(poll);
  }

  deduped.sort((a, b) => {
    const ta = getPollReferenceTime(a, activityMap) || 0;
    const tb = getPollReferenceTime(b, activityMap) || 0;
    return tb - ta;
  });

  const insights = deduped.map((poll) => buildPollInsightRow(poll, aggregates, activityMap));
  const totalPollVotes = insights.reduce((sum, poll) => sum + Number(poll.total_votes || 0), 0);

  return {
    polls: insights,
    engagement: {
      active_polls: insights.filter((poll) => poll.active).length,
      total_poll_votes: totalPollVotes,
      archived_polls: insights.filter((poll) => !poll.active).length,
      period_days: MANAGER_POLL_PERIOD_DAYS,
      period_label: `за последние ${MANAGER_POLL_PERIOD_DAYS} дней`,
      period_from: windowStartIso,
    },
  };
}

module.exports = {
  getVoterKey,
  sanitizeBlogHydrationPoll,
  loadPollDefinitions,
  getPollAggregates,
  castPollVote,
  buildManagerContentInsights,
  archiveBlogPoll,
  MANAGER_POLL_PERIOD_DAYS,
};
