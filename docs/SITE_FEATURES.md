# Документация по функциям сайта ЭкваЛайн

Файл описывает, как устроены калькулятор потребления, каталог и фильтрация, оформление заказа (при наличии в разметке), регистрация/вход, шапка и роли, форма обратной связи, а также **серверный API** (`server.js`), **клиент API** (`api-client.js`), **общие данные в браузере** (`app-core.js`) и страницы персонала. В конце — **справочник эндпоинтов**, интерактив каталога, страницы «О компании»/«Контакты», детали **сообщества, уведомлений, менеджерского контента**, **инфраструктуры Express**, **Joi-схем** и **SQLite/сида**. Клиентская логика — в основном в `script.js`; разметка — в `index.html`, `catalog.html`, `delivery.html`, `community.html` и др.

---

## 1. Калькулятор потребления воды (главная страница)

**Где:** секция `#water-calc` в `index.html`, логика в `script.js` (блок после проверки наличия элементов `peopleRange`, `bottleWater` и т.д.).

### Назначение

По числу человек, сценарию использования (только питьё / только готовка / оба), активности и сезону рассчитываются:

- суточный объём воды (л/день) для отображения в «бутылке»;
- месячный объём с запасом 10%;
- число бутылей 19 л в месяц;
- приблизительная частота заказов;
- **оценка месячной стоимости** при разных тарифах за бутыль: 220 ₽ (1 шт), 190 ₽ (2–4), 175 ₽ (5+);
- выбор «выгодного» плана по минимальной сумме.

### Идея расчёта

1. **Питьё:** на человека базово 2 л/сутки, умножается на множители активности (`low/medium/high`) и сезона (`winter`, `spring-autumn`, `summer`), если учитывается питьё.
2. **Готовка:** при сценариях с готовкой добавляется ~0,8 л/день на человека.
3. **Месяц:** `dailyLiters * 30`, затем ×1,1 (запас).
4. **Бутыли:** `ceil(месячный_литраж_с_запасом / 19)`.
5. **Высота «воды» в графике:** завязана на суточный литраж (ограничение 24–80%).
6. **Цвет воды по сезону:** классы `season-winter`, `season-spring-autumn`, `season-summer` на элементе `#bottleWater` (при режиме «только готовка» активность/сезон для питья отключаются).

### Код (`script.js`, блок калькулятора после проверки DOM-элементов)

Константы тарифов каталога и динамическое программирование для оптимального плана доставки:

```javascript
const CATALOG_PRICE_SINGLE = 220;
const CATALOG_PRICE_BULK_BEST = 175;
const CATALOG_PRICE_BULK_ALT = 190;
const CATALOG_MAX_BULK_ALT = 4;
const CATALOG_MAX_BULK_BEST = 5;

function optimalDeliveryPlan(bottleCount, bulkPerBottle, maxBulkOverride) {
  if (bottleCount <= 0) return { total: 0, orders: [] };
  let maxBulk = maxBulkOverride;
  if (maxBulk == null) {
    maxBulk = bulkPerBottle === CATALOG_PRICE_BULK_ALT ? CATALOG_MAX_BULK_ALT : CATALOG_MAX_BULK_BEST;
  }
  const dp = new Array(bottleCount + 1).fill(Infinity);
  const lastTake = new Array(bottleCount + 1).fill(1);
  dp[0] = 0;
  for (let i = 1; i <= bottleCount; i += 1) {
    let best = dp[i - 1] + CATALOG_PRICE_SINGLE;
    let take = 1;
    for (let k = 2; k <= maxBulk && k <= i; k += 1) {
      const candidate = dp[i - k] + k * bulkPerBottle;
      if (candidate < best) {
        best = candidate;
        take = k;
      }
    }
    dp[i] = best;
    lastTake[i] = take;
  }
  const orders = [];
  for (let i = bottleCount; i > 0; ) {
    const t = lastTake[i];
    orders.push(t);
    i -= t;
  }
  orders.reverse();
  return { total: dp[bottleCount], orders };
}
```

Фрагмент расчёта суточного/месячного объёма и обновления подписей (внутри `updateCalc`):

```javascript
const isDrinking = state.usage === 'drink' || state.usage === 'both';
const isCooking = state.usage === 'cook' || state.usage === 'both';
const baseDrinkPerPerson = 2;
const activityFactor = isDrinking ? activityMultiplier[state.activity] : 1;
const seasonFactor = isDrinking ? seasonMultiplier[state.season] : 1;
const dailyDrinkLiters =
  isDrinking ? state.people * baseDrinkPerPerson * activityFactor * seasonFactor : 0;
const cookPerPerson = 0.8;
const householdReserveLiters = isCooking ? state.people * cookPerPerson : 0;
const dailyLiters = dailyDrinkLiters + householdReserveLiters;
const monthlyLiters = dailyLiters * 30;
const monthlyWithReserve = monthlyLiters * 1.1;
const monthlyBottles = Math.max(1, Math.ceil(monthlyWithReserve / 19));
```

Полная функция `updateCalc`, привязка `peopleRange` и `.option-btn` — в `script.js` (начало блока с `peopleRange`).

---

## 2. «Фильтрация» на главной странице

**Важно:** на **главной** (`index.html`) блок «Каталог» — это **статичная сетка из трёх карточек** без кнопок фильтрации. Пользователь видит три варианта цен (1 бутыль / 2–4 / 5+) и ссылки «Подробнее» на полный каталог.

Фильтрация по категориям реализована на странице **`catalog.html`**, а не на главной.

### Пример разметки трёх карточек (`index.html`, секция `.catalog`)

```html
<section class="catalog">
  <div class="container">
    <div class="catalog-grid">
      <article class="catalog-card">
        <!-- изображение, .catalog-type, h3, .catalog-bottom с .catalog-price и .cart-btn + data-product-* -->
      </article>
    </div>
  </div>
</section>
```

---

## 3. Фильтрация в каталоге (`catalog.html`)

**Разметка:** контейнер `#catalogFilters` с кнопками `.catalog-filter-btn` и атрибутом `data-category` (`all`, `water`, `accessories`, `equipment`). Карточки — `.full-catalog-card` с `data-category`.

**Логика:** при клике активная кнопка подсвечивается; для каждой карточки проверяется совпадение категории с выбранной или `all`. Неподходящие карточки получают класс `is-hidden` (в CSS `display: none`). Для появляющихся карточек запускается короткая анимация opacity/transform.

### Код

```javascript
if (catalogFilters && catalogCards.length > 0) {
  const filterButtons = Array.from(catalogFilters.querySelectorAll('.catalog-filter-btn'));

  function applyCatalogFilter(category) {
    catalogCards.forEach((card) => {
      const isVisible = category === 'all' || card.dataset.category === category;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) {
        card.animate(
          [
            { opacity: 0, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 280, easing: 'ease-out' }
        );
      }
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

---

## 4. Оформление заказа (каталог)

**Где:** блок в `script.js` помечен как `/* ── Catalog cart + checkout ── */`. Он выполняется только если в DOM есть **`#checkoutModal`**, **`#floatingCartBtn`** и **`#floatingCartCount`** (типично на `catalog.html` с полным чекаутом).

### Поток

