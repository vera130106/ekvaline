-- =============================================================================
-- Учебная ER-модель по классической схеме магазина (как на логической диаграмме):
-- Пользователь, обратная связь, бонусы, аудит, заказы, зоны и пункты доставки,
-- категории и товары; связь «товары — заказы» через позиции заказа.
--
-- Схема: er_diagram_shop — не трогает public (ЭкваЛайн) и demo_shop.
--
-- Русские названия полей на диаграмме отражены через COMMENT ON TABLE / COLUMN
-- (удобно для ERD и обзора в pgAdmin / DBeaver).
--
-- Запуск:
--   psql "%DATABASE_URL%" -f scripts/schema-er-diagram-simple-ru.sql
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS er_diagram_shop;

COMMENT ON SCHEMA er_diagram_shop IS 'Упрощённая учебная модель: пользователь, заказы, зоны, товары (как на ER в задании)';

-- ─── Пользователь ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.users (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'client',
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE er_diagram_shop.users IS 'Пользователь';
COMMENT ON COLUMN er_diagram_shop.users.id IS 'id_пользователя (PK)';
COMMENT ON COLUMN er_diagram_shop.users.role IS 'роль';
COMMENT ON COLUMN er_diagram_shop.users.email IS 'email';
COMMENT ON COLUMN er_diagram_shop.users.phone IS 'телефон';
COMMENT ON COLUMN er_diagram_shop.users.password_hash IS 'хэш_пароля';

-- ─── Обратная связь ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.feedback_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES er_diagram_shop.users (id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE er_diagram_shop.feedback_messages IS 'Обратная связь';
COMMENT ON COLUMN er_diagram_shop.feedback_messages.id IS 'id_сообщения (PK)';
COMMENT ON COLUMN er_diagram_shop.feedback_messages.user_id IS 'id_пользователя (FK)';
COMMENT ON COLUMN er_diagram_shop.feedback_messages.message IS 'текст_сообщения';
COMMENT ON COLUMN er_diagram_shop.feedback_messages.sent_at IS 'дата_отправки';

-- ─── Бонусные операции ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.bonus_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES er_diagram_shop.users (id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  operation_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE er_diagram_shop.bonus_operations IS 'Бонусные операции';
COMMENT ON COLUMN er_diagram_shop.bonus_operations.id IS 'id_операции (PK)';
COMMENT ON COLUMN er_diagram_shop.bonus_operations.user_id IS 'id_пользователя (FK)';
COMMENT ON COLUMN er_diagram_shop.bonus_operations.operation_type IS 'тип_операции';
COMMENT ON COLUMN er_diagram_shop.bonus_operations.amount IS 'сумма';
COMMENT ON COLUMN er_diagram_shop.bonus_operations.operation_date IS 'дата';

-- ─── Журнал аудита ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES er_diagram_shop.users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE er_diagram_shop.audit_log IS 'Журнал аудита';
COMMENT ON COLUMN er_diagram_shop.audit_log.id IS 'id_записи (PK)';
COMMENT ON COLUMN er_diagram_shop.audit_log.user_id IS 'id_пользователя (FK)';
COMMENT ON COLUMN er_diagram_shop.audit_log.action IS 'действие';
COMMENT ON COLUMN er_diagram_shop.audit_log.ip_address IS 'ip_адрес';
COMMENT ON COLUMN er_diagram_shop.audit_log.logged_at IS 'время';

-- ─── Зона доставки ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.delivery_zones (
  id SERIAL PRIMARY KEY,
  zone_name TEXT NOT NULL,
  tariff NUMERIC NOT NULL DEFAULT 0
);

COMMENT ON TABLE er_diagram_shop.delivery_zones IS 'Зона доставки';
COMMENT ON COLUMN er_diagram_shop.delivery_zones.id IS 'id_зоны (PK)';
COMMENT ON COLUMN er_diagram_shop.delivery_zones.zone_name IS 'название_зоны';
COMMENT ON COLUMN er_diagram_shop.delivery_zones.tariff IS 'тариф';

-- ─── Пункты доставки ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.delivery_points (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES er_diagram_shop.delivery_zones (id) ON DELETE CASCADE,
  point_name TEXT NOT NULL DEFAULT '',
  full_address TEXT NOT NULL DEFAULT ''
);

COMMENT ON TABLE er_diagram_shop.delivery_points IS 'Пункты доставки';
COMMENT ON COLUMN er_diagram_shop.delivery_points.id IS 'id_пункта (PK)';
COMMENT ON COLUMN er_diagram_shop.delivery_points.zone_id IS 'id_зоны (FK)';
COMMENT ON COLUMN er_diagram_shop.delivery_points.point_name IS 'название_пункта';
COMMENT ON COLUMN er_diagram_shop.delivery_points.full_address IS 'полный_адрес';

-- ─── Категории ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

COMMENT ON TABLE er_diagram_shop.categories IS 'Категории';
COMMENT ON COLUMN er_diagram_shop.categories.id IS 'id_категории (PK)';
COMMENT ON COLUMN er_diagram_shop.categories.name IS 'название';
COMMENT ON COLUMN er_diagram_shop.categories.description IS 'описание';

-- ─── Товары ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES er_diagram_shop.categories (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock_balance INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE er_diagram_shop.products IS 'Товары';
COMMENT ON COLUMN er_diagram_shop.products.id IS 'id_товара (PK)';
COMMENT ON COLUMN er_diagram_shop.products.category_id IS 'id_категории (FK)';
COMMENT ON COLUMN er_diagram_shop.products.name IS 'название';
COMMENT ON COLUMN er_diagram_shop.products.price IS 'цена';
COMMENT ON COLUMN er_diagram_shop.products.stock_balance IS 'остаток_на_складе';

-- ─── Заказы ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES er_diagram_shop.users (id) ON DELETE RESTRICT,
  delivery_zone_id INTEGER NOT NULL REFERENCES er_diagram_shop.delivery_zones (id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'new',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  creation_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE er_diagram_shop.orders IS 'Заказы';
COMMENT ON COLUMN er_diagram_shop.orders.id IS 'id_заказа (PK)';
COMMENT ON COLUMN er_diagram_shop.orders.user_id IS 'id_клиента → пользователь (FK)';
COMMENT ON COLUMN er_diagram_shop.orders.delivery_zone_id IS 'id_зоны (FK)';
COMMENT ON COLUMN er_diagram_shop.orders.status IS 'статус';
COMMENT ON COLUMN er_diagram_shop.orders.total_amount IS 'итоговая_сумма';
COMMENT ON COLUMN er_diagram_shop.orders.creation_date IS 'дата_создания';

-- ─── Позиции заказа (связь «товары — заказы» многие-ко-многим) ───
CREATE TABLE IF NOT EXISTS er_diagram_shop.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES er_diagram_shop.orders (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES er_diagram_shop.products (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL DEFAULT 0
);

COMMENT ON TABLE er_diagram_shop.order_items IS 'Позиции заказа (реализация связи товары↔заказы)';
COMMENT ON COLUMN er_diagram_shop.order_items.order_id IS 'id_заказа (FK)';
COMMENT ON COLUMN er_diagram_shop.order_items.product_id IS 'id_товара (FK)';

CREATE INDEX IF NOT EXISTS idx_er_shop_feedback_user ON er_diagram_shop.feedback_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_bonus_user ON er_diagram_shop.bonus_operations (user_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_audit_user ON er_diagram_shop.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_points_zone ON er_diagram_shop.delivery_points (zone_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_products_cat ON er_diagram_shop.products (category_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_orders_user ON er_diagram_shop.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_orders_zone ON er_diagram_shop.orders (delivery_zone_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_items_order ON er_diagram_shop.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_er_shop_items_product ON er_diagram_shop.order_items (product_id);
