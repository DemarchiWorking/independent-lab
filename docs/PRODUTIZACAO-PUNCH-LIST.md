# Punch-list de produtização — o que falta para virar negócio cobrável

> Versão acionável do §4 de
> [`architecture/DBA-ARQUITETURA-ESCALA-2026.md`](architecture/DBA-ARQUITETURA-ESCALA-2026.md).
> Este documento não decide nada novo — organiza o que já foi decidido em
> ordem de dependência real, com o "próximo comando" de cada item. Manter em
> sincronia com `BACKLOG-PRODUTO.md` (cards `GH-COM-*`, `GH-OPS-*`); se
> divergirem, o backlog tem os critérios de aceitação completos, este
> documento tem a visão executiva.

## Onde estamos (2026-08-01)

- ✅ Schema pronto para os 3 fluxos de receita/confiança que faltavam:
  orçamento (`0028`), assinatura (`0029`), moderação (`0030`), auditoria de
  progressão (`0031`).
- ✅ **Fase 0 fechada de verdade** (`GH-OPS-03`): 32 migrations rodam limpo
  contra Postgres real, RLS comprovadamente isola tenant, o fluxo completo
  de cadastro→jogo→equipe de IA passa via `GAMEHUB_DB=supabase`. Dois bugs
  P0 achados e corrigidos no processo (`0032`, `0033`) — sem isso, o modo
  produção nunca teria funcionado, nem para o próprio app.
- ⛔ Zero deploy real feito ainda (nenhuma VPS/Supabase hospedado recebeu
  este schema fora do ambiente de teste local desta revisão).
- ⛔ Zero R$ real processado — tudo hoje é moeda virtual (🪙) dentro do jogo.

## Ordem de execução (dependência real, não só prioridade)

### 1. Primeiro deploy real — condição de tudo abaixo

**Por quê primeiro:** todo item de 2 a 5 pressupõe um Postgres hospedado
respondendo de verdade. Fase 0 provou que o schema funciona; ainda não
provou que funciona **fora do ambiente local do CLI**.

**Ação concreta:** seguir a decisão já registrada em §2 do doc de
arquitetura — não subir um 3º Postgres na VPS; provisionar como schema/
projeto adicional no cluster Supabase que já roda o Company HQ
(`/opt/company/supabase/`). Adaptar `deploy/vps-setup.sh` para nginx próprio
em porta livre (padrão `v4mos-nginx`/`labdatadev-nginx`), nunca tocar
porta 80/443 do sistema.

**Verificação obrigatória no primeiro deploy:** confirmar que o `GRANT`
para `service_role` (causa raiz do bug do `0033`) se comporta igual num
projeto hospedado — rodar `SEED_DEMO=1` contra ele antes de considerar o
deploy "pronto", mesmo teste que validou o ambiente local.

### 2. Painéis admin — desbloqueiam 0028/0030 (schema já existe, falta tela)

| Painel | Rota sugerida | RPC que já existe |
|---|---|---|
| Fila de orçamento | `/admin/orcamentos` | `atualizar_status_orcamento` |
| Moderação de conteúdo | `/admin/moderacao` | `moderar_conteudo` |

Mesmo padrão gated (`GAMEHUB_ADMIN_EMAILS`) já usado em `/admin/eventos` —
não é arquitetura nova, é reaproveitar o componente existente com outra
fonte de dado. Moderação é **pré-requisito de bom senso antes de divulgar o
mapa publicamente** (pitch Sebrae, redes sociais) — priorizar sobre
orçamento se as duas competirem por tempo.

### 3. Gateway de pagamento real (Stripe) — só depois de validar o fluxo de orçamento com gente de verdade

**Regra não-negociável, já registrada em `PRODUTO-IA-FUNCIONARIOS.md` §7:**
nenhuma cobrança real sai do papel antes do fluxo de orçamento (`GH-COM-01`)
estar testado com clientes reais pedindo orçamento — cobrar antes disso é
construir a parte mais arriscada tecnicamente (dinheiro real, webhook,
conciliação) para um fluxo de produto ainda não validado.

**Quando chegar a hora:** `0029` já deixou `stripe_customer_id`/
`stripe_subscription_id` prontos e vazios. Falta: checkout (Stripe
Checkout, não Elements — menor superfície de PCI compliance para o estágio
atual) chamando `registrar_assinatura`, e um webhook handler validando HMAC
do Stripe antes de chamar `atualizar_status_assinatura`. Skill `/stripe`
disponível neste ambiente quando for a hora.

**Regra de preço:** o valor cobrado é sempre o snapshot gravado em
`assinaturas` no momento da contratação — nunca uma releitura de
`features/equipe-ia/catalogo.ts` (evita que uma mudança de preço futura
altere retroativamente o que um cliente já pagando deve).

### 4. Ponte onboarding → CRM real (maior alavancagem, menor esforço técnico)

**O que já existe:** o onboarding de 10 perguntas já captura sinal
BANT-like (segmento, gargalo, objetivo, faixa de investimento) de todo
negócio cadastrado — hoje esse dado só alimenta o próprio jogo.

**O que falta é decisão de produto, não schema novo:** como esse funil de
leads qualificados chega ao CRM que já existe no projeto `labdatadev-site`.
Três mecanismos possíveis, do mais simples ao mais robusto — decidir com o
Antonio antes de implementar, não default para o mais complexo:

1. **View de leitura** — o CRM consulta uma view somente-leitura no
   Postgres do gamehub, no seu próprio ritmo. Menor esforço, menor
   acoplamento, mas não é "tempo real".
2. **Export periódico** — job (cron/n8n, que já roda na VPS) lendo
   `negocios`/`onboardings` a cada N horas e empurrando pro CRM.
3. **Webhook em `criar_negocio_com_lote`** — mais imediato, mais
   acoplamento entre os dois sistemas (se o CRM cair, o cadastro no gamehub
   não pode quebrar por causa disso — teria que ser fire-and-forget, nunca
   bloqueante).

**Por que isto é "maior alavancagem, menor esforço":** o dado já existe e
já é coletado com consentimento (LGPD, `GH-OPS-04` fechado); é reaproveitar,
não construir do zero.

### 5. Conteúdo do jogo como dado, não código — só se/quando a operação pedir

Cargos, jobs, nós da árvore, mobília, lições e capítulos de história vivem
em `features/*/catalogo.ts` (código), não em tabela — decisão arquitetural
deliberada (`AGENTS.md` regra 3), correta para o volume de conteúdo e o
número de pessoas mexendo hoje. **Não antecipar esta migração.** Gatilho
real para revisitar: o Antonio (ou outra pessoa não-técnica) precisando
lançar uma campanha de conteúdo sem chamar um agente de IA/dev para editar
código. Até esse gatilho aparecer, mover isso para banco é complexidade sem
demanda.

## O que explicitamente NÃO fazer agora (evitar over-engineering)

Ver §5 da tabela de gatilhos em `architecture/DBA-ARQUITETURA-ESCALA-2026.md`
— partição de `progressao_eventos_log`, materialized views de
`mapa_resumo`/`bairro_resumo`, e isolamento de infra (Postgres dedicado)
têm gatilhos de volume claros, nenhum deles disparado hoje. Construir isso
agora é resolver um problema que ainda não existe, às custas de atenção que
os itens 1–4 acima precisam mais.
