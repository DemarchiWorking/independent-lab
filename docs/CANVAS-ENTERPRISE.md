# Business Model Canvas enterprise — especificação

| | |
|---|---|
| **Entregável** | Business Model Canvas do Documentador de IA (habilidade `doc-canvas`) |
| **Método** | Business Model Canvas — Osterwalder & Pigneur (2010) |
| **Versão do documento gerado** | `1.<nível do agente − 1>` (1.0, 1.1, 1.2) |
| **Código** | `src/features/equipe-ia/entregaveis/` |
| **Rota** | `GET /api/entregavel/canvas` (download) · `?ver=1` (abre no navegador) |
| **Status** | Em produção no modo `file`; sem dependência de banco |

## 1. Objetivo

Dar ao dono de uma PME regional um modelo de negócio que ele possa **usar**
numa reunião, mostrar ao Sebrae ou a um investidor, e transformar em ação —
não um formulário preenchido. Três princípios:

1. **Específico do nicho.** Cada um dos 9 quadros traz a resposta, a melhor
   prática, o indicador e a hipótese do *segmento* do negócio (8 segmentos),
   no vocabulário dele (PNCP, ART, merenda, SLA, curva ABC…).
2. **Ancorado no cadastro.** A maturidade de cada quadro é calculada a partir
   das respostas do onboarding, e o documento mostra a evidência ao lado.
   Nada é opinião solta do agente.
3. **Do desenho à ação.** O canvas desenhado vem primeiro; depois as
   prioridades, o detalhamento por quadro e (nos níveis 2 e 3) o plano de
   90 dias, os riscos e o checklist de validação.

## 2. Estrutura do documento

Ordem fixa, de cima para baixo:

| # | Seção | Nível | Conteúdo |
|---|---|---|---|
| — | Cabeçalho + controle do documento | 1 | Documento, versão, emissão, elaborado por, classificação, revisão |
| 1 | **Modelo de negócio (canvas desenhado)** | 1 | 9 quadros na grade clássica, até 3 itens cada, borda e chip de maturidade, legenda |
| 2 | Resumo executivo + índice de clareza | 1 | 5 linhas (negócio, clientes, receita, foco 90 dias, maior atenção) e nota 0–100 |
| 3 | Prioridades imediatas | 1 | Até 3 quadros menos definidos, com a ação do segmento |
| 4 | Detalhamento por quadro | 1 | Pergunta-guia, resposta completa, boa prática, indicador, evidência; **hipótese a validar a partir do nível 2** |
| 5 | Plano de 90 dias | 2 | 3 fases: fundamentar, executar, medir e decidir |
| 6 | Próximos passos | 2 | Gargalo declarado e meta com número e prazo (+ revisão trimestral no nível 3) |
| 7 | Matriz de riscos | 3 | Riscos típicos do nicho + o gargalo declarado, cada um com mitigação |
| 8 | Checklist de validação | 3 | 6 verificações com clientes reais |
| — | Método e limites | 1 | Como a maturidade é calculada e o que o documento **não** garante |

### Disposição do canvas desenhado (≥ 1100 px e impressão)

```
┌──────────┬─────────┬──────────┬───────────────┬──────────┐
│          │ 7 Ativ. │          │ 4 Relaciona-  │          │
│ 8 Parce- ├─────────┤ 2 Propos-├───────────────┤ 1 Clien- │
│   rias   │ 6 Recur.│  ta Valor│ 3 Canais      │   tes    │
├──────────┴─────────┴──────────┼───────────────┴──────────┤
│ 9 Estrutura de custos         │ 5 Fontes de receita      │
└───────────────────────────────┴──────────────────────────┘
```

A numeração é a **ordem de leitura** recomendada pelo método (de quem compra
até o que custa), não a posição na grade. Abaixo de 1100 px os quadros fluem
nessa ordem (2 colunas; 1 coluna no celular).

## 3. Maturidade e índice de clareza

Cada quadro recebe `definido`, `parcial` ou `a definir`, **só** a partir do
que o dono declarou no cadastro (`maturidadeDosBlocos` em `canvas.ts`).
Regras conservadoras: sem resposta que comprove, o quadro nunca passa de
`parcial`.

| Quadro | `a definir` quando… | `parcial` quando… | `definido` quando… |
|---|---|---|---|
| Clientes | sem clientes pagantes e sem canal | cliente prioritário não escolhido | 6 ou mais clientes pagantes |
| Proposta | sem presença digital | há presença, proposta não validada | site + portais, **ou** problema e diferencial descritos (sobe 1 nível); gargalo = imagem fraca rebaixa 1 |
| Canais | nenhum canal estruturado | 1 canal | 2+ canais |
| Relacionamento | gargalo = perco leads | equipe pequena | equipe de 6+ |
| Receitas | gargalo = sem dados | fontes conhecidas, margem não medida | modelo recorrente (ou combinação) **e** ticket médio informado |
| Recursos | — | só o dono | há equipe |
| Atividades | gargalo = sem processo | gargalo = manual, perco leads ou sem dados | sem gargalo operacional (ou gargalo de imagem, tratado em Proposta) |
| Parcerias | nem indicação nem rede | só indicação | indicação + portais |
| Custos | não sabe o teto de investimento | teto até R$ 500 | teto declarado |

