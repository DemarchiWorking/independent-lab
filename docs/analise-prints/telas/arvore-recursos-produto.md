# Árvore de recursos do PRODUTO (hexágonos)

> Categoria: `arvore-de-recursos`. **A tela mais fotografada de todas — 32
> dos 46 prints analisados.** Isso não é acaso: é a mecânica central do
> Startup Panic, onde o jogador constrói o produto da sua startup feature
> por feature.
>
> ⚠️ **Não confundir** com a *outra* árvore do jogo (perks da empresa, nós em
> losango) — ver [`arvore-perks-empresa.md`](arvore-perks-empresa.md).

---

## 1. Posicionamento padrão

Tela **cheia** (a sidebar de 5 ícones some), fundo cinza-claro quadriculado
tipo papel milimetrado / blueprint:

| Região | Conteúdo |
|---|---|
| Topo-esquerda | HUD normal (3 cartões), com hexágonos passando por trás |
| Topo-direita | `✕` vermelho (fechar a árvore) |
| Centro | **Malha de hexágonos** conectados, rolável/navegável em todas as direções |
| Direita | Painel `Recurso` (ribbon vermelha) com abas `Informação` / `Status` |
| Baixo-esquerda | `Pontuação geral` (dropdown) |
| Baixo-centro | Botão `⊞` app-drawer + ícone de alerta triangular |

## 2. Anatomia de um nó (hexágono)

Cada hexágono = **uma feature do produto**. Codificação visual:

| Sinal | Significado |
|---|---|
| **Cor de fundo** | Categoria da feature (ver §3) |
| **Ícone pixel** | Identidade da feature (casa, monitor, balão de chat, vídeo…) |
| **Número na base** | **Nota de qualidade daquela feature** (ex.: `5.9`, `9.4`, `10`) |
| **Borda grossa/escura** | Nó atualmente selecionado |
| **Badge vermelho `⌄⌄`** | Nó tem ramificação expansível / novidade |

**Notas observadas:** `2.6` · `4.8` · `5.9` · `6.8` · `7.3` · `7.8` · `8` ·
`8.5` · `9.4` · `10` — escala de 0 a 10, uma casa decimal.

## 3. Categorias por cor (taxonomia extraída)

| Cor | Categoria inferida | Exemplos de nós observados |
|---|---|---|
| ⬜ **Branco** | Features-base do produto (já desenvolvidas/disponíveis) | Página inicial, Registro, Página de perfil, Adicionar amigo |
| 🟥 **Vermelho** | Bloqueadas / requisitos não atendidos | (cluster grande à esquerda: microfone, telefone, vídeo, chat) |
| 🟨 **Amarelo** | Growth / notificações / mobile | Sino, celular, compartilhar, Check-In |
| 🟪 **Roxo/magenta** | Vídeo e anúncios em vídeo | Anúncios em vídeo, vídeo+estrela |
| 🟩 **Verde** | (categoria vista só parcialmente no topo) | — |

## 4. Catálogo de features observado (32 prints → ~30 nós distintos)

Agrupados por natureza — **esta lista é ouro para o nosso catálogo de
serviços**:

| Grupo | Nós observados |
|---|---|
| **Fundação do site** | Página inicial · Registro · Página de perfil · Tema da página de perfil |
| **Social** | Adicionar amigo · Recomendações de amigos · Linha do tempo · Publicar conteúdo · Comentário · Reação · Criar grupo · Criar evento · Canal · Check-In |
| **Conteúdo/mídia** | Enviar imagem · Pesquisa |
| **Monetização — anúncios** | Anúncios em texto · Anúncios com imagens · Anúncios em vídeo · Anúncios direcionados |
| **Monetização — comércio** | Loja de figurinhas · Loja de temas · Mercado de itens · Anunciar loja · Pacote promocional · Pacote mensal |
| **Profissional/B2B** | Perfil profissional · Página da empresa · Lista de vagas |
| **Dados** | Análise |

## 5. Painel lateral `Recurso` — estrutura fixa

