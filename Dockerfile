# independent-lab: imagem de produção (Next.js standalone, usuário não-root).
#
#   docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD) \
#                --build-arg NEXT_PUBLIC_SITE_URL=https://lab.exemplo.com -t independent-lab .
#
# NEXT_PUBLIC_* é embutido no bundle em tempo de build: a URL pública precisa
# ser passada aqui, e não só no .env de runtime.

# ---- dependências ----------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build -----------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
ARG GIT_SHA=dev
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ARG GIT_SHA=dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    GAMEHUB_DATA_DIR=/data \
    GIT_SHA=$GIT_SHA

# Usuário sem privilégios, sem shell de login.
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app -h /app -s /sbin/nologin app \
    && mkdir -p /data && chown app:app /data

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
