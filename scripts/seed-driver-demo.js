/**
 * Создаёт демо-водителя и заказы на сегодня с адресами.
 * Запуск: npm run pg:seed-driver
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const DRIVER_EMAIL = 'driverekva@mail.ru';
const DRIVER_PHONE = '70000000004';
const DRIVER_PASSWORD = 'DriverEkva2026!';
const DRIVER_FIRST = 'Иван';
const DRIVER_LAST = 'Петров';
const DRIVER_LABEL = 'Иван Петров';
const SEED_TAG = '§driver_demo';

const DEMO_ORDERS = [
  { address: 'Оренбург, ул. Чкалова, д. 15', status: 'on_way', slot: '09:00 – 14:00', zone: 'Центр' },
  { address: 'Оренбург, ул. Салмышская, д. 42', status: 'courier', slot: '14:00 – 17:00', zone: 'Степной' },
  { address: 'Оренбург, просп. Гагарина, д. 28', status: 'processing', slot: '17:00 – 21:00', zone: 'Центр' },
  { address: 'Оренбург, ул. Пушкинская, д. 10', status: 'confirmed', slot: '09:00 – 14:00', zone: 'Центр' },
  { address: 'Оренбург, мкр. Ростоши-1, д. 8', status: 'delivered', slot: '14:00 – 17:00', zone: 'Доп. зона' },
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function ensureDriver(pool) {
  const ex = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1) OR phone = $2 LIMIT 1', [
    DRIVER_EMAIL,
    DRIVER_PHONE,
  ]);
  const hash = bcrypt.hashSync(DRIVER_PASSWORD, 12);
  if (ex.rowCount > 0) {
    const id = ex.rows[0].id;
    await pool.query(
      `UPDATE users SET email = $1, phone = $2, password_hash = $3, first_name = $4, last_name = $5,
       role = 'driver', driver_route_label = $6, driver_on_duty = 1, blocked = 0
       WHERE id = $7`,
      [DRIVER_EMAIL, DRIVER_PHONE, hash, DRIVER_FIRST, DRIVER_LAST, DRIVER_LABEL, id]
    );
    return id;
  }
  const ins = await pool.query(
    `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at, driver_route_label, driver_on_duty)
     VALUES ($1,$2,$3,$4,$5,'driver', NOW()::text, $6, 1) RETURNING id`,
    [DRIVER_EMAIL, DRIVER_PHONE, hash, DRIVER_FIRST, DRIVER_LAST, DRIVER_LABEL]
  );
  return ins.rows[0].id;
}

async function pickClientId(pool) {
  const r = await pool.query(`SELECT id FROM users WHERE lower(role) = 'client' ORDER BY id ASC LIMIT 1`);
  if (r.rowCount) return r.rows[0].id;
  const hash = bcrypt.hashSync('ClientDemo2026!', 12);
  const ins = await pool.query(
    `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
     VALUES ('driver.demo.client@ekvaline.local','79009998877',$1,'Демо','Клиент','client', NOW()::text) RETURNING id`,
    [hash]
  );
  return ins.rows[0].id;
}

async function ensureDemoOrders(pool, clientId) {
  const day = todayIso();
  const existing = await pool.query(
    `SELECT COUNT(*)::int AS n FROM orders
     WHERE position($1 IN coalesce(courier_note, '')) > 0 AND driver = $2`,
    [SEED_TAG, DRIVER_LABEL]
  );
  if (existing.rows[0].n >= DEMO_ORDERS.length) {
    console.log(`Демо-заказы водителя уже есть (${existing.rows[0].n}).`);
    return;
  }

  const prod = await pool.query(
    `SELECT id, name, price FROM products WHERE COALESCE(hidden, 0) = 0 ORDER BY id ASC LIMIT 1`
  );
  if (!prod.rowCount) {
    console.warn('Нет товаров — заказы не созданы.');
    return;
  }
  const title = String(prod.rows[0].name || 'Вода 19 л');
  const unit = Number(prod.rows[0].price) || 220;

  await pool.query(`DELETE FROM orders WHERE position($1 IN coalesce(courier_note, '')) > 0 AND driver = $2`, [
    SEED_TAG,
    DRIVER_LABEL,
  ]);

  for (let i = 0; i < DEMO_ORDERS.length; i += 1) {
    const row = DEMO_ORDERS[i];
    const qty = 2;
    const totalSum = Math.round(unit * qty);
    const itemsJson = JSON.stringify([{ title, qty, unit_price: unit }]);
    const note = `Демо для водителя ${SEED_TAG}`;
    await pool.query(
      `INSERT INTO orders (user_id, address, delivery_date, delivery_slot, status, payment_method,
        bonuses_used, bonuses_earned, items_json, courier_note, zone, driver, pickup, total_sum)
       VALUES ($1,$2,$3,$4,$5,'cash',0,0,$6,$7,$8,$9,0,$10)`,
      [clientId, row.address, day, row.slot, row.status, itemsJson, note, row.zone, DRIVER_LABEL, totalSum]
    );
  }
  console.log(`Создано ${DEMO_ORDERS.length} заказов на ${day} для «${DRIVER_LABEL}».`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Задайте DATABASE_URL в .env');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_on_duty INTEGER NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_route_label TEXT`);
    const driverId = await ensureDriver(pool);
    const clientId = await pickClientId(pool);
    await ensureDemoOrders(pool, clientId);
    console.log('');
    console.log('=== Учётная запись водителя ===');
    console.log(`Email:    ${DRIVER_EMAIL}`);
    console.log(`Телефон:  +7 ${DRIVER_PHONE.slice(1)}`);
    console.log(`Пароль:   ${DRIVER_PASSWORD}`);
    console.log(`Экспедитор в заказах: ${DRIVER_LABEL}`);
    console.log(`Панель:   driver.html (после npm start)`);
    console.log(`ID в БД:  ${driverId}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
