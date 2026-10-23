# Ecossistema Laboratório Demarchi — mapa dos projetos e o "computador do escritório"

> **O que é este diretório.** Um estudo — **não é cópia de código** — dos
> outros projetos do fundador (Antonio Demarchi / Laboratório Demarchi) para
> entender o **objetivo, as telas e os requisitos funcionais** de cada um, e
> planejar como eles entram dentro do gamehub como **aplicativos acessíveis
> pelo computador do escritório**. Cada projeto tem um arquivo próprio nesta
> pasta com detalhamento por tela.
>
> Fonte: leitura estática dos repositórios em `C:\Users\demarchi\Desktop\claude-code`
> e `C:\Users\demarchi\Desktop\Projetos`, e do site publicado
> `portfoliodemarchi.com.br`. Nenhum arquivo foi copiado para cá.

---

## 1. A visão: o computador do escritório como "sistema operacional" do negócio

Hoje o jogo ensina maturidade digital por gamificação. O próximo salto é
**transformar a sede em um espaço de trabalho real**: depois de o jogador
**comprar o computador** (móvel do catálogo da sede — `features/sede/`), um
clique nele abre uma **área de trabalho** com ícones. Cada ícone é um dos
projetos reais do ecossistema — o portfólio, o Siga Pregão, o marketplace de
serviços, etc. — funcionando como **aplicativos internos**.

```
Sede (World isométrico)
   └── Computador (móvel comprado)  ──clique──▶  Desktop do escritório
                                                   ├── 🌐 Portfólio Demarchi        (vitrine de serviços de TI)
                                                   ├── 🏛️ Siga Pregão              (licitações públicas B2G)
                                                   ├── 🔧 ServGo                    (marketplace de serviços regionais)
                                                   ├── 🚗 Autovale                  (marketplace automotivo regional)
                                                   ├── 🎖️ Alpha-3                   (liderança / alta performance)
                                                   ├── 📄 Consultoria (Entregáveis) (diagnóstico + documentos reais)
                                                   └── 🎨 Estúdio de Marca          (design system + posts)
```

**Por que isto importa para o pitch (Sebrae / investidor-anjo):** mostra que o
jogo não é uma demo isolada — é a **embalagem de um portfólio real de produtos
e serviços** que já existem. O empresário que entra no jogo descobre, dentro
da ficção, os serviços que o Laboratório Demarchi vende de verdade.

---

## 2. Modelo de integração — três níveis (do mais barato ao mais rico)

Cada app pode entrar no jogo por um destes três modos. A escolha é **por
projeto** e pode evoluir com o tempo.

| Nível | Como funciona | Quando usar | Custo |
|---|---|---|---|
| **N1 — Atalho externo** | Ícone abre o site publicado em nova aba (`target=_blank`) | Sites já no ar e estáveis (Portfólio, Siga Pregão landing) | Trivial |
| **N2 — Janela embutida** | Ícone abre uma "janela" dentro do jogo com o site num `<iframe>` sandbox, ou um resumo + botão "abrir" | Sites que aceitam embed e ganham com estar "dentro" do escritório | Baixo |
| **N3 — Mini-app nativo** | A tela é **reimplementada** como feature do gamehub (`features/<app>/`), lendo dados mockados ou do próprio Supabase, com o design-system do jogo | Fluxos que viram parte da jogabilidade (ex.: gerar o diagnóstico, publicar um anúncio) | Alto — vira produto |

> ⚠️ **Regra de fronteira (do AGENTS.md):** um mini-app nativo (N3) vive em
> `src/features/<app>/`, nunca em `lib/`. Regra de negócio server-side é a
> fonte de verdade. Nada de embutir `<iframe>` de terceiro sem `sandbox` +
> CSP revista. Moeda virtual (🪙) do jogo **nunca** se mistura com R$ real de
> nenhum destes produtos.

### Gating sugerido (quando cada ícone aparece)

