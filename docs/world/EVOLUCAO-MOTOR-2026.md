# Evolução do motor de gamificação — arquitetura-alvo 2026

> **Escopo:** como levar o World (`/world`) de "sala isométrica funcional" para
> **plataforma de simulação de negócios de nível estúdio**, mantendo a stack
> React/Next.js e a arquitetura multi-tenant que já existe.
>
> **Método:** pesquisa de mercado de julho/2026 (fontes em §13) + auditoria do
> que já está construído. Cada recomendação diz **o que muda, por que, e qual
> o gatilho de decisão** — nada de "troca porque é mais novo".
>
> **Leia antes:** [`ARQUITETURA-WORLD.md`](ARQUITETURA-WORLD.md) (decisão
> original de engine) · [`MAPA-MUNDI-VALE-DO-CAFE.md`](MAPA-MUNDI-VALE-DO-CAFE.md)
> (multi-tenant) · [`../BACKLOG-PRODUTO.md`](../BACKLOG-PRODUTO.md)

---

## 1. Sumário executivo — o veredito

Fiz a pesquisa esperando concluir que precisávamos trocar de engine. **Não
precisamos.** O achado mais importante desta análise é contra-intuitivo:

> **O renderer não é o gargalo. O gargalo é que não existe uma camada de
> simulação.** Hoje o World *desenha* um escritório; ele não *simula* um
> negócio. Trocar PixiJS por Three.js resolveria um problema que não temos e
> custaria 4–6 semanas que deveriam ir para a simulação.

**Decisão de engine: manter PixiJS v8.** A pesquisa confirma que ele é o
renderer 2D mais rápido e de menor overhead disponível, agora WebGPU-first, com
~200 KB contra ~500 KB do Phaser. Já está integrado, com o miolo puro e testado.
Matriz completa e gatilhos de troca em §4.

**Onde investir, em ordem de retorno:**

| # | Investimento | Por que é isto | Fase |
|---|---|---|---|
| 1 | **Camada de simulação (ECS + tick determinístico)** | É o que separa "tela bonita" de "jogo". Destrava humor da equipe, produção, rotina dos avatares, progressão ociosa | G1 |
| 2 | **Pipeline de arte** | Hoje desenhamos por código. É o teto visual real — não o engine | G2 |
| 3 | **Live ops + progressão sazonal** | D30 de 30–40% (melhores da classe) vs 15–25% (média) depende disto | G3 |
| 4 | **Presença multiplayer** | O diferencial do produto: vizinhos reais da região | G4 |
| 5 | **Performance a escala** | Só vira problema depois do item 2 (assets pesam) | G5 |

**O que NÃO fazer** (economias deliberadas, justificadas em §4 e §7.4):
- ❌ Migrar para Three.js/R3F — muda a direção de arte e não resolve nada nosso
- ❌ Servidor de jogo em tempo real (Colyseus) — é simulação de negócio, não FPS
- ❌ Predição de cliente / lag compensation — não há latência competitiva aqui
- ❌ Reescrever o `engine/` puro — ele já é a fundação certa

---

## 2. Baseline honesto — o que existe hoje

Auditoria do que está commitado (`724d1c2`), sem otimismo:

| Camada | Estado | Nota |
|---|---|---|
| Geometria isométrica | ✅ Sólida | Projeção + inversa, depth-sort, bijeção slot↔célula, 44 testes |
| Pathfinding | ✅ Sólido | BFS 4-vizinhos, desvia de mobília |
| Renderer | 🟡 Funcional, teto baixo | PixiJS v8, desenho procedural por `Graphics`, **zero assets** |
| Mobília | 🟡 4 silhuetas | Diferenciadas por categoria, mas 1 tile cada, sem rotação |
| Avatares | 🟡 Andam | Só o dono se move; os de IA são estáticos |
| **Simulação** | ❌ **Inexistente** | Nada muda sozinho. Sem tempo, sem necessidades, sem produção |
| **Economia viva** | ❌ Inexistente | Atributos sobem por evento discreto; não há fluxo contínuo |
| **Live ops** | ❌ Inexistente | Sem temporada, missão diária, evento |
| **Multiplayer** | ❌ Inexistente | Vizinhos existem no mapa, mas a sede é ilha |
| Persistência | ✅ Sólida | RLS forçada, RPCs atômicas, dois adapters |

**Métricas atuais:** `/world` = 154 kB First Load · 84 testes · sala de 4×4 a
8×8 tiles · até 14 móveis · 5 avatares.

**Diagnóstico em uma frase:** temos um *cenário* excelente e **nenhum ator com
vida própria**.

---

## 3. Pesquisa de mercado 2026

### 3.1 Renderers 2D/3D para web

| Engine | Versão 2026 | Tamanho | Natureza | Veredito p/ nós |
|---|---|---|---|---|
| **PixiJS** | v8.19 | ~200 KB | Renderer puro, WebGPU-first | ✅ **Manter** |
| **Phaser** | 4 (estável) | ~500 KB | Framework completo | ❌ Traz física/cenas que não usamos |
| **Three.js / R3F** | WebGPU default | Grande | 3D real | ❌ Muda a direção de arte |
| **Babylon.js** | WebGPU | Grande | 3D, TS-first | ❌ Idem |

Achados relevantes:

- **PixiJS v8** é descrito como o renderer 2D mais rápido, com o menor overhead,
  ~3× menor e ~2× mais rápido que Phaser para renderização pura. Novidades de
  2026: **texturas HTML-em-canvas ao vivo**, export Graphics→SVG, `SplitText`,
  renderer Canvas de fallback.
- **Phaser 4 saiu do beta** e é produção em 2026, com **Spine como cidadão de
  primeira classe**, `Mesh2D`, stencil e até 3D. É um bom engine — só que somos
  um app Next.js com arquitetura própria; o valor do Phaser está justamente nas
  partes (cenas, física, input, áudio) que já resolvemos de outro jeito.
- **Three.js/R3F amadureceu para jogos** em 2025–26 (física e character
  controllers), e há quem recomende Three.js para isométrico *2.5D com
  perspectiva 3D real*. **Esse é o ponto de bifurcação de direção de arte**,
  não de performance — ver §4.2.

### 3.2 WebGPU — deixou de ser aposta

Marco importante para o planejamento: em **março/2026 o WebGPU está em ~84,7%
dos navegadores globais** e é *baseline* em todos os principais — Chrome, Edge,
Firefox e Safari (que shipou no Safari 26, set/2025).

**Consequência prática:** o `preference: "webgpu"` do Pixi v8 deixa de ser
experimental. Ativamos com fallback automático para WebGL — ganho de batching
sem risco. Detalhe em §8.3.

### 3.3 Arquitetura de estado — ECS

| Lib | Filosofia | Trade-off |
|---|---|---|
| **bitECS** | Data-oriented, typed arrays (SoA), entidade = número | Performance máxima, DX mais crua |
| **miniplex** | DX-first, TS-first, sem scheduler embutido | Integra com o que já usamos; menos rápido no extremo |
| Geotic | Arquétipos + serialização | Menos tração |

**Recomendação: `miniplex`.** O argumento decisivo não é performance — é que
**miniplex deliberadamente não traz scheduler próprio**, o que o deixa conviver
com o nosso tick e com o React sem brigar por controle do loop. Nossa escala
(dezenas de entidades por sala, não milhares) não chega perto de exigir o
struct-of-arrays do bitECS. *Gatilho de troca para bitECS: se uma sala passar de
~2.000 entidades ativas.*

### 3.4 Animação

| Ferramenta | Runtime | Força | Uso aqui |
|---|---|---|---|
| **Rive** | ~200 KB gz | **Máquinas de estado interativas**, data binding | ✅ HUD e micro-interações |
| **Lottie** | ~60 KB gz | Leve; ganhou state machines em dotLottie (fim/2025) | 🟡 Alternativa barata |
| **Spine** | Médio | Esqueletal 2D para personagens | 🟡 Só quando tivermos personagens de verdade |

A diferença central: **Rive tem máquina de estado, Lottie (historicamente) não**
— e a recomendação de 2026 para UI/micro-interação é Rive, com Lottie para
animação linear de designer e CSS para transição de UI.

**Plano:** Rive para os momentos de recompensa do HUD (level-up, degrau, ganho
de atributo) na fase G3; **não** para os avatares — ali o caminho é sprite ou
esqueletal (§3.6).

### 3.5 Multiplayer — o achado que economiza mais dinheiro

| Opção | Feito para | Nosso caso |
|---|---|---|
| **Colyseus** | Estado autoritativo, matchmaking, tempo real | ❌ Overkill |
| **PartyKit** | Edge, integra Y.js/XState/tldraw | 🟡 Se virar co-edição |
| **Supabase Realtime** | Presença, estado persistente, leaderboard | ✅ **Certo** |

A literatura é explícita: Supabase **não** tem simulação autoritativa, predição
de cliente nem lag compensation — e é justamente por isso que serve. O critério
citado: *"se o seu jogo parece mais um web app com mecânicas de jogo do que um
FPS de baixa latência, Supabase encaixa naturalmente"*. É exatamente nós.

**Consequência:** presença multiplayer (quem está online, quem visita sua sede)
sai com **zero infra nova** — já temos Supabase. *Gatilho para Colyseus: se
algum dia houver interação sincronizada sub-100ms entre jogadores na mesma sala.*

### 3.6 Pipeline de arte isométrica

Boas práticas consolidadas para 2026:

- **Aseprite via CLI** para export em lote — é o que torna o pipeline
  automatizável; manter os `.aseprite` no versionamento e exportar no build.
- **Atlas** com TexturePacker (ou Free Texture Packer) — reduz draw calls.
- **Manter a fonte em 1×** e deixar o engine escalar em múltiplo inteiro; nunca
  assar o 2×/3× no PNG.
- **Scripts de validação em CI**: paleta aprovada e dimensões por frame.
- **Geradores por IA** (PixelLab e similares) já entregam rotação 4/8 direções
  com suporte isométrico — viável para volume, com curadoria humana.

### 3.7 Live ops e retenção

- **Benchmark:** melhores da classe batem **D30 de 30–40%**, contra média de
  **15–25%** — o dobro. A diferença é operação contínua, não conteúdo inicial.
- **Battle/season pass** segue como mecânica-âncora de live ops, com trilha de
  recompensa e tarefas diárias/semanais sustentando o meio-termo entre entregas.
- **Tendência 2026:** templatização (sistemas reaproveitáveis em portfólio),
  personalização dinâmica por comportamento e uso de IA.
- **Insight de negócio** que casa com o nosso produto: *quando o jogador se
  sente sócio e não cliente, retenção e receita sobem juntas.*