1. **Добавление в корзину** — кнопки `.catalog-add-btn` и `.catalog-card .cart-btn` с `data-product-id`, `data-product-name`, `data-product-price`. Для карточек воды (`id` начинается с `water-`) позиция сводится к **`water-19l`** с флагом `isWater`, чтобы пересчитывать цену по объёму (220 / 190 / 175 ₽ за шт). На кнопку вешается короткая анимация **ripple** (`animateButtonRipple`).
2. **Корзина** — `localStorage`, ключ **`ekvaline_checkout_cart`** (массив позиций с `id`, `name`, `price`, `qty`, опционально `isWater`).
3. **Окно оформления** — форма `#checkoutOrderForm`: состав заказа, имя, телефон, адрес (вручную или выбор из справочника), дата (сегодня…+14 дней), интервалы доставки, оплата (карта / наличные), комментарий (склеивается с адресом до 500 символов).
4. **Слоты и адреса из БД** — при старте вызывается **`GET /api/public/checkout-options`**: массив `deliverySlots` (как настроил менеджер) и список **`addresses`** для выпадающего `#checkoutAddressPreset`. Без сервера остаются запасные слоты в коде.
5. **Отправка с сервером:** пользователь должен быть **вошёл в аккаунт** (`ekvaline_current_user` с `id`). Корзина маппится на **`product_id`** из **`GET /api/products`** (`buildOrderItemsFromCart`, таблица `CHECKOUT_SLUG_TO_DB_NAME` для slug → имя товара в БД). Затем **`POST /api/orders`** с телом заказа; при успехе обновляется `ekvaline_current_user` (бонусы), корзина очищается.
6. **Без входа или без API** — показывается сообщение с «локальной» заявкой и подсказкой про `npm start` / вход.

### Цена воды в корзине

```javascript
function getEffectiveUnitPrice(item) {
  if (!item.isWater) return item.price;
  if (item.qty >= 5) return 175;
  if (item.qty >= 2) return 190;
  return 220;
}

function getLineTotal(item) {
  return getEffectiveUnitPrice(item) * item.qty;
}
```

### Валидация заявки (фрагмент)

Проверяются: непустая корзина, имя, телефон в формате +7, длина адреса, попадание в зону, дата, слот, выбран способ оплаты.

### Код: опции чекаута и отправка на сервер (`script.js`)

Подгрузка слотов и справочника адресов:

```javascript
async function loadCheckoutOptions() {
  try {
    const r = await fetch('/api/public/checkout-options');
    if (!r.ok) return;
    const data = await r.json();
    if (Array.isArray(data.deliverySlots) && data.deliverySlots.length) {
      effectiveDeliverySlots = data.deliverySlots;
    }
    addressPresetList = Array.isArray(data.addresses) ? data.addresses : [];
    if (checkoutAddressPreset) {
      checkoutAddressPreset.innerHTML =
        '<option value="">Выберите из справочника или введите вручную</option>';
      addressPresetList.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = String(a.id);
        opt.textContent = a.label || a.address_line;
        checkoutAddressPreset.appendChild(opt);
      });
    }
  } catch {
    /* офлайн или статика без сервера */
  }
  renderSlots();
}
```

Сбор `items` для API и создание заказа (фрагмент обработчика `submit`):

```javascript
async function buildOrderItemsFromCart(cart) {
  const API_CLIENT = window.EkvalineAPI;
  if (!API_CLIENT) return { err: 'Сервер недоступен...', items: null };
  const { ok, data } = await API_CLIENT.json('/api/products');
  if (!ok || !data.products || !data.products.length) {
    return { err: 'Не удалось загрузить каталог с сервера.', items: null };
  }
  const products = data.products;
  const raw = [];
  for (const line of cart) {
    const pid = matchCartLineToProductId(line, products);
    if (!pid) {
      return { err: `Товар «${line.name || line.id}» не найден в каталоге.`, items: null };
    }
    raw.push({ product_id: pid, qty: line.qty });
  }
  return { err: null, items: mergeOrderItems(raw) };
}

checkoutOrderForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateOrderForm()) return;
  const user = readCheckoutSessionUser();
  if (window.EkvalineAPI && user && user.id) {
    const { err, items } = await buildOrderItemsFromCart(state.cart);
    if (err) {
      checkoutOrderError.textContent = err;
      return;
    }
    const body = {
      address: combineAddressAndComment(checkoutAddress.value, comment),
      delivery_date: checkoutDate.value,
      delivery_slot: checkoutTimeSlot.value,
      payment_method: pay && pay.value === 'card' ? 'card' : 'cash',
      bonuses_used: 0,
      items,
    };
    const { ok, data } = await window.EkvalineAPI.json('/api/orders', { method: 'POST', body });
    window.EkvalineAPI.resetCsrf();
    /* при ok: обновить user в localStorage, очистить корзину */
    return;
  }
  /* иначе — локальное сообщение с номером заявки */
});
```

Добавление в корзину по кнопке (вода `water-*` → одна позиция):

```javascript
function getProductFromButton(button) {
  const id = button.dataset.productId;
  const name = button.dataset.productName;
  const price = Number(button.dataset.productPrice);
  const isWaterCard = typeof id === 'string' && id.startsWith('water-');
  if (isWaterCard) {
    return { id: 'water-19l', name: 'Вода 18.9л', price: 220, isWater: true };
  }
  if (id && name && Number.isFinite(price)) {
    return { id, name, price, isWater: false };
  }
  /* fallback из .full-catalog-card / .catalog-card */
}
```

**Интерактив карточек каталога** (тот же файл, выше блока корзины): на `mousemove` по `.full-catalog-card` задаётся лёгкий **3D-nаклон** (`rotateX` / `rotateY`), на `mouseleave` сброс `transform`.

---

## 5. Регистрация и вход

**Где:** `initAuthAndCabinet()` в начале `script.js`. Модальное окно вставляется в DOM через `insertAdjacentHTML`: формы `#authLoginForm` и `#authRegisterForm`. На страницах подключаются `api-client.js` (объект `window.EkvalineAPI`) и `script.js`.

### Два режима

1. **С сервером (основной):** подключён `api-client.js`, запущен `server.js` (`npm start`), сайт открыт по **`http://localhost:PORT`** (по умолчанию **3001**). Вход и регистрация идут через **REST + SQLite + сессия cookie**; пароли на сервере хэшируются **bcrypt**. Подробнее — разделы **7–9** ниже.

2. **Без сервера (резерв):** если глобального `EkvalineAPI` нет (скрипт не подключён), используются **`localStorage`**: список пользователей `ekvaline_users`, текущий сеанс `ekvaline_current_user`, проверка пароля через **bcryptjs** (CDN на страницах с формой).

### Вход (ветка с API)

- Поле «телефон или email» отправляется как `credential`; на сервере ищется пользователь по email (без учёта регистра) или по телефону (11 цифр, начинается с 7).
- Запрос: `POST /api/auth/login` с телом `{ credential, password }`, заголовок **`X-CSRF-Token`** (см. раздел **8**).
- Успех: в ответе `{ user: { id, email, phone, name, role, bonus_balance, … } }`; данные пишутся в `ekvaline_current_user`, шапка показывает ссылки **Оператор / Менеджер / Админ** по роли.
- Ошибки: **401** — неверный логин или пароль; **403** — заблокированный аккаунт или проблема CSRF; **423** — временная блокировка после неудачных попыток; сетевая ошибка — отдельное сообщение про `npm start`.

### Вход (ветка без API)

Поиск в `readUsers()` по email или нормализованному телефону, `verifyPassword` против сохранённого хэша. Сообщение «Неверные данные для входа.» при несовпадении.

### Регистрация

Клиентская валидация: имя/фамилия, email, телефон +7, **сильный пароль** (регистр, цифра, спецсимвол, длина по схеме в `script.js`). С сервером — `POST /api/auth/register`; без сервера — запись в массив `ekvaline_users` и роль `client`.

### Код (`script.js`, внутри `initAuthAndCabinet`)

Вход через API:

```javascript
authLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const credential = authLoginValue.value.trim();
  const password = authLoginPassword.value;
  if (API) {
    const result = await API.json('/api/auth/login', {
      method: 'POST',
      body: { credential, password },
    });
    if (!result.ok) {
      return;
    }
    if (!result.data || !result.data.user) return;
    API.resetCsrf();
    saveCurrentUser({  });
    updateHeaderAuth();
    closeAuthModal();
    if (/manager\.html$|operator\.html$|admin\.html$/i.test(window.location.pathname)) {
      window.location.reload();
      return;
    }
    openCabinet();
    return;
  }
  /* ветка без API: readUsers(), verifyPassword */
});
```

Регистрация через API (после проверок `isStrongPassword` и т.д.):

```javascript
await API.json('/api/auth/register', {
  method: 'POST',
  body: { first_name, last_name, email, phone, password },
});
```

### Шапка после входа: `updateHeaderAuth()`

По `localStorage` (`ekvaline_current_user`) переключаются кнопки **Вход / Регистрация**, триггер **личного кабинета**, ссылки **Оператор / Менеджер / Админ** и класс `staff-user-logged-in` на `body`:

```javascript
function updateHeaderAuth() {
  const user = readCurrentUser();
  const isLoggedIn = Boolean(user);
  document.querySelectorAll('[data-auth-login]').forEach((el) => {
    if (el.closest('.staff-sidebar') || el.closest('.staff-gate')) {
      el.hidden = isLoggedIn;
    } else {
      el.style.display = isLoggedIn ? 'none' : 'inline-flex';
    }
  });
  document.querySelectorAll('[data-auth-register]').forEach((el) => {
    el.style.display = isLoggedIn ? 'none' : 'inline-flex';
  });
  if (cabinetTrigger) {
    cabinetTrigger.style.display = isLoggedIn ? 'inline-flex' : 'none';
  }
  const mLink = document.getElementById('managerNavLink');
  if (mLink) {
    const show = Boolean(user && (user.role === 'manager' || user.role === 'admin'));
    mLink.classList.toggle('hidden', !show);
  }
  const oLink = document.getElementById('operatorNavLink');
  if (oLink) {
    const show = Boolean(user && ['operator', 'manager', 'admin'].includes(user.role));
    oLink.classList.toggle('hidden', !show);
  }
  const aLink = document.getElementById('adminNavLink');
  if (aLink) {
    aLink.classList.toggle('hidden', !user || user.role !== 'admin');
  }
}
```

Клики по `[data-auth-login]` / `[data-auth-register]` вне модалки открывают окно авторизации (`openAuthModal`).

---

## 6. Форма обратной связи (главная)

**Файлы:** `index.html` (разметка формы и модального окна успеха), `script.js` (блок `/* ── Callback form ── */`).

### Поведение

- Маска/нормализация телефона при вводе, счётчик символов сообщения (`maxlength` на стороне разметки согласован с `script.js`, сейчас до **2000** символов).
- Валидация: имя, телефон +7, сообщение (минимум 4 символа при работе с сервером в актуальном коде).
- При наличии **`EkvalineAPI`**: `POST /api/feedback` с `{ name, phone, message }`, затем `resetCsrf()` и модалка успеха.
- Без сервера: задержка и открытие `#callbackModal` без отправки на бэкенд.

### Разметка (`index.html`)

Секция с формой и блок контактов слева; ниже по разметке — модалка «Заявка отправлена».

```html
<section class="callback-section" id="callback">
  <div class="container">
    <div class="callback-inner">
      <!-- левая колонка: заголовок и контакты (cb-left) ... -->

      <div class="cb-right">
        <form class="callback-form" id="callbackForm" novalidate>
          <div class="cb-row">
            <div class="field-wrap">
              <label for="cbName">ИМЯ</label>
              <input type="text" id="cbName" name="name" placeholder="Иван" autocomplete="name" maxlength="40" />
              <span class="field-error" id="cbNameError"></span>
            </div>
            <div class="field-wrap">
              <label for="cbPhone">ТЕЛЕФОН</label>
              <input type="tel" id="cbPhone" name="phone" placeholder="+7 (___) ___-__-__" autocomplete="tel" maxlength="18" />
              <span class="field-error" id="cbPhoneError"></span>
            </div>
          </div>
          <div class="field-wrap">
            <label for="cbMessage">СООБЩЕНИЕ</label>
              <textarea id="cbMessage" name="message" placeholder="Ваш вопрос..." rows="4" maxlength="2000"></textarea>
              <span class="field-hint" id="cbMessageCount">0/2000</span>
            <span class="field-error" id="cbMessageError"></span>
          </div>
          <button type="submit" class="cb-submit-btn">
            Отправить
            <svg width="16" height="16" viewBox="0 0 24 24" ...>...</svg>
          </button>
          <p class="cb-success" id="cbSuccess" aria-live="polite"></p>
        </form>
      </div>
    </div>
  </div>
</section>

<div class="cb-modal" id="callbackModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="callbackModalTitle">
  <div class="cb-modal-overlay" data-close-modal="true"></div>
  <div class="cb-modal-card" role="document">
    <button type="button" class="cb-modal-close" id="callbackModalClose" aria-label="Закрыть окно">×</button>
    <h3 id="callbackModalTitle">Заявка отправлена</h3>
    <p>Спасибо! Мы получили ваши данные и свяжемся с вами в течение 15 минут.</p>
    <button type="button" class="cb-modal-btn" id="callbackModalOk">Понятно</button>
  </div>
</div>
```

### JavaScript (`script.js`, блок `/* ── Callback form ── */`)

Отправка при наличии API:

```javascript
callbackForm.addEventListener('submit', (e) => {
  e.preventDefault();
  /* валидация имени, phoneDigits, сообщения 4–2000 символов */
  const send = async () => {
    if (window.EkvalineAPI) {
      const { ok, data } = await window.EkvalineAPI.json('/api/feedback', {
        method: 'POST',
        body: { name: cbName.value, phone: phoneDigits, message: cbMessage.value },
      });
      if (!ok) {
        cbMessageError.textContent = data.error || 'Не удалось отправить...';
        return;
      }
      window.EkvalineAPI.resetCsrf();
      callbackForm.reset();
      updateMessageCount();
      openSuccessModal();
      return;
    }
    setTimeout(() => {
      callbackForm.reset();
      openSuccessModal();
    }, 600);
  };
  void send();
});
```

Счётчик: `cbMessageCount.textContent = \`${cbMessage.value.length}/2000\``. Стили: `.callback-section`, `.callback-form`, `.cb-modal` в `styles.css`.

---

## 7. Запуск backend (Express + SQLite)

**Назначение:** единая точка для статики сайта и **JSON API** (авторизация, заказы, обратная связь, настройки, админка).

### Как запустить

- В корне проекта: **`npm start`** (или `node server.js`).
- По умолчанию порт **`3001`** (переопределение: переменная окружения `PORT`).
- База: файл **`data/ekvaline.sqlite`** (встроенный модуль `node:sqlite` в Node 22+). При **пустой** таблице `users` выполняется **сид** демо-персонала и товаров (`db.js`).

### Демо-учётные записи (из сида)

| Роль | Email | Пароль |
|------|--------|--------|
| Администратор | `admin@ekvaline.demo` | `AdminEkva2026!` |
| Менеджер | `manager@ekvaline.demo` | `ManagerEkva2026!` |
| Оператор | `operator@ekvaline.demo` | `OperatorEkva2026!` |

### Важно про URL

Сайт нужно открывать по адресу из консоли при старте (**`http://localhost:3001`**). Если открыть HTML через **Live Server**, **двойной щелчок по файлу** (`file://`) или другой хост без API, запросы к `/api/...` могут вернуть **HTML с кодом 200** вместо JSON — формы входа и отправки не сработают. Клиент **`api-client.js`** помечает такой ответ как ошибку и показывает подсказку про `npm start`.

