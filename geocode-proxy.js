'use strict';

const YKEY = String(process.env.YANDEX_MAPS_API_KEY || '').trim();

/** Очередь для лимита Nominatim (общий интервал между запросами). */
let nominatimQueueTail = Promise.resolve();
let nominatimLastAt = 0;

function nominatimThrottleMs() {
  const run = nominatimQueueTail.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 1120 - (now - nominatimLastAt));
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
  const u = new URL('https://geocode-maps.yandex.ru/1.x/');
  u.searchParams.set('apikey', YKEY);
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
      provider: YKEY ? 'yandex' : 'osm',
      yandexMapsKey: YKEY || null,
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

      let rows = [];
      if (YKEY) {
        try {
          const yq = buildYandexGeocodeQuery(q, city, street, house, bounded);
          rows = await yandexGeocode(yq, limit);
        } catch (e) {
          console.warn('[geocode-search] yandex:', e?.message || e);
        }
      }

      if (!rows.length) {
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
        if (street) params.set('street', street);
        rows = await nominatimSearch(params);
      }

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

      if (YKEY) {
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
