# ⏰ PontoFlow - Assistente Inteligente de Jornada e Ponto

O **PontoFlow** é um sistema web completo focado em **assistência ativa de jornada de trabalho** (pontualidade através de alertas visuais e sonoros inteligentes no navegador) e **conferência simplificada dos registros** com relógio de ponto físico (**Knup**) no fechamento mensal.

Projetado com foco **Mobile-First (PWA)** para atender 98% dos colaboradores que acessam pelo celular.

---

## 🚀 Arquitetura Tecnológica

- **Backend**: **Node.js com Fastify** (ultra performático, consome menos de 40MB de RAM na VPS).
  - Autenticação JWT com hash bcrypt.
  - Driver nativo PostgreSQL com pool de conexões (`pg`).
  - Rotas com validação de travas de sequência (1 → 2 → 3 → 4) e carimbo de horário oficial pelo servidor.
- **Frontend**: **React 19 com Vite** (Mobile-First SPA).
  - Web Audio API sintetizada (sem falhas de carregamento de áudio externo).
  - Web Notification API nativa.
  - Feedback háptico (vibração no smartphone via `navigator.vibrate`).
  - Ergonomia mobile: botões táteis grandes, bottom navigation bar e PWA.
- **Banco de Dados**: **PostgreSQL 16**.
  - Script SQL estruturado com índices de performance e restrições de unicidade diária.
- **Deploy**: Containerizado com **Docker & Docker Compose** otimizado para **Coolify** (Nginx Alpine no frontend consumindo < 10MB de RAM).

---

## 📱 Funcionalidades Principais

### 1. Auto-Cadastro e Criação Automática de Empresa
- Formulário simples: Nome Completo, Nome da Empresa, Login e Senha.
- Se a empresa digitada não existir no banco de dados, o backend cria-a automaticamente e associa o colaborador.
- Redirecionamento automático para a tela de **Configuração de Turno** (Seg a Qui, Sexta e Intervalo de Almoço de 60/90/120 min).

### 2. Painel Diário com Relógio Sincronizado e 4 Botões Sequenciais
- **Relógio do Servidor**: O horário das batidas é cravado pelo servidor backend, impedindo adulterações no relógio local do smartphone.
- **Trava de Sequência Rígida**:
  1. `Entrada Expediente`: Habilitado inicialmente.
  2. `Saída Almoço`: Só habilita após a Entrada ser registrada.
  3. `Volta Almoço`: Só habilita após a Saída do Almoço ser registrada.
  4. `Fim do Expediente`: Só habilita após a Volta do Almoço ser registrada.

### 3. Motor de Notificações Ativas (Gatilhos Críticos de 5 Minutos)
- **Gatilho da Volta do Almoço**: Ao registrar a saída para o almoço, calcula a hora exata de retorno com base no intervalo configurado. **Exatamente 5 minutos antes**, a tela do celular pulsa em alerta visual, o alarme toca repetidamente em alta frequência e uma notificação de SO é enviada avisando para retornar e bater no relógio Knup.
- **Gatilho do Fim do Expediente**: Identifica o dia da semana (Segunda a Quinta vs Sexta-feira) e monitora o horário de saída configurado. **Exatamente 5 minutos antes**, dispara o alarme visual, sonoro e push.
- **Botão Desbloquear Áudio & Testar Alarme**: Permite ao usuário conceder permissão no navegador móvel com 1 toque e testar os bipes previamente.

### 4. Relatórios de Conferência com Relógio Knup
- Filtros por período: Diário, Semanal e Mensal (com seletor de Mês e Ano).
- Layout espelho com colunas lado a lado (Entrada 1, Saída Almoço, Volta Almoço, Fim Expediente, Horas Líquidas e Saldo).
- **Exportação CSV** formatada para abertura direta no Microsoft Excel ou Google Sheets para cruzamento com o arquivo TXT/CSV extraído via pen drive do relógio Knup.
- Modo de **Impressão Limpa** (CSS `@media print`).

---

## 🛠️ Como Executar Localmente

### Opção 1: Via Docker Compose (Recomendado)
```bash
# 1. Clone o repositório
cd pontoFlow

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Suba os containers
docker compose up -d --build
```
Acesse no navegador:
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`

---

### Opção 2: Desenvolvimento Local Sem Docker

#### 1. Banco de Dados PostgreSQL
Crie um banco chamado `pontoflow_db` e execute o script `database/init.sql`:
```bash
psql -U postgres -d pontoflow_db -f database/init.sql
```

#### 2. Backend
```bash
cd backend
npm install
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173`.

---

## 🚢 Deploy no Coolify

1. No painel do seu **Coolify**, crie um novo recurso (**Service** ou **Docker Compose**).
2. Aponte para o repositório Git do PontoFlow.
3. O Coolify detectará automaticamente o arquivo `docker-compose.yml`.
4. Configure as variáveis de ambiente no Coolify:
   - `DB_USER`: usuário do PostgreSQL (ex: `pontoflow`)
   - `DB_PASSWORD`: senha forte
   - `DB_NAME`: `pontoflow_db`
   - `JWT_SECRET`: chave secreta para assinatura dos tokens
5. Clique em **Deploy**. O Coolify cuidará do provisionamento, SSL automático (Let's Encrypt) e reinicialização dos containers.

---

## 📲 Adicionar como App no Celular (PWA)
1. Abra o link da aplicação no Chrome (Android) ou Safari (iOS).
2. No Chrome: Toque no menu (3 pontinhos) e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
3. No Safari (iOS): Toque no ícone de compartilhamento e selecione **"Adicionar à Tela de Início"**.
4. O PontoFlow abrirá em modo tela cheia nativo, sem barra de navegação do browser.
