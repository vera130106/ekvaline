'use strict';

const orenburgAddress = require('./orenburg-address');
/** Ключ JavaScript API — только для загрузки карты в браузере (maps-config). */
const YMAPS_KEY = String(process.env.YANDEX_MAPS_API_KEY || '').trim();
/** Ключ HTTP Геокодера — поиск и обратное геокодирование на сервере. */
const YGEO_KEY = String(
  process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY || ''
).trim();

/** Очередь для лимита Nominatim (общий интервал между запросами). */
let nominatimQueueTail = Promise.resolve();
let nominatimLastAt = 0;

/** Кэш ответов поиска: повтор того же адреса без очереди в Nominatim (ускорение карты и подсказок). */
const GEOCODE_SEARCH_CACHE_MAX = 220;
const GEOCODE_SEARCH_CACHE_TTL_MS = 120000;
/** @type {Map<string, { t: number, rows: any[] }>} */
const geocodeSearchCache = new Map();

function geocodeSearchCacheKey(req) {
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
  return JSON.stringify({
    l: limit,
    q: String(req.query.q || '').trim().toLowerCase(),
    city: String(req.query.city || '').trim().toLowerCase(),
    street: String(req.query.street || '').trim().toLowerCase(),
    house: String(req.query.house || '').trim().toLowerCase(),
    b: String(req.query.bounded || '') === '1' ? '1' : '0',
    vb: String(req.query.viewbox || '').trim(),
    cc: String(req.query.countrycodes || '').trim(),
  });
}

function geocodeSearchCacheGet(key) {
  const entry = geocodeSearchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > GEOCODE_SEARCH_CACHE_TTL_MS) {
    geocodeSearchCache.delete(key);
    return null;
  }
  return entry.rows;
}

function geocodeSearchCacheSet(key, rows) {
  if (geocodeSearchCache.size >= GEOCODE_SEARCH_CACHE_MAX) {
    const oldest = geocodeSearchCache.keys().next().value;
    if (oldest != null) geocodeSearchCache.delete(oldest);
  }
  geocodeSearchCache.set(key, { t: Date.now(), rows: Array.isArray(rows) ? rows : [] });
}

function nominatimThrottleMs() {
  const run = nominatimQueueTail.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 1050 - (now - nominatimLastAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    nominatimLastAt = Date.now();
  });
  nominatimQueueTail = run.catch(() => {});
  return run;
}

function parseYandexGeoObject(go) {
  if (!go || typeof go !== 'object') return null;
  const pos = String(go.Point?.pos || '')
    .trim()
    .split(/\s+/);
  if (pos.length < 2) return null;
  const lon = Number(pos[0]);
  const lat = Number(pos[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const meta = go.metaDataProperty?.GeocoderMetaData;
  const text = String(meta?.text || go.name || go.description || '').trim();
  const comps = meta?.Address?.Components;
  const addr = {};
  if (Array.isArray(comps)) {
    for (const c of comps) {
      const kind = String(c.kind || '').toLowerCase();
      const name = String(c.name || '').trim();
      if (!name) continue;
      if ((kind === 'locality' || kind === 'province') && !addr.city) addr.city = name;
      if (kind === 'street') addr.road = name;
      if (kind === 'house') addr.house_number = name;
    }
  }
  const prec = String(meta?.precision || '').toLowerCase();
  const importance = prec === 'exact' ? 0.66 : prec === 'number' ? 0.62 : prec === 'near' ? 0.55 : 0.45;
  return {
    lat: String(lat),
    lon: String(lon),
    display_name: text,
    address: addr,
    type: 'yes',
    class: 'place',
    importance,
  };
}

function yandexResponseToRows(data) {
  const members = data?.response?.GeoObjectCollection?.featureMember;
  if (!Array.isArray(members)) return [];
  const rows = [];
  for (const m of members) {
    const row = parseYandexGeoObject(m?.GeoObject);
    if (row) rows.push(row);
  }
  return rows;
}

async function yandexGeocode(geocodeQuery, limit) {
  if (!YGEO_KEY) return [];
  const u = new URL('https://geocode-maps.yandex.ru/1.x/');
  u.searchParams.set('apikey', YGEO_KEY);
  u.searchParams.set('format', 'json');
  u.searchParams.set('geocode', geocodeQuery);
  u.searchParams.set('results', String(Math.min(20, Math.max(1, limit || 10))));
  u.searchParams.set('lang', 'ru_RU');
  const res = await fetch(u.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'EkvalineServer/1' },
  });
  if (!res.ok) throw new Error(`yandex_${res.status}`);
  const json = await res.json();
  return yandexResponseToRows(json);
}