### Код

`package.json`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

Фрагмент `server.js` (запуск):

```javascript
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`ЭкваЛайн: http://localhost:${PORT}`);
});
```

Инициализация БД в начале файла: `const db = openDatabase();` (`db.js`).

---

## 8. Клиент API, CSRF и JSON

**Файл:** `api-client.js`, глобальный объект **`window.EkvalineAPI`**.

### Поведение

1. Перед **POST/PATCH/PUT** (всё, кроме GET/HEAD) вызывается **`ensureCsrf`**: запрос **`GET /api/csrf`**, из ответа берётся `csrfToken` и кэшируется.
2. Мутирующие запросы отправляются с заголовком **`X-CSRF-Token`** и **`credentials: 'same-origin'`** (cookie сессии).
3. Функция **`json(path, options)`** выполняет `fetch`, читает тело как текст и парсит JSON. Если тело **не JSON** (например, пришла HTML-страница), результат помечается как **ошибка** с текстом про запуск через `node` и `localhost`.
4. После успешного входа/регистрации вызывается **`resetCsrf()`**, чтобы следующий запрос получил новый токен в связке с сессией.

### Код (`api-client.js` целиком)

```javascript
(function () {
  let csrfToken = null;
  async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    try {
      const r = await fetch('/api/csrf', { credentials: 'same-origin' });
      if (!r.ok) return null;
      const j = await r.json();
      csrfToken = j.csrfToken || null;
      return csrfToken;
    } catch {
      return null;
    }
  }
  function resetCsrf() {
    csrfToken = null;
  }
  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      const t = await ensureCsrf();
      if (t) headers['X-CSRF-Token'] = t;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const r = await fetch(path, { ...options, credentials: 'same-origin', headers });
    return r;
  }
  async function apiJson(path, options = {}) {
    const r = await apiFetch(path, options);
    const text = await r.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: r.status,
        data: { error: 'Ответ сервера не JSON...' },
      };
    }
    return { ok: r.ok, status: r.status, data };
  }
  window.EkvalineAPI = { ensureCsrf, resetCsrf, fetch: apiFetch, json: apiJson };
})();
```

---

## 9. Вход и регистрация через API (детали сервера)

**Файлы:** `server.js` (маршруты), `schemas.js` (валидация Joi), `db.js` (данные).

- Регистрация: **`POST /api/auth/register`** — тело с полями `first_name`, `last_name`, `email`, `phone`, `password`; при успехе сессия создаётся, ответ содержит `user`.
- Вход: **`POST /api/auth/login`** — поля `credential`, `password`; при успехе в сессии сохраняется `userId`.
- Выход: **`POST /api/auth/logout`**.
- Текущий пользователь: **`GET /api/auth/me`** — удобно для восстановления состояния после перезагрузки страницы.
- После нескольких неверных паролей возможен ответ **423** (временная блокировка входа).

### Код (`server.js`)

Регистрация: Joi → проверка занятости email/телефона → **bcrypt** → INSERT → сессия `userId` → `{ user }`.

```javascript
app.post('/api/auth/register', csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.registerSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { first_name, last_name, email, phone, password } = v.value;
  const exists = db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE OR phone = ?')
    .get(email, phone);
  if (exists) return res.status(409).json({ error: 'Email или телефон уже зарегистрированы.' });

  const password_hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, password_changed_at)
       VALUES (?, ?, ?, ?, ?, 'client', datetime('now'))`
    )
    .run(email, phone, password_hash, first_name, last_name || '');

  const user = getUserById(info.lastInsertRowid);
  req.session.userId = user.id;
  audit(db, user.id, 'register', `email=${email}`, req.ip);
  res.json({ user: publicUser(user) });
});
```

Вход: поиск по credential, блокировка, **423** при lockout, сравнение пароля, запись сессии:

```javascript
app.post('/api/auth/login', csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.loginSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { credential, password } = v.value;
  const user = findUserByCredential(credential);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль.' });
  if (user.blocked) return res.status(403).json({ error: 'Учётная запись заблокирована.' });
  if (isLocked(user)) {
    return res.status(423).json({
      error: 'Вход временно заблокирован после неудачных попыток. Попробуйте позже.',
    });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    recordLoginFail(user.id);
    return res.status(401).json({ error: 'Неверный логин или пароль.' });
  }

  recordLoginOk(user.id);
  req.session.userId = user.id;
  audit(db, user.id, 'login', '', req.ip);
  res.json({ user: publicUser(user) });
});
```

CSRF-токен для клиента:

```javascript
app.get('/api/csrf', (req, res) => {
  ensureCsrfSecret(req);
  res.json({ csrfToken: tokens.create(req.session.csrfSecret) });
});
```

Валидация тел и правил пароля — в `schemas.js` (`registerSchema`, `loginSchema`).

---

## 10. Личный кабинет

**Где:** модальное окно кабинета создаётся в `initAuthAndCabinet()`, разделы переключаются по клику (профиль, уведомления, текущие заказы, история).

### Профиль

- При наличии **`EkvalineAPI`** сохранение идёт на **`PATCH /api/profile`** с полями имени, email, телефона (после разбиения полного имени на `first_name` / `last_name` на клиенте).
- Без API используется **`saveProfileData`** в `localStorage`.

### Заказы

- Если **`window.EkvalineAPI`** есть: список загружается с **`GET /api/orders/my`**; отмена активного заказа — **`POST /api/orders/:id/cancel`** (для статусов вроде «в обработке» / «подтверждён»).
- Если API нет: в области заказов выводится текст-напоминание запустить **`npm start`** и открыть сайт по ссылке сервера.

Статусы заказов подписываются через объект **`ORDER_STATUS_LABELS`** в `script.js`.

### Код (`script.js`, внутри `initAuthAndCabinet`)

Загрузка заказов клиента:

```javascript
async function loadCabinetOrders(section, user) {
  if (!API) {
    host.innerHTML = '<p class="cabinet-muted">Для работы с заказами запустите сервер...</p>';
    return;
  }
  const { ok, data } = await API.json('/api/orders/my');
  let orders = data.orders || [];
  if (section === 'orders') {
    orders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  } else {
    orders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
  }
 
}
```

Профиль через API:

```javascript
await API.json('/api/profile', {
  method: 'PATCH',
  body: { first_name, last_name, email, phone },
});
```

---

## 11. Общие данные в браузере (`app-core.js`)

**Назначение:** **`window.EkvalineApp`** — уведомления, настройки «режим работы / слоты / текст сообщества», посты и опросы сообщества в **`localStorage`** (ключи с префиксом `ekvaline_`). При первом заходе вызывается **`seedIfNeeded`**: создаются стартовые уведомления, посты, опрос, дефолтные настройки.

- Событие **`ekvaline-storage`** диспатчится при записи в хранилище — им могут пользоваться UI-компоненты для обновления.
- Есть вспомогательные **`escapeHtml`**, форматирование времени и т.д.

При работе через **Express** публичные настройки дублируются/перекрываются данными с **`GET /api/public/settings`** на страницах, где это вызывается (например, **«Сообщество»**).

### Код (`app-core.js`)

Ключи и сид:

```javascript
const KEYS = {
  notifs: NS + 'notifications',
  posts: NS + 'community_posts',
  polls: NS + 'community_polls',
  settings: NS + 'site_settings',
  seeded: NS + 'data_seeded_v2',
};

function seedIfNeeded() {
  if (localStorage.getItem(KEYS.seeded)) return;
  writeJson(KEYS.notifs, [/* ... */]);
  writeJson(KEYS.settings, {
    workLine: '...',
    deliverySlots: ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'],
    communityIntro: '...',
  });
  localStorage.setItem(KEYS.seeded, '1');
}
```

