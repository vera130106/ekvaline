/**
 * Сквозная проверка: публичный API, регистрация, вход, заказ, staff.
 * node scripts/verify-full-site-flow.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3010';

const STAFF = [
  { label: 'Админ', credential: 'admekva@mail.ru', password: 'adm2026A', roles: ['admin'] },
  { label: 'Менеджер', credential: 'menekva@mail.ru', password: 'men2026M', roles: ['manager', 'admin'] },
  { label: 'Оператор', credential: 'opekva@mail.ru', password: 'ekva2026E', roles: ['operator', 'manager', 'admin'] },
  { label: 'Водитель', credential: 'driverekva@mail.ru', password: 'DriverEkva2026!', roles: ['driver'] },
];

const PUBLIC_PAGES = [
  'index.html',
  'catalog.html',
  'about.html',
  'delivery.html',
  'contacts.html',
  'community.html',
  'cabinet.html',
  'reset-password.html',
  'admin.html',
  'operator.html',
  'manager.html',
  'driver.html',
];

const fails = [];
const oks = [];

function ok(msg) {
  oks.push(msg);
  console.log('OK', msg);
}

function fail(msg) {
  fails.push(msg);
  console.error('FAIL', msg);
}

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : null;
  return { r, data };
}

function sessionClient() {
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

  return {
    async csrf() {
      const { r, data } = await json('/api/csrf', { headers: hdr() });
      absorb(r);
      return data?.csrfToken || null;
    },
    async login(body) {
      const csrf = await this.csrf();
      const { r, data } = await json('/api/auth/login', {
        method: 'POST',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
      absorb(r);
      return { r, data };
    },
    async register(body) {
      const csrf = await this.csrf();
      const { r, data } = await json('/api/auth/register', {
        method: 'POST',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
      absorb(r);
      return { r, data };
    },
    async me() {
      return json('/api/auth/me', { headers: hdr() });
    },
    async get(path) {
      return json(path, { headers: hdr() });
    },
    async post(path, body) {
      const csrf = await this.csrf();
      return json(path, {
        method: 'POST',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
    },
  };
}

const BOOKING_SLOT_CANDIDATES = ['09:00-14:00', '14:00-17:00', '17:00-21:00', '09:00-17:00'];

function isoFromOffsetDays(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Первая открытая дата и интервал с учётом настроек оператора. */
async function pickOpenBooking() {
  const av = await json('/api/public/delivery-availability');
  const closedDays = new Set(Array.isArray(av.data?.closedDays) ? av.data.closedDays : []);
  const closedSlots = new Set(
    (Array.isArray(av.data?.closedSlots) ? av.data.closedSlots : []).map(
      (row) => `${String(row?.date || '').trim()}|${String(row?.slot || '').trim()}`
    )
  );
  for (let offset = 1; offset <= 30; offset += 1) {
    const delivery_date = isoFromOffsetDays(offset);
    if (closedDays.has(delivery_date)) continue;
    for (const delivery_slot of BOOKING_SLOT_CANDIDATES) {
      if (!closedSlots.has(`${delivery_date}|${delivery_slot}`)) {
        return { delivery_date, delivery_slot };
      }
    }
  }
  return { delivery_date: isoFromOffsetDays(1), delivery_slot: '09:00-14:00' };
}

async function checkPublicApi() {
  const boot = await json('/api/client-boot');
  if (!boot.r.ok || !boot.data?.bootId) fail('GET /api/client-boot');
  else ok(`client-boot (idle ${boot.data.sessionIdleMinutes} мин)`);

  const settings = await json('/api/public/settings');
  if (!settings.r.ok || !Array.isArray(settings.data?.deliverySlots)) fail('GET /api/public/settings');
  else ok('public/settings');

  const products = await json('/api/products');
  const list = products.data?.products;
  if (!products.r.ok || !Array.isArray(list) || !list.length) fail('GET /api/products');
  else ok(`products (${list.length})`);
  return list[0];
}

async function checkPublicPages() {
  for (const page of PUBLIC_PAGES) {
    const r = await fetch(`${base}/${page}`, { redirect: 'manual' });
    if (r.status !== 200) {
      fail(`страница ${page} → ${r.status}`);
    } else {
      ok(`страница ${page}`);
    }
  }
}

