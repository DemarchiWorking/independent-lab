# Marketplace de serviços ("Prestação de serviço")

> Categoria: `marketplace-servicos` — 5 prints. É a mecânica de **entrada de
> caixa** do jogo: freelas/gigs que a startup executa para faturar enquanto
> constrói o próprio produto.
>
> 🎯 **É a tela mais diretamente aplicável ao labdatadev** — os jobs do jogo
> são literalmente serviços de TI reais.

---

## 1. Posicionamento padrão (master-detail)

Modal branco com ribbon coral `Prestação de serviço`, duas colunas:

| Região | Conteúdo |
|---|---|
| **Coluna esquerda** | Lista rolável de jobs. Cada card: `Recompensa: $valor` (negrito) + título do projeto. Item selecionado em **azul com "bico"/seta** apontando para o detalhe |
| **Coluna direita** | Ficha do job selecionado |
| Rodapé do detalhe | 2 CTAs: `Revisão` (secundário) · `Aceitar trabalho` (laranja, primário) |

### Ficha do job (coluna direita)
```
[avatar do cliente]  <Título do trabalho>        ← título em vermelho-coral
★☆☆☆☆                                            ← rating (1 de 5)
Recompensa : $1880        Pontuação mín. : 6
Atributos                 Tempo est. : 12 dias
<descrição técnica do pedido>
Funcionário recomendado: 1
[ Revisão ]  [ Aceitar trabalho ]
```

## 2. Jobs observados (transcrição literal)

| Recompensa | Título |
|---|---|
| `$3830` | Designer de UX/UI para empresa de consultoria em crescimento |
| `$3322` | Designer de UX/UI para empresa de consultoria em crescimento |
| `$3162` | Logo para colchão |
| `$2963` | Designer de UX/UI para empresa de consultoria em crescimento |
| `$2911` | Banner de produtos em Photoshop |
| `$1979` | Banner de produtos em Photoshop |
| `$1906` | Design de camiseta fácil |
| `$1880` | **Converter tabelas da pasta de trabalho do Excel em tabelas do SQL Server** |
| `$1620` | Logo para colchão |

**Descrição completa do job de $1880 (exemplo de tom técnico real):**
> *"Preciso de um aplicativo Windows que possa abrir uma pasta de trabalho do
> Excel de minha escolha e iterar sistematicamente por todas as tabelas do
> Excel, criar tabelas SQL correspondentes e preenchê-las com os dados das
> tabelas do Excel."*

> **Observação de produto:** esses jobs parecem retirados de plataformas
> reais de freelance. É exatamente o catálogo de serviços da labdatadev —
> migração de dados, UX/UI, design gráfico, automação.

## 3. Fluxo em 2 etapas (descoberta importante)

Aceitar um job **não é um clique só** — abre um segundo modal empilhado:

### Etapa 2: `Selecionar funcionário`
```
┌ Selecionar funcionário ──────────────────────────────┐
│ <descrição do job repetida>                          │
│ ┌────────────┬───────────┬────────┐                  │
│ │Atributos   │Tempo est. │Custo   │                  │
│ │recomendados│           │        │                  │
│ │    8       │  12 dias  │ $1880  │                  │
│ └────────────┴───────────┴────────┘                  │
│  (verde)      (laranja)   (vermelho)                 │
│                                                       │
│ Selecionar funcionário                               │
│         │ Tec │ Usa │ Est │ Mkt │ Mot │ ET           │
│ Demarchi│  7  │  2  │  3  │  2  │ 41  │              │
│ Jaxon   │  7  │  1  │  4  │  0  │ 37  │ ●●           │
│ Jackson │  5  │  6  │  6  │  6  │ 38  │              │
│ Total   │  0  │  0  │  0  │  0  │     │  ← dinâmico  │
│                                                       │
│ Funcionário selecionado = 0 / 1        [ Continue ]  │
└──────────────────────────────────────────────────────┘
```

- Linha `Total` **soma dinamicamente** os funcionários marcados
- Comparar `Total` com `Atributos recomendados: 8` é a decisão do jogador
- Limite de alocação explícito: `0 / 1`
- Coluna `ET` mostra ícones de **características especiais** do funcionário
- Ícone de humor ao lado do nome (😠 vermelho = insatisfeito, 🙂 verde = ok)

## 4. Como já foi traduzido no nosso projeto

`src/features/marketplace/MarketplaceScreen.tsx` + `data.ts`:

| Startup Panic | labdatadev-gamehub (hoje) | Gap |
|---|---|---|
| Lista + detalhe master-detail | ✅ implementado | — |
| `Recompensa` | ✅ `reward` (em R$) | — |
| `Pontuação mín.` | ✅ `requisitos: Partial<Atributos>` (GH-ATR-03) | — valida de verdade: servidor e RPC recusam se não atendido |
| `Tempo est.` | ✅ `days` | — |
| Rating ★ | ✅ `rating` | — |
| Cliente/parceiro | ✅ `partner` | — |
| **Etapa 2: alocar funcionário** | 🔴 **não existe** | Aceitar é 1 clique só |
| Ícone de humor do funcionário | 🔴 não existe | — |
| Guarda contra re-aceitar o mesmo job | 🔴 **não existe** (gap conhecido) | Ver `ESTADO-DO-PROJETO.md` |

## 5. Requisitos funcionais derivados

- **RF-MKT-01** — Lista de oportunidades com recompensa, categoria, prazo e
  requisito mínimo visíveis antes de abrir o detalhe.
- **RF-MKT-02** — Aceitar uma entrega exige **alocar explicitamente quem vai
  executá-la** (humano ou Funcionário de IA), respeitando um limite.
- **RF-MKT-03** — O sistema soma os atributos dos alocados e compara com o
  requisito, mostrando o resultado **antes** de confirmar.
- **RF-MKT-04** — Um recurso alocado fica **ocupado** pelo tempo estimado
  (não pode ser alocado a duas entregas simultâneas).
- **RF-MKT-05** — A mesma entrega não pode ser aceita duas vezes (guarda
  server-side, mesmo padrão já aplicado em Funcionários de IA).
- **RF-MKT-06** — Concluir a entrega gera recompensa financeira **e** eleva
  atributos do negócio.
