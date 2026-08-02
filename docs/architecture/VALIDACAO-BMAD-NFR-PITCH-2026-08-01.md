---
stepsCompleted:
  [
    'step-01-load-context',
    'step-02-define-thresholds',
    'step-03-gather-evidence',
    'step-04-evaluate-and-score',
    'step-04e-aggregate-nfr',
    'step-05-generate-report',
  ]
lastStep: 'step-05-generate-report'
lastSaved: '2026-08-01'
workflowType: 'testarch-nfr-assess'
inputDocuments:
  - docs/BACKLOG-PRODUTO.md (Épico 14)
  - docs/architecture/CARGA-1000-SIMULTANEOS.md
  - docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md
  - docs/architecture/BMAD-MULTIPLAYER-VPS.md
  - AGENTS.md
---

# Auditoria de Evidência NFR — Épico 14 (Escala e Replicação) · Prontidão para o pitch Sebrae Startup Win

**Data:** 2026-08-01
**Escopo:** `GH-CEP-01`, `GH-ESC-01`, `GH-ESC-02`, `GH-ESC-03`, `GH-ESC-04` (trabalho não commitado no branch `integracao-deploy-vps`)
**Workflow:** `bmad-testarch-nfr` v5.0 (modo sequencial — 4 domínios auditados: segurança, performance, confiabilidade, escalabilidade)
**Meta de NFR sob avaliação:** demonstrar presença multiplayer ao vivo (Supabase Realtime) com 100–1000 jogadores simultâneos, de forma confiável, num pitch real.

> Esta auditoria **não roda testes novos nem CI** — audita a evidência que já
> existe (código, config, harness de carga, documentos) contra o objetivo
> declarado. Onde a evidência foi verificada empiricamente contra o artefato
> construído (imagem Docker, bundle cliente, containers), isso está marcado
> como **[verificado]**.

---

## 0. Veredito

# 🔴 NO-GO

**Motivo em uma frase:** no caminho de deploy que a própria sessão declarou
canônico (`deploy/docker/setup.sh --with-supabase --labd-cloud`), **o
navegador do jogador nunca consegue abrir o WebSocket de presença** — e, pior
que "não conecta", a tela de visita **lança exceção não tratada** no primeiro
render, porque o guard de degradação graciosa foi eliminado em build-time.
O bug do Kong (`GH-ESC-02`) era real e o fix está certo, mas ele destravou
apenas o trecho servidor↔Kong; o trecho **browser↔Kong nunca existiu no
caminho Docker**.

**Nuance importante e honesta:** isto **não invalida** o Épico 14. As três
causas somadas custam ~1–2h de trabalho e nenhuma exige redesenho
arquitetural. O que invalida é apresentar como está: hoje, ligar o projetor
em `https://gamehub.labd.cloud` e abrir duas abas na mesma sede não mostra
presença — mostra tela quebrada.

**Se o pitch NÃO precisar demonstrar presença ao vivo em ambiente hospedado**
(ex.: demo local com `npm run dev` + Supabase local, ou o caminho PM2 legado
que já configura tudo certo), o veredito muda para **GO-COM-RESSALVAS**, com
os achados N1–N9 abaixo registrados.

**Resumo do gate:** 1 achado **BLOQUEANTE CRÍTICO**, 1 **ALTO** acoplado ao
primeiro, 9 não-bloqueantes.
**Score ADR Quality Readiness:** **15/29** (<20/29 = lacunas significativas)
— puxado para baixo por uma única causa raiz (B1) que arrasta QoS/QoE e
Deployability junto.

---

## 1. Achados BLOQUEANTES

### 🔴 B1 — A presença ao vivo é inalcançável pelo navegador no caminho Docker (3 causas encadeadas)

**Severidade:** CRÍTICA · **Domínio:** QoS/QoE + Deployability + Confiabilidade
**Impacto:** a funcionalidade que o pitch existe para demonstrar não funciona,
e falha de forma visível (erro de tela), não silenciosa.

Três defeitos independentes se somam. Cada um sozinho já quebraria o recurso.

#### B1.a — `NEXT_PUBLIC_*` é injetado em runtime, mas o Next.js resolve em build-time

`Dockerfile:35-36` fixa placeholders no estágio `builder`:

```dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=https://build-placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=build-placeholder-anon-key
```

