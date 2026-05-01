const { Pool } = require('pg');

let pool;

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'Voda2026!';
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const db = process.env.PGDATABASE || 'ekvaline_db';
  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

function getPostgresPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000,
    });
  }
  return pool;
}

async function checkPostgresConnection() {
  try {
    const p = getPostgresPool();
    const result = await p.query('SELECT NOW() AS now');
    // eslint-disable-next-line no-console
    console.log(`[postgres] Подключено: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[postgres] Не подключено: ${err.message}`);
    return false;
  }
}

module.exports = { getPostgresPool, checkPostgresConnection };
