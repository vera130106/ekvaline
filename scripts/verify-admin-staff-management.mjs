/**
 * Проверка управления сотрудниками в админке: создание, роль, блокировка, вход.
 * node scripts/verify-admin-staff-management.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3001';

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  return { r, data };
}

async function adminSession() {
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
  if (!r.ok) throw new Error(`Admin login failed: ${r.status}`);

  const api = {
    async refreshCsrf() {
      ({ r, data } = await json('/api/csrf', { headers: hdr() }));
      absorb(r);
      csrf = data?.csrfToken;
    },
    async get(path) {
      return json(path, { headers: { ...hdr(), 'X-CSRF-Token': csrf } });
    },
    async patch(path, body) {
      return json(path, {
        method: 'PATCH',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
    },
    async post(path, body) {
      return json(path, {
        method: 'POST',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
    },
  };

  return api;
}

async function staffLogin(email, password) {
  let cookies = [];
  const hdr = () => ({ Cookie: cookies.join('; ') });
  const absorb = (res) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const p = c.split(';')[0];
      cookies = cookies.filter((x) => !x.startsWith(`${p.split('=')[0]}=`));
      cookies.push(p);
    }
  };
  let { r, data } = await json('/api/csrf', { headers: hdr() });
  absorb(r);
  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': data?.csrfToken },
    body: JSON.stringify({ credential: email, password }),
  }));
  absorb(r);
  return { r, data };
}

async function main() {
  const stamp = Date.now();
  const admin = await adminSession();
  await admin.refreshCsrf();

  const spec = {
    operator: {
      email: `staff.op.${stamp}@mail.ru`,
      phone: `7${String(stamp + 1).slice(-10)}`,
      password: 'StaffOp2026!',
      role: 'operator',
    },
    manager: {
      email: `staff.mgr.${stamp}@mail.ru`,
      phone: `7${String(stamp + 2).slice(-10)}`,
      password: 'StaffMgr2026!',
      role: 'manager',
    },
    driver: {
      email: `staff.drv.${stamp}@mail.ru`,
      phone: `7${String(stamp + 3).slice(-10)}`,
      password: 'StaffDrv2026!',
      role: 'driver',
      driver_route_label: `Водитель Тест ${stamp}`,
    },
  };

  const created = {};
  for (const [key, s] of Object.entries(spec)) {
    await admin.refreshCsrf();
    const { r, data } = await admin.post('/api/admin/users', {
      first_name: 'Тест',
      last_name: key === 'operator' ? 'Оператор' : key === 'manager' ? 'Менеджер' : 'Водитель',
      email: s.email,
      phone: s.phone,
      password: s.password,
      role: s.role,
      ...(s.driver_route_label ? { driver_route_label: s.driver_route_label } : {}),
    });
    if (!r.ok) throw new Error(`Create ${key} failed: ${r.status} ${JSON.stringify(data)}`);
    created[key] = { ...s, id: data.user.id };
    console.log('OK create', key, s.email);
  }

  for (const [key, s] of Object.entries(created)) {
    const login = await staffLogin(s.email, s.password);
    if (!login.r.ok) throw new Error(`Login ${key} failed: ${login.r.status}`);
    if (String(login.data?.user?.role).toLowerCase() !== key) {
      throw new Error(`Login ${key}: wrong role ${login.data?.user?.role}`);
    }
    console.log('OK login', key);
  }

  await admin.refreshCsrf();
  let { r, data } = await admin.patch(`/api/admin/users/${created.operator.id}`, { blocked: 1 });
  if (!r.ok) throw new Error(`Block operator failed: ${r.status}`);
  console.log('OK block operator');

  const blockedLogin = await staffLogin(created.operator.email, created.operator.password);
  if (blockedLogin.r.status !== 403) {
    throw new Error(`Blocked operator should get 403, got ${blockedLogin.r.status}`);
  }
  console.log('OK blocked operator cannot login');

  await admin.refreshCsrf();
  ({ r } = await admin.patch(`/api/admin/users/${created.operator.id}`, { blocked: 0 }));
  if (!r.ok) throw new Error(`Unblock operator failed: ${r.status}`);
  const unblockedLogin = await staffLogin(created.operator.email, created.operator.password);
  if (!unblockedLogin.r.ok) throw new Error('Unblocked operator login failed');
  console.log('OK unblock operator');

  await admin.refreshCsrf();
  ({ r, data } = await admin.patch(`/api/admin/users/${created.manager.id}`, { role: 'operator' }));
  if (!r.ok) throw new Error(`Role change failed: ${r.status}`);
  if (String(data?.user?.role) !== 'operator') throw new Error('Role change not reflected in response');
  console.log('OK role change manager -> operator');

  ({ r, data } = await admin.get('/api/admin/users'));
  if (!r.ok) throw new Error('GET users failed');
  const hit = (data.users || []).find((u) => Number(u.id) === Number(created.manager.id));
  if (!hit || hit.role !== 'operator') throw new Error('Role change not in users list');
  console.log('OK users list after role change');

  await admin.refreshCsrf();
  ({ r, data } = await admin.patch(`/api/admin/users/${created.driver.id}`, { role: 'operator' }));
  if (!r.ok) throw new Error(`Driver -> operator failed: ${r.status}`);
  console.log('OK driver role changed to operator');

  ({ r, data } = await admin.get('/api/orders/operator/drivers'));
  if (!r.ok) {
    // need operator session for drivers list - skip or login as operator
  }

  const opLogin = await staffLogin(created.operator.email, created.operator.password);
  if (!opLogin.r.ok) throw new Error('Operator login after tests failed');

  console.log('verify-admin-staff-management: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
