# Скрипты и объекты базы данных проекта «ЭкваЛайн»

Сводный перечень: команды npm, файлы сценариев SQL/Node, автоматические миграции при запуске `server.js`, а также эталонный **объединённый DDL PostgreSQL** (приложение в конце файла).

Подключение к СУБД задаётся в **`.env`**: переменная **`DATABASE_URL`** (полная строка `postgresql://...`) либо фрагменты `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE` (используется в утилите `postgres.js`; само приложение в `openDatabase()` требует именно **`DATABASE_URL`** в `db.js`).

**ERD в pgAdmin:** стрелки между таблицами появляются только при реальных **`FOREIGN KEY`** в базе. Если часть таблиц «висит» без связей, перезапустите **`npm start`**: в **`db.js`** вызывается **`ensureDeclarativeForeignKeysPublic`**, который добавляет недостающие ограничения для типовых таблиц ЭкваЛайн и некоторых доп. колонок (`address_id`, `delivery_zone_id`, `reviews`, `promocodes`). Затем обновите объектное дерево и окно ERD. Таблица **`express_session`** обычно намеренно **без FK** к `users`.

---

## 1. Команды npm, связанные с БД

| Команда | Назначение |
|---------|-------------|
| `npm start` | Запуск `server.js` → загрузка `db.js` → при первом обращении к БД выполняются **миграции** (`migrate`) и программное **наполнение** (сиды из кода при пустой БД и др.). |
| `npm run pg:setup` | Создание базы из `DATABASE_URL` (если нет) + выполнение файла **`scripts/init-postgres.sql`**. ⚠️ См. п. 4 — файл **устаревающий** относительно основной модели. |
| `npm run pg:seed-demo-orders` | Однократная подстановка демо-заказов для оператора: **`scripts/seed-demo-operator-orders.js`** вызывает `ensureDemoOperatorOrders` из **`db.js`**. |
| `npm run pg:seed-demo-orders:force` | То же с `--force`: **удаляет все строки из `orders`**, затем снова пытается залить демо. |
| `npm run verify` | Проверка синтаксиса и HTML; **`db.js` в списке проверяемых файлов** — саму БД не трогает. |

Обычный рабочий сценарий разработки: задать **`DATABASE_URL`**, один раз выполнить `npm start` (или `npm run pg:setup` только если нужен легаси-скрипт), дальше схему подтягивает **`db.js`**.

---

## 2. Файлы репозитория, связанные с базой

| Файл | Роль |
|------|------|
| **`db.js`** | Основной модуль PostgreSQL приложения: `migrate()`, добавление столбцов/`FK`, создание **`order_audit_events`**, связь **`orders.zone` → `delivery_zones.name`**, программный сид пустой БД, демо-клиент, демо-заказы, расширение каталога, адреса по умолчанию. Вызывается при старте через `openDatabase()`. |
| **`postgres.js`** | Вспомогательное подключение пула **`pg`** (для `server.js` при проверке «жива ли база»); строка коннекта из env. |
| **`server.js`** | HTTP API; выполняет SQL через обёртку `db.prepare()`. Для таблицы сессий используется **`connect-pg-simple`** — таблица **`express_session`** создаётся **библиотекой автоматически**, не из `migrate()`. |
| **`schemas.js`** | Валидация входящих данных (Joi); к SQL напрямую не относится. |
| **`scripts/setup-postgres.js`** | Создание БД при необходимости + выполнение **`scripts/init-postgres.sql`**. |
| **`scripts/init-postgres.sql`** | Устаревшая упрощённая схема `clients` + `orders`; **конфликтует по смыслу** с рабочей моделью `db.js` — см. §4. |
| **`scripts/seed-demo-operator-orders.js`** | CLI-сиды демо-заказов через экспорт **`ensureDemoOperatorOrders`** из `db.js`. |
| **`scripts/verify.mjs`** | Контроль качества фронта/бекенда без подключения к БД (кроме чтения `db.js` как файла проверки синтаксиса). |
| **`scripts/schema-vt-equipment-er.sql`** | Отдельная схема **`vt`**: ER учёта ВТ, заявок, мониторинга и нечёткой логики (не пересекается с `public`). Подробности — в комментариях внутри файла. |

Дополнительно: см. **`docs/DATABASE_ER_DIAGRAM.md`** — ER-связи и ограничения FK.

---

## 3. Порядок шагов в `migrate()` (`db.js`) при старте приложения

1. **`CREATE TABLE IF NOT EXISTS`** для: `users`, `categories`, `products`, `orders`, `subscriptions`, `delivery_zones`, `bonus_operations`, `feedback_messages`, `site_settings`, `audit_log`, `delivery_addresses`.
2. Для каждой из перечисленных таблиц — **`ensureIdentityDefault`**: синхронизация `SERIAL`/последовательности и `DEFAULT nextval(...)`, если БД восстановлена «вручную» без стандартного default.
3. **`ensureColumnDefault`**: принудительные `DEFAULT NOW()` там, где в старых БД колонки без default.
4. **`ensureOrdersCompatibility`**: недостающие столбцы в `orders` (включая поддержку перехода **`total` → `total_sum`** где применимо).
5. **`ensureOrderAuditEvents`**: таблица **`order_audit_events`** и индексы.
6. **`ensureUserDriverRouteLabel`**: столбец **`users.driver_route_label`**.
7. **`ensureOrdersZoneForeignKey`**: перенос уникальных `orders.zone` в справочник зон при необходимости, очистка, **`ALTER TABLE ... ADD CONSTRAINT orders_zone_fkey`**.
8. **`ensureDeliveryAddressesZoneForeignKey`**: колонка `zone_id` и FK адресов к справочнику зон.
9. **`ensureLegacyClientsOrdersFk`**: связь `orders.client_id → clients`, если есть легаси **`clients`**.
10. **`ensureDeclarativeForeignKeysPublic`**: недостающие **`FOREIGN KEY`** для таблиц без явных `REFERENCES` (важно для ER-диаграммы в pgAdmin).
11. **`ensurePublicRussianTableComments`**: комментарии к таблицам/колонкам для отображения в pgAdmin и отчётах.

