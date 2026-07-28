# Funcionários de IA — o produto central do gamehub

> **Pivot registrado em 2026-07-26.** Este documento é a fonte de verdade do
> que o `labdatadev-gamehub` **é**, comercialmente: o **hub oficial da MEI
> Laboratório Demarchi**, onde parceiros e empresas regionais se cadastram e
> **contratam agentes de IA (Claude) como se fossem funcionários** — dentro de
> um mundo gamificado que transforma jogo em negócio real.
>
> Todo documento anterior (`CONTEXTO-NEGOCIO.md`, `CONCEITO.md`) continua
> válido na estrutura (metaverso, escada de valor, marketplace, parcerias) —
> este documento **especializa o marketplace**: o que se vende, primeiro e
> principalmente, são **funcionários de IA**.

---

## 1. A ideia em uma frase

> **O gamehub é a vitrine e o motor comercial da labdatadev.** Empresário
> regional se cadastra, joga, e no processo **contrata uma equipe de IA**
> (documentação, mídia social, vídeo, comercial) que trabalha de verdade no
> negócio dele — cobrando conforme sobe a escada de valor.

## 2. Público-alvo (reforço de foco)

**Empresários e donos de startup — novos e regionais — principalmente até
PMEs.** Mesmo ICP já mapeado (imobiliárias, construtoras, loteadoras do Vale
do Café + comércio local regional), mas agora com uma oferta muito mais
concreta e fácil de vender do que "consultoria de TI": **"contrate um
funcionário de IA por uma fração do custo de um CLT."**

## 3. O que é um "Funcionário de IA"

Diferente de um **job avulso** do marketplace (uma entrega pontual, ex.:
"migrar Excel para SQL"), um **Funcionário de IA** é:

- Um **agente Claude configurado** para uma função de negócio **recorrente**
- Vendido como **assinatura/pacote mensal** (não por tarefa)
- Com **entregáveis previsíveis** e frequência definida
- Operado no início **com humano no loop** (Antonio supervisiona/valida),
  evoluindo para mais autonomia conforme o produto amadurece
- Representado no jogo como um **avatar contratável** dentro da sede do
  jogador (ver §6 — ponte com a gamificação)

| | Job avulso (marketplace atual) | Funcionário de IA (novo) |
|---|---|---|
| Cobrança | por entrega | assinatura mensal |
| Duração | pontual | recorrente |
| Exemplo | "Logo para colchão — R$ 1.620" | "Social Media IA — R$ 397/mês" |
| Represent. no jogo | card de job | avatar na sede |

## 4. Catálogo inicial (4 cargos)

### 4.1 📄 Documentador(a) IA
- **Entrega:** documentação técnica, processos internos, manuais de
  procedimento, SOPs, base de conhecimento.
- **Frequência:** sob demanda + revisão mensal.
- **Por que importa para o cliente:** PME que cresce rápido perde
  conhecimento em gente que sai; documentar é o que ninguém tem tempo de
  fazer.
- **Ferramenta-base:** Claude (geração + estruturação) + revisão humana.

### 4.2 🎨 Social Media IA (Carrossel)
- **Entrega:** carrosséis para Instagram/LinkedIn (roteiro + copy + direção
  de arte), calendário de postagem.
- **Frequência:** N carrosséis/mês (pacote).
- **Por que importa:** presença digital é a dor #1 do ICP (ver
  `docs/design/ONBOARDING-10-PERGUNTAS.md` — gargalo "imagem fraca").
- **Ferramenta-base:** Claude (roteiro/copy) + geração de imagem (`/image`
  skill) + template de design.

### 4.3 🎬 Editor(a) de Vídeo IA (Reels)
- **Entrega:** vídeos curtos para redes (reels, TikTok) e propaganda paga —
  roteiro, cortes, legendas, CTA.
- **Frequência:** N vídeos/mês (pacote).
- **Por que importa:** vídeo converte mais que imagem estática; é o item mais
  caro de terceirizar tradicionalmente — maior alavancagem de preço.
- **Ferramenta-base:** Claude (roteiro) + geração de vídeo IA (`/video`
  skill) + edição.

### 4.4 📞 Comercial/Automação IA (SDR virtual)
- **Entrega:** qualificação de leads (BANT), follow-up automático,
  agendamento, integração com WhatsApp/CRM.
- **Frequência:** contínuo (always-on).
- **Por que importa:** é o gargalo mais citado no onboarding
  ("perco leads por demora") — ver `features/onboarding/scoring.ts`.
- **Ferramenta-base:** Claude + n8n/automação + integração CRM/WhatsApp
  (mesma stack já documentada em `labdatadev-context/05-operations`).

