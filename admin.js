(function () {
  const api = window.EkvalineAPI;

  const adminRestrictedEl = document.getElementById('adminRestricted');
  const adminAppRoot = document.getElementById('adminAppRoot');

  const createUserForm = document.getElementById('adminCreateUserForm');
  const createProductForm = document.getElementById('adminCreateProductForm');
  const settingsForm = document.getElementById('adminSettingsForm');
  const categorySelect = document.getElementById('adminProductCategory');
  const userMsg = document.getElementById('adminUserMsg');
  const productMsg = document.getElementById('adminProductMsg');
  const settingsMsg = document.getElementById('adminSettingsMsg');
  const productsList = document.getElementById('adminProductsList');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  const adminConfirmModal = document.getElementById('adminConfirmModal');
  const adminConfirmTitle = document.getElementById('adminConfirmTitle');
  const adminConfirmMessage = document.getElementById('adminConfirmMessage');
  const adminConfirmOk = document.getElementById('adminConfirmOk');
  const adminConfirmCancel = document.getElementById('adminConfirmCancel');

  const listEls = {
    admin: document.getElementById('adminListAdmin'),
    manager: document.getElementById('adminListManager'),
    operator: document.getElementById('adminListOperator'),
    driver: document.getElementById('adminListDriver'),
  };

  const statsGridEl = document.getElementById('adminStatsGrid');
  const statsOrdersEl = document.getElementById('adminStatsOrders');
  const statsUsersEl = document.getElementById('adminStatsUsers');

  const editModal = document.getElementById('adminProductEditModal');
  const editForm = document.getElementById('adminProductEditForm');
  const editCategory = document.getElementById('adminProductEditCategory');
  const editMsg = document.getElementById('adminProductEditMsg');

  const deliveryFaqNav = document.getElementById('adminDeliveryFaqNav');
  const deliveryFaqAddBtn = document.getElementById('adminDeliveryFaqAdd');
  const adminFaqEditModal = document.getElementById('adminFaqEditModal');
  const adminFaqEditNum = document.getElementById('adminFaqEditNum');
  const adminFaqEditCode = document.getElementById('adminFaqEditCode');
  const adminFaqEditTag = document.getElementById('adminFaqEditTag');
  const adminFaqEditQuestion = document.getElementById('adminFaqEditQuestion');
  const adminFaqEditAnswer = document.getElementById('adminFaqEditAnswer');
  const adminFaqEditConfirm = document.getElementById('adminFaqEditConfirm');
  const adminFaqEditDelete = document.getElementById('adminFaqEditDelete');
  const adminFaqEditModalMsg = document.getElementById('adminFaqEditModalMsg');
  const adminFaqAddModal = document.getElementById('adminFaqAddModal');
  const adminFaqAddCode = document.getElementById('adminFaqAddCode');
  const adminFaqAddTag = document.getElementById('adminFaqAddTag');
  const adminFaqAddQuestion = document.getElementById('adminFaqAddQuestion');
  const adminFaqAddAnswer = document.getElementById('adminFaqAddAnswer');
  const adminFaqAddConfirm = document.getElementById('adminFaqAddConfirm');
  const adminFaqAddModalMsg = document.getElementById('adminFaqAddModalMsg');

  const adminAboutCertsNav = document.getElementById('adminAboutCertsNav');
  const adminAboutCertAddBtn = document.getElementById('adminAboutCertAdd');
  const adminAboutCertEditModal = document.getElementById('adminAboutCertEditModal');
  const adminAboutCertEditNum = document.getElementById('adminAboutCertEditNum');
  const adminAboutCertEditImage = document.getElementById('adminAboutCertEditImage');
  const adminAboutCertEditAlt = document.getElementById('adminAboutCertEditAlt');
  const adminAboutCertEditBadge = document.getElementById('adminAboutCertEditBadge');
  const adminAboutCertEditTitleLine = document.getElementById('adminAboutCertEditTitleLine');
  const adminAboutCertEditDesc = document.getElementById('adminAboutCertEditDesc');
  const adminAboutCertEditConfirm = document.getElementById('adminAboutCertEditConfirm');
  const adminAboutCertEditDelete = document.getElementById('adminAboutCertEditDelete');
  const adminAboutCertEditModalMsg = document.getElementById('adminAboutCertEditModalMsg');
  const adminAboutCertAddModal = document.getElementById('adminAboutCertAddModal');
  const adminAboutCertAddImage = document.getElementById('adminAboutCertAddImage');
  const adminAboutCertAddAlt = document.getElementById('adminAboutCertAddAlt');
  const adminAboutCertAddBadge = document.getElementById('adminAboutCertAddBadge');
  const adminAboutCertAddTitleLine = document.getElementById('adminAboutCertAddTitleLine');
  const adminAboutCertAddDesc = document.getElementById('adminAboutCertAddDesc');
  const adminAboutCertAddConfirm = document.getElementById('adminAboutCertAddConfirm');
  const adminAboutCertAddModalMsg = document.getElementById('adminAboutCertAddModalMsg');
  const adminAboutCertEditImageFile = document.getElementById('adminAboutCertEditImageFile');
  const adminAboutCertAddImageFile = document.getElementById('adminAboutCertAddImageFile');

  const adminCoverageCardsNav = document.getElementById('adminCoverageCardsNav');
  const adminCoverageCardAddBtn = document.getElementById('adminCoverageCardAdd');
  const adminCoverageCardEditModal = document.getElementById('adminCoverageCardEditModal');
  const adminCoverageCardEditNum = document.getElementById('adminCoverageCardEditNum');
  const adminCoverageCardEditItemTitle = document.getElementById('adminCoverageCardEditItemTitle');
  const adminCoverageCardEditItemText = document.getElementById('adminCoverageCardEditItemText');
  const adminCoverageCardEditConfirm = document.getElementById('adminCoverageCardEditConfirm');
  const adminCoverageCardEditDelete = document.getElementById('adminCoverageCardEditDelete');
  const adminCoverageCardEditModalMsg = document.getElementById('adminCoverageCardEditModalMsg');
  const adminCoverageCardAddModal = document.getElementById('adminCoverageCardAddModal');
  const adminCoverageCardAddItemTitle = document.getElementById('adminCoverageCardAddItemTitle');
  const adminCoverageCardAddItemText = document.getElementById('adminCoverageCardAddItemText');
  const adminCoverageCardAddConfirm = document.getElementById('adminCoverageCardAddConfirm');
  const adminCoverageCardAddModalMsg = document.getElementById('adminCoverageCardAddModalMsg');

  const DEFAULT_ADMIN_FAQ = Object.freeze([
    {
      code: 'Заявки',
      tag: 'Оператор',
      question: 'Во сколько можно принять заказ сегодня?',
      answer:
        'Прием заявок оператором: с 8:00 до 19:00. Заказы после 19:00 переносим на ближайшее доступное окно.',
    },
    {
      code: 'Интервал',
      tag: 'Квартира',
      question: 'Какие интервалы доставки доступны для частных клиентов?',
      answer: 'Для квартиры доступны окна 9:00-14:00, 14:00-17:00 и 17:00-21:00.',
    },
    {
      code: 'График',
      tag: 'Офис',
      question: 'Как оформить регулярную доставку воды для офиса?',
      answer:
        'Нужно связаться с оператором, выбрать удобные дни и интервал, после этого оператор сам проставит вам регулярные доставки.',
    },
    {
      code: 'Тара',
      tag: 'Обмен',
      question: 'Что делать с пустой тарой?',
      answer:
        'Курьер заберет пустые бутыли во время следующей доставки. Отдельно везти тару в офис не нужно.',
    },
  ]);

  const DEFAULT_ADMIN_ABOUT_CERTIFICATES = Object.freeze([
    {
      image: 'assets/certificate-card.jpg',
      alt: 'Карточка предприятия',
      badge: 'Документ',
      title: 'Карточка предприятия',
      description: 'Реквизиты организации, контакты, банковские данные и юридическая информация.',
    },
    {
      image: 'assets/certificate-eac.jpg',
      alt: 'Декларация о соответствии ЕАЭС',
      badge: 'ЕАЭС',
      title: 'Декларация о соответствии',
      description: 'Подтверждение соответствия продукции требованиям технических регламентов.',
    },
    {
      image: 'assets/certificate-lab.jpg',
      alt: 'Протокол лабораторных испытаний',
      badge: 'Лаборатория',
      title: 'Протокол испытаний',
      description: 'Результаты лабораторных проверок качества и безопасности питьевой воды.',
    },
  ]);

  const DEFAULT_ADMIN_DELIVERY_COVERAGE = Object.freeze({
    title: 'Зоны покрытия Оренбурга',
    cards: Object.freeze([
      Object.freeze({
        title: 'Интервалы доставки',
        text: 'Утро: 9:00-14:00, День: 14:00-17:00, Вечер: 17:00-21:00',
      }),
      Object.freeze({
        title: 'Доставка для организаций',
        text: 'Отдельное окно: 9:00-17:00',
      }),
      Object.freeze({
        title: 'Прием заказов',
        text: 'Оператор принимает заявки: 8:00-19:00',
      }),
    ]),
  });

  const CURRENT_USER_KEY = 'ekvaline_current_user';

  const STAFF_ROLES_DISPLAY = ['admin', 'manager', 'operator', 'driver'];
  const ROLE_SECTION_TITLE = {
    admin: 'Администраторы',
    manager: 'Менеджеры',
    operator: 'Операторы',
    driver: 'Водители',
  };

  const ORDER_STATUS_LABELS = {
    new: 'Новый',
    pending_operator: 'У оператора',
    confirmed: 'Подтверждён',
    processing: 'В обработке',
    courier: 'Курьер',
    on_way: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };

  let users = [];
  let products = [];
  let categories = [];
  /** Черновик блока вопросов для страницы «Доставка»; сохранение через API настроек. */
  let faqDraft = [];
  /** Индекс открытого модального редактирования; −1 если окно закрыто. */
  let faqEditModalIdx = -1;
  /** Опросы для блога (sitePolls): редактирование у менеджера; при сохранении настроек админом уходит копия с сервера. */
  let pollsDraft = [];
  /** Сертификаты блока «О компании». */
  let aboutCertsDraft = [];
  /** Индекс открытого модального редактирования сертификата; −1 если окно закрыто. */
  let aboutCertEditModalIdx = -1;
  /** Карточки справа от карты на странице «Доставка». */
  let coverageCardsDraft = [];
  /** Индекс открытого модального редактирования карточки «Зоны покрытия»; −1 если окно закрыто. */
  let coverageCardEditModalIdx = -1;
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncOneCharCounter(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const sid = el.getAttribute('data-char-count-for');
    const span = sid ? document.getElementById(sid) : null;
    const max = el.maxLength > 0 ? el.maxLength : 0;
    if (!(span instanceof HTMLElement) || max <= 0) return;
    span.textContent = `${el.value.length}/${max}`;
  }

  /** Обновить счётчики «текущее/лимит» у полей с data-char-count-for внутри узла (или всей админки). */
  function refreshCharCounters(scope) {
    const root =
      scope instanceof HTMLElement
        ? scope
        : adminAppRoot instanceof HTMLElement
          ? adminAppRoot
          : document.body;
    root.querySelectorAll('input[data-char-count-for], textarea[data-char-count-for]').forEach((field) => {
      syncOneCharCounter(field);
    });
  }

  const ABOUT_CERT_IMAGE_MAX_LEN = 600000;

  function aboutCertImageAllowed(image) {
    const s = String(image ?? '').trim();
    if (!s) return false;
    if (/^(javascript:|vbscript:)/i.test(s)) return false;
    if (/^data:/i.test(s)) return /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(s);
    return true;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
      reader.readAsDataURL(file);
    });
  }

  async function imageFileToJpegDataUrl(file, maxSide = 1400, quality = 0.85) {
    const raw = await readFileAsDataUrl(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (!w || !h) {
            reject(new Error('Не удалось определить размер изображения.'));
            return;
          }
          if (w > maxSide || h > maxSide) {
            if (w >= h) {
              h = Math.round((h * maxSide) / w);
              w = maxSide;
            } else {
              w = Math.round((w * maxSide) / h);
              h = maxSide;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Не удалось подготовить изображение.'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      img.onerror = () => reject(new Error('Файл не похож на поддерживаемое изображение.'));
      img.src = raw;
    });
  }

  async function applyAboutCertPickedImageFile(fileInput, textInput, msgEl, modalScope) {
    if (!(fileInput instanceof HTMLInputElement) || !(textInput instanceof HTMLInputElement)) return;
    const file = fileInput.files?.[0];
    if (!file) return;
    showMsg(msgEl, '');
    try {
      const dataUrl = await imageFileToJpegDataUrl(file);
      if (dataUrl.length > ABOUT_CERT_IMAGE_MAX_LEN) {
        showMsg(msgEl, 'Файл после сжатия всё ещё слишком большой. Выберите другое изображение.');
        fileInput.value = '';
        return;
      }
      textInput.value = dataUrl;
      syncOneCharCounter(textInput);
      const scope =
        modalScope instanceof HTMLElement
          ? modalScope
          : adminAboutCertEditModal instanceof HTMLElement
            ? adminAboutCertEditModal
            : adminAppRoot instanceof HTMLElement
              ? adminAppRoot
              : document.body;
      refreshCharCounters(scope);
    } catch (e) {
      showMsg(msgEl, e instanceof Error ? e.message : 'Не удалось обработать файл.');
      fileInput.value = '';
    }
  }

  function showMsg(el, text, ok = false) {
    if (!(el instanceof HTMLElement)) return;
    el.textContent = text || '';
    el.style.color = ok ? '#177245' : '#b71c1c';
  }

  let adminConfirmResolve = null;

  function closeAdminConfirmModal(result) {
    if (!(adminConfirmModal instanceof HTMLElement)) return;
    adminConfirmModal.hidden = true;
    adminConfirmModal.setAttribute('aria-hidden', 'true');
    const cb = adminConfirmResolve;
    adminConfirmResolve = null;
    if (typeof cb === 'function') cb(Boolean(result));
  }

  /**
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
   * @returns {Promise<boolean>}
   */
  function openAdminConfirmModal(opts) {
    const title = opts?.title || 'Подтверждение';
    const message = opts?.message || '';
    const okLabel = opts?.confirmLabel || 'ОК';
    const cancelLabel = opts?.cancelLabel || 'Отмена';
    const danger = Boolean(opts?.danger);

    if (!(adminConfirmModal instanceof HTMLElement)) return Promise.resolve(false);

    if (adminConfirmTitle instanceof HTMLElement) adminConfirmTitle.textContent = title;
    if (adminConfirmMessage instanceof HTMLElement) adminConfirmMessage.textContent = message;
    if (adminConfirmOk instanceof HTMLButtonElement) {
      adminConfirmOk.textContent = okLabel;
      adminConfirmOk.classList.toggle('admin-confirm-danger', danger);
    }
    if (adminConfirmCancel instanceof HTMLButtonElement) adminConfirmCancel.textContent = cancelLabel;

    return new Promise((resolve) => {
      adminConfirmResolve = resolve;
      adminConfirmModal.hidden = false;
      adminConfirmModal.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => {
        if (adminConfirmCancel instanceof HTMLButtonElement) adminConfirmCancel.focus();
      }, 0);
    });
  }

  function roleLabel(role) {
    if (role === 'client') return 'Клиент';
    if (role === 'admin') return 'Админ';
    if (role === 'manager') return 'Менеджер';
    if (role === 'operator') return 'Оператор';
    if (role === 'driver') return 'Водитель';
    return role || '—';
  }

  function redirectUnauthorizedToHome() {
    window.location.replace(new URL('index.html', window.location.href).href);
  }

  function showAppWorkspace() {
    if (adminRestrictedEl instanceof HTMLElement) adminRestrictedEl.hidden = true;
    if (adminAppRoot instanceof HTMLElement) adminAppRoot.hidden = false;
  }

  function readLocalUser() {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function ensureAdmin() {
    if (!api) {
      redirectUnauthorizedToHome();
      return false;
    }
    const me = await api.json('/api/auth/me');
    if (me.ok && me.data?.user?.role === 'admin') return true;

    const localUser = readLocalUser();
    if (localUser?.role === 'admin' && String(localUser.email || '').toLowerCase() === 'adminekva@mail.ru') {
      const login = await api.json('/api/auth/login', {
        method: 'POST',
        body: { credential: 'adminekva@mail.ru', password: 'AdminEkva2026!' },
      });
      if (login.ok && login.data?.user?.role === 'admin') return true;
    }

    if (me.status === 0 || me.status >= 500) {
      redirectUnauthorizedToHome();
      return false;
    }
    redirectUnauthorizedToHome();
    return false;
  }

  function userInitials(u) {
    const fn = String(u.first_name || '').trim();
    const ln = String(u.last_name || '').trim();
    const first = fn.charAt(0);
    const second = ln.charAt(0) || fn.charAt(1);
    if (first && second) return (first + second).toUpperCase();
    const one = fn || ln;
    if (one.length >= 2) return one.slice(0, 2).toUpperCase();
    if (one.length === 1) return one.toUpperCase();
    const mail = String(u.email || '').trim();
    const local = mail.split('@')[0] || '';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
    return '?';
  }

  function renderUserCardHtml(u) {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
    const statusCls = u.blocked ? 'admin-badge-muted' : 'admin-badge-ok';
    const statusText = u.blocked ? 'Заблокирован' : 'Активен';
    return `<article class="admin-person-card">
      <div class="admin-person-top">
        <div class="admin-person-avatar" aria-hidden="true">${escHtml(userInitials(u))}</div>
        <div class="admin-person-lines">
          <div class="admin-person-name">${escHtml(name)}</div>
          <div class="admin-person-email">${escHtml(u.email)}</div>
          <div class="admin-person-phone">${escHtml(u.phone || '—')}</div>
        </div>
        <div class="admin-person-badges">
          <span class="admin-badge admin-badge-soft">${escHtml(roleLabel(u.role))}</span>
          <span class="admin-badge ${statusCls}">${statusText}</span>
        </div>
      </div>
      <div class="admin-person-toolbar">
        <label class="admin-person-field">
          <span class="admin-person-field-lbl">Роль</span>
          <select data-role-id="${escHtml(u.id)}" aria-label="Сменить роль пользователя">
            ${STAFF_ROLES_DISPLAY.map(
              (r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleLabel(r)}</option>`
            ).join('')}
          </select>
        </label>
        <button type="button" data-block-id="${escHtml(u.id)}" class="ghost-btn admin-person-btn">${u.blocked ? 'Разблокировать' : 'Блокировать'}</button>
      </div>
    </article>`;
  }

  function renderStaffByRoleLists() {
    const staffUsers = users.filter((u) => STAFF_ROLES_DISPLAY.includes(String(u.role)));
    STAFF_ROLES_DISPLAY.forEach((role) => {
      const container = listEls[role];
      if (!(container instanceof HTMLElement)) return;
      const slice = staffUsers.filter((u) => u.role === role);
      if (!slice.length) {
        container.innerHTML = `<p class="admin-empty-note">Нет записей.</p>`;
        return;
      }
      container.innerHTML = slice.map(renderUserCardHtml).join('');
    });
  }

  function renderCategoriesInto(selectEl) {
    if (!(selectEl instanceof HTMLSelectElement)) return;
    selectEl.innerHTML = categories.map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
  }

  function renderProducts() {
    if (!(productsList instanceof HTMLElement)) return;
    productsList.innerHTML = products
      .map(
        (p) =>
          `<article class="admin-product-card">
      <div class="admin-product-head">
        <strong class="admin-product-title">${escHtml(p.name)}</strong>
        <span class="admin-product-category">${escHtml(p.category_name || '')}</span>
      </div>
      <div class="admin-product-metrics">
        <span>${Number(p.price || 0)} ₽</span>
        <span>Остаток: ${Number(p.stock || 0)}${p.volume_liters != null && p.volume_liters !== '' ? ` · ${escHtml(String(p.volume_liters))} л` : ''}</span>
        <span class="${Number(p.hidden) ? 'admin-product-hidden' : 'admin-product-visible'}">${Number(p.hidden) ? 'Скрыт' : 'В каталоге'}</span>
      </div>
      <div class="admin-product-actions">
        <button type="button" data-edit-product="${p.id}" class="ghost-btn admin-btn-edit">Изменить</button>
        <button type="button" data-delete-product="${p.id}" class="ghost-btn">Удалить</button>
      </div>
    </article>`
      )
      .join('');
  }

  function renderStats(stats) {
    if (!stats) return;

    const totalStaff = ['admin', 'manager', 'operator', 'driver'].reduce((s, k) => s + Number(stats.usersByRole[k] || 0), 0);
    const totalClients = Number(stats.usersByRole.client || 0);

    if (statsGridEl instanceof HTMLElement) {
      statsGridEl.innerHTML = `
        <article class="admin-stat-card"><span class="admin-stat-k">Заказов всего</span><strong class="admin-stat-v">${escHtml(String(stats.ordersTotal))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Товаров в базе</span><strong class="admin-stat-v">${escHtml(String(stats.productsTotal))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">На витрине</span><strong class="admin-stat-v">${escHtml(String(stats.productsVisible))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Сотрудников (по роли)</span><strong class="admin-stat-v">${escHtml(String(totalStaff))}</strong></article>
        <article class="admin-stat-card"><span class="admin-stat-k">Клиентов (учёт записей)</span><strong class="admin-stat-v">${escHtml(String(totalClients))}</strong></article>
      `;
    }

    if (statsOrdersEl instanceof HTMLElement) {
      const rows = (stats.ordersByStatus || []).map(
        (x) =>
          `<div class="admin-stat-row"><span>${escHtml(ORDER_STATUS_LABELS[x.status] || x.status)}</span><strong>${Number(x.count) || 0}</strong></div>`
      );
      statsOrdersEl.innerHTML = rows.length ? rows.join('') : '<p class="admin-empty-note">Нет данных.</p>';
    }

    if (statsUsersEl instanceof HTMLElement) {
      const ur = stats.usersByRole || {};
      const keys = Object.keys(ur).sort((a, b) => a.localeCompare(b));
      statsUsersEl.innerHTML = keys
        .map(
          (r) =>
            `<div class="admin-stat-row"><span>${escHtml(roleLabel(r))}${r === 'client' ? ' (регистрация)' : ''}</span><strong>${Number(ur[r] ?? 0)}</strong></div>`
        )
        .join('');
    }
  }

  function coerceAdminFaqItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const code = String(raw.code ?? '').trim().slice(0, 40);
    const tag = String(raw.tag ?? '').trim().slice(0, 60);
    const question = String(raw.question ?? '').trim().slice(0, 180);
    const answer = String(raw.answer ?? '').trim().slice(0, 900);
    if (!code || !tag || question.length < 3 || answer.length < 3) return null;
    return { code, tag, question, answer };
  }

  function normalizeAdminFaqLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceAdminFaqItem(x);
      if (row) out.push(row);
      if (out.length >= 30) break;
    }
    return out;
  }

  function cloneFaqList(items) {
    return (items || []).map((x) => ({
      code: String(x.code ?? ''),
      tag: String(x.tag ?? ''),
      question: String(x.question ?? ''),
      answer: String(x.answer ?? ''),
    }));
  }

  function coerceSitePollItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? '').trim().slice(0, 56);
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const question = String(raw.question ?? '').trim().slice(0, 400);
    const active = Boolean(raw.active);
    const optsIn = Array.isArray(raw.options) ? raw.options : [];
    const options = [];
    for (const o of optsIn) {
      if (!o || typeof o !== 'object') continue;
      const oid = String(o.id ?? '').trim().slice(0, 48);
      const text = String(o.text ?? '').trim().slice(0, 160);
      if (oid.length < 1 || text.length < 1) continue;
      options.push({ id: oid, text });
      if (options.length >= 12) break;
    }
    if (id.length < 1 || question.length < 3 || options.length < 2) return null;
    return { id, title, question, active, options };
  }

  function normalizeAdminPollsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceSitePollItem(x);
      if (row) out.push(row);
      if (out.length >= 10) break;
    }
    return out;
  }

  function clonePollList(items) {
    return (items || []).map((p) => ({
      id: String(p.id ?? ''),
      title: String(p.title ?? ''),
      question: String(p.question ?? ''),
      active: Boolean(p.active),
      options: Array.isArray(p.options)
        ? p.options.map((o) => ({ id: String(o.id ?? ''), text: String(o.text ?? '') }))
        : [],
    }));
  }

  function coerceAboutCertificateItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const image = String(raw.image ?? '').trim().slice(0, ABOUT_CERT_IMAGE_MAX_LEN);
    if (!aboutCertImageAllowed(image)) return null;
    const alt = String(raw.alt ?? '').trim().slice(0, 200);
    const badge = String(raw.badge ?? '').trim().slice(0, 80);
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const description = String(raw.description ?? '').trim().slice(0, 400);
    if (image.length < 3 || alt.length < 1 || title.length < 1 || description.length < 1) return null;
    return { image, alt, badge, title, description };
  }

  function normalizeAboutCertsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceAboutCertificateItem(x);
      if (row) out.push(row);
      if (out.length >= 12) break;
    }
    return out;
  }

  function cloneAboutCertsList(items) {
    return (items || []).map((c) => ({
      image: String(c.image ?? ''),
      alt: String(c.alt ?? ''),
      badge: String(c.badge ?? ''),
      title: String(c.title ?? ''),
      description: String(c.description ?? ''),
    }));
  }

  /** @returns {{ image:string,alt:string,badge:string,title:string,description:string }[]} */
  function buildAboutCertificatesPayload() {
    return aboutCertsDraft.map((item) => coerceAboutCertificateItem(item)).filter(Boolean);
  }

  function coerceCoverageCardItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title ?? '').trim().slice(0, 120);
    const text = String(raw.text ?? '').trim().slice(0, 100);
    if (title.length < 1 || text.length < 1) return null;
    return { title, text };
  }

  function normalizeCoverageCardsLoaded(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const row = coerceCoverageCardItem(x);
      if (row) out.push(row);
      if (out.length >= 8) break;
    }
    return out;
  }

  function cloneCoverageCardsList(items) {
    return (items || []).map((x) => ({
      title: String(x.title ?? ''),
      text: String(x.text ?? ''),
    }));
  }

  function cloneDefaultCoverageCards() {
    return DEFAULT_ADMIN_DELIVERY_COVERAGE.cards.map((c) => ({ title: c.title, text: c.text }));
  }

  /** @returns {{ title:string,text:string }[]} */
  function buildCoverageCardsPayload() {
    return coverageCardsDraft.map((item) => coerceCoverageCardItem(item)).filter(Boolean);
  }

  /** @returns {{ title:string,cards:{title:string,text:string}[]}|null} */
  function buildDeliveryCoverageForPayload() {
    if (!(settingsForm instanceof HTMLFormElement)) return null;
    const title = String(settingsForm.elements.namedItem('deliveryCoverageTitle')?.value || '').trim();
    const cards = buildCoverageCardsPayload();
    if (title.length < 3 || cards.length < 1) return null;
    return {
      title: title.slice(0, 160),
      cards,
    };
  }

  /** @returns {{ id:string,title:string,question:string,active:boolean,options:{id:string,text:string}[]}[]} */
  function buildSitePollsPayload() {
    return pollsDraft.map((item) => coerceSitePollItem(item)).filter(Boolean);
  }

  /** @returns {{ code:string,tag:string,question:string,answer:string }[]} */
  function buildDeliveryFaqPayload() {
    return faqDraft.map((item) =>
      coerceAdminFaqItem({
        code: item.code,
        tag: item.tag,
        question: item.question,
        answer: item.answer,
      })
    ).filter(Boolean);
  }

  /** Полный payload как у формы «Сохранить настройки» (совпадает с Joi на сервере). */
  function buildManagerSettingsPayload() {
    if (!(settingsForm instanceof HTMLFormElement)) return null;
    const slots = String(settingsForm.elements.namedItem('deliverySlotsText')?.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const deliveryFaq = buildDeliveryFaqPayload();
    if (!deliveryFaq.length) return null;
    const sitePolls = buildSitePollsPayload();
    const aboutCertificates = buildAboutCertificatesPayload();
    const deliveryCoverage = buildDeliveryCoverageForPayload();
    if (!deliveryCoverage) return null;
    return {
      workLine: String(settingsForm.elements.namedItem('workLine')?.value || '').trim(),
      communityIntro: String(settingsForm.elements.namedItem('communityIntro')?.value || '').trim(),
      deliverySlots: slots,
      deliveryFaq,
      sitePolls,
      aboutCertificates,
      deliveryCoverage,
    };
  }

  /**
   * @param {HTMLElement | null | undefined} errorEl сообщение об ошибке — в модалке или под формой настроек.
   */
  async function persistManagerSettings(errorEl) {
    const el = errorEl instanceof HTMLElement ? errorEl : settingsMsg;
    const payload = buildManagerSettingsPayload();
    if (!payload) {
      showMsg(
        el,
        'Не удалось сохранить: режим работы — от 3 символов; слоты — хотя бы одна строка от 3 символов; в блоке вопросов нужен хотя бы один корректный пункт; блок «Зоны покрытия»: заголовок секции от 3 символов и хотя бы одна карточка с непустым текстом.'
      );
      return false;
    }
    try {
      const r = await api.json('/api/manager/settings', { method: 'PUT', body: payload });
      if (!r.ok) {
        showMsg(el, r.data?.error || 'Сервер отклонил сохранение.');
        return false;
      }
      api.resetCsrf();
      await loadSettings();
      return true;
    } catch {
      showMsg(
        el,
        'Не удалось отправить запрос. Откройте админку через запущенный сервер (например http://localhost:3001/admin.html), не через file://.'
      );
      return false;
    }
  }

  /** Сохранить только блок «Зоны покрытия» (карточки у карты на «Доставка»). */
  async function persistDeliveryCoveragePanel(errorEl) {
    const el = errorEl instanceof HTMLElement ? errorEl : settingsMsg;
    const deliveryCoverage = buildDeliveryCoverageForPayload();
    if (!deliveryCoverage) {
      showMsg(
        el,
        'Не удалось сохранить блок «Зоны покрытия»: заголовок секции — не короче 3 символов; нужна хотя бы одна карточка с непустым заголовком и текстом.'
      );
      return false;
    }
    try {
      const r = await api.json('/api/manager/settings/delivery-coverage', { method: 'PATCH', body: deliveryCoverage });
      if (!r.ok) {
        showMsg(el, r.data?.error || 'Сервер отклонил сохранение блока «Зоны покрытия».');
        return false;
      }
      api.resetCsrf();
      await loadSettings();
      return true;
    } catch {
      showMsg(
        el,
        'Не удалось отправить запрос. Откройте админку через запущенный сервер (например http://localhost:3001/admin.html), не через file://.'
      );
      return false;
    }
  }

  function closeFaqEditModal(skipListRefresh = false) {
    if (!(adminFaqEditModal instanceof HTMLElement)) return;
    adminFaqEditModal.hidden = true;
    adminFaqEditModal.setAttribute('aria-hidden', 'true');
    faqEditModalIdx = -1;
    if (!skipListRefresh && deliveryFaqNav instanceof HTMLElement) renderFaqDraftList();
  }

  function faqEditModalIsOpen() {
    return adminFaqEditModal instanceof HTMLElement && !adminFaqEditModal.hidden;
  }

  function aboutCertEditModalIsOpen() {
    return adminAboutCertEditModal instanceof HTMLElement && !adminAboutCertEditModal.hidden;
  }

  function aboutCertAddModalIsOpen() {
    return adminAboutCertAddModal instanceof HTMLElement && !adminAboutCertAddModal.hidden;
  }

  function coverageCardEditModalIsOpen() {
    return adminCoverageCardEditModal instanceof HTMLElement && !adminCoverageCardEditModal.hidden;
  }

  function coverageCardAddModalIsOpen() {
    return adminCoverageCardAddModal instanceof HTMLElement && !adminCoverageCardAddModal.hidden;
  }

  function fillFaqEditModal(idx) {
    const item = faqDraft[idx];
    if (!item) return;
    if (adminFaqEditNum instanceof HTMLElement) {
      const n = faqDraft.length;
      adminFaqEditNum.textContent = n ? `Вопрос ${idx + 1} из ${n}` : `Вопрос ${idx + 1}`;
    }
    if (adminFaqEditCode instanceof HTMLInputElement) adminFaqEditCode.value = item.code || '';
    if (adminFaqEditTag instanceof HTMLInputElement) adminFaqEditTag.value = item.tag || '';
    if (adminFaqEditQuestion instanceof HTMLInputElement) adminFaqEditQuestion.value = item.question || '';
    if (adminFaqEditAnswer instanceof HTMLTextAreaElement) adminFaqEditAnswer.value = item.answer || '';
    if (adminFaqEditDelete instanceof HTMLButtonElement) adminFaqEditDelete.disabled = faqDraft.length <= 1;
    if (adminFaqEditModal instanceof HTMLElement) refreshCharCounters(adminFaqEditModal);
  }

  function readFaqEditModalIntoDraft() {
    if (faqEditModalIdx < 0 || !faqDraft[faqEditModalIdx]) return false;
    const code = adminFaqEditCode instanceof HTMLInputElement ? adminFaqEditCode.value : '';
    const tag = adminFaqEditTag instanceof HTMLInputElement ? adminFaqEditTag.value : '';
    const question = adminFaqEditQuestion instanceof HTMLInputElement ? adminFaqEditQuestion.value : '';
    const answer = adminFaqEditAnswer instanceof HTMLTextAreaElement ? adminFaqEditAnswer.value : '';
    const coerced = coerceAdminFaqItem({ code, tag, question, answer });
    if (!coerced) return false;
    faqDraft[faqEditModalIdx] = coerced;
    return true;
  }

  function openFaqEditModal(idx) {
    if (!(adminFaqEditModal instanceof HTMLElement)) return;
    if (!faqDraft[idx]) return;
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата («Сохранить», «Отмена» или «Добавить»).');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса.');
      return;
    }
    showMsg(adminFaqEditModalMsg, '');
    faqEditModalIdx = idx;
    fillFaqEditModal(idx);
    renderFaqDraftList();
    adminFaqEditModal.hidden = false;
    adminFaqEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminFaqEditCode instanceof HTMLInputElement) adminFaqEditCode.focus();
    }, 0);
  }

  async function submitFaqEditModal() {
    if (faqEditModalIdx < 0) return;
    const idx = faqEditModalIdx;
    const backup = { ...faqDraft[idx] };
    if (!readFaqEditModalIntoDraft()) {
      showMsg(
        adminFaqEditModalMsg,
        'Проверьте поля: код, тег, вопрос и ответ (не короче 3 символов в вопросе и ответе).'
      );
      return;
    }
    const saved = await persistManagerSettings(adminFaqEditModalMsg);
    if (!saved) {
      faqDraft[idx] = backup;
      fillFaqEditModal(idx);
      return;
    }
    closeFaqEditModal();
    showMsg(
      settingsMsg,
      'Вопрос сохранён на сервере. Откройте или обновите страницу «Доставка», чтобы увидеть текст у клиентов.',
      true
    );
  }

  async function deleteFaqFromEditModal() {
    if (faqEditModalIdx < 0) return;
    if (faqDraft.length <= 1) {
      showMsg(adminFaqEditModalMsg, 'Нужен хотя бы один вопрос в этом блоке.');
      return;
    }
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить вопрос?',
      message: 'Вопрос будет убран из блока на странице «Доставка». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneFaqList(faqDraft);
    const idx = faqEditModalIdx;
    faqDraft.splice(idx, 1);
    closeFaqEditModal(true);
    renderFaqDraftList();

    const saved = await persistManagerSettings(settingsMsg);
    if (!saved) {
      faqDraft = backup;
      renderFaqDraftList();
      return;
    }
    showMsg(settingsMsg, 'Вопрос удалён на сервере.', true);
  }

  function renderFaqDraftList() {
    if (!(deliveryFaqNav instanceof HTMLElement)) return;
    deliveryFaqNav.innerHTML = '';
    faqDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-delivery-faq-preview-card';
      if (faqEditModalIdx >= 0 && idx === faqEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const codeEl = document.createElement('span');
      codeEl.className = 'delivery-faq-nav-code';
      codeEl.textContent = item.code || '—';

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const tagEl = document.createElement('span');
      tagEl.className = 'delivery-faq-nav-tag';
      tagEl.textContent = item.tag || '—';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-faq-edit-idx', String(idx));

      actions.appendChild(tagEl);
      actions.appendChild(editBtn);
      top.appendChild(codeEl);
      top.appendChild(actions);

      const qEl = document.createElement('p');
      qEl.className = 'delivery-faq-nav-text';
      qEl.style.marginTop = '0.34rem';
      qEl.textContent = item.question || '';

      const aEl = document.createElement('p');
      aEl.className = 'admin-delivery-faq-card-answer-preview';
      aEl.textContent = item.answer || '';

      wrap.appendChild(top);
      wrap.appendChild(qEl);
      wrap.appendChild(aEl);
      deliveryFaqNav.appendChild(wrap);
    });
  }

  function initFaqDraftFromLoaded(listFromApi) {
    closeFaqEditModal(true);
    const normalized = normalizeAdminFaqLoaded(listFromApi);
    faqDraft = cloneFaqList(normalized.length ? normalized : [...DEFAULT_ADMIN_FAQ]);
    renderFaqDraftList();
  }

  function resetFaqAddModalFields() {
    if (adminFaqAddCode instanceof HTMLInputElement) adminFaqAddCode.value = 'Тема';
    if (adminFaqAddTag instanceof HTMLInputElement) adminFaqAddTag.value = 'Метка';
    if (adminFaqAddQuestion instanceof HTMLInputElement) adminFaqAddQuestion.value = 'Новый вопрос?';
    if (adminFaqAddAnswer instanceof HTMLTextAreaElement)
      adminFaqAddAnswer.value = 'Краткий ответ для клиента будет показан справа на странице доставки.';
    if (adminFaqAddModal instanceof HTMLElement) refreshCharCounters(adminFaqAddModal);
  }

  function openFaqAddModal() {
    if (!(adminFaqAddModal instanceof HTMLElement)) return;
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования («Сохранить» или «Отмена»).');
      return;
    }
    if (faqDraft.length >= 30) {
      showMsg(settingsMsg, 'Не больше 30 вопросов в этом блоке.');
      return;
    }
    showMsg(adminFaqAddModalMsg, '');
    resetFaqAddModalFields();
    adminFaqAddModal.hidden = false;
    adminFaqAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminFaqAddCode instanceof HTMLInputElement) adminFaqAddCode.focus();
    }, 0);
  }

  function closeFaqAddModal() {
    if (!(adminFaqAddModal instanceof HTMLElement)) return;
    adminFaqAddModal.hidden = true;
    adminFaqAddModal.setAttribute('aria-hidden', 'true');
  }

  async function submitFaqAddFromModal() {
    const code = adminFaqAddCode instanceof HTMLInputElement ? adminFaqAddCode.value : '';
    const tag = adminFaqAddTag instanceof HTMLInputElement ? adminFaqAddTag.value : '';
    const question = adminFaqAddQuestion instanceof HTMLInputElement ? adminFaqAddQuestion.value : '';
    const answer = adminFaqAddAnswer instanceof HTMLTextAreaElement ? adminFaqAddAnswer.value : '';
    const coerced = coerceAdminFaqItem({ code, tag, question, answer });
    if (!coerced) {
      showMsg(
        adminFaqAddModalMsg,
        'Заполните код, тег, вопрос и ответ (не короче 3 символов в вопросе и ответе).'
      );
      return;
    }
    faqDraft.push(coerced);
    const saved = await persistManagerSettings(adminFaqAddModalMsg);
    if (!saved) {
      faqDraft.pop();
      return;
    }
    closeFaqAddModal();
    renderFaqDraftList();
    showMsg(
      settingsMsg,
      'Новый вопрос сохранён на сервере. Обновите страницу «Доставка», если она уже открыта.',
      true
    );
  }

  function initPollDraftFromLoaded(listFromApi) {
    const normalized = normalizeAdminPollsLoaded(listFromApi);
    pollsDraft = clonePollList(normalized);
  }

  function closeCoverageCardEditModal(skipListRefresh = false) {
    if (!(adminCoverageCardEditModal instanceof HTMLElement)) return;
    adminCoverageCardEditModal.hidden = true;
    adminCoverageCardEditModal.setAttribute('aria-hidden', 'true');
    coverageCardEditModalIdx = -1;
    if (!skipListRefresh && adminCoverageCardsNav instanceof HTMLElement) renderCoverageCardsDraftList();
  }

  function fillCoverageCardEditModal(idx) {
    const item = coverageCardsDraft[idx];
    if (!item) return;
    if (adminCoverageCardEditNum instanceof HTMLElement) {
      const n = coverageCardsDraft.length;
      adminCoverageCardEditNum.textContent = n ? `Карточка ${idx + 1} из ${n}` : `Карточка ${idx + 1}`;
    }
    if (adminCoverageCardEditItemTitle instanceof HTMLInputElement)
      adminCoverageCardEditItemTitle.value = item.title || '';
    if (adminCoverageCardEditItemText instanceof HTMLTextAreaElement)
      adminCoverageCardEditItemText.value = item.text || '';
    if (adminCoverageCardEditDelete instanceof HTMLButtonElement)
      adminCoverageCardEditDelete.disabled = coverageCardsDraft.length <= 1;
    if (adminCoverageCardEditModal instanceof HTMLElement) refreshCharCounters(adminCoverageCardEditModal);
  }

  function readCoverageCardEditModalIntoDraft() {
    if (coverageCardEditModalIdx < 0 || !coverageCardsDraft[coverageCardEditModalIdx]) return false;
    const title =
      adminCoverageCardEditItemTitle instanceof HTMLInputElement ? adminCoverageCardEditItemTitle.value : '';
    const text =
      adminCoverageCardEditItemText instanceof HTMLTextAreaElement ? adminCoverageCardEditItemText.value : '';
    const coerced = coerceCoverageCardItem({ title, text });
    if (!coerced) return false;
    coverageCardsDraft[coverageCardEditModalIdx] = coerced;
    return true;
  }

  function openCoverageCardEditModal(idx) {
    if (!(adminCoverageCardEditModal instanceof HTMLElement)) return;
    if (!coverageCardsDraft[idx]) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно «Новая карточка».');
      return;
    }
    showMsg(adminCoverageCardEditModalMsg, '');
    coverageCardEditModalIdx = idx;
    fillCoverageCardEditModal(idx);
    renderCoverageCardsDraftList();
    adminCoverageCardEditModal.hidden = false;
    adminCoverageCardEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminCoverageCardEditItemTitle instanceof HTMLInputElement) adminCoverageCardEditItemTitle.focus();
    }, 0);
  }

  async function submitCoverageCardEditModal() {
    if (coverageCardEditModalIdx < 0) return;
    const idx = coverageCardEditModalIdx;
    const backup = cloneCoverageCardsList([coverageCardsDraft[idx]])[0];
    if (!readCoverageCardEditModalIntoDraft()) {
      showMsg(adminCoverageCardEditModalMsg, 'Заголовок и текст карточки не должны быть пустыми.');
      return;
    }
    const saved = await persistDeliveryCoveragePanel(adminCoverageCardEditModalMsg);
    if (!saved) {
      coverageCardsDraft[idx] = backup;
      fillCoverageCardEditModal(idx);
      return;
    }
    closeCoverageCardEditModal();
    showMsg(settingsMsg, 'Блок «Зоны покрытия» сохранён на сервере. Обновите страницу «Доставка».', true);
  }

  async function deleteCoverageCardFromEditModal() {
    if (coverageCardEditModalIdx < 0) return;
    if (coverageCardsDraft.length <= 1) {
      showMsg(adminCoverageCardEditModalMsg, 'Нужна хотя бы одна карточка в этом блоке.');
      return;
    }
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить карточку?',
      message: 'Карточка будет убрана из блока «Зоны покрытия» на странице «Доставка». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneCoverageCardsList(coverageCardsDraft);
    const idx = coverageCardEditModalIdx;
    coverageCardsDraft.splice(idx, 1);
    closeCoverageCardEditModal(true);
    renderCoverageCardsDraftList();

    const saved = await persistDeliveryCoveragePanel(settingsMsg);
    if (!saved) {
      coverageCardsDraft = backup;
      renderCoverageCardsDraftList();
      return;
    }
    showMsg(settingsMsg, 'Карточка удалена на сервере.', true);
  }

  function renderCoverageCardsDraftList() {
    if (!(adminCoverageCardsNav instanceof HTMLElement)) return;
    adminCoverageCardsNav.innerHTML = '';
    coverageCardsDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-site-poll-preview-card admin-delivery-faq-preview-card';
      if (coverageCardEditModalIdx >= 0 && idx === coverageCardEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const titleBadge = document.createElement('span');
      titleBadge.className = 'delivery-faq-nav-code';
      titleBadge.textContent = `${idx + 1}`;

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-coverage-card-edit-idx', String(idx));

      actions.appendChild(editBtn);
      top.appendChild(titleBadge);
      top.appendChild(actions);

      const titleEl = document.createElement('p');
      titleEl.className = 'delivery-faq-nav-text';
      titleEl.style.marginTop = '0.34rem';
      titleEl.style.fontWeight = '600';
      titleEl.textContent = item.title || '';

      const textEl = document.createElement('p');
      textEl.className = 'admin-delivery-faq-card-answer-preview';
      textEl.textContent = item.text || '';

      wrap.appendChild(top);
      wrap.appendChild(titleEl);
      wrap.appendChild(textEl);
      adminCoverageCardsNav.appendChild(wrap);
    });
  }

  function initCoveragePanelFromLoaded(panelFromApi) {
    closeCoverageCardEditModal(true);
    let title = DEFAULT_ADMIN_DELIVERY_COVERAGE.title;
    let cards = cloneDefaultCoverageCards();
    if (panelFromApi && typeof panelFromApi === 'object') {
      const t = String(panelFromApi.title ?? '').trim();
      const normalized = normalizeCoverageCardsLoaded(panelFromApi.cards);
      if (t.length >= 3 && normalized.length >= 1) {
        title = t.slice(0, 160);
        cards = normalized;
      }
    }
    const ti = settingsForm instanceof HTMLFormElement ? settingsForm.elements.namedItem('deliveryCoverageTitle') : null;
    if (ti instanceof HTMLInputElement) ti.value = title;
    coverageCardsDraft = cloneCoverageCardsList(cards);
    renderCoverageCardsDraftList();
    const shell = document.querySelector('.admin-delivery-coverage-block');
    if (shell instanceof HTMLElement) refreshCharCounters(shell);
  }

  function resetCoverageCardAddModalFields() {
    if (adminCoverageCardAddItemTitle instanceof HTMLInputElement) adminCoverageCardAddItemTitle.value = 'Новая строка';
    if (adminCoverageCardAddItemText instanceof HTMLTextAreaElement)
      adminCoverageCardAddItemText.value = 'Текст для посетителей страницы «Доставка».';
    if (adminCoverageCardAddModal instanceof HTMLElement) refreshCharCounters(adminCoverageCardAddModal);
  }

  function closeCoverageCardAddModal() {
    if (!(adminCoverageCardAddModal instanceof HTMLElement)) return;
    adminCoverageCardAddModal.hidden = true;
    adminCoverageCardAddModal.setAttribute('aria-hidden', 'true');
  }

  function openCoverageCardAddModal() {
    if (!(adminCoverageCardAddModal instanceof HTMLElement)) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (aboutCertEditModalIsOpen() || aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно сертификата.');
      return;
    }
    if (coverageCardEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования карточки.');
      return;
    }
    if (coverageCardsDraft.length >= 8) {
      showMsg(settingsMsg, 'Не больше 8 карточек.');
      return;
    }
    showMsg(adminCoverageCardAddModalMsg, '');
    resetCoverageCardAddModalFields();
    adminCoverageCardAddModal.hidden = false;
    adminCoverageCardAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminCoverageCardAddItemTitle instanceof HTMLInputElement) adminCoverageCardAddItemTitle.focus();
    }, 0);
  }

  async function submitCoverageCardAddFromModal() {
    const title =
      adminCoverageCardAddItemTitle instanceof HTMLInputElement ? adminCoverageCardAddItemTitle.value : '';
    const text = adminCoverageCardAddItemText instanceof HTMLTextAreaElement ? adminCoverageCardAddItemText.value : '';
    const coerced = coerceCoverageCardItem({ title, text });
    if (!coerced) {
      showMsg(adminCoverageCardAddModalMsg, 'Заголовок и текст карточки не должны быть пустыми.');
      return;
    }
    coverageCardsDraft.push(coerced);
    const saved = await persistDeliveryCoveragePanel(adminCoverageCardAddModalMsg);
    if (!saved) {
      coverageCardsDraft.pop();
      return;
    }
    closeCoverageCardAddModal();
    renderCoverageCardsDraftList();
    showMsg(settingsMsg, 'Карточка добавлена на сервере.', true);
  }

  function closeAboutCertEditModal(skipListRefresh = false) {
    if (!(adminAboutCertEditModal instanceof HTMLElement)) return;
    adminAboutCertEditModal.hidden = true;
    adminAboutCertEditModal.setAttribute('aria-hidden', 'true');
    aboutCertEditModalIdx = -1;
    if (!skipListRefresh && adminAboutCertsNav instanceof HTMLElement) renderAboutCertsDraftList();
  }

  function fillAboutCertEditModal(idx) {
    const item = aboutCertsDraft[idx];
    if (!item) return;
    if (adminAboutCertEditNum instanceof HTMLElement) {
      const n = aboutCertsDraft.length;
      adminAboutCertEditNum.textContent = n ? `Сертификат ${idx + 1} из ${n}` : `Сертификат ${idx + 1}`;
    }
    if (adminAboutCertEditImage instanceof HTMLInputElement) adminAboutCertEditImage.value = item.image || '';
    if (adminAboutCertEditImageFile instanceof HTMLInputElement) adminAboutCertEditImageFile.value = '';
    if (adminAboutCertEditAlt instanceof HTMLInputElement) adminAboutCertEditAlt.value = item.alt || '';
    if (adminAboutCertEditBadge instanceof HTMLInputElement) adminAboutCertEditBadge.value = item.badge || '';
    if (adminAboutCertEditTitleLine instanceof HTMLInputElement) adminAboutCertEditTitleLine.value = item.title || '';
    if (adminAboutCertEditDesc instanceof HTMLTextAreaElement) adminAboutCertEditDesc.value = item.description || '';
    if (adminAboutCertEditModal instanceof HTMLElement) refreshCharCounters(adminAboutCertEditModal);
  }

  function readAboutCertEditModalIntoDraft() {
    if (aboutCertEditModalIdx < 0 || !aboutCertsDraft[aboutCertEditModalIdx]) return false;
    const image = adminAboutCertEditImage instanceof HTMLInputElement ? adminAboutCertEditImage.value : '';
    const alt = adminAboutCertEditAlt instanceof HTMLInputElement ? adminAboutCertEditAlt.value : '';
    const badge = adminAboutCertEditBadge instanceof HTMLInputElement ? adminAboutCertEditBadge.value : '';
    const title = adminAboutCertEditTitleLine instanceof HTMLInputElement ? adminAboutCertEditTitleLine.value : '';
    const description = adminAboutCertEditDesc instanceof HTMLTextAreaElement ? adminAboutCertEditDesc.value : '';
    const coerced = coerceAboutCertificateItem({ image, alt, badge, title, description });
    if (!coerced) return false;
    aboutCertsDraft[aboutCertEditModalIdx] = coerced;
    return true;
  }

  function openAboutCertEditModal(idx) {
    if (!(adminAboutCertEditModal instanceof HTMLElement)) return;
    if (!aboutCertsDraft[idx]) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно «Новый сертификат».');
      return;
    }
    showMsg(adminAboutCertEditModalMsg, '');
    aboutCertEditModalIdx = idx;
    fillAboutCertEditModal(idx);
    renderAboutCertsDraftList();
    adminAboutCertEditModal.hidden = false;
    adminAboutCertEditModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminAboutCertEditAlt instanceof HTMLInputElement) adminAboutCertEditAlt.focus();
    }, 0);
  }

  async function submitAboutCertEditModal() {
    if (aboutCertEditModalIdx < 0) return;
    const idx = aboutCertEditModalIdx;
    const backup = cloneAboutCertsList([aboutCertsDraft[idx]])[0];
    if (!readAboutCertEditModalIntoDraft()) {
      showMsg(
        adminAboutCertEditModalMsg,
        'Нужно допустимое изображение (выберите файл или оставьте уже сохранённое), заполнены alt, заголовок и описание; без javascript:/vbscript:.'
      );
      return;
    }
    const saved = await persistManagerSettings(adminAboutCertEditModalMsg);
    if (!saved) {
      aboutCertsDraft[idx] = backup;
      fillAboutCertEditModal(idx);
      return;
    }
    closeAboutCertEditModal();
    showMsg(settingsMsg, 'Сертификаты сохранены на сервере. Обновите страницу «О компании».', true);
  }

  async function deleteAboutCertFromEditModal() {
    if (aboutCertEditModalIdx < 0) return;
    const okConfirm = await openAdminConfirmModal({
      title: 'Удалить сертификат?',
      message: 'Карточка будет убрана со страницы «О компании». Изменение сразу сохранится на сервере.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    });
    if (!okConfirm) return;
    const backup = cloneAboutCertsList(aboutCertsDraft);
    const idx = aboutCertEditModalIdx;
    aboutCertsDraft.splice(idx, 1);
    closeAboutCertEditModal(true);
    renderAboutCertsDraftList();

    const saved = await persistManagerSettings(settingsMsg);
    if (!saved) {
      aboutCertsDraft = backup;
      renderAboutCertsDraftList();
      return;
    }
    showMsg(settingsMsg, 'Сертификат удалён на сервере.', true);
  }

  function renderAboutCertsDraftList() {
    if (!(adminAboutCertsNav instanceof HTMLElement)) return;
    adminAboutCertsNav.innerHTML = '';
    if (!aboutCertsDraft.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty-note';
      empty.textContent =
        'Список пуст на сервере — у посетителей покажутся карточки по умолчанию. Добавьте элемент или сохраните пустой список через «Сохранить настройки».';
      adminAboutCertsNav.appendChild(empty);
      return;
    }
    aboutCertsDraft.forEach((item, idx) => {
      const wrap = document.createElement('article');
      wrap.className = 'admin-site-poll-preview-card admin-delivery-faq-preview-card';
      if (aboutCertEditModalIdx >= 0 && idx === aboutCertEditModalIdx) wrap.classList.add('is-active-outline');

      const top = document.createElement('div');
      top.className = 'delivery-faq-nav-top';

      const badgeEl = document.createElement('span');
      badgeEl.className = 'delivery-faq-nav-code';
      badgeEl.textContent = item.badge?.trim() ? item.badge : 'Без бейджа';

      const actions = document.createElement('div');
      actions.className = 'admin-delivery-faq-card-actions';

      const thumb = document.createElement('img');
      thumb.alt = '';
      thumb.decoding = 'async';
      thumb.loading = 'lazy';
      thumb.style.maxHeight = '40px';
      thumb.style.maxWidth = '56px';
      thumb.style.objectFit = 'cover';
      thumb.style.borderRadius = '6px';
      thumb.src = item.image || '';
      thumb.addEventListener('error', () => {
        thumb.hidden = true;
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-btn admin-delivery-faq-card-edit';
      editBtn.textContent = 'Изменить';
      editBtn.setAttribute('data-about-cert-edit-idx', String(idx));

      actions.appendChild(thumb);
      actions.appendChild(editBtn);
      top.appendChild(badgeEl);
      top.appendChild(actions);

      const titleEl = document.createElement('p');
      titleEl.className = 'delivery-faq-nav-text';
      titleEl.style.marginTop = '0.34rem';
      titleEl.style.fontWeight = '600';
      titleEl.textContent = item.title || '';

      const imgPath = document.createElement('p');
      imgPath.className = 'admin-delivery-faq-card-answer-preview';
      imgPath.style.fontSize = '0.85rem';
      imgPath.textContent = item.image || '';

      wrap.appendChild(top);
      wrap.appendChild(titleEl);
      wrap.appendChild(imgPath);
      adminAboutCertsNav.appendChild(wrap);
    });
  }

  function initAboutCertsDraftFromLoaded(listFromApi) {
    closeAboutCertEditModal(true);
    const normalized = normalizeAboutCertsLoaded(listFromApi);
    aboutCertsDraft = cloneAboutCertsList(normalized.length ? normalized : [...DEFAULT_ADMIN_ABOUT_CERTIFICATES]);
    renderAboutCertsDraftList();
  }

  function resetAboutCertAddModalFields() {
    const sample = DEFAULT_ADMIN_ABOUT_CERTIFICATES[0];
    if (adminAboutCertAddImage instanceof HTMLInputElement) adminAboutCertAddImage.value = sample?.image || '';
    if (adminAboutCertAddImageFile instanceof HTMLInputElement) adminAboutCertAddImageFile.value = '';
    if (adminAboutCertAddAlt instanceof HTMLInputElement) adminAboutCertAddAlt.value = sample?.alt || '';
    if (adminAboutCertAddBadge instanceof HTMLInputElement) adminAboutCertAddBadge.value = '';
    if (adminAboutCertAddTitleLine instanceof HTMLInputElement) adminAboutCertAddTitleLine.value = 'Новый сертификат';
    if (adminAboutCertAddDesc instanceof HTMLTextAreaElement)
      adminAboutCertAddDesc.value = 'Краткое описание для карточки на странице «О компании».';
    if (adminAboutCertAddModal instanceof HTMLElement) refreshCharCounters(adminAboutCertAddModal);
  }

  function closeAboutCertAddModal() {
    if (!(adminAboutCertAddModal instanceof HTMLElement)) return;
    adminAboutCertAddModal.hidden = true;
    adminAboutCertAddModal.setAttribute('aria-hidden', 'true');
  }

  function openAboutCertAddModal() {
    if (!(adminAboutCertAddModal instanceof HTMLElement)) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования вопроса FAQ.');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно добавления вопроса FAQ.');
      return;
    }
    if (coverageCardEditModalIsOpen() || coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно карточки «Зоны покрытия».');
      return;
    }
    if (aboutCertEditModalIsOpen()) {
      showMsg(settingsMsg, 'Сначала закройте окно редактирования сертификата.');
      return;
    }
    if (aboutCertsDraft.length >= 12) {
      showMsg(settingsMsg, 'Не больше 12 сертификатов.');
      return;
    }
    showMsg(adminAboutCertAddModalMsg, '');
    resetAboutCertAddModalFields();
    adminAboutCertAddModal.hidden = false;
    adminAboutCertAddModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => {
      if (adminAboutCertAddTitleLine instanceof HTMLInputElement) adminAboutCertAddTitleLine.focus();
    }, 0);
  }

  async function submitAboutCertAddFromModal() {
    const image = adminAboutCertAddImage instanceof HTMLInputElement ? adminAboutCertAddImage.value : '';
    const alt = adminAboutCertAddAlt instanceof HTMLInputElement ? adminAboutCertAddAlt.value : '';
    const badge = adminAboutCertAddBadge instanceof HTMLInputElement ? adminAboutCertAddBadge.value : '';
    const title = adminAboutCertAddTitleLine instanceof HTMLInputElement ? adminAboutCertAddTitleLine.value : '';
    const description = adminAboutCertAddDesc instanceof HTMLTextAreaElement ? adminAboutCertAddDesc.value : '';
    const coerced = coerceAboutCertificateItem({ image, alt, badge, title, description });
    if (!coerced) {
      showMsg(
        adminAboutCertAddModalMsg,
        'Нужно допустимое изображение (выберите файл или оставьте подставленный образец), заполнены alt, заголовок и описание; без javascript:/vbscript:.'
      );
      return;
    }
    aboutCertsDraft.push(coerced);
    const saved = await persistManagerSettings(adminAboutCertAddModalMsg);
    if (!saved) {
      aboutCertsDraft.pop();
      return;
    }
    closeAboutCertAddModal();
    renderAboutCertsDraftList();
    showMsg(settingsMsg, 'Сертификат добавлен на сервере.', true);
  }

  async function loadUsers() {
    const r = await api.json('/api/admin/users');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки пользователей');
    users = Array.isArray(r.data?.users) ? r.data.users : [];
    renderStaffByRoleLists();
  }

  async function loadProducts() {
    const r = await api.json('/api/admin/products');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки товаров');
    categories = Array.isArray(r.data?.categories) ? r.data.categories : [];
    products = Array.isArray(r.data?.products) ? r.data.products : [];
    renderCategoriesInto(categorySelect);
    renderCategoriesInto(editCategory);
    renderProducts();
  }

  async function loadStats() {
    const r = await api.json('/api/admin/stats');
    if (!r.ok) return;
    renderStats(r.data);
  }

  async function loadSettings() {
    const r = await api.json('/api/manager/settings');
    if (!r.ok || !(settingsForm instanceof HTMLFormElement)) {
      if (!faqDraft.length) initFaqDraftFromLoaded(null);
      initPollDraftFromLoaded(null);
      initAboutCertsDraftFromLoaded(null);
      initCoveragePanelFromLoaded(null);
      return;
    }
    settingsForm.elements.namedItem('workLine').value = r.data.workLine || '';
    settingsForm.elements.namedItem('communityIntro').value = r.data.communityIntro || '';
    settingsForm.elements.namedItem('deliverySlotsText').value = Array.isArray(r.data.deliverySlots)
      ? r.data.deliverySlots.join('\n')
      : '';
    initFaqDraftFromLoaded(r.data.deliveryFaq);
    initPollDraftFromLoaded(r.data.sitePolls);
    initAboutCertsDraftFromLoaded(r.data.aboutCertificates);
    initCoveragePanelFromLoaded(r.data.deliveryCoverage);
  }

  /** @param {'stats'|'staff'|'products'|'settings'} pane */
  function setActivePane(pane) {
    document.querySelectorAll('.admin-pane').forEach((el) => {
      el.classList.toggle('hidden', el.getAttribute('data-pane') !== pane);
    });
    document.querySelectorAll('.admin-subtab').forEach((btn) => {
      const isSame = btn.getAttribute('data-admin-pane') === pane;
      btn.classList.toggle('is-active', Boolean(isSame));
    });
    try {
      localStorage.setItem('ekvaline_admin_pane', pane);
    } catch {
      /* ignore */
    }
  }

  function openEditProduct(pid) {
    const p = products.find((x) => String(x.id) === String(pid));
    if (!p || !(editForm instanceof HTMLFormElement) || !(editModal instanceof HTMLElement)) return;
    editForm.elements.namedItem('product_id').value = String(p.id);
    editForm.elements.namedItem('name').value = p.name || '';
    editForm.elements.namedItem('description').value = p.description || '';
    editForm.elements.namedItem('price').value = String(Number(p.price || 0));
    editForm.elements.namedItem('stock').value = String(Number(p.stock || 0));
    const vol =
      p.volume_liters !== null && p.volume_liters !== undefined && `${p.volume_liters}` !== '' ? String(p.volume_liters) : '';
    editForm.elements.namedItem('volume_liters').value = vol;
    editForm.elements.namedItem('sort_order').value = String(p.sort_order ?? 0);
    editForm.elements.namedItem('hidden').value = String(Number(p.hidden) ? 1 : 0);
    if (editCategory instanceof HTMLSelectElement) {
      renderCategoriesInto(editCategory);
      editCategory.value = String(p.category_id || '');
    }
    showMsg(editMsg, '');
    editModal.hidden = false;
    editModal.setAttribute('aria-hidden', 'false');
    refreshCharCounters(editModal);
  }

  function closeEditProduct() {
    if (!(editModal instanceof HTMLElement)) return;
    editModal.hidden = true;
    editModal.setAttribute('aria-hidden', 'true');
  }

  async function submitCreateUser(event) {
    event.preventDefault();
    if (!(createUserForm instanceof HTMLFormElement)) return;
    const role = String(createUserForm.elements.namedItem('role')?.value || '');
    const payload = {
      first_name: String(createUserForm.elements.namedItem('first_name')?.value || '').trim(),
      last_name: String(createUserForm.elements.namedItem('last_name')?.value || '').trim(),
      email: String(createUserForm.elements.namedItem('email')?.value || '').trim().toLowerCase(),
      phone: String(createUserForm.elements.namedItem('phone')?.value || '').replace(/\D/g, ''),
      password: String(createUserForm.elements.namedItem('password')?.value || ''),
      role,
    };
    const r = await api.json('/api/admin/users', { method: 'POST', body: payload });
    if (!r.ok) return showMsg(userMsg, r.data?.error || 'Не удалось создать пользователя');
    api.resetCsrf();
    createUserForm.reset();
    refreshCharCounters(createUserForm);
    showMsg(userMsg, 'Учётная запись создана.', true);
    await Promise.all([loadUsers(), loadStats()]);
  }

  async function submitCreateProduct(event) {
    event.preventDefault();
    if (!(createProductForm instanceof HTMLFormElement)) return;
    const volRaw = createProductForm.elements.namedItem('volume_liters')?.value;
    const volume_liters =
      volRaw !== undefined && `${volRaw}`.trim() !== '' ? Number(`${volRaw}`.replace(',', '.')) : null;

    const payload = {
      category_id: Number(createProductForm.elements.namedItem('category_id')?.value || 0),
      name: String(createProductForm.elements.namedItem('name')?.value || '').trim(),
      description: String(createProductForm.elements.namedItem('description')?.value || '').trim(),
      price: Number(createProductForm.elements.namedItem('price')?.value || 0),
      stock: Number(createProductForm.elements.namedItem('stock')?.value || 0),
      sort_order: Number(createProductForm.elements.namedItem('sort_order')?.value || 0),
      hidden: Number(createProductForm.elements.namedItem('hidden')?.value || 0),
      volume_liters: Number.isFinite(volume_liters) ? volume_liters : null,
    };
    const r = await api.json('/api/admin/products', { method: 'POST', body: payload });
    if (!r.ok) return showMsg(productMsg, r.data?.error || 'Не удалось создать товар');
    api.resetCsrf();
    createProductForm.reset();
    refreshCharCounters(createProductForm);
    showMsg(productMsg, 'Товар добавлен.', true);
    await Promise.all([loadProducts(), loadStats()]);
  }

  async function submitProductEdit(event) {
    event.preventDefault();
    if (!(editForm instanceof HTMLFormElement)) return;
    const id = Number(editForm.elements.namedItem('product_id')?.value || 0);
    if (!id) return;
    const volRaw = editForm.elements.namedItem('volume_liters')?.value;
    const volume_liters = `${volRaw}`.trim() === '' ? null : Number(`${volRaw}`.replace(',', '.'));
    const body = {
      category_id: Number(editForm.elements.namedItem('category_id')?.value || 0),
      name: String(editForm.elements.namedItem('name')?.value || '').trim(),
      description: String(editForm.elements.namedItem('description')?.value || '').trim(),
      price: Number(editForm.elements.namedItem('price')?.value || 0),
      stock: Number(editForm.elements.namedItem('stock')?.value || 0),
      sort_order: Number(editForm.elements.namedItem('sort_order')?.value || 0),
      hidden: Number(editForm.elements.namedItem('hidden')?.value || 0),
      volume_liters: Number.isFinite(volume_liters) ? volume_liters : null,
    };
    const r = await api.json(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body });
    if (!r.ok) {
      showMsg(editMsg, r.data?.error || 'Не сохранено');
      return;
    }
    api.resetCsrf();
    showMsg(editMsg, 'Сохранено.', true);
    closeEditProduct();
    await Promise.all([loadProducts(), loadStats()]);
  }

  async function submitSettings(event) {
    event.preventDefault();
    if (!(settingsForm instanceof HTMLFormElement)) return;
    if (faqEditModalIsOpen()) {
      showMsg(settingsMsg, 'Закройте окно редактирования («Сохранить» или «Отмена»).');
      return;
    }
    if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
      showMsg(settingsMsg, 'Сначала закройте окно «Новый вопрос» или добавьте пункт в список.');
      return;
    }
    if (aboutCertEditModalIsOpen()) {
      showMsg(settingsMsg, 'Закройте окно редактирования сертификата («Сохранить» или «Отмена»).');
      return;
    }
    if (aboutCertAddModalIsOpen()) {
      showMsg(settingsMsg, 'Закройте окно «Новый сертификат» или добавьте карточку.');
      return;
    }
    if (coverageCardEditModalIsOpen()) {
      showMsg(settingsMsg, 'Закройте окно редактирования карточки «Зоны покрытия» («Сохранить» или «Отмена»).');
      return;
    }
    if (coverageCardAddModalIsOpen()) {
      showMsg(settingsMsg, 'Закройте окно «Новая карточка» или сохраните карточку.');
      return;
    }
    const saved = await persistManagerSettings(settingsMsg);
    if (!saved) return;
    showMsg(settingsMsg, 'Настройки сохранены.', true);
  }

  async function onStaffListsClick(ev) {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;

    const blockId = target.getAttribute('data-block-id');
    if (blockId) {
      const user = users.find((u) => String(u.id) === blockId);
      if (!user) return;
      const r = await api.json(`/api/admin/users/${blockId}`, {
        method: 'PATCH',
        body: { blocked: user.blocked ? 0 : 1 },
      });
      if (r.ok) {
        api.resetCsrf();
        await Promise.all([loadUsers(), loadStats()]);
      }
      return;
    }

    const selEl = target instanceof HTMLSelectElement ? target : null;
    if (selEl && selEl.hasAttribute('data-role-id')) {
      const userId = selEl.getAttribute('data-role-id');
      const r = await api.json(`/api/admin/users/${userId}`, { method: 'PATCH', body: { role: selEl.value } });
      if (r.ok) {
        api.resetCsrf();
        await Promise.all([loadUsers(), loadStats()]);
      }
      return;
    }
  }

  async function onProductsClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteId = target.getAttribute('data-delete-product');
    if (deleteId) {
      const ok = await openAdminConfirmModal({
        title: 'Удалить товар?',
        message: 'Товар будет удалён из базы каталога. Отменить удаление через эту панель нельзя.',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        danger: true,
      });
      if (!ok) return;
      const r = await api.json(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      if (r.ok) {
        api.resetCsrf();
        await Promise.all([loadProducts(), loadStats()]);
      }
      return;
    }
    const editId = target.getAttribute('data-edit-product');
    if (editId) openEditProduct(editId);
  }

  adminAppRoot?.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLSelectElement && t.hasAttribute('data-role-id')) onStaffListsClick(ev);
  });
  adminAppRoot?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t instanceof HTMLElement && t.closest('#adminPaneStaff')) onStaffListsClick(ev);
    if (t instanceof HTMLElement && t.closest('#adminProductsList')) onProductsClick(ev);
    if (t instanceof HTMLElement && t.getAttribute('data-close-product-modal') === 'true') closeEditProduct();
    if (t instanceof HTMLElement && t.closest('[data-close-faq-add-modal]')) closeFaqAddModal();
    if (t instanceof HTMLElement && t.closest('[data-close-faq-edit-modal]')) closeFaqEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-about-cert-edit-modal]')) closeAboutCertEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-about-cert-add-modal]')) closeAboutCertAddModal();
    if (t instanceof HTMLElement && t.closest('[data-close-coverage-card-edit-modal]')) closeCoverageCardEditModal();
    if (t instanceof HTMLElement && t.closest('[data-close-coverage-card-add-modal]')) closeCoverageCardAddModal();
  });

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      if (api) {
        try {
          await api.json('/api/auth/logout', { method: 'POST', body: {} });
          api.resetCsrf?.();
        } catch {
          /* ignore */
        }
      }
      try {
        localStorage.removeItem(CURRENT_USER_KEY);
      } catch {
        /* ignore */
      }
      window.location.replace(new URL('index.html', window.location.href).href);
    });
  }

  document.querySelectorAll('.admin-subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pane = btn.getAttribute('data-admin-pane');
      if (pane) setActivePane(/** @type {'stats'|'staff'|'products'|'settings'} */ (pane));
    });
  });

  editForm?.addEventListener('submit', submitProductEdit);

  async function init() {
    const ok = await ensureAdmin();
    if (!ok) return;
    showAppWorkspace();

    let savedPane = 'stats';
    try {
      const p = localStorage.getItem('ekvaline_admin_pane');
      if (p === 'staff' || p === 'products' || p === 'settings' || p === 'stats') savedPane = p;
    } catch {
      /* ignore */
    }
    setActivePane(savedPane);

    createUserForm?.addEventListener('submit', submitCreateUser);
    createProductForm?.addEventListener('submit', submitCreateProduct);
    settingsForm?.addEventListener('submit', submitSettings);

    deliveryFaqNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-faq-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-faq-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= faqDraft.length) return;
      openFaqEditModal(idx);
    });

    deliveryFaqAddBtn?.addEventListener('click', () => openFaqAddModal());

    adminAboutCertsNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-about-cert-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-about-cert-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= aboutCertsDraft.length) return;
      openAboutCertEditModal(idx);
    });

    adminAboutCertAddBtn?.addEventListener('click', () => openAboutCertAddModal());

    adminCoverageCardsNav?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('[data-coverage-card-edit-idx]');
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.getAttribute('data-coverage-card-edit-idx'));
      if (!Number.isFinite(idx) || idx < 0 || idx >= coverageCardsDraft.length) return;
      openCoverageCardEditModal(idx);
    });

    adminCoverageCardAddBtn?.addEventListener('click', () => openCoverageCardAddModal());

    adminFaqEditConfirm?.addEventListener('click', () => void submitFaqEditModal());
    adminFaqEditDelete?.addEventListener('click', () => void deleteFaqFromEditModal());
    adminFaqAddConfirm?.addEventListener('click', () => void submitFaqAddFromModal());

    adminAboutCertEditImageFile?.addEventListener('change', () => {
      const card =
        adminAboutCertEditModal instanceof HTMLElement
          ? adminAboutCertEditModal.querySelector('.admin-edit-modal-card')
          : null;
      void applyAboutCertPickedImageFile(
        adminAboutCertEditImageFile,
        adminAboutCertEditImage,
        adminAboutCertEditModalMsg,
        card instanceof HTMLElement ? card : adminAboutCertEditModal
      );
    });
    adminAboutCertAddImageFile?.addEventListener('change', () => {
      const card =
        adminAboutCertAddModal instanceof HTMLElement
          ? adminAboutCertAddModal.querySelector('.admin-edit-modal-card')
          : null;
      void applyAboutCertPickedImageFile(
        adminAboutCertAddImageFile,
        adminAboutCertAddImage,
        adminAboutCertAddModalMsg,
        card instanceof HTMLElement ? card : adminAboutCertAddModal
      );
    });

    adminAboutCertEditConfirm?.addEventListener('click', () => void submitAboutCertEditModal());
    adminAboutCertEditDelete?.addEventListener('click', () => void deleteAboutCertFromEditModal());
    adminAboutCertAddConfirm?.addEventListener('click', () => void submitAboutCertAddFromModal());

    adminCoverageCardEditConfirm?.addEventListener('click', () => void submitCoverageCardEditModal());
    adminCoverageCardEditDelete?.addEventListener('click', () => void deleteCoverageCardFromEditModal());
    adminCoverageCardAddConfirm?.addEventListener('click', () => void submitCoverageCardAddFromModal());

    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      if (adminConfirmModal instanceof HTMLElement && !adminConfirmModal.hidden) {
        closeAdminConfirmModal(false);
        return;
      }
      if (editModal instanceof HTMLElement && !editModal.hidden) return;
      if (adminFaqEditModal instanceof HTMLElement && !adminFaqEditModal.hidden) {
        closeFaqEditModal();
        return;
      }
      if (adminFaqAddModal instanceof HTMLElement && !adminFaqAddModal.hidden) {
        closeFaqAddModal();
        return;
      }
      if (adminAboutCertEditModal instanceof HTMLElement && !adminAboutCertEditModal.hidden) {
        closeAboutCertEditModal();
        return;
      }
      if (adminAboutCertAddModal instanceof HTMLElement && !adminAboutCertAddModal.hidden) {
        closeAboutCertAddModal();
        return;
      }
      if (adminCoverageCardEditModal instanceof HTMLElement && !adminCoverageCardEditModal.hidden) {
        closeCoverageCardEditModal();
        return;
      }
      if (adminCoverageCardAddModal instanceof HTMLElement && !adminCoverageCardAddModal.hidden) {
        closeCoverageCardAddModal();
        return;
      }
    });

    await Promise.all([loadUsers(), loadProducts(), loadSettings(), loadStats()]);
    refreshCharCounters(adminAppRoot);
    adminAppRoot?.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) syncOneCharCounter(t);
    });
  }

  adminConfirmModal?.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('[data-admin-confirm-dismiss]')) closeAdminConfirmModal(false);
  });
  adminConfirmOk?.addEventListener('click', () => closeAdminConfirmModal(true));

  init();
})();
