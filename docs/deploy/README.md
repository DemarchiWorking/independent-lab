# Deploy do labdatadev gamehub — instalar, configurar, executar

> Documento mestre de operação. Escrito para três leitores: (1) você, na
> véspera do pitch; (2) um investidor/parceiro técnico avaliando o produto;
> (3) o **Claude Code rodando dentro da própria VPS**, a quem você pode colar
> a seção 6 inteira como prompt.

## 0. O que este produto é (para quem chega agora)

O labdatadev gamehub é um jogo multiplayer, multi-tenant, que ensina e vende
ao mesmo tempo: **MEIs e PMEs regionais do Vale do Café** entram, respondem 10
perguntas sobre o próprio negócio, e o jogo devolve uma sede isométrica, uma
economia de 5 eixos de maturidade digital, e a possibilidade de **contratar
Funcionários de IA** — agentes reais (hoje: Documentador, Social Media, Editor
de Vídeo, Comercial/Automação — ver `src/features/equipe-ia/catalogo.ts`) que
substituem, por assinatura, o que hoje seria contratar gente de tecnologia. A
visão declarada do produto é expandir esse catálogo (design, programação...)
conforme a operação valida cada função — **este documento não afirma que elas
já existem hoje**, só o que está no catálogo real.

O jogo é a embalagem. O **documento de diagnóstico** que cada empresa recebe
(`src/features/documentos/`, GH-OPS Bloco 4) é o produto que se mostra numa
sala de aula do MBA de Empreendedorismo ou numa reunião com uma empresa real
do Vale do Café — metodologia versionada, dado 100% do próprio negócio, zero
enfeite. **A regra de ouro deste deploy:** se o Realtime (presença ao vivo)
cair no meio do pitch, o jogo e o documento continuam funcionando. Multiplayer
é o efeito "uau"; o diagnóstico é o que fecha negócio.

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
exec db psql`), sem Storage/imgproxy (o motor de documentos nunca guarda
blob, sempre regenera do dado vivo), sem Edge Functions (Server Actions do
Next.js já cobrem toda mutação). Ver `deploy/supabase/docker-compose.yml`
para o porquê de cada corte.

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | só com `GAMEHUB_DB=supabase` | idem | JWT de papel `anon` — vai para o browser no Bloco 5 (presença) |
| `SUPABASE_SERVICE_ROLE_KEY` | só com `GAMEHUB_DB=supabase` | idem | JWT de papel `service_role` — **nunca chega ao browser**, ignora RLS |
| `SUPABASE_JWT_SECRET` | só para presença ao vivo | `src/lib/supabase/jwt.ts` | O **mesmo** `JWT_SECRET` do stack Supabase. O app assina com ele um JWT de 10 min para abrir o socket do Realtime. **Ausente = presença simplesmente não liga** (`/api/realtime-token` responde 501); o resto do jogo não muda |
| `NODE_ENV` | sim em produção | várias | `production` liga `secure` no cookie e desliga o hook de debug do World |

Em produção (VPS), **você não digita nenhuma dessas à mão** — `deploy/vps-setup.sh`
gera `GAMEHUB_SECRET` e alinha as 4 variáveis do Supabase (`URL`, `ANON_KEY`,
`SERVICE_ROLE_KEY`, `JWT_SECRET`) automaticamente a partir do stack que ele
mesmo sobe (`deploy/supabase-up.sh`).

---

## 5. Produção na VPS Hostinger — passo a passo

### 5.1 Levar o código

Com o repositório no GitHub (recomendado — habilita o deploy automático da
seção 5.4):
```bash
ssh usuario@ip-da-vps
git clone <url-do-repo> ~/labdatadev-gamehub
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
   espera saúde de cada um, **aplica as 17 migrations em ordem**
   (`supabase/migrations/0001` a `0017`) contra um Postgres do zero, aplica o
   seed das 7 cidades do Vale do Café. Rastreia o que já aplicou numa tabela
   própria (`_migrations.aplicadas`) — seguro rodar de novo.
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

`/api/health` responde `{"ok":true,"versao":"0.1.0","db":"supabase", ...}`
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
repositório.

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
100% da interface `GameRepository` (32/32 métodos, sem stub) — ver
`src/lib/db/repository.ts`. Mas "o contrato bate" não é o mesmo que "eu já vi
rodar contra um Postgres de verdade". Esta sessão corrigiu 6 defeitos que só
apareciam com Supabase real (nunca com `GAMEHUB_DB=file`, que não passa pelas
mesmas checagens):

| # | Defeito corrigido | Por que só aparecia com Supabase |
|---|---|---|
| M-1 | CHECK de `segmento` no SQL só aceitava 3 dos 8 valores reais do cadastro | `file` não tem CHECK nenhum — o bug ficava invisível em dev |
| M-2 | `emailExiste` não paginava (`listUsers()` limita a 50) | só GoTrue (Supabase Auth) pagina; `LocalAuthProvider` lê um JSON inteiro |
| M-3 | Cadastro não era transacional — falha no meio deixava tenant órfão | mesma classe de bug, mas o `file` não tem "auth externo" que possa falhar depois do negócio já criado |
| M-4 | `vps-setup.sh` gravava `GAMEHUB_DB=file` mesmo em produção | o file adapter faz leitura-modificação-escrita de JSON **sem lock** — corrompe sob concorrência real |
| M-9 | Cliente `anon` do Supabase era singleton compartilhado entre logins concorrentes | não existe no `file` (não há SDK de terceiro) |
| M-10 | Corrida de duplo-clique podia pagar XP/moeda duas vezes | a garantia real é o `unique` do Postgres; o `file` não tem transação nem constraint |

