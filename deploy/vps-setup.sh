#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — provisionamento ÚNICO da VPS (Ubuntu/Debian).
#
# Roda UMA vez, de dentro da pasta do projeto já copiada/clonada na VPS.
# Idempotente: pode rodar de novo sem quebrar nada (checa antes de instalar,
# nunca regenera segredo já existente).
#
# Uso:
#   ./deploy/vps-setup.sh                                      # só HTTP
#   ./deploy/vps-setup.sh app.seudominio.com.br voce@email.com  # com HTTPS
#
# Domínio da API do Supabase é derivado automaticamente como
# `api.<domínio do app>` — sobrescreva com GAMEHUB_API_DOMAIN=... se precisar
# de outro. As DUAS entradas DNS (o domínio e `api.<domínio>`) precisam
# apontar para o IP desta VPS ANTES de rodar com HTTPS, senão o certbot falha
# o desafio HTTP-01 do subdomínio.
#
# O que faz:
#   1. Instala Node 20, PM2, Nginx, Docker + compose plugin
#   2. Firewall (ufw): só 22/80/443 públicos — app (8081) e Supabase (8000)
#      ficam só em 127.0.0.1, nunca expostos direto à internet
#   3. Sobe o Supabase self-hosted (deploy/supabase-up.sh) — gera segredos,
#      aplica TODAS as migrations de supabase/migrations/ e o seed
#   4. Cria/atualiza o .env do APP com GAMEHUB_DB=supabase e as 3 variáveis
#      NEXT_PUBLIC_SUPABASE_*/SUPABASE_SERVICE_ROLE_KEY lidas do Supabase que
#      acabou de subir — nunca digitadas a mão
#   5. npm ci + npm run build
#   6. Registra o processo no PM2 (idempotente de verdade — reload se já
#      existe) e o deixa sobrevivendo a reboot
#   7. Configura o Nginx: app no domínio, Supabase (Kong) em api.<domínio>
#   8. Se domínio + e-mail forem passados, pede certificado HTTPS (certbot)
#      para as duas entradas
# ============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
API_DOMAIN="${GAMEHUB_API_DOMAIN:-}"
if [ -z "$API_DOMAIN" ] && [ -n "$DOMAIN" ]; then
  API_DOMAIN="api.$DOMAIN"
fi
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PORT=8081

cd "$APP_DIR"
echo "==> Projeto em: $APP_DIR"

log() { echo; echo "==> $1"; }

# ---------------------------------------------------------------------------
# 1. Node.js 20 (NodeSource) + PM2 + Nginx
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node.js já instalado: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Instalando PM2..."
  sudo npm install -g pm2
else
  log "PM2 já instalado: $(pm2 -v)"
fi

if ! command -v nginx >/dev/null 2>&1; then
  log "Instalando Nginx..."
  sudo apt-get update -y
  sudo apt-get install -y nginx
else
  log "Nginx já instalado."
fi

# ---------------------------------------------------------------------------
# 1b. Docker + compose plugin — só o Supabase self-hosted precisa disto
#     (GH-OPS Bloco 2). Instalador oficial da Docker Inc.
#     (mesmo padrão de confiança do NodeSource acima: script assinado pelo
#     próprio fornecedor, não um terceiro).
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Instalando Docker..."
  curl -fsSL https://get.docker.com | sudo -E sh
  sudo usermod -aG docker "$USER"
  DOCKER_RECEM_INSTALADO=1
else
  log "Docker já instalado: $(docker --version)"
  DOCKER_RECEM_INSTALADO=0
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] 'docker compose' (plugin v2) não ficou disponível após a instalação." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Firewall — só SSH e web público. App e Supabase nunca ficam expostos.
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
  log "Configurando firewall (ufw)..."
  sudo ufw allow OpenSSH >/dev/null
  sudo ufw allow 'Nginx Full' >/dev/null
  sudo ufw --force enable >/dev/null
  sudo ufw status | sed 's/^/    /'
else
  echo "[aviso] ufw não encontrado — configure o firewall manualmente (libere 22/80/443 e nada além disso)."
fi

