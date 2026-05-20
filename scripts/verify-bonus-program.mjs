/**
 * Логика бонусной программы (без БД).
 * node scripts/verify-bonus-program.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const bonus = require(path.join(root, 'bonusProgram.js'));

let failed = 0;
function ok(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

if (bonus.computeOrderBonusEarn(1000, 200) !== 40) {
  fail(`computeOrderBonusEarn: ожидалось 40, получено ${bonus.computeOrderBonusEarn(1000, 200)}`);
} else {
  ok('Начисление 5% от суммы после списания бонусов');
}

if (bonus.computeOrderBonusEarn(500, 600) !== 0) {
  fail('computeOrderBonusEarn: списание больше суммы → 0 начисления');
} else {
  ok('Начисление не уходит в минус');
}

if (typeof bonus.reverseBonusesForCancelledOrder !== 'function') {
  fail('нет reverseBonusesForCancelledOrder');
} else {
  ok('Откат бонусов при отмене заказа экспортирован');
}

if (!failed) {
  console.log('\n\x1b[32mПроверки бонусной логики пройдены.\x1b[0m');
  process.exit(0);
}
process.exit(1);