O computador e seus apps devem respeitar a progressão — é o que dá sentido de
conquista e ensina na ordem certa:

- **Computador comprado** → desktop abre, mas só com 1–2 apps "starter".
- **Degrau / nível** libera apps mais avançados (ex.: Siga Pregão B2G só num
  degrau que represente "empresa pronta para vender ao governo").
- Cada app libertado dispara um **evento de gamificação** (`features/gamificacao/engine.ts`)
  — XP + toast "Novo app instalado: …".

---

## 3. Catálogo — todos os projetos de uma vez

| # | Projeto | O que é | Stack | Telas | Modo sugerido | Doc |
|---|---|---|---|---|---|---|
| 1 | **Portfólio Demarchi** | Vitrine profissional de serviços de TI (backend .NET, AWS, DevOps, segurança) | Next.js (publicado) | 5 + contato | N1→N2 | [01](01-portfolio-demarchi.md) |
| 2 | **Siga Pregão / B2G** | Ecossistema de licitações públicas: SaaS + robô de coleta + marca própria→governo | Next.js · Flask · Go · Python | landing + prototipo + robô | N2→N3 | [02](02-siga-pregao-e-licitacoes.md) |
| 3 | **ServGo** | Marketplace de serviços regionais (prestador ↔ cliente) | Expo / React Native (SDK 57) | 12 telas | N3 | [03](03-servgo-marketplace-servicos.md) |
| 4 | **Autovale** | Marketplace automotivo do Vale do Café (comprar/anunciar carros) | Next.js 15 | 4 telas | N3 | [04](04-autovale-marketplace-automotivo.md) |
| 5 | **Alpha-3** | Landing premium de liderança/alta performance (Cel. Demarchi) + auth | Next.js 15 · R3F · i18n | 5 telas | N1→N2 | [05](05-alpha-3-lideranca.md) |
| 6 | **Consultoria / Entregáveis** | Diagnóstico + 8 documentos executivos reais para empresas | docx/xlsx + gerador Node | 8 entregáveis | N3 | [06](06-consultoria-e-entregaveis.md) |
| 7 | **Estúdio de Marca** | Design system + identidade visual + gerador de carrosséis/posts | HTML/Tailwind + tokens | gerador | N2 | (catálogo abaixo) |

### Ativos de apoio (não viram app sozinhos, alimentam os outros)

- **`labdatadev-context` / `MEI-EMPRESA`** — a base de conhecimento da empresa
  (contexto estratégico, modelo financeiro, ICP, biblioteca de prompts). É a
  **fonte de verdade de negócio** que informa o conteúdo dos apps acima — ex.:
  o ICP real que já está no cadastro do jogo (`GH-EQP: nichos do ICP`).
- **`design-system-visual-identity`** — tokens, componentes, acessibilidade,
  governança de marca + `carousel-generator.html`. Base do "Estúdio de Marca".
- **`postagem-midias`** — carrosséis/posts prontos (Instagram/LinkedIn). Vira
  conteúdo do app de marketing / entregável do Funcionário de IA Social Media.

---

## 4. Como ler os arquivos desta pasta

Cada arquivo `0N-*.md` segue a mesma estrutura, pensada para virar backlog:

1. **Objetivo** — o problema de negócio que o projeto resolve.
2. **Stack & estado** — tecnologia e maturidade (protótipo? no ar?).
3. **Telas** — uma seção por tela, com **objetivo** e **requisitos
   funcionais** (`RF-NN`) daquela tela.
4. **Papel no jogo** — como vira app no computador do escritório, em que nível
   de integração (N1/N2/N3) e com que gating.
5. **Requisitos de integração** — o que é preciso para plugar no gamehub sem
   violar as regras do `AGENTS.md`.

> Estes documentos são **especificação e estudo**, não implementação. Nenhum
> deles autoriza copiar código de outro repositório para o gamehub — quando um
> app for para N3, ele é **reescrito** com o design-system e as regras deste
> projeto.
