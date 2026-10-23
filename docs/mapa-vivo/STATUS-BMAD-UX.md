# Mapa Vivo — status técnico do `bmad-ux`

> Atualizar este arquivo a cada marco (não deixar ficar defasado — é o
> "onde estão os arquivos de verdade" pra qualquer sessão retomando).
> Contexto/porquê: [`CONTEXTO-E-DECISOES.md`](CONTEXTO-E-DECISOES.md).

## Onde vivem os arquivos de verdade

O processo `bmad-ux` guarda seu estado FORA deste repositório git, no
workspace compartilhado de BMAD da VPS (é assim que o skill funciona —
não é um acidente, é pra permitir retomar em modo "Update" depois):

```
/root/_bmad-output/planning-artifacts/ux-designs/ux-labdatadev-2026-08-02/
├── DESIGN.md              ← paleta, tipografia, componentes visuais (Mapa + Sede)
├── EXPERIENCE.md          ← IA, fluxos, estados, acessibilidade (Mapa + Sede)
├── .decision-log.md       ← log bruto de toda decisão capturada (fonte do §3 de CONTEXTO-E-DECISOES.md)
├── .working/               ← artefatos de trabalho (cópia de trabalho dos 3 mocks abaixo)
├── imports/                 ← vazio (usuário não forneceu Figma/sketch/imagem de referência)
├── review-rubric.md         ← Reviewer Gate: completude (rubric walker) — 2 critical, 2 high, 3 medium, 2 low
├── review-acessibilidade.md ← Reviewer Gate: acessibilidade (ad-hoc, canvas/Pixi.js) — 3 critical, 5 high, 7 medium, 3 low
└── mockups/
    ├── mapa-quarteirao.html     ← Mapa nível Quarteirão: estado canônico + ChegadaSpotlight (Flow 1)
    ├── sheet-detalhe-pin.html   ← sheet lateral (desktop) + bottom sheet (mobile), VizinhoCard
    └── sede-continuidade.html   ← pin → SedeFachada → interior, mesma cor de tier (Flow 4)
```

**Se esta pasta não existir mais** (VPS trocada, `/root` limpo, etc.): os
dois documentos foram escritos com todo o raciocínio explicado em prosa —
`CONTEXTO-E-DECISOES.md` §3 tem a tabela de decisões completa o bastante
pra reconstruir `DESIGN.md`/`EXPERIENCE.md` do zero seguindo o mesmo
processo (`bmad-ux`, modo Create, mesmas respostas). Não precisa perguntar
de novo ao usuário — as respostas já estão registradas.

**Por que não estão copiados neste repositório:** `bmad-ux` é um processo
com estado (modo Update depende de reencontrar o `DESIGN.md`/`EXPERIENCE.md`
exatos no path configurado) — duplicar o conteúdo aqui criaria duas fontes
de verdade divergentes. Este arquivo existe exatamente pra resolver esse
risco: aponta pro lugar certo e resume o essencial pra quem não tem acesso
imediato ao path acima.

## Linha do tempo desta iniciativa (2026-08-02)

| Passo | Status |
|---|---|
| Brief do usuário capturado | ✅ |
| Discovery (4 perguntas: referência visual, perspectiva, dispositivo, ritmo) | ✅ respondidas |
| `.decision-log.md` escrito | ✅ |
| `DESIGN.md` rascunhado (fast-path, com `[ASSUMPTION]`) | ✅ |
| `EXPERIENCE.md` rascunhado (fast-path, com `[ASSUMPTION]`) | ✅ |
| Confirmação: zoom por clique (não zoom livre) | ✅ confirmado pelo usuário |
| Confirmação: escopo Mapa + Sede juntos (expandiu de "só Mapa") | ✅ confirmado — os dois documentos já foram atualizados pra refletir isso |
| Reviewer Gate disparada (rubric walker + acessibilidade, 2 subagentes paralelos) | ✅ concluída |
| Achados críticos/altos da Reviewer Gate resolvidos | ✅ — ver §Achados resolvidos abaixo |
| Mockups HTML das telas-chave | ✅ 3 mocks em `mockups/` |
| Spines marcadas `status: final` | ⏳ pendente — falta resolver achados medium/low restantes + confirmação final do usuário antes de virar `final` |
| Handoff arquitetura (`bmad-create-architecture`) | ⏳ pendente |
| Handoff épicos/stories (`bmad-create-epics-and-stories`) | ⏳ pendente |
| Implementação | ⏳ pendente |

