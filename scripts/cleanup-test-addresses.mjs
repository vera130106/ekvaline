#!/usr/bin/env node
/**
 * Удаление демо- и тестовых адресов из PostgreSQL.
 * npm run pg:clean-test-addresses -- --yes
 */
import pg from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DEMO_PRESETS = [
  ['Центр — ул. Чкалова', 'Оренбург, ул. Чкалова, д. 15'],
  ['Степной — Салмышская', 'Оренбург, ул. Салмышская, д. 42'],
  ['Окраина — Ростоши', 'Оренбург, мкр. Ростоши-1, д. 8'],
  ['Доп. зона — Подгород', 'Оренбург, пос. Подгородный, ул. Южная, д. 3'],
];

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.log(
      'Будут удалены:\n' +
        '  • 4 демо-пресета delivery_addresses (Чкалова, Салмышская, Ростоши, Подгородный)\n' +
        '  • адреса с «тест» / «Тестовая» / test. в label или address_line\n' +
        '  • такие же строки в client_saved_addresses\n\n' +
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

    let total = 0;
    for (const [label, line] of DEMO_PRESETS) {
      const r = await client.query('DELETE FROM delivery_addresses WHERE label = $1 AND address_line = $2', [
        label,
        line,
      ]);
      if (r.rowCount > 0) {
        console.log(`delivery_addresses: − ${label}`);
        total += r.rowCount;
      }
    }

    const extra = await client.query(
      `DELETE FROM delivery_addresses
       WHERE label ILIKE '%тест%'
          OR address_line ILIKE '%тестов%'
          OR address_line ILIKE '%ул. тестовая%'
          OR address_line ILIKE '%test.%'
          OR COALESCE(notes, '') ILIKE '%demo%'`
    );
    if (extra.rowCount > 0) {
      console.log(`delivery_addresses (тест/demo): удалено ${extra.rowCount}`);
      total += extra.rowCount;
    }

    const saved = await client.query(
      `DELETE FROM client_saved_addresses
       WHERE label ILIKE '%тест%'
          OR address_line ILIKE '%тестов%'
          OR address_line ILIKE '%ул. тестовая%'
          OR address_line ILIKE '%test.%'`
    ).catch(() => ({ rowCount: 0 }));
    if (saved.rowCount > 0) {
      console.log(`client_saved_addresses: удалено ${saved.rowCount}`);
      total += saved.rowCount;
    }

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
