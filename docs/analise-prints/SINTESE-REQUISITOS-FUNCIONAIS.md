# Síntese CTO — do Startup Panic aos requisitos do labdatadev-gamehub

> Documento de síntese da análise de 56 prints. Explica **o que cada etapa e
> cada componente significa**, e converte isso em base de requisitos
> funcionais para o nosso produto.
>
> **Público:** este documento existe para dar inteligência aos próximos
> prompts de implementação. Se você é um agente de IA construindo uma feature
> do gamehub, leia isto antes de escrever código.

---

## 1. Por que o Startup Panic funciona (e o que isso ensina)

Depois de destrinchar 56 telas, três princípios explicam o jogo inteiro:

### Princípio 1 — Tudo alimenta um único sistema
Não existe mecânica decorativa. Comprar um quadro branco de $1.000 melhora
Usabilidade em +2%, que melhora a nota da próxima feature, que melhora a
participação de mercado, que traz usuários, que traz dinheiro. **Um loop
fechado, sem becos sem saída.**
→ Ver [`telas/economia-de-atributos.md`](telas/economia-de-atributos.md)

### Princípio 2 — Toda decisão tem trade-off explícito
O jogo **nunca** esconde o custo. `Revisão ($285)`, `Pagar alguém para
escrever um artigo ($1000)`, `Funcionários 5 → 11 / Aluguel $500 → $1000`.
O jogador sempre sabe exatamente o que está trocando.

### Princípio 3 — O estado é legível em 1 segundo
HUD fixo nos 4 cantos, balões de humor sobre os funcionários, cor consistente
por atributo. Você entende que "estou perdendo dinheiro, minha equipe está
infeliz e meu rival tem 96% do mercado" sem abrir um único menu.

---

## 2. O que traduzimos, o que rejeitamos

Nem tudo do Startup Panic serve para o nosso contexto. Decisões deliberadas:

| Mecânica do jogo | Decisão | Por quê |
|---|---|---|
| Árvore de features do produto | ✅ **Adotar** (adaptada) | Vira trilha de maturidade de TI do parceiro |
| Economia de atributos T/U/A | ✅ **Adotar** (renomeada) | É o que dá profundidade real à gamificação |
| Marketplace de gigs | ✅ **Adotar** | Já são serviços de TI reais no jogo |
| Contratar equipe com atributos | ✅ **Adotar** (como Funcionários de IA) | É o nosso produto central |
| Sede: comprar/alugar/mobiliar | ✅ **Adotar** (o World) | Pedido explícito, e cria pertencimento |
| Conquistas com progresso | ✅ **Adotar** | Reforço positivo barato de implementar |
| Perks permanentes da empresa | ✅ **Adotar** (futuro) | Progressão de longo prazo |
| Eventos narrativos com escolha | 🟡 **Adaptar com cuidado** | Devem refletir eventos de negócio reais, não ficção |
| **Dívida, falência, prazo regressivo** | ❌ **Rejeitar** | Nosso usuário é empresário real com pressão real. Tensão deve vir de oportunidade, não de ameaça |
| Empréstimo bancário operável | ❌ **Rejeitar** | Nunca operar dinheiro real; só simulação educativa |
| Humor debochado | 🟡 **Calibrar** | Leveza sim, deboche não — o negócio dele é sério |
| Concorrente esmagando o jogador (3% vs 96%) | ❌ **Rejeitar** | Desmotivador para PME real. Benchmark sim, humilhação não |

> **Regra editorial derivada:** *o gamehub é um jogo sobre **construir**, não
> sobre **sobreviver**.* Toda mecânica que introduzir medo de perder deve ser
> questionada antes de entrar.

---

## 3. As 6 etapas do jogo — o que cada uma significa

Mapeamento das telas para as **etapas do ciclo de negócio** que elas
representam. Esta é a espinha dorsal dos requisitos.