## Reviewer Gate — o que foi pedido

Dois subagentes despachados em paralelo (2026-08-02, mesma sessão que
escreveu as spines):

1. **Rubric walker** (completude mecânica + julgamento): cobertura de
   fluxo, completude de token, cobertura de componente, cobertura de
   estado, bloat/overspecification, disciplina de herança, encaixe de
   forma. Escreve em `review-rubric.md`.
2. **Acessibilidade** (ad-hoc, justificado pelo produto usar canvas
   Pixi.js — armadilha clássica de a11y): dependência de cor sozinha,
   navegação por teclado dentro de canvas, contraste AA dos hex
   declarados, `prefers-reduced-motion`, alvos de toque, zoom por clique
   vs. usuários de baixa visão. Escreve em `review-acessibilidade.md`.

## Achados resolvidos (2026-08-02, depois da Reviewer Gate)

Os achados **críticos e altos** das duas revisões foram tratados
diretamente em `DESIGN.md`/`EXPERIENCE.md` (não ficaram só anotados —
as spines já refletem o fix):

- **Colisão de cor** (crítico, achado independente pelas duas revisões):
  a paleta de tier antiga reusava `brand.teal`/`category.social` — os
  MESMOS tokens de `presenca-viva`/`vizinho-destaque` — deixando um pin
  indistinguível do próprio estado de presença/vizinhança. Paleta de tier
  recomposta (`tier-2`/`tier-3` agora usam `attribute.processo`/
  `attribute.tecnologia`, azul/roxo) — nenhum tier usa mais verde ou teal.
- **Contraste contra o terreno** (crítico): contorno do pin trocado de
  branco (`1.14:1`, falhava AA) pra `text.ink` opaco (`≥10.87:1` contra
  terreno, `≥3.61:1` contra qualquer tier).
- **Teclado dentro de um `<canvas>` Pixi.js** (crítico): não é nativo —
  spine agora exige uma lista DOM espelhada por nível (mesma doutrina que
  `WorldCanvas.tsx` já precisa seguir), `Tab`/`Enter`/`Esc` reais, foco
  sincronizado com o destaque visual no canvas.
- **Texto sem cor declarada / contraste variável por tier** (alto): badge
  de tier e label do nome agora sempre sobre chip/disco opaco
  (`mapa-badge-fundo`/`mapa-label-fundo`) — contraste fixo, não depende
  mais de qual tier é.
- **`prefers-reduced-motion` só em CSS, não alcança o ticker do Pixi**
  (alto): spine agora exige leitura via `matchMedia` em JS, cobrindo as 3
  animações (spotlight, pulso de presença, pan+zoom de câmera entre
  níveis — este último não estava coberto antes).
- **`GH-MAPA-03` incompleto — faltava "altura/porte por nível da sede"**
  (crítico, achado do rubric walker): adicionada a segunda codificação
  visual do `MapaPin` (diâmetro por `sede.nivel`, independente da cor por
  `degrau_atual`) — com a dependência de arquitetura já flagada
  (`negocios_publico` não expõe `sede.nivel` hoje).
- **`SedeNameplate` sem linha comportamental**, **ordem de seção quebrada**
  (`Responsive & Platform` depois de `Key Flows`), **sem estado de foco
  por teclado em State Patterns**, **citação "regra 7" imprecisa**: os
  quatro corrigidos.
