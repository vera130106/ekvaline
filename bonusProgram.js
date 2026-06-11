'use strict';

const BONUS_VALIDITY_DAYS = 365;
const BONUS_EARN_RATE = 0.05;
const BONUS_EXPIRES_SOON_DAYS = 30;
const BONUS_HISTORY_LIMIT = 5;

function accrualExpiresAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + BONUS_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

function computeOrderBonusEarn(subtotal, bonusSpend = 0) {
  const base = Math.max(0, Math.floor(Number(subtotal) || 0) - Math.max(0, Math.floor(Number(bonusSpend) || 0)));
  return Math.floor(base * BONUS_EARN_RATE);
}

function publicBonusOperation(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount || 0),
    remaining: row.remaining != null ? Number(row.remaining) : null,
    description: row.description || '',
    order_id: row.order_id != null ? Number(row.order_id) : null,
    created_at: row.created_at,
    expires_at: row.expires_at || null,
  };
}

async function syncBonusBalanceFromLots(db, userId, tx) {
  const runner = tx || db;
  const row = await runner
    .prepare(
      `SELECT COALESCE(SUM(remaining), 0) AS total FROM bonus_operations
       WHERE user_id = ? AND type = 'accrual' AND remaining > 0 AND expires_at > NOW()`
    )
    .get(userId);
  const total = Math.max(0, Math.floor(Number(row?.total || 0)));
  await runner.prepare('UPDATE users SET bonus_balance = ? WHERE id = ?').run(total, userId);
  return total;
}

async function expireUserBonuses(db, userId) {
  const expired = await db
    .prepare(
      `SELECT id, remaining FROM bonus_operations
       WHERE user_id = ? AND type = 'accrual' AND remaining > 0 AND expires_at <= NOW()`
    )
    .all(userId);
  if (!expired.length) return 0;

  let totalExpired = 0;
  for (const lot of expired) {
    const left = Math.max(0, Math.floor(Number(lot.remaining || 0)));
    if (left <= 0) continue;
    totalExpired += left;
    await db.prepare('UPDATE bonus_operations SET remaining = 0 WHERE id = ?').run(lot.id);
    await db
      .prepare(
        `INSERT INTO bonus_operations (user_id, type, amount, description, remaining) VALUES (?, 'expire', ?, ?, NULL)`
      )
      .run(userId, -left, 'Сгорели бонусы — истёк срок действия');
  }
  if (totalExpired > 0) {
    await syncBonusBalanceFromLots(db, userId);
  }
  return totalExpired;
}

async function getAvailableBonusBalance(db, userId) {
  await expireUserBonuses(db, userId);
  return syncBonusBalanceFromLots(db, userId);
}

async function spendUserBonuses(db, userId, amount, orderId, tx) {
  const spend = Math.max(0, Math.floor(Number(amount) || 0));
  if (spend <= 0) return 0;

  const runner = tx || db;
  const lots = await runner
    .prepare(
      `SELECT id, remaining FROM bonus_operations
       WHERE user_id = ? AND type = 'accrual' AND remaining > 0 AND expires_at > NOW()
       ORDER BY expires_at ASC, id ASC`
    )
    .all(userId);

  let left = spend;
  for (const lot of lots) {
    if (left <= 0) break;
    const avail = Math.max(0, Math.floor(Number(lot.remaining || 0)));
    if (avail <= 0) continue;
    const take = Math.min(avail, left);
    await runner
      .prepare('UPDATE bonus_operations SET remaining = remaining - ? WHERE id = ?')
      .run(take, lot.id);
    left -= take;
  }
  if (left > 0) {
    throw Object.assign(new Error('Недостаточно бонусов для списания.'), { status: 400 });
  }

  await runner
    .prepare(
      `INSERT INTO bonus_operations (user_id, type, amount, order_id, description, remaining) VALUES (?, 'spend', ?, ?, ?, NULL)`
    )
    .run(userId, -spend, orderId || null, `Списание за заказ #${orderId || '—'}`);
  await syncBonusBalanceFromLots(db, userId, tx);
  return spend;
}

async function accrueUserBonuses(db, userId, amount, orderId, tx, description) {
  const earn = Math.max(0, Math.floor(Number(amount) || 0));
  if (earn <= 0) return 0;

  const runner = tx || db;
  const expiresAt = accrualExpiresAt();
  const desc =
    String(description || '').trim() || `Начисление за заказ #${orderId || '—'}`;
  await runner
    .prepare(
      `INSERT INTO bonus_operations (user_id, type, amount, remaining, expires_at, order_id, description)
       VALUES (?, 'accrual', ?, ?, ?, ?, ?)`
    )
    .run(userId, earn, earn, expiresAt.toISOString(), orderId || null, desc);
  await syncBonusBalanceFromLots(db, userId, tx);
  return earn;
}