### Etapa 1 — Existir no mundo (identidade + endereço)
**No jogo:** o escritório isométrico é sua sede; você tem um nome de empresa
(Demarchi Labs) e um lugar.
**No nosso:** cadastro em 10 perguntas → tenant + lote no mapa regional.
**Status:** ✅ implementado.
**Significado:** antes de qualquer mecânica, o jogador precisa de um "eu sou
alguém, em algum lugar". É a base do pertencimento.

### Etapa 2 — Ter capacidade (equipe + atributos)
**No jogo:** contratar funcionários com Tecnologia/Usabilidade/Estética/
Marketing/Motivação; treinar; dar férias.
**No nosso:** contratar Funcionários de IA (4 cargos), cada um elevando um
eixo.
**Status:** ✅ contratação implementada · 🔴 atributos não existem.
**Significado:** capacidade é o que **limita** o que você pode aceitar. Sem
isso, não há decisão real — tudo vira clicar em "sim".

### Etapa 3 — Executar entregas (marketplace)
**No jogo:** aceitar gig → alocar funcionário → aguardar prazo → receber.
**No nosso:** aceitar serviço de TI real do catálogo.
**Status:** 🟡 aceitar existe, mas em 1 clique — falta alocar quem executa.
**Significado:** é onde capacidade vira **resultado**. A alocação é o que
torna a equipe um recurso escasso e a decisão interessante.

### Etapa 4 — Evoluir o produto/negócio (árvore)
**No jogo:** desbloquear features na árvore hexagonal, cada uma com requisito
de atributo e custo próprio.
**No nosso:** trilha de maturidade de TI (site → automação → BI → infra).
**Status:** 🟡 árvore existe, sem requisitos nem custos variáveis.
**Significado:** dá **direção de longo prazo**. O jogador sempre vê o próximo
patamar, mesmo que ainda não alcance.

### Etapa 5 — Melhorar o ambiente (sede + mobília)
**No jogo:** upgrade de escritório (capacidade × custo fixo) + móveis com
bônus.
**No nosso:** o **World** — comprar/alugar sede, mobiliar, avatares.
**Status:** 🔴 não construído (documentado em [`../world/`](../world/ARQUITETURA-WORLD.md)).
**Significado:** é o **investimento em si mesmo**. Converte progresso
abstrato (XP) em algo visível e pessoal.

### Etapa 6 — Comparar-se (mercado/concorrência)
**No jogo:** participação de mercado + tabela de notas por feature vs rival.
**No nosso:** benchmark regional (Vale do Café), com cuidado editorial.
**Status:** 🔴 stub apenas.
**Significado:** dá **contexto**. Sem comparação, o jogador não sabe se 7.1 é
bom. Mas comparação mal calibrada desmotiva — daí o cuidado.

---

## 4. Gap analysis — o que falta no nosso produto hoje

Ordenado por impacto estrutural:

| # | Gap | Impacto | Esforço | Onde |
|---|---|---|---|---|
| 1 | **Economia de atributos não existe** | 🔴 Crítico — sem isso a gamificação é unidimensional (só XP) | Alto | novo: `lib/atributos.ts` + colunas no `negocios` |
| 2 | **Alocação de equipe em entregas** | 🔴 Alto — é o que torna equipe um recurso escasso | Médio | `features/marketplace` + `equipe-ia` |
| 3 | **World (sede/mobília/avatares)** | 🟠 Alto — pertencimento e o pedido explícito | Alto | novo: `features/world` |
| 4 | **Requisitos e custos na árvore** | 🟠 Médio | Baixo | `features/parcerias` |
| 5 | **Mapa com zoom por camadas** | 🟠 Médio — hoje `lerMapaView()` carrega o mundo inteiro | Médio | `features/mapa` |
| 6 | **Persistência de árvore/parcerias por tenant** | 🟡 Médio — hoje é `useState` local | Baixo | `lib/db` + adapters |
| 7 | **Guarda anti-farm no marketplace** | 🟡 Baixo | Baixo | `features/gamificacao/actions.ts` |
| 8 | Conquistas | 🟡 Baixo | Médio | novo |
| 9 | Perks da empresa (2ª árvore) | 🟢 Futuro | Médio | novo |
| 10 | Eventos narrativos | 🟢 Futuro | Médio | stub existente |

