# Roteiro de demo — pitch Sebrae (GH-PITCH-01)

> Objetivo: demo ao vivo de ~6 minutos, com dados semeados previamente e
> caminho testado — nunca descobrir um bug na frente da banca. Este roteiro
> é o script; `docs/pitch/NARRATIVA-IMPACTO.md` é o discurso.

> **Atualizado 2026-08-02 (`GH-PITCH-03`):** deploy real está no ar
> (`docker-compose.yml` + `docker-compose.supabase.yml`, Postgres real,
> Kong público em `:8010`) — os passos 1–6 abaixo já rodam contra
> infraestrutura de produção de verdade, não mais só local. **Não incluí
> um passo de presença ao vivo/multiplayer ainda**: o pré-requisito de
> rede (Kong alcançável de fora) está pronto, mas o card que valida isso
> num navegador real (`GH-MULTI-04`) continua aberto — ver
> `docs/BACKLOG-PRODUTO.md`. Não anunciar "metaverso ao vivo" na banca até
> esse card fechar com evidência. Este roteiro também não foi
> re-percorrido de ponta a ponta contra o deploy atual — fazer isso antes
> do dia real, com evidência anexada ao card.

## Antes de sair de casa (preparação, uma vez só)

1. **Rodar o seed de demo** (cria o bairro "Centro, Mendes" com 6 negócios
   em estados variados — equipe de IA, parceria, árvore, sede, lição,
   vitrine — todos vizinhos de quarteirão de verdade):
   ```bash
   SEED_DEMO=1 npx vitest run src/scripts/seed-demo.test.ts
   ```
   Confirma no fim do log: `[seed] pronto — 6 negócios em Centro, Mendes`.
   Rodar isso **no ambiente que vai ser usado na demo** (produção, se já
   fez `GH-OPS-01`; local com `GAMEHUB_DB=file`, se ainda não).
2. Testar o roteiro inteiro **uma vez de ponta a ponta** antes do dia,
   no mesmo ambiente da demo real (não só local).
3. Ter o **Plano B** (`iniciar.bat`, ver §Plano B) testado e pronto num
   notebook, mesmo que a demo principal seja em produção.
4. Decorar o nome dos negócios semeados: **Radiz Engenharia** (o "herói" da
   demo — já tem equipe, parceria, sede evoluída, lição concluída),
   **Vitalys Saúde** (o vizinho que vira parceiro ao vivo), **Sabor & Cia
   Alimentos** (deliberadamente "cru" — mostra como é o dia 1).
5. **Login pronto da Radiz** (única das 6 com conta — as outras 5 são só
   vizinhos de contexto): `radiz@demo.labdatadev.local` /
   `SebraeDemo2026!`. Usar para logar direto nela em `/entrar` e mostrar o
   `/painel` já rico (conquistas desbloqueadas, ofertas publicadas, sede
   nível 2) sem precisar montar esse estado ao vivo.

## Roteiro cronometrado (~6 min)

