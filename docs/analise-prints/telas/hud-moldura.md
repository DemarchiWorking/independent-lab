# HUD / Moldura fixa

> Categoria: `hud-moldura`. Não é uma "tela" — é a **moldura persistente**
> presente em ~100% dos 56 prints. Entender esta moldura é entender a
> gramática visual inteira do jogo.

---

## 1. Anatomia — posicionamento padrão (invariante em todos os prints)

```
┌──────────────────────────────────────────────────────────────┐
│ [💵 Dinheiro] [🙂 Usuários] [📅 Data ▓▓░ ] [⏸]   │   [Objetivo ▾] │
│ ⚠ faixa de alerta (dívida) / 🔔 faixa de notícia (concorrente) │
│ ┌──┐                                                          │
│ │💼│                                                          │
│ │👔│              PALCO CENTRAL                                │
│ │🏛│         (cena isométrica OU modal OU tela cheia)          │
│ │💼│                                                          │
│ │🔧│                                                          │
│ └──┘                        (⊞)                               │
│ [Participação de mercado 3% | 96%]      [Saldo mensal -3872 $]│
└──────────────────────────────────────────────────────────────┘
```

| Região | Conteúdo | Sempre visível? |
|---|---|---|
| **Topo-esquerda** | 3 cartões brancos: `Dinheiro`, `Usuários`, `Data` (+ barra de progresso da semana) + botão `⏸`/`▶▶` | Sim |
| **Abaixo do HUD** | Faixa de alerta vermelha (dívida) **ou** faixa amarela (notícia de concorrente) | Condicional |
| **Topo-direita** | Dropdown `Objetivo` **ou** botão `✕` vermelho (quando há modal/tela cheia aberta) | Sim (alterna) |
| **Lateral-esquerda** | 5 ícones: maleta · pessoa de gravata · prédio · carteira · ferramentas | Só no mundo/modais (some em tela cheia) |
| **Baixo-esquerda** | `Participação de mercado` — 2 avatares + % | Sim |
| **Baixo-direita** | `Saldo mensal` + valor (negativo em destaque) | Sim |
| **Baixo-centro** | Botão circular `⊞` (grade 2×2) — app-drawer | Sim |

## 2. Os 3 cartões do HUD — o que cada um significa

| Cartão | Exemplo observado | Significado mecânico |
|---|---|---|
| **Dinheiro** | `$-3571` → `$-2571` → `$-6444` | Caixa da empresa. **Pode ficar negativo** — é o motor de tensão do jogo |
| **Usuários** | `2460` → `1040` → `1010` → `1006` | Base de usuários do produto. **Cai sozinha** se o produto/marketing não evoluir (churn passivo) |
| **Data** | `Y4 M12 W` → `Y5 M1 W` | Ano/Mês/Semana + barra da semana em curso. O tempo **avança sozinho** (por isso o botão pausa/acelerar) |

**Insight de game design:** os três números contam a história inteira sem
texto — "estou perdendo dinheiro, perdendo usuários, e o tempo não para".
Tensão permanente, legível em meio segundo.

## 3. Variações observadas (o que muda entre prints)

| Elemento | Estados observados |
|---|---|
| Botão de tempo | `⏸` (pausado/normal) · `▶▶` (acelerado) |
| Faixa de alerta | `Você tem 61 dias para pagar sua dívida.` → `56 dias` → `54 dias` (contagem regressiva real) |
| Faixa de notícia | `Allberg Industries acabou de desenvolver Conta oficial.` (amarela, sobre concorrente) |
| Topo-direita | `Objetivo ▾` no mundo · `✕` vermelho quando há modal aberto |
| Participação de mercado | `7% / 92%` → `3% / 96%` (o jogador estava **perdendo** mercado) |
| Saldo mensal | `-3740 $` → `-3872 $` → `-3875 $` (piorando) |

## 4. Como isso já foi traduzido no labdatadev-gamehub

Implementado em `src/components/ui/HudBar.tsx` + `StatCard` + `AlertBanner`:

| Startup Panic | labdatadev-gamehub | Racional |
|---|---|---|
| Dinheiro (pode ser negativo) | 🪙 Moeda virtual (nunca negativa) | Não queremos punir empresário real com "dívida" fictícia |
| Usuários | Rede (nº de parceiros no quarteirão) | Métrica social real, não vaidade |
| Data (Y/M/W) | Ciclo de 90 dias + nível | Ancorado no valor institucional "revisão a cada 90 dias" |
| Objetivo | Missão atual (derivada da escada de valor) | Sempre UMA meta clara |
| Participação de mercado | *(ainda não implementado)* | Ver `mercado-concorrencia.md` |
| Saldo mensal | Degrau atual na escada de valor | Progresso comercial, não caixa |

## 5. Requisitos funcionais derivados

- **RF-HUD-01** — O HUD deve exibir simultaneamente: moeda virtual, tamanho
  da rede, ciclo/nível atual e a missão vigente, em todas as telas do jogo.
- **RF-HUD-02** — Deve existir uma faixa de alerta condicional para prazos
  (ex.: dias até a retro de 90 dias), visualmente distinta de notificações
  informativas.
- **RF-HUD-03** — O HUD nunca deve ser coberto pelo conteúdo central; modais
  se posicionam abaixo dele.
- **RF-HUD-04** — Toda tela sobreposta (modal/tela cheia) deve oferecer um
  `✕` de fechar no topo-direita, substituindo visualmente o `Objetivo`.
- **RF-HUD-05** — Variações de valor no HUD devem ser animadas (o jogador
  precisa *perceber* que ganhou XP/moeda) — já implementado via
  `RecompensaProvider` + toast.
