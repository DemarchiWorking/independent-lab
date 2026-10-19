#!/usr/bin/env bash
# ============================================================
# independent-lab — iniciar em modo desenvolvimento (Linux/Mac)
# Uso:  chmod +x iniciar.sh && ./iniciar.sh
# Instala dependências se preciso e sobe o app em :8081.
# ============================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "[ERRO] Node.js não encontrado no PATH."
  echo "Instale o Node 22 ou 24 LTS (nvm install 24, ou https://nodejs.org) e rode de novo."
  echo
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo
  echo "Primeira vez por aqui — instalando dependências (npm install)..."
  echo
  npm install
fi

# O .env e o GAMEHUB_SECRET local são criados pelo "predev" do npm
# (scripts/garantir-segredo.mjs), antes de o servidor subir.

echo
echo "Subindo o gamehub em modo desenvolvimento..."
echo "Abra http://localhost:8081 no navegador."
echo "Para parar: Ctrl+C."
echo

# tenta abrir o navegador (silencioso se não houver ambiente gráfico).
# O dev só escuta em 127.0.0.1: não use este script para produção (ver deploy/).
( sleep 3
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:8081" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "http://localhost:8081" >/dev/null 2>&1 || true
  fi
) &

npm run dev