**Recomendação de sequência:** 1 → 2 → 4 → 6/7 → 3 → 5. O item 1 destrava
conceitualmente 2, 4 e 6 — fazer primeiro evita retrabalho.

---

## 5. Catálogo de requisitos funcionais (consolidado)

Requisitos derivados print a print, agrupados por módulo. IDs estáveis para
referência em issues/PRs futuros.

### HUD e moldura → [`telas/hud-moldura.md`](telas/hud-moldura.md)
`RF-HUD-01` a `RF-HUD-05`

### Economia de atributos → [`telas/economia-de-atributos.md`](telas/economia-de-atributos.md)
`RF-ATR-01` a `RF-ATR-07` — **os mais importantes do documento**

### Árvore de maturidade → [`telas/arvore-recursos-produto.md`](telas/arvore-recursos-produto.md)
`RF-ARV-01` a `RF-ARV-07`

### Marketplace → [`telas/marketplace-servicos.md`](telas/marketplace-servicos.md)
`RF-MKT-01` a `RF-MKT-06`

### Equipe → [`telas/equipe-contratacao-e-gestao.md`](telas/equipe-contratacao-e-gestao.md)
`RF-EQP-01` a `RF-EQP-06`

### Sede e mobília (World) → [`telas/sede-escritorio-e-mobilia.md`](telas/sede-escritorio-e-mobilia.md)
`RF-SED-01` a `RF-SED-07`

### Eventos, finanças, conquistas, perks → [`telas/eventos-financas-e-progressao.md`](telas/eventos-financas-e-progressao.md)
`RF-EVT-01` a `RF-EVT-03` · `RF-FIN-01` · `RF-CNQ-01/02` · `RF-PRK-01`

---

## 6. Padrões de UI extraídos (o "kit" a reusar)

Componentes que aparecem em praticamente toda tela do jogo — vários já
implementados no nosso design system:

| Padrão | Descrição | Nosso componente |
|---|---|---|
| **Ribbon coral** | Faixa de título em ângulo no topo-esquerdo do modal | ✅ `RibbonPanel` |
| **CTA laranja full-width** | Ação primária, com custo no rótulo | ✅ `ActionButton` |
| **Master-detail** | Lista à esquerda (item ativo em azul com "bico") + ficha à direita | ✅ usado em 3 telas |
| **Cartão de HUD** | Ícone + label pequeno + valor grande | ✅ `StatCard` |
| **Faixa de alerta** | Aviso condicional sob o HUD | ✅ `AlertBanner` |
| **Barra de atributo** | Label + barra colorida + `atual/máximo` | 🔴 não existe |
| **Tabela comparativa** | Atual × Próximo, ou funcionários × atributos | 🔴 não existe |
| **Carrossel `‹ ›`** | Alternar entre opções (bancos, métodos de contratação) | 🔴 não existe |
| **Badge de estado** | `NEW`, `Livre`, chevron de expansão | 🟡 parcial |
| **Preview visual antes de comprar** | Imagem do que você vai receber | 🔴 não existe |

---

## 7. Como usar este documento nos próximos prompts

**Se você vai implementar uma feature:**
1. Leia a tela correspondente em [`telas/`](telas/) — tem o texto literal e a
   mecânica original
2. Leia os `RF-*` daquela seção
3. Cheque o gap analysis (§4) para saber se há pré-requisito
4. Siga os padrões de UI (§6) — quase tudo já existe no design system

**Se você vai propor algo novo:**
Passe pelo filtro da §2 — *"isso é sobre construir ou sobre sobreviver?"* — e
pela regra de ouro do projeto: moeda virtual 🪙 e R$ real nunca se misturam.

**Se precisar do detalhe literal de um print específico:**
`_raw/batch-N.md` tem a transcrição completa, print a print.
