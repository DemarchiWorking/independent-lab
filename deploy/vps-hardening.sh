#!/usr/bin/env bash
# Endurece o acesso à VPS (Ubuntu 24.04): SSH só por chave, fail2ban no SSH e
# atualizações automáticas de segurança. Roda NA VPS, como root.
#
#   scp deploy/vps-hardening.sh hostinger:/root/ && ssh hostinger
#   bash /root/vps-hardening.sh              # só MOSTRA o estado e o que mudaria
#   bash /root/vps-hardening.sh --aplicar    # aplica
#
# Afeta TODOS os projetos da VPS (é configuração do servidor), por isso é um
# script para você executar e revisar, e não algo que um agente rode sozinho.
#
# O que NÃO faz, de propósito:
#   - não ativa ufw: o Docker publica portas por fora dele e uma política
#     padrão de bloqueio quebraria os ~40 containers dos outros projetos;
#   - não mexe em Docker, Nginx, Caddy nem em portas;
#   - não reinicia a máquina (derrubaria todos os containers de uma vez).
#
# Antes de aplicar: mantenha ESTA sessão SSH aberta e, depois, abra uma
# SEGUNDA sessão com a chave para confirmar que o acesso continua. Só então
# feche a primeira. Se algo der errado, o backup do SSH está em /root/hardening-backup-*.
set -euo pipefail

APLICAR=0
[ "${1:-}" = "--aplicar" ] && APLICAR=1

[ "$(id -u)" -eq 0 ] || { echo "Rode como root." >&2; exit 1; }

DROPIN=/etc/ssh/sshd_config.d/10-hardening.conf
JAIL=/etc/fail2ban/jail.d/10-sshd.local
AUTO=/etc/apt/apt.conf.d/52-seguranca-automatica
BACKUP="/root/hardening-backup-$(date +%Y%m%d-%H%M%S)"

ok()   { printf '  \033[32mok\033[0m   %s\n' "$*"; }
aviso(){ printf '  \033[33maviso\033[0m %s\n' "$*"; }
fazer(){ if [ "$APLICAR" -eq 1 ]; then "$@"; else printf '  [simulação] %s\n' "$*"; fi; }

echo "== Estado atual"
efetivo() { sshd -T 2>/dev/null | grep -E "^$1 " | awk '{print $2}'; }
echo "  PermitRootLogin:        $(efetivo permitrootlogin)"
echo "  PasswordAuthentication: $(efetivo passwordauthentication)"
echo "  MaxAuthTries:           $(efetivo maxauthtries)"
echo "  fail2ban:               $(dpkg -s fail2ban >/dev/null 2>&1 && systemctl is-active fail2ban 2>/dev/null || echo ausente)"
echo "  unattended-upgrades:    $(dpkg -s unattended-upgrades >/dev/null 2>&1 && echo instalado || echo ausente)"
echo "  Reinício pendente:      $([ -f /var/run/reboot-required ] && echo sim || echo não)"
echo "  Tentativas de senha nas últimas 24h: $(journalctl -u ssh --since '24 hours ago' 2>/dev/null | grep -c 'Failed password' || true)"

echo
echo "== Travas contra se trancar para fora"
CHAVES=0
if [ -s /root/.ssh/authorized_keys ]; then CHAVES=$(grep -cE '^(ssh-|ecdsa-|sk-)' /root/.ssh/authorized_keys || true); fi
if [ "$CHAVES" -lt 1 ]; then
  echo "ERRO: /root/.ssh/authorized_keys não tem nenhuma chave. Desligar a senha agora trancaria você fora." >&2
  exit 1
fi
ok "root tem $CHAVES chave(s) autorizada(s)"
IP_ATUAL="${SSH_CONNECTION%% *}"
[ -n "${IP_ATUAL:-}" ] && ok "seu IP atual ($IP_ATUAL) entra na lista de isentos do fail2ban"

echo
echo "== Plano"
[ "$APLICAR" -eq 1 ] && echo "  (modo --aplicar)" || echo "  (simulação; nada será alterado)"

# 1) SSH
echo "-- SSH: só chave, root sem senha, 3 tentativas"
fazer mkdir -p "$BACKUP"
fazer cp -a /etc/ssh/sshd_config.d "$BACKUP/sshd_config.d"
fazer cp -a /etc/ssh/sshd_config "$BACKUP/sshd_config"
CONTEUDO_SSH='# Gerenciado por deploy/vps-hardening.sh. Arquivo "10-" vem antes dos outros: no sshd o primeiro valor vence.
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
'
if [ "$APLICAR" -eq 1 ]; then
  printf '%s' "$CONTEUDO_SSH" > "$DROPIN"
  chmod 644 "$DROPIN"
  if sshd -t; then
    systemctl reload ssh
    ok "SSH recarregado"
  else
    rm -f "$DROPIN"
    echo "ERRO: sshd -t recusou a configuração; arquivo removido, nada mudou." >&2
    exit 1
  fi
else
  printf '%s' "$CONTEUDO_SSH" | sed 's/^/    | /'
fi

# 2) fail2ban
echo "-- fail2ban no SSH (5 falhas em 10 min = banido por 1 h)"
if [ "$APLICAR" -eq 1 ]; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban >/dev/null
  mkdir -p "$(dirname "$JAIL")"
  cat > "$JAIL" <<JAILCONF
[sshd]
enabled  = true
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
ignoreip = 127.0.0.1/8 ::1 ${IP_ATUAL:-}
JAILCONF
  systemctl enable --now fail2ban >/dev/null
  systemctl restart fail2ban
  ok "fail2ban ativo: $(fail2ban-client status sshd 2>/dev/null | grep -E 'Currently banned' | xargs || echo 'jail sshd criado')"
else
  echo "    [simulação] apt-get install fail2ban + jail sshd (isento: 127.0.0.1 e ${IP_ATUAL:-seu IP})"
fi

# 3) atualizações de segurança automáticas, sem reiniciar sozinho
echo "-- atualizações de segurança automáticas (sem reinício automático)"
if [ "$APLICAR" -eq 1 ]; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades >/dev/null
  cat > "$AUTO" <<'AUTOCONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
// Reiniciar derrubaria todos os containers da VPS de uma vez: fica manual.
Unattended-Upgrade::Automatic-Reboot "false";
AUTOCONF
  ok "unattended-upgrades configurado"
else
  echo "    [simulação] apt-get install unattended-upgrades; Automatic-Reboot=false"
fi

echo
echo "== Depois"
if [ "$APLICAR" -eq 1 ]; then
  echo "  PermitRootLogin:        $(efetivo permitrootlogin)"
  echo "  PasswordAuthentication: $(efetivo passwordauthentication)"
  echo
  echo "  AGORA: abra uma SEGUNDA sessão SSH com a sua chave e confirme que entra."
  echo "  Só depois feche esta. Para desfazer: cp -a $BACKUP/sshd_config.d/. /etc/ssh/sshd_config.d/ && rm $DROPIN && systemctl reload ssh"
else
  echo "  Para aplicar: bash $0 --aplicar"
fi
[ -f /var/run/reboot-required ] && aviso "há reinício pendente do sistema (kernel). Faça numa janela combinada: derruba todos os containers."
echo
echo "Lembrete: portas publicadas por containers NÃO passam pelo ufw. Para filtrar,"
echo "use a cadeia DOCKER-USER, combinando com os donos dos outros projetos."
