'use strict';

/** Сравнение интервалов доставки без ложного «переноса» из‑за пробелов и тире. */
function normalizeDeliverySlotKey(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const flat = text
    .replace(/\u2013|\u2014|\u2212/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const m = /(\d{1,2})\s*:\s*(\d{2})\s*-\s*(\d{1,2})\s*:\s*(\d{2})/.exec(flat);
  if (!m) return flat.replace(/\s/g, '');
  const pad = (h, min) =>
    `${String(Number(h) || 0).padStart(2, '0')}:${String(Number(min) || 0).padStart(2, '0')}`;
  return `${pad(m[1], m[2])}-${pad(m[3], m[4])}`;
}

function deliverySlotChanged(prev, next) {
  if (next == null) return false;
  return normalizeDeliverySlotKey(prev) !== normalizeDeliverySlotKey(next);
}

function calendarIsoFromDeliveryDate(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s.replace(/\//g, '.'));
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function deliveryDateStoredChanged(prevRaw, nextRaw) {
  const prev = String(prevRaw ?? '').trim();
  if (!prev) return false;
  const next = String(nextRaw ?? '').trim();
  if (!next) return false;
  return calendarIsoFromDeliveryDate(prev) !== calendarIsoFromDeliveryDate(next);
}

function deliverySlotStoredChanged(prevRaw, nextRaw) {
  const prev = String(prevRaw ?? '').trim();
  if (!prev) return false;
  if (nextRaw == null) return false;
  return deliverySlotChanged(prev, nextRaw);
}

const api = {
  normalizeDeliverySlotKey,
  deliverySlotChanged,
  calendarIsoFromDeliveryDate,
  deliveryDateStoredChanged,
  deliverySlotStoredChanged,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.DeliverySlots = api;
}
