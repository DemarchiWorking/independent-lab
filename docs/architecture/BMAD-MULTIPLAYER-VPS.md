# BMAD — Multiplayer Real + VPS/Supabase (Business · Model · Architecture · Development)

> Documento estratégico, não um card de backlog. Objetivo: decidir o
> melhor caminho para **multiplayer via programação** rodando em
> **VPS + Supabase**, otimizando para **escalabilidade, simplicidade,
> poder de negócio, entrega de valor ao cliente e inovação** — nessa
> ordem de peso quando houver conflito (simplicidade vence inovação
> chamativa; poder de negócio vence escala prematura).
>
> Não repete a pesquisa de mercado já feita em
> [`world/EVOLUCAO-MOTOR-2026.md`](../world/EVOLUCAO-MOTOR-2026.md) — este
> documento a REFERENCIA e a traduz em sequência de execução. Se as duas
> divergirem no futuro, aquele é o documento de pesquisa (mais profundo);
> este é o documento de decisão (mais prático).

---

## 1. Business — por que multiplayer, por que agora

**O que já existe hoje** (sem multiplayer real): `GH-WORLD-06` (visitar a
sede de um vizinho) já funciona — mas é uma "foto", não uma presença viva.
Cada visitante vê a sede como ela está, sozinho; não vê OUTROS visitantes
ao mesmo tempo. É Habbo sem o "Habbo" — falta a prova social de gente de
verdade circulando ao mesmo tempo que você.

**Valor de negócio direto:**
- **Retenção** — a própria pesquisa já feita cita D30 de 30–40% para quem
  faz live ops/presença bem, contra 15–25% de média (`EVOLUCAO-MOTOR-2026.md`
  §3.7). Presença ao vivo é o degrau mais barato dessa escada.
- **Prova social para o pitch Sebrae** — "você não está sozinho no
  ecossistema" é uma frase muito mais forte ao vivo, com avatares reais
  andando, do que como promessa em slide.
- **Custo marginal ~zero** — o achado da pesquisa (§3.5) continua válido:
  Supabase Realtime Presence não exige infraestrutura nova além do projeto
  Supabase que o Épico 9 (deploy) já vai provisionar de qualquer forma.

**Risco de NÃO fazer:** nenhum risco de prazo — é aditivo, não bloqueia o
pitch. O risco real é o oposto: tentar fazer rápido demais e vazar dado
privado de outro tenant no primeiro recurso que roda no browser (ver §3.3).

**Poder de negócio vs. simplicidade — a escolha feita:** dava para
prometer "multiplayer completo" (chat, co-edição de sede, sincronização
sub-100ms). Rejeitado de propósito — seria overengineering para o estágio
atual. O corte é: **presença (quem está aqui agora), não sincronização de
ação**. Cada visitante ainda anda
sozinho na própria simulação local; o que é real é SABER que tem gente de
verdade nas outras sedes ao mesmo tempo. Se um dia precisar de
sub-100ms real, o gatilho para trocar de arquitetura já está documentado
(§3.5 do doc de pesquisa: Colyseus, só se aparecer essa necessidade).

---

## 2. Model — o que muda no domínio

**Presença é efêmera, nunca persistida.** Mesmo princípio já usado nesta
sessão para conquistas (`GH-GROW-03`, sem tabela própria) e para a posição
do avatar do dono (`GH-WORLD-05`, "avatar é projeção, não estado novo") —
"quem está na sala agora" não sobrevive a um refresh, e não precisa
sobreviver. Não há migration nova neste plano.

**Escopo do canal = 1 sede = 1 tenant.** Cada sala de presença é
`sede:<tenantId>` — nunca um canal global "todo mundo online". Isso já
evita, por design, que presença vaze quem está em QUAL sede (informação
que, cruzada, poderia revelar padrão de uso privado).

**Whitelist idêntica à já estabelecida em `GH-GROW-01`/`GH-GROW-03`:** o
payload de presença carrega só `{ tenantId, nome }` — nunca atributos, XP,
moeda ou dado de onboarding. Mesma disciplina, mesmo motivo.

