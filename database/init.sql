-- ==========================================================
-- PONTOFLOW - SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS
-- PostgreSQL 15+
-- ==========================================================

-- Extensão para UUID (opcional/utilitário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nome_empresa VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE USUÁRIOS (COLABORADORES)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    entrada_seg_qui TIME NOT NULL DEFAULT '08:00:00',
    saida_seg_qui TIME NOT NULL DEFAULT '18:00:00',
    saida_sexta TIME NOT NULL DEFAULT '17:00:00',
    tempo_intervalo_minutos INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE REGISTROS DE PONTO
CREATE TABLE IF NOT EXISTS registros_ponto (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_registro DATE NOT NULL,
    entrada_expediente TIME,
    saida_almoco TIME,
    volta_almoco TIME,
    saida_expediente TIME,
    observacao VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_usuario_data UNIQUE (usuario_id, data_registro)
);

-- ÍNDICES PARA PERFORMANCE MÁXIMA EM RELATÓRIOS E CONSULTAS DIÁRIAS
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_registros_usuario_data ON registros_ponto(usuario_id, data_registro);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_ponto(data_registro);

-- COMENTÁRIOS EXPLICATIVOS NAS TABELAS
COMMENT ON TABLE empresas IS 'Empresas cadastradas no PontoFlow';
COMMENT ON TABLE usuarios IS 'Colaboradores com configurações de jornada e credenciais';
COMMENT ON TABLE registros_ponto IS 'Registros diários com 4 batidas e integridade vinculada ao horário do servidor';
