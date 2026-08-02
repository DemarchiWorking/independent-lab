#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — provisionamento via Docker Compose.
#
# CAMINHO CANÔNICO de deploy deste projeto (Épico 13, 2026-08-01) — substitui
# `deploy/vps-setup.sh` (modo PM2 bare-metal, agora LEGADO/deprecado, ver
# aviso no topo daquele arquivo) como o caminho recomendado tanto para esta
# VPS (labd.cloud) quanto para replicar em qualquer VPS/cloud nova (ver
# `deploy/docker/cloud-init.yaml` para o 1-click) e para CI/CD
# (`.github/workflows/deploy.yml`).
#
# Roda numa VPS/cloud NOVA (ou nesta, isolado do que já existe) — instala
# Docker se faltar, sobe app+nginx (+ Supabase, se pedido), sempre validando
# saúde real antes de declarar sucesso. Idempotente: pode rodar de novo
# (inclusive para ATUALIZAR — `--build` garante que o código novo entra).
#
# Uso:
#   ./deploy/docker/setup.sh                    # GAMEHUB_DB=file, sem Postgres — smoke test rápido
#   ./deploy/docker/setup.sh --with-supabase     # + Supabase self-hosted vendorizado (deploy/supabase/)
#   ./deploy/docker/setup.sh --with-supabase --labd-cloud   # + Traefik desta VPS (labd.cloud)
#   ./deploy/docker/setup.sh --with-supabase --replicas 5   # + réplicas do app (default 3, Épico 13)
#
# `--labd-cloud` sozinho (sem `--with-supabase`) assume que GAMEHUB_DB já
# está setado em `.env` para apontar num Supabase compartilhado existente —
# ver a nota de arquitetura em docker-compose.labd-cloud.yml antes de usar
# essa combinação; não é a automática/recomendada até essa decisão ser
# tomada com o Antonio.
#
# `--replicas N` ajusta `GAMEHUB_APP_REPLICAS` (default 3, ver
# docker-compose.yml) — quantos processos Next.js dividem a carga de HTTP/
# Server Actions. Dimensionamento real medido em
# docs/architecture/CARGA-1000-SIMULTANEOS.md: em 1000 conexões de presença
# simultâneas o app/Nginx nunca foram o gargalo com 3 réplicas — só suba
# este número se um `docker stats` real mostrar CPU do `app` saturada, não
# por precaução.
# ============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$APP_DIR"

WITH_SUPABASE=0
LABD_CLOUD=0
REPLICAS="${GAMEHUB_APP_REPLICAS:-3}"
while [ $# -gt 0 ]; do
  case "$1" in
    --with-supabase) WITH_SUPABASE=1; shift ;;
    --labd-cloud) LABD_CLOUD=1; shift ;;
    --replicas)
      REPLICAS="${2:?--replicas exige um número, ex.: --replicas 5}"
      shift 2
      ;;
    *) echo "[ERRO] argumento desconhecido: $1" >&2; exit 1 ;;
  esac
done
export GAMEHUB_APP_REPLICAS="$REPLICAS"

log() { echo; echo "==> $1"; }

# ---------------------------------------------------------------------------
# 1. Docker + compose plugin (mesmo instalador oficial de deploy/vps-setup.sh)
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Instalando Docker..."
  curl -fsSL https://get.docker.com | sudo -E sh
  if [ "$(id -u)" -eq 0 ]; then
    # GH-ESC-05: como root o grupo `docker` é irrelevante (root já pode
    # falar com o daemon), então não há motivo pra sair — segue direto.
    log "Docker instalado (rodando como root, sem precisar de re-exec)."
  else
    sudo usermod -aG docker "$USER"
    # GH-ESC-05 (achado de auditoria, 2026-08-01): o antigo `exit 0` aqui
    # fazia o cloud-init (que só executa `runcmd` uma vez) terminar com
    # Docker instalado e NENHUM container no ar — "1-click" virava "1-click
    # + 1 SSH manual". `sg docker` ativa o novo grupo só para este processo,
    # sem precisar de logout/login, e o script continua na mesma execução.
    log "Docker instalado agora — reexecutando com o grupo docker ativo (sg docker)..."
    exec sg docker -c "$(printf '%q ' "$0" "$@")"
  fi
else
  log "Docker já instalado: $(docker --version)"
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] 'docker compose' (plugin v2) não encontrado." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. .env do app — gera com o mínimo seguro (GAMEHUB_DB=file) na 1ª vez;
#    NUNCA regenera GAMEHUB_SECRET depois (derrubaria toda sessão válida).
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
  log "Gerando .env (primeira vez)..."
  GAMEHUB_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
