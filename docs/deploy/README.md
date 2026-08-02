# Deploy do labdatadev gamehub — instalar, configurar, executar

> **Atualização 2026-08-01 (Épico 13 — Escala e Replicação):** o caminho
> CANÔNICO de deploy agora é **Docker Compose**
> (`deploy/docker/setup.sh`) — substitui o modo PM2 bare-metal
> (`deploy/vps-setup.sh`) descrito nas seções 3–10 abaixo, que fica mantido
> só como referência legada (cabeçalho do próprio script explica por quê).
> Ver a seção **"1-bis"**, logo após a próxima, para o guia atualizado.
> Capacidade real medida (100/500/1000 conexões simultâneas de presença):
> [`architecture/CARGA-1000-SIMULTANEOS.md`](../architecture/CARGA-1000-SIMULTANEOS.md).
> Réplica em VPS/cloud nova com poucos cliques:
> [`../../deploy/docker/cloud-init.yaml`](../../deploy/docker/cloud-init.yaml)
> (1-click, qualquer provedor) ou
> [`../../deploy/terraform/`](../../deploy/terraform/) (IaC declarativo,
> Terraform).

> Documento mestre de operação. Escrito para três leitores: (1) você, na
> véspera do pitch; (2) um investidor/parceiro técnico avaliando o produto;
> (3) o **Claude Code rodando dentro da própria VPS**, a quem você pode colar
> a seção 6 inteira como prompt.

## 0. O que este produto é (para quem chega agora)

O labdatadev gamehub é um jogo multiplayer, multi-tenant, que ensina e vende
ao mesmo tempo: **MEIs e PMEs regionais do Vale do Café** entram, respondem
perguntas sobre o próprio negócio, e o jogo devolve uma sede isométrica, uma
economia de maturidade digital, e a possibilidade de **contratar Funcionários
de IA** — agentes reais (ver `src/features/equipe-ia/catalogo.ts`) que
substituem, por assinatura, o que hoje seria contratar gente de tecnologia. A
visão declarada do produto é expandir esse catálogo (design, programação...)
conforme a operação valida cada função — **este documento não afirma que elas
já existem hoje**, só o que está no catálogo real.

O jogo é a embalagem; o valor é o **diagnóstico de maturidade** que cada
empresa constrói jogando, com dado 100% do próprio negócio. **A regra de ouro
deste deploy:** se o Realtime (presença ao vivo) cair no meio do pitch, o jogo
continua funcionando — presença é o efeito "uau", não o núcleo. O código foi
escrito para degradar em silêncio: sem Realtime, ninguém vê "0 online" falso,
e todas as outras telas seguem inteiras.

---

## 1. Arquitetura alvo

```
Internet
   │
   └── Nginx :80/:443 (certbot, rate limit)
         ├── seudominio.com.br      → PM2 cluster (3×) · Next.js 15 · 127.0.0.1:8081
         └── api.seudominio.com.br  → Kong :8000 → Supabase self-hosted (Docker)
                                        db (Postgres) · auth (GoTrue)
                                        rest (PostgREST) · realtime
```

Duas coisas que tornam isto reproduzível em QUALQUER VPS, não só na sua:

1. **Tudo que muda de máquina para máquina é `.env`.** Código nunca sabe se
   está em `localhost` ou em produção — só lê `GAMEHUB_DB`,
   `NEXT_PUBLIC_SUPABASE_URL` etc (inventário completo na seção 4).
2. **O Supabase sobe do zero por script**, migrations incluídas
   (`deploy/supabase-up.sh`) — não existe passo manual "entre no painel e
   configure X". Isso é o que faz "rodar em qualquer lugar" ser verdade, não
   só uma frase.

Containers do Supabase self-hosted: **5**, não os ~11 do compose oficial —
sem Studio (GUI de admin — desnecessária numa VPS pequena; use `docker compose
exec db psql`), sem Storage/imgproxy, sem Edge Functions (Server Actions do
Next.js já cobrem toda mutação). Ver `deploy/supabase/docker-compose.yml`
para o porquê de cada corte.

---

## 1-bis. Caminho canônico atual — Docker Compose (Épico 13, 2026-08-01)

Tudo abaixo (seções 3–10) descreve o modo PM2 bare-metal, que funciona e
continua documentado, mas **não é mais o caminho recomendado**. O caminho
canônico — usado por esta VPS (labd.cloud) e pelo CI/CD
(`.github/workflows/deploy.yml`) — é `deploy/docker/setup.sh`:

```bash
cd ~/labdatadev-gamehub
chmod +x deploy/*.sh deploy/docker/*.sh

# 1ª vez OU atualização (idempotente, --build sempre pega código novo):
./deploy/docker/setup.sh --with-supabase --labd-cloud

# Numa VPS/cloud NOVA, sem nada pré-existente (sem Traefik, domínio próprio):
./deploy/docker/setup.sh --with-supabase
```

O que muda em relação ao modo PM2:

| | PM2 bare-metal (`vps-setup.sh`) | Docker Compose (`docker/setup.sh`) |
|---|---|---|
| App roda em | processo Node direto (PM2 cluster) | container(s), `deploy.replicas` (default 3) |
| Nginx | do sistema, portas 80/443 | container próprio, porta livre (labd.cloud) ou Traefik existente |
| Réplicas do app | fixo em 3 (`ecosystem.config.js`) | ajustável via `--replicas N` sem editar arquivo |
| Atualização | `deploy/deploy.sh` (script separado) | mesmo `setup.sh --build`, idempotente |
| Replicar em VPS nova | copiar/adaptar o script manualmente | `deploy/docker/cloud-init.yaml` (1-click, cole no provisionamento da VM) ou `deploy/terraform/` (IaC) |

**Dimensionado para 100–1000 conexões simultâneas de presença** (não só o
piloto atual) — pool de conexão do PostgREST, `max_connections` do Postgres,
réplicas do app, `ulimits` de file descriptor e `worker_connections` do
Nginx foram todos ajustados e **medidos de verdade** (não só calculados) em
[`../architecture/CARGA-1000-SIMULTANEOS.md`](../architecture/CARGA-1000-SIMULTANEOS.md)
— inclui um bug real de infraestrutura encontrado e corrigido nessa mesma
rodada (`deploy/supabase/kong.yml`, `hide_credentials` da rota do Realtime),
sem o qual a presença ao vivo nunca teria funcionado em nenhum deploy real.

Harness de carga reutilizável para medir de novo depois de qualquer mudança
grande: [`../../deploy/loadtest/presenca-k6.js`](../../deploy/loadtest/presenca-k6.js).

---

## 2. Pré-requisitos

| Item | Mínimo | Por quê |
|---|---|---|
| VPS Hostinger | **8 GB RAM / 4 vCPU** | Supabase self-hosted (~3,5 GB) + PM2 cluster de 3 (~1,2 GB) + Nginx/SO. Menos que isso, use Supabase Cloud gerenciado em vez de self-hosted (troca só o `.env`, mesmas migrations) |
| SO da VPS | Ubuntu 22.04+/Debian 12+ | `deploy/vps-setup.sh` usa `apt`/`ufw`/`systemd` |
| Domínio | 1 domínio + 1 registro `api.<domínio>` apontando pro mesmo IP | **Não é opcional.** O cookie de sessão exige HTTPS em produção (`secure: NODE_ENV === "production"`) — sem domínio, ninguém consegue logar |
| Acesso SSH | chave própria, usuário com `sudo` | O script instala pacotes de sistema |
| Máquina local | Node 20+, `git` | Só para desenvolver/testar antes de subir |

---

## 3. Rodar local (desenvolvimento e demo rápida, SEM Docker)

Um clique — instala dependências, cria `.env`, abre o navegador:

```bash
./iniciar.sh          # Linux/Mac
```
```bat
iniciar.bat
```

Isso sobe com `GAMEHUB_DB=file` (JSON em `data/`, zero infraestrutura) em
`http://localhost:8081`. **É o modo certo para desenvolver e para uma demo
rápida em notebook offline** — não é o modo de produção, e não tem
multiplayer/presença (isso exige Supabase Realtime, seção 5).

---

## 4. Variáveis de ambiente — inventário completo

