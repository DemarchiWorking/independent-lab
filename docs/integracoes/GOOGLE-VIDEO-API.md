# Integração com o gerador de vídeo do Google (API)

> **Estado: projeto, nada implementado.** Este documento diz **como** ligar o
> Editor(a) de Vídeo IA ao gerador de vídeo do Google, com segurança e com o
> contexto do usuário logado. Não há chave, código de chamada nem migração no
> repositório. Pesquisa feita em **19/10/2026** nas páginas oficiais do Google
> (links na seção 14). Os modelos são **preview**: confirme tudo marcado com
> "confirmar" antes de implementar.

## 1. O que isto resolve

Hoje o Editor(a) de Vídeo IA entrega um **roteiro** cena a cena (fala, o que
mostrar, texto de tela, checklist de gravação) em
`src/features/equipe-ia/entregaveis/reel.ts`. Quem não quer ou não consegue
gravar fica sem o vídeo. A integração acrescenta um caminho opcional: a partir
**do mesmo roteiro**, gerar um vídeo curto por IA, vertical (9:16), para o
dono usar como base, sem prometer o que a IA não entrega.

Meta de produto: qualquer microempreendedor da cidade, logado, gera um vídeo
a partir do próprio negócio, sem digitar um prompt.

**O que a integração NÃO é:**

- Não substitui o roteiro nem a gravação do dono. O rosto e a voz dele são o
  maior ativo de um negócio local (ver comentário de `reel.ts`).
- Não é "vídeo pronto para publicar" sem revisão. Todo vídeo passa por
  prévia e aprovação humana.
- Não usa o **Google Vids**: não encontrei API pública do Vids na pesquisa
  (só o produto, no Workspace). O que existe para desenvolvedores é a Gemini
  API (e a versão corporativa dela), e é nela que esta integração se apoia.

## 2. Qual API usar (decisão)

Em 19/10/2026 a Gemini API oferece **dois caminhos** de geração de vídeo. A
página de vídeo recomenda o Omni como padrão e o Veo 3.1 para casos
específicos (extensão de cena, controle do último quadro, pipelines antigos).

| | **Gemini Omni Flash** | **Veo 3.1** |
|---|---|---|
| Modelo | `gemini-omni-1.1-flash` (estável) ou `gemini-omni-flash-preview` | `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`, `veo-3.1-lite-generate-preview` |
| Chamada | Interactions API: `POST /v1beta/interactions` | `generateVideos` (operação de longa duração) |
| Resposta | Síncrona por padrão (vídeo em base64) ou URI para arquivos grandes | Assíncrona: operação que se consulta até `done` |
| Duração | 3 a 10 s de saída | 4, 6 ou 8 s por clipe |
| Resolução | 360p, 720p (padrão), 1080p e 4K (as duas últimas são ampliadas) | 720p (padrão), 1080p e 4K (só 8 s) |
| Proporção | 9:16 ou 16:9 | 9:16 ou 16:9 |
| Áudio | Gerado por padrão | Sempre gerado |
| Edição | Conversacional, em vários turnos (`previous_interaction_id`) | Extensão de 7 s por vez (até 20 vezes, 720p), primeiro e último quadro, até 3 imagens de referência |
| Preço | **não confirmado** na página oficial | US$ 0,05 a 0,60 por segundo, conforme modelo e resolução (seção 8) |

**Recomendação:** começar pelo **Veo 3.1 Lite ou Fast, 9:16, 720p**, por três
razões: o preço por segundo é público, o fluxo assíncrono (operação + consulta)
combina com um job persistido, e a duração do clipe (6 s) é exatamente a de uma
cena do roteiro. Manter a camada de provedor abstrata (seção 4) para trocar
para o Omni quando o preço dele estiver publicado.

> Confirmar: o Omni tem preço no site de terceiros (US$ 0,10 por segundo de
> saída), mas **não** na documentação oficial que li. Não use esse número em
> código sem confirmar.