GAMEHUB_DB=file
GAMEHUB_SECRET=$GAMEHUB_SECRET
NODE_ENV=production
EOF
  chmod 600 .env
  echo "    .env criado com GAMEHUB_SECRET gerado automaticamente."
else
  log ".env já existe — preservando."
fi

# ---------------------------------------------------------------------------
# 3. Supabase self-hosted (opcional) — sobe e aplica migrations, depois
#    alinha o .env do APP com as chaves que acabou de gerar (mesma lógica
#    de deploy/vps-setup.sh passo 4, adaptada pra apontar pro nome de
#    serviço Docker em vez de 127.0.0.1, já que o app roda em container).
# ---------------------------------------------------------------------------
COMPOSE_FILES=(-f docker-compose.yml)

if [ "$WITH_SUPABASE" = "1" ]; then
  # `KONG_HTTP_PORT` (shell env vence sobre deploy/supabase/.env na
  # resolução do Compose): garante 8010 mesmo em VPS onde o arquivo já foi
  # gerado com o default antigo (8000) antes deste script passar a evitá-lo
  # — sem isso, um `setup.sh --with-supabase` de novo nesta VPS falha com
  # "port is already allocated" porque 127.0.0.1:8000 já é o Kong do
  # Company HQ (achado ao vivo 2026-08-02, ver deploy/supabase-up.sh).
  export KONG_HTTP_PORT="${KONG_HTTP_PORT:-8010}"

  # ---------------------------------------------------------------------
  # URL PÚBLICA do Kong (achado B1, auditoria BMAD/NFR 2026-08-01): a
  # presença ao vivo abre um WebSocket DIRETO do navegador pro Kong — o
  # navegador não enxerga `http://kong:8000` (hostname interno do Docker).
  # Prioridade: GAMEHUB_PUBLIC_URL explícito no ambiente > domínio
  # labd-cloud (assume Traefik) > IP público autodetectado.
  # ---------------------------------------------------------------------
  if [ -z "${GAMEHUB_PUBLIC_URL:-}" ]; then
    if [ "$LABD_CLOUD" = "1" ]; then
      export GAMEHUB_PUBLIC_URL="https://api.gamehub.labd.cloud"
      log "URL pública do Kong (labd-cloud/Traefik): $GAMEHUB_PUBLIC_URL"
    else
      log "Detectando IP público (pra presença ao vivo alcançar o Kong)..."
      # `-4` força IPv4: sem isso, em host com IPv6 configurado, `ifconfig.me`
      # pode responder o IPv6 — e um IPv6 cru numa URL (sem colchetes) é
      # inválido (`http://2a02:...::1:8010` é ambíguo, não parseia). Achado
      # ao vivo nesta VPS (Hostinger tem IPv6 por padrão). Mantém o colchete
      # como defesa a mais, caso `-4` falhe silenciosamente em algum provider.
      HOST_PUBLICO="$(curl -4 -fsS --max-time 3 https://ifconfig.me 2>/dev/null || true)"
      if [ -n "$HOST_PUBLICO" ]; then
        case "$HOST_PUBLICO" in
          *:*) HOST_PUBLICO="[${HOST_PUBLICO}]" ;; # IPv6 — precisa de colchetes numa URL
        esac
        export GAMEHUB_PUBLIC_URL="http://${HOST_PUBLICO}:${KONG_HTTP_PORT:-8000}"
        echo "    Detectado: $GAMEHUB_PUBLIC_URL"
      else
        echo "[aviso] Não consegui detectar IP público — presença ao vivo pode não" >&2
        echo "        alcançar o Kong de fora. Defina GAMEHUB_PUBLIC_URL manualmente" >&2
        echo "        e rode de novo, ex.: GAMEHUB_PUBLIC_URL=http://1.2.3.4:8000 $0 $*" >&2
      fi
    fi
  fi

  log "Subindo Supabase self-hosted (deploy/supabase-up.sh)..."
  if [ "$LABD_CLOUD" = "1" ]; then
    ./deploy/supabase-up.sh --labd-cloud
  else
    ./deploy/supabase-up.sh
  fi

  SUPA_ENV="deploy/supabase/.env"
  ANON_KEY="$(grep '^ANON_KEY=' "$SUPA_ENV" | cut -d= -f2-)"
  SERVICE_ROLE_KEY="$(grep '^SERVICE_ROLE_KEY=' "$SUPA_ENV" | cut -d= -f2-)"
  URL_PUBLICA_KONG="$(grep '^SUPABASE_PUBLIC_URL=' "$SUPA_ENV" | cut -d= -f2-)"

  log "Alinhando .env do app com o Supabase que acabou de subir..."
  for chave in GAMEHUB_DB NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GAMEHUB_REALTIME_PUBLIC_URL; do
    sed -i.bak "/^${chave}=/d" .env
  done
  rm -f .env.bak
  cat >> .env <<EOF
