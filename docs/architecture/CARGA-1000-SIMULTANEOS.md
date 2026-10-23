# Carga real — presença simultânea (Épico 13, Escala e Replicação)

> Medido de verdade nesta VPS (labd.cloud) em 2026-08-01, contra o stack
> local completo (`docker-compose.yml` + `docker-compose.supabase.yml`, 3
> réplicas de app, Supabase self-hosted vendorizado) — nunca contra
> produção. Sem go-live: todo o stack subiu, foi medido e caiu de volta no
> mesmo turno (ver §5). Mesmo princípio de
> [`DBA-ARQUITETURA-ESCALA-2026.md`](DBA-ARQUITETURA-ESCALA-2026.md): "não
> prometer o que não foi medido".

## 1. Resumo executivo

**1000 conexões simultâneas de presença (Supabase Realtime) funcionam nesta
VPS — 0 falhas em 3 rodadas (100, 500, 1000) — mas a latência de conexão
degrada de forma real e mensurável a partir de algumes centenas.** Não é
"não aguenta"; é "aguenta com uma latência que já vale a pena vigiar antes
de crescer mais".

| VUs simultâneos | Taxa de sucesso | `ws_connecting` médio | `ws_connecting` p95 | CPU `realtime` (amostra) |
|---|---|---|---|---|
| 100 | 100% (233/233 sessões) | 3.04ms | 4.06ms | não amostrado (uso trivial) |
| 500 | 100% (1166/1166 sessões) | 2.82ms | 3.96ms | 7.14% de 1 cpu |
| 1000 | 100% (1988/1988 sessões) | **258.05ms** | **310.36ms** (máx 10.55s) | 19.12% de 1 cpu (amostra em meio à rampa, não no pico) |

Tráfego HTTP concorrente (`/api/health` através do Nginx, 3 réplicas do
app): **0% de erro em todas as rodadas**, `p95` sempre abaixo de 14ms — o
gargalo observado é 100% do lado da conexão Realtime, não do app/Nginx.

## 2. Achado real mais importante desta rodada — bug de infraestrutura, não de capacidade

Antes de qualquer número de carga, **a presença ao vivo não funcionava
nenhuma vez** contra o Supabase self-hosted vendorizado — `MissingAPIKey`
no Realtime a cada tentativa de handshake, mesmo com `apikey` correto na
URL. Causa raiz: `deploy/supabase/kong.yml`, rota `realtime-v1`, tinha
`hide_credentials: true` (copiado do padrão de `rest-v1`) — Kong autentica
o `apikey`, mas então o REMOVE antes de repassar pro upstream. PostgREST não
liga pra isso (só olha o JWT), mas o Realtime faz sua própria checagem de
`apikey` e rejeitava toda conexão, sempre, silenciosamente (nenhum teste de
tipo/sintaxe pega isso — só apareceu rodando handshake real).

**Consequência prática:** `GH-MULTI-02/03` (presença ao vivo, já
implementada em código) **nunca teria funcionado em nenhum deploy real**
até este achado — não é um problema de escala, era um bloqueador total,
escondido atrás de "o resto do stack está saudável". Corrigido trocando
`hide_credentials` para `false` só nesta rota (comentário completo no
próprio `kong.yml` explica por que isso não abre superfície de ataque nova —
o portão de entrada continua sendo `key-auth`+`acl`).

**Isto é o motivo pelo qual "rodar de verdade" (Fase 3) não é opcional** —
nenhum cálculo de capacidade acharia este bug; só uma conexão WebSocket real
contra o stack real.

## 3. Metodologia

- Script: [`deploy/loadtest/presenca-k6.js`](../../deploy/loadtest/presenca-k6.js)
  (k6, via `docker run grafana/k6`, sem instalar nada global).
- Cada VU do cenário `presenca` abre 1 canal Realtime Presence
  (`sede:<tenantId>`), com handshake `phx_join` fiel ao payload real de
  `RealtimeChannel.subscribe()` (conferido contra
  `node_modules/@supabase/realtime-js`), seguido de `track()` com o payload
  mínimo `{ tenantId, nome }` (mesma whitelist de
  [`BMAD-MULTIPLAYER-VPS.md`](BMAD-MULTIPLAYER-VPS.md) §2) — mantém a
  conexão aberta com heartbeat, depois fecha.