`window.EkvalineApp` экспортирует `getNotifications`, `saveSettings`, `getPosts`, `getPolls`, и т.д.

---

## 12. Страница «Сообщество» (`community.html` + `community.js`)

**Идея:** лента постов в стиле соцсети, лайки, комментарии, опросы; время в ленте в «человеческом» виде (**«только что»**, **«N мин назад»**, **«вчера в …»**) через **`formatFeedTime`**. Подробная логика лайков/комментариев/опросов и синхронизации вкладок — в **разделе 20**.

- Для гостей используется стабильный ключ в **`sessionStorage`** (`ekvaline_guest_key`), чтобы различать анонимные лайки.
- Блоки с текстом графика работы и интервалов доставки могут заполняться из **`/api/public/settings`** (поля `workLine`, `deliverySlots`, `communityIntro`), если ответ сервера успешен; иначе остаются данные из **`EkvalineApp`** / localStorage.

### Код (`community.js`)

```javascript
function applySettingsPayload(s) {
  const intro = document.getElementById('communityIntro');
  const wl = document.getElementById('workLine');
  const sl = document.getElementById('deliverySlots');
  if (intro) intro.textContent = s.communityIntro || '';
  if (wl) wl.textContent = s.workLine || '—';
  if (sl) {
    const slots = s.deliverySlots || [];
    sl.innerHTML = slots.map((t) => `<li><span class="hours-pill">${E.escapeHtml(t)}</span></li>`).join('');
  }
}

async function renderSettings() {
  try {
    const r = await fetch('/api/public/settings', { credentials: 'same-origin' });
    if (r.ok) {
      const s = await r.json();
      let slots = s.deliverySlots;
      if (typeof slots === 'string') {
        try {
          slots = JSON.parse(slots);
        } catch {
          slots = [];
        }
      }
      applySettingsPayload({ ...s, deliverySlots: slots });
      E.saveSettings({ workLine: s.workLine || '', communityIntro: s.communityIntro || '', deliverySlots: Array.isArray(slots) ? slots : [] });
      return;
    }
  } catch {
    /* офлайн или без сервера */
  }
  const s = E.getSettings();
  applySettingsPayload(s);
}
```

---

## 13. Страница «Доставка» (`delivery.html`)

- Верхний блок (**`delivery-hero`**) — заголовок и краткая информация без обязательной картинки справа (вёрстка по центру в актуальной теме).
- Секция **«Зоны покрытия»**: интерактивная карта **`#deliveryMapBoard`** — SVG-зоны, подсветка при наведении/клике, подсказка **`#zoneTooltip`** с названием зоны и интервалом доставки.
- Логика переключения зон: в `script.js` блок с **`deliveryZoneList`**, **`zonePins`**, **`zoneAreas`**, **`delivery-zone-item`** — функция **`setActiveZone(zoneId)`** синхронизирует список, пины и области.

Нижний блок с формой «перезвоните мне» в этой ветке проекта может быть убран — ориентируйтесь на фактическую разметку `delivery.html`.

### Код (`script.js`, карта зон)

```javascript
function setActiveZone(zoneId) {
  const activeItem = zoneItems.find((item) => item.dataset.zone === zoneId);
  if (!activeItem) return;
  zoneItems.forEach((item) => item.classList.toggle('is-active', item.dataset.zone === zoneId));
  zonePins.forEach((pin) => pin.classList.toggle('is-active', pin.dataset.zone === zoneId));
  zoneAreas.forEach((area) => area.classList.toggle('is-active', area.dataset.zone === zoneId));
  const name = activeItem.dataset.name || '';
  const time = activeItem.dataset.time || '';
  zoneTooltip.querySelector('.zone-tooltip-name').textContent = name;
  zoneTooltip.querySelector('.zone-tooltip-time').textContent = `Доставка: ${time}`;
  /* позиционирование #zoneTooltip относительно пина */
}
setActiveZone('center');
```

---

## 14. Панели персонала (`admin.html`, `operator.html`, `manager.html`)

**Назначение:** отдельные страницы для ролей **администратор**, **оператор**, **менеджер** (список заказов, пользователи, настройки сайта — в зависимости от страницы и `*.js`).

- В шапке обычных страниц ссылки на эти разделы скрыты классом **`hidden`** и показываются в **`updateHeaderAuth()`** только если в **`ekvaline_current_user`** есть подходящая **`role`**.
- После входа на странице входа, открытой как **`operator.html` / `manager.html` / `admin.html`**, выполняется **`location.reload`**, чтобы подтянуть сессию и отрисовать панель.

Подключайте те же **`api-client.js`** и **`script.js`**, что и на публичных страницах, чтобы сессия и CSRF совпадали.

### Код по ролям

**Оператор** (`operator.js`) — выборка всех заказов, фильтр по статусу и поиску, смена статуса и заметка курьеру:

```javascript
const { ok, data } = await API.json('/api/orders');
// сохранение статуса
await API.json(`/api/orders/${id}`, { method: 'PATCH', body: { status } });
await API.json(`/api/orders/${id}`, { method: 'PATCH', body: { courier_note } });
API.resetCsrf();
```

**Администратор** (`admin.js`) — пользователи, справочник адресов доставки, зоны, просмотр обращений из формы обратной связи:

```javascript
const { ok, data } = await API.json('/api/admin/users');
await API.json(`/api/admin/users/${id}`, { method: 'PATCH', body: { role, blocked } });

await API.json('/api/admin/delivery-addresses', { method: 'POST', body: { label, address_line } });
await API.json(`/api/admin/delivery-addresses/${id}`, { method: 'PATCH', body: { label, address_line, sort_order, active } });
await API.json(`/api/admin/delivery-addresses/${id}`, { method: 'DELETE' });

await API.json(`/api/admin/delivery-zones/${id}`, { method: 'PATCH', body: { name, tariff, bounds_json } });
const { data: fb } = await API.json('/api/admin/feedback');
API.resetCsrf();
```

**Менеджер** (`manager.js`) — публичные настройки сайта (строка режима работы, вступление сообщества, слоты доставки), модерация постов/опросов в **`localStorage`** через `EkvalineApp`:

```javascript
await window.EkvalineAPI.json('/api/manager/settings', { method: 'PUT', body: payload });
window.EkvalineAPI.resetCsrf();
E.deletePost(id);
E.deletePoll(id);
```

---

## 15. Уведомления в шапке

**Где:** контейнер **`#topbarNotifications`** в шапке страниц.

- Инициализация через **`window.EkvalineApp.initNotificationsUI`** (если задана в `app-core.js`), список уведомлений читается из **`localStorage`**.
- Формат времени и сброс «непрочитанного» зависят от реализации в `app-core.js` / обработчиках клика. Пошаговое устройство UI колокольчика — **раздел 21**.

### Код (`script.js`, после `initAuthAndCabinet`)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const nEl = document.getElementById('topbarNotifications');
  if (nEl && window.EkvalineApp && typeof window.EkvalineApp.initNotificationsUI === 'function') {
    window.EkvalineApp.initNotificationsUI(nEl);
  }
});
```

Фрагмент `initNotificationsUI` в `app-core.js` создаёт разметку колокольчика (`#notifBell`, `#notifDropdown`, `#notifList`) и вешает обработчики открытия/закрытия и «Прочитать все».

---

## 16. Справочник HTTP API (`server.js`)

