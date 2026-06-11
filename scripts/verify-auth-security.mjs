/**
 * Проверка: сотрудники не могут сбрасывать пароль через публичные API.
 * node scripts/verify-auth-security.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3012';

const STAFF = [
  ['admekva@mail.ru', 'adm2026A'],
  ['menekva@mail.ru', 'men2026M'],
  ['opekva@mail.ru', 'ekva2026E'],
  ['driverekva@mail.ru', 'DriverEkva2026!'],
];

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : null;
  return { r, data };
}

async function csrfSession() {
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
  return { hdr, absorb, csrf: data?.csrfToken, cookies };
}

async function main() {
  console.log(`Проверка безопасности auth: ${base}`);

  for (const [email] of STAFF) {
    const { r, data } = await json('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (r.status !== 404) {
      throw new Error(`forgot-password ${email}: ожидали 404, получили ${r.status} ${JSON.stringify(data)}`);
    }
    if (!String(data?.error || '').includes('не найден')) {
      throw new Error(`forgot-password ${email}: неожиданный текст ответа`);
    }
    console.log('OK forgot-password blocked (404)', email);
  }

  for (const [email, password] of STAFF) {
    const s = await csrfSession();
    const login = await json('/api/auth/login', {
      method: 'POST',
      headers: { ...s.hdr(), 'X-CSRF-Token': s.csrf },
      body: JSON.stringify({ credential: email, password }),
    });
    s.absorb(login.r);
    if (!login.r.ok) throw new Error(`login ${email} failed ${login.r.status}`);

    let csrfResp = await json('/api/csrf', { headers: s.hdr() });
    s.absorb(csrfResp.r);
    s.csrf = csrfResp.data?.csrfToken;

    const reqReset = await json('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { ...s.hdr(), 'X-CSRF-Token': s.csrf },
      body: JSON.stringify({}),
    });
    if (reqReset.r.status !== 403) {
      throw new Error(`request-password-reset ${email}: ожидали 403, получили ${reqReset.r.status}`);
    }
    console.log('OK request-password-reset blocked', email);
  }

  console.log('\nПроверки безопасности auth пройдены.');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
