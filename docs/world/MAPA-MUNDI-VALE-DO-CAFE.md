# Metaverso Vale do Café — mapa-múndi multi-tenant

> Como cada negócio cadastrado vira um **ponto no mundo** (estilo mapa de
> game / pin do Google Maps), e como muitos negócios regionais coexistem no
> mesmo mundo compartilhado sem vazar dados entre si.
>
> Complementa [`ARQUITETURA-WORLD.md`](ARQUITETURA-WORLD.md) (o interior da
> sede) — aqui é o **exterior**: o mundo onde as sedes ficam.

---

## 1. O conceito

**Um único mundo persistente, compartilhado por todos os tenants.** Cada
empresa que completa o cadastro (as 10 perguntas) **nasce automaticamente
como um ponto no mapa** — não existe negócio cadastrado sem endereço no
mundo. É o que transforma um SaaS comum num metaverso regional.

```
🌍 Metaverso Vale do Café
   └── 🏙️ Cidade (Mendes, Vassouras, Barra do Piraí, …)
        └── 🏘️ Bairro (Centro, …)
             └── 🧱 Quarteirão (8 lotes)
                  └── 📍 Lote → 🏢 SEDE de um negócio (o World interior)
```

Essa hierarquia **já existe e funciona** no código
(`docs/ARQUITETURA-MULTITENANT.md` §3) — o mapa-múndi é a camada visual
acima dela, mais "game" e menos "diagrama".

## 2. Multi-tenancy: o modelo mental correto

Este é o ponto arquitetural mais delicado. Há **três níveis de
visibilidade** convivendo no mesmo mundo:

| Camada | Quem vê | Exemplo | Como é garantido |
|---|---|---|---|
| **Mundo/geografia** | todos (inclusive visitante não logado) | cidades, bairros, quarteirões, quais lotes estão ocupados | RLS `for select using (true)` nas tabelas de geografia |
| **Fachada do negócio** | todos | nome, segmento, nível, degrau, reputação — o "pin" no mapa | RLS `for select using (true)` em `negocios` (é vitrine por design) |
| **Interior/privado** | só o próprio tenant | onboarding (budget, score), equipe de IA contratada, mobília, finanças | RLS `using (tenant_id = (select private.tenant_atual()))` |

**Regra de ouro do World multi-tenant:**
> Qualquer dado novo que o World introduzir precisa ser classificado numa
> dessas 3 camadas **antes** de virar tabela. Na dúvida, comece privado —
> abrir depois é fácil, fechar depois é vazamento.

### Aplicando ao World

| Dado do World | Camada | Justificativa |
|---|---|---|
| Nível/tipo da sede (alugada, própria, andar completo) | **fachada** | É o "tamanho do prédio" que o vizinho vê no mapa — sinal de status, motiva progressão |
| Layout interno / mobília colocada | **aberto no MVP** (decisão 2026-07-28) | Visitável por qualquer vizinho logado — ver nota abaixo. Volta a ficar privado por padrão só se um opt-in for reintroduzido no futuro |
| Avatares (dono + Funcionários de IA) | **aberto no MVP**, mesma decisão | Visível durante a visita, junto com o layout — é a prova social que sustenta o pitch comercial |
| Visitas recebidas / conexões formadas | **fachada** (agregado) | "12 parceiros conectados" é prova social; a lista de quem é pode ser privada |

> ✅ Decisão tomada (2026-07-28, ver `docs/world/VISITAR-VIZINHO.md`): a
> sede é **visitável por padrão** no MVP — qualquer jogador logado visita
> qualquer vizinho, somente leitura, sem opt-in. A recomendação de opt-in
> (`sede.publicada = false` por padrão) que estava aqui fica documentada
> como **evolução futura** (`VISITAR-VIZINHO.md` §8), não construída
> agora — reintroduzir é uma coluna nova em `sedes` + uma checagem na rota
> de visita, nada estrutural.

## 3. O mapa como experiência de jogo (não como diagrama)

Hoje o `MapaScreen` mostra quarteirões isométricos — funciona, mas parece
mais "planta baixa" que "mundo". Para virar mapa de game, três camadas de
zoom:

| Zoom | O que mostra | Interação |
|---|---|---|
| **Z1 — Região** (Vale do Café) | Mapa estilizado com as cidades como grandes pins/ilhas, contagem de negócios em cada uma | Clicar numa cidade → Z2 |
| **Z2 — Cidade** (ex.: Mendes) | Bairros como distritos coloridos, com densidade de negócios | Clicar num bairro → Z3 |
| **Z3 — Quarteirão** | A vista isométrica atual (8 lotes, sedes visíveis) | Clicar numa sede → perfil / visitar (World interior) |

**Padrão visual sugerido para os pins** (herdando o que já existe):
- Ícone + cor por **segmento** (já implementado em `features/mapa/segmentos.ts`)
- Tamanho/altura do prédio por **nível da sede** (novo — vem do World)
- Selo/aura por **degrau na escada de valor** (já existe o dado)
- Pulso animado no **seu próprio negócio** (já implementado em `IsoLot`)

