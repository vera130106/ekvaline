const nodemailer = require('nodemailer');

let transporter = null;
let verifyPromise = null;
let cachedSmtpFingerprint = '';

function normalizeSmtpSecret(raw) {
  let s = String(raw ?? '').trim();
  if (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function smtpUserValue() {
  return String(process.env.SMTP_USER || '').trim();
}

function smtpPassValue() {
  return normalizeSmtpSecret(process.env.SMTP_PASS);
}

function smtpEnvFingerprint() {
  const host = resolveSmtpHost();
  const secure = String(process.env.SMTP_SECURE || '0').trim() === '1';
  const port = resolveSmtpPort(host, secure);
  return [host, port, secure ? '1' : '0', smtpUserValue(), smtpPassValue()].join('\0');
}

function resetSmtpCache() {
  transporter = null;
  verifyPromise = null;
  cachedSmtpFingerprint = '';
}

function isSmtpAuthError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('invalid login') ||
    msg.includes('authentication') ||
    msg.includes('535') ||
    msg.includes('application password') ||
    msg.includes('parol prilozheniya') ||
    msg.includes('neobhodim parol')
  );
}

function resolveSmtpHost() {
  const explicit = String(process.env.SMTP_HOST || '').trim();
  if (explicit) return explicit;
  const user = String(process.env.SMTP_USER || '').trim().toLowerCase();
  if (/@(?:mail|inbox|bk|list)\.ru$/i.test(user)) return 'smtp.mail.ru';
  if (/@(?:yandex|ya)\.ru$/i.test(user)) return 'smtp.yandex.ru';
  if (/@gmail\.com$/i.test(user)) return 'smtp.gmail.com';
  return '';
}

function resolveSmtpPort(host, secure) {
  const raw = Number(process.env.SMTP_PORT);
  if (Number.isFinite(raw) && raw > 0) return raw;
  if (secure) return 465;
  if (/mail\.ru|yandex\.ru/i.test(host)) return 465;
  return 587;
}

function isMailConfigured() {
  return Boolean(resolveSmtpHost() && smtpUserValue() && smtpPassValue());
}

/** Сообщение для администратора / логов (с подсказками по .env). */
function formatSmtpUserError(err) {
  const raw = String(err?.message || err || '').trim();
  const msg = raw.toLowerCase();
  if (!isMailConfigured()) {
    return 'Почта не настроена на сервере. В .env задайте SMTP_HOST, SMTP_USER, SMTP_PASS и перезапустите сайт.';
  }
  if (
    msg.includes('application password') ||
    msg.includes('parol prilozheniya') ||
    msg.includes('neobhodim parol')
  ) {
    return 'Mail.ru требует пароль приложения, а не пароль от входа в почту. Создайте его: Настройки → Пароль и безопасность → Пароли для внешних приложений. Вставьте в SMTP_PASS на сервере.';
  }
  if (msg.includes('invalid login') || msg.includes('authentication') || msg.includes('535')) {
    return 'Неверный SMTP_USER или SMTP_PASS. Для Mail.ru используйте пароль приложения (см. docs/НАСТРОЙКА-ПОЧТЫ.md).';
  }
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('connect')
  ) {
    return 'Сервер не может подключиться к SMTP (проверьте SMTP_HOST, порт 465 и фаервол VPS).';
  }
  if (raw) return `Не удалось отправить письмо: ${raw.slice(0, 180)}`;
  return 'Не удалось отправить письмо. Проверьте SMTP в .env на сервере и перезапустите сайт.';
}

/** Сообщение для клиента на сайте — без технических деталей SMTP. */
function formatSmtpClientError(err) {
  if (!isMailConfigured()) {
    return 'Отправка кода временно недоступна. Попробуйте позже или свяжитесь с нами по телефону.';
  }
  const raw = String(err?.message || err || '').trim().toLowerCase();
  if (
    raw.includes('invalid login') ||
    raw.includes('authentication') ||
    raw.includes('535') ||
    raw.includes('application password') ||
    raw.includes('smtp не настроен')
  ) {
    return 'Не удалось отправить код на email. Попробуйте через несколько минут или обратитесь в поддержку.';
  }
  if (raw.includes('timeout') || raw.includes('connect') || raw.includes('econnrefused')) {
    return 'Почтовый сервис временно недоступен. Попробуйте отправить код ещё раз через минуту.';
  }
  return 'Не удалось отправить код. Проверьте email и попробуйте ещё раз.';
}

function appBaseUrl() {
  const raw = String(process.env.APP_BASE_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  const port = String(process.env.PORT || '3000').trim();
  return `http://localhost:${port}`;
}

function getTransporter() {
  const fp = smtpEnvFingerprint();
  if (transporter && cachedSmtpFingerprint !== fp) {
    resetSmtpCache();
  }
  if (transporter) return transporter;
  if (!isMailConfigured()) return null;

  const host = resolveSmtpHost();
  const secure = String(process.env.SMTP_SECURE || '0').trim() === '1';
  const port = resolveSmtpPort(host, secure);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: smtpUserValue(),
      pass: smtpPassValue(),
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: secure ? { minVersion: 'TLSv1.2' } : { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
  });
  cachedSmtpFingerprint = fp;
  return transporter;
}

function mailFrom() {
  const from = String(process.env.SMTP_FROM || '').trim();
  if (from) return from;
  const user = String(process.env.SMTP_USER || '').trim();
  return user ? `ЭкваЛайн <${user}>` : 'ЭкваЛайн <noreply@ekvaline.ru>';
}

