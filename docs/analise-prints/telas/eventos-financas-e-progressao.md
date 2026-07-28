# Eventos, finanças, conquistas e perks

> Agrupa 4 categorias menores mas estruturalmente importantes:
> `evento-narrativo` (3 prints) · `financas` (2) · `outros/conquistas` (1) ·
> a **segunda árvore** do jogo (perks da empresa).

---

## 1. Eventos narrativos

Modal com ribbon coral, **mockup visual** + texto + **escolhas com
consequência**.

### Evento A — "Avaliação de blog"
Mockup de um blog fictício rosa (`❤My Lifestyle My Blog❤`), post
*"I'm so disappointed with this! AAAARRGHH!! (Honest Review)"*, ★☆☆☆☆.

> *"Um blogueiro escreveu uma avaliação tão ruim do seu aplic[ativo]… Você
> vai responder?"*

Opções: `Não fazer nada` · `Responder`

### Evento B — "A avaliação ruim de João"
Mockup de site tech (`YOUR WEB — WEB DEV/SOFTWARE`), badge `REVIEW`,
`:( The UI is so eww x_x`.

> *"Vários blogueiros postaram uma avaliação ruim do seu prod[uto]… mais
> fácil aprender computação quântica do qu[e]… de afiliado para a startup do
> **João Avelar**. Seu número de us[uários]…"*

Opções: `Pagar alguém para escrever um artigo ($1000)` · `Nada`

**Padrões extraídos:**
- Toda escolha tem **custo explícito no rótulo do botão** quando há custo
- Sempre existe a opção de **não fazer nada** (que também é uma decisão)
- Eventos **nomeiam concorrentes** ("João Avelar", "Allberg Industries") —
  personificam a competição
- O mockup visual faz o evento parecer real, não um texto de sistema

## 2. Finanças — empréstimo bancário

Modal `Empréstimo bancário`, com **carrossel de credores** (`‹ ›`):

```
[ícone de prédio "OMG"]   FdP                    ← nome em vermelho
                          Empréstimo      $20K
                          Juros mensais   $200
                          Pagamento       $21K

"Financeira do Povo. Um dos bancos mais ricos da cidade."

                                    [ Pagar empréstimo ]
```

**Pressão financeira observada ao longo dos prints:**
- Dinheiro: `$-3571` → `$-2571` → `$-6444` (dívida crescendo)
- Faixa de alerta: `Você tem 61 dias` → `56 dias` → `54 dias` (regressiva)
- Saldo mensal: `-3740 $` → `-3872 $` → `-3875 $` (piorando)

> **⚠️ Decisão de produto para o nosso caso:** o Startup Panic usa dívida e
> falência como motor de tensão. **Não devemos replicar isso.** Nosso usuário
> é um empresário real cujo negócio *já* tem pressão financeira de verdade —
> simular dívida seria estressante e potencialmente ofensivo. Nossa tensão
> deve vir de **oportunidade** (o que você pode conquistar), não de
> **ameaça** (o que você pode perder). Já registrado em
> `docs/PRODUTO-IA-FUNCIONARIOS.md`: finanças no nosso app é **simulação
> educativa, sem operação financeira real**.

## 3. Conquistas (achievements)

Modal `Conquistas`, com seções `Em andamento` (expandida) e `Concluído`
(colapsada).

| Recompensa | Nome | Condição | Progresso |
|---|---|---|---|
| `$500` | `Level Up! 1` | Treine 10 vezes | `30%` |
| `$500` | `Mão-de-vaca 1` | Tenha 20 mil em dinheiro sem ter nenhum empréstimo | `-32%` |

**Estrutura:** ícone colorido + tag de recompensa + nome numerado (sugere
séries: "Level Up! 2", "3"…) + condição textual + **percentual de progresso**
+ barra visual.

Note o `-32%` — progresso **negativo** quando o jogador está longe da meta
(está com empréstimo ativo). Detalhe honesto e informativo.

## 4. A SEGUNDA árvore — perks da empresa (nós em losango)

⚠️ **Distinta da árvore de features hexagonal.** Tela cheia, fundo escuro
tipo blueprint, **3 colunas temáticas**:

```
  Escritório        Funcionários      Desenvolvimento
      ◆                  ◆                   ◆
     ╱ ╲                ╱ ╲                 ╱ ╲
    ◆   ◆              ◆   ◆               ◆   ◆
```

**Painel `Detalhe`:**
```
Empresa verde
"É só um chavão que repetimos para que os funcionários economizem
eletricidade e reduzam os custos operacionais."

Informações detalhadas
Aluguel de escritório    -5%
Custo                     2
Ponto atual : 8

[ Bônus atual ]  [ Obter caraterística ]
```

**Mecânica:** moeda separada (**pontos**, não dinheiro) gastos em perks
permanentes que dão bônus passivos (`-5%` no aluguel). Nós coloridos =
disponíveis, cinza = bloqueados.

> **Duas árvores, dois propósitos:** a hexagonal constrói **o produto** (o
> que você vende); a de losangos melhora **a empresa** (como você opera).
> Nosso gamehub hoje só tem o equivalente da primeira
> (`HexTreeScreen`) — a segunda é uma oportunidade clara.

## 5. Requisitos funcionais derivados

- **RF-EVT-01** — Eventos apresentam contexto visual, narrativa curta e ≥2
  escolhas, com custo explícito no rótulo quando houver.
- **RF-EVT-02** — "Não fazer nada" deve ser sempre uma opção válida e ter
  consequência própria.
- **RF-EVT-03** — Concorrentes/atores externos devem ser nomeados e
  recorrentes (criam continuidade narrativa).
- **RF-FIN-01** — O módulo financeiro é **informativo e educativo**; o
  sistema **nunca** executa operação financeira real nem simula dívida
  punitiva ao usuário.
- **RF-CNQ-01** — Conquistas têm nome, condição textual, recompensa e
  progresso percentual visível, agrupadas em "em andamento" / "concluídas".
- **RF-CNQ-02** — Conquistas em série (numeradas) devem escalar em
  dificuldade e recompensa.
- **RF-PRK-01** — Deve existir uma progressão de **perks da empresa**,
  separada da progressão de produto, com moeda própria (pontos) e bônus
  passivos permanentes.
