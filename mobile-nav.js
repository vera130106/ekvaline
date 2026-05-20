/**
 * РњРѕР±РёР»СЊРЅРѕРµ РјРµРЅСЋ РґР»СЏ СЃС‚СЂР°РЅРёС† СЃ С€Р°РїРєРѕР№ .topbar (РіР»Р°РІРЅР°СЏ, РєР°С‚Р°Р»РѕРі, Р°РґРјРёРЅ Рё С‚.Рґ.)
 */
(function () {
  const MQ = window.matchMedia('(max-width: 768px)');

  function stripIds(root) {
    if (!root) return;
    if (root.id) root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach(function (el) {
      el.removeAttribute('id');
    });
  }

  function init() {
    var inner = document.querySelector('.topbar .topbar-inner');
    if (!inner || inner.querySelector('.site-nav-toggle')) return;
    var menu = inner.querySelector('.menu');
    if (!menu) return;

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'site-nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'siteNavPanel');
    toggle.setAttribute('aria-label', 'РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ');
    toggle.innerHTML =
      '<span class="site-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>';

    var scrim = document.createElement('div');
    scrim.className = 'site-nav-scrim';
    scrim.hidden = true;
    scrim.setAttribute('aria-hidden', 'true');

    var panel = document.createElement('aside');
    panel.id = 'siteNavPanel';
    panel.className = 'site-nav-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', 'РќР°РІРёРіР°С†РёСЏ');

    var panelInner = document.createElement('div');
    panelInner.className = 'site-nav-panel-inner';

    var drawerMenu = menu.cloneNode(true);
    drawerMenu.classList.add('site-nav-drawer-menu');
    stripIds(drawerMenu);
    panelInner.appendChild(drawerMenu);

    var contact = inner.querySelector('.contact-area');
    if (contact) {
      var contactClone = document.createElement('div');
      contactClone.className = 'site-nav-drawer-actions';

      var hotline = contact.querySelector('.hotline');
      if (hotline) {
        var hl = hotline.cloneNode(true);
        stripIds(hl);
        contactClone.appendChild(hl);
      }

      contact.querySelectorAll('button, a[href]').forEach(function (btn) {
        if (btn.closest('.hotline')) return;
        var c = btn.cloneNode(true);
        stripIds(c);
        contactClone.appendChild(c);
      });

      if (contactClone.childElementCount) panelInner.appendChild(contactClone);
    }

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'site-nav-close';
    closeBtn.setAttribute('aria-label', 'Р—Р°РєСЂС‹С‚СЊ РјРµРЅСЋ');
    closeBtn.textContent = 'Г—';

    panel.appendChild(closeBtn);
    panel.appendChild(panelInner);
    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    var brand = inner.querySelector('.brand');
    var mid = inner.querySelector('.topbar-mid');
    if (mid && mid.childElementCount) {
      mid.after(toggle);
    } else if (brand) {
      brand.after(toggle);
    } else {
      inner.prepend(toggle);
    }

    document.body.classList.add('site-nav-ready');

    function setOpen(open) {
      document.body.classList.toggle('site-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Р—Р°РєСЂС‹С‚СЊ РјРµРЅСЋ' : 'РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      scrim.hidden = !open;
      scrim.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('site-nav-open'));
    });
    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });
    scrim.addEventListener('click', function () {
      setOpen(false);
    });
    panelInner.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest('a')) setOpen(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    if (MQ.addEventListener) {
      MQ.addEventListener('change', function (e) {
        if (!e.matches) setOpen(false);
      });
    } else if (MQ.addListener) {
      MQ.addListener(function (e) {
        if (!e.matches) setOpen(false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
