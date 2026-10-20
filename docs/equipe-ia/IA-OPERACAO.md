# IA dos Funcionários: como funciona e como operar

> Guia para quem mantém o produto e para quem opera a VPS. Complementa
> [`ENTREGAVEIS.md`](ENTREGAVEIS.md) (o que cada material contém) e
> [`../seguranca/RELATORIO-2026-10.md`](../seguranca/RELATORIO-2026-10.md).

## 1. O que isto faz

Os cinco materiais dos Funcionários de IA (Canvas, POPs, carrosséis, kit
comercial e roteiro de vídeo) nascem de um gerador de **regras**, que sempre
funciona, e podem ser **refinados por IA** (Claude) a partir do contexto
registrado de cada conta. O refino é uma camada a mais, nunca uma dependência:
se a IA falhar, o usuário continua recebendo o material de regras.

Três jeitos de o refino acontecer:

| Gatilho | Prioridade | Quando |
|---|---|---|
| O dono pede, no estúdio do material | `usuario` | Na hora (o worker pega assim que estiver livre) |
| Melhoria contínua | `lote` | A cada hora, **só se a fila estiver vazia** |
| Reenvio automático por resposta reprovada | herda a original | Uma vez, com o motivo da reprovação |

A melhoria contínua é o "se não tiver mais nada na fila, melhore a documentação
do cliente": para cada negócio que autorizou a IA, gera a primeira versão de IA
de cada material e depois refina até o limite de **2 refinos por documento**
(configurável). O ciclo reabre sozinho quando o dono muda o cadastro ou as
ofertas.

## 2. Arquitetura

```
 usuário ──► app (Next.js) ──────────────────────────────┐
              │ monta o pedido (contexto + material de regras + prompt)   │
              ▼                                                           │
        data/ia/pendente/<id>.json                                        │
              │                         ┌──────────────────────┐          │
              └────────────────────────►│  ia-worker (container)│          │
                                        │  única credencial     │          │
        data/ia/concluido/<id>.json ◄───│  da Anthropic         │──► API   │
              │                         └──────────────────────┘          │
              ▼                                                           │
        app valida (forma, dado novo, regressão, linter) ──► versão ──────┘
              └─► /api/entregavel serve a versão vigente (HTML, MD, JSON, PNG, ZIP)
```

| Peça | Onde | Papel |
|---|---|---|
| Worker | `ia-worker/worker.mjs` (sem dependências) | Executa pedidos; guarda a credencial; não abre porta; só enxerga `data/ia` |
| Contrato | `src/features/equipe-ia/ia/contrato.ts` | Formato dos arquivos de troca, igual nos dois lados |
| Prompt | `ia/prompt.ts` | Minimização, texto do usuário como dado, boas práticas por material, esquemas JSON |
| Validação | `ia/validar.ts` | Defesa contra resposta ruim ou plantada; reconstrói campo a campo |
| Orquestração | `ia/servico-ia.ts` | Pedir, coletar, reenviar, varrer, consentimento, versão vigente |
| Agendador | `ia/agendador.ts` | A cada 30 s coleta; a cada hora varre |
| Configuração | `ia/config.ts` | Validada; lida pelo worker a cada ciclo |
| Uso | `ia/uso.ts` | Livro por dia: pedidos, tokens e custo estimado por negócio, modelo e modo |
| Tela do admin | `src/app/admin/ia` | Estado, fila, uso, configuração |
| Guardião | `deploy/ia-guardiao.sh` | De hora em hora, no host: confere e reinicia |

### Por que um worker separado e arquivos, não HTTP

O app é a superfície pública e recebe texto de qualquer usuário. Se ele
guardasse a chave da Anthropic, uma falha nele vazaria a chave. Por isso o app
**recusa subir** em produção se receber `ANTHROPIC_API_KEY`,
`ANTHROPIC_AUTH_TOKEN` ou `CLAUDE_CODE_OAUTH_TOKEN` (`lib/ambiente.ts`). Os dois
conversam por uma pasta de troca:

```
data/ia/
  config.json          escrito pelo app, lido pelo worker a cada ciclo
  worker.json          batimento do worker (pausas, contadores do dia)
  pendente/            app cria; worker pega
  processando/         worker (um pedido por vez)
  concluido/ falhou/   worker grava; app valida, usa e apaga
  uso/AAAA-MM-DD.json  livro de uso (app)
  agendador.json       última coleta e varredura (app)
```

