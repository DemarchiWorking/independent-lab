#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — subir o stack REAL (Docker: app + nginx + Supabase
# self-hosted), com paridade total com produção. Substitui `iniciar.sh`
# (que sobe só `npm run dev` em modo `GAMEHUB_DB=file`, sem Postgres — bom
# pra mexer no código, mas não é o que roda de verdade).
#
# Uso: ./start.sh          (Linux, Mac, dentro do WSL no Windows)
# Windows sem WSL: dê 2 cliques em start.bat — ele abre o WSL sozinho.
# ============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v docker >/dev/null 2>&1; then
  echo
  echo "Docker não encontrado — deploy/docker/setup.sh instala sozinho em"
  echo "distros baseadas em apt (Ubuntu/Debian). Em outra distro, instale"
  echo "Docker manualmente primeiro: https://docs.docker.com/engine/install/"
  echo
fi

echo
echo "Subindo labdatadev-gamehub (app + nginx + Supabase self-hosted)..."
echo "Isso pode demorar alguns minutos na primeira vez (build da imagem +"
echo "download das imagens do Supabase)."
echo

./deploy/docker/setup.sh --with-supabase

echo
echo "Pronto — abra http://localhost:3006 no navegador."
echo "Pra atualizar depois de mudar código: ./deploy/docker/update.sh"
echo "Pra voltar pra versão anterior se algo quebrar: ./deploy/docker/rollback.sh"
