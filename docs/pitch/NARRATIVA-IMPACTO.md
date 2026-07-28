# Narrativa de impacto regional — material do pitch Sebrae (GH-PITCH-02)

> Honestidade sobre o estágio é vantagem competitiva num pitch — bancas
> experientes detectam exagero. Este documento separa **o que já funciona**
> (testado, com número real por trás) de **o que é visão** (direção, não
> promessa). Nunca apresentar a segunda coluna como se fosse a primeira.

## A frase que explica o produto para quem não é técnico

> **"Um jogo de gestão de empresa, no estilo Habbo/SimCity, onde cada ação
> dentro do jogo é também uma ação real no seu negócio — e cada empresário
> da região é seu vizinho de verdade, não um bot."**

Versão de uma frase só: *o empresário evolui seu negócio jogando, e ao
jogar, contrata ajuda de verdade (agentes de IA por assinatura) e forma
rede com quem está ao lado.*

## O que já funciona hoje (testado, não promessa)

- **Cadastro real** vira um negócio no mapa, com endereço (cidade → bairro
  → quarteirão → lote) — vizinhos são negócios reais, não decoração.
- **Economia de 5 eixos** (Tecnologia, Processo, Presença, Aquisição,
  Capacidade) — cada ação de negócio real move um eixo específico,
  calculado a partir de um diagnóstico de 10 perguntas no cadastro.
- **Funcionários de IA** — 4 cargos (Documentador, Social Media, Editor de
  Vídeo, Comercial/SDR) contratáveis por assinatura dentro do jogo, com
  preço real já calibrado (R$ 297 a R$ 897/mês).
- **Marketplace de serviços reais** com fluxo de alocação de equipe — o
  jogador escolhe QUEM (equipe humana ou de IA) executa cada entrega,
  baseado na capacidade real que aquela equipe representa.
- **Rede regional viva** — formar parceria com um vizinho de quarteirão,
  visitar a sede de outro negócio, convidar um vizinho real (com recompensa
  mútua só quando o convite vira cadastro de verdade, nunca no clique).
- **Vitrine pública indexável** — cada negócio ganha uma página que o
  Google encontra, com opt-out explícito e LGPD desde o primeiro cadastro.
- **Trilha educacional** — cada degrau da escada de valor vem com uma
  lição curta ("o porquê", não teoria solta), ligada a uma ação concreta.
- **Mundo isométrico navegável** (o "wow visual") — sede real, mobília,
  avatar que anda pela sala, Funcionários de IA visíveis como personagens.

Todos os itens acima têm testes automatizados cobrindo a lógica de negócio
e foram validados de ponta a ponta com dados de demonstração antes deste
documento existir (ver `docs/pitch/ROTEIRO-DEMO.md`).

## O que é visão (direção clara, não entregue ainda)

- Motor de simulação com necessidades/humor da equipe (estilo The Sims) —
  pesquisa de mercado feita, arquitetura decidida, implementação não
  iniciada (maior item do roadmap técnico).
- Navegação por zoom região → cidade → quarteirão no mapa (hoje é só o
  quarteirão).
- Painel de prospecção comercial automática para a labdatadev (priorização
  de leads por oportunidade real) — adiado deliberadamente por lidar com
  dado sensível de todos os negócios ao mesmo tempo, não é algo para
  apressar.
- Deploy em produção real — toda a esteira (VPS, CI/CD, RLS validado em
  runtime) está pronta e testada por sintaxe, mas ainda não rodou contra
  infraestrutura real.

## Conexão com desenvolvimento econômico regional

O Vale do Café (Mendes, Vassouras, Barra do Piraí, Piraí, Volta Redonda,
Resende) tem PMEs reais fornecendo para o poder público via licitação —
engenharia, contabilidade, saúde, tecnologia, alimentação/merenda escolar.
Essas empresas frequentemente **não têm CTO, não têm processo documentado,
e competem sem presença digital**. O gamehub ataca isso de dois jeitos ao
mesmo tempo: (1) o jogo torna a jornada de maturidade digital motivadora em
vez de burocrática, e (2) cada negócio que entra cria uma página pública
que atrai mais negócios — o ecossistema se anuncia sozinho, sem verba de
marketing paga, criando um efeito de rede regional que beneficia a região
inteira, não só quem contrata o labdatadev diretamente.

## Modelo de sustentabilidade — como o projeto se paga

**Hoje, concreto:** assinatura mensal recorrente dos Funcionários de IA
(R$ 297–897/mês por cargo) — é receita real, com preço já calibrado contra
a metodologia de precificação da labdatadev, não um número inventado para
o pitch.

**Direção de médio prazo (visão, não compromisso):** comissão sobre
serviços avulsos fechados no marketplace, e — o mais alinhado à missão do
Sebrae — cada negócio cadastrado se torna um canal de divulgação orgânico
do próprio programa de apoio a PMEs, sem custo de aquisição pago.

**Regra inegociável:** moeda virtual (🪙, XP, progresso) nunca se converte
em dinheiro real, e nenhuma tela do produto sugere o contrário — toda
cobrança real acontece fora do loop de jogo, na assinatura dos
Funcionários de IA.
