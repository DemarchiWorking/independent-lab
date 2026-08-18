# Corpus Oficial — Document Engine do labdatadev-gamehub

> Consolida o método do Laboratório Demarchi (mesmo corpus usado no V4mos,
> `/opt/v4mos/document-engine/`) adaptado ao público real do gamehub: **PMEs
> regionais do Vale do Café/RJ e adjacências** (engenharia/construção,
> contabilidade, saúde, tecnologia, alimentação, comércio, serviço —
> ver `SEGMENTOS` do jogo), muitas vezes fornecedoras do poder público via
> licitação, não startups em ideação. Onde este arquivo diverge de outro
> material do Laboratório Demarchi sobre o mesmo assunto, **este vence** para
> geração dentro do gamehub.

## Contexto do produto (para você, gerador, nunca esquecer)

O gamehub é o metaverso de negócios do labdatadev — um empresário regional se
cadastra, joga, evolui a "sede" da empresa e sobe uma escada de valor real.
Cada ficha que chega até você (`context-ficha.md`, na pasta atual) já é o
retrato completo desse negócio: cadastro, respostas de onboarding, vitrine
pública, equipe de Funcionários de IA contratada e nível da sede. Você está
gerando, a partir dela, a mesma qualidade de documentação de consultoria
sênior que o Laboratório Demarchi entregaria a um cliente pagante — método
SEBRAE + engenharia de contexto, hipóteses sempre sinalizadas, zero achismo.

## D.1 — Business Model Canvas: ordem oficial de preenchimento

**Preencher NESTA ordem exata (cliente primeiro, custo por último) — nunca
na ordem 1-9 do papel:**

`5 → 4 → 6 → 7 → 9 → 2 → 1 → 3 → 8`

1. **Segmentos de Clientes (bloco 5)** — o público-alvo real dos produtos e serviços.
2. **Proposta de Valor (bloco 4)** — produtos/serviços oferecidos e diferenciais frente aos concorrentes regionais.
3. **Canais (bloco 6)** — o meio pelo qual a empresa entrega produtos/serviços; inclui marketing e distribuição.
4. **Relacionamento com o Cliente (bloco 7)** — como a empresa gere o relacionamento com sua base.
5. **Fluxos de Receita (bloco 9)** — como a empresa ganha dinheiro, na variedade de fluxos existentes.
6. **Recursos-Chave (bloco 2)** — os recursos necessários para criar o valor prometido.
7. **Atividades-Chave (bloco 1)** — as atividades necessárias para executar o modelo.
8. **Parceiros-Chave (bloco 3)** — alianças (inclusive vizinhos de quarteirão no jogo, se a ficha mencionar parcerias formadas).
9. **Estrutura de Custos (bloco 8)** — consequência monetária de tudo acima; sempre por último.

## D.2 — Narrativa Estratégica (método OFC, "escrita em pedra")

Toda proposta de valor e todo posicionamento devem conseguir responder estas
7 perguntas sobre o negócio da ficha:

1. Qual problema nº 1 você resolve?
2. Para quem?
3. Como resolve?
4. Em quanto tempo o cliente vê resultado?
5. Quanto custa?
6. Onde o cliente chega (resultado final)?
7. Como ele se sente depois?

Aplicar a **Value Equation** para calibrar a força da proposta de valor:

```
Valor = (Resultado Sonhado × Probabilidade Percebida de Sucesso) ÷ (Tempo até o Resultado × Esforço e Sacrifício)
```

## D.3 — Escada de valor do PRÓPRIO gamehub (use exatamente esta, não a AGV genérica)

A ficha já informa em que degrau o negócio está (atual) e para qual degrau
está mirando (alvo) — mapeie o Modelo de Negócio a ESTA escada, não invente
outra:

| Degrau | Oferta | Preço | Papel |
|---|---|---|---|
| 1 | Auditoria Digital Gratuita | R$ 0 | entrada — todo cadastro nasce aqui |
| 2 | Diagnóstico Técnico | R$ 497 | primeira conversão |
| 3 | Automação Essencial | R$ 1.500–2.500/mês | recorrente, resolve 1-2 dores centrais |
| 4 | Ecossistema Completo | R$ 3.500–5.000/mês | parcerias e destaque regional |
| 5 | CTO-as-a-Service | R$ 5.000–8.000/mês | topo — vitrine do quarteirão |

Ao gerar o Modelo de Negócio, diga explicitamente em que degrau o negócio
está HOJE (segundo a ficha), o que falta para o degrau alvo, e trate os
Funcionários de IA já contratados (se houver) como recursos-chave reais que
já existem — não como possibilidade futura.

**Unit economics**: calcule CAC/LTV/margem só quando a ficha der base
(onboarding tem faixa de investimento e presença digital — use isso);
qualquer número sem base direta na ficha vai marcado `[HIPÓTESE]` com a
lógica exposta.

## D.4 — Padrões de Qualidade de Documento (não-negociáveis)

- **Zero achismo**: todo número tem fonte na ficha ou é marcado explicitamente `[HIPÓTESE]` com a lógica exposta.
- **Resumo Fácil**: ao fim do documento, um box em linguagem simples que qualquer pessoa entende, sem jargão.
- **Distinções críticas explícitas**: nunca misturar moeda virtual do jogo (🪙) com R$ real — a ficha às vezes traz XP/moeda de jogo, isso NUNCA entra em unit economics.
- **Tese de negócio em 3 pilares**: todo Modelo de Negócio deve deixar claro o *timing* (por que agora), a *vantagem injusta* (o que o concorrente regional não copia fácil) e o *modelo* (a máquina de gerar receita repetível).
- **Documento autossuficiente**: cada seção se sustenta sozinha.

## E.1 — Estrutura de Saída Obrigatória (Canvas e Modelo de Negócio)

```
1. Cabeçalho (nome do negócio, segmento, data, degrau atual na escada de valor)
2. Resumo executivo de 60 segundos (tabela: Estado Atual → Meta, com [HIPÓTESE] onde aplicável)
3. Corpo do documento (Canvas nos 9 blocos na ordem 5→4→6→7→9→2→1→3→8, OU Modelo de Negócio: posicionamento OFC + escada de valor do gamehub + unit economics + tensões/riscos)
4. Resumo Fácil (linguagem simples, sem jargão)
5. Premissas a validar (máx. 10, ordenadas por risco/impacto)
6. Próximas 5 ações (dono + prazo, com viés para o que gera receita mais rápido)
7. Notas de versão (append-only — nunca apagar rodadas anteriores; se esta é a primeira rodada, crie a seção só com a primeira entrada)
```

## E.2 — Checklist de Auto-Revisão Obrigatória (rodar antes de finalizar qualquer arquivo)

- [ ] Todo número tem fonte na ficha ou está marcado `[HIPÓTESE]` com a lógica exposta?
- [ ] O vocabulário é o vocabulário de uma PME regional, sem jargão de consultoria não explicado?
- [ ] O Canvas segue estritamente a ordem 5→4→6→7→9→2→1→3→8?
- [ ] Existe o "Resumo Fácil"?
- [ ] As "Próximas 5 ações" são executáveis pelo porte real da empresa (respeitando o tamanho de equipe informado na ficha)?
- [ ] A escada de valor usada é a do gamehub (D.3 acima), não uma genérica?
- [ ] Moeda virtual do jogo (🪙/XP) nunca aparece misturada com R$ real?
- [ ] A "Tese de negócio em 3 pilares" está explícita no Modelo de Negócio?

## Escopo atual de geração (importante)

Por decisão de produto, o gamehub gera hoje **seis documentos** por rodada,
cada um com sua própria metodologia detalhada em arquivo próprio da
knowledge-base (ver `00-INDEX.md`):

1. **Business Model Canvas** (`canvas`) — seção D.1 deste arquivo.
2. **Modelo de Negócio** (`modelo-negocio`) — seção D.2/D.3 deste arquivo.
3. **Análise SWOT Estratégica** (`swot`) — `02-analise-swot-estrategica.md`.
4. **Resumo Executivo** (`resumo-executivo`) — `03-resumo-executivo.md`.
5. **Roadmap de Melhoria Contínua** (`roadmap-melhoria-continua`) —
   `04-roadmap-melhoria-continua.md`.
6. **Proposta Comercial** (`proposta-comercial`) — `05-proposta-comercial.md`.

O `check` da tabela `documentos_gerados` (migration `0037`, expandido pela
migration `0038`) aceita exatamente estes 6 valores de `tipo` — não invente
um sétimo sem migration nova e sem arquivo de metodologia correspondente
aqui.
