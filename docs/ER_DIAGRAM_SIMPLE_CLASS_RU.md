# ER-диаграмма: упрощённая модель магазина (как на учебном чертеже)

Логические сущности: **пользователь**, **обратная связь**, **бонусные операции**, **журнал аудита**, **заказы**, **зона доставки**, **пункты доставки**, **категории**, **товары**. Связь «несколько товаров в одном заказе» задана таблицей **позиций заказа** (`order_items`), что соответствует нормализации связи многие-ко-многим между товарами и заказами.

## Реализация в PostgreSQL

| Что | Где |
|-----|-----|
| DDL и комментарии на русском | **`scripts/schema-er-diagram-simple-ru.sql`** |
| Схема БД | **`er_diagram_shop`** (отдельно от `public` ЭкваЛайн и от `demo_shop`) |

Запуск:

```bash
psql "%DATABASE_URL%" -f scripts/schema-er-diagram-simple-ru.sql
```

После выполнения в **pgAdmin**: схема `er_diagram_shop` → **ERD For Schema** — связи появятся по ограничениям **FOREIGN KEY**.

## Диаграмма (Mermaid)

Скопируйте в [mermaid.live](https://mermaid.live) для экспорта в PNG/SVG.

```mermaid
erDiagram
  users ||--o{ feedback_messages : "1:N"
  users ||--o{ bonus_operations : "1:N"
  users ||--o{ audit_log : "1:N"
  users ||--o{ orders : "1:N клиент"

  delivery_zones ||--o{ orders : "1:N"
  delivery_zones ||--o{ delivery_points : "1:N"

  categories ||--o{ products : "1:N"

  orders ||--o{ order_items : "состав"
  products ||--o{ order_items : "в заказах"

  users {
    int id PK "id_пользователя"
    text role "роль"
    text email "email"
    text phone "телефон"
    text password_hash "хэш_пароля"
  }

  feedback_messages {
    int id PK "id_сообщения"
    int user_id FK "id_пользователя"
    text message "текст_сообщения"
    timestamptz sent_at "дата_отправки"
  }

  bonus_operations {
    int id PK "id_операции"
    int user_id FK "id_пользователя"
    text operation_type "тип_операции"
    int amount "сумма"
    timestamptz operation_date "дата"
  }

  audit_log {
    int id PK "id_записи"
    int user_id FK "id_пользователя"
    text action "действие"
    text ip_address "ip_адрес"
    timestamptz logged_at "время"
  }

  delivery_zones {
    int id PK "id_зоны"
    text zone_name "название_зоны"
    numeric tariff "тариф"
  }

  delivery_points {
    int id PK "id_пункта"
    int zone_id FK "id_зоны"
    text point_name "название_пункта"
    text full_address "полный_адрес"
  }

  orders {
    int id PK "id_заказа"
    int user_id FK "id_клиента"
    int delivery_zone_id FK "id_зоны"
    text status "статус"
    numeric total_amount "итоговая_сумма"
    timestamptz creation_date "дата_создания"
  }

  categories {
    int id PK "id_категории"
    text name "название"
    text description "описание"
  }

  products {
    int id PK "id_товара"
    int category_id FK "id_категории"
    text name "название"
    numeric price "цена"
    int stock_balance "остаток_на_складе"
  }

  order_items {
    int id PK
    int order_id FK "заказ"
    int product_id FK "товар"
    int quantity "количество"
    numeric unit_price "цена за ед."
  }
```

## Соответствие таблиц SQL и названий на чертеже

| Таблица `er_diagram_shop.*` | По-русски (как на схеме) |
|-----------------------------|---------------------------|
| `users` | Пользователь |
| `feedback_messages` | Обратная связь |
| `bonus_operations` | Бонусные операции |
| `audit_log` | Журнал аудита |
| `orders` | Заказы |
| `delivery_zones` | Зона доставки |
| `delivery_points` | Пункты доставки |
| `categories` | Категории |
| `products` | Товары |
| `order_items` | Позиции заказа (связь товары↔заказы) |
