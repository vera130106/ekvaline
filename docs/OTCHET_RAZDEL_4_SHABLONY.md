# 4. Разработка веб-приложения (фрагменты для отчёта)

В проекте ЭкваЛайн шаблоны страниц — отдельные файлы разметки в корне репозитория. Общая шапка с навигацией повторяется на публичных разделах; служебные экраны для сотрудников имеют собственный каркас. Раздел **4.1** перечисляет все шаблоны; раздел **4.2** описывает связку этих файлов с программой-сервером **`server.js`**, базой **PostgreSQL** и сценариями приложения; раздел **4.3** содержит перечень основных **динамических функций** в браузере (**`script.js`**, **`community.js`**, **`app-core.js`**, **`api-client.js`**, **`cabinet-pg.js`** и др.).

---

## 4.1 Создание шаблонов страниц веб-приложения

### 4.1.1 Шаблон главной страницы

Код задаёт начальный экран витрины: верхняя полоса с фирменным знаком и ссылками на каталог, сведения о компании, доставку, контакты и блог; кнопки входа и регистрации; приветственный блок с текстом и иллюстрацией; сетка карточек товара с ценой и действиями; секция калькулятора потребления воды с ползунком и последующими переключателями (полный файл дополняет форму обратного звонка и подвал). Файл: `index.html`.

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ЭкваЛайн - Чистая и полезная питьевая вода</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="topbar">
      <div class="container topbar-inner">
        <a class="brand" href="index.html" aria-label="ЭкваЛайн">
          <img src="assets/logo.png" alt="ЭкваЛайн" class="brand-logo" />
        </a>
        <nav class="menu" aria-label="Главное меню">
          <a href="index.html" class="active">Главная</a>
          <a href="catalog.html">Каталог</a>
          <a href="about.html">О компании</a>
          <a href="delivery.html">Доставка</a>
          <a href="contacts.html">Контакты</a>
          <a href="community.html">Блог</a>
        </nav>
        <div class="topbar-mid" id="topbarNotifications" aria-label="Уведомления"></div>
        <div class="contact-area">
          <div class="hotline">
            <span>БЕСПЛАТНАЯ ДОСТАВКА</span>
            <a href="tel:83532679909">8 (3532) 67-99-09</a>
          </div>
          <button class="ghost-btn" type="button" data-auth-login>Вход</button>
          <button class="solid-btn" type="button" data-auth-register>Регистрация</button>
        </div>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-copy">
            <p class="eyebrow">ЧИСТОТА В КАЖДОЙ КАПЛЕ</p>
            <h1>
              Чистая и полезная
              <span class="text-blue">питьевая</span>
              <span class="text-green">вода</span>
            </h1>
            <p class="hero-note">
              Мы доставляем идеально сбалансированную воду прямо к вашему порогу.
            </p>
          </div>
          <div class="hero-media" aria-hidden="true">
            <img src="assets/bottles.png" alt="" class="bottles" />
          </div>
        </div>
        <div class="wave-layer"></div>
      </section>
      <section class="catalog">
        <div class="container">
          <div class="catalog-head">
            <div>
              <p class="catalog-kicker">НАШ АССОРТИМЕНТ</p>
              <h2>Каталог</h2>
            </div>
            <a href="catalog.html" class="catalog-link">Весь каталог →</a>
          </div>
          <div class="catalog-grid">
            <article class="catalog-card">
              <div class="catalog-image-wrap">
                <img src="assets/one-bottle.png" alt="Вода 18.9л" class="catalog-bottle one single" />
              </div>
              <p class="catalog-type">ВОДА В БУТЫЛЯХ</p>
              <h3>Вода 18.9л</h3>
              <div class="catalog-bottom">
                <p class="catalog-price">1 бутыль — 220 ₽</p>
                <div class="catalog-actions">
                  <button type="button" class="cart-btn">В корзину</button>
                  <a href="catalog.html" class="details-link">Подробнее</a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section class="calc-section" id="water-calc">
        <div class="container">
          <div class="calc-head">
            <h2>Калькулятор потребления</h2>
            <p>Рассчитайте идеальный объем воды для вашего здоровья и активности</p>
          </div>
          <div class="calc-layout">
            <div class="calc-controls">
              <div class="calc-group">
                <div class="calc-label-row">
                  <label for="peopleRange">Количество человек</label>
                  <strong id="peopleValue">2</strong>
                </div>
                <input id="peopleRange" type="range" min="1" max="15" value="2" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
