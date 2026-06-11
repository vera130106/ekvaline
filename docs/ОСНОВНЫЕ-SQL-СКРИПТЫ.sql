SELECT id, email, phone, first_name, last_name, role, blocked, created_at
FROM users
WHERE role IN ('admin', 'manager', 'operator', 'driver')
ORDER BY role, id;

SELECT id, email, phone, first_name, last_name, bonus_balance, email_verified, created_at
FROM users
WHERE role = 'client'
ORDER BY created_at DESC
LIMIT 50;

SELECT *
FROM users
WHERE lower(email) = lower('example@mail.ru')
   OR phone = '79001234567';

UPDATE users
SET login_attempts = 0,
    locked_until = NULL
WHERE lower(email) = lower('example@mail.ru');

SELECT p.id,
       c.name AS category,
       p.name,
       p.price,
       p.stock,
       p.volume_liters,
       p.preorder,
       p.hidden
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.hidden = 0
ORDER BY c.id, p.sort_order, p.id;

SELECT id, name, stock, price
FROM products
WHERE hidden = 0 AND stock < 10
ORDER BY stock ASC;

UPDATE products
SET price = 220,
    stock = 100
WHERE id = 1;

UPDATE products
SET hidden = 1
WHERE id = 5;

SELECT o.id,
       o.status,
       o.delivery_date,
       o.delivery_slot,
       o.total_sum,
       o.payment_method,
       o.bonuses_used,
       o.bonuses_earned,
       o.address,
       o.zone,
       o.driver,
       o.created_at,
       u.first_name,
       u.last_name,
       u.phone,
       u.email,
       o.items_json
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.id DESC
LIMIT 100;

SELECT o.id, o.status, o.delivery_date, o.delivery_slot, o.total_sum, u.phone, o.address
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.delivery_date = '2026-05-22'
  AND o.status NOT IN ('delivered', 'cancelled')
ORDER BY o.delivery_slot, o.id;

SELECT id, status, delivery_date, total_sum, driver, zone
FROM orders
WHERE status NOT IN ('delivered', 'cancelled')
ORDER BY delivery_date, id;

SELECT status,
       COUNT(*) AS cnt,
       COALESCE(SUM(total_sum), 0)::numeric(12, 2) AS sum_rub
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY cnt DESC;

SELECT id, total_sum, left(items_json, 120) AS items_preview
FROM orders
WHERE items_json LIKE '%"lines"%'
ORDER BY id;

UPDATE orders
SET driver = 'Иванов',
    zone = 'Центр',
    updated_at = NOW()
WHERE id = 123;

UPDATE orders
SET status = 'confirmed',
    updated_at = NOW()
WHERE id = 123;

UPDATE orders
SET status = 'cancelled',
    updated_at = NOW()
WHERE id = 123;

SELECT e.id, e.action, e.reason, e.detail, e.created_at,
       u.email AS actor_email
FROM order_audit_events e
LEFT JOIN users u ON u.id = e.actor_user_id
WHERE e.order_id = 123
ORDER BY e.created_at DESC;

SELECT id, type, amount, remaining, expires_at, order_id, description, created_at
FROM bonus_operations
WHERE user_id = 42
  AND type = 'accrual'
  AND remaining > 0
  AND expires_at > NOW()
ORDER BY expires_at ASC;

SELECT u.id,
       u.email,
       u.bonus_balance AS balance_in_profile,
       COALESCE((
         SELECT SUM(b.remaining)::int
         FROM bonus_operations b
         WHERE b.user_id = u.id
           AND b.type = 'accrual'
           AND b.remaining > 0
           AND b.expires_at > NOW()
       ), 0) AS balance_from_lots
FROM users u
WHERE u.role = 'client'
  AND u.bonus_balance <> COALESCE((
    SELECT SUM(b.remaining)::int FROM bonus_operations b
    WHERE b.user_id = u.id AND b.type = 'accrual' AND b.remaining > 0 AND b.expires_at > NOW()
  ), 0)
LIMIT 50;

INSERT INTO bonus_operations (user_id, type, amount, remaining, expires_at, description)
VALUES (
  42,
  'accrual',
  100,
  100,
  NOW() + INTERVAL '365 days',
  'Ручное начисление: компенсация'
);

UPDATE users
SET bonus_balance = bonus_balance + 100
WHERE id = 42;

SELECT key, left(value, 200) AS value_preview
FROM site_settings
ORDER BY key;

SELECT value
FROM site_settings
WHERE key = 'workLine';

INSERT INTO site_settings (key, value)
VALUES ('workLine', 'Доставка воды по Оренбургу')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT id, name, phone, left(message, 200) AS message, created_at
FROM feedback_messages
ORDER BY created_at DESC
LIMIT 30;

SELECT id, user_id, action, detail, ip, created_at
FROM audit_log
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 50;

SELECT COUNT(*) AS sessions
FROM express_session;

SELECT delivery_date::date AS day,
       COUNT(*) AS orders_cnt,
       SUM(total_sum)::numeric(12, 2) AS revenue
FROM orders
WHERE status = 'delivered'
  AND delivery_date ~ '^\d{4}-\d{2}-\d{2}'
GROUP BY delivery_date::date
ORDER BY day DESC
LIMIT 31;

SELECT u.id,
       u.first_name || ' ' || u.last_name AS name,
       u.phone,
       COUNT(o.id) AS orders_cnt,
       SUM(o.total_sum)::numeric(12, 2) AS total_spent
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'delivered'
GROUP BY u.id, u.first_name, u.last_name, u.phone
ORDER BY total_spent DESC
LIMIT 20;

SELECT c.relname AS table_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC;

CREATE INDEX IF NOT EXISTS idx_orders_status_delivery ON orders (status, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_bonus_ops_user_expires ON bonus_operations (user_id, expires_at)
  WHERE type = 'accrual' AND remaining > 0;
