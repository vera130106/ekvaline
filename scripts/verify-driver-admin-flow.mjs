/**
 * Полная цепочка: админ → водитель в списке оператора → назначение → заказ у водителя.
 * node scripts/verify-driver-admin-flow.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3001';

function moscowTodayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
}

function moscowTomorrowIso() {
  const [y, m, d] = moscowTodayIso().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

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
  if (!r.ok) throw new Error(`Login ${email} failed: ${r.status} ${JSON.stringify(data)}`);

  async function freshCsrf() {
    ({ r, data } = await json('/api/csrf', { headers: hdr() }));
    absorb(r);
    csrf = data?.csrfToken || csrf;
    return csrf;
  }

  async function post(path, body) {
    await freshCsrf();
    return json(path, { method: 'POST', headers: hdr(), body: JSON.stringify(body) });
  }

  async function patch(path, body) {
    await freshCsrf();
    return json(path, { method: 'PATCH', headers: hdr(), body: JSON.stringify(body) });
  }

  return {
    cookies,
    hdr,
    freshCsrf,
    post,
    patch,
    get: (path) => json(path, { headers: hdr() }),
    user: data.user,
  };
}

async function main() {
  const stamp = Date.now();
  const driverEmail = `test.driver.${stamp}@ekvaline.local`;
  const driverPassword = 'TestDriver2026!';
  const driverLabel = `Тест Водитель ${stamp}`;
  const testAddress = 'Оренбург, ул. Тестовая, д. 1';
  const routeDay = moscowTodayIso();

  const admin = await loginAs('admekva@mail.ru', 'adm2026A');
  let { r, data } = await admin.post('/api/admin/users', {
    first_name: 'Тест',
    last_name: `Водитель ${stamp}`,
    email: driverEmail,
    phone: `7${String(stamp).slice(-10)}`,
    password: driverPassword,
    role: 'driver',
    driver_route_label: driverLabel,
  });
  if (!r.ok) throw new Error(`Admin create driver failed: ${r.status} ${JSON.stringify(data)}`);
  console.log('OK admin created driver', driverEmail);

  const operator = await loginAs('opekva@mail.ru', 'ekva2026E');
  ({ r, data } = await operator.get('/api/orders/operator/drivers'));
  if (!r.ok) throw new Error(`Operator drivers list failed: ${r.status}`);
  const labels = (data?.drivers || []).map((d) => String(d.label || '').trim());
  if (!labels.some((l) => l.toLocaleLowerCase('ru') === driverLabel.toLocaleLowerCase('ru'))) {
    throw new Error(`Driver label not in operator list: ${driverLabel} got ${JSON.stringify(labels)}`);
  }
  console.log('OK operator drivers list contains', driverLabel);

  // Создание заказа с водителем сразу (дата доставки — сегодня по Москве)
  ({ r, data } = await operator.post('/api/orders/operator', {
    customer_name: 'Тест Клиент',
    customer_phone: `79${String(stamp).slice(-9)}`,
    address: testAddress,
    delivery_date: routeDay,
    delivery_slot: '09:00 – 14:00',
    payment_method: 'cash',
    product_title: 'Вода 19 л',
    qty: 1,
    unit_price: 360,
    driver: driverLabel,
    courier_note: `verify-driver-create-${stamp}`,
  }));
  if (!r.ok) throw new Error(`Operator create with driver failed: ${r.status} ${JSON.stringify(data)}`);
  const createOrderId = data?.order?.id;
  if (!createOrderId) throw new Error('Create order: no id');
  const createStatus = String(data?.order?.status || '').toLowerCase();
  if (createStatus !== 'pending_operator') {
    throw new Error(`Expected pending_operator after driver assign on create, got ${createStatus}`);
  }
  console.log('OK operator created order with driver, id=', createOrderId, 'status=', createStatus);

  // Назначение водителя через PATCH на существующий заказ
  ({ r, data } = await operator.get('/api/orders'));
  if (!r.ok) throw new Error(`GET /api/orders failed: ${r.status}`);
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const patchTarget = orders.find((o) => !String(o.driver || '').trim() && o.id !== createOrderId) || orders[0];
  if (!patchTarget?.id) throw new Error('No order to patch');

  ({ r, data } = await operator.patch(`/api/orders/${patchTarget.id}`, {
    driver: driverLabel,
    delivery_date: routeDay,
    status: 'pending_operator',
  }));
  if (!r.ok) throw new Error(`PATCH assign driver failed: ${r.status} ${JSON.stringify(data)}`);
  if (String(data?.order?.driver || '').trim() !== driverLabel) {
    throw new Error(`PATCH driver mismatch: ${data?.order?.driver} !== ${driverLabel}`);
  }
  console.log('OK operator PATCH assigned driver to order', patchTarget.id);

  const driver = await loginAs(driverEmail, driverPassword);
  if (String(driver.user?.role || '').toLowerCase() !== 'driver') {
    throw new Error(`Expected driver role, got ${driver.user?.role}`);
  }
  console.log('OK driver login', driverEmail);

  ({ r, data } = await driver.get('/api/driver/orders'));
  if (!r.ok) throw new Error(`GET /api/driver/orders failed: ${r.status}`);
  if (!data || !Array.isArray(data.orders)) throw new Error('Driver orders response invalid');
  if (data.route_day !== routeDay) {
    throw new Error(`route_day mismatch: ${data.route_day} !== ${routeDay}`);
  }

  const driverOrders = data.orders;
  const ids = new Set(driverOrders.map((o) => o.id));
  if (!ids.has(createOrderId)) {
    throw new Error(`Created order ${createOrderId} not in driver list: ${JSON.stringify(ids)}`);
  }
  if (!ids.has(patchTarget.id)) {
    throw new Error(`Patched order ${patchTarget.id} not in driver list: ${JSON.stringify(ids)}`);
  }

  const createdRow = driverOrders.find((o) => o.id === createOrderId);
  if (!String(createdRow?.address || '').includes('Тестовая')) {
    throw new Error(`Driver order address missing: ${createdRow?.address}`);
  }
  console.log('OK driver sees assigned orders:', driverOrders.length, 'for', routeDay);

  console.log('verify-driver-admin-flow: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