---

## 3. Architecture — a decisão técnica

### 3.1 Supabase Realtime Presence (decisão já tomada, mantida)

Reafirmando `EVOLUCAO-MOTOR-2026.md` §3.5: Presence, não Broadcast nem
Postgres Changes — é o primitivo desenhado exatamente para "quem está
aqui agora", com merge automático de estado entre clientes conectados ao
mesmo canal, sem precisar modelar isso como linha de tabela.

### 3.2 Onde entra no código que já existe

```
src/features/world/
├── presenca/
│   └── canal.ts          hoje: contrato só de tipo (declare function),
│                          deliberadamente inerte — ESTE plano o implementa
├── VisitaScreen.tsx       hoje: avatar "visitante" é só cosmético/local —
│                          ESTE plano soma presença real por cima, sem
│                          tocar em render/engine (que já funcionam)
```

Nenhuma migration, nenhuma mudança em `render/`/`engine/` (geometria e
desenho continuam puros e sem rede). A presença entra como uma CAMADA a
mais sobre o `estadoCena.avatares` que já existe.

### 3.3 🔴 Pré-requisito de segurança — sequência não-negociável

**Este é o achado mais importante deste documento.** Hoje, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
nunca roda no browser — todo acesso a dado passa por `supabaseAdmin()`
(service role, servidor). A Presença ao vivo é o **primeiro** código
client-side a chamar `supabaseAnon()` neste projeto. No instante em que
isso acontece, a anon key passa a estar no bundle JS público — qualquer
pessoa pode extraí-la e usá-la para consultar a API REST do Supabase
DIRETAMENTE, por fora do app.

A policy `negocios_leitura` (`0001_init.sql`) hoje é
`for select to anon, authenticated using (true)` — **sem seleção de
coluna** — já documentada como risco LATENTE em `GAPS-DE-INTEGRACAO.md`.
Presença ao vivo é exatamente o gatilho que a nota já previa: o dia em que
`supabaseAnon()` roda no cliente, esse risco deixa de ser teórico.

**Consequência prática para este plano:** `GH-MULTI-00` (hardening de
RLS) é bloqueante — precede `GH-MULTI-02` (implementação do canal), não
é paralelo a ele. Não existe "implementar presença e arrumar RLS depois";
a ordem inversa expõe dado real de produção pela primeira vez na história
do projeto.

### 3.3.1 ✅ O WebSocket NÃO passa pelo nosso Nginx (não perca tempo com isso)

Parece que iria: a VPS roda Nginx → PM2, e Realtime usa WebSocket, então a
intuição é "preciso garantir `Upgrade`/`Connection` no proxy". **Não
precisa.** `supabaseAnon()` aponta para o domínio hospedado do Supabase —
o navegador abre a conexão WSS **direto lá**, sem tocar na nossa VPS. O
`deploy/nginx.conf.template` até tem os headers de upgrade, mas é
boilerplate do Next.js (HMR em dev), não é load-bearing para Realtime.

Registrado aqui porque, sem essa nota, um leitor futuro gasta uma tarde
endurecendo um proxy que a conexão nunca atravessa.

### 3.3.2 🔒 Limitação conhecida: o canal é público por padrão

Canais Realtime são públicos por padrão: quem tiver a anon key (ou seja,
qualquer visitante, depois que `GH-MULTI-02` estiver no ar) pode entrar em
`sede:<qualquerTenantId>` e ver quem está presente, ou forjar a própria
presença.

**Aceitável no MVP** — o payload é só `{ tenantId, nome }`, ambos já
fachada pública (a mesma informação que `/n/<slug>` publica no Google de
propósito). Não há dado privado em jogo.

**Caminho de saída, quando/se precisar:** Realtime Authorization —
canais privados com RLS em `realtime.messages`. Gatilho para puxar isso:
se algum dia o payload de presença precisar carregar algo além de fachada
pública, ou se forjar presença passar a ter valor de jogo (ex.: presença
virar critério de recompensa).

