# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Cada entrada aponta o card do backlog e o documento que detalha a mudança.

## [Não lançado] — 2026-10-23

### Adicionado
- **Contratos semanais e de jornada** (`GH-ECO-01`): seis contratos, período ISO
  no horário de Brasília, pagamento atômico e idempotente. Até 🪙 440 por
  semana. → [`docs/ECONOMIA-E-JORNADA.md`](docs/ECONOMIA-E-JORNADA.md)
- **Jornada** de nove passos, sempre ligada a vender mais, no lugar das missões
  antigas.
- **Parceria do Laboratório** na história: toda escolha paga 🪙 400 e fecha a
  conta do Canvas nível 1. Capítulos novos: *Canvas pronto*, *Primeira semana*.
- **Canvas enterprise por nicho** (`GH-CAN-01`): canvas desenhado na grade
  clássica no início do documento; 9 quadros × 8 segmentos com pergunta,
  resposta, boa prática, indicador e hipótese; maturidade derivada do cadastro;
  índice de clareza; resumo executivo; plano de 90 dias; matriz de riscos;
  checklist de validação; A4 paisagem. → [`docs/CANVAS-ENTERPRISE.md`](docs/CANVAS-ENTERPRISE.md)
- "Ver no navegador" para Canvas, script e roteiro (`?ver=1`).
- Migration `0040_contratos_e_economia.sql` (aplicada em ordem pela produção, depois da `0039`).
- Guias: `CANVAS-ENTERPRISE.md`, `RESPONSIVIDADE.md`, `ECONOMIA-E-JORNADA.md`.

### Alterado
- **Canvas usa o cadastro completo da produção**: problema que o cliente
  resolve, diferencial, prova social, concorrentes, modelo de receita, ticket
  médio, clientes pagantes e relação com o poder público entram nos quadros e
  na maturidade.
- **Responsividade de 375 a 1920 px** (`GH-RESP-01`): shell em dois modos
  (coluna abaixo de 1024 px, cena acima), altura ligada à janela, HUD,
  navegação, menu lateral e modais adaptados. → [`docs/RESPONSIVIDADE.md`](docs/RESPONSIVIDADE.md)
- A carta de história passou a ser um overlay rolável e encadeia a próxima carta
  sem recarregar a página.
- Contratar um Funcionário de IA **custa** moeda (🪙 300/400/600/900) e não paga
  mais prêmio; o Documentador abre no degrau 1.
- Moeda inicial de 500 para 100 (o Canvas nível 1 depende da parceria).

### Corrigido (segurança e economia)
- `recompensar()` aceitava qualquer evento, quantas vezes se quisesse: agora é
  lista permitida.
- `escolherNoCapitulo` aceitava capítulo que ainda não tinha chegado.
- Escolha de história que custa moeda saía de graça sem saldo.
- Policies de RLS permitiam o navegador alterar a própria moeda/XP e inserir
  contratação, trabalho e nó diretamente (removidas em `0040`; a produção já
  havia revogado o `update` em `0035`/`0036`, restava o `insert` de
  `funcionarios_contratados`).

### Conhecido
- Dupla contratação simultânea do mesmo cargo aplica XP/degrau duas vezes
  (a moeda é cobrada uma vez).
- Migration `0040` só teve a **sintaxe** validada; falta Postgres real fora da produção.
- Teste visual de layout é manual (`GH-QA-01`).
