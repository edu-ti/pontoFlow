import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'pontoflow',
  password: process.env.DB_PASSWORD || 'pontoflow123',
  database: process.env.DB_NAME || 'pontoflow_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DATABASE ERROR] Erro inesperado no pool do Postgres:', err);
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now');
    client.release();
    console.log('[DATABASE] Conexão estabelecida com sucesso. Hora no banco:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('[DATABASE] Falha ao conectar no PostgreSQL:', error.message);
    return false;
  }
}

export async function initDbSchema() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
          id SERIAL PRIMARY KEY,
          nome_empresa VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
          nome_completo VARCHAR(255) NOT NULL,
          login VARCHAR(100) NOT NULL UNIQUE,
          senha VARCHAR(255) NOT NULL,
          entrada_seg_qui TIME NOT NULL DEFAULT '08:00:00',
          saida_seg_qui TIME NOT NULL DEFAULT '18:00:00',
          saida_sexta TIME NOT NULL DEFAULT '17:00:00',
          tempo_intervalo_minutos INTEGER NOT NULL DEFAULT 60,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS registros_ponto (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          data_registro DATE NOT NULL,
          entrada_expediente TIME,
          saida_almoco TIME,
          volta_almoco TIME,
          saida_expediente TIME,
          tag VARCHAR(50),
          observacao VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unq_usuario_data UNIQUE (usuario_id, data_registro)
      );

      ALTER TABLE registros_ponto ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

      CREATE TABLE IF NOT EXISTS marcadores (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          nome VARCHAR(100) NOT NULL,
          cor VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_registros_usuario_data ON registros_ponto(usuario_id, data_registro);
      CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_ponto(data_registro);
      CREATE INDEX IF NOT EXISTS idx_marcadores_usuario ON marcadores(usuario_id);
    `);
    client.release();
    console.log('[DATABASE] Esquema de tabelas verificado e pronto.');
  } catch (err) {
    console.error('[DATABASE] Erro ao inicializar tabelas:', err.message);
  }
}
