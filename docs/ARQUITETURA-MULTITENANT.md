# Arquitetura — Cadastro, Login e Multi-tenancy

> Como um novo negócio nasce no gamehub a partir de **10 respostas**, ocupa um
> lugar no **mapa regional** (cidade → bairro → quarteirão → lote) e entra na
> **escada de valor** do Laboratório Demarchi.
>
> Hoje: persistência em **arquivos** (`data/`). Amanhã: **Supabase/SQL
> multi-tenant** — sem reescrever regra de negócio.

---

## 1. Decisão-chave: dois contratos, um switch

Persistência de **domínio** e **autenticação** são contratos separados — o
modelo local guarda hash de senha, o Supabase Auth não expõe hash nenhum.
Misturar os dois vazaria detalhe de implementação para `features/`.

```
features/ (regra de negócio)
   │ usa apenas as interfaces
   ├──────────────────────────────┬───────────────────────────────┐
   ▼                              ▼                               │
lib/db/repository.ts        lib/auth/provider.ts                  │
  (GameRepository)            (AuthProvider)                      │
   ├── file-adapter.ts         ├── local-provider.ts    (scrypt)   │
   └── supabase-adapter.ts     └── supabase-provider.ts (Auth)     │
                                                                   │
        GAMEHUB_DB = file | supabase  ◄────────────────────────────┘
```

Ambas as factories leem a **mesma** variável, então os dois lados nunca ficam
dessincronizados.

| | `GAMEHUB_DB=file` (padrão) | `GAMEHUB_DB=supabase` |
|---|---|---|
| Dados | JSON em `data/` | Postgres + RLS |
| Senha | scrypt + salt (nosso) | Supabase Auth (gerenciado) |
| Concorrência de lote | single-process | advisory lock + `unique` |
| Uso | demo/pitch, zero infra | produção |

## 2. Modelo multi-tenant

**Tenant = negócio.** Cada negócio cadastrado é um inquilino isolado.

| Entidade | Escopo | Chave |
|---|---|---|
| `Cidade` / `Bairro` / `Quarteirao` | **global** (mapa compartilhado) | slug |
| `Negocio` (tenant) | raiz do tenant | `id` |
| `Usuario` | pertence a 1 tenant | `tenantId` + email |
| `Onboarding` (10 respostas) | do tenant | `tenantId` |
| `Oferta` / `Deal` | do tenant | `tenantId` |

**Regra de isolamento:** todo registro não-global carrega `tenantId`. No
file-adapter isso vira pasta (`data/tenants/<id>/`); no Supabase vira **coluna
`tenant_id` + RLS**:

```sql
create policy tenant_isolation on negocios
  using (tenant_id = auth.jwt() ->> 'tenant_id');
```

O `email` é único **globalmente** (índice de login) para o usuário achar seu
tenant no login — por isso existe `data/index/usuarios.json`.

## 3. Geografia gamificada (o mapa regional)

```
Cidade (Vassouras)
  └── Bairro (Centro)
        └── Quarteirão (Q1)
              └── Lote 1..8  ← cada negócio ocupa um lote
```

- Ancorada no ICP real: Vassouras, Barra do Piraí, Piraí, Volta Redonda, Resende.
- O quarteirão é a **unidade social**: vizinhos se veem, indicam e fazem parceria.
- **Alocação automática** no cadastro: primeiro lote livre do bairro escolhido;
  quarteirão novo é criado quando o atual lota (8 lotes).
- Visual: o **bairro isométrico navegável** (estilo Habbo/Startup Panic) está na
  aba "Mapa" do hub — ver §3.1.

### 3.1 Read model do mapa (CQRS leve)

A UI do mapa precisa do **resumo do negócio** em cada lote (nome, segmento,
nível), não só do `tenantId`. Em vez de poluir o domínio `Mapa`, há um read
model dedicado — `MapaView` — servido por `repo.lerMapaView()`:

- **File adapter:** lê o `mapa.json` e busca os negócios ocupantes em paralelo
  (`Promise.all`, sem N+1 serial).
- **Supabase adapter:** um único `select` aninhado
  (`cidades→bairros→quarteiroes→negocios`) traz tudo numa query.

A tela (`features/mapa/MapaScreen`) navega cidade → bairro → quarteirões
isométricos, destaca o lote do jogador e mostra o detalhe do negócio
selecionado. Componentes: `ui/IsoLot` (losango presentational puro) +
`features/mapa/QuarteiraoIso` (posiciona 8 lotes em projeção 2:1).

## 4. Fluxo de cadastro (10 perguntas → negócio vivo)

```
/cadastro
  1. Conta (nome, email, senha)
  2. Wizard de 10 perguntas  ──► calcula:
        • degrau na escada de valor (1–5)
        • serviços recomendados
        • nível/XP inicial e zonas desbloqueadas
  3. Aloca lote no mapa (cidade/bairro/quarteirão)
  4. Cria tenant + usuário + onboarding  ──► sessão  ──► /hub
```

As 10 perguntas estão em
[`design/ONBOARDING-10-PERGUNTAS.md`](design/ONBOARDING-10-PERGUNTAS.md).

