#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[docker] Ошибка: не задан DATABASE_URL" >&2
  exit 1
fi

if [ -z "$SESSION_SECRET" ] || [ "${#SESSION_SECRET}" -lt 32 ]; then
  echo "[docker] Ошибка: SESSION_SECRET должен быть не короче 32 символов (см. .env.example)" >&2
  exit 1
fi

echo "[docker] Ожидание PostgreSQL и миграции схемы (при первом запуске)…"
node -e "
const { Client } = require('pg');
const url = process.env.DATABASE_URL;
const max = 40;
let n = 0;
(function tick() {
  const c = new Client({ connectionString: url });
  c.connect()
    .then(() => c.query('SELECT 1'))
    .then(() => { c.end(); process.exit(0); })
    .catch(() => {
      c.end().catch(() => {});
      n += 1;
      if (n >= max) {
        console.error('[docker] PostgreSQL недоступен после ' + max + ' попыток');
        process.exit(1);
      }
      setTimeout(tick, 1500);
    });
})();
"

echo "[docker] Запуск сервера…"
exec "$@"