> ⚠️ **Adaptação obrigatória ao nosso contexto:** somos B2B com negócios reais e
> MEI. Um "battle pass" pago seria desastroso de imagem. A tradução correta é
> **"Temporada de 90 dias"** — que já é o ciclo de melhoria contínua do produto
> (`retro_90d` já existe em `engine.ts`). Recompensa em moeda virtual e
> desbloqueio de serviço real, **nunca** em R$. Detalhe em §7.3.

---

## 4. Decisão de engine

### 4.1 Matriz

Pesos pelo que o produto exige (simulador de negócio isométrico, mobile-first,
dentro de um app Next.js multi-tenant):

| Critério | Peso | PixiJS v8 | Phaser 4 | Three.js/R3F |
|---|---|---|---|---|
| Integração com Next.js/React existente | 5 | 5 | 3 | 4 |
| Tamanho de bundle (mobile-first) | 5 | 5 | 3 | 2 |
| Ajuste à direção de arte (Habbo/Sims) | 5 | 5 | 5 | 3 |
| Performance 2D | 4 | 5 | 4 | 3 |
| Não trazer o que não usamos | 4 | 5 | 2 | 3 |
| Custo de migração a partir de hoje | 5 | 5 | 2 | 1 |
| Ecossistema de animação | 3 | 3 | 5 | 4 |
| Caminho para 3D futuro | 2 | 2 | 3 | 5 |
| **Total ponderado** | | **⭐ 160** | 119 | 106 |

### 4.2 O único argumento real a favor do Three.js — e por que não pega

A pesquisa recomenda Three.js quando o isométrico é **2.5D com perspectiva 3D
de verdade** (câmera orbitável, iluminação dinâmica, sombras projetadas).

Isso é sedutor, mas colide com o briefing: a referência pedida é **Startup
Panic + Habbo + The Sims mobile** — os três são **projeção fixa, sem câmera
livre**. A leitura instantânea da silhueta *depende* do ângulo travado. Ganhar
órbita de câmera seria perder a identidade visual pedida.

**Gatilhos que reabrem esta decisão** (revisar se qualquer um ocorrer):
1. Requisito de câmera orbitável ou de andares múltiplos visíveis simultaneamente.
2. Necessidade de iluminação dinâmica com sombras projetadas em tempo real.
3. Uma sala passar de ~5.000 objetos (aí `InstancedMesh` do Three ganha).

### 4.3 Veredito

✅ **PixiJS v8, com WebGPU ativado e fallback WebGL.** Reavaliar em 12 meses ou
ao primeiro gatilho de §4.2.

---

## 5. Arquitetura-alvo

### 5.1 As cinco camadas

```
┌─────────────────────────────────────────────────────────────┐
│ L4 · PRESENÇA          Supabase Realtime (quem está online, │
│                        visitas, reações)                    │
├─────────────────────────────────────────────────────────────┤
│ L3 · UI / HUD          React + Framer Motion + Rive         │
│                        (nunca dentro do canvas)             │
├─────────────────────────────────────────────────────────────┤
│ L2 · RENDERER          PixiJS v8 — casca fina, sem regra    │
│                        (features/world/render/)             │
├─────────────────────────────────────────────────────────────┤
│ L1 · SIMULAÇÃO   🆕    ECS (miniplex) + tick determinístico │
│                        (features/world/sim/)                │
├─────────────────────────────────────────────────────────────┤
│ L0 · DOMÍNIO           Server Actions + RPC atômica + RLS   │
│                        (features/*/actions.ts, lib/db/)     │
└─────────────────────────────────────────────────────────────┘
         ▲ autoridade                    apresentação ▼
```

**Regra de ouro, inegociável:** a seta de autoridade aponta para baixo. Nada em
L1/L2 decide valor econômico. A simulação do cliente é **preditiva e cosmética**;
a verdade é sempre L0. É o que já fazemos com `aplicarProgresso` e é o que
mantém o jogo à prova de fraude com F12 aberto.

### 5.2 A decisão central: dois relógios

O erro clássico em simulador web é ter **um** loop. Precisamos de dois, com
responsabilidades separadas:

| Relógio | Frequência | Onde | Responsabilidade | Autoridade |
|---|---|---|---|---|
| **Apresentação** | 60 Hz (rAF) | Cliente | Interpolar posição, animar, partículas | ❌ Nenhuma |
| **Simulação** | 4–10 Hz fixo | Cliente | Necessidades, humor, rotina dos avatares | ❌ Preditiva |
| **Econômico** | *lazy* | Servidor | Produção, custo, atributos, XP | ✅ **Única** |

#### O relógio econômico é *lazy* — e isso economiza a operação inteira

Não há loop no servidor. O estado é calculado **na leitura**, a partir de
`(ultimoTick, agora)`:

```ts
// features/world/sim/economia.ts  (puro, testável)
export function evoluirEconomia(
  estado: EstadoEconomico,
  decorridoMs: number,
): { estado: EstadoEconomico; eventos: EventoEconomico[] }
```

Vantagens, todas relevantes para uma VPS pequena:
- **Custo de infra ~zero** — sem processo de simulação rodando 24/7.
- **Progressão ociosa de graça** — "o que aconteceu enquanto você esteve fora"
  cai fora naturalmente; é o padrão de idle game.
- **Determinístico e testável** — função pura, sem relógio de parede embutido.
- **Escala com o número de jogadores ativos**, não com o de cadastrados.