Ниже — маршруты Express, с которыми работает фронтенд. Для **POST/PATCH/PUT/DELETE** нужны валидный **CSRF** и, где указано, **cookie-сессия** (`credentials: 'same-origin'` в `api-client.js`).

| Метод | Путь | Доступ | Назначение |
|--------|------|--------|------------|
| GET | `/api/csrf` | все | Выдача токена для мутаций |
| GET | `/api/public/settings` | все | `workLine`, `deliverySlots`, `communityIntro` из БД |
| GET | `/api/public/checkout-options` | все | Слоты доставки + справочник адресов для чекаута |
| GET | `/api/products` | все | Каталог (товары с категориями, без скрытых) |
| GET | `/api/auth/me` | сессия | Текущий пользователь или `null` |
| POST | `/api/auth/register` | CSRF | Регистрация, создание сессии |
| POST | `/api/auth/login` | CSRF | Вход |
| POST | `/api/auth/logout` | CSRF | Выход, уничтожение сессии |
| PATCH | `/api/profile` | авторизован + CSRF | Обновление ФИО, email, телефона |
| POST | `/api/feedback` | CSRF | Сохранение обращения с главной/контактов |
| GET | `/api/orders/my` | авторизован | Заказы текущего клиента |
| POST | `/api/orders` | авторизован + CSRF | Создание заказа, списание остатков, бонусы |
| POST | `/api/orders/:id/cancel` | авторизован + CSRF | Отмена своего заказа (по правилам статуса) |
| GET | `/api/orders` | оператор, менеджер, админ | Все заказы с данными клиента |
| PATCH | `/api/orders/:id` | оператор, менеджер, админ + CSRF | Статус, заметка курьеру и др. |
| GET | `/api/admin/users` | админ | Список пользователей |
| PATCH | `/api/admin/users/:id` | админ + CSRF | Роль, блокировка |
| GET/PUT | `/api/manager/settings` | менеджер или админ | Чтение/запись публичных настроек |
| GET/POST/PATCH/DELETE | `/api/admin/delivery-addresses`… | админ | Справочник адресов для пресетов чекаута |
| GET/PATCH | `/api/admin/delivery-zones`… | админ | Зоны (имя, тариф, `bounds_json`) |
| GET | `/api/admin/feedback` | админ, менеджер, оператор | Таблица обращений из формы |

---

## 17. Сервер: создание заказа, остатки и бонусы

**`POST /api/orders`** (фрагмент `server.js`): валидация **`orderCreateSchema`**, проверка товара и **остатка** на складе, расчёт подытога; списание бонусов `bonuses_used` (не больше баланса и суммы); в транзакции — INSERT заказа, уменьшение `stock`, движения по бонусам и **начисление ~5%** от суммы заказа.

```javascript
app.post('/api/orders', requireAuth, csrfMiddleware, (req, res) => {
  const v = schemas.validate(schemas.orderCreateSchema, req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { address, delivery_date, delivery_slot, payment_method, bonuses_used, items } = v.value;

  let subtotal = 0;
  const lineItems = [];
  for (const it of items) {
    const p = db.prepare('SELECT id, price, stock, hidden FROM products WHERE id = ?').get(it.product_id);
    if (!p || p.hidden) return res.status(400).json({ error: `Товар #${it.product_id} недоступен.` });
    if (p.stock < it.qty) return res.status(400).json({ error: `Недостаточно остатка...` });
    subtotal += p.price * it.qty;
    lineItems.push({ ...it, unit_price: p.price });
  }

  let bonusSpend = Math.min(bonuses_used || 0, req.user.bonus_balance, Math.floor(subtotal));
  const earn = Math.floor(subtotal * 0.05);
  const itemsJson = JSON.stringify({ lines: lineItems, subtotal, payable: Math.max(0, subtotal - bonusSpend), bonusSpend });
  /* далее в исходнике: runTransaction — INSERT заказа, UPDATE stock, бонусы; затем res.json({ order, user }) */
});
```

Клиент после успеха подменяет **`ekvaline_current_user`** объектом `data.user`, чтобы в кабинете сразу отобразился новый **bonus_balance**.

---

## 18. Синхронизация сессии при загрузке страницы

В конце **`initAuthAndCabinet()`** вызывается **`syncSessionFromServer`**: если подключён **`EkvalineAPI`**, выполняется **`GET /api/auth/me`**. При непустом `user` локальное хранилище приводится в соответствие с сервером (роль, бонусы и т.д.), затем **`updateHeaderAuth()`**.

```javascript
void (async function syncSessionFromServer() {
  if (!API) return;
  try {
    const { ok, data } = await API.json('/api/auth/me');
    if (ok && data && data.user) {
      const u = data.user;
      saveCurrentUser({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        bonus_balance: u.bonus_balance,
      });
      updateHeaderAuth();
    }
  } catch {
  
  }
})();
```

**Выход из кабинета:** `POST /api/auth/logout`, `resetCsrf()`, очистка `ekvaline_current_user`, закрытие модалки.

---

## 19. Статические страницы «О компании» и «Контакты»

**`about.html`** — маркетинговый контент о компании (без отдельного JS-модуля; те же `script.js`, `app-core.js`, `api-client.js`, что и на остальных публичных страницах, для шапки, входа и уведомлений).

**`contacts.html`** — контакты (телефон, email, режим работы, карта/блок адреса по вёрстке). Если на странице есть форма с теми же `id`, что и на главной (`#callbackForm`, `#cbName`, …), срабатывает **тот же блок** «Callback form» в `script.js`: при сервере — **`POST /api/feedback`**, иначе — имитация успеха.

---

## 20. Сообщество: лента, лайки, комментарии, опросы (`community.js` + `app-core.js`)

### Лайки и комментарии к постам

- Лента рендерится в **`#communityFeed`** из **`E.getPosts()`**. У каждого поста массив **`likes`** — это строковые ключи гостей или идентификаторы; для анонима ключ стабильно берётся из **`sessionStorage`** (`guestKey()` → `ekvaline_guest_key`).
- Клик по сердцу вызывает **`E.toggleLike(postId, gk)`**: если ключ уже в `likes`, он убирается, иначе добавляется.
- Комментарий: форма с **`maxlength="800"`**; **`E.addComment(postId, gk, displayName(), text)`** — имя для авторизованного из `ekvaline_current_user.name`, иначе «Гость». Пустой или длиннее 800 символов — отклоняется в **`app-core.js`**.

```javascript
toggleLike(postId, userKey) {
  const posts = this.getPosts();
  const i = posts.findIndex((p) => p.id === postId);
  if (i < 0) return;
  const likes = posts[i].likes || [];
  const has = likes.includes(userKey);
  posts[i].likes = has ? likes.filter((x) => x !== userKey) : [...likes, userKey];
  this.savePosts(posts);
}

addComment(postId, userKey, displayName, text) {
  const t = String(text || '').trim();
  if (!t || t.length > 800) return false;
  /* push в posts[i].comments: id, userKey, displayName, text, createdAt */
  return true;
}
```

### Опросы

- Контейнер **`#communityPolls`**. У каждого варианта массив **`votes`** — снова ключи **`guestKey()`**. **`E.votePoll(pollId, optionId, voterKey)`** сначала убирает голос пользователя со всех вариантов, затем добавляет к выбранному (**один голос на опрос**).
- Полоски процентов в UI: `pct = round(cnt / totalVotes * 100)`.

