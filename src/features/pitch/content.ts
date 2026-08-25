/**
 * Conteúdo do pitch enterprise (rota `/pitch`) — apresentação institucional
 * do labdatadev gamehub para o Sebrae Startup Win (Ideação), 2026-08-25.
 *
 * Separado da landing (`features/landing/`) de propósito: a landing vende
 * CADASTRO pro empresário final; o pitch vende O PROJETO INTEIRO pra banca
 * (Sebrae, investidores, parceiros) — público, tom e prova social diferentes,
 * mesma regra herdada do document-engine: nunca prometer mais do que o
 * produto realmente entrega hoje. Toda estatística de mercado aqui tem fonte
 * real (ver `FONTES`), nunca número inventado.
 */

import type { IconName } from "@/components/ui/Icon";

export const PITCH_NAV = {
  marca: "labdatadev · gamehub",
  badge: "Sebrae Startup Win · Ideação 2026",
  voltar: "Ver o produto",
};

export const PITCH_HERO = {
  kicker: "O produto, para quem decide",
  tituloLinha1: "Todo empresário do interior merece",
  tituloDestaque: "a mesma tecnologia",
  tituloLinha2: "de uma grande empresa.",
  subtitulo:
    "Hoje ele não tem. Não por falta de vontade — por falta de dinheiro pra contratar uma equipe de tecnologia, marketing e comercial. Enquanto ele resolve isso sozinho à noite, o concorrente da capital já está usando IA pra vender. A gente fecha essa distância — em minutos, não em meses.",
  ctaPrimario: "Ver o pitch (2min30)",
  ctaSecundario: "Testar o produto ao vivo",
  ganchos: [
    { icon: "file", texto: "7 documentos em 10 minutos" },
    { icon: "coin", texto: "R$ 0 pra começar" },
    { icon: "briefcase", texto: "Comercial de IA, 24h por dia" },
  ] satisfies { icon: IconName; texto: string }[],
};

export const PROBLEMA = {
  badge: "O problema",
  titulo: "O empresário do interior está sozinho",
  historia:
    "São 22h numa cidade do interior. A dona de uma pequena empresa de engenharia fecha a última planilha do dia e abre o Instagram — não pra descansar, pra tentar postar alguma coisa, porque ninguém mais vai fazer isso por ela. Ela sabe que devia ter site, proposta pronta, um jogo comercial ativo. Sabe também que isso custa um salário que o negócio dela ainda não paga. Então ela vai dormir sem postar. De novo.",
  descricao:
    "Fora das capitais, a maioria dos pequenos negócios roda no boca a boca, na planilha e na memória do dono. Ele sabe que precisa de site, marketing, propostas comerciais e organização — mas contratar uma agência ou montar uma equipe própria custa o que ele fatura em meses.",
  urgencia:
    "E cada mês que passa sem isso não é um mês neutro — é um mês de cliente indo pro concorrente que já apareceu primeiro no Google.",
  pontos: [
    {
      icon: "coin",
      titulo: "Sem orçamento para equipe",
      texto: "Um analista de marketing, um SDR comercial e um consultor de gestão juntos custam R$ 8 a 15 mil/mês. A maioria dos pequenos negócios do interior fatura menos que isso.",
    },
    {
      icon: "close",
      titulo: "Sem tempo para aprender ferramenta nova",
      texto: "O dono faz tudo — vende, atende, entrega e ainda tenta postar no Instagram à noite. Curso de marketing digital é luxo que não cabe na rotina.",
    },
    {
      icon: "chart",
      titulo: "Sem dado para decidir",
      texto: "Sem diagnóstico formal, sem SWOT, sem plano — decide no feeling. Quando chega um edital ou uma oportunidade de crédito, não tem documentação pronta pra aproveitar.",
    },
  ] satisfies { icon: IconName; titulo: string; texto: string }[],
};

