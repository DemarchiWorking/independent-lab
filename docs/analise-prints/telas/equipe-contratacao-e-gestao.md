# Equipe — contratação e gestão

> Categorias: `contratacao-equipe` (5 prints) + a ficha individual de
> funcionário. Cobre **como entram pessoas** na empresa e **o que se faz com
> elas** depois.

---

## 1. Contratar — 3 métodos com custo/qualidade crescentes

Modal `Contratar` (ribbon coral), com **carrossel** (`‹ ›`) entre métodos.
Cada método mostra `Número de candidatos : N`.

| Método | Candidatos | Custo | Texto do jogo |
|---|---|---|---|
| **Recomendação de amigos** | 6 | `Grátis` | *"Pedir a recomendação de um amigo é a maneira mais barata de contratar um funcionário novo. Raramente você consegue os melhores talentos, mas, poxa, é quase grátis."* |
| **Caçador de talentos** | 15 | caro (valor não exibido no print) | *"Usar um caçador de talentos é a maneira mais eficiente de encontrar os melhores talentos nas ruas. Também é o mais caro."* |
| *(3º método)* | — | — | **Bloqueado:** `Desbloqueado ao encontrar o 3° Concorrente` |

**Padrão de design notável:** o mesmo eixo custo↔qualidade que existe no
recrutamento real, ensinado sem tutorial. E há **gating por progressão** —
métodos melhores destravam com marcos do jogo.

### Estética do "Caçador de talentos"
Card em **terminal retrô verde monocromático**: `TARGET LOCKED`, mira de
sniper sobre o candidato, caixa `PROFILE` com atributos **ocultos (`XX`)`,
botões `HIRE` / `IGNORE` (em inglês — não traduzidos).

> Os atributos ficam **ocultos** neste método: você paga caro por acesso a
> talento, mas ainda assim decide com informação parcial. Excelente tensão.

## 2. Lista de funcionários (gestão)

Modal `Lista de funcionários`, master-detail:

**Coluna esquerda:** lista com avatar, nome e status
`Demarchi` · `Jaxon` · `Jackson` · `Molly` · `Robyn` — todos marcados `Livre`
(≠ alocados em job).

**Coluna direita — ficha individual:**
```
[avatar grande]  Demarchi
                 CEO
💬 "Eu sinto como se estivesse vivendo em um jogo."   ← humor/4ª parede

Status
Motivação    ▓▓▓▓░░░░░  41/100     ← vermelho
Tecnologia   ▓▓░░░░░░░   7/40      ← roxo
Usabilidade  ▓░░░░░░░░   2/40      ← azul
Estética     ▓░░░░░░░░   3/40      ← laranja
Marketing    ▓░░░░░░░░   2/40      ← verde

Caraterística do funcionário
"Este funcionário não possui características."

[ Férias ]  [ Treinamento ]
```

**Descobertas:**
- O jogador **é** um funcionário (Demarchi, cargo `CEO`) — o fundador entra
  na conta de recursos alocáveis
- `Motivação` tem teto 100; atributos de skill têm teto 40
- Funcionários podem ter **características** especiais (traits) — o CEO não
  tem nenhuma
- Duas ações diretas: `Férias` (repõe motivação) e `Treinamento` (sobe skill)

## 3. Estado `Livre` vs alocado

O status `Livre` na lista, combinado com a tela `Selecionar funcionário` do
marketplace, revela que **funcionários são um recurso finito e disputado**:
alocar alguém num job o torna indisponível para outro. É o gargalo real de
uma consultoria — e o motor da decisão "contrato mais alguém ou recuso o
job?".

## 4. Ponte com Funcionários de IA (nosso produto central)

Esta tela é a **prova conceitual do nosso pivot**: no Startup Panic você
contrata humanos com atributos; no labdatadev-gamehub você contrata
**agentes Claude** — mesma mecânica, mas o funcionário de IA:

| | Funcionário humano (jogo) | Funcionário de IA (nosso) |
|---|---|---|
| Custo | pontual (contratação) + salário | **assinatura mensal** |
| Motivação | cai, precisa de férias | **não se aplica** (sempre 100) |
| Skill | cresce com treinamento | **fixa e alta** no seu eixo |
| Disponibilidade | 1 job por vez | **paralelizável** |

> Essa é a **vantagem narrativa** do nosso produto: o funcionário de IA não
> tira férias, não desmotiva e não fica ocupado. É literalmente melhor no
> jogo — e é verdade no negócio real também.

## 5. Requisitos funcionais derivados

- **RF-EQP-01** — Deve haver ≥2 métodos de aquisição de talento com trade-off
  explícito custo × qualidade × quantidade de candidatos.
- **RF-EQP-02** — Métodos avançados são desbloqueados por marcos de
  progressão, não comprados diretamente.
- **RF-EQP-03** — Cada membro da equipe tem: nome, cargo, atributos com
  valor/teto, motivação, e características opcionais.
- **RF-EQP-04** — Membros têm estado de disponibilidade (`livre` / `alocado`);
  alocação é exclusiva por entrega.
- **RF-EQP-05** — Devem existir ações de manutenção da equipe: repor
  motivação e elevar skill.
- **RF-EQP-06** — Funcionários de IA seguem o mesmo modelo, mas com motivação
  constante e disponibilidade paralela — e isso deve ser **visível** ao
  jogador como diferencial.
