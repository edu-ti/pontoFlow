import { pool } from '../config/db.js';
import { getVapidPublicKey } from '../services/pushService.js';

const ALLOWED_PREFERENCES = ['horaComecar', 'horaIntervalo', 'horaRetornar', 'horaIrParaCasa'];

export async function getPushConfig(request, reply) {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return reply.status(503).send({ error: 'Notificações em segundo plano ainda não estão configuradas no servidor.' });
  }
  return reply.send({ publicKey });
}

export async function saveSubscription(request, reply) {
  const { endpoint, keys } = request.body || {};
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return reply.status(400).send({ error: 'Inscrição de notificações inválida.' });
  }

  try {
    await pool.query(
      `INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         usuario_id = EXCLUDED.usuario_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         updated_at = CURRENT_TIMESTAMP`,
      [request.user.id, endpoint, p256dh, auth]
    );
    return reply.status(201).send({ message: 'Dispositivo habilitado para notificações em segundo plano.' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Não foi possível salvar o dispositivo para notificações.' });
  }
}

export async function updateNotificationPreferences(request, reply) {
  const body = request.body || {};
  const preferences = Object.fromEntries(
    Object.entries(body).filter(([key, value]) => ALLOWED_PREFERENCES.includes(key) && typeof value === 'boolean')
  );
  if (Object.keys(preferences).length === 0) {
    return reply.status(400).send({ error: 'Informe ao menos uma preferência de notificação válida.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO preferencias_notificacao (usuario_id, preferencias)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (usuario_id) DO UPDATE SET
         preferencias = preferencias_notificacao.preferencias || EXCLUDED.preferencias,
         updated_at = CURRENT_TIMESTAMP
       RETURNING preferencias`,
      [request.user.id, JSON.stringify(preferences)]
    );
    return reply.send({ preferences: result.rows[0].preferencias });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Não foi possível atualizar as preferências de notificação.' });
  }
}