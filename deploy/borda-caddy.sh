#!/usr/bin/env bash
# Adiciona o independent-lab à borda HTTPS que já existe na VPS (Caddy do
# container "vitrine-edge-1", dono da porta 443), SEM recriar o container e
# SEM tocar nos arquivos da Vitrine.
#
#   ./deploy/borda-caddy.sh               # mostra o que faria e pede confirmação
#   ./deploy/borda-caddy.sh --remover     # tira o site e restaura o Caddyfile original
#
# Por que não é um compose.override: o instalador da Vitrine chama
# `docker compose -f /opt/vitrine/compose.yml` com -f explícito, então um
# override seria ignorado, e ele recria os próprios arquivos a cada versão.
#
# Como funciona: copia o Caddyfile atual do container, acrescenta um bloco
# marcado, valida com `caddy validate` e recarrega com `caddy reload`
# (atômico, sem derrubar conexões; se a config nova for inválida, o Caddy
# continua com a antiga). A alteração vive na camada gravável do container:
# sobrevive a restart e a reboot, mas some se a Vitrine for reinstalada.
# Depois de atualizar a Vitrine, rode este script de novo (é idempotente).
set -euo pipefail

VPS="${VPS:-hostinger}"
DOMINIO="${DOMINIO:-lab.2-25-146-39.sslip.io}"
EDGE="${EDGE:-vitrine-edge-1}"
UPSTREAM="${UPSTREAM:-independent-lab-app:3000}"
GUARDA=/opt/independent-lab/borda
REMOVER=0
[ "${1:-}" = "--remover" ] && REMOVER=1

echo "Borda HTTPS do independent-lab"
echo "  VPS:        $VPS"
echo "  Container:  $EDGE (Caddy da Vitrine, não será recriado)"
echo "  Domínio:    $DOMINIO -> $UPSTREAM"
if [ "$REMOVER" -eq 1 ]; then echo "  Ação:       REMOVER o site e restaurar o Caddyfile original"; else echo "  Ação:       adicionar o site (recarga a quente, sem derrubar a Vitrine)"; fi
echo
read -r -p "Digite CONFIRMAR para continuar: " resposta
[ "$resposta" = "CONFIRMAR" ] || { echo "Cancelado."; exit 1; }

ssh "$VPS" bash -s -- "$EDGE" "$DOMINIO" "$UPSTREAM" "$GUARDA" "$REMOVER" <<'REMOTO'
set -euo pipefail
EDGE="$1"; DOMINIO="$2"; UPSTREAM="$3"; GUARDA="$4"; REMOVER="$5"
CADDYFILE=/etc/caddy/Caddyfile
# Marcadores sem caracteres especiais de sed (sem barra nem parênteses).
INICIO="# BEGIN independent-lab gerenciado por borda-caddy.sh"
FIM="# END independent-lab"

docker inspect "$EDGE" >/dev/null 2>&1 || { echo "Container $EDGE não encontrado." >&2; exit 1; }
mkdir -p "$GUARDA"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

docker cp "$EDGE:$CADDYFILE" "$TMP/atual"
# Cópia datada do que estava no ar antes desta execução (para restaurar à mão).
cp "$TMP/atual" "$GUARDA/Caddyfile.antes-$(date +%Y%m%d-%H%M%S)"

# Parte do original, sempre sem o nosso bloco antigo (idempotente).
sed "/$INICIO/,/$FIM/d" "$TMP/atual" > "$TMP/novo"
if [ "$REMOVER" -ne 1 ]; then
  cat >> "$TMP/novo" <<BLOCO
$INICIO

$DOMINIO {
	encode zstd gzip
	header {
		-Server
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
	}
	reverse_proxy $UPSTREAM {
		# o Caddy grava o IP real da conexão; o app lê a última entrada
		header_up X-Forwarded-For {remote_host}
		health_uri /api/health
		health_interval 30s
	}
}
$FIM
BLOCO
fi

docker cp "$TMP/novo" "$EDGE:/tmp/Caddyfile.novo"
echo "-- validando"
docker exec "$EDGE" caddy validate --config /tmp/Caddyfile.novo --adapter caddyfile
docker exec "$EDGE" cp /tmp/Caddyfile.novo "$CADDYFILE"
echo "-- recarregando a quente"
if docker exec "$EDGE" caddy reload --config "$CADDYFILE" --adapter caddyfile; then
  echo "OK. Teste: curl -I https://$DOMINIO/api/health"
else
  echo "A recarga falhou; restaurando o Caddyfile anterior." >&2
  docker cp "$TMP/atual" "$EDGE:$CADDYFILE"
  exit 1
fi
REMOTO

if [ "$REMOVER" -ne 1 ]; then
  echo "O certificado do domínio novo é emitido pelo Caddy na primeira visita (alguns segundos)."
fi
