# Checkpoint — 2026-08-02 — bug crítico de login, bypass de RLS, deploy portátil

> Leia isto se uma sessão nova estiver retomando este trabalho (créditos
> acabaram, sessão caiu, ou é outro agente). Este arquivo é o "onde eu
> parei" — `AGENTS.md` e `docs/PROXIMA-TAREFA.md` continuam sendo o guia
> geral do projeto, mas apontam pra cá no topo.

## Estado no fim desta sessão — tudo commitado e no ar

Branch `integracao-deploy-vps`, **publicada no GitHub** (`git push` feito,
`origin/integracao-deploy-vps` = `HEAD`). Commits desta sessão, em ordem:

| Commit | O quê |
|---|---|
| `d140528` | `update.sh`/`rollback.sh` finalizados; fix de colisão de porta do Kong (8010) |
| `a26716c` | `update.sh` commitado sem `+x` — corrigido |
| `d1ae454` | **Bug crítico: login sempre falhava após cadastro** (`email_confirm: false` sem fluxo de confirmação) |
| `45effc7` | **Bypass crítico de RLS fechado** (view `negocios_publico` escrevível por `anon`) + robustece deploy pra clone limpo |

Deploy real rodando nesta VPS: `docker compose -f docker-compose.yml -f
docker-compose.supabase.yml`, app em `:3006` (3 réplicas + nginx), Supabase
self-hosted próprio (Kong em `:8010`). Gates verdes: `npm run typecheck &&
npm test && npm run build` (319 testes). Validado por Playwright real
(cadastro pelos 10 passos → painel → logout → login → painel) **depois**
de cada um dos dois fixes críticos.

## Os dois bugs críticos desta sessão (o "porquê" de tudo abaixo)

### 1. Login sempre falhava após cadastro (`d1ae454`)

`src/lib/auth/supabase-provider.ts` chamava `admin.createUser({
email_confirm: false })`, mas o produto não tem NENHUM fluxo de confirmação
de e-mail. Toda conta nova ficava presa "não confirmada" pra sempre;
`signInWithPassword` sempre recusava com `email_not_confirmed`, e o app
mostrava a mensagem genérica "e-mail ou senha incorretos". Fix: `email_confirm: true`.
As duas contas reais que já existiam presas nesse estado
(`admin@gmail.com`, `moderador@gmail.com`) foram reconfirmadas manualmente
via API admin — não precisam recriar conta.

### 2. Bypass CRÍTICO de RLS, exposto à internet (`45effc7`, migration `0036`)

Achado por auditoria independente (DBA Sênior, agente Opus). A view
`public.negocios_publico` (vitrine pública do mapa) não tinha
`security_invoker`, era dona de `postgres` (que ignora RLS por ter
`BYPASSRLS`) e era "auto-updatable". Com o `GRANT` de fábrica desta imagem
Postgres (`INSERT/UPDATE/DELETE` pra `anon`/`authenticated` em TODA
tabela — mais largo do que a migration `0033` testou/documentou), qualquer
pessoa com a **anon key** (pública por design, extraível do bundle do
navegador) conseguia, direto pelo Kong público (`:8010`), escrever
`nivel`/`nome`/etc. de **qualquer** negócio ou **apagar o tenant inteiro**
(cascata por 20+ FKs). Pré-autenticação, sem precisar estar logado.
Confirmado ao vivo antes do fix (`OPTIONS` mostrava `POST/PATCH/DELETE`
liberados; um `PATCH` de teste teria sido aceito) e depois do fix
(`PATCH` → `42501 permission denied`, leitura pública continua ok).

Fix: `supabase/migrations/0036_fecha_bypass_rls_grants_excessivos.sql` —
revoga o excesso de fábrica em todas as tabelas/views de uma vez, reabre só
as 2 exceções intencionais (`funcionarios_contratados` insert, `ofertas`
insert/update/delete), fixa `ALTER DEFAULT PRIVILEGES` pra não repetir em
objetos futuros. Também: `deploy/docker/update.sh` **nunca aplicava
migrations** (só `setup.sh` chamava `supabase-up.sh`) — corrigido, senão
esta mesma migration teria subido no código e nunca chegado no banco.

## O que mais foi corrigido nesta sessão (achados do DevOps Sênior, agente Opus)

Bloqueava a promessa de "só `git clone` + poucos comandos, em qualquer VPS
nova ou Windows 11":

- **Dockerfile**: `/app/data` nascia `root:root` — modo `GAMEHUB_DB=file`
  no Docker não conseguia gravar NADA (`EACCES`), com `/api/health`
  respondendo OK mesmo assim (só testa leitura). Corrigido (`chown` no
  build). **Mesmo corrigido, `GAMEHUB_DB=file` no Docker continua sendo só
  smoke-test de HTTP, nunca modo de operação real** — sem volume
  compartilhado, 3 réplicas = 3 bancos de arquivo diferentes, split-brain.
  Uso real é sempre `--with-supabase`.
- **`deploy/supabase-up.sh`**: se `node` faltasse/falhasse ao gerar
  segredos, `.env` ficava gravado vazio (0 bytes) — a próxima execução
  achava "já existe" e nunca regenerava, travando num loop sem pista.
  Corrigido (gera em `.tmp`, só move se der certo).
- **`deploy/docker/setup.sh`**: instala Node agora (faltava — 1-click numa
  VPS nova falhava com "node: command not found", porque
  `supabase-up.sh`/`gerar-chaves.mjs` precisa dele).
- **`deploy/docker/cloud-init.yaml`**: assumia usuário `ubuntu` fixo com
  erro engolido (`|| true`) — simplificado pra rodar 100% como root (é
  como o `runcmd` do cloud-init já executa, e `setup.sh` já suporta isso
  explicitamente). Adiciona UFW automático (libera 22/3006/8010).
- **Portas 8000 residuais** trocadas por 8010 em mais 2 lugares (default do
  compose do Supabase, mensagens de exemplo).
- **Novo `start.sh`/`start.bat`**: launcher único pro stack real (Docker +
  Supabase). `start.bat` abre o WSL sozinho no Windows — **não testado em
  hardware Windows real**, escrito com cuidado a partir de padrões WSL
  conhecidos, mas precisa de uma primeira validação real (ver pendências).
  `iniciar.sh`/`iniciar.bat` continuam existindo, à parte, como modo dev
  leve (sem Docker/Supabase).

**Pacote portátil já gerado e testado** (restore verificado nos dois
formatos): `/root/labdatadev-gamehub-2026-08-02.bundle` (git bundle
completo, 1019 KB) e `/root/labdatadev-gamehub-2026-08-02.tar.gz` (snapshot
do commit `d1ae454` — **um commit atrás do HEAD atual `45effc7`**, gerar de
novo se for usar o `.tar.gz`, o `.bundle` sempre reflete o HEAD de quando
foi gerado). Auditado sem segredo nenhum dentro.

## ⚠️ Pendências reais — não tratado ainda, registrado pra não esquecer

**Da auditoria do DBA (achados médios/baixos, não bloqueiam o pitch mas são reais):**

1. **Não existe fluxo de "esqueci minha senha".** Sem SMTP configurado, sem
   página de reset. Hoje, senha esquecida = conta perdida em definitivo (o
   recadastro com o mesmo e-mail é bloqueado). Único remédio é intervenção
   manual via `service_role` (mesma técnica usada pra reconfirmar as 2
   contas reais nesta sessão). Documentar como limitação conhecida do MVP
   ou implementar antes do pitch, se fizer sentido pro roteiro.
2. **`cadastrar()` não é transacional** (`src/features/auth/actions.ts`
   linhas ~180-215): se `auth.registrar()` ou `vincularMembro()` falhar no
   meio, pode sobrar negócio sem dono ou conta sem negócio vinculado — hoje
   sem usuários órfãos no banco (verificado), mas é risco latente.
3. `GAMEHUB_ADMIN_EMAILS=demarchiworking@gmail.com` não bate com nenhuma
   conta real cadastrada (`admin@gmail.com`, `moderador@gmail.com`) — o
   painel `/admin/eventos` está inacessível pra qualquer um hoje.

**Da auditoria do DevOps (não testado em hardware real):**

4. **`start.bat` nunca rodou num Windows de verdade.** Antes de prometer
   "1 clique" pro usuário final, validar numa máquina Windows 11 real com
   Docker Desktop + WSL2.
5. **O runbook de VPS nova (`docs/CHECKPOINT-...md` → ver seção abaixo)
   nunca rodou numa VPS Hostinger de verdade** — a validação foi um
   clean-room isolado NA MESMA máquina (clone fresco, portas diferentes),
   não uma segunda VPS real. É a prova mais rigorosa possível sem
   provisionar infraestrutura nova, mas não substitui o teste real.
6. **Herdado, não desta sessão, mas registrado em `docs/PROXIMA-TAREFA.md`
   (Épico 15):** a presença ao vivo (multiplayer) não conecta de verdade no
   deploy `labd-cloud` porque o Kong não está publicado por nenhum router
   Traefik. Não anunciar "metaverso ao vivo" no pitch até isso fechar —
   irrelevante pra uma VPS nova standalone (lá o Kong já é público direto
   por IP:porta, sem Traefik no meio), só importa se o destino for
   especificamente labd.cloud.

## Runbook — VPS Linux nova, do zero (validado em clean-room, ver ressalva acima)

```bash
# 1. na VPS nova, como root
apt-get update && apt-get install -y git curl ca-certificates
git clone --branch integracao-deploy-vps \
  https://github.com/DemarchiWorking/independent-lab.git ~/labdatadev-gamehub
cd ~/labdatadev-gamehub

# 2. sobe tudo (Docker + Node são instalados sozinhos se faltarem)
./start.sh
# (equivalente a: ./deploy/docker/setup.sh --with-supabase)

# 3. verificar
curl -fsS http://127.0.0.1:3006/api/health
# esperado: {"ok":true,...,"db":"supabase",...}
```

Ou, colando `deploy/docker/cloud-init.yaml` inteiro no campo "User
Data"/"Cloud-init" da Hostinger na hora de criar a VM — zero comando manual
depois, a VM sobe com o app já rodando (schema validado; lógica de shell
revisada; **não testado ponta a ponta numa VM real ainda**, ver pendência 5).

Atualizações seguintes: `./deploy/docker/update.sh` (gate typecheck+test
antes de tocar em produção, aplica migrations novas sozinho, tag
`:previous` automática). Rollback: `./deploy/docker/rollback.sh`.

## Runbook — Windows 11 local

Docker Desktop (com WSL2 engine + integração WSL ligada em Settings →
Resources → WSL Integration) é pré-requisito único. Depois:
`git clone` (ou usar o `.bundle`/`.tar.gz`) dentro do `~` do WSL (não em
`/mnt/c/...` — mais lento e perde bit de execução), e duplo-clique em
`start.bat`. Ver pendência 4 — ainda não validado em hardware real.

## Se os créditos acabarem NO MEIO desta sessão (antes deste checkpoint existir)

Não existe: os 2 agentes em background (DBA e DevOps) rodam dentro desta
sessão de Claude Code — se a sessão morrer antes de completarem, o
trabalho deles se perde (diferente dos commits git, que são permanentes).
Se uma sessão nova encontrar este arquivo mas os commits acima **não**
existirem no `git log`, é sinal de que a sessão caiu no meio — refaça a
partir da seção "Os dois bugs críticos" acima (a investigação já está
descrita, é só reaplicar).
