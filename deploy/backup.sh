#!/usr/bin/env bash
# ==============================================================================
# labdatadev-gamehub — backup e restore do Postgres self-hosted (GH-OPS Bloco 2).
#
# É a mitigação do maior risco do stack self-hosted na véspera do pitch: se o
# Postgres corromper ou o volume sumir, isto é o que traz o jogo de volta.
# **Ensaie o restore ANTES da semana do pitch, não durante.**
#
# Uso:
#   ./deploy/backup.sh                    # dump agora + limpa dumps > 7 dias
#   ./deploy/backup.sh restore ARQUIVO     # restaura um dump (destrutivo!)
#   ./deploy/backup.sh listar              # lista dumps disponíveis
#
# Cron sugerido (diário às 3h, fora do horário de uso):
#   0 3 * * * cd /caminho/do/projeto && ./deploy/backup.sh >> deploy/logs/backup.log 2>&1
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPA_DIR="$ROOT_DIR/deploy/supabase"
BACKUP_DIR="$ROOT_DIR/deploy/backups"
RETENCAO_DIAS="${RETENCAO_DIAS:-7}"

cd "$SUPA_DIR"
mkdir -p "$BACKUP_DIR"

log() { echo; echo "==> $1"; }

fazer_backup() {
  local carimbo arquivo
  carimbo="$(date -u +'%Y%m%d-%H%M%S')"
  arquivo="$BACKUP_DIR/gamehub-$carimbo.dump"

  log "Gerando dump ($carimbo)..."
  # `-Fc` (custom format): comprimido, restaurável seletivamente com
  # `pg_restore`, e o único formato que suporta restore em paralelo — o que
  # importa se o banco crescer entre agora e o pitch.
  docker compose exec -T db pg_dump -U postgres -d postgres -Fc > "$arquivo"

  local tamanho
  tamanho="$(du -h "$arquivo" | cut -f1)"
  echo "    OK: $arquivo ($tamanho)"

  # Cópia fora da máquina — o passo que faz o backup sobreviver à própria VPS
  # cair. Sem alvo fixo (nenhuma credencial de nuvem foi definida para este
  # projeto): se `BACKUP_OFFSITE_CMD` estiver setado, roda esse comando com o
  # caminho do dump como `$1`. Senão, só avisa — ver docs/deploy/03 para
  # exemplos prontos (rclone/scp).
  if [ -n "${BACKUP_OFFSITE_CMD:-}" ]; then
    log "Copiando para fora da máquina..."
    eval "$BACKUP_OFFSITE_CMD" "$arquivo"
  else
    echo "    [aviso] BACKUP_OFFSITE_CMD não definido — dump ficou só nesta VPS."
    echo "            Ver docs/deploy/03-VPS-SUPABASE-DOCKER.md § Backup."
  fi

  log "Limpando dumps com mais de $RETENCAO_DIAS dias..."
  find "$BACKUP_DIR" -name 'gamehub-*.dump' -mtime "+$RETENCAO_DIAS" -print -delete
}

listar_backups() {
  log "Dumps disponíveis em $BACKUP_DIR:"
  ls -lh "$BACKUP_DIR"/gamehub-*.dump 2>/dev/null || echo "    (nenhum ainda)"
}

restaurar_backup() {
  local arquivo="$1"
  if [ ! -f "$arquivo" ]; then
    # aceita nome relativo dentro de deploy/backups/ também
    if [ -f "$BACKUP_DIR/$arquivo" ]; then
      arquivo="$BACKUP_DIR/$arquivo"
    else
      echo "[ERRO] Arquivo não encontrado: $arquivo" >&2
      exit 1
    fi
  fi

  echo
  echo "############################################################"
  echo "# ATENÇÃO — ISTO APAGA TODO O DADO ATUAL DO POSTGRES E"
  echo "# SUBSTITUI PELO CONTEÚDO DE:"
  echo "#   $arquivo"
  echo "############################################################"
  echo
  read -r -p "Digite RESTAURAR (maiúsculas) para confirmar: " confirmacao
  if [ "$confirmacao" != "RESTAURAR" ]; then
    echo "Cancelado — nada foi alterado."
    exit 1
  fi

  log "Restaurando..."
  # --clean --if-exists: derruba os objetos existentes antes de recriar, para
  # o restore não colidir com o schema atual. --create recria o próprio banco.
  docker compose exec -T db pg_restore -U postgres -d postgres \
    --clean --if-exists --no-owner --no-privileges < "$arquivo"

  echo
  echo "OK — restaurado. Confira com: curl -fsS http://127.0.0.1:8081/api/health"
}

case "${1:-backup}" in
  backup)  fazer_backup ;;
  listar)  listar_backups ;;
  restore) [ $# -ge 2 ] || { echo "Uso: $0 restore ARQUIVO" >&2; exit 1; }; restaurar_backup "$2" ;;
  *) echo "Uso: $0 [backup|listar|restore ARQUIVO]" >&2; exit 1 ;;
esac
