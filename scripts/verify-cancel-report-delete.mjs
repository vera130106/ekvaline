/**
 * Удаление заказа оператором → событие в отчёте «Отмены».
 * node scripts/verify-cancel-report-delete.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://127.0.0.1:3001';

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  return { r, data };
}

async function loginAs(email, password) {
  let cookies = [];
  let csrf = '';
  const hdr = () => ({ Cookie: cookies.join('; '), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) });
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
  csrf = data?.csrfToken || '';
  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: hdr(),
    body: JSON.stringify({ credential: email, password }),
  }));
  absorb(r);
  if (!r.ok) throw new Error(`Login failed: ${r.status}`);
  return { hdr, absorb, getCsrf: async () => {
    ({ r, data } = await json('/api/csrf', { headers: hdr() }));
    absorb(r);
    csrf = data?.csrfToken || csrf;
    return csrf;
  }};
}

function moscowTodayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
}

async function main() {
  const stamp = Date.now();
  const op = await loginAs('opekva@mail.ru', 'ekva2026E');
  const today = moscowTodayIso();
  let csrf = await op.getCsrf();
  let { r, data } = await json('/api/orders/operator', {
    method: 'POST',
    headers: { ...op.hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({
      customer_name: 'Тест Отмена',
      customer_phone: `79${String(stamp).slice(-9)}`,
      address: 'Оренбург, ул. Проверочная, д. 1',
      delivery_date: today,
      delivery_slot: '09:00 – 14:00',
      payment_method: 'cash',
      product_title: 'Вода 19 л',
      qty: 1,
      unit_price: 360,
      courier_note: `verify-cancel-${stamp}`,
    }),
  });
  if (!r.ok) throw new Error(`Create failed: ${r.status} ${JSON.stringify(data)}`);
  const orderId = data?.order?.id;
  if (!orderId) throw new Error('No order id');

  csrf = await op.getCsrf();
  ({ r, data } = await json(`/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: { ...op.hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ reason: `тест удаления ${stamp}` }),
  }));
  if (!r.ok) throw new Error(`Delete failed: ${r.status} ${JSON.stringify(data)}`);

  ({ r, data } = await json(`/api/orders/operator/audit-report?from=${today}&to=${today}`, { headers: op.hdr() }));
  if (!r.ok) throw new Error(`Audit report failed: ${r.status}`);
  const events = data?.events || [];
  const hit = events.find(
    (e) => String(e.action) === 'order_delete' && String(e.reason || '').includes(String(stamp))
  );
  if (!hit) {
    throw new Error(`order_delete not in audit report. events=${JSON.stringify(events.map((e) => e.action))}`);
  }
  console.log('OK delete recorded in audit report, reason:', hit.reason);
  console.log('verify-cancel-report-delete: passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