`deploy/docker/setup.sh:117-122` grava o valor real **depois**, no `.env`, e
`docker-compose.yml` o injeta via `env_file` — ou seja, em **runtime**.
Para código que roda no servidor isso funciona; para o bundle do navegador,
**não existe runtime** — o valor já foi congelado.

**[verificado]** Extraído do bundle cliente dentro da imagem
`labdatadev-gamehub:latest`, chunk
`.next/static/chunks/app/world/visitar/[tenantId]/page-7bd8941bc9d56490.js`:

```js
function I(e){let a=b.env[e];if(!a)throw Error("Vari\xe1vel de ambiente ".concat(e," ausente. ..."));return a}
...
useEffect(()=>(function(e,a,o){let r=(q||(q=(0,M.UU)(I("NEXT_PUBLIC_SUPABASE_URL"),I("NEXT_PUBLIC_SUPABASE_ANON_KEY"),...
```

Duas coisas a notar, e a segunda é a pior:

1. `I` é o `exigir()` de `src/lib/supabase/client.ts:12-20`. Ele acessa
   `process.env[nome]` com **chave dinâmica** — o DefinePlugin do Next.js só
   substitui acesso **estático** (`process.env.NEXT_PUBLIC_X`). Então, no
   navegador, `b.env` é o shim vazio do webpack: `I(...)` **sempre lança**.
2. O guard `if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return () => {}`
   (`canalUtil.ts:36`, chamado por `canal.ts:54`) **desapareceu do bundle da
   imagem**. Ele foi eliminado por dead-code elimination: o placeholder do
   Dockerfile o tornou estaticamente verdadeiro. Comparação direta com um
   build local sem placeholder, onde o guard ainda existe:
   `if(!y.env.NEXT_PUBLIC_SUPABASE_URL)return()=>{};` — na imagem de
   produção, essa linha simplesmente não está lá.

**Consequência exata:** `VisitaScreen.tsx:88-94` chama `entrarNaSala` num
`useEffect`. Na imagem Docker, o no-op protetor não existe mais, `supabaseAnon()`
é chamado, `exigir()` lança `Error: Variável de ambiente NEXT_PUBLIC_SUPABASE_URL
ausente` — **a degradação graciosa documentada em `canal.ts:45-47` foi
neutralizada exatamente no ambiente onde ela mais importa.** O comentário
"no-op silencioso" em `VisitaScreen.tsx:78-81` está factualmente incorreto
para o artefato de produção.

#### B1.b — Mesmo que chegasse ao navegador, `http://kong:8000` é irresolvível

`docker-compose.supabase.yml:35` e `setup.sh:119` definem
`NEXT_PUBLIC_SUPABASE_URL=http://kong:8000` — nome de serviço da rede Docker.
Nenhum navegador resolve isso. E, sob Traefik (`docker-compose.labd-cloud.yml`),
a página é servida por HTTPS: um WebSocket `ws://` a partir de origem `https://`
é bloqueado por mixed content antes mesmo do DNS.