> Cada cargo vira um **playbook operacional** em
> [`melhoria-continua/servicos-ti/`](../melhoria-continua/servicos-ti) —
> stubs já criados, a preencher com escopo, checklist e SLA.

## 5. Modelo de oferta e preço (rascunho — validar amanhã)

| Cargo | Preço sugerido | Ligação com a escada de valor |
|---|---|---|
| Documentador(a) IA | R$ 297/mês | disponível a partir do Degrau 2 |
| Social Media IA | R$ 397/mês | disponível a partir do Degrau 2 |
| Editor(a) de Vídeo IA | R$ 597/mês | disponível a partir do Degrau 3 |
| Comercial/Automação IA | R$ 897/mês | disponível a partir do Degrau 3 |
| **Squad completo** (os 4) | pacote com desconto | Degrau 4 (Ecossistema Completo) |

> Preços são ponto de partida — cruzar com `labdatadev-context/04-portfolio/pricing_methodology.md`
> antes de publicar qualquer valor a cliente real.

## 6. Ponte com a gamificação (como isso vira jogo)

O motor de gamificação já existe (`docs/GAMIFICACAO.md`) — falta o evento e a
representação visual:

1. **Novo evento** `funcionario_ia_contratado` em
   `features/gamificacao/engine.ts` — XP alto (é uma contratação recorrente,
   não uma tarefa), sem custo de degrau fixo (pode acelerar o degrau-alvo).
2. **Representação no hub:** cada funcionário contratado vira um **avatar
   extra na sede isométrica** do jogador (reaproveita `IsoRoom` +
   `AvatarBubble`, hoje não usado) — o "escritório" visualmente cresce
   conforme a empresa contrata.
3. **Tela dedicada** (nova, a construir): `features/equipe-ia/EquipeIaScreen`
   — mostra os 4 cargos como cards "Contratar" (estilo `ActionButton`), com
   estado "contratado" persistido por tenant (hoje falta persistência — ver
   `docs/ESTADO-DO-PROJETO.md`).
4. **Missão inicial atualizada:** para todo negócio no Degrau 1, a primeira
   missão pode virar "Contrate seu primeiro funcionário de IA" em vez de (ou
   antes de) "Agende diagnóstico" — decisão de produto a validar.

## 7. Solicitação de orçamento (fluxo futuro)

Cliente deve poder **pedir orçamento** de um funcionário de IA, de um serviço
avulso, ou de um produto — sem precisar falar direto com Antonio antes de ter
interesse real. Modelo de dados já existe (tabela `deals` em
[`docs/database/SCHEMA-PARCEIROS-REGIONAL.md`](database/SCHEMA-PARCEIROS-REGIONAL.md)):

```
status: orcamento → aceito → entrega → concluido
origem: hub | indicacao | marketplace | direto
```

**Fluxo alvo:**
1. Cliente vê um cargo/serviço → clica "Solicitar orçamento"
2. Formulário curto (escopo, urgência, orçamento aproximado)
3. Vira um `deal` com status `orcamento`, notifica Antonio (painel admin,
   ainda não existe)
4. Antonio aprova/ajusta → status `aceito` → contrato real fora do app (por
   ora) → `entrega` → `concluido`
5. Ao concluir, dispara `servico_contratado` (ou o novo evento) — fecha o
   loop de gamificação

> **Não implementar pagamento real dentro do app ainda.** Orçamento e
> negociação primeiro; cobrança real (Stripe/gateway) é fase posterior — ver
> riscos de compliance em `docs/CONTEXTO-NEGOCIO.md` §11.

## 8. O que NÃO mudou

- A estrutura de metaverso (hub, mapa, marketplace, árvore de parcerias)
  continua a mesma — este documento **não substitui** `CONCEITO.md` nem
  `CONTEXTO-NEGOCIO.md`, apenas concentra o que efetivamente será vendido
  primeiro.
- A separação moeda virtual × R$ real continua regra de ouro.
- O ICP e a geografia (Vale do Café) continuam os mesmos.

## 9. Perguntas em aberto (decidir antes de construir a tela)

1. Funcionário de IA é **por tenant** (cada negócio contrata o seu) ou existe
   um **catálogo global** com Antonio como "gerente" de todos? (Provavelmente
   por tenant, com Antonio operando por trás de todos no MVP.)
2. O "squad" contratado aparece **só no painel** (lista) ou também
   **visualmente na sede isométrica**? (Recomendo: painel primeiro — mais
   rápido de construir e testar; visual isométrico depois.)
3. Onboarding (10 perguntas) deveria ganhar uma **11ª pergunta**: "Qual
   função você mais gostaria de terceirizar para uma IA?" — mapeia direto
   pro catálogo e vira a missão inicial personalizada.