Cada arquivo tem **um escritor**, toda gravação é atômica (temporário +
`rename`), e o worker devolve o pedido à fila se cair no meio. O worker apaga
resultado que ninguém coletou em 24 h.

## 3. Credencial: Claude Pro (principal), créditos de API (opcional)

| | **Assinatura Claude Pro (principal)** | **Créditos de API (opcional)** |
|---|---|---|
| Como autentica | `CLAUDE_CODE_OAUTH_TOKEN` (de `claude setup-token`, vale 1 ano) ou `IA_CLAUDE_CONFIG_DIR`, e `claude -p` | `ANTHROPIC_API_KEY` do Claude Console, no worker |
| Custo | Dentro do plano; sem cobrança por token | Por uso, com teto diário em US$ e limite mensal no Console |
| Limites | Janela de 5 h e limite semanal do plano: o worker **pausa** e volta sozinho (padrão 60 min); os pedidos voltam à fila | Teto de gasto do dia (`gastoMaxUsdDia`) |
| Termos da Anthropic | **Aviso:** não permitem rotear usuários de um produto por Pro/Max | Permitido para produtos |
| Para ligar | Imagem com `INSTALAR_CLAUDE_CLI=1`, `IA_PERMITIR_ASSINATURA=1` e o token em `.env.ia` | Chave em `.env.ia`, reiniciar o worker e marcar **Usar créditos de API** em `/admin/ia` |

**Como funciona.** A assinatura Pro é o modo principal e vem ligada. O toggle em
`/admin/ia` (só o admin da IA) troca para créditos de API quando você tiver uma
chave; sem a chave no worker o toggle fica bloqueado e explica o motivo. Cada
troca entra no histórico com quem fez e quando. O worker nunca troca de modo
sozinho, e o modo escolhido vale mesmo que as duas credenciais existam.

**Risco assumido (decisão do dono, 20/10/2026).** A página de termos do Claude
Code ([legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance),
consultada em 20/10/2026) diz que a Anthropic não permite rotear requisições de
usuários de um produto por credenciais Free, Pro ou Max, e que pode agir sem
aviso. O risco recai sobre a conta inteira. Por isso a tela mostra o aviso o
tempo todo e a recomendação é **usar uma conta Claude separada da de trabalho**
e **desativar o uso dos dados para treinamento** nas configurações de
privacidade dessa conta (os dados dos clientes passam por uma conta de
consumidor). Para sair do risco, basta pôr créditos de API e ligar o toggle.

**Primeira vez, na VPS (você executa):**

1. Entre numa conta Claude Pro **separada** e desligue "ajudar a melhorar o Claude".
2. Gere o token: `claude setup-token` (guarde-o; vale 1 ano).
3. Em `/opt/independent-lab/.env.ia`: `CLAUDE_CODE_OAUTH_TOKEN=...` e `IA_PERMITIR_ASSINATURA=1` (`chmod 600`).
4. Publique com `INSTALAR_CLAUDE_CLI=1` (imagem do worker com a CLI).
5. Confira de verdade: `node ia-worker/verificar.mjs --chamada` (faz uma chamada real e diz o que falta).
6. Abra `/admin/ia`: deve mostrar "Modo ativo: Assinatura Claude Pro".

**Geração automática.** Quem autoriza o uso de IA recebe a primeira versão
refinada sozinha (sem outro clique). Depois a melhoria contínua refina, no
máximo `refinosPorDocumento` vezes por material, só quando a fila está vazia e o
worker está vivo; mudar o contexto da conta invalida a versão e gera outra.

O modo assinatura roda `claude -p` sem `--bare` (que ignora o token OAuth), sem
ferramentas, sem MCP, sem comandos e sem sessão salva, num diretório de casa
vazio por pedido, e **nunca repassa** `ANTHROPIC_API_KEY` (em `-p`, a chave de
API vence a assinatura em silêncio). As flags foram testadas contra a CLI real
v2.1.226 sem gastar token (token inválido: a CLI aceita todas e responde 401).
**Ainda não houve uma chamada real ao modelo** (o login da CLI nesta máquina
expirou): a ponte foi validada com uma CLI e uma API simuladas.

### Créditos extra e cobrança por requisição

