# Estado do Projeto — snapshot para continuar

> **Última atualização:** 2026-07-28 (seção `GH-ATR-03` em §3.1 — o resto do
> arquivo é de 2026-07-27 e não reflete o Épico 11, ver nota de processo em
> §3.1). Leia este documento **primeiro** ao retomar o trabalho — ele diz o
> que está pronto, o que mudou de direção, e por onde continuar. Detalhes
> técnicos ficam nos docs linkados, não aqui.

---

## 1. O pivot (o mais importante para entender o produto)

O gamehub deixou de ser só "marketplace de serviços de TI gamificado" e
ganhou um produto central e vendável:

> **Funcionários de IA** — agentes Claude configurados como cargos
> recorrentes (Documentador, Social Media, Editor de Vídeo, Comercial/SDR)
> que empresários regionais **contratam por assinatura** dentro do hub.

Leia **[`PRODUTO-IA-FUNCIONARIOS.md`](PRODUTO-IA-FUNCIONARIOS.md)** para o
contexto completo do produto. **Esse produto já está construído** (ver §2).

Objetivo atual: **MVP v1 para pitch** — apresentação num projeto do Sebrae
sobre gamificação e inovação em empreendedorismo/PMEs regionais.

## 2. O que está pronto e validado (não precisa refazer)

### App funcional (`npm run dev`, porta 8081 — ou duplo-clique em `iniciar.bat`/`iniciar.sh`)
- ✅ Cadastro em 10 perguntas (`/cadastro`) → cria tenant + aloca lote no mapa
- ✅ Login/sessão (`/entrar`) — cookie httpOnly assinado
- ✅ Painel de negócio (`/painel`) — escada de valor, vizinhos, recomendações
- ✅ Hub jogável (`/hub`) — HUD real, missão real, mapa isométrico real
- ✅ Marketplace (`/marketplace`) — jobs de TI (mock, mas visual completo)
- ✅ Árvore de parcerias (`/parcerias`) — hex tree de serviços
- ✅ Mapa regional isométrico — cidade→bairro→quarteirão→lote, com vizinhos reais
- ✅ **Equipe de IA (`/hub` → aba "Equipe IA")** — os 4 cargos do catálogo,
  contratação real por tenant, bloqueio por degrau mínimo e **guarda
  server-side contra XP farmável** (contratar o mesmo cargo 2x não paga de
  novo — checado no servidor, não só desabilitado na UI)
- ✅ **Loop de gamificação fechado** — toda ação real (marketplace, árvore,
  mapa, equipe de IA) dispara XP/degrau de verdade, com toast e
  `router.refresh()` atualizando HUD/missão sozinhos
- ✅ **Sede / World (`/hub` → aba "Sede")** — sala isométrica real com grid
  de slots, **loja de equipamentos** (7 itens), **reposicionar mobília**
  (clique no móvel → clique no destino) e **evoluir sede** (4 níveis, com
  comparativo atual × próxima). Toda escrita é atômica com guarda de saldo
  server-side. Migration `0004_sede.sql` com RLS forçada + 3 RPCs.
- ✅ **Menu lateral funcional** (`LateralMenu`) — a sidebar de ícones do
  Startup Panic, com 7 módulos; os sem tela pronta aparecem com cadeado.
  Itens podem apontar para rota própria (`href`) — é assim que o World entra.
- ✅ **WORLD — o motor de gamificação de verdade (`/world`)** —
  `GH-WORLD-03/04/05`. Sala isométrica em **PixiJS** (decisão já registrada
  em `world/ARQUITETURA-WORLD.md` §3) com:
  - piso xadrez, duas paredes de fundo, tapete central;
  - **mobília com silhueta própria por categoria** (mesa+monitor, rack com
    LEDs, sofá com encosto, vaso com folhagem) — desenho procedural por
    `Graphics`, **zero asset de imagem**, tudo derivado dos tokens;
  - **o boneco do dono anda pela sala** (clique no chão → BFS que desvia da
    mobília), com depth-sort fracionário: o avatar passa corretamente atrás e
    na frente dos móveis no meio de um passo;
  - **avatares dos Funcionários de IA** contratados, coloridos pelo eixo de
    atributo que cada cargo fortalece;
  - **reposicionar mobília** (clique no móvel → clique no espaço destacado) e
    **loja** — ambos reusando as MESMAS Server Actions atômicas de
    `features/sede/actions.ts`, sem segunda fonte de verdade.
