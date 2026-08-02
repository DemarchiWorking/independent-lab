# ============================================================================
# labdatadev-gamehub — imagem de produção (Next.js standalone).
#
# Mesmo padrão de 3 estágios já usado por v4mos-app e labdatadev-frontend
# nesta VPS (/opt/v4mos/Dockerfile, /opt/labdatadev/Dockerfile) — mantido
# de propósito para não introduzir uma segunda convenção de build na frota.
#
# Segredos reais NUNCA entram aqui — só os placeholders `NEXT_PUBLIC_*`
# abaixo, exigidos em build-time pelo Next para poder gerar as páginas
# estáticas. Os valores de verdade (Supabase, GAMEHUB_SECRET) são injetados
# em runtime via `env_file`/`environment` no docker-compose.
# ============================================================================

# ── Stage 1: Dependencies ────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Builder ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Placeholders de build — a rota `/` e outras estáticas só precisam de uma
# URL/chave sintaticamente válidas para o SDK do Supabase inicializar sem
# lançar; nenhuma chamada de rede acontece durante `next build`.
ENV NEXT_PUBLIC_SUPABASE_URL=https://build-placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=build-placeholder-anon-key
ENV GAMEHUB_SECRET=build-placeholder-32-chars-minimo-000000

RUN npm run build

# ── Stage 3: Runner (mínimo, distroless-like via alpine) ─────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache wget \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Saída standalone (server.js + node_modules mínimo de produção)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Assets estáticos com hash de conteúdo (cache agressivo seguro no nginx)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# `/api/health` já existe no app (usado pelo deploy.sh do modo PM2) — mesmo
# endpoint, mesmo contrato, dois caminhos de deploy verificando a mesma coisa.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

CMD ["node", "server.js"]