# ---------------------------------------------------------------------------
# 3. Supabase self-hosted — sobe o stack e aplica todas as migrations.
#    `sg docker -c` roda o comando já com a permissão do grupo `docker` que
#    acabamos de adicionar, sem exigir logout/login no meio do provisionamento
#    (grupo novo só vale pra sessões abertas DEPOIS do usermod).
# ---------------------------------------------------------------------------
log "Subindo Supabase self-hosted..."
if [ "$DOCKER_RECEM_INSTALADO" = "1" ]; then
  sg docker -c "./deploy/supabase-up.sh '$API_DOMAIN' '$DOMAIN'"
else
  ./deploy/supabase-up.sh "$API_DOMAIN" "$DOMAIN"
fi

# ---------------------------------------------------------------------------
# 3b. Cron do backup diário (3h) — idempotente: só adiciona a linha se ela
#     ainda não estiver no crontab do usuário (evita duplicar a cada rerun).
# ---------------------------------------------------------------------------
CRON_LINHA="0 3 * * * cd $APP_DIR && ./deploy/backup.sh >> deploy/logs/backup.log 2>&1"
if ! (crontab -l 2>/dev/null | grep -qF "./deploy/backup.sh"); then
  log "Instalando cron de backup diário (3h)..."
  (crontab -l 2>/dev/null; echo "$CRON_LINHA") | crontab -
  echo "    Agendado: $CRON_LINHA"
else
  log "Cron de backup já estava instalado — não mexi."
fi

# ---------------------------------------------------------------------------
# 4. .env do APP — gera GAMEHUB_SECRET se necessário; sempre alinha as
#    variáveis do Supabase com o que o stack acabou de gerar (idempotente:
#    reescrever com o MESMO valor não muda nada nem derruba sessão).
# ---------------------------------------------------------------------------
log "Configurando .env do app..."
SUPA_ENV="deploy/supabase/.env"
ANON_KEY="$(grep '^ANON_KEY='            "$SUPA_ENV" | cut -d= -f2-)"
SERVICE_ROLE_KEY="$(grep '^SERVICE_ROLE_KEY=' "$SUPA_ENV" | cut -d= -f2-)"
SUPABASE_PUBLIC_URL="$(grep '^SUPABASE_PUBLIC_URL=' "$SUPA_ENV" | cut -d= -f2-)"
# Mesmo segredo que GoTrue/PostgREST/Realtime usam pra validar token — é o
# que permite o APP assinar um JWT que o Realtime aceita sem chamada extra
# nenhuma (GH-OPS Bloco 5, ver src/lib/supabase/jwt.ts).
JWT_SECRET="$(grep '^JWT_SECRET=' "$SUPA_ENV" | cut -d= -f2-)"

if [ ! -f ".env" ]; then
  GAMEHUB_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
GAMEHUB_DB=supabase
GAMEHUB_SECRET=$GAMEHUB_SECRET
NODE_ENV=production
EOF
  echo "    .env criado com GAMEHUB_SECRET gerado automaticamente."
else
  log ".env já existe — preservando GAMEHUB_SECRET."
  grep -q '^GAMEHUB_SECRET=.\+' .env || echo "[aviso] .env existe mas GAMEHUB_SECRET parece vazio — gere com: openssl rand -hex 32"
  grep -q '^GAMEHUB_DB='       .env || echo "GAMEHUB_DB=supabase" >> .env
  grep -q '^NODE_ENV='         .env || echo "NODE_ENV=production" >> .env
fi

# As 4 variáveis do Supabase são sempre REESCRITAS a partir do stack que
# acabou de subir — nunca digitadas, nunca copiadas de outro lugar.
for chave in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET; do
  sed -i.bak "/^${chave}=/d" .env
done
rm -f .env.bak
cat >> .env <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_PUBLIC_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET
EOF
chmod 600 .env
echo "    .env alinhado com o Supabase self-hosted (inclui SUPABASE_JWT_SECRET — presença ao vivo)."

# ---------------------------------------------------------------------------
# 5. Build
# ---------------------------------------------------------------------------
log "Instalando dependências (npm ci)..."
npm ci

log "Build de produção (npm run build)..."
npm run build

