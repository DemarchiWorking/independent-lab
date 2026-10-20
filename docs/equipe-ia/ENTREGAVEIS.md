# Entregáveis dos Funcionários de IA

> Como o app gera **Canvas, documentação (POPs), publicações, kit comercial e
> roteiro de vídeo** a partir dos dados do negócio logado. Escrito para quem
> vai manter ou estender o código. Leia junto com
> [`PRODUTO-IA-FUNCIONARIOS.md`](../PRODUTO-IA-FUNCIONARIOS.md) (o produto) e
> [`../seguranca/RELATORIO-2026-10.md`](../seguranca/RELATORIO-2026-10.md).

## 1. Objetivo

Qualquer microempreendedor da cidade, depois de se cadastrar e contratar um
Funcionário de IA, recebe material **específico do negócio dele** sem digitar
prompt e sem ser especialista. O mesmo código atende uma cabeleireira, uma
padaria e uma oficina, porque o texto nasce do que o dono respondeu no
cadastro e do que ele publicou no hub (ofertas, parcerias, presença digital),
cruzado com conhecimento de mercado do segmento.

## 2. O que cada cargo entrega

| Cargo | Entregável | Saídas | O que é |
|---|---|---|---|
| Documentador(a) IA | `canvas` | HTML, Markdown, JSON | Modelo de Negócio (Canvas) com os 9 blocos, primeiras ações, plano de 90 dias, indicadores e riscos |
| Documentador(a) IA | `pop` | HTML, Markdown, JSON | Manual de procedimentos (POPs) com passos, responsável, versão e próxima revisão |
| Social Media IA | `carrossel` | HTML, Markdown, JSON, **PNG**, **ZIP** | Pautas de carrossel, calendário, legendas e os slides prontos em 3 formatos e 3 temas |
| Comercial/Automação IA | `comercial` | HTML, Markdown, JSON | Qualificação (BANT), mensagens de WhatsApp para copiar, objeções, cadência de retorno, fluxo de automação e LGPD |
| Editor(a) de Vídeo IA | `reel` | HTML, Markdown, JSON | Roteiro cena a cena, legendas, checklist de gravação e formatos |

Fonte da verdade da lista: `src/features/equipe-ia/habilidades.ts`
(`CATALOGO_HABILIDADES`, `entregaveisDoCargo`, `cargoDoEntregavel`). As saídas
por tipo ficam em `SAIDAS_POR_TIPO` (`entregaveis/servico.ts`).

### Nível do funcionário = profundidade, não utilidade

O nível 1 já entrega um material **completo e utilizável**. Subir de nível
acrescenta profundidade (conferido no código de cada gerador):

| Entregável | Nível 1 | Nível 2 acrescenta | Nível 3 acrescenta |
|---|---|---|---|
| Canvas | resumo, os 9 blocos, primeiras ações dos próximos 7 dias, documentos para manter em dia | diagnóstico do negócio, plano de 90 dias em 3 fases, indicadores | riscos e revisão trimestral |
| POPs | atendimento, execução do serviço, pós-venda | financeiro e presença digital | integração e reclamação |
| Carrossel | pautas "dicas" e "oferta", calendário de 2 semanas | pautas "mitos" e "como pedir", calendário de 4 semanas | pautas "bastidores" e "local", ideias de reaproveitamento |
| Comercial | BANT, mensagens-base, 2 objeções, cadência de retorno (dia 0, 2 e 10) | mensagens de retorno em 5 dias, "vou pensar" e pedido de indicação; 3ª objeção; dia 5 e ligação no dia 14; fluxo e automação | reativação (dia 45 e 90), 4ª objeção, checklist de teste do fluxo |
| Reel | gancho, uma dica, apresentação e convite | segunda dica e 3 ganchos alternativos | cena de prova e ideias de reaproveitamento |

O nível vem **do banco** (o funcionário contratado), nunca do cliente.

## 3. Arquitetura

```
 sessão (cookie assinado)  ──►  rota /api/entregavel/[tipo]
                                       │ tenant e nível vêm daqui
                                       ▼
       repositório ──► montarContexto()  ──►  ContextoNegocio
       (negócio, onboarding,                   ├─ público  (ofertas, parceiros)
        ofertas, parcerias)                    └─ privado  (respostas do cadastro)
                                       │
                          contextoPublico()  (tipo SEM o campo privado)
                                       │
                       gerador puro  (canvas | pop | carrossel | comercial | reel)
                                       │ usa mercado/ (8 segmentos, 13 nichos)
                                       ▼
                                  Documento  (seções e blocos tipados)
                                       │ auditarDocumento()  (alarme de qualidade)
        ┌──────────┬───────────┬───────┴──────┬────────────┐
        ▼          ▼           ▼              ▼            ▼
      HTML      Markdown      JSON       PNG (slide)     ZIP
   (autônomo)  (escapado)   (estúdio)   (next/og+Nunito) (todos os slides)
```

