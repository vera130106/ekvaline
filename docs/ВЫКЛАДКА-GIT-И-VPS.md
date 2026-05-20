# Пошаговая выкладка сайта: GitHub → VPS → Docker

Полная инструкция: репозиторий на GitHub, сервер (VPS), запуск через **Docker Compose** — как у вас на компьютере.  
Каждый шаг расписан подробно. Подходит для **Windows** на вашем ПК и **Ubuntu** на сервере.

Связанные файлы:
- `docs/ПЕРЕДАЧА-ЗАКАЗЧИКУ-DOCKER.md` — что такое Docker для заказчика
- `docs/НАСТРОЙКА-ПОЧТЫ.md` — SMTP (письма с кодами)
- `.env.docker.example` — шаблон настроек на сервере

---

## Что получится в конце

| Что | Значение |
|-----|----------|
| Репозиторий | Код на GitHub (обновления через `git push`) |
| Сервер | VPS с Ubuntu, Docker |
| Сайт | `http://IP:3001` или `https://ваш-домен.ru` |
| База | PostgreSQL внутри Docker (отдельно покупать не нужно) |

---

# ЧАСТЬ A. Подготовка проекта на вашем компьютере

## A.1. Проверить, что Git установлен

1. Откройте **PowerShell** (Win + X → «Терминал» или «PowerShell»).
2. Введите:

```powershell
git --version
```

3. Должно показать что-то вроде `git version 2.x.x`.  
   Если ошибка «не найдено» — установите: https://git-scm.com/download/win (всё по умолчанию, Next → Finish).

**Скриншот A1:** окно PowerShell с успешным `git --version`.

---

## A.2. Убедиться, что секреты не попадут в Git

В корне проекта есть файл `.gitignore`. В нём уже указано:

```
.env
node_modules/
```

**Важно:** файл `.env` с паролями SMTP и ключами **никогда не коммитьте** в GitHub. На сервере `.env` создаётся вручную один раз.

Проверка (в папке проекта):

```powershell
cd C:\Users\verun\OneDrive\Desktop\dpp
git status
```

Если в списке **нет** файла `.env` — хорошо. Если `.env` в списке — не делайте `git add .env`.

---

## A.3. Создать аккаунт на GitHub (если ещё нет)

1. Откройте https://github.com/
2. **Sign up** → email, пароль, имя пользователя (запомните **логин**, например `ivanov-dev`).
3. Подтвердите email, если попросит.

**Скриншот A2:** главная GitHub после входа.

---

## A.4. Создать новый репозиторий на GitHub

1. На GitHub нажмите **+** (правый верх) → **New repository**.
2. Заполните:
   - **Repository name:** `ekvaline` (или другое латиницей, без пробелов).
   - **Description:** по желанию, например «ЭкваЛайн — веб-приложение».
   - **Private** — включите, если код не должен быть публичным.
   - **НЕ ставьте** галочки «Add a README», «Add .gitignore» — у вас они уже есть в проекте.
3. Нажмите **Create repository**.
4. GitHub покажет страницу с подсказками. Скопируйте URL репозитория, он вида:

```
https://github.com/ВАШ_ЛОГИН/ekvaline.git
```

**Скриншот A3:** страница пустого репозитория с URL `…/ekvaline.git`.

---

## A.5. Привязать папку проекта к GitHub и отправить код

В PowerShell (путь замените на свой):

```powershell
cd C:\Users\verun\OneDrive\Desktop\dpp
```

### Если Git в проекте уже есть (есть коммиты)

Проверьте:

```powershell
git status
git branch
```

Должна быть ветка `master` или `main`.

Добавьте удалённый репозиторий (подставьте **свой** URL с GitHub):

```powershell
git remote add origin https://github.com/ВАШ_ЛОГИН/ekvaline.git
```

Если `origin` уже есть и URL неверный:

```powershell
git remote set-url origin https://github.com/ВАШ_ЛОГИН/ekvaline.git
```

Проверка:

```powershell
git remote -v
```

Отправка кода на GitHub:

```powershell
git add -A
git status
git commit -m "Подготовка к выкладке на VPS"
git push -u origin master
```

Если ваша ветка называется `main`, вместо последней строки:

```powershell
git push -u origin main
```

