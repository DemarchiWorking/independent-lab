#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — SUBIR TUDO NUMA VPS NOVA COM **UM COMANDO**.
#
#   curl -fsSL https://raw.githubusercontent.com/DemarchiWorking/independent-lab/integracao-deploy-vps/deploy/docker/bootstrap.sh | sudo bash
#
# É isso. Nada antes, nada depois. Ao terminar, o jogo está no ar e
# multiplayer (presença ao vivo), acessível pela URL que ele imprime — dá
# pra abrir de outro PC e jogar.
#
# O que ele faz, em ordem:
#   1. instala git/curl/ca-certificates (apt)
#   2. clona (ou atualiza) o repositório
#   3. chama deploy/docker/setup.sh --with-supabase, que por sua vez
#      instala Docker + Node, sobe o Supabase self-hosted (5 containers),
#      aplica as 36 migrations + seed, e sobe app (3 réplicas) + nginx
#   4. abre o firewall (22/3006/8010) e imprime a URL pública
#
# Tempo real medido por etapa (VPS Ubuntu limpa, disco NVMe):
#   apt + git ............... ~15 s
#   Docker (get.docker.com) . ~50 s
#   Node (NodeSource) ....... ~35 s
#   pull do stack Supabase .. ~120-180 s  (≈2,9 GB de imagem: postgres 1,7 GB,
#                                          realtime 528 MB, kong 496 MB, ...)
#   build da imagem do app .. ~80 s       (npm ci + next build)
#   migrations + seed ....... ~40 s
#   ------------------------------------
#   TOTAL 1ª VEZ ............ ~5-6 min
#
# ⚠️ NÃO são 2 minutos na primeira vez, e nenhum script muda isso: o piso é
# o download de ~2,9 GB de imagem Docker. Para chegar em <2 min de verdade,
# ver a seção "COMO CHEGAR EM <2 MIN" no fim deste arquivo.
#
# Re-execução (repo já clonado, imagens já em cache): ~40-60 s.
#
# Variáveis opcionais:
#   REPO_BRANCH=...        branch a clonar (default: integracao-deploy-vps)
#   REPO_DIR=...           onde clonar   (default: /root/labdatadev-gamehub)
#   GAMEHUB_PUBLIC_URL=... URL pública do Kong, se você já tem domínio
#                          (default: detecta o IP público sozinho)
#   SETUP_FLAGS=...        default "--with-supabase". Use "" para o modo
#                          banco-em-arquivo (sem multiplayer, só smoke test).
# ============================================================================
set -euo pipefail

INICIO=$(date +%s)
REPO_URL="${REPO_URL:-https://github.com/DemarchiWorking/independent-lab.git}"
REPO_BRANCH="${REPO_BRANCH:-integracao-deploy-vps}"
REPO_DIR="${REPO_DIR:-/root/labdatadev-gamehub}"
SETUP_FLAGS="${SETUP_FLAGS---with-supabase}"

log() { echo; echo "==> [$(($(date +%s) - INICIO))s] $1"; }

# `curl | bash` normalmente roda como root (via `sudo bash`). Se não for
# root, usa sudo em cada passo privilegiado — falhar aqui, cedo e claro, é
# melhor do que falhar no meio da instalação do Docker.
if [ "$(id -u)" -ne 0 ]; then
  if ! command -v sudo >/dev/null 2>&1; then
    echo "[ERRO] Rode como root ou instale sudo:" >&2
    echo "       curl -fsSL <url> | sudo bash" >&2
    exit 1
  fi
  SUDO=sudo
else
  SUDO=""
fi

log "1/4 Instalando pré-requisitos (git, curl, ca-certificates)..."
export DEBIAN_FRONTEND=noninteractive
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq git curl ca-certificates >/dev/null