| Camada | Arquivos | Regra |
|---|---|---|
| Dados | `lib/db`, `servico.ts` (`carregarContexto`) | Único ponto que lê o repositório e confere a sessão |
| Contexto | `entregaveis/contexto.ts` | Limpa e limita texto; separa público de privado; função pura (o relógio entra por parâmetro) |
| Conhecimento | `entregaveis/mercado/` | Segmentos, nichos e planos escritos **por perspectiva** (quem compra × quem vende) |
| Geradores | `canvas.ts`, `pop.ts`, `carrossel.ts`, `comercial.ts`, `reel.ts` | Puros e determinísticos: mesma entrada, mesma saída |
| Modelo | `tipos.ts`, `documento.ts` | `Documento` com blocos tipados (parágrafo, lista, passos, mensagem, tabela, canvas, cena...) |
| Qualidade | `qualidade.ts` | Linter de conteúdo usado nos testes e como alarme em produção |
| Renderização | `render/` | HTML, Markdown, ZIP, PNG; um renderizador por saída, nenhum conhece o gerador |
| Estúdio | `estudio/` | Visualizador e editor de publicações dentro do app |

### Decisões que merecem explicação

1. **Base por regras, refino por IA.** O texto-base sai de funções puras e
   de uma base de conhecimento escrita à mão. Vantagens: resultado
   reproduzível, custo zero por pedido, funciona sem IA, e é possível
   **testar o conteúdo**. Sobre essa base, e só com autorização do dono, a IA
   (Claude) refina o material com o contexto da conta; o resultado passa por
   uma validação rígida e vira uma versão (`meta.geradoPor: "ia"`). Se a IA
   falhar, o dono continua recebendo a versão de regras. Como funciona, o que
   custa e como operar: [`IA-OPERACAO.md`](IA-OPERACAO.md).
2. **Público × privado no tipo.** Material voltado ao cliente (carrossel e reel)
   recebe `ContextoPublico = Omit<ContextoNegocio, "privado">`. O gargalo, o
   orçamento e a equipe que o dono declarou em segredo **não existem** nesse
   tipo; vazar para um post exigiria burlar o compilador. O linter ainda
   confere o texto contra `frasesPrivadas()`.
3. **Sem inventar números.** O plano nunca cria meta numérica de resultado (a
   IA não conhece a linha de base; há teste para isso) e o linter barra
   promessa, como "garantido", "líder" ou "100%". Quando falta dado, o
   documento mostra `[campos]` em colchetes em vez de preencher.
4. **Conhecimento por perspectiva.** A mesma frase não serve ao cliente e ao
   dono. O módulo `mercado/` guarda a visão de quem compra (dor, objeção) e a
   de quem vende (rotina, gargalo) separadas; um teste garante que a dor do
   cliente não repete a do dono.
5. **Nicho inferido do que o dono escreveu.** O nome e as ofertas passam por
   palavras-chave (`inferirNicho`): "corte feminino" vira beleza. O nome pesa
   mais que as ofertas; sem palavra reconhecida, fica no segmento declarado, e
   segmentos regulados não ganham nicho de bairro por acidente.
6. **Documento autônomo.** O HTML baixado leva o próprio CSS e uma CSP própria
   (`default-src 'none'`); funciona sem internet e vira PDF pelo navegador.
7. **A prévia é a imagem.** O editor de publicações desenha o slide com as
   mesmas medidas e temas (`medidasDoSlide`, `TEMAS_SLIDE`) que o servidor usa
   para gerar o PNG; o que o dono vê é o que baixa.

## 4. Segurança

A rota é `src/app/api/entregavel/[tipo]/route.ts` (23 testes em `rota.test.ts`).

| Risco | Controle |
|---|---|
| Ver o material de outro negócio | O `tenantId` vem **só** da sessão assinada; parâmetro de tenant na URL ou no corpo é ignorado (teste) |
| Gerar sem ter contratado | A rota confere que o cargo do tipo está contratado; sem isso, 403, e o negócio nem é lido |
| Subir o nível pelo cliente | O nível é lido do funcionário contratado, no banco |
| Valor inesperado | Tipo, saída, formato, tema e pauta contra lista; o que não bate é 400 (ou 404 se não existe), nunca "corrigido" em silêncio |
| Pedido vindo de outro site (CSRF) | `POST` só da mesma origem (`Sec-Fetch-Site` e `Origin`); cross-site recebe 403 |
| Abuso e custo de CPU | 40 pedidos/min por negócio e 24/min para imagens (PNG consome CPU do servidor compartilhado); acima disso, 429 com `Retry-After` |
| Corpo grande | `POST` limitado a 24 000 bytes (413 acima) |
| Cache em proxy | `Cache-Control: private, no-store` em toda resposta |
| Dado pessoal em log | O log leva só tipo, saída, nível, tempo e códigos do linter |
| Nome de arquivo malicioso | `nomeDeArquivo` gera ASCII; o ZIP rejeita nomes que escapem da pasta (zip-slip) |
| XSS no material | HTML: escape na saída; Markdown: escape e blocos de código à prova de cerca; estúdio: React escapa por padrão, sem `dangerouslySetInnerHTML` |
| Pauta incompleta publicada | Pauta com `[campos]` pendentes bloqueia o download (422) |