После успешной инициализации соединения (в `_init`): **`seedIfEmpty`**, **`ensureDefaultDeliveryAddresses`**, **`ensureDeliveryAddressesBackfillZoneId`**, **`ensureExtendedCatalog`**, **`ensureDemoClientUser`**, **`ensureDemoOperatorOrders`** — логика в JavaScript с параметризованными `INSERT`, не выделена отдельными `.sql`-файлами.

---

## 4. Предупреждение про `scripts/init-postgres.sql`

Файл создаёт таблицы **`clients`** и старый вариант **`orders`** с `client_id`. **Основное приложение ЭкваЛайн использует модель пользователей/заказов из `db.js`** (`users`, `orders.user_id`, JSON позиций и т.д.).

Не смешивайте на одной логической БД два варианта схемы без миграции данных. Для документации и боевого развёртывания опирайтесь на **`db.js`** и раздел §5 этого файла.

---

## 5. Объединённый эталонный DDL PostgreSQL (schema `public`)

Ниже — **консолидация** того, что в итоге должно быть в базе после прогона `migrate()` новой установки. Применять вручную имеет смысл для отчётов или разовой инициализации без запуска Node; на практике достаточно **`npm start`** с корректным **`DATABASE_URL`**.

**Не дублирует** содержимое сидов (пользователей, товаров и т.д.) — только структуру и ключевые ограничения. Таблицу **`express_session`** см. документацию `connect-pg-simple`; она появится при первом сохранении сессии после старта сервера.

```sql
-- =============================================================================
-- ЭкваЛайн: объединённый DDL (ориентир на логику db.js → migrate и ensure*)
-- Схема: public | СУБД: PostgreSQL
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  patronymic TEXT NOT NULL DEFAULT '',
  bonus_balance INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'client',
  blocked INTEGER NOT NULL DEFAULT 0,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS driver_route_label TEXT;

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  volume_liters NUMERIC,
  photo_path TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tariff NUMERIC NOT NULL DEFAULT 0,
  bounds_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  delivery_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  bonuses_used INTEGER NOT NULL DEFAULT 0,
  bonuses_earned INTEGER NOT NULL DEFAULT 0,
  items_json TEXT NOT NULL,
  courier_note TEXT NOT NULL DEFAULT '',
  zone TEXT,
  driver TEXT,
  pickup INTEGER NOT NULL DEFAULT 0,
  total_sum NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  next_delivery_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  items_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_addresses (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  address_line TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_audit_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  actor_user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_events_created ON order_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_audit_events_order ON order_audit_events (order_id);

INSERT INTO delivery_zones (name, tariff, bounds_json)
SELECT DISTINCT trim(o.zone), 0, '{}'
FROM orders o
WHERE o.zone IS NOT NULL
  AND trim(o.zone) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE orders SET zone = NULL WHERE zone IS NOT NULL AND trim(zone) = '';
UPDATE orders SET zone = trim(zone) WHERE zone IS NOT NULL;
UPDATE orders o
SET zone = NULL
WHERE o.zone IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM delivery_zones dz WHERE dz.name = o.zone
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND c.contype = 'f'
      AND t.relname = 'orders'
      AND c.conname = 'orders_zone_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_zone_fkey
      FOREIGN KEY (zone)
      REFERENCES delivery_zones (name)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- Если в вашей базе сохранился легаси-столбец orders.total (из scripts/init-postgres.sql),
-- перенесите данные перед удалением столбца (как в ensureOrdersCompatibility):
-- UPDATE orders SET total_sum = COALESCE(total_sum, total, 0) WHERE total_sum IS NULL OR total_sum = 0;
```

### Пояснения к §5

- Блок **`orders_zone_fkey`** дублирует идею `ensureOrdersZoneForeignKey`: синхронизация зон, затем `FOREIGN KEY`.
- Если при ручном выполнении `ALTER TABLE ... ADD CONSTRAINT` возникнет ошибка **`23503`**, нужно дополнительно занулить или исправить «битые» значения **`orders.zone`** вне **`delivery_zones.name`** и повторить `ALTER`.

---

## 6. Короткая памятка «что считать источником истины»

| Задача | Где искать правду |
|--------|-------------------|
| Актуальная структура таблиц и миграции | **`db.js`**, функция `migrate` и связанные `ensure*` |
| Сиды после пустой установки | **`db.js`**: `seedIfEmpty`, `ensureDefaultDeliveryAddresses`, `ensureExtendedCatalog`, `ensureDemoClientUser`, `ensureDemoOperatorOrders` |
| Повторный сид демо-заказов с CLI | **`scripts/seed-demo-operator-orders.js`** |

При изменении миграций в коде желательно **обновить соответственно блок §5** этого файла, чтобы отчёт и ручное развёртывание оставались согласованными.