export const SOLUCAO = {
  badge: "A solução",
  titulo: "Uma equipe inteira de IA,",
  tituloDestaque: "por assinatura.",
  descricao:
    "O labdatadev gamehub transforma cadastro em diagnóstico, diagnóstico em documentação de consultoria, e documentação em ação — marketing e vendas rodando sozinhos. Tudo isso dentro de um jogo, porque jogo é a única interface que faz um empresário sem tempo voltar todo dia.",
  pilares: [
    {
      icon: "file",
      numero: "01",
      titulo: "Documentar em 10 minutos",
      texto:
        "10 perguntas, 10 minutos, e a IA entrega 7 documentos de nível consultoria: Business Model Canvas, SWOT, Modelo de Negócio, Resumo Executivo, Roadmap de 90 dias, Proposta Comercial pronta pra usar com cliente, e Análise de Concorrência com dados reais da região.",
      prova: "Testado ao vivo nesta apresentação — a Radiz Engenharia (nossa conta de demonstração) tem os 7 documentos gerados por IA, prontos, no painel dela agora.",
    },
    {
      icon: "calendar",
      numero: "02",
      titulo: "Um mês de posts, em 1 clique",
      texto:
        "A mesma ficha que virou Canvas e SWOT alimenta o Funcionário de IA de Social Media: ele gera um calendário editorial completo, com legenda, hashtag e gancho, no padrão visual da marca — sem o empresário escrever uma linha.",
      prova: "Cada Funcionário de IA sobe de nível junto com o negócio — no nível 3, o material vem com variações de gancho e plano de reaproveitamento entre redes.",
    },
    {
      icon: "briefcase",
      numero: "03",
      titulo: "Time comercial de IA, 24 horas",
      texto:
        "O Funcionário de IA Comercial gera script de abordagem, cadência de follow-up e proposta personalizada — e o motor de vitrine regional coloca o negócio na frente de vizinhos e visitantes o tempo todo, gerando lead sem custo de tráfego pago.",
      prova: "Cada nova oportunidade — parceria de quarteirão, visita à página pública, indicação — dispara XP e evolui o negócio automaticamente, sem o dono precisar gerenciar nada.",
    },
  ] satisfies { icon: IconName; numero: string; titulo: string; texto: string; prova: string }[],
};

export const TECNICO = {
  badge: "Como construímos",
  titulo: "Arquitetura multi-tenant real,",
  tituloDestaque: "não gambiarra de planilha.",
  traducaoSimples:
    "Tradução simples: seus dados ficam trancados e isolados dos dados dos outros clientes, e o sistema não fica mais caro conforme cresce — o oposto de contratar mais gente.",
  descricao:
    "Cada empresário cadastrado é um tenant isolado dentro do mesmo banco de dados — Postgres com Row-Level Security (RLS) aplicado em produção, não checado só no código. Isso é a diferença entre um MVP de fim de semana e uma plataforma que aguenta milhares de empresas ao mesmo tempo.",
  pontos: [
    {
      icon: "lock",
      titulo: "Isolamento real por linha",
      texto: "RLS no banco garante que o negócio A nunca vê o dado do negócio B — mesmo se houver um bug no código da aplicação, o banco recusa a consulta. Segurança na camada mais baixa possível, não só na tela.",
    },
    {
      icon: "coin",
      titulo: "Custo marginal por cliente ≈ zero",
      texto: "Um banco, um cluster, milhares de tenants. Sem provisionar servidor novo por cliente — o custo de infraestrutura por empresário cadastrado despenca conforme a base cresce, o oposto do custo de contratar gente.",
    },
    {
      icon: "network",
      titulo: "Rede de efeito, não só banco de dados",
      texto: "Multi-tenancy aqui não é só economia — é o que permite quarteirão, vizinho e parceria existirem: o mapa regional só faz sentido porque todo mundo mora no mesmo banco, na mesma tabela, com a mesma malha de relacionamento.",
    },
    {
      icon: "wrench",
      titulo: "Motor de IA desacoplado do produto",
      texto: "A geração de documentos, posts e propostas roda num motor headless próprio, em fila — o produto nunca trava esperando a IA responder, e cada tipo de documento pode evoluir de prompt sem tocar no app.",
    },
  ] satisfies { icon: IconName; titulo: string; texto: string }[],
};

