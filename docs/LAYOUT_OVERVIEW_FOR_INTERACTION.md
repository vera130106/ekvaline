# ЭкваЛайн — обзор вёрстки для интерактива

Краткая карта **структуры DOM и классов**: без полного кода и стилей, только то, что нужно, чтобы перенести макет в другой фреймворк или навесить интерактив.

Файлы: **`*.html`** (разметка) + общий **`styles.css`**. Шрифты: **Manrope** (основной UI), **Playfair Display** — заголовки на публичных страницах.

---

## Общая дизайн-система (CSS-переменные)

Из `:root` в `styles.css`:

| Токен | Назначение |
|-------|------------|
| `--bg`, `--ink`, `--muted` | фон, текст, вторичный текст |
| `--blue`, `--cyan` | акценты бренда, градиенты подчёркивания меню |
| `--border`, `--wave` | границы, декоративные волны в hero |
| **`container`** | `width: min(1220px, calc(100% - 2.2rem)); margin-inline: auto` — основная сетка контента |

Частые утилиты в текстах: **`text-blue`**, **`text-green`**, **`eyebrow`** / **`catalog-kicker`** (мелкий uppercase-лайбл).

Кнопки публичного сайта:

- **`ghost-btn`** — обводка, светлый фон.
- **`solid-btn`** — заливка синяя (`--blue`), акцент CTA.

**Адаптив шапки (ориентиры):** около **1200px** — ужимается меню (gap); **1020px** — `topbar-inner` переходит на **wrap**, меню на всю ширину; **640px** — ещё плотнее сетка, `menu` может переносить пункты.

---

## Паттерн A — маркетинговая страница (шапка + контент)

**Файлы:** `index.html`, `catalog.html`, `about.html`, `delivery.html`, `contacts.html`, `community.html`, частично `cabinet.html`.

```
body (иногда модификатор: catalog-page | about-page | community-page | cabinet-page-full)
├── header.topbar
│   └── div.container.topbar-inner
│       ├── a.brand → img.brand-logo
│       ├── nav.menu [ссылки, .active у текущей]
│       ├── div#topbarNotifications.topbar-mid  ← колокольчик (монтирует app-core/script)
│       └── div.contact-area
│               ├── div.hotline (span + a[href=tel:])
│               ├── button[data-auth-login].ghost-btn
│               └── button[data-auth-register].solid-btn
└── main
    └── секции страницы (ниже по файлам)
```

**Точки для интерактива:** активный пункт меню, открытие auth по `data-auth-*`, блок уведомлений по `#topbarNotifications`, динамическая кнопка «Личный кабинет» вставляется в `.contact-area` скриптом.

---

### `index.html` — главная

| Блок | Классы / структура | Замечания |
|------|-------------------|-----------|
| Hero | `section.hero` → `hero-inner`: `hero-copy` (eyebrow, h1, `hero-note`) + `hero-media` (`.bottles`) | ниже **`wave-layer`** |
| Превью каталога | `section.catalog` → `catalog-head` + `catalog-grid` | карточка: **`catalog-card`** → image wrap, **`catalog-type`**, h3, **`catalog-bottom`** |
| Калькулятор | `section.calc-section#water-calc` → **`calc-layout`**: **`calc-controls`** (range, **`option-grid`** + **`option-btn`**) + визуал бутылки | группы с **`calc-label-row`** |
| Дальше по странице | типичные секции с `container` — смотреть файл | корзина/модалки вставляет `script.js` |

Интерактив: переключение **`option-btn` / `.active`**, слайдер `peopleRange`, блоки калькулятора.

---

### `catalog.html` — полный каталог

`body.catalog-page`:

- **`catalog-hero`** → `catalog-hero-inner` / `catalog-hero-copy`.
- **`full-catalog-section#fullCatalog`**:
  - **`full-catalog-controls`** → `#catalogFilters` с кнопками **`catalog-filter-btn`** `[data-category]`.
  - **`full-catalog-grid#catalogGrid`** — карточки **`full-catalog-card`** `[data-category]`, изображение в **`full-card-image-wrap`**, тег **`full-card-tag`**, низ **`full-card-bottom`**.

Интерактив: фильтрация по `data-category`, «В корзину» на карточках.

---

### `about.html`

- **`about-hero`** → `about-hero-copy`.
- **`about-pillars`**: блок шагов — **`about-steps-layout`**, слева **`about-step-nav`** (`role="tablist"`) с **`about-step-btn`**, **`about-step-progress`**, справа контент панели (**`about-step-detail`** и т.д. в файле).

Интерактив: табы **`data-step`**, заполнение прогресс-бара **`about-step-progress-fill`**.

---

### `community.html` (блог v2)

`main.community-main.blogv2`:

1. **`blogv2-stories-wrap`** → `#blogStories` (лента историй).
2. **`blogv2-layout`**:
   - **`aside.blogv2-sidebar-left`** — карточки **`blogv2-card`** (#factBlockTitle, `#factOfDayText`, списки `#popularList`, `#tipsList`…).
   - Центральная колонка — лента **`blogv2-feed`**, **`article.blogv2-post`** и т.д. (далее по разметке).
   - При необходимости правый сайдбар.

Интерактив: лайки, комментарии, подгрузка постов из localStorage/API (см. `script.js` / community-блоки).

---

### `cabinet.html` — личный кабинет (полноэкранный)

Шапка как в паттерне A. Контент:

```
main.cabinet-full-main
└── section.container
    ├── div.cabinet-full-head [h1, #cabinetFullUserMeta, #cabinetFullLogoutBtn]
    └── div.cabinet-full-grid  (CSS grid карточек)
        ├── section.cabinet-full-card           [Профиль + form#cabinetFullProfileForm]
        ├── section.cabinet-full-card           [Бонусы]
        ├── section.cabinet-full-card.cabinet-full-card-wide [#cabinetAddressesList]
        └── section.cabinet-full-card.cabinet-full-card-wide [#cabinetOrdersList]
```

Интерактив: формы, списки наполняет **`cabinet-pg.js`**.

---

## Паттерн B — админ-панель (своя навигация в шапке)

**`admin.html`**: `body.admin-page`.

- **`header.topbar`** — в `menu` ссылки на **Оператор / Водитель / Менеджер / Админ**, без блока входа клиента.
- **`main.container.admin-panel`**:
  - блоки **`admin-card`** (заголовок + описание),
  - **`admin-grid`** — двойная колонка карточек,
  - формы **`admin-form`**, списки **`admin-list`** (`#adminUsersList`, `#adminProductsList`).

Интерактив: CRUD пользователей/товары/настройки через **`admin.js`** + API.

---

## Паттерн C — панель оператора

**`operator.html`**: `body.operator-page`.

```
main.opx-shell
├── header.opx-topbar — nav.opx-tabs (.opx-tab, .is-active) + div.opx-right (#opxNewOrdersInboxBtn, #opxLogoutBtn)
├── section.opx-controls — кнопки, поиск, дата (#opxDateFilter), #opxBulkBar
├── section.opx-grid-wrap — table.opx-grid (#opxOrdersBody)
├── footer.opx-footer
└── ВНЕ main: модальные блоки (.opx-modal), оверлеи карты/отчётов, #opxToast
```

Ключевые классы: **`opx-btn`**, **`opx-input`**, **`opx-modal`** + **`opx-modal-card`**, вкладки внутри карточки заказа **`.opx-modal-tab`**, фут действий **`.opx-modal-actions`**.

Интерактив: таблица, модал заказа, фильтры, тост **`#opxToast`** — см. **`operator.js`**.

**Важно для вёрстки:** при открытых модалках `body` может получить **`opx-modal-open`** — главная оболочка **`main.opx-shell`** с **`pointer-events: none`** до закрытия оверлея.

---

## Паттерн D — водитель

**`driver.html`**: `body.driver-page`.

```
header.drv-topbar → .drv-topbar-inner (.drv-brand, .drv-topbar-actions)
main.drv-shell
├── section#drvLoginCard.drv-card  (#drvLoginForm, #drvLoginError)
└── section#drvMainCard.drv-card [hidden] (.drv-table-wrap → table.drv-table, #drvOrdersBody, #drvToast)
```

Стили: префикс **`drv-`** (`drv-btn`, `drv-input`, `drv-form`). Интерактив: **`driver.js`**.

---

## Паттерн E — менеджер блога

**`manager.html`**: `body.manager-page`, только **`main`** (без публичной шапки).

```
main.manager-shell
├── header.manager-head — заголовок + div.manager-head-actions (.manager-btn)
├── section.manager-grid — карточки .manager-card.manager-launch-card [data-open-form-modal → id модалки]
└── модальные блоки (.manager-modal) с формами
```

Интерактив: открытие по **`data-open-form-modal`**, **`manager.js`**.

---

## Модальные окна на публичном сайте (`script.js`)

В конец **`body`** вставляется разметка (не в каждом HTML отдельно):

- **`#authModal.auth-modal`** — табы входа/регистрации, формы **`#authLoginForm`**, **`#authRegisterForm`**, ошибки **`#authLoginError`**.
- **`#cabinet.cabinet`** — боковая панель кабинета, **`cabinet-nav-btn`**, **`#cabinetContent`**.
- Модалки корзины и чекаута — см. маркеры в **`script.js`** (`cart-modal`, `checkout-modal` и т.д.).

При переносе в React держите **порталы** для оверлеев и **z-index** выше шапки (шапка `z-index: 20`, уведомления выше).

---

## Чек-лист для переписывания интерактива

1. Сохранить **семантику**: шапка `header.topbar`, контент в **`container`**, активный пункт **`menu a.active`**.
2. Отдельные **layout-модели**: маркетинг (`main` секции), оператор (**`opx-shell`**), водитель (**`drv-shell`**), менеджер (**`manager-shell`**).
3. Связка **видимость ↔ состояние**: у оператора модалки `hidden` + класс **`is-open`**; у водителя **`#drvMainCard`** vs **`#drvLoginCard`**.
4. **Не дублировать** строки фильтров/таблиц без понимания: часть строк генерируется в JS (**`tbody#opxOrdersBody`**, **`#blogStories`** и др.).
5. Для доступности сохранять **`aria-label`**, **`aria-live`** на ошибках входа и тостах.

Дополнения к этому файлу лучше вести таблицей «страница → файл → главный контейнер для состояния».