| # | Tempo | Tela | O que fazer / dizer |
|---|---|---|---|
| 1 | 0:00–1:00 | `/cadastro` | Cadastro **ao vivo**, como um negócio novo real. Digitar o **CEP de Mendes** primeiro — cidade/bairro preenchem sozinhos (ViaCEP, `GH-CEP-01`), cai automaticamente no mesmo bairro do seed (Centro), vizinho da Radiz/Vitalys. Narrativa: "nem precisa digitar cidade e bairro — o CEP já aloca o lote certo no mapa". Nome do negócio ex.: "Padaria da Vila", segmento comércio. Passar rápido pelas 10 perguntas, marcar consentimento, criar conta. Narrativa: "isso é o cadastro real, sem trapaça — o mesmo que qualquer empresário faz". |
| 2 | 1:00–1:30 | `/hub` | Mostrar o HUD (moeda, nível, missão atual) e a **Lição do degrau** (`LicaoCard`) — clicar "Ler lição", mostrar o texto curto, concluir (ganha XP). Narrativa: "não é só jogo — cada passo ensina o porquê". |
| 3 | 1:30–2:30 | Aba **Mapa** | Mostrar o quarteirão com os vizinhos reais (Radiz, Vitalys, etc. já lá). Clicar em **Radiz Engenharia**, "Visitar sede" (leitura, mostra o pitch comercial de Funcionários de IA personalizado). Voltar, clicar "Formar parceria" com Vitalys — recompensa mútua ao vivo. |
| 4 | 2:30–3:30 | Aba **Equipe de IA** | Contratar um Funcionário de IA (ex. Comercial/SDR) — mostrar XP/degrau subindo no toast. Narrativa: "é aqui que o produto vira negócio de verdade — agentes Claude configurados como cargo, por assinatura". |
| 5 | 3:30–4:30 | Aba **Serviços** (Marketplace) | Aceitar um trabalho — abrir o modal **Selecionar funcionário**, marcar o Funcionário de IA recém-contratado, mostrar a soma dinâmica de atributos batendo o requisito, confirmar. |
| 6 | 4:30–5:00 | Aba **Sede** / `/world` | Mostrar a sala isométrica, o boneco andando, a mobília — é o "wow visual" da demo. |
| 7 | 5:00–5:30 | `/painel` (logado como Radiz, `radiz@demo.labdatadev.local`) | Mostrar Conquistas já desbloqueadas, ofertas publicadas, mensagens recebidas, e o botão "Convide um vizinho". Numa aba separada — o negócio novo do passo 1 continua logado na outra. |
| 8 | 5:30–6:00 | `/n/<slug-da-radiz>` | Abrir a **página pública** da Radiz numa aba anônima — "isto aparece no Google, sem custo de marketing, é o motor de crescimento orgânico do ecossistema". |

**Ordem alternativa se o tempo apertar:** cortar o passo 7 primeiro
(conquistas/convite) — os passos 1–6 sozinhos já contam a história
completa (cadastro → aprendizado → rede regional → equipe de IA →
marketplace → mundo visual).

## Plano B — se a internet falhar

1. Rodar local: duplo-clique em `iniciar.bat` (Windows) — sobe com
   `GAMEHUB_DB=file`, sem depender de internet nem do Supabase.
2. Rodar o seed local também (`SEED_DEMO=1 npx vitest run
   src/scripts/seed-demo.test.ts`) antes do dia, para já estar pronto.
3. O roteiro acima funciona **idêntico** em modo local, com uma ressalva:
   o autofill de cidade/bairro por CEP no passo 1 (`GH-CEP-01`) chama a
   ViaCEP (API pública, sem chave) e degrada em silêncio se não houver
   internet — cai de volta pro dropdown manual de cidade/bairro, sem
   travar o cadastro. Todo o resto do produto não faz nenhuma chamada
   externa.

## O que NÃO mostrar (ainda não pronto ou incompleto)

- **Presença ao vivo / "gente de verdade na mesma sala" (`GH-MULTI-04`)** —
  o caminho de código existe e o Kong já está publicamente alcançável
  nesta VPS, mas ninguém verificou ainda em dois navegadores reais. Não
  prometer nem demonstrar até o card fechar com evidência.
- Painel de oportunidades admin (`GH-GROW-05`) — não implementado.
- Zoom do mapa por camadas (`GH-MAPA-02`) — o mapa hoje é só o quarteirão,
  não região→cidade→quarteirão.
- Qualquer coisa em `/admin/eventos` **na frente da banca** sem necessidade
  — é ferramenta interna, não parte da narrativa do produto (hoje também
  inacessível: `GAMEHUB_ADMIN_EMAILS` não bate com nenhuma conta
  cadastrada).

## Dados de demo — regra de ouro

Os 6 negócios semeados (`src/scripts/seed-demo.test.ts`) são **fictícios
plausíveis** (Radiz Engenharia, Contabilizy, Vitalys Saúde, TecNorte TI,
Sabor & Cia Alimentos, Mercado Fiel — mesmos nomes já usados como vitrine
em `HubScreen.tsx`, não um elenco paralelo) — nunca dados reais de empresas
conhecidas sem autorização, conforme a regra de segurança do card.
