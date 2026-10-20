#!/usr/bin/env bash
# Guardião da IA do independent-lab. Roda NA VPS, de hora em hora (systemd timer
# ou cron: ver deploy/README.md), e garante que a IA nunca fique parada sem
# alguém saber.
#
# O que confere:
#   1. o container do app e o do worker estão de pé (senão, sobe)
#   2. o app está saudável (senão, reinicia)
#   3. o worker bateu o coração (data/ia/worker.json) nos últimos 5 minutos
#      (senão, reinicia)
#   4. o worker não está pausado por algo que só uma pessoa resolve:
#      credencial recusada, modo sem credencial, gasto do dia estourado
#   5. a fila não está esquecida: pedido esperando há horas com worker vivo
#
# O que NÃO faz: nada fora dos dois containers deste projeto, nada de rede nem
# de firewall, nada de apagar dado. Reinicia no máximo uma vez a cada 30
# minutos por container (não vira laço de reinícios).
#
# Saída: 0 tudo certo · 1 reiniciou algo · 2 precisa de uma pessoa
# (o systemd marca a execução como falha, e `systemctl --failed` mostra).
#
# Variáveis (para teste e para outras instalações):
#   IA_DIR, DOCKER_BIN, ESTADO_DIR, APP, WORKER, MAX_IDADE_S, FILA_PARADA_S
set -uo pipefail

IA_DIR="${IA_DIR:-/opt/independent-lab/data/ia}"
DOCKER="${DOCKER_BIN:-docker}"
ESTADO_DIR="${ESTADO_DIR:-/var/lib/independent-lab-guardiao}"
APP="${APP:-independent-lab-app}"
WORKER="${WORKER:-independent-lab-ia-worker}"
MAX_IDADE_S="${MAX_IDADE_S:-300}"
FILA_PARADA_S="${FILA_PARADA_S:-10800}"
INTERVALO_REINICIO_S=1800

AGORA="$(date +%s)"
CODIGO=0
mkdir -p "$ESTADO_DIR" 2>/dev/null || true

log() {
  printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"
  logger -t independent-lab-ia "$*" 2>/dev/null || true
}

marcar() { [ "$CODIGO" -lt "$1" ] && CODIGO="$1"; return 0; }

# Reinicia no máximo uma vez por INTERVALO_REINICIO_S.
reiniciar() {
  local nome="$1" motivo="$2" marca ultimo
  marca="$ESTADO_DIR/reinicio-$nome"
  ultimo="$(cat "$marca" 2>/dev/null || echo 0)"
  if [ $((AGORA - ultimo)) -lt "$INTERVALO_REINICIO_S" ]; then
    log "ATENÇÃO: $nome com problema ($motivo), mas já foi reiniciado há menos de 30 min. Precisa de uma pessoa."
    marcar 2
    return
  fi
  log "reiniciando $nome ($motivo)"
  if "$DOCKER" restart "$nome" >/dev/null 2>&1; then
    echo "$AGORA" > "$marca"
    marcar 1
  else
    log "ERRO: não consegui reiniciar $nome."
    marcar 2
  fi
}

estado_do_container() { "$DOCKER" inspect -f '{{.State.Running}}' "$1" 2>/dev/null || echo "inexistente"; }
saude_do_container() { "$DOCKER" inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}sem-checagem{{end}}' "$1" 2>/dev/null || echo "?"; }

# ---- 1 e 2: containers de pé e saudáveis
for c in "$APP" "$WORKER"; do
  rodando="$(estado_do_container "$c")"
  if [ "$rodando" = "inexistente" ]; then
    log "ERRO: o container $c não existe. Rode deploy/publicar.sh."
    marcar 2
  elif [ "$rodando" != "true" ]; then
    log "$c parado; subindo"
    if "$DOCKER" start "$c" >/dev/null 2>&1; then marcar 1; else log "ERRO: não consegui subir $c."; marcar 2; fi
  elif [ "$(saude_do_container "$c")" = "unhealthy" ]; then
    reiniciar "$c" "container com saúde 'unhealthy'"
  fi
done

# ---- 3: batimento do worker
valor_json() { grep -o "\"$2\": *\"[^\"]*\"" "$1" 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)"/\1/'; }

BATIMENTO_ARQ="$IA_DIR/worker.json"
if [ ! -f "$BATIMENTO_ARQ" ]; then
  reiniciar "$WORKER" "sem arquivo de batimento (worker.json)"
else
  bat="$(valor_json "$BATIMENTO_ARQ" batimentoEm)"
  bat_s="$(date -d "$bat" +%s 2>/dev/null || echo 0)"
  idade=$((AGORA - bat_s))
  if [ "$bat_s" -eq 0 ] || [ "$idade" -gt "$MAX_IDADE_S" ]; then
    reiniciar "$WORKER" "sem batimento há ${idade}s"
  else
    # ---- 4: pausas que dependem de uma pessoa
    motivo="$(valor_json "$BATIMENTO_ARQ" motivoPausa)"
    case "$motivo" in
      auth)               log "ATENÇÃO: o worker está pausado: a Anthropic recusou a credencial. Confira ANTHROPIC_API_KEY em /opt/independent-lab/.env.ia."; marcar 2 ;;
      config)             log "ATENÇÃO: o worker está pausado por configuração (credencial ausente)."; marcar 2 ;;
      modo-indisponivel)  log "ATENÇÃO: o modo escolhido em /admin/ia não tem credencial neste worker."; marcar 2 ;;
      gasto|gasto-diario) log "ATENÇÃO: o worker parou por gasto (limite do dia ou saldo do Console). Volta sozinho à meia-noite UTC se for o limite do dia."; marcar 2 ;;
      limite)             log "aviso: o worker aguarda o limite de uso da Anthropic passar." ;;
    esac
  fi
fi

# ---- 5: fila esquecida
if [ -d "$IA_DIR/pendente" ]; then
  total=0
  mais_velho=0
  for f in "$IA_DIR"/pendente/*.json; do
    [ -e "$f" ] || continue
    total=$((total + 1))
    m="$(date -r "$f" +%s 2>/dev/null || echo "$AGORA")"
    [ "$mais_velho" -eq 0 ] || [ "$m" -lt "$mais_velho" ] && mais_velho="$m"
  done
  if [ "$total" -gt 0 ] && [ "$mais_velho" -gt 0 ] && [ $((AGORA - mais_velho)) -gt "$FILA_PARADA_S" ]; then
    log "ATENÇÃO: $total pedido(s) na fila, o mais antigo há $(((AGORA - mais_velho) / 60)) min, e o worker não os processa."
    marcar 2
  fi
fi

[ "$CODIGO" -eq 0 ] && log "ok: app e worker de pé, batimento recente, fila em dia."
exit "$CODIGO"
