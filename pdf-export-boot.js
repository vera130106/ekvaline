/**
 * Надёжная загрузка html2pdf (vendor) для PDF-отчётов.
 */
(function initPdfExportBoot(global) {
  'use strict';

  let loadPromise = null;

  function getHtml2pdfFn() {
    return typeof global.html2pdf === 'function' ? global.html2pdf : null;
  }

  function waitForExistingScript(scriptEl) {
    return new Promise((resolve) => {
      if (!(scriptEl instanceof HTMLScriptElement)) {
        resolve(false);
        return;
      }
      if (scriptEl.dataset.ekvalineHtml2pdfError === '1') {
        resolve(false);
        return;
      }
      const done = () => resolve(Boolean(getHtml2pdfFn()));
      scriptEl.addEventListener('load', done, { once: true });
      scriptEl.addEventListener(
        'error',
        () => {
          scriptEl.dataset.ekvalineHtml2pdfError = '1';
          resolve(false);
        },
        { once: true }
      );
      queueMicrotask(() => {
        if (getHtml2pdfFn()) resolve(true);
      });
    });
  }

  function injectHtml2pdfScript() {
    return new Promise((resolve) => {
      const existing =
        document.querySelector('script[data-ekvaline-html2pdf="1"]') ||
        document.querySelector('script[src*="html2pdf"]');
      if (existing instanceof HTMLScriptElement) {
        waitForExistingScript(existing).then(resolve);
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/html2pdf.bundle.min.js?v=20260611pdf';
      script.async = false;
      script.dataset.ekvalineHtml2pdf = '1';
      script.onload = () => resolve(Boolean(getHtml2pdfFn()));
      script.onerror = () => {
        script.dataset.ekvalineHtml2pdfError = '1';
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  function ensureHtml2pdfReady() {
    if (getHtml2pdfFn()) return Promise.resolve(true);
    if (!loadPromise) {
      loadPromise = injectHtml2pdfScript().then((ok) => {
        if (!ok) loadPromise = null;
        return ok;
      });
    }
    return loadPromise;
  }

  function waitNextPaintFrames(n = 2) {
    return new Promise((resolve) => {
      let left = Math.max(1, Number(n) || 2);
      const tick = () => {
        left -= 1;
        if (left <= 0) resolve();
        else global.requestAnimationFrame(tick);
      };
      global.requestAnimationFrame(tick);
    });
  }

  function sheetHasVisibleText(sheet, minChars = 24) {
    if (!(sheet instanceof HTMLElement)) return false;
    const text = String(sheet.innerText || sheet.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length >= minChars;
  }

  global.EkvalinePdfExport = {
    ensureHtml2pdfReady,
    getHtml2pdfFn,
    waitNextPaintFrames,
    sheetHasVisibleText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
