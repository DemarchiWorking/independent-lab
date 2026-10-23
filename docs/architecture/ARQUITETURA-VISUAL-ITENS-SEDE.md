# Arquitetura visual dos itens da Sede — forma, silhueta e pipeline de arte (2026-08-03)

> Papel: revisão de **Arquiteto de Soluções sênior** (Winston, BMAD) sobre
> uma pergunta específica do fundador: *"como melhorar o gráfico do
> escritório (Sede), item por item, tanto na minha própria sede quanto na
> sede de um vizinho?"*
>
> **Escopo desta decisão:** a QUALIDADE VISUAL DE CADA ITEM desenhado
> dentro da Sede — mobília, avatares, cenário — em `/world` e em
> `/world/visitar/[tenantId]`. Não é o redesign do Mapa, não é a geometria
> da sala, não é a engine.
>
> **Formato:** documento único, decisão já sintetizada, sem Reviewer Gate
> formal. Decisão explícita do usuário nesta sessão — a sessão anterior
> gastou ~220 mil tokens num Reviewer Gate de 2 subagentes para um
> resultado pequeno em produção (registrado em
> `docs/mapa-vivo/TAREFAS-PENDENTES.md`, "Balanço honesto desta sessão").
> Não repetir esse formato.
>
> Documentos-pai: [`docs/world/EVOLUCAO-MOTOR-2026.md`](../world/EVOLUCAO-MOTOR-2026.md)
> §6/§10/§11 · [`docs/world/VISITAR-VIZINHO.md`](../world/VISITAR-VIZINHO.md) §5 ·
> spines de UX `DESIGN.md`/`EXPERIENCE.md` (Mapa Vivo, ver §2) ·
> [`AGENTS.md`](../../AGENTS.md).

---

## 1. Resumo executivo

A Sede hoje é desenhada **100% por código** (`Graphics` procedural do Pixi,
zero asset de imagem) em `src/features/world/render/desenho.ts`. O teto
visual dessa técnica é **6/10** — número do próprio `EVOLUCAO-MOTOR-2026.md`
§6.2, não uma opinião nova.

Mas o gargalo imediato **não é a técnica de desenho** — é a **variedade de
silhuetas**. Os 8 itens do catálogo de mobília são mapeados em apenas **4
categorias visuais**, e os 4 Funcionários de IA em apenas **4 cores** (com
duas delas repetidas). O resultado concreto, verificável hoje em produção:
"Mesa de Trabalho" e qualquer outro item da categoria `trabalho` desenham
**exatamente a mesma forma**; "Social Media IA" e "Editor(a) de Vídeo IA"
são **avatares pixel-a-pixel idênticos** (mesmo `eixoFortalecido:
"presenca"` → mesma cor → mesma silhueta). O jogador não vê um escritório
mobiliado: vê 4 formas repetidas em cores diferentes.

**Decisão:** separar o eixo **FORMA** do eixo **COR**, e atacar a forma
antes da técnica. Em quatro fases incrementais:

- **Fase 0 (P)** — fechar a assimetria conhecida: o badge de tier existe em
  `VisitaScreen.tsx` e não em `WorldScreen.tsx`. Zero decisão nova.
- **Fase 1 (M)** — introduzir a chave `silhueta` no catálogo e uma silhueta
  própria por item/cargo em `desenho.ts`. **Continua procedural, zero
  asset, zero dependência nova, entregável antes do pitch.**
- **Fase 2 (G)** — pipeline de sprite atlas (`G2` do roadmap), o salto real
  6/10 → 8,5/10. Reusa a chave `silhueta` da Fase 1 como nome de frame do
  atlas. Depende de produção de arte (mitigada por IA generativa +
  curadoria, §7).
- **Fase 3** — shader/iluminação (`Degrau C`). **Fora do escopo do pitch.**

A alavanca estratégica: **a Fase 1 não é trabalho descartável**. Ela cria
exatamente a chave de endereçamento (`silhueta` → frame) que a Fase 2
precisa. Fazer a Fase 1 agora é pagar antecipado um pedaço obrigatório da
Fase 2, com ganho de percepção imediato e risco quase zero.

---

## 2. Reconciliação dos dois trilhos de trabalho gráfico

Existem hoje **dois** trilhos de trabalho visual sobre a Sede em andamento.
Este documento é o segundo, e é **complementar**, não concorrente.

