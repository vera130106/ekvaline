#!/usr/bin/env node
/**
 * Удаление демо- и тестовых адресов из PostgreSQL.
 * npm run pg:clean-test-addresses -- --yes
 *
 * Полная очистка (заказы + клиенты + адреса): npm run pg:clean-test-data -- --yes
 */
import pg from 'pg';
import { config as loadEnv } from 'dotenv';
import { createRequire } from 'module';

loadEnv();

const require = createRequire(import.meta.url);
const { purgeTestAddresses } = require('../lib/test-data-purge.js');

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.log(
      'Будут удалены только адреса (демо-пресеты и строки с «тест»).\n' +
        'Для заказов и клиентов: npm run pg:clean-test-data -- --yes\n\n' +
        'Запуск: npm run pg:clean-test-addresses -- --yes'
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
    const total = await purgeTestAddresses(client, (msg) => console.log(msg));
    await client.query(
      `INSERT INTO site_settings (key, value) VALUES ('demo_test_addresses_purged_v1', '1')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
    );
    await client.query('COMMIT');
    console.log(`\nГотово. Всего удалено записей: ${total}.`);

    const left = await client.query(
      'SELECT id, label, address_line FROM delivery_addresses ORDER BY sort_order, id'
    );
    console.log(`Осталось пресетов delivery_addresses: ${left.rowCount}`);
    for (const row of left.rows) {
      console.log(`  • [${row.id}] ${row.label} — ${row.address_line}`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[cleanup-test-addresses]', err.message || err);
  process.exit(1);
});
