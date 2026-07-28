# Menu Inicial — a navegação do jogo (o que já existe)

> "Menu inicial" = a moldura de navegação que o jogador vê ao abrir o app —
> **já construída**. Este documento descreve o que existe hoje e como ele
> vai abrir a porta para o [World](../world/ARQUITETURA-WORLD.md) (a
> simulação real da sede, ainda a construir).

---

## 1. O que é, hoje, o menu inicial

Implementado em `src/features/shell/GameShell.tsx`. É a moldura fixa do
jogo: HUD nos 4 cantos + um "palco" central que troca de tela com animação
(`AnimatePresence`/`screenVariants`) + uma barra de navegação inferior.

```
┌─────────────────────────────────────────────┐
│  HUD (moeda, rede, ciclo, objetivo, alerta)  │  ← sempre visível
├─────────────────────────────────────────────┤
│                                               │
│         palco central (troca por aba)        │  ← Hub / Mapa / Equipe IA /
│                                               │     Marketplace / Parcerias
│                                               │
├─────────────────────────────────────────────┤
│         [Hub] [Mapa] [Equipe IA] [...]       │  ← navegação inferior
│  (●●)  app-drawer → painel "Módulos"         │  ← canto inferior-esquerdo
└─────────────────────────────────────────────┘
```

## 2. As abas hoje

| Aba | Feature | Status |
|---|---|---|
| **Hub** | `features/hub/HubScreen` | ✅ mundo isométrico ambiente + missão atual |
| **Mapa** | `features/mapa/MapaScreen` | ✅ cidade→bairro→quarteirão real, vizinhos |
| **Equipe IA** | `features/equipe-ia/EquipeIaScreen` | ✅ contratar Funcionários de IA |
| **Serviços** | `features/marketplace/MarketplaceScreen` | ✅ jobs de TI avulsos |
| **Parcerias** | `features/parcerias/HexTreeScreen` | ✅ árvore de maturidade |
| **Módulos** (app-drawer) | `features/roadmap/modules.tsx` | 🟡 stubs: eventos, contratar equipe humana, **sede**, **loja**, financas, rh-motivacao, mercado-concorrencia |

## 3. Onde o World entra

Dois dos stubs do app-drawer (**`sede`** e **`loja`**) não vão virar telas
avulsas — eles se tornam o **World**: a sala isométrica de verdade da
empresa, comprável/alugável e mobiliável. Ver a arquitetura completa em
[`../world/ARQUITETURA-WORLD.md`](../world/ARQUITETURA-WORLD.md).

**Ponto de entrada planejado:** um novo item na navegação (ex.: "Minha
Sede" ou reaproveitar o clique no avatar do jogador dentro do `HubScreen`)
leva ao World. O World, por sua vez, tem uma "porta de saída" que volta ao
Mapa — fechando o ciclo: **Menu inicial → World (minha sede) → Mapa
(vizinhos/região) → volta ao Menu inicial.**

## 4. Os outros stubs do app-drawer (não fazem parte do World)

Continuam como telas avulsas futuras, fora do escopo do World:

| Stub | Vira |
|---|---|
| `eventos` | Motor de eventos narrativos (decisões com consequência) |
| `contratar` | Contratação de equipe **humana** (distinto de Funcionários de IA) |
| `financas` | Simulador de fluxo de caixa (sem transação real) |
| `rh-motivacao` | Saúde/motivação do time — afeta velocidade de entrega |
| `mercado-concorrencia` | Benchmark regional (radar chart) |

Ver detalhamento de cada um em
[`../design/MAPA-DE-TELAS.md`](../design/MAPA-DE-TELAS.md) e no catálogo
`features/roadmap/modules.tsx`.
