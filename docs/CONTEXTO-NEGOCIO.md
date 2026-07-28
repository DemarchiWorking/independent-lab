# Contexto de Negócio — labdatadev-gamehub

> Camada de gamificação de negócios do **Laboratório Demarchi (labdatadev)**.
> Um metaverso isométrico (estilo **Habbo Hotel**) com simulação de negócios
> (estilo **Startup Panic**) — porém conectado ao **mundo real**: parcerias e
> venda de **produtos e serviços reais** acontecem dentro do mundo.
>
> ⭐ **Atualização (2026-07-26):** este é o hub oficial da MEI labdatadev.
> O produto que efetivamente será vendido primeiro são **Funcionários de
> IA** (agentes Claude contratáveis por assinatura). Ver
> [`PRODUTO-IA-FUNCIONARIOS.md`](PRODUTO-IA-FUNCIONARIOS.md) — este
> documento continua válido como visão geral, mas aquele é o plano de
> execução mais concreto.

| Campo | Valor |
|---|---|
| Produto | labdatadev-gamehub |
| Empresa | Laboratório Demarchi (labdatadev) |
| Tipo | Metaverso de negócios + marketplace real + simulador |
| Documento | Contexto de negócio v1.0 |
| Relacionado | [`CONCEITO.md`](CONCEITO.md) · [`ARQUITETURA.md`](ARQUITETURA.md) · [`labdatadev-context`](../../labdatadev-context) |

---

## 1. Resumo executivo

O gamehub transforma o "fazer negócios" em uma experiência jogável e social.
Empreendedores, prestadores e empresas criam um **avatar** e uma **sede** num
mundo isométrico, evoluem sua empresa com mecânicas de simulação, e — o
diferencial — **fecham negócios reais** ali dentro: contratam serviços, vendem
produtos, formam parcerias. O jogo é a camada de engajamento; o **marketplace
real** é o motor de receita.

**Frase-âncora:** *Habbo + Startup Panic, mas o dinheiro e as parcerias são de
verdade.*

## 2. Problema & oportunidade

- Networking e prospecção B2B são **áridos e sem engajamento** (LinkedIn frio,
  planilhas, reuniões).
- Marketplaces de serviços são **transacionais e sem relacionamento** — não
  criam comunidade nem retenção.
- Ferramentas de gestão de startup são **chatas**; falta motivação para manter
  ritmo (metas, hábitos, execução).

**Oportunidade:** unir *engajamento de jogo social* + *simulação de negócio* +
*marketplace real* num só lugar, aproveitando o método e a base do labdatadev.

## 3. Referências de produto

| Referência | O que herdamos |
|---|---|
| **Habbo Hotel** | Mundo isométrico, avatares, salas customizáveis, presença social, chat, itens/mobília |
| **Startup Panic** | Simulação de startup: recursos, decisões, eventos, crescimento tipo tycoon |
| **Marketplaces (Fiverr/GetNinjas)** | Oferta/demanda real de serviços, avaliações, pagamento |
| **labdatadev** | Método comercial (BANT), OKRs, portfólio de serviços, ICP |

## 4. Público-alvo (ICP)

1. **Empreendedores / donos de startup** — querem crescer, fazer networking e
   contratar serviços com menos fricção.
2. **Prestadores de serviço / freelancers** — querem vitrine, leads e reputação.
3. **PMEs e parceiros** — querem canal de venda e parcerias (co-marketing,
   indicação, revenda).
4. **Base labdatadev** — clientes e leads existentes como primeiros players.

## 5. Proposta de valor

- **Para quem contrata:** encontrar e fechar serviços/produtos reais de um jeito
  visual, social e confiável (reputação in-game).
- **Para quem vende:** vitrine viva, leads qualificados, gamificação que premia
  atividade e boas avaliações.
- **Para parceiros:** sistema nativo de parceria (indicação, revenda, co-oferta)
  com comissões rastreadas.
- **Para todos:** progresso, status e comunidade — motivação para voltar todo dia.

## 6. Como funciona — o loop principal

```
        ┌─────────────────────────────────────────────┐
        │  MUNDO ISOMÉTRICO (Habbo-like)               │
        │  avatar · sede · salas · outros players      │
        └───────────────┬─────────────────────────────┘
                        │ age (visita, negocia, oferta)
                        ▼
        ┌─────────────────────────────────────────────┐
        │  SIMULAÇÃO (Startup Panic-like)              │
        │  recursos · decisões · eventos · crescimento │
        └───────────────┬─────────────────────────────┘
                        │ gera progresso + oportunidades
                        ▼
        ┌─────────────────────────────────────────────┐
        │  CAMADA REAL                                 │
        │  marketplace (produtos/serviços) · parcerias │
        │  pagamentos reais · reputação · contratos    │
        └───────────────┬─────────────────────────────┘
                        │ negócios reais = XP, moeda, status
                        └────────────► volta pro mundo
```

