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

/** Цена воды 18.9/19 л зависит от количества в строке заказа (как в корзине на сайте). */
function getWaterTierUnitPrice(qty) {
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  if (q >= 5) return 175;
  if (q >= 2) return 190;
  return 220;
}

function isWaterProductName(title) {
  const n = normalizeProductTitle(title);
  if (/вода\s*18\.?9\s*л/.test(String(title || ''))) return true;
  if (n.includes('эквалайн') && (n.includes('19') || n.includes('18'))) return true;
  return n.includes('вода') && (/18\.?9|19\s*л/.test(n) || n.length <= 16);
}

function isWaterCatalogHit(hit) {
  if (!hit) return false;
  if (isWaterProductName(hit.name)) return true;
  const vol = Number(hit.volume_liters);
  if (Number.isFinite(vol) && vol >= 18 && vol <= 20) {
    const n = normalizeProductTitle(hit.name);
    return n.includes('вода') || n.includes('эквалайн') || n.includes('бутыл');
  }
  return false;
}

function unitPriceForCatalogHit(hit, qty) {
  const base = Math.round(Number(hit?.price) || 0);
  if (isWaterCatalogHit(hit)) return getWaterTierUnitPrice(qty);
  return base;
}

async function loadVisibleCatalogMap(db) {
  const rows = await db
    .prepare('SELECT id, name, price, hidden, stock, volume_liters FROM products')
    .all();
  const map = new Map();
  const list = [];
  for (const row of rows) {
    if (Number(row.hidden) === 1) continue;
    const name = String(row.name || '').trim();
    if (!name) continue;
    const hit = {
      id: row.id,
      name,
      price: Math.round(Number(row.price) || 0),
      stock: Math.max(0, Number(row.stock) || 0),
      volume_liters: row.volume_liters != null ? Number(row.volume_liters) : null,
    };
    map.set(normalizeProductTitle(name), hit);
    list.push(hit);
  }
  return { map, list };
}

function findDefaultWaterProduct(catalogList) {
  const prefer = catalogList.find((p) => {
    const n = normalizeProductTitle(p.name);
    return n.includes('эквалайн') && (n.includes('19') || n.includes('18'));
  });
  if (prefer) return prefer;
  const waterLike = catalogList.filter((p) => {
    const n = normalizeProductTitle(p.name);
    return n.includes('вода') || /19\s*л/.test(n) || n.includes('19l') || /18\.?9/.test(n);
  });
  if (!waterLike.length) return null;
  waterLike.sort((a, b) => (a.price || 0) - (b.price || 0));
  return waterLike[0];
}

/** Сопоставление строки заказа с каталогом: id → точное имя → «Вода» → нечёткое → сохранить как есть. */
function resolveCatalogLine(catalog, catalogList, line) {
  const title = String(line.title || line.name || '').trim();
  if (!title) return { ok: false, error: 'Пустое название товара в составе заказа.' };

  const productId = Number(line.product_id);
  if (Number.isFinite(productId) && productId > 0) {
    const byId = catalogList.find((p) => Number(p.id) === productId);
    if (byId) return { ok: true, hit: byId };
  }

  const norm = normalizeProductTitle(title);
  let hit = catalog.get(norm);
  if (hit) return { ok: true, hit };

  if (norm === 'вода' || (norm.includes('вода') && (norm.includes('18') || norm.includes('19') || norm.length <= 16))) {
    hit = findDefaultWaterProduct(catalogList);
    if (hit) return { ok: true, hit };
  }

  if (/18\.?9|19\s*л/.test(norm)) {
    hit = findDefaultWaterProduct(catalogList);
    if (hit) return { ok: true, hit };
  }

  for (const candidate of catalogList) {
    const cn = normalizeProductTitle(candidate.name);
    if (cn.includes(norm) || norm.includes(cn)) return { ok: true, hit: candidate };
  }

  return { ok: false, error: `Товар не найден в каталоге: ${title}. Выберите позицию из каталога.` };
}

function buildLineItemFromHit(hit, qty) {
  const q = Math.min(50, Math.max(1, Math.floor(Number(qty) || 0)));
  if (!q) return null;
  return { title: hit.name, qty: q, unit_price: unitPriceForCatalogHit(hit, q), product_id: hit.id };
}

function sumLineItems(lineItems) {
  return lineItems.reduce((s, row) => s + row.qty * row.unit_price, 0);
}

/**
 * Оформление заказа клиентом: цены и остатки только с сервера.
 */
