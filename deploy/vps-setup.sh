#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — provisionamento ÚNICO da VPS (Ubuntu/Debian).
#
# Roda UMA vez, de dentro da pasta do projeto já copiada/clonada na VPS.
# Idempotente: pode rodar de novo sem quebrar nada (checa antes de instalar).
#
# Uso:
#   ./deploy/vps-setup.sh                      # sem domínio (HTTP só)
#   ./deploy/vps-setup.sh app.seudominio.com.br voce@email.com   # com HTTPS
#
# O que faz:
#   1. Instala Node 20 (NodeSource), PM2, Nginx
#   2. Configura firewall (ufw): só 22/80/443 públicos — o app (8081) fica
#      só em 127.0.0.1, nunca exposto direto à internet
#   3. Cria .env com GAMEHUB_SECRET gerado (se ainda não existir)
#   4. npm ci + npm run build
#   5. Registra o processo no PM2 (via deploy/ecosystem.config.js) e o deixa
#      sobrevivendo a reboot
#   6. Configura o Nginx como reverse proxy (deploy/nginx.conf.template)
#   7. Se um domínio + e-mail forem passados, pede certificado HTTPS (certbot)
# ============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PORT=8081

cd "$APP_DIR"
echo "==> Projeto em: $APP_DIR"

log() { echo; echo "==> $1"; }

# ---------------------------------------------------------------------------
# 1. Node.js 20 (NodeSource) + PM2 + Nginx
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node.js já instalado: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Instalando PM2..."
  sudo npm install -g pm2
else
  log "PM2 já instalado: $(pm2 -v)"
fi

if ! command -v nginx >/dev/null 2>&1; then
  log "Instalando Nginx..."
  sudo apt-get update -y
  sudo apt-get install -y nginx
else
  log "Nginx já instalado."
fi

# ---------------------------------------------------------------------------
# 2. Firewall — só SSH e web público. O app nunca fica exposto direto.
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
  log "Configurando firewall (ufw)..."
  sudo ufw allow OpenSSH >/dev/null
  sudo ufw allow 'Nginx Full' >/dev/null
  sudo ufw --force enable >/dev/null
  sudo ufw status | sed 's/^/    /'
else
  echo "[aviso] ufw não encontrado — configure o firewall manualmente (libere 22/80/443 e nada além disso)."
fi

# ---------------------------------------------------------------------------
# 3. .env — gera GAMEHUB_SECRET se ainda não existir
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
  log "Criando .env de produção..."
  SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
GAMEHUB_DB=file
GAMEHUB_SECRET=$SECRET
NODE_ENV=production
EOF
  echo "    .env criado com GAMEHUB_SECRET gerado automaticamente."
else
  log ".env já existe — não mexi nele."
  if ! grep -q '^GAMEHUB_SECRET=.\+' .env; then
    echo "[aviso] .env existe mas GAMEHUB_SECRET parece vazio — o app vai recusar subir em produção."
    echo "        Gere um com: openssl rand -hex 32   e adicione GAMEHUB_SECRET=<valor> ao .env"
  fi
fi

# ---------------------------------------------------------------------------
# 4. Build
# ---------------------------------------------------------------------------
log "Instalando dependências (npm ci)..."
npm ci

log "Build de produção (npm run build)..."
npm run build

# ---------------------------------------------------------------------------
# 5. PM2 — sobe o processo e registra para sobreviver a reboot
# ---------------------------------------------------------------------------
log "Subindo processo no PM2..."
pm2 start deploy/ecosystem.config.js
pm2 save

STARTUP_CMD="$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | tail -1 || true)"
if [[ "$STARTUP_CMD" == sudo* ]]; then
  log "Registrando PM2 para iniciar no boot..."
  eval "$STARTUP_CMD"
else
  echo "[aviso] Não consegui detectar o comando de startup do PM2 automaticamente."
  echo "        Rode 'pm2 startup' manualmente e siga a instrução que ele imprimir."
fi

# ---------------------------------------------------------------------------
# 6. Nginx — reverse proxy 80/443 → 127.0.0.1:8081
# ---------------------------------------------------------------------------
log "Configurando Nginx..."
SERVER_NAME="${DOMAIN:-_}"
sed -e "s/{{DOMAIN}}/$SERVER_NAME/g" -e "s/{{PORT}}/$APP_PORT/g" \
  deploy/nginx.conf.template | sudo tee /etc/nginx/sites-available/labdatadev-gamehub >/dev/null

sudo ln -sf /etc/nginx/sites-available/labdatadev-gamehub /etc/nginx/sites-enabled/labdatadev-gamehub
[ -e /etc/nginx/sites-enabled/default ] && sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
echo "    Nginx configurado (server_name: $SERVER_NAME)."

# ---------------------------------------------------------------------------
# 7. HTTPS (opcional) — só se domínio + e-mail foram passados
# ---------------------------------------------------------------------------
if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
  log "Emitindo certificado HTTPS para $DOMAIN..."
  if ! command -v certbot >/dev/null 2>&1; then
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
elif [ -n "$DOMAIN" ]; then
  echo
  echo "[info] Domínio informado sem e-mail — pulei o certbot."
  echo "       Rode depois: sudo certbot --nginx -d $DOMAIN"
else
  echo
  echo "[info] Sem domínio informado — servindo só HTTP por enquanto."
  echo "       Quando tiver domínio apontado pro IP da VPS, rode:"
  echo "       ./deploy/vps-setup.sh seudominio.com.br voce@email.com"
fi

echo
echo "============================================================"
echo " Pronto. Verifique com: pm2 status  e  curl -I http://localhost"
echo "============================================================"
