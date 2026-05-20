'use strict';

/** Нормализация способа оплаты для отчётов (как в панели оператора). */
function paymentStatsBucket(raw) {
  const p = String(raw ?? '').trim();
  if (!p) return 'cash';
  const low = p.toLowerCase().replace(/ё/g, 'е').replace(/\u00a0/g, ' ');
  if (
    low.includes('расч') &&
    (low.includes('сч') || low.includes('счет') || low.includes('счёт'))
  ) {
    return 'settlement';
  }
  if (low === 'cash' || /налич/i.test(low)) return 'cash';
  if (low === 'card' || low === 'карта' || /карт|visa|mir|терминал/i.test(low)) return 'card';
  if (low === 'noncash' || /безнал/i.test(low)) return 'noncash';
  return 'cash';
}

const PAYMENT_STATS_LABELS = {
  cash: 'Наличная',
  card: 'Карта',
  noncash: 'Безнал',
  settlement: 'Расчётный счёт',
};

function paymentStatsLabel(raw) {
  return PAYMENT_STATS_LABELS[paymentStatsBucket(raw)] || 'Не указан';
}

function aggregatePaymentRows(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const label = paymentStatsLabel(row.payment_method);
    const prev = map.get(label) || { label, count: 0, sum: 0 };
    prev.count += 1;
    prev.sum += Number(row.sum) || 0;
    map.set(label, prev);
  }
  return [...map.values()]
    .map((x) => ({
      label: x.label,
      count: x.count,
      sum: Math.round(x.sum * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
}

module.exports = {
  paymentStatsBucket,
  paymentStatsLabel,
  aggregatePaymentRows,
};
