# Роли и пользователи БД (PostgreSQL)

В проекте ЭкваЛайн используется **PostgreSQL** (`DATABASE_URL` в `.env`). Ниже — аналог учебного фрагмента для MySQL, приведённый к синтаксису **PostgreSQL**.

**Перед выполнением:** подставьте имя базы вместо `ekvaline` (как в вашей строке подключения) и задайте надёжные пароли вместо `'password'`.

Подключение к кластеру от суперпользователя (часто `postgres`):

```bash
psql -U postgres -h localhost
```

---

## а. Роль АБД и пользователь-администратор

Смысл: полный доступ к базе приложения (как «владелец» схемы с данными).

```sql
-- Имя БД — замените на своё (из DATABASE_URL)
-- \c ekvaline

CREATE ROLE admin_db;
CREATE USER admin_ekvaline WITH PASSWORD 'password';
GRANT admin_db TO admin_ekvaline;
GRANT ALL PRIVILEGES ON DATABASE ekvaline TO admin_ekvaline;
GRANT ALL ON SCHEMA public TO admin_ekvaline;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_ekvaline;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_ekvaline;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO admin_ekvaline;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO admin_ekvaline;
```

> **Примечание:** в исходном примере MySQL в конце было `GRANT ... TO admin` — логично выдавать права созданному пользователю (`admin_ekvaline`), а не абстрактной роли, если роль `admin_db` не является `LOGIN`-ролью. При необходимости объедините логику: либо одна роль `LOGIN` с паролем, либо членство в групповых ролях по [документации PostgreSQL](https://www.postgresql.org/docs/current/sql-grant.html).

---

## б. Роль «ПП» (программист) и пользователь

Смысл: чтение и изменение данных без полного администрирования кластера.

```sql
CREATE ROLE programmer;

CREATE USER develop WITH PASSWORD 'password';

GRANT programmer TO develop;

GRANT CONNECT ON DATABASE ekvaline TO develop;

\c ekvaline

GRANT USAGE ON SCHEMA public TO develop;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO programmer;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO programmer;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO programmer;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO programmer;
```

> Для `INSERT` в таблицы с `SERIAL`/`GENERATED` нужны права на **последовательности** — поэтому добавлен `SEQUENCES`.

---

## в. Роль «оператора» и пользователь

```sql
CREATE ROLE operator;
CREATE USER tech_spec WITH PASSWORD 'password';
GRANT operator TO tech_spec;
GRANT CONNECT ON DATABASE ekvaline TO tech_spec;
GRANT USAGE ON SCHEMA public TO tech_spec;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO operator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO operator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO operator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO operator;
```

---

## г. Роль «руководителя» и пользователь (только чтение)

```sql
CREATE ROLE director;

CREATE USER main_spec WITH PASSWORD 'password';

GRANT director TO main_spec;

GRANT CONNECT ON DATABASE ekvaline TO main_spec;

\c ekvaline

GRANT USAGE ON SCHEMA public TO main_spec;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO director;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO director;
```

---

## д. Роль «Менеджер» и пользователь менеджера

Смысл: служебный доступ уровня веб-приложения для роли **`manager`** (настройки сайта, блок «Сообщество», редакторский контент в API). По ширине прав удобно сопоставить с разделами **б**/**в** — чтение и изменение строк в таблицах схемы `public`.

```sql
CREATE ROLE manager_site;
CREATE USER manager_content WITH PASSWORD 'password';
GRANT manager_site TO manager_content;
GRANT CONNECT ON DATABASE ekvaline TO manager_content;
GRANT USAGE ON SCHEMA public TO manager_content;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO manager_site;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO manager_site;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO manager_site;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO manager_site;
```

---

## е. Роль «Водитель» и пользователь водителя

Смысл: ближе к фактической логике панели водителя (**только заказы своей машины и отметка доставлено** выполняются в приложении). На уровне СУБД задаётся **узкий** вариант: чтение по схеме и возможность править строки заказов (поле статуса и связанное).

```sql
CREATE ROLE driver_delivery;
CREATE USER driver_route WITH PASSWORD 'password';
GRANT driver_delivery TO driver_route;
GRANT CONNECT ON DATABASE ekvaline TO driver_route;
GRANT USAGE ON SCHEMA public TO driver_route;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO driver_delivery;
GRANT UPDATE ON TABLE orders TO driver_delivery;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO driver_delivery;
```

> **Примечание:** на новые таблицы водитель автоматически получит только `SELECT`; право `UPDATE` при появлении новых таблиц с телеметрией доставки нужно будет выдавать отдельно. Разграничение «свои / чужие заказы» в проекте делается в **`server.js`**, не политиками PostgreSQL.

---

## ж. Роль «Клиент» и пользователь клиента

Смысл: конечный покупатель (роль **`client`** в приложении): просмотр каталога, оформление заказа, правки профиля, обращения и т.д. В учебном скрипте ниже используется **типовой компромисс** — `SELECT, INSERT, UPDATE` по всем таблицам схемы `public`; в промышленной развёртке чаще оставляют **одну учётную запись приложения** в БД, а ограничения задают кодом или **ряд доступа по строкам (RLS)** в PostgreSQL.

```sql
CREATE ROLE client_shop;
CREATE USER shopper_demo WITH PASSWORD 'password';
GRANT client_shop TO shopper_demo;
GRANT CONNECT ON DATABASE ekvaline TO shopper_demo;
GRANT USAGE ON SCHEMA public TO shopper_demo;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO client_shop;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO client_shop;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO client_shop;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO client_shop;
```

Перед блоком подключитесь к целевой базе после выдачи `CONNECT`, чтобы выдать права на объекты в `public`:

```sql
\c ekvaline
```

Затем повторите или выполните `GRANT`/`ALTER DEFAULT PRIVILEGES`, если их запускали только из другой базы по умолчанию.

> Узкая модель («только каталог и вставка в `orders`») возможна через перечень таблиц в `GRANT` и при необходимости политики `ROW LEVEL SECURITY` на `orders`/`users` — по согласованию с аудитом безопасности.

---

## Приложение А. Создание структуры базы данных

Физическое создание таблиц и миграции для приложения ЭкваЛайн выполняются кодом при старте приложения (см. файл **`db.js`**: функция `migrate`, создание таблиц `users`, `orders`, `products` и т.д.).

Справочное **техническое описание полей** таблиц — в файле **`docs/DATABASE_TABLES_TECHNICAL.md`**.

После первого запуска приложения с корректным `DATABASE_URL` схема будет создана автоматически; скрипты ролей выше задают **права доступа** к уже существующим объектам. Для новых таблиц, появляющихся позже, используются директивы **`ALTER DEFAULT PRIVILEGES`** в соответствующих разделах.
