# Responsividade — guia de layout e verificação

| | |
|---|---|
| **Alvos suportados** | Full HD (1920×1080), HD (1366×768), tablet (768×1024 e 1024×768), celular (375×812) |
| **Abordagem** | Mobile-first com **dois modos de layout** no shell do jogo |
| **Código** | `features/shell/GameShell.tsx`, `components/ui/{HudBar,Nav,LateralMenu,RibbonPanel,StatCard}.tsx`, `features/historia/CapituloGate.tsx` |

## 1. Os dois modos do shell

A tela do jogo era uma **cena absoluta de proporção fixa** (`aspect-[20/11]`).
Funciona numa tela larga; num celular vira HUD sobreposto e conteúdo cortado.
Em vez de "encolher a cena", o shell tem dois modos:

| | **Coluna** (`< 1024 px`) | **Cena** (`≥ 1024 px`) |
|---|---|---|
| Para | Celular, tablet em pé | Tablet deitado, HD, Full HD |
| Moldura | `min-h: 100dvh − 4,5rem`, flui na página | altura `clamp(520px, 100dvh − 6rem, 900px)` — ligada à janela, não à proporção |
| HUD | No fluxo; 3 cartões em grade + Objetivo largura total | Sobreposto no topo da cena |
| Menu lateral | Faixa de ícones com rolagem horizontal, acima do conteúdo | Coluna vertical à esquerda |
| Módulos / Celular / Inventário | Faixa de botões com rótulo, no fluxo | Botões flutuantes nos cantos |
| Navegação | Barra **fixa** no rodapé, rolável; rótulos somem `< 640 px` (ícone + `aria-label`) | Barra inferior sobreposta |
| Modais (`RibbonPanel`) | `fixed`, tela inteira, conteúdo rolável (`max-h` em `dvh`) | `absolute` dentro da cena |
| Largura máxima | — | 1152 px; **1500 px** a partir de 1700 px (Full HD) |

Resultado medido: no HD (1366×768) e no Full HD a cena cabe **sem rolagem de
página**; no tablet em pé e no celular a página rola e nada fica sobreposto.

### Decisões que valem lembrar

- **Breakpoint em `lg` (1024 px), não `md`.** Em 768 px a cena de HUD + menu
  lateral + navegação não cabe; tablet em pé usa o modo coluna, com cartões
  maiores.
- **Altura por `dvh`, não `vh`.** No celular a barra do navegador muda a altura
  útil; `vh` cortava o rodapé.
- **A carta de história é overlay**, não um bloco acima do jogo. Inline ela
  empurrava a cena para fora da primeira tela. Agora rola sozinha quando é
  maior que a janela (`CapituloGate`).
- **Atalhos flutuantes não existem no modo coluna.** Cobriam botões de ação do
  conteúdo (ex.: "Desbloquear").
- **Hub com rolagem interna no modo cena** (`lg:overflow-y-auto` com
  `mt-auto`/`mb-auto` nos extremos): centraliza quando cabe e rola quando não
  cabe (1024×768), sem cortar o topo.

## 2. Convenções para novas telas

1. **Não use altura fixa em px** para conteúdo. Use `lg:h-full` se a tela
   precisa preencher o palco; no modo coluna a altura deve ser automática.
2. **Largura:** nunca `w-[NNNpx]` sem `max-w-full`. Grades: `grid-cols-1` por
   padrão e `sm:`/`md:`/`lg:` para ampliar.
3. **Alvo de toque ≥ 40 px** (`h-10 w-10` nos ícones do menu lateral).
4. **Texto nunca depende só de cor** (rótulo + ícone), e o contraste do texto
   sobre fundo claro usa `text-ink` — os tons de marca ficam em bordas e fundos.
5. **Modais** sempre por `RibbonPanel` (já cuida de `fixed`/`dvh`/rolagem).
6. **Overflow horizontal é bug.** O teste manual abaixo detecta.

## 3. Documentos baixáveis

O Canvas (`render-canvas.ts`) tem os próprios degraus, independentes do shell:
`≥ 1100 px` grade clássica de 10 colunas · `≥ 640 px` 2 colunas · abaixo,
1 coluna; impressão em A4 paisagem com o desenho numa página. Detalhe em
[`CANVAS-ENTERPRISE.md`](CANVAS-ENTERPRISE.md).

## 4. Matriz de verificação

Verificado em 23/10/2026 (Next dev + emulação de viewport):

| Tela | 375 | 768 | 1024 | 1366 | 1920 |
|---|:-:|:-:|:-:|:-:|:-:|
| Hub (jornada, lição, salas) | ✔ | ✔ | ✔ ¹ | ✔ | ✔ |
| Equipe de IA | ✔ | — | — | — | — |
| Contratos | ✔ | — | — | — | — |
| Sede · Mapa · Serviços · Parcerias | ✔ | — | — | — | — |
| World (`/world`) | ✔ | — | — | — | — |
| Painel · Entrar · Cadastro | ✔ | — | — | — | — |
| Canvas baixável | ✔ | ✔ | — | ✔ | ✔ |

¹ Com rolagem interna no palco (esperado: o conteúdo não cabe em 672 px úteis).
"—" = não coberto neste passe. Ver *Limitações*.

### Como reproduzir

```bash
npm run dev
```

Abra o DevTools, ative a emulação de dispositivo e percorra 375×812, 768×1024,
1024×768, 1366×768 e 1920×1080. Em cada tela, no console:

```js
({ sw: document.documentElement.scrollWidth, iw: innerWidth })   // sw deve ser <= iw
```

e, para achar o culpado de um overflow:

```js
[...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1)
```

## 5. Limitações conhecidas

- **Matriz incompleta.** Telas marcadas com "—" não foram vistas em todos os
  tamanhos; o shell é comum a todas, então o risco é de conteúdo interno
  (ex.: o mapa isométrico em 1024 px). Corrigir quando aparecer.
- **Animação de entrada** (Framer Motion) usa `requestAnimationFrame`: com o
  painel do navegador oculto ela congela e a tela parece vazia. É artefato do
  ambiente de teste, não do layout (ver `AGENTS.md`, "Canvas Pixi em navegador
  headless").
- **Sem teste visual automatizado.** Hoje a verificação de layout é manual. O
  caminho recomendado é Playwright com *screenshots* nos 5 tamanhos acima (a
  skill `playwright-cli` está disponível) — registrado como `GH-QA-01`.
- **Celular na horizontal** (812×375) usa o modo coluna (largura < 1024 px) com
  pouca altura útil: navegação e faixa de atalhos ocupam boa parte da tela.
  Funcional, não otimizado.