/** Разбор «Оренбург, ул. X, д. N» — Nominatim по q часто пустой, нужны city+street. */
function parseFreeformAddressQuery(q) {
  const s = String(q || '').trim();
  if (!s) return null;
  let city = /оренбург/i.test(s) ? 'Оренбург' : '';
  const cityM = s.match(/(?:^|[,\s])г\.?\s*([А-Яа-яЁё\-]+)/iu);
  if (cityM && cityM[1]) city = cityM[1].trim();

  const posMk = s.match(
    /(?:пос\.?|посёлок|поселок)\s+([^,]+?),?\s*(?:ул\.?|улица)\s+([^,]+?)(?:,|\s+(?:д\.?|дом\.?)\s*(\d+[\w\-\/а-яА-Я]*))?/iu
  );
  if (posMk && posMk[2]) {
    return {
      city: city || 'Оренбург',
      street: `${posMk[1].trim()}, ${posMk[2].trim()}`,
      house: String(posMk[3] || '').trim(),
    };
  }

  const ulMk = /(?:ул\.?|улица)\s+([^,]+)/iu.exec(s);
  if (ulMk && ulMk[1]) {
    let street = String(ulMk[1]).trim();
    street = street.replace(/\s*(?:д\.?|дом\.?)\s*\d+.*$/iu, '').trim();
    const dm = /(?:д\.?|дом\.?)\s*(\d+[\w\-\/а-яА-Я]*)/iu.exec(s);
    return {
      city: city || 'Оренбург',
      street,
      house: dm ? String(dm[1]).trim() : '',
    };
  }

  const prMk = /(?:проспект|пр-кт|пр\.)\s+([^,]+)/iu.exec(s);
  if (prMk && prMk[1]) {
    let street = String(prMk[1]).trim();
    street = street.replace(/\s*(?:д\.?|дом\.?)\s*\d+.*$/iu, '').trim();
    const dm = /(?:д\.?|дом\.?)\s*(\d+[\w\-\/а-яА-Я]*)/iu.exec(s);
    return {
      city: city || 'Оренбург',
      street,
      house: dm ? String(dm[1]).trim() : '',
    };
  }

  return null;
}

async function nominatimStructuredSearch(city, street, house, limit, viewbox, bounded, countrycodes) {
  const houseStr = String(house || '').trim();
  const streetForNom = street && houseStr ? `${houseStr} ${street}`.trim() : street || houseStr || '';
  if (!city && !streetForNom) return [];
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: String(limit),
    'accept-language': 'ru',
    addressdetails: '1',
  });
  if (countrycodes) params.set('countrycodes', countrycodes);
  if (viewbox) params.set('viewbox', viewbox);
  if (bounded) params.set('bounded', '1');
  if (city) params.set('city', city);
  if (streetForNom) params.set('street', streetForNom);
  return nominatimSearch(params);
}

function buildYandexGeocodeQuery(q, city, street, house, bounded) {
  const houseStr = String(house || '').trim();
  if (city || street || houseStr) {
    const parts = ['Россия'];
    if (city) parts.push(city);
    else if (bounded) parts.push('Оренбург');
    if (street) parts.push(street);
    if (houseStr) parts.push(houseStr);
    return parts.filter(Boolean).join(', ');
  }
  let s = String(q || '').trim();
  if (bounded && s && !/оренбург/i.test(s)) s = `${s}, Оренбург`;
  if (bounded && !s) s = 'Оренбург, Россия';
  if (!s) s = 'Оренбург, Россия';
  return s;
}

