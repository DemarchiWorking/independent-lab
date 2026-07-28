# Startup Panic — Análise de prints — Lote 5

Transcrição literal de 10 screenshots do jogo mobile "Startup Panic" (versão PT-BR),
para servir de referência de design/produto ao projeto **labdatadev-gamehub**.

Contexto comum do lote: empresa do jogador = **Demarchi Labs**, Dinheiro **$-6444**,
Usuários **1040**, Data **Y5 M1 W**, Saldo mensal **-3872 $**, participação de mercado
3% (jogador) vs 96% (concorrente Allberg Industries), alerta de dívida ativo.

---

### Screenshot_20260601_000925_Startup Panic.jpg — marketplace-servicos

**Elementos por região** (a moldura do jogo é fixa nos 4 cantos + centro):
- Topo-esquerda: barra de HUD com três cartões brancos lado a lado — "Dinheiro $-6444" (ícone de maço de notas verdes), "Usuários 1040" (ícone de avatar com óculos escuros), "Data Y5 M1 W" (ícone de calendário azul, com barra de progresso da semana em verde) e, à direita, botão de pausa (duas barras verticais cinza). Logo abaixo, faixa vermelha escura de alerta com ícone de triângulo "!" — texto parcialmente coberto pelo modal: "Você tem…" (nos outros prints do lote lê-se "Você tem 57 dias para pagar sua dívida.").
- Topo-direita: caixa cinza dropdown "Objetivo" com seta ▼ à direita. Abaixo dela, botão quadrado vermelho com "X" (fechar modal).
- Lateral-esquerda: coluna vertical de 5 botões quadrados cinza com ícones pixel art — maleta/pasta marrom, funcionário de gravata (RH/contratação), prédio/torre (escritório), pasta/arquivo laranja (documentos), chave-de-fenda + chave inglesa (ferramentas/configuração).
- Centro / palco principal: modal branco grande "Prestação de serviço" (ribbon vermelha no canto superior esquerdo do modal). Painel dividido em duas colunas: à esquerda, lista rolável de trabalhos disponíveis (com barra de rolagem vertical cinza); à direita, painel de detalhe do trabalho selecionado com avatar do cliente, título, recompensa, pontuação mínima, tempo estimado, descrição e funcionário recomendado.
- Baixo-esquerda: painel branco "Participação de mercado" (parcialmente coberto pelo modal) com dois retratos de personagem e percentuais — o primeiro "3%".
- Baixo-direita: barra escura de "Saldo mensal" (rótulo coberto) mostrando "-3872 $". No canto extremo, botão circular laranja com ícone de câmera de vídeo (gravação/anúncio recompensado).
- Baixo-centro: botão circular semitransparente com quatro quadrados arredondados (menu/grid de navegação — provável overlay do sistema Android ou botão de menu do jogo).

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem… (restante coberto pelo modal)
Prestação de serviço
Recompensa: $2911 / Banner de produtos em Photoshop
Recompensa: $1979 / Banner de produtos em Photoshop
Recompensa: $3830 / Designer de UX/UI para empresa de consultoria em crescimento
Recompensa: $1620 / Logo para colchão
Recompensa: $3162 / Logo para colchão
Banner de produtos em Photoshop
Recompensa : $1979
Atributos
Pontuação mín. : 5
Tempo est. : 13 dias
Procurando alguém para criar um cabeçalho/banner para a minha página. Tem que ser chamativo, divertido e cheio de cores brilhantes.
Funcionário recomendado: 1
Revisão
Aceitar trabalho
Participação de m… (coberto) / 3%
-3872 $