## 3. Fatos verificados que moldam o projeto

Todos nas páginas oficiais, em 19/10/2026.

- **Pago, sem camada gratuita para Veo.** A tabela de preços marca "Not
  available" para o Veo no plano gratuito. Só se paga por vídeo gerado com
  sucesso; vídeo bloqueado pelos filtros não é cobrado.
- **Dados.** Nos serviços **gratuitos**, o Google pode usar o conteúdo enviado
  para melhorar produtos e revisores humanos podem ler. Nos **pagos**, não usa
  prompts nem respostas para isso, registra por tempo limitado (segurança e
  obrigações legais) e atua como operador de dados (Adendo de Processamento).
  Na UE, Suíça e Reino Unido só serviços pagos podem ser oferecidos a usuários
  finais. **Conclusão: só usar projeto com cobrança ativa; nunca a camada
  gratuita.**
- **Idade.** Só maiores de 18 anos usam a API, e o seu cliente "não deve ser
  direcionado a menores de 18 nem provavelmente acessado por eles". O negócio
  local tem dono adulto; o fluxo não pode ser aberto a menores.
- **Retenção.** O Veo guarda o vídeo gerado **por 2 dias** no servidor do
  Google. É preciso **baixar e guardar uma cópia nossa** dentro desse prazo.
- **Marca d'água.** Todo vídeo tem **SynthID** (invisível, verificável por
  ferramenta). Não dá para (nem se deve) remover.
- **Idioma.** Inglês é totalmente suportado; os outros "não foram avaliados e
  podem variar". Vale para o prompt **e** para a fala gerada.
- **Pessoas.** No Veo 3.1, texto para vídeo aceita só `personGeneration:
  "allow_all"`; imagem para vídeo, interpolação e referências aceitam só
  `"allow_adult"`; na UE, Reino Unido, Suíça e Oriente Médio e Norte da África
  só `"allow_adult"`. No Omni, não é permitido enviar nem editar imagens de
  menores na EEE, Suíça e Reino Unido, nem de certas pessoas reconhecíveis.
- **Prompt.** Até 1.024 tokens no Veo 3.1. O Omni não aceita parâmetro de
  prompt negativo: o que não se quer vai escrito no próprio prompt.
- **Latência.** Entre ~11 s e 6 min no horário de pico; o exemplo oficial
  consulta a operação a cada 10 s.
- **Cotas.** São **por projeto** (não por chave), e há limites por gasto em
  janela de 10 minutos por camada. A página de limites não lista números de
  vídeo: consulte o painel do AI Studio (confirmar).
- **Região.** O Brasil consta na lista de países com acesso à Gemini API.

## 4. Arquitetura

Princípio: **o roteiro que já existe é a fonte**. A integração é uma camada a
mais em cima do que o app já gera, sem novo formulário.

```
 sessão (cookie assinado)
        │  tenant sempre da sessão
        ▼
 contexto do usuário ──► gerarReel(ctx)  ──► RoteiroReel  (já existe)
 (montarContexto)              │
                               ▼
                    briefingDeVideo()  ◄── regras de segurança e de estilo
                    (função pura, só contexto PÚBLICO)
                               │ BriefingVideo
                               ▼
        POST /api/video ── valida ── limites ── custo estimado ── job "pendente"
                               │
                     ProvedorDeVideo (porta)
                      ├─ ProvedorVeo      (generateVideos + operação)
                      ├─ ProvedorOmni     (interactions)
                      └─ ProvedorFalso    (testes, sem rede)
                               │ operação no Google
                               ▼
        reconciliação: consulta até "pronto" ─► baixa o MP4 ─► guarda cópia
                               │
        GET /api/video/[id]  (estado)    GET /api/video/[id]/arquivo (MP4)
                               ▼
                  Estúdio: prévia ─► aprovação humana ─► download
```