### Trilho A — "Mapa Vivo" (spine de UX, autoritativa para COR)

Documentos-contrato: `DESIGN.md` e `EXPERIENCE.md` em
`/root/_bmad-output/planning-artifacts/ux-designs/ux-labdatadev-2026-08-02/`
(ver `docs/mapa-vivo/STATUS-BMAD-UX.md` para por que vivem fora do repo).

O que a spine **já resolveu e este documento NÃO reabre**:

- A cor de tier (`tier-1..5`) e a cor de presença ao vivo (`presenca-viva`
  = `brand.teal`) são **idênticas** entre o `MapaPin` (Mapa) e o
  `SedeNameplate`/`SedeAnelPresenca` (interior da Sede). Zero token novo.
  Já implementado em `render/cores.ts` (`corDoTier`, `corDePresenca`) e em
  `lib/tier.ts`.
- Contraste, tamanho de badge, texto nunca direto sobre preenchimento de
  tier — achados da Reviewer Gate de acessibilidade, já incorporados.

**Regra do projeto: as spines vencem.** Nenhuma decisão deste documento
toca cor de tier, cor de presença ou token novo. Quando este documento
fala de cor, é sempre para **consumir** o que a spine já definiu.

O que a spine deliberadamente **deixou em aberto**: ela declara
explicitamente que a GEOMETRIA da Sede (`src/features/world/engine/`) está
fora do escopo dela — "só a casca visual muda". Isso deixa um vácuo: a
spine resolve **qual cor** cada elemento tem, e **não** resolve **qual
forma** cada móvel ou avatar tem. É exatamente esse vácuo que este
documento preenche.

### Trilho B — evolução do motor (a alavanca de "aparência de cada item")

`docs/world/EVOLUCAO-MOTOR-2026.md` §6 já pesquisou e decidiu a direção de
arte ("isométrico vetorial com profundidade") e o roadmap de 3 degraus
(A procedural → B atlas → C shader). Este documento é a **execução
arquitetural** desse §6 para o caso concreto "cada item precisa parecer
ele mesmo", com uma correção de sequenciamento que o §6 não tinha:
**antes de trocar a técnica (Degrau B), esgotar a variedade de forma
dentro da técnica atual (Degrau A+)** — porque o gap medível hoje é de
variedade, não de fidelidade.

### O que este documento NÃO é

- **Não é o handoff de arquitetura do Mapa.** O `bmad-create-architecture`
  pendente cobre o Mapa/terreno/pins (`GH-MAPA-05`): terreno estilizado,
  zoom em 4 níveis, `MapaBreadcrumb`, `ChegadaSpotlight`, `PresencaCluster`,
  `SedeFachada`. Nada disso está aqui. São escopos disjuntos: aquele é
  **fora** da Sede, este é **dentro** dela.
  - Nota de correção herdada: as spines afirmam que o Mapa usa Pixi.js —
    está **errado**, o Mapa real é DOM/CSS (`IsoLot.tsx`/`QuarteiraoIso.tsx`).
    Registrado em `docs/mapa-vivo/TAREFAS-PENDENTES.md`. Não afeta este
    documento (a Sede é Pixi de verdade), mas afeta o handoff do Mapa.
- **Não reabre decisão de engine.** Pixi.js v8 continua, decisão fechada
  em `EVOLUCAO-MOTOR-2026.md` §4.3.
- **Não introduz ECS/simulação.** Ver §5.

---

## 3. Validação: por que este é o melhor investimento visual agora

O pedido era "melhorar a aparência de cada item". A pergunta de arquiteto
é: *isto é a melhor aposta possível para o pitch do Sebrae Startup Win, ou
existe algo melhor?* Quatro argumentos independentes dizem que sim.

**3.1 — Não depende do item mais caro do backlog.** No roadmap G0–G6
(`EVOLUCAO-MOTOR-2026.md` §10), a linha `G2` (pipeline de arte) declara
`Depende de: G0`. **Não depende de `G1`** (ECS + tick + necessidades), que
é o maior item do backlog (`GH-SIM-01`, esforço G, deliberadamente adiado).
O diagrama do próprio §10 mostra os dois ramos separados a partir de G1 —
mas a coluna de dependência é a autoridade, e ela desacopla G2. Portanto:
**investir em aparência não exige construir a simulação antes.**

