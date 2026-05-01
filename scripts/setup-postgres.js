require('dotenv').config();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL не задан в .env');
  }
  return new URL(raw);
}

async function ensureDatabase() {
  const target = parseDatabaseUrl();
  const dbName = target.pathname.replace(/^\//, '');
  if (!dbName) throw new Error('Не удалось определить имя базы из DATABASE_URL');

  const adminUrl = new URL(target.toString());
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    // eslint-disable-next-line no-console
    console.log(`[postgres] База создана: ${dbName}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[postgres] База уже существует: ${dbName}`);
  }
  await admin.end();
}

async function applySchema() {
  const sqlPath = path.join(__dirname, 'init-postgres.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
  // eslint-disable-next-line no-console
  console.log('[postgres] Схема применена (clients, orders).');
}

async function main() {
  await ensureDatabase();
  await applySchema();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[postgres] Ошибка инициализации:', err.message);
  process.exit(1);
});