```

---

### 4.1.2 Шаблон страницы организации («О компании»)

Описывает миссию и цепочку подготовки воды: герой-секция с заголовком; переключатели этапов слева и текстовые панели справа; сетка карточек сертификатов. Поведение шагов и полосы прогресса подключается общим сценарием страницы. Файл: `about.html`.

```html
<body class="about-page">
  <header class="topbar">…</header>
  <main>
    <section class="about-hero">
      <div class="container about-hero-inner">
        <div class="about-hero-copy">
          <p class="about-kicker">НАША ИСТОРИЯ И МИССИЯ</p>
          <h1>Чистота, которую мы создаем <span class="text-blue">для вашего будущего</span></h1>
          <p>ЭкваЛайн — это быстрая доставка чистой воды по Оренбургу…</p>
        </div>
      </div>
    </section>
    <section class="about-pillars">
      <div class="container about-steps" id="aboutSteps">
        <h2>Этапы подготовки и доставки воды</h2>
        <div class="about-steps-layout">
          <div class="about-step-nav" role="tablist">
            <span class="about-step-progress-fill" id="aboutStepProgressFill"></span>
            <button type="button" class="about-step-btn is-active" data-step="wash" data-order="1">
              <span class="about-step-btn-index">01</span>
              <span class="about-step-btn-title">Обработка бутылки</span>
            </button>
          </div>
          <div class="about-step-panels">
            <article class="about-step-panel is-active" data-step-panel="wash">
              <h3>Обработка бутылки</h3>
              <p>Каждую бутыль принимаем, осматриваем и промываем…</p>
            </article>
          </div>
        </div>
      </div>
    </section>
    <section class="about-certs">
      <div class="container">
        <h2>Наши сертификаты</h2>
        <div class="about-certs-grid">
          <article class="about-cert-card">
            <img src="assets/certificate-card.jpg" alt="Карточка предприятия" />
            <div class="about-cert-overlay"><h3>Карточка предприятия</h3></div>
          </article>
        </div>
      </div>
    </section>
  </main>
</body>
```

---

### 4.1.3 Шаблон страницы продукции (каталог)

Вводный блок с возвратом на главную; группа кнопок фильтра по категориям товара; сетка карточек с изображением, типом, ценой, кнопкой в корзину и при необходимости кнопкой подробностей для оборудования под заказ. Файл: `catalog.html`.

```html
<section class="catalog-hero">
  <div class="container catalog-hero-inner">
    <div class="catalog-hero-copy">
      <p class="catalog-kicker">ОСВЕЖАЮЩИЙ ВЫБОР</p>
      <h1><span>Полный</span> <span class="text-blue">каталог</span> <span class="text-green">ЭкваЛайн</span></h1>
      <a href="index.html" class="catalog-back-link">← Вернуться на главную</a>
    </div>
  </div>
</section>
<section class="full-catalog-section" id="fullCatalog">
  <div class="container">
    <div class="filter-group" id="catalogFilters">
      <button class="catalog-filter-btn active" type="button" data-category="all">Все</button>
      <button class="catalog-filter-btn" type="button" data-category="water">Вода в бутылях</button>
      <button class="catalog-filter-btn" type="button" data-category="accessories">Аксессуары</button>
      <button class="catalog-filter-btn" type="button" data-category="equipment">Оборудование</button>
    </div>
    <div class="full-catalog-grid" id="catalogGrid">
      <article class="full-catalog-card" data-category="water">
        <div class="full-card-image-wrap image-bg-a">
          <img src="assets/product-18-9-white.png" alt="Природная вода 18.9л" class="full-card-image size-md" />
        </div>
        <p class="full-card-type">ВОДА В БУТЫЛЯХ</p>
        <h3>Вода 18.9л</h3>
        <div class="full-card-bottom">
          <p class="full-card-price">1 бутыль — 220 ₽</p>
          <button type="button" class="catalog-add-btn">В корзину</button>
        </div>
      </article>
    </div>
  </div>
</section>
```

---

### 4.1.4 Шаблон страницы доставки и зон обслуживания

По смыслу ближе всего к «географическому» разделу из методички: текст о логистике в городе, показатели режима; блок с картой (подключаются стили внешней библиотеки отображения карт) и контейнер для сценария карты; список зон или интервалов рядом с картой. Файл: `delivery.html`.

```html
<body class="delivery-page">
  <header class="topbar">…</header>
  <main>
    <section class="delivery-hero">
      <div class="container delivery-hero-grid">
        <div class="delivery-copy">
          <p class="delivery-kicker">ДОСТАВКА В ОРЕНБУРГЕ</p>
          <h1>Свежая вода у вашего порога <span class="text-blue">вовремя</span></h1>
          <div class="delivery-stats">
            <article class="delivery-stat-card">
              <p class="delivery-stat-title">Бесплатная доставка</p>
            </article>
          </div>
        </div>
        <div class="delivery-hero-visual" aria-hidden="true">
          <img src="assets/bottles.png" alt="" class="delivery-hero-bottle" />
        </div>
      </div>
    </section>
    <section class="delivery-map-section">
      <div class="container">
        <h2>Зоны покрытия Оренбурга</h2>
        <div class="delivery-map-layout">
          <div class="delivery-map-board" id="deliveryMapBoard">
            <div class="delivery-leaflet-map" id="deliveryLeafletMap" aria-label="Карта зон доставки"></div>
          </div>
          <div class="delivery-zone-list" id="deliveryZoneList">
            <article class="delivery-zone-item is-active">
              <h3>Интервалы доставки</h3>
              <p>Утро: <strong>9:00-14:00</strong>, День: <strong>14:00-17:00</strong>…</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  </main>
