import webpush from 'web-push';
import { pool } from '../config/db.js';

const TIME_ZONE = 'America/Sao_Paulo';
let schedulerRunning = false;
let configured = false;

function isConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function configureWebPush() {
  if (!isConfigured()) {
    console.warn('[PUSH] VAPID não configurado. As notificações em segundo plano ficarão desativadas.');
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:suporte@pontoflow.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export function getVapidPublicKey() {
  return configured ? process.env.VAPID_PUBLIC_KEY : null;
}

async function getDueNotifications() {
  const result = await pool.query(`
    WITH clock AS (
      SELECT CURRENT_TIMESTAMP AT TIME ZONE '${TIME_ZONE}' AS now_local
    ), candidates AS (
      SELECT
        r.usuario_id,
        'almoco' AS tipo,
        'lunch-alarm' AS tag,
        '⏰ ATENÇÃO: RETORNO DO ALMOÇO!' AS titulo,
        'Faltam menos de 5 minutos para as ' || TO_CHAR(
          r.saida_almoco + (u.tempo_intervalo_minutos || ' minutes')::INTERVAL, 'HH24:MI'
        ) || '. Prepare-se para retornar e bater no relógio físico!' AS mensagem
      FROM registros_ponto r
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN preferencias_notificacao pn ON pn.usuario_id = r.usuario_id
      CROSS JOIN clock
      WHERE r.data_registro = clock.now_local::DATE
        AND r.saida_almoco IS NOT NULL
        AND r.volta_almoco IS NULL
        AND COALESCE((pn.preferencias ->> 'horaRetornar')::BOOLEAN, TRUE)
        AND clock.now_local >= r.data_registro + r.saida_almoco + ((u.tempo_intervalo_minutos - 5) || ' minutes')::INTERVAL
        AND clock.now_local < r.data_registro + r.saida_almoco + ((u.tempo_intervalo_minutos + 15) || ' minutes')::INTERVAL

      UNION ALL

      SELECT
        r.usuario_id,
        'expediente' AS tipo,
        'end-day-alarm' AS tag,
        '🏁 HORA DE ENCERRAR O EXPEDIENTE!' AS titulo,
        'Faltam 5 minutos para as ' || TO_CHAR(
          CASE WHEN EXTRACT(DOW FROM clock.now_local) = 5 THEN u.saida_sexta ELSE u.saida_seg_qui END, 'HH24:MI'
        ) || '. Finalize suas atividades e registre a saída no relógio físico!' AS mensagem
      FROM registros_ponto r
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN preferencias_notificacao pn ON pn.usuario_id = r.usuario_id
      CROSS JOIN clock
      WHERE r.data_registro = clock.now_local::DATE
        AND r.entrada_expediente IS NOT NULL
        AND r.saida_expediente IS NULL
        AND EXTRACT(DOW FROM clock.now_local) BETWEEN 1 AND 5
        AND COALESCE((pn.preferencias ->> 'horaIrParaCasa')::BOOLEAN, TRUE)
        AND clock.now_local >= r.data_registro + (CASE WHEN EXTRACT(DOW FROM clock.now_local) = 5 THEN u.saida_sexta ELSE u.saida_seg_qui END) - INTERVAL '5 minutes'
        AND clock.now_local < r.data_registro + (CASE WHEN EXTRACT(DOW FROM clock.now_local) = 5 THEN u.saida_sexta ELSE u.saida_seg_qui END) + INTERVAL '15 minutes'
    )
    SELECT candidates.*, TO_CHAR(clock.now_local::DATE, 'YYYY-MM-DD') AS data_referencia
    FROM candidates
    CROSS JOIN clock
  `);
  return result.rows;
}

async function deliverNotification(notification) {
  const claimed = await pool.query(
    `INSERT INTO notificacoes_enviadas (usuario_id, tipo, data_referencia)
     VALUES ($1, $2, $3::DATE)
     ON CONFLICT (usuario_id, tipo, data_referencia) DO NOTHING
     RETURNING id`,
    [notification.usuario_id, notification.tipo, notification.data_referencia]
  );
  if (claimed.rows.length === 0) return;

  const deliveryId = claimed.rows[0].id;
  const subscriptions = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE usuario_id = $1',
    [notification.usuario_id]
  );

  let delivered = 0;
  await Promise.all(subscriptions.rows.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify({ title: notification.titulo, body: notification.mensagem, tag: notification.tag }),
        { TTL: 60 * 20 }
      );
      delivered += 1;
    } catch (error) {
      const status = error.statusCode || error.status;
      if (status === 404 || status === 410) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [subscription.id]);
      } else {
        console.error('[PUSH] Falha ao entregar notificação:', error.message);
      }
    }
  }));

  // Sem uma inscrição válida, não consumimos o alerta: ele poderá ser enviado
  // assim que o usuário abrir o PWA e autorizar as notificações.
  if (delivered === 0) {
    await pool.query('DELETE FROM notificacoes_enviadas WHERE id = $1', [deliveryId]);
  }
}

export async function runNotificationScheduler() {
  if (!configured || schedulerRunning) return;
  schedulerRunning = true;
  try {
    const due = await getDueNotifications();
    await Promise.all(due.map(deliverNotification));
  } catch (error) {
    console.error('[PUSH] Erro no agendador de notificações:', error.message);
  } finally {
    schedulerRunning = false;
  }
}

export function startNotificationScheduler() {
  if (!configured) return;
  runNotificationScheduler();
  setInterval(runNotificationScheduler, 30 * 1000);
  console.log('[PUSH] Agendador de notificações em segundo plano iniciado.');
}