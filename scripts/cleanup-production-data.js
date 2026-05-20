/**
 * Полная очистка демо-данных перед загрузкой реальных.
 * Оставляет только учётки admin / operator / manager.
 *
 * Запуск: node scripts/cleanup-production-data.js
 * Подтверждение: node scripts/cleanup-production-data.js --yes
 */
require('dotenv').config();

const { Client } = require('pg');

const STAFF_ROLES = ['admin', 'operator', 'manager'];

async function tableExists(client, name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rowCount > 0;
}

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    // eslint-disable-next-line no-console
    console.log(
      'Будут удалены ВСЕ заказы и все пользователи, кроме admin/operator/manager.\n' +
        'Для выполнения: node scripts/cleanup-production-data.js --yes'
    );
    process.exit(0);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL не задан в .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('BEGIN');

    if (await tableExists(client, 'order_audit_events')) {
      const a = await client.query('DELETE FROM order_audit_events');
      // eslint-disable-next-line no-console
      console.log(`order_audit_events: удалено ${a.rowCount}`);
    }

    if (await tableExists(client, 'orders')) {
      const o = await client.query('DELETE FROM orders');
      // eslint-disable-next-line no-console
      console.log(`orders: удалено ${o.rowCount}`);
    }

    if (await tableExists(client, 'promocodes')) {
      await client.query(
        `DELETE FROM promocodes WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users WHERE lower(role) = ANY($1::text[]))`,
        [STAFF_ROLES]
      ).catch(() => {});
    }

    const delUsers = await client.query(
      `DELETE FROM users
       WHERE lower(COALESCE(role, '')) <> ALL($1::text[])
          OR role IS NULL`,
      [STAFF_ROLES]
    );
    // eslint-disable-next-line no-console
    console.log(`users (не staff): удалено ${delUsers.rowCount}`);

    if (await tableExists(client, 'clients')) {
      const c = await client.query('DELETE FROM clients');
      // eslint-disable-next-line no-console
      console.log(`clients: удалено ${c.rowCount}`);
    }

    const left = await client.query(
      `SELECT role, COUNT(*)::int AS c FROM users GROUP BY role ORDER BY role`
    );
    // eslint-disable-next-line no-console
    console.log('Остались пользователи:', left.rows);

    const ordLeft = await client.query('SELECT COUNT(*)::int AS c FROM orders');
    // eslint-disable-next-line no-console
    console.log(`Заказов в БД: ${ordLeft.rows[0].c}`);

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('Готово. Можно загружать реальные данные.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[cleanup]', err.message);
  process.exit(1);
});