</body>
```

---

### 4.1.5 Шаблон страницы контактов

Крупный призыв связаться, блок с телефоном и почтой в виде выделенной карточки; ниже — сетка карточек по каналам связи и режимам. Файл: `contacts.html`.

```html
<body class="contacts-page">
  <header class="topbar">…</header>
  <main>
    <section class="contacts-hero">
      <div class="container contacts-stage">
        <div class="contacts-hero-grid">
          <div class="contacts-hero-copy">
            <p class="contacts-kicker">КОНТАКТЫ ЭКВАЛАЙН</p>
            <h1>Свяжитесь с нами удобно, быстро и без лишних ожиданий</h1>
            <div class="contacts-hero-chips">
              <span>Быстрый ответ</span>
              <span>Поддержка без выходных</span>
            </div>
          </div>
          <div class="contacts-highlight-card">
            <p class="contacts-highlight-kicker">Горячая линия</p>
            <a href="tel:83532679909" class="contacts-highlight-phone">8 (3532) 67-99-09</a>
            <a href="mailto:ekvalyn@mail.ru">ekvalyn@mail.ru</a>
          </div>
        </div>
      </div>
    </section>
    <section class="contacts-cards-section">
      <div class="container contacts-cards-grid">
        <article class="contacts-info-card is-phone">
          <p class="contacts-card-kicker">Телефон</p>
          <a href="tel:83532679909">8 (3532) 67-99-09</a>
        </article>
      </div>
    </section>
  </main>
</body>
```

---

### 4.1.6 Шаблон блога (истории, лента, боковые блоки)

Область «Истории» заполняется сценарием; центральная колонка — лента постов; слева вспомогательные блоки (факт дня, популярное, советы); справа связь с витриной, простой учёт выпитой воды, место под опрос. Есть скрытый блок модального окна для просмотра истории. Файл: `community.html`.

```html
<body class="community-page">
  <header class="topbar">…</header>
  <main class="community-main blogv2">
    <section class="container blogv2-stories-wrap">
      <h2 id="stories-title">Истории</h2>
      <div class="blogv2-stories" id="blogStories"></div>
    </section>
    <section class="container blogv2-layout">
      <aside class="blogv2-sidebar blogv2-sidebar-left">
        <section class="blogv2-card">
          <h3 id="factBlockTitle">Факт дня</h3>
          <p id="factOfDayText">…</p>
        </section>
        <ul class="blogv2-list" id="popularList"></ul>
      </aside>
      <div class="blogv2-feed-col">
        <div id="blogFeed" class="blogv2-feed"></div>
      </div>
      <aside class="blogv2-sidebar blogv2-sidebar-right">
        <section class="blogv2-card blogv2-brand-card">
          <h3>Связаться с ЭкваЛайн</h3>
          <a class="blogv2-btn" href="catalog.html">Заказать воду</a>
        </section>
        <section class="blogv2-card blogv2-hydration-card">
          <h3>Трекер воды за день</h3>
          <p>Вы сегодня выпили: <strong><span id="hydrationValueText">1.2</span> л</strong></p>
          <button type="button" class="blogv2-btn small" id="hydrationAddBtn">Добавить</button>
        </section>
      </aside>
    </section>
    <div class="blogv2-story-modal" id="storyModal" aria-hidden="true">
      <div class="blogv2-story-backdrop" data-story-close="true"></div>
      <div class="blogv2-story-shell" role="dialog">
        <h3 id="storyTitle"></h3>
        <p id="storyBody"></p>
      </div>
    </div>
  </main>
</body>
```

---

### 4.1.7 Шаблон личного кабинета клиента

Та же публичная шапка; основная область — заголовок, кнопка выхода, сетка карточек: анкета профиля с сохранением, бонусы, список адресов и список заказов заполняются при работе с сервером. Подключены отдельные сценарии для кабинета. Файл: `cabinet.html`.

```html
<body class="cabinet-page-full">
  <header class="topbar">…</header>
  <main class="cabinet-full-main">
    <section class="container">
      <div class="cabinet-full-head">
        <h1>Личный кабинет</h1>
        <p id="cabinetFullUserMeta">Пожалуйста, войдите в аккаунт.</p>
        <button type="button" class="cabinet-full-logout-btn" id="cabinetFullLogoutBtn">Выйти</button>
      </div>
      <div class="cabinet-full-grid">
        <section class="cabinet-full-card">
          <h2>Профиль</h2>
          <form id="cabinetFullProfileForm" novalidate>
            <label>Имя <input type="text" name="name" maxlength="40" /></label>
            <label>Email <input type="email" name="email" /></label>
            <button type="submit" class="solid-btn">Сохранить профиль</button>
          </form>
        </section>
        <section class="cabinet-full-card">
          <h2>Бонусы</h2>
          <p class="cabinet-full-bonus" id="cabinetBonusValue">0</p>
        </section>
        <section class="cabinet-full-card cabinet-full-card-wide">
          <h2>Адреса доставки</h2>
          <ul id="cabinetAddressesList" class="cabinet-full-list"></ul>
        </section>
        <section class="cabinet-full-card cabinet-full-card-wide">
          <h2>Заказы</h2>
          <div id="cabinetOrdersList" class="cabinet-full-orders"></div>
        </section>
      </div>
    </section>
  </main>
  <script src="app-core.js"></script>
  <script src="api-client.js"></script>
  <script src="script.js"></script>
  <script src="cabinet-pg.js"></script>
