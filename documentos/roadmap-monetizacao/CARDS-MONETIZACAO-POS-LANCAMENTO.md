# Roadmap de Monetização — 20 cards pós-lançamento

> **Para quem chega agora.** Depois que o gamehub estiver **online** (VPS,
> multiplayer, Supabase), este é o backlog priorizado para **transformar
> jogadores em receita recorrente**. Formato: card de PM (objetivo de negócio
> + requisitos funcionais + métrica). Método: **BMAD** (Business · Model ·
> Architecture · Development) — cada épico responde "que alavanca de receita
> isto move".
>
> **Fonte de verdade do produto:** [`docs/PRODUTO-IA-FUNCIONARIOS.md`](../../docs/PRODUTO-IA-FUNCIONARIOS.md)
> (o que se vende), [`docs/ESTADO-DO-PROJETO.md`](../../docs/ESTADO-DO-PROJETO.md)
> (o que já existe), [`documentos/ecossistema/`](../ecossistema/README.md) (os
> apps do computador do escritório).

## Tese de monetização (o "porquê" antes do "o quê")

Três motores de receita, já semeados no produto, faltando **fechar a torneira
do pagamento**:

1. **Assinatura de Funcionários de IA** — R$ 297–897/mês por cargo, squad com
   desconto (o motor principal de MRR). Catálogo real em `features/equipe-ia/catalogo.ts`.
2. **Escada de valor** — Degrau 1 (R$ 0, isca) → Degrau 5 (CTO-as-a-Service,
   R$ 5–8k/mês). Cada degrau é um upsell (`features/onboarding/scoring.ts` `DEGRAUS`).
3. **Serviços sob demanda** — site/app/automação/nova funcionalidade, já
   captados pelo estúdio labdatadev (`features/labdatadev/`, `/labdatadev`).

> **Regra de ouro (AGENTS.md):** moeda virtual 🪙 **nunca** vira R$ e nenhuma
> tela sugere conversão. Toda regra de cobrança é server-side. Não entrar
> credencial financeira no app — o gateway (Stripe) cuida do cartão.

## Como ler cada card

`Prioridade` P0 (destrava receita) · P1 (acelera) · P2 (otimiza) ·
`Esforço` P/M/G · `Receita` 🟢 direta · 🟡 indireta ·
`Métrica` o número que ele move.

## Sequência sugerida (sprints)

1. **Sprint "Ligar a torneira"** → MON-01 → MON-02 → MON-04 → MON-06 (sem isto, não há receita)
2. **Sprint "Converter"** → MON-07 → MON-08 → MON-09 → MON-03
3. **Sprint "Expandir LTV"** → MON-10 → MON-11 → MON-12 → MON-13
4. **Sprint "Reter"** → MON-14 → MON-15 → MON-16 → MON-20
5. **Sprint "Crescer"** → MON-17 → MON-18 → MON-19 → MON-05

---

# Épico A — Fundação de cobrança (destrava tudo)

### MON-01 — Integração base com Stripe (produtos, preços, cliente)
`P0` · `Esforço G` · `Receita 🟢` · **Métrica:** 1ª cobrança bem-sucedida

**Objetivo:** ter a espinha dorsal de pagamento — sem ela, nenhum outro card
de receita funciona. Espelha os cargos/degraus reais como produtos no Stripe.