**Checklist de validação, na ordem, antes de confiar no ambiente para o pitch:**

1. **Migrations aplicam limpo.** `./deploy/supabase-up.sh` numa VPS/Postgres
   do zero — se qualquer uma das 17 falhar, o script para (`ON_ERROR_STOP=1`)
   e não marca como aplicada.
2. **Cadastro nos 8 segmentos**, um de cada vez, pela tela `/cadastro` —
   é o teste que pega o M-1 se algum dia regredir.
3. **RLS de verdade.** A app usa `service_role` (ignora RLS) em 100% dos
   caminhos — as policies **nunca são exercidas pelo tráfego normal**. Teste
   à parte com a `anon key`: tentar ler `onboardings`/`documentos_emitidos`
   de outro tenant tem que ser negado.
4. **Idempotência.** Rode `./deploy/vps-setup.sh` e `./deploy/deploy.sh`
   **duas vezes seguidas** — a segunda vez não pode falhar nem duplicar nada.
5. **Recompensa não duplica.** Clique duas vezes rápido em "Contratar" no
   mesmo cargo — só um XP/moeda deve ser pago (M-10).
6. **Reboot.** `sudo reboot` na VPS e confirmar que PM2 e os 5 containers do
   Supabase voltam sozinhos, sem comando manual.
7. **Restore ensaiado.** `./deploy/backup.sh` seguido de
   `./deploy/backup.sh restore <arquivo>` — **faça isso ANTES da semana do
   pitch**, não durante. É o único item desta lista que, se pular, pode
   custar o dia inteiro se o Postgres corromper.

> Itens 3 e 7 exigem Docker/Postgres reais — não têm como ser verificados
> nesta sessão de desenvolvimento (sem Docker disponível aqui). Trate-os como
> **pendentes de execução na VPS**, não como "já testado".

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
| Cadastro falha num segmento específico | Migration `0014` não aplicou — rode `./deploy/supabase-up.sh` de novo |
| `docker compose up` trava esperando `kong` | `auth`/`rest`/`realtime` não ficaram `healthy` a tempo — veja `docker compose logs <serviço>` |
| Deploy trocou a versão mas nada mudou | `pm2 status` — em modo `cluster`, `pm2 reload` reinicia os 3 workers aos poucos; espere alguns segundos |

## 11. Melhoria contínua — como evoluir DEPOIS de estar no ar

O código já está pronto para subir sem esperar que a lista abaixo termine. A
esteira existe justamente para isso: **produção só muda se os 3 gates
passarem**, então iterar de dentro da VPS é seguro.

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

### O que dá para continuar de dentro da VPS (não bloqueia o primeiro deploy)

| Pendência | Impacto se ficar como está | Onde mexer |
|---|---|---|
| Presença assimétrica: o **dono** não vê quem chegou na sede dele (só o visitante vê os outros visitantes) | Presença funciona, mas "pela metade" — nenhum erro, nenhuma tela quebrada | `src/features/world/WorldScreen.tsx` — plugar `usePresenca` como já está em `VisitaScreen.tsx` |
| Token de Realtime expira em 10 min sem renovar | Visita muito longa (>10 min na mesma sala) perde a presença até recarregar a página. O jogo continua inteiro | `src/features/world/presenca/usePresenca.ts` + `src/app/api/realtime-token/route.ts` |
| RLS nunca exercida (app sempre usa `service_role`) | Risco **não** de vazamento hoje (todo acesso passa por Server Action que já filtra por tenant), mas a rede de segurança do banco está desligada na prática | Testar com `anon key` (§7 item 3) antes de abrir para público amplo |
| `README.md` da raiz ainda é stub | Só documentação | `README.md` |
| Docs 01–07 desta pasta não existem | Só documentação — este README já cobre instalar/configurar/rodar/operar | `docs/deploy/` |

### O que só pode ser verificado NA VPS (nunca rodou aqui)

Nada disso é bug conhecido — é **caminho felizmente não testado**, porque não
existe Docker/Postgres/Realtime nesta máquina de desenvolvimento:

1. Os 5 containers subindo e ficando `healthy`.
2. As 17 migrations aplicando contra um Postgres real do zero.
3. Cadastro/login gravando de verdade no Postgres (não no JSON).
4. **Duas pessoas logadas ao mesmo tempo** e uma visitando a sede da outra.
5. Presença ao vivo abrindo socket com o JWT assinado pelo app.
6. Restore de backup (§7 item 7).

Ordem certa de conferir isso na VPS está no prompt da seção 6 — cole nele e o
agente executa e reporta os três comandos de verificação.

## 12. Próximos documentos desta pasta

- `02-CONFIGURAR.md` — cada variável em detalhe, como gerar cada segredo.
- `05-MULTIPLAYER-E-ESCALA.md` — presença ao vivo, teste com 100 usuários.
- `06-EXPORTAR-IMPORTAR.md` — empacotar o projeto pra enviar (aviso do `node_modules`).
- `07-DOCUMENTOS-E-LGPD.md` — a metodologia do Diagnóstico e a base legal.
- `docs/conhecimento/METODOLOGIA-DIAGNOSTICO.md` — o instrumento de avaliação
  em si, para revisão/assinatura do sócio coordenador do MBA antes do pitch
  (conteúdo de negócio, não de engenharia — fora do escopo deste documento).
