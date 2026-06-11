'use strict';

const schemas = require('./schemas');

/** Роли сотрудников — пароль только через администратора, без self-service сброса. */
const STAFF_ROLES = Object.freeze(['admin', 'manager', 'operator', 'driver']);

function isStaffRole(role) {
  return STAFF_ROLES.includes(String(role || '').toLowerCase());
}

/** Самостоятельный сброс / смена пароля по email — только для обычных клиентов. */
function canSelfServicePasswordReset(user) {
  if (!user || !user.id) return false;
  const role = String(user.role || '').toLowerCase();
  if (isStaffRole(role)) return false;
  if (role !== 'client') return false;
  if (schemas.isPseudoClientEmail(user.email)) return false;
  return true;
}

/** Единый ответ «не найден» — без утечки, staff ли это или нет. */
const PASSWORD_RESET_NOT_FOUND_MSG =
  'Аккаунт с таким email не найден. Проверьте адрес или зарегистрируйтесь.';

/** Код для просмотра сведений о пароле / смены пароля сотрудника в админке (задаётся в .env). */
function adminStaffPasswordGateExpected() {
  const v = String(process.env.ADMIN_STAFF_PASSWORD_GATE || '295302').trim();
  return v || '295302';
}

function verifyAdminStaffPasswordGate(code) {
  const given = String(code || '').trim();
  if (!given) return false;
  return given === adminStaffPasswordGateExpected();
}

module.exports = {
  STAFF_ROLES,
  isStaffRole,
  canSelfServicePasswordReset,
  PASSWORD_RESET_NOT_FOUND_MSG,
  adminStaffPasswordGateExpected,
  verifyAdminStaffPasswordGate,
};
