/**
 * Проверка CRUD товаров в админке и отражения в публичном каталоге.
 * node scripts/verify-admin-products.mjs [baseUrl]
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

async function loginAdmin() {
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

  return {
    hdr: () => ({ Cookie: cookies.join('; '), 'X-CSRF-Token': csrf }),
    refreshCsrf: async () => {
      ({ r, data } = await json('/api/csrf', { headers: hdr() }));
      absorb(r);
      csrf = data?.csrfToken;
    },
  };
}

async function main() {
  const admin = await loginAdmin();

  let { r, data } = await json('/api/admin/products', { headers: admin.hdr() });
  if (!r.ok) throw new Error(`GET admin products failed: ${r.status}`);
  const products = Array.isArray(data?.products) ? data.products : [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  if (!categories.length) throw new Error('No categories in admin API');
  if (!products.length) throw new Error('No products in admin API');
  console.log('OK admin products list', products.length);

  const target = products.find((p) => String(p.name || '').includes('тара')) || products[0];
  const id = Number(target.id);
  const newPrice = Math.max(1, Math.round(Number(target.price) || 400) + 1);
  const newName = String(target.name || 'Товар').trim();
  const stamp = Date.now();

  await admin.refreshCsrf();
  ({ r, data } = await json(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: admin.hdr(),
    body: JSON.stringify({
      category_id: target.category_id,
      name: newName,
      description: String(target.description || '').trim() || `Проверка ${stamp}`,
      price: newPrice,
      volume_liters: target.volume_liters ?? null,
      sort_order: Number(target.sort_order) || 0,
      hidden: Number(target.hidden) || 0,
      preorder: Number(target.preorder) || 0,
    }),
  }));
  if (!r.ok) throw new Error(`PATCH product failed: ${r.status} ${JSON.stringify(data)}`);
  if (Number(data?.product?.price) !== newPrice) {
    throw new Error(`Price not updated: expected ${newPrice}, got ${data?.product?.price}`);
  }
  console.log('OK product PATCH price', newPrice);

  ({ r, data } = await json('/api/admin/products', { headers: admin.hdr() }));
  const again = (data?.products || []).find((p) => Number(p.id) === id);
  if (!again || Number(again.price) !== newPrice) {
    throw new Error('Admin list does not reflect patched price');
  }
  console.log('OK admin list after PATCH');

  const pub = await json('/api/products');
  if (!pub.r.ok) throw new Error(`GET public products failed: ${pub.r.status}`);
  const pubHit = (pub.data?.products || []).find((p) => Number(p.id) === id);
  if (Number(target.hidden) === 0 && Number(target.preorder) === 0) {
    if (!pubHit || Number(pubHit.price) !== newPrice) {
      throw new Error('Public catalog does not reflect visible product price');
    }
    console.log('OK public catalog reflects change');
  } else {
    console.log('OK product hidden/preorder — public catalog skip');
  }

  await admin.refreshCsrf();
  ({ r } = await json(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: admin.hdr(),
    body: JSON.stringify({
      category_id: target.category_id,
      name: newName,
      description: String(target.description || '').trim(),
      price: Number(target.price) || newPrice,
      volume_liters: target.volume_liters ?? null,
      sort_order: Number(target.sort_order) || 0,
      hidden: Number(target.hidden) || 0,
      preorder: Number(target.preorder) || 0,
    }),
  }));
  if (!r.ok) throw new Error(`Revert PATCH failed: ${r.status}`);
  console.log('OK product reverted after test');

  await admin.refreshCsrf();
  const catId = categories[0].id;
  ({ r, data } = await json('/api/admin/products', {
    method: 'POST',
    headers: admin.hdr(),
    body: JSON.stringify({
      category_id: catId,
      name: `Тест админ ${stamp}`,
      description: 'Автотест',
      price: 123,
      volume_liters: null,
      sort_order: 999,
      hidden: 1,
      preorder: 0,
      stock: 100,
    }),
  }));
  if (!r.ok) throw new Error(`POST product failed: ${r.status} ${JSON.stringify(data)}`);
  const createdId = Number(data?.product?.id);
  if (!createdId) throw new Error('Create product: no id');
  console.log('OK product POST id', createdId);

  await admin.refreshCsrf();
  ({ r } = await json(`/api/admin/products/${createdId}`, { method: 'DELETE', headers: admin.hdr() }));
  if (!r.ok) throw new Error(`DELETE product failed: ${r.status}`);
  console.log('OK product DELETE');

  console.log('verify-admin-products: all checks passed');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