**3.2 — Raio de explosão comprovado por duas fontes independentes.**
`VISITAR-VIZINHO.md` §5 ("Prontidão para evolução do renderer") e a spine
`EXPERIENCE.md` ("a GEOMETRIA da Sede não muda") concordam, sem terem sido
escritas pela mesma linha de raciocínio: trocar o desenho procedural por
sprites acontece **inteiro dentro de `desenharMovel()`/`desenharAvatar()`
em `render/desenho.ts`**. Confirmei no código: `VisitaScreen.tsx` e
`WorldScreen.tsx` importam de `render/cena.ts` (o tipo `EstadoCena`) e de
`render/cores.ts` — **nenhuma das duas importa `desenho.ts`**. `cena.ts` é
o único chamador. Nenhuma linha de `engine/`, de `lib/db/` ou das Server
Actions muda.

**3.3 — Funciona independente do gap de infra de multiplayer.** A presença
ao vivo tem um gap conhecido e não fechado no deploy de produção
(`GH-OPS-08`, Kong/Traefik), e multiplayer só existe no modo Supabase
(`AGENTS.md`). Apostar no "wow" de presença ao vivo no dia do pitch é
apostar num componente que pode não estar de pé. A **aparência estática de
cada item funciona em `GAMEHUB_DB=file`, sem rede, sem WebSocket, sem
Supabase** — ela é demonstrável mesmo num notebook offline. É a aposta de
menor variância para uma demo ao vivo.

**3.4 — A metade cara do problema já está feita.** A spine já resolveu a
camada de COR (tier, presença, continuidade Mapa↔Sede) e boa parte já está
em produção (commits `0c2c0f2`, `0e8a184`). Falta a camada de FORMA — que
é justamente a que o usuário está pedindo e a que ninguém está tocando.
Não há sobreposição de trabalho.

**Conclusão:** sim, é a melhor aposta disponível. Não porque seja a mais
ambiciosa, mas porque é a única com ganho alto de percepção, dependência
zero, custo de infra zero e risco de regressão quase zero, dentro da
janela do pitch.

---

## 4. Decisão de arquitetura, em fases

Princípio operante (`AGENTS.md`, `docs/mapa-vivo/CONTEXTO-E-DECISOES.md`
§6): **melhoria contínua, não big-bang.** Uma fase por vez, gate
`typecheck && test && build` verde antes de seguir. Esforço em **P / M / G**
(nunca em tempo — regra do processo).

### Fase 0 — Fechar a assimetria de nameplate entre a própria sede e a visita

| Campo | Valor |
|---|---|
| Esforço | **P** |
| Risco | Muito baixo |
| Depende de | nada (dado já carregado) |
| Decisão nova | nenhuma — só replicação |

**O que muda:** `VisitaScreen.tsx` já mostra o `SedeNameplate` (ponto
colorido de tier + nome de árvore, linhas ~253-262). `WorldScreen.tsx`
não mostra. O dado necessário **já está carregado** em
`src/app/world/page.tsx` (`negocio.degrauAtual`, campo existente em
`lib/db/types.ts`), só não é repassado. Mudança: nova prop
`degrauAtual: number` em `WorldScreenProps`, e o mesmo bloco de JSX usando
`classeTier()`/`nomeArvoreTier()` de `lib/tier.ts`.

**Ajuste de escopo em relação ao que estava anotado no backlog (achado
desta análise).** `docs/mapa-vivo/TAREFAS-PENDENTES.md` registra a pendência
como *"badge de tier **+ cor de presença** replicados em `WorldScreen.tsx`"*.
Isso está imprecisamente agrupado: `WorldScreen.tsx` **não tem nem a prop
`outrosPresentes`, nem assinatura de canal de presença** — ao contrário de
`VisitaScreen.tsx`. Replicar "cor de presença" ali não é trocar uma cor: é
**construir presença ao vivo na própria sede**, uma feature nova, da
família `GH-MULTI-*`, que depende do gap de infra `GH-OPS-08`.

→ **Decisão:** a Fase 0 entrega **só o badge de tier**. Presença ao vivo na
própria sede sai deste escopo e vira um card separado, explicitamente
**fora da janela do pitch** (§5). Não gastar risco de infra num item que
não é o pedido do usuário.

**Pronto quando:** entrar em `/world` e em `/world/visitar/[id]` mostra o
mesmo tratamento de tier, com o mesmo token, na mesma posição do HUD; gate
verde.