> Este é o insight de arquitetura mais valioso deste documento. Um simulador de
> negócio **não precisa de servidor de jogo** — precisa de uma função pura de
> evolução temporal e de um carimbo de tempo.

### 5.3 Estrutura de pastas alvo

```
src/features/world/
├── engine/                  ✅ EXISTE — geometria pura
│   ├── iso.ts               projeção + inversa + depth-sort
│   ├── sala.ts              geometria, slot↔célula, distribuição
│   ├── caminho.ts           BFS
│   └── engine.test.ts       44 testes
│
├── sim/                     🆕 G1 — SIMULAÇÃO (puro, sem React/Pixi)
│   ├── mundo.ts             criação do mundo ECS (miniplex)
│   ├── componentes.ts       Posicao, Movimento, Necessidade, Humor, Producao…
│   ├── sistemas/
│   │   ├── movimento.ts     consome caminho, avança posição
│   │   ├── necessidades.ts  decaimento (energia, foco, moral)
│   │   ├── humor.ts         deriva humor de necessidades + ambiente
│   │   ├── rotina.ts        IA de rotina: escolhe próximo destino/tarefa
│   │   └── producao.ts      converte trabalho em entrega
│   ├── economia.ts          evolução temporal pura (lazy, servidor)
│   ├── relogio.ts           tick de passo fixo + acumulador
│   └── *.test.ts            alvo: cobertura alta — é regra de negócio
│
├── render/                  ✅ EXISTE — casca Pixi
│   ├── WorldCanvas.tsx      ponte React↔Pixi
│   ├── cena.ts              → refatorar para ler do ECS
│   ├── desenho.ts           → migrar para sprites quando houver atlas
│   ├── cores.ts             tokens → número
│   ├── camadas.ts           🆕 culling + spatial hash
│   └── atlas.ts             🆕 G2 — carregamento de spritesheet
│
├── liveops/                 🆕 G3
│   ├── temporada.ts         trilha de 90 dias
│   ├── missoes.ts           diária/semanal
│   └── eventos.ts           calendário
│
├── presenca/                🆕 G4
│   └── canal.ts             Supabase Realtime
│
└── WorldScreen.tsx          ✅ orquestração React
```

### 5.4 Modelo ECS proposto

```ts
// componentes.ts — dados puros, sem método
export interface Posicao { cx: number; cy: number }
export interface Movimento { caminho: Celula[]; passo: number; progresso: number }
export interface Necessidade { energia: number; foco: number; moral: number }  // 0..100
export interface Humor { valor: "otimo" | "bem" | "cansado" | "travado" }
export interface Producao { eixo: AtributoChave; porTick: number; acumulado: number }
export interface Rotina { tipo: "ocioso" | "indo" | "trabalhando"; alvo?: Celula }
export interface Aparencia { cor: number; nome: string; dono: boolean }
export interface Movel { itemId: string; slot: number; categoria: CategoriaMovel }
```

Entidades por arquétipo:

| Entidade | Componentes |
|---|---|
| Dono | `Posicao + Movimento + Aparencia + Necessidade + Humor` |
| Funcionário de IA | `Posicao + Movimento + Aparencia + Rotina + Producao` |
| Móvel | `Posicao + Movel` (+ `Producao` se for estação de trabalho) |
| Visitante (L4) | `Posicao + Movimento + Aparencia` (efêmero, não persiste) |

**Ganho imediato do ECS aqui:** hoje `cena.ts` tem `Map<string, Andarilho>` na
mão e `EstadoCena` remontado a cada `useMemo`. Com ECS, adicionar "móvel que
produz" ou "visitante" vira **um componente novo**, sem tocar no renderer.

> 🔌 **Gancho já pronto para `Rotina` (GH-EQP-01, implementado 2026-07-27):**
> o modelo de disponibilidade de recurso (`lib/disponibilidade.ts`,
> `Alocacao`/`Disponibilidade` em `lib/db/types.ts`) já persiste exatamente o
> dado que o componente `Rotina` acima vai precisar — `disponibilidade.estado
> === "alocado"` mapeia direto para `Rotina.tipo = "trabalhando"`, e
> `jobId`/`expiraEm` já existem para popular um balão "ocupado até X" sobre o
> avatar do Funcionário de IA no World (mesma linguagem visual dos balões de
> humor do Startup Panic, §"O que NÃO mudar" do documento original). Quando
> G1 chegar, é ler `listarAlocacoesAtivas()` e alimentar `Rotina` — não é
> preciso inventar um novo dado nem migration nova para isso.

### 5.5 Fronteira ECS ↔ Pixi

Perigo real: reconstruir objetos Pixi a cada tick mata a performance.

**Padrão adotado — reconciliação por `id`:**

```ts
// render/cena.ts
sincronizar(mundo: MundoECS): void {
  for (const e of mundo.query(Posicao, Aparencia)) {
    let vista = this.vistas.get(e.id);
    if (!vista) { vista = criarVista(e); this.vistas.set(e.id, vista); }
    aplicar(vista, e);          // só muta position/zIndex/tint
  }
  this.removerOrfaos(mundo);    // destrói o que sumiu do ECS
}
```

Regras: **criar** só quando a entidade aparece; **mutar** propriedades no tick;
**destruir** só quando some. Nunca `removeChildren()` no loop.

---

## 6. Direção de arte — "isométrico vetorial com profundidade"