```
┌─ Recurso ─────────────────┐   ← ribbon vermelha
│ [Informação] [Status]     │   ← abas (Informação vem ativa)
│ <Nome da feature>         │   ← título em VERMELHO
│ Atributos recomendados: N │   ← em AZUL (N = 2, 3, 4, 8, 11…)
│                           │
│ <descrição com humor>     │   ← texto rolável
│                           │
│ [ Revisão ($285) ]        │   ← CTA laranja, preço VARIÁVEL por nó
└───────────────────────────┘
```

**Preços de revisão observados:** `$285` · `$293` · `$347` · `$1245` —
**o custo varia por nó**, provavelmente proporcional à complexidade ou
profundidade na árvore.

**"Atributos recomendados"** observados: `2` · `3` · `4` · `8` · `11` —
é o **requisito de skill** da equipe para executar bem aquela feature.
Quanto mais fundo na árvore, maior a exigência.

### Variação importante do CTA (descoberta na análise)
- Nós **brancos** (base): botão `Revisão ($valor)`
- Nós **amarelos/roxos** (avançados): botão mostra **só o `$valor`**
- Nó roxo mais avançado (`Anúncios em vídeo`, 11 atributos): **nenhum botão**
  — feature fora de alcance no estágio atual da partida

Isso revela um **estado de gating em 3 níveis**: disponível → comprável →
inalcançável.

## 6. Tom de voz (importante para o nosso produto)

As descrições são **deliberadamente cômicas e auto-irônicas**:

> *"Anunciantes pagam por espaço em sites ou apps para promover seus
> produtos, principalmente com banners ao lado de fotos de gatinhos. Eles não
> são uma gracinha?"*

> *"Os usuários vão poder se registrar fornecendo nome, e-mail, senha, comida
> favorita, opinião sobre dubstep, locais de marcas de nascença etc."*

> *"Sim, 'amigo'. Você não devolveu a minha caneta favorita, e eu não sei
> mais como considerar você."*

**Lição para o labdatadev-gamehub:** o humor é o que faz o jogador *ler* uma
descrição técnica. Nosso público (empresário regional, PME) responde melhor a
**clareza + leveza** do que a jargão. Vale calibrar: humor sim, mas sem
deboche — o negócio dele é real.

## 7. Como isso já foi traduzido no nosso projeto

Implementado parcialmente em `src/features/parcerias/HexTreeScreen.tsx` +
`components/ui/HexTile.tsx`:

| Startup Panic | labdatadev-gamehub (hoje) | Gap |
|---|---|---|
| Feature do produto | Serviço de TI / trilha de maturidade | ✅ conceito traduzido |
| Nota 0–10 por nó | `score` (fit/prioridade) | ✅ |
| Cor por categoria | `cat.social/media/growth/ads/locked` | ✅ |
| `Atributos recomendados: N` | *(não implementado)* | 🔴 requisito de skill da equipe |
| Preço variável por nó | *(não implementado)* | 🔴 custo de desbloqueio |
| Gating em 3 níveis | Só 2 (livre/bloqueado) | 🟡 falta "comprável mas caro" |
| Abas `Informação`/`Status` | Só informação | 🟡 |
| Malha navegável (pan/zoom) | Grid estático `flex-wrap` | 🔴 |

## 8. Requisitos funcionais derivados

- **RF-ARV-01** — Cada nó da árvore representa um serviço/capacidade, com
  nota de fit (0–10), categoria (cor), ícone e estado.
- **RF-ARV-02** — Estados de nó: `disponível` · `desbloqueável (com custo)` ·
  `bloqueado por requisito`. A UI deve distinguir os três.
- **RF-ARV-03** — Cada nó exibe um **requisito de capacidade** ("atributos
  recomendados") comparado com a capacidade atual da equipe do jogador.
- **RF-ARV-04** — O custo de desbloqueio é **por nó**, não fixo.
- **RF-ARV-05** — A árvore deve ser navegável (pan/zoom) quando exceder a
  viewport — não pode virar uma lista rolável simples.
- **RF-ARV-06** — Descrições devem ter tom acessível e humano; nunca
  jargão puro.
- **RF-ARV-07** — Deve haver um indicador agregado (`Pontuação geral`) que
  resuma a maturidade total do produto/negócio do jogador.