**Índice de clareza** = média dos 9 quadros (`definido` = 100, `parcial` = 50,
`a definir` = 0), arredondada. Rótulos: ≥ 75 *Modelo sólido*, ≥ 50 *Modelo em
estruturação*, abaixo *Modelo inicial*. É um indicador de **completude do
raciocínio**, não de qualidade do negócio — o próprio documento diz isso.

### Campos do cadastro que alimentam o canvas

Além do segmento, equipe, canais, gargalo, objetivo e investimento, o canvas usa
as respostas ricas do onboarding de produção — o que o torna **do cliente**, não
só do nicho:

| Resposta | Onde entra |
|---|---|
| `problemaPrincipal` | Proposta (item "nas suas palavras") e Resumo executivo ("Resolve: …") |
| `diferencial`, `provaSocial` | Proposta; sem elas, o quadro **pede** a informação em vez de inventar |
| `concorrentesConhecidos` | Proposta, a partir do nível 2 |
| `modeloReceita`, `ticketMedio` | Receitas (modelo declarado + ticket) e maturidade |
| `clientesPagantes` | Maturidade de Clientes |
| `licitacaoPublico` | Clientes (rotina de editais / habilitação, conforme a resposta) |

Respostas vazias, "não sei" e "ainda não tenho" **não** viram conteúdo. Texto
livre é aparado, limitado a 240 caracteres e escapado no HTML.

## 4. Profundidade por nível do agente

O nível controla **profundidade**, nunca contradiz o anterior (teste trava
isso: tudo do nível 1 continua no 2).

| | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|
| Canvas completo (9 quadros, pergunta, resposta, prática, indicador, evidência) | ✔ | ✔ | ✔ |
| Resumo executivo, índice, prioridades | ✔ | ✔ | ✔ |
| Itens extras por quadro | — | ✔ | ✔ |
| Hipótese a validar por quadro | — | ✔ | ✔ |
| Plano de 90 dias e próximos passos | — | ✔ | ✔ |
| Matriz de riscos e checklist de validação | — | — | ✔ |

## 5. Como acrescentar ou melhorar conteúdo

| Quero… | Edite |
|---|---|
| Melhorar a resposta/prática/indicador/hipótese de um nicho | `canvas-conteudo.ts` → `CONTEUDO[segmento]` |
| Mudar clientes, atividades, recursos, parcerias, receitas de um nicho | `vocabulario.ts` (fonte única, usada também por post, script e reel) |
| Mudar uma regra de maturidade | `maturidadeDosBlocos` em `canvas.ts` **e a tabela da seção 3** |
| Mudar visual/impressão | `render-canvas.ts` (CSS inline) — cores só dos tokens |
| Novo segmento | Acrescentar ao tipo `Segmento`, a `vocabulario.ts` **e** a `canvas-conteudo.ts` (o compilador exige os dois: são `Record<Segmento, …>`) |

Regras de escrita do conteúdo: uma recomendação **acionável** por quadro (verbo
no imperativo, sem jargão que o dono não use), um **indicador mensurável** e
uma **hipótese falsificável**. Evitar promessa de resultado.

## 6. Segurança e privacidade

- A rota deriva o tenant **da sessão**, nunca de parâmetro — o canvas carrega
  dado de onboarding (faixa de investimento, gargalo), o mais sensível do
  sistema. Só gera se o Documentador estiver **contratado** (403 caso contrário).
- Todo texto do usuário passa por `escaparHtml` (`html.ts`); teste cobre nome,
  cidade e bairro com payload de script.
- O arquivo é `noindex`, sem recurso externo (sem CDN, fonte ou imagem) e
  abre offline. Resposta com `Cache-Control: private, no-store` e
  `X-Content-Type-Options: nosniff`.
- `?ver=1` só muda o `Content-Disposition` para `inline`; mesma autenticação.

## 7. Qualidade — o que os testes garantem

`canvas.test.ts` (33 testes) + `entregaveis.test.ts`:

- 9 quadros numerados, na ordem do método;
- em **todos os 8 segmentos × 3 níveis**, todo quadro tem pergunta, resposta,
  prática, indicador e evidência não triviais;
- a boa prática de cada quadro é **diferente em cada segmento** (impede o
  "modelo único com o nome trocado");
- maturidade derivada das respostas, com evidência; índice = média 100/50/0;
- prioridades são os quadros menos definidos;
- progressão por nível sem perda de informação;
- documento: canvas desenhado **antes** de todas as outras seções, grade
  clássica, 3 degraus responsivos, A4 paisagem, rótulo textual de maturidade,
  cores só do design system, XSS escapado, sem recurso externo.

## 8. Limitações conhecidas

- A maturidade reflete **o que foi declarado**, não auditoria. Quem preencheu
  o cadastro às pressas terá um índice menos fiel.
- Conteúdo de nicho é recomendação geral, não consultoria jurídica ou fiscal;
  referências a licitação (PNCP, Lei 14.133/2021) devem ser revisadas por
  profissional quando houver decisão com risco legal.
- A data de emissão usa o relógio do servidor (America/Sao_Paulo).
- Exportação em PDF não existe: o caminho é *Imprimir → Salvar como PDF* (o CSS
  de impressão está pronto). Ver `GH-EDU-02` para o diagnóstico em PDF nativo.