# ---------------------------------------------------------------------------
# 6. PM2 — sobe/atualiza o processo, sobrevive a reboot.
#    ANTES: `pm2 start` sempre, que falha ("already launched") numa segunda
#    execução deste script sob `set -e` — não era idempotente de verdade.
#    AGORA: mesmo padrão que `deploy/deploy.sh` já usa (`pm2 describe`).
# ---------------------------------------------------------------------------
log "Subindo/atualizando processo no PM2..."
if pm2 describe labdatadev-gamehub >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js
else
  pm2 start deploy/ecosystem.config.js
fi
pm2 save

STARTUP_CMD="$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | tail -1 || true)"
if [[ "$STARTUP_CMD" == sudo* ]]; then
  log "Registrando PM2 para iniciar no boot..."
  eval "$STARTUP_CMD"
else
  echo "[aviso] Não consegui detectar o comando de startup do PM2 automaticamente."
  echo "        Rode 'pm2 startup' manualmente e siga a instrução que ele imprimir."
fi

# ---------------------------------------------------------------------------
# 7. Nginx — zonas de rate limit primeiro (M-11; precisam existir ANTES dos
#    `server{}` que as referenciam, senão `nginx -t` falha), depois o app no
#    domínio, depois o Supabase (Kong) em api.<domínio>.
# ---------------------------------------------------------------------------
log "Instalando zonas de rate limiting..."
sudo cp deploy/nginx-limits.conf.template /etc/nginx/conf.d/gamehub-limits.conf

log "Configurando Nginx (app)..."
SERVER_NAME="${DOMAIN:-_}"
sed -e "s/{{DOMAIN}}/$SERVER_NAME/g" -e "s/{{PORT}}/$APP_PORT/g" \
  deploy/nginx.conf.template | sudo tee /etc/nginx/sites-available/labdatadev-gamehub >/dev/null
sudo ln -sf /etc/nginx/sites-available/labdatadev-gamehub /etc/nginx/sites-enabled/labdatadev-gamehub
[ -e /etc/nginx/sites-enabled/default ] && sudo rm -f /etc/nginx/sites-enabled/default

if [ -n "$API_DOMAIN" ]; then
  log "Configurando Nginx (Supabase/Kong em $API_DOMAIN)..."
  sed -e "s/{{API_DOMAIN}}/$API_DOMAIN/g" \
    deploy/nginx-supabase.conf.template | sudo tee /etc/nginx/sites-available/labdatadev-gamehub-api >/dev/null
  sudo ln -sf /etc/nginx/sites-available/labdatadev-gamehub-api /etc/nginx/sites-enabled/labdatadev-gamehub-api
fi

sudo nginx -t
sudo systemctl reload nginx
echo "    Nginx configurado (app: $SERVER_NAME · api: ${API_DOMAIN:-desabilitado, sem domínio})."

# ---------------------------------------------------------------------------
# 8. HTTPS (opcional) — só se domínio + e-mail foram passados. Um único
#    certificado cobrindo as duas entradas (app + api).
# ---------------------------------------------------------------------------
if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
  log "Emitindo certificado HTTPS para $DOMAIN e $API_DOMAIN..."
  if ! command -v certbot >/dev/null 2>&1; then
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  sudo certbot --nginx -d "$DOMAIN" -d "$API_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
elif [ -n "$DOMAIN" ]; then
  echo
  echo "[info] Domínio informado sem e-mail — pulei o certbot."
  echo "       Rode depois: sudo certbot --nginx -d $DOMAIN -d $API_DOMAIN"
else
  echo
  echo "[info] Sem domínio informado — servindo só HTTP por enquanto."
  echo "       Quando tiver domínio apontado pro IP da VPS (E o subdomínio"
  echo "       api.<domínio>), rode:"
  echo "       ./deploy/vps-setup.sh seudominio.com.br voce@email.com"
fi

echo
echo "============================================================"
echo " Pronto. Verifique com:"
echo "   pm2 status"
echo "   curl -fsS http://127.0.0.1:8081/api/health"
echo "   docker compose -f deploy/supabase/docker-compose.yml ps"
if [ "${DOCKER_RECEM_INSTALADO:-0}" = "1" ]; then
  echo
  echo " [importante] Docker foi instalado agora — faça logout/login (ou"
  echo " 'newgrp docker') antes de rodar 'docker compose' manualmente nesta"
  echo " sessão de SSH."
fi
echo "============================================================"