| Variável | Obrigatória? | Onde é lida | O que faz |
|---|---|---|---|
| `GAMEHUB_DB` | não (default `file`) | `src/lib/db/index.ts`, `src/lib/auth/index.ts` | `file` ou `supabase` — escolhe o adapter de persistência E o provedor de auth juntos |
| `GAMEHUB_SECRET` | **sim em produção** (min 16 chars) | `src/lib/auth/sessao.ts` | Assina o cookie de sessão (HMAC-SHA256). Trocar derruba TODAS as sessões |
| `GAMEHUB_ADMIN_EMAILS` | não | `src/lib/admin.ts` | E-mails (vírgula) com acesso a `/admin/eventos`. Vazio = ninguém acessa |
| `NEXT_PUBLIC_SUPABASE_URL` | só com `GAMEHUB_DB=supabase` | `src/lib/supabase/client.ts` | URL pública do Kong (`https://api.seudominio.com.br`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | só com `GAMEHUB_DB=supabase` | idem | JWT de papel `anon` — **vai para o browser** e é o que a presença ao vivo usa para abrir o socket do Realtime |
| `SUPABASE_SERVICE_ROLE_KEY` | só com `GAMEHUB_DB=supabase` | idem | JWT de papel `service_role` — **nunca chega ao browser**, ignora RLS |
| `NODE_ENV` | sim em produção | várias | `production` liga `secure` no cookie e desliga o hook de debug do World |

Em produção (VPS), **você não digita nenhuma dessas à mão** — `deploy/vps-setup.sh`
gera `GAMEHUB_SECRET` e alinha as 3 variáveis do Supabase (`URL`, `ANON_KEY`,
`SERVICE_ROLE_KEY`) automaticamente a partir do stack que ele mesmo sobe
(`deploy/supabase-up.sh`).

> O `JWT_SECRET` que assina a `ANON_KEY`/`SERVICE_ROLE_KEY` vive **só** em
> `deploy/supabase/.env` (dentro do stack Supabase) — o app não assina token
> próprio, então esse segredo nunca entra no `.env` do app.

---

## 5. Produção na VPS Hostinger — passo a passo

### 5.1 Levar o código

> **Qual branch?** A camada de deploy vive na branch **`integracao-deploy-vps`**
> (ainda não fundida na `main`). Enquanto não fizer o merge no GitHub, **clone
> essa branch** — é a única com o Supabase/Docker pronto. Todo commit de
> continuação (correções/integrações na VPS) vai **nesta mesma branch**.

Com o repositório no GitHub (recomendado — habilita o deploy automático da
seção 5.4):
```bash
ssh usuario@ip-da-vps
git clone -b integracao-deploy-vps https://github.com/DemarchiWorking/independent-lab.git ~/labdatadev-gamehub
```
Sem GitHub ainda, `rsync` direto (exclua o que é local/gerado):
```bash
rsync -avz --exclude node_modules --exclude .next --exclude data --exclude .git \
  ./ usuario@ip-da-vps:~/labdatadev-gamehub/
```

### 5.2 Apontar o DNS

No painel do seu domínio, dois registros `A` para o IP da VPS:
```
seudominio.com.br      A   <IP-da-VPS>
api.seudominio.com.br  A   <IP-da-VPS>
```
Espere propagar (`dig seudominio.com.br` até responder o IP certo) **antes**
de pedir HTTPS no próximo passo — o certbot valida por HTTP e falha se o DNS
ainda não resolver.

### 5.3 Um único comando

```bash
cd ~/labdatadev-gamehub
chmod +x deploy/*.sh iniciar.sh
./deploy/vps-setup.sh seudominio.com.br voce@email.com
```

Isso, nesta ordem (todo o script é **idempotente** — rodar de novo não
quebra nada):

1. Instala Node 20, PM2, Nginx, **Docker + compose plugin**.
2. Configura o firewall (`ufw`): só 22/80/443 públicos. Nem o app (8081) nem
   o Kong (8000) ficam expostos direto — só via Nginx.
3. **Sobe o Supabase self-hosted** (`deploy/supabase-up.sh`): containers,
   espera saúde de cada um, **aplica TODAS as migrations de
   `supabase/migrations/` em ordem** contra um Postgres do zero, aplica o
   seed das cidades do Vale do Café. Rastreia o que já aplicou numa tabela
   própria (`_migrations.aplicadas`) — seguro rodar de novo, aplica só o que
   for novo.
4. Agenda backup diário do Postgres às 3h (`deploy/backup.sh`, cron).
5. Gera/alinha o `.env` do app: `GAMEHUB_DB=supabase` + as 3 variáveis lidas
   direto do Supabase que acabou de subir.
6. `npm ci && npm run build`.
7. Sobe o processo no **PM2 em modo cluster (3 processos)**, registra para
   sobreviver a reboot.
8. Configura Nginx para os dois domínios (app + `api.`), com zonas de rate
   limit.
9. Emite certificado HTTPS (certbot) para os dois domínios.

Ao final, o script imprime como verificar:
```bash
pm2 status
curl -fsS https://seudominio.com.br/api/health
docker compose -f deploy/supabase/docker-compose.yml ps
```

`/api/health` responde `{"ok":true,"versao":"...","db":"supabase", ...}`
com HTTP 200 — `ok:false`/503 significa que o processo subiu mas não
consegue falar com o Postgres (primeiro lugar a olhar: `docker compose ps`).

### 5.4 Atualizações depois do primeiro deploy

**Automático (recomendado):** configure 3 secrets no GitHub
(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) e todo `git push` na `main` roda
`.github/workflows/deploy.yml`, que valida (typecheck+test) e só então
manda a VPS rodar `deploy/deploy.sh`.

**Manual:**
```bash
ssh usuario@ip-da-vps "cd ~/labdatadev-gamehub && ./deploy/deploy.sh"
```

`deploy.sh` só troca a versão em produção **depois** de typecheck, teste e
build passarem, e confirma com `/api/health` antes de declarar sucesso — se
algo falhar, o processo antigo continua no ar.

> `deploy.sh` atualiza só o APP. Uma migration nova em `supabase/migrations/`
> não é aplicada sozinha — rode `./deploy/supabase-up.sh` depois do deploy
> (idempotente: só aplica o que for novo).

---

## 6. Prompt pronto para o Claude Code, rodando DENTRO da VPS

Se você abrir uma sessão do Claude Code por SSH na própria VPS (ou pedir para
o Claude Code operar remotamente nela), cole o prompt abaixo. Ele já sabe
proteger dado real e nunca pular os gates de qualidade — é o mesmo
comportamento que `AGENTS.md` já define para qualquer sessão dentro deste
repositório. (Versão completa e comentada: `PROMPT-CLAUDE-VPS.md` na raiz.)

```
Você está numa VPS Hostinger provisionando/operando o labdatadev gamehub.
Leia AGENTS.md e docs/deploy/README.md inteiros antes de qualquer coisa.

Objetivo: colocar (ou manter) o jogo no ar em produção, com Supabase
self-hosted em Docker, com o mínimo de intervenção manual minha.

Faça, nesta ordem, confirmando comigo SÓ nos passos destrutivos:
1. `git status` e `git pull --ff-only` (nunca --force, nunca reset --hard
   sem eu confirmar).
2. Se for a primeira vez: rode ./deploy/vps-setup.sh <meu-dominio> <meu-email>
   (pergunte o domínio/e-mail se eu não tiver passado). Se já rodou antes:
   ./deploy/deploy.sh e, se houver migration nova, ./deploy/supabase-up.sh.
3. Depois de qualquer subida, verifique de verdade, não assuma:
   - pm2 status (3 processos "online")
   - curl -fsS https://<dominio>/api/health → precisa vir "ok":true e
     "db":"supabase"
   - docker compose -f deploy/supabase/docker-compose.yml ps → 5 containers
     "healthy"
4. Se algo falhar, leia os logs ANTES de tentar de novo:
   pm2 logs labdatadev-gamehub --lines 100
   docker compose -f deploy/supabase/docker-compose.yml logs --tail 100 <serviço>
5. NUNCA: git push --force, docker compose down -v (apaga o volume do
   Postgres = apaga todo cadastro real), editar deploy/ecosystem.config.js
   pra expor a porta 8081 direto, rodar supabase-up.sh apagando
   deploy/supabase/.env antes (isso troca o JWT_SECRET e derruba todo login).
6. Backup antes de qualquer mudança arriscada: ./deploy/backup.sh
   Testar restore (só se eu pedir explicitamente — é destrutivo):
   ./deploy/backup.sh restore <arquivo>

Me dê um resumo curto do que mudou e o resultado dos 3 comandos de
verificação do passo 3 no final.
```

---

## 7. Trocar de `file` para `supabase` — o que muda e como validar

Esta é a pergunta que mais importa antes do pitch: **nada no código muda** —
a troca é só `GAMEHUB_DB` no `.env`, porque `SupabaseRepository` já implementa
100% da interface `GameRepository` (ver `src/lib/db/repository.ts`). Mas "o
contrato bate" não é o mesmo que "eu já vi rodar contra um Postgres de
verdade". Por que caminhos que passam com `GAMEHUB_DB=file` podem falhar só
com Supabase real:

- O `file` adapter lê/escreve um JSON inteiro **sem lock** — não tem
  transação, `CHECK`, `unique` nem RLS. Toda garantia real (constraint,
  atomicidade, isolamento entre tenants) só existe no Postgres.
- A presença ao vivo é o **primeiro** código que roda a `anon key` no browser
  — a partir daí a RLS deixa de ser teórica: ela é o que impede um tenant de
  ler o dado de outro pela API REST pública. Por isso o endurecimento da RLS
  de `negocios` (GH-MULTI-00) é bloqueante antes de abrir a presença ao
  público.

**Checklist de validação, na ordem, antes de confiar no ambiente para o pitch:**

1. **Migrations aplicam limpo.** `./deploy/supabase-up.sh` numa VPS/Postgres
   do zero — se qualquer uma falhar, o script para (`ON_ERROR_STOP=1`) e não
   marca como aplicada.
2. **Cadastro nos segmentos reais**, um de cada vez, pela tela `/cadastro`.
3. **RLS de verdade.** A app usa `service_role` (ignora RLS) nos caminhos de
   Server Action; a presença usa `anon`. Teste à parte com a `anon key`:
   tentar ler dado privado de outro tenant tem que ser negado.
4. **Idempotência.** Rode `./deploy/vps-setup.sh` e `./deploy/deploy.sh`
   **duas vezes seguidas** — a segunda vez não pode falhar nem duplicar nada.
5. **Dois usuários ao mesmo tempo.** Dois cadastros na mesma cidade, em dois
   navegadores; um visita a sede do outro pelo mapa e vê a presença.
6. **Reboot.** `sudo reboot` na VPS e confirmar que PM2 e os 5 containers do
   Supabase voltam sozinhos, sem comando manual.
7. **Restore ensaiado.** `./deploy/backup.sh` seguido de
   `./deploy/backup.sh restore <arquivo>` — **faça isso ANTES da semana do
   pitch**, não durante. É o único item desta lista que, se pular, pode
   custar o dia inteiro se o Postgres corromper.

> Itens 3, 5 e 7 exigem Docker/Postgres reais — só dá para verificar na VPS,
> não numa máquina de desenvolvimento sem Docker. Trate-os como **pendentes
> de execução na VPS**, não como "já testado".

---

## 8. Operação do dia a dia

```bash
pm2 status                                              # app rodando?
pm2 logs labdatadev-gamehub --lines 100                 # logs do app
docker compose -f deploy/supabase/docker-compose.yml ps         # Supabase
docker compose -f deploy/supabase/docker-compose.yml logs -f auth   # logs de 1 serviço
./deploy/backup.sh listar                                # backups disponíveis
sudo nginx -t && sudo systemctl reload nginx             # depois de mexer no Nginx
```

## 9. Rollback

```bash
cd ~/labdatadev-gamehub
git log --oneline -5                # ache o commit bom anterior
git reset --hard <commit-bom>       # ⚠️ descarta commit(s) ruim(is) na VPS
./deploy/deploy.sh
```
Migration de banco **não tem rollback automático** — se uma migration nova
corrompeu dado, o caminho é `./deploy/backup.sh restore <dump-de-antes>`.

## 10. Troubleshooting rápido

| Sintoma | Onde olhar |
|---|---|
| `/api/health` devolve 503 | `docker compose ps` — algum container do Supabase não está `healthy` |
| Ninguém consegue logar em produção | HTTPS não está ativo — cookie exige `secure`. Confira `curl -I https://seudominio.com.br` |
| Presença ao vivo não aparece | Confira `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env` e o container `realtime` em `docker compose ps`. Ausência degrada em silêncio — o resto do jogo segue |
| `docker compose up` trava esperando `kong` | `auth`/`rest`/`realtime` não ficaram `healthy` a tempo — veja `docker compose logs <serviço>` |
| Deploy trocou a versão mas nada mudou | `pm2 status` — em modo `cluster`, `pm2 reload` reinicia os 3 workers aos poucos; espere alguns segundos |

## 11. Melhoria contínua — como evoluir DEPOIS de estar no ar

A esteira já garante que **produção só muda se os 3 gates passarem**, então
iterar de dentro da VPS é seguro:

```
mexer no código → npm run typecheck && npm test && npm run build (local)
   → commit → push na main
   → CI (.github/workflows/deploy.yml) valida de novo
   → deploy.sh na VPS valida de NOVO, aí sim pm2 reload
   → curl /api/health confirma
   → se falhar em QUALQUER ponto, a versão antiga continua no ar
```

Regra de ouro do ciclo: **um card por vez, gates verdes, deploy, verifica.**
Nunca acumular 5 mudanças e subir juntas — se quebrar, você não sabe qual foi.
O backlog de produto priorizado está em `docs/PROXIMA-TAREFA.md`.
