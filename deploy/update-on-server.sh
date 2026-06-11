#!/bin/sh
# Обновление сайта на VPS после git push.
# Использование: cd /opt/ekvaline && sh deploy/update-on-server.sh

set -e
cd "$(dirname "$0")/.."

echo "[deploy] git pull…"
git pull

if [ ! -f .env ]; then
  echo "[deploy] ОШИБКА: нет .env — скопируйте .env.docker.example → .env" >&2
  exit 1
fi

echo "[deploy] docker compose up -d --build…"
docker compose up -d --build

echo "[deploy] перезапуск app (свежий код без старого процесса)…"
docker compose restart app

echo "[deploy] ожидание API…"
i=0
while [ "$i" -lt 30 ]; do
  if curl -sf "http://127.0.0.1:${PORT:-3001}/api/client-boot" >/dev/null 2>&1; then
    echo "[deploy] API отвечает"
    break
  fi
  i=$((i + 1))
  sleep 2
done

if ! curl -sf "http://127.0.0.1:${PORT:-3001}/api/client-boot" >/dev/null 2>&1; then
  echo "[deploy] предупреждение: API не ответил за 60 с — смотрите docker compose logs app" >&2
fi

echo "[deploy] статус контейнеров:"
docker compose ps

echo "[deploy] smoke: products…"
curl -sf "http://127.0.0.1:${PORT:-3001}/api/products" | head -c 80 >/dev/null && echo "[deploy] /api/products OK" || echo "[deploy] /api/products FAIL" >&2

echo "[deploy] smoke: maps-config…"
MAPS_JSON=$(curl -sf "http://127.0.0.1:${PORT:-3001}/api/public/maps-config" || true)
if echo "$MAPS_JSON" | grep -q 'b7c84c0c'; then
  echo "[deploy] maps-config OK (ключ JavaScript API на месте)"
elif echo "$MAPS_JSON" | grep -q '"provider":"yandex"'; then
  echo "[deploy] maps-config OK (provider=yandex)"
else
  echo "[deploy] ВНИМАНИЕ: maps-config без ключа — добавьте YANDEX_MAPS_API_KEY в .env и перезапустите" >&2
fi

echo "[deploy] готово. Полная проверка: npm run verify:all http://127.0.0.1:${PORT:-3001}"
