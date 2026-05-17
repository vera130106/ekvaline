-- =============================================================================
-- Учебная ER-модель магазина (клиенты, заказы, позиции, статусы, адреса, зоны и т.д.)
-- Схема: demo_shop — не пересекается с таблицами ЭкваЛайн (public.*)
--
-- Комментарии на русском: COMMENT ON TABLE / COLUMN — видны в pgAdmin / DBeaver.
-- Запуск: psql "$DATABASE_URL" -f scripts/schema-demo-shop-er-ru.sql
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS demo_shop;

COMMENT ON SCHEMA demo_shop IS 'Демонстрационная торговая схема: пользователи, клиенты, заказы, товары';

-- ─── Пользователи (личный кабинет / авторизация) ───
CREATE TABLE IF NOT EXISTS demo_shop.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password TEXT NOT NULL,
  remember_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.users IS 'Пользователи (учётная запись)';
COMMENT ON COLUMN demo_shop.users.name IS 'Имя / отображаемое имя';
COMMENT ON COLUMN demo_shop.users.email_verified_at IS 'Дата подтверждения email';

-- ─── Клиенты (может быть отдельная сущность от users) ───
CREATE TABLE IF NOT EXISTS demo_shop.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  remember_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.clients IS 'Клиенты';

-- Связка «учётная запись пользователя ↔ клиент магазина» (необязательная)
ALTER TABLE demo_shop.clients
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES demo_shop.users (id) ON DELETE SET NULL;
COMMENT ON COLUMN demo_shop.clients.user_id IS 'Идентификатор связанной учётной записи пользователя';

-- ─── Категории (иерархия) ───
CREATE TABLE IF NOT EXISTS demo_shop.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES demo_shop.categories (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.categories IS 'Категории товаров';

-- ─── Товары ───
CREATE TABLE IF NOT EXISTS demo_shop.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  old_price NUMERIC,
  category_id INTEGER REFERENCES demo_shop.categories (id) ON DELETE RESTRICT,
  image TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  is_popular SMALLINT NOT NULL DEFAULT 0,
  is_new SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.products IS 'Товары';
COMMENT ON COLUMN demo_shop.products.old_price IS 'Старая цена';

-- ─── Экспресс-курьеры ───
CREATE TABLE IF NOT EXISTS demo_shop.express_couriers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.express_couriers IS 'Экспресс-курьеры';

-- ─── Зоны доставки ───
CREATE TABLE IF NOT EXISTS demo_shop.delivery_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  polygon TEXT NOT NULL DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.delivery_zones IS 'Зоны доставки';
COMMENT ON COLUMN demo_shop.delivery_zones.polygon IS 'Область (GeoJSON или координаты)';

-- ─── Адреса доставки пользователя ───
CREATE TABLE IF NOT EXISTS demo_shop.delivery_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES demo_shop.users (id) ON DELETE CASCADE,
  city TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  house TEXT NOT NULL DEFAULT '',
  apartment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.delivery_addresses IS 'Адреса доставки';

-- ─── Заказы ───
CREATE TABLE IF NOT EXISTS demo_shop.orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES demo_shop.clients (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  total_price NUMERIC NOT NULL DEFAULT 0,
  delivery_address_id INTEGER REFERENCES demo_shop.delivery_addresses (id) ON DELETE SET NULL,
  delivery_type TEXT NOT NULL DEFAULT '',
  payment_type TEXT NOT NULL DEFAULT '',
  comment TEXT DEFAULT '',
  express_courier_id INTEGER REFERENCES demo_shop.express_couriers (id) ON DELETE SET NULL,
  delivery_zone_id INTEGER REFERENCES demo_shop.delivery_zones (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.orders IS 'Заказы';
COMMENT ON COLUMN demo_shop.orders.total_price IS 'Итого по заказу';
COMMENT ON COLUMN demo_shop.orders.delivery_type IS 'Тип доставки';
COMMENT ON COLUMN demo_shop.orders.payment_type IS 'Тип оплаты';

CREATE INDEX IF NOT EXISTS idx_orders_client ON demo_shop.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_addr ON demo_shop.orders (delivery_address_id);

-- ─── Позиции заказа ───
CREATE TABLE IF NOT EXISTS demo_shop.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES demo_shop.orders (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES demo_shop.products (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.order_items IS 'Позиции заказа';
COMMENT ON COLUMN demo_shop.order_items.price IS 'Цена за единицу';

CREATE INDEX IF NOT EXISTS idx_order_items_order ON demo_shop.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON demo_shop.order_items (product_id);

-- ─── История смен статуса заказа ───
CREATE TABLE IF NOT EXISTS demo_shop.order_status_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES demo_shop.orders (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.order_status_events IS 'События смены статуса заказа';

CREATE INDEX IF NOT EXISTS idx_order_status_events_order ON demo_shop.order_status_events (order_id);

-- ─── Бонусные операции ───
CREATE TABLE IF NOT EXISTS demo_shop.bonus_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES demo_shop.users (id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.bonus_operations IS 'Бонусные операции';

-- ─── Аудит ───
CREATE TABLE IF NOT EXISTS demo_shop.audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES demo_shop.users (id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  model_id INTEGER,
  changes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.audit IS 'Журнал аудита действий';

-- ─── Обратная связь ───
CREATE TABLE IF NOT EXISTS demo_shop.feedback_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES demo_shop.users (id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.feedback_messages IS 'Обращения клиентов / обратная связь';

-- ─── Настройки сайта ───
CREATE TABLE IF NOT EXISTS demo_shop.site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE demo_shop.site_settings IS 'Настройки сайта (ключ–значение)';
