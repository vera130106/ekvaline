/**
 * Правила пароля совпадают с schemas.js (регистрация, смена в кабинете, reset-password).
 */
(function initAuthPasswordRules(global) {
  const PASSWORD_MIN = 8;
  const PASSWORD_MAX = 128;
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
    const missing = [];
    if (!/[A-ZА-ЯЁ]/.test(s)) missing.push('заглавную букву');
    if (!/[a-zа-яё]/.test(s)) missing.push('строчную букву');
    if (!/\d/.test(s)) missing.push('цифру');
    if (!PASSWORD_SPECIAL_RE.test(s)) missing.push('спецсимвол (!@#$…)');
    if (missing.length) {
      return {
        level: 'medium',
        line: 'Пароль: нужны заглавная и строчная буквы, цифра и спецсимвол.',
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
    'Минимум 8 символов: заглавная и строчная буквы, цифра и спецсимвол (!@#$…).';

  global.EkvalineAuthPassword = {
    PASSWORD_RULES_HINT,
    getPasswordStrength,
    isStrongPassword,
    validatePassword,
  };
})(typeof window !== 'undefined' ? window : globalThis);