```javascript
votePoll(pollId, optionId, voterKey) {
  const polls = this.getPolls();
  const pi = polls.findIndex((p) => p.id === pollId);
  if (pi < 0) return false;
  const poll = polls[pi];
  poll.options.forEach((opt) => {
    opt.votes = (opt.votes || []).filter((v) => v !== voterKey);
  });
  const opt = poll.options.find((o) => o.id === optionId);
  if (!opt) return false;
  opt.votes = opt.votes || [];
  if (!opt.votes.includes(voterKey)) opt.votes.push(voterKey);
  this.savePolls(polls);
  return true;
}
```

### Синхронизация между вкладками

На **`DOMContentLoaded`** подписываются **`ekvaline-storage`** и **`storage`**: при изменении `localStorage` в другой вкладке лента и опросы перерисовываются. На странице сообщества дополнительно **`showManagerLink()`** дублирует логику показа ссылки «Менеджер» для роли manager/admin.

---

## 21. Уведомления в шапке: разметка и прочтение (`app-core.js`)

**`initNotificationsUI(mountEl)`** (вызывается из `script.js` на `#topbarNotifications`):

1. Однократная инициализация (`data-notif-inited`), вызов **`seedIfNeeded()`** и миграции текста про интервалы (**`migrateNotifDeliveryIntervals`**).
2. Вставка HTML: колокольчик **`#notifBell`**, выпадающий блок **`#notifDropdown`**, список **`#notifList`**, кнопка «Прочитать все».
3. **`renderNotificationsPanel`**: бейдж с числом непрочитанных (кап **9+**), до 12 последних уведомлений; клик по элементу → **`markNotificationRead(id)`** и перерисовка.
4. Клик вне дропдауна закрывает панель; **`ekvaline-storage`** обновляет список без перезагрузки страницы.

```javascript
function renderNotificationsPanel(wrap, dropdown) {
  const list = Api.getNotifications();
  const unread = Api.unreadCount();
  wrap.querySelector('.notif-bell-badge').style.display = unread > 0 ? 'inline-flex' : 'none';
  wrap.querySelector('.notif-bell-badge').textContent = unread > 9 ? '9+' : String(unread);
  /* dropdown: кнопки .notif-item с data-notif-id → markNotificationRead */
}
```

---

## 22. Панель менеджера: контент ленты и уведомления (`manager.js`)

Доступ при **`role === 'manager' || role === 'admin'`** (`isManagerRole`). Вкладки переключают панели (**`setupTabs`**).

| Действие | API `EkvalineApp` | Примечание |
|----------|-------------------|------------|
| Сохранить настройки сайта | `saveSettingsForm` → **`PUT /api/manager/settings`** или только localStorage | Поля: режим работы, вступление сообщества, слоты (по строке на интервал) |
| Новый пост | **`E.addPost({ title, body })`** | Мин. длина текста 10 символов |
| Новый опрос | **`E.addPoll({ question, options })`** | Варианты из многострочного поля, минимум 2 строки |
| Удалить пост/опрос | **`E.deletePost` / `E.deletePoll`** | Только localStorage |
| Рассылка в колокольчик | **`E.addNotification({ title, body, type: 'promo' })`** | Виднпрпра всем на этом браузере через `localStorage` |

### Код (`manager.js`)

Проверка роли, показ экрана входа / рабочей области (`#managerGate`, `#managerApp`):

```javascript
function isManagerRole(u) {
  return u && (u.role === 'manager' || u.role === 'admin');
}

function showApp(show) {
  const gate = document.getElementById('managerGate');
  const app = document.getElementById('managerApp');
  if (gate) gate.classList.toggle('hidden', show);
  if (app) app.classList.toggle('hidden', !show);
}
```

Загрузка настроек с сервера или из `E.getSettings()`; сохранение в БД или только в `localStorage`:

```javascript
async function loadSettingsForm() {
  if (window.EkvalineAPI) {
    const { ok, data } = await window.EkvalineAPI.json('/api/manager/settings');
    if (ok && data) {
      document.getElementById('mgrWorkLine').value = data.workLine || '';
      document.getElementById('mgrIntro').value = data.communityIntro || '';
      document.getElementById('mgrSlots').value = (data.deliverySlots || []).join('\n');
      E.saveSettings({
        workLine: data.workLine || '',
        communityIntro: data.communityIntro || '',
        deliverySlots: data.deliverySlots || [],
      });
      return;
    }
  }
  const s = E.getSettings();
  document.getElementById('mgrWorkLine').value = s.workLine || '';
  document.getElementById('mgrIntro').value = s.communityIntro || '';
  document.getElementById('mgrSlots').value = (s.deliverySlots || []).join('\n');
}

async function saveSettingsForm() {
  const slots = document
    .getElementById('mgrSlots')
    .value.split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  const payload = {
    workLine: document.getElementById('mgrWorkLine').value.trim(),
    communityIntro: document.getElementById('mgrIntro').value.trim(),
    deliverySlots: slots.length ? slots : ['09:00 – 14:00', '14:00 – 17:00', '17:00 – 21:00'],
  };
  if (window.EkvalineAPI) {
    const { ok, data } = await window.EkvalineAPI.json('/api/manager/settings', {
      method: 'PUT',
      body: payload,
    });
    if (!ok) {
      alert(data.error || 'Ошибка сохранения (нужен вход менеджера и сервер npm start).');
      return;
    }
    window.EkvalineAPI.resetCsrf();
    E.saveSettings({ ...payload });
    alert('Сохранено в базе данных.');
    return;
  }
  E.saveSettings(payload);
  alert('Сохранено локально (без сервера).');
}
```

Вкладки и списки постов/опросов с удалением:

```javascript
function setupTabs() {
  const tabs = document.querySelectorAll('.manager-tab');
  const panels = document.querySelectorAll('.manager-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.getAttribute('data-tab');
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => p.classList.toggle('hidden', p.getAttribute('data-panel') !== id));
    });
  });
}

function renderPostList() {
  const root = document.getElementById('mgrPostList');
  if (!root) return;
  const posts = E.getPosts();
  root.innerHTML = posts
    .map(
      (p) => `
      <div class="mgr-row">
        <div>
          <strong>${E.escapeHtml(p.title)}</strong>
          <p class="mgr-row-meta">${E.formatTime(p.createdAt)}</p>
        </div>
        <button type="button" class="ghost-btn small-btn" data-del-post="${E.escapeHtml(p.id)}">Удалить</button>
      </div>
    `
    )
    .join('');
  root.querySelectorAll('[data-del-post]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('Удалить публикацию?')) {
        E.deletePost(btn.getAttribute('data-del-post'));
        renderPostList();
      }
    });
  });
}

function renderPollList() {
  const root = document.getElementById('mgrPollList');
  if (!root) return;
  const polls = E.getPolls();
  root.innerHTML = polls
    .map(
      (p) => `
      <div class="mgr-row">
        <div>
          <strong>${E.escapeHtml(p.question)}</strong>
          <p class="mgr-row-meta">${E.formatTime(p.createdAt)}</p>
        </div>
        <button type="button" class="ghost-btn small-btn" data-del-poll="${E.escapeHtml(p.id)}">Удалить</button>
      </div>
    `
    )
    .join('');
  root.querySelectorAll('[data-del-poll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('Удалить опрос?')) {
        E.deletePoll(btn.getAttribute('data-del-poll'));
        renderPollList();
      }
    });
  });
}
```