async function resolveClientOrderLines(db, items) {
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, error: 'Добавьте хотя бы один товар.' };
  }
  if (items.length > 30) {
    return { ok: false, error: 'В заказе не более 30 позиций.' };
  }

  const lineItems = [];
  for (const it of items) {
    const productId = Number(it.product_id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return { ok: false, error: 'Некорректный товар в заказе.' };
    }
    const p = await db
      .prepare('SELECT id, name, price, stock, hidden, volume_liters FROM products WHERE id = ?')
      .get(productId);
    if (!p || Number(p.hidden) === 1) {
      return { ok: false, error: `Товар #${productId} недоступен.` };
    }
    const qty = Math.min(50, Math.max(1, Math.floor(Number(it.qty) || 0)));
    if (!qty) return { ok: false, error: `Некорректное количество для товара #${productId}.` };
    if (Number(p.stock) < qty) {
      return { ok: false, error: `Недостаточно остатка для товара #${productId}.` };
    }
    const hit = {
      id: p.id,
      name: String(p.name || 'Товар').trim(),
      price: Math.round(Number(p.price) || 0),
      stock: Math.max(0, Number(p.stock) || 0),
      volume_liters: p.volume_liters != null ? Number(p.volume_liters) : null,
    };
    const row = buildLineItemFromHit(hit, qty);
    if (!row) return { ok: false, error: `Некорректное количество для «${hit.name}».` };
    lineItems.push(row);
  }

  const subtotal = sumLineItems(lineItems);
  return { ok: true, lineItems, subtotal, itemsJson: JSON.stringify(lineItems) };
}

function itemsJsonSemanticallyEqual(rawA, rawB) {
  const a = extractLinesFromItemsJson(rawA);
  const b = extractLinesFromItemsJson(rawB);
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const ta = normalizeProductTitle(a[i].title || a[i].name);
    const tb = normalizeProductTitle(b[i].title || b[i].name);
    const qa = Math.min(50, Math.max(1, Math.floor(Number(a[i].qty) || 0)));
    const qb = Math.min(50, Math.max(1, Math.floor(Number(b[i].qty) || 0)));
    const pa = Math.max(0, Math.round(Number(a[i].unit_price ?? a[i].price) || 0));
    const pb = Math.max(0, Math.round(Number(b[i].unit_price ?? b[i].price) || 0));
    if (ta !== tb || qa !== qb || pa !== pb) return false;
  }
  return true;
}

function parseIncomingLineItems(body) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items.map((it) => ({
      title: String(it.title || it.name || '').trim(),
      qty: Number(it.qty),
      unit_price: Number(it.unit_price ?? it.price),
      product_id: it.product_id,
    }));
  }
  if (body.product_title) {
    return [
      {
        title: String(body.product_title).trim(),
        qty: Number(body.qty),
        unit_price: Number(body.unit_price),
        product_id: body.product_id,
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

  const { map: catalog, list: catalogList } = await loadVisibleCatalogMap(db);
  const lineItems = [];

  for (const it of incoming) {
    const resolved = resolveCatalogLine(catalog, catalogList, it);
    if (!resolved.ok) return { ok: false, error: resolved.error };
    const row = buildLineItemFromHit(resolved.hit, it.qty);
    if (!row) return { ok: false, error: `Некорректное количество для «${resolved.hit.name}».` };
    lineItems.push(row);
  }

  const total_sum = sumLineItems(lineItems);
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

  const { map: catalog, list: catalogList } = await loadVisibleCatalogMap(db);
  const lineItems = [];

  for (const it of extracted) {
    const resolved = resolveCatalogLine(catalog, catalogList, it);
    if (!resolved.ok) return { ok: false, error: resolved.error };
    const row = buildLineItemFromHit(resolved.hit, it.qty);
    if (!row) return { ok: false, error: `Некорректное количество для «${resolved.hit.name}».` };
    lineItems.push(row);
  }

  const total_sum = sumLineItems(lineItems);
  return { ok: true, lineItems, total_sum, itemsJson: JSON.stringify(lineItems) };
}

function orderPayableFromItems(order, items) {
  const list = Array.isArray(items) ? items : extractLinesFromItemsJson(order?.items_json) || [];
  if (!list.length) return Math.max(0, Math.round(Number(order?.total_sum) || 0));
  const gross = list.reduce((sum, item) => {
    const qty = Math.max(1, Math.floor(Number(item?.qty) || 0));
    const stored = Math.round(Number(item?.unit_price ?? item?.price) || 0);
    const unit = isWaterProductName(item?.title || item?.name) ? getWaterTierUnitPrice(qty) : stored;
    return sum + unit * qty;
  }, 0);
  const bonuses = Math.max(0, Math.floor(Number(order?.bonuses_used) || 0));
  return Math.max(0, gross - bonuses);
}

module.exports = {
  normalizeProductTitle,
  getWaterTierUnitPrice,
  isWaterProductName,
  extractLinesFromItemsJson,
  itemsJsonSemanticallyEqual,
  resolveClientOrderLines,
  resolveOperatorOrderLines,
  resolveStaffOrderItemsPatch,
  orderPayableFromItems,
};
