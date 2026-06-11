/**
 * Проверка согласованности статистики админа (/api/admin/stats).
 * node scripts/verify-admin-stats.mjs [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3002';

function sumRows(rows, key = 'count') {
  return (rows || []).reduce((acc, x) => acc + (Number(x[key]) || 0), 0);
}

function near(a, b, eps = 0.02) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

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
  const csrf = data?.csrfToken;

  ({ r, data } = await json('/api/auth/login', {
    method: 'POST',
    headers: { ...hdr(), 'X-CSRF-Token': csrf },
    body: JSON.stringify({ credential: 'admekva@mail.ru', password: 'adm2026A' }),
  }));
  absorb(r);
  if (!r.ok) throw new Error(`Admin login failed: ${r.status} ${JSON.stringify(data)}`);

  return {
    async get(path) {
      return json(path, { headers: { ...hdr(), 'X-CSRF-Token': csrf } });
    },
  };
}

function checkReport(label, report) {
  const issues = [];
  const s = report.summary || {};
  const statusCount = sumRows(report.ordersByStatus);
  const statusSum = sumRows(report.ordersByStatus, 'sum');
  const zoneCount = sumRows(report.ordersByZone);
  const zoneSum = sumRows(report.ordersByZone, 'sum');
  const payCount = sumRows(report.ordersByPayment);
  const paySum = sumRows(report.ordersByPayment, 'sum');
  const driverCount = sumRows(report.ordersByDriver);
  const driverSum = sumRows(report.ordersByDriver, 'sum');

  if (statusCount !== s.ordersTotal) {
    issues.push(`summary.ordersTotal=${s.ordersTotal}, сумма по статусам=${statusCount}`);
  }
  if (!near(statusSum, s.ordersSum)) {
    issues.push(`summary.ordersSum=${s.ordersSum}, сумма по статусам=${statusSum}`);
  }
  if (zoneCount !== s.ordersTotal) {
    issues.push(`зоны: ${zoneCount} заказов, сводка ${s.ordersTotal}`);
  }
  if (!near(zoneSum, s.ordersSum)) {
    issues.push(`зоны: сумма ${zoneSum}, сводка ${s.ordersSum}`);
  }
  if (payCount !== s.ordersTotal) {
    issues.push(`оплата: ${payCount} заказов, сводка ${s.ordersTotal}`);
  }
  if (!near(paySum, s.ordersSum)) {
    issues.push(`оплата: сумма ${paySum}, сводка ${s.ordersSum}`);
  }
  if (driverCount !== s.ordersTotal) {
    issues.push(`экспедиторы: ${driverCount} заказов, сводка ${s.ordersTotal}`);
  }
  if (!near(driverSum, s.ordersSum)) {
    issues.push(`экспедиторы: сумма ${driverSum}, сводка ${s.ordersSum}`);
  }

  const deliveredRow = (report.ordersByStatus || []).find((x) => x.status === 'delivered');
  const deliveredCount = deliveredRow ? Number(deliveredRow.count) : 0;
  const deliveredSum = deliveredRow ? Number(deliveredRow.sum) : 0;
  if (deliveredCount !== s.deliveredCount) {
    issues.push(`deliveredCount=${s.deliveredCount}, в таблице статусов=${deliveredCount}`);
  }
  if (!near(deliveredSum, s.deliveredSum)) {
    issues.push(`deliveredSum=${s.deliveredSum}, в таблице статусов=${deliveredSum}`);
  }

  const cancelledRow = (report.ordersByStatus || []).find((x) => x.status === 'cancelled');
  const cancelledCount = cancelledRow ? Number(cancelledRow.count) : 0;
  if (cancelledCount !== s.cancelledCount) {
    issues.push(`cancelledCount=${s.cancelledCount}, в таблице статусов=${cancelledCount}`);
  }

  const ur = report.usersByRole || {};
  const staffRoles = ['admin', 'manager', 'operator', 'driver'];
  const staffSum = staffRoles.reduce((acc, k) => acc + (Number(ur[k]) || 0), 0);
  if (staffSum < 1) {
    issues.push('нет учёток сотрудников в usersByRole');
  }

  console.log(`\n[${label}] период ${report.period?.from || '—'} … ${report.period?.to || '—'}`);
  console.log(
    `  заказов=${s.ordersTotal}, сумма=${s.ordersSum} ₽, доставлено=${s.deliveredCount}, отменено=${s.cancelledCount}`
  );
  console.log(
    `  сотрудники=${staffSum} (admin ${ur.admin || 0}, manager ${ur.manager || 0}, operator ${ur.operator || 0}, driver ${ur.driver || 0}), клиенты=${ur.client || 0}`
  );
  console.log(`  товары=${report.productsTotal}/${report.productsVisible}`);

  return issues;
}

async function main() {
  console.log(`Проверка статистики админа: ${base}`);
  const api = await adminSession();

  const { r: rAll, data: allTime } = await api.get('/api/admin/stats');
  if (!rAll.ok) throw new Error(`stats all-time failed: ${rAll.status}`);

  const today = new Date();
  const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;

  const { r: r30, data: last30 } = await api.get(`/api/admin/stats?from=${from}&to=${to}`);
  if (!r30.ok) throw new Error(`stats 30d failed: ${r30.status}`);

  const { r: rBad, data: bad } = await api.get('/api/admin/stats?from=2099-01-01');
  if (rBad.status !== 400) {
    throw new Error(`ожидали 400 для будущей даты «с», получили ${rBad.status}`);
  }

  const allIssues = [
    ...checkReport('Всё время', allTime),
    ...checkReport('30 дней', last30),
  ];

  if ((last30.summary?.ordersTotal ?? 0) > (allTime.summary?.ordersTotal ?? 0)) {
    allIssues.push('за 30 дней заказов больше, чем за всё время');
  }

  if (allIssues.length) {
    console.error('\nОШИБКИ:');
    allIssues.forEach((x) => console.error(`  - ${x}`));
    process.exit(1);
  }

  console.log('\nOK: сводка и все таблицы согласованы, валидация периода работает.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
