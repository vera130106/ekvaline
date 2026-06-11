/**
 * Лимиты полей панели оператора — синхронизировать с schemas.js (NAME_MAX, ADDRESS_MAX, NOTE_MAX…).
 */
(function (root) {
  'use strict';

  const NAME_MAX = 60;
  const ADDRESS_MAX = 500;
  const NOTE_MAX = 500;
  const CHANGE_REASON_MAX = 2000;
  const ORDER_NOTE_TEXT_MAX = 2000;
  const PHONE_DIGITS_MAX = 11;
  const PHONE_MASK_MAX = 18;
  const PHONE_INPUT_MAX = PHONE_MASK_MAX;
  const SEARCH_MAX = 120;
  const MAP_STREET_MAX = 120;
  const MAP_HOUSE_MAX = 24;
  const MAP_APT_MAX = 80;
  const MAP_ENTRANCE_MAX = 12;
  const MAP_FLOOR_MAX = 12;
  const MAP_SEARCH_MAX = 240;
  const PRODUCT_TITLE_MAX = 180;
  const CART_QTY_MAX = 50;
  const CART_LINES_MAX = 30;
  const PRICE_MAX = 1_000_000;
  const ITEMS_JSON_MAX = 20000;

  function clampText(value, max) {
    const s = String(value ?? '');
    if (!Number.isFinite(max) || max < 1) return s.trim();
    return s.length > max ? s.slice(0, max).trim() : s.trim();
  }

  function addressImpliesOrenburg(address) {
    return /оренбург/i.test(String(address || '').trim());
  }

  /** Минимальная проверка адреса (как orenburg-address.js на сервере). */
  function validateDeliveryAddressLine(address) {
    const s = String(address || '').trim();
    if (s.length < 8) {
      return { ok: false, message: 'Адрес слишком короткий. Укажите город, улицу и дом.' };
    }
    if (s.length > ADDRESS_MAX) {
      return { ok: false, message: `Адрес: не более ${ADDRESS_MAX} символов.` };
    }
    if (!addressImpliesOrenburg(s)) {
      return { ok: false, message: 'Доставка выполняется только по Оренбургу.' };
    }
    const hasHouse =
      /(?:д\.?|дом\.?)\s*\d+[\w\-/а-яА-Я]*/iu.test(s) || /,\s*\d+[а-яА-Я]?(?:\s*,|\s*$)/u.test(s);
    const hasStreet =
      /(?:ул\.?|улица|проспект|пр-кт|пр\.|переулок|пер\.|шоссе|бульвар|б-р\.?|мкр\.?|микрорайон|набережная|наб\.?)\s+[^,;]+/iu.test(
        s
      ) || /,\s*[^,]{2,40},\s*(?:д\.?|дом)?/iu.test(s);
    if (!hasStreet) {
      return { ok: false, message: 'Укажите улицу и номер дома в Оренбурге.' };
    }
    if (!hasHouse) {
      return { ok: false, message: 'Укажите номер дома в адресе доставки.' };
    }
    return { ok: true };
  }

  function validateClientName(client) {
    const s = clampText(client, NAME_MAX);
    if (s.length < 2) {
      return { ok: false, message: 'Имя или организация: минимум 2 символа.' };
    }
    if (s.length > NAME_MAX) {
      return { ok: false, message: `Имя или организация: не более ${NAME_MAX} символов.` };
    }
    return { ok: true, value: s };
  }

  function validatePhoneDigits(phoneDigits) {
    const d = String(phoneDigits || '').replace(/\D/g, '');
    if (!(d.length === 11 && d[0] === '7')) {
      return { ok: false, message: 'Телефон: 11 цифр номера России (можно через +7 или 8).' };
    }
    return { ok: true, value: d };
  }

  function validateCourierNote(note) {
    const s = clampText(note, NOTE_MAX);
    if (s.length > NOTE_MAX) {
      return { ok: false, message: `Примечание: не более ${NOTE_MAX} символов.` };
    }
    return { ok: true, value: s };
  }

  function validateChangeReason(reason, required) {
    const s = clampText(reason, CHANGE_REASON_MAX);
    if (required && s.length < 3) {
      return { ok: false, message: 'Причина: минимум 3 символа.' };
    }
    if (s.length > CHANGE_REASON_MAX) {
      return { ok: false, message: `Причина: не более ${CHANGE_REASON_MAX} символов.` };
    }
    return { ok: true, value: s };
  }

  function validateCartLines(cartLines) {
    const list = Array.isArray(cartLines) ? cartLines : [];
    if (!list.length) {
      return { ok: false, message: 'Добавьте хотя бы один товар во вкладке «Товары».' };
    }
    if (list.length > CART_LINES_MAX) {
      return { ok: false, message: `В заказе не более ${CART_LINES_MAX} позиций.` };
    }
    for (let i = 0; i < list.length; i += 1) {
      const it = list[i] || {};
      const title = clampText(it.title, PRODUCT_TITLE_MAX);
      if (!title) {
        return { ok: false, message: `Позиция ${i + 1}: укажите название товара.` };
      }
      if (title.length > PRODUCT_TITLE_MAX) {
        return { ok: false, message: `Название товара: не более ${PRODUCT_TITLE_MAX} символов.` };
      }
      const qty = Math.min(CART_QTY_MAX, Math.max(1, Number(it.qty) || 0));
      if (!qty || qty < 1) {
        return { ok: false, message: `Позиция ${i + 1}: количество от 1 до ${CART_QTY_MAX}.` };
      }
      const price = Math.round(Number(it.unit_price) || 0);
      if (price < 0 || price > PRICE_MAX) {
        return {
          ok: false,
          message: `Позиция ${i + 1}: цена от 0 до ${PRICE_MAX.toLocaleString('ru-RU')} ₽.`,
        };
      }
    }
    return { ok: true };
  }

  function validateItemsJsonSize(itemsJson) {
    const s = String(itemsJson || '');
    if (s.length > ITEMS_JSON_MAX) {
      return { ok: false, message: 'Слишком много позиций в заказе — уменьшите состав.' };
    }
    return { ok: true };
  }

  /** Создание заказа оператором */
  function validateOperatorOrderCreate({ client, phoneDigits, address, note, cartLines }) {
    const nm = validateClientName(client);
    if (!nm.ok) return nm;
    const ph = validatePhoneDigits(phoneDigits);
    if (!ph.ok) return ph;
    const addr = validateDeliveryAddressLine(address);
    if (!addr.ok) return addr;
    const nt = validateCourierNote(note);
    if (!nt.ok) return nt;
    const cart = validateCartLines(cartLines);
    if (!cart.ok) return cart;
    return { ok: true, client: nm.value, phoneDigits: ph.value, address: clampText(address, ADDRESS_MAX), note: nt.value };
  }

  /** Сохранение существующего заказа (PATCH) */
  function validateOperatorOrderPatch({ note, cartLines, itemsJson, changeReason, requireReason }) {
    const nt = validateCourierNote(note);
    if (!nt.ok) return nt;
    const cart = validateCartLines(cartLines);
    if (!cart.ok) return cart;
    const ij = validateItemsJsonSize(itemsJson);
    if (!ij.ok) return ij;
    const cr = validateChangeReason(changeReason, requireReason);
    if (!cr.ok) return cr;
    return { ok: true, note: nt.value, changeReason: cr.value };
  }

  /** Карточка клиента */
  function validateClientCardFields({ client, phoneRaw, address }) {
    const nm = validateClientName(client);
    if (!nm.ok) return nm;
    const digits = String(phoneRaw || '').replace(/\D/g, '');
    let d = digits;
    if (d.length === 11 && d[0] === '8') d = `7${d.slice(1)}`;
    if (d.length === 10 && d[0] === '9') d = `7${d}`;
    if (d.length >= 10) {
      const ph = validatePhoneDigits(d);
      if (!ph.ok) return ph;
    }
    const addrLine = clampText(address, ADDRESS_MAX);
    if (addrLine && addrLine.length >= 8) {
      const addr = validateDeliveryAddressLine(addrLine);
      if (!addr.ok) return addr;
    } else if (addrLine && addrLine.length > 0 && addrLine.length < 8) {
      return { ok: false, message: 'Адрес слишком короткий. Укажите город, улицу и дом.' };
    }
    return { ok: true, client: nm.value, address: addrLine };
  }

  function phoneDigitsFromRaw(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = `7${d.slice(1)}`;
    else if (d[0] === '9') d = `7${d}`;
    else if (d[0] !== '7') d = `7${d}`;
    return d.slice(0, PHONE_DIGITS_MAX);
  }

  function formatPhoneMaskRu(raw) {
    const cleaned = phoneDigitsFromRaw(raw);
    if (!cleaned) return '';
    const p1 = cleaned.slice(1, 4);
    const p2 = cleaned.slice(4, 7);
    const p3 = cleaned.slice(7, 9);
    const p4 = cleaned.slice(9, 11);
    let result = '+7';
    if (p1) result += ` (${p1}`;
    if (p1.length === 3) result += ')';
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;
    return result;
  }

  function phoneInputWouldExceedLimit(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return false;
    if (d[0] === '8') d = `7${d.slice(1)}`;
    else if (d[0] === '9') d = `7${d}`;
    else if (d[0] !== '7') d = `7${d}`;
    return d.length > PHONE_DIGITS_MAX;
  }

  function syncPhoneDigitCounter(el, counterEl) {
    if (!(el instanceof HTMLInputElement) || !(counterEl instanceof HTMLElement)) return;
    const len = phoneDigitsFromRaw(el.value).length;
    counterEl.textContent = `${len}/${PHONE_DIGITS_MAX}`;
  }

  function bindPhoneInput(el, onTrim) {
    if (!(el instanceof HTMLInputElement)) return;
    const counterId = el.getAttribute('data-phone-digits-count-for');
    const counterEl = counterId ? document.getElementById(counterId) : null;
    el.maxLength = PHONE_MASK_MAX;
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('autocomplete', 'tel');

    const apply = () => {
      const trimmed = phoneInputWouldExceedLimit(el.value);
      const formatted = formatPhoneMaskRu(el.value);
      if (el.value !== formatted) el.value = formatted;
      syncPhoneDigitCounter(el, counterEl);
      if (trimmed && typeof onTrim === 'function') onTrim(PHONE_DIGITS_MAX);
    };

    el.addEventListener('input', apply);
    apply();
  }

  function bindTextLimit(el, max, onTrim) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    el.maxLength = max;
    el.addEventListener('input', () => {
      if (el.value.length > max) {
        el.value = el.value.slice(0, max);
        if (typeof onTrim === 'function') onTrim(max);
      }
    });
  }

  function bindOperatorFormLimits(handlers) {
    const onTrim = handlers && typeof handlers.onTrim === 'function' ? handlers.onTrim : null;
    const onPhoneTrim =
      handlers && typeof handlers.onPhoneTrim === 'function' ? handlers.onPhoneTrim : onTrim;
    bindPhoneInput(handlers?.modalPhone, onPhoneTrim);
    bindPhoneInput(handlers?.clientPhone, onPhoneTrim);
    const fields = [
      [handlers?.modalClient, NAME_MAX],
      [handlers?.modalAddress, ADDRESS_MAX],
      [handlers?.modalNote, NOTE_MAX],
      [handlers?.reasonText, CHANGE_REASON_MAX],
      [handlers?.search, SEARCH_MAX],
      [handlers?.clientName, NAME_MAX],
      [handlers?.clientAddress, ADDRESS_MAX],
      [handlers?.mapStreet, MAP_STREET_MAX],
      [handlers?.mapHouse, MAP_HOUSE_MAX],
      [handlers?.mapApartment, MAP_APT_MAX],
      [handlers?.mapEntrance, MAP_ENTRANCE_MAX],
      [handlers?.mapFloor, MAP_FLOOR_MAX],
      [handlers?.mapSearch, MAP_SEARCH_MAX],
    ];
    fields.forEach(([el, max]) => {
      if (el && max) bindTextLimit(el, max, onTrim);
    });
  }

  const api = {
    NAME_MAX,
    ADDRESS_MAX,
    NOTE_MAX,
    CHANGE_REASON_MAX,
    ORDER_NOTE_TEXT_MAX,
    PHONE_DIGITS_MAX,
    PHONE_MASK_MAX,
    PHONE_INPUT_MAX,
    phoneDigitsFromRaw,
    formatPhoneMaskRu,
    syncPhoneDigitCounter,
    bindPhoneInput,
    SEARCH_MAX,
    MAP_STREET_MAX,
    MAP_HOUSE_MAX,
    MAP_APT_MAX,
    MAP_ENTRANCE_MAX,
    MAP_FLOOR_MAX,
    MAP_SEARCH_MAX,
    PRODUCT_TITLE_MAX,
    CART_QTY_MAX,
    CART_LINES_MAX,
    PRICE_MAX,
    ITEMS_JSON_MAX,
    clampText,
    validateDeliveryAddressLine,
    validateOperatorOrderCreate,
    validateOperatorOrderPatch,
    validateClientCardFields,
    validateChangeReason,
    bindOperatorFormLimits,
    bindTextLimit,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof root !== 'undefined') {
    root.OpxFieldLimits = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
