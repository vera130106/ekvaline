'use strict';

/** Числовой id заказа из id БД или строки «ЛС-…». */
function extractOrderNumber(rawId) {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return Math.max(0, Math.floor(rawId));
  const text = String(rawId || '').trim();
  let match = text.match(/^ЛС-(\d{1,12})$/i);
  if (match) return Number(match[1]) || 0;
  match = text.match(/^ORD-(\d{3,})$/i);
  if (match) return Number(match[1].slice(-6)) || 0;
  match = text.match(/(\d{3,12})/);
  if (match) return Number(match[1]) || 0;
  return 0;
}

/** Единый номер заказа для оператора, клиента и уведомлений: ЛС-0004545. */
function displayOrderId(rawId) {
  const text = String(rawId || '').trim();
  if (/^ЛС-\d{3,}$/i.test(text)) return text.toUpperCase();
  const n = extractOrderNumber(rawId);
  return n > 0 ? `ЛС-${String(n).padStart(6, '0')}` : 'ЛС-000000';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractOrderNumber, displayOrderId };
}

if (typeof window !== 'undefined') {
  window.EkvalineOrderDisplay = { extractOrderNumber, displayOrderId };
}