5. GitHub попросит **войти**:
   - откроется браузер, или
   - логин + **Personal Access Token** (не пароль от аккаунта для 2FA-аккаунтов).

**Как создать токен (если просит пароль и не принимает):**
1. GitHub → аватар → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token** → отметьте `repo` → сгенерировать → скопировать токен.
3. При `git push` в поле пароля вставьте **токен**.

**Скриншот A4:** страница репозитория на GitHub с файлами (`server.js`, `docker-compose.yml`, `docs/` и т.д.).

### Если Git в проекте ещё не инициализирован

```powershell
cd C:\Users\verun\OneDrive\Desktop\dpp
git init
git add -A
git commit -m "Первый коммит"
git branch -M master
git remote add origin https://github.com/ВАШ_ЛОГИН/ekvaline.git
git push -u origin master
```

---

## A.6. Что должно быть в репозитории на GitHub

Откройте репозиторий в браузере и проверьте наличие:

- `Dockerfile`
- `docker-compose.yml`
- `docker/entrypoint.sh`
- `.env.docker.example` (шаблон, без секретов)
- `package.json`, `server.js`
- папки `docs/`, HTML-файлы, JS

**Не должно быть:** `.env`, `node_modules/`.

---

# ЧАСТЬ B. Аренда VPS (сервера)

Подойдёт любой VPS с **Ubuntu 22.04** и root/SSH. Ниже — общая схема (Timeweb, Beget, Aeza, Selectel — шаги похожи).

## B.1. Зарегистрироваться у хостера

Примеры (оплата в рублях):

| Хостинг | Сайт |
|---------|------|
| Timeweb Cloud | https://timeweb.cloud |
| Beget VPS | https://beget.com |
| Aeza | https://aeza.net |

## B.2. Заказать VPS

В панели хостинга:

1. **Создать сервер** / **VPS** / **Облачный сервер**.
2. Параметры:
   - **ОС:** Ubuntu 22.04 LTS (или 24.04).
   - **Тариф:** минимум **1 GB RAM**, **1 vCPU**, **10–15 GB** SSD.
   - **Регион:** ближе к вам/клиентам (Москва, SPB).
3. Создать сервер, подождать 2–5 минут.

## B.3. Записать данные доступа

В панели найдите:

| Поле | Пример | Зачем |
|------|--------|-------|
| **IP-адрес** | `185.12.34.56` | Подключение по SSH |
| **Логин** | `root` | Имя пользователя SSH |
| **Пароль root** | `…` | Или SSH-ключ |

**Скриншот B1:** панель хостинга с IP и кнопкой «Подключиться по SSH».

Сохраните IP — он понадобится везде дальше.

---

# ЧАСТЬ C. Подключение к серверу с Windows

## C.1. Через встроенный SSH (рекомендуется)

1. PowerShell на вашем ПК.
2. Команда (подставьте **свой IP**):

```powershell
ssh root@185.12.34.56
```

3. При первом подключении спросит `Are you sure…` — введите `yes` и Enter.
4. Введите пароль root (символы **не отображаются** — это нормально) → Enter.
5. Приглашение сменится на что-то вроде `root@server:~#` — вы **на сервере**.

**Скриншот C1:** терминал с успешным `ssh root@IP`.

## C.2. Альтернатива: PuTTY

1. Скачать PuTTY: https://www.putty.org/
2. Host Name: IP сервера, Port: 22, Open.
3. Логин `root`, пароль из панели хостинга.

Дальнейшие команды вводятся **в окне SSH на сервере** (не на вашем ПК), если не написано иное.

---

# ЧАСТЬ D. Настройка сервера (один раз)

Все команды ниже — **на сервере** после `ssh root@IP`.

## D.1. Обновить систему

```bash
apt update
apt upgrade -y
```

Может занять несколько минут.

## D.2. Установить Docker и Git

```bash
apt install -y ca-certificates curl git
```

Установка Docker (официальный скрипт для Ubuntu):

```bash
curl -fsSL https://get.docker.com | sh
```

Проверка:

```bash
docker --version
docker compose version
git --version
```

Должны показать версии без ошибок.

**Скриншот D1:** вывод `docker compose version` на сервере.

