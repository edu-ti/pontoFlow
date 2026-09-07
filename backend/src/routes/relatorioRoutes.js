import { getRelatorios } from '../controllers/relatorioController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

export default async function relatorioRoutes(fastify, options) {
  // Rotas de relatório exigem autenticação
  fastify.addHook('preHandler', authenticate);

  // Consulta consolidada para conferência com o relógio físico Knup
  fastify.get('/', getRelatorios);
}
