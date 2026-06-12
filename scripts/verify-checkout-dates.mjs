#!/usr/bin/env node
/**
 * Проверка: клиент может выбрать все даты в окне 30 дней, которые оператор не закрыл.
 * node scripts/verify-checkout-dates.mjs [baseUrl]
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const deliveryAvailability = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'delivery-availability.js'));

const base = (process.argv[2] || 'http://localhost:3001').replace(/\/+$/, '');
const BOOKING_DAYS = 30;

function isDateSelectable(iso, av) {
  const min = deliveryAvailability.earliestDeliveryDateIso();
  if (!iso || iso < min) return false;
  if (deliveryAvailability.isDeliveryDayClosed(iso, av)) return false;
  return deliveryAvailability.availableSlotKeysForDate(iso, av).length > 0;
}

function reasonUnavailable(iso, av) {
  const min = deliveryAvailability.earliestDeliveryDateIso();
  if (!iso || iso < min) return 'раньше завтра';
  if (deliveryAvailability.isDeliveryDayClosed(iso, av)) return 'день закрыт оператором';
  if (!deliveryAvailability.availableSlotKeysForDate(iso, av).length) return 'все интервалы закрыты';
  return '';
}

async function fetchPublicAvailability() {
  const r = await fetch(`${base}/api/public/delivery-availability`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`GET delivery-availability → ${r.status}`);
  const data = await r.json();
  const pruned = deliveryAvailability.pruneAvailabilityToBookingWindow(data, BOOKING_DAYS);
  return { raw: data, pruned };
}

function assertLocalLogic() {
  const days = deliveryAvailability.enumerateBookingDays(BOOKING_DAYS);
  const av = {
    closedDays: [days[1], days[4]],
    closedSlots: [
      { date: days[2], slot: '09:00-14:00' },
      { date: days[2], slot: '14:00-17:00' },
      { date: days[2], slot: '17:00-21:00' },
    ],
  };
  const pruned = deliveryAvailability.pruneAvailabilityToBookingWindow(av, BOOKING_DAYS);
  let open = 0;
  for (const d of days) {
    if (isDateSelectable(d, pruned)) open += 1;
    else {
      const slots = deliveryAvailability.availableSlotKeysForDate(d, pruned);
      if (slots.length) throw new Error(`logic bug: ${d} has slots but not selectable`);
    }
  }
  if (open !== days.length - 2) {
    throw new Error(`expected ${days.length - 2} open days in fixture, got ${open}`);
  }
  const v = deliveryAvailability.validateDeliveryBooking(days[2], '17:00-21:00', pruned);
  if (v.ok) throw new Error('all residential slots closed day should reject 17-21');
  const v2 = deliveryAvailability.validateDeliveryBooking(days[2], '09:00-17:00', pruned);
  if (!v2.ok) throw new Error('org slot should stay open when only residential closed');
  console.log('OK local date/slot rules');
}

async function checkHost() {
  const { raw, pruned } = await fetchPublicAvailability();
  const days = deliveryAvailability.enumerateBookingDays(BOOKING_DAYS);
  const report = [];
  let openCount = 0;
  for (const iso of days) {
    const selectable = isDateSelectable(iso, pruned);
    if (selectable) openCount += 1;
    else report.push({ iso, reason: reasonUnavailable(iso, pruned) });
  }
  console.log(`OK public API (${base})`);
  console.log(`  закрытых дней: ${pruned.closedDays.length}, закрытых интервалов: ${pruned.closedSlots.length}`);
  console.log(`  доступно для выбора: ${openCount} из ${days.length} (с завтра на ${BOOKING_DAYS} дней)`);
  if (report.length && report.length <= 8) {
    report.forEach((row) => console.log(`  · ${row.iso}: ${row.reason}`));
  } else if (report.length) {
    report.slice(0, 5).forEach((row) => console.log(`  · ${row.iso}: ${row.reason}`));
    console.log(`  … и ещё ${report.length - 5} недоступных дат`);
  }
  if (openCount === 0) {
    throw new Error('Нет ни одной доступной даты — клиент не сможет оформить заказ');
  }
  if (!Array.isArray(raw.closedDays) || !Array.isArray(raw.closedSlots)) {
    throw new Error('API: ожидаются массивы closedDays и closedSlots');
  }
}

async function main() {
  assertLocalLogic();
  await checkHost();
  console.log('\nverify-checkout-dates: all checks passed\n');
}

main().catch((err) => {
  console.error('verify-checkout-dates FAIL:', err.message || err);
  process.exit(1);
});
