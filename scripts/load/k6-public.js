/**
 * Базовый нагрузочный сценарий: публичные страницы и API (без авторизации).
 *
 * Установка k6: https://k6.io/docs/get-started/installation/
 * Локально:  docker compose up -d && k6 run scripts/load/k6-public.js
 * Staging:   k6 run -e BASE_URL=https://staging.example.com scripts/load/k6-public.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function loadPublicPaths() {
  const headers = { Accept: 'application/json, text/html' };

  const settings = http.get(`${BASE}/api/public/settings`, { headers });
  check(settings, {
    'settings status 200': (r) => r.status === 200,
  });

  const products = http.get(`${BASE}/api/products`, { headers });
  check(products, {
    'products status 200': (r) => r.status === 200,
  });

  const catalog = http.get(`${BASE}/catalog.html`, { headers });
  check(catalog, {
    'catalog status 200': (r) => r.status === 200,
  });

  sleep(0.5 + Math.random() * 1);
}
