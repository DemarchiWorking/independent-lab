# Análise Visual & UX — Startup Panic (referência-mãe)

> Transcrição da análise das 57 capturas em `C:\Users\demarchi\Pictures\Startup`.
> Objetivo: destilar a linguagem visual dos **simuladores de negócio anos 2000**
> (pixel isométrico) para reaplicar no `labdatadev-gamehub`, agora ligada a
> **negócios regionais reais e parcerias**.

---

## 1. Estilo de arte

- **Pixel art isométrico** (projeção ~2:1). Cena = escritório visto de cima em
  ângulo, com paredes, piso de madeira, móveis, plantas, quadros, computadores.
- **Avatares pixelados** dos funcionários, com **balões de emoção** (😊 feliz,
  😖 estressado, 💲) flutuando — feedback de humor/produtividade da equipe.
- Dois registros tipográficos: **(1) sans arredondado limpo** na UI moderna e
  **(2) fonte pixel/CRT** em elementos retrô (telas "PROFILE", blogs, "YOUR WEB").
- Sensação: **carismática, colorida, nostálgica**, leve — nunca corporativa fria.

## 2. HUD (moldura fixa da tela)

| Região | Conteúdo |
|---|---|
| **Topo-esquerda** | 3 cartões brancos arredondados: 💵 **Dinheiro** ($valor), 🙂 **Usuários** (nº), 📅 **Data** (`Y5 M1 W` + barra de progresso verde) + botão **pause** `‖` |
| **Topo-direita** | Dropdown **"Objetivo"** (cinza arredondado) |
| **Lateral esquerda** | Toolbar vertical de ícones (botões quadrados arredondados): 💼 negócio · 👔 RH/equipe · 🤖 produto · 📁 portfólio · 🔧 dev/config |
| **Baixo-esquerda** | **"Participação de mercado"** — avatares dos concorrentes + % (ex.: 3% vs 96%) |
| **Baixo-direita** | **"Saldo mensal"** — barra escura + valor (negativo em destaque) |
| **Baixo-centro** | Botão circular **app-drawer** (grade 2×2), semitransparente |
| **Sob o HUD** | **Banner de alerta** vermelho-escuro: ⚠️ "Você tem 54 dias para pagar sua dívida." |

**Princípio:** a moldura nunca cobre o mundo; informação vital sempre visível nos
4 cantos; o centro é o "palco" jogável.

## 3. Modais / diálogos (padrão recorrente)

- Painel branco arredondado, sombra suave sobre o mundo escurecido (overlay).
- **Ribbon de título coral/vermelho** cortada em ângulo no canto superior-esquerdo
  (ex.: "Avaliação de blog", "Prestação de serviço", "Contratar", "Recurso",
  "Melhorar escritório").
- **Botão X vermelho** (topo-direita), levemente pixelado.
- **CTAs laranja** full-width, texto escuro ("Responder", "Aceitar trabalho",
  "Melhorar", "Revisão ($285)"). **Secundário cinza** ("Cancelar", "Nada").
- Escolhas com **trade-off explícito** e custo no próprio botão (`$1000`, `$285`).

## 4. Telas-chave mapeadas

### 4.1 Evento narrativo (ex.: "Avaliação de blog")
Print de um blog/review fictício + texto do evento + 2 opções (agir pagando vs
não fazer nada). Ensina: **decisões com consequência de dinheiro/reputação.**

### 4.2 Árvore de recursos / features (hex grid) ⭐
- Plano isométrico claro e quadriculado coberto de **hexágonos**.
- **Código de cor por categoria:** 🟩 verde · 🟦 azul (mídia) · 🟨 amarelo
  (analytics/growth) · 🟪 roxo (vídeo/ads) · 🟥 vermelho (bloqueado/necessário) ·
  ⬜ branco com **nota** (ex.: 7.8, 9.4, 10) = pesquisável com rating.
- Ícones pixel dentro de cada hex; hex selecionado com contorno; badges de
  **chevron vermelho** indicam ramos expansíveis. Rodapé: **"Pontuação geral".**
- Painel lateral **"Recurso"** com abas **Informação / Status**, título vermelho,
  "Atributos recomendados: N", descrição e CTA laranja "Revisão ($valor)".

### 4.3 Prestação de serviço (marketplace de jobs) ⭐⭐
- Coluna esquerda: cards de job (`Recompensa: $valor` + título); selecionado em
  azul com seta apontando o detalhe.
- Detalhe: **avatar pixel do cliente**, título vermelho, ⭐ rating, `Recompensa /
  Pontuação mín. / Tempo est.`, descrição, "Funcionário recomendado: N", e 2 CTAs
  laranja: **"Revisão"** / **"Aceitar trabalho"**.
- **Insight de ouro:** os jobs são **serviços de TI reais**: *"Converter tabelas
  do Excel em tabelas do SQL Server"*, *"Designer de UX/UI"*, *"Banner em
  Photoshop"*, *"Logo"*. → É literalmente o portfólio labdatadev gamificado.

### 4.4 Contratar (Caçador de talentos)
Card de candidato em estética **CRT verde-hacker** ("TARGET LOCKED", "PROFILE",
atributos, HIRE/IGNORE), carrossel (‹ ›), "Número de candidatos: 15".

### 4.5 Melhorar escritório
"Praça dos Fundadores": preview isométrico do próximo escritório + tabela
comparativa **Atual × Próximo** (Funcionários, Aluguel, Custo) + Cancelar/Melhorar.

## 5. Paleta extraída (aproximada)

| Uso | Hex aprox. |
|---|---|
| Laranja CTA (primário) | `#F5A623` |
| Coral ribbon / títulos | `#EF5350` |
| Alerta (banner) | `#8B2E2E` |
| Azul rótulos | `#2FA8C7` |
| Verde dinheiro/progresso | `#27AE60` |
| Paredes (teal) | `#4E9E93` |
| Piso (madeira) | `#C79B6E` |
| Painel branco | `#FFFFFF` |
| Fundo grid (árvore) | `#EDF0F3` |
| Hex categorias | 🟩`#8BC34A` 🟦`#5B9BD5` 🟨`#F4C430` 🟪`#B15FC4` 🟥`#E86A6A` |

> Como a paleta labdatadev usa `#f59e0b` (=laranja do jogo), `#00d4c8`,
> `#22c55e` e `#080e1d`, a ponte de marca é natural — ver
> [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).

## 6. O que herdar × o que adaptar

| Herdar do Startup Panic | Adaptar para labdatadev-gamehub |
|---|---|
| HUD 4-cantos, ribbon coral, CTA laranja | Cores para tokens da marca |
| Árvore de hex (progressão) | Vira **árvore de parceiros/serviços regionais** |
| "Prestação de serviço" | Vira **marketplace de serviços de TI reais** |
| Trade-offs com custo explícito | Custos podem ser **moeda virtual OU R$ real** (separados) |
| Emoção dos avatares | Reputação/relacionamento real com parceiros |
| Pixel isométrico social (Habbo) | Salas = **empresas/imobiliárias da região** |
