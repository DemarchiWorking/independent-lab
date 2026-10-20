# Deploy do independent-lab na VPS compartilhada

Este projeto roda numa VPS Hostinger que também hospeda ~40 containers de
outros projetos. Por isso o deploy é um **container isolado, sem porta
publicada**, atrás do Caddy que já existe na máquina. Nada aqui instala
Nginx, certbot ou firewall, nem mexe em Docker ou portas dos outros projetos.

```
Internet ──443──▶ Caddy (container vitrine-edge-1, dono do HTTPS)
                     │  rede Docker "vitrine_web-net"
                     ▼
              independent-lab-app:3000  (Next.js standalone, uid 10001, somente leitura)
                     │
              /opt/independent-lab/data  (volume: JSON dos negócios)
                     │ data/ia  (pasta de troca: só pedidos e resultados da IA)
                     ▼
              independent-lab-ia-worker  (única credencial da Anthropic; sem porta)
```

Endereço padrão: `https://lab.2-25-146-39.sslip.io` (o sslip.io resolve o IP
da VPS e o Caddy emite o certificado sozinho). Para usar um domínio seu,
aponte o DNS para `2.25.146.39` e rode os scripts com
`DOMINIO=... SITE_URL=https://...`.

## Primeiro deploy

Tudo a partir da sua máquina, com o alias `hostinger` já funcionando.

1. **(opcional, recomendado)** endurecer o acesso à VPS — veja
   "Hardening da VPS" abaixo. Afeta todos os projetos.
2. Publicar o container:
   ```bash
   ADMIN_EMAILS=voce@exemplo.com ./deploy/publicar.sh
   ```
   Digite `PUBLICAR`. Na primeira vez cria `/opt/independent-lab/.env` na
   VPS com um `GAMEHUB_SECRET` novo (só existe lá, `chmod 600`).
3. Ligar o HTTPS no Caddy da Vitrine:
   ```bash
   ./deploy/borda-caddy.sh
   ```
   Digite `CONFIRMAR`. É uma recarga a quente: o container do Caddy **não é
   recriado** e o site da Vitrine não cai.
4. Conferir: `curl https://lab.2-25-146-39.sslip.io/api/health` deve devolver
   `{"ok":true,"versao":"<sha>",...}`.

## Atualizações

```bash
git commit ...           # o deploy é feito do commit, não da pasta de trabalho
./deploy/publicar.sh
```

O script confere árvore limpa, roda typecheck e testes, envia o código,
**constrói na VPS com `nice`**, faz snapshot dos dados, sobe o container novo e
espera `/api/health` responder com o sha novo. Se não responder em ~2 min,
**volta sozinho para a imagem anterior**. Guarda as 3 últimas imagens.

## O que vive onde (na VPS)

| Caminho | O que é |
|---|---|
| `/opt/independent-lab/.env` | variáveis de produção (segredo, admins, URL). `chmod 600` |
| `/opt/independent-lab/.env.ia` | credenciais do worker de IA (`ANTHROPIC_API_KEY`). `chmod 600`. Nunca no `.env` do app |
| `/opt/independent-lab/data/ia` | pasta de troca app ⇄ worker (pedidos, resultados, configuração da IA, uso) |
| `/opt/independent-lab/ia-guardiao.sh` | guardião horário da IA (instalado no systemd por `instalar-guardiao.sh`) |
| `/opt/independent-lab/data` | dados dos negócios (volume do container) |
| `/opt/independent-lab/backups` | `dados-*.tar.gz` diário (14 dias) e `antes-do-deploy-<sha>.tar.gz` |
| `/opt/independent-lab/src/<sha>` | código das últimas releases |
| `/opt/independent-lab/borda` | cópias datadas do Caddyfile antes de cada alteração |

## Operação

```bash
docker ps --filter name=independent-lab            # STATUS deve dizer (healthy)
docker logs -f independent-lab-app
docker logs -f independent-lab-ia-worker          # a IA: pedidos, pausas, erros
docker stats --no-stream independent-lab-app independent-lab-ia-worker
```

**Rollback manual** (a imagem anterior continua na máquina):

```bash
docker images independent-lab                       # veja as tags (sha)
cd /opt/independent-lab && IMAGEM=independent-lab:<sha-antigo> \
  IMAGEM_WORKER=independent-lab-ia-worker:<sha-antigo> \
  docker compose -p independent-lab -f compose.yml up -d
```