Инициализация: пост, опрос, уведомление, `storage`, выход:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const user = readUser();
  if (isManagerRole(user)) {
    showApp(true);
    const w = document.getElementById('managerWelcome');
    if (w) w.textContent = `${user.name || 'Менеджер'} — редактирование ленты и уведомлений`;
    loadSettingsForm();
    renderPostList();
    renderPollList();
    setupTabs();
    document.getElementById('mgrSaveSettings').addEventListener('click', saveSettingsForm);

    document.getElementById('mgrAddPost').addEventListener('click', () => {
      const title = document.getElementById('mgrPostTitle').value.trim();
      const body = document.getElementById('mgrPostBody').value.trim();
      if (title.length < 2 || body.length < 10) {
        alert('Заполните заголовок и текст (от 10 символов).');
        return;
      }
      E.addPost({ title, body });
      document.getElementById('mgrPostTitle').value = '';
      document.getElementById('mgrPostBody').value = '';
      renderPostList();
    });

    document.getElementById('mgrAddPoll').addEventListener('click', () => {
      const q = document.getElementById('mgrPollQ').value.trim();
      const lines = document
        .getElementById('mgrPollOpts')
        .value.split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      if (q.length < 3 || lines.length < 2) {
        alert('Нужен вопрос и минимум 2 варианта.');
        return;
      }
      const options = lines.map((t, i) => ({
        id: `opt_${i}_${Date.now()}`,
        text: t,
        votes: [],
      }));
      E.addPoll({ question: q, options });
      document.getElementById('mgrPollQ').value = '';
      document.getElementById('mgrPollOpts').value = '';
      renderPollList();
    });

    document.getElementById('mgrSendNotif').addEventListener('click', () => {
      const title = document.getElementById('mgrNTitle').value.trim();
      const body = document.getElementById('mgrNBody').value.trim();
      if (title.length < 2 || body.length < 5) {
        alert('Заполните заголовок и текст.');
        return;
      }
      E.addNotification({ title, body, type: 'promo' });
      document.getElementById('mgrNTitle').value = '';
      document.getElementById('mgrNBody').value = '';
      alert('Уведомление добавлено в шапку у всех пользователей.');
    });
  } else {
    showApp(false);
  }

  window.addEventListener('storage', () => {
    const u = readUser();
    if (isManagerRole(u)) location.reload();
  });

  document.getElementById('mgrLogoutBtn')?.addEventListener('click', async () => {
    try {
      if (window.EkvalineAPI) await window.EkvalineAPI.json('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    window.EkvalineAPI?.resetCsrf();
    localStorage.removeItem('ekvaline_current_user');
    showApp(false);
    location.reload();
  });
});
```

Событие **`storage`** на странице менеджера вызывает **`location.reload`**, если роль всё ещё менеджерская — удобно при смене пользователя в другой вкладке.

---

## 23. Сервер: сессия, роли, аудит, раздача статики (`server.js`)

- **Сессия:** `express-session`, имя cookie **`ekvaline.sid`**, **`rolling: true`**, срок **30 минут**, **`sameSite: 'lax'`**, в production — **`secure: true`**. Секрет из **`SESSION_SECRET`** или dev-заглушка.
- **Парсинг тел:** до **1 MB** JSON; **`cookie-parser`**.
- **`requireAuth`** — из сессии `userId`, загрузка пользователя; заблокированный → **403** и сброс сессии.
- **`requireRole('operator', …)`** — цепочка после `requireAuth`.
- **`normalizeCredential` / `findUserByCredential`:** либо **11 цифр с 7** (телефон), либо email **без учёта регистра**.
- **Блокировка входа:** после **5** неверных паролей **`locked_until`** на **15 минут** (`recordLoginFail` / `isLocked`).
- **`audit()`** — запись в таблицу **`audit_log`** (действие, детали, IP); ошибки игнорируются.
- **Статика:** **`express.static(ROOT, { index: 'index.html' })`**. Неизвестные пути не под `/api/` отдают **`index.html`** (упрощённый SPA-fallback).
- **Отмена заказа клиентом** — только статусы **`processing`** и **`confirmed`**; иначе **400**.

```javascript
app.post('/api/orders/:id/cancel', requireAuth, csrfMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден.' });
  if (!['processing', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Этот заказ уже нельзя отменить.' });
  }
  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  res.json({ order: db.prepare('SELECT * FROM orders WHERE id = ?').get(id) });
});
```

Операторский **`PATCH /api/orders/:id`** принимает тело, прошедшее **`orderPatchSchema`** — поля **`status`** и/или **`courier_note`** (до **500** символов, см. `schemas.js`).

---

## 24. Валидация входящих данных (`schemas.js`, Joi)

Общие ограничения: email до **120** символов, имя до **60**, телефон **`^7\d{10}$`**, адрес заказа до **500**, сообщение обратной связи до **2000**, слот до **64** символов.

**Пароль** (регистрация и согласованные проверки на клиенте): минимум **8**, максимум **128**, обязательны **заглавная**, **строчная**, **цифра** и **спецсимвол** из набора в паттерне Joi.

Основные схемы: **`registerSchema`**, **`loginSchema`**, **`profileSchema`**, **`feedbackSchema`**, **`orderCreateSchema`** (позиции заказа: `product_id`, `qty`), **`orderPatchSchema`**, **`adminUserPatchSchema`**. Сервер везде использует **`schemas.validate(schema, req.body)`** и отвечает **400** с текстом ошибки.

---

## 25. База SQLite и сид (`db.js`)

- Путь к файлу: **`SQLITE_PATH`** или **`data/ekvaline.sqlite`**; каталог создаётся при необходимости.
- **`DatabaseSync`** из **`node:sqlite`**; миграции **`CREATE TABLE IF NOT EXISTS`** для пользователей, категорий, товаров, заказов, настроек, зон доставки, обратной связи, аудита и др.; включены **foreign keys** и **WAL**.
- **`runTransaction`** — `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` при ошибке.
- При **пустой** таблице пользователей выполняется **сид**: демо-админ/менеджер/оператор, категории, товары с ценами и остатками, строки **`site_settings`**, зоны и адреса доставки — чтобы сразу работали каталог, чекаут и панели.

---

## Связанные файлы

| Функция | Основные файлы |
|--------|----------------|
| Калькулятор | `index.html` (секция `.calc-section`), `styles.css`, `script.js` |
| Каталог + фильтр | `catalog.html`, `script.js`, `styles.css` |
| Backend API, сессии, CSRF, SQLite | `server.js`, `db.js`, `schemas.js`, `data/ekvaline.sqlite` |
| Клиент API (fetch + CSRF) | `api-client.js` |
| Уведомления, сиды localStorage, `EkvalineApp` | `app-core.js` |
| Вход / регистрация / кабинет | `script.js` (вставляемая разметка), все страницы с `.contact-area`, при необходимости `bcryptjs` с CDN |
| Обратная связь | `index.html`, `contacts.html`, `script.js` |
| Сообщество | `community.html`, `community.js`, `app-core.js` |
| Доставка (карта зон) | `delivery.html`, `script.js` (блок зон) |
| Панели администрирования | `admin.html`, `admin.js`, `operator.html`, `operator.js`, `manager.html`, `manager.js` |
| Справочник API, заказы на сервере, синхронизация сессии | `server.js`, `schemas.js`, `script.js` (`initAuthAndCabinet`, чекаут) |
| О компании / контакты | `about.html`, `contacts.html`, `script.js` (callback) |
| Лайки, комментарии, опросы, синк вкладок | `community.js`, `app-core.js` |
| Колокольчик: разметка и прочтение | `app-core.js` (`initNotificationsUI`) |
| Менеджер: посты, опросы, promo-уведомления | `manager.js` |
| Сессия, аудит, статика, отмена заказа | `server.js` |
| Валидация тел запросов (Joi) | `schemas.js` |
| Миграции БД и сид | `db.js` |

---

*Документ описывает актуальную логику по состоянию кода в репозитории. Фрагменты кода приведены для ориентира; при расхождении с файлами в проекте источником истины остаётся исходный код (`script.js`, `server.js` и др.).*
