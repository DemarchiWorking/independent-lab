# Contexto para o Claude Code rodando DENTRO da VPS

> Você (humano) abre uma sessão do Claude Code por SSH na VPS e cola a seção
> **"PROMPT"** abaixo. O resto deste arquivo é o contexto que o agente lê
> sozinho — ele acompanha o código, não vive num plano fora do repositório.
>
> **Branch de deploy:** `integracao-deploy-vps`. Clone e continue nela:
> ```
> git clone -b integracao-deploy-vps https://github.com/DemarchiWorking/independent-lab.git ~/labdatadev-gamehub
> ```
> É a única branch com a camada Supabase/Docker. Todo commit de continuação
> (correção/integração feita na VPS) vai nesta mesma branch, até você decidir
> fundir na `main` pelo GitHub.

---

## Estado do código nesta versão

**App pronto** (rode `npm run typecheck && npm test && npm run build` para
confirmar): cadastro, sede isométrica, gamificação (XP/moeda/degrau),
Funcionários de IA, mapa regional, visita à sede do vizinho, presença ao vivo,
Mercado/Finanças, entregáveis dos agentes, benchmark regional, LGPD.

**Camada de deploy** (o que faz "clone e roda" ser verdade):
- `deploy/supabase/`: stack self-hosted em Docker reduzido a 5 containers
  (db/auth/rest/realtime/kong) + `gerar-chaves.mjs` + `kong.yml`.
- `deploy/supabase-up.sh`: aplica TODAS as migrations de `supabase/migrations/`
  em ordem, idempotente, + seed. Agnóstico à quantidade — aplica o que existir.
- `deploy/backup.sh`: backup/restore do Postgres.
- `deploy/vps-setup.sh`: instala Docker, sobe Supabase, alinha `.env`, PM2
  cluster, Nginx, HTTPS. Idempotente.
- `deploy/ecosystem.config.js`: PM2 cluster (3×), seguro só com
  `GAMEHUB_DB=supabase`.
- `deploy/nginx-*.template`: rate limit + proxy `api.<domínio>` → Kong.
- `src/app/api/health/route.ts`: healthcheck real (`{ok, db}` + 503 se banco
  fora) — é o que o `deploy.sh` usa para confirmar o deploy.

**Presença ao vivo (multiplayer):** usa a `ANON_KEY` direto no browser +
Supabase Realtime, com a RLS de `negocios` endurecida (GH-MULTI-00). O app
**não** assina JWT próprio — logo não há `SUPABASE_JWT_SECRET` no `.env` do
app; o `JWT_SECRET` vive só no stack Supabase. Se o Realtime cair, a presença
degrada em silêncio (sem "0 online" falso) e o resto do jogo segue inteiro.

**NUNCA rodou contra infraestrutura real** (não havia Docker na máquina de
desenvolvimento). Isto não é lista de bugs, é lista de caminhos a conferir na
VPS:

1. 5 containers `healthy`.
2. As migrations aplicando num Postgres do zero.
3. Cadastro/login gravando no Postgres (não no JSON).
4. Duas pessoas logadas ao mesmo tempo, uma visitando a sede da outra.
5. Socket do Realtime abrindo com a `ANON_KEY`.
6. Restore de backup.

---

## Regras não-negociáveis nesta máquina

1. `data/` e o volume do Postgres têm **cadastro real de empresa**. Nunca
   apagar, nunca `docker compose down -v`, nunca `git reset --hard` sem
   confirmar com o humano.
2. **Nunca pular os gates** (`npm run typecheck && npm test && npm run build`).
   `deploy.sh` já os roda — não contorne com `--no-verify` nem editando o
   script "só pra ir mais rápido".
3. Nunca apagar `deploy/supabase/.env` e rodar `supabase-up.sh` de novo — isso
   gera um `JWT_SECRET` novo, invalida a ANON/SERVICE key e **derruba todos os
   logins**.
4. Nunca expor a 8081 nem a 8000 direto (`deploy/ecosystem.config.js` sobe em
   `127.0.0.1` de propósito; só Nginx é público).
5. Um card por vez → gates verdes → deploy → verificar. Nunca 5 mudanças
   juntas.
6. `.env` nunca vai para o git (já no `.gitignore` — confira antes de
   `git add -A`).

---

## PROMPT (cole isto na sessão do Claude Code na VPS)

```
Você está numa VPS Hostinger operando o labdatadev gamehub.
Leia PROMPT-CLAUDE-VPS.md, AGENTS.md e docs/deploy/README.md inteiros antes
de qualquer coisa. Confirme comigo antes de QUALQUER passo destrutivo.

Objetivo: colocar (ou manter) o jogo no ar em produção com Supabase
self-hosted em Docker, com o mínimo de intervenção manual minha.

Faça nesta ordem:

1. git status e git pull --ff-only (nunca --force, nunca reset --hard sem
   eu confirmar).

2. PRIMEIRA VEZ:
     chmod +x deploy/*.sh iniciar.sh
     ./deploy/vps-setup.sh <meu-dominio> <meu-email>
   (me pergunte domínio/e-mail se eu não passei; confirme antes que o DNS de
   <meu-dominio> E de api.<meu-dominio> já aponta pro IP desta VPS — sem isso
   o certbot falha)
   JÁ RODOU ANTES:
     ./deploy/deploy.sh
     ./deploy/supabase-up.sh   # só se houver migration nova

3. Verifique de verdade, não assuma:
     pm2 status                                     # 3 processos "online"
     curl -fsS https://<dominio>/api/health          # "ok":true, "db":"supabase"
     docker compose -f deploy/supabase/docker-compose.yml ps   # 5 healthy

4. Teste o multiplayer de fato (é o item que nunca foi verificado):
   - crie dois cadastros na MESMA cidade, em duas janelas/navegadores
   - confirme que os dois ficam logados ao mesmo tempo (sessões independentes)
   - um visita a sede do outro pelo mapa e vê a presença
   - me diga exatamente o que apareceu, incluindo se a presença NÃO apareceu
     (degradação esperada se o container realtime não subir ou a ANON_KEY não
     estiver no .env — confira antes de chamar de bug)

5. Se algo falhar, leia os logs ANTES de tentar de novo:
     pm2 logs labdatadev-gamehub --lines 100
     docker compose -f deploy/supabase/docker-compose.yml logs --tail 100 <serviço>

6. NUNCA: git push --force · docker compose down -v (apaga todo cadastro
   real) · apagar deploy/supabase/.env · expor 8081/8000 direto · pular os
   gates de typecheck/test/build.
   Antes de qualquer mudança arriscada: ./deploy/backup.sh

Ao final: resumo curto do que mudou + a saída dos comandos do passo 3 e o
resultado do passo 4.
```

---

## Depois que estiver no ar — melhoria contínua

Ciclo completo: `docs/deploy/README.md` §11.
Próximo card do backlog de produto: `docs/PROXIMA-TAREFA.md`.

Para pedir uma melhoria ao agente daqui, o formato que funciona:

```
Card: <o que quero>. Leia docs/deploy/README.md §11 e AGENTS.md.
Implemente só isso, rode typecheck+test+build, e só depois ./deploy/deploy.sh.
Se algum gate falhar, pare e me mostre o erro — não force o deploy.
```
