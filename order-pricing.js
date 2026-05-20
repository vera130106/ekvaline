'use strict';

/**
 * Серверный пересчёт состава заказа по каталогу — клиент не может занизить цену через DevTools.
 */

function normalizeProductTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadVisibleCatalogMap(db) {
  const rows = await db.prepare('SELECT id, name, price, hidden, stock FROM products').all();
  const map = new Map();
  for (const row of rows) {
    if (Number(row.hidden) === 1) continue;
    const name = String(row.name || '').trim();
    if (!name) continue;
    map.set(normalizeProductTitle(name), {
      id: row.id,
      name,
      price: Math.round(Number(row.price) || 0),
      stock: Math.max(0, Number(row.stock) || 0),
    });
  }
  return map;
}

function parseIncomingLineItems(body) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items.map((it) => ({
      title: String(it.title || '').trim(),
      qty: Number(it.qty),
    }));
  }
  if (body.product_title) {
    return [
      {
        title: String(body.product_title).trim(),
        qty: Number(body.qty),
      },
    ];
  }
  return [];
}

/**
 * Позиции оператора: название должно совпасть с каталогом, цена — только из БД.
 */
async function resolveOperatorOrderLines(db, body) {
  const incoming = parseIncomingLineItems(body);
  if (!incoming.length) {
    return { ok: false, error: 'Добавьте хотя бы один товар.' };
  }
  if (incoming.length > 30) {
    return { ok: false, error: 'В заказе не более 30 позиций.' };
  }

  const catalog = await loadVisibleCatalogMap(db);
  const lineItems = [];

  for (const it of incoming) {
    const title = String(it.title || '').trim();
    if (!title) return { ok: false, error: 'Укажите название товара.' };
    const hit = catalog.get(normalizeProductTitle(title));
    if (!hit) {
      return { ok: false, error: `Товар не найден в каталоге: ${title}` };
    }
    const qty = Math.min(50, Math.max(1, Math.floor(Number(it.qty) || 0)));
    if (!qty) return { ok: false, error: `Некорректное количество для «${hit.name}».` };
    lineItems.push({ title: hit.name, qty, unit_price: hit.price, product_id: hit.id });
  }

  const total_sum = lineItems.reduce((s, row) => s + row.qty * row.unit_price, 0);
  return { ok: true, lineItems, total_sum, itemsJson: JSON.stringify(lineItems) };
}

function extractLinesFromItemsJson(raw) {
  if (raw == null || raw === '') return [];
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.lines)) return parsed.lines;
  return [];
}

/**
 * PATCH заказа сотрудником: пересчитать items_json и total_sum по каталогу.
 */
async function resolveStaffOrderItemsPatch(db, itemsJsonRaw) {
  const extracted = extractLinesFromItemsJson(itemsJsonRaw);
  if (extracted === null) {
    return { ok: false, error: 'Некорректный состав заказа (items_json).' };
  }
  if (!extracted.length) {
    return { ok: false, error: 'В заказе должен остаться хотя бы один товар.' };
  }

  const catalog = await loadVisibleCatalogMap(db);
  const lineItems = [];

  for (const it of extracted) {
    const title = String(it.title || it.name || '').trim();
    if (!title) return { ok: false, error: 'Пустое название товара в составе заказа.' };
    const hit = catalog.get(normalizeProductTitle(title));
    if (!hit) {
      return { ok: false, error: `Товар не найден в каталоге: ${title}` };
    }
    const qty = Math.min(50, Math.max(1, Math.floor(Number(it.qty) || 0)));
    if (!qty) return { ok: false, error: `Некорректное количество для «${hit.name}».` };
    lineItems.push({ title: hit.name, qty, unit_price: hit.price, product_id: hit.id });
  }

  const total_sum = lineItems.reduce((s, row) => s + row.qty * row.unit_price, 0);
  return { ok: true, lineItems, total_sum, itemsJson: JSON.stringify(lineItems) };
}

module.exports = {
  normalizeProductTitle,
  resolveOperatorOrderLines,
  resolveStaffOrderItemsPatch,
};
