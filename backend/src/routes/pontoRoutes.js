import { getTodayStatus, baterPonto } from '../controllers/pontoController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

export default async function pontoRoutes(fastify, options) {
  // Todas as rotas de ponto exigem autenticação
  fastify.addHook('preHandler', authenticate);

  // Status e horários do servidor de hoje
  fastify.get('/today', getTodayStatus);

  // Bater ponto (Entrada, Saída Almoço, Volta Almoço, Fim Expediente)
  fastify.post('/bater', baterPonto);
}