## 5. Qualidade do conteúdo

`qualidade.ts` audita cada `Documento`. Os códigos de problema são estáveis:
`valor-invalido`, `espaco-duplo`, `espaco-nas-pontas`,
`espaco-antes-de-pontuacao`, `campo-desconhecido`, `campo-pendente`,
`artigo-antes-do-nome`, `promessa-inventada` e
`dado-privado-em-material-publico`.

Nos testes ele roda sobre **um contexto para cada perfil de mercado (8
segmentos e 13 nichos) em cada nível**. Em produção roda como alarme: se um
material sair com defeito, o log registra **só os códigos**, e o usuário recebe
o material mesmo assim.

Regra de ouro ao editar texto: leia a **saída real**, não só o código. Os
defeitos mais caros desta entrega (frases coladas, concordância de gênero,
fragmentos) só apareceram lendo o documento gerado.

## 6. Como estender

| Quero... | Vou em... |
|---|---|
| Novo nicho (ex.: pet shop) | `mercado/nichos.ts`: palavras-chave e perfil; `mercado.test.ts` exige conteúdo suficiente para os cinco entregáveis |
| Novo segmento | `mercado/segmentos.ts` e `mercado/planos.ts`; mesmas exigências |
| Nova pauta de carrossel | `carrossel.ts` (função `pauta...`) e o nível mínimo onde entra |
| Novo POP | `pop.ts`, função `pop...`, e o nível onde entra |
| Nova mensagem comercial | `comercial.ts` (`m.<nome>`) e o nível; `{campos}` marcam o que o dono preenche |
| Novo tipo de entregável | `TipoEntregavel` e o catálogo em `habilidades.ts`; gerador novo; `SAIDAS_POR_TIPO` em `servico.ts`; rótulo em `estudio/rotulos.ts`; rótulo do NPC em `world/InteracaoNpc.tsx`; teste de rota |
| Novo tema/formato de slide | `render/formatos.ts` e `TEMAS_SLIDE`; `slide.test.ts` cobre as medidas |

Regras de código nesta área: sem `any`; nenhum gerador lê o repositório;
gerador de material público só recebe `ContextoPublico`; todo texto que veio do
dono passa por `textoLivre`/`nomeParaTexto` antes de entrar no documento.

## 7. Fontes dos slides

Os PNGs usam **Nunito** (400, 700, 800), licença OFL, em `src/assets/fonts/`
junto de `OFL-Nunito.txt`. O `next.config.mjs` inclui os arquivos no build
`standalone` (`outputFileTracingIncludes`); sem isso o PNG em produção sairia
com a fonte errada. Como a família já está no repositório, ela também pode
substituir o `@import` do Google Fonts por `next/font/local` (pendência no
relatório de segurança).

## 8. Testes

| Arquivo | Garante |
|---|---|
| `linguagem.test.ts` | Limpeza de texto, datas, nomes de arquivo |
| `contexto.test.ts` | Separação público × privado, limites, determinismo |
| `mercado/mercado.test.ts` | Perfis dos 8 segmentos, reconhecimento de nicho, perspectiva do cliente × dono, plano sem meta inventada |
| `documentos.test.ts` | Cada gerador, em cada nível, sem defeito de qualidade e sem promessa inventada |
| `render/render.test.ts` | HTML autônomo e escapado, Markdown seguro, ZIP válido e sem zip-slip |
| `render/slide.test.ts` | Medidas e temas do slide |
| `servico.test.ts` | Pedido de imagem, pauta e saídas permitidas |
| `app/api/entregavel/rota.test.ts` | 400, 401, 403, 404, 413, 422, 429, tenant da sessão, mesma origem, limite por negócio |

Gates: `npm run typecheck`, `npm test`, `npm run build`,
`npm audit --omit=dev --audit-level=high`.

## 9. Limites conhecidos

- A versão de regras é tão variada quanto a base de `mercado/`: 8 segmentos e
  13 nichos. Negócio fora deles recebe material do segmento declarado, correto
  mas menos específico; o refino por IA é o que reduz essa distância, para
  quem autoriza.
- Os slides não incluem foto do negócio; o dono insere a própria imagem na
  rede social. Gerar imagem por IA fica para uma fase futura.
- Não há vídeo gerado: o Editor(a) de Vídeo entrega roteiro. A ligação com o
  gerador de vídeo do Google está **projetada, não implementada**, em
  [`../integracoes/GOOGLE-VIDEO-API.md`](../integracoes/GOOGLE-VIDEO-API.md).
- Tudo é gerado na hora; não há histórico de versões. A "versão" e a "próxima
  revisão" dentro do documento são rótulos para o dono acompanhar a revisão
  dele, não um controle automático.
- Os materiais são uma base de trabalho: o documento diz isso e mostra de onde
  saíram os dados. Quem decide e responde pelo conteúdo é o dono.