- **Falsa afirmação de reuso da nomenclatura da Árvore de Maturidade**
  (Épico 4): corrigida — a metáfora de árvore do pin (semente→broto→
  raiz→tronco→copa) é NOVA, criada só pra este sistema; o Épico 4 usa
  vocabulário de gating diferente (disponível/comprável/bloqueado/
  inalcançável).

**Não resolvido ainda** (medium/low, registrado mas não bloqueante):
verificação de daltonismo (deuteranopia) com ferramenta real de simulação
— a spine reconhece que o texto do badge é a defesa PRIMÁRIA, cor é
reforço, mas não substitui uma verificação de QA com ferramenta (ex.:
emulação de visão do Chrome DevTools) antes de considerar isso fechado de
verdade.

## Validação visual real (2026-08-02) — não só leitura da spec

Depois de escrever os 3 mockups, rodei Chromium headless (Playwright,
`/opt/labdatadev/node_modules/playwright`) pra tirar screenshot de cada um
e **olhar de verdade** o resultado renderizado — ler a spec/HTML não é a
mesma coisa que ver o pixel final, e isso encontrou 2 bugs reais que
nenhuma das duas revisões anteriores (que leem texto, não renderizam)
tinha como pegar:

1. **Pin "TecNorte TI" colidindo com a `MapaLegenda`** no canto inferior
   esquerdo do mockup do Quarteirão — reposicionado.
