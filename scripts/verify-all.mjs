/**
 * Полный прогон проверок (нужен запущенный server.js).
 * node scripts/verify-all.mjs [baseUrl]
 */
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const base = process.argv[2] || 'http://localhost:3010';
const isLocalHost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(String(base).trim());

const steps = [
  [
    'deploy:check',
    'node',
    isLocalHost
      ? [join(ROOT, 'scripts', 'check-deploy-ready.mjs'), '--local']
      : [join(ROOT, 'scripts', 'check-deploy-ready.mjs')],
  ],
  ['npm run verify', 'node', [join(ROOT, 'scripts', 'verify.mjs')]],
  ['verify-mobile-modals', 'node', [join(ROOT, 'scripts', 'verify-mobile-modals.mjs')]],
  ['verify-full-site-flow', 'node', [join(ROOT, 'scripts', 'verify-full-site-flow.mjs'), base]],
  ['verify-maps', 'node', [join(ROOT, 'scripts', 'verify-maps.mjs'), base]],
  ['verify-auth-security', 'node', [join(ROOT, 'scripts', 'verify-auth-security.mjs'), base]],
  ['verify-devtools-security', 'node', [join(ROOT, 'scripts', 'verify-devtools-security.mjs'), base]],
  ['verify-operator-flow', 'node', [join(ROOT, 'scripts', 'verify-operator-flow.mjs'), base]],
  ['verify-driver-admin-flow', 'node', [join(ROOT, 'scripts', 'verify-driver-admin-flow.mjs'), base]],
  ['verify-manager-flow', 'node', [join(ROOT, 'scripts', 'verify-manager-flow.mjs'), base]],
];

let failed = 0;
console.log(`\n=== Полный прогон проверок: ${base} ===\n`);

for (const [label, cmd, args] of steps) {
  process.stdout.write(`→ ${label}… `);
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    failed += 1;
    console.log('FAIL');
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
  } else {
    console.log('OK');
  }
}

console.log(failed ? `\nИтого: ${failed} проверок с ошибкой.\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