</body>
```

---

### 4.1.8 Шаблон панели оператора

Отдельный каркас без витринной шапки: верхняя строка с вкладками «Заказы», «Карта», «Отчёты»; кнопка очереди новых заказов и выход; панель фильтров по дате, поиску, массовым действиям; таблица заказов (остальное тело страницы в полном файле — карта, отчёты, всплывающие окна). Файл: `operator.html`.

```html
<body class="operator-page">
  <main class="opx-shell">
    <header class="opx-topbar">
      <nav class="opx-tabs">
        <button type="button" class="opx-tab is-active" id="opxTabOrders">Заказы</button>
        <button type="button" class="opx-tab" id="opxTabMap">Карта</button>
        <button type="button" class="opx-tab" id="opxTabReports">Отчёты</button>
      </nav>
      <div class="opx-right">
        <button type="button" id="opxNewOrdersInboxBtn">Новые заказы <strong id="opxNewCount">0</strong></button>
        <button type="button" id="opxLogoutBtn" title="Выйти">👤</button>
      </div>
    </header>
    <section class="opx-controls">
      <input type="search" id="opxSearchInput" placeholder="улица, имя, номер заказа…" />
      <input type="date" id="opxDateFilter" />
      <table class="opx-grid">
        <thead><tr><!-- колонки заказов --></tr></thead>
        <tbody id="opxOrdersBody"></tbody>
      </table>
    </section>
  </main>
</body>
```

---

### 4.1.9 Шаблон панели водителя

Минималистичная шапка с названием роли; сначала карточка входа по почте или телефону и паролю, после успешного входа — таблица назначенных заказов. Файл: `driver.html`.

```html
<body class="driver-page">
  <header class="drv-topbar">
    <div class="drv-topbar-inner">
      <a class="drv-brand" href="index.html">ЭкваЛайн — водитель</a>
      <button type="button" id="drvLogoutBtn" hidden>Выйти</button>
    </div>
  </header>
  <main class="drv-shell">
    <section class="drv-card" id="drvLoginCard">
      <h1>Вход для водителя</h1>
      <form id="drvLoginForm" novalidate>
        <input type="text" name="credential" required />
        <input type="password" name="password" required />
        <button type="submit">Войти</button>
      </form>
    </section>
    <section class="drv-card" id="drvMainCard" hidden>
      <h1>Мои заказы</h1>
      <table class="drv-table">
        <thead>
          <tr>
            <th>№</th><th>Клиент</th><th>Адрес</th><th>Статус</th>
          </tr>
        </thead>
        <tbody id="drvOrdersBody"></tbody>
      </table>
    </section>
  </main>
  <script src="api-client.js"></script>
  <script src="driver.js"></script>
</body>
```

---

### 4.1.10 Шаблон панели менеджера блога

Рабочая область для публикаций: сетка быстрых действий (новый пост, факт дня, боковые блоки, истории, опрос); широкая зона ленты постов с прокруткой; блок комментариев; модальные окна с формами (в полном файле). Файл: `manager.html`.

```html
<body class="manager-page">
  <main class="manager-shell">
    <header class="manager-head">
      <h1>Управление блогом</h1>
      <a href="community.html" target="_blank" class="manager-btn is-green">Просмотреть на сайте</a>
      <button type="button" id="managerLogoutBtn">Выйти</button>
    </header>
    <section class="manager-grid">
      <article class="manager-card">
        <h2>Новый пост</h2>
        <button type="button" data-open-form-modal="managerPostFormModal">Открыть</button>
      </article>
      <article class="manager-card">
        <h2>Истории</h2>
        <button type="button" data-open-form-modal="managerStoryFormModal">Открыть</button>
      </article>
    </section>
    <section class="manager-card manager-wide">
      <h2>Все посты (архив)</h2>
      <div class="manager-posts-carousel">
        <button type="button" id="managerPostsPrevBtn">‹</button>
        <div id="managerPostsViewport"><div id="managerPostsList"></div></div>
        <button type="button" id="managerPostsNextBtn">›</button>
      </div>
    </section>
  </main>
</body>
```

---

### 4.1.11 Шаблон административной панели

Витринная навигация дополнена ссылками на служебные экраны; блоки создания пользователя с выбором роли и метки для водителя; список пользователей; форма и список товаров; форма общих настроек сайта. Файл: `admin.html`.

```html
<body class="admin-page">
  <header class="topbar">
    <nav class="menu">
      <a href="index.html">Главная</a>
      <a href="operator.html">Оператор</a>
      <a href="driver.html">Водитель</a>
      <a href="manager.html">Менеджер</a>
      <a href="admin.html" class="active">Админ</a>
    </nav>
  </header>
  <main class="container admin-panel">
    <section class="admin-card">
      <h1>Админ-панель</h1>
    </section>
    <section class="admin-grid">
      <article class="admin-card">
        <h2>Создать сотрудника</h2>
        <form id="adminCreateUserForm">
          <input name="email" type="email" required />
          <select name="role">
            <option value="client">Клиент</option>
            <option value="operator">Оператор</option>
            <option value="driver">Водитель</option>
            <option value="manager">Менеджер</option>
            <option value="admin">Админ</option>
          </select>
          <button type="submit">Создать</button>
        </form>
      </article>
      <article class="admin-card">
        <h2>Пользователи</h2>
        <div id="adminUsersList" class="admin-list"></div>
      </article>
    </section>
    <section class="admin-card">
      <h2>Товары каталога</h2>
      <form id="adminCreateProductForm">…</form>
      <div id="adminProductsList" class="admin-list"></div>
    </section>
  </main>
  <script src="api-client.js"></script>
  <script src="admin.js"></script>
