import { 
  getMarcadores, 
  createMarcador, 
  updateMarcador, 
  deleteMarcador 
} from '../controllers/marcadoresController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

export default async function marcadoresRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', getMarcadores);
  fastify.post('/', createMarcador);
  fastify.put('/:id', updateMarcador);
  fastify.delete('/:id', deleteMarcador);
}
