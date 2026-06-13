/**
 * Смена пароля сотрудника администратором (с секретным кодом ADMIN_STAFF_PASSWORD_GATE).
 * node scripts/verify-admin-staff-gate.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3023';
const GATE = String(process.env.ADMIN_STAFF_PASSWORD_GATE || '295302').trim() || '295302';

async function json(path, opts = {}) {
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : null;
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

  return {
    hdr,
    absorb,
    async refreshCsrf() {
      ({ r, data } = await json('/api/csrf', { headers: hdr() }));
      absorb(r);
      csrf = data?.csrfToken;
    },
    async post(path, body) {
      return json(path, {
        method: 'POST',
        headers: { ...hdr(), 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      });
    },
    async get(path) {
      return json(path, { headers: { ...hdr(), 'X-CSRF-Token': csrf } });
    },
  };
}

async function main() {
  console.log(`Проверка смены пароля сотрудника (gate): ${base}`);

  const admin = await adminSession();
  await admin.refreshCsrf();

  let { r, data } = await admin.get('/api/admin/users');
  if (!r.ok) throw new Error('GET users failed');
  const staff = (data.users || []).find((u) => ['operator', 'manager', 'driver'].includes(String(u.role)));
  if (!staff) throw new Error('No staff user in DB');

  await admin.refreshCsrf();
  ({ r, data } = await admin.post(`/api/admin/users/${staff.id}/staff-password`, { password: 'Test2026!x' }));
  if (r.status !== 400) {
    throw new Error(`staff-password without gate_code should be 400, got ${r.status}`);
  }
  console.log('OK staff-password rejects missing gate_code');

  await admin.refreshCsrf();
  ({ r, data } = await admin.post(`/api/admin/users/${staff.id}/staff-password`, {
    password: 'Test2026!x',
    gate_code: '000000',
  }));
  if (r.status !== 403) {
    throw new Error(`staff-password with wrong gate should be 403, got ${r.status}`);
  }
  console.log('OK staff-password rejects wrong gate_code');

  await admin.refreshCsrf();
  ({ r, data } = await admin.post(`/api/admin/users/${staff.id}/staff-password`, {
    password: 'Test2026!x',
    gate_code: GATE,
  }));
  if (!r.ok) {
    throw new Error(`staff-password failed: ${r.status} ${JSON.stringify(data)}`);
  }
  if (!data?.ok) throw new Error('staff-password: expected ok');
  console.log('OK staff-password set for', staff.email);

  await admin.refreshCsrf();
  ({ r } = await admin.post(`/api/admin/users/${staff.id}/staff-password-info`, { gate_code: '0000' }));
  if (r.status !== 404) {
    throw new Error(`staff-password-info should be removed, got ${r.status}`);
  }
  console.log('OK staff-password-info removed');

  console.log('\nverify-admin-staff-gate: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