</body>
```

---

## 4.2 Реализация веб-приложения ЭкваЛайн

Раздел описывает то, как реализовано веб-приложение **ЭкваЛайн** — доставка питьевой воды в Оренбурге: связь готовых шаблонов страниц (п. 4.1) с программой-сервером **`server.js`**, с базой данных **PostgreSQL**, с клиентскими сценариями (**`script.js`**, **`community.js`**, **`api-client.js`**, панели **`operator.js`**, **`driver.js`**, **`admin.js`**, **`manager.html` / сценарии менеджера**) и с общей таблицей стилей **`styles.css`**. Пользователь открывает статические страницы через тот же узел, который обрабатывает запросы к адресам **`/api/...`**: регистрация и вход, профиль, каталог товаров из базы, заказы клиента и обработка заказов персоналом, настройки сайта, адреса и зоны доставки, обращения с формы, материалы блога.

Ниже даются пояснения и фрагменты кода из репозитория. Подписи **«Рисунок 18»–«Рисунок 25»** в тексте отчёта сопоставляют **скриншоты интерфейса**, снятые при работающем приложении (запуск из каталога проекта, страница открывается по адресу с портом приложения, например `http://localhost:3001`).

---

### Архитектура сервера и выдача интерфейса

Сервер принимает входящие сообщения, разбирает запись в формате **JSON** и данные форм, работает с файлами «куки», сохраняет **сессию** пользователя (в т.ч. в таблице хранилища сессий при подключённом пуле к **PostgreSQL**), проверяет **роль** учётной записи на закрытых маршрутах, ведёт журнал значимых действий. После объявления всех обработчиков маршрутов данные раздаются из каталога проекта как обычные файлы; если путь не относится ни к **`/api/`**, ни к существующему файлу, в ответ подставляется **`index.html`** — так поддерживается единая точка входа при обновлении страницы.

```javascript
app.use(express.static(ROOT, { index: 'index.html' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Не найдено.' });
    return;
  }
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[api] Необработанная ошибка:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

const server = app.listen(LISTEN_PORT);
```

---

**Рисунок 18 — Данные для оформления заказа из базы и карта на странице «Доставка».**

Для витрины без входа в систему выдаётся маршрут **`/api/public/checkout-options`**: из таблицы настроек **`site_settings`** читаются **интервалы доставки**, из таблицы **`delivery_addresses`** — **активные опорные адреса** для выбора при оформлении. Эти данные используют интерфейс корзины и checkout на стороне клиента вместе с перечнем товаров **`/api/products`**.

```javascript
app.get('/api/public/checkout-options', asyncHandler(async (req, res) => {
  let deliverySlots = ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'];
  const ds = await db.prepare('SELECT value FROM site_settings WHERE key = ?').get('deliverySlots');
  if (ds) {
    try {
      const parsed = JSON.parse(ds.value);
      if (Array.isArray(parsed) && parsed.length) deliverySlots = parsed;
    } catch {
      /* сохранить интервалы по умолчанию */
    }
  }
  let addresses = [];
  try {
    addresses = await db
      .prepare(
        `SELECT id, label, address_line FROM delivery_addresses WHERE active = 1 ORDER BY sort_order ASC, id ASC`
      )
      .all();
  } catch {
    addresses = [];
  }
  res.json({ deliverySlots, addresses });
}));
```

На странице **`delivery.html`** подключается библиотека **Leaflet**; в **`script.js`** инициализируется карта в блоке **`deliveryLeafletMap`**: подложка тайлов **OpenStreetMap**, центр над Оренбургом.

```javascript
const deliveryLeafletMap = document.getElementById('deliveryLeafletMap');

if (deliveryLeafletMap && window.L) {
  const map = L.map(deliveryLeafletMap, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([51.768, 55.102], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
}
```

Управление координатами зон для администрирования поддерживается моделью **`delivery_zones`** (поле **`bounds_json`**); отображение полигонов на витрине при необходимости расширяется отдельным сценарием.

---

**Рисунок 19 — Список пояснений по доставке и фильтр каталога на узком экране.**

На **`delivery.html`** рядом с картой расположен блок **`deliveryZoneList`**: карточки с интервалами, организациями и временем приёма заявок (текст задаётся в разметке страницы).

На **`catalog.html`** переключатели **`#catalogFilters`** связываются в **`script.js`** с карточками **`full-catalog-card`** по атрибуту **`data-category`**: на мобильном устройстве удобнее просматривать сокращённый набор позиций после выбора категории («все», вода, аксессуары, оборудование).

```javascript
if (catalogFilters && catalogCards.length > 0) {
  const filterButtons = Array.from(catalogFilters.querySelectorAll('.catalog-filter-btn'));

  function applyCatalogFilter(category) {
    catalogCards.forEach((card) => {
      const isVisible = category === 'all' || card.dataset.category === category;
      card.classList.toggle('is-hidden', !isVisible);
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      applyCatalogFilter(category);
    });
  });
}
```

В **панели оператора** (`operator.html`, **`operator.js`**) для больших списков заказов используется поле поиска **`#opxSearchInput`** (отбор по тексту среди загруженных с сервера заявок) — дополнительно к витринному фильтру каталога.