/** Отмена заказа: вернуть списанные бонусы, снять неиспользованное начисление по этому заказу. */
async function reverseBonusesForCancelledOrder(db, order, tx) {
  if (!order?.id || !order?.user_id) return { restored: 0, removed: 0 };
  const orderId = Number(order.id);
  const userId = Number(order.user_id);
  const runner = tx || db;

  const refundDesc = `%Возврат бонусов за отмену заказа #${orderId}%`;
  const marker = await runner
    .prepare(
      `SELECT id FROM bonus_operations WHERE order_id = ? AND (
         type = 'reversal'
         OR (type = 'accrual' AND description LIKE ?)
       ) LIMIT 1`
    )
    .get(orderId, refundDesc);
  if (marker) return { restored: 0, removed: 0, skipped: true };

  let removed = 0;
  const accruals = await runner
    .prepare(
      `SELECT id, remaining FROM bonus_operations
       WHERE user_id = ? AND order_id = ? AND type = 'accrual'`
    )
    .all(userId, orderId);

  for (const lot of accruals) {
    const left = Math.max(0, Math.floor(Number(lot.remaining || 0)));
    if (left <= 0) continue;
    removed += left;
    await runner.prepare('UPDATE bonus_operations SET remaining = 0 WHERE id = ?').run(lot.id);
    await runner
      .prepare(
        `INSERT INTO bonus_operations (user_id, type, amount, order_id, description, remaining)
         VALUES (?, 'reversal', ?, ?, ?, NULL)`
      )
      .run(userId, -left, orderId, `Снятие начисления за отмену заказа #${orderId}`);
  }

  const bonusesUsed = Math.max(0, Math.floor(Number(order.bonuses_used || 0)));
  let restored = 0;
  if (bonusesUsed > 0) {
    restored = await accrueUserBonuses(
      db,
      userId,
      bonusesUsed,
      orderId,
      tx,
      `Возврат бонусов за отмену заказа #${orderId}`
    );
  }

  if (removed > 0 || restored > 0) {
    await syncBonusBalanceFromLots(db, userId, tx);
  }
  return { restored, removed };
}

async function computeMemberStatus(db, userId) {
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) FILTER (WHERE lower(COALESCE(status, '')) <> 'cancelled') AS total_orders,
         COUNT(*) FILTER (
           WHERE lower(COALESCE(status, '')) <> 'cancelled'
             AND created_at >= NOW() - INTERVAL '365 days'
         ) AS recent_orders
       FROM orders WHERE user_id = ?`
    )
    .get(userId);

  const totalOrders = Number(row?.total_orders || 0);
  const recentOrders = Number(row?.recent_orders || 0);

  if (totalOrders <= 0) {
    return {
      code: 'none',
      label: '',
      hint: '',
    };
  }
  if (recentOrders > 0) {
    return {
      code: 'active',
      label: 'Активный участник',
      hint: 'Вы оформляли заказы в течение последнего года — бонусы начисляются автоматически.',
    };
  }
  return {
    code: 'member',
    label: 'Участник программы',
    hint: 'У вас есть история заказов. Оформите новый заказ, чтобы сохранить активный статус.',
  };
}

async function getBonusProgramSummary(db, userId) {
  await expireUserBonuses(db, userId);
  const balance = await syncBonusBalanceFromLots(db, userId);
  const member = await computeMemberStatus(db, userId);

  const nearest = await db
    .prepare(
      `SELECT MIN(expires_at) AS nearest_at, COALESCE(SUM(remaining), 0) AS expiring_amount
       FROM bonus_operations
       WHERE user_id = ? AND type = 'accrual' AND remaining > 0 AND expires_at > NOW()`
    )
    .get(userId);

  const soon = await db
    .prepare(
      `SELECT COALESCE(SUM(remaining), 0) AS amount
       FROM bonus_operations
       WHERE user_id = ? AND type = 'accrual' AND remaining > 0
         AND expires_at > NOW()
         AND expires_at <= NOW() + INTERVAL '${BONUS_EXPIRES_SOON_DAYS} days'`
    )
    .get(userId);

  const totals = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'accrual' THEN amount ELSE 0 END), 0) AS earned_total,
         COALESCE(SUM(CASE WHEN type = 'spend' THEN -amount ELSE 0 END), 0) AS spent_total,
         COALESCE(SUM(CASE WHEN type = 'expire' THEN -amount ELSE 0 END), 0) AS expired_total,
         COALESCE(SUM(CASE WHEN type = 'reversal' THEN -amount ELSE 0 END), 0) AS reversed_total
       FROM bonus_operations WHERE user_id = ?`
    )
    .get(userId);

  const historyRows = await db
    .prepare(
      `SELECT * FROM bonus_operations WHERE user_id = ? ORDER BY id DESC LIMIT ${BONUS_HISTORY_LIMIT}`
    )
    .all(userId);

  return {
    balance,
    earn_rate_percent: Math.round(BONUS_EARN_RATE * 100),
    validity_days: BONUS_VALIDITY_DAYS,
    member_status: member.code,
    member_status_label: member.label,
    member_status_hint: member.hint,
    nearest_expires_at: nearest?.nearest_at || null,
    nearest_expiring_amount: Math.max(0, Math.floor(Number(nearest?.expiring_amount || 0))),
    expires_soon_amount: Math.max(0, Math.floor(Number(soon?.amount || 0))),
    expires_soon_days: BONUS_EXPIRES_SOON_DAYS,
    totals: {
      earned: Math.max(0, Math.floor(Number(totals?.earned_total || 0))),
      spent: Math.max(0, Math.floor(Number(totals?.spent_total || 0))),
      expired: Math.max(0, Math.floor(Number(totals?.expired_total || 0))),
      reversed: Math.max(0, Math.floor(Number(totals?.reversed_total || 0))),
    },
    history: historyRows.map(publicBonusOperation),
  };
}

module.exports = {
  BONUS_VALIDITY_DAYS,
  BONUS_EARN_RATE,
  BONUS_EXPIRES_SOON_DAYS,
  BONUS_HISTORY_LIMIT,
  accrualExpiresAt,
  computeOrderBonusEarn,
  expireUserBonuses,
  syncBonusBalanceFromLots,
  getAvailableBonusBalance,
  spendUserBonuses,
  accrueUserBonuses,
  reverseBonusesForCancelledOrder,
  getBonusProgramSummary,
  publicBonusOperation,
};
