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

## Próxima ação concreta (sempre manter esta linha atualizada)

**AGORA:** as spines estão corrigidas e com 3 mockups HTML em `mockups/`
(`mapa-quarteirao.html`, `sheet-detalhe-pin.html`, `sede-continuidade.html`).
Falta, em ordem: (1) o usuário revisar os mockups (ainda não mostrados a
ele nesta sessão — próxima coisa a fazer), (2) opcionalmente rodar a
verificação de daltonismo com ferramenta real, (3) marcar as spines
`status: final`, (4) handoff pro Winston (`bmad-create-architecture`).
