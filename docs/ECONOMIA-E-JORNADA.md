# Economia de moedas, Contratos e Jornada (modo história)

> Objetivo de produto: **qualquer pessoa que entre consegue, sozinha, chegar
> ao Canvas nível 1, ganhar moeda toda semana e ser empurrada para vender
> mais.** A moeda é consequência de fazer coisas que levam a vender.

## O caminho de quem acabou de entrar

| Passo | O que acontece | Moeda |
|---|---|---|
| 0 | Cadastro. Começa com `MOEDA_INICIAL` = 🪙 100 (de propósito < 300) | 100 |
| 1 | Carta "Chegada" → carta **"A primeira parceria: o Laboratório entra no seu time"** (Antonio Demarchi / admin). **Toda escolha paga 🪙 400** | 500 |
| 2 | Equipe de IA → contratar o **Documentador** (🪙 300) = **Canvas nível 1**. Sobe o degrau para 2 | 200 |
| 3 | Capítulo "O Canvas está pronto. Onde está a venda?" (escolha: reativar clientes ou melhorar a oferta; +🪙 60) | 260 |
| 4 | Contratos da semana (até 🪙 440/semana) | +440/sem |
| 5 | Cada contratação sobe 1 degrau e destrava o próximo cargo (Social 🪙 400, Editor 🪙 600, Comercial 🪙 900) | — |

Quem **não** quiser/puder esperar a parceria ainda fecha o Canvas: os
contratos semanais sem pré-requisito somam 🪙 200 + os 100 iniciais = 300
(travado em teste). A Jornada nunca fica sem próximo passo.

## Contratos (`src/features/contratos/`)

Trabalho recorrente do jogo. Duas naturezas:

- **Entrega real** — a ação acontece fora do jogo (vender, chamar cliente,
  publicar o post). O servidor confia no que o dono declara, **por isso a
  recompensa é fixa e independe do número informado** (não há ganho em
  mentir). O número declarado é guardado (`valor`) para comparar semanas.
- **No jogo** — o sistema comprova sozinho (oferta publicada na semana).

| Contrato | Cadência | Prova | 🪙 |
|---|---|---|---|
| Fechamento da semana (vendas) | semanal | declarado + número | 120 |
| Vitrine fresca | semanal | oferta criada na semana | 100 |
| Reativar clientes antigos | semanal | declarado + número | 80 |
| Colocar a IA para vender | semanal | declarado; exige 1 Funcionário de IA | 140 |
| Diagnóstico técnico | única | declarado | 100 |
| Retrospectiva de 90 dias | ciclo 90d | declarado; exige degrau-alvo | 80 |

Semana ISO no relógio de Brasília (UTC−3). Período, prova e valor da
recompensa **saem do servidor**; o cliente manda só `contratoId` (+ número).
Pagamento atômico e idempotente por `(tenant, contrato, período)` — unique no
banco (`0027`), então clique duplo / requisição repetida não paga duas vezes.

## Falhas de economia corrigidas nesta entrega

1. **`recompensar()` era uma torneira.** Qualquer usuário logado podia chamar
   a Server Action com qualquer evento (`parceria_formada`, `retro_90d`,
   `diagnostico_agendado`…) quantas vezes quisesse. Agora só aceita os dois
   eventos com guarda própria (cargo único, job único); o resto tem dono.
2. **`escolherNoCapitulo` aceitava capítulo futuro** (ex.: `retro-30` no dia 0,
   +🪙 200). Agora o capítulo precisa ter chegado (entregue ou com gatilho
   atendido no relógio do servidor).
3. **Escolha de história custava só na etiqueta.** O piso em zero do
   `aplicarProgresso` fazia "gastar 🪙 300 com 🪙 10" sair de graça. Agora a
   action recusa sem saldo e a UI desabilita a opção (todo capítulo tem uma
   escolha que não custa moeda — travado em teste).
4. **Contratar pagava 🪙 200 e não custava nada.** Agora custa
   (`CargoIA.custoMoeda`), com débito + inserção atômicos.
5. **RLS permitia escrita direta pelo navegador** (`negocios_atualiza_proprio`
   — inclusive `moeda_virtual`/`xp` — e inserts de contratação/trabalho/nó).
   Com a anon key no browser (presença ao vivo), qualquer um se daria moeda.
   `0027` remove as 4 policies; o app só escreve por RPC/service_role.
6. **Cartas encadeadas exigiam reload.** O `CapituloGate` agora busca a
   próxima carta ao fechar a atual (no dia 0 vêm duas seguidas).

## Limitação conhecida

Duas requisições simultâneas de contratar o MESMO cargo podem aplicar o XP/
degrau da contratação duas vezes (a moeda é cobrada uma vez só, por
idempotência do repositório). Pré-existente; fechar exige o repositório
sinalizar "novo vs. existente" — fica para um card próprio.

## Aplicar em produção

`supabase/migrations/0027_contratos_e_economia.sql` (sintaxe validada com
`pg-query-emscripten`; **semântica de RLS/RPC ainda sem Postgres real**, igual
às anteriores — Fase 0 do Épico 13). No modo `file` não há migração.
