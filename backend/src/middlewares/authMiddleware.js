export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token de autenticação não fornecido ou inválido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Sessão expirada ou não autorizada', details: err.message });
  }
}