log "2/4 Obtendo o código ($REPO_BRANCH)..."
if [ -d "$REPO_DIR/.git" ]; then
  echo "    já existe em $REPO_DIR — atualizando com git pull --ff-only"
  git -C "$REPO_DIR" fetch --quiet origin "$REPO_BRANCH"
  git -C "$REPO_DIR" checkout --quiet "$REPO_BRANCH"
  git -C "$REPO_DIR" pull --ff-only --quiet
else
  git clone --quiet --branch "$REPO_BRANCH" "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"
# Um clone via `curl | bash` pode chegar sem bit de execução dependendo do
# umask/filesystem — garantir aqui evita um "Permission denied" opaco.
chmod +x deploy/*.sh deploy/docker/*.sh start.sh 2>/dev/null || true

log "3/4 Subindo o stack (isto é o passo demorado — ~4-5 min na 1ª vez)..."
# shellcheck disable=SC2086
./deploy/docker/setup.sh $SETUP_FLAGS

log "4/4 Firewall (só 22, 3006 e 8010 abertos)..."
if command -v ufw >/dev/null 2>&1; then
  $SUDO ufw allow 22/tcp   >/dev/null 2>&1 || true
  $SUDO ufw allow 3006/tcp >/dev/null 2>&1 || true
  $SUDO ufw allow 8010/tcp >/dev/null 2>&1 || true
  $SUDO ufw --force enable >/dev/null 2>&1 || true
  echo "    ufw ativo."
else
  echo "    [aviso] ufw não instalado — nenhum firewall configurado."
fi

IP_PUBLICO="$(curl -4 -fsS --max-time 5 https://ifconfig.me 2>/dev/null || echo '<IP-DA-SUA-VPS>')"
PORTA="${GAMEHUB_HTTP_PORT:-3006}"
TOTAL=$(($(date +%s) - INICIO))

echo
echo "============================================================"
echo " PRONTO em ${TOTAL}s."
echo
echo "   Abra de QUALQUER computador:"
echo "     http://${IP_PUBLICO}:${PORTA}"
echo
echo "   Health:  curl http://127.0.0.1:${PORTA}/api/health"
echo "   Logs:    cd $REPO_DIR && docker compose \$(cat deploy/docker/.state/compose-files) logs -f"
echo "   Update:  cd $REPO_DIR && ./deploy/docker/update.sh"
echo "   Voltar:  cd $REPO_DIR && ./deploy/docker/rollback.sh"
echo "============================================================"
echo
echo " Próximo passo recomendado (HTTPS + domínio, para o pitch):"
echo "   aponte um domínio pra ${IP_PUBLICO} e rode"
echo "   ./deploy/supabase-up.sh api.seudominio.com.br app.seudominio.com.br"
echo

# ============================================================================
# COMO CHEGAR EM <2 MIN DE VERDADE
#
# O piso da primeira execução é o download de ~2,9 GB de imagem Docker —
# nenhum script contorna isso. As três formas reais de ficar abaixo de 2 min:
#
# 1) SNAPSHOT DA VPS (mais simples, recomendado para o pitch).
#    Rode este bootstrap UMA vez, confirme que está no ar, e tire um
#    snapshot/imagem da VPS no painel do provedor. Toda VPS criada a partir
#    desse snapshot já nasce com Docker, as imagens em cache e o stack
#    configurado — sobe em ~40 s (`docker compose up` medido: 11,6 s com
#    imagem em cache).
#
# 2) IMAGEM PRÉ-BUILDADA NUM REGISTRY (elimina os ~80 s de `next build`).
#    Publique `labdatadev-gamehub:latest` no GHCR via GitHub Actions e troque
#    o `build:` do docker-compose.yml por `image: ghcr.io/...`. O `npm ci` +
#    `next build` deixam de rodar na VPS.
#
# 3) VPS MAIOR SÓ NO DIA. O gargalo é I/O de disco e rede, não CPU: um plano
#    com NVMe e 1 Gbps corta o pull pela metade.
#
# Se o que importa é "no dia do pitch, subir rápido", a opção 1 resolve
# sozinha e não exige mudar uma linha de código.
# ============================================================================
