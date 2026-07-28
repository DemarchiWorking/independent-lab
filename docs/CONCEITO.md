# Conceito & Game Design — labdatadev-gamehub

## 1. Visão

Um **simulador de negócios jogável** que funciona como a camada de gamificação
do Laboratório Demarchi. Estética de **metaverso isométrico pixel/estilizado** —
referências diretas: **Startup Panic** (mecânica de simulação de startup) e
**Habbo Hotel** (mundo social isométrico, salas, avatares, mobília).

O diferencial: **não é um jogo isolado nem só fictício**. O hub conecta pessoas
e empresas **reais** — dentro dele há **parcerias** e **venda de produtos e
serviços reais**, com o progresso no jogo refletindo negócios de verdade.

## 2. Pilares

1. **Isométrico social (estilo Habbo)** — avatares, salas navegáveis, mobília,
   presença de outros players. Pixel/estilizado, leve, carismático.
2. **Simulação de negócio (estilo Startup Panic)** — recursos, decisões com
   trade-offs, eventos, crescimento da empresa como um tycoon.
3. **Camada real** — marketplace de **produtos e serviços reais** e sistema de
   **parcerias** entre players/empresas dentro do mundo.
4. **Conectado ao negócio** — eventos reais (lead, contrato, entrega, venda)
   viram progresso no jogo, e ações no jogo geram negócios reais.

5- IMPORTANTE: Necessario criar Guildas dentro do Mundo que Usuarios a partir de um nivel alto ou ranking consiga construir sua equipe.
## 3. O Hub (o "metaverso")

Um mapa 2D (grid ou salas conectadas). Cada **zona** é um módulo do negócio:

| Zona | Representa | Exemplo de ação |
|---|---|---|
| 🏢 Recepção | Onboarding / identidade | Definir missão, avatar da empresa |
| 💼 Comercial | Pipeline de vendas | Prospectar, qualificar leads (BANT) |
| ⚙️ Operações | Entrega de serviços | Alocar recursos, cumprir SLA |
| 💰 Financeiro | Caixa / MRR | Ver receita, custos, runway |
| 📣 Marketing | Aquisição | Rodar campanhas, medir CAC |
| 🧪 P&D / Lab | Inovação | Desbloquear novos serviços |

Navegação minimalista: clicar numa zona → painel foca nela (sem tela de loading
pesada). Movimento suave com Framer Motion.

## 4. Mecânicas de gamificação

- **Recursos:** 💵 Caixa · ⏳ Tempo · ⚡ Energia · ⭐ Reputação
- **XP & Níveis:** cada ação concede XP; níveis desbloqueiam zonas/recursos
- **Missões:** objetivos guiados ("feche 3 diagnósticos", "atinja X de MRR")
- **Conquistas:** marcos comemorados com feedback visual/sonoro sutil
- **Estados de progresso:** o hub evolui visualmente conforme a startup cresce

## 5. Ponte com o negócio real (labdatadev)

O jogo lê métricas reais da startup (fonte de verdade em `labdatadev-context` e,
futuramente, no CRM/Supabase):

- Lead qualificado → +XP na zona Comercial
- Contrato fechado → +Caixa e +Reputação
- Meta de OKR batida → desbloqueia conquista
- Entrega dentro do SLA → progresso em Operações

> Integrações futuras: Kommo CRM, GA4, n8n (já no stack do labdatadev).

## 6. Escopo por fases

| Fase | Entrega |
|---|---|
| **0 — Fundação** ✅ | Estrutura de pastas, conceito, stack (este doc) |
| **1 — Protótipo do hub** | Mapa 2D navegável com zonas estáticas (mock) |
| **2 — Simulação** | Recursos + decisões com trade-offs (dados mock) |
| **3 — Gamificação** | XP, níveis, missões, conquistas (Supabase) |
| **4 — Ponte real** | Conectar métricas reais (CRM/analytics) |

## 7. Perguntas em aberto (decidir antes da Fase 1)

- Grade isométrica: **tile-based** (como Habbo) do zero, ou engine 2D (Phaser)?
- Marketplace real: **curadoria** (só parceiros aprovados) ou **aberto**?
- Alvo principal: **web** (desktop) primeiro, mobile depois?

> Modelo de negócio completo (receita, marketplace, parcerias, GTM) em
> [`CONTEXTO-NEGOCIO.md`](CONTEXTO-NEGOCIO.md).
