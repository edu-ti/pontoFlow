import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { testConnection, initDbSchema } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import pontoRoutes from './routes/pontoRoutes.js';
import relatorioRoutes from './routes/relatorioRoutes.js';
import marcadoresRoutes from './routes/marcadoresRoutes.js';

dotenv.config();

const app = fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
    }
  } : true
});

// CORS
await app.register(cors, {
  origin: true, // Permite qualquer origem ou configure via CORS_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// JWT
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'pontoflow-super-secret-key-2026-vps-coolify-jwt-token'
});

// Rota raiz
app.get('/', async (request, reply) => {
  return { status: 'ok', app: 'PontoFlow Backend API', timestamp: new Date().toISOString() };
});

// Rota de Health Check para o Docker / Coolify
app.get('/health', async (request, reply) => {
  return { status: 'ok', app: 'PontoFlow Backend', timestamp: new Date().toISOString() };
});

// Registrar rotas da API
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(pontoRoutes, { prefix: '/api/ponto' });
await app.register(relatorioRoutes, { prefix: '/api/relatorios' });
await app.register(marcadoresRoutes, { prefix: '/api/marcadores' });

// Inicialização do Servidor
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    console.log('[STARTUP] Verificando conexão com o banco de dados PostgreSQL...');
    await testConnection();
    await initDbSchema();

    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 [PONTOFLOW BACKEND] Servidor rodando em http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
