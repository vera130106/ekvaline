/**
 * Проверка API панели оператора: вход, заказы, водители, PATCH, отчёт.
 * node scripts/verify-operator-flow.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3002';

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  return { r, data };
}

function clientLabel(o) {
  const fn = String(o?.first_name || '').trim();
  const ln = String(o?.last_name || '').trim();
  return [fn, ln].filter(Boolean).join(' ').trim() || '(пусто)';
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
  if (!csrf) throw new Error('No CSRF token');

  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: 'opekva@mail.ru', password: 'ekva2026E' }),
  }));
  absorb(r);
  if (!r.ok) throw new Error(`Operator login failed: ${r.status} ${JSON.stringify(data)}`);
  const role = String(data?.user?.role || '').toLowerCase();
  if (!['operator', 'admin', 'manager'].includes(role)) throw new Error(`Bad role: ${role}`);
  const uid = Number(data?.user?.id);
  if (!Number.isFinite(uid) || uid <= 0) throw new Error('Operator id must be numeric');
  console.log('OK login', data.user.email, 'role=', role);

  ({ r, data } = await json('/api/auth/me', { headers: hdr() }));
  if (!r.ok || !data?.user) throw new Error('auth/me failed');
  console.log('OK /api/auth/me');

  ({ r, data } = await json('/api/orders', { headers: hdr() }));
  if (!r.ok) throw new Error(`GET /api/orders failed: ${r.status}`);
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  if (!orders.length) throw new Error('No orders in DB for operator');
  console.log('OK GET /api/orders', orders.length, 'rows');

  const names = new Set(orders.map(clientLabel));
  const demoBad = [...names].filter((n) => /^демо\s+клиент$/i.test(n) || /^клиент\s+демо$/i.test(n));
  if (demoBad.length && names.size < 3) {
    throw new Error(`Still demo-only client names: ${[...names].slice(0, 5).join(', ')}`);
  }
  if (names.size < 2) {
    console.warn('WARN: only one distinct client name in orders —', [...names][0]);
  } else {
    console.log('OK client names variety:', Math.min(5, names.size), 'samples —', [...names].slice(0, 5).join(' | '));
  }

  const withDemoTag = orders.filter((o) =>
    /§demo_(mo|op)|§ekva_seed/i.test(String(o.courier_note || ''))
  );
  console.log('INFO orders with seed note tag (hidden in UI):', withDemoTag.length);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => {
    const d = String(o.delivery_date || o.created_at || '').slice(0, 10);
    return d === todayIso;
  });
  console.log('INFO orders for today delivery', todayIso, ':', todayOrders.length);
  if (todayOrders.length < 50) {
    console.warn(
      `WARN: мало заявок на сегодня (${todayOrders.length}). Запустите: npm run pg:seed-demo-orders и перезапустите сервер.`
    );
  } else {
    console.log('OK today order volume for load test:', todayOrders.length);
  }

  ({ r, data } = await json('/api/orders/operator/drivers', { headers: hdr() }));
  if (!r.ok) throw new Error(`GET drivers failed: ${r.status}`);
  if (!Array.isArray(data?.drivers)) throw new Error('drivers response invalid');
  console.log('OK GET /api/orders/operator/drivers', data.drivers.length);

  const sample = orders[0];
  const orderId = sample.id;
  const prevNote = String(sample.courier_note || '');
  const testNote = prevNote.includes('verify-op')
    ? prevNote
    : `${prevNote ? prevNote + ' ' : ''}verify-op`.trim();

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;

  ({ r, data } = await json(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ courier_note: testNote }),
  }));
  if (!r.ok) throw new Error(`PATCH order failed: ${r.status} ${JSON.stringify(data)}`);
  console.log('OK PATCH /api/orders/:id (courier_note)');

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;
  ({ r, data } = await json(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      zone: 'Подхват',
      delivery_date: sample.delivery_date,
      delivery_slot: sample.delivery_slot,
      payment_method: sample.payment_method || 'cash',
    }),
  }));
  if (!r.ok) throw new Error(`PATCH zone Подхват failed: ${r.status} ${JSON.stringify(data)}`);
  if (String(data?.order?.zone || '') !== 'Подхват') {
    throw new Error(`PATCH zone Подхват: expected zone Подхват, got ${data?.order?.zone}`);
  }
  console.log('OK PATCH /api/orders/:id (zone Подхват)');

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const deliveryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;

  ({ r, data } = await json('/api/orders/operator', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      customer_name: 'Тест Оператор',
      customer_phone: '79009998877',
      address: 'Оренбург, ул. Тестовая, д. 1',
      delivery_date: deliveryDate,
      delivery_slot: '09:00 – 14:00',
      payment_method: 'cash',
      product_title: 'Вода 19 л',
      qty: 2,
      unit_price: 360,
      zone: 'Подхват',
      courier_note: 'verify-operator-create',
    }),
  }));
  if (!r.ok) throw new Error(`POST /api/orders/operator failed: ${r.status} ${JSON.stringify(data)}`);
  if (!data?.order?.id) throw new Error('Create order: no id in response');
  console.log('OK POST /api/orders/operator id=', data.order.id);

  const from = deliveryDate;
  ({ r, data } = await json(
    `/api/orders/operator/audit-report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(from)}`,
    { headers: hdr() }
  ));
  if (!r.ok) throw new Error(`audit-report failed: ${r.status}`);
  console.log('OK GET /api/orders/operator/audit-report');

  ({ r, data } = await json('/api/csrf', { headers: hdr() }));
  absorb(r);
  csrf = data?.csrfToken;
  ({ r } = await json('/api/auth/logout', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: '{}',
  }));
  if (!r.ok) throw new Error(`logout failed: ${r.status}`);
  ({ r, data } = await json('/api/auth/me', { headers: hdr() }));
  if (data?.user) throw new Error('Session must be cleared after logout');
  console.log('OK logout');

  console.log('\nverify-operator-flow: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
