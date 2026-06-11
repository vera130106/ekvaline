/**
 * Полная очистка операционных данных перед боевой работой.
 * Удаляет: заказы, клиентов, водителей, бонусы, уведомления, сессии, статистику.
 * Оставляет: admin / operator / manager, каталог, зоны, настройки сайта.
 *
 * Запуск: npm run pg:clean-production
 * Подтверждение: npm run pg:clean-production -- --yes
 */
require('dotenv').config();

const { Client } = require('pg');

const STAFF_ROLES = ['admin', 'operator', 'manager'];

/** Основные учётки сайта; всё остальное (test.staff.*, лишние operator/manager) удаляется. */
const KEEP_STAFF_EMAILS = ['admekva@mail.ru', 'menekva@mail.ru', 'opekva@mail.ru'];

async function tableExists(client, name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rowCount > 0;
}

async function deleteAll(client, table) {
  if (!(await tableExists(client, table))) return 0;
  const r = await client.query(`DELETE FROM ${table}`);
  return r.rowCount;
}

async function main() {
  const yes = process.argv.includes('--yes');
  if (!yes) {
    console.log(
      'Будут удалены:\n' +
        '  • все заказы и история изменений заказов\n' +
        '  • все клиенты, водители и прочие пользователи (кроме admin / operator / manager)\n' +
        '  • бонусы, уведомления, подписки, голоса в опросах, аудит, сессии входа\n' +
        '  • промокоды, привязанные к пользователям\n\n' +
        'Останутся: учётки админа/оператора/менеджера, каталог, зоны доставки, настройки сайта.\n\n' +
        'Для выполнения: npm run pg:clean-production -- --yes'
    );
    process.exit(0);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан в .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('BEGIN');

    const steps = [
      ['order_audit_events', () => deleteAll(client, 'order_audit_events')],
      ['client_notifications', () => deleteAll(client, 'client_notifications')],
      ['orders', () => deleteAll(client, 'orders')],
      ['bonus_operations', () => deleteAll(client, 'bonus_operations')],
      ['subscriptions', () => deleteAll(client, 'subscriptions')],
      ['client_saved_addresses', () => deleteAll(client, 'client_saved_addresses')],
      ['feedback_messages', () => deleteAll(client, 'feedback_messages')],
      ['poll_votes', () => deleteAll(client, 'poll_votes')],
      ['audit_log', () => deleteAll(client, 'audit_log')],
      ['express_session', () => deleteAll(client, 'express_session')],
      ['clients', () => deleteAll(client, 'clients')],
    ];

    for (const [label, fn] of steps) {
      const n = await fn();
      if (n > 0) console.log(`${label}: удалено ${n}`);
    }

    if (await tableExists(client, 'promocodes')) {
      const p = await client.query(
        `DELETE FROM promocodes
         WHERE user_id IS NOT NULL
            OR (created_by_user_id IS NOT NULL
                AND created_by_user_id NOT IN (SELECT id FROM users WHERE lower(role) = ANY($1::text[])))`,
        [STAFF_ROLES]
      ).catch(() => ({ rowCount: 0 }));
      if (p.rowCount > 0) console.log(`promocodes (клиентские): удалено ${p.rowCount}`);
    }

    const delClients = await client.query(
      `DELETE FROM users
       WHERE lower(COALESCE(role, '')) <> ALL($1::text[])
          OR role IS NULL`,
      [STAFF_ROLES]
    );
    console.log(`users (клиенты, водители, демо): удалено ${delClients.rowCount}`);

    const delExtraStaff = await client.query(
      `DELETE FROM users
       WHERE lower(COALESCE(role, '')) = ANY($1::text[])
         AND lower(email) <> ALL($2::text[])`,
      [STAFF_ROLES, KEEP_STAFF_EMAILS.map((e) => e.toLowerCase())]
    );
    if (delExtraStaff.rowCount > 0) {
      console.log(`users (тестовые staff из автопроверок): удалено ${delExtraStaff.rowCount}`);
    }

    const left = await client.query(
      `SELECT email, role FROM users ORDER BY role, email`
    );
    console.log('Остались учётки staff:');
    for (const row of left.rows) {
      console.log(`  • ${row.email} (${row.role})`);
    }

    const ordLeft = await client.query('SELECT COUNT(*)::int AS c FROM orders');
    const bonusLeft = await tableExists(client, 'bonus_operations')
      ? await client.query('SELECT COUNT(*)::int AS c FROM bonus_operations')
      : { rows: [{ c: 0 }] };
    console.log(`Заказов: ${ordLeft.rows[0].c}, бонусных операций: ${bonusLeft.rows[0].c}`);

    await client.query('COMMIT');
    console.log('\nГотово. БД чистая — можно создавать реальных клиентов и заказы.');
    console.log('Убедитесь, что SEED_DEMO_ORDERS не включён в .env (или =0).');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[cleanup]', err.message);
  process.exit(1);
});