### 6.1 A síntese das três referências

| Referência | O que herdamos | O que descartamos |
|---|---|---|
| **Startup Panic** | Ribbon coral, HUD de cartões, paleta quente, humor no texto | Pixel art datado |
| **Habbo** | Sala isométrica social, mobília colocável, avatar andando | Resolução baixa |
| **The Sims mobile** | Formas arredondadas, luz suave, leitura de necessidades | Câmera livre |

**Nossa assinatura:** silhueta chunky e legível (Habbo) + acabamento moderno
com luz consistente e sombra suave (Sims) + cromo de UI com humor (Startup
Panic). Chamamos de **isométrico vetorial com profundidade** — e a boa notícia
é que **já é o que o `desenho.ts` faz hoje**: três tons da mesma cor de token
por face, luz constante. O que falta é densidade de detalhe.

### 6.2 Evolução em três degraus

| Degrau | Técnica | Custo | Teto visual |
|---|---|---|---|
| **A — hoje** | `Graphics` procedural | Zero | 6/10 |
| **B — G2** | Atlas de sprites + `Graphics` para realces | Médio (arte) | 8,5/10 |
| **C — G5+** | Sprites + normal map / iluminação por shader | Alto | 9,5/10 |

O degrau B é onde está o salto de percepção. E há uma vantagem estratégica em
ter começado por A: **a geometria já está validada**, então trocar
`desenharMovel()` por `Sprite.from(atlas)` não mexe em nenhuma regra.

### 6.3 Padrões inegociáveis de arte

1. **Fonte em 1×, escala inteira no render** (`roundPixels: true`) — nunca assar
   escala no PNG.
2. **Uma direção de luz na cena inteira** — topo 1.0 / direita 0.78 / esquerda
   0.58 (já implementado, manter).
3. **Cor só por token** — `cores.ts` é o único tradutor token→Pixi.
4. **Sombra de contato obrigatória** em tudo que toca o chão — é o que cola o
   objeto no piso.
5. **Silhueta antes de detalhe** — o objeto precisa ser reconhecível em 32 px.

### 6.4 Pipeline de asset (G2)

```
arte/fonte/*.aseprite   (versionado)
        │  aseprite --batch --sheet  (CLI)
        ▼
arte/build/*.png + *.json
        │  TexturePacker → atlas
        ▼
public/atlas/world-{1x,2x}.{png,json}
        │  Assets.load() do Pixi
        ▼
render/atlas.ts
```

Gates de CI: validação de paleta e de dimensão por frame — pega deriva de arte
antes do merge, do mesmo jeito que o `tsc` pega deriva de tipo.

---

## 7. Gamificação avançada

### 7.1 A pirâmide de loops

O que falta não é "mais pontos" — é ter loops de **horizontes diferentes**:

```
        ┌──────────────────────────┐
        │ ANUAL · maturidade real  │  escada de valor (✅ existe)
        ├──────────────────────────┤
        │ TRIMESTRAL · temporada   │  🆕 G3 — ciclo de 90 dias
        ├──────────────────────────┤
        │ SEMANAL · missões        │  🆕 G3
        ├──────────────────────────┤
        │ DIÁRIO · check-in, humor │  🆕 G1/G3
        ├──────────────────────────┤
        │ SESSÃO · ações no World  │  ✅ existe
        └──────────────────────────┘
```

Hoje só as pontas existem. **O meio é o que retém** — é exatamente o vão que os
benchmarks de D30 (§3.7) medem.

### 7.2 Necessidades e humor (o "The Sims" do produto)

Camada de G1, com tradução direta para vocabulário de PME:

| Necessidade | Sobe com | Cai com | Leitura no mundo |
|---|---|---|---|
| **Energia** | Móvel de conforto, folga | Tempo, entregas | Balão 😴 |
| **Foco** | Ambiente organizado (Processo alto) | Excesso de tarefa | Balão 🌀 |
| **Moral** | Entrega concluída, reconhecimento | Prazo estourado | Balão 😤 |

