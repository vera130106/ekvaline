/**
 * Проверка SMTP: npm run test:smtp
 * или: node scripts/test-smtp.mjs your@mail.ru
 */
import { config } from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(root, '.env') });

const require = createRequire(import.meta.url);
const mailer = require(path.join(root, 'mailer.js'));

const to = String(process.argv[2] || process.env.SMTP_USER || '').trim().toLowerCase();
if (!to) {
  console.error('Укажите email: node scripts/test-smtp.mjs your@mail.ru');
  process.exit(1);
}

if (!mailer.isMailConfigured()) {
  console.error('SMTP не настроен. В .env задайте SMTP_PASS (пароль приложения Mail.ru), затем перезапустите сервер.');
  process.exit(1);
}

console.log('Проверка подключения к', process.env.SMTP_HOST, '…');
const check = await mailer.verifySmtpConnection();
if (!check.ok) {
  console.error('Ошибка SMTP:', check.error);
  console.error('\nЧастые причины: неверный пароль приложения, порт 465 + SECURE=1.');
  process.exit(1);
}
console.log('Подключение OK. Отправка тестового письма на', to, '…');

try {
  await mailer.sendVerificationCodeEmail({
    email: to,
    code: '123456',
  });
  console.log('(в письме обращение «Клиент», если имя в профиле не задано)');
  console.log('Готово. Проверьте входящие и папку «Спам».');
} catch (err) {
  console.error('Не удалось отправить:', err?.message || err);
  process.exit(1);
}