Isso dá leitura instantânea: *"aquele prédio grande e dourado ali é uma
imobiliária nível 4, no degrau CTO-as-a-Service"* — exatamente a leitura
que um mapa de jogo bem feito entrega.

## 4. Como um novo cadastro entra no mundo (fluxo já existente + World)

```
/cadastro (10 perguntas)
   ↓
criarNegocio() → RPC criar_negocio_com_lote (atômica, advisory lock)
   ↓
✅ negócio recebe cidade/bairro/quarteirão/lote        ← JÁ FUNCIONA
   ↓
🆕 criarSede() → sede inicial "alugada", grid pequeno   ← A CONSTRUIR (World)
   ↓
🆕 pin aparece no mapa-múndi para todos os players      ← A CONSTRUIR (visual)
```

**Nada muda no cadastro** — o World se pluga *depois* da alocação de lote.
Isso é importante: o fluxo de cadastro já é atômico e testado; o World
apenas adiciona uma sede inicial ao tenant recém-criado.

### Escalabilidade da alocação
Já resolvida no banco: `unique (quarteirao_id, lote)` +
`pg_advisory_xact_lock` por bairro. Quando um quarteirão lota (8 lotes), a
RPC abre o próximo automaticamente — **o mundo cresce sozinho conforme
mais empresas se cadastram**, sem intervenção manual. É exatamente o
comportamento que um metaverso regional precisa.

## 5. ⚠️ Gap crítico identificado: Mendes não está cadastrada

O usuário citou **Mendes** como região-alvo, mas a lista de cidades
prioritárias hoje é: `Vassouras, Barra do Piraí, Piraí, Volta Redonda,
Resende, Outra`. Mendes cairia em "Outra" — o que funciona tecnicamente (a
RPC cria a cidade dinamicamente), mas **não aparece como opção prioritária
no onboarding**.

**Ação necessária (3 arquivos, mesma mudança):**

| Arquivo | O que mudar |
|---|---|
| `src/lib/db/file-adapter.ts` | adicionar `{ nome: "Mendes", prioritaria: true }` a `CIDADES_BASE` |
| `supabase/seed.sql` | adicionar `('mendes', 'Mendes', true)` ao insert |
| `src/features/onboarding/perguntas.ts` | adicionar `{ valor: "Mendes", rotulo: "Mendes" }` às opções da Q3 |
| `src/features/onboarding/scoring.ts` | adicionar `"mendes"` a `CIDADES_PRIORITARIAS` (senão não pontua fit geográfico) |

São 4 pontos, não 3 — o `scoring.ts` é fácil de esquecer e faria Mendes
não pontuar no fit comercial. **Vale considerar centralizar essa lista num
único módulo** para eliminar essa classe de bug (hoje a mesma informação
vive em 4 lugares).

## 6. Modelo de dados adicional (mapa-múndi)

A geografia já existe. O que o mapa-múndi precisa **a mais**:

```sql
-- agregados por cidade/bairro, para o zoom Z1/Z2 não precisar
-- carregar todos os negócios (performance)
-- Pode ser VIEW materializada em vez de tabela.
create view public.mapa_agregado_cidade as
  select c.slug, c.nome, c.prioritaria,
         count(n.id) as total_negocios,
         count(distinct b.id) as total_bairros
  from public.cidades c
  left join public.bairros b on b.cidade_id = c.id
  left join public.quarteiroes q on q.bairro_id = b.id
  left join public.negocios n on n.quarteirao_id = q.id
  group by c.id;
```

> Cuidado de performance conhecido: `lerMapaView()` hoje carrega o mundo
> inteiro (todas as cidades → bairros → quarteirões → negócios) numa query.
> Funciona com dezenas de negócios; **com centenas vai pesar**. O zoom por
> camadas (Z1/Z2/Z3) resolve isso naturalmente: cada nível carrega só o que
> precisa. Implementar o zoom **antes** de ter muitos cadastros reais.

## 7. Ordem de implementação sugerida

| Passo | Entrega | Depende de |
|---|---|---|
| **M0** | Adicionar Mendes nos 4 pontos (ver §5) | — |
| **M1** | Centralizar a lista de cidades num módulo único | M0 |
| **M2** | View/consulta agregada por cidade (Z1) | — |
| **M3** | Tela de zoom Z1 (região) → Z2 (cidade) → Z3 (quarteirão atual) | M2 |
| **M4** | Sede inicial criada no cadastro (`sedes`) | World W1 |
| **M5** | Altura/estilo do pin refletindo nível da sede | M4 |
| **M6** | Visitar sede de vizinho (somente leitura, aberto no MVP) ✅ | World W3 |

M0 e M1 são pequenos e destravam o resto — bons candidatos ao próximo
prompt de implementação.
