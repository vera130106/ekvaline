/**
 * Резервная корзина для catalog.html — работает даже если основной script.js на хосте устарел или падает с ошибкой.
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
    const raw = safeParse(localStorage.getItem(CART_KEY), []);
    return Array.isArray(raw) ? raw : [];
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
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

  function ensureCartBtn() {
    let btn = document.querySelector('.cart-floating-btn.cart-trigger-btn');
    if (!(btn instanceof HTMLElement)) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cart-floating-btn cart-trigger-btn';
      document.body.classList.add('has-floating-cart');
      document.body.appendChild(btn);
      if (btn.dataset.cartTriggerBound !== '1') {
        btn.dataset.cartTriggerBound = '1';
        btn.addEventListener('click', () => {
          if (typeof window.EkvalineCart?.open === 'function') {
            window.EkvalineCart.open();
            return;
          }
          const modal = document.getElementById('cartModal');
          if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
          }
        });
      }
    }
    return btn;
  }

  function refreshBadge(btn) {
    const count = readCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    btn.textContent = `Корзина (${count})`;
  }

  function showToast(message) {
    const msg = String(message || '').trim();
    if (!msg) return;
    let toast = document.getElementById('appToast');
    let text = document.getElementById('appToastText');
    if (!(toast instanceof HTMLElement) || !(text instanceof HTMLElement)) {
      window.alert(msg);
      return;
    }
    text.textContent = msg;
    toast.dataset.variant = 'success';
    toast.hidden = false;
    toast.classList.add('is-visible');
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 3200);
  }

  function addFromCard(card) {
    const next = buildItem(card);
    if (!next) return false;
    const items = readCart();
    const idx = items.findIndex((item) => item.id === next.id);
    if (idx >= 0) {
      if (items[idx].water && items[idx].qty >= WATER_MAX_QTY) {
        showToast('Больше 50 бутылей — договорная цена.');
        return false;
      }
      items[idx].qty += 1;
    } else {
      items.push(next);
    }
    saveCart(items);
    refreshBadge(ensureCartBtn());
    showToast(`«${next.title}» добавлено в корзину`);
    return true;
  }

  function bindButtons() {
    document.querySelectorAll('.catalog-add-btn').forEach((button) => {
      if (button.dataset.cartBound === '1') return;
      button.dataset.cartBound = '1';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const card = button.closest('.full-catalog-card, .catalog-card');
        if (card instanceof HTMLElement) addFromCard(card);
      });
    });
  }

  bindButtons();
  refreshBadge(ensureCartBtn());
  window.__ekvalineCatalogCartBoot = { addFromCard, readCart, saveCart, refreshBadge, bindButtons };
})();