/** Имя в приветствии письма: полное имя из профиля или «Клиент». */
function mailRecipientGreeting({ firstName, lastName } = {}) {
  const full = [firstName, lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
  return full || 'Клиент';
}

function codeEmailHtml({ title, code, hint }) {
  const safeCode = String(code || '').replace(/[^\d]/g, '');
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;font-family:Manrope,Arial,sans-serif;background:#f4f9ff;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #d9e6f8;">
    <p style="margin:0 0 8px;color:#3d8fd4;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">ЭкваЛайн</p>
    <h1 style="margin:0 0 16px;color:#1b3f6d;font-size:22px;">${title}</h1>
    <p style="margin:0 0 20px;color:#4d6285;line-height:1.5;">${hint}</p>
    <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:.25em;color:#1b3f6d;text-align:center;">${safeCode}</p>
    <p style="margin:20px 0 0;color:#78716c;font-size:13px;line-height:1.45;">Если вы не запрашивали код — проигнорируйте письмо.</p>
  </div>
</body>
</html>`;
}

async function verifySmtpConnection() {
  if (!isMailConfigured()) {
    return { ok: false, configured: false, error: 'SMTP не задан (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  }
  const fp = smtpEnvFingerprint();
  if (verifyPromise && cachedSmtpFingerprint === fp) {
    return verifyPromise;
  }
  verifyPromise = (async () => {
    const t = getTransporter();
    await t.verify();
    return { ok: true, configured: true };
  })().catch((err) => {
    resetSmtpCache();
    return {
      ok: false,
      configured: true,
      error: err && err.message ? err.message : String(err),
    };
  });
  return verifyPromise;
}

async function sendMail({ to, subject, text, html }) {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient) throw new Error('mail: empty recipient');

  const payload = {
    from: mailFrom(),
    to: recipient,
    subject: String(subject || '').trim() || 'ЭкваЛайн',
    text: String(text || ''),
    html: html || undefined,
  };

  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.warn('[mail] SMTP не настроен. Письмо для', recipient);
    // eslint-disable-next-line no-console
    console.warn('[mail]', payload.subject, '\n', payload.text);
    return { ok: true, dev: true, smtpConfigured: false };
  }

  try {
    const info = await t.sendMail(payload);
    return { ok: true, dev: false, smtpConfigured: true, messageId: info && info.messageId };
  } catch (err) {
    if (isSmtpAuthError(err)) {
      resetSmtpCache();
      const t2 = getTransporter();
      if (t2 && t2 !== t) {
        try {
          const info = await t2.sendMail(payload);
          return { ok: true, dev: false, smtpConfigured: true, messageId: info && info.messageId };
        } catch (retryErr) {
          // eslint-disable-next-line no-console
          console.error('[mail] Повтор после сброса SMTP не удался:', retryErr && retryErr.message);
          throw retryErr;
        }
      }
    }
    // eslint-disable-next-line no-console
    console.error('[mail] Ошибка отправки на', recipient, err && err.message);
    throw err;
  }
}

async function sendVerificationCodeEmail({ email, code, firstName, lastName }) {
  const name = mailRecipientGreeting({ firstName, lastName });
  const subject = 'Код подтверждения email — ЭкваЛайн';
  const text = [
    `Здравствуйте, ${name}!`,
    '',
    'Ваш код для подтверждения email в личном кабинете ЭкваЛайн:',
    code,
    '',
    'Введите его в разделе «Подтверждение email» в личном кабинете. Код действует 24 часа.',
    'Если вы не регистрировались — проигнорируйте письмо.',
  ].join('\n');
  const html = codeEmailHtml({
    title: 'Подтверждение email',
    code,
    hint: `Здравствуйте, ${name}! Введите этот код в личном кабинете в блоке «Подтверждение email». Код действует 24 часа.`,
  });
  return sendMail({ to: email, subject, text, html });
}

async function sendPasswordCodeEmail({ email, code, firstName, lastName }) {
  const name = mailRecipientGreeting({ firstName, lastName });
  const subject = 'Код для смены пароля — ЭкваЛайн';
  const text = [
    `Здравствуйте, ${name}!`,
    '',
    'Код для смены пароля в личном кабинете ЭкваЛайн:',
    code,
    '',
    'Введите его на странице смены пароля или в блоке «Смена пароля» в кабинете. Код действует 1 час.',
    'Если вы не запрашивали смену пароля — проигнорируйте письмо.',
  ].join('\n');
  const html = codeEmailHtml({
    title: 'Смена пароля',
    code,
    hint: `Здравствуйте, ${name}! Введите этот код вместе с новым паролем. Код действует 1 час.`,
  });
  return sendMail({ to: email, subject, text, html });
}

async function sendVerificationEmail({ email, token, firstName }) {
  return sendVerificationCodeEmail({ email, code: token, firstName });
}

async function sendPasswordResetEmail({ email, token, firstName }) {
  return sendPasswordCodeEmail({ email, code: token, firstName });
}

module.exports = {
  sendMail,
  isMailConfigured,
  formatSmtpUserError,
  formatSmtpClientError,
  resolveSmtpHost,
  appBaseUrl,
  verifySmtpConnection,
  resetSmtpCache,
  mailRecipientGreeting,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
  sendPasswordCodeEmail,
};
