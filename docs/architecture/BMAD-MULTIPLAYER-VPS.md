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

Ordem **não é flexível** nos 2 primeiros itens — é uma cadeia de
dependência real, não só prioridade de negócio:

| # | Card | O que é | Depende de |
|---|---|---|---|
| 1 | `GH-MULTI-00` | Hardening de RLS de `negocios` (view de fachada + policy restrita) | — (mas precisa de Postgres real para *verificar*, não só escrever) |
| 2 | `GH-MULTI-01` | Provisionar VPS + Supabase reais | = Épico 9 (`GH-OPS-01`/`GH-OPS-03`), referenciado, não duplicado |
| 3 | `GH-MULTI-02` | Implementar `presenca/canal.ts` de verdade (Supabase Realtime Presence) | `GH-MULTI-00`, `GH-MULTI-01` |
| 4 | `GH-MULTI-03` | Integrar presença real em `VisitaScreen.tsx` (e depois `WorldScreen.tsx`, opcional) | `GH-MULTI-02` |

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