Isso realiza o **`RF-SED-06`** já catalogado ("estado da equipe perceptível sem
abrir menu") e amarra a mobília — que hoje dá bônus de atributo — a um efeito
**visível e contínuo**, não só numérico.

**Regra de projeto:** necessidade **nunca** vira punição destrutiva. Moral baixa
reduz produção; não destrói progresso. É produto B2B, não jogo de sobrevivência.

### 7.3 Temporada de 90 dias (nosso "pass", sem o pass)

| Aspecto | Battle pass de mercado | Nossa adaptação |
|---|---|---|
| Duração | 30–90 dias | **90 dias** (= ciclo de retro já existente) |
| Compra | Tier premium em R$ | ❌ **Nunca.** Só trilha gratuita |
| Recompensa | Cosmético | Moeda virtual, mobília exclusiva, **desbloqueio de serviço real** |
| Tarefa | Diária/semanal | Ação real de negócio (publicar oferta, fechar parceria) |
| Fim de ciclo | Reset | **Retrospectiva de 90 dias** (evento `retro_90d`, já existe) |

O encaixe é forte: o ciclo de melhoria contínua do produto **já é** trimestral.
A temporada não inventa cadência — dá forma de jogo à cadência que o negócio já
tem.

### 7.4 Anti-fraude — o que a arquitetura garante

| Vetor | Mitigação | Estado |
|---|---|---|
| Editar estado no console | L0 é a única autoridade | ✅ Já vale |
| Repetir evento para farmar XP | Guarda server-side | ✅ Equipe de IA; 🟡 falta no marketplace |
| Forjar tempo decorrido | `now()` do servidor, nunca do cliente | 🆕 Obrigatório em G1 |
| Acelerar o tick | Tick do cliente é cosmético | ✅ Por construção |

> ⚠️ **O risco novo que G1 introduz:** progressão ociosa cria incentivo para
> mexer no relógio. `evoluirEconomia` **jamais** pode receber tempo vindo do
> cliente. Carimbo só de `now()` do Postgres, com teto por chamada.

---

## 7.5 Telemetria — o pré-requisito que quase ficou de fora

> ⚠️ **Correção a este próprio documento.** A §7.3 recomenda live ops citando
> benchmark de D30 (30–40% vs 15–25%). Recomendar live ops **sem definir como
> medir** é incoerente: não se opera o que não se mede. Esta seção fecha o buraco
> — e **G3 não pode começar antes dela.**

### O mínimo viável de instrumentação

Não precisamos de plataforma de analytics de jogo. Precisamos de **uma tabela de
eventos** e três consultas.

```sql
-- 0007_telemetria.sql (proposta)
create table public.eventos_telemetria (
  id          bigint generated always as identity primary key,
  tenant_id   bigint not null references public.negocios (id) on delete cascade,
  tipo        text   not null,          -- 'sessao_inicio', 'movel_comprado', …
  props       jsonb  not null default '{}'::jsonb,
  criado_em   timestamptz not null default now()
);
create index on public.eventos_telemetria (tenant_id, criado_em desc);
create index on public.eventos_telemetria (tipo, criado_em desc);
```

RLS: leitura só do próprio tenant; agregação para o time via `service_role`.
**Nunca** gravar PII em `props` — só ids e enums, mesma regra do resto do projeto.

### As perguntas que precisam de resposta

| Métrica | Como sai | Por que importa |
|---|---|---|
| **D1 / D7 / D30** | `count(distinct tenant_id)` por janela desde o cadastro | É o número da §7.3; sem ele, live ops é achismo |
| **Funil de primeira sessão** | `cadastro → entra no World → 1º móvel → 1ª ação real` | Onde o usuário novo trava (ver §7.6) |
| **Tempo até a 1ª ação de valor** | delta entre `cadastro` e primeiro evento de negócio | Proxy de "o produto fez sentido?" |
| **Adesão à temporada** | tenants com ≥1 missão concluída / ativos | Prova se a temporada retém ou é enfeite |
| **Sala morta** | tenants com sede mas 0 móveis após 7 dias | Sinal de que o World não engajou |

### Implementação

- Um único `registrarEvento(tipo, props)` em `features/telemetria/`, chamado de
  dentro das Server Actions que já existem — **não** do cliente (evita bloqueio
  por ad-blocker e falsificação).
- **Fire-and-forget**: falha de telemetria nunca pode derrubar uma ação de
  negócio. `void registrarEvento(...)` sem `await` no caminho crítico.
- Sem SaaS de terceiro na fase 1: já temos Postgres, e o volume é baixo.

---

## 7.6 Primeira sessão (FTUE) — a lacuna que a verificação expôs

Testando o World com um tenant **recém-criado** (500 moedas, sede nível 1, sala
vazia, sem equipe), o que aparece é: **uma sala vazia, um boneco, nenhuma
instrução.** Tudo funciona — e mesmo assim é a pior tela do produto, porque é a
primeira que o usuário real vê.

O `SedeScreen`/`WorldScreen` assume um jogador que já tem contexto. Não temos.

| Problema | Efeito | Correção proposta | Fase |
|---|---|---|---|
| Sala vazia sem direção | Usuário sai sem agir | **Missão-âncora no World**: "Compre seu primeiro equipamento" com o slot pulsando | G1 |
| Nada explica o clique | Não descobre que anda / move móvel | Dica contextual na 1ª sessão, dispensável | G1 |
| 500 moedas compram só 1–2 itens | Sensação de pobreza logo na entrada | Rever preço de entrada **ou** dar 1 móvel inicial grátis no cadastro | G1 |
| Sem feedback de "cheguei em algum lugar" | Sem gancho de retorno | Recompensa visível no 1º móvel (já temos toast + ganho de atributo) | ✅ existe |

**Recomendação forte:** entregar a sede inicial **com um móvel já colocado**
(uma mesa) no momento do cadastro. Custa uma linha no fluxo de criação, elimina
a tela vazia e ensina a mecânica por exemplo em vez de por texto — é o que
Habbo e The Sims fazem no primeiro quarto.

---

## 8. Orçamento de performance

### 8.1 Metas

| Métrica | Meta | Hoje |
|---|---|---|
| Frame budget | 16,6 ms (60 fps) | ✅ sala pequena |
| ├ render | < 8 ms | ~2 ms |
| ├ tick de simulação | < 2 ms | n/a |
| └ folga | > 6 ms | — |
| First Load `/world` | < 200 kB | ✅ 154 kB |
| Entidades por sala | 500 sem queda | ~20 |

### 8.2 Técnicas, na ordem em que passam a importar

A pesquisa é clara sobre a ordem: **culling de viewport** é o maior ganho
isolado; ordenação por força bruta em O(n²) degrada rápido; grade de partição
espacial sustenta ~1k entidades; e 100–200 sprites isométricos custam 1–5 ms de
ordenação a 60 fps.

| # | Técnica | Quando implementar | Ganho |
|---|---|---|---|
| 1 | **Culling de viewport** | G5 (ou já em salas > 10×10) | Alto |
| 2 | **Depth-sort O(n) por bucket** | G5 | Alto |
| 3 | **Spatial hash** | G4 (com visitantes) | Médio |
| 4 | **Atlas + batching** | G2 (vem junto) | Alto |
| 5 | **WebGPU** | G2 | Médio |
| 6 | `ParticleContainer` p/ efeitos | G3 | Médio |

**Sobre o item 2:** nosso `sortableChildren` do Pixi é comparação genérica. Como
a profundidade é `cx+cy` — um inteiro pequeno e limitado — dá para trocar por
**bucket sort O(n)**, que é exatamente a saída recomendada para o problema
clássico de ordenação isométrica.

### 8.3 WebGPU

```ts
await app.init({
  preference: "webgpu",   // cai para WebGL sozinho se faltar
  antialias: true,
  autoDensity: true,
  resolution: Math.min(2, devicePixelRatio),
  roundPixels: true,      // nitidez em escala inteira
});
```

Com ~84,7% de suporte e fallback automático, o risco é próximo de zero.

---

## 9. Qualidade e testabilidade

O padrão que já provou valor aqui — **regra pura fora do canvas** — vira a regra
formal:

| Camada | Como se testa | Meta |
|---|---|---|
| `engine/` | Vitest puro | ✅ 49 testes |
| `sim/` | Vitest puro, tick determinístico | 🎯 > 80% |
| `render/` | Inspeção do scene graph + extração de PNG | Fumaça |
| L0 | Rota de autoteste temporária | ✅ padrão firmado |

### O que o teste unitário NÃO pega (e como cobrir)

Auditoria do World encontrou **quatro** defeitos que passaram por `tsc`, Vitest
e `next build` sem um alerta. Vale registrar o padrão, porque vai repetir:

| Defeito | Por que escapou | Como foi pego |
|---|---|---|
| Paredes em serrote | Geometria "compila" torta | PNG extraído do canvas |
| Dono e IA na mesma célula | Nenhum teste afirmava distinção | Leitura do scene graph |
| Escala dupla (Pixi × CSS) | Dois mecanismos certos isolados, errados juntos | Medição no viewport mobile |
| Canvas não crescia com a sede | Estado inicial sempre correto | Simular evolução em runtime |

**Lição:** em camada de canvas, a asserção que importa é sobre **o pixel e o
grafo de cena**, não sobre a função. Toda mudança visual pede: (a) extrair PNG e
olhar, (b) medir no viewport estreito, (c) simular a progressão do jogador — não
só o estado inicial.

**Determinismo obrigatório em `sim/`:** RNG com semente explícita, nunca
`Math.random()` solto. Sem isso, não há teste reprodutível nem replay.

**Herança da sessão anterior** (já documentada no `AGENTS.md`): em navegador
headless a aba fica `hidden` e o `requestAnimationFrame` **congela**, então o
Pixi monta e não desenha nada. O gancho `window.__world` + `desenharUmFrame()`
+ `extract.base64()` é o que permitiu pegar duas regressões visuais que
typecheck, teste e build não pegariam. **Manter esse gancho.**

---

## 10. Roadmap

| Fase | Entrega | Esforço | Depende de | Valor |
|---|---|---|---|---|
| **G0** | WebGPU + bucket sort + `roundPixels` | P | — | Base técnica barata |
| **G1** | **ECS + tick + necessidades/humor + economia lazy** | **G** | G0 | 🔴 **O jogo ganha vida** |
| **G2** | Pipeline de arte + atlas + sprites | G | G0 | 🔴 Salto visual |
| **G2.5** | **Telemetria (§7.5) + FTUE (§7.6)** | **P** | G1 | 🔴 **Pré-requisito de G3** |
| **G3** | Temporada 90d + missões + Rive no HUD | M | **G2.5** | 🔴 Retenção |
| **G4** | Presença via Supabase Realtime + visitar vizinho | M | G1 | 🟡 Diferencial |
| **G5** | Culling + spatial hash + salas grandes | M | G2 | 🟡 Escala |
| **G6** | Editor de layout, andares, mobília multi-tile | G | G2, G5 | 🟢 Profundidade |

### Sequência recomendada

```
G0 ──► G1 ──┬──► G3 ──► G4
            └──► G2 ──► G5 ──► G6
```

**G1 é o desbloqueio conceitual** — do mesmo jeito que a economia de atributos
foi para a Trilha A. Sem simulação, G3 vira "checklist com pontos" e G2 vira
"escritório bonito e morto".

### Primeiro passo concreto (o próximo card)

**`GH-SIM-01` — Tick determinístico + ECS mínimo**
- Instalar `miniplex`; criar `sim/mundo.ts`, `sim/relogio.ts`, `sim/componentes.ts`
- Migrar movimento do avatar de `cena.ts` para `sistemas/movimento.ts`
- `cena.ts` passa a **ler** do ECS (reconciliação por id, §5.5)
- Testes de tick determinístico (mesma semente ⇒ mesma sequência)
- **Sem mudança visual** — é refatoração de fundação, e é assim que deve ser

---

## 11. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| ECS vira over-engineering para ~20 entidades | Média | Médio | Escopo G1 só ao que já existe; não criar componente sem sistema que o consuma |
| Arte não acompanha (sem designer) | **Alta** | **Alto** | Degrau A continua válido; IA para volume + curadoria (§3.6) |
| Progressão ociosa explorada por relógio | Média | **Alto** | `now()` do Postgres + teto por chamada (§7.4) |
| WebGPU com bug em navegador específico | Baixa | Médio | Fallback automático WebGL |
| Simulação diverge entre cliente e servidor | Média | Médio | Cliente é cosmético por contrato; servidor reconcilia |
| Escopo do World engolir o roadmap de negócio | **Alta** | **Alto** | Fases entregáveis isoladamente; G1 antes de qualquer coisa bonita |

---

## 12. Custos e licenças

| Item | Licença | Custo |
|---|---|---|
| PixiJS v8 | MIT | Grátis |
| miniplex | MIT | Grátis |
| Supabase Realtime | — | Incluso no plano atual |
| Aseprite | Comercial | ~US$ 20 (uma vez) |
| TexturePacker | Freemium | Grátis (ou Free Texture Packer) |
| **Rive** | **Assinatura** | **Avaliar** — só G3; Lottie é o plano B |
| Spine | Comercial | Só se houver personagem esqueletal |

**Total para G0–G2: ~US$ 20.** O custo real é tempo de arte, não licença.

---

## 13. Fontes

Renderers e engines:
- [Phaser vs PixiJS (2026): Game Framework vs Renderer — PixiJS v8](https://generalistprogrammer.com/comparisons/phaser-vs-pixijs)
- [Phaser.js: How We Build 2D Games with JavaScript (2026)](https://www.seeles.ai/resources/blogs/phaser-js-game-development-2026)
- [Phaser — News](https://phaser.io/news)
- [PixiJS — Blog](https://pixijs.com/blog)
- [11 Best Web Game Engines for 2026, Ranked and Compared](https://app.cinevva.com/guides/web-game-engines-comparison)
- [js-game-rendering-benchmark (Three/Pixi/Phaser/Babylon…)](https://github.com/Shirajuki/js-game-rendering-benchmark)
- [React Three Fiber vs Three.js (2026)](https://www.creativedevjobs.com/blog/react-three-fiber-vs-threejs)

WebGPU:
- [WebGPU Browser Support in 2026 — Complete Compatibility Guide](https://webo360solutions.com/blog/webgpu-browser-support/)
- [WebGPU Just Hit Baseline in Every Major Browser](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)
- [What's New in Three.js (2026): WebGPU, New Workflows & Beyond](https://www.utsubo.com/blog/threejs-2026-what-changed)

ECS:
- [bitECS — Introduction](https://bitecs.dev/docs/introduction)
- [miniplex — GitHub](https://github.com/hmans/miniplex)
- [ECS — Web Game Dev](https://www.webgamedev.com/code-architecture/ecs)
- [Entity Component System Architecture for Browser Games](https://simplified.media/guides/ecs-browser-games)

Animação:
- [Rive vs Lottie: Complete Comparison for 2026](https://unicornicons.com/learn/rive-vs-lottie)
- [Lottie vs Rive vs CSS Animations 2026](https://www.pkgpulse.com/guides/lottie-vs-rive-vs-css-animations-web-animation-formats-2026)

Multiplayer:
- [Colyseus — Real-Time Multiplayer Framework](https://colyseus.io/framework/)
- [PartyKit](https://www.partykit.io/)
- [Best Real-Time Multiplayer Backend-as-a-Service (BaaS)](https://viasocket.com/discovery/blog/okokp0/backend-as-a-service-baas/best-real-time-multiplayer-baas-9-top-picks)

Pipeline de arte:
- [Pixel Art Pipelines: Best Tools for 2026](https://relishgames.com/journal/pixel-art-pipelines-best-tools-for-2026/)
- [Isometric pixel art for games & tilesets](https://www.sprite-ai.art/guides/isometric-pixel-art)
- [Aseprite](https://www.aseprite.org/)

Live ops e retenção:
- [Gamification Benchmarks 2026: Retention, Engagement, Tier Progression](https://www.xtremepush.com/blog/gamification-benchmarks-2026-whats-a-good-retention-rate-engagement-score-and-tier-progression)
- [2026 live ops trends: Templatisation, personalisation and AI](https://www.pocketgamer.biz/2026-live-ops-trends-templatisation-personalisation-and-ai/)
- [The Evolution of Battle Pass, Event Pass, and Season Pass Systems](https://www.gamigion.com/the-evolution-of-battle-pass-event-pass-and-season-pass-systems/)
- [Beyond Battle Passes: The Future of Monetization in Live Games](https://beamable.com/blog/beyond-battle-passes-the-future-of-monetization-in-live-games)

Performance isométrica:
- [Isometric Depth Sorting in O(n) or less — GameDev.net](https://www.gamedev.net/forums/topic/579515-isometric-depth-sorting-in-on-or-less/)
- [Spatial partitioning grid — GameDev.net](https://gamedev.net/forums/topic/711411-spatial-partitioning-grid-am-i-doing-it-right/5444239/)
- [Sprite Ordering and Camera culling](https://christt105.github.io/Sprite_Ordering_and_Camera_Culling_Personal_Research/)

---

*Documento vivo. Revisar a decisão de engine (§4) em 12 meses ou ao primeiro
gatilho de §4.2.*