> **Já existe um molde para isto.** O refino de texto por IA (ver
> [`../equipe-ia/IA-OPERACAO.md`](../equipe-ia/IA-OPERACAO.md)) usa exatamente o
> desenho que este documento propõe: um worker isolado com a única credencial,
> pasta de troca com pedidos e resultados, validação no app, limites e teto de
> gasto, consentimento específico e tela de admin. O job de vídeo deve reaproveitar
> esse worker, o contrato da fila e o livro de uso, em vez de criar um segundo
> mecanismo.

Decisões de arquitetura:

1. **Porta e adaptadores.** `ProvedorDeVideo` é uma interface (`iniciar`,
   `consultar`, `baixar`). O app nunca importa o SDK fora do adaptador, então
   trocar Veo por Omni (ou por outro fornecedor) é trocar um arquivo.
2. **Job persistido, não requisição longa.** Gerar leva de segundos a minutos.
   O `POST` responde `202` com o id; o navegador consulta o estado. O container
   é um processo contínuo, então a consulta ao Google pode rodar no servidor,
   mas **o estado vive no banco**: ao subir, o `instrumentation.ts` retoma jobs
   `gerando` (o processo pode reiniciar no meio).
3. **Somente contexto público no prompt.** O roteiro de vídeo já é material
   público (`reel.ts` usa `contextoPublico`; o tipo nem tem o campo
   `privado`). Gargalo, orçamento e equipe **nunca** saem do servidor para o
   Google.
4. **Cópia própria do vídeo.** Baixar o MP4 assim que fica pronto (o Google
   apaga em 2 dias) e servir **do nosso disco/armazenamento**, com
   autenticação, nunca o link do Google.
5. **Desligado por padrão.** Chave de recurso (`VIDEO_IA_ATIVO`) e teto de
   gasto. Sem chave configurada, o botão nem aparece.

## 5. Do roteiro ao prompt

`RoteiroReel` (já gerado) → `BriefingVideo` (novo, função pura e testável):

```ts
// esboço — não implementado
interface BriefingVideo {
  proporcao: "9:16";
  modelo: ModeloDeVideo;          // lista fechada, nunca texto do cliente
  resolucao: "720p" | "1080p";
  cenas: Array<{
    segundos: 4 | 6 | 8;          // cabe numa cena do roteiro (6 s)
    papel: string;                // "Gancho", "Dica", ...
    prompt: string;               // montado por template, em inglês
    legendaDeTela: string;        // aplicada na edição, NÃO pela IA
  }>;
}

function briefingDeVideo(roteiro: RoteiroReel, ctx: ContextoPublico, opcoes: OpcoesDeVideo): BriefingVideo;
```

### Regras do prompt

- **Montado por template**, nunca com texto livre do usuário. O nome do negócio
  e as ofertas entram só depois de `nomeParaTexto`/`textoLivre` (sem controle,
  sem quebra de linha, com teto). Preferir **não enviar o nome** do negócio:
  modelos de imagem desenham texto mal, e a marca vai na edição.
- **Sem pessoas identificáveis.** O MVP gera **B-roll do ambiente e do
  produto** (mãos trabalhando, a fachada, o balcão), sem rosto. Isso evita as
  restrições de `personGeneration`, o risco de parecer uma pessoa real e o
  problema de imagem de terceiros.
- **Sem fala no MVP.** A fala do roteiro continua sendo do dono (ou entra
  depois como narração). Motivo: o português da voz gerada não foi avaliado
  pelo Google. Se um dia houver fala, pedir em inglês e **testar em português
  do Brasil** com amostras reais antes de oferecer.
- **Texto de tela fora da IA.** A `legenda` de cada cena é aplicada na edição,
  não pedida ao modelo.
- **Estrutura do prompt** (boa prática de cinematografia): enquadramento,
  sujeito, ação, ambiente, estilo, câmera, som ambiente. Exemplo gerado a
  partir do roteiro de um salão de beleza:

```text
Vertical 9:16, handheld smartphone look, natural window light.
A neighborhood hair salon interior with warm wood tones. Close-up of a
stylist's hands brushing long brown hair at a styling station, gentle motion.
Slow push-in. No people's faces, no on-screen text, no logos.
Soft ambient salon sounds, no speech, no music with lyrics.
```

- **Teto de tamanho** (Veo: 1.024 tokens): validar antes de enviar; prompt
  maior vira erro de teste, não chamada paga.
- **Sem prompt vindo do cliente.** Quem escolhe é a lista: estilo
  (`realista`, `clean`, `caloroso`), duração e modelo. Isso fecha a porta de
  injeção de prompt e de conteúdo fora da política.

## 6. Chamadas ao Google (o que foi confirmado)

Veo 3.1 pela Gemini API, com o SDK `@google/genai` (trechos da documentação
oficial; os campos de `config` — proporção, duração, resolução, semente —
**confirmar** no SDK da versão instalada):

```ts
let operacao = await ai.models.generateVideos({
  model: "veo-3.1-fast-generate-preview",
  prompt,
  // config: { aspectRatio: "9:16", durationSeconds: "6", resolution: "720p" }  // confirmar nomes
});

// consulta até terminar (o exemplo oficial usa 10 s)
while (!operacao.done) {
  await esperar(10_000);
  operacao = await ai.operations.getVideosOperation({ operation: operacao });
}

await ai.files.download({
  file: operacao.response.generatedVideos[0].video,
  downloadPath: caminhoDeDestino,
});
```

Pela REST, o arquivo se baixa de `video.uri` com o cabeçalho `x-goog-api-key` e
seguindo redirecionamentos.

Omni Flash, pela Interactions API: `POST
https://generativelanguage.googleapis.com/v1beta/interactions` com `model`,
`input` (texto ou lista de itens) e `response_format` (`type: "video"`,
`aspect_ratio`, `resolution`, `delivery`). O vídeo vem em base64 no passo
`model_output` (`video/mp4`); com `delivery: "uri"` (arquivos grandes) é preciso
esperar o arquivo ficar `ACTIVE` antes de baixar. `store: false` impede a edição
em turnos seguintes.

## 7. Segurança (o que não pode ficar de fora)

| Risco | Controle |
|---|---|
| Chave vazando para o navegador | Variável **sem** o prefixo `NEXT_PUBLIC_`, lida só em arquivo de servidor; teste de build que procura o nome da variável em `.next/static`; `.env` da VPS com `chmod 600` |
| Chave roubada | Restringir a chave à API usada e, se o console permitir, ao IP de saída da VPS (**confirmar**); gastar com alerta de orçamento no projeto Google; rotacionar ao menor sinal |
| Um negócio ver o vídeo de outro | `tenantId` **sempre da sessão**; `GET /api/video/[id]` confere que o job é do tenant da sessão e devolve 404 (não 403) quando não é; arquivo servido por rota autenticada, nunca por URL pública adivinhável |
| Gasto descontrolado | Teto por negócio (segundos por mês), limite de jobs por dia, limite de jobs simultâneos, **chave geral de desligar**, custo estimado calculado **antes** de chamar e gravado no job |
| Repetir o mesmo pedido (duplo clique, retry) | Chave de idempotência = hash(tenant, briefing, dia): o mesmo pedido devolve o job existente |
| Injeção de prompt | Prompt só por template; entradas do usuário saem de listas fechadas; texto livre só depois de `textoLivre`; nada do usuário vai para instrução de sistema |
| Conteúdo fora da política | O Google bloqueia e não cobra; o job vira `bloqueado` com mensagem neutra (não repetir o prompt ao usuário); sem nova tentativa automática |
| Vazamento de dado pessoal ao Google | Só contexto público no prompt; sem foto de cliente; sem nome de pessoa; **projeto pago apenas** |
| Vídeo parecer real | Aviso "gerado por IA" no estúdio e no arquivo; orientar a rotular na rede social; SynthID permanece |
| Pedido de fora do app (CSRF) | `POST` só da mesma origem (`Sec-Fetch-Site` e `Origin`), como na rota `/api/entregavel` |
| Menores | Cadastro é de dono de negócio adulto; nenhum fluxo de criança; termos do Google exigem 18+ |
| Log com dado sensível | Registrar só id, modelo, segundos, custo e estado; **não** gravar o prompt nem o MP4 em log |

