'use strict';

const orderPricing = require('./order-pricing');
const { displayOrderId } = require('./order-display');

const ORDER_STATUS_LABELS = {
  new: 'В обработке',
  pending_operator: 'В обработке',
  confirmed: 'Подтверждён',
  processing: 'В пути',
  courier: 'В пути',
  on_way: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

/** Уведомления видны клиенту только 3 суток с момента события. */
const CLIENT_NOTIFICATION_TTL_DAYS = 3;

function orderStatusLabelRu(status) {
  const st = String(status || '').toLowerCase();
  return ORDER_STATUS_LABELS[st] || 'Обновлён';
}

function normalizeNotificationTimestamp(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function publicClientNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    body: row.body || '',
    read: !!Number(row.read),
    type: row.type || 'order',
    order_id: row.order_id != null ? Number(row.order_id) : null,
    created_at: row.created_at,
  };
}

async function purgeExpiredClientNotifications(db, userId) {
  if (!userId) return;
  await db
    .prepare(
      `DELETE FROM client_notifications
       WHERE user_id = ?
         AND created_at < NOW() - (? || ' days')::interval`
    )
    .run(userId, String(CLIENT_NOTIFICATION_TTL_DAYS));
}

async function createClientNotification(db, { userId, title, body, type = 'order', orderId = null, createdAt = null }) {
  if (!userId) return null;
  const at = normalizeNotificationTimestamp(createdAt);
  const info = at
    ? await db
        .prepare(
          `INSERT INTO client_notifications (user_id, title, body, type, order_id, read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?)`
        )
        .run(
          userId,
          String(title || '').slice(0, 200),
          String(body || '').slice(0, 500),
          String(type || 'order').slice(0, 32),
          orderId != null ? Number(orderId) : null,
          at
        )
    : await db
        .prepare(
          `INSERT INTO client_notifications (user_id, title, body, type, order_id, read) VALUES (?, ?, ?, ?, ?, 0)`
        )
        .run(
          userId,
          String(title || '').slice(0, 200),
          String(body || '').slice(0, 500),
          String(type || 'order').slice(0, 32),
          orderId != null ? Number(orderId) : null
        );
  const row = await db.prepare('SELECT * FROM client_notifications WHERE id = ?').get(info.lastInsertRowid);
  return publicClientNotification(row);
}

async function notifyWelcomeRegistration(db, userId) {
  if (!userId) return;
  const existing = await db
    .prepare(
      `SELECT id FROM client_notifications
       WHERE user_id = ? AND title = 'Добро пожаловать в ЭкваЛайн'
       LIMIT 1`
    )
    .get(userId);
  if (existing) return;

  const user = await db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);
  const createdAt = normalizeNotificationTimestamp(user?.created_at) || new Date().toISOString();

  await createClientNotification(db, {
    userId,
    type: 'info',
    title: 'Добро пожаловать в ЭкваЛайн',
    body: 'Следите за акциями и статусом заказов в этом центре уведомлений.',
    createdAt,
  });
  await createClientNotification(db, {
    userId,
    type: 'delivery',
    title: 'Доставка в удобном окне',
    body: 'Выберите интервал 09:00 – 14:00, 14:00 – 17:00 или 17:00 – 21:00 при оформлении заказа.',
    createdAt,
  });
}

async function notifyOrderCreated(db, order) {
  if (!order?.user_id) return;
  const orderLabel = displayOrderId(order.id);
  const existing = await db
    .prepare(
      `SELECT id FROM client_notifications
       WHERE user_id = ? AND order_id = ? AND title LIKE 'Заказ % оформлен'
       LIMIT 1`
    )
    .get(order.user_id, order.id);
  if (existing) return;

  const slot = String(order.delivery_slot || '').trim();
  const dateRu = order.delivery_date
    ? String(order.delivery_date).split('-').reverse().join('.')
    : '—';
  const sum = orderPricing.orderPayableFromItems(order);
  const createdAt = normalizeNotificationTimestamp(order.created_at) || new Date().toISOString();
  await createClientNotification(db, {
    userId: order.user_id,
    orderId: order.id,
    type: 'order',
    title: `Заказ ${orderLabel} оформлен`,
    body: `Заявка принята. Доставка ${dateRu}${slot ? `, интервал ${slot}` : ''}. Итого ${sum} ₽. Статус: ${orderStatusLabelRu(order.status)}.`,
    createdAt,
  });
}

async function notifyOrderStatusChange(db, order, prevStatus, nextStatus) {
  if (!order?.user_id) return;
  const prev = String(prevStatus || '').toLowerCase();
  const next = String(nextStatus || '').toLowerCase();
  if (!next || prev === next) return;

  const slot = String(order.delivery_slot || '').trim();
  const dateRu = order.delivery_date
    ? String(order.delivery_date).split('-').reverse().join('.')
    : '—';

  const orderLabel = displayOrderId(order.id);
  let title = `Заказ ${orderLabel}: ${orderStatusLabelRu(next)}`;
  let body = `Статус заказа изменён на «${orderStatusLabelRu(next)}».`;

  if (next === 'confirmed') {
    title = `Заказ ${orderLabel} подтверждён`;
    body = `Оператор подтвердил заказ. Доставка ${dateRu}${slot ? `, ${slot}` : ''}.`;
  } else if (['processing', 'courier', 'on_way'].includes(next)) {
    title = `Заказ ${orderLabel} в пути`;
    body = `Курьер везёт заказ. Ожидайте в интервале${slot ? ` ${slot}` : ''}.`;
  } else if (next === 'delivered') {
    title = `Заказ ${orderLabel} доставлен`;
    body = 'Заказ выполнен. Спасибо за покупку!';
  } else if (next === 'cancelled') {
    title = `Заказ ${orderLabel} отменён`;
    body = 'Заказ отменён. Если это ошибка — свяжитесь с нами.';
  }

  const createdAt = normalizeNotificationTimestamp(order.updated_at) || new Date().toISOString();
  await createClientNotification(db, {
    userId: order.user_id,
    orderId: order.id,
    type: 'order',
    title,
    body,
    createdAt,
  });
}

async function listClientNotifications(db, userId, limit = 40) {
  await purgeExpiredClientNotifications(db, userId);
  const rows = await db
    .prepare(
      `SELECT * FROM client_notifications
       WHERE user_id = ?
         AND created_at >= NOW() - (? || ' days')::interval
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .all(userId, String(CLIENT_NOTIFICATION_TTL_DAYS), Math.min(100, Math.max(1, Number(limit) || 40)));
  return rows.map(publicClientNotification).filter(Boolean);
}

async function markClientNotificationRead(db, userId, notificationId) {
  await db
    .prepare(`UPDATE client_notifications SET read = 1 WHERE id = ? AND user_id = ?`)
    .run(notificationId, userId);
}

async function markAllClientNotificationsRead(db, userId) {
  await db.prepare(`UPDATE client_notifications SET read = 1 WHERE user_id = ? AND read = 0`).run(userId);
}

module.exports = {
  ORDER_STATUS_LABELS,
  CLIENT_NOTIFICATION_TTL_DAYS,
  orderStatusLabelRu,
  createClientNotification,
  notifyWelcomeRegistration,
  notifyOrderCreated,
  notifyOrderStatusChange,
  listClientNotifications,
  purgeExpiredClientNotifications,
  markClientNotificationRead,
  markAllClientNotificationsRead,
  publicClientNotification,
};
