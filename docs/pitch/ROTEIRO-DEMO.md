# Roteiro de demo — pitch Sebrae (GH-PITCH-01)

> Objetivo: demo ao vivo de ~6 minutos, com dados semeados previamente e
> caminho testado — nunca descobrir um bug na frente da banca. Este roteiro
> é o script; `docs/pitch/NARRATIVA-IMPACTO.md` é o discurso.

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
| 1 | 0:00–1:00 | `/cadastro` | Cadastro **ao vivo**, como um negócio novo real (ex.: "Padaria da Vila", segmento comércio, cidade Mendes, bairro Centro — mesmo bairro do seed, cai vizinho da Radiz/Vitalys). Passar rápido pelas 10 perguntas, marcar consentimento, criar conta. Narrativa: "isso é o cadastro real, sem trapaça — o mesmo que qualquer empresário faz". |
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
3. O roteiro acima funciona **idêntico** em modo local — nenhum passo
   depende de rede externa (o próprio produto não tem chamada de API
   externa nenhuma hoje).

## O que NÃO mostrar (ainda não pronto ou incompleto)

- Painel de oportunidades admin (`GH-GROW-05`) — não implementado.
- Zoom do mapa por camadas (`GH-MAPA-02`) — o mapa hoje é só o quarteirão,
  não região→cidade→quarteirão.
- Qualquer coisa em `/admin/eventos` **na frente da banca** sem necessidade
  — é ferramenta interna, não parte da narrativa do produto.

## Dados de demo — regra de ouro

Os 6 negócios semeados (`src/scripts/seed-demo.test.ts`) são **fictícios
plausíveis** (Radiz Engenharia, Contabilizy, Vitalys Saúde, TecNorte TI,
Sabor & Cia Alimentos, Mercado Fiel — mesmos nomes já usados como vitrine
em `HubScreen.tsx`, não um elenco paralelo) — nunca dados reais de empresas
conhecidas sem autorização, conforme a regra de segurança do card.
