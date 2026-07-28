# World — o motor de gamificação real (arquitetura)

> 📌 **As fases W1–W5 estão implementadas** (rota `/world`). Para o passo
> seguinte — camada de simulação, pipeline de arte, live ops e presença
> multiplayer — leia **[`EVOLUCAO-MOTOR-2026.md`](EVOLUCAO-MOTOR-2026.md)**,
> que traz pesquisa de mercado de 2026, matriz de decisão de engine e o
> roadmap G0–G6. Este documento aqui segue valendo como o **porquê** das
> decisões originais.

> **World** é a camada nova, ainda não construída, onde vive **o jogo em si**:
> o escritório isométrico furnível e caminhável de cada negócio, comprado ou
> alugado, mobiliado, com a equipe (humana e de IA) representada como
> avatares — conectado visualmente aos negócios vizinhos da região (hoje
> ancorada em **Mendes** e no Vale do Café). Este documento é o preparo
> arquitetural para os próximos prompts de implementação.

---

## 1. Onde o World se encaixa no que já existe

O gamehub **já tem** um "menu inicial" — a navegação do `GameShell`
(Hub / Mapa / Equipe IA / Marketplace / Parcerias + o app-drawer de
"Módulos"). Ver [`../menu-inicial/ARQUITETURA-MENU-INICIAL.md`](../menu-inicial/ARQUITETURA-MENU-INICIAL.md).

O World é o que abre quando o jogador entra na **própria sede** a partir do
Hub — hoje isso é só um fundo isométrico estático (`IsoRoom`) com salas
clicáveis que na verdade são outras empresas (não uma sala navegável de
verdade). O World substitui isso por uma simulação real.

**Insight de arquitetura:** o World não é uma feature nova isolada — ele
**unifica dois stubs que já existem** em `features/roadmap/modules.tsx`:

| Stub atual ("Em breve") | Vira, dentro do World |
|---|---|
| `sede` — "Melhorar escritório" (comparar atual × próximo, funcionários, aluguel, custo) | A mecânica de **comprar/alugar** uma sede maior |
| `loja` — "Loja de móveis" (comprar mobília com atributos Tecnologia/Usabilidade/Estética) | A mecânica de **mobiliar** a sede comprada |

Ou seja: **não crie uma 3ª tela separada.** `sede` + `loja` + o novo
"caminhar pela sala" formam **uma experiência coesa** — o World.

## 2. Pilares de design (a mistura pedida)

| Referência | O que herdamos |
|---|---|
| **Startup Panic** | Simulação de recursos/decisões, HUD, eventos, árvore de maturidade (já implementados fora do World) |
| **Habbo Hotel** | Sala isométrica social, mobília colocável, avatar andando, presença de vizinhos |
| **The Sims** | Necessidades/estado do negócio como barras (energia da equipe, satisfação, capacidade) que sobem/descem com o tempo e ações; comprar/reformar o "lar" (aqui, a sede) |

**Frase-âncora do World:** *"Sua empresa tem um endereço, uma sala e uma
equipe que você pode ver — não só números."*

## 3. Decisão de engine (pesquisa 2026)

Hoje o gamehub renderiza isometria com **DOM + CSS clip-path + Framer
Motion** (`IsoLot`, `QuarteiraoIso`, `IsoRoom`) — ótimo para o **Mapa**
regional (poucas dezenas de lotes, pouca animação simultânea). O World
precisa de mais: múltiplos móveis arrastáveis, avatar(es) andando com
pathfinding simples, depth-sorting (quem fica na frente de quem por
posição), e no futuro presença de outros jogadores na mesma sala.

**Recomendação: manter DOM+Framer Motion para HUD/menus (como hoje), e
introduzir uma camada de renderização dedicada só para o interior do
World.** Duas opções avaliadas:

| Opção | Prós | Contras | Quando usar |
|---|---|---|---|
| **Continuar só DOM+CSS** | Zero dependência nova, mesma stack de hoje | Depth-sorting e drag-drop de móveis viram gambiarra em CSS; não escala pra avatares andando | Só se o World ficar bem simples (sem mover móveis livremente) |
| **PixiJS** (renderer 2D WebGL) | Leve (sem física/engine de "jogo" que não precisamos), foco só em compositar sprites — exatamente o caso de uso de uma sala social. Referência real: [bobba_client](https://github.com/Josedn/bobba_client) (Habbo remake em PixiJS+React+TS) | Mais uma dependência; precisa `dynamic import` com `ssr: false` no Next.js (Pixi usa `window`) | **Recomendado** para o World |
| **Phaser 3** | Ecossistema maior, template oficial React+Vite | Traz física/cenas de "jogo" que não usamos — overhead desnecessário para uma sala social sem combate/plataforma | Só se o roadmap incluir minigames de verdade dentro da sala |

**Decisão recomendada: PixiJS**, seguindo o padrão de integração já validado
por projetos reais (bobba_client): canvas Pixi montado num client component
próprio (`"use client"`, `dynamic(() => import(...), { ssr: false })`),
comunicando com o resto do React via um store leve (Zustand ou o mesmo
padrão de Context já usado em `RecompensaProvider`) — a UI (HUD, botões de
"Comprar móvel") continua 100% React; só o palco da sala (móveis, avatar,
piso) é Pixi.

> Fontes: [Phaser vs react-three-fiber (StackShare)](https://stackshare.io/stackups/phaserio-vs-react-three-fiber) ·
> [Template oficial Phaser 3 + React](https://github.com/phaserjs/template-react-ts) ·
> [bobba_client — Habbo remake em PixiJS+React+TS](https://github.com/Josedn/bobba_client) ·
> [Isometric TileSet editor em React+Canvas](https://blog.itsjavi.com/im-creating-an-isometric-tileset-editor-app-with-react-and-html5-canvas-because-why-not)

## 4. Modelo de dados (novo — a construir)

Segue o mesmo padrão já estabelecido (`GameRepository`, RLS forçada por
tenant, migration numerada). Rascunho de entidades:

```
sedes                    -- a "casa" de cada tenant
  id, tenant_id, tipo (alugada|propria), nivel_sede (1..N),
  capacidade_funcionarios, custo_mensal, largura_grid, altura_grid

itens_mobilia_catalogo   -- catálogo estático (como CARGOS_IA hoje)
  id, nome, categoria, preco, atributo_tecnologia, atributo_usabilidade,
  atributo_estetica, sprite_id, largura_tiles, altura_tiles

itens_mobilia_colocados  -- por tenant, dentro da sede
  id, tenant_id, item_id (FK catálogo), pos_x, pos_y, rotacao

avatares                 -- representação visual de humanos + Funcionários de IA
  id, tenant_id, tipo (dono|funcionario_ia|funcionario_humano),
  referencia_id (FK funcionarios_contratados quando for IA),
  sprite_id, pos_x, pos_y
```

Regras herdadas do resto do projeto:
- `unique(tenant_id, ...)` onde fizer sentido (ex.: uma sede por tenant).
- RLS: leitura da própria sede é privada (como `onboardings`); leitura da
  **fachada**/nível da sede pelos vizinhos pode ser pública (como
  `negocios`) — decisão de produto a confirmar antes de implementar.
- Compra de mobília usa **moeda virtual 🪙** (nunca R$ real — regra de ouro
  já documentada em `docs/design/DESIGN-SYSTEM.md` §6).

## 5. Mecânicas centrais do World

### 5.1 Comprar ou alugar sede (substitui o stub `sede`)
- Sedes têm níveis (ex.: "Sala compartilhada" → "Sala própria" →
  "Andar completo"), cada uma com capacidade de funcionários, custo
  mensal e grid (largura×altura em tiles) diferentes.
- **Alugar** = custo recorrente, sem compromisso de longo prazo, capacidade
  menor. **Comprar/própria** = custo alto único, sem mensalidade, capacidade
  maior — espelha a decisão real de qualquer PME.
- Evoluir de sede é um evento de gamificação (mesmo padrão de
  `funcionario_ia_contratado`): XP, e pode contar como avanço de degrau.

### 5.2 Mobiliar a sede (substitui o stub `loja`)
- Catálogo de móveis com atributos (Tecnologia/Usabilidade/Estética —
  os mesmos 3 eixos já vistos nos prints do Startup Panic, ver
  [`../analise-prints/telas/loja-de-moveis.md`](../analise-prints/telas/loja-de-moveis.md)).
- Colocação **drag-and-drop** dentro do grid da sede (respeitando a
  metragem comprada); cada item ocupa N tiles.
- Móveis dão bônus pequenos e cumulativos — não substituem XP real de
  negócio, são reforço visual + leve buff cosmético/funcional.

### 5.3 Avatares e equipe visível
- O dono do negócio tem um avatar. Cada **Funcionário de IA contratado**
  (`features/equipe-ia`) ganha um avatar próprio na sede — torna visível
  algo que hoje só existe como uma linha numa lista.
- Preparação para futuro: se o produto virar multiplayer (visitar a sede de
  um vizinho), os avatares já têm o modelo de dados pronto.

### 5.4 Conectar com negócios da região (Mendes e vizinhos)
- O World da sede não é uma ilha: a **porta de saída** da sala leva de volta
  ao Mapa regional já implementado (`features/mapa/`), onde os vizinhos do
  mesmo quarteirão aparecem — ver
  [`../ARQUITETURA-MULTITENANT.md`](../ARQUITETURA-MULTITENANT.md).
- ⚠️ **Gap identificado nesta sessão:** a cidade **Mendes** (citada
  explicitamente como região-alvo) ainda **não está** na lista de cidades
  do onboarding/seed (`Vassouras, Barra do Piraí, Piraí, Volta Redonda,
  Resende, Outra`). Ação recomendada: adicionar Mendes às 3 fontes
  (`file-adapter.ts`, `supabase/seed.sql`, `onboarding/perguntas.ts`) —
  ver checklist de ação em
  [`../ESTADO-DO-PROJETO.md`](../ESTADO-DO-PROJETO.md).

## 6. Fases de implementação sugeridas

| Fase | Entrega |
|---|---|
| **W1 — Fundação de dados** | Migration `sedes`/`itens_mobilia_*`/`avatares` + `GameRepository` estendido, seguindo o padrão de `equipe-ia` |
| **W2 — Sede estática (sem Pixi ainda)** | Tela React "Minha Sede" mostrando a sede atual e o catálogo de mobília, sem colocação livre — só comprar/possuir (reaproveita `RibbonPanel`/`ActionButton`) |
| **W3 — Renderização Pixi** | Canvas Pixi só para o grid da sala + móveis já comprados posicionados automaticamente |
| **W4 — Colocação livre (drag-and-drop)** | Jogador reposiciona móveis dentro do grid |
| **W5 — Avatares** | Avatar do dono + avatares dos Funcionários de IA contratados aparecem na sala |
| **W6 — Social/vizinhos** | Visitar a sede de um vizinho (somente leitura) a partir do Mapa |

Cada fase é entregável e demonstrável sozinha — não é preciso esperar a W6
pra ter algo mostrável.

## 7. O que NÃO mudar

- HUD, navegação (`GameShell`), motor de gamificação (`engine.ts`,
  `RecompensaProvider`) continuam os mesmos — o World consome os mesmos
  eventos/recompensas, não reinventa o loop.
- Moeda virtual × R$ real continua separado.
- Mobile-first continua obrigatório mesmo com Pixi (testar em viewport
  pequeno desde a W2).
