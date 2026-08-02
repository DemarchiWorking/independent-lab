# Mapa Vivo — melhorias gráficas futuras

> Fora do escopo do `GH-MAPA-05` atual (que já está grande — Mapa + Sede,
> 4 níveis de zoom, continuidade visual). Registrado aqui pra não se perder
> e pra não inflar o card em andamento. Nenhum item aqui é suposição sobre
> o que o usuário quer — a seção 1 é minha visão como engenheiro; a seção 2
> é a visão dele, capturada nas palavras dele.

## 1. Sugestões (Claude, como engenheiro sênior olhando o que dá pra evoluir depois)

1. **Trocar emoji por sprite pixel-art próprio no `MapaPin`.** Hoje o
   mockup usa emoji (🥖🩺🏗️) como ícone de segmento — rápido pra prototipar,
   mas emoji renderiza DIFERENTE por sistema operacional/navegador (a
   fonte de emoji do Windows não é a do macOS, não é a do Android) — é uma
   inconsistência visual real, não só estética, que quebra a promessa de
   "nível game enterprise" assim que alguém abrir num SO diferente do que
   foi usado pra desenhar. Um spritesheet pixel-art próprio (mesma família
   visual do `font.pixel`/selos já existentes) resolve isso de vez e fica
   mais coerente com a identidade Startup Panic.
2. **CI de acessibilidade automatizado.** Os 2 bugs de layout que achei
   nesta sessão (pin colidindo com legenda, texto do spotlight vazando pro
   pin vizinho) só apareceram quando eu efetivamente RENDERIZEI e olhei —
   não teria pego só lendo a spec. Vale um teste automatizado (Playwright
   + `axe-core` ou similar) rodando contraste/colisão nas telas reais do
   Mapa como gate de CI, pra esse tipo de achado não depender de alguém
   olhar manualmente toda vez que algo mudar.
3. **Ciclo dia/noite ou variação sutil de luz no terreno.** Reaproveitaria
   o sistema de `eventos-globais` já existente (campanhas com prazo) —
   pouco custo de engenharia, ganho de "mundo vivo" real (o mapa muda mesmo
   sem o usuário interagir).
4. **Skins sazonais de terreno pra eventos/campanhas.** Mesma ideia acima,
   aplicada a datas específicas (época do pitch Sebrae, aniversário da
   plataforma) — de novo, reaproveitando `eventos-globais`, não uma
   arquitetura nova.
5. **Textura de terreno pintada, não bloco de cor sólida.** Os mockups
   desta sessão usam um xadrez de 2 tons sólidos (rápido de prototipar,
   honesto sobre ser um mock). Pra produção, vale gerar (ou encomendar) um
   tileset pixel-art de verdade com variação orgânica — grama com
   textura, não um tabuleiro de damas.
6. **Efeito de partícula/celebração quando um negócio sobe de tier.** Hoje
   a subida de tier muda só a cor do pin — um burst de partícula rápido
   (mesma linguagem do `ChegadaSpotlight`) no momento da subida fecha o
   loop de gamificação diretamente no mapa, não só em toast.
7. **Áudio.** Não foi tratado nesta rodada de UX (nem pedido). Efeitos
   sutis (clique num pin, chegada, presença entrando) são baratos de
   adicionar depois e reforçam "jogo" — registrar como gap consciente, não
   esquecido.
8. **Sprite atlas + batching no Pixi.js.** Puramente técnico, mas visual
   indiretamente: sem isso, muitos pins simultâneos (Bairro/Cidade com
   dezenas de negócios) degradam FPS antes do clustering (`GH-MAPA-05`)
   entrar em ação — vale o arquiteto (Winston) já desenhar pensando nisso.

## 2. Visão do usuário (Antonio, palavras dele, 2026-08-02)

> "Ficar com gráfico do Startup Panic melhorado, para PC e mobile
> responsivo, multiplayer via navegador."

Leitura: isto **não contradiz** a direção já tomada em `DESIGN.md` — o
Mapa Vivo já herda a marca Startup Panic × Laboratório Demarchi como
canon (não é uma reformulação de identidade visual do zero) e já
especifica desktop+mobile como prioridade igual, com multiplayer via
navegador (Supabase Realtime Presence, já validado ponta a ponta nesta
mesma sessão). Vale ler isto como **confirmação e ênfase de longo prazo**
sobre o rumo já em curso, não uma mudança de direção: continuar
evoluindo o visual Startup Panic (não abandoná-lo por uma estética
genérica), sempre com os dois dispositivos como prioridade igual, sempre
com o multiplayer acessível puramente pelo navegador (sem app nativo,
sem plugin) — os três já são compromissos ativos de `DESIGN.md`/
`EXPERIENCE.md`, agora com a confirmação explícita de que é isso mesmo
que o usuário quer manter conforme o produto evolui.
