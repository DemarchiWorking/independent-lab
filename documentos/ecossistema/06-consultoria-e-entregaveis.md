# 06 · Consultoria e Entregáveis (documentos reais)

**Fonte:** `claude-code/Entregavel-CS-AGV1/` + `Entregavel-CS-AGV1/gerador/`
(estudo estático). Conjunto de **documentos executivos reais** entregues a
empresas + um **gerador** em Node (`gen.js`, `gerador_excel/`) que os produz.

## Objetivo

É o **produto de consultoria** do Laboratório Demarchi materializado: a partir
do diagnóstico de um negócio, gerar um pacote de documentos profissionais que a
empresa usa de verdade (não é enfeite). É a versão "de mesa" do que o gamehub
já faz gamificado — e o elo mais direto entre o jogo e a receita real.

## Os 8 entregáveis

Cada um é uma "tela"/artefato com objetivo próprio:

- **E1 · Dossiê Executivo / Onboarding** (`.docx` + `.md` no gerador)
  - **Objetivo:** consolidar o retrato inicial do negócio e o plano de
    trabalho. **RF-01:** sumarizar contexto, dores, metas e próximos passos.
- **E2 · Modelo de Negócio** (`.xlsx`)
  - **Objetivo:** estruturar o BMC/modelo econômico. **RF-02:** blocos do
    canvas + números de sustentação.
- **E3 · Cliente Ideal — Imobiliária e Veículos** (`.xlsx`)
  - **Objetivo:** definir ICP por segmento. **RF-03:** perfis, dores, canais.
- **E4 · SWOT e OKRs** (`.xlsx`)
  - **Objetivo:** diagnóstico estratégico + metas. **RF-04:** matriz SWOT +
    objetivos-chave com resultados mensuráveis.
- **E5 · Pesquisa de Mercado** (`.xlsx`)
  - **Objetivo:** dimensionar mercado/concorrência. **RF-05:** TAM/SAM/SOM,
    concorrentes, oportunidades.
- **E6 · Escada de Valor** (`.xlsx`)
  - **Objetivo:** desenhar a jornada de ofertas (isca → premium).
    **RF-06:** degraus de oferta e ticket.
- **E7 · Modelo Cliente Ideal (MCI)** (`.xlsx`)
  - **Objetivo:** aprofundar o ICP num modelo acionável. **RF-07:** critérios
    de qualificação (tipo BANT).
- **E8 · Precificação Científica** (`.xlsx`)
  - **Objetivo:** definir preços com método. **RF-08:** custos, margem,
    elasticidade, faixas recomendadas.

### Gerador (`gerador/`)
- **Objetivo:** produzir os entregáveis por código (Node `gen.js` + planilhas).
- **RF-09:** a partir de dados de entrada do negócio, emitir os documentos
  formatados (mesma ideia do motor de documentos que já existe no gamehub em
  `features/documentos/` na branch de sessão anterior).

## Papel no jogo

**App "📄 Consultoria" — a ponte jogo → produto real.** É o mais estratégico:
o diagnóstico que o jogador constrói jogando **vira** (parte d)esses
entregáveis. É o que se mostra numa sala de aula do MBA ou numa reunião com
empresa real.

- **Integração N3 (produto — prioridade):** o jogo já sabe calcular os 5 eixos
  de maturidade do negócio; o app de Consultoria transforma isso em documento
  exportável (o gamehub já teve um motor de `.docx` — reaproveitar a ideia,
  reescrevendo com a metodologia versionada). Cada entregável acima é um
  "modelo" que o app pode emitir conforme o degrau do jogador.
- **Metodologia:** documentar o instrumento em
  `docs/conhecimento/METODOLOGIA-DIAGNOSTICO.md` para revisão/assinatura do
  sócio coordenador do MBA antes do pitch (conteúdo de negócio).
- **Gating:** o entregável básico (Dossiê/Diagnóstico) sai cedo; os avançados
  (Precificação, MCI) exigem degrau maior — ensina a maturidade na ordem.

## Requisitos de integração

- **RI-01:** documento é sempre **recalculado do dado vivo** do jogador, nunca
  guardado como blob — registrar só data de emissão + versão da metodologia
  (padrão que o gamehub já seguiu).
- **RI-02:** versionar a metodologia (`VERSAO_METODOLOGIA`) — o documento é
  auditável e o sócio do MBA assina uma versão específica.
- **RI-03:** separar **conteúdo de negócio** (metodologia, textos — do sócio/
  founder) de **engenharia** (motor de geração) — o primeiro vive em
  `docs/conhecimento/`, o segundo em `features/documentos/`.
- **RI-04:** 🪙 do jogo não compra consultoria real; o upsell para o serviço
  pago é CTA externo explícito.