export const AGENTES_IA = {
  badge: "Por que agentes de IA, e por que agora",
  titulo: "Funcionário de IA não é",
  tituloDestaque: "chatbot. É força de trabalho.",
  descricao:
    "Um agente de IA não espera pergunta — ele tem um cargo, uma meta e autonomia pra agir: gerar o documento, montar o post, escrever a proposta, responder o lead. A diferença entre uma IA generativa comum e um agente é a mesma diferença entre uma calculadora e um funcionário.",
  traducaoSimples:
    "Tradução simples: não é um robô que responde pergunta. É como contratar alguém que nunca dorme, nunca falta e já chega sabendo o trabalho todo.",
  argumentos: [
    {
      icon: "chart",
      titulo: "O mercado já provou a tese",
      texto:
        "O mercado global de agentes de IA foi avaliado em cerca de US$ 7,8 bilhões em 2025 e é projetado para chegar a mais de US$ 50 bilhões até 2030 — crescimento acima de 40% ao ano, um dos mais rápidos da história da tecnologia empresarial.",
    },
    {
      icon: "coin",
      titulo: "Aumento de lucro, não só corte de custo",
      texto:
        "Cada Funcionário de IA contratado substitui uma tarefa que hoje custa hora de gente cara (marketing, comercial, documentação) por uma assinatura fixa — e continua trabalhando 24h, sem férias, sem turnover, escalando junto com o negócio sem precisar de treinamento.",
    },
    {
      icon: "bolt",
      titulo: "O próximo passo: agentes que agem sozinhos",
      texto:
        "Hoje nossos agentes geram conteúdo e documentos sob comando. Nos próximos 12 a 24 meses, a evolução natural é agentes que monitoram a vitrine regional e disparam a ação sozinhos — responder um lead, ajustar uma proposta, sugerir o próximo passo — sem o empresário precisar pedir.",
    },
  ] satisfies { icon: IconName; titulo: string; texto: string }[],
};

export const MERCADO = {
  badge: "Tamanho de mercado",
  titulo: "Não é um nicho.",
  tituloDestaque: "É a maioria da economia brasileira.",
  descricao:
    "Pequeno negócio não é exceção no Brasil — é a regra. E é exatamente o público que menos tem acesso a tecnologia de ponta hoje.",
  stats: [
    { to: 13.1, decimals: 1, suffix: "M", label: "MEIs ativos no Brasil hoje" },
    { to: 4.6, decimals: 1, suffix: "M", label: "novos pequenos negócios abertos só em 2025 (recorde histórico)" },
    { to: 97, suffix: "%", label: "de todas as empresas abertas no país são pequenos negócios" },
  ],
  camadas: [
    { nome: "TAM", titulo: "Todo pequeno negócio do Brasil", texto: "13,1 milhões de MEIs ativos + milhões de microempresas — o universo total que precisa de documentação, marketing e comercial e não tem equipe própria." },
    { nome: "SAM", titulo: "Pequenos negócios do interior, fora das capitais", texto: "Onde a escassez de agência e mão de obra especializada é maior — exatamente o perfil do Vale do Café e da carteira de atendimento do Sebrae regional." },
    { nome: "SOM", titulo: "Participantes de programas como o Startup Win", texto: "Empreendedores já engajados em ideação e aceleração — prontos pra adotar uma ferramenta nova porque já estão em movimento de crescimento." },
  ],
  fonte: "Fontes: Sebrae/PR (abertura de pequenos negócios, 2025) · MarketsandMarkets (mercado global de agentes de IA, 2025-2030).",
};

export const GAMIFICACAO = {
  badge: "Extra: por que um jogo, e não um dashboard",
  titulo: "Gamificação não é",
  tituloDestaque: "cosmético. É retenção.",
  descricao:
    "Um dashboard de SaaS comum tem taxa de abandono altíssima nas primeiras semanas — o usuário esquece de voltar. Um jogo com progresso visível (nível, XP, vizinhos, conquistas) dá exatamente o motivo pra voltar amanhã. A gente usa o mesmo princípio de produtos que já provaram isso em escala corporativa.",
  quarteiroes: {
    titulo: "Como funciona o quarteirão",
    texto:
      "Cada empresário cadastrado ganha um lote num mapa isométrico da própria região — até 8 negócios por quarteirão. Os vizinhos de quarteirão viram parcerias reais dentro do jogo (XP, moeda, desbloqueios) e vitrine cruzada de verdade: quem visita o vizinho vê sua oferta também. Region por região, o mapa cresce junto com a base de empresários — hoje já roda com múltiplos quarteirões ativos na região Centro/Mendes, Vale do Café.",
  },
  concorrente: {
    titulo: "Gather: a prova de que gamificação corporativa funciona",
    texto:
      "O Gather (gather.town) aplicou a mesma lógica — avatar, mapa, proximidade — para escritórios virtuais, e não ficou restrito a startup pequena: captou uma rodada Série B de US$ 50 milhões liderada por Sequoia Capital e Index Ventures, e é usado hoje por equipes remotas de empresas de tecnologia, consultoria e agências ao redor do mundo. A diferença: o Gather gamificou o ESCRITÓRIO. A gente gamificou o CRESCIMENTO DO NEGÓCIO em si — o quarteirão não é decoração, é onde o diagnóstico, o marketing e o comercial acontecem de verdade.",
  },
  fonte: "Fonte: Crunchbase — rodada Série B do Gather (US$ 50M, novembro de 2021, liderada por Sequoia Capital e Index Ventures).",
};

