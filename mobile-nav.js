/**
 * Адаптивное мобильное меню (гамбургер) для страниц с шапкой .topbar.
 */
(function () {
  const MQ = window.matchMedia('(max-width: 1020px)');

  function stripIds(root) {
    if (!root) return;
    if (root.id) root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  }

  function wireClone(clone, original) {
    if (!(clone instanceof HTMLElement) || !(original instanceof HTMLElement)) return;
    clone.addEventListener('click', (e) => {
      if (original.tagName === 'A' && original.href) return;
      e.preventDefault();
      original.click();
    });
  }

  function init() {
    const inner = document.querySelector('.topbar .topbar-inner');
    if (!inner || inner.querySelector('.site-nav-toggle')) return;
    const menu = inner.querySelector('.menu');
    if (!menu) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'site-nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'siteNavPanel');
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.innerHTML =
      '<span class="site-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>';

    const scrim = document.createElement('div');
    scrim.className = 'site-nav-scrim';
    scrim.hidden = true;
    scrim.setAttribute('aria-hidden', 'true');

    const panel = document.createElement('aside');
    panel.id = 'siteNavPanel';
    panel.className = 'site-nav-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', 'Навигация по сайту');

    const panelHead = document.createElement('div');
    panelHead.className = 'site-nav-panel-head';

    const panelTitle = document.createElement('span');
    panelTitle.className = 'site-nav-panel-title';
    panelTitle.textContent = 'Меню';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'site-nav-close';
    closeBtn.setAttribute('aria-label', 'Закрыть меню');
    closeBtn.innerHTML = '<span class="site-nav-close-icon" aria-hidden="true"></span>';

    panelHead.appendChild(panelTitle);
    panelHead.appendChild(closeBtn);

    const panelInner = document.createElement('div');
    panelInner.className = 'site-nav-panel-inner';

    const drawerMenu = menu.cloneNode(true);
    drawerMenu.classList.remove('menu');
    drawerMenu.classList.add('site-nav-drawer-menu');
    stripIds(drawerMenu);
    panelInner.appendChild(drawerMenu);

    const contact = inner.querySelector('.contact-area');
    const logoutBtn = inner.querySelector('.admin-topbar-logout');

    function fillDrawerActions(target) {
      if (!target) return;
      target.replaceChildren();

      if (contact) {
        const hotline = contact.querySelector('.hotline');
        if (hotline) {
          const hl = hotline.cloneNode(true);
          stripIds(hl);
          target.appendChild(hl);
        }

        contact.querySelectorAll('button, a[href]').forEach((btn) => {
          if (btn.closest('.hotline')) return;
          const c = btn.cloneNode(true);
          stripIds(c);
          wireClone(c, btn);
          target.appendChild(c);
        });
      }

      if (logoutBtn instanceof HTMLElement) {
        const c = logoutBtn.cloneNode(true);
        stripIds(c);
        wireClone(c, logoutBtn);
        target.appendChild(c);
      }
    }

    const contactClone = document.createElement('div');
    contactClone.className = 'site-nav-drawer-actions';
    fillDrawerActions(contactClone);
    panelInner.appendChild(contactClone);

    panel.appendChild(panelHead);
    panel.appendChild(panelInner);
    document.body.appendChild(scrim);
    document.body.appendChild(panel);
    inner.appendChild(toggle);

    document.body.classList.add('site-nav-ready');

    function setOpen(open) {
      if (open) fillDrawerActions(contactClone);
      document.body.classList.toggle('site-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      scrim.hidden = !open;
      scrim.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => {
      setOpen(!document.body.classList.contains('site-nav-open'));
    });
    closeBtn.addEventListener('click', () => setOpen(false));
    scrim.addEventListener('click', () => setOpen(false));
    panelInner.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('a')) setOpen(false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (!MQ.matches) setOpen(false);
    });
    if (MQ.addEventListener) {
      MQ.addEventListener('change', (e) => {
        if (!e.matches) setOpen(false);
      });
    } else if (MQ.addListener) {
      MQ.addListener((e) => {
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
