# Pitch de vendas — visita à sede do vizinho

> Conteúdo, não arquitetura — pensado para o fundador editar copy sem
> tocar em código. A engenharia que consome isto está em
> `docs/world/VISITAR-VIZINHO.md` §4. Fonte de verdade dos preços/produto:
> `docs/PRODUTO-IA-FUNCIONARIOS.md`; o código-fonte destes textos vive
> espelhado em `src/features/vendas/pitchVisita.ts` (mesmo padrão de
> `equipe-ia/catalogo.ts`: o doc é a narrativa, o catálogo TS é o que
> renderiza — mantenha os dois em sincronia manualmente ao editar).

## 1. Objetivo

Mostrado enquanto o jogador visita a sede de outro negócio (somente
leitura — ver `VISITAR-VIZINHO.md`). Vende o produto real da labdatadev:
**"Funcionários de IA"**, agentes Claude configurados para uma função de
negócio recorrente, cobrados por assinatura mensal — não uma demo, não um
mock. Reaproveita a frase-síntese de `PRODUTO-IA-FUNCIONARIOS.md` §2:

> "contrate um funcionário de IA por uma fração do custo de um CLT."

O gatilho emocional certo aqui é diferente do card de contratação dentro
da própria sede: o jogador está **na sede de outra pessoa**, vendo os
avatares dos Funcionários de IA que ELA já tem (ou não tem). Isso é prova
social — "veja o que já está funcionando aqui" — não um catálogo frio.

## 2. Estrutura de um card de pitch

Cada card (`PitchIA` em `pitchVisita.ts`) tem:
- `cargoId` — chave do `CargoIA` correspondente (`equipe-ia/catalogo.ts`)
- `headline` — uma frase, gancho
- `corpo` — 2-3 frases, mais desenvolvido que o one-liner do catálogo de
  contratação (lá é card de grid; aqui é o momento de decisão)
- `ctaLabel` — texto do botão

CTA sempre leva para `/hub` (aba "Equipe de IA" já existe lá) — nunca uma
contratação direta a partir da tela de visita (ver §7, "não fazer").

## 3. Os 4 roteiros

### 3.1 Documentador(a) IA — R$ 297/mês (degrau 2+)

**Headline:** "Quem aqui sabe fazer isso, se essa pessoa sair amanhã?"

**Corpo:** Todo negócio que cresce rápido perde conhecimento junto com
quem sai — processo que só uma pessoa sabia, decisão que nunca virou
documento. O Documentador IA registra os processos do seu negócio
enquanto você trabalha, não depois que já perdeu alguém. Sob demanda +
revisão mensal, sem ninguém parar o que está fazendo para escrever manual.

**CTA:** "Ver o Documentador IA"

### 3.2 Social Media IA — R$ 397/mês (degrau 2+)

**Headline:** "Presença digital não devia depender de você lembrar de postar."

**Corpo:** Roteiro, copy e arte dos seus carrosséis prontos todo mês —
você aprova, não produz. É a dor #1 do seu tipo de negócio: presença
online fraca não é falta de vontade, é falta de tempo. O Social Media IA
resolve isso com um pacote mensal de carrosséis para Instagram/LinkedIn,
sem precisar contratar agência.

**CTA:** "Ver o Social Media IA"

### 3.3 Editor(a) de Vídeo IA — R$ 597/mês (degrau 3+)

**Headline:** "Vídeo converte mais — e é o que mais dá trabalho terceirizar."

**Corpo:** Reels e vídeos para mídia paga, com roteiro, cortes, legendas e
CTA prontos pra publicar. É historicamente o item mais caro de
terceirizar — e o de maior retorno quando funciona. O Editor de Vídeo IA
entrega um pacote mensal sem a curva de contratar e treinar um editor de
verdade.

**CTA:** "Ver o Editor de Vídeo IA"

### 3.4 Comercial/Automação IA — R$ 897/mês (degrau 3+)

**Headline:** "Quantos leads você perdeu essa semana só por demorar a responder?"

**Corpo:** O gargalo #1 de quem vende no WhatsApp não é falta de lead, é
demora no follow-up. O Comercial/Automação IA qualifica e faz follow-up
dos seus leads automaticamente, always-on — funciona enquanto você
atende quem já está na loja. É o SDR virtual que nunca esquece de
responder.

**CTA:** "Ver o Comercial/Automação IA"

## 4. Matriz de personalização

O pitch muda pelo perfil do negócio **visitado** (não do visitante) — é o
contexto que o visitante está vendo, a pessoa que ele pode se tornar. A
lógica escolhe o eixo mais fraco entre os `atributos` do negócio visitado
e pitcha o cargo que fortalece esse eixo:

| Eixo mais fraco | Cargo pitchado | `eixoFortalecido` |
|---|---|---|
| `processo` | Documentador(a) IA | `processo` |
| `presenca` | Social Media IA **ou** Editor de Vídeo IA (empate: prefira Social Media — degrau mínimo mais baixo) | `presenca` |
| `aquisicao` | Comercial/Automação IA | `aquisicao` |
| `tecnologia` | **sem cargo direto** — cai para Comercial/Automação IA (fallback documentado, nunca escolha arbitrária) |
| `capacidade` | **sem cargo direto** — mesmo fallback: Comercial/Automação IA |

**Por que o fallback é sempre `comercial`:** nenhum dos 4 cargos hoje
fortalece `tecnologia`/`capacidade` diretamente (`CargoIA.eixoFortalecido`
só cobre `processo`/`presenca`/`aquisicao`). Entre os quatro,
Comercial/Automação IA é o mais genérico em conceito (automação como
categoria), então é o fallback — mas isso é uma escolha de conveniência,
não uma verdade de produto. Se um 5º cargo for lançado cobrindo
`tecnologia`/`capacidade`, `escolherPitch()` deve ser atualizado junto.

## 5. Tom e tamanho

Mesmo padrão de `missoes.ts`: título curto (gancho, não descrição), corpo
de 2-3 frases (não um parágrafo), CTA como verbo de ação. Nunca hipérbole
vazia ("revolucione seu negócio!") — sempre um problema concreto e
nomeado, no estilo já estabelecido pelos one-liners de `catalogo.ts`.

## 6. Preço — nota de rascunho

Os preços acima (R$ 297/397/597/897) são os mesmos de
`docs/PRODUTO-IA-FUNCIONARIOS.md` §5, marcados lá como ponto de partida:
*"cruzar com labdatadev-context/04-portfolio/pricing_methodology.md antes
de publicar qualquer valor a cliente real."* Mantendo a mesma ressalva
aqui — mostrados no pitch da visita porque já são os preços exibidos em
`EquipeIaScreen` (a tela de contratação real), então omiti-los aqui só
criaria inconsistência entre as duas telas. Se a metodologia de pricing
mudar os valores, atualizar nos dois lugares (aqui e `catalogo.ts`) juntos.

## 7. O que a tela NÃO faz

- Sem checkout, sem contratação direta a partir da visita.
- CTA sempre redireciona para `/hub` (fluxo de contratação já existente em
  `EquipeIaScreen`) — nunca uma nova mutação/Server Action.
- Nunca mostra dados privados do negócio visitado (moeda virtual, XP,
  onboarding) — só o que já é "fachada" por `MAPA-MUNDI-VALE-DO-CAFE.md`
  §2 (nome, segmento, nível, degrau) mais o layout físico da sede, que
  passa a ser visível por decisão desta feature (ver `VISITAR-VIZINHO.md` §1).
