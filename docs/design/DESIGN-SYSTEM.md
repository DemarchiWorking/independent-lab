# Design System — labdatadev-gamehub

> Ponte entre a **gamificação anos 2000** (Startup Panic, pixel isométrico) e a
> **marca Laboratório Demarchi** (consultoria de TI regional). Fonte de verdade
> dos tokens: [`design-system/tokens.ts`](../../design-system/tokens.ts).
>
> **Regra (AGENTS):** cor só por token — nunca hex avulso no código.

---

## 1. Princípios de design

1. **Nostálgico, não datado** — pixel/isométrico com carisma, mas UI legível e
   moderna (mobile-first).
2. **Negócio de verdade em primeiro plano** — o jogo é a casca; parceria,
   serviço e reputação **reais** são o núcleo.
3. **Trade-off sempre visível** — todo botão de ação mostra o custo (moeda
   virtual 🪙 ou R$ real 💵, nunca misturados).
4. **Regional & humano** — avatares, salas e parceiros remetem a empresas reais
   da região (Vale do Café / mercado imobiliário).

## 2. Paleta — a ponte

| Token | Hex | Origem | Uso |
|---|---|---|---|
| `brand.orange` | `#F59E0B` | labdatadev **=** CTA Startup Panic | Botões primários, destaque |
| `brand.teal` | `#00D4C8` | labdatadev (accent) ≈ paredes do jogo | Marca, links, ativo |
| `brand.green` | `#22C55E` | labdatadev | Dinheiro, sucesso, progresso |
| `brand.coral` | `#EF5350` | Startup Panic (ribbon) | Títulos de modal, alertas |
| `bg.night` | `#080E1D` | labdatadev | Fundo escuro / modo noturno |
| `bg.card` | `#0F1A2E` | labdatadev | Cartões no dark |
| `bg.light` | `#F8FAFC` | labdatadev | Fundo claro (árvore/grid) |
| `ink` | `#0A1628` | labdatadev | Texto principal |
| `muted` | `#94A3B8` | labdatadev | Texto secundário |
| **Categorias (hex tree)** | | | |
| `cat.social` | `#8BC34A` | jogo | Ramo social/comunidade |
| `cat.media` | `#5B9BD5` | jogo | Ramo mídia/marketing |
| `cat.growth` | `#F4C430` | jogo | Ramo analytics/growth |
| `cat.ads` | `#B15FC4` | jogo | Ramo ads/vídeo |
| `cat.locked` | `#E86A6A` | jogo | Bloqueado/necessário |

## 3. Tipografia

| Papel | Fonte sugerida | Uso |
|---|---|---|
| **UI / headings** | Nunito / Fredoka (sans arredondada) | HUD, títulos, botões |
| **Corpo** | Inter / system-ui | Textos longos, descrições |
| **Retrô/pixel** | "Press Start 2P" / VT323 | Selos, telas CRT, easter eggs |

Escala (mobile-first): 12 · 14 · 16 · 20 · 24 · 32 · 40.

## 4. Componentes (o "kit Startup Panic")

| Componente | Descrição | Feature/UI |
|---|---|---|
| `HudBar` | 4 cantos: Dinheiro/Usuários/Data + Objetivo | moldura fixa |
| `RibbonPanel` | modal branco + ribbon coral em ângulo + X | base de todos os modais |
| `ActionButton` | CTA laranja full-width com custo | `primary` / `ghost` (cinza) |
| `AlertBanner` | faixa vermelho-escura sob o HUD | avisos/prazos |
| `HexTree` | grid isométrico de hexágonos coloridos + nota | parceiros/serviços |
| `SidePanel` | painel lateral com abas Informação/Status | detalhe de nó/recurso |
| `JobCard` / `JobList` | lista + detalhe (recompensa, rating, tempo) | marketplace de TI |
| `AvatarBubble` | avatar pixel + balão de emoção | equipe/parceiros |
| `IsoRoom` | sala isométrica navegável (Habbo-like) | hub/empresa |
| `UpgradeCompare` | tabela Atual × Próximo | evolução de sede/plano |

## 5. Espaçamento, raio e sombra

- **Grid base:** 4px. Espaçamentos: 4 · 8 · 12 · 16 · 24 · 32.
- **Raio:** `sm 6` · `md 12` · `pill 999`. Cartões e botões bem arredondados.
- **Sombra:** suave e difusa (estilo "flat + leve profundidade"), nunca dura.

## 6. Moeda: regra de ouro (virtual × real)

| | 🪙 Moeda virtual | 💵 Real (R$) |
|---|---|---|
| Cor | `brand.teal` | `brand.green` |
| Uso | XP, cosmético, progressão | serviços/produtos reais, parcerias |
| Ícone | moeda pixel | cifrão sólido |
| Regra | nunca compra R$ | sempre com nota/gateway/compliance |

**Nunca** exibir as duas na mesma "carteira" sem rótulo claro. Ver riscos em
[`../CONTEXTO-NEGOCIO.md`](../CONTEXTO-NEGOCIO.md).

## 7. Acessibilidade

- Contraste mínimo AA (texto sobre laranja usa `ink`, não branco).
- Alvos de toque ≥ 44px. Estados de foco visíveis.
- Nunca comunicar só por cor (hex tree usa cor **+** ícone **+** nota).