GAMEHUB_DB=supabase
NEXT_PUBLIC_SUPABASE_URL=http://kong:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
GAMEHUB_REALTIME_PUBLIC_URL=${URL_PUBLICA_KONG:-}
EOF
  chmod 600 .env
  echo "    .env alinhado. NEXT_PUBLIC_SUPABASE_URL=http://kong:8000 continua"
  echo "    interno (é o que o SERVIDOR usa — nunca muda). NOVO:"
  echo "    GAMEHUB_REALTIME_PUBLIC_URL=${URL_PUBLICA_KONG:-<vazio — presença ao vivo vai ficar em no-op>}"
  echo "    é a URL que o NAVEGADOR do jogador usa pra presença ao vivo."

  COMPOSE_FILES+=(-f docker-compose.supabase.yml)
fi

if [ "$LABD_CLOUD" = "1" ]; then
  COMPOSE_FILES+=(-f docker-compose.labd-cloud.yml)
fi

# ---------------------------------------------------------------------------
# 4. Sobe app + nginx, espera saúde real (não sleep chutado)
#
# `--build` (Épico 13): sem isto, rodar este script de novo depois de um
# `git pull` NÃO pegava o código novo — só garantia que o container da
# imagem antiga continuava de pé. Com `--build`, toda re-execução (inclusive
# via CI, `.github/workflows/deploy.yml`) reconstrói a imagem (cache do
# Docker reaproveita camadas que não mudaram) antes de recriar os
# containers — é o que faz este script servir tanto de PRIMEIRO deploy
# quanto de ATUALIZAÇÃO contínua, sem precisar de um segundo script.
# `GAMEHUB_APP_REPLICAS` (default 3, `--replicas N` acima) controla quantas
# réplicas do app sobem.
# ---------------------------------------------------------------------------
log "Buildando e subindo containers (${COMPOSE_FILES[*]}, ${GAMEHUB_APP_REPLICAS} réplica(s) de app)..."
docker compose "${COMPOSE_FILES[@]}" up -d --build --wait --wait-timeout 180

# ---------------------------------------------------------------------------
# 5. Healthcheck real via HTTP (não só "container marcou healthy")
# ---------------------------------------------------------------------------
PORTA="${GAMEHUB_HTTP_PORT:-3006}"
log "Verificando /api/health em http://127.0.0.1:${PORTA}..."
ok=""
for tentativa in $(seq 1 10); do
  if resposta=$(curl -fsS "http://127.0.0.1:${PORTA}/api/health" 2>/dev/null); then
    ok="$resposta"
    break
  fi
  sleep 2
done

if [ -n "$ok" ]; then
  echo "    OK — $ok"
else
  echo "[ERRO] /api/health não respondeu. Veja: docker compose ${COMPOSE_FILES[*]} logs app" >&2
  exit 1
fi

echo
echo "============================================================"
echo " Pronto."
echo "   App:      http://127.0.0.1:${PORTA}"
if [ "$WITH_SUPABASE" = "1" ]; then
  echo "   Supabase: docker compose -f deploy/supabase/docker-compose.yml ps"
fi
if [ "$LABD_CLOUD" = "1" ]; then
  echo "   [aviso] overlay labd-cloud aplicado — confirme que o DNS de"
  echo "           gamehub.labd.cloud aponta pra esta VPS antes de considerar"
  echo "           o HTTPS (Traefik/Let's Encrypt) funcional."
fi
echo "   Logs:     docker compose ${COMPOSE_FILES[*]} logs -f"
echo "============================================================"

# ---------------------------------------------------------------------------
# 6. Estado do deploy — grava quais overlays foram usados e a imagem +
#    commit de agora, pra deploy/docker/update.sh e deploy/docker/rollback.sh
#    saberem reproduzir o mesmo comando sem o operador ter que lembrar.
# ---------------------------------------------------------------------------
mkdir -p deploy/docker/.state
printf '%s\n' "${COMPOSE_FILES[*]}" > deploy/docker/.state/compose-files
if COMMIT="$(git rev-parse --short HEAD 2>/dev/null)"; then
  echo "$COMMIT" > deploy/docker/.state/last-deployed-commit
  docker tag labdatadev-gamehub:latest "labdatadev-gamehub:$COMMIT" 2>/dev/null || true
fi