- ✅ **Economia de atributos (`GH-ATR-01/02`)** — os 5 eixos (Tecnologia,
  Processo, Presença, Aquisição, Capacidade) existem de verdade no negócio,
  com teto 40 e clamp atômico. Onboarding calcula o valor inicial de cada
  eixo a partir das 10 respostas. Cada evento de gamificação (`EVENTOS` em
  `engine.ts`) declara qual eixo eleva e quanto; `funcionario_ia_contratado`
  resolve o eixo pelo `eixoFortalecido` do cargo contratado. **O bônus de
  mobília da Sede (que já existia como dado) agora eleva atributo de
  verdade na compra** — mesma transação atômica do débito
  (`0006_mobilia_bonus.sql`), fechando o link com `GH-WORLD-02`. Visual:
  `AtributosBar` (cor consistente por eixo, tokens em
  `design-system/tokens.ts`) em `/painel` e na aside da Sede; toast de
  recompensa mostra o eixo que subiu; loja de mobília mostra o bônus de
  cada item antes da compra.

### Arquitetura (dois contratos trocáveis por `GAMEHUB_DB`)
- ✅ `GameRepository` (dados) + `AuthProvider` (auth) — `file` (protótipo) ou
  `supabase` (produção)
- ✅ Migrations Supabase com RLS forçada, RPCs atômicas
  (`supabase/migrations/0001` a `0006`)
- ✅ 84 testes Vitest (curva de XP, motor de eventos incl. equipe de IA,
  scoring incl. economia de atributos, `lib/atributos.ts`, e o motor do World)
- ✅ **Motor do World é puro e testável sem browser** (`features/world/engine/`):
  projeção isométrica + inversa (clique→tile), depth-sort, geometria da sala,
  bijeção slot↔célula e pathfinding BFS. O Pixi é só uma casca de desenho por
  cima — 44 desses testes cobrem essa camada.

### Deploy e portabilidade (novo — preparado para o pitch)
- ✅ `AGENTS.md`/`CLAUDE.md` — runbook lido automaticamente pelo Claude Code,
  local ou na VPS (regras + operação + como customizar)
- ✅ `iniciar.bat` / `iniciar.sh` — início com um clique/comando em qualquer máquina
- ✅ `deploy/vps-setup.sh` — provisiona a VPS do zero (Node, PM2, Nginx,
  firewall, HTTPS opcional), idempotente
- ✅ `deploy/deploy.sh` — esteira de melhoria contínua (gate de
  typecheck/teste/build **antes** de tocar no processo em produção)
