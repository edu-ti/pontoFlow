import { getPushConfig, saveSubscription, updateNotificationPreferences } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

export default async function notificationRoutes(fastify) {
  fastify.get('/config', { preHandler: [authenticate] }, getPushConfig);
  fastify.post('/subscriptions', { preHandler: [authenticate] }, saveSubscription);
  fastify.put('/preferences', { preHandler: [authenticate] }, updateNotificationPreferences);
}