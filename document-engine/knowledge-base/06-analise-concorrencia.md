# Análise de Concorrência — comparação com negócios REAIS da mesma região e segmento

## Diferença crítica (não confundir com os outros 6 documentos)

Todos os outros documentos comparam o tenant contra uma referência abstrata
(escada de valor, atributos, mercado em geral). Este é diferente: compara o
tenant a **negócios REAIS** cadastrados no próprio labdatadev-gamehub, do
MESMO segmento e da MESMA cidade — nunca um concorrente genérico ou
inventado. A lista vem pronta em "context-concorrentes.md" (RPC
`concorrentes_regiao`, só negócios com `perfil_publico = true`).

## Regra inegociável (mais rígida que qualquer outro documento deste corpus)

**Nunca cite um nome de concorrente que não esteja em "context-concorrentes.md".**
Diferente do restante do corpus, aqui não existe `[HIPÓTESE]` para nome de
empresa — ou o dado é real (está na lista) ou a seção fala de dinâmica
regional/de segmento em geral, sem nomear ninguém.

**Se "context-concorrentes.md" vier vazio** (nenhum concorrente do mesmo
segmento cadastrado ainda nesta cidade): não force uma comparação — abra o
documento com esse fato explícito ("Você é o primeiro negócio do segmento
[X] cadastrado em [cidade] no labdatadev-gamehub — ainda não há concorrente
direto na base para comparar") e escreva sobre a dinâmica típica do
segmento em geral, complementando com a resposta livre `concorrentesConhecidos`
da ficha (seção 4, "Diagnóstico de onboarding") quando o dono já tiver
informado concorrentes conhecidos por fora do jogo — rotulados como
percepção do dono, nunca como dado verificado.

## Estrutura obrigatória

```
1. Cabeçalho: nome do negócio, segmento, cidade, data
2. Panorama: quantos concorrentes reais foram encontrados na base (0 a N),
   mesmo segmento + mesma cidade
3. Tabela comparativa (só se houver concorrentes na lista): nome, bairro,
   nível de jogo, degrau atual — e a posição do PRÓPRIO tenant na mesma
   tabela, para comparação direta
4. Posição relativa: onde o tenant está bem posicionado (degrau/atributos
   acima da média dos concorrentes listados) e onde está atrás — sempre
   ancorado nos dados dos atributos (seção 3 da ficha) e no degrau (seção 2)
5. Diferencial declarado pelo dono (campo `diferencial` da ficha) — conectar
   com o que a lista de concorrentes sugere sobre o que já é comum no
   segmento/região (ex.: "seu diferencial declarado — entrega mais rápida —
   é relevante porque X dos Y concorrentes listados estão há mais tempo no
   jogo sem terem subido de degrau, sinal de operação mais lenta")
6. Recomendações acionáveis (3 a 5, priorizadas pela escada de valor D.3) —
   nunca genéricas, sempre ligadas a um gap real encontrado no passo 4
7. Resumo Fácil
```

## Regras de rigor

- **Zero concorrente inventado** — a regra mais importante deste documento
  (ver acima). Se está em dúvida se um nome é real, não é: só use os nomes
  literalmente presentes em "context-concorrentes.md".
- **Nunca exponha dado privado de onboarding de outro tenant** — a lista de
  concorrentes só traz campos já públicos (nome, segmento, nível, degrau,
  bairro, data de entrada), nunca budget/score/gargalo de outro negócio.
  Isso já vem garantido pela RPC (`perfil_publico = true`, mesmas colunas de
  `vizinhos_do_tenant`/`destaque_bairro`) — não adicione dado além disso.
- **Tom analítico, não alarmista** — o objetivo é dar clareza de
  posicionamento, não criar ansiedade competitiva sem embasamento.
- Este documento NUNCA leva "Notas de Versão" — é uma fotografia da região
  no momento da rodada (a lista de concorrentes muda a cada rodada
  conforme novos negócios se cadastram), não um acompanhamento histórico.