---

**Рисунок 20 — Страница «Доставка» на широком экране.**

**Рисунок 21 — Страница «Доставка» на узком экране.**

В **`styles.css`** блок **`.delivery-map-layout`** задаёт две колонки (карта и текстовый список); при ширине до **1080 px** включается одна колонка, при **760 px** задаётся минимальная высота карты.

```css
.delivery-map-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 1080px) {
  .delivery-map-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .delivery-map-board {
    min-height: 280px;
  }
}
```

Снимки **рис. 20** и **21** делают с **`delivery.html`** при типичной ширине монитора и при ширине мобильного окна браузера.

---

**Рисунок 22 — Разметка раздела «Зоны покрытия» на странице доставки.**

```html
<section class="delivery-map-section">
  <div class="container">
    <div class="delivery-section-head">
      <h2>Зоны покрытия Оренбурга</h2>
      <p>Наведите на зону, чтобы увидеть доступный интервал доставки</p>
    </div>
    <div class="delivery-map-layout">
      <div class="delivery-map-board" id="deliveryMapBoard">
        <div class="delivery-leaflet-map" id="deliveryLeafletMap" aria-label="Карта зон доставки"></div>
      </div>
      <div class="delivery-zone-list" id="deliveryZoneList">
        <article class="delivery-zone-item is-active">
          <div class="zone-dot"></div>
          <div>
            <h3>Интервалы доставки</h3>
            <p>Утро: <strong>9:00-14:00</strong>, День: <strong>14:00-17:00</strong>, Вечер: <strong>17:00-21:00</strong></p>
          </div>
        </article>
      </div>
    </div>
  </div>
</section>
```

---

**Рисунок 23 — Шаблон «О компании» (`about.html`).**

Экран с миссией компании, пошаговым описанием подготовки воды (**`#aboutSteps`**, переключаемые шаги в **`script.js`**) и блоком сертификатов. Полный текст и скриншот — см. п. **4.1.2**.

---

**Рисунок 24 — Шаблон каталога (`catalog.html`).**

Герой-блок каталога, фильтры категорий, сетка товаров, модальные окна подробностей для позиций под заказ. Полный текст и скриншот — см. п. **4.1.3**.

---

**Рисунок 25 — Раздел блога: «Истории» и лента (`community.html`, `community.js`).**

Клиент **`community.js`** собирает набор историй (**`getStories()`**), рисует кнопки в **`#blogStories`**, при выборе открывает модальное окно; лента постов выводится в **`#blogFeed`**. Контент ведётся через **`manager.html`**.

```javascript
function renderStories() {
  const root = document.getElementById('blogStories');
  if (!root) return;
  const stories = getStories();
  const shortLabel = (value) => {
    const text = String(value || '').trim().replace(/\s+/g, ' ');
    if (text.length <= 32) return text;
    return `${text.slice(0, 31).trimEnd()}…`;
  };
  root.innerHTML = stories.map(
    (story, idx) => `
      <button type="button" class="blogv2-story" data-story-index="${idx}">
        <span class="blogv2-story-ring ${escapeHtml(story.ring || '')}">
          <span class="blogv2-story-inner ${escapeHtml(story.mood || '')}" style="--story-thumb:url('${escapeHtml(story.thumb || story.image || 'assets/popular-1.png')}')">
          </span>
        </span>
        <span>${escapeHtml(shortLabel(story.title))}</span>
      </button>
    `
  ).join('');
}
```

Скриншот **рис. 25** — вид **`community.html`** с блоком историй и лентой постов после загрузки сценариев.

---

## 4.3 Реализация динамических элементов сайта

В этом подразделе перечислены **основные функции**, которые на стороне браузера меняют содержимое страницы или обмениваются данными с сервером без полной перезагрузки интерфейса. Для каждой функции дано **название**, **краткое описание** и **фрагмент кода** из репозитория ЭкваЛайн (при необходимости сжатый для читаемости).

---

### Клиент запросов к серверу (`EkvalineAPI`)

**Описание:** при открытии сайта через узел приложения подключается **`api-client.js`**. Перед операциями изменения данных подставляется защитный признак (**CSRF**); при ошибке признака выполняется повторный запрос. При смене идентификатора запуска сервера очищается локальное «запоминание» входа и страница обновляется, чтобы состояние сессии совпало с сервером.

```javascript
async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    let t = await ensureCsrf(false);
    if (!t) t = await ensureCsrf(true);
    if (t) headers['X-CSRF-Token'] = t;
  }
  /* … подготовка тела как JSON при необходимости … */
  return fetch(path, { ...options, credentials: 'same-origin', headers });
}

async function reconcileServerBoot() {
  const r = await fetch('/api/client-boot', { credentials: 'same-origin' });
  /* при новом bootId после перезапуска сервера — очистка localStorage и reload */
}
window.EkvalineAPI = { ensureCsrf, resetCsrf, fetch: apiFetch, json: apiJson };
```

*Файл:* `api-client.js`.

---

### Модальное окно входа и регистрации

**Описание:** сценарий в **`script.js`** вставляет в документ модальное окно с вкладками «Вход» и «Регистрация», проверяет поля и обращается к **`/api/auth/login`** и **`/api/auth/register`**. Для полей пароля предусмотрена кнопка переключения видимости символов.

