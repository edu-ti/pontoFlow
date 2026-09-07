import { pool } from '../config/db.js';

export async function getMarcadores(request, reply) {
  try {
    const userId = request.user.id;
    let res = await pool.query(
      'SELECT id, nome, cor FROM marcadores WHERE usuario_id = $1 ORDER BY id ASC',
      [userId]
    );

    // Se o usuário ainda não tiver marcadores criados, semeia os 4 padrões
    if (res.rows.length === 0) {
      await pool.query(`
        INSERT INTO marcadores (usuario_id, nome, cor) VALUES
        ($1, 'Trabalho presencial', '#3b82f6'),
        ($1, 'Home Office', '#10b981'),
        ($1, 'Visita a cliente', '#f59e0b'),
        ($1, 'Hora extra autorizada', '#8b5cf6')
      `, [userId]);

      res = await pool.query(
        'SELECT id, nome, cor FROM marcadores WHERE usuario_id = $1 ORDER BY id ASC',
        [userId]
      );
    }

    return reply.send({ marcadores: res.rows });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao buscar marcadores.', details: err.message });
  }
}

export async function createMarcador(request, reply) {
  try {
    const userId = request.user.id;
    const { nome, cor } = request.body || {};

    if (!nome || !nome.trim()) {
      return reply.status(400).send({ error: 'O nome do marcador é obrigatório.' });
    }

    const res = await pool.query(
      'INSERT INTO marcadores (usuario_id, nome, cor) VALUES ($1, $2, $3) RETURNING id, nome, cor',
      [userId, nome.trim(), cor || '#3b82f6']
    );

    return reply.status(201).send({
      message: 'Marcador criado com sucesso!',
      marcador: res.rows[0]
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao criar marcador.', details: err.message });
  }
}

export async function updateMarcador(request, reply) {
  try {
    const userId = request.user.id;
    const { id } = request.params;
    const { nome, cor } = request.body || {};

    if (!nome || !nome.trim()) {
      return reply.status(400).send({ error: 'O nome do marcador é obrigatório.' });
    }

    const res = await pool.query(
      'UPDATE marcadores SET nome = $1, cor = $2 WHERE id = $3 AND usuario_id = $4 RETURNING id, nome, cor',
      [nome.trim(), cor || '#3b82f6', id, userId]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({ error: 'Marcador não encontrado.' });
    }

    return reply.send({
      message: 'Marcador atualizado com sucesso!',
      marcador: res.rows[0]
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao atualizar marcador.', details: err.message });
  }
}

export async function deleteMarcador(request, reply) {
  try {
    const userId = request.user.id;
    const { id } = request.params;

    const res = await pool.query(
      'DELETE FROM marcadores WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [id, userId]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({ error: 'Marcador não encontrado.' });
    }

    return reply.send({ message: 'Marcador excluído com sucesso!', id });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao excluir marcador.', details: err.message });
  }
}
