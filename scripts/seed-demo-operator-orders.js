/**
 * Однократно подставляет демо-заказы для панели оператора (логика как в db.js → ensureDemoOperatorOrders).
 * Условия: нет ни одной строки с примечанием §demo_op И таблица orders пустая.
 * Запуск: npm run pg:seed-demo-orders
 * Полная подстановка (удаляет все заказы): npm run pg:seed-demo-orders:force
 */
require('dotenv').config();
const { Pool } = require('pg');
const { ensureDemoOperatorOrders } = require('../db.js');

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
    await ensureDemoOperatorOrders(pool);
    const r = await pool.query('SELECT COUNT(*)::int AS n FROM orders');
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