Ações reais geram progresso no jogo; progresso no jogo dá visibilidade e desbloqueia
oportunidades reais. **Engajamento e receita se retroalimentam.**

## 7. Camada real — marketplace & parcerias

### 7.1 Marketplace de produtos e serviços reais
- Players publicam **ofertas reais** (serviço do labdatadev, produto próprio,
  consultoria, etc.) como "lojas"/estandes no mundo.
- Compra/contratação com **pagamento real** (gateway) e **contrato/entrega**.
- **Reputação** (avaliações, entregas no prazo) vira status visível in-game.
- **Dois formatos de oferta:** jobs **avulsos** (por entrega, ex.: migração de
  dados) e **Funcionários de IA** (assinatura mensal recorrente — o produto
  central, ver [`PRODUTO-IA-FUNCIONARIOS.md`](PRODUTO-IA-FUNCIONARIOS.md)).

### 7.2 Sistema de parcerias
- **Indicação:** player indica outro → comissão rastreada.
- **Revenda / white-label:** parceiro revende serviços labdatadev.
- **Co-oferta:** dois players montam uma oferta conjunta (ex.: dev + designer).
- **Salas de parceria:** espaços compartilhados para squads/alianças.

## 8. Modelo de negócio (receitas)

| Fonte | Descrição |
|---|---|
| **Comissão de marketplace** | % sobre cada venda/contratação real fechada no hub |
| **Assinatura (SaaS)** | Planos (Free / Pro / Business) com limites e recursos premium |
| **Itens virtuais** | Customização de avatar/sede, destaques de loja (cosmético) |
| **Destaque/ads internos** | Ofertas em destaque, posições nobres no mundo |
| **Serviços labdatadev** | O próprio portfólio Demarchi vendido nativamente |
| **Comissão de parceria** | Fee sobre negócios originados por indicação/revenda |

> **Regra de moeda:** separar claramente **moeda virtual** (progresso/cosmético,
> sem valor monetário) de **transações reais** (dinheiro de verdade, com nota,
> gateway e compliance). Nunca misturar as duas economias.

## 9. Papéis de usuário

| Papel | Pode |
|---|---|
| **Player/Empreendedor** | Criar avatar/sede, jogar, comprar, formar parcerias |
| **Vendedor/Prestador** | Publicar ofertas reais, receber pagamentos, subir reputação |
| **Parceiro** | Indicar, revender, co-ofertar, acompanhar comissões |
| **Admin (labdatadev)** | Curadoria, moderação, gestão do marketplace e economia |

## 10. Métricas-chave (North Star + apoio)

- **North Star:** volume de **negócios reais fechados** no hub (GMV).
- Apoio: DAU/MAU, retenção D1/D7/D30, ofertas ativas, taxa de conversão de
  visita→contratação, NPS, receita por player (ARPU), take rate.

## 11. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Escopo enorme (metaverso é caro) | Fatiar por fases; começar com hub simples + marketplace |
| Confusão moeda virtual × real | Separação rígida de economias; UX e termos claros |
| Compliance de pagamentos/LGPD | Gateway sério, KYC básico, políticas; ver arquitetura Demarchi |
| Marketplace vazio (cold start) | Semear com base e portfólio labdatadev; curadoria inicial |
| Moderação/fraude | Reputação, avaliações, curadoria de parceiros, admin ativo |

## 12. Go-to-market

1. **Semente:** base de clientes/leads do labdatadev como primeiros players e
   primeiras ofertas reais (evita marketplace vazio).
2. **Comunidade:** eventos in-world, salas temáticas, ranking — engajamento
   estilo Habbo.
3. **Parcerias:** ativar revendedores/indicadores desde cedo (efeito rede).
4. **Expansão:** abrir para novos segmentos conforme liquidez do marketplace.

## 13. Roadmap (visão de produto)

| Fase | Entrega | Camada |
|---|---|---|
| **0 — Fundação** ✅ | Conceito, contexto de negócio, stack | docs |
| **1 — Hub isométrico** | Mundo navegável + avatar + sede (mock) | jogo |
| **2 — Simulação** | Recursos, decisões, eventos | jogo |
| **3 — Marketplace real** | Ofertas reais, pagamento, reputação | real |
| **4 — Parcerias** | Indicação, revenda, co-oferta, comissões | real |
| **5 — Social & economia** | Chat, salas compartilhadas, itens, ranking | jogo |
| **6 — Ponte labdatadev** | CRM/analytics reais → progresso | integração |

---

> **Próximo passo:** validar as 3 perguntas em aberto do [`CONCEITO.md`](CONCEITO.md)
> (engine isométrica, curadoria do marketplace, web-first) e então iniciar a
> Fase 1 (protótipo do hub).
