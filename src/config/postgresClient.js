import env from 'dotenv';
import pkg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente do .env na raiz.
env.config({ path: join(__dirname, '../../.env') });

const connectionString =
  process.env.SUPABASE_DB_CONNECTION_STRING || process.env.DATABASE_URL;

const sslEnabled = (process.env.SUPABASE_DB_SSL ?? 'true')
  .toString()
  .toLowerCase() !== 'false';
const sslRejectUnauthorized = (process.env.SUPABASE_DB_SSL_REJECT_UNAUTHORIZED ?? 'false')
  .toString()
  .toLowerCase() === 'true';

const baseConfig = connectionString
  ? { connectionString }
  : {
      host:
        process.env.SUPABASE_DB_HOST ||
        process.env.PGHOST ||
        process.env.POSTGRES_HOST,
      port: Number(process.env.SUPABASE_DB_PORT || process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
      database:
        process.env.SUPABASE_DB_NAME ||
        process.env.PGDATABASE ||
        process.env.POSTGRES_DB,
      user:
        process.env.SUPABASE_DB_USER ||
        process.env.PGUSER ||
        process.env.POSTGRES_USER,
      password:
        process.env.SUPABASE_DB_PASSWORD ||
        process.env.PGPASSWORD ||
        process.env.POSTGRES_PASSWORD,
    };

if (
  !connectionString &&
  (!baseConfig.host || !baseConfig.database || !baseConfig.user)
) {
  throw new Error(
    'Parâmetros do Postgres ausentes. Defina SUPABASE_DB_CONNECTION_STRING ou SUPABASE_DB_HOST/PORT/NAME/USER/PASSWORD.'
  );
}

const poolConfig = {
  ...baseConfig,
  ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
  max: Number(process.env.SUPABASE_DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.SUPABASE_DB_POOL_IDLE || 30000),
};

class PostgresClient {
  constructor() {
    this.pool = new Pool(poolConfig);
  }

  async testConnection() {
    try {
      const { rows } = await this.pool.query('select 1 as result');
      return rows?.[0]?.result === 1;
    } catch (error) {
      throw new Error(`Falha ao conectar no Postgres: ${error.message}`);
    }
  }

  query(text, params) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
  }
}

const postgresClient = new PostgresClient();

export default postgresClient;
export { PostgresClient };

