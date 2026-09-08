FROM node:22-alpine

WORKDIR /app

# Instalar dependências e fuso horário oficial (Brasília / Pernambuco)
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    echo "America/Sao_Paulo" > /etc/timezone

COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fonte
COPY . .

# Variáveis padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV TZ=America/Sao_Paulo

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["npm", "start"]
