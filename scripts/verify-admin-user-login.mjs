/**
 * Проверка: пользователь, созданный админом, входит с заданным паролем.
 * node scripts/verify-admin-user-login.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3003';
const testEmail = `test.staff.${Date.now()}@mail.ru`;
const testPhone = `79${String(Date.now()).slice(-9)}`;
const testPassword = 'TestPass9!';

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
    body: JSON.stringify({ credential: 'admekva@mail.ru', password: 'adm2026A' }),
  }));
  absorb(r);
  if (!r.ok) throw new Error(`Admin login failed: ${r.status} ${JSON.stringify(data)}`);

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;

  ({ r, data } = await json('/api/admin/users', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      first_name: 'Тест',
      last_name: 'Сотрудник',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      role: 'operator',
    }),
  }));
  if (!r.ok) throw new Error(`Create user failed: ${r.status} ${JSON.stringify(data)}`);
  console.log('OK create', testEmail);

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;

  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: testEmail, password: testPassword }),
  }));
  if (!r.ok) throw new Error(`Staff login failed: ${r.status} ${JSON.stringify(data)}`);
  if (String(data?.user?.role).toLowerCase() !== 'operator') throw new Error('Wrong role after login');
  console.log('OK login with admin-set password');

  const wrong = await json('/api/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: testEmail, password: 'WrongPass9!' }),
  });
  if (wrong.r.status !== 401) throw new Error('Wrong password should return 401');
  console.log('OK wrong password rejected');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
