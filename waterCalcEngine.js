'use strict';

/**
 * Серверная копия логики калькулятора потребления воды (лендинг).
 * Единственный источник правды для отображаемых сумм/норм с API — см. GET /api/public/water-calc
 */

const activityMultiplier = {
  low: 0.88,
  medium: 1,
  high: 1.16,
};

const seasonMultiplier = {
  winter: 0.93,
  'spring-autumn': 1,
  summer: 1.12,
};

const activityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const seasonLabels = {
  winter: 'Зима',
  'spring-autumn': 'Весна/Осень',
  summer: 'Лето',
};

const usageLabels = {
  drink: 'Только питье',
  cook: 'Только готовка',
  both: 'Питье и готовка',
};

function toOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function formatDecimal(value) {
  return toOneDecimal(value).toFixed(1).replace('.', ',');
}

function formatMoney(value) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function pluralOrders(value) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'заказ';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заказа';
  return 'заказов';
}

function pluralDays(days) {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

/**
 * @param {{ people: number; usage: 'drink' | 'cook' | 'both'; activity: 'low' | 'medium' | 'high'; season: 'winter' | 'spring-autumn' | 'summer' }} input
 */
function estimateWaterConsumption(input) {
  const people = Number(input.people);
  const usage = input.usage;
  const activity = input.activity;
  const season = input.season;

  const isDrinking = usage === 'drink' || usage === 'both';
  const isCooking = usage === 'cook' || usage === 'both';

  const baseDrinkPerPerson = 2;
  const activityFactor = isDrinking ? activityMultiplier[activity] : 1;
  const seasonFactor = isDrinking ? seasonMultiplier[season] : 1;
  const dailyDrinkLiters = isDrinking ? people * baseDrinkPerPerson * activityFactor * seasonFactor : 0;

  const cookPerPerson = 0.8;
  const householdReserveLiters = isCooking ? people * cookPerPerson : 0;
  const dailyLiters = dailyDrinkLiters + householdReserveLiters;
  const monthlyLiters = dailyLiters * 30;
  const reserveCoefficient = 1.1;
  const monthlyWithReserve = monthlyLiters * reserveCoefficient;

  const dailyForDisplay = Math.max(1, toOneDecimal(dailyLiters));
  const monthlyForDisplay = Math.round(monthlyWithReserve);
  const monthlyBottles = Math.max(1, Math.ceil(monthlyWithReserve / 19));
  const daysPerBottle = Math.max(1, Math.round(19 / dailyForDisplay));
  const waterPercent = Math.round(Math.min(80, Math.max(24, dailyForDisplay * 6.5)));

  const onePurchased = monthlyBottles;
  const oneQty = 1;
  const oneOrders = onePurchased;
  const oneTotal = onePurchased * 220;

  const twoPurchased = monthlyBottles === 1 ? 2 : monthlyBottles;
  const twoOrders = Math.max(1, Math.ceil(twoPurchased / 4));
  const twoQty = Math.min(4, Math.max(2, Math.ceil(twoPurchased / twoOrders)));
  const twoTotal = twoPurchased * 190;

  const fivePurchased = Math.max(5, monthlyBottles);
  const fiveOrders = Math.max(1, Math.ceil(fivePurchased / 8));
  const fiveQty = Math.max(5, Math.ceil(fivePurchased / fiveOrders));
  const fiveTotal = fivePurchased * 175;

  const tierLabel =
    fiveTotal <= twoTotal && fiveTotal <= oneTotal
      ? 'от 5 бутылей по 175 ₽'
      : twoTotal <= oneTotal
        ? '2-4 бутыли по 190 ₽'
        : '1 бутыль по 220 ₽';

  const cheapestMonthly = Math.min(oneTotal, twoTotal, fiveTotal);

  const activityHint = {
    low: 'низкая активность',
    medium: 'средняя активность',
    high: 'высокая активность',
  };
  const seasonHint = {
    winter: 'зимний период',
    'spring-autumn': 'весна/осень',
    summer: 'летний период',
  };

  let note;
  if (usage === 'both') {
    note = `Расчет для ${people} чел.: ${activityHint[activity]}, ${seasonHint[season]}, с запасом 10% на непредвиденное потребление.`;
  } else if (usage === 'drink') {
    note = `Расчет для ${people} чел. только на питьевую воду: ${activityHint[activity]}, ${seasonHint[season]}, с запасом 10%.`;
  } else {
    note =
      `Расчет для ${people} чел. только на готовку и кухонные напитки с запасом 10%. Питьевая норма не учитывается.`;
  }

  /** Для класса сезона на шкале-бутылке */
  let bottleWaterSeasonClass;
  if (isDrinking) {
    bottleWaterSeasonClass = season;
  } else {
    bottleWaterSeasonClass = 'winter';
  }

  return {
    people,
    litersPerDay: formatDecimal(dailyForDisplay),
    bottlesLabel: `${monthlyBottles} шт`,
    drinkNormPerDay: `${formatDecimal(dailyDrinkLiters)} л/день`,
    householdPerDay: `${formatDecimal(householdReserveLiters)} л/день`,
    monthlyLiters: `${monthlyForDisplay} л`,
    orderInterval: `каждые ${daysPerBottle} ${pluralDays(daysPerBottle)}`,
    planLineOne: `${oneQty} бут./заказ • ${oneOrders} ${pluralOrders(oneOrders)}/мес • ${formatMoney(oneTotal)}/мес`,
    planLineTwo: `${twoQty} бут./заказ • ${twoOrders} ${pluralOrders(twoOrders)}/мес • ${formatMoney(twoTotal)}/мес`,
    planLineFive: `${fiveQty} бут./заказ • ${fiveOrders} ${pluralOrders(fiveOrders)}/мес • ${formatMoney(fiveTotal)}/мес`,
    planTier: tierLabel,
    priceTotalApprox: formatMoney(cheapestMonthly),
    note,
    usageLabel: usageLabels[usage],
    activityLabel: isDrinking ? activityLabels[activity] : 'Не учитывается',
    seasonLabel: isDrinking ? seasonLabels[season] : 'Не учитывается',
    bottleWaterPercent: waterPercent,
    bottleWaterSeasonClass,
    restrictActivitySeason: !isDrinking,
  };
}

module.exports = { estimateWaterConsumption };
