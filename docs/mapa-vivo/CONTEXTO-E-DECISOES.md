# Mapa Vivo — contexto e decisões

> **O que é isto:** o redesign de UX/visual do Mapa + Sede do
> labdatadev-gamehub, tratado como a peça central da gamificação do
> produto. Pedido direto do usuário (Antonio Demarchi), 2026-08-02,
> conduzido via `bmad-ux` (skill Sally, UX Designer) com Reviewer Gate.
> **Se você é uma sessão nova retomando isto, leia primeiro**
> [`../CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md`](../CHECKPOINT-2026-08-02-mapa-vivo-ux-design.md)
> — aponta pro passo exato onde parou. Este arquivo é o "porquê" completo;
> [`STATUS-BMAD-UX.md`](STATUS-BMAD-UX.md) é o "onde estão os arquivos e o
> que falta tecnicamente"; [`MELHORIAS-FUTURAS.md`](MELHORIAS-FUTURAS.md)
> é o que fica pra depois (não é escopo deste card).

---

## 1. Por que isto existe (o pedido, literal)

> "A melhor aparência gráfica gamificada para o mapa... deixe moderno e a
> nível game enterprise, link isso ao CEP e aos vizinhos, garanta a melhor
> experiência UX/UI possível, ambiente gamificado com as melhores
> tecnologias e visual que podemos implementar, junto à parte de
> multiplayer, com tudo conectado e integrado."

Contexto imediato de quando isto foi pedido: a mesma sessão tinha acabado
de (a) corrigir um bug real de CEP (ViaCEP devolve bairro vazio pra
cidades pequenas — inclusive Mendes, a cidade-piloto do produto), (b)
validar a infraestrutura de multiplayer ponta a ponta (Supabase Realtime
Presence, WebSocket público, dois clientes reais se enxergando), e (c)
fazer um levantamento completo do backlog. O usuário conectou os pontos:
agora que CEP funciona e multiplayer está provado, o Mapa — que é onde os
dois se encontram visualmente — merece o nível de acabamento que o resto
do produto ainda não tem.

**Por que isto é prioridade #1 do projeto agora** (não só mais um card):
o Mapa é a primeira coisa que um dono de PME vê depois do cadastro — é o
"wow" que decide se ele continua jogando ou fecha a aba. Todo o resto do
produto (Funcionários de IA, marketplace, árvore de maturidade) só importa
se o usuário ficar depois desse primeiro momento. Ver
[`../ESTADO-DO-PROJETO.md`](../ESTADO-DO-PROJETO.md) pro estado geral do
produto — este documento cobre só a fatia Mapa+Sede.

## 2. Processo usado — por quê `bmad-ux`

Em vez de eu (Claude) simplesmente escolher cores e sair codando, usei o
processo `bmad-ux` (Sally, UX Designer do módulo BMAD instalado nesta
VPS) — que tem uma regra central: **elicitar a visão do usuário, nunca
impor a minha**. Isso é deliberado e é a melhor prática pra este tipo de
decisão: cor, tom, referência visual são julgamento do dono do produto, não
do agente. O processo produz dois documentos-contrato (peer contracts) que
"vencem" qualquer mockup ou wireframe em caso de conflito:

- **`DESIGN.md`** — como o produto *parece* (paleta, tipografia, forma,
  componentes visuais).
- **`EXPERIENCE.md`** — como o produto *funciona* (arquitetura de
  informação, fluxos, estados, acessibilidade).

Depois de prontos, o handoff natural do BMAD é: `bmad-create-architecture`
(Winston, arquiteto — decide COMO implementar sem violar a spec) →
`bmad-create-epics-and-stories` (John, PM — quebra em cards executáveis) →
`bmad-dev-story`/implementação real. Ver §5 (Próximos passos).

## 3. Decisões capturadas (perguntas feitas ao usuário, respostas dele)

Toda decisão de gosto/direção veio de perguntas diretas — nunca inventada.
Resumo (o log bruto, com timestamps e citação exata, está em
`{workspace}/.decision-log.md` — caminho completo em `STATUS-BMAD-UX.md`):

| Pergunta | Resposta do usuário | Por que importa |
|---|---|---|
| Referência de "game enterprise"? | **MMO/social game mobile** (Clash of Clans / Habbo) — vilarejo colorido, avatares expressivos, "cartoon" com profundidade | Confirma e reforça uma direção que **já existia**: `AGENTS.md` já cita "estilo Habbo + Startup Panic" pro World. Não é mudança de rumo, é rigor aplicado à mesma direção. |
| Perspectiva do Mapa? | **Mapa geográfico estilizado** (não isométrico abstrato) — tipo "Pokémon GO encontra Clash of Clans": ruas/bairros reais (via CEP), estilizados, não fotorrealista | **Muda a técnica de renderização do Mapa** (deixa de ser grid de hexágonos isométrico, vira tiles de terreno + pins geolocalizados). A Sede (interior, sala isométrica) NÃO muda de perspectiva — só ganha consistência visual com o Mapa. |
| Prioridade de dispositivo? | **Desktop e mobile igualmente** | Design responsivo de verdade desde o início, não "mobile-first com desktop de bônus" nem o contrário. |
| Ritmo do processo? | **Fast-path** — rascunho completo primeiro, revisão no fim | Movi rápido: rascunhei os dois documentos completos com suposições marcadas (`[ASSUMPTION]`), depois validei com o usuário em lote. |
| Zoom por clique (4 níveis fixos) vs. zoom livre contínuo? | **Zoom por clique** | Evita reescrita de arquitetura pesada (tiles sob demanda, LOD) que zoom livre exigiria — respeita o pedido explícito de "sem reescrita desnecessária". |
| Rodar validação crítica antes dos mockups? | **Sim** | Rubrica de completude + revisor de acessibilidade dedicado (canvas/Pixi.js é uma armadilha clássica de a11y) — ver `STATUS-BMAD-UX.md` pro resultado. |
| Escopo inclui a Sede (interior, World) ou só o Mapa? | **Os dois juntos** | Decisão que expandiu o escopo original — o usuário quer que o clique num pin do Mapa e a entrada na Sede pareçam **o mesmo mundo**, não dois produtos colados. Por isso os tokens de cor de tier/presença são os MESMOS nas duas telas (ver `DESIGN.md`). |