---

### Fase 1 — "Degrau A+": uma silhueta própria por item e por cargo

| Campo | Valor |
|---|---|
| Esforço | **M** |
| Risco | Baixo (isolado em `render/desenho.ts` + um campo novo no catálogo) |
| Depende de | Fase 0 apenas por ordem de commit, não tecnicamente |
| Ganho | O maior ganho de percepção por unidade de esforço de todo este documento |

**O problema, medido.** `desenho.ts` expõe
`CategoriaMovel = "trabalho" | "tecnologia" | "conforto" | "decoracao"` — 4
formas. `features/sede/catalogo.ts` tem **8 itens**. Consequência hoje, em
produção:

| Categoria | Itens que desenham a MESMA forma |
|---|---|
| `trabalho` | Mesa de Trabalho |
| `tecnologia` | Estação Dupla, Servidor Local |
| `conforto` | Sofá de Recepção, Estante Executiva |
| `decoracao` | Planta Tropical, Quadro de Metas |

"Estante Executiva" desenha **um sofá**. "Quadro de Metas" desenha **um
vaso de planta**. A única diferença é a cor do token. Isso é um bug de
produto disfarçado de decisão de render.

O mesmo vale para avatares: `desenharAvatar()` varia por `cor` e pelo
booleano `dono`. Os 4 Funcionários de IA recebem
`corDoAtributo(cargo.eixoFortalecido)` — e **"Social Media IA" e
"Editor(a) de Vídeo IA" compartilham `eixoFortalecido: "presenca"`**, logo
são **avatares idênticos**, indistinguíveis um do outro na sala.

**A decisão arquitetural: separar o eixo de FORMA do eixo de CATEGORIA.**

Introduzir uma chave `silhueta` — um identificador visual fechado,
declarado **no catálogo** (domínio) e consumido **no render** (desenho):

- `features/sede/catalogo.ts`: `ItemMobilia` ganha
  `silhueta: SilhuetaMovel` (obrigatório, um por item).
- `features/equipe-ia/catalogo.ts`: `CargoIA` ganha
  `silhueta: SilhuetaAvatar` (ou um `adorno` — chapéu/acessório — se a
  variação total de corpo for cara demais; ver "pronto quando").
- `render/desenho.ts`: exporta os tipos `SilhuetaMovel`/`SilhuetaAvatar`
  como **unions fechadas** e um desenhador por valor.
- `render/cena.ts`: `MovelNaCena.categoria` → `MovelNaCena.silhueta`;
  `AvatarNaCena` ganha `silhueta`/`adorno`.
- `WorldScreen.tsx`/`VisitaScreen.tsx`: passam `m.item.silhueta` em vez de
  `m.item.categoria` ao montar `EstadoCena`. Mudança de uma linha em cada.

**Por que esta forma e não `switch (itemId)` dentro de `desenho.ts`.**
Ligar o render diretamente ao `id` do catálogo faria a camada de desenho
importar conhecimento de domínio — quebra a fronteira que `AGENTS.md`
protege ("nunca ponha regra dentro do `render/`") e obriga a mexer em
`desenho.ts` toda vez que um item novo entrar na loja. Com `silhueta`, o
**catálogo declara qual forma quer**, e o render só conhece um conjunto
fechado de formas. É **exatamente o mesmo padrão que a cor já usa hoje**:
o catálogo declara `cor: "bg-cat-media"` (classe de token) e `cores.ts`
traduz para o número do Pixi, sem o render saber o que é uma "Mesa".
Repetir um padrão que já existe no projeto vale mais que inventar um
segundo.

**Por que isto não é trabalho descartável quando a Fase 2 chegar.** A
`silhueta` é o **nome do frame no atlas**. Na Fase 2,
`desenharMovel({ silhueta })` deixa de montar `Graphics` e passa a fazer
`Sprite.from(atlas.textures[silhueta])` — mesma assinatura, mesmo chamador,
mesma chave. Sem a Fase 1, a Fase 2 teria que inventar essa chave do zero.
**A Fase 1 é a interface da Fase 2, entregue antecipadamente com valor
próprio.**

**Restrições de arte a respeitar (`EVOLUCAO-MOTOR-2026.md` §6.3, já
implementadas hoje — manter):** luz constante topo `1.0` / direita `0.78` /
esquerda `0.58`; sombra de contato obrigatória em tudo que toca o chão;
**silhueta antes de detalhe** (reconhecível a 32 px); cor só por token.

