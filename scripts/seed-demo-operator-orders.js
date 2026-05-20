/**
 * Досеивает демо-заявки: ~100 заказов на каждый из последних 14 дней доставки (db.js → ensureDemoOperatorOrders).
 * Запуск: npm run pg:seed-demo-orders
 * Полная очистка orders и повторный сид: npm run pg:seed-demo-orders:force
 */
require('dotenv').config();
const { Pool } = require('pg');
const {
  ensureDemoDriverUsers,
  ensureDemoOperatorOrders,
  ensureDemoOperatorAuditEvents,
  normalizeDemoOrderPayments,
  syncDemoOrderDrivers,
} = require('../db.js');

async function main() {
  const force = process.argv.includes('--force');
  if (!process.env.DATABASE_URL) {
    console.error('Задайте DATABASE_URL в .env');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  try {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM orders');
    if (force) {
      await pool.query('DELETE FROM orders');
      console.log(`Удалены все заказы (--force), было: ${before.rows[0].n}.`);
    }
    await ensureDemoDriverUsers(pool);
    await ensureDemoOperatorOrders(pool);
    await normalizeDemoOrderPayments(pool);
    await syncDemoOrderDrivers(pool);
    await ensureDemoOperatorAuditEvents(pool);
    const drivers = await pool.query(`SELECT COUNT(*)::int AS n FROM users WHERE lower(role) = 'driver'`);
    const audit = await pool.query('SELECT COUNT(*)::int AS n FROM order_audit_events');
    console.log(`Событий журнала в БД: ${audit.rows[0].n}`);
    const r = await pool.query('SELECT COUNT(*)::int AS n FROM orders');
    console.log(`Водителей в БД: ${drivers.rows[0].n}`);
    console.log(`Готово. Заказов в БД сейчас: ${r.rows[0].n}`);
    if (!force && before.rows[0].n > 0 && r.rows[0].n === before.rows[0].n) {
      console.log(
        'Демо не добавлено: таблица orders не пуста. Для полной подстановки демо: npm run pg:seed-demo-orders:force'
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
