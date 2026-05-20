'use strict';

const crypto = require('crypto');

function getVoterKey(req) {
  const uid = req.session && req.session.userId;
  if (uid) return `u_${uid}`;
  const sid = String(req.sessionID || req.session?.id || '').trim();
  const ip = String(req.ip || req.connection?.remoteAddress || '').trim();
  return crypto.createHash('sha256').update(`${sid}:${ip}`).digest('hex').slice(0, 48);
}

function sanitizeBlogHydrationPoll(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 56);
  const title = String(raw.title || 'Опрос дня').trim().slice(0, 40);
  const question = String(raw.question || '').trim().slice(0, 120);
  const active = Boolean(raw.active);
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
  return { id, title, question, active, options };
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

function buildPollInsightRow(poll, aggregates) {
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
    total_votes: totalVotes,
    options: withPercent,
  };
}

async function buildManagerContentInsights(db, helpers) {
  const polls = await loadPollDefinitions(db, helpers);
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

  const pollIds = [
    ...allSitePolls.map((p) => p.id),
    ...(blogPollStored ? [blogPollStored.id] : []),
  ].filter(Boolean);
  const aggregates = await getPollAggregates(db, pollIds);

  const activeInsights = polls.map((p) => buildPollInsightRow(p, aggregates));
  const inactiveSite = allSitePolls
    .filter((p) => !p.active)
    .map((p) => buildPollInsightRow({ ...p, source: 'site' }, aggregates));
  const inactiveBlog =
    blogPollStored && !blogPollStored.active
      ? [buildPollInsightRow({ ...blogPollStored, source: 'blog' }, aggregates)]
      : [];

  const totalPollVotes = pollIds.reduce((sum, id) => {
    const bucket = aggregates[id] || {};
    return sum + Object.values(bucket).reduce((s, n) => s + Number(n || 0), 0);
  }, 0);

  return {
    polls: [...activeInsights, ...inactiveSite, ...inactiveBlog],
    engagement: {
      active_polls: activeInsights.length,
      total_poll_votes: totalPollVotes,
      archived_polls: inactiveSite.length + inactiveBlog.length,
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
};
