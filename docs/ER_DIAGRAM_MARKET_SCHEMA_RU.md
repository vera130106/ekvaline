# ER-диаграмма торговой схемы (русские подписи, все основные связи)

Ниже — логическая модель как на вашей схеме: **users**, **clients**, **products**, **categories**, **orders**, **order_items**, **order_status_events**, **delivery_addresses**, **delivery_zones**, **express_couriers**, **bonus_operations**, **audit**, **feedback_messages**, **site_settings**.

## Реализация в PostgreSQL

Таблицы создаются в отдельной схеме **`demo_shop`**, чтобы не мешать проекту ЭкваЛайн:

- SQL-скрипт: **`scripts/schema-demo-shop-er-ru.sql`**
- Запуск:  
  `psql "%DATABASE_URL%" -f scripts/schema-demo-shop-er-ru.sql`  
  (подставьте свою строку подключения из `.env`.)

В скрипте заданы **`COMMENT ON TABLE`** / **`COMMENT ON COLUMN`** на русском — в **pgAdmin** / **DBeaver** подписи будут отображаться рядом с объектами.

## Диаграмма (Mermaid)

Скопируйте в [mermaid.live](https://mermaid.live) для экспорта в PNG/SVG.

```mermaid
erDiagram
  users ||--o{ clients : "профиль клиента (опц.)"
  users ||--o{ delivery_addresses : "владеет адресами"
  users ||--o{ bonus_operations : "бонусы"
  users ||--o{ audit : "действия в журнале"
  users ||--o{ feedback_messages : "обращение (если авторизован)"

  clients ||--o{ orders : "оформляет заказы"

  categories ||--o{ categories : "родительская категория"
  categories ||--o{ products : "категория товара"

  products ||--o{ order_items : "в позициях заказа"

  delivery_addresses ||--o{ orders : "адрес доставки"

  delivery_zones ||--o{ orders : "зона доставки"

  express_couriers ||--o{ orders : "назначенный курьер"

  orders ||--o{ order_items : "состав заказа"
  orders ||--o{ order_status_events : "история статусов"

  users {
    int id PK "идентификатор"
    text name "имя"
    text email "почта"
    timestamptz email_verified_at "подтверждение почты"
    text password "пароль (хэш)"
    text remember_token "токен «запомнить»"
  }

  clients {
    int id PK
    int user_id FK "пользователь"
    text name "имя"
    text phone "телефон"
    text email "почта"
    text password "пароль"
  }

  categories {
    int id PK
    text name "название"
    text slug "ЧПУ"
    int parent_id FK "родитель"
  }

  products {
    int id PK
    text name "название"
    text slug "ЧПУ"
    text description "описание"
    numeric price "цена"
    numeric old_price "старая цена"
    int category_id FK "категория"
    text image "изображение"
    text status "статус"
    int is_popular "популярный"
    int is_new "новинка"
  }

  orders {
    int id PK
    int client_id FK "клиент"
    text status "статус"
    numeric total_price "сумма"
    int delivery_address_id FK "адрес доставки"
    text delivery_type "тип доставки"
    text payment_type "тип оплаты"
    text comment "комментарий"
    int express_courier_id FK "курьер"
    int delivery_zone_id FK "зона"
  }

  order_items {
    int id PK
    int order_id FK "заказ"
    int product_id FK "товар"
    int quantity "количество"
    numeric price "цена за ед."
  }

  order_status_events {
    int id PK
    int order_id FK "заказ"
    text status "статус"
    text comment "комментарий"
  }

  delivery_addresses {
    int id PK
    int user_id FK "пользователь"
    text city "город"
    text street "улица"
    text house "дом"
    text apartment "квартира"
  }

  delivery_zones {
    int id PK
    text name "название зоны"
    text polygon "область / GeoJSON"
    numeric price "надбавка / тариф"
  }

  express_couriers {
    int id PK
    text name "ФИО"
    text phone "телефон"
    text status "статус"
  }

  bonus_operations {
    int id PK
    int user_id FK "пользователь"
    numeric amount "сумма"
    text type "тип"
    text description "описание"
  }

  audit {
    int id PK
    int user_id FK "пользователь"
    text action "действие"
    text model "модель"
    int model_id "id объекта"
    text changes "изменения"
  }

  feedback_messages {
    int id PK
    int user_id FK "пользователь (опц.)"
    text name "имя"
    text email "почта"
    text message "сообщение"
  }

  site_settings {
    int id PK
    text key "ключ"
    text value "значение"
  }
```

## Таблица соответствия (имя SQL → по-русски)

| Объект | Русское название |
|--------|------------------|
| `demo_shop.users` | Пользователи |
| `demo_shop.clients` | Клиенты |
| `demo_shop.categories` | Категории товаров |
| `demo_shop.products` | Товары |
| `demo_shop.orders` | Заказы |
| `demo_shop.order_items` | Позиции заказа |
| `demo_shop.order_status_events` | События статуса заказа |
| `demo_shop.delivery_addresses` | Адреса доставки |
| `demo_shop.delivery_zones` | Зоны доставки |
| `demo_shop.express_couriers` | Экспресс-курьеры |
| `demo_shop.bonus_operations` | Бонусные операции |
| `demo_shop.audit` | Журнал аудита |
| `demo_shop.feedback_messages` | Обратная связь |
| `demo_shop.site_settings` | Настройки сайта |

## Как открыть ERD в pgAdmin

1. Выполните скрипт **`scripts/schema-demo-shop-er-ru.sql`**.
2. В дереве: **Schemas → demo_shop → ПКМ → ERD For Schema** (или аналог в вашей версии).
3. Стрелки появятся по **FOREIGN KEY** автоматически.

## Примечание

Схема **`demo_shop`** живёт отдельно от **`public`** ЭкваЛайн. Таблицы **`users`** и **`clients`** связаны опционально через **`clients.user_id`**.