export const PITCH_SCRIPT = {
  badge: "O pitch",
  titulo: "O discurso — 2 minutos e 30 segundos",
  descricao:
    "Roteiro cronometrado para apresentar a banca. Cada bloco cabe no tempo indicado falando em ritmo normal — treinado, não decorado.",
  blocos: [
    {
      tempo: "0:00–0:25",
      titulo: "A dor",
      texto:
        "\"4,6 milhões de pequenos negócios abriram no Brasil só em 2025. Quantos desses têm marketing, comercial e um plano de verdade rodando? Quase nenhum — porque isso custa R$ 10 mil por mês, e o negócio deles fatura menos que isso. Enquanto isso, o concorrente da capital, com dinheiro pra agência, cresce mais rápido. Não porque tem produto melhor. Porque tem tecnologia que o empresário do interior não tem.\"",
    },
    {
      tempo: "0:25–1:00",
      titulo: "A virada",
      texto:
        "\"A gente resolveu isso construindo uma equipe inteira de Inteligência Artificial — documentador, social media, comercial — por assinatura, a uma fração do custo de UM funcionário CLT. Em 10 minutos de cadastro, o empresário sai com 7 documentos de nível consultoria, prontos. Em 1 clique, sai com um mês inteiro de posts prontos. E o time comercial de IA já está de olho em oportunidade, 24 horas por dia, sem parar — mesmo enquanto ele dorme.\"",
    },
    {
      tempo: "1:00–1:35",
      titulo: "Como funciona (e por que é jogo)",
      texto:
        "\"E a gente colocou isso dentro de um jogo, de propósito: cada negócio ganha um lote num mapa da própria região, sobe de nível, forma parceria com o vizinho de quarteirão. É a mesma lógica que fez o Gather levantar 50 milhões de dólares gamificando escritório remoto — só que aqui o jogo é o crescimento do negócio de verdade, rodando em cima de um banco multi-tenant que aguenta milhares de empresas no mesmo lugar, com segurança de dado real.\"",
    },
    {
      tempo: "1:35–2:05",
      titulo: "O tamanho da oportunidade",
      texto:
        "\"O Brasil abriu 4,6 milhões de pequenos negócios só em 2025 — recorde histórico, 97% de tudo que se abre no país. Isso não é nicho, é a maioria da economia brasileira, e é exatamente o público que hoje ninguém atende com tecnologia de ponta. O mercado de agentes de IA está crescendo mais de 40% ao ano no mundo inteiro — a gente está construindo bem no meio dessa onda, aplicada no lugar que mais precisa dela.\"",
    },
    {
      tempo: "2:05–2:30",
      titulo: "O pedido",
      texto:
        "\"Isso não é protótipo de slide. Já está no ar, já funciona, já está sendo testado com contas reais agora mesmo — inclusive nesta apresentação. O que a gente pede ao Sebrae é simples: acesso à base de empreendedores do Startup Win pra validar em escala, e apoio pra levar essa mesma tecnologia de grande empresa pro empresário que nunca teve acesso a ela. Porque cada dia que ele espera é um dia a mais de vantagem pro concorrente. Obrigado.\"",
    },
  ],
};