- ✅ `.github/workflows/deploy.yml` — CD automático (push na `main` → VPS),
  precisa dos secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` configurados no GitHub
- ✅ Repositório git inicializado localmente com o primeiro commit

### Análise de referência (56 prints do Startup Panic)
- ✅ **Todos os 56 prints transcritos** individualmente
  ([`analise-prints/`](analise-prints/01-INDICE-MESTRE.md)) — texto literal,
  posicionamento por região, funcionalidade e o que muda entre capturas
- ✅ Consolidado em 7 documentos por categoria + índice mestre
- ✅ **Síntese CTO com catálogo de requisitos funcionais**
  ([`SINTESE-REQUISITOS-FUNCIONAIS.md`](analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md))
  — leitura obrigatória antes de implementar qualquer feature de jogo
- ✅ Arquitetura do **World** e do **mapa-múndi multi-tenant** documentadas
  ([`world/`](world/ARQUITETURA-WORLD.md))
- ✅ Cidade **Mendes** adicionada; lista de cidades centralizada em
  `src/lib/regiao.ts` (era duplicada em 4 lugares) + teste de regressão

### Qualidade
- ✅ `tsc --noEmit` — 0 erros (strict, zero `any`)
- ✅ `npm test` — 84 testes passando
- ✅ `next build` — passa
- ✅ SQL validado por parser real (pg_query WASM) — migrations 0001–0006 e seed
- ✅ Fluxo real da economia de atributos validado ponta-a-ponta via rota de
  autoteste temporária chamando os server actions de produção diretamente
  (evento eleva eixo, cargo eleva eixo, móvel eleva eixo, clamp em 0 e 40) —
  rota apagada antes do commit

**Comandos para verificar que nada quebrou:**
```bash
cd C:\Users\demarchi\Desktop\claude-code\labdatadev-gamehub
npm run typecheck
npm test
npm run build
```

## 3. O que ficou pendente (gaps conhecidos, documentados de propósito)

| Gap | Onde | Prioridade |
|---|---|---|
| **Nenhum deploy real feito ainda** — tudo preparado, mas ninguém rodou `vps-setup.sh` numa VPS de verdade | `deploy/` | 🔴 **Alta — é o próximo passo concreto** |
| Sem remote/push no GitHub ainda (só commit local) | — | Alta (necessário pro CD automático) |
| Estado da árvore de parcerias/mapa não persiste por tenant | `HexTreeScreen`, `MapaScreen` — hoje é `useState` local | Média |
| Marketplace ("Aceitar trabalho") não bloqueia re-clique no mesmo job — pode farmar XP repetindo o mesmo job (mesma classe de bug que corrigimos na Equipe de IA, mas ali é aceitável pois um job "avulso" pode legitimamente repetir; vale revisar se faz sentido gate igual) | `MarketplaceScreen` | Baixa |
| RLS do Supabase não testado em runtime (só parsing) | precisa `supabase start && supabase db reset` | Média |
| Sem testes pgTAP de isolamento entre tenants | `supabase/migrations/` | Baixa |
| Funcionário de IA contratado não aparece visualmente na sede isométrica (só no painel/lista) — decisão consciente, ver §6 | `features/equipe-ia/`, `features/hub/HubScreen` | Baixa (melhoria futura) |
| Fluxo de "solicitar orçamento" (deals) ainda não existe | §7 de `PRODUTO-IA-FUNCIONARIOS.md` | Média |

## 3.1 Sessão 2026-07-27 (tarde) — motor de história + próxima tarefa

**Feito:** motor de história/narrativa (`features/historia/`) — capítulos com
gatilho por dia-pós-cadastro, data global, XP/degrau/atributo/equipe;
escolhas com efeito atômico (RPC `resolver_capitulo`, migration
`0007_historia.sql`); catálogo `CATALOGO_HISTORIA`; card exibido em `/hub` e
`/world` via `CapituloGate` (ponte cliente — ver comentário no arquivo:
necessária porque `revalidatePath` na Server Action desmontava o card antes
do jogador ler o desfecho). Relógio global centralizado em
`historia/relogio.ts` → `agoraGlobal()`. 126 testes, `tsc`/`build` limpos.

**Não fechado — investigar com navegador real antes de dar como certo:** ao
testar clique real no `/hub` (dev e produção, harness automatizado desta
sessão), o `POST` da Server Action às vezes retorna `net::ERR_ABORTED` sem
erro no console — a promise fica pendente. Uma vez completou com dado
correto. Suspeita: limitação do navegador automatizado com resposta RSC em
streaming (mesma família do bug já documentado de `requestAnimationFrame`
não disparar — ver `AGENTS.md`), não bug do app. **Lógica do motor provada
100% correta via chamada direta à Server Action** (fora do browser).

**Achado de processo:** nesta sessão outra instância do Claude Code rodou em
paralelo na mesma pasta e escreveu a maior parte do backend de história
(`tipos.ts`, `relogio.ts`, `motor.ts`, `catalogo.ts`, migration, adapters,
`actions.ts`, `CapituloCard.tsx`) antes de eu assumir. Ao notar arquivos
`?? ` não commitados e sem serem meus, PARE e pergunte — não sobrescreva.

**`GH-FDN-01` — feito** (guarda anti-farm no Marketplace): tabela
`trabalhos_aceitos` (migration `0008`, `unique(tenant_id, job_id)`), guarda
pura testada em `features/marketplace/guarda.ts`, `recompensar()` passa a
exigir `jobId` para `servico_contratado`. UI mostra "já aceito" a partir de
dado do servidor.

**`GH-FDN-02` — feito** (persistir Árvore de Parcerias): mesmo padrão
literal, migration `0009` (`nos_desbloqueados`, `unique(tenant_id, no_id)`),
guarda pura em `features/parcerias/guarda.ts`, `recompensar()` ganha o
branch `servico_desbloqueado` exigindo `noId`. `HexTreeScreen` perdeu o
`useState<Set>` local — recebe `nosDesbloqueados: string[]` do servidor.
`contextoId` (renomeado de `cargoId` em `recompensar()`/`disparar()`) agora
serve os três eventos: cargo, job, nó.

**Estado combinado após as duas:** 134 testes, `tsc`/`build` limpos, ambas
as guardas provadas via chamada direta à Server Action (2ª tentativa
recusada, XP não muda; entidade diferente aceita normalmente).

**`GH-EQP-01` — feito** (modelo de disponibilidade de recurso): tabela
`alocacoes` (migration `0010`, PK = `funcionario_id` — uma linha por
recurso, sobrescrita a cada nova alocação), RPC `alocar_funcionario` com
`pg_advisory_xact_lock` por funcionário (mesma técnica de
`criar_negocio_com_lote`/0001) evitando dois jobs "roubarem" o mesmo
recurso. **`livre`/`alocado` é derivado na leitura, nunca um flag
persistido** — `lib/disponibilidade.ts` (mora em `lib/`, não em `features/`,
porque os dois adapters de `lib/db/` precisam dela — mesma regra de
`lib/atributos.ts`), testado isoladamente (7 testes, incluindo a borda
"expira exatamente agora = livre"). `FuncionarioContratado.disponibilidade`
é enriquecido em `listarFuncionarios`/`contratarFuncionario`, não persistido
junto do registro. Provado em runtime com "salto no tempo" real: alocar →
2ª tentativa recusada (`funcionario_ocupado`) → prazo expira sem nenhum
cron → livre sozinho → realocado para outro job com sucesso.

**Gancho documentado para o World gráfico:** `EVOLUCAO-MOTOR-2026.md` §5.4
agora aponta explicitamente como `Alocacao`/`Disponibilidade` alimentam o
componente ECS `Rotina` já desenhado no roadmap (G1+) — quando a melhoria
gráfica chegar, o dado para mostrar "Funcionário de IA ocupado até X" no
avatar do World já existe, sem migration nova.

**Estado combinado das três (FDN-01, FDN-02, EQP-01):** 141 testes,
`tsc`/`build` limpos.

**`GH-ARV-01` — feito** (custo variável de desbloqueio por nó): cada nó de
`features/parcerias/data.ts` ganhou `custo` (300–3000🪙, crescente com
`score` — `crm`, o de maior fit, é o mais caro, não o mais barato: trade-off
real). **Mudança de arquitetura real, não só um campo novo**: assim que
dinheiro variável entrou em cena, `servico_desbloqueado` deixou de caber no
dispatcher genérico `recompensar()` (que só clampa saldo em 0, não recusa) e
ganhou action própria — `features/parcerias/actions.ts` →
`desbloquearNo(noId)` — com RPC atômica `desbloquear_no` (migration `0011`,
mesmo padrão de `comprar_mobilia`/0004: `for update` no saldo, débito e
insert na mesma transação, `unique` já existente como garantia real).
Provado em runtime com dois tenants: saldo insuficiente (500🪙 tentando nó
de 1200🪙) é recusado e o saldo **continua exatamente 500** (não clampa, não
deixa dívida); saldo suficiente debita o valor exato (2000→800) e aplica
XP/atributo do catálogo; reenvio é recusado.

**Estado combinado das quatro (FDN-01, FDN-02, EQP-01, ARV-01):** 141
testes, `tsc`/`build` limpos.

**`GH-ATR-03` — feito** (requisito mínimo de atributo em entregas e nós da
árvore, commit `1020e63`): `Job.requisitos`/`HexNode.requisitos`
(`Partial<Record<AtributoChave, number>>`) nos dois catálogos, substituindo
o antigo `minScore` que era exibido mas nunca validado. Primitiva pura
`atributosFaltantes()`/`atendeRequisitos()`/`mensagemRequisito()` em
`lib/atributos.ts` (mesma função serve marketplace e parcerias — devolve
*quais* eixos faltam e *quanto*, não só um booleano, pensando já em
`GH-ARV-02`). **Dupla validação**, mesmo padrão de `GH-ARV-01`: checagem
amigável em `recompensar()`/`desbloquearNo()` **e** garantia real em SQL —
migration `0012_atr_requisitos.sql` deu 5 parâmetros `p_min_*` novos à RPC
`desbloquear_no` (exigiu `drop function` da assinatura antiga — parâmetro
novo cria sobrecarga, não substitui) e criou a RPC `aceitar_trabalho`, que
não existia: até aqui o INSERT em `trabalhos_aceitos` era direto do client
via policy `authenticated`, então a validação só na Server Action seria
contornável — a policy de insert caiu, mesmo movimento que 0011 já tinha
feito em `nos_desbloqueados`. Componente `RequisitoAtributos.tsx` (novo,
não reaproveita `AtributosBar`: mostra só os eixos exigidos, comparando
contra um piso, não contra o teto de 40) usado no painel de detalhe de
`MarketplaceScreen`/`HexTreeScreen`. Valores de `requisitos` calibrados
contra o piso real do onboarding (pior perfil: tecnologia 8, processo 6,
presença 2, aquisição 6, capacidade 6) — pelo menos um job (`excel-sql`) e
um nó (`web`, sem requisito de propósito) continuam sempre alcançáveis no
dia 0, teste anti-softlock dedicado em `marketplace/guarda.test.ts` e
`parcerias/guarda.test.ts`. Validado em runtime via rota `selftest-atr`
temporária (apagada antes do commit) contra um tenant com atributos baixos
e saldo alto (isolando o teste no requisito, não na moeda): recusa vem com
a mensagem certa e não escreve em `trabalhos.json`/`nos.json`.

**Estado combinado das cinco (FDN-01, FDN-02, EQP-01, ARV-01, ATR-03):** 185
testes, `tsc`/`build` limpos.

**Nota de processo:** depois deste card, uma sessão concorrente construiu o
Épico 11 (eventos globais, `GH-EVT-01..04`) por cima — ver
`docs/PROXIMA-TAREFA.md` para o estado mais recente do repositório, este
arquivo (`ESTADO-DO-PROJETO.md`) não foi atualizado por aquela sessão. A
recomendação de próxima tarefa abaixo (§4) ficou defasada pelo mesmo motivo:
com `GH-ATR-03` pronto, os dois P0 destravados (`GH-ARV-02`, `GH-EQP-02`)
são o próximo passo real da Trilha A — `docs/PROXIMA-TAREFA.md` recomenda
`GH-ARV-02` primeiro (a primitiva `atributosFaltantes` já existe, o card
fica quase só visual: terceiro estado no `HexTile`).

## 4. Plano recomendado para a próxima sessão

> 📋 **O backlog formal está em [`BACKLOG-PRODUTO.md`](BACKLOG-PRODUTO.md)** —
> 33 cards com ID, critérios de aceitação, regras de segurança e dados
> trafegados, na ordem de execução. **Use-o como fila de trabalho** (um card
> por vez). As trilhas abaixo são o resumo da mesma priorização.

**A análise dos prints mudou a prioridade.** O maior gap estrutural não era
mais deploy — era a **economia de atributos** (ver
[`analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md`](analise-prints/SINTESE-REQUISITOS-FUNCIONAIS.md) §4),
sem a qual a gamificação continuava unidimensional (só XP). **Isso já está
feito** (`GH-ATR-01/02`, ver §2 acima) — a gamificação agora tem 5 eixos
reais alimentados por evento, cargo de IA e mobília. O próximo item natural
da Trilha A é `GH-ATR-03` (requisito mínimo de atributo em entregas/nós da
árvore) ou seguir direto para `GH-EQP-01/02` (alocação de equipe).

### Trilha A — profundidade de jogo (🔴 **toda a trilha é P0 agora**)
1. ✅ **Economia de atributos** (`GH-ATR-01/02`, `RF-ATR-01..07`) — **feito.**
   5 eixos reais no negócio (Tecnologia, Processo, Presença, Aquisição,
   Capacidade), com ganho por evento de gamificação, por cargo de IA
   contratado e por mobília comprada na Sede. Falta só `GH-ATR-03`
   (requisito mínimo de atributo em entregas/nós da árvore — depende disto,
   agora destravado de verdade).
2. **Alocação de equipe em entregas** (`GH-EQP-01/02`, `RF-MKT-02..04`) —
   aceitar um serviço exige escolher quem executa; recurso fica ocupado.
   `GH-EQP-01` já não depende de nada pendente (`GH-ATR-01` pronto).
3. **Requisitos e custos variáveis na árvore** (`GH-ARV-01/02`, `RF-ARV-03/04`)
   — também depende de `GH-ATR-01`, já pronto.
4. Persistir estado de árvore/parcerias por tenant (hoje `useState` local).

### Trilha B — colocar no ar (independente da A)
1. **Primeiro deploy real:** `deploy/README.md` §1 → `./deploy/vps-setup.sh`.
2. **Remote no GitHub** + 3 secrets → CD automático.
3. `supabase start && supabase db reset` pra validar RLS em runtime.

### Trilha C — World (maior esforço, maior impacto visual no pitch)

> 📐 **Plano completo de evolução:**
> [`world/EVOLUCAO-MOTOR-2026.md`](world/EVOLUCAO-MOTOR-2026.md) — pesquisa de
> mercado 2026, decisão de engine (veredito: **manter PixiJS**) e roadmap
> G0–G6. **Conclusão principal:** o renderer não é o gargalo; falta uma
> **camada de simulação** (ECS + tick). O próximo card é `GH-SIM-01`.

Ver [`world/ARQUITETURA-WORLD.md`](world/ARQUITETURA-WORLD.md) §6 — fases W1
a W6. **W1 a W5 estão feitas** (ver §2): dados, tela estática, canvas Pixi,
reposicionamento de mobília e avatares. Resta:

- **W6 — visitar a sede de um vizinho** (somente leitura, se `publicada`).
  Precisa antes da decisão de produto sobre `sede.publicada` (opt-in),
  documentada em `world/MAPA-MUNDI-VALE-DO-CAFE.md` §2.
- Melhorias naturais em cima do que já existe: humor/estado da equipe visível
  no ambiente (`RF-SED-06`, os balões do Startup Panic), mobília ocupando mais
  de 1 tile, e drag-and-drop por cima do clique-para-mover.

> Cada passo acima segue um padrão **já existente e testado** no código —
> não é preciso inventar arquitetura nova.

## 5. Mapa de arquivos (para não se perder)

```
labdatadev-gamehub/
├── AGENTS.md / CLAUDE.md             ← runbook operacional (leia antes de mexer)
├── iniciar.bat / iniciar.sh          ← início rápido em qualquer máquina
├── deploy/                           ← vps-setup.sh, deploy.sh, README.md
├── .github/workflows/deploy.yml      ← CD automático
├── docs/
│   ├── ESTADO-DO-PROJETO.md          ← você está aqui
│   ├── PRODUTO-IA-FUNCIONARIOS.md    ← o produto (Funcionários de IA)
│   ├── README.md                     ← índice de todos os docs
│   ├── CONTEXTO-NEGOCIO.md           ← modelo de negócio geral
│   ├── GAMIFICACAO.md                ← motor de XP/eventos/missões
│   ├── ARQUITETURA-MULTITENANT.md    ← cadastro, login, Supabase, mapa
│   └── design/, database/            ← design system, schema regional
├── melhoria-continua/servicos-ti/    ← playbooks dos 4 cargos de IA
├── supabase/migrations/              ← 0001 (init) · 0002 (gamificação) · 0003 (equipe IA)
└── src/
    ├── features/gamificacao/         ← engine.ts, actions.ts, RecompensaContext
    ├── features/equipe-ia/           ← catálogo + tela de contratação
    ├── features/mapa/                ← mapa isométrico real
    └── lib/db/                       ← repository.ts (contrato), adapters
```

## 6. Decisões já tomadas (respondendo o que ficou em aberto antes)

Perguntas de `PRODUTO-IA-FUNCIONARIOS.md` §9, resolvidas na implementação:
1. **Funcionário de IA é por tenant** (não catálogo global) — tabela
   `funcionarios_contratados` com `unique(tenant_id, cargo_id)`.
2. **Aparece só no painel/lista por agora** — a versão visual na sede
   isométrica ficou como melhoria futura (§3), não bloqueava o MVP.
3. A 11ª pergunta no onboarding **não foi adicionada** — os cargos
   recomendados já são derivados das 10 respostas existentes (gargalo/objetivo).

Ainda em aberto: **preços do catálogo** (§5 do doc de produto) são
rascunho — cruzar com `labdatadev-context/04-portfolio/pricing_methodology.md`
antes de qualquer número ir para um cliente real ou para o pitch do Sebrae.
