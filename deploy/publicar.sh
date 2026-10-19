#!/usr/bin/env bash
# Publica o independent-lab na VPS compartilhada (container, sem tocar nos
# outros projetos). Roda NA SUA MÁQUINA, via ssh.
#
#   ./deploy/publicar.sh                         # publica o commit atual
#   VPS=hostinger SITE_URL=https://lab.2-25-146-39.sslip.io ./deploy/publicar.sh
#   ADMIN_EMAILS=voce@exemplo.com ./deploy/publicar.sh   # só na 1ª vez
#
# O que faz:
#   1. confere árvore limpa, typecheck e testes locais
#   2. envia o código do commit (git archive) e constrói a imagem NA VPS,
#      com `nice`, para não competir com os outros containers
#   3. tira snapshot de /opt/independent-lab/data antes de trocar a versão
#   4. sobe o container e espera /api/health responder com o sha NOVO
#   5. se não responder, volta sozinho para a imagem anterior
#
# Não mexe em Nginx, firewall, Docker dos outros projetos nem no Caddy.
# A borda HTTPS é um passo separado: deploy/borda-caddy.sh.
set -euo pipefail

VPS="${VPS:-hostinger}"
SITE_URL="${SITE_URL:-https://lab.2-25-146-39.sslip.io}"
ADMIN_EMAILS="${ADMIN_EMAILS:-}"
DIR=/opt/independent-lab

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Há mudanças não commitadas. Faça commit antes: a imagem é construída do commit." >&2
  exit 1
fi
SHA="$(git rev-parse --short=8 HEAD)"

echo "Publicação do independent-lab"
echo "  VPS:      $VPS"
echo "  Commit:   $SHA ($(git log -1 --format=%s))"
echo "  Endereço: $SITE_URL"
echo "  Pasta:    $DIR (dados em $DIR/data, backups em $DIR/backups)"
echo
read -r -p "Digite PUBLICAR para continuar: " resposta
[ "$resposta" = "PUBLICAR" ] || { echo "Cancelado."; exit 1; }

echo "==> Verificações locais"
npm run typecheck --silent
npm test --silent

echo "==> Enviando o código"
ssh "$VPS" "mkdir -p $DIR/src/$SHA"
git archive --format=tar HEAD | ssh "$VPS" "tar -x -C $DIR/src/$SHA"

echo "==> Construindo e subindo na VPS"
ssh "$VPS" bash -s -- "$SHA" "$SITE_URL" "$ADMIN_EMAILS" <<'REMOTO'
set -euo pipefail
SHA="$1"; SITE_URL="$2"; ADMIN_EMAILS="$3"
DIR=/opt/independent-lab
PROJETO=independent-lab

umask 077
mkdir -p "$DIR/data" "$DIR/backups"
chmod 700 "$DIR"
# O container roda como uid 10001: só ele grava nos dados.
chown 10001:10001 "$DIR/data"

# .env na primeira vez, com segredo gerado aqui (nunca sai desta máquina).
if [ ! -f "$DIR/.env" ]; then
  printf 'GAMEHUB_DB=file\nGAMEHUB_SECRET=%s\nGAMEHUB_ADMIN_EMAILS=%s\nNEXT_PUBLIC_SITE_URL=%s\n' \
    "$(openssl rand -hex 32)" "$ADMIN_EMAILS" "$SITE_URL" > "$DIR/.env"
  chmod 600 "$DIR/.env"
  echo "Criado $DIR/.env com um GAMEHUB_SECRET novo."
fi

ANTERIOR="$(docker inspect -f '{{.Config.Image}}' independent-lab-app 2>/dev/null || true)"

echo "-- build da imagem independent-lab:$SHA (pode levar alguns minutos)"
nice -n 10 ionice -c 3 docker build \
  --build-arg GIT_SHA="$SHA" \
  --build-arg NEXT_PUBLIC_SITE_URL="$SITE_URL" \
  -t "independent-lab:$SHA" "$DIR/src/$SHA"

if [ -n "$(ls -A "$DIR/data" 2>/dev/null)" ]; then
  tar -czf "$DIR/backups/antes-do-deploy-$SHA.tar.gz" -C "$DIR/data" .
  echo "-- snapshot dos dados: backups/antes-do-deploy-$SHA.tar.gz"
fi

cp "$DIR/src/$SHA/deploy/compose.yml" "$DIR/compose.yml"
IMAGEM="independent-lab:$SHA" docker compose -p "$PROJETO" -f "$DIR/compose.yml" up -d --remove-orphans

echo "-- aguardando /api/health responder com a versão $SHA"
ok=0
for _ in $(seq 1 40); do
  resposta="$(docker exec independent-lab-app wget -q -O - http://127.0.0.1:3000/api/health 2>/dev/null || true)"
  if echo "$resposta" | grep -q '"ok":true' && echo "$resposta" | grep -q "\"versao\":\"$SHA\""; then ok=1; break; fi
  sleep 3
done

if [ "$ok" -ne 1 ]; then
  echo "FALHOU: o container novo não ficou saudável. Últimas linhas do log:" >&2
  docker logs --tail 30 independent-lab-app >&2 || true
  if [ -n "$ANTERIOR" ] && [ "$ANTERIOR" != "independent-lab:$SHA" ]; then
    echo "Voltando para $ANTERIOR" >&2
    IMAGEM="$ANTERIOR" docker compose -p "$PROJETO" -f "$DIR/compose.yml" up -d --remove-orphans
  else
    echo "Não havia versão anterior; parando o app." >&2
    docker compose -p "$PROJETO" -f "$DIR/compose.yml" stop app
  fi
  exit 1
fi
echo "OK: independent-lab:$SHA saudável."

# Guarda só as 3 últimas imagens e códigos-fonte.
docker images independent-lab --format '{{.Tag}}' | tail -n +4 | while read -r tag; do
  docker rmi "independent-lab:$tag" >/dev/null 2>&1 || true
done
ls -1dt "$DIR"/src/* 2>/dev/null | tail -n +4 | xargs -r rm -rf
REMOTO

echo "==> Conferindo pela internet"
if curl -fsS --max-time 15 "$SITE_URL/api/health" 2>/dev/null | grep -q "\"versao\":\"$SHA\""; then
  echo "OK: $SITE_URL respondendo com a versão $SHA."
else
  echo "O container está saudável, mas $SITE_URL ainda não responde com ela."
  echo "Se a borda HTTPS ainda não foi configurada, rode: ./deploy/borda-caddy.sh"
fi
