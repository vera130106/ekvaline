/**
 * Резервная корзина для catalog.html — работает без входа в личный кабинет.
 */
(function catalogCartBoot() {
  if (!document.body.classList.contains('catalog-page')) return;

  const CART_KEY = 'ekvaline_cart_items';
  const WATER_MAX_QTY = 50;

  function safeParse(raw, fallback) {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function readCart() {
    try {
      const raw = safeParse(localStorage.getItem(CART_KEY), []);
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  }

  function parsePrice(value) {
    const nums = String(value || '').match(/\d+/g);
    if (!nums || !nums.length) return 0;
    return Math.max(0, Number(nums[0]) || 0);
  }

  function isWaterProduct(title) {
    return /вода|18\.?9|19\s*л/i.test(String(title || ''));
  }

  function buildItem(card) {
    if (!(card instanceof HTMLElement)) return null;
    const title = card.querySelector('h3')?.textContent?.trim() || 'Товар';
    const priceText = card.querySelector('.full-card-price, .catalog-price')?.textContent || '';
    const preorder = Boolean(card.querySelector('.preorder-mark')) || /уточнять/i.test(priceText);
    const water = isWaterProduct(title);
    const productId = card.getAttribute('data-product-id');
    const id = productId ? `product_${productId}` : water ? 'water_18_9' : title.toLowerCase().replace(/\s+/g, '_');
    return {
      id,
      title,
      price: preorder ? 0 : parsePrice(priceText),
      qty: 1,
      water,
      preorder,
      productId: productId ? Number(productId) : undefined,
    };
  }

  function ensureToastElements() {
    let toast = document.getElementById('appToast');
    let text = document.getElementById('appToastText');
    if (toast instanceof HTMLElement && text instanceof HTMLElement) {
      if (toast.parentElement !== document.body) document.body.appendChild(toast);
      return { toast, text };
    }
    const wrap = document.createElement('div');
    wrap.id = 'appToast';
    wrap.className = 'ek-notify';
    wrap.hidden = true;
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML =
      '<div class="ek-notify-card"><span class="ek-notify-icon" aria-hidden="true"></span><p id="appToastText" class="ek-notify-text"></p><button type="button" id="appToastClose" class="ek-notify-close" aria-label="Закрыть">×</button></div>';
    document.body.appendChild(wrap);
    toast = wrap;
    text = wrap.querySelector('#appToastText');
    wrap.querySelector('#appToastClose')?.addEventListener('click', () => {
      wrap.classList.remove('is-visible');
      wrap.hidden = true;
    });
    return { toast, text };
  }

  function showToast(message, variant) {
    const msg = String(message || '').trim();
    if (!msg) return;
    const { toast, text } = ensureToastElements();
    if (!(toast instanceof HTMLElement) || !(text instanceof HTMLElement)) {
      window.alert(msg);
      return;
    }
    text.textContent = msg;
    toast.dataset.variant = variant === 'error' ? 'error' : variant === 'info' ? 'info' : 'success';
    if (toast.parentElement !== document.body) document.body.appendChild(toast);
    toast.hidden = false;
    toast.classList.remove('is-visible');
    window.requestAnimationFrame(() => toast.classList.add('is-visible'));
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 3200);
  }

  function ensureCartBtn() {
    let btn = document.querySelector('.cart-floating-btn.cart-trigger-btn');
    if (!(btn instanceof HTMLElement)) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cart-floating-btn cart-trigger-btn';
      document.body.classList.add('has-floating-cart');
      document.body.appendChild(btn);
    }
    if (btn.dataset.cartTriggerBound !== '1') {
      btn.dataset.cartTriggerBound = '1';
      btn.addEventListener('click', () => {
        if (typeof window.EkvalineCart?.open === 'function') {
          window.EkvalineCart.open();
          return;
        }
        const modal = document.getElementById('cartModal');
        if (modal instanceof HTMLElement) {
          modal.classList.add('open');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      });
    }
    return btn;
  }

  function refreshBadge(btn) {
    const count = readCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    btn.textContent = `Корзина (${count})`;
  }

  function addFromCard(card) {
    if (typeof window.EkvalineCart?.addFromCard === 'function') {
      return window.EkvalineCart.addFromCard(card);
    }
    const next = buildItem(card);
    if (!next) return false;
    const items = readCart();
    const idx = items.findIndex((item) => item.id === next.id);
    if (idx >= 0) {
      if (items[idx].water && items[idx].qty >= WATER_MAX_QTY) {
        showToast('Больше 50 бутылей — договорная цена.', 'error');
        return false;
      }
      items[idx].qty += 1;
    } else {
      items.push(next);
    }
    if (!saveCart(items)) {
      showToast('Не удалось сохранить корзину. Разрешите cookies/хранилище в браузере.', 'error');
      return false;
    }
    refreshBadge(ensureCartBtn());
    showToast(`«${next.title}» добавлено в корзину`, 'success');
    return true;
  }

  function bindAddButtons() {
    document.querySelectorAll('.catalog-add-btn').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      if (button.dataset.ekvalineCartAddBound === '1') return;
      button.dataset.ekvalineCartAddBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = button.closest('.full-catalog-card, .catalog-card');
        if (card instanceof HTMLElement) addFromCard(card);
      });
    });
  }

  bindAddButtons();
  refreshBadge(ensureCartBtn());

  window.__ekvalineCatalogCartBoot = {
    addFromCard,
    readCart,
    saveCart,
    refreshBadge,
    bindAddButtons,
    showToast,
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindAddButtons();
    refreshBadge(ensureCartBtn());
  });
})();
