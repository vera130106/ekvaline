/**
 * Проверка: настройки из админки доступны на публичном API для клиентских страниц.
 * Запуск: node scripts/verify-admin-client-sync.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3003';

async function main() {
  const r = await fetch(`${base}/api/public/settings?_=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`GET /api/public/settings → ${r.status}`);
  const data = await r.json();

  const checks = [
    ['deliveryFaq', Array.isArray(data.deliveryFaq) && data.deliveryFaq.length >= 1],
    ['deliveryCoverage.title', data.deliveryCoverage?.title?.length >= 3],
    ['deliveryCoverage.cards', Array.isArray(data.deliveryCoverage?.cards) && data.deliveryCoverage.cards.length >= 1],
    ['aboutCertificates', Array.isArray(data.aboutCertificates) && data.aboutCertificates.length >= 1],
    ['sitePolls', Array.isArray(data.sitePolls)],
    ['deliverySlots', Array.isArray(data.deliverySlots) && data.deliverySlots.length >= 1],
  ];

  let ok = true;
  for (const [name, pass] of checks) {
    console.log(pass ? 'OK' : 'FAIL', name);
    if (!pass) ok = false;
  }

  const pr = await fetch(`${base}/api/products`, { cache: 'no-store' });
  const products = pr.ok ? (await pr.json()).products : [];
  console.log(pr.ok && Array.isArray(products) ? 'OK' : 'FAIL', `products (${products?.length ?? 0})`);

  if (!ok || !pr.ok) process.exit(1);
  console.log('\nПубличный API готов для delivery.html, about.html, catalog.html, community.html');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