O cabeçalho de `docker-compose.supabase.yml:17-26` **prevê exatamente este
problema** — mas o descreve no futuro ("o dia em que `GH-MULTI-02/03` precisar
de `supabaseAnon()` rodando no BROWSER..."). Esse dia já passou:
`GH-MULTI-03` está implementado e `VisitaScreen.tsx:89` chama `entrarNaSala`
hoje. **O comentário está desatualizado em relação ao código do mesmo repo.**

#### B1.c — Não existe rota pública para o Kong no caminho Docker (regressão vs. PM2)

O caminho PM2 legado resolve isto por completo, e o Docker perdeu os três
pedaços:

| Peça | `deploy/vps-setup.sh` (PM2, legado) | Caminho Docker (canônico) |
|---|---|---|
| Hostname público do Kong | `deploy/nginx-supabase.conf.template` → vhost `api.<domínio>` | **inexistente** — `nginx.conf` não tem `location /realtime`, `/auth` nem `/rest`; `docker-compose.labd-cloud.yml` só roteia `gamehub.labd.cloud` → nginx → app |
| `NEXT_PUBLIC_SUPABASE_URL` público | escrito no `.env` (linha 201) **antes** do `npm run build` (linha 215) | escrito **depois** do build da imagem → nunca entra no bundle |
| WebSocket sustentado | `proxy_read_timeout`/`send_timeout` 3600s + `Upgrade`/`Connection` (template, linhas 23-34) | **inexistente**; o `location /` do `nginx.conf` usa 60s — derrubaria presença ociosa a cada minuto se algum dia passasse por lá |
| TLS do endpoint de API | `certbot -d $DOMAIN -d $API_DOMAIN` (linha 275) | nenhum router Traefik para a API |

Além disso, `setup.sh:106` chama `./deploy/supabase-up.sh` **sem argumentos**
mesmo no modo `--labd-cloud`. Resultado: `SUPABASE_PUBLIC_URL=http://127.0.0.1:8000`
e `SITE_URL=http://127.0.0.1:8081` (`supabase-up.sh:52-53`) permanecem em
loopback, o que também deixa `GOTRUE_API_EXTERNAL_URL`/`GOTRUE_URI_ALLOW_LIST`
apontando para 127.0.0.1 em produção.

#### Por que o Épico 14 não pegou isto

O k6 conectou **direto no Kong** (`ws://127.0.0.1:8010/realtime/v1/websocket`,
cabeçalho de `presenca-k6.js:36`) — o mesmo trecho que o fix do
`hide_credentials` destravou. O caminho browser → Traefik/Nginx → Kong nunca
foi exercido. O próprio `CARGA-1000-SIMULTANEOS.md` §5 registra a lacuna
("Não testou o app real conectando `supabaseAnon()` do BROWSER"); o que faltou
foi perceber que **dentro dessa lacuna havia um bloqueador total, não só uma
imprecisão de medição** — exatamente o mesmo padrão do bug do Kong.

#### Correção sugerida (mínima, ~1–2h)

1. **Tirar a URL do build.** Passar `url`/`anonKey` como props de um Server
   Component para `VisitaScreen` → `entrarNaSala(sala, eu, aoMudar, { url, anonKey })`.
   Elimina a classe inteira de bug e mantém uma imagem Docker por ambiente.
   *(Alternativa mais rápida e pior: `ARG NEXT_PUBLIC_SUPABASE_URL` no
   Dockerfile + `--build-arg` no setup.sh — funciona, mas amarra a imagem ao
   domínio e mantém o guard sujeito a dead-code elimination.)*
2. **Publicar o Kong.** Router Traefik para `api.gamehub.labd.cloud` →
   container `kong` (espelhando `deploy/nginx-supabase.conf.template`:
   `Upgrade`/`Connection`, `proxy_read_timeout 3600s`), e passar o domínio:
   `./deploy/supabase-up.sh api.gamehub.labd.cloud gamehub.labd.cloud`.
3. **Consertar o guard.** Trocar `exigir()` por leitura estática, ou aceitar
   `undefined` e retornar no-op de verdade — para que, se a config faltar, a
   tela degrade em vez de quebrar.
4. **Validar do jeito certo:** duas abas de navegador real na mesma sede
   vendo uma à outra, **e** uma rodada de k6 apontando para
   `wss://api.gamehub.labd.cloud/realtime/v1/websocket` (não para o loopback).

---

### 🟠 B2 — `grant update` de tabela inteira em `negocios` vira vetor de trapaça no instante em que B1 for corrigido

**Severidade:** ALTA (bloqueante **condicional** — acoplado a B1)
**Domínio:** Segurança / Integridade de dados

`0033_grant_base_privileges_authenticated.sql:60`:

```sql
grant select, update on public.negocios to authenticated;
```

combinado com a policy `negocios_atualiza_proprio` (`0001_init.sql:147-150`),
que restringe **linha** mas não **coluna**:

```sql
create policy negocios_atualiza_proprio on public.negocios
  for update to authenticated
  using  (id = (select private.tenant_atual()))
  with check (id = (select private.tenant_atual()));
```

Hoje isso é inerte, porque **nenhum navegador alcança o PostgREST**. Mas a
correção de B1 expõe o Kong publicamente — e `kong.yml:43-62` roteia
`/rest/v1/` no **mesmo gateway** que o `/realtime/v1/`. A partir daí, qualquer
jogador logado (que possui um JWT `authenticated` legítimo, o dele) pode:

```
PATCH https://api.gamehub.labd.cloud/rest/v1/negocios?id=eq.<próprio_id>
{"xp": 999999, "moeda_virtual": 999999, "nivel": 99, "degrau_atual": 5}
```

e isso **é autorizado** — `key-auth`+`acl` do Kong deixam passar (a anon key
está no bundle por design), o GRANT permite, a RLS permite (é a própria linha).

Isso contraria diretamente a regra não-negociável nº 5 do `AGENTS.md`
("Progressão só muda via `repo.aplicarProgresso`") e a nº 4 (regra de negócio
server-side é a fonte de verdade). O trigger `negocios_registrar_progresso_log`
(`0031`) **registra** a alteração como `nao_rotulado` — detecta, não previne.

**Escopo real do dano:** trapaça na própria linha. **Não** há vazamento
cross-tenant — `0026` (view de fachada com colunas explícitas, sem
`security_invoker`) e `0033` estão corretos nesse ponto, e a coluna `cep` de
`0034` de fato não vaza. A auditoria confirma que a disciplina de RLS deste
projeto é boa; este é um buraco pontual, não sistêmico.

**Correção sugerida (uma migration, ~15 min):** trocar por GRANT de coluna —
Postgres suporta:

```sql
revoke update on public.negocios from authenticated;
grant update (nome, segmento, perfil_publico) on public.negocios to authenticated;
```

(ajustar a lista para exatamente as colunas que alguma tela client-side
realmente edita; hoje, pelo que a auditoria viu, `SupabaseRepository` usa
`supabaseAdmin()` para tudo — então a lista pode inclusive ser vazia, isto é,
`revoke` puro). O mesmo raciocínio vale para `grant select, update on
public.onboardings` (linha 63) — `onboardings` contém budget e score
comercial.

---

## 2. Achados NÃO-BLOQUEANTES (melhoria contínua)

### N1 — Os tetos de `cpus` somam 8,5 vCPU num host de 4 vCPU: não entregam o isolamento que prometem

**[verificado]** VPS: `nproc` = 4, `free -g` = 15 GB total / 10 GB disponíveis.

Soma dos `cpus`/`limits.cpus` declarados: db 2.5 + realtime 1.0 + kong 1.0 +
app 3×1.0 + nginx 1.0 = **8,5 vCPU**. O objetivo declarado no cabeçalho de
`deploy/supabase/docker-compose.yml:51-54` ("sem teto, um pico de carga do
gamehub pode roubar recurso dos outros produtos") **não é alcançado**: como a
soma excede o host, o gamehub sozinho pode ocupar 100% da CPU e ainda estar
"dentro dos limites". Tetos são limites por container, não um orçamento
agregado.

O orçamento de **RAM**, esse sim, fecha: ~6,5 GB de tetos contra 10 GB
disponíveis. É a CPU que está sobrecomprometida.

*Sugestão:* se o objetivo é blast radius, usar `cpu_shares` (peso relativo) ou
baixar os tetos para somarem ≤ 2,5–3 vCPU. Como o pitch é uma demo de dezenas
de jogadores, não é urgente — mas o comentário no arquivo promete uma garantia
que a config não dá.

### N2 — `max_connections=200` sem ajustar `work_mem`/`shared_buffers` num container de 3 GB

`deploy/supabase/docker-compose.yml` sobe `max_connections` de ~100 para 200 e
o `mem_limit` do `db` para 3g. Não há ajuste correspondente de `shared_buffers`
nem `work_mem`. 200 backends com `work_mem` default, sob queries concorrentes,
podem estourar o `mem_limit` → OOM-kill do container do Postgres.

O k6 **não exercitou este caminho**: presença Realtime não abre uma conexão
Postgres por jogador. O número de 200 é dimensionamento por cálculo, e o
próprio cabeçalho do arquivo admite isso ("NÚMERO NÃO VALIDADO POR CARGA
AINDA"). Correto ter documentado; falta o teste que o valide.

### N3 — Degradação de latência em 1000 VUs: aceitável para o pitch, mas o número real ainda é desconhecido

`CARGA-1000-SIMULTANEOS.md` mede 3ms (100/500 VUs) → 258ms médio / 310ms p95
(pico 10,5s) em 1000 VUs, 0% de falha. **Para o pitch isso é irrelevante**: a
demo terá dezenas de conexões, região onde a medição mostra 3ms e zero
degradação. Não é risco de pitch.

O que **é** risco é a narrativa: o documento é honesto (§4, §5) ao dizer que
não isolou a causa e que usou `vsn=1.0.0` (JSON) em vez do protocolo binário
`2.0.0` do client real, de um único processo k6. Traduzindo para o pitch:
**"testado até 1000 conexões sintéticas de um cliente único, em ambiente
local"** é a afirmação defensável. "Suporta 1000 jogadores simultâneos" **não
é** — não foi medido com o client real, nem através da rota pública (que,
conforme B1, nem existe). Recomendo alinhar o discurso do pitch a isto.

### N4 — O "1-click" não é 1 click numa VPS nova

`deploy/docker/setup.sh:63-69`: se o Docker não estiver instalado, o script
instala, imprime "faça logout/login antes de rodar de novo" e faz `exit 0`.
Numa VM nova via `deploy/docker/cloud-init.yaml` (que roda uma vez só), o
resultado é: VM com Docker instalado e **nenhuma aplicação subida**, com
`cloud-init` reportando sucesso. É preciso um SSH manual para rodar o script
de novo.

Somado a isso: `cloud-init.yaml:37` clona
`https://github.com/DemarchiWorking/independent-lab.git` sem token — se o repo
for privado, o `git clone` falha e o `runcmd` segue adiante sem app. E nem o
cloud-init nem o Terraform (`GH-ESC-04`: `validate`/`plan`, nunca `apply`)
foram executados ponta a ponta.

*Sugestão de 3 linhas:* após instalar o Docker, re-executar via
`exec sg docker -c "$0 $*"` em vez de `exit 0`.

**Na VPS atual (labd.cloud) isto não morde** — o Docker já está instalado, e o
`setup.sh` segue direto. O problema é só na "VPS nova", que é justamente o
caso de uso que `GH-ESC-04` promete.

### N5 — `GAMEHUB_DB=file` + 3 réplicas = dados divergentes (o caminho "smoke test" documentado está quebrado)

`file-adapter.ts:48` grava em `process.cwd()/data`. `docker-compose.yml` não
monta volume para o serviço `app` e sobe `replicas: 3` por default. Ou seja,
o comando que o próprio `setup.sh:18` documenta como
`./deploy/docker/setup.sh  # GAMEHUB_DB=file, sem Postgres — smoke test rápido`
produz **três bancos de arquivo independentes** atrás de um round-robin de
Nginx: quem se cadastra na réplica 1 não existe na réplica 2, e tudo se perde
no próximo `--build`.

Serve para checar que o container sobe; não serve para nenhuma demo. *Sugestão:*
forçar `GAMEHUB_APP_REPLICAS=1` quando `GAMEHUB_DB=file`, ou montar volume
compartilhado, ou trocar o texto do cabeçalho para deixar explícito o limite.

### N6 — Porta 3006 publicada em `0.0.0.0` mesmo sob Traefik, e a VPS não tem firewall de host

`docker-compose.yml:101` publica `0.0.0.0:${GAMEHUB_HTTP_PORT:-3006}:80`, e o
overlay `labd-cloud` **não a remove** (merge de Compose soma; o comentário nas
linhas 29-34 reconhece isso). **[verificado]** `ufw` ausente nesta VPS, e as
regras de iptables do Docker contornariam `ufw` de qualquer forma. Resultado:
a app fica acessível em HTTP puro pelo IP:3006, contornando o redirect HTTPS
do Traefik.

Mitigação já existente e não intencional: o cookie de sessão é
`secure: NODE_ENV === "production"` (`sessao.ts:30`), então o login por essa
porta simplesmente não persiste — **não há vazamento de cookie em texto
claro**. E o padrão é consistente com o resto da frota (3002/3003/3004/3005 já
publicam em `0.0.0.0`). Risco baixo, mas é superfície gratuita. *Sugestão:*
`127.0.0.1:${GAMEHUB_HTTP_PORT}:80` no overlay `labd-cloud`.

### N7 — DR: script de backup existe, mas nada o agenda e o restore nunca foi ensaiado

`deploy/backup.sh` está bem feito (`pg_dump -Fc`, retenção, gancho
`BACKUP_OFFSITE_CMD`) e o próprio cabeçalho diz "**Ensaie o restore ANTES da
semana do pitch, não durante**". A auditoria confirma que: (a) nenhum cron é
instalado por `setup.sh` nem por `supabase-up.sh`; (b) `BACKUP_OFFSITE_CMD`
não tem valor default, então por ora o dump vive só na mesma VPS que ele
deveria proteger; (c) não há registro de um restore ensaiado.

Somado à decisão do 3º Postgres (N8), são agora **três rotinas de backup
distintas** na mesma máquina — exatamente o custo operacional que
`DBA-ARQUITETURA-ESCALA-2026.md` §2 previu.

### N8 — O 3º Postgres na VPS compartilhada: decisão defensável, com um custo que precisa estar no discurso

A escolha (Supabase próprio vendorizado ao lado dos de Company HQ e V4MOS)
contraria a recomendação de `DBA-ARQUITETURA-ESCALA-2026.md` §2, mas a
auditoria a considera **a decisão certa para este momento**, e por motivos que
o próprio `docker-compose.labd-cloud.yml:54-72` já documenta bem: as 33
migrations assumem o schema `public`, que v4mos/labdatadev provavelmente já
ocupam no cluster do Company HQ; adaptá-las não é um `sed`. E o benefício de
blast radius isolado, na véspera de um pitch, é maior que o de operação
unificada.

**[verificado]** o recurso comporta: 10 GB de RAM livre contra ~6,5 GB de
tetos, 122 GB de disco livre, load average 0.9 em 4 vCPU.

Os custos reais a assumir conscientemente: (a) três rotinas de backup/DR
(N7); (b) três Postgres competindo pelo page cache dos mesmos 15 GB;
(c) CPU sobrecomprometida (N1). Para uma demo de dezenas de jogadores, nenhum
deles morde. Para "1000 jogadores todo dia", todos mordem — e a revisão da
decisão, como o próprio doc §2 diz, é quando houver cliente pagante.

**Não é um achado bloqueante nem um descuido — é um trade-off consciente e bem
documentado.** Vale mencionar no pitch apenas se perguntarem sobre resiliência.

### N9 — Documentação interna já divergente do código (3 pontos)

- `AGENTS.md` § "Operando na VPS (produção)" ainda afirma **"Arquitetura:
  Nginx → PM2 (`next start`) → app. Sem Docker — deliberado"** e instrui a
  rodar `./deploy/vps-setup.sh`. O Épico 14 inverteu isso. Como o `AGENTS.md`
  é carregado automaticamente em toda sessão de agente neste diretório, é a
  divergência mais cara de todas — a próxima sessão vai ler a orientação
  errada primeiro.
- `docker-compose.supabase.yml:22` fala de `GH-MULTI-02/03` no futuro; já
  está implementado (ver B1.b).
- Vários arquivos do Épico 14 (`deploy/supabase/docker-compose.yml:35`,
  `nginx.conf:7`, `setup.sh:5`, `CARGA-1000-SIMULTANEOS.md:1`) rotulam o
  trabalho como "Épico 13", enquanto `docs/BACKLOG-PRODUTO.md:2137` o registra
  como **Épico 14**. Cosmético, mas confunde rastreabilidade.

---

## 3. O que está sólido (registrar, para não regredir por engano)

Auditoria não é só achar defeito. Estes pontos foram verificados e estão
corretos — não mexer neles em nome das correções acima:

- **Fix do Kong (`GH-ESC-02`)** — o diagnóstico e a correção estão certos, e o
  raciocínio de por que `hide_credentials: false` **só** em `realtime-v1` não
  abre superfície nova (o portão continua sendo `key-auth`+`acl`) está
  correto. Foi um achado de alto valor.
- **Disciplina de RLS** — `0026` (view de fachada com colunas explícitas, sem
  `security_invoker`, com a justificativa escrita para ninguém "consertar"
  depois) e `0033` (GRANT ≠ RLS; verbo mínimo por tabela; `alter default
  privileges` para migrations futuras) são trabalho de qualidade acima da
  média. B2 é a exceção pontual, não o padrão.
- **`GH-CEP-01`** — `cep.ts` valida `^\d{8}$` **antes** de qualquer requisição
  de rede (sem SSRF), tem `AbortController` com timeout de 3s, degrada para
  `null` em toda falha, e a rota `api/localizacao/cep/[cep]` herda o rate
  limit `gamehub_geral` (20r/s) do `nginx.conf`. A coluna `cep` de `0034` é
  privada de fato — `negocios_publico` lista colunas explicitamente e não a
  inclui. Nenhuma ressalva.
- **Segredos** — `.env` e `deploy/supabase/.env` com `chmod 600` e cobertos
  pelo `.gitignore` (o padrão `.env` sem barra inicial pega qualquer nível);
  `.tfstate`/`.tfvars` ignorados, `.terraform.lock.hcl` versionado (correto);
  nenhuma chave hardcoded em `presenca-k6.js` (vem de `__ENV`); nenhum segredo
  no `Dockerfile` (só placeholders). O Postgres **não** publica porta.
- **`ulimits.nofile` e `resolver 127.0.0.11`** — dois achados reais de rodar de
  verdade, ambos com causa raiz correta. O trade-off do keepalive perdido está
  documentado com honestidade.
- **Honestidade metodológica de `CARGA-1000-SIMULTANEOS.md` §5** — a seção "o
  que NÃO cobri" é o motivo pelo qual esta auditoria conseguiu ir direto ao
  ponto. Preservar esse hábito.

---

## 4. Findings Summary — ADR Quality Readiness Checklist

| Categoria | Critérios | Status | Observação |
|---|---|---|---|
| 1. Testability & Automation | 3/4 | ⚠️ CONCERNS | 307 testes + typecheck/build como gate + harness k6; zero E2E de navegador no fluxo do pitch (é onde B1 mora) |
| 2. Test Data Strategy | 2/3 | ⚠️ CONCERNS | `seed.sql` idempotente + `seed-demo` contra Postgres real; dados de carga 100% sintéticos |
| 3. Scalability & Availability | 3/4 | ⚠️ CONCERNS | Réplicas + pool + DNS dinâmico medidos de verdade; tetos de CPU sobrecomprometidos (N1); `db` sem HA |
| 4. Disaster Recovery | 1/3 | ⚠️ CONCERNS | `backup.sh` bom; sem agendamento, sem offsite default, restore nunca ensaiado (N7) |
| 5. Security | 2/4 | ⚠️ CONCERNS | RLS/GRANT/segredos/Kong sólidos; B2 (GRANT de coluna) + N6 (porta pública, sem firewall) |
| 6. Monitorability | 2/4 | ⚠️ CONCERNS | Healthcheck em todo container + rotação de log; zero métricas, zero alerta, zero uptime monitor |
| 7. QoS & QoE | 1/4 | ❌ FAIL | B1 — degradação graciosa neutralizada em build-time; recurso principal quebra visivelmente |
| 8. Deployability | 1/3 | ❌ FAIL | B1.c (artefato entregue mal configurado para o recurso principal) + N4 (1-click ≠ 1 click) + N5 |
| **Total** | **15/29** | **❌ FAIL** | <20/29 = lacunas significativas — puxado por uma causa raiz única |

---

## 5. Ações recomendadas

### Imediatas — antes de considerar isto "a melhor versão final" (~2h)

1. **B1.a** — remover a dependência de `NEXT_PUBLIC_*` em build-time no
   caminho do navegador (props de Server Component para `entrarNaSala`), e
   consertar o guard para degradar de verdade em vez de lançar. *Validação:*
   grep no bundle da imagem confirmando que a URL não está inlinada e que o
   early-return existe.
2. **B1.c** — router Traefik para o Kong em `api.gamehub.labd.cloud`
   (WebSocket + `read_timeout` longo) e `supabase-up.sh` chamado **com** os
   domínios a partir do `setup.sh --labd-cloud`. *Validação:* `curl -i` de
   handshake retornando 101 **pelo domínio público**, não por loopback.
3. **B2** — migration `0035` trocando o `grant update` de tabela por GRANT de
   coluna (ou `revoke` puro) em `negocios` e `onboardings`. *Validação:*
   `PATCH` de `xp` com JWT `authenticated` real retornando erro de permissão.
4. **Teste de aceitação do pitch, feito uma vez de ponta a ponta:** dois
   navegadores reais, mesma sede, `https://gamehub.labd.cloud`, cada um vendo
   o avatar do outro aparecer e sumir. **Nada substitui isto** — é a mesma
   lição que o bug do Kong já ensinou nesta mesma sessão.
5. **N9** — corrigir a seção "Operando na VPS" do `AGENTS.md` antes de commitar
   (custo ~5 min, e evita que a próxima sessão parta da arquitetura errada).

### Curto prazo (pós-pitch)

- N5 (réplicas × modo `file`), N4 (re-exec após instalar Docker), N7 (cron de
  backup + `BACKUP_OFFSITE_CMD` + um restore ensaiado), N6 (bind em loopback).
- N2: validar `max_connections=200` com carga que realmente abra conexões
  Postgres, com `work_mem`/`shared_buffers` ajustados ao `mem_limit` de 3 GB.

### Backlog

- N1 (orçamento de CPU agregado via `cpu_shares`), N3 (isolar a causa da
  degradação 500→1000 e repetir a medição com o protocolo binário real, pela
  rota pública), monitorabilidade (métricas + alerta no `realtime`/`db`).

---

## 6. Plano B para o dia do pitch (mitigação de risco, independente das correções)

Ponto único de falha real: **um** container Postgres, sem réplica. Se ele cair
durante a apresentação, `supabaseAdmin()` lança e as telas viram erro 500 —
não há fallback automático. `restart: unless-stopped` + healthcheck o trazem
de volta em ~10–30s, mas isso é uma eternidade em cima de um palco.

Recomendação: manter a instância `GAMEHUB_DB=file` já rodando na porta 3005
como rota de fuga ensaiada (URL de reserva aberta numa aba, dados de demo
pré-semeados), e fazer um ensaio completo — incluindo `docker compose restart
db` no meio — pelo menos 48h antes.

---

## Gate YAML

```yaml
nfr_assessment:
  date: '2026-08-01'
  epic: 'Épico 14 — Escala e Replicação'
  feature_name: 'Presença multiplayer 100-1000 simultâneos (pitch Sebrae Startup Win)'
  adr_checklist_score: '15/29'
  categories:
    testability_automation: CONCERNS
    test_data_strategy: CONCERNS
    scalability_availability: CONCERNS
    disaster_recovery: CONCERNS
    security: CONCERNS
    monitorability: CONCERNS
    qos_qoe: FAIL
    deployability: FAIL
  overall_status: FAIL
  verdict: NO-GO
  critical_issues: 1 # B1
  high_priority_issues: 1 # B2
  medium_priority_issues: 4 # N1, N2, N5, N7
  concerns: 9
  blockers: true
  evidence_gaps: 3 # E2E de navegador; carga pela rota pública; restore de DR
  recommendations:
    - 'B1: desacoplar NEXT_PUBLIC_SUPABASE_URL do build + publicar o Kong via Traefik com WebSocket'
    - 'B2: GRANT de coluna (ou revoke) em negocios/onboardings antes de expor o /rest/v1 publicamente'
    - 'Validar com dois navegadores reais na mesma sede pelo domínio público antes de declarar pronto'
```

---

## Artefatos relacionados

- Backlog: `docs/BACKLOG-PRODUTO.md` § "Épico 14"
- Carga medida: `docs/architecture/CARGA-1000-SIMULTANEOS.md`
- Decisão de infra: `docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md`
- Arquitetura de presença: `docs/architecture/BMAD-MULTIPLAYER-VPS.md`
- Evidência de código auditada: `Dockerfile`, `docker-compose.yml`,
  `docker-compose.supabase.yml`, `docker-compose.labd-cloud.yml`, `nginx.conf`,
  `deploy/docker/setup.sh`, `deploy/docker/cloud-init.yaml`,
  `deploy/supabase/docker-compose.yml`, `deploy/supabase/kong.yml`,
  `deploy/supabase-up.sh`, `deploy/vps-setup.sh`, `deploy/backup.sh`,
  `deploy/nginx-supabase.conf.template`, `deploy/loadtest/presenca-k6.js`,
  `deploy/terraform/`, `.github/workflows/deploy.yml`, `.gitignore`,
  `src/lib/supabase/client.ts`, `src/features/world/presenca/canal.ts`,
  `src/features/world/presenca/canalUtil.ts`, `src/features/world/VisitaScreen.tsx`,
  `src/lib/localizacao/cep.ts`, `src/app/api/localizacao/cep/[cep]/route.ts`,
  `src/lib/db/file-adapter.ts`, `src/lib/auth/sessao.ts`,
  `supabase/migrations/0001`, `0026`, `0031`, `0033`, `0034`
- Evidência empírica: bundle cliente extraído da imagem
  `labdatadev-gamehub:latest`; `docker ps`/`free`/`nproc`/`ss` na VPS

---

**Auditoria NFR gerada por:** `bmad-testarch-nfr` v5.0 (Master Test Architect)
**Data:** 2026-08-01

<!-- Powered by BMAD-CORE™ -->
