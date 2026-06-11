/**
 * Проверка входа менеджера и доступа к панели (сессия API).
 * node scripts/verify-manager-flow.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3003';

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  return { r, data };
}

async function main() {
  let cookies = [];
  const hdr = () => ({ Cookie: cookies.join('; ') });
  const absorb = (res) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const p = c.split(';')[0];
      const n = p.split('=')[0];
      cookies = cookies.filter((x) => !x.startsWith(`${n}=`));
      cookies.push(p);
    }
  };

  let { r, data } = await json('/api/csrf', { headers: hdr() });
  absorb(r);
  let csrf = data?.csrfToken;

  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: 'menekva@mail.ru', password: 'men2026M' }),
  }));
  absorb(r);
  if (!r.ok) throw new Error(`Manager login failed: ${r.status} ${JSON.stringify(data)}`);

  const role = String(data?.user?.role || '').toLowerCase();
  if (role !== 'manager' && role !== 'admin') throw new Error(`Unexpected role: ${role}`);
  const id = Number(data?.user?.id);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Manager user id must be numeric from API');
  console.log('OK manager login', data.user.email, 'id=', id);

  ({ r, data } = await json('/api/auth/me', { headers: hdr() }));
  if (!r.ok) throw new Error(`/api/auth/me failed: ${r.status}`);
  if (String(data?.user?.role).toLowerCase() !== role) throw new Error('auth/me role mismatch');
  console.log('OK /api/auth/me');

  ({ r, data } = await json('/api/manager/feedback', { headers: hdr() }));
  if (!r.ok) throw new Error(`GET /api/manager/feedback failed: ${r.status}`);
  if (!Array.isArray(data?.messages)) throw new Error('feedback: messages must be array');
  console.log('OK manager feedback list', `(${data.messages.length})`);

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;

  ({ r } = await json('/api/auth/logout', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: '{}',
  }));
  if (!r.ok) throw new Error(`Logout failed: ${r.status}`);
  console.log('OK logout');

  ({ r, data } = await json('/api/auth/me', { headers: hdr() }));
  if (!r.ok) throw new Error(`auth/me after logout failed: ${r.status}`);
  if (data?.user) throw new Error('After logout auth/me must return user: null');
  console.log('OK session cleared after logout');
  console.log('verify-manager-flow: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
