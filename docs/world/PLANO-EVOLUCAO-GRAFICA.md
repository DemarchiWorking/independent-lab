# Plano de evolução gráfica do World

> **O que é:** o que foi melhorado no visual e na acessibilidade da sala em
> 19/10/2026, o que ficou de fora de propósito, e a fila ordenada do que vem
> depois.
> **Relação com o resto:** este plano cuida da **camada visual e de interação**.
> A decisão de engine, ECS, WebGPU e simulação continua em
> [`EVOLUCAO-MOTOR-2026.md`](EVOLUCAO-MOTOR-2026.md); as fases G0 a G6 são as de
> lá, e aqui elas aparecem só como dependência.

## 1. O que foi entregue (19/10/2026)

O pacote rápido: o que mais mudava a primeira impressão com o menor risco.
Todos os itens foram conferidos no navegador, em desktop e em 375 px.

| # | Entrega | Onde | Como foi conferido |
|---|---|---|---|
| 1 | **Canvas nítido.** A sala é escalada pela largura do container (de 0,45× a 2,6×) com `ResizeObserver` e densidade de pixels. O canvas tem o tamanho exato na tela e o Pixi rasteriza o vetor ali, em vez de esticar um bitmap nativo por CSS. | `render/cena.ts` (`ajustarTamanho`), `render/WorldCanvas.tsx` | Container de 872 px → canvas de 832×650 px reais; 327 px no celular; sem rolagem horizontal; hit-test com a escala nova (clique real em coordenadas escaladas). |
| 2 | **Forma de desenho por item.** Campo `forma` no catálogo, separado de `categoria`. Corrige a Estação Dupla (saía como rack), o Quadro de Metas (saía como planta) e a Estante Executiva (saía como sofá). 7 formas. | `sede/catalogo.ts`, `render/desenho.ts` | Os 7 itens vistos na sala; teste garante uma forma por item e que as três corrigidas têm a sua. |
| 3 | **Móvel orientado pela parede.** A frente olha para o miolo da sala. Mesas, monitores, LEDs, quadro e estante mostram a frente certa. | `engine/sala.ts` (`orientacaoDaCelula`), `render/desenho.ts` | Testes de engine; conferido nas duas paredes. |
| 4 | **Nível do móvel visível.** Níveis 2 e 3 ganham marcadores dourados sobre a peça. | `render/desenho.ts` | Visto na sala (níveis 1, 2 e 3). |
| 5 | **Paleta por token.** Piso de madeira, duas tonalidades de parede e tons de pele variados vêm de `color.world`. Saíram o hex avulso do `CENARIO` e o gradiente fixo das telas. `ajustarBrilho` passou a operar em HSL (antes, multiplicar canais achatava cores claras). | `design-system/tokens.ts`, `render/cores.ts`, `WorldScreen.tsx`, `VisitaScreen.tsx` | `cores.test.ts` (matiz preservado, claro não estoura, cinza continua cinza). |
| 6 | **Etiquetas legíveis.** 12 px reais na tela em qualquer escala, dentro do quadro e sem se sobrepor; no celular só aparecem o dono, o seu boneco e quem está até 2 células; fonte e resolução do texto acompanham a escala. | `render/cena.ts` | Medido: 12 px na tela em 1280 e em 375; a etiqueta cortada na borda passou a ficar inteira. |
| 7 | **Feedback no canvas.** Destaque da célula sob o mouse com cursor de clique; marcador pulsante no destino até o boneco chegar; piscada vermelha quando não há trajeto; aviso correto ao clicar fora da sala (antes dizia "mobília no caminho"). | `render/cena.ts`, `WorldScreen.tsx`, `VisitaScreen.tsx` | Medido: marcador, cursor `pointer`, fade da recusa (alfa 1 → 0,42 → oculto em 550 ms). |
| 8 | **Avatares com vida.** Olham na direção do passo (de costas quando se afastam), balançam ao andar, "assentam" ao parar, respiram e piscam, cada um em fase diferente. | `render/desenho.ts` (`animarAvatar`), `render/cena.ts` | Conferido andando e parado. |
| 9 | **Movimento reduzido.** `MotionConfig reducedMotion="user"` nas telas e a mesma preferência na cena: sem balanço, respiro, piscada nem pulso, mas com a direção do olhar mantida. | `app/Provedores.tsx`, `render/cena.ts` | Com a preferência ligada: ticker parado em repouso, religado pelo clique, sem pulso. |
| 10 | **Bateria.** 60 fps só enquanto algo anda; 20 fps com a sala parada; ticker parado em repouso para quem pediu movimento reduzido. | `render/cena.ts` (`avancar`, `acordar`) | Medido o `maxFPS` do ticker nos três estados. |
| 11 | **Fontes pelo `next/font`.** Sem `@import` do Google no CSS, sem domínio externo na CSP. | `app/layout.tsx`, `globals.css` | Fontes carregadas no navegador. |
| 12 | **Acessibilidade.** `RibbonPanel` com `aria-modal`, foco preso, Esc fecha e o foco volta a quem abriu; aviso de recompensa em região `aria-live`; anéis de foco visíveis em `HexTile`, `IsoLot` e `IsoFurnitureSlot` (tinham `outline-none`); alvos de 44 px no `LateralMenu`. | `components/ui/*`, `gamificacao/RecompensaContext.tsx` | Verificado no navegador (abre com foco dentro, Esc fecha, foco volta ao botão). |

