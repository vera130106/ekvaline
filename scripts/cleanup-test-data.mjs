#!/usr/bin/env node
/**
 * Удаление тестовых заказов, клиентов, адресов и артефактов verify/demo.
 * npm run pg:clean-test-data -- --yes
 */
import pg from 'pg';
import { config as loadEnv } from 'dotenv';
import { createRequire } from 'module';

loadEnv();

const require = createRequire(import.meta.url);
const { purgeTestOperationalData } = require('../lib/test-data-purge.js');

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.log(
      'Будут удалены:\n' +
        '  • заказы с «Тестовая», verify-op, verify-operator, §demo_*, §ekva_seed\n' +
        '  • клиенты «Тест Клиент», «Тест Оператор», verify.*, demo.*@ekvaline.local\n' +
        '  • демо-пресеты адресов и строки с «тест» в delivery_addresses / client_saved_addresses\n' +
        '  • бонусы, подписки и уведомления этих пользователей\n\n' +
        'Staff (admin/operator/manager) не трогаем, кроме test.staff.*\n\n' +
        'Запуск: npm run pg:clean-test-data -- --yes'
    );
    process.exit(0);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан в .env');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('BEGIN');
    const stats = await purgeTestOperationalData(client, { log: (msg) => console.log(msg) });
    await client.query('COMMIT');

    const total =
      stats.orders + stats.bonus + stats.notifications + stats.subscriptions + stats.users + stats.staff + stats.addresses;

    console.log('\nГотово.');
    console.log(
      `Итого: заказов ${stats.orders}, пользователей ${stats.users + stats.staff}, адресов ${stats.addresses}, прочее ${stats.bonus + stats.notifications + stats.subscriptions}`
    );
    if (total === 0) console.log('Тестовых записей не найдено — БД уже чистая по этим критериям.');

    const left = await client.query(
      `SELECT COUNT(*)::int AS c FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE lower(trim(u.first_name)) = 'тест'
          OR o.address ILIKE '%тестовая%'`
    );
    if (left.rows[0]?.c > 0) {
      console.warn(`WARN: осталось подозрительных заказов: ${left.rows[0].c}`);
    } else {
      console.log('Проверка: заказов с «Тест» / «Тестовая» не осталось.');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[cleanup-test-data]', err.message || err);
  process.exit(1);
});
