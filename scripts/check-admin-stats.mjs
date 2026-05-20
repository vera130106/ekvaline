/**
 * Проверка согласованности /api/admin/stats с прямым SQL за период.
 * Запуск: node scripts/check-admin-stats.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const ORDER_DATE = `COALESCE(NULLIF(trim(delivery_date), ''), to_char(created_at, 'YYYY-MM-DD'))`;

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function statsForPeriod(pool, from, to) {
  const parts = [];
  const vals = [];
  if (from) {
    parts.push(`${ORDER_DATE} >= $${vals.length + 1}`);
    vals.push(from);
  }
  if (to) {
    parts.push(`${ORDER_DATE} <= $${vals.length + 1}`);
    vals.push(to);
  }
  const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';

  const summary = await pool.query(
    `SELECT COUNT(*)::int AS orders_total,
            COALESCE(SUM(total_sum), 0)::float AS orders_sum
     FROM orders ${where}`,
    vals
  );
  const byStatus = await pool.query(
    `SELECT status, COUNT(*)::int AS c, COALESCE(SUM(total_sum), 0)::float AS sum
     FROM orders ${where}
     GROUP BY status`,
    vals
  );
  return { summary: summary.rows[0], byStatus: byStatus.rows };
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const today = todayIso();
const from = (() => {
  const p = today.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  d.setDate(d.getDate() - 29);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

try {
  const r = await statsForPeriod(pool, from, today);
  const statusSum = r.byStatus.reduce((a, x) => a + Number(x.c), 0);
  const statusMoney = r.byStatus.reduce((a, x) => a + Number(x.sum), 0);
  const total = Number(r.summary.orders_total);
  const money = Number(r.summary.orders_sum);

  console.log(`Период: ${from} — ${today}`);
  console.log(`Заказов (сводка): ${total}, по статусам: ${statusSum}`);
  console.log(`Сумма (сводка): ${money.toFixed(2)}, по статусам: ${statusMoney.toFixed(2)}`);

  if (total !== statusSum) {
    console.error('ОШИБКА: число заказов в сводке не совпадает с суммой по статусам');
    process.exit(1);
  }
  if (Math.abs(money - statusMoney) > 0.01) {
    console.error('ОШИБКА: сумма заказов не совпадает с суммой по статусам');
    process.exit(1);
  }

  const future = await pool.query(
    `SELECT COUNT(*)::int AS n FROM orders WHERE ${ORDER_DATE} > $1`,
    [today]
  );
  console.log(`Заказов с датой в будущем: ${future.rows[0].n}`);

  const bad = await pool.query(
    `SELECT COUNT(*)::int AS n FROM orders
     WHERE ${ORDER_DATE} >= $1 AND ${ORDER_DATE} <= $2 AND (total_sum IS NULL OR total_sum = 0)`,
    [from, today]
  );
  console.log(`Заказов в периоде с нулевой суммой: ${bad.rows[0].n}`);
  console.log('OK: статистика за 30 дней согласована.');
} finally {
  await pool.end();
}
