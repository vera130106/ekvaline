'use strict';

/** Канонические ключи интервалов (как в корзине и у оператора). */
const BOOKING_SLOT_DEFS = Object.freeze([
  { key: '09:00-14:00', label: '09:00 – 14:00' },
  { key: '14:00-17:00', label: '14:00 – 17:00' },
  { key: '17:00-21:00', label: '17:00 – 21:00' },
  { key: '09:00-17:00', label: 'Для организаций: 09:00 – 17:00' },
]);

const BOOKING_SLOT_KEYS = Object.freeze(BOOKING_SLOT_DEFS.map((s) => s.key));

function isoCalendarDayLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function earliestDeliveryDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoCalendarDayLocal(d);
}

/** «09:00 – 14:00» / «09:00-14:00» → ключ 09:00-14:00 */
function normalizeDeliverySlotKey(raw) {
  const flat = String(raw || '')
    .trim()
    .replace(/\u2013|\u2014|\u2212/g, '-')
    .replace(/\s+/g, '');
  if (!flat) return '';
  for (const def of BOOKING_SLOT_DEFS) {
    const k = def.key.replace(/\s/g, '');
    if (flat === k || flat.includes(k)) return def.key;
  }
  const m = /(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/.exec(flat);
  if (m) {
    const cand = `${m[1]}-${m[2]}`;
    if (BOOKING_SLOT_KEYS.includes(cand)) return cand;
  }
  return '';
}

function normalizeIsoDate(raw) {
  const s = String(raw || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function emptyAvailability() {
  return { closedDays: [], closedSlots: [] };
}

function parseAvailabilityStored(raw) {
  if (raw == null || raw === '') return emptyAvailability();
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyAvailability();
    }
  }
  if (!parsed || typeof parsed !== 'object') return emptyAvailability();

  const closedDays = [];
  const daySet = new Set();
  if (Array.isArray(parsed.closedDays)) {
    parsed.closedDays.forEach((d) => {
      const iso = normalizeIsoDate(d);
      if (iso && !daySet.has(iso)) {
        daySet.add(iso);
        closedDays.push(iso);
      }
    });
  }
  closedDays.sort();

  const closedSlots = [];
  const slotSet = new Set();
  if (Array.isArray(parsed.closedSlots)) {
    parsed.closedSlots.forEach((row) => {
      const date = normalizeIsoDate(row?.date ?? row?.delivery_date);
      const slot = normalizeDeliverySlotKey(row?.slot ?? row?.delivery_slot);
      if (!date || !slot || daySet.has(date)) return;
      const sig = `${date}|${slot}`;
      if (slotSet.has(sig)) return;
      slotSet.add(sig);
      closedSlots.push({ date, slot });
    });
  }
  closedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));

  return { closedDays, closedSlots };
}

function normalizeAvailabilityMeta(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const updatedAt = String(raw.updatedAt || '').trim();
  const role = String(raw.role || '').trim().toLowerCase();
  const label = String(raw.label || raw.updatedByLabel || '').trim();
  const userId = Number(raw.userId ?? raw.updatedByUserId);
  if (!updatedAt || !role || !label) return null;
  return {
    updatedAt,
    role,
    label,
    userId: Number.isFinite(userId) && userId > 0 ? userId : null,
  };
}

/** Разбор записи site_settings: данные + кто последний раз менял. */
function parseAvailabilityRecord(raw) {
  const availability = parseAvailabilityStored(raw);
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  const meta =
    parsed && typeof parsed === 'object' && parsed.meta ? normalizeAvailabilityMeta(parsed.meta) : null;
  return { availability, meta };
}

function buildChangeMeta(userRow) {
  if (!userRow || typeof userRow !== 'object') return null;
  const name = [userRow.first_name, userRow.last_name]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const role = String(userRow.role || 'operator').trim().toLowerCase();
  let label = '';
  if (role === 'admin') {
    if (name && !/^администратор\s+системы$/i.test(name)) label = `Администратор ${name}`;
    else label = 'Администратор';
  } else if (role === 'manager') {
    label = name ? `Менеджер ${name}` : 'Менеджер';
  } else {
    label = name ? `Оператор ${name}` : 'Оператор';
  }
  return {
    updatedAt: new Date().toISOString(),
    role,
    label,
    userId: userRow.id != null ? Number(userRow.id) : null,
  };
}