### Decisões de não fazer agora

- **`roundPixels` não foi adotado.** Estava no plano. Com o boneco andando em
  posições fracionárias e a raiz escalada, arredondar pixels faz o movimento
  "pular". Vale rever quando houver atlas de sprites (G2), onde o arredondamento
  passa a ser necessário.
- **Os Funcionários de IA não passeiam.** Só o dono se move. A proximidade
  (`engine/proximidade.ts`, usada em `WorldScreen.tsx`) lê as posições de
  `estado.avatares`, que são fixas: se um boneco andasse só no desenho, o painel
  de interação diria que ele está onde não está. Fazer passear exige primeiro a
  cena **reportar** as posições vivas à engine (item R5 abaixo).
- **Cache de textura da decoração estática** ficou de fora: é otimização sem
  medida que a justifique ainda (item R12).

## 2. Fila do que falta

**Esforço:** P = até 1 dia · M = alguns dias · G = uma a duas semanas.
**Impacto:** o quanto muda a percepção de qualidade ou a retenção.
`Gx` refere-se às fases de [`EVOLUCAO-MOTOR-2026.md`](EVOLUCAO-MOTOR-2026.md) §10.

### Bloco A — vida e polimento (sem asset novo)

| Id | Item | Impacto | Esforço | Onde | Depende de |
|---|---|---|---|---|---|
| R1 | **Partículas e "pop-in"** ao colocar ou mover móvel (escala com leve estouro, poeira ou estrelas) | Médio | P | `cena.ts` (marcar vistas novas em `desenharMoveis`) | — |
| R2 | **Oclusão:** boneco atrás de móvel alto fica semitransparente ou ganha silhueta | Médio | M | `cena.ts` (depth-sort) | — |
| R3 | **Iluminação:** brilho das telas e LEDs piscando, luz ambiente | Médio | M | `desenho.ts` (blend aditivo) | respeitar movimento reduzido |
| R4 | **Decoração da sala:** janelas, relógio, quadros na parede, tapete com borda | Médio | P | `desenharParedes` e `desenharTapete` | tokens novos em `color.world` |
| R5 | **Posições vivas à engine:** a cena reporta onde cada avatar está (hoje só reporta quando o do jogador para) e `proximidade.ts` passa a usar isso | Alto (destrava R6) | M | `cena.ts`, `engine/proximidade.ts`, `WorldScreen.tsx` | — |
| R6 | **Funcionários de IA passeiam** por perto de casa, com `acharCaminho` | Alto | M | `cena.ts`, `engine/caminho.ts` | R5 |
| R7 | **Balões de ação e humor** ("digitando…", "ideia!") ligados a eventos reais (contratação recente, entrega) | Alto | M | `desenho.ts`, `cena.ts` | R5; humor completo depende de G1 |
| R8 | **Dia e noite** pela hora local: tinta do ambiente e luzes acesas | Médio | M | `cena.ts`, `cores.ts` | R3 |

