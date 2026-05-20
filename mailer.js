const nodemailer = require('nodemailer');

let transporter = null;
let verifyPromise = null;

function isMailConfigured() {
  return Boolean(
    String(process.env.SMTP_HOST || '').trim() &&
      String(process.env.SMTP_USER || '').trim() &&
      String(process.env.SMTP_PASS || '').trim()
  );
}

function isDevMailExpose() {
  if (isMailConfigured()) return false;
  return String(process.env.NODE_ENV || 'development').trim() !== 'production';
}

function appBaseUrl() {
  const raw = String(process.env.APP_BASE_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  const port = String(process.env.PORT || '3000').trim();
  return `http://localhost:${port}`;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isMailConfigured()) return null;

  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '0').trim() === '1';

  transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: {
      user: String(process.env.SMTP_USER || '').trim(),
      pass: String(process.env.SMTP_PASS || ''),
    },
    tls: secure ? undefined : { rejectUnauthorized: true },
  });
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
  if (!verifyPromise) {
    verifyPromise = (async () => {
      const t = getTransporter();
      await t.verify();
      return { ok: true, configured: true };
    })().catch((err) => ({
      ok: false,
      configured: true,
      error: err && err.message ? err.message : String(err),
    }));
  }
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
  const result = await sendMail({ to: email, subject, text, html });
  if (result.dev && isDevMailExpose()) result.devCode = String(code);
  return result;
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
  const result = await sendMail({ to: email, subject, text, html });
  if (result.dev && isDevMailExpose()) result.devCode = String(code);
  return result;
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
  isDevMailExpose,
  appBaseUrl,
  verifySmtpConnection,
  mailRecipientGreeting,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
  sendPasswordCodeEmail,
};