```javascript
function wireAuthPasswordToggle(toggleBtn, input) {
  if (!(toggleBtn instanceof HTMLButtonElement) || !(input instanceof HTMLInputElement)) return;
  function syncUi() {
    const visible = input.type === 'text';
    toggleBtn.classList.toggle('is-visible', visible);
    toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
  }
  toggleBtn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    syncUi();
  });
  syncUi();
}
```

*Файл:* `script.js` (инициализация авторизации и кабинета).

---

### Плавающая корзина и пересчёт суммы

**Описание:** состав корзины хранится в **`localStorage`** под ключом товарных позиций. При нажатии «В корзину» обновляется счётчик на кнопке, список в модальном окне и итоговая сумма; доступны операции изменения количества и удаления строки.

```javascript
cartItemsList.innerHTML = items
  .map(
    (item) => `
    <article class="cart-item">
      …
      <button type="button" data-cart-minus="${item.id}">−</button>
      <button type="button" data-cart-plus="${item.id}">+</button>
      <button type="button" data-cart-remove="${item.id}">Удалить</button>
    </article>`
  )
  .join('');
cartTotalPrice.textContent = `${total} ₽`;
```

*Файл:* `script.js` (блок корзины и оформления заказа).

---

### Оформление заказа (проверка полей и сохранение заявки)

**Описание:** при отправке формы **`checkoutForm`** выполняются проверки адреса (в т.ч. этаж и подъезд при указании квартиры), даты, интервала и длины комментария. Заявка добавляется в локальный список заказов пользователя, корзина очищается, показывается краткое уведомление. Заказы, видимые в **полном кабинете** с сервером (**`cabinet-pg.js`**), синхронизируются через **`/api/orders`** отдельно.

```javascript
checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const user = readCurrentUser();
  if (!user || user.role === 'manager') return;
  const items = readCart();
  if (!items.length) return;

  const address = String(checkoutForm.elements.namedItem('address')?.value || '').trim();
  const deliverySlot = …;
  const apartmentAddressValid = hasApartment ? hasFloor && hasEntrance : true;
  if (!address || !deliverySlot || !apartmentAddressValid) {
    showAppToast('Проверьте поля: адрес на карте, дату и интервал…', 'error');
    return;
  }
 
});
```

*Файл:* `script.js`.

---

### Калькулятор потребления воды на главной странице

**Описание:** ползунок **`#peopleRange`** и кнопки сценария (**питьё / готовка / активность / сезон**) обновляют внутреннее состояние и пересчитывают литры в день, бутыли в месяц, ориентировочную сумму по тарифам и заполняют подсказки в блоке **`#calcPlan`**.

```javascript
function updateCalc() {
  const isDrinking = state.usage === 'drink' || state.usage === 'both';
  const baseDrinkPerPerson = 2;
  const activityFactor = isDrinking ? activityMultiplier[state.activity] : 1;
  const seasonFactor = isDrinking ? seasonMultiplier[state.season] : 1;
  const dailyDrinkLiters =
    isDrinking ? state.people * baseDrinkPerPerson * activityFactor * seasonFactor : 0;
  peopleValue.textContent = String(state.people);
  litersValue.textContent = formatDecimal(dailyForDisplay);
  bottlesValue.textContent = `${monthlyBottles} шт`;
  bottleWater.style.height = `${waterPercent}%`;
}

peopleRange.addEventListener('input', (event) => {
  state.people = Number(event.target.value);
  updateCalc();
});
```

*Файл:* `script.js`.

---

### Форма обратной связи на главной («Остались вопросы»)

**Описание:** перед отправкой проверяются имя, телефон в виде одиннадцати цифр с кодом страны «7», длина сообщения и отсутствие опасных символов. Успешная отправка — запрос **`POST /api/feedback`** через **`EkvalineAPI.json`** и показ модального окна успеха.

```javascript
callbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();


  const result = await window.EkvalineAPI.json('/api/feedback', {
    method: 'POST',
    body: { name: cbName.value, phone: phoneDigits, message: cbMessage.value },
  });

  if (!result.ok) { return; }

  callbackForm.reset();
  openSuccessModal();
});
```

*Файл:* `script.js`.

---

### Фильтр каталога по категориям товара

**Описание:** на **`catalog.html`** кнопки **`data-category`** скрывают или показывают карточки по атрибуту **`full-catalog-card`**, активная кнопка подсвечивается классом **`active`**.

```javascript
function applyCatalogFilter(category) {
  catalogCards.forEach((card) => {
    const isVisible = category === 'all' || card.dataset.category === category;
    card.classList.toggle('is-hidden', !isVisible);
  });
}
```

*Файл:* `script.js`.

---

### Вкладки вопросов на странице доставки

**Описание:** список кнопок с атрибутами **`data-faq-question`**, **`data-faq-answer`** и др. задаёт активное состояние и подставляет текст в боковую карточку ответа.

```javascript
function setActiveFaq(button) {
  faqButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
  faqTitle.textContent = button.dataset.faqQuestion || '';
  faqText.textContent = button.dataset.faqAnswer || '';
  if (faqBadge) faqBadge.textContent = button.dataset.faqTag || 'Инфо';
}
faqButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveFaq(button));
});
```