Desativados por enquanto: a tela mostra o item desligado e `cobrarPorRequisicao`
é sempre `false`, mesmo que o arquivo diga outra coisa. O que já existe é o
**registro de uso** por negócio (`ia/uso`): tokens e custo estimado de cada
pedido, a base de uma cobrança futura. Cobrar exige decidir preço, moeda (R$
real, nunca a moeda virtual do jogo) e contrato com o cliente.

## 4. Custos

Preços (página oficial da Anthropic, 20/10/2026; estão em
`ia/config.ts` → `MODELOS_PADRAO` e mudam: confira antes de confiar):

| Modelo | Entrada | Saída |
|---|---|---|
| Claude Haiku 5.5 | US$ 0,10 / M tokens | US$ 0,50 / M tokens |
| Claude Sonnet 5.5 | US$ 2 / M tokens | US$ 10 / M tokens |
| Claude Opus 5.5 | US$ 4 / M tokens | US$ 20 / M tokens |

Padrão: **Sonnet** para pedidos de usuário (qualidade), **Haiku** para a
melhoria contínua (volume). Estimativa por material (≈ 8 mil tokens de entrada
e 6 mil de saída): **US$ 0,004 no Haiku, US$ 0,08 no Sonnet**. Um negócio com os
cinco materiais, uma geração e dois refinos (15 pedidos) custa cerca de
**US$ 0,06 no Haiku**. 100 negócios: cerca de US$ 6. Estes números são
estimativas minhas a partir do tamanho dos pedidos; a fatura do Console é a
fonte oficial.

Controles, do mais fraco ao mais forte: refinos por documento (2), pedidos por
negócio por dia (6), melhorias por varredura (10), pedidos por dia no total
(300), **teto de gasto por dia (US$ 5, estimado)** que para o worker até a
meia-noite UTC, e o **limite mensal do Console**, que é o que vale de verdade.

## 5. Segurança

A saída do modelo é tratada como **dado não confiável**: ele leu texto digitado
por usuários.

| Risco | Controle |
|---|---|
| Vazar a chave | Só o worker a tem; o app recusa subir com ela; o worker só aceita `ANTHROPIC_BASE_URL` https (ou loopback) |
| Vazar dado privado em material público | Carrossel e vídeo recebem só `contextoPublico` (o tipo nem tem o campo `privado`); o linter confere o texto |
| Prompt injection pelo nome ou pelas ofertas | Texto do usuário vai como JSON dentro de uma tag com `<` escapado (não dá para fechar a tag); o sistema manda ignorar ordens nos dados; **a defesa de verdade é a validação da resposta** |
| Modelo inventa fato | Valida: link, e-mail, telefone, CNPJ/CPF, @perfil, percentual e valor em reais que não estavam nos dados são barrados; promessas ("garantido", "líder") também |
| Modelo piora o material | Recusa resposta menor que 70% do material de regras ou sem os blocos principais (canvas, cenas, mensagens, passos) |
| Resultado de dados antigos | A versão só vale para o hash dos dados atuais; se o dono mudou algo, o resultado é descartado |
| Arquivo forjado na pasta | Id conferido contra o nome do arquivo e o formato do app; metadados validados; `saida` reconstruída campo a campo |
| Gasto fora de controle | Limites acima; pedido duplicado não enfileira; reenvio é no máximo um |
| Dado do cliente indo para fora sem aviso | Consentimento específico por negócio, política de privacidade 2026-10-20, revogação que apaga o que a IA gerou |
| Alguém assumir o painel | Só `admin@admin.com` (ou `GAMEHUB_IA_ADMIN_EMAIL`) muda a configuração, **no servidor**; em produção o cadastro público recusa e-mail reservado |
| Prompt e resposta em log | O log leva só códigos de problema, nunca o texto |

**LGPD.** O envio à Anthropic (operadora, nos EUA) é uma transferência
internacional e depende de consentimento **específico e em destaque**, de
todo negócio: uma caixa própria e opcional, **desmarcada**, no cadastro, ou o
botão "Autorizar" no estúdio de qualquer material. Aceitar a política de
privacidade geral **não basta**. Sem a autorização nada é enviado: nem pedido
de usuário, nem melhoria contínua. Pela página de privacidade da Anthropic, o
conteúdo enviado pela API comercial não é usado para treinar modelos por
padrão. Isso **não vale** para contas de consumo (modo assinatura): por isso a
tela avisa que os dados passariam por uma conta de consumidor.

