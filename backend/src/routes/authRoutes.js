import { register, login, getProfile, updateSchedule, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

export default async function authRoutes(fastify, options) {
  // Rotas públicas
  fastify.post('/register', register);
  fastify.post('/login', login);

  // Rotas autenticadas
  fastify.get('/me', { preHandler: [authenticate] }, getProfile);
  fastify.put('/profile', { preHandler: [authenticate] }, updateProfile);
  fastify.put('/schedule', { preHandler: [authenticate] }, updateSchedule);
}