**Requisitos funcionais:**
- [ ] Provisionar produtos/preços no Stripe espelhando `features/equipe-ia/catalogo.ts` (297/397/597/897) e o squad
- [ ] `stripe_customer_id` por tenant (nova coluna em `negocios`, migration + 2 adapters)
- [ ] Chaves do Stripe só server-side (`.env`, nunca no browser; padrão de `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Camada `lib/pagamento/` isolada (contrato trocável, como `GameRepository`)
- [ ] Ambiente de teste (Stripe test mode) documentado em `docs/deploy/`

**Segurança:** Claude **não** insere dados de cartão; o cliente digita no
Checkout hospedado do Stripe. Nenhum PAN trafega no nosso servidor.

---

### MON-02 — Checkout de assinatura de Funcionário de IA
`P0` · `Esforço M` · `Receita 🟢` · **Métrica:** conversão contratar→pagar

**Objetivo:** o clique "Contratar" na Equipe de IA leva a um pagamento real de
assinatura (hoje só dispara XP, sem cobrança).

**Requisitos funcionais:**
- [ ] Botão "Assinar" em `EquipeIaScreen` cria Stripe Checkout Session (server action)
- [ ] Redireciona para o Checkout hospedado; retorno em `/equipe-ia/sucesso` e `/cancelado`
- [ ] Só marca cargo como "ativo" após confirmação do webhook (MON-04), nunca no retorno do browser
- [ ] Gate por degrau mantido server-side (Documentador ≥ D2, Vídeo ≥ D3 — regra já existente)
- [ ] Evento `funcionario_ia_contratado` só dispara com assinatura confirmada (anti-farm já existe)

---

### MON-03 — Portal do assinante (upgrade/downgrade/cancelar)
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** self-service billing, tickets ↓

**Objetivo:** cliente gere a própria assinatura sem falar com o Antonio —
reduz atrito e custo operacional.

**Requisitos funcionais:**
- [ ] Botão "Gerenciar assinatura" abre o Stripe Billing Portal (session server-side)
- [ ] Trocar de plano/cargo reflete no jogo via webhook (MON-04)
- [ ] Histórico de faturas visível ao cliente
- [ ] Cancelamento passa pelo fluxo de retenção (MON-15) antes de confirmar

---

### MON-04 — Webhooks de billing → estado do jogo
`P0` · `Esforço M` · `Receita 🟢` · **Métrica:** 0 divergência plano↔acesso

**Objetivo:** a assinatura no Stripe é a fonte de verdade; o jogo reage a ela.
Sem isto, cliente paga e não libera (ou cancela e continua usando).

**Requisitos funcionais:**
- [ ] Endpoint `/api/stripe/webhook` com verificação de assinatura do Stripe
- [ ] Tratar `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed`
- [ ] Tabela `assinaturas` (tenant_id, cargo, status, período) via migration + RLS + RPC atômica
- [ ] Idempotência por `event.id` (nunca processar o mesmo evento 2×)
- [ ] Ativar/suspender o Funcionário de IA conforme `status`

---

### MON-05 — Faturas, recibos e registro fiscal
`P2` · `Esforço M` · `Receita 🟡` · **Métrica:** conformidade fiscal, disputas ↓

**Objetivo:** cobrança recorrente de PME exige documento fiscal — base para
confiança e para escalar sem risco.

**Requisitos funcionais:**
- [ ] Recibo/fatura acessível por assinatura (Stripe invoice PDF, ou emissão NF-e via integração futura)
- [ ] Dados fiscais do cliente coletados no checkout (CNPJ/CPF) com validação
- [ ] Retenção do mínimo legal (LGPD — registro fiscal é exceção à exclusão)

---

# Épico B — Conversão e ativação (levar ao momento de pagar)

### MON-06 — Paywall: Funcionário ativo só com assinatura vigente
`P0` · `Esforço M` · `Receita 🟢` · **Métrica:** % de valor atrás do paywall

**Objetivo:** separar claramente o que é grátis (jogo/diagnóstico) do que é
pago (o trabalho recorrente do Funcionário de IA).

**Requisitos funcionais:**
- [ ] Entregáveis do Funcionário de IA só liberam com assinatura `ativa` (checagem server-side)
- [ ] UI mostra estado "assinatura necessária" com CTA de checkout, sem quebrar o resto do jogo
- [ ] Degradação graciosa: assinatura vencida pausa entregas, não apaga histórico

---

### MON-07 — Freemium/trial explícito (o que é grátis vs pago)
`P1` · `Esforço P` · `Receita 🟡` · **Métrica:** ativação → 1º pagamento

**Objetivo:** deixar o "grátis" gerar valor real (diagnóstico, 1 entregável de
amostra) para justificar a assinatura — reduz fricção de conversão.

**Requisitos funcionais:**
- [ ] Definir e rotular o tier grátis (jogo + diagnóstico + 1 amostra de cargo)
- [ ] 1 entregável de amostra por cargo (ex.: 1 carrossel) sem cobrança, uma vez
- [ ] Trial opcional de X dias configurável no Stripe

---

### MON-08 — Funil orçamento → proposta → aceite (estúdio labdatadev)
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** taxa pedido→contrato pago

**Objetivo:** evoluir o estúdio labdatadev (já capta pedidos) para fechar
negócio de serviço avulso (site/app/automação) com valor e aceite.

**Requisitos funcionais:**
- [ ] Admin adiciona **proposta com valor** a uma solicitação (`solicitacoes_servico` já existe)
- [ ] Cliente vê a proposta e **aceita/recusa** (novo status `proposta_enviada`/`aceita`)
- [ ] Aceite gera cobrança (Checkout único ou link de pagamento Stripe)
- [ ] Ao pagar, status → `em_producao`; fecha o loop de gamificação

---

### MON-09 — Onboarding de ativação (primeiro valor em <5 min)
`P1` · `Esforço M` · `Receita 🟡` · **Métrica:** ativação D0, retenção D7

**Objetivo:** o jogador precisa sentir valor real cedo (o "aha") antes de
pedir cartão — é o que separa cadastro de cliente.

**Requisitos funcionais:**
- [ ] Missão inicial "gere seu diagnóstico" + "receba 1 amostra de cargo"
- [ ] Checklist de ativação visível no hub (0/3 passos)
- [ ] E-mail/notificação de "seu diagnóstico está pronto" (gancho de retorno)

---

# Épico C — Expansão de receita (LTV)

### MON-10 — Upsell da escada de valor (subir degrau = mais receita)
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** upgrade de degrau/mês

**Objetivo:** a escada (R$0→R$8k) já existe como jogo; falta o CTA comercial
que converte progressão em plano maior.

**Requisitos funcionais:**
- [ ] Card contextual "seu negócio está pronto para o Degrau N" com preço e benefícios
- [ ] Ligar avanço de degrau a mudança de plano no Stripe (MON-04)
- [ ] Prova de valor (atributos evoluídos) como justificativa do upsell

---

### MON-11 — Cross-sell inteligente de Funcionários de IA
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** cargos por cliente (expansão)

**Objetivo:** recomendar o próximo cargo certo pelo eixo mais fraco do
negócio (a economia de atributos já mede isso).

**Requisitos funcionais:**
- [ ] Recomendação por segmento + eixo mais fraco (`lib/atributos.ts` já calcula)
- [ ] "Quem contratou Social Media também assinou…" (regra simples, sem ML)
- [ ] CTA de bundle quando 2+ cargos ativos (empurra para o Squad, Degrau 4)

---

### MON-12 — Planos anuais e pacote Squad (MRR previsível)
`P2` · `Esforço P` · `Receita 🟢` · **Métrica:** % receita anual, ARPA

**Objetivo:** desconto anual troca fluxo por previsibilidade; o Squad eleva o
ticket médio.

**Requisitos funcionais:**
- [ ] Preço anual (com desconto) por cargo no Stripe
- [ ] Produto "Squad completo" com preço de pacote (Degrau 4)
- [ ] Comparador mensal vs anual na tela de assinatura

---

### MON-13 — Add-ons e entregáveis avulsos (créditos)
`P2` · `Esforço M` · `Receita 🟡` · **Métrica:** receita incremental/assinante

**Objetivo:** vender "mais um carrossel", "mais um vídeo" sem trocar de plano
— receita extra de quem já é cliente.

**Requisitos funcionais:**
- [ ] Catálogo de add-ons por cargo (preço unitário)
- [ ] Compra avulsa (Checkout único) que credita 1 entregável extra
- [ ] Limite/registro por período (anti-abuso, server-side)

---

# Épico D — Retenção e anti-churn

### MON-14 — Dunning (recuperação de pagamento falho)
`P1` · `Esforço P` · `Receita 🟢` · **Métrica:** churn involuntário ↓

**Objetivo:** cartão recusado é a causa #1 de churn evitável — recuperar antes
de cancelar.

**Requisitos funcionais:**
- [ ] Tratar `invoice.payment_failed` (MON-04) → sequência de retry do Stripe
- [ ] Aviso in-app + e-mail "atualize seu pagamento" com link do portal
- [ ] Suspender (não cancelar) durante a janela de recuperação

---

### MON-15 — Cancelamento com save-offer
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** % de cancelamentos revertidos

**Objetivo:** capturar o motivo e oferecer alternativa (pausar, downgrade,
desconto) antes de perder o cliente.

**Requisitos funcionais:**
- [ ] Fluxo de cancelamento com motivo (pesquisa curta)
- [ ] Oferta de pausa (1 ciclo) ou downgrade de cargo
- [ ] Só efetiva o cancelamento no Stripe após o fluxo

---

### MON-16 — Relatório de valor entregue (ROI ao cliente)
`P2` · `Esforço M` · `Receita 🟡` · **Métrica:** retenção, NPS

**Objetivo:** mostrar o que o Funcionário de IA produziu no mês reduz churn —
o cliente vê pelo que paga.

**Requisitos funcionais:**
- [ ] Painel mensal: entregáveis produzidos, atributos evoluídos, degrau
- [ ] Exportável (reaproveita o motor de documentos `.docx`)
- [ ] Gancho de expansão dentro do relatório (MON-10/11)

---

# Épico E — Aquisição e crescimento (CAC baixo, regional)

### MON-17 — Programa de indicação com recompensa
`P1` · `Esforço M` · `Receita 🟡` · **Métrica:** CAC via indicação, k-factor

**Objetivo:** ICP regional é confiança-por-indicação; transformar cliente em
canal (o mapa/vizinhança já cria o gancho social).

**Requisitos funcionais:**
- [ ] Link de indicação por tenant (o convite de vizinho já existe — estender)
- [ ] Recompensa na conversão do indicado (crédito R$ ou 🪙 no jogo — **nunca misturar** as duas moedas)
- [ ] Anti-fraude server-side (só paga na 1ª assinatura real do indicado)

---

### MON-18 — Vitrine pública SEO + landing por segmento/cidade
`P2` · `Esforço M` · `Receita 🟡` · **Métrica:** tráfego orgânico → cadastro

**Objetivo:** aquisição orgânica barata — páginas por segmento/cidade do Vale
do Café (a vitrine pública e o mapa já existem).

**Requisitos funcionais:**
- [ ] Páginas programáticas `/<segmento>/<cidade>` com dado agregado real
- [ ] `sitemap.ts`/metadata/JSON-LD (padrão já usado no projeto)
- [ ] CTA de cadastro/diagnóstico em cada página

---

# Épico F — Operação, confiança e dados de receita

### MON-19 — Painel admin de receita + entrega (MRR/churn/SLA)
`P1` · `Esforço M` · `Receita 🟢` · **Métrica:** decisões guiadas por MRR

**Objetivo:** o fundador precisa ver o negócio (receita) e operar a entrega
dos Funcionários de IA num lugar só (o painel labdatadev já é a base).

**Requisitos funcionais:**
- [ ] KPIs de receita: MRR, novos/expansão/churn, ARPA, LTV estimado
- [ ] Pipeline de solicitações + assinaturas por status (estende `/admin/labdatadev`)
- [ ] Fila de entrega dos cargos com SLA (o que produzir, para quem, até quando)
- [ ] Gate `souAdmin` (já existe), nunca exposto ao cliente

---

### MON-20 — Base legal da cobrança recorrente (contratos + LGPD fiscal)
`P1` · `Esforço P` · `Receita 🟡` · **Métrica:** risco de compliance ↓

**Objetivo:** cobrar assinatura de empresa real exige termos claros e base
legal — protege a receita e a marca.

**Requisitos funcionais:**
- [ ] Termos de assinatura + política de reembolso/cancelamento aceitos no checkout
- [ ] Consentimento e dados fiscais versionados (padrão LGPD já no projeto)
- [ ] Registro de aceite (quando/qual versão) por assinatura

---

## Resumo por prioridade

- **P0 (destrava receita):** MON-01, MON-02, MON-04, MON-06
- **P1 (acelera):** MON-03, MON-07, MON-08, MON-09, MON-10, MON-11, MON-14, MON-15, MON-17, MON-19, MON-20
- **P2 (otimiza):** MON-05, MON-12, MON-13, MON-16, MON-18

> **Primeiro dinheiro no caixa** = MON-01 → MON-02 → MON-04 → MON-06. Tudo o
> mais amplia ou protege esse fluxo. Cada card entra pela esteira de sempre
> (typecheck + test + build → deploy), um por vez.