2. **Texto do `ChegadaSpotlight`** ("Chegou! Padaria da Vila já está no
   mapa.") vazando por cima do pin vizinho (Vitalys Saúde) — badge
   redimensionado (largura fixa, quebra de linha) e os pins do painel B
   afastados um pouco mais.

Também reforcei visualmente o mockup 3 (`sede-continuidade.html`): o
interior estava genérico demais (uma caixa vazia com dois pontos) —
adicionei silhuetas simples de mobília + textura de piso, com uma
etiqueta explícita "geometria já existente" (pra não sugerir que a
geometria da sala está sendo redesenhada — não está, ver `Foundation` em
`EXPERIENCE.md`).

**Confirmado depois dos fixes** (novo screenshot): paleta sem colisão
visual entre presença (teal) e tier (agora azul/roxo/prata/bronze/
dourado — nenhum verde/teal), contornos legíveis contra o terreno,
badges/labels legíveis, sheet desktop/mobile sem bug nenhum encontrado.
Artifact publicado com os 3 mockups atualizados:
https://claude.ai/code/artifact/33723a5f-6610-4e16-a382-961e26e37125

**O que esta validação NÃO cobre** (sendo honesto sobre o limite): isto é
validação de MOCKUP estático (HTML/CSS), não da implementação real em
Pixi.js — não prova FPS, não prova o comportamento do canvas de verdade,
não prova a lista DOM espelhada de teclado (que só existe como
especificação ainda, não como código). Prova que a DIREÇÃO visual e a
paleta corrigida funcionam antes de qualquer linha de Pixi.js ser escrita
— exatamente o ponto de fazer mockup antes de implementar.

## Fase 1 implementada e em produção (2026-08-02, commit `0e8a184`)

Primeira fatia REAL do Mapa Vivo está no ar em `:3006` (não é mais só
mockup) — escolhida por ser segura/baixo risco, sem tocar geometria do
Pixi:

- `design-system/tokens.ts`: `color.tier` (5 cores, mesma paleta validada
  nos mockups — sem colisão com presença/vizinhança).
- `src/lib/tier.ts` (+ `tier.test.ts`, 4 testes novos): `classeTier()` /
  `nomeArvoreTier()`.
- `src/features/world/render/cores.ts`: `corDePresenca()` (sempre teal,
  Pixi) e `corDoTier()` (Pixi, ainda não chamada em nenhum render — pronta
  pra quando o `MapaPin`/`SedeNameplate` completo existir).
- `src/features/world/VisitaScreen.tsx`: avatar de presença ao vivo trocado
  de `corDoAtributo("processo")` pra `corDePresenca()`; badge de tier novo
  no HUD (ponto colorido + rótulo "Semente"/"Broto"/etc., nunca texto
  direto sobre a cor — mesma disciplina de acessibilidade da spine).

**Validado em produção de verdade** (não só mockup): login real via
Playwright (conta `demarchiworking@gmail.com`), screenshot de
`/world/visitar/1` — badge "● Semente" aparece certo, cena renderiza sem
erro, `Ligar para o escritório` (feature de sessão anterior) continua
funcionando. Gates: typecheck + 323 testes + build, todos verdes, antes
do deploy.

**O que ainda é só spec, não código** (não confundir): o `MapaPin`/
terreno estilizado do MAPA em si (a parte mais visível/ambiciosa do
pedido original) — isso depende da fase de arquitetura (Winston) que
ainda não rodou. Fase 1 só tocou a Sede (cor de presença + badge), que
era segura de fazer sem essa decisão.

## Fase 1.5 — descoberta importante + anel de tier no Mapa real (commit `0c2c0f2`)

**Correção de uma suposição errada da spec:** `DESIGN.md`/`EXPERIENCE.md`
assumiam que o Mapa (`features/mapa/`) usa Pixi.js, igual à Sede. **Não
usa** — `QuarteiraoIso.tsx`/`IsoLot.tsx` são DOM/CSS puro (divs
posicionados com matemática isométrica, `<motion.button>` de verdade).
Isso é uma BOA notícia: elimina o achado crítico de acessibilidade "lista
DOM espelhada pra navegar por teclado num canvas" — o Mapa já é DOM, `Tab`
nativo já funciona, `IsoLot` já tem `aria-label`. `docs/mapa-vivo/`
precisa de uma atualização formal desse ponto na próxima sessão (não deu
tempo nesta, contexto ficou curto) — por ora, este parágrafo é a fonte da
verdade.

**Implementado e em produção:** `IsoLot` ganhou prop `tier` (usa
`degrauAtual`, já disponível em `NegocioResumo` — zero query nova) — anel
de cor ao redor do prédio da sede no lote, eixo visual independente do
ícone/cor de segmento que já existia. `lib/tier.ts` ganhou
`classeAnelTier()` (lookup estático `ring-tier-N`, nunca string
interpolada — Tailwind não geraria o CSS senão). Gates verdes
(typecheck+test+build), deployado, sem erro nos logs.

**Não validado visualmente ainda** (diferente da Sede): a screenshot de
produção desta sessão caiu no `/hub` em vez do Mapa (o seletor usado no
script não encontrou a aba certa) — contexto acabou antes de eu
reformular o script. **Próxima sessão: primeira coisa a fazer** é abrir
`/hub` de verdade (login `demarchiworking@gmail.com`), clicar na aba
Mapa (ícone de rede, 2ª posição na nav inferior esquerda pela screenshot
de `/hub`), e confirmar visualmente o anel de tier num lote ocupado.

## Próxima ação concreta (sempre manter esta linha atualizada)

Mockups validados (2 bugs corrigidos), Fase 1 real implementada e em
produção. Próximos, em ordem: (1) usuário confirmar visual do Artifact
(perguntado, sem resposta ainda), (2) `bmad-create-architecture`
(Winston) — decide como renderizar o Mapa/terreno de verdade (é o item
que falta pra "a parte mais visível" do pedido), resolve a dependência
de `sede.nivel` não exposto em `negocios_publico`, (3) depois disso,
`bmad-create-epics-and-stories`, (4) implementação faseada do Mapa em si.
Sugestões de melhoria gráfica de longo prazo (minhas + a visão do
usuário) em [`MELHORIAS-FUTURAS.md`](MELHORIAS-FUTURAS.md).