## 6. Operação

### Primeira vez

1. **Chave:** crie uma chave no Claude Console, com **limite mensal de gasto**
   na organização. Não use a chave de outro projeto.
2. **Publicar:** `ADMIN_EMAILS=voce@exemplo.com ./deploy/publicar.sh`. Cria
   `/opt/independent-lab/.env.ia` (modelo), sobe app e worker e confere o
   batimento. Depois: `nano /opt/independent-lab/.env.ia` (coloque a chave) e
   `/opt/independent-lab/recriar.sh ia-worker` (o `docker restart` não relê o `.env.ia`).
3. **Conta de admin:** em produção o cadastro público recusa `admin@admin.com`.
   Para criar a sua: coloque `GAMEHUB_LIBERAR_CADASTRO_ADMIN=1` em
   `/opt/independent-lab/.env`, rode `/opt/independent-lab/recriar.sh app`, cadastre-se em `/cadastro` com
   esse e-mail e uma **senha forte**, **remova a linha** e rode `recriar.sh app` de novo. (Ou use
   `GAMEHUB_IA_ADMIN_EMAIL` para outro e-mail.)
4. **Guardião:** `./deploy/instalar-guardiao.sh` instala o timer horário
   (systemd). Sem systemd: `0 * * * * /opt/independent-lab/ia-guardiao.sh`.
5. **Conferir:** entre em `/admin/ia`: o worker deve estar "Ativo, ocioso" com
   o modo `api` disponível.

### O "cron que nunca para", em três camadas

1. **Docker:** `restart: unless-stopped` nos dois containers e healthcheck do
   worker (batimento de até 2 min).
2. **Agendador interno:** o laço do app engole qualquer erro e segue; o estado
   da última varredura fica em disco (reiniciar não dispara varredura extra).
3. **Guardião do host (de hora em hora):** sobe o que estiver parado, reinicia
   o que estiver sem batimento (no máximo uma vez a cada 30 min) e **sai com
   código 2** quando só uma pessoa resolve (credencial recusada, gasto
   estourado, fila esquecida): o systemd marca a unidade como falha.

### Problemas comuns

| O que a tela ou o guardião mostra | Causa | O que fazer |
|---|---|---|
| Worker "Parado" | Container caiu ou travou | O guardião reinicia; veja `docker logs independent-lab-ia-worker` |
| Pausa `auth` | A Anthropic recusou a credencial | Pro: refaça `claude setup-token` e confira `CLAUDE_CODE_OAUTH_TOKEN`; API: confira `ANTHROPIC_API_KEY`. Depois `/opt/independent-lab/recriar.sh ia-worker` |
| Pausa `gasto` | Sem saldo ou limite do Console | Ajuste no Console; o worker retoma sozinho |
| Pausa `gasto-diario` | Teto do dia da tela atingido | Sobe o teto na tela ou espera a meia-noite UTC |
| Pausa `limite` | Limite de requisições da Anthropic | Espera sozinho; para volume alto, peça aumento de limite |
| Pausa `modo-indisponivel` | O modo escolhido não tem credencial no worker | Escolha `api` na tela ou complete a credencial |
| Fila parada | Worker vivo mas pedidos antigos | Veja a pausa acima e `docker logs` |
| "Falhas recentes": `saida-invalida` | O modelo devolveu algo que a validação barrou | Esperado de vez em quando; se frequente, revise o prompt (`GERADOR_IA_VERSAO`) |

### Backup e dados

`data/ia` está dentro de `data/`, então entra no backup diário. Guarda dado do
negócio dentro dos pedidos em andamento (o que o worker vai enviar): trate
como dado pessoal. Resultados não coletados somem em 24 h.

## 7. Limites conhecidos

- **A IA exige `GAMEHUB_DB=file`.** O estado (versões, consentimento, fila) vive
  em arquivos por negócio, e os ids de negócio do modo Supabase não têm o
  formato de pasta. No modo Supabase o material de regras segue normal e o
  refino por IA fica indisponível até ser migrado.
- **Uma instância do app** (a trava é por processo), como o resto do modo
  arquivo. O worker também é único: um pedido por vez, de propósito, para não
  esbarrar em limite de taxa.
- A varredura percorre todos os negócios do mapa a cada hora: serve para
  centenas; para milhares, vale indexar quem tem funcionário contratado.