### Bloco B — telas e interação

| Id | Item | Impacto | Esforço | Onde | Depende de |
|---|---|---|---|---|---|
| R9 | **Unificar as quatro visões isométricas** (World em Pixi, `IsoRoom`/`IsoFurnitureSlot` e `IsoLot`/`QuarteiraoIso` em DOM, árvore de hexágonos) num tema só. Hoje só o piso foi tokenizado; sobra hex avulso, p.ex. `bg-[#1b2b4d]` em `IsoLot` | Médio | M | `components/ui/Iso*`, `design-system/tokens.ts` | — |
| R10 | **HUD mobile:** painel lateral como folha inferior, menu lateral como barra de abas ao alcance do polegar | Alto no celular | M | `GameShell.tsx`, `LateralMenu.tsx`, `WorldScreen.tsx` | — |
| R11 | **Câmera com zoom e arrasto (pinça)**: uma sala 8×8 em 375 px fica com tiles de ~20 px, pequena demais para tocar | Alto no celular | M | `cena.ts` (generalizar `escala` num `zoom` com limites) | — |
| R12 | **Cache de textura da decoração estática** (`cacheAsTexture`) | Baixo | P | `cena.ts` | medir antes: só se o celular de entrada passar de ~16 ms por quadro |

### Bloco C — fundação (ver `EVOLUCAO-MOTOR-2026.md`)

| Id | Item | Impacto | Esforço | Fase |
|---|---|---|---|---|
| R13 | WebGPU e bucket sort por profundidade | Médio | P | G0 |
| R14 | ECS mínimo, tick determinístico, necessidades e humor | **Muito alto** (é o que dá vida de verdade) | G | G1 |
| R15 | Pipeline de arte, atlas de sprites e o fim do desenho 100% procedural | Muito alto | G | G2 |
| R16 | Culling e spatial hash para salas grandes | Médio | M | G5 |
| R17 | Editor de layout, andares e móvel de vários tiles | Médio | G | G6 |

### Bloco D — qualidade e risco

| Id | Item | Impacto | Esforço | Por quê |
|---|---|---|---|---|
| R18 | **Teste visual automatizado:** captura do canvas (`renderer.extract`) com a técnica do `AGENTS.md`, uma referência por forma de móvel e por orientação | **Alto** | M | Três móveis ficaram com a forma errada sem que typecheck, teste ou build percebessem. Só olho ou captura pega isso. |
| R19 | **Fontes locais (`next/font/local`)** com os `.woff2` no repositório | Médio | P | O build hoje depende do Google Fonts; em 19/10/2026 um build falhou uma vez por erro de rede na busca. Exige baixar os arquivos, e por isso ficou para você decidir. |
| R20 | **Orçamento de desempenho medido** em celular de entrada (quadros por segundo e memória) | Médio | P | Hoje as metas de `EVOLUCAO-MOTOR-2026.md` §8 não têm medição real. |

## 3. Ordem sugerida

```
R18 (rede de proteção) ──► R1, R4 (rápidos, já dão cara nova)
         │
         ├──► R10, R11 (celular: onde está a maior parte do público de PMEs)
         │
         └──► R5 ──► R6, R7 ──► (G1 dá humor de verdade a R7)
                       R3 ──► R8
```

R18 vem primeiro porque tudo o mais mexe em desenho, e sem captura de
referência cada mudança visual depende de alguém olhar.

## 4. Como conferir uma mudança visual

O canvas só desenha com a aba visível: com a aba oculta o navegador congela o
`requestAnimationFrame` e o Pixi não renderiza nada (e clique também não
chega). Com o dev server rodando (`npm run dev`), no console da página:

```js
const w = window.__world;            // só existe em desenvolvimento
w.app.renderer.render(w.app.stage);  // força um quadro
w.cena.andarPara("dono", { cx: 2, cy: 2 });
w.cena.definirMovimentoReduzido(true);
```

Para testar em celular, use a largura de 375 px: a escala cai e as etiquetas
passam a mostrar só quem está perto. Para movimento reduzido, ligue a opção no
sistema operacional, ou chame `definirMovimentoReduzido(true)` como acima.