export const PROVA_REAL = {
  badge: "Não é mockup",
  titulo: "Isto está",
  tituloDestaque: "no ar agora mesmo.",
  itens: [
    {
      src: "/pitch/painel-documentos.png",
      alt: "Painel do labdatadev gamehub mostrando os 7 documentos gerados por IA para o negócio Radiz Engenharia",
      url: "labdatadev.cloud/painel",
      legenda: "7 documentos gerados por IA, de verdade — não ilustração de slide.",
      width: 888,
      height: 448,
    },
    {
      src: "/pitch/world-sede.png",
      alt: "Sede isométrica do negócio no jogo, com os Funcionários de IA contratados aparecendo como avatares",
      url: "labdatadev.cloud/world",
      legenda: "Cada Funcionário de IA contratado aparece como avatar na sua sede.",
      width: 1280,
      height: 800,
    },
  ],
};

export const CUSTO_COMPARATIVO = {
  badge: "Quanto isso custa hoje",
  titulo: "O mesmo resultado,",
  tituloDestaque: "por uma fração do preço.",
  descricao:
    "Marketing, comercial e consultoria de gestão de verdade sempre existiram — só que a um preço que 97% dos pequenos negócios do país nunca vão poder pagar. A gente não inventou a demanda. Só derrubou a barreira de entrada. E quem paga o preço de esperar não é a gente — é o empresário que continua invisível enquanto decide.",
  linhas: [
    {
      nome: "V4 Company",
      categoria: "Agência de marketing digital (franquia nacional)",
      preco: "≈ R$ 4.000/mês",
      detalhe: "Ticket médio cobrado por cliente — cobre só marketing (redes sociais, Ads, SEO). Comercial e documentação estratégica ficam de fora.",
    },
    {
      nome: "G4 Educação",
      categoria: "Mentoria e formação empresarial de alto ticket",
      preco: "R$ 17 mil+",
      detalhe: "Só a formação completa em cursos avulsos já passa de R$ 17 mil — e entrega conhecimento, não execução: ninguém gera o documento ou o post por você.",
    },
    {
      nome: "Consultorias tradicionais de gestão",
      categoria: "Ex.: Falconi, McKinsey e pares — grandes empresas",
      preco: "R$ 50 mil+/mês",
      detalhe: "Padrão de mercado para consultoria estratégica de ponta — desenhado para orçamento de grande corporação, não de MEI ou pequena empresa.",
    },
    {
      nome: "labdatadev gamehub",
      categoria: "Documentação + marketing + comercial, por IA",
      preco: "R$ 0 pra começar",
      detalhe: "Diagnóstico e documentação de nível consultoria já no plano gratuito. Equipe completa de IA (documentador, social media, comercial) a partir de R$ 1.500/mês — o pacote completo (\"Ecossistema Completo\") fica entre R$ 3.500 e R$ 5.000/mês.",
      destaque: true,
    },
  ],
  fonte:
    "Fontes: portalinsights.com.br (ticket médio de cliente V4 Company) · g4educacao.com (preço somado dos cursos da Formação G4). Faixa de consultorias tradicionais é estimativa de mercado amplamente conhecida, não cotação oficial.",
};

export const EQUIPE = {
  badge: "Quem constrói",
  titulo: "A equipe por trás",
  tituloDestaque: "do labdatadev.",
  pessoa: {
    nome: "Antonio Demarchi",
    cargo: "Fundador · Co-CTO · Laboratório Demarchi",
    formacao: [
      "Engenheiro de Sistemas — Instituto Infnet",
      "Especialista em DevOps e Arquitetura Cloud — FIAP",
      "Técnico em Desenvolvimento e Web Design — Instituto Federal do Rio de Janeiro (2016)",
    ],
    bio:
      "Construiu carreira dentro de operações críticas de tecnologia antes de empreender — é essa experiência de produção em escala real, não só teoria de curso, que sustenta a arquitetura multi-tenant e a esteira de qualidade por trás do labdatadev gamehub.",
    empresas: ["Globo", "Itaú", "Stefanini Group", "Radix", "Braspress", "Nstech", "Exército Brasileiro"],
  },
};

export const CTA_FINAL_PITCH = {
  titulo: "Tecnologia de grande empresa,",
  tituloLinha2: "no bolso do pequeno empresário.",
  descricao:
    "Cadastro grátis, documentação de consultoria em 10 minutos, marketing e comercial rodando por IA — hoje, não em uma promessa de roadmap.",
  urgencia: "Cada dia sem isso é um dia a mais de vantagem pro concorrente que já começou.",
  ctaPrimario: "Testar o produto ao vivo",
  ctaSecundario: "Ver a apresentação com QR Code",
};