## 5. Autenticação

Contrato: `AuthProvider` — `emailExiste` · `registrar` · `autenticar`.
A identidade que trafega é só `usuarioId` (hex no local, uuid de `auth.users`
no Supabase).

**Local (`file`):** scrypt + salt em `data/auth/credenciais.json`, comparação
em tempo constante. O arquivo é propriedade do provider — o repositório de
domínio não o enxerga.

**Supabase:** `auth.admin.createUser` no cadastro e `signInWithPassword` no
login. Senha nunca passa pela nossa camada de dados; rate limiting,
verificação de e-mail e reset ficam a cargo do Supabase.

Em ambos, a sessão da aplicação é um cookie `httpOnly` assinado com HMAC
(`lib/auth/sessao.ts`) e o login responde sempre com mensagem genérica —
nunca revela se o e-mail existe.

> ⚠️ O modo `file` é para demo/pitch. Para produção use `supabase`, que já
> resolve rate limiting, verificação de e-mail, recuperação de senha e MFA.

## 6. Escada de valor como motor de monetização

O onboarding **posiciona** o negócio num degrau e a gamificação existe para
**subir a escada**:

| Degrau | Oferta | Preço | Papel no jogo |
|---|---|---|---|
| 1 | Auditoria Digital Gratuita | R$ 0 | entrada — todo cadastro nasce aqui |
| 2 | Diagnóstico Técnico | R$ 497 | primeira conversão (missão inicial) |
| 3 | Automação Essencial | R$ 1.5–2.5k/mês | desbloqueia zonas do mapa |
| 4 | Ecossistema Completo | R$ 3.5–5k/mês | parcerias e destaque regional |
| 5 | CTO-as-a-Service | R$ 5–8k/mês | topo — vitrine do quarteirão |

**Princípio herdado:** *cada degrau cria o problema do próximo*. No jogo isso
vira **missão**: a conquista de um degrau abre a missão do seguinte.

## 7. Estrutura de arquivos (persistência atual)

```
data/
├── auth/
│   └── credenciais.json       # email → { usuarioId, hash }  (do AuthProvider)
├── index/
│   └── membros.json           # usuarioId → tenantId  (resolve o tenant no login)
├── geografia/
│   └── mapa.json              # cidades, bairros, quarteirões, lotes
└── tenants/
    └── <tenantId>/
        ├── negocio.json       # dados do tenant
        ├── onboarding.json    # as 10 respostas + score
        ├── membros/<id>.json  # time do tenant
        └── ofertas.json       # o que ele divulga
```

`data/` está no `.gitignore` (contém dados de pessoas reais).

## 8. Supabase — como está implementado

Schema, policies e funções: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
Cidades do ICP: [`supabase/seed.sql`](../supabase/seed.sql).

### Decisões de banco (padrão Supabase/Postgres)

- **Identificadores** minúsculos em `snake_case`; **PK `bigint identity`**
  (sequencial, sem fragmentação de índice).
- **Toda FK é indexada** — Postgres não faz isso sozinho, e sem índice o
  `JOIN` e o `ON DELETE CASCADE` viram seq scan.
- **RLS forçada** nas tabelas de tenant, com o helper
  `private.tenant_atual()` (`security definer`, `search_path = ''`, `EXECUTE`
  revogado) resolvendo o tenant do JWT sem recursão na tabela `membros`.
- **Policies chamam `(select private.tenant_atual())`** — o wrap em `select`
  faz o Postgres avaliar **uma vez por query** em vez de uma vez por linha.
- **Integridade do mapa no banco:** `unique (quarteirao_id, lote)` — dois
  negócios no mesmo lote é impossível, não importa o bug de aplicação.
- **Cadastro atômico:** a RPC `criar_negocio_com_lote` faz upsert de
  cidade/bairro, toma `pg_advisory_xact_lock` por bairro, acha o primeiro lote
  livre e insere — tudo em uma transação.
- **Sem N+1:** `vizinhos_do_tenant` resolve os vizinhos com um `join` em uma
  chamada, em vez de uma query por vizinho.

### Visibilidade (o que é público por design)

| Tabela | Leitura | Escrita |
|---|---|---|
| `cidades` / `bairros` / `quarteiroes` | pública (o mapa é público) | só service_role |
| `negocios` | pública (é a **vitrine** regional) | só o próprio tenant |
| `ofertas` | pública (vitrine) | só o próprio tenant |
| `membros` | só o próprio time | só service_role |
| `onboardings` | **só o próprio tenant** | só o próprio tenant |

`onboardings` guarda budget e score comercial — nunca é exposto a terceiros.

### Subir o ambiente

```bash
supabase start && supabase db reset
```

Depois preencha o `.env` a partir de [`.env.example`](../.env.example) e rode
com `GAMEHUB_DB=supabase`.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Ela é usada apenas em Server
> Actions (o cadastro precisa criar tenant e membro antes de existir sessão) e
> **nunca** pode chegar ao browser.

Modelo conceitual das entidades de parceria/serviço em
[`database/SCHEMA-PARCEIROS-REGIONAL.md`](database/SCHEMA-PARCEIROS-REGIONAL.md).