**Elementos visuais/estruturais:**
Pixel art isométrico como cenário de fundo (escritório com paredes verde-água, quadros coloridos, arquivo cinza, móveis de madeira), desfocado/escurecido por overlay cinza enquanto o modal está aberto. Modal branco de cantos retos com ribbon vermelho-coral ("Prestação de serviço") saindo do canto superior esquerdo em forma de bandeira/fita. Item selecionado na lista em azul claro (#5aaede aprox.) com "seta" apontando para o painel de detalhe — padrão master/detail. Títulos em vermelho-coral, rótulos em cinza-escuro, valores em negrito preto. Avaliação do cliente por estrelas amarelas (2 de 5 preenchidas). Botões de ação em amarelo-alaranjado (#f0a83c aprox.) com texto marrom-escuro, dois lado a lado ocupando a largura do painel direito. Ícones de HUD em pixel art colorido sobre cartões brancos. Hierarquia: HUD fixo > ribbon do modal > título do item > métricas > descrição > CTA.

**Funcionalidade / propósito desta tela:**
Marketplace de trabalhos freelance/prestação de serviço. O jogador navega numa lista de contratos disponíveis (cada um com recompensa em $, dificuldade por estrelas, pontuação mínima de atributo exigida, tempo estimado em dias e número de funcionários recomendado) e decide qual aceitar para gerar caixa. É a principal alavanca de receita de curto prazo quando o saldo está negativo. O botão "Revisão" (presente só neste item) sugere que este trabalho já foi entregue/está em fase de revisão pelo cliente.

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela. Comparado ao print seguinte (000928), aqui o item selecionado é o 2º da lista — "Banner de produtos em Photoshop / $1979" (2 estrelas, pontuação mín. 5, 13 dias) — e o painel de detalhe exibe DOIS botões ("Revisão" e "Aceitar trabalho").

---

### Screenshot_20260601_000928_Startup Panic.jpg — marketplace-servicos

**Elementos por região:**
- Topo-esquerda: mesma HUD — "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", botão de pausa. Faixa vermelha de alerta de dívida parcialmente coberta ("Você tem…").
- Topo-direita: dropdown "Objetivo" com seta ▼; botão vermelho "X" de fechar.
- Lateral-esquerda: mesma coluna de 5 botões-ícone (maleta, funcionário, prédio, pasta laranja, ferramentas).
- Centro / palco principal: modal "Prestação de serviço" — lista à esquerda com o 3º item selecionado; painel de detalhe à direita com avatar loiro masculino.
- Baixo-esquerda: painel "Participação de m…" com "3%" visível.
- Baixo-direita: barra escura com "-3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem… (coberto)
Prestação de serviço
Recompensa: $2911 / Banner de produtos em Photoshop
Recompensa: $1979 / Banner de produtos em Photoshop
Recompensa: $3830 / Designer de UX/UI para empresa de consultoria em crescimento
Recompensa: $1620 / Logo para colchão
Recompensa: $3162 / Logo para colchão
Designer de UX/UI para empresa de consultoria em crescimento
Recompensa : $3830
Atributos
Pontuação mín. : 7
Tempo est. : 19 dias
À procura de um designer experiente para aplicativos da web, desktop e móveis. Nossos clientes buscam implementar soluções em uma variedade de setores, de assistência médica a marketing.
Funcionário recomendado: 1
Aceitar trabalho
Participação de m… (coberto) / 3%
-3872 $

**Elementos visuais/estruturais:**
Idêntico ao print anterior em estrutura: modal branco + ribbon coral, master/detail com item ativo em azul e "bico"/seta apontando para o detalhe. Avaliação do cliente: 3 estrelas amarelas preenchidas de 5. Um único botão amarelo "Aceitar trabalho" ocupando toda a largura inferior do painel direito. Descrição em texto cinza-escuro com quebra em 3 linhas. Título longo do trabalho quebra em duas linhas em vermelho-coral.

**Funcionalidade / propósito desta tela:**
Mesma mecânica de marketplace de serviços — comparação entre ofertas. Mostra o trade-off central: trabalho de maior recompensa ($3830) exige pontuação mínima maior (7 vs 5) e prazo mais longo (19 vs 13 dias). O jogador equilibra caixa imediato vs capacidade da equipe.

**O que muda em relação às outras imagens deste lote:**
Mesma tela do print 000925, com outro item selecionado (3º da lista: "Designer de UX/UI…", $3830). Mudanças exatas: seleção azul migrou do 2º para o 3º item; avatar mudou de mulher morena para homem loiro; estrelas passaram de 2 para 3; recompensa $1979 → $3830; pontuação mín. 5 → 7; tempo est. 13 dias → 19 dias; descrição trocada; rodapé passou de DOIS botões ("Revisão" + "Aceitar trabalho") para UM único botão largo ("Aceitar trabalho") — ou seja, o botão "Revisão" só aparece em trabalhos já em andamento/entregues.

---

### Screenshot_20260601_000936_Startup Panic.jpg — contratacao-equipe

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", botão pausa. Faixa de alerta vermelha totalmente legível: "Você tem 57 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X" de fechar (posicionado sobre o modal, mais ao centro-direita).
- Lateral-esquerda: coluna de 5 botões-ícone (maleta marrom, funcionário de gravata, prédio, pasta laranja, ferramentas).
- Centro / palco principal: modal branco estreito e vertical "Contratar" (ribbon coral). Dentro: cabeçalho do método de recrutamento + contador de candidatos, ilustração em estilo cartoon/anime, texto explicativo e botão de preço. Setas "<" e ">" nas laterais da ilustração para alternar entre métodos (carrossel).
- Baixo-esquerda: painel branco "Participação de mercado" com dois retratos e "3%" e "96%".
- Baixo-direita: barra escura "Saldo mensal" com "-3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 57 dias para pagar sua dívida.
Contratar
Recomendação de amigos
Número de candidatos : 6
Pedir a recomendação de um amigo é a maneira mais barata de contratar um funcionário novo. Raramente você consegue os melhores talentos, mas, poxa, é quase grátis.
Grátis
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Cenário isométrico do escritório totalmente visível ao fundo (não escurecido): paredes verde-água, piso de madeira, mesas azuis com monitores, cadeiras, arquivo cinza, quadro de avisos com post-its coloridos, relógio de parede, planta/lixeira, um personagem com balão de emoji sorridente amarelo. Modal branco vertical com ribbon coral "Contratar". Título do método em vermelho-coral à esquerda, contador de candidatos em preto à direita (mesma linha). Ilustração retangular em arte cartoon colorida (três personagens conversando, balão com polegar para cima azul) — estilo distinto do pixel art do jogo, é uma "card art" de método. Setas de navegação em blocos cinza claro nas bordas laterais da imagem. Texto explicativo centralizado, cinza-escuro. Botão CTA amarelo-alaranjado alinhado à direita do rodapé com o custo escrito nele ("Grátis").

**Funcionalidade / propósito desta tela:**
Escolha do canal de recrutamento. O jogador percorre um carrossel de métodos de contratação, cada um com um custo e um número de candidatos gerados (quantidade e qualidade do pool). Aqui: "Recomendação de amigos" — custo zero, apenas 6 candidatos, qualidade baixa. É a decisão de "quanto investir em aquisição de talento".

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela (recrutamento). É o 1º slide do carrossel de métodos.

---

### Screenshot_20260601_000940_Startup Panic.jpg — contratacao-equipe

**Elementos por região:**
- Topo-esquerda: HUD idêntica ("Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", pausa) + faixa vermelha "Você tem 57 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X".
- Lateral-esquerda: mesma coluna de 5 botões-ícone.
- Centro / palco principal: modal "Contratar" — método "Recrutamento on-line", 8 candidatos, ilustração de mãos segurando tablet com anúncio de vaga, texto explicativo, botão de preço "$1000". Setas "<" e ">" laterais.
- Baixo-esquerda: painel "Participação de mercado" com "3%" e "96%".
- Baixo-direita: "Saldo mensal / -3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 57 dias para pagar sua dívida.
Contratar
Recrutamento on-line
Número de candidatos : 8
(dentro da ilustração:) JOIN US NOW / WE ARE HIRING / SETTING / POST A JOB
As técnicas de recrutamento on-line se tornaram o método de contratação mais usado pelos recrutadores. Você receberá mais candidatos do que por recomendação de amigos, mas também custa mais.
$1000
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Mesmo layout de modal vertical com ribbon coral. Ilustração cartoon: fundo azul-turquesa com padrão de meio-tom, tablet amarelo segurado por duas mãos, botões "SETTING" (azul) e "POST A JOB" (verde) na interface fictícia, texto vermelho "JOIN US NOW / WE ARE HIRING". Texto explicativo em 4 linhas centralizadas. CTA amarelo alinhado à direita mostrando o preço em vez de um verbo — o próprio preço é o rótulo do botão.

**Funcionalidade / propósito desta tela:**
Segundo método do carrossel de recrutamento. Custa $1000 e gera 8 candidatos — mais que a recomendação gratuita. Explicita a curva custo→quantidade/qualidade de candidatos.

**O que muda em relação à imagem anterior (000936):**
Mesma tela, slide seguinte do carrossel. Mudanças: título "Recomendação de amigos" → "Recrutamento on-line"; candidatos 6 → 8; ilustração trocada (amigos conversando → tablet com anúncio de vaga); texto descritivo trocado; botão "Grátis" → "$1000". HUD e cenário de fundo inalterados (mesmo dia, 57 dias de dívida).

---

### Screenshot_20260601_000943_Startup Panic.jpg — contratacao-equipe

**Elementos por região:**
- Topo-esquerda: HUD idêntica + faixa "Você tem 57 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X".
- Lateral-esquerda: mesma coluna de 5 botões-ícone.
- Centro / palco principal: modal "Contratar" — método "Recrutamento por revista", 10 candidatos, ilustração de caneca de café e jornal/revista com anúncio "WE NEED YOU", texto explicativo e, no lugar do botão de compra, um texto de bloqueio esmaecido. Setas "<" e ">" laterais.
- Baixo-esquerda: painel "Participação de mercado" com "3%" e "96%".
- Baixo-direita: "Saldo mensal / -3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 57 dias para pagar sua dívida.
Contratar
Recrutamento por revista
Número de candidatos : 10
(dentro da ilustração:) NEW(S) (parcialmente legível, topo do jornal) / WE NEED YOU
Publicar um anúncio de recrutamento em uma revista ainda é uma maneira eficiente de encontrar e contratar um candidato. Como ela visa um público mais específico e maduro, você obterá um resultado melhor do que um recrutamento on-line.
Desbloqueado ao encontrar o 2º Concorrente (texto branco esmaecido, baixo contraste — parcialmente legível, mas transcrito integralmente)
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Mesmo modal vertical com ribbon coral. Ilustração cartoon em tons quentes: caneca vermelha com vapor sobre mesa de madeira, mão segurando um jornal em preto-e-branco com balão vermelho "WE NEED YOU" e um personagem masculino desenhado. Texto explicativo com 5 linhas centralizadas. Diferença crítica de estado: o rodapé NÃO tem botão amarelo clicável — no lugar há uma linha de texto branco sobre fundo branco/claro (baixíssimo contraste, quase ilegível) indicando a condição de desbloqueio. Modal visualmente "vazio" no rodapé = estado bloqueado.

**Funcionalidade / propósito desta tela:**
Terceiro método do carrossel, ainda BLOQUEADO. Mostra o design de progressão: métodos de recrutamento melhores (10 candidatos, público mais qualificado) são gates de progresso, destravados por marcos narrativos ("encontrar o 2º Concorrente"), não apenas por dinheiro. Serve de teaser/motivação.

**O que muda em relação às imagens 000936 e 000940:**
Mesma tela, terceiro slide do carrossel. Mudanças: título "Recrutamento on-line" → "Recrutamento por revista"; candidatos 8 → 10; ilustração trocada (tablet → revista/café); texto descritivo trocado; e principalmente o CTA amarelo ("Grátis" / "$1000") foi SUBSTITUÍDO por uma mensagem de bloqueio ("Desbloqueado ao encontrar o 2º Concorrente") — primeira ocorrência de estado bloqueado neste lote. HUD e cenário inalterados.

---

### Screenshot_20260601_000949_Startup Panic.jpg — escritorio-e-sede

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", pausa + faixa "Você tem 57 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X" (parcialmente sobreposto pela ribbon do modal).
- Lateral-esquerda: coluna de 5 botões-ícone.
- Centro / palco principal: modal branco vertical "Melhorar escritório" (ribbon coral). Conteúdo: nome do próximo escritório, render isométrico em miniatura do escritório-alvo, tabela comparativa "Escritório atual" vs "Próximo escritório", e dois botões no rodapé.
- Baixo-esquerda: painel "Participação de mercado" com "3%" e "96%".
- Baixo-direita: "Saldo mensal / -3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 57 dias para pagar sua dívida.
Melhorar escritório
Praça dos Fundadores
Detalhes do escritório | Escritório atual | Próximo escritório
Funcionários | 5 | 11
Aluguel | $500 | $1000
Custo | (vazio) | $8000
Cancelar
Melhorar
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Cenário isométrico do escritório atual visível ao fundo, com o avatar do jogador (personagem de óculos e cabelo escuro) em pé com balão de emoji verde (humor/estado). Modal branco com ribbon coral. Miniatura do próximo escritório em pixel art isométrica sobre fundo cinza-claro quadriculado (estilo "planta 3D"): sala ampla em L com áreas coloridas (laranja, rosa, azul), fileiras de mesas, área de recepção/copa e vasos de plantas. Tabela de comparação com cabeçalhos em vermelho-coral em 3 colunas; valores da coluna "atual" em cinza normal e da coluna "próximo" em negrito preto (destaque do upgrade). Rodapé com dois botões: "Cancelar" cinza-claro (secundário) e "Melhorar" amarelo-alaranjado (primário) — hierarquia clara de ação.

**Funcionalidade / propósito desta tela:**
Upgrade de sede. O jogador decide investir $8000 para migrar do escritório atual para "Praça dos Fundadores", que dobra a capacidade de funcionários (5 → 11) mas também dobra o aluguel mensal ($500 → $1000). É a decisão clássica de escalar capacidade vs aumentar custo fixo — especialmente tensa aqui, com caixa negativo e prazo de dívida correndo.

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela (upgrade de sede). Diferente dos modais de recrutamento (carrossel de opções), este é um modal de confirmação de transação única com comparação antes/depois. Compartilha com os demais a HUD e o alerta de 57 dias.

---

### Screenshot_20260601_000954_Startup Panic.jpg — loja-de-moveis

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", pausa + faixa "Você tem 57 di…" (parcialmente coberta pelo modal).
- Topo-direita: dropdown "Objetivo"; botão vermelho "X" (deslocado mais à direita, sobre a parede do cenário).
- Lateral-esquerda: coluna de 5 botões-ícone.
- Centro / palco principal: modal branco largo "Loja de móveis" (ribbon coral). Duas colunas: à esquerda, grade rolável 3×N de itens de mobiliário (miniatura pixel art + preço, com badges de "NEW" e setas de melhoria), com barra de rolagem; à direita, painel de detalhe do item selecionado com nome, imagem ampliada, três atributos com bônus percentuais, texto humorístico e botão de compra.
- Baixo-esquerda: painel "Participação de merc…" com "3%" e "9…" (coberto).
- Baixo-direita: barra escura "-3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados (sobreposto ao preço "$12500" de um dos itens).

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 57 di… (coberto)
Loja de móveis
(grade de itens, da esquerda para a direita, de cima para baixo:)
NEW (badge) — $2000
$6000
$20000
$500
$7000
$12500
$25000
$12500
$25000
Quadro branco
Tecnologia | (0%) +1%
Usabilidade | (0%) +2%
Estética | (0%) +1%
Um passo acima da lousa e giz. Você logo descobrirá que a tinta é mais fácil de apagar do que a lembrança da noite em que a sua avó voltou do baile da melhor idade com um chupão no pescoço.
Comprar
3% / 9… (coberto)
-3872 $

**Elementos visuais/estruturais:**
Modal branco largo com ribbon coral. Grade de produtos em cards cinza-claro: cada card tem a miniatura isométrica pixel art do móvel na parte de cima e uma faixa cinza com o preço embaixo. Item selecionado destacado com borda azul e faixa de preço azul. Badge laranja "NEW" no canto superior direito do item novo. Setas azuis para cima no canto superior direito de vários cards (indicam item de upgrade/tier superior). Alguns cards têm miniatura e preço esmaecidos/acinzentados (indisponíveis ou não desbloqueados — ex.: $20000 e $7000). Painel de detalhe: nome centralizado em negrito, imagem grande sobre fundo cinza, e três atributos coloridos por categoria — Tecnologia em roxo, Usabilidade em azul, Estética em laranja — com o valor atual entre parênteses "(0%)" e o incremento em "+N%". Texto de flavor humorístico em cinza. Botão "Comprar" amarelo-alaranjado ocupando a largura total do rodapé direito.

**Funcionalidade / propósito desta tela:**
Loja de mobiliário do escritório. Cada móvel comprado dá bônus permanentes aos três atributos do produto/empresa (Tecnologia, Usabilidade, Estética). O jogador escolhe onde investir capital em melhorias de ambiente que se traduzem em estatísticas — vínculo direto entre decoração/customização do espaço e performance de negócio. Sistema de tiers (setas azuis) e escalonamento de preço ($500 → $25000).

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela. Diferencia-se dos modais de recrutamento/escritório por usar layout de catálogo em grade (grid + detail) em vez de carrossel ou tabela comparativa. Introduz a tríade de atributos Tecnologia/Usabilidade/Estética com código de cores (roxo/azul/laranja), que reaparece de forma abreviada (T/U/A) no print 001019.

---

### Screenshot_20260601_001005_Startup Panic.jpg — arvore-de-recursos

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", botão pausa. Acima e à esquerda, um botão circular cinza com ícone de controle de videogame (provável overlay/menu do launcher). Sem faixa vermelha de dívida nesta tela.
- Topo-direita: botão vermelho "X" de fechar (sem o dropdown "Objetivo" nesta tela).
- Lateral-esquerda: barra vertical preta com ícones brancos de navegação do sistema Android — três barras verticais "|||" (recentes), círculo/quadrado arredondado (home), "<" (voltar) e ícone de acessibilidade (boneco).
- Centro / palco principal: árvore de habilidades/características em fundo escuro com grade em perspectiva (estilo "grid retrô"). Três colunas rotuladas: "Escritório", "Funcionários", "Desenvolvimento". Cada coluna contém nós em formato de losango (diamante) ligados por linhas verticais; nós desbloqueados/adquiridos aparecem coloridos (verde, amarelo-mostarda, vermelho-coral), nós indisponíveis aparecem em cinza. A coluna "Desenvolvimento" mostra ramificação (um nó pai que se divide em dois filhos).
- Baixo-esquerda: nada além da barra de navegação do sistema (o painel de participação de mercado não aparece nesta tela).
- Baixo-direita: botão circular laranja com ícone de câmera de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.
- Direita (painel sobreposto): modal branco "Detalhe" (ribbon coral) com ícone do nó, nome, descrição, bloco "Informações detalhadas" e dois botões.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Escritório
Funcionários
Desenvolvimento
Detalhe
Empresa verde
É só um chavão que repetimos para que os funcionários economizem eletricidade e reduzam os custos operacionais.
Informações detalhadas
Aluguel de escritório | -5%
Custo | 2
Ponto atual : 8
Bônus atual
Obter caraterística
(rótulos de ícones nos nós, em pixel art, sem texto legível — ícones: folha, olho, gota/pessoa, "ADS"/maleta, mão com planta, cartão/braço, olho, cadeira, prédio/loja, chapéu/personagem, ferradura ou ímã, etiqueta de preço, mão espalmada, balão de fala, megafone, setas de troca)

**Elementos visuais/estruturais:**
Fundo escuro (quase preto/vinho) com grade em perspectiva sutil, contrastando totalmente com as telas de escritório claras — sinaliza "meta-camada" de progressão. Nós em losango com moldura em pixel art; estados visuais: adquirido/ativo = cor saturada (verde para Escritório, mostarda para Funcionários, coral/vermelho para Desenvolvimento), disponível = cor mais escura/dessaturada, bloqueado = cinza. Conexões: linhas brancas grossas entre nós já percorridos, linhas cinza-finas entre nós ainda não alcançados; linhas horizontais de bifurcação indicam ramificações. Nó selecionado com halo/borda destacada. Modal "Detalhe" branco à direita, com ícone quadrado da característica, título em vermelho-coral, descrição humorística, seção "Informações detalhadas" com título azul e lista chave→valor, "Ponto atual : 8" em azul alinhado à direita, e dois botões amarelo-alaranjados lado a lado.

**Funcionalidade / propósito desta tela:**
Árvore de características/talentos da empresa. O jogador gasta "pontos" (moeda de progressão, atualmente 8) para desbloquear características permanentes distribuídas em três trilhas temáticas (Escritório, Funcionários, Desenvolvimento). Cada característica tem um custo em pontos e efeitos passivos (aqui: "Empresa verde" custa 2 pontos e dá -5% no aluguel do escritório). Os botões permitem consultar o bônus já ativo ou adquirir a característica. É o sistema de build/especialização de longo prazo do jogo.

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela — e a única do lote com fundo escuro e sem o cenário isométrico do escritório. Também é a única em que a barra de navegação do Android aparece expandida à esquerda e em que o "Objetivo" e o alerta de dívida não estão visíveis. HUD de topo (dinheiro/usuários/data) permanece idêntica, confirmando que é uma moldura global persistente.

---

### Screenshot_20260601_001013_Startup Panic.jpg — financas

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", pausa + faixa vermelha "Você tem 56 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X".
- Lateral-esquerda: coluna de 5 botões-ícone (maleta, funcionário, prédio, pasta laranja, ferramentas).
- Centro / palco principal: modal branco vertical "Perfil da empresa" (ribbon coral). Conteúdo: nome da empresa, avatar do fundador, quatro barras de atributo com valores "1.5/150", bloco "Informações" com lista de métricas financeiras/operacionais, barra de rolagem à direita (há mais conteúdo abaixo, cortado — cabeçalho seguinte parcialmente visível), e botão largo no rodapé.
- Baixo-esquerda: painel "Participação de mercado" com "3%" e "96%".
- Baixo-direita: "Saldo mensal / -3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 56 dias para pagar sua dívida.
Perfil da empresa
Demarchi Labs
1.5/150
1.5/150
1.5/150
1.5/150
Informações
Dinheiro | $-6444
Valor da empresa | $42K
Usuários | 1040
Participação de mercado | 4%
Número de funcionários | 5
Capital do jogador | $12K(100%)
(linha seguinte cortada pela borda inferior, parcialmente legível — provável "Dês…" / cabeçalho de outra seção)
Relatório mensal
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Cenário isométrico do escritório visível ao fundo, com dois personagens e balões de emoji (um verde "enjoado/insatisfeito" à esquerda, um amarelo sorridente à direita) — sinalização de moral da equipe diretamente no mundo. Modal branco vertical com ribbon coral. Avatar em pixel art do fundador (personagem de óculos, cabelo escuro, camisa clara e gravata) num quadro cinza. À direita do avatar, quatro barras de progresso horizontais vazias, cada uma precedida de um ícone quadrado colorido (azul/controle, verde/dinheiro, vermelho/balão de fala, roxo/tela) e seguida do valor "1.5/150" — atributos da empresa em escala até 150. Bloco "Informações" com cabeçalho em faixa cinza e lista de pares rótulo→valor, rótulos em cinza-escuro e valores em negrito à direita. Barra de rolagem cinza indicando mais conteúdo. Botão "Relatório mensal" amarelo-alaranjado ocupando toda a largura do rodapé.

**Funcionalidade / propósito desta tela:**
Painel/dashboard de status da empresa. Consolida em um só lugar as métricas de saúde do negócio: caixa, valuation ($42K), base de usuários, participação de mercado, headcount e percentual de capital que ainda pertence ao jogador ($12K, 100% — ainda sem diluição por investidores). Também expõe os quatro atributos-chave do produto numa escala de progressão até 150. O CTA leva ao relatório mensal detalhado (DRE do jogo).

**O que muda em relação às outras imagens deste lote:**
Primeira ocorrência deste tipo de tela. Marca também a virada de dia no jogo: o alerta passou de "57 dias" (prints 000936–000954) para **"56 dias para pagar sua dívida."** Curiosidade/inconsistência a registrar: o modal informa "Participação de mercado 4%" enquanto o painel fixo do canto inferior esquerdo mostra "3%" — provável arredondamento diferente entre HUD e painel detalhado.

---

### Screenshot_20260601_001019_Startup Panic.jpg — mercado-concorrencia

**Elementos por região:**
- Topo-esquerda: HUD "Dinheiro $-6444", "Usuários 1040", "Data Y5 M1 W", pausa + faixa vermelha "Você tem 56 dias para pagar sua dívida."
- Topo-direita: dropdown "Objetivo"; botão vermelho "X" (deslocado à direita).
- Lateral-esquerda: coluna de 5 botões-ícone.
- Centro / palco principal: modal branco largo "Participação de mercado" (ribbon coral). Duas colunas: à esquerda, "Lista de empresas" com cards de cada empresa e seu percentual (item selecionado em azul); à direita, ficha da empresa selecionada com avatar, pontuação geral, quatro barras de atributo e uma tabela rolável de recursos/features com notas por atributo.
- Baixo-esquerda: painel "Participação de mercado" com "3%" e "96%".
- Baixo-direita: "Saldo mensal / -3872 $"; botão circular laranja de vídeo.
- Baixo-centro: botão circular translúcido com grid de 4 quadrados.

**Texto transcrito literal:**
Dinheiro / $-6444
Usuários / 1040
Data / Y5 M1 W
Objetivo
Você tem 56 dias para pagar sua dívida.
Participação de mercado
Lista de empresas
Participação de mercado 3% / Demarchi Labs
Participação de mercado 96% / Allberg Industries
Demarchi Labs
Pontuação geral : 7.1
1.5/150
1.5/150
1.5/150
1.5/150
Recurso (10) | T | U | A | Pontuação
Página inicial | 10 | 4.5 | 6.3 | 5.9
Registro | 10 | 4.6 | 10 | 6.8
Anúncios em texto | 7.1 | 6.4 | 10 | 8
Participação de mercado / 3% / 96%
Saldo mensal / -3872 $

**Elementos visuais/estruturais:**
Cenário isométrico ao fundo com personagens trabalhando e balões de emoji (amarelo sorridente, verde insatisfeito). Modal branco largo com ribbon coral, layout master/detail: lista de empresas à esquerda em cards, com o card selecionado em azul e "bico"/seta apontando para o painel direito. Painel direito com nome da empresa em vermelho-coral à esquerda e "Pontuação geral : 7.1" em preto à direita, na mesma linha. Avatar pixel art do fundador em quadro cinza + quatro barras de atributo vazias com ícones coloridos (azul, verde, vermelho, roxo) e valor "1.5/150". Abaixo, tabela rolável com cabeçalho "Recurso (10)" e três colunas de letras em badges coloridos — **T** roxo (Tecnologia), **U** azul (Usabilidade), **A** laranja (Estética/Aparência) — mais coluna "Pontuação". Linhas alternando nome do recurso e notas numéricas de 0 a 10. Barra de rolagem à direita da tabela.

**Funcionalidade / propósito desta tela:**
Painel de benchmarking competitivo. O jogador compara sua empresa com os concorrentes por participação de mercado e inspeciona, recurso a recurso (Página inicial, Registro, Anúncios em texto…), como cada feature pontua nos três eixos T/U/A e qual a nota consolidada. Serve para identificar onde o produto está fraco e priorizar melhorias — o loop de "product analytics" do jogo. Aqui evidencia a situação crítica: 3% contra 96% da Allberg Industries.

**O que muda em relação às outras imagens deste lote:**
Compartilha com o print 001013 o mesmo dia (56 dias de dívida), o mesmo avatar e as mesmas quatro barras de atributo "1.5/150" — mas troca a visão interna (finanças/valuation) pela visão externa (concorrência e qualidade por recurso). Adiciona a "Pontuação geral : 7.1" e a tabela de recursos com o código T/U/A, que corresponde à tríade Tecnologia/Usabilidade/Estética vista por extenso na Loja de móveis (print 000954). Reusa o padrão master/detail com item azul + seta já visto na Prestação de serviço (prints 000925/000928).
