import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

export async function register(request, reply) {
  const { nome_completo, nome_empresa, login, senha } = request.body || {};

  if (!nome_completo || !nome_empresa || !login || !senha) {
    return reply.status(400).send({
      error: 'Todos os campos são obrigatórios: nome_completo, nome_empresa, login e senha.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar se o login já existe
    const userCheck = await client.query('SELECT id FROM usuarios WHERE login = $1', [login.trim().toLowerCase()]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return reply.status(409).send({ error: 'Este login já está em uso. Escolha outro.' });
    }

    // 2. Buscar ou criar a empresa
    const cleanEmpresa = nome_empresa.trim();
    let empresaRes = await client.query(
      'SELECT id, nome_empresa FROM empresas WHERE LOWER(nome_empresa) = LOWER($1)',
      [cleanEmpresa]
    );

    let empresaId;
    if (empresaRes.rows.length === 0) {
      const newEmpresa = await client.query(
        'INSERT INTO empresas (nome_empresa) VALUES ($1) RETURNING id, nome_empresa',
        [cleanEmpresa]
      );
      empresaId = newEmpresa.rows[0].id;
    } else {
      empresaId = empresaRes.rows[0].id;
    }

    // 3. Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 4. Inserir usuário com valores padrão de jornada (Seg-Qui: 08:00-18:00, Sex: 17:00, Almoço: 60m)
    const insertUser = await client.query(
      `INSERT INTO usuarios (
        empresa_id, nome_completo, login, senha,
        entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos
      ) VALUES ($1, $2, $3, $4, '08:00:00', '18:00:00', '17:00:00', 60)
      RETURNING id, empresa_id, nome_completo, login, entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos`,
      [empresaId, nome_completo.trim(), login.trim().toLowerCase(), senhaHash]
    );

    await client.query('COMMIT');

    const user = insertUser.rows[0];

    // Gerar token JWT
    const token = await reply.jwtSign({
      id: user.id,
      empresa_id: user.empresa_id,
      nome_completo: user.nome_completo,
      login: user.login
    }, { expiresIn: '30d' });

    return reply.status(201).send({
      message: 'Colaborador cadastrado com sucesso!',
      token,
      user: {
        ...user,
        nome_empresa: cleanEmpresa,
        needs_schedule_setup: true
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao cadastrar colaborador.', details: err.message });
  } finally {
    client.release();
  }
}

export async function login(request, reply) {
  const { login, senha } = request.body || {};

  if (!login || !senha) {
    return reply.status(400).send({ error: 'Informe login e senha.' });
  }

  try {
    const res = await pool.query(
      `SELECT u.*, e.nome_empresa 
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.login = $1`,
      [login.trim().toLowerCase()]
    );

    if (res.rows.length === 0) {
      return reply.status(401).send({ error: 'Login ou senha inválidos.' });
    }

    const user = res.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return reply.status(401).send({ error: 'Login ou senha inválidos.' });
    }

    const token = await reply.jwtSign({
      id: user.id,
      empresa_id: user.empresa_id,
      nome_completo: user.nome_completo,
      login: user.login
    }, { expiresIn: '30d' });

    const { senha: _, ...userSafe } = user;

    return reply.send({
      message: 'Login realizado com sucesso!',
      token,
      user: userSafe
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao processar login.', details: err.message });
  }
}

export async function getProfile(request, reply) {
  try {
    const userId = request.user.id;
    const res = await pool.query(
      `SELECT u.id, u.empresa_id, u.nome_completo, u.login,
              u.entrada_seg_qui, u.saida_seg_qui, u.saida_sexta, u.tempo_intervalo_minutos,
              e.nome_empresa
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    return reply.send({ user: res.rows[0] });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao buscar perfil.', details: err.message });
  }
}

export async function updateSchedule(request, reply) {
  try {
    const userId = request.user.id;
    const { entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos } = request.body || {};

    if (!entrada_seg_qui || !saida_seg_qui || !saida_sexta || tempo_intervalo_minutos === undefined) {
      return reply.status(400).send({
        error: 'Campos obrigatórios: entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos.'
      });
    }

    const intervalMinutes = parseInt(tempo_intervalo_minutos, 10);
    if (isNaN(intervalMinutes) || intervalMinutes < 15 || intervalMinutes > 240) {
      return reply.status(400).send({ error: 'Tempo de intervalo deve ser entre 15 e 240 minutos.' });
    }

    const res = await pool.query(
      `UPDATE usuarios 
       SET entrada_seg_qui = $1,
           saida_seg_qui = $2,
           saida_sexta = $3,
           tempo_intervalo_minutos = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, empresa_id, nome_completo, login, entrada_seg_qui, saida_seg_qui, saida_sexta, tempo_intervalo_minutos`,
      [entrada_seg_qui, saida_seg_qui, saida_sexta, intervalMinutes, userId]
    );

    return reply.send({
      message: 'Configurações de jornada atualizadas com sucesso!',
      user: res.rows[0]
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao atualizar jornada.', details: err.message });
  }
}

export async function updateProfile(request, reply) {
  try {
    const userId = request.user.id;
    const { nome_completo, nome_empresa, senha_atual, nova_senha } = request.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Usuário não encontrado.' });
      }

      const currentUser = userRes.rows[0];

      // Alteração de senha
      if (nova_senha && nova_senha.trim()) {
        if (!senha_atual) {
          await client.query('ROLLBACK');
          return reply.status(400).send({ error: 'Para alterar a senha, informe sua senha atual.' });
        }
        const senhaOk = await bcrypt.compare(senha_atual, currentUser.senha);
        if (!senhaOk) {
          await client.query('ROLLBACK');
          return reply.status(400).send({ error: 'Senha atual incorreta.' });
        }
        const salt = await bcrypt.genSalt(10);
        const novoHash = await bcrypt.hash(nova_senha, salt);
        await client.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novoHash, userId]);
      }

      // Atualizar nome da empresa
      if (nome_empresa && nome_empresa.trim()) {
        await client.query('UPDATE empresas SET nome_empresa = $1 WHERE id = $2', [nome_empresa.trim(), currentUser.empresa_id]);
      }

      // Atualizar nome do colaborador
      if (nome_completo && nome_completo.trim()) {
        await client.query('UPDATE usuarios SET nome_completo = $1 WHERE id = $2', [nome_completo.trim(), userId]);
      }

      await client.query('COMMIT');

      // Retornar usuário atualizado
      const updatedRes = await pool.query(
        `SELECT u.id, u.empresa_id, u.nome_completo, u.login,
                u.entrada_seg_qui, u.saida_seg_qui, u.saida_sexta, u.tempo_intervalo_minutos,
                e.nome_empresa
         FROM usuarios u
         JOIN empresas e ON u.empresa_id = e.id
         WHERE u.id = $1`,
        [userId]
      );

      return reply.send({
        message: 'Perfil e empresa atualizados com sucesso!',
        user: updatedRes.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Erro ao atualizar dados.', details: err.message });
  }
}
