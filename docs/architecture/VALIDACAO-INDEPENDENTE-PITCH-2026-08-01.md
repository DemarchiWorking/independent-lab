# Validação independente — MVP, Replicação e Monetização (2026-08-01)

> **Natureza deste documento:** segunda opinião independente (validação
> cruzada), produzida sem coordenação com a auditoria NFR (BMAD
> `bmad-testarch-nfr`) que rodou em paralelo na mesma janela. Foco
> deliberadamente diferente do NFR: **completude de MVP para pitch**,
> **história de replicação ponta a ponta** e **veracidade da alegação de
> monetização**. Nada de código de produto foi alterado — só comandos de
> validação (`typecheck`/`test`/`build`, builds de sonda em `.next/`, um
> servidor `next start` isolado em `.claude/worktrees/.../probe-app` com
> `data/` próprio) e leitura.
>
> **Método:** todo veredito abaixo tem evidência de execução real
> (comando rodado + saída) ou `arquivo:linha`. Nada foi aceito por leitura
> de documentação.
>
> ⚠️ **Nota de concorrência:** por volta de 23:52 a auditoria NFR começou a
> **corrigir** o achado nº 1 desta validação (ver
> `src/lib/supabase/client.ts:10-22`, comentário que credita "achado de
> auditoria BMAD/NFR, 2026-08-01"). Ou seja: **dois agentes independentes
> chegaram ao mesmo bug por caminhos diferentes** — o NFR por leitura, esta
> validação por prova empírica em navegador. As evidências abaixo retratam
> o estado do repositório no momento da medição (23:41–23:52); a §1.3
> registra também o que **ainda falta** depois daquela correção.

---

## 1. MVP-completude para um pitch de alto nível de inovação

### 1.1 Gates obrigatórios (`typecheck` / `test` / `build`) — ⚠️ **funciona com ressalva grave**

Rodados por mim, nesta VPS, às 23:41 (log completo em background job `br87edavj`):

| Gate | Resultado | Evidência |
|---|---|---|
| `npm run typecheck` | ✅ **verde** | `TYPECHECK_EXIT=0` — `tsc --noEmit` sem saída |
| `npm test` | ✅ **verde** | `Test Files 26 passed (26)` · `Tests 307 passed (307)` · 2.10s |
| `npm run build` | ❌ **VERMELHO** | `BUILD_EXIT=1` |

O `build` falha assim:

```
Error occurred prerendering page "/sitemap.xml".
Error: listarNegociosPublicos: TypeError: fetch failed
Export encountered an error on /sitemap.xml/route: /sitemap.xml, exiting the build.
BUILD_EXIT=1
```

**Causa raiz (não é bug de código, é de ambiente — mas quebra o gate):** o
`.env` da raiz foi deixado, ao fim da sessão de hoje, com
`GAMEHUB_DB=supabase` + `NEXT_PUBLIC_SUPABASE_URL=http://kong:8000`.
`http://kong:8000` é um **nome de serviço interno da rede Docker** — não
resolve a partir do host. Como `/sitemap.xml` é prerenderizado em build time
e chama `listarNegociosPublicos()`, o build do host tenta falar com o
Supabase e morre.

Confirmação de que é só o ambiente: com `GAMEHUB_DB=file` forçado, o mesmo
build passa (`BUILD_EXIT=0`, 19 rotas emitidas, incluindo
`ƒ /api/localizacao/cep/[cep]` e `ƒ /world/visitar/[tenantId]`).

**Por que isso importa e não é cosmético:**

1. `AGENTS.md` regra 7 declara `npm run build` gate obrigatório, e
   `deploy/deploy.sh` (caminho PM2) roda `typecheck+test+build` **na VPS**
   antes de tocar em produção. Com o `.env` neste estado, esse gate falha
   sempre que o Supabase em Docker não estiver de pé — e agora **não está**
   (nenhum container `gamehub-*` roda; `docker ps` só mostra a stack
   `supabase-*` de 2 meses, do Company HQ, e nenhum Traefik).
2. O card `GH-CEP-01` marca `[x] npm run typecheck && npm test && npm run
   build verdes (307 testes)`. Os dois primeiros conferem; o terceiro, no
   estado atual do repo, **não**.

> Nota lateral, positiva: o `Dockerfile` **não** é afetado — `.dockerignore:6`
> exclui `.env` do contexto e o build da imagem não define `GAMEHUB_DB`, então
> cai no default `file` (`src/lib/db/index.ts:16`) e o prerender de
> `/sitemap.xml` usa o adapter de arquivo. O build da imagem passa.

---

### 1.2 CEP no fluxo real de cadastro (`GH-CEP-01`) — ✅ **confirmado, ponta a ponta**

Não é API isolada: está no caminho crítico do cadastro e **funciona num
navegador de verdade**.

Cadeia verificada por leitura:
`src/app/cadastro/page.tsx:44` (`<Wizard convite={contexto} />`) →
`src/features/onboarding/Wizard.tsx:157` (o campo CEP só aparece na pergunta
`cidade`) → `Wizard.tsx:73` (`fetch("/api/localizacao/cep/" + digitos)`,
debounce de 400 ms, dispara só com 8 dígitos) →
`src/app/api/localizacao/cep/[cep]/route.ts:20` →
`src/lib/localizacao/cep.ts:45` (ViaCEP, timeout 3 s, `null` em qualquer
falha).

**Prova de execução (Playwright + Chromium headless, contra um `next start`
de produção isolado na porta 3999):** cadastro completo pelo wizard,
digitando `14010100` no campo CEP:

```
[e2e] status CEP: ["✓ Centro, Ribeirão Preto — fora da área piloto, mas seu negócio entra mesmo assim."]
[e2e] cadastrado: Alfa Probe -> http://127.0.0.1:3999/painel
```

E o dado **persistiu** (adapter `file`, `probe-app/data/tenants/.../negocio.json`):

```json
{ "id": "230c7377eeaead2d7c639604", "nome": "Alfa Probe", "cep": "14010100",
  "endereco": { "cidadeSlug": "ribeirao-preto", "bairroSlug": "centro",
                "quarteiraoId": "q1", "lote": 1 } }
```

Ou seja: cidade **fora** das 6 do ICP foi aceita, o slug foi criado
(`ribeirao-preto`), o lote foi alocado, e o CEP bruto ficou guardado. Exatamente
o comportamento prometido no card. O caminho manual (dropdown + texto)
continua funcionando por baixo — validado no mesmo teste com o cadastro do
"Beta Probe" (sem CEP), que caiu em `mendes/centro`.

Detalhe de UX menor (não bloqueante): quando o CEP resolve uma cidade fora do
ICP, nenhum botão do dropdown fica destacado (a cidade não está na lista de
`opcoes`), mas o campo oculto carrega o valor e o botão "Continuar" habilita
— o texto laranja de confirmação cobre a lacuna. Funciona; só não é bonito.

---

### 1.3 Presença ao vivo / multiplayer (`GH-MULTI-02/03`) — ❌ **NÃO confirmado: a tela quebra no navegador**

Este é o achado mais importante desta validação.

**Está conectado numa tela real?** Sim, a fiação existe e está correta:
`src/features/world/VisitaScreen.tsx:23` importa `entrarNaSala`;
`VisitaScreen.tsx:88-94` chama no `useEffect`;
`src/app/world/visitar/[tenantId]/page.tsx:83-92` renderiza a tela passando a
identidade do visitante; os presentes viram avatares em
`VisitaScreen.tsx:182-192`. A tela é alcançável de três lugares
(`MapaScreen.tsx:197`, `InteracaoNpc.tsx:114`, `painel/page.tsx:263`) —
inclusive do passo 3 do roteiro de demo.

**Mas ela não funciona no navegador.** Prova empírica direta:

Reproduzi **exatamente** a configuração de build da imagem Docker
(`Dockerfile:35-36` fixa `NEXT_PUBLIC_SUPABASE_URL=https://build-placeholder.supabase.co`),
subi o `.next/standalone` resultante e naveguei com Chromium:

```
[e2e] A visita B em /world/visitar/9831c3d4288453e98f7a30d0
[e2e] === ERROS NA TELA DE VISITA (A) ===
[e2e] [ "PAGEERROR: Variável de ambiente NEXT_PUBLIC_SUPABASE_URL ausente.
           Veja .env.example e docs/ARQUITETURA-MULTITENANT.md" ]
[e2e] === TEXTO VISIVEL (A) ===
[e2e] Application error: a client-side exception has occurred while loading
      127.0.0.1 (see the browser console for more information).
```

Repetido com um terceiro jogador ("Gama Probe") entrando na **mesma sala**:
mesmo erro, e nenhum dos dois enxerga o outro (`A menciona 'Gama Probe'?
false` · `C menciona 'Alfa Probe'? false`).

**Mecânica exata do bug** (extraída do bundle emitido, não deduzida):

1. `canalUtil.supabaseConfigurado()` lia `process.env.NEXT_PUBLIC_SUPABASE_URL`
   com **acesso estático** → o Next inlina em build time. Com a var presente
   (sempre, na imagem Docker), vira `Boolean("...") === true`, e o
   minificador **elimina o early-return por dead-code**. No bundle emitido o
   guard simplesmente não existe:
   ```js
   useEffect(()=>(function(e,a,o){let r=(q||(q=(0,M.UU)(
       I("NEXT_PUBLIC_SUPABASE_URL"), I("NEXT_PUBLIC_SUPABASE_ANON_KEY"), ...
   ```
   (`.next/static/chunks/app/world/visitar/[tenantId]/page-*.js`)
2. `I` é o `exigir()` de `src/lib/supabase/client.ts`, que usa **chave
   dinâmica**: `function I(e){let a=b.env[e]; if(!a) throw Error("Variável de
   ambiente "+e+" ausente...")}`. O Next **não consegue** inlinar
   `process.env[nome]`.
3. No navegador, `b` é o shim de `process` do webpack (módulo `5704` →
   fallback `3965`), cujo `env` é literalmente `{}` (confirmado por
   `grep "env:{}"` nos chunks). Logo `b.env[...]` é `undefined` → **throw**
   dentro do `useEffect` → exceção não capturada → Next mostra
   "Application error: a client-side exception has occurred".

Confirmação adicional de que o valor nunca chega ao cliente: construí com
sentinelas (`NEXT_PUBLIC_SUPABASE_ANON_KEY=sentinelaanonkey123`) e
`grep -r sentinelaanonkey123 .next/static/` → **não encontrado**.

**Por que os testes e o k6 não pegaram:**

- `src/features/world/presenca/canal.test.ts` mocka `@/lib/supabase/client`,
  então testa a coreografia `subscribe`→`track` (que está certa) e nunca
  exercita a leitura de env no navegador.
- `deploy/loadtest/presenca-k6.js:90` conecta **direto** em
  `ws://127.0.0.1:8010/realtime/v1/websocket?apikey=...`, do lado servidor.
  Isso mede o Realtime (e o resultado de 1000/1000 conexões em
  `docs/architecture/CARGA-1000-SIMULTANEOS.md` é legítimo **para o
  servidor**), mas **não passa pelo bundle do cliente nem pela URL pública**
  — pode dar 100% de sucesso com a feature 100% quebrada no navegador. Vale
  registrar isso no próprio doc de carga como limitação do harness.
- A correção do Kong/`apikey` feita hoje era **necessária mas não
  suficiente**: o cliente nunca chegava a construir o `createClient`.

**Estado após a correção concorrente (NFR) — o que AINDA falta:** a
refatoração em curso (config injetada por prop de Server Component, ver
`src/features/world/presenca/canal.ts:1-40` e `client.ts:10-22`) resolve o
*throw*. Mas **não** faz a presença funcionar no deploy Docker, porque o
valor que o servidor tem em runtime é
`NEXT_PUBLIC_SUPABASE_URL=http://kong:8000`
(`docker-compose.supabase.yml:35`, escrito pelo `deploy/docker/setup.sh:119`)
— um nome de serviço Docker, **inalcançável de qualquer navegador**. O
próprio `docker-compose.supabase.yml:17-26` já previu isso por escrito. Para
a presença funcionar de verdade falta: expor o Kong num host público com
HTTPS (o que hoje depende do Traefik, que **não está rodando** — a rede
`traefik-public` existe órfã) e apontar a config para essa URL.

**Veredito:** ❌ — o recurso-manchete do pitch ("metaverso, gente ao vivo na
mesma sala") não funciona no caminho de deploy demonstrado hoje, e a tela em
que ele vive **quebra com tela de erro** em vez de degradar em silêncio.

---

### 1.4 Roteiro de demo (`docs/pitch/ROTEIRO-DEMO.md`) — ⚠️ **desatualizado em 4 pontos**

| # | Linha | Problema |
|---|---|---|
| 1 | `ROTEIRO-DEMO.md:38` | O **passo 3** manda "Clicar em Radiz Engenharia, *Visitar sede*" — é exatamente a rota `/world/visitar/[tenantId]` que quebra (§1.3). Do jeito que está, o minuto 1:30–2:30 da demo vira tela de erro na frente da banca. |
| 2 | `ROTEIRO-DEMO.md:57-58` | Afirma "nenhum passo depende de rede externa (o próprio produto não tem chamada de API externa nenhuma hoje)". **Falso desde hoje**: o campo CEP chama o ViaCEP. Degrada limpo (timeout 3 s → `null` → dropdown manual), mas a frase precisa mudar. |
| 3 | passo 1 (`:36`) | Não menciona o CEP. É a beat de inovação mais barata da demo ("digito meu CEP e o jogo me põe no bairro certo, com meus vizinhos reais") e está fora do script, com o roteiro ainda mandando escolher cidade/bairro na mão. |
| 4 | roteiro inteiro | **Não há nenhum passo de multiplayer/presença ao vivo.** O Épico 13/14 inteiro (a diferença entre "site gamificado" e "metaverso") não aparece nos 6 minutos. |

---

### 1.5 Algo pareceria quebrado a um investidor clicando pela primeira vez?

- 🔴 **Sim: `/world/visitar/[tenantId]`** — tela branca de erro (§1.3). É
  alcançável em 3 cliques a partir do mapa, do painel e da própria sala.
- 🟡 `/sitemap.xml` e `/robots.txt` — no estado `.env` atual do host, a rota
  de sitemap é a mesma que derruba o build; num deploy com o Supabase de pé
  ela responde, mas é o único ponto do app que faz I/O de banco em prerender.
- 🟢 Cadastro, `/painel`, `/hub`, mapa, `/n/[slug]` — sobreviveram ao
  percurso completo do Playwright (3 cadastros distintos, cada um com as 10
  perguntas + conta + consentimento) sem um único erro de console.

---

## 2. História de replicação de ponta a ponta

### 2.1 VPS/cloud nova, "1-click" via `cloud-init` — ❌ **não funcionaria colado no User Data**

`deploy/docker/cloud-init.yaml` promete, em `:9`, "Sem passo manual nenhum
depois: a VM sobe já com o app rodando". Lendo linha a linha, **dois
bloqueadores independentes** impedem isso numa VM Ubuntu limpa:

**Bloqueador A — `source` não existe em `/bin/sh` (linha 47).**
O cloud-init serializa os itens de `runcmd` num único script com shebang
`#!/bin/sh` (`cloudinit.util.shellify`). Em Ubuntu, `/bin/sh` é **dash**, que
não implementa o builtin `source` (só `.`). Sequência real numa VM Ubuntu:

```
source /etc/labdatadev-gamehub-cloud-init.env   → "source: not found"
# REPO_URL / REPO_BRANCH / REPO_DIR ficam VAZIOS
[ ! -d "" ]                                     → falso  (mas o clone roda mesmo assim
git clone --branch "" "" ""                        se a var estiver vazia) → erro
chown -R ubuntu:ubuntu ""                       → erro (mascarado por `|| true`)
cd "" && ...                                    → "can't cd to"
```
Resultado: a VM sobe com `git`/`curl` instalados e **nada mais**. Correção de
uma palavra: `. /etc/labdatadev-gamehub-cloud-init.env` (ou trocar por
`bash -c`).

**Bloqueador B — `setup.sh` sai com sucesso sem subir nada, na primeira
execução de uma VM sem Docker.** `deploy/docker/setup.sh:63-69`:

```bash
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo -E sh
  sudo usermod -aG docker "$USER"
  echo "[importante] Docker instalado agora — faça logout/login ..."
  exit 0            # ← sai ANTES de subir qualquer container
fi
```
Numa VM nova, `docker` nunca existe. Então mesmo com o bloqueador A
corrigido, o cloud-init instalaria o Docker, imprimiria "rode este script de
novo" — e **não há ninguém para rodar de novo**. `exit 0` faz o cloud-init
considerar sucesso, e o `final_message` (`:57-60`) anunciaria conclusão com o
app inexistente. O `curl .../api/health` sugerido falharia.
(Sob `runcmd` o script roda como **root**, onde o `usermod -aG docker $USER`
também é inócuo — root não precisa do grupo; o `exit 0` é gratuito nesse
contexto.)

Ponto positivo verificado: `REPO_URL=https://github.com/DemarchiWorking/independent-lab.git`
**está correto** — bate com o remote real (`.git/config:7`), apesar do nome
do repositório não ser "gamehub". `REPO_BRANCH=integracao-deploy-vps` também
é a branch correta (é onde a camada de deploy vive; ainda não fundida na `main`).

**Veredito:** ❌ — o caminho 1-click está bem desenhado e quase lá, mas hoje
não sobe o app. Duas correções pequenas (`.` em vez de `source`; laço de
`newgrp`/re-exec em vez de `exit 0`) resolvem.

### 2.2 Poucos comandos Docker Compose — ⚠️ **é realmente pouco, com 2 arestas**

Validado por mim agora:

```
docker compose -f docker-compose.yml -f docker-compose.supabase.yml \
               -f docker-compose.labd-cloud.yml config   → MERGE 3 ARQUIVOS: OK
```

A base (`docker-compose.yml`) é genuinamente autossuficiente e portátil — sem
rede externa, sem Traefik, sem Supabase de terceiro (`docker-compose.yml:5-8`),
com `app` + `nginx`, healthchecks reais, `ulimits`/`deploy.resources`
explícitos e réplicas parametrizadas por `GAMEHUB_APP_REPLICAS`. O
`setup.sh` faz a ordem certa sozinho (gera `.env` com `GAMEHUB_SECRET` na
primeira vez e **nunca regenera** — `setup.sh:82-94`; sobe o Supabase antes
do overlay; `--build` para servir também de atualização; espera saúde HTTP
real, não `sleep`). Isso é, de fato, **um comando**.

Arestas:

1. **Deriva de documentação:** `docker-compose.supabase.yml:9` manda usar
   `deploy/docker/setup.sh --standalone`. Essa flag **não existe** — o parser
   em `setup.sh:45-55` aceita só `--with-supabase`, `--labd-cloud`,
   `--replicas`, e qualquer outra coisa cai em
   `[ERRO] argumento desconhecido: --standalone; exit 1`. Quem seguir o
   comentário toma erro no primeiro comando.
2. **A rede externa exigida não existe até o Supabase subir.**
   `docker-compose.supabase.yml:37-40` referencia
   `gamehub-supabase_supabase-net` como `external: true`. Verifiquei:
   `docker network ls` **não tem essa rede** agora (a stack vendorizada foi
   derrubada depois da validação de hoje). Rodar os dois compose files
   manualmente, como o cabeçalho sugere, falha com "network declared as
   external, but could not be found" — só o `setup.sh` (que chama
   `deploy/supabase-up.sh` primeiro, `setup.sh:106`) sequencia certo. Não é
   bug, é uma armadilha para quem copia o comando do cabeçalho.
3. **Overlay `labd-cloud` não entrega HTTPS hoje** (já registrado pela
   sessão anterior; confirmo por medição): `docker network ls` mostra
   `traefik-public` existindo, mas `docker ps` **não tem nenhum container
   Traefik**. As labels de `docker-compose.labd-cloud.yml:38-48` ficam
   inertes, e como esse overlay também **remove a publicação de porta do
   host** (comentário em `:29-34`), aplicá-lo hoje deixaria o app sem
   nenhum ponto de entrada. O `setup.sh:178-182` avisa sobre DNS, mas não
   sobre "o Traefik precisa existir".

### 2.3 Local, sem infra (`iniciar.sh` / `iniciar.bat`) — ✅ **continua funcionando**

- Ambos criam `.env` a partir de `.env.example` quando falta
  (`iniciar.sh:29-32`, `iniciar.bat:31-37`), e o `.env.example` traz
  `GAMEHUB_DB=file` com `NEXT_PUBLIC_SUPABASE_URL=` **vazio**.
- **O campo `cep` não quebra o adapter `file`.** É opcional em toda a cadeia:
  `repository.ts:383` (`cep?: string` em `NovoNegocio`), `types.ts:95`
  (`cep?: string` em `Negocio`), `file-adapter.ts:362` (`cep: dados.cep` —
  `JSON.stringify` descarta `undefined`, não grava chave nula). Provado na
  prática: o "Beta Probe" cadastrado sem CEP gerou um `negocio.json` **sem a
  chave** `cep`, e o app leu normalmente.
- **Build em modo `file` passa** (rodei: `GAMEHUB_DB=file npx next build` →
  `BUILD_EXIT=0`, 19 rotas). O `npm run dev` que o `iniciar.sh` chama usa o
  mesmo código.
- Ressalva não medida: com `NEXT_PUBLIC_SUPABASE_URL` **vazio**, o guard de
  §1.3 deveria sobreviver (`Boolean("") === false` → early-return) e a tela
  de visita funcionar sem presença. Tentei fazer esse build de controle às
  23:53 e ele falhou por um motivo alheio — a refatoração concorrente do
  agente NFR estava a meio caminho
  (`Type error: Module '"@/lib/supabase/client"' has no exported member
  'supabaseAnon'`). Fica como **inferência de leitura de código, não
  medição** — vale reconfirmar depois que a correção pousar.
- Ressalva operacional: nesta VPS `./iniciar.sh` **não** cairia em modo
  `file`, porque o `.env` já existe e diz `GAMEHUB_DB=supabase`. Não é culpa
  do script; é o mesmo `.env` que quebra o build (§1.1).

---

## 3. Monetização — "só falta conectar o meio de pagamento"?

**Veredito: ⚠️ não. A afirmação subestima o que falta — mas o schema é bom e
o gateway é, de fato, o item central.**

Sendo justo com o que existe: `supabase/migrations/0029_assinaturas.sql` é
uma peça madura. Tabela `assinaturas` com `preco_centavos` (snapshot, não FK
para catálogo — raciocínio correto e documentado em `:13-19`), máquina de
estados `pendente/ativa/inadimplente/cancelada`, `stripe_customer_id` e
`stripe_subscription_id` já reservados (`:37-38`), RLS forçada com leitura só
do próprio tenant (`:52-57`), escrita **exclusivamente** por RPC
`security definer` com `search_path = ''` e `grant` só para `service_role`
(`:94-97`, `:131-136`) — que é exatamente a forma certa de um webhook
escrever. `registrar_assinatura` ainda valida que o funcionário pertence ao
tenant antes de inserir (`:76-81`). Isso não precisa mudar para o Stripe entrar.

**O que a documentação não conta:**

1. **Nenhuma linha de código da aplicação toca `assinaturas`.**
   `grep -rn "assinatura" src/` devolve **só** falsos-positivos: assinatura
   HMAC de sessão (`lib/auth/sessao.ts:40`), assinatura de token de convite
   (`features/growth/convite.ts:59`) e texto de UI
   (`features/financas/FinancasScreen.tsx:81`). As RPCs
   `registrar_assinatura` / `atualizar_status_assinatura` **nunca são
   chamadas**. Não existe método no contrato `GameRepository`
   (`src/lib/db/repository.ts` não menciona assinatura), nem mapeamento no
   `supabase-adapter.ts`, nem nada no `file-adapter.ts`.
2. **Contratar um Funcionário de IA não cria assinatura nenhuma.**
   `repo.contratarFuncionario` (`repository.ts:120-123`) grava em
   `funcionarios_contratados` e pronto. Nenhuma migration além da 0029
   referencia `assinaturas` (só a 0033, para conceder `select`). Ou seja:
   mesmo com o Stripe pronto, **não há hoje o evento de domínio que
   originaria uma linha de assinatura** — falta ligar contratação →
   `registrar_assinatura`.
3. **Nenhuma tela lê status de assinatura.** `FinancasScreen` calcula o custo
   mensal em R$ a partir do catálogo estático
   (`features/financas/calculo.ts:32`), não de `assinaturas`. Um cliente
   inadimplente teria a mesma tela de um adimplente.
4. **No modo `file` — o modo da demo e do Plano B — assinatura não existe
   como conceito.** Toda a monetização é Supabase-only.
5. **O pré-requisito que a própria punch-list declara ainda não foi
   construído.** `docs/PRODUTIZACAO-PUNCH-LIST.md:58` é explícito: Stripe
   "só depois de validar o fluxo de orçamento com gente de verdade
   (`GH-COM-01`)". Mas `0028_solicitacoes_orcamento.sql` também **não tem
   uma linha de código de aplicação** (`grep -rn "solicitacoes_orcamento\|
   solicitar_orcamento" src/` → vazio) e as rotas `/admin/orcamentos` e
   `/admin/moderacao` da §2 da punch-list não existem. O mesmo vale para
   `0030_moderacao_conteudo.sql`.

**Tradução honesta:** existem hoje **três migrations comerciais órfãs**
(0028 orçamento, 0029 assinaturas, 0030 moderação) — SQL de boa qualidade,
com RLS e RPCs corretas, e **zero** superfície de aplicação. O gateway
(Stripe Checkout + webhook HMAC) é sim o item central e o mais arriscado,
mas ele sozinho não fecha o ciclo: falta o método de repositório, o gancho na
contratação, a leitura de status na UI e o painel admin. Nada disso é
arquitetura nova — é ligar canos que já existem nas duas pontas — mas é
trabalho real, e o roteiro "só falta conectar o Stripe" faria alguém
subestimar em semanas, não em horas.

---

## Próximos cards de backlog (priorizados)

> Formato igual ao dos cards `GH-*` do Épico 14 em `docs/BACKLOG-PRODUTO.md`.

### GH-MULTI-04 — Presença ao vivo alcançável de um navegador real 🔴

| Campo | Valor |
|---|---|
| Prioridade | **P0 — bloqueia o pitch** |
| Esforço | M |
| Depende de | correção de `client.ts`/`canal.ts` em curso (agente NFR) |

**Descrição:** a correção em curso resolve o *throw* no cliente, mas o valor
que o app entrega ao navegador continua sendo `http://kong:8000`
(`docker-compose.supabase.yml:35`, escrito por `deploy/docker/setup.sh:119`) —
inalcançável de fora da rede Docker. Falta publicar o Kong num host com HTTPS
e apontar a config de presença para ele.

**Critérios de aceitação:**
- [ ] Kong exposto por um host público com TLS (via Traefik do Company HQ ou
      um `server` no `nginx.conf` do próprio gamehub — decidir, não default)
- [ ] Config de presença recebe essa URL pública, nunca `kong:8000`
- [ ] Teste de navegador de verdade: **duas** sessões distintas na mesma
      `/world/visitar/<id>` enxergam o avatar uma da outra, com screenshot
      anexado ao card (o teste que faltou hoje)
- [ ] Fallback verificado: sem config válida, a tela renderiza **sem**
      presença e **sem** erro de console (degradação limpa de verdade)
- [ ] Nota em `docs/architecture/CARGA-1000-SIMULTANEOS.md` registrando que
      o harness k6 conecta direto no Realtime e **não** cobre o caminho do
      navegador

---

### GH-OPS-07 — Destravar o gate `npm run build` na VPS 🔴

| Campo | Valor |
|---|---|
| Prioridade | **P0** |
| Esforço | P |
| Depende de | — |

**Descrição:** `npm run build` falha hoje na raiz do projeto
(`Error occurred prerendering page "/sitemap.xml" → listarNegociosPublicos:
TypeError: fetch failed`), porque o `.env` ficou com `GAMEHUB_DB=supabase` +
`NEXT_PUBLIC_SUPABASE_URL=http://kong:8000` (nome de serviço Docker, não
resolve do host). Isso quebra o gate obrigatório de `AGENTS.md` regra 7 e o
gate duplo de `deploy/deploy.sh`.

**Critérios de aceitação:**
- [ ] `npm run build` verde na VPS sem depender de container de pé
      (opções: `/sitemap.xml` com `dynamic = "force-dynamic"` — é a rota
      certa, sitemap não deveria ser prerender; ou `try/catch` em torno de
      `listarNegociosPublicos` no sitemap devolvendo só as rotas estáticas)
- [ ] `deploy/deploy.sh` e o CI continuam rodando o gate triplo
- [ ] `GH-CEP-01` corrigido no backlog (o `[x] npm run build verde` não
      procede no estado atual)

---

### GH-ESC-05 — Corrigir o cloud-init "1-click" para subir de verdade 🔴

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P |
| Depende de | — |

**Descrição:** dois bloqueadores impedem que `deploy/docker/cloud-init.yaml`
funcione colado no User Data de uma VM Ubuntu limpa: (a) `runcmd:47` usa
`source`, que não existe no `/bin/sh` (dash) em que o cloud-init executa o
script; (b) `deploy/docker/setup.sh:63-69` faz `exit 0` logo após instalar o
Docker, e no cloud-init não há segunda execução — a VM termina com Docker
instalado, app nenhum, e `final_message` anunciando sucesso.

**Critérios de aceitação:**
- [ ] `source` → `.` (ou `runcmd` explicitamente sob `bash -lc`)
- [ ] `setup.sh` continua o fluxo após instalar o Docker (re-exec via
      `sg docker -c "$0 $*"`, ou seguir direto quando `EUID -eq 0`) em vez
      de `exit 0`
- [ ] Validado numa VM Ubuntu descartável de verdade (não simulado):
      `curl http://127.0.0.1:3006/api/health` responde `{"ok":true,...}` sem
      um único comando manual
- [ ] `docker-compose.supabase.yml:9` corrigido — `--standalone` não existe,
      a flag é `--with-supabase`
- [ ] `setup.sh --labd-cloud` avisa (ou recusa) quando não há container
      Traefik rodando, já que o overlay remove a porta publicada do host

---

### GH-COM-03 — Ligar Stripe Checkout + webhook ao ciclo de assinatura 💰

| Campo | Valor |
|---|---|
| Prioridade | P1 — **card central da monetização** |
| Esforço | G |
| Depende de | GH-COM-01 (orçamento) validado com cliente real, conforme `PRODUTO-IA-FUNCIONARIOS.md` §7 |

**Descrição:** `0029_assinaturas.sql` deixou tabela, máquina de estados,
colunas `stripe_*` e as duas RPCs (`registrar_assinatura`,
`atualizar_status_assinatura`) prontas e restritas a `service_role` — mas
**nenhuma linha de aplicação as chama**, e contratar um Funcionário de IA não
cria assinatura nenhuma. Além do gateway, falta a superfície de aplicação
inteira.

**Critérios de aceitação:**
- [ ] `GameRepository` ganha `registrarAssinatura` / `atualizarStatusAssinatura`
      / `listarAssinaturas`, implementados no `supabase-adapter`; no
      `file-adapter`, no-op explícito e documentado (assinatura é
      Supabase-only, o modo demo não cobra)
- [ ] `contratarFuncionario` passa a criar a assinatura `pendente` com
      **snapshot** de `precoMensal` do catálogo em centavos (nunca releitura
      posterior — regra de `PRODUTIZACAO-PUNCH-LIST.md:39`)
- [ ] Stripe **Checkout** (não Elements — menor superfície de PCI) criando a
      sessão a partir da assinatura `pendente`
- [ ] Webhook validando HMAC do Stripe **antes** de chamar
      `atualizar_status_assinatura`; idempotente por `event.id`
- [ ] `FinancasScreen` e o painel do cliente leem status real de
      `assinaturas`, não o custo derivado do catálogo
      (`features/financas/calculo.ts:32`)
- [ ] 🪙 e R$ continuam sem se tocar em nenhuma tela (`AGENTS.md` regra 6)
- [ ] Nenhuma chave secreta do Stripe em `NEXT_PUBLIC_*`

**Regras de segurança:** escrita em `assinaturas` só por `service_role` via
RPC (já garantido pela 0029); webhook rejeita payload sem assinatura válida
antes de qualquer efeito colateral.

---

### GH-COM-01b — Superfície de aplicação das migrations comerciais órfãs

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | M |
| Depende de | — |

**Descrição:** `0028_solicitacoes_orcamento`, `0029_assinaturas` e
`0030_moderacao_conteudo` existem em SQL, com RLS e RPCs corretas, e **zero**
código de aplicação (`grep -rn "solicitacoes_orcamento\|moderar_conteudo\|
registrar_assinatura" src/` → vazio). As rotas `/admin/orcamentos` e
`/admin/moderacao` prometidas em `PRODUTIZACAO-PUNCH-LIST.md:45-56` não
existem. Como o Stripe (GH-COM-03) depende do fluxo de orçamento validado,
este card é o desbloqueador real da monetização.

**Critérios de aceitação:**
- [ ] Fluxo de solicitação de orçamento visível ao jogador (`GH-COM-01`)
- [ ] `/admin/orcamentos` e `/admin/moderacao` no mesmo padrão gated por
      `GAMEHUB_ADMIN_EMAILS` já usado em `/admin/eventos`
- [ ] Moderação antes de qualquer divulgação pública do mapa (pré-requisito
      de bom senso já registrado na punch-list)

---

### GH-PITCH-02 — Atualizar o roteiro de demo para o estado real do produto

| Campo | Valor |
|---|---|
| Prioridade | P1 |
| Esforço | P |
| Depende de | GH-MULTI-04 |

**Descrição:** `docs/pitch/ROTEIRO-DEMO.md` ficou defasado em 4 pontos: o
passo 3 leva à tela que quebra hoje; a linha 57-58 afirma que o produto não
tem chamada de API externa (o CEP tem); o CEP não aparece no passo 1; e não
existe nenhum passo de multiplayer — o Épico 13/14 inteiro está fora dos 6
minutos.

**Critérios de aceitação:**
- [ ] Passo 1 mostra o **CEP** ("digito meu CEP, o jogo me põe no bairro
      certo com meus vizinhos reais") — é a beat de inovação mais barata
      disponível e hoje está fora
- [ ] Novo passo de **presença ao vivo** (duas janelas/dispositivos na mesma
      sede, avatares se vendo) — só depois de GH-MULTI-04 fechar
- [ ] Correção da afirmação "nenhuma chamada de API externa"
- [ ] Roteiro inteiro percorrido de ponta a ponta **no ambiente da demo**,
      com evidência (o próprio roteiro já exige isso em `:18-19`; hoje isso
      teria pego o bug de §1.3)

---

### GH-OPS-08 — Decidir e executar o ponto de entrada HTTPS público

| Campo | Valor |
|---|---|
| Prioridade | P2 |
| Esforço | M |
| Depende de | — |

**Descrição:** não há container Traefik rodando nesta VPS (a rede
`traefik-public` existe como referência órfã), então
`docker-compose.labd-cloud.yml` não entrega HTTPS público — e, por remover a
porta publicada do host, aplicá-lo hoje deixaria o app **sem** ponto de
entrada. Decisão não tomada: subir o Traefik do Company HQ
(`/opt/company/docker-compose.yml`) ou terminar TLS no próprio Nginx do
gamehub. É pré-requisito de GH-MULTI-04 (o Realtime precisa de origem
`wss://` pública).

**Critérios de aceitação:**
- [ ] Decisão registrada (Traefik do HQ **ou** Nginx próprio), com o porquê
- [ ] DNS de `gamehub.labd.cloud` apontando para a VPS antes de qualquer
      tentativa de emissão Let's Encrypt
- [ ] `setup.sh --labd-cloud` falha rápido e claro se o Traefik não existir
