# Relatório de segurança e preparo para produção — outubro de 2026

> **Escopo:** auditoria do `independent-lab` (fork do labdatadev-gamehub) e da
> VPS compartilhada onde ele vai rodar, correção do que era corrigível no
> código e empacotamento para produção.
> **Branch:** `seguranca-producao` (commits locais, nada foi enviado ao remoto).
> A reescrita dos entregáveis (seção [Entregáveis dos Funcionários de IA](#entregáveis-dos-funcionários-de-ia))
> está na branch `entregaveis-profissionais`, criada a partir dela.
> **Data:** 19/10/2026.

## Resumo

O projeto nunca tinha ido para produção. A auditoria achou **três falhas
críticas**, cinco altas e várias médias; todas as que dependem só do código
estão **corrigidas e cobertas por teste**. O que sobra depende de uma decisão
ou de uma ação sua em ambiente real (a VPS), e está listado em
[Pendências](#pendências-e-riscos-aceitos). Nada foi aplicado na VPS.

| Gate | Resultado |
|---|---|
| `npm run typecheck` | limpo |
| `npm test` | 657 testes em 48 arquivos, todos passando (358 na auditoria; o resto cobre os entregáveis, o worker e a IA) |
| `npm run build` | passa (Next 15.5.28) |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades |

## Achados e status

Legenda: **Corrigido** = mudança feita, testada e verificada; **Pendente** =
depende de ação sua ou de infraestrutura; **Aceito** = risco conhecido e
documentado.

### Críticos

| # | Achado | Status | Correção e evidência |
|---|---|---|---|
| C1 | O link de convite (que circula por WhatsApp) era aceito como cookie de sessão: sessão e convite usavam o mesmo formato e o mesmo segredo, e `lerSessao` não validava campos. Quem recebia o link virava dono do negócio que convidou. | **Corrigido** | `src/lib/auth/assinatura.ts`: uma chave derivada por propósito (`independent-lab:<proposito>`), `typ` e `exp` no payload, comparação com `timingSafeEqual`. `sessao.ts` valida a forma e expira em 7 dias. Teste: `sessao.test.ts` (token de convite como sessão é rejeitado, sessão expirada é rejeitada). |
| C2 | Next 15.5.22 com execução remota de código (GHSA-2xp9-vwfh-vxw4, GHSA-p293-qw3h-jr36). | **Corrigido** | Next 15.5.28; `postcss` forçado via `overrides`; `npm audit --omit=dev` = 0. |
| C3 | Qualquer e-mail que contivesse "demarchi" virava administrador (`src/lib/admin.ts`). | **Corrigido** | Só a lista `GAMEHUB_ADMIN_EMAILS` vale. Teste `admin.test.ts` agora exige a **negação** da regra antiga. Vazio = ninguém é admin. |

### Altos

| # | Achado | Status | Correção e evidência |
|---|---|---|---|
| A1 | `recompensar()` podia ser chamado em laço pelo cliente, pagando XP e moeda sem limite. | **Corrigido** | `features/gamificacao/guarda.ts`: o cliente só dispara 4 eventos (`EVENTOS_DO_CLIENTE`), cada um com checagem de elegibilidade no servidor; os de marco pagam uma vez por negócio (`registrarMarco`). Teste: `guarda.test.ts`. No modo Supabase depende da migração `0027_marcos.sql` (ver Pendências). |
| A2 | Login e cadastro sem limite de tentativas. | **Corrigido** | `src/lib/limite.ts` + `features/auth/actions.ts`: login 30/10 min por IP, 8 falhas/15 min por e-mail, cadastro 5/h por IP. IP confiável = última entrada de `X-Forwarded-For` (a que o Caddy grava). Verificado no navegador: a 9ª tentativa é bloqueada. Teste: `limite.test.ts`. |
| A3 | O banco em JSON podia apagar todas as contas: `lerJson` engolia erro de parse, a escrita não era atômica e não havia trava; cadastros simultâneos sobrescreviam uns aos outros. | **Corrigido** | `src/lib/db/arquivo.ts`: escrita atômica (temporário + `fsync` + `rename`, modo 0600, `.bak`), leitura que **falha alto** em arquivo corrompido, trava reentrante envolvendo toda escrita do `FileRepository`. Cadastro cria a credencial primeiro e desfaz se o resto falhar. Teste: `arquivo.test.ts` (50 cadastros simultâneos, corrupção, duplo gasto). **Checagem de mutação:** desligar a trava faz 3 desses testes falharem, então eles medem de verdade. |
| A4 | `tenantId` ia sem validação para caminhos de arquivo (travessia de diretório). | **Corrigido** | `pastaTenant` exige 24 hex. Teste em `arquivo.test.ts`. |
| A5 | Node 20 fora de suporte. | **Corrigido** | Node 24 (`.nvmrc`, `engines`, `Dockerfile`). |

### Médios e baixos

| # | Achado | Status | Correção e evidência |
|---|---|---|---|
| M1 | Segredo com valor padrão no repositório. | **Corrigido** | `GAMEHUB_SECRET` não tem padrão (mínimo 32 caracteres). `lib/ambiente.ts` + `instrumentation.ts` recusam o boot sem ele. `iniciar.bat`/`.sh` e `predev` geram um segredo local. Verificado: o servidor de produção recusa subir sem o segredo. |
| M2 | Sem cabeçalhos de segurança. | **Corrigido** | `next.config.mjs`: CSP, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP, sem `X-Powered-By`. HSTS fica no Caddy. Verificado com `curl -I`. |
| M3 | Dados de outros negócios expostos em visita, vizinhos do hub e imagem de conquista. | **Corrigido** | Formatos reduzidos (`VizinhoPublico`, `PitchIA` calculado no servidor); `/api/og/conquista` respeita `perfilPublico`. |
| M4 | Entradas sem validação (onboarding, ofertas, slot da sede, contato, cadastro). | **Corrigido** | `src/lib/validacao.ts` e checagens nas actions (sem teste de unidade dedicado a esses validadores: é uma lacuna). |
| M5 | Evento global sem limites de tamanho e com autor exposto aos jogadores. | **Corrigido** | Limites em `eventos-globais/validacao.ts` (teste: `validacao.test.ts` da mesma pasta); `criadoPor` sai do que vai ao jogador. |
| M6 | Capítulo da história liberável antes da hora. | **Corrigido** | `historia/actions.ts` só entrega capítulo já entregue ou liberado pelo relógio. |
| M7 | Hash de senha fraco para 2026. | **Corrigido** | scrypt N=2^15, r=8, p=3 com rehash transparente no login e tempo igual para e-mail inexistente. *Desvio do plano:* o plano falava em N=2^17; escolhi 2^15 porque a VPS é compartilhada e 2^17 custa ~128 MB por login. |
| M8 | Cliente Supabase com chave de serviço importável no navegador. | **Corrigido** | `lib/supabase/client.ts` só roda no servidor; `navegador.ts` lê as variáveis públicas literalmente. |
| M9 | Seed de demonstração com senha fixa e rodável em produção. | **Corrigido** | A senha vem de `SEED_DEMO_SENHA` e o seed recusa `NODE_ENV=production`. |
| M10 | Fontes carregadas do Google no navegador de cada jogador (vazamento de IP e domínio externo na CSP). | **Corrigido** | `next/font` serve as fontes do próprio domínio. Ver o risco de build em Pendências. |
| M11 | Deploy antigo assumia VPS dedicada (Nginx na 80, certbot, `ufw` global, root) e quebraria os outros ~40 containers. | **Corrigido** | Removidos `vps-setup.sh`, `deploy.sh`, `ecosystem.config.js`, `nginx.conf.template` e o deploy automático por SSH. Novo fluxo em container isolado (`deploy/README.md`). |
| M12 | CI com ações sem versão fixa e deploy automático por SSH. | **Corrigido** | `.github/workflows/ci.yml`: só verifica, permissões `contents: read`, ações fixadas por SHA, `npm audit` no gate. |
| M13 | `instrumentation.ts` quebrava o `next dev` (puxava `node:crypto` para o bundle Edge). | **Corrigido** | Achado durante a verificação final; `SEGREDO_MIN` agora mora em `lib/auth/segredo-min.ts`, sem imports. Commit `90e5fcf`. |
| B1 | Vulnerabilidades só de **desenvolvimento** (Tailwind 3 e dependências do `postcss-js`, como `braces` e `chokidar`). | **Aceito** | Só afetam a máquina de desenvolvimento, não o que roda em produção (`--omit=dev` = 0). Sai junto com a migração para Tailwind 4. |

### A VPS (achados de infraestrutura)

Estado medido em 19/10/2026, só leitura:

| # | Achado | Status |
|---|---|---|
| V1 | `PermitRootLogin yes` e `PasswordAuthentication yes`: o root aceita senha, exposto à internet. | **Pendente — sua ação** |
| V2 | Sem `fail2ban` e `MaxAuthTries 6`. | **Pendente — sua ação** |
| V3 | `unattended-upgrades` está instalado, mas a política de atualização e de reinício não está fixada por configuração do projeto. | **Pendente — sua ação** |
| V4 | Sem firewall de host. | **Aceito** (ver nota) |

Os itens V1 a V3 têm correção pronta em `deploy/vps-hardening.sh`: por padrão
**só mostra o estado e o que mudaria**; aplica com `--aplicar`. Ele recusa
rodar se o root não tiver chave autorizada (travas contra se trancar para
fora), valida a configuração com `sshd -t` antes de recarregar, isenta o IP da
sessão atual no `fail2ban` e não reinicia a máquina. Foi executado na VPS **só
em modo de simulação**, e nada foi alterado lá.

> **V4, por que não liguei o `ufw`:** o Docker publica portas por fora do
> `ufw`, então a regra não protegeria os containers, e uma política padrão de
> bloqueio derrubaria os projetos dos outros. A alternativa correta é a cadeia
> `DOCKER-USER`, e isso precisa ser combinado com os donos dos outros
> projetos.

## Verificação feita

Em modo de produção local (servidor standalone, dados temporários):

- o boot é recusado sem `GAMEHUB_SECRET`;
- `/api/health` responde 200 com a versão;
- todos os cabeçalhos de segurança presentes, sem `X-Powered-By`;
- `/_next/image` devolve 404 (otimizador desligado de propósito);
- cadastro em 11 passos, `/painel` e `/world` funcionam;
- usuário fora da allowlist é barrado em `/admin/eventos`;
- cookie de sessão é `httpOnly`;
- `eval` é bloqueado pela CSP e o World ainda renderiza (o Pixi usa a variante
  sem `new Function`);
- o limite de tentativas de login dispara na 9ª tentativa.

O que **não** foi testado: a imagem Docker (não há Docker local; ela é
construída na VPS pelo `publicar.sh`), a recarga do Caddy em produção (testada
só num container descartável na VPS, onde `caddy validate` devolveu "Valid
configuration" e a remoção devolveu o arquivo byte a byte) e o modo Supabase.

## Checklist de produção

Antes de abrir para o público, nesta ordem:

1. [ ] **Hardening do SSH:** `bash vps-hardening.sh` (simulação), conferir,
   depois `--aplicar`, mantendo uma segunda sessão aberta para confirmar o
   acesso por chave.
2. [ ] **Publicar:** `ADMIN_EMAILS=voce@exemplo.com ./deploy/publicar.sh`.
   O `.env` de produção é criado na VPS com um `GAMEHUB_SECRET` **novo**,
   gerado lá. Não copie o `.env` do seu computador: qualquer convite ou sessão
   emitida com o segredo de desenvolvimento deixa de valer, e é isso que se
   quer.
3. [ ] **HTTPS:** `./deploy/borda-caddy.sh` (recarga a quente do Caddy, sem
   recriar o container da Vitrine).
4. [ ] **Conferir:** `curl -I https://lab.2-25-146-39.sslip.io/api/health`,
   cabeçalhos presentes e a Vitrine ainda em 200.
5. [ ] **Backup fora da VPS:** `rsync` da pasta `backups/` para outro lugar
   (cifrado: tem dados pessoais, LGPD). O backup diário dentro da VPS não
   protege contra perder o disco.
6. [ ] **Depois de atualizar a Vitrine**, rodar `borda-caddy.sh` de novo: ela
   recria o container do Caddy e o bloco do `independent-lab` some.
7. [ ] **Testar um rollback** uma vez, de propósito, para não ser a primeira
   vez no dia em que precisar.

## Pendências e riscos aceitos

| Item | Por que importa | Como resolver |
|---|---|---|
| Migrações `0026_negocios_rls_fachada.sql` e `0027_marcos.sql` não aplicadas | Só afetam o modo `GAMEHUB_DB=supabase`. Sem a 0027, o pagamento único de marcos não funciona nesse modo. | Aplicar em ordem no Supabase antes de trocar de modo. |
| Supabase: políticas de UPDATE nas tabelas de economia e presença realtime privada | Em Supabase, um jogador autenticado poderia escrever direto na própria economia. No modo `file` (o de produção hoje) o risco não existe. | Revisar RLS das tabelas de economia; trocar o canal de presença por canal privado com autorização. |
| **Uma instância só** no modo `file` | A trava é interna ao processo. Duas instâncias sobre a mesma pasta perdem dado. O limitador de tentativas também é por processo e zera ao reiniciar. | Manter uma instância. Para escalar, migrar para Supabase e mover o limitador para armazenamento compartilhado. |
| CSP com `'unsafe-inline'` em scripts | O App Router do Next injeta scripts inline e sem nonce a CSP não pode ser mais estrita. Reduz a proteção contra XSS, mas as demais barreiras ficam (`object-src 'none'`, `frame-ancestors 'none'`, `base-uri`, `form-action`). | Adotar nonce por requisição no middleware (custo: perde páginas estáticas). |
| ESLint não configurado | `npm run lint` não existe de fato; só o TypeScript estrito pega erro. | Adicionar `eslint-config-next` e regras de segurança, e incluir no CI. |
| O `next build` depende do Google Fonts | Em 19/10/2026 um build falhou uma vez por erro transitório na busca das fontes e passou na repetição. Na VPS isso derruba o deploy (o `publicar.sh` aborta antes de trocar o container, então a versão antiga continua no ar). | Trocar por `next/font/local`. Os arquivos da Nunito já estão em `src/assets/fonts/` (baixados com a sua autorização para os slides), então só falta a migração; o Press Start 2P ainda precisaria ser baixado. |
| `sslip.io` | Serviço de terceiros; compartilha limite de emissão de certificado. | Domínio próprio quando for algo duradouro. |
| Vulnerabilidades só de desenvolvimento | Ver B1. | Migrar para Tailwind 4. |

## Contas de teste criadas localmente

A pedido, criei duas contas **somente no ambiente local**, na pasta `data/`
(que está no `.gitignore` e é excluída da imagem Docker) e na pasta temporária
do servidor de teste:

- `admin@admin.com`
- `admin@gmail.com`

As senhas são fracas de propósito (escolhidas por você para teste) e foram
criadas direto pelo provedor de autenticação, sem passar pela regra de 8
caracteres do formulário de cadastro, que continua valendo. Os dois e-mails
foram colocados em `GAMEHUB_ADMIN_EMAILS` no `.env` **local** (também fora do
Git). **Não crie essas contas na VPS** e não copie esse `.env` para lá.

## Entregáveis dos Funcionários de IA

Revisão feita depois da auditoria: Canvas, POPs, carrosséis, kit comercial e
roteiro de vídeo passaram a ser gerados em camadas, a partir do contexto do
usuário logado. A superfície nova é a rota `/api/entregavel/[tipo]`, que
devolve dado de cadastro do negócio (inclusive respostas privadas) e gera
imagens com CPU do servidor compartilhado. Resumo do que a protege (detalhe e
tabela completa em [`../equipe-ia/ENTREGAVEIS.md`](../equipe-ia/ENTREGAVEIS.md)):

| Risco | Controle | Teste |
|---|---|---|
| Ler o material de outro negócio | tenant só da sessão; parâmetro de tenant na URL ou no corpo é ignorado | `rota.test.ts` |
| Gerar sem contratar, ou subir de nível | cargo contratado e nível lidos do banco | `rota.test.ts` |
| Vazar resposta privada num post | `ContextoPublico` não tem o campo `privado`; o linter confere o texto | `documentos.test.ts`, `contexto.test.ts` |
| CSRF | `POST` só da mesma origem | `rota.test.ts` |
| Esgotar CPU | 40 pedidos/min por negócio, 24/min para imagens, corpo máximo de 24 000 bytes | `rota.test.ts` |
| XSS e injeção no material | escape na saída em HTML, Markdown e estúdio; CSP própria no HTML baixado | `render.test.ts` |
| ZIP com caminho malicioso | nomes ASCII e rejeição de nome que escapa da pasta | `render.test.ts` |
| Promessa ou dado inventado | linter bloqueia promessa; o plano não cria meta numérica | `documentos.test.ts`, `mercado.test.ts` |

Verificação em produção local (servidor `standalone`): as fontes da Nunito
entram no pacote, o PNG sai com a fonte certa, sem login a rota responde 401
com os cabeçalhos de segurança e `private, no-store`, tipo inexistente é 404 e
`POST` de outra origem é 403.

Limites: a versão-base vem de regras e de uma base de conhecimento (8
segmentos, 13 nichos); o refino por modelo de linguagem é a seção seguinte. O
vídeo gerado por IA está só projetado (`../integracoes/GOOGLE-VIDEO-API.md`),
sem chave nem chamada no repositório.

## IA dos Funcionários (Claude)

Os materiais passaram a poder ser **refinados por IA** a partir do contexto
registrado de cada conta, a pedido e por uma melhoria contínua de hora em hora.
Guia completo: [`../equipe-ia/IA-OPERACAO.md`](../equipe-ia/IA-OPERACAO.md).

### Decisão que precisa do seu olho: a assinatura Pro

O pedido original era usar a assinatura Claude Pro da VPS por padrão. A página
oficial de termos do Claude Code
([legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance),
20/10/2026) diz que a Anthropic **não permite** rotear requisições dos usuários
de um produto por credenciais Free, Pro ou Max, e que pode agir sem aviso. O
risco recai sobre a conta inteira. Você escolheu: **API como padrão e a
assinatura como opção do admin**. A assinatura existe, mas exige duas
confirmações (`IA_PERMITIR_ASSINATURA=1` no worker e a escolha na tela, que
mostra o aviso) e nunca é ligada sozinha.

### Superfície nova e controles

| Risco | Controle | Teste |
|---|---|---|
| Vazar a chave da Anthropic | Só o worker a tem; o app recusa subir em produção com ela; o worker só aceita base https (ou loopback) | `ambiente.test.ts`, `worker.test.ts` |
| Assinatura vencer a chave sem aviso | O ambiente do `claude -p` nunca herda `ANTHROPIC_API_KEY`; `--bare` não é usado (ignora o token OAuth) | `worker.test.ts`; CLI real v2.1.226 aceitou as flags |
| Prompt injection pelo nome ou pelas ofertas | Texto do usuário como JSON em tag com `<` escapado, e a validação da resposta como defesa de verdade | `servico-ia.test.ts`, `validar.test.ts` |
| Resposta com link, e-mail, telefone, CNPJ, @perfil, percentual ou valor inventados, promessa, HTML | `ia/validar.ts` barra; reenvio único com o motivo; depois descarta | `validar.test.ts` |
| Dado privado em material público | `ContextoPublico` (tipo sem `privado`) e linter | `servico-ia.test.ts` |
| Resultado forjado na pasta de troca | Id conferido contra o nome do arquivo e o formato; metadados validados | `config.test.ts` |
| Dados novos enquanto o pedido esperava | Hash do contexto; resultado velho é descartado | `servico-ia.test.ts` |
| Dados do cliente indo ao exterior sem consentimento | Consentimento específico por negócio (caixa opcional e desmarcada no cadastro, ou botão no estúdio); política 2026-10-20; revogar apaga o que a IA gerou | `servico-ia.test.ts`, `rota.test.ts` |
| Gasto fora de controle | Pedidos por negócio por dia, por varredura, por dia total, teto de gasto diário que para o worker, e o limite mensal do Console | `worker.test.ts`, `servico-ia.test.ts` |
| Alguém assumir a tela de IA | Só `admin@admin.com` (ou `GAMEHUB_IA_ADMIN_EMAIL`), **no servidor**; em produção o cadastro público recusa e-mail reservado, com a mesma mensagem de "já existe" | `actions.test.ts`, `admin.test.ts` |
| Cobrança por requisição ligada por engano | `cobrarPorRequisicao` é sempre `false`: nem o arquivo nem o formulário ligam | `config.test.ts`, `actions.test.ts` |
| IA parar sem ninguém saber | Docker reinicia; o agendador engole erro e segue; o guardião de hora em hora reinicia e sai com código 2 quando só uma pessoa resolve | `ia-guardiao.test.ts` |

### Defeito corrigido no que eu tinha entregue antes

`deploy/compose.yml` tinha `image: ${IMAGEM:?defina IMAGEM (ex.: ...)}` sem
aspas: o `: ` dentro do valor é erro de YAML. Nunca foi pego porque não há
Docker nesta máquina; o primeiro `publicar.sh` teria falhado. Validei com um
parser YAML, corrigi (aspas) e confirmei o isolamento do worker (somente
leitura, sem capabilities, só a rede própria, sem porta, app sem nenhuma
referência à Anthropic).

### Pendências desta parte

- **Chave da Anthropic e limite mensal no Console:** é com você. Sem chave o
  worker espera e a tela mostra "modo sem credencial".
- **Nada foi aplicado na VPS.** Faltam `publicar.sh`, a chave em `.env.ia`, a
  criação da conta de admin (com `GAMEHUB_LIBERAR_CADASTRO_ADMIN=1`, por um
  instante) e `instalar-guardiao.sh`.
- **Não verificado aqui:** o build das imagens Docker, a chamada real à API
  (o worker foi testado contra um servidor HTTP local que imita a API) e o
  timer no systemd.
- A política de privacidade foi atualizada (2026-10-20). Vale uma leitura
  jurídica antes de abrir para o público, como em qualquer texto de LGPD.

## O que mudou onde

| Área | Principais arquivos |
|---|---|
| Sessão, convite e segredo | `src/lib/auth/{assinatura,sessao,segredo-min}.ts`, `src/features/growth/convite.ts` |
| Admin e eventos globais | `src/lib/admin.ts`, `src/features/eventos-globais/` |
| Recompensas | `src/features/gamificacao/{guarda,actions}.ts`, `supabase/migrations/0027_marcos.sql` |
| Limite de tentativas | `src/lib/{limite,requisicao,validacao}.ts`, `src/features/auth/actions.ts` |
| Banco em arquivo | `src/lib/db/{arquivo,file-adapter}.ts` |
| Ambiente e saúde | `src/lib/ambiente.ts`, `src/instrumentation.ts`, `src/app/api/health/route.ts` |
| Cabeçalhos | `next.config.mjs` |
| Container e deploy | `Dockerfile`, `deploy/{compose.yml,publicar.sh,borda-caddy.sh,vps-hardening.sh,README.md}` |
| CI | `.github/workflows/ci.yml` |
| Gráfico e acessibilidade | ver `docs/world/PLANO-EVOLUCAO-GRAFICA.md` |
| Entregáveis | `src/features/equipe-ia/entregaveis/`, `src/features/equipe-ia/estudio/`, `src/app/api/entregavel/[tipo]/route.ts`, `src/assets/fonts/` |
| Integração de vídeo (projeto) | `docs/integracoes/GOOGLE-VIDEO-API.md` |
| IA (worker, fila, validação, agendador, admin) | `ia-worker/`, `src/features/equipe-ia/ia/`, `src/app/admin/ia`, `src/app/api/ia`, `deploy/{ia-guardiao.sh,instalar-guardiao.sh,ia.env.example,systemd}` |
