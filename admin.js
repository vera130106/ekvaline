(function () {
  const api = window.EkvalineAPI;
  const usersList = document.getElementById('adminUsersList');
  const productsList = document.getElementById('adminProductsList');
  const userMsg = document.getElementById('adminUserMsg');
  const productMsg = document.getElementById('adminProductMsg');
  const settingsMsg = document.getElementById('adminSettingsMsg');
  const categorySelect = document.getElementById('adminProductCategory');
  const createUserForm = document.getElementById('adminCreateUserForm');
  const createProductForm = document.getElementById('adminCreateProductForm');
  const settingsForm = document.getElementById('adminSettingsForm');

  let users = [];
  let products = [];
  let categories = [];

  function showMsg(el, text, ok = false) {
    if (!(el instanceof HTMLElement)) return;
    el.textContent = text || '';
    el.style.color = ok ? '#177245' : '#b71c1c';
  }

  function roleLabel(role) {
    if (role === 'admin') return 'Админ';
    if (role === 'manager') return 'Менеджер';
    if (role === 'operator') return 'Оператор';
    return role || 'Клиент';
  }

  function readLocalUser() {
    try {
      const raw = localStorage.getItem('ekvaline_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function showAuthHint(text) {
    if (!(usersList instanceof HTMLElement)) return;
    usersList.innerHTML = `<div class="admin-row"><div><strong>${text}</strong><br/><small>Войдите на главной странице как админ и откройте админ-панель снова.</small></div><div></div><div></div><div></div><div></div></div>`;
  }

  async function ensureAdmin() {
    if (!api) {
      showAuthHint('API недоступен. Запусти сайт через npm start и открой localhost.');
      return false;
    }
    const me = await api.json('/api/auth/me');
    if (me.ok && me.data?.user?.role === 'admin') return true;

    // Поддержка текущего UX: если в localStorage уже выбран demo-админ, делаем тихий серверный логин.
    const localUser = readLocalUser();
    if (localUser?.role === 'admin' && String(localUser.email || '').toLowerCase() === 'admin@ekvaline.demo') {
      const login = await api.json('/api/auth/login', {
        method: 'POST',
        body: { credential: 'admin@ekvaline.demo', password: 'AdminEkva2026!' },
      });
      if (login.ok && login.data?.user?.role === 'admin') return true;
    }

    if (me.status === 0 || me.status >= 500) {
      showAuthHint('Сервер недоступен или открыт не тот адрес.');
      return false;
    }
    showAuthHint('Нет доступа к админ-панели.');
    return false;
  }

  function renderUsers() {
    if (!(usersList instanceof HTMLElement)) return;
    usersList.innerHTML = users
      .map(
        (u) => `<div class="admin-row">
      <div><strong>${u.first_name || ''} ${u.last_name || ''}</strong><br/><small>${u.email}</small></div>
      <div>${u.phone || '—'}</div>
      <div>${roleLabel(u.role)}</div>
      <div>${u.blocked ? 'Заблокирован' : 'Активен'}</div>
      <div class="admin-actions">
        <select data-role-id="${u.id}">
          <option value="client" ${u.role === 'client' ? 'selected' : ''}>Клиент</option>
          <option value="operator" ${u.role === 'operator' ? 'selected' : ''}>Оператор</option>
          <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Менеджер</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Админ</option>
        </select>
        <button data-block-id="${u.id}" class="ghost-btn">${u.blocked ? 'Разблокировать' : 'Блокировать'}</button>
      </div>
    </div>`
      )
      .join('');
  }

  function renderProducts() {
    if (!(productsList instanceof HTMLElement)) return;
    productsList.innerHTML = products
      .map(
        (p) => `<div class="admin-row">
      <div><strong>${p.name}</strong><br/><small>${p.category_name || 'Без категории'}</small></div>
      <div>${Number(p.price || 0)} ₽</div>
      <div>Остаток: ${Number(p.stock || 0)}</div>
      <div>${Number(p.hidden) ? 'Скрыт' : 'Показан'}</div>
      <div class="admin-actions">
        <button data-edit-product="${p.id}" class="ghost-btn">Изменить</button>
        <button data-delete-product="${p.id}" class="ghost-btn">Удалить</button>
      </div>
    </div>`
      )
      .join('');
  }

  function renderCategories() {
    if (!(categorySelect instanceof HTMLSelectElement)) return;
    categorySelect.innerHTML = categories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');
  }

  async function loadUsers() {
    const r = await api.json('/api/admin/users');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки пользователей');
    users = Array.isArray(r.data?.users) ? r.data.users : [];
    renderUsers();
  }

  async function loadProducts() {
    const r = await api.json('/api/admin/products');
    if (!r.ok) throw new Error(r.data?.error || 'Ошибка загрузки товаров');
    categories = Array.isArray(r.data?.categories) ? r.data.categories : [];
    products = Array.isArray(r.data?.products) ? r.data.products : [];
    renderCategories();
    renderProducts();
  }

  async function loadSettings() {
    const r = await api.json('/api/manager/settings');
    if (!r.ok || !(settingsForm instanceof HTMLFormElement)) return;
    settingsForm.elements.namedItem('workLine').value = r.data.workLine || '';
    settingsForm.elements.namedItem('communityIntro').value = r.data.communityIntro || '';
    settingsForm.elements.namedItem('deliverySlotsText').value = Array.isArray(r.data.deliverySlots)
      ? r.data.deliverySlots.join('\n')
      : '';
  }

  async function submitCreateUser(event) {
    event.preventDefault();
    if (!(createUserForm instanceof HTMLFormElement)) return;
    const payload = {
      first_name: String(createUserForm.elements.namedItem('first_name')?.value || '').trim(),
      last_name: String(createUserForm.elements.namedItem('last_name')?.value || '').trim(),
      email: String(createUserForm.elements.namedItem('email')?.value || '').trim().toLowerCase(),
      phone: String(createUserForm.elements.namedItem('phone')?.value || '').replace(/\D/g, ''),
      password: String(createUserForm.elements.namedItem('password')?.value || ''),
      role: String(createUserForm.elements.namedItem('role')?.value || ''),
    };
    const r = await api.json('/api/admin/users', { method: 'POST', body: payload });
    if (!r.ok) return showMsg(userMsg, r.data?.error || 'Не удалось создать пользователя');
    api.resetCsrf();
    createUserForm.reset();
    showMsg(userMsg, 'Пользователь создан.', true);
    await loadUsers();
  }

  async function submitCreateProduct(event) {
    event.preventDefault();
    if (!(createProductForm instanceof HTMLFormElement)) return;
    const payload = {
      category_id: Number(createProductForm.elements.namedItem('category_id')?.value || 0),
      name: String(createProductForm.elements.namedItem('name')?.value || '').trim(),
      description: '',
      price: Number(createProductForm.elements.namedItem('price')?.value || 0),
      stock: Number(createProductForm.elements.namedItem('stock')?.value || 0),
      sort_order: Number(createProductForm.elements.namedItem('sort_order')?.value || 0),
      hidden: Number(createProductForm.elements.namedItem('hidden')?.value || 0),
      volume_liters: null,
    };
    const r = await api.json('/api/admin/products', { method: 'POST', body: payload });
    if (!r.ok) return showMsg(productMsg, r.data?.error || 'Не удалось создать товар');
    api.resetCsrf();
    createProductForm.reset();
    showMsg(productMsg, 'Товар добавлен.', true);
    await loadProducts();
  }

  async function submitSettings(event) {
    event.preventDefault();
    if (!(settingsForm instanceof HTMLFormElement)) return;
    const slots = String(settingsForm.elements.namedItem('deliverySlotsText')?.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      workLine: String(settingsForm.elements.namedItem('workLine')?.value || '').trim(),
      communityIntro: String(settingsForm.elements.namedItem('communityIntro')?.value || '').trim(),
      deliverySlots: slots,
    };
    const r = await api.json('/api/manager/settings', { method: 'PUT', body: payload });
    if (!r.ok) return showMsg(settingsMsg, r.data?.error || 'Не удалось сохранить настройки');
    api.resetCsrf();
    showMsg(settingsMsg, 'Настройки сохранены.', true);
  }

  async function onUsersClick(event) {
    const target = event.target;
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
        await loadUsers();
      }
      return;
    }
    if (target instanceof HTMLSelectElement && target.hasAttribute('data-role-id')) {
      const userId = target.getAttribute('data-role-id');
      const r = await api.json(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: { role: target.value },
      });
      if (r.ok) {
        api.resetCsrf();
        await loadUsers();
      }
    }
  }

  async function onProductsClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteId = target.getAttribute('data-delete-product');
    if (deleteId) {
      const ok = window.confirm('Удалить товар?');
      if (!ok) return;
      const r = await api.json(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      if (r.ok) {
        api.resetCsrf();
        await loadProducts();
      }
      return;
    }
    const editId = target.getAttribute('data-edit-product');
    if (editId) {
      const p = products.find((x) => String(x.id) === editId);
      if (!p) return;
      const price = window.prompt('Новая цена, ₽', String(Number(p.price || 0)));
      if (price == null) return;
      const stock = window.prompt('Новый остаток', String(Number(p.stock || 0)));
      if (stock == null) return;
      const r = await api.json(`/api/admin/products/${editId}`, {
        method: 'PATCH',
        body: { price: Number(price), stock: Number(stock) },
      });
      if (r.ok) {
        api.resetCsrf();
        await loadProducts();
      }
    }
  }

  async function init() {
    if (!(await ensureAdmin())) return;
    createUserForm?.addEventListener('submit', submitCreateUser);
    createProductForm?.addEventListener('submit', submitCreateProduct);
    settingsForm?.addEventListener('submit', submitSettings);
    usersList?.addEventListener('click', onUsersClick);
    usersList?.addEventListener('change', onUsersClick);
    productsList?.addEventListener('click', onProductsClick);
    await Promise.all([loadUsers(), loadProducts(), loadSettings()]);
  }

  init();
})();
