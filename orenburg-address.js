'use strict';

const DEFAULT_CITY = 'Оренбург';

function normalizeAddressToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/gi, '');
}

function isOrenburgCityName(city) {
  const t = normalizeAddressToken(city);
  return t === 'оренбург' || t.includes('оренбург');
}

function addressTextImpliesOrenburg(address) {
  return /оренбург/i.test(String(address || '').trim());
}

function geocodeRowInOrenburg(row) {
  if (!row || typeof row !== 'object') return false;
  const addr = row.address || {};
  const city = String(addr.city || addr.town || addr.village || addr.hamlet || '').trim();
  if (isOrenburgCityName(city)) return true;
  const state = String(addr.state || addr.state_district || '').trim();
  if (/оренбург/i.test(state)) return true;
  return /оренбург/i.test(String(row.display_name || ''));
}

function filterGeocodeRowsToOrenburg(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(geocodeRowInOrenburg);
}

/** Минимальная проверка строки адреса доставки (сервер). */
function validateDeliveryAddressLine(address) {
  const s = String(address || '').trim();
  if (s.length < 8) {
    return { ok: false, error: 'Адрес слишком короткий. Укажите город, улицу и дом.' };
  }
  if (!addressTextImpliesOrenburg(s)) {
    return { ok: false, error: 'Доставка выполняется только по Оренбургу.' };
  }
  const hasHouse = /(?:д\.?|дом\.?)\s*\d+[\w\-\/а-яА-Я]*/iu.test(s) || /,\s*\d+[а-яА-Я]?(?:\s*,|\s*$)/u.test(s);
  const hasStreet =
    /(?:ул\.?|улица|проспект|пр-кт|пр\.|переулок|пер\.|шоссе|бульвар|б-р\.?|мкр\.?|микрорайон|набережная|наб\.?)\s+[^,;]+/iu.test(s) ||
    /,\s*[^,]{2,40},\s*(?:д\.?|дом)?/iu.test(s);
  if (!hasStreet) {
    return { ok: false, error: 'Укажите улицу и номер дома в Оренбурге.' };
  }
  if (!hasHouse) {
    return { ok: false, error: 'Укажите номер дома в адресе доставки.' };
  }
  return { ok: true };
}

module.exports = {
  DEFAULT_CITY,
  normalizeAddressToken,
  isOrenburgCityName,
  addressTextImpliesOrenburg,
  geocodeRowInOrenburg,
  filterGeocodeRowsToOrenburg,
  validateDeliveryAddressLine,
};