async function nominatimSearch(params) {
  await nominatimThrottleMs();
  const u = new URL('https://nominatim.openstreetmap.org/search');
  params.forEach((v, k) => {
    if (v != null && v !== '') u.searchParams.set(k, String(v));
  });
  const res = await fetch(u.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'EkvalineMapsProxy/1',
    },
  });
  if (!res.ok) throw new Error(`nominatim_${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

async function nominatimReverse(lat, lon) {
  await nominatimThrottleMs();
  const u = new URL('https://nominatim.openstreetmap.org/reverse');
  u.searchParams.set('format', 'jsonv2');
  u.searchParams.set('lat', String(lat));
  u.searchParams.set('lon', String(lon));
  u.searchParams.set('accept-language', 'ru');
  u.searchParams.set('addressdetails', '1');
  const res = await fetch(u.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'EkvalineMapsProxy/1',
    },
  });
  if (!res.ok) throw new Error(`nominatim_${res.status}`);
  return res.json();
}

/**
 * @param {import('express').Application} app
 * @param {{ asyncHandler: (fn: any) => any }} helpers
 */
function mountGeocodeRoutes(app, { asyncHandler }) {
  app.get('/api/public/maps-config', (req, res) => {
    res.set('Cache-Control', 'private, max-age=120');
    res.json({
      provider: YMAPS_KEY ? 'yandex' : 'none',
      yandexMapsKey: YMAPS_KEY || null,
    });
  });

  app.get(
    '/api/public/geocode-search',
    asyncHandler(async (req, res) => {
      const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 10));
      const q = String(req.query.q || '').trim();
      const city = String(req.query.city || '').trim();
      const street = String(req.query.street || '').trim();
      const house = String(req.query.house || '').trim();
      const bounded = String(req.query.bounded || '') === '1';
      const viewbox = String(req.query.viewbox || '').trim();
      const countrycodes = String(req.query.countrycodes || '').trim();

      if (!q && !city && !street) {
        res.json([]);
        return;
      }

      const cacheKey = geocodeSearchCacheKey(req);
      const cached = geocodeSearchCacheGet(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'private, max-age=30');
        res.json(cached.slice(0, limit));
        return;
      }

      let rows = [];
      if (YGEO_KEY) {
        try {
          const yq = buildYandexGeocodeQuery(q, city, street, house, bounded);
          rows = await yandexGeocode(yq, limit);
        } catch (e) {
          console.warn('[geocode-search] yandex:', e?.message || e);
        }
      }

      if (!rows.length) {
        const streetForNom =
          street && house ? `${house} ${street}`.trim() : street || house || '';
        const params = new URLSearchParams({
          format: 'jsonv2',
          limit: String(limit),
          'accept-language': 'ru',
          addressdetails: '1',
        });
        if (countrycodes) params.set('countrycodes', countrycodes);
        if (viewbox) params.set('viewbox', viewbox);
        if (bounded) params.set('bounded', '1');
        if (q) params.set('q', q);
        if (city) params.set('city', city);
        if (streetForNom) params.set('street', streetForNom);
        rows = await nominatimSearch(params);
      }

      if (!rows.length && q && !city && !street) {
        const parsed = parseFreeformAddressQuery(q);
        if (parsed?.street) {
          if (YGEO_KEY) {
            try {
              const yq = buildYandexGeocodeQuery(
                '',
                parsed.city,
                parsed.street,
                parsed.house,
                bounded
              );
              rows = await yandexGeocode(yq, limit);
            } catch (e) {
              console.warn('[geocode-search] yandex structured:', e?.message || e);
            }
          }
          if (!rows.length) {
            rows = await nominatimStructuredSearch(
              parsed.city,
              parsed.street,
              parsed.house,
              limit,
              viewbox,
              bounded,
              countrycodes
            );
          }
        }
      }

      if (bounded) {
        if (city && !orenburgAddress.isOrenburgCityName(city)) {
          rows = [];
        } else {
          rows = orenburgAddress.filterGeocodeRowsToOrenburg(rows);
        }
      }

      if (rows.length) geocodeSearchCacheSet(cacheKey, rows);
      res.set('Cache-Control', 'private, max-age=15');
      res.json(rows.slice(0, limit));
    })
  );

  app.get(
    '/api/public/geocode-reverse',
    asyncHandler(async (req, res) => {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        res.status(400).json({ error: 'lat_lon_required' });
        return;
      }

      if (YGEO_KEY) {
        try {
          const rows = await yandexGeocode(`${lon},${lat}`, 1);
          const row = rows[0];
          if (row) {
            const addr = row.address || {};
            res.json({
              display_name: row.display_name,
              address: {
                city: addr.city,
                town: addr.city,
                road: addr.road,
                house_number: addr.house_number,
              },
            });
            return;
          }
        } catch (e) {
          console.warn('[geocode-reverse] yandex:', e?.message || e);
        }
      }

      const data = await nominatimReverse(lat, lon);
      res.json(data);
    })
  );
}

module.exports = { mountGeocodeRoutes };