**Restaurar dados** de um backup:

```bash
cd /opt/independent-lab && docker compose -p independent-lab -f compose.yml stop app
tar -xzf backups/dados-<data>.tar.gz -C data && chown -R 10001:10001 data
IMAGEM=independent-lab:<sha> IMAGEM_WORKER=independent-lab-ia-worker:<sha> \
  docker compose -p independent-lab -f compose.yml up -d
```

**Backup fora da VPS** (um disco que morre leva os backups junto):

```bash
rsync -az hostinger:/opt/independent-lab/backups/ ./backups-independent-lab/
```

Os arquivos têm dados pessoais (LGPD): guarde cifrados.

## IA (worker, guardião e conta de admin)

Guia completo: [`docs/equipe-ia/IA-OPERACAO.md`](../docs/equipe-ia/IA-OPERACAO.md). Resumo do que o deploy faz e do que **você** faz:

| Passo | Quem | Como |
|---|---|---|
| Subir app + worker | `publicar.sh` | Constrói as duas imagens na VPS e confere o batimento do worker |
| Colocar a chave | você | `nano /opt/independent-lab/.env.ia` (`ANTHROPIC_API_KEY`), depois `docker restart independent-lab-ia-worker`. Crie a chave no Console **com limite mensal de gasto** |
| Criar a conta de admin da IA | você | Em produção o cadastro recusa `admin@admin.com`. Ponha `GAMEHUB_LIBERAR_CADASTRO_ADMIN=1` no `.env`, reinicie o app, cadastre-se, **remova a linha** e reinicie |
| Guardião de hora em hora | `instalar-guardiao.sh` | Timer do systemd (ou cron: `0 * * * * /opt/independent-lab/ia-guardiao.sh`) |
| Escolher modelo, limites, modo | você | `/admin/ia`, só com o e-mail do admin da IA |

O worker sobe mesmo sem chave: a tela `/admin/ia` mostra "modo sem credencial" e o material de regras continua funcionando. O modo assinatura (`INSTALAR_CLAUDE_CLI=1`) é opcional e **contraria os termos da Anthropic** quando atende usuários de um produto: leia o guia antes.

```bash
docker logs --tail 50 independent-lab-ia-worker
systemctl list-timers independent-lab-ia-guardiao.timer   # próximo disparo
systemctl start independent-lab-ia-guardiao.service       # rodar agora
journalctl -u independent-lab-ia-guardiao.service -n 30   # o que ele fez
```

## Atenção

- **Uma instância só.** O modo `GAMEHUB_DB=file` serializa as escritas com uma
  trava dentro do processo. Duas instâncias do app sobre a mesma pasta de
  dados voltam a perder dado. Para escalar, migre para `GAMEHUB_DB=supabase`.
- **`GAMEHUB_SECRET`:** trocar desconecta todo mundo e invalida todos os
  convites. Faça isso de propósito se suspeitar de vazamento.
- **Depois de atualizar ou reinstalar a Vitrine**, o container do Caddy é
  recriado e perde o bloco do `independent-lab`: rode `./deploy/borda-caddy.sh`
  de novo (é idempotente). Para desfazer: `./deploy/borda-caddy.sh --remover`.
- **sslip.io** é um serviço de terceiros e compartilha limites de emissão de
  certificado com quem o usa. Para algo duradouro, use um domínio próprio.

## Hardening da VPS (SSH, fail2ban, patches)

Em 19/10/2026 a VPS aceitava login de root **por senha**, sem fail2ban e com 6
tentativas de senha por conexão. O script abaixo corrige isso para a máquina
inteira, então **você** o executa e revisa:

```bash
scp deploy/vps-hardening.sh hostinger:/root/ && ssh hostinger
bash /root/vps-hardening.sh               # simulação: mostra o estado e o que mudaria
bash /root/vps-hardening.sh --aplicar     # aplica
```

Ele recusa aplicar se o root não tiver chave autorizada, valida a config com
`sshd -t` antes de recarregar, isenta o seu IP no fail2ban e **não** liga o
ufw (o Docker publica portas por fora dele). Depois de aplicar, abra uma
segunda sessão SSH para confirmar que entra, antes de fechar a primeira.

## Rodar local

```bash
npm install
npm run dev        # http://127.0.0.1:8081 (gera .env e GAMEHUB_SECRET sozinho)
```

Imagem local (precisa de Docker): `docker build -t independent-lab .`
