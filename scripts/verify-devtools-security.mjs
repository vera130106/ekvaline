/**
 * Защита от подмены через DevTools: CSP, цены только с сервера, guard на staff-страницах.
 * node scripts/verify-devtools-security.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3012';

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
  console.log(`Проверка anti-DevTools: ${base}`);

  const index = await fetch(`${base}/index.html`);
  const csp = index.headers.get('content-security-policy') || '';
  if (!csp.includes("default-src 'self'")) {
    throw new Error('Нет Content-Security-Policy на HTML');
  }
  console.log('OK CSP header');

  const adminHtml = await fetch(`${base}/admin.html`);
  const cache = adminHtml.headers.get('cache-control') || '';
  if (!cache.includes('no-store')) {
    throw new Error('admin.html должен отдаваться с Cache-Control: no-store');
  }
  console.log('OK no-store для admin.html');

  const guard = await fetch(`${base}/client-guard.js`);
  if (!guard.ok) throw new Error('client-guard.js недоступен');
  const guardText = await guard.text();
  if (!guardText.includes('requirePageSession')) {
    throw new Error('client-guard.js: нет requirePageSession');
  }
  console.log('OK client-guard.js');

  const leakServer = await fetch(`${base}/server.js`);
  if (leakServer.ok) throw new Error('server.js не должен быть доступен публично');
  console.log('OK server.js закрыт');

  const leakEnv = await fetch(`${base}/.env`);
  if (leakEnv.ok) throw new Error('.env не должен быть доступен публично');
  console.log('OK .env закрыт');

  const s = await csrfSession();
  const login = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...s.hdr(), 'X-CSRF-Token': s.csrf },
    body: JSON.stringify({ credential: 'opekva@mail.ru', password: 'ekva2026E' }),
  });
  s.absorb(login.r);
  if (!login.r.ok) throw new Error(`operator login ${login.r.status}`);

  let csrfResp = await json('/api/csrf', { headers: s.hdr() });
  s.absorb(csrfResp.r);
  s.csrf = csrfResp.data?.csrfToken;

  const fakePrice = await json('/api/orders/operator', {
    method: 'POST',
    headers: { ...s.hdr(), 'X-CSRF-Token': s.csrf },
    body: JSON.stringify({
      customer_name: 'Тест DevTools',
      customer_phone: '+79991234567',
      address: 'г. Оренбург, ул. Ленина, д. 1',
      delivery_date: '2099-06-15',
      delivery_slot: '10:00-14:00',
      payment_method: 'cash',
      zone: 'Центр',
      items: [{ title: 'Несуществующий товар XYZ', qty: 1, unit_price: 1 }],
    }),
  });
  if (fakePrice.r.ok) {
    throw new Error('Оператор не должен создавать заказ с произвольной ценой');
  }
  if (!String(fakePrice.data?.error || '').includes('каталог')) {
    throw new Error(`Неожиданная ошибка fake price: ${JSON.stringify(fakePrice.data)}`);
  }
  console.log('OK произвольная цена отклонена');

  const meTamper = await json('/api/auth/me', { headers: s.hdr() });
  if (!meTamper.r.ok || meTamper.data?.user?.role !== 'operator') {
    throw new Error('auth/me operator failed');
  }
  const adminApi = await json('/api/admin/users', { headers: s.hdr() });
  if (adminApi.r.status !== 403 && adminApi.r.status !== 401) {
    throw new Error(`operator не должен видеть /api/admin/users, got ${adminApi.r.status}`);
  }
  console.log('OK operator не получает admin API');

  console.log('\nПроверки anti-DevTools пройдены.');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