**Dois itens de higiene a fazer dentro desta fase, já que ela toca esta
camada** (achados desta análise, não pedidos novos):

1. `render/cores.ts` contém **hex avulso** — `pisoClaro: "#C9A227"`,
   `pisoEscuro: "#B08D1F"`, `pisoBorda: "#8A6E18"`, `pele: "#E8B08A"`,
   `texto: "#FFFFFF"` — apesar do próprio cabeçalho do arquivo dizer "TUDO
   aqui deriva de `design-system/tokens.ts`". É dívida pequena e é
   exatamente o tipo de deriva que a regra não-negociável nº 2 existe para
   impedir. Promover a tokens nomeados.
2. **Calibrar o contraste do piso.** O piso é xadrez dourado/mostarda
   (`#C9A227`/`#B08D1F`) de saturação alta. Uma regra da própria direção de
   arte é "silhueta antes de detalhe" — e uma silhueta só lê bem contra um
   fundo que não compete com ela. Baixar a saturação do piso é a alavanca
   de **maior ganho percebido por menor esforço de todo o documento**:
   melhora a leitura de **todos** os itens de uma vez, sem tocar em nenhum
   deles. Validar por screenshot (§7), não por opinião.

**Pronto quando:**
- Nenhum par de itens do `CATALOGO_MOBILIA` desenha a mesma silhueta.
- Nenhum par de cargos de `CARGOS_IA` produz avatares indistinguíveis
  (silhueta ou adorno diferente — a cor sozinha não conta como distinção,
  por `AGENTS.md`/`DESIGN-SYSTEM.md` §7, "nunca comunicar só por cor").
- Um PNG extraído pela técnica do `AGENTS.md` (`window.__world` →
  `desenharUmFrame()` → `extract.base64()`) mostra a sala com 8 móveis
  distintos e é **olhado de verdade** por um humano.
- `npm run typecheck && npm test && npm run build` verde.

---

### Fase 2 — "Degrau B" (`G2`): pipeline de sprite atlas

| Campo | Valor |
|---|---|
| Esforço | **G** (o custo é arte, não código — ver §7) |
| Risco | Médio — o único risco relevante deste documento |
| Depende de | Fase 1 (a chave `silhueta`); `G0` do roadmap (`roundPixels`, barato) |
| Ganho | 6/10 → 8,5/10 (`EVOLUCAO-MOTOR-2026.md` §6.2) |

**O que muda.** O pipeline já está desenhado em §6.4 e não é reaberto aqui:

```
arte/fonte/*.aseprite  →  aseprite --batch --sheet  →  arte/build/*.png+json
   →  TexturePacker  →  public/atlas/world-{1x,2x}.{png,json}
   →  Assets.load()  →  render/atlas.ts
```

**As três decisões de arquitetura que o §6.4 não resolvia e que ficam
decididas aqui:**

1. **`desenharMovel()`/`desenharAvatar()` continuam síncronas.**
   `Assets.load()` é assíncrono; `Graphics` é síncrono. Se a função de
   desenho virar `async`, `cena.sincronizar()` (chamada a cada clique) vira
   assíncrona e a reconciliação por `id` — que hoje cria 1× e depois só
   muta, justamente para não realocar buffer de GPU — passa a ter janelas
   de corrida. **Decisão:** o atlas é carregado **uma vez, antes do
   primeiro `sincronizar`**, em `WorldCanvas.tsx` (que já é `dynamic({ ssr:
   false })` e já tem estado de "Carregando sua sede…"), e é **injetado**
   em `Cena` como um `Spritesheet` já resolvido. As funções de desenho
   nunca aguardam nada.