## D.3. Открыть порт 3001 в файрволе (если включён)

На многих VPS файрвол выключен. Если сайт потом не открывается снаружи — выполните:

```bash
ufw allow 22/tcp
ufw allow 3001/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

Порт **22** — SSH, не закрывайте его, пока работаете.

---

# ЧАСТЬ E. Скачать проект с GitHub на сервер

## E.1. Клонировать репозиторий

На сервере:

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/ВАШ_ЛОГИН/ekvaline.git
cd ekvaline
ls -la
```

Должны увидеть `Dockerfile`, `docker-compose.yml`, `server.js` и т.д.

### Если репозиторий приватный

GitHub спросит логин. Варианты:

**Вариант 1 — токен в URL (проще):**

```bash
git clone https://ВАШ_ЛОГИН:ВАШ_ТОКЕН@github.com/ВАШ_ЛОГИН/ekvaline.git
```

**Вариант 2 — SSH-ключ на сервере** (безопаснее для долгой работы):  
GitHub → Settings → SSH keys → добавить публичный ключ с сервера (`ssh-keygen` → `cat ~/.ssh/id_rsa.pub`).

**Скриншот E1:** `ls` в `/opt/ekvaline` с файлами проекта.

---

## E.2. Создать файл `.env` на сервере

```bash
cd /opt/ekvaline
cp .env.docker.example .env
nano .env
```

Откроется редактор. Заполните **обязательно**:

### SESSION_SECRET (обязательно, ≥ 32 символа)

Сгенерировать на сервере:

```bash
openssl rand -hex 24
```

Скопируйте вывод (48 символов) в строку:

```env
SESSION_SECRET=вставьте_сюда_результат_openssl
```

### APP_BASE_URL

Пока нет домена — можно IP:

```env
APP_BASE_URL=http://185.12.34.56:3001
```

(замените IP на **ваш**).  
Когда появится домен с HTTPS:

```env
APP_BASE_URL=https://ekvaline.ru
```

### SMTP (для писем с кодами)

Скопируйте с вашего рабочего `.env` на ПК или заполните по `docs/НАСТРОЙКА-ПОЧТЫ.md`:

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=ваш@mail.ru
SMTP_PASS=пароль_приложения
SMTP_FROM=ЭкваЛайн <ваш@mail.ru>
```

### Ключи Яндекс.Карт

```env
YANDEX_MAPS_API_KEY=ваш_ключ
YANDEX_GEOCODER_API_KEY=ваш_ключ
```

**Не меняйте** вручную `DATABASE_URL` — в `docker-compose.yml` он уже задан для контейнера `db`.

Сохранить в nano: **Ctrl+O** → Enter → **Ctrl+X**.

**Скриншот E2:** `nano .env` (пароли на скрине замазать).

---

# ЧАСТЬ F. Первый запуск сайта

На сервере, в `/opt/ekvaline`:

```bash
cd /opt/ekvaline
docker compose up -d --build
```

Что происходит:
1. Скачивается образ PostgreSQL.
2. Собирается образ вашего приложения (`Dockerfile`).
3. Создаётся база, запускается `server.js`.

Первый раз — **5–20 минут**. Дождитесь окончания без ошибки.

Проверка статуса:

```bash
docker compose ps
```

Оба сервиса (`app`, `db`) — **running** или **Up**.

Логи (если что-то не так):

```bash
docker compose logs -f app
```

Выход из логов: **Ctrl+C**.

**Скриншот F1:** `docker compose ps` — app и db работают.

---

## F.1. Открыть сайт в браузере

На **вашем компьютере** в браузере:

```
http://ВАШ_IP:3001
```

Пример: `http://185.12.34.56:3001`

Должна открыться главная «ЭкваЛайн».

**Скриншот F2:** сайт в браузере по IP:3001.

---

## F.2. Проверить функции

| Действие | Ожидание |
|----------|----------|
| Главная, каталог | Страницы открываются |
| Регистрация | Форма работает |
| Письмо с кодом | Приходит на email (если SMTP заполнен) |
| Вход оператора | `operator.html`, демо-логин при пустой БД — см. ниже |

### Демо-учётки (только при первой пустой базе)

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | adminekva@mail.ru | AdminEkva2026! |
| Оператор | operatorekva@mail.ru | OperatorEkva2026! |