function formatLastChangeRu(meta) {
  const m = normalizeAvailabilityMeta(meta);
  if (!m) return '';
  const at = new Date(m.updatedAt);
  const when = Number.isNaN(at.getTime())
    ? m.updatedAt
    : at.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  if (m.role === 'admin') {
    return `${m.label} изменил(а) настройки приёма заказов · ${when}`;
  }
  return `${m.label} сохранил(а) изменения · ${when}`;
}

function isDeliveryDayClosed(isoDate, availability) {
  const d = normalizeIsoDate(isoDate);
  if (!d) return false;
  const av = availability || emptyAvailability();
  return av.closedDays.includes(d);
}

function isDeliverySlotClosed(isoDate, slotRaw, availability) {
  const d = normalizeIsoDate(isoDate);
  const slot = normalizeDeliverySlotKey(slotRaw);
  if (!d || !slot) return false;
  const av = availability || emptyAvailability();
  if (av.closedDays.includes(d)) return true;
  return av.closedSlots.some((r) => r.date === d && r.slot === slot);
}

function validateDeliveryBooking(deliveryDate, deliverySlot, availability) {
  const date = normalizeIsoDate(deliveryDate);
  if (!date) {
    return { ok: false, error: 'Дата доставки: формат ГГГГ-ММ-ДД.' };
  }
  const min = earliestDeliveryDateIso();
  if (date < min) {
    return {
      ok: false,
      error: `Заказы принимаются с ${min.split('-').reverse().join('.')} (на следующий день, не на сегодня).`,
    };
  }
  const av = availability || emptyAvailability();
  if (isDeliveryDayClosed(date, av)) {
    return { ok: false, error: 'На выбранную дату приём заказов закрыт оператором.' };
  }
  const slotKey = normalizeDeliverySlotKey(deliverySlot);
  if (!slotKey) {
    return { ok: false, error: 'Выберите интервал доставки.' };
  }
  if (isDeliverySlotClosed(date, slotKey, av)) {
    return { ok: false, error: 'Выбранный интервал доставки недоступен на эту дату.' };
  }
  return { ok: true, value: { date, slot: slotKey } };
}

/** Список ключей слотов, доступных клиенту на дату. */
function availableSlotKeysForDate(isoDate, availability) {
  const d = normalizeIsoDate(isoDate);
  if (!d || isDeliveryDayClosed(d, availability)) return [];
  return BOOKING_SLOT_KEYS.filter((key) => !isDeliverySlotClosed(d, key, availability));
}

function slotKeyToClientValue(key) {
  return key;
}

function slotKeyToDisplayLabel(key) {
  const def = BOOKING_SLOT_DEFS.find((s) => s.key === key);
  return def ? def.label.replace(' – ', '–') : key;
}

function enumerateBookingDays(count = 30, fromIso) {
  const start = normalizeIsoDate(fromIso) || earliestDeliveryDateIso();
  const out = [];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  if (!m) return out;
  const cur = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const n = Math.min(Math.max(Number(count) || 30, 1), 90);
  for (let i = 0; i < n; i += 1) {
    out.push(isoCalendarDayLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

module.exports = {
  BOOKING_SLOT_DEFS,
  BOOKING_SLOT_KEYS,
  earliestDeliveryDateIso,
  normalizeDeliverySlotKey,
  normalizeIsoDate,
  emptyAvailability,
  parseAvailabilityStored,
  parseAvailabilityRecord,
  normalizeAvailabilityMeta,
  buildChangeMeta,
  formatLastChangeRu,
  isDeliveryDayClosed,
  isDeliverySlotClosed,
  validateDeliveryBooking,
  availableSlotKeysForDate,
  slotKeyToClientValue,
  slotKeyToDisplayLabel,
  enumerateBookingDays,
};