*Файл:* `script.js`.

---

### Карта Leaflet на странице «Доставка»

**Описание:** создаётся объект карты в контейнере **`deliveryLeafletMap`**, подключаются тайлы **OpenStreetMap**, центр — координаты Оренбурга.

```javascript
if (deliveryLeafletMap && window.L) {
  const map = L.map(deliveryLeafletMap, { zoomControl: true, scrollWheelZoom: true }).setView(
    [51.768, 55.102],
    12
  );
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
}
```

*Файл:* `script.js` (страница подключает библиотеку **`leaflet.js`** в **`delivery.html`**).

---

### Пошаговый блок «О компании»

**Описание:** клавиатура и мышь переключают **`data-step`** у кнопок и синхронно показывают панель **`about-step-panel`**, заполняется полоса прогресса.

```javascript
function setActiveAboutStep(stepId) {
  stepButtons.forEach((button) =>
    button.classList.toggle('is-active', button.dataset.step === stepId)
  );
  stepPanels.forEach((panel) =>
    panel.classList.toggle('is-active', panel.dataset.stepPanel === stepId)
  );
 
}
```

*Файл:* `script.js`.

---

### Блок «Истории» на странице блога

**Описание:** функция **`renderStories`** собирает разметку кнопок с миниатюрой и заголовком, привязанным к данных историй (**`community.js`**).

```javascript
function renderStories() {
  const root = document.getElementById('blogStories');
  const stories = getStories();
  root.innerHTML = stories
    .map(
      (story, idx) => `
      <button type="button" class="blogv2-story" data-story-index="${idx}"> … </button>`
    )
    .join('');
}
```

*Файл:* `community.js`.

---

### Трекер воды на странице блога

**Описание:** значение литров за день и ширина заливки индикатора обновляются при добавлении порции воды пользователем; возможна подсветка превышения нормы.

```javascript
function renderHydration() {
  const normalized = Math.max(0, Math.min(HYDRATION_MAX, state.water));
  valueEl.textContent = normalized.toFixed(1);
  const percent = Math.min(100, Math.round((normalized / DAILY_TARGET) * 100));
  fillEl.style.width = `${percent}%`;
}
```

*Файл:* `community.js`.

---

###


```javascript
function renderNotificationsPanel(wrap, dropdown) {
  const list = Api.getNotifications();
  const unread = Api.unreadCount();
  wrap.querySelector('.notif-bell-badge').style.display = unread > 0 ? 'inline-flex' : 'none';
  wrap.querySelector('.notif-bell-badge').textContent = unread > 9 ? '9+' : String(unread);

  if (!list.length) {
    dropdown.innerHTML = '<p class="notif-empty">Пока нет уведомлений</p>';
    return;
  }
  /* разметка списка из list; по клику — Api.markNotificationRead и повторный вызов */
}
```

Входная точка интерфейса: **`initNotificationsUI(mountEl)`** создаёт колокольчик и привязывает **`renderNotificationsPanel`**.

*Файл:* `app-core.js`, вызов из **`script.js`** через **`EkvalineApp.initNotificationsUI`**.

---

### Кнопка «Наверх»

**Описание:** по прокрутке страницы появляется кнопка; по щелчку выполняется плавный скролл к началу документа.

```javascript
window.addEventListener('scroll', updateVisibility, { passive: true });
button.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

*Файл:* `script.js` (инициализатор **`initBackToTopButton`**).

---

### Полноэкранный личный кабинет клиента (`cabinet-pg.js`)

**Описание:** при открытии **`cabinet.html`** запрос **`GET /api/auth/me`** проверяет сессию; при отсутствии пользователя — переход на главную. При успехе профиль заполняется данными сервера, список заказов загружается методом **`/api/orders/my`**.

```javascript
async function bootstrap() {
  const me = await api.json('/api/auth/me');
  if (!me.ok || !me.data?.user) {
    clearCurrentUser();
    window.location.href = 'index.html?need-login=1';
    return;
  }
  currentUser = me.data.user;
  renderProfile(currentUser);
  await reloadOrders(); /* GET /api/orders/my */
}
bootstrap();
```

*Файл:* `cabinet-pg.js`.

---

**Итог по проекту:** реализованы витрина (**главная, каталог, доставка с картой, контакты, блог**), **личный кабинет** клиента (**`cabinet.html`**, данные профиля и заказов с сервера), рабочие экраны **оператора, водителя, менеджера блога и администратора**, единые правила оформления и обмен данными через **`EkvalineAPI`** в **`api-client.js`** (сессия и защитный признак запросов). Раздел **4.3** фиксирует основную клиентскую динамику; дополнительно панели **оператора, водителя и администратора** содержат собственные сценарии **`operator.js`**, **`driver.js`**, **`admin.js`**. Перечень маршрутов на сервере — в **`server.js`**; учётные записи для проверки — **`docs/DEMO_PASSWORDS.md`**.

---

*Исходные файлы интерфейса — в корне репозитория (`*.html`), стили — `styles.css`, сервер — `server.js`; динамика витрины и общих форм — `script.js`, `app-core.js`, `api-client.js`; блог — `community.html`, `community.js`; кабинет — `cabinet-pg.js`.*
