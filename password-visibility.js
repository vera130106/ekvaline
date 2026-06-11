/**
 * Кнопка «глаз» для всех полей type=password на сайте.
 */
(function initPasswordVisibility(global) {
  'use strict';

  const TOGGLE_SVG = `<svg class="auth-pw-icon auth-pw-icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
</svg>
<svg class="auth-pw-icon auth-pw-icon-slash" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

  function wirePasswordToggle(toggleBtn, input) {
    if (!(toggleBtn instanceof HTMLButtonElement) || !(input instanceof HTMLInputElement)) return;
    if (toggleBtn.dataset.pwToggleWired === '1') return;
    function syncUi() {
      const visible = input.type === 'text';
      toggleBtn.classList.toggle('is-visible', visible);
      toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
    }
    toggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      input.type = input.type === 'password' ? 'text' : 'password';
      syncUi();
    });
    syncUi();
    toggleBtn.dataset.pwToggleWired = '1';
    input.dataset.pwToggleWired = '1';
  }

  function enhancePasswordInput(input) {
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type !== 'password') return;
    if (input.dataset.pwToggleSkip === '1') return;
    if (input.dataset.pwToggleWired === '1') return;

    let wrap = input.closest('.auth-password-wrap');
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'auth-password-wrap';
      const parent = input.parentNode;
      if (!parent) return;
      parent.insertBefore(wrap, input);
      wrap.appendChild(input);
    }

    let btn = wrap.querySelector(':scope > .auth-password-toggle');
    if (!(btn instanceof HTMLButtonElement)) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'auth-password-toggle';
      btn.setAttribute('aria-label', 'Показать пароль');
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = TOGGLE_SVG;
      wrap.appendChild(btn);
    }

    wirePasswordToggle(btn, input);
  }

  function initPasswordVisibility(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('input[type="password"]').forEach((input) => {
      enhancePasswordInput(input);
    });
  }

  function scanNodeForPasswordInputs(node) {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLInputElement && node.type === 'password') {
      enhancePasswordInput(node);
      return;
    }
    if (node.matches?.('input[type="password"]')) enhancePasswordInput(node);
    node.querySelectorAll?.('input[type="password"]').forEach((input) => {
      enhancePasswordInput(input);
    });
  }

  let observerStarted = false;
  function startPasswordVisibilityObserver() {
    if (observerStarted || typeof global.MutationObserver !== 'function') return;
    observerStarted = true;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => scanNodeForPasswordInputs(node));
      }
    });
    const root = document.documentElement;
    if (root) observer.observe(root, { childList: true, subtree: true });
  }

  function bootPasswordVisibility() {
    initPasswordVisibility(document);
    startPasswordVisibilityObserver();
  }

  global.EkvalinePasswordVisibility = {
    init: initPasswordVisibility,
    wire: wirePasswordToggle,
    enhance: enhancePasswordInput,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPasswordVisibility);
  } else {
    bootPasswordVisibility();
  }
})(typeof window !== 'undefined' ? window : globalThis);