### 3.4 Degradação graciosa (simplicidade > robustez artificial)

`GAMEHUB_DB=file` (dev local, sem Supabase configurado) precisa continuar
funcionando sem erro — a Presença deve ser **no-op silencioso** quando
`NEXT_PUBLIC_SUPABASE_URL` não existir, nunca lançar exceção que quebra a
tela de visita. Mesmo princípio de degradação limpa já usado em todo o
projeto (`RequisitoAtributos` sem `atributos` = não renderiza, não quebra).

### 3.5 Escalabilidade — por que isto escala sem replanejar

Custo de Presence no Supabase escala com **conexões simultâneas por
canal**, não com o total de tenants cadastrados — o mesmo princípio do
"relógio econômico lazy" já documentado (§5.2 do doc de pesquisa): só
paga quem está de fato jogando agora. Para o volume de uma VPS pequena e
um piloto regional, isso é folgado por um bom tempo; o gatilho de
replanejamento (trocar por Colyseus) só dispara se um dia precisar de
sincronização sub-100ms — não antes.

---

## 4. Development — sequência priorizada (Épico 13 no backlog)

Ordem **não é flexível** — é cadeia de dependência real, não só
prioridade de negócio:

| # | Card | O que é | Depende de |
|---|---|---|---|
| 0 | **Fase 0** | Provar que o modo `GAMEHUB_DB=supabase` funciona de ponta a ponta (= `GH-OPS-03`, já P0) | — (só Supabase local, `supabase start`) |
| 1 | `GH-MULTI-00` | Hardening de RLS de `negocios` (view de fachada + policy restrita) | Fase 0 (para poder verificar) |
| 2 | `GH-MULTI-01` | Provisionar VPS + Supabase hospedado | = Épico 9 (`GH-OPS-01`/`GH-OPS-02`), referenciado, não duplicado |
| 3 | `GH-MULTI-02` | Implementar `presenca/canal.ts` de verdade | 🟡 **código já feito** (mock); ir ao ar depende de 1 e 2 |
| 4 | `GH-MULTI-03` | Integrar presença real em `VisitaScreen.tsx` | `GH-MULTI-02` verificado ao vivo |

### 4.0 Por que a Fase 0 vem antes de tudo (achado que reordenou o plano)

`GH-OPS-03` já registra que as policies RLS nunca rodaram contra Postgres
real — só parsing estático. Estendendo o raciocínio: **as 23 migrations
nunca foram aplicadas em sequência**, e o `SupabaseRepository` inteiro
nunca executou. O app inteiro só rodou em `GAMEHUB_DB=file`.

Multiplayer é uma camada fina *em cima* dessa superfície inteira não
validada. Construir presença antes de provar o modo Supabase significa
depurar 23 migrations e um recurso novo ao mesmo tempo, sem saber qual
dos dois está quebrado. Fase 0 separa as duas coisas:

1. `supabase start && supabase db reset` — as 23 migrations aplicam limpo?
2. App com `GAMEHUB_DB=supabase` apontando para o Supabase local.
3. Cadastro end-to-end (é o caminho que mais toca o adapter:
   `criar_negocio_com_lote`, onboarding, sede inicial, mobília inicial).
4. Seed de demo (`SEED_DEMO=1 npx vitest run
   src/scripts/seed-demo.test.ts`) contra Supabase — os números têm que
   bater com os já validados em modo arquivo. É um diferencial pronto
   para achar divergência entre os dois adapters.
5. Isolamento: tenant A não lê `onboardings` de B.

Detalhamento de cada card está em `docs/BACKLOG-PRODUTO.md`, Épico 13.

**Por que `GH-MULTI-02` já pode ser planejado em detalhe hoje, mesmo sem
Supabase real:** a API do Supabase Realtime Presence é pública, estável e
bem documentada — o código pode ser escrito e revisado corretamente agora;
só a primeira execução real precisa esperar `GH-MULTI-01`. Plano
bite-sized completo em
[`world/PLANO-PRESENCA-REALTIME.md`](../world/PLANO-PRESENCA-REALTIME.md).

