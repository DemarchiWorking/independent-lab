#!/usr/bin/env bash
# ============================================================
# labdatadev-gamehub — iniciar em modo desenvolvimento (Linux/Mac)
# Uso:  chmod +x iniciar.sh && ./iniciar.sh
# Instala dependências se preciso e sobe o app em :8081.
# ============================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "[ERRO] Node.js não encontrado no PATH."
  echo "Instale o Node 20+ (nvm install 20, ou https://nodejs.org) e rode de novo."
  echo
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo
  echo "Primeira vez por aqui — instalando dependências (npm install)..."
  echo
  npm install
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp ".env.example" ".env"
  echo "Criado .env a partir de .env.example (modo GAMEHUB_DB=file, sem infra)."
fi

echo
echo "Subindo o gamehub em modo desenvolvimento..."
echo "Abra http://localhost:8081 no navegador."
echo "Para parar: Ctrl+C."
echo

# tenta abrir o navegador (silencioso se não houver ambiente gráfico, ex.: VPS)
( sleep 3
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:8081" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "http://localhost:8081" >/dev/null 2>&1 || true
  fi
) &

npm run dev
