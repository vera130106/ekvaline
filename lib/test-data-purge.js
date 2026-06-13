/**
 * Удаление тестовых заказов, клиентов, адресов и артефактов автопроверок.
 * Используется при старте сервера (db.js) и в npm run pg:clean-test-data.
 */

const STAFF_ROLES = ['admin', 'operator', 'manager'];

const DEMO_ADDRESS_PRESETS = Object.freeze([
  ['Центр — ул. Чкалова', 'Оренбург, ул. Чкалова, д. 15'],
  ['Степной — Салмышская', 'Оренбург, ул. Салмышская, д. 42'],
  ['Окраина — Ростоши', 'Оренбург, мкр. Ростоши-1, д. 8'],
  ['Доп. зона — Подгород', 'Оренбург, пос. Подгородный, ул. Южная, д. 3'],
]);

/** SQL-фрагмент: users.id тестового клиента/водителя (не staff). */
const TEST_USER_ID_SUBQUERY = `
  SELECT id FROM users
  WHERE lower(COALESCE(role, '')) <> ALL($1::text[])
    AND (
      lower(email) LIKE 'verify.%'
      OR lower(email) LIKE 'demo.%@ekvaline.local'
      OR lower(email) LIKE 'demo.client%@ekvaline.local'
      OR lower(email) LIKE 'demo.org%@ekvaline.local'
      OR lower(email) LIKE 'driver.demo.%'
      OR lower(email) LIKE 'test.staff.%'
      OR (
        lower(trim(first_name)) = 'тест'
        AND lower(trim(last_name)) IN ('клиент', 'оператор')
      )
      OR (
        lower(trim(first_name)) = 'демо'
        AND lower(trim(last_name)) IN ('клиент', 'оператор')
      )
    )
`;

/** SQL-фрагмент: условие для DELETE FROM orders. Параметр $1 — STAFF_ROLES. */
const TEST_ORDER_WHERE = `
  address ILIKE '%ул. тестовая%'
  OR address ILIKE '%тестов%'
  OR COALESCE(courier_note, '') ILIKE '%verify-op%'
  OR COALESCE(courier_note, '') ILIKE '%verify-operator%'
  OR COALESCE(courier_note, '') ILIKE '%§demo_%'
  OR COALESCE(courier_note, '') ILIKE '%§ekva_seed%'
  OR COALESCE(courier_note, '') ILIKE '%§driver_demo%'
  OR user_id IN (${TEST_USER_ID_SUBQUERY})
`;

async function tableExists(pool, name) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rowCount > 0;
}

async function purgeTestAddresses(pool, log) {
  if (!(await tableExists(pool, 'delivery_addresses'))) return 0;

  let total = 0;
  for (const [label, line] of DEMO_ADDRESS_PRESETS) {
    const r = await pool.query('DELETE FROM delivery_addresses WHERE label = $1 AND address_line = $2', [
      label,
      line,
    ]);
    if (r.rowCount > 0) {
      log?.(`delivery_addresses: − ${label}`);
      total += r.rowCount;
    }
  }

  const extra = await pool.query(
    `DELETE FROM delivery_addresses
     WHERE label ILIKE '%тест%'
        OR address_line ILIKE '%тестов%'
        OR address_line ILIKE '%ул. тестовая%'
        OR address_line ILIKE '%test.%'
        OR COALESCE(notes, '') ILIKE '%demo%'`
  );
  if (extra.rowCount > 0) {
    log?.(`delivery_addresses (тест/demo): удалено ${extra.rowCount}`);
    total += extra.rowCount;
  }

  if (await tableExists(pool, 'client_saved_addresses')) {
    const saved = await pool.query(
      `DELETE FROM client_saved_addresses
       WHERE label ILIKE '%тест%'
          OR address_line ILIKE '%тестов%'
          OR address_line ILIKE '%ул. тестовая%'
          OR address_line ILIKE '%test.%'
          OR user_id IN (${TEST_USER_ID_SUBQUERY})`,
      [STAFF_ROLES]
    );
    if (saved.rowCount > 0) {
      log?.(`client_saved_addresses: удалено ${saved.rowCount}`);
      total += saved.rowCount;
    }
  }

  return total;
}

async function purgeTestOperationalData(pool, { log } = {}) {
  const stats = {
    orders: 0,
    bonus: 0,
    notifications: 0,
    subscriptions: 0,
    users: 0,
    staff: 0,
    addresses: 0,
  };

  if (await tableExists(pool, 'orders')) {
    const orders = await pool.query(`DELETE FROM orders WHERE ${TEST_ORDER_WHERE}`, [STAFF_ROLES]);
    stats.orders = orders.rowCount;
    if (orders.rowCount > 0) log?.(`orders (тест/demo): удалено ${orders.rowCount}`);
  }

  if (await tableExists(pool, 'bonus_operations')) {
    const bonus = await pool
      .query(`DELETE FROM bonus_operations WHERE user_id IN (${TEST_USER_ID_SUBQUERY})`, [STAFF_ROLES])
      .catch(() => ({ rowCount: 0 }));
    stats.bonus = bonus.rowCount;
    if (bonus.rowCount > 0) log?.(`bonus_operations: удалено ${bonus.rowCount}`);
  }

  if (await tableExists(pool, 'client_notifications')) {
    const n = await pool
      .query(`DELETE FROM client_notifications WHERE user_id IN (${TEST_USER_ID_SUBQUERY})`, [STAFF_ROLES])
      .catch(() => ({ rowCount: 0 }));
    stats.notifications = n.rowCount;
    if (n.rowCount > 0) log?.(`client_notifications: удалено ${n.rowCount}`);
  }

  if (await tableExists(pool, 'subscriptions')) {
    const s = await pool
      .query(`DELETE FROM subscriptions WHERE user_id IN (${TEST_USER_ID_SUBQUERY})`, [STAFF_ROLES])
      .catch(() => ({ rowCount: 0 }));
    stats.subscriptions = s.rowCount;
    if (s.rowCount > 0) log?.(`subscriptions: удалено ${s.rowCount}`);
  }

  const users = await pool.query(`DELETE FROM users WHERE id IN (${TEST_USER_ID_SUBQUERY})`, [STAFF_ROLES]);
  stats.users = users.rowCount;
  if (users.rowCount > 0) log?.(`users (тест/demo клиенты): удалено ${users.rowCount}`);

  const staff = await pool.query(
    `DELETE FROM users
     WHERE lower(COALESCE(role, '')) = ANY($1::text[])
       AND lower(email) LIKE 'test.staff.%'`,
    [STAFF_ROLES]
  );
  stats.staff = staff.rowCount;
  if (staff.rowCount > 0) log?.(`users (test.staff.*): удалено ${staff.rowCount}`);

  stats.addresses = await purgeTestAddresses(pool, log);

  if (await tableExists(pool, 'site_settings')) {
    await pool
      .query(
        `INSERT INTO site_settings (key, value) VALUES ('demo_test_addresses_purged_v1', '1')
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
      )
      .catch(() => {});
    await pool
      .query(
        `INSERT INTO site_settings (key, value) VALUES ('test_operational_data_purged_v1', '1')
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
      )
      .catch(() => {});
  }

  return stats;
}

module.exports = {
  STAFF_ROLES,
  DEMO_ADDRESS_PRESETS,
  TEST_USER_ID_SUBQUERY,
  TEST_ORDER_WHERE,
  purgeTestOperationalData,
  purgeTestAddresses,
};