2. **Fallback procedural obrigatório — o atlas nunca é caminho crítico.**
   Se o atlas falhar (404, rede lenta, CDN fora), `desenharMovel()` cai no
   desenho procedural da Fase 1. O código do Degrau A **não é deletado na
   Fase 2** — vira o fallback. Isto segue a mesma doutrina de degradação
   limpa que a spine já exige para presença ("sem `PresencaConfig`,
   `SedeAnelPresenca` simplesmente não renderiza, resto funciona normal").
   **No dia do pitch, o pior caso é a sala do jeito que está hoje — nunca
   uma sala vazia.** Esta propriedade é o que torna a Fase 2 aceitável
   dentro da janela do pitch em vez de proibida.

3. **A chave é a `silhueta`, e o CI valida o contrato.** Nome de frame do
   atlas ≡ valor da union `SilhuetaMovel`/`SilhuetaAvatar`. Um teste
   (vitest, sem browser) percorre a union e afirma que existe frame
   correspondente no `*.json` do atlas — assim uma arte faltando **quebra o
   gate**, não o pitch. Somar aí as validações de paleta e dimensão por
   frame que o §6.4 já pedia.

**Não fazer nesta fase:** assar escala 2×/3× no PNG (fonte sempre 1×,
escala inteira no render com `roundPixels: true`); trocar mais de uma
categoria de asset por vez (mobília primeiro, avatares depois — são dois
sub-entregáveis, não um).

**Pronto quando:** a sala renderiza a partir do atlas com o fallback
desligado à força e depois com ele forçado, e as duas versões são
comparadas por PNG extraído; nenhum frame faltando; gate verde; FPS sem
regressão perceptível.

---

### Fase 3 — "Degrau C": iluminação por shader

**Fora do escopo do pitch. Não desenvolver agora.** Registrado só para
fechar o roadmap: normal map + iluminação por shader, teto 9,5/10,
`G5+` no roadmap, esforço Alto. Só faz sentido depois que houver arte real
no atlas (Fase 2) — iluminar proceduralmente uma forma vetorial dá ganho
marginal e consome a janela toda.

---

### Por que esta sequência, e onde ela diverge da proposta inicial

A sequência sugerida na abertura da tarefa (Fase 0 → 1 → 2 → 3) está
**correta e mantida**. Três ajustes de julgamento sênior, todos
explicitados acima:

1. **Fase 0 foi reduzida** para "só badge de tier" — a parte de "cor de
   presença" agrupada no backlog é, na verdade, uma feature de multiplayer
   na própria sede, dependente do gap de infra `GH-OPS-08`. Reduzir mantém
   a Fase 0 como P e sem risco.
2. **Fase 1 foi ampliada** para incluir **avatares** (não só mobília) e a
   **calibração do piso**. O pedido do usuário foi "cada item gráfico" — os
   avatares são os itens mais olhados da tela, e dois deles são idênticos
   hoje. Excluí-los deixaria o gap mais visível sem tratamento.
3. **A Fase 2 recebeu a obrigação de fallback procedural.** Sem isso, ela
   seria uma aposta binária dentro da janela do pitch — o que contraria a
   regra "melhoria contínua, não big-bang".

---

## 5. O que NÃO fazer agora (riscos deliberadamente evitados)

| Não fazer | Por quê |
|---|---|
| Mexer em `world/engine/` (geometria, `sala.ts`, `iso.ts`, `caminho.ts`, `proximidade.ts`) | Lógica pura, testada, e a spine declara explicitamente que não muda. É o que garante o raio de explosão pequeno (§3.2) |
| Trocar PixiJS por Three.js / Phaser / Babylon | Decisão fechada em `EVOLUCAO-MOTOR-2026.md` §4.3, e a spine registra "nenhuma lib nova pesada entra neste escopo" |
| Introduzir ECS / `GH-SIM-01` como pré-requisito | `G2` não depende de `G1` (§3.1). Fazer a simulação antes trocaria uma entrega visual certa por uma refatoração de fundação que, por design, **não tem efeito visual nenhum** |
| Construir presença ao vivo na própria sede | Depende de `GH-OPS-08` (infra Kong/Traefik não fechada). Vira card separado, pós-pitch |
| Reabrir cor de tier / presença / criar token novo | As spines vencem. `DESIGN.md` já fechou, e a Reviewer Gate de acessibilidade já corrigiu contraste e tamanho de badge |
| Rodar um Reviewer Gate formal de 2 subagentes de novo | Custo desproporcional já medido (~220 mil tokens para resultado pequeno). Os achados de acessibilidade relevantes já estão documentados |
| Fazer Fase 1 e Fase 2 no mesmo ciclo | Big-bang. A Fase 1 precisa estar em produção e validada por PNG antes da Fase 2 começar a substituir o que ela desenhou |
| Deletar o desenho procedural ao adotar o atlas | Ele é o fallback que impede tela vazia no pitch (§4, Fase 2, decisão 2) |
| Redesenhar o Mapa dentro deste escopo | É o handoff de arquitetura pendente do `GH-MAPA-05`, escopo disjunto (§2) |

---

## 6. Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| **Arte não acompanha (sem designer interno)** | **Alta** | **Alto** | Ver detalhamento abaixo — é o risco principal deste documento |
| Fase 1 vira "8 cubos ligeiramente diferentes" | Média | Médio | Critério de pronto é **olhar o PNG**, não passar no teste. "Silhueta antes de detalhe": reconhecível a 32 px, senão não conta |
| Atlas quebra em produção no dia do pitch | Baixa | **Alto** | Fallback procedural obrigatório (§4, Fase 2) + teste de contrato silhueta↔frame no gate |
| Regressão visual invisível ao CI | **Alta** | Médio | `typecheck`/`test`/`build` **não pegam** geometria nem cor — por isso o gate visual do §7 é obrigatório, não opcional |
| Escopo do World engolir o roadmap de negócio | Alta | Alto | Cada fase é entregável isolada; a Fase 0 e a Fase 1 já entregam valor mesmo se a Fase 2 nunca acontecer |
| Deriva de paleta com arte gerada por IA | Média | Médio | Validação de paleta no CI (§6.4 do doc-pai) — a arte precisa usar as cores de token, não as que o gerador achou bonitas |

### O risco principal, detalhado: produção de arte sem designer

`EVOLUCAO-MOTOR-2026.md` §11 já registra este risco como **Alta / Alto**.
A mitigação, concretizada para o nosso caso:

1. **A Fase 1 não depende de arte nenhuma.** É código vetorial escrito por
   quem programa. Este é o ponto central da recomendação: a maior parte do
   ganho percebido chega **antes** do risco de arte entrar em cena.
2. **Geradores por IA com curadoria humana** (`§3.6`: PixelLab e similares,
   que já entregam rotação 4/8 direções com suporte isométrico) para o
   volume da Fase 2. O papel humano é curar e normalizar, não desenhar do
   zero. O projeto já tem skills de geração de imagem disponíveis no
   ambiente (`/ai-image-generation`, `/nano-banana-2`).
3. **Normalização mecânica, não artística.** Os padrões inegociáveis (§6.3)
   são verificáveis por script: uma direção de luz, paleta de token,
   dimensão por frame, sombra de contato. O que não passar na validação de
   CI não entra no atlas — o gate substitui o olho do designer para as
   propriedades objetivas.
4. **Ordem de sacrifício definida antes da pressa:** mobília primeiro
   (mais itens, mais repetição visível), avatares depois. Se a arte só
   render para metade, a metade entregue já está em produção e a outra
   metade continua no fallback procedural — sem sala quebrada.
5. **Custo de licença é irrelevante** (~US$ 20, Aseprite; TexturePacker
   tem alternativa gratuita — §12). O custo real é curadoria, e ele é
   cortável a qualquer momento sem quebrar nada.

---

## 7. Gates de qualidade

**Gate obrigatório antes de considerar qualquer fase pronta** (`AGENTS.md`,
regras 1 e 7):

```bash
npm run typecheck   # tsc --noEmit — zero any
npm test            # vitest
npm run build
```

**Gate visual — obrigatório, e não substituível pelos três acima.** Este
projeto já aprendeu isso do jeito difícil: `typecheck`, `test` e `build`
passaram verdes enquanto as paredes eram desenhadas como serrote e enquanto
o avatar do dono nascia na mesma célula do primeiro Funcionário de IA
(`AGENTS.md`, "Validação sem infra"). Nenhum desses bugs é de tipo — são de
geometria e de pixel. A técnica documentada, a ser aplicada em **toda** fase
deste documento:

1. Em dev, `window.__world` expõe `{ app, cena, desenharUmFrame }`
   (`features/world/render/WorldCanvas.tsx` — nunca vai para produção).
2. `desenharUmFrame()` força um render fora do ticker — necessário porque
   em aba não-visível o `requestAnimationFrame` congela e o canvas **monta
   sem desenhar um único frame**, sintoma facilmente confundido com bug.
3. `app.renderer.extract.base64({ target: app.stage })` devolve o PNG;
   gravar em disco e **abrir a imagem e olhar**.
4. Para animação, chamar o loop na mão: `cena['avancar']({ deltaMS: 33 })`
   em laço.
5. Para testar clique no canvas, **renderizar antes** (`app.renderer.render`
   → `pointermove` → `pointerdown` → `pointerup`) — o hit-test usa
   transforms do render, e com rAF congelado o `pointertap` não dispara,
   sem erro nenhum.

**Critério de aceite visual das Fases 1 e 2:** um PNG da sala com os 8
móveis e os 4 cargos presentes, olhado por um humano, no qual **nenhum par
seja confundível a 32 px de altura de item**. Sem esse PNG, a fase não está
pronta — independentemente do gate verde.

**Regras técnicas que continuam valendo em toda fase** (`AGENTS.md`): zero
`any`; cor só por token; `lib/` nunca importa de `features/`; nenhuma regra
de negócio dentro de `render/`; toda regra validada também no servidor.
Nada neste documento toca Server Action ou regra de negócio — a última
regra é citada por completude, não por aplicação.

---

## 8. Próximos passos concretos

**Começar pela Fase 0, no mesmo ciclo em que se começa a Fase 1.** Motivo:
a Fase 0 é P, não tem decisão nenhuma pendente, e fecha uma inconsistência
que **um avaliador do pitch pode ver** (entrar na própria sede e na de um
vizinho e notar que uma tem selo e a outra não). É o menor item de dívida
visível com o maior retorno de credibilidade.

**Em seguida, a Fase 1 — e é ela o coração desta recomendação.** É a única
fase que combina: ganho de percepção alto, esforço M, dependência zero,
custo de arte zero, risco de infra zero, e que **produz a interface de que
a Fase 2 vai precisar de qualquer forma**. Se a janela até o pitch acabar
com só as Fases 0 e 1 entregues, o pedido original do usuário ("melhorar a
aparência de cada item gráfico") **já terá sido cumprido de forma
defensável** — porque o gap medível hoje é de variedade de forma, e é
exatamente esse que a Fase 1 fecha.

**A Fase 2 só deve iniciar depois de a Fase 1 estar em produção e validada
por PNG.** Antes disso ela não tem chave de endereçamento e não tem
fallback.

### Cards a registrar em `docs/BACKLOG-PRODUTO.md`

Este documento **não edita o backlog** — a recomendação é registrar três
cards, seguindo a numeração já existente da família (`GH-WORLD-01` a
`GH-WORLD-08`, todos fechados hoje):

| ID sugerido | Título | Esforço | Depende de |
|---|---|---|---|
| **`GH-WORLD-09`** | Nameplate de tier na própria sede (paridade `WorldScreen` ↔ `VisitaScreen`) | P | — (dado já carregado em `app/world/page.tsx`) |
| **`GH-WORLD-10`** | Silhueta própria por item de mobília e por cargo de IA (`Degrau A+`) | M | `GH-WORLD-09` (ordem, não técnica); relacionado a `GH-WORLD-03`, `GH-WORLD-05`, `GH-WORLD-07` |
| **`GH-WORLD-11`** | Pipeline de sprite atlas para a Sede (`G2` / `Degrau B`) | G | `GH-WORLD-10` |

Relações a citar nos cards, para não duplicar escopo:
- `GH-MAPA-05` (Mapa Vivo) — **fornece a camada de cor**; estes cards não a
  tocam. `GH-WORLD-09` é literalmente o item aberto listado em
  `docs/mapa-vivo/TAREFAS-PENDENTES.md`, reduzido ao badge de tier.
- `GH-SIM-01` (ECS/tick, `G1`) — **não é dependência** de nenhum dos três.
  Registrar isso explicitamente no card `GH-WORLD-11` evita que uma sessão
  futura o bloqueie por engano.
- `GH-OPS-08` (Kong/Traefik) — bloqueia presença ao vivo, **não bloqueia
  nada deste documento**.

### Registro em documentos-pai (recomendação, não executado aqui)

- `docs/world/EVOLUCAO-MOTOR-2026.md` §6.2: acrescentar o **Degrau A+**
  entre A e B, apontando para este documento.
- `docs/mapa-vivo/TAREFAS-PENDENTES.md`: desmembrar a linha "badge de tier
  + cor de presença em `WorldScreen.tsx`" em duas — badge (Fase 0, pronto
  para fazer) e presença (bloqueado por `GH-OPS-08`, pós-pitch).
- `docs/PROXIMA-TAREFA.md`: apontar `GH-WORLD-09` como próximo card do
  trilho visual da Sede.
