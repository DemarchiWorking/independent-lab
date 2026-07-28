# Deploy na VPS Hostinger

> Guia humano, passo a passo. Para o runbook que o **Claude Code lê
> automaticamente** ao operar na VPS, veja [`../AGENTS.md`](../AGENTS.md).

Arquitetura: **Nginx** (porta 80/443, público) → proxy reverso → **Next.js**
rodando via **PM2** em `127.0.0.1:8081` (nunca exposto direto à internet).
Sem Docker — pragmático para uma VPS pequena e um MVP que precisa estar no ar
rápido. `GAMEHUB_DB=file` por padrão (zero infra extra); migrar para Supabase
é um `.env` diferente, documentado em
[`../docs/ARQUITETURA-MULTITENANT.md`](../docs/ARQUITETURA-MULTITENANT.md).

---

## 1. Levar o código para a VPS (primeira vez)

Ainda sem remote no GitHub? Copie a pasta direto pelo SSH já configurado
(alias `hostinger` — ver `C:\Users\demarchi\Desktop\claude-code\atalhos`):

```bash
rsync -avz --exclude node_modules --exclude .next --exclude data \
  "C:/Users/demarchi/Desktop/claude-code/labdatadev-gamehub/" \
  hostinger:~/labdatadev-gamehub/
```

(No Windows sem `rsync`, use `scp -r` com os mesmos excludes manuais, ou o
WinSCP/FileZilla apontando para `hostinger`.)

Quando o repositório estiver no GitHub, prefira sempre:

```bash
ssh hostinger "git clone <url-do-repo> ~/labdatadev-gamehub"
```

## 2. Provisionar a VPS (uma vez só)

```bash
ssh hostinger
cd ~/labdatadev-gamehub
chmod +x deploy/*.sh iniciar.sh
./deploy/vps-setup.sh                              # só HTTP, sem domínio
# OU, se já tiver domínio apontado para o IP da VPS:
./deploy/vps-setup.sh app.seudominio.com.br voce@email.com
```

Isso instala Node 20, PM2 e Nginx, configura o firewall (só 22/80/443
públicos), gera o `.env` de produção, builda o app, sobe no PM2 e configura o
Nginx como reverse proxy. Idempotente — pode rodar de novo sem quebrar nada.

## 3. Atualizações depois (a esteira de melhoria contínua)

**Manual, via SSH:**
```bash
ssh hostinger "cd ~/labdatadev-gamehub && ./deploy/deploy.sh"
```

**Automático, via GitHub Actions:** configure os secrets do repositório
(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) e todo `git push` na `main` roda
`.github/workflows/deploy.yml`, que SSHa na VPS e chama `deploy/deploy.sh`.

O `deploy.sh` só troca a versão em produção **depois** de typecheck, testes e
build passarem — se algo quebrar, o app antigo continua no ar.

## 4. Operação do dia a dia

```bash
ssh hostinger
pm2 status                          # o app está rodando?
pm2 logs labdatadev-gamehub         # logs em tempo real
pm2 monit                           # CPU/memória
sudo nginx -t && sudo systemctl reload nginx   # depois de mexer no Nginx
```

## 5. Rollback

Se um deploy quebrou algo em produção:

```bash
ssh hostinger
cd ~/labdatadev-gamehub
git log --oneline -5                # ache o commit bom anterior
git reset --hard <commit-bom>       # ⚠️ descarta o commit ruim localmente na VPS
./deploy/deploy.sh
```

## 6. Backup dos dados (modo `GAMEHUB_DB=file`)

Os cadastros reais vivem em `~/labdatadev-gamehub/data/` (fora do git).
Faça backup periódico:

```bash
ssh hostinger "tar czf ~/backup-gamehub-$(date +%Y%m%d).tar.gz -C ~/labdatadev-gamehub data"
```

Quando migrar para Supabase, o backup passa a ser responsabilidade do próprio
Supabase (point-in-time recovery no plano pago).
