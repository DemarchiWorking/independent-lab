#!/usr/bin/env bash
# Instala (ou remove) o timer horário do guardião da IA na VPS. Roda NA SUA
# MÁQUINA, via ssh. É um passo à parte de propósito: mexe no systemd da VPS
# compartilhada, então só acontece quando você confirma.
#
#   ./deploy/instalar-guardiao.sh             # instala e ativa o timer
#   ./deploy/instalar-guardiao.sh --remover   # desativa e remove
#   VPS=hostinger ./deploy/instalar-guardiao.sh
#
# O que instala (só o que é deste projeto):
#   /etc/systemd/system/independent-lab-ia-guardiao.service
#   /etc/systemd/system/independent-lab-ia-guardiao.timer
# O script do guardião (/opt/independent-lab/ia-guardiao.sh) já é enviado pelo
# deploy/publicar.sh. Nada aqui toca em Docker, firewall, Nginx ou Caddy.
#
# Sem systemd (ou se preferir cron), a linha equivalente é:
#   0 * * * * /opt/independent-lab/ia-guardiao.sh >> /var/log/independent-lab-ia-guardiao.log 2>&1
set -euo pipefail

VPS="${VPS:-hostinger}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ "${1:-}" = "--remover" ]; then
  echo "Vai DESATIVAR e REMOVER o timer do guardião da IA em $VPS."
  read -r -p "Digite CONFIRMAR para continuar: " r
  [ "$r" = "CONFIRMAR" ] || { echo "Cancelado."; exit 1; }
  ssh "$VPS" 'systemctl disable --now independent-lab-ia-guardiao.timer 2>/dev/null || true
    rm -f /etc/systemd/system/independent-lab-ia-guardiao.service /etc/systemd/system/independent-lab-ia-guardiao.timer
    systemctl daemon-reload && echo "Removido."'
  exit 0
fi

echo "Vai instalar o timer horário do guardião da IA em $VPS (systemd)."
echo "Ele confere app, worker, batimento e fila, e reinicia só os containers do independent-lab."
read -r -p "Digite CONFIRMAR para continuar: " r
[ "$r" = "CONFIRMAR" ] || { echo "Cancelado."; exit 1; }

ssh "$VPS" '[ -x /opt/independent-lab/ia-guardiao.sh ]' \
  || { echo "O guardião ainda não está na VPS. Rode antes: ./deploy/publicar.sh" >&2; exit 1; }

scp deploy/systemd/independent-lab-ia-guardiao.service deploy/systemd/independent-lab-ia-guardiao.timer "$VPS":/etc/systemd/system/
ssh "$VPS" 'chmod 644 /etc/systemd/system/independent-lab-ia-guardiao.*
  systemctl daemon-reload
  systemctl enable --now independent-lab-ia-guardiao.timer
  echo
  systemctl list-timers independent-lab-ia-guardiao.timer --no-pager
  echo
  echo "Teste agora (sem esperar a hora cheia):  systemctl start independent-lab-ia-guardiao.service && journalctl -u independent-lab-ia-guardiao.service -n 20 --no-pager"'
echo "Pronto."
