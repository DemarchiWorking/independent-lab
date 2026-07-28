# A economia de atributos (T/U/A) — o sistema que amarra o jogo inteiro

> **Este é o achado mais importante de toda a análise dos 56 prints.**
> Não é uma tela — é o **sistema invisível** que conecta praticamente todas
> as telas do Startup Panic. Entender isto é entender por que o jogo
> funciona, e é o que separa "um app com pontinhos" de "um jogo de verdade".

---

## 1. A tríade central: T / U / A

Três atributos aparecem repetidamente, sempre com as mesmas cores:

| Sigla | Atributo | Cor observada |
|---|---|---|
| **T** | **Tecnologia** | roxo |
| **U** | **Usabilidade** | azul |
| **A** | **Estética** (Aparência) | laranja |

Nos funcionários, a lista se estende com mais dois:
**Marketing** (verde) e **Motivação** (vermelho).

## 2. Como os atributos circulam pelo jogo (o loop econômico)

```
        ┌──────────────────────────────────────────────┐
        │            LOJA DE MÓVEIS                     │
        │  Quadro branco: T+1% · U+2% · A+1%            │
        └───────────────────┬──────────────────────────┘
                            │ mobília eleva atributos do ESCRITÓRIO
                            ▼
        ┌──────────────────────────────────────────────┐
        │            FUNCIONÁRIOS                       │
        │  Demarchi (CEO): T7 U2 A3 Mkt2 · Motivação 41 │
        │  ↑ Treinamento   ↑ Férias (motivação)         │
        └───────────────────┬──────────────────────────┘
                            │ equipe executa
                            ▼
        ┌──────────────────────────────────────────────┐
        │     FEATURES DO PRODUTO (árvore hexagonal)    │
        │  Página inicial: T10 U4.5 A6.3 → Nota 5.9     │
        │  Registro:       T10 U4.6 A10  → Nota 6.8     │
        └───────────────────┬──────────────────────────┘
                            │ soma das notas
                            ▼
        ┌──────────────────────────────────────────────┐
        │  PONTUAÇÃO GERAL: 7.1  →  PARTICIPAÇÃO: 3%    │
        │         vs Allberg Industries: 96%            │
        └──────────────────────────────────────────────┘
                            │
                            ▼
                    USUÁRIOS · DINHEIRO
```

**Toda ação do jogador entra em algum ponto desse ciclo.** Não existe
mecânica decorativa — comprar um quadro branco de $1000 realmente melhora,
por uma fração, a nota da sua próxima feature, que melhora sua participação
de mercado.

## 3. Evidências diretas dos prints

| Print | Evidência |
|---|---|
| Loja de móveis | `Quadro branco — Tecnologia (0%) +1% · Usabilidade (0%) +2% · Estética (0%) +1%` |
| Lista de funcionários | `Demarchi / CEO — Motivação 41/100 · Tecnologia 7/40 · Usabilidade 2/40 · Estética 3/40 · Marketing 2/40` |
| Selecionar funcionário (job) | Tabela com colunas `Tecnologia \| Usabilidade \| Estética \| Marketing \| Motivação \| ET` + linha `Total` |
| Marketplace | `Pontuação mín.: 6` · `Atributos recomendados: 8` |
| Árvore de features | `Atributos recomendados: 2` … até `11` |
| Participação de mercado | `Recurso (10) \| T \| U \| A \| Pontuação` → `Página inicial 10 / 4.5 / 6.3 / 5.9` |

## 4. A fórmula implícita

Da tabela de benchmark é possível inferir a mecânica de nota:

```
Página inicial:  T=10   U=4.5  A=6.3   →  Pontuação 5.9
Registro:        T=10   U=4.6  A=10    →  Pontuação 6.8
Anúncios texto:  T=7.1  U=6.4  A=10    →  Pontuação 8.0
```

A nota final **não é média simples** — cada feature tem **peso diferente por
atributo**. "Página inicial" tem T=10 mas nota só 5.9, porque (como o próprio
texto do jogo diz) *"Ela é a cara da sua startup, logo, vamos precisar de
habilidades estéticas"* — ou seja, **Estética pesa mais** nessa feature.

> **Insight de design:** o jogo ensina, sem tutorial, que *"cada entrega
> exige uma competência diferente"*. Um dev excelente (T alto) entrega uma
> home feia (A baixo) e o resultado é medíocre. Isso é uma lição de negócio
> real, embutida na matemática.

## 5. Tradução para o labdatadev-gamehub

Nosso equivalente natural dos três eixos, no contexto de PME regional:

| Startup Panic | labdatadev-gamehub (proposta) | Por quê |
|---|---|---|
| **Tecnologia** | **Tecnologia** — automação, dados, infra | Mesmo conceito, é o core da labdatadev |
| **Usabilidade** | **Processo** — o quanto a operação é organizada/repetível | O gargalo real do ICP ("tudo é manual/planilha") |
| **Estética** | **Presença** — marca, site, presença digital | O gargalo #2 do ICP ("imagem fraca") |
| Marketing | **Aquisição** — capacidade de gerar leads | Já mapeado no onboarding |
| Motivação | **Capacidade** — saúde/disponibilidade da equipe | Liga com o módulo `rh-motivacao` |

**Estes 5 eixos deveriam ser a espinha dorsal da gamificação madura do
gamehub** — hoje temos só XP e degrau, que são unidimensionais.

### Como isso se conecta ao que já existe

| Já implementado | Como se pluga na economia de atributos |
|---|---|
| Onboarding (10 perguntas) | Define o **valor inicial** dos 5 eixos do negócio |
| Escada de valor (5 degraus) | Vira consequência: degrau alto exige eixos altos |
| Funcionários de IA | Cada cargo **eleva um eixo específico** (Documentador→Processo, Social Media→Presença, Comercial→Aquisição) |
| Serviços de TI (marketplace) | Cada job **exige um mínimo** num eixo e o **eleva** ao concluir |
| Árvore de parcerias | Nós exigem eixos mínimos para desbloquear |
| Mobília (World, a construir) | Bônus percentuais pequenos nos eixos |

## 6. Requisitos funcionais derivados

- **RF-ATR-01** — O negócio do jogador possui 5 atributos numéricos
  (Tecnologia, Processo, Presença, Aquisição, Capacidade), com valor atual e
  teto (ex.: `7/40`).
- **RF-ATR-02** — Toda entrega/serviço define um **requisito mínimo** e um
  **ganho** por atributo; o sistema compara antes de permitir aceitar.
- **RF-ATR-03** — A nota de uma entrega é calculada com **pesos diferentes
  por atributo**, conforme a natureza da entrega (não média simples).
- **RF-ATR-04** — Funcionários (humanos e de IA) contribuem com seus próprios
  atributos ao serem alocados a uma entrega; o sistema soma e compara com o
  requisito.
- **RF-ATR-05** — Itens de ambiente (mobília) concedem bônus percentuais
  cumulativos, com efeito pequeno e visível.
- **RF-ATR-06** — Deve existir uma **pontuação geral consolidada** derivada
  dos atributos, comparável com outros negócios da região.
- **RF-ATR-07** — A UI deve usar **cor consistente por atributo** em todas as
  telas (o Startup Panic faz isso religiosamente: roxo/azul/laranja/verde/vermelho).