**Por que `GH-MULTI-00` NÃO tem migration escrita neste documento:**
mesma cautela já aplicada a todo o resto desta sessão — RLS em tabela com
`FORCE ROW LEVEL SECURITY` só é confiável depois de testada contra um
Postgres real (`pg-query-emscripten` valida sintaxe, nunca semântica de
RLS). O desenho da correção está especificado abaixo, para quem tiver
Postgres real disponível implementar e VERIFICAR — não para aplicar às
cegas.

### 4.1 Desenho de `GH-MULTI-00` (especificado, não implementado)

```sql
-- 1. view de fachada pública — só as colunas que já são "vitrine" por design
create view public.negocios_publico as
select id, nome, segmento, quarteirao_id, lote, nivel, degrau_atual,
       perfil_publico, criado_em
from public.negocios
where perfil_publico = true;

grant select on public.negocios_publico to anon, authenticated;

-- 2. restringe a tabela real: só o próprio tenant lê a linha completa
drop policy if exists negocios_leitura on public.negocios;
create policy negocios_leitura_propria on public.negocios
  for select to authenticated
  using (id = (select private.tenant_atual()));
```

**⚠️ Correção importante (achado da revisão de 2026-07-28):** uma versão
anterior deste documento dizia que as leituras públicas de hoje (mapa,
`GH-GROW-01`) precisariam migrar para consultar a view. **Não precisam.**
`SupabaseRepository` usa exclusivamente `supabaseAdmin()` (service_role),
que **ignora RLS por definição** — nenhuma leitura do app é afetada por
essa policy. O endurecimento é puramente defensivo contra a anon key que
`GH-MULTI-02` vai expor no browser.

Consequência prática (boa): **`GH-MULTI-00` não exige nenhuma mudança de
código de aplicação.** É migration + verificação, risco de regressão ≈ 0.

Corolário menos confortável, que vale registrar: hoje as policies RLS são
efetivamente *advisory* para o app — protegem contra acesso direto à API,
não contra um bug no nosso próprio código server-side (que roda como
service_role e pode ler tudo). Mover as leituras públicas para a anon key
+ view seria defesa em profundidade de verdade, mas é refatoração maior e
**não é pré-requisito de multiplayer** — fica registrado como opção
futura, não como tarefa deste épico.

**Validação obrigatória antes de aplicar em produção** (não pular):
1. `supabase start && supabase db reset` com este SQL.
2. Provar que `anon`/`authenticated` conseguem ler `negocios_publico`
   normalmente (mapa/vitrine pública continuam funcionando).
3. Provar que `anon` NÃO consegue mais ler `xp`/`moeda_virtual`/atributos
   de `negocios` diretamente via REST.
4. Rodar toda a suíte de testes de fluxo completo com `GAMEHUB_DB=supabase`
   (isto também fecha `GH-OPS-03`, que já pede exatamente isso).

---

## 5. Inovação — o que isso destrava depois (visão, não compromisso)

Uma vez que presença ao vivo existe, os próximos passos ficam baratos
(mas **não fazem parte deste plano**, só ficam mais fáceis depois dele):
- Contador "X pessoas na sua sede agora" no `/painel` (reusa o mesmo canal).
- Notificação leve "Fulano está visitando sua sede" (Presence já emite
  eventos de entrada/saída — não precisa de infraestrutura nova).
- Base para o G4 completo do roadmap de mundo (`EVOLUCAO-MOTOR-2026.md`),
  incluindo eventualmente ver o avatar do visitante se mover em tempo real
  no `WorldScreen.tsx` do dono (fora de escopo aqui — precisaria de
  Broadcast além de Presence, decisão a tomar quando chegar a hora).

---

## 6. Resumo executivo — a única frase que importa

**Presença ao vivo é barata, vale a pena, e tem exatamente UMA
pré-condição não negociável: fechar o RLS de `negocios` antes de ligar o
primeiro código client-side do Supabase — nunca depois.**