- Chamada sem *streaming* e sem *Batch API* (que daria 50% de desconto na
  melhoria contínua): simples e suficiente para respostas de até ~12 mil
  tokens; é o próximo passo de custo.
- A tabela de preços é manual (`MODELOS_PADRAO`).
- Imagem e vídeo por IA não estão aqui: ver
  [`../integracoes/GOOGLE-VIDEO-API.md`](../integracoes/GOOGLE-VIDEO-API.md); o
  mesmo desenho de worker e pasta de troca serve para o vídeo.
- Não verificado nesta máquina: build das imagens Docker (não há Docker local),
  chamada real à API da Anthropic (sem chave; o worker foi testado contra um
  servidor HTTP local que imita a API) e o timer no systemd da VPS.

## 8. Como estender

| Quero... | Vou em... |
|---|---|
| Mudar o que a IA considera boa prática de um material | `ia/prompt.ts` (`TAREFA`) e **suba `GERADOR_IA_VERSAO`**: o que foi gerado com o prompt antigo deixa de valer |
| Aceitar um bloco novo na resposta | `BLOCOS_POR_TIPO` e `VARIANTES` em `ia/prompt.ts`, e o `case` em `ia/validar.ts` |
| Trocar o preço ou o parâmetro `thinking` de um modelo | `MODELOS_PADRAO` em `ia/config.ts` |
| Adicionar um modelo à lista do admin | `MODELOS_PADRAO` (o nome mostrado em `ia/aplicar.ts`) |
| Novo material com IA | Gerador de regras (ver `ENTREGAVEIS.md`), `TAREFA`, `BLOCOS_POR_TIPO` e teste em `servico-ia.test.ts` |

## 9. Testes

| Arquivo | Garante |
|---|---|
| `ia-worker/worker.test.ts` | Chamada à API, 429/401/529, nova tentativa, pausa, teto de gasto, ordem da fila, órfãos, modo assinatura sem vazar a chave |
| `ia/validar.test.ts` | Cada ataque (link, e-mail, telefone, CNPJ, @perfil, percentual, HTML, injeção), estrutura e regressão |
| `ia/servico-ia.test.ts` | Ponta a ponta com o worker real e uma API simulada: pedir, coletar, reenviar, obsoleto, consentimento, limites, varredura |
| `ia/agendador.test.ts` | Cadência de uma hora, fila ocupada, worker parado, laço único |
| `ia/config.test.ts`, `ia/actions.test.ts`, `lib/admin.test.ts` | Configuração validada; só o admin da IA altera; cadastro de e-mail reservado |
| `app/api/ia/rota.test.ts` | Rota: sessão, mesma origem, consentimento, limite, entrega da versão de IA |
| `deploy/ia-guardiao.test.ts` | O guardião, com `docker` falso |

## Validação por tipo de negócio e saldo de teste

**Matriz de negócios** (`ia/matriz-negocios.test.ts`): 10 perfis (salão, padaria, eletricista,
clínica, contabilidade, pet shop, construtora, TI, marmitaria, ateliê) × 5 materiais. Para cada
um confere que o pedido leva o nome, a cidade e as ofertas daquele negócio e **nada** de outro,
que devolver o material de regras como "melhoria" é aceito pelo validador (rede de segurança) e
que o pedido mais pesado fica abaixo de 9 mil tokens de entrada. Medido em 20/10/2026: de 5,5 a
6,2 mil tokens de entrada; no teto de saída (12 mil tokens) um refino custa até ~US$ 0,13 no
Sonnet (só equivalência na assinatura). Rode com `MATRIZ_RELATORIO=1` para ver os números.
Achado e corrigido: o prompt fixo citava um nome de salão como exemplo, o que poderia
contaminar o texto de outros negócios (agora é neutro; `GERADOR_IA_VERSAO` = 2).
O que a matriz **não** prova: a qualidade do texto que o modelo real devolve. Isso só se vê com
`node ia-worker/verificar.mjs --chamada` e uma conta logada.

**Saldo de teste.** Em `/admin/ia` (só o admin da IA, só fora de produção) o botão "Creditar
saldo de teste" soma 5 milhões de moedas virtuais, 1 milhão de XP e 4 degraus ao negócio do
próprio admin, por `aplicarProgresso`. É moeda do jogo, não crédito de API nem R$. Em
produção a ação é recusada no servidor.