Ambiente e CSP:

- `lib/ambiente.ts` valida no boot: `VIDEO_IA_ATIVO=true` exige a chave; a chave
  nunca é exigida com o recurso desligado.
- A CSP atual (`default-src 'self'`) já permite `<video>` do próprio domínio;
  para prévia em `blob:` acrescentar `media-src 'self' blob:`.
- A chamada ao Google sai **do servidor**: nenhuma mudança em `connect-src`.

## 8. Custo

Preços da página oficial (paga, US$ por segundo, **com áudio**, conferidos em
19/10/2026; **são preview e mudam**: guardar em configuração, não no código):

| Modelo | 720p | 1080p | 4K |
|---|---|---|---|
| `veo-3.1-generate-preview` (padrão) | 0,40 | 0,40 | 0,60 |
| `veo-3.1-fast-generate-preview` | 0,10 | 0,12 | 0,30 |
| `veo-3.1-lite-generate-preview` | 0,05 | 0,08 | não tem |

Exemplos em 720p:

| Entrega | Lite | Fast | Padrão |
|---|---|---|---|
| Um clipe de 8 s | US$ 0,40 | US$ 0,80 | US$ 3,20 |
| Reel de 6 cenas de 6 s (36 s) | US$ 1,80 | US$ 3,60 | US$ 14,40 |

Para o produto: o Editor(a) de Vídeo IA custa R$ 597 por mês (catálogo). Um
teto de **120 s por mês no Lite (~US$ 6)** cabe com folga; defina o teto por
cargo e por nível em `VIDEO_IA_TETO_SEGUNDOS_MES` e mostre o custo **em
segundos** ao usuário (não em dólar). Converter para reais só se houver regra
de câmbio explícita.

## 9. Dados e API do app (proposta)

Job (arquivo no modo `file`, tabela no modo Supabase):

```
video_jobs
  id            texto (24 hex)        chave
  tenant_id     texto                 dono (RLS: private.tenant_atual())
  chave_idemp   texto único           hash(tenant, briefing, dia)
  provedor      "veo" | "omni"
  modelo        texto                 da lista fechada
  estado        pendente | gerando | pronto | bloqueado | falhou | expirado
  segundos      inteiro
  custo_usd     numérico              estimado antes da chamada
  operacao      texto                 nome da operação no Google
  arquivo       texto                 caminho da nossa cópia
  criado_em, atualizado_em, expira_em
```

Rotas:

| Rota | Faz |
|---|---|
| `POST /api/video` | valida, confere limites e custo, cria o job (ou devolve o existente) e responde `202 { id }` |
| `GET /api/video/[id]` | estado do job do tenant da sessão |
| `GET /api/video/[id]/arquivo` | MP4 da nossa cópia, `Content-Type: video/mp4`, `Cache-Control: private, no-store` |
| `DELETE /api/video/[id]` | apaga arquivo e registro (pedido do titular, LGPD) |

Migração nova (`supabase/migrations/0028_video_jobs.sql`) seguindo o padrão das
anteriores: RLS forçada, `(select private.tenant_atual())`, sem política de
`UPDATE` para o cliente (só o servidor muda o estado).

## 10. Experiência no Estúdio

Na aba do roteiro de vídeo, uma seção "Vídeo por IA (opcional)":

1. Explica em uma frase o que será gerado (cenas do ambiente, sem pessoas,
   sem fala) e o que **não** será.