- Protocolo `vsn=1.0.0` (JSON simples) em vez do `2.0.0` binário (default
  do client real) — mesmo custo de conexão/join/heartbeat no servidor, sem
  reimplementar o serializer binário do Phoenix. **Aproximação documentada,
  não teste de compatibilidade de protocolo.**
- VUs distribuídos entre `NUM_BAIRROS` canais diferentes (20/60/120 nas 3
  rodadas) — nunca um canal global, mesmo desenho do produto real (cada
  bairro/sede é seu próprio canal).
- Cenário `http_geral` em paralelo martela `/api/health` através do Nginx
  (valida `deploy.replicas` do app da Fase 2 ao mesmo tempo).
- Rampa: 20s subindo, 30s no platô, 10s descendo — não é pico instantâneo.

## 4. O que os números realmente dizem (e o que NÃO dizem)

- **0 falhas em qualquer rodada** — o Realtime aceita e mantém 1000 conexões
  sem recusar nenhuma, dentro dos limites de recurso já aplicados na Fase 2
  (`mem_limit`/`cpus` do `realtime`/`kong`/`db`).
- **A degradação de latência de conexão (3ms → 258ms) aparece só perto de
  1000**, não em 500 — não é uma curva linear óbvia; sugere um limiar entre
  500 e 1000 que vale investigar antes de qualquer piloto regional real
  chegar perto desse volume. Hipóteses não testadas aqui (próximo passo,
  não conclusão): contenção no `db` (`max_connections`/lock de metadado do
  Realtime), contenção de CPU do host compartilhado com o resto da frota
  desta VPS (não isolado nesta medição), ou o próprio `k6` rodando de um
  único processo/container como cliente (1000 handshakes TLS/HTTP quase
  simultâneos do MESMO processo cliente é, em si, uma fonte de latência que
  não existiria com 1000 clientes reais espalhados).
- **A amostra de CPU/memória do `realtime` em 1000 VUs foi tirada em MEIO à
  rampa (~40s de um teste de ~80s), não no pico sustentado** — não afirmo
  aqui "19% de CPU no pico de 1000", só "19% de CPU em algum ponto da subida
  até 1000". Medir o pico sustentado de verdade é o próximo passo, não algo
  já feito.
- **App/Nginx nunca foram o gargalo** em nenhuma rodada — a Fase 2
  (réplicas + resolver dinâmico) está validada para o volume de HTTP
  concorrente testado.

## 5. O que este teste NÃO cobriu (registrado para não fingir que cobriu)

- Não testou o app real conectando `supabaseAnon()` do BROWSER (só simulou
  o protocolo Phoenix diretamente) — o client real (`vsn=2.0.0`, protocolo
  binário) pode ter custo de conexão diferente do simulado aqui.
- Não testou em produção/VPS hospedada de verdade com domínio — só
  local, `127.0.0.1`, sem latência de rede real de usuários espalhados
  geograficamente (que reduziria a contenção do lado cliente descrita
  acima, mas soma latência de rede real).
- Não isolou o gargalo da degradação em 1000 VUs (§4) — é um achado a
  investigar, não uma causa raiz confirmada.
- Não testou o cenário adversarial (reconexão em massa após queda de rede,
  ex.: reboot da VPS com 1000 sessões ativas).
- Todo o stack (app, nginx, Supabase) foi derrubado (`docker compose down`,
  incluindo `-v` no Supabase — dado 100% sintético desta sessão) ao final
  deste teste — nada ficou no ar. Repetir esta medição exige subir o stack
  de novo (`./deploy/supabase-up.sh` + `docker compose ... up -d --wait`).

## 6. Próximo gatilho real

Investigar a degradação de latência entre 500–1000 (§4) **antes** de
qualquer piloto regional que espere de fato centenas de jogadores na mesma
janela de horário — não é bloqueante para o volume atual (piloto/demo,
dezenas de negócios cadastrados), mas é o item que separa "testado até 1000"
de "confiável em 1000 todo dia".