async function checkClientFlow(product) {
  const ts = Date.now();
  const email = `verify.client.${ts}@mail.ru`;
  const phone = `79${String(ts).slice(-9)}`;
  const password = 'TestClient9!';
  const client = sessionClient();

  const reg = await client.register({
    first_name: 'Тест',
    last_name: 'Клиент',
    email,
    phone,
    password,
  });
  if (!reg.r.ok || reg.data?.user?.role !== 'client') {
    fail(`регистрация клиента: ${reg.r.status} ${JSON.stringify(reg.data)}`);
    return;
  }
  ok('регистрация клиента');

  const me1 = await client.me();
  if (!me1.r.ok || me1.data?.user?.email !== email) fail('сессия после регистрации (/api/auth/me)');
  else ok('сессия после регистрации');

  const booking = await pickOpenBooking();
  const orderBody = {
    address: 'г. Оренбург, ул. Салмышская, д. 10',
    delivery_date: booking.delivery_date,
    delivery_slot: booking.delivery_slot,
    payment_method: 'cash',
    bonuses_used: 0,
    items: [{ product_id: product.id, qty: 1 }],
  };

  const created = await client.post('/api/orders', orderBody);
  if (!created.r.ok || !created.data?.order?.id) {
    fail(`оформление заказа: ${created.r.status} ${JSON.stringify(created.data)}`);
    return;
  }
  ok(`оформление заказа #${created.data.order.id}`);

  const my = await client.get('/api/orders/my');
  const mine = my.data?.orders;
  if (!my.r.ok || !Array.isArray(mine) || !mine.some((o) => o.id === created.data.order.id)) {
    fail('GET /api/orders/my после заказа');
  } else {
    ok('GET /api/orders/my');
  }

  const wrong = await client.login({ credential: email, password: 'WrongPass1!' });
  if (wrong.r.status !== 401) fail(`неверный пароль клиента: ожидали 401, получили ${wrong.r.status}`);
  else ok('неверный пароль клиента → 401');

  const relogin = await client.login({ email, password });
  if (!relogin.r.ok || relogin.data?.user?.email !== email) fail('повторный вход клиента по email');
  else ok('повторный вход клиента по email');
}

async function checkStaffLogins() {
  for (const s of STAFF) {
    const c = sessionClient();
    const { r, data } = await c.login({ credential: s.credential, password: s.password });
    if (!r.ok) {
      fail(`${s.label} вход: ${r.status}`);
      continue;
    }
    const role = String(data?.user?.role || '').toLowerCase();
    if (!s.roles.includes(role)) {
      fail(`${s.label} роль ${role}, ожидали ${s.roles.join('|')}`);
      continue;
    }
    ok(`${s.label} вход (${role})`);

    if (role === 'driver') {
      const orders = await c.get('/api/driver/orders');
      if (!orders.r.ok) fail('водитель GET /api/driver/orders');
      else ok('водитель GET /api/driver/orders');
    }
    if (['operator', 'manager', 'admin'].includes(role)) {
      const orders = await c.get('/api/orders');
      if (!orders.r.ok) fail(`${s.label} GET /api/orders`);
      else ok(`${s.label} GET /api/orders`);
    }
    if (role === 'admin') {
      const stats = await c.get('/api/admin/stats');
      if (!stats.r.ok) fail('админ GET /api/admin/stats');
      else ok('админ GET /api/admin/stats');
    }
    if (role === 'manager') {
      const settings = await c.get('/api/manager/settings');
      if (!settings.r.ok) fail('менеджер GET /api/manager/settings');
      else ok('менеджер GET /api/manager/settings');
    }
  }
}

async function main() {
  console.log(`\n=== Полная проверка сайта: ${base} ===\n`);

  try {
    const ping = await fetch(`${base}/api/client-boot`);
    if (!ping.ok) throw new Error(`сервер недоступен: ${ping.status}`);
  } catch (e) {
    console.error(`Сервер не отвечает на ${base}. Запустите: node server.js`);
    process.exit(1);
  }

  await checkPublicPages();
  const product = await checkPublicApi();
  await checkClientFlow(product);
  await checkStaffLogins();

  console.log(`\n--- Итого: ${oks.length} OK, ${fails.length} FAIL ---`);
  if (fails.length) {
    fails.forEach((f) => console.error(' •', f));
    process.exit(1);
  }
  console.log('\nВсе проверки пройдены.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
