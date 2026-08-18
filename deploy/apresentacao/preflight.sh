#!/usr/bin/env bash
# labdatadev-gamehub — checagem pré-apresentação
#
# Roda ANTES de sair de casa/do escritório rumo ao Sebrae. Confirma que os
# 4 pontos que costumam quebrar uma demo ao vivo estão saudáveis: containers
# no ar, fila de documentos sem item travado, cron instalado, e o Claude
# Code autenticado (sem isso o motor de documentação não gera nada).
#
# Não conserta nada sozinho — só avisa o que está errado, pra você decidir
# com calma ANTES de estar na frente de um jurado.
#
# Uso: bash /root/labdatadev-gamehub/deploy/apresentacao/preflight.sh

set -uo pipefail
FALHAS=0

verde() { echo -e "\033[32m✓ $1\033[0m"; }
vermelho() { echo -e "\033[31m✗ $1\033[0m"; FALHAS=$((FALHAS + 1)); }

echo "=================================================="
echo "Preflight — labdatadev gamehub — $(date -Is)"
echo "=================================================="

echo
echo "-- Containers --"
for c in labdatadev-gamehub-app-1 labdatadev-gamehub-app-2 labdatadev-gamehub-app-3 labdatadev-gamehub-nginx gamehub-supabase-db gamehub-supabase-kong gamehub-supabase-auth gamehub-supabase-rest; do
  # `{{if .State.Health}}` dentro do próprio template Go evita o erro de
  # "nil pointer" que o Docker CLI solta quando o container não tem
  # HEALTHCHECK definido (ex.: gamehub-supabase-rest) — checar isso do lado
  # de fora (capturando stderr/exit code) é frágil, o Docker já resolve.
  info="$(docker inspect --format='{{.State.Running}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}sem-healthcheck{{end}}' "$c" 2>/dev/null)"
  if [ -z "$info" ]; then
    vermelho "$c: container não encontrado"
    continue
  fi
  running="${info%%|*}"
  health="${info##*|}"
  if [ "$running" != "true" ]; then
    vermelho "$c: não está rodando"
  elif [ "$health" = "unhealthy" ]; then
    vermelho "$c: unhealthy"
  elif [ "$health" = "sem-healthcheck" ]; then
    verde "$c: rodando (sem healthcheck configurado)"
  else
    verde "$c: $health"
  fi
done

echo
echo "-- App respondendo (porta pública 3006) --"
if curl -fsS --max-time 5 http://127.0.0.1:3006/api/health >/dev/null 2>&1; then
  verde "GET /api/health OK"
else
  vermelho "GET /api/health falhou — app não está respondendo"
fi

echo
echo "-- Fila de documentos (GH-DOC-01) --"
travados="$(docker exec gamehub-supabase-db psql -U postgres -d postgres -tAc \
  "select count(*) from fila_geracao_documentos where status in ('erro','processando');" 2>/dev/null | tr -d '[:space:]')"
if [ "$travados" = "0" ]; then
  verde "Nenhum item travado em erro/processando"
else
  vermelho "$travados item(ns) travado(s) em erro/processando na fila — verifique manualmente"
fi

echo
echo "-- Cron instalado --"
if crontab -l 2>/dev/null | grep -q "run-hourly.sh\|run-evento.sh"; then
  verde "Cron do document-engine instalado"
  crontab -l 2>/dev/null | grep "run-hourly.sh\|run-evento.sh" | sed 's/^/  /'
else
  vermelho "Nenhuma linha de cron do document-engine encontrada"
fi

echo
echo "-- Claude Code autenticado (necessário pro motor gerar documentos) --"
if [ -f /root/.claude/.credentials.json ]; then
  verde "Credenciais OAuth presentes"
else
  vermelho "Sem /root/.claude/.credentials.json — o motor não vai conseguir gerar nada"
fi

echo
echo "=================================================="
if [ "$FALHAS" -eq 0 ]; then
  echo -e "\033[32mTudo verde. Pronto pra apresentação.\033[0m"
else
  echo -e "\033[31m$FALHAS checagem(ns) falhou/falharam — resolva antes de sair.\033[0m"
fi
echo "=================================================="

exit "$FALHAS"
