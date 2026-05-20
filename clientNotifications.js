'use strict';

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

function orderStatusLabelRu(status) {
  const st = String(status || '').toLowerCase();
  return ORDER_STATUS_LABELS[st] || 'Обновлён';
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

async function createClientNotification(db, { userId, title, body, type = 'order', orderId = null }) {
  if (!userId) return null;
  const info = await db
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

async function notifyOrderCreated(db, order) {
  if (!order?.user_id) return;
  const slot = String(order.delivery_slot || '').trim();
  const dateRu = order.delivery_date
    ? String(order.delivery_date).split('-').reverse().join('.')
    : '—';
  const sum = Number(order.total_sum || 0);
  await createClientNotification(db, {
    userId: order.user_id,
    orderId: order.id,
    type: 'order',
    title: `Заказ №${order.id} оформлен`,
    body: `Заявка принята. Доставка ${dateRu}${slot ? `, интервал ${slot}` : ''}. Итого ${sum} ₽. Статус: ${orderStatusLabelRu(order.status)}.`,
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

  let title = `Заказ №${order.id}: ${orderStatusLabelRu(next)}`;
  let body = `Статус заказа изменён на «${orderStatusLabelRu(next)}».`;

  if (next === 'confirmed') {
    title = `Заказ №${order.id} подтверждён`;
    body = `Оператор подтвердил заказ. Доставка ${dateRu}${slot ? `, ${slot}` : ''}.`;
  } else if (['processing', 'courier', 'on_way'].includes(next)) {
    title = `Заказ №${order.id} в пути`;
    body = `Курьер везёт заказ. Ожидайте в интервале${slot ? ` ${slot}` : ''}.`;
  } else if (next === 'delivered') {
    title = `Заказ №${order.id} доставлен`;
    body = 'Заказ выполнен. Спасибо за покупку!';
  } else if (next === 'cancelled') {
    title = `Заказ №${order.id} отменён`;
    body = 'Заказ отменён. Если это ошибка — свяжитесь с нами.';
  }

  await createClientNotification(db, {
    userId: order.user_id,
    orderId: order.id,
    type: 'order',
    title,
    body,
  });
}

async function listClientNotifications(db, userId, limit = 40) {
  const rows = await db
    .prepare(
      `SELECT * FROM client_notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?`
    )
    .all(userId, Math.min(100, Math.max(1, Number(limit) || 40)));
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
  orderStatusLabelRu,
  createClientNotification,
  notifyOrderCreated,
  notifyOrderStatusChange,
  listClientNotifications,
  markClientNotificationRead,
  markAllClientNotificationsRead,
  publicClientNotification,
};
