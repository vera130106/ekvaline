/**
 * Правила пароля совпадают с schemas.js (регистрация, смена в кабинете, reset-password).
 * Только латинские буквы A–Z / a–z.
 */
(function initAuthPasswordRules(global) {
  const PASSWORD_MIN = 8;
  const PASSWORD_MAX = 128;
  const PASSWORD_ALLOWED_CHARS_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
  const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  function getPasswordStrength(value) {
    const s = String(value || '');
    const len = s.length;
    if (len > PASSWORD_MAX) {
      return {
        level: 'weak',
        line: `Пароль: не более ${PASSWORD_MAX} символов.`,
        missing: [],
      };
    }
    if (len < PASSWORD_MIN) {
      return {
        level: 'weak',
        line: `Пароль: минимум ${PASSWORD_MIN} символов.`,
        missing: [],
      };
    }
    if (!PASSWORD_ALLOWED_CHARS_RE.test(s)) {
      return {
        level: 'weak',
        line: 'Пароль: только латинские буквы (A–Z, a–z), цифры и спецсимволы (!@#$…).',
        missing: ['только латинские буквы'],
      };
    }
    const missing = [];
    if (!/[A-Z]/.test(s)) missing.push('заглавную латинскую букву (A–Z)');
    if (!/[a-z]/.test(s)) missing.push('строчную латинскую букву (a–z)');
    if (!/\d/.test(s)) missing.push('цифру');
    if (!PASSWORD_SPECIAL_RE.test(s)) missing.push('спецсимвол (!@#$…)');
    if (missing.length) {
      return {
        level: 'medium',
        line: 'Пароль: латинские буквы (A–Z, a–z), цифра и спецсимвол.',
        missing,
      };
    }
    return { level: 'strong', line: 'Пароль подходит.', missing: [] };
  }

  function isStrongPassword(value) {
    return getPasswordStrength(value).level === 'strong';
  }

  function validatePassword(value) {
    const st = getPasswordStrength(value);
    if (st.level === 'strong') return { ok: true };
    return { ok: false, error: st.line };
  }

  const PASSWORD_RULES_HINT =
    'Минимум 8 символов, только латиница (A–Z, a–z): заглавная, строчная, цифра и спецсимвол (!@#$…).';

  global.EkvalineAuthPassword = {
    PASSWORD_RULES_HINT,
    getPasswordStrength,
    isStrongPassword,
    validatePassword,
  };
})(typeof window !== 'undefined' ? window : globalThis);
