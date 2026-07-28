# Inventário de Telas & Fluxos — labdatadev-gamehub

> Adaptação das telas do Startup Panic para o contexto de **negócios regionais
> reais + parcerias + entrega de TI em massa**. Cada tela aponta a feature que a
> implementa (`src/features/*`).

---

## Mapa de telas

| # | Tela | Herda de (Startup Panic) | Feature | Camada |
|---|---|---|---|---|
| 1 | **Hub isométrico** (mundo/salas) | Escritório iso + Habbo | `hub/` | jogo |
| 2 | **HUD** (4 cantos + Objetivo) | HUD do jogo | `hub/` | jogo |
| 3 | **Árvore de parceiros/serviços** | Árvore de recursos (hex) | `parcerias/` | real |
| 4 | **Marketplace de TI** (jobs) | "Prestação de serviço" | `marketplace/` | real |
| 5 | **Perfil de parceiro** (empresa) | Detalhe de job + avatar | `parcerias/` | real |
| 6 | **Contratar/alocar** (equipe) | "Contratar" (caçador) | `simulador/` | jogo |
| 7 | **Evoluir sede/plano** | "Melhorar escritório" | `gamificacao/` | jogo/real |
| 8 | **Eventos & missões** | Eventos narrativos | `gamificacao/` | jogo |
| 9 | **Carteira** (🪙 virtual / 💵 R$) | Dinheiro + Saldo mensal | `marketplace/` | ambos |
| 10 | **Ranking & reputação** | Participação de mercado | `social/` | ambos |

---

## Detalhe das telas prioritárias (Fase 1–3)

### 1. Hub isométrico
- Mundo navegável com **salas = empresas/parceiros reais** da região.
- Avatar do jogador (a própria empresa) + presença de outros players.
- Clicar numa sala → foca no **perfil do parceiro** (tela 5).
- HUD sempre visível (tela 2).

### 2. HUD
- Topo-esq: 🪙 **Moeda** · 👥 **Reputação/Rede** · 📅 **Ciclo** (barra 90 dias).
- Topo-dir: **Objetivo** (missão atual).
- Lados/baixo: toolbar de módulos, ranking regional, carteira.

### 3. Árvore de parceiros/serviços (hex tree) ⭐
- Hexágonos = **serviços de TI** e **parcerias** desbloqueáveis.
- Cor por categoria (`cat.*`) + ícone + **nota** (fit/prioridade).
- Painel lateral (Informação/Status): descrição, "atributos recomendados",
  CTA **"Revisão"** (avaliar) / desbloquear.
- Representa a **jornada de maturidade** de TI de um parceiro real.

### 4. Marketplace de TI (jobs) ⭐⭐
- Lista de **serviços reais do portfólio labdatadev** como jobs:
  *automação, migração de dados (Excel→SQL), site/landing, infra AWS, BI,
  integração CRM, UX/UI...* (espelha os jobs vistos no jogo).
- Card: `Recompensa (R$) · rating · Pontuação mín. · Tempo est.`
- CTAs: **"Revisão"** (orçar) / **"Aceitar trabalho"** (contratar de verdade).
- Ligado à pasta [`../../melhoria-continua/servicos-ti`](../../melhoria-continua/servicos-ti).

### 5. Perfil de parceiro (empresa regional)
- Avatar/logo, nome, segmento (imobiliária, construtora, loteadora...),
  cidade/região, reputação, serviços contratados, oportunidades de parceria.
- Dados vindos do **banco regional** → ver
  [`../database/SCHEMA-PARCEIROS-REGIONAL.md`](../database/SCHEMA-PARCEIROS-REGIONAL.md).

---

## Moldura reutilizável (todas as telas)

`RibbonPanel` (modal com ribbon coral + X) + `ActionButton` (laranja) +
`AlertBanner`. Mobile-first; em telas largas o painel lateral fica fixo à direita
(como no jogo), em mobile vira bottom-sheet.
