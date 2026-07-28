# Sede, escritório e mobília

> Categorias: `escritorio-e-sede` (2 prints) + `loja-de-moveis` (2 prints) +
> `mundo-escritorio` (1 print).
>
> 🎯 **Estas telas são a base direta do [World](../../world/ARQUITETURA-WORLD.md)**
> — o motor de gamificação que vamos construir.

---

## 1. Mundo/escritório — a cena isométrica livre

O "palco" sem modal: sala isométrica pixel art vista de cima em ângulo.

**Elementos do cenário observados:**
- Paredes verde-água (teal), piso de madeira, tapete rosa
- Mesas com laptop, livros empilhados, bebedouro de água
- Fileira de 4 estações de trabalho com monitores exibindo gráficos
- Armário de arquivos, quadro-negro com equação, mural com post-its
  coloridos, quadros na parede, cortina/persiana de madeira

**Personagens (funcionários):**
- Andam e interagem pela sala
- Têm **balões de humor** flutuando: 😊 sorridente (verde), 😖 rosto com "X"
  (insatisfeito), 😠 bravo (vermelho)
- O humor é **legível à distância**, sem abrir nenhum menu

> **Lição de UX:** o estado emocional da equipe é comunicado no próprio mundo
> — o jogador *vê* que algo está errado antes de investigar. É "dashboard
> ambiental", não relatório.

## 2. Melhorar escritório (upgrade de sede)

Modal `Melhorar escritório` com preview + tabela comparativa:

```
Praça dos Fundadores                    ← nome do próximo escritório
[preview isométrico colorido da planta]  ← mais cômodos, estações, jardim

Detalhes do escritório │ Escritório atual │ Próximo escritório
Funcionários           │        5         │        11
Aluguel                │      $500        │      $1000
Custo                  │       —          │      $8000

              [ Cancelar ]  [ Melhorar ]
```

**Mecânica revelada:**
- Sedes têm **nome próprio** ("Praça dos Fundadores") — dá identidade
- Trade-off explícito: **mais capacidade custa mais fixo por mês**
- Custo único de upgrade ($8000) **+** aumento de despesa recorrente
  ($500→$1000/mês)
- Preview visual do que você vai receber **antes** de pagar

> Isso é exatamente a decisão real de uma PME que cresce: "cabe mais gente,
> mas o aluguel dobra". O jogo não simplifica — e é por isso que ensina.

## 3. Loja de móveis

Modal `Loja de móveis`, grade + detalhe:

**Grade (3×3, itens com selo `NEW`):**
Preços observados: `$1000` · `$12500` · `$20000` · `$40000` · `$40000` ·
`$56000` · `$139000`

Itens vistos: arcade/fliperama, mesa decorativa em X, mesa/piscina azul,
bancada de laboratório com frascos, planta pendurada, parede hexagonal tipo
colmeia, máquina de café.

**Detalhe do item:**
```
[ícone]  Quadro branco
Tecnologia    (0%) +1%     ← roxo
Usabilidade   (0%) +2%     ← azul
Estética      (0%) +1%     ← laranja

"Um passo acima da lousa e giz. Você logo descobrirá que a tinta é mais
fácil de apagar do que a lembrança da noite em que a sua avó voltou do
baile da melhor idade com um chupão no pescoço."

                                        [ Comprar ]
```

**Mecânica:** cada móvel dá **bônus percentual cumulativo** nos três eixos
(ver [`economia-de-atributos.md`](economia-de-atributos.md)). O formato
`(0%) +1%` mostra **bônus atual** e **incremento** — o jogador vê o que já
tem e o que vai ganhar.

**Faixa de preço enorme** ($1.000 a $139.000) sugere progressão longa: móveis
caros são objetivo de médio prazo, não compra casual.

## 4. Como isso vira o World do labdatadev-gamehub

| Startup Panic | World (a construir) | Doc |
|---|---|---|
| Escritório isométrico com funcionários | Sede navegável com avatares (dono + Funcionários de IA) | [ARQUITETURA-WORLD §5.3](../../world/ARQUITETURA-WORLD.md) |
| Balões de humor | Saúde/capacidade da equipe visível no ambiente | — |
| Melhorar escritório (5→11, $500→$1000) | **Comprar ou alugar** sede (o pedido explícito do usuário) | [ARQUITETURA-WORLD §5.1](../../world/ARQUITETURA-WORLD.md) |
| Loja de móveis com bônus T/U/A | Mobiliar a sede com moeda virtual | [ARQUITETURA-WORLD §5.2](../../world/ARQUITETURA-WORLD.md) |
| — | **Conectar com vizinhos da região** (novo, nosso diferencial) | [MAPA-MUNDI](../../world/MAPA-MUNDI-VALE-DO-CAFE.md) |

**Diferença crítica:** no Startup Panic o escritório é **单 jogador e
fictício**. No nosso, a sede é de um **negócio real, num mapa compartilhado
com vizinhos reais** da região de Mendes/Vale do Café. Isso muda tudo: a
sede vira **cartão de visitas**, não só progressão pessoal.

## 5. Requisitos funcionais derivados

- **RF-SED-01** — Todo negócio possui uma sede com nível, capacidade de
  equipe, custo recorrente e dimensões de grid.
- **RF-SED-02** — Evoluir a sede exige custo único **e** eleva o custo
  recorrente; o comparativo atual×próximo deve ser explícito antes de
  confirmar.
- **RF-SED-03** — Deve existir escolha entre **alugar** (custo recorrente
  menor, capacidade menor) e **comprar** (custo único alto, sem mensalidade).
- **RF-SED-04** — Catálogo de mobília com preço e bônus percentual por
  atributo; compra apenas com **moeda virtual**, nunca R$ real.
- **RF-SED-05** — Móveis são posicionáveis no grid da sede, respeitando as
  dimensões do nível contratado.
- **RF-SED-06** — O estado da equipe (motivação/capacidade) deve ser
  perceptível visualmente no ambiente, sem abrir menu.
- **RF-SED-07** — A sede é visitável por qualquer vizinho logado, somente
  leitura, sem opt-in (decisão 2026-07-28) — ver
  `docs/world/VISITAR-VIZINHO.md`. Opt-in fica documentado como evolução
  futura, não construído agora.