2. Mostra duração e **custo em segundos** do teto mensal ("este vídeo usa 36 s
   dos seus 120 s deste mês").
3. Botão "Gerar prévia de 8 s" primeiro (barato), "Gerar o vídeo completo"
   depois.
4. Acompanha o estado com `role="status"` (e `prefers-reduced-motion` respeitado
   no indicador de progresso).
5. Prévia em `<video controls>` com legenda de tela aplicada por cima;
   **Aprovar** libera o download. Sem aprovação, nada sai.
6. Aviso fixo: "Vídeo gerado por IA. Confira antes de publicar e indique que é
   conteúdo gerado por IA na rede social."

## 11. Testes

- **Briefing** (puro): nunca contém campo privado; respeita o teto de tokens;
  nome com HTML, quebra de linha ou 10 mil caracteres não vira prompt quebrado;
  cena de 6 s vira 6 s.
- **Provedor falso**: o fluxo inteiro (pendente → gerando → pronto, bloqueado,
  falhou, expirado) sem rede.
- **Rota**: sem login 401; tenant da sessão e não do corpo; job de outro tenant
  é 404; limite diário e mensal; chave geral desligada; idempotência; `POST` de
  outra origem 403.
- **Segredo**: o nome da variável da chave **não aparece** em nenhum arquivo de
  `.next/static`.
- **Contrato** (manual, uma vez por mudança de modelo): chamada real com prompt
  mínimo no modelo Lite, conferindo duração, proporção e a marca de custo.

## 12. Plano de implementação

| Fase | Entrega | Pronto quando | Esforço |
|---|---|---|---|
| F0 | `briefingDeVideo` puro + testes + `ProvedorFalso` | testes verdes, sem chave | P |
| F1 | Job persistido, rotas, limites, idempotência e chave geral | testes de rota verdes com o provedor falso | M |
| F2 | `ProvedorVeo` + conta Google paga + chave no `.env` da VPS | contrato real passa uma vez | P |
| F3 | Estúdio: prévia, aprovação, aviso de IA | verificação no navegador em 1280 e 375 px | M |
| F4 | Operação: alerta de gasto, limpeza de vídeos expirados, runbook | uma semana em produção com custo dentro do teto | P |

Esforço: P até 1 dia, M alguns dias.

## 13. Riscos e perguntas em aberto

- **Modelos em preview.** Nomes, preços e limites podem mudar sem aviso.
  Mitigar com a porta de provedor, preços em configuração e o teste de contrato.
- **Veo 3 e 3 Fast** aparecem como "estável" e como "descontinuado" na mesma
  página; usar só os da família 3.1.
- **Qualidade do vídeo para PME.** O MVP sem pessoas e sem fala gera B-roll
  genérico. Medir se o dono realmente usa antes de investir em Omni ou em fala.
- **Português na voz e no texto.** Não avaliado pelo Google; manter fora do MVP.
- **Cotas de vídeo** não publicadas na documentação: ler no painel.
- **Vertex AI / versão corporativa.** Alternativa se for preciso controle de
  região de dados ou contrato corporativo (confirmar disponibilidade e preço).
- **Direitos e disclosure.** Decisão jurídica do negócio: regras de rotulagem
  de conteúdo gerado por IA das redes e a responsabilidade pelo vídeo
  publicado são do dono; o app só alerta.
- **Quem paga.** Hoje o custo é do projeto Google do app. Se o gasto crescer,
  decidir se entra no preço do cargo ou em moeda do jogo (sem misturar moeda
  virtual e R$).

## 14. Fontes

Páginas oficiais consultadas em 19/10/2026:

- [Geração de vídeo na Gemini API](https://ai.google.dev/gemini-api/docs/video)
- [Veo 3.1 na Gemini API](https://ai.google.dev/gemini-api/docs/veo)
- [Gemini Omni Flash](https://ai.google.dev/gemini-api/docs/omni.md.txt)
- [Preços](https://ai.google.dev/gemini-api/docs/pricing)
- [Limites de uso](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Regiões disponíveis](https://ai.google.dev/gemini-api/docs/available-regions)
- [Termos da Gemini API](https://ai.google.dev/gemini-api/terms)