## 4. O que já está tecnicamente resolvido (não é suposição, é fato herdado)

Estas três coisas foram resolvidas NA MESMA SESSÃO, antes deste pedido de
UX, e são pré-requisito direto pro Mapa Vivo fazer sentido:

1. **CEP funciona de verdade.** Bug corrigido (`docs/GAPS-DE-INTEGRACAO.md`
   não cobre isso — foi um fix ao vivo, ver `BACKLOG-PRODUTO.md` histórico
   de commits `2026-08-02`): a ViaCEP devolve `bairro` vazio pra CEPs de
   cidade inteira (comum em cidades pequenas — Mendes, a cidade-piloto,
   era um desses casos). Sem esse fix, o Mapa Vivo estaria construindo
   sobre uma alocação de CEP que falhava silenciosamente pro público-alvo
   real do produto.
2. **CEP é obrigatório e com máscara.** O cadastro agora exige CEP válido
   (8 dígitos, máscara `99999-999`) antes de avançar — o Mapa Vivo pode
   confiar que todo negócio novo tem uma geolocalização real por trás.
3. **Multiplayer (presença ao vivo) está provado ponta a ponta.** Script
   Node externo ao Docker, usando a mesma URL pública + anon key que um
   navegador usaria, confirmou dois clientes reais se enxergando via
   Supabase Realtime Presence. O Mapa Vivo pode desenhar em cima dessa
   garantia — falta só o passe visual em navegador (`GH-MULTI-04`), não a
   infraestrutura.

## 5. Próximos passos (retomar exatamente daqui)

Ver `STATUS-BMAD-UX.md` pro estado técnico exato (arquivos, reviews, o que
falta). Em ordem:

1. **Reviewer Gate** — rubrica de completude + revisor de acessibilidade
   (dois subagentes em paralelo). Resultado em
   `{workspace}/review-rubric.md` e `{workspace}/review-acessibilidade.md`.
2. **Resolver achados** da Reviewer Gate (se houver crítico/alto).
3. **Mockups HTML das telas-chave** (Finalize do `bmad-ux`) — pelo menos:
   Mapa nível Quarteirão (o mais denso/importante), sheet de detalhe de
   pin, transição `SedeFachada`.
4. **Finalizar as spines** (`status: final`, polish editorial).
5. **Handoff pro Winston (arquiteto)** — `bmad-create-architecture`,
   escopo "Mapa Vivo": como migrar `features/mapa/` e a camada de render
   de `features/world/` sem quebrar a geometria/engine já testada, que
   biblioteca de tiles/terreno usar (ou não usar nenhuma nova), orçamento
   de performance (quantos pins simultâneos o Pixi aguenta).
6. **Handoff pro John (PM)** — `bmad-create-epics-and-stories`, quebrar em
   cards executáveis (prováveis: substituem/absorvem `GH-MAPA-02`,
   `GH-MAPA-03`, e criam algo novo tipo `GH-MAPA-04`/`GH-SEDE-01` — ver
   `../BACKLOG-PRODUTO.md`).
7. **Implementação** (`bmad-dev-story` ou execução direta), sempre com os
   gates de qualidade (`typecheck && test && build`) e deploy via
   `./deploy/docker/update.sh`, mesmo fluxo já em produção.

## 6. Princípios que qualquer sessão futura deve preservar

- **As spines vencem.** `DESIGN.md`/`EXPERIENCE.md` são o contrato — se um
  mockup, um wireframe, ou uma decisão de código durante a implementação
  conflitar com eles, a spine vence. Se a spine precisar mudar, isso é uma
  atualização explícita da spine (`bmad-ux` modo Update), não uma
  divergência silenciosa no código.
- **Reuso de token é a regra, não exceção.** Toda cor nova em `DESIGN.md`
  foi justificada contra o que já existe em `design-system/tokens.ts`
  antes de ser criada — três dos cinco tons de tier e os tokens de
  presença/vizinhança/chegada são reaproveitamentos, não cores novas.
  Preservar essa disciplina em qualquer extensão futura.
- **Mapa e Sede são um mundo só.** Qualquer trabalho futuro que toque
  presença ao vivo, tier, ou cor de negócio PRECISA manter a Sede e o
  Mapa visualmente consistentes — é o requisito central que motivou
  expandir o escopo pra incluir as duas telas juntas.
- **Sem reescrita de arquitetura desnecessária.** Pixi.js continua sendo a
  tecnologia de canvas nas duas telas — qualquer proposta de trocar de
  lib (Mapbox GL, deck.gl, three.js) precisa ser justificada explicitamente
  pelo arquiteto, nunca assumida.
- **Melhoria contínua, não big-bang.** Ciclo esperado: uma fase do Mapa
  Vivo de cada vez (ex.: primeiro o nível Quarteirão + pins, depois o
  zoom Bairro/Cidade/Região, depois a Sede) — gates verdes, deploy,
  verificar, próxima fase. Mesmo princípio já documentado em
  `PROMPT-CLAUDE-VPS.md`: "um card por vez, nunca 5 mudanças juntas".
