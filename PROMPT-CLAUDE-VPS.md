# Contexto para o Claude Code rodando DENTRO da VPS

> Você (humano) abre uma sessão do Claude Code por SSH na VPS e cola a seção
> **"PROMPT"** abaixo. O resto deste arquivo é o contexto que o agente lê
> sozinho — ele acompanha o código, não vive num plano fora do repositório.

---

## Estado do código nesta versão

**Pronto e validado localmente** (typecheck + testes + build verdes):

- App Next.js 15 multi-tenant completo: cadastro (10 perguntas), sede
  isométrica, gamificação (XP/moeda/degrau), Funcionários de IA, mapa
  regional, visita à sede do vizinho.
- **Documento de diagnóstico** (`src/features/documentos/`) — o produto real,
  com exportação `.docx` funcionando, verificada byte a byte.
- **LGPD mínimo**: consentimento explícito validado no servidor + página
  `/privacidade` com conteúdo real.
- **11 defeitos de produção corrigidos** (M-1 a M-11) — só apareciam com
  Supabase real, invisíveis com `GAMEHUB_DB=file`. Catálogo em
  `docs/deploy/README.md` §7.
- **Stack Supabase self-hosted em Docker** reduzido a 5 containers
  (`deploy/supabase/`) + script idempotente que aplica as 17 migrations
  (`deploy/supabase-up.sh`) + backup diário (`deploy/backup.sh`).
- **Presença ao vivo** com degradação garantida: sem `SUPABASE_JWT_SECRET`,
  a presença simplesmente não liga — sem erro, sem "0 online" falso, jogo
  inteiro funcionando.

**NUNCA rodou contra infraestrutura real** (não havia Docker na máquina de
desenvolvimento). Isto não é lista de bugs, é lista de caminhos a conferir:

1. 5 containers `healthy`.
2. 17 migrations aplicando num Postgres do zero.
3. Cadastro/login gravando no Postgres (não no JSON).
4. Duas pessoas logadas ao mesmo tempo, uma visitando a sede da outra.
5. Socket do Realtime abrindo com o JWT que o app assina.
6. Restore de backup.

**Pendências que NÃO bloqueiam o deploy** (podem ser feitas daqui, uma por
vez, com a esteira validando): tabela em `docs/deploy/README.md` §11.

---

## Regras não-negociáveis nesta máquina

1. `data/` e o volume do Postgres têm **cadastro real de empresa**. Nunca
   apagar, nunca `docker compose down -v`, nunca `git reset --hard` sem
   confirmar com o humano.
2. **Nunca pular os gates** (`npm run typecheck && npm test && npm run build`).
   `deploy.sh` já os roda — não contorne com `--no-verify` nem editando o
   script "só pra ir mais rápido".
3. Nunca apagar `deploy/supabase/.env` e rodar `supabase-up.sh` de novo — isso
   gera um `JWT_SECRET` novo e **derruba todos os logins**.
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
   - um visita a sede do outro pelo mapa e vê o pin/pill de presença
   - me diga exatamente o que apareceu, incluindo se a presença NÃO apareceu
     (é degradação esperada se SUPABASE_JWT_SECRET não estiver no .env —
     confira antes de chamar de bug)

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

Ciclo e lista de pendências priorizadas: `docs/deploy/README.md` §11.
Próximo card do backlog de produto: `docs/PROXIMA-TAREFA.md`.

Para pedir uma melhoria ao agente daqui, o formato que funciona:

```
Card: <o que quero>. Leia docs/deploy/README.md §11 e AGENTS.md.
Implemente só isso, rode typecheck+test+build, e só depois ./deploy/deploy.sh.
Se algum gate falhar, pare e me mostre o erro — não force o deploy.
```
