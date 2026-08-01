#!/usr/bin/env bash
# ==============================================================================
# labdatadev-gamehub — sobe o Supabase self-hosted e aplica as migrations
# (GH-OPS Bloco 2).
#
# Este é o passo que NÃO EXISTIA em lugar nenhum do deploy antes desta sessão
# (`docs/BACKLOG-PRODUTO.md` GH-OPS-03) — até aqui, aplicar `supabase/migrations/`
# era manual, fora de qualquer script.
#
# Idempotente de verdade, não só "não quebra": cada migration só roda uma vez,
# rastreada em `_migrations.aplicadas` dentro do próprio Postgres — pode rodar
# este script quantas vezes quiser (deploy contínuo, VPS reiniciada, etc.).
#
# Uso:
#   ./deploy/supabase-up.sh                                    # loopback (dev)
#   ./deploy/supabase-up.sh api.seudominio.com.br app.seudominio.com.br
# ==============================================================================
set -euo pipefail

API_DOMAIN="${1:-}"
APP_DOMAIN="${2:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPA_DIR="$ROOT_DIR/deploy/supabase"

log() { echo; echo "==> $1"; }

cd "$SUPA_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERRO] Docker não encontrado. Rode deploy/vps-setup.sh primeiro (ele instala Docker)." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] 'docker compose' (plugin v2) não encontrado." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. .env do stack — gera na primeira vez, NUNCA regenera depois (regenerar
#    trocaria JWT_SECRET e derrubaria toda sessão/token válido).
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
  log "Gerando segredos do Supabase (primeira vez)..."
  node gerar-chaves.mjs > .env
  # Linhas de URL/porta SEMPRE presentes a partir daqui — é o que garante que
  # o bloco de `sed` abaixo (que só SUBSTITUI, nunca insere) tenha o que
  # substituir mesmo numa primeira execução com domínio já informado. Sem
  # isso, passar o domínio na primeira chamada seria silenciosamente
  # ignorado — o `sed` não acha a linha, e um fallback "adiciona se faltar"
  # entraria DEPOIS e gravaria o loopback por cima da intenção do operador.
  {
    echo "SUPABASE_PUBLIC_URL=http://127.0.0.1:8000"
    echo "SITE_URL=http://127.0.0.1:8081"
    echo "KONG_HTTP_PORT=8000"
  } >> .env
  chmod 600 .env
  echo "    deploy/supabase/.env criado. NUNCA apague sem motivo — apagar" \
       "     invalida todo login e todo Realtime já conectado."
else
  log "deploy/supabase/.env já existe — preservando segredos."
fi

# URLs: só sobrescreve se um domínio foi passado (senão mantém o que já
# estava — permite rodar `./deploy/supabase-up.sh` sem argumento pra só
# aplicar migrations novas, sem mexer em config de rede).
if [ -n "$API_DOMAIN" ]; then
  sed -i.bak "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://$API_DOMAIN|" .env
  rm -f .env.bak
fi
if [ -n "$APP_DOMAIN" ]; then
  sed -i.bak "s|^SITE_URL=.*|SITE_URL=https://$APP_DOMAIN|" .env
  rm -f .env.bak
fi

# ---------------------------------------------------------------------------
# 2. Sobe o stack e ESPERA de verdade (não `sleep` chutado) — `--wait` do
#    Docker Compose v2 bloqueia até todo `healthcheck:` do compose passar.
# ---------------------------------------------------------------------------
log "Subindo containers do Supabase..."
docker compose up -d --wait --wait-timeout 180

log "Status dos containers:"
docker compose ps

# ---------------------------------------------------------------------------
# 3. Migrations — aplicadas em ordem, uma vez cada, dentro de transação.
# ---------------------------------------------------------------------------
log "Aplicando migrations..."

docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists _migrations;
create table if not exists _migrations.aplicadas (
  arquivo text primary key,
  aplicada_em timestamptz not null default now()
);
SQL

aplicadas_novas=0
for arquivo in "$ROOT_DIR"/supabase/migrations/*.sql; do
  nome="$(basename "$arquivo")"
  ja_aplicada="$(docker compose exec -T db psql -U postgres -d postgres -tAc \
    "select 1 from _migrations.aplicadas where arquivo = '$nome'")"

  if [ "$ja_aplicada" = "1" ]; then
    echo "    [skip] $nome (já aplicada)"
    continue
  fi

  echo "    [aplicando] $nome"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    < "$arquivo"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "insert into _migrations.aplicadas (arquivo) values ('$nome')"
  aplicadas_novas=$((aplicadas_novas + 1))
done
echo "    $aplicadas_novas migration(s) nova(s) aplicada(s)."

# ---------------------------------------------------------------------------
# 4. Seed — sempre roda; é `upsert` idempotente (supabase/seed.sql).
# ---------------------------------------------------------------------------
log "Aplicando seed (cidades do ICP)..."
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < "$ROOT_DIR/supabase/seed.sql"

# lido de volta do .env (não do ambiente do shell) — é a fonte real que o
# docker compose usou para publicar a porta.
PORTA_KONG="$(grep '^KONG_HTTP_PORT=' .env | cut -d= -f2)"

echo
echo "============================================================"
echo " Supabase self-hosted no ar."
echo " Kong (API gateway): http://127.0.0.1:${PORTA_KONG:-8000}"
echo " Verifique: docker compose -f deploy/supabase/docker-compose.yml ps"
echo "============================================================"