**На боевом сайте смените пароли** через админку или новые учётки.

---

# ЧАСТЬ G. Привязать домен (по желанию)

Если есть домен `ekvaline.ru`:

## G.1. DNS

В панели регистратора домена создайте запись:

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | IP вашего VPS |
| **A** | `www` | IP вашего VPS |

Подождите 15 мин – 24 ч (иногда быстрее).

## G.2. Обновить APP_BASE_URL

На сервере:

```bash
nano /opt/ekvaline/.env
```

Измените:

```env
APP_BASE_URL=https://ekvaline.ru
```

Перезапуск:

```bash
cd /opt/ekvaline
docker compose restart app
```

## G.3. Nginx + HTTPS (кратко)

Чтобы открывать сайт без `:3001` и с замком HTTPS, на сервере ставят **nginx** как прокси.  
У Timeweb/Beget часто есть готовый «SSL в один клик» в панели — смотрите справку хостинга.

Минимальная идея nginx: проксировать `80/443` → `http://127.0.0.1:3001`.

После настройки домена проверьте: `https://ekvaline.ru`

---

# ЧАСТЬ H. Как обновлять сайт после правок на ПК

Каждый раз, когда вы изменили код локально:

## H.1. На компьютере (PowerShell)

```powershell
cd C:\Users\verun\OneDrive\Desktop\dpp
git add -A
git status
git commit -m "Описание изменений"
git push
```

## H.2. На сервере (SSH)

```bash
cd /opt/ekvaline
git pull
docker compose up -d --build
```

Через 1–3 минуты обновлённый сайт на `http://IP:3001` или на домене.

**Скриншот H1:** `git pull` + успешный `docker compose up -d --build`.

---

# ЧАСТЬ I. Полезные команды на сервере

| Задача | Команда |
|--------|---------|
| Статус контейнеров | `docker compose ps` |
| Логи приложения | `docker compose logs -f app` |
| Логи БД | `docker compose logs -f db` |
| Перезапуск только app | `docker compose restart app` |
| Остановить всё | `docker compose down` |
| Запустить снова | `docker compose up -d` |
| Пересобрать после изменений | `docker compose up -d --build` |
| Место на диске | `df -h` |
| **Удалить БД** (осторожно!) | `docker compose down -v` |

---

# ЧАСТЬ J. Частые проблемы

| Проблема | Что сделать |
|----------|-------------|
| `git push` не пускает | Токен GitHub вместо пароля (см. A.5) |
| `Permission denied (publickey)` при SSH | Проверить IP, пароль root, порт 22 |
| `SESSION_SECRET` ошибка при старте | В `.env` на сервере ≥ 32 символа |
| Сайт не открывается снаружи | `ufw allow 3001`, проверить `docker compose ps` |
| Порт 3001 занят | В `docker-compose.yml` сменить `"3001:3001"` на `"3002:3001"`, открывать `:3002` |
| Письма не уходят | SMTP в `.env`, см. `docs/НАСТРОЙКА-ПОЧТЫ.md` |
| После `git pull` старый сайт | Обязательно `docker compose up -d --build` |
| Нет места на диске | `docker system prune -a` (удалит неиспользуемые образы) |

---

# ЧАСТЬ K. Чек-лист «всё готово»

- [ ] Код на GitHub, без файла `.env`
- [ ] VPS создан, IP записан
- [ ] SSH подключается
- [ ] `docker` и `git` установлены на сервере
- [ ] `git clone` в `/opt/ekvaline`
- [ ] `.env` создан, `SESSION_SECRET` и SMTP заполнены
- [ ] `docker compose up -d --build` без ошибок
- [ ] Сайт открывается в браузере
- [ ] Регистрация / вход проверены
- [ ] (Опционально) домен и `APP_BASE_URL` на https
- [ ] Демо-пароли сменены на production

---

# Краткая шпаргалка (вся цепочка)

```
[ПК] git push  →  GitHub  →  [VPS] git pull  →  docker compose up -d --build  →  сайт
```

---

*Файл: `docs/ВЫКЛАДКА-GIT-И-VPS.md` — выкладка через Git и VPS для проекта ЭкваЛайн.*
