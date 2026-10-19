import type { Respostas } from "@/lib/db/types";

/**
 * Conhecimento transversal, igual para qualquer mercado: o que fazer em cada
 * objetivo de 90 dias, como ler cada gargalo e como o tamanho da equipe, a
 * presença digital e o orçamento mudam a recomendação.
 *
 * Tudo aqui é DOCUMENTO INTERNO: usa as respostas privadas do cadastro e por
 * isso nunca alimenta texto que o dono publica para clientes.
 *
 * Regra de ouro dos números: a IA não conhece a linha de base do negócio.
 * Por isso as ações trazem "indicador" (o que medir) e NUNCA uma meta
 * inventada ("aumentar 30%"): a meta é um campo em branco para o dono
 * preencher depois de medir por duas semanas.
 */

export interface AcaoPlano {
  acao: string;
  /** tempo estimado do dono — honesto, para caber na rotina de quem trabalha sozinho */
  esforco: string;
  indicador: string;
}

export interface PlanoObjetivo {
  rotulo: string;
  /** frase de foco do ciclo */
  foco: string;
  /** o que fazer na primeira semana: pequeno e concreto */
  primeirasAcoes: string[];
  fase30: AcaoPlano[];
  fase60: AcaoPlano[];
  fase90: AcaoPlano[];
  indicadorPrincipal: string;
}

export const PLANOS: Record<Respostas["objetivo"], PlanoObjetivo> = {
  "mais-leads": {
    rotulo: "Gerar mais oportunidades",
    foco: "Fazer mais gente certa chegar até você e responder rápido a cada contato.",
    primeirasAcoes: [
      "Completar o Perfil da Empresa no Google: nome, horário, telefone, fotos e categoria",
      "Escrever em uma folha a sua oferta principal, o preço de referência e para quem ela serve",
      "Colocar o link do WhatsApp na bio do Instagram e no Perfil do Google",
    ],
    fase30: [
      {
        acao: "Responder todo contato novo em até 5 minutos no horário comercial, usando mensagem de saudação e respostas prontas",
        esforco: "30 minutos para configurar; depois, rotina diária",
        indicador: "Tempo médio da primeira resposta",
      },
      {
        acao: "Publicar duas vezes por semana mostrando o serviço e respondendo dúvidas comuns dos clientes",
        esforco: "1 hora por semana",
        indicador: "Mensagens recebidas por semana",
      },
      {
        acao: "Pedir avaliação no Google a cada cliente satisfeito",
        esforco: "2 minutos por cliente",
        indicador: "Avaliações novas no mês",
      },
    ],
    fase60: [
      {
        acao: "Montar uma lista de 30 pessoas e empresas que compram ou indicam e fazer o primeiro contato com cada uma",
        esforco: "2 horas por semana",
        indicador: "Contatos feitos e respostas recebidas",
      },
      {
        acao: "Criar uma oferta de entrada (visita, diagnóstico, amostra ou primeira consulta) que facilite o primeiro passo",
        esforco: "2 horas",
        indicador: "Pessoas que aceitam a oferta de entrada",
      },
    ],
    fase90: [
      {
        acao: "Comparar os canais e repetir o que trouxe mais clientes",
        esforco: "1 hora por mês",
        indicador: "Contatos e vendas por canal",
      },
      {
        acao: "Definir a meta de contatos do próximo ciclo a partir dos números reais dos últimos 60 dias",
        esforco: "1 hora",
        indicador: "Meta numérica escrita",
      },
    ],
    indicadorPrincipal: "Contatos novos por semana",
  },

  organizar: {
    rotulo: "Organizar os processos",
    foco: "Fazer cada tarefa do mesmo jeito, por escrito, e saber em que pé está cada pedido.",
    primeirasAcoes: [
      "Listar as 5 tarefas que mais se repetem e quem faz cada uma",
      "Escolher um único lugar para guardar clientes, pedidos e combinados (planilha ou caderno)",
      "Reservar 30 minutos toda sexta para revisar a semana",
    ],
    fase30: [
      {
        acao: "Escrever o passo a passo do atendimento e do orçamento (procedimento 1 do manual de processos)",
        esforco: "2 horas",
        indicador: "Atendimentos feitos seguindo o padrão",
      },
      {
        acao: "Registrar todos os clientes e pedidos em uma planilha única",
        esforco: "30 minutos por dia, no início",
        indicador: "Pedidos sem registro (meta: nenhum)",
      },
    ],
    fase60: [
      {
        acao: "Escrever o passo a passo da entrega e treinar quem executa (procedimento 2)",
        esforco: "3 horas",
        indicador: "Entregas feitas dentro do padrão",
      },
      {
        acao: "Definir quem decide o quê e quem substitui quem nas ausências",
        esforco: "1 hora",
        indicador: "Tarefas paradas por falta de responsável",
      },
    ],
    fase90: [
      {
        acao: "Revisar os procedimentos com a equipe e ajustar o que não funcionou",
        esforco: "2 horas",
        indicador: "Procedimentos revisados",
      },
      {
        acao: "Comparar retrabalho e atrasos com o primeiro mês",
        esforco: "1 hora",
        indicador: "Retrabalho e atrasos por mês",
      },
    ],
    indicadorPrincipal: "Retrabalho e atrasos por mês",
  },

  "vender-mais": {
    rotulo: "Vender mais para quem já é cliente",
    foco: "Fazer quem já comprou voltar a comprar e indicar.",
    primeirasAcoes: [
      "Listar os 20 melhores clientes e a data da última compra de cada um",
      "Escolher um produto ou serviço complementar para oferecer a quem já comprou",
      "Escrever uma mensagem de agradecimento personalizada",
    ],
    fase30: [
      {
        acao: "Enviar mensagem de retomada aos clientes que não compram há mais de 60 dias (modelo no kit comercial)",
        esforco: "1 hora por semana",
        indicador: "Clientes que respondem e voltam a comprar",
      },
      {
        acao: "Perguntar a cada cliente atendido o que mais ele precisa",
        esforco: "2 minutos por cliente",
        indicador: "Pedidos de novos itens ou serviços",
      },
    ],
    fase60: [
      {
        acao: "Criar um pacote ou combinação com condição especial para recompra",
        esforco: "2 horas",
        indicador: "Pacotes vendidos",
      },
      {
        acao: "Pedir indicação a clientes satisfeitos, com uma mensagem pronta",
        esforco: "1 hora por semana",
        indicador: "Indicações recebidas",
      },
    ],
    fase90: [
      {
        acao: "Montar um calendário de datas e lembretes de recompra por tipo de cliente",
        esforco: "2 horas",
        indicador: "Lembretes enviados no prazo",
      },
      {
        acao: "Identificar os clientes mais rentáveis e criar um tratamento especial para eles",
        esforco: "1 hora",
        indicador: "Clientes recorrentes (%)",
      },
    ],
    indicadorPrincipal: "Clientes que compram de novo (%)",
  },

  aparecer: {
    rotulo: "Ser mais conhecido na região",
    foco: "Ser lembrado e encontrado por quem mora perto e precisa do que você faz.",
    primeirasAcoes: [
      "Escrever em uma frase como o negócio quer ser lembrado",
      "Usar a mesma foto de perfil e o mesmo nome no Instagram, no Google e no WhatsApp",
      "Fotografar o espaço, o produto ou o serviço com luz natural",
    ],
    fase30: [
      {
        acao: "Publicar três vezes por semana com fotos reais do trabalho, usando os carrosséis deste pacote",
        esforco: "2 horas por semana",
        indicador: "Alcance e salvamentos das publicações",
      },
      {
        acao: "Completar e manter atualizado o Perfil da Empresa no Google",
        esforco: "1 hora no início; 10 minutos por semana",
        indicador: "Visualizações do perfil",
      },
    ],
    fase60: [
      {
        acao: "Fazer uma ação em conjunto com dois negócios vizinhos (indicação mútua, sorteio ou evento)",
        esforco: "3 horas",
        indicador: "Novos seguidores e contatos vindos da ação",
      },
      {
        acao: "Entrar em grupos e eventos da cidade e se apresentar de forma útil, sem só divulgar",
        esforco: "1 hora por semana",
        indicador: "Convites e conversas iniciadas",
      },
    ],
    fase90: [
      {
        acao: "Repetir os formatos que mais geraram salvamentos e mensagens",
        esforco: "1 hora por mês",
        indicador: "Mensagens vindas das publicações",
      },
      {
        acao: "Definir o tema e as datas do próximo ciclo de conteúdo",
        esforco: "1 hora",
        indicador: "Calendário do ciclo pronto",
      },
    ],
    indicadorPrincipal: "Pessoas da região que conhecem e procuram o negócio",
  },

  automatizar: {
    rotulo: "Ganhar tempo automatizando",
    foco: "Tirar da sua mão o que se repete e dedicar o tempo ao que só você faz.",
    primeirasAcoes: [
      "Listar as tarefas repetidas da semana e quanto tempo cada uma leva",
      "Configurar a mensagem de saudação e a de ausência no WhatsApp Business",
      "Criar 5 respostas rápidas para as perguntas mais comuns",
    ],
    fase30: [
      {
        acao: "Usar respostas rápidas e etiquetas de cliente no WhatsApp Business",
        esforco: "1 hora para configurar",
        indicador: "Horas por semana em atendimento repetitivo",
      },
      {
        acao: "Automatizar lembrete de horário ou de pagamento, se o negócio trabalha com agenda ou cobrança",
        esforco: "2 horas",
        indicador: "Faltas e atrasos de pagamento",
      },
    ],
    fase60: [
      {
        acao: "Substituir anotações soltas por planilha ou formulário para pedidos e orçamentos",
        esforco: "3 horas",
        indicador: "Pedidos registrados no sistema (%)",
      },
      {
        acao: "Montar o catálogo de produtos ou serviços no WhatsApp Business",
        esforco: "2 horas",
        indicador: "Pedidos vindos do catálogo",
      },
    ],
    fase90: [
      {
        acao: "Avaliar ferramenta paga apenas para a tarefa que mais consome tempo",
        esforco: "2 horas",
        indicador: "Horas economizadas por semana",
      },
      {
        acao: "Documentar o que foi automatizado e como pausar cada automação",
        esforco: "1 hora",
        indicador: "Automações documentadas",
      },
    ],
    indicadorPrincipal: "Horas por semana economizadas",
  },
};

export interface LeituraGargalo {
  /** como o gargalo aparece no dia a dia */
  diagnostico: string;
  /** a primeira ação que ataca o gargalo */
  acao: string;
  /** sinal para saber que está melhorando */
  sinal: string;
}

export const GARGALOS: Record<Respostas["gargalo"], LeituraGargalo> = {
  "perco-leads": {
    diagnostico: "Quando a resposta demora, o contato esfria e o cliente procura outro lugar.",
    acao: "Responder em até 5 minutos no horário comercial, com saudação e ausência configuradas, e fazer o primeiro retorno em 2 dias",
    sinal: "Orçamentos sem resposta diminuindo semana a semana",
  },
  manual: {
    diagnostico: "Tarefas repetidas e anotações soltas consomem tempo e geram erro.",
    acao: "Centralizar clientes e pedidos em uma planilha única e criar respostas rápidas para as perguntas mais comuns",
    sinal: "Menos horas por semana em tarefa repetida",
  },
  "sem-dados": {
    diagnostico: "Sem números, a decisão vira palpite e não dá para saber o que funciona.",
    acao: "Anotar toda semana: contatos recebidos, orçamentos enviados, vendas fechadas e de onde veio cada cliente",
    sinal: "Quatro semanas seguidas de números anotados",
  },
  "imagem-fraca": {
    diagnostico: "O negócio entrega mais do que mostra, e quem busca na internet não percebe isso.",
    acao: "Atualizar fotos e dados do Perfil da Empresa no Google e publicar uma vez por semana trabalhos reais",
    sinal: "Mais visualizações do perfil e mensagens vindas das redes",
  },
  "sem-processo": {
    diagnostico: "Cada pessoa faz de um jeito, o resultado varia e o conhecimento fica na cabeça de quem faz.",
    acao: "Escrever os procedimentos essenciais (atendimento, entrega e pós-venda) e treinar a equipe nos mesmos passos",
    sinal: "Menos retrabalho e menos dúvidas repetidas na equipe",
  },
};

export interface LeituraPresenca {
  leitura: string;
  prioridade: string;
  /** como aparece na célula "Canais" do canvas */
  canal: string;
}

export const PRESENCA_DIGITAL: Record<Respostas["presencaDigital"], LeituraPresenca> = {
  nada: {
    leitura: "O negócio ainda não aparece na internet.",
    prioridade: "Criar o Perfil da Empresa no Google e o WhatsApp Business com catálogo",
    canal: "Ainda sem presença digital: começar pelo Google e pelo WhatsApp",
  },
  social: {
    leitura: "O negócio aparece nas redes, mas pouco para quem pesquisa no Google.",
    prioridade: "Criar e completar o Perfil da Empresa no Google, com fotos e avaliações",
    canal: "Instagram e WhatsApp (falta ser encontrado no Google)",
  },
  portais: {
    leitura: "A maior parte da visibilidade depende de portais que cobram e que mostram a concorrência ao lado.",
    prioridade: "Criar um perfil próprio no Google e nas redes, para o cliente lembrar do negócio e não só do portal",
    canal: "Portais e plataformas (dependência de terceiros)",
  },
  "site-desatualizado": {
    leitura: "O site pode estar passando uma imagem pior do que o negócio entrega.",
    prioridade: "Atualizar o essencial no site: serviços, preço de referência, fotos reais e botão de WhatsApp",
    canal: "Site (precisa de atualização)",
  },
  "site-portais": {
    leitura: "A base digital existe. O próximo passo é medir de onde vêm os contatos e agilizar o primeiro atendimento.",
    prioridade: "Medir a origem de cada contato e automatizar a primeira resposta",
    canal: "Site e portais",
  },
};

export interface LeituraEquipe {
  leitura: string;
  /** publicações por semana que cabem na rotina (para o calendário) */
  publicacoesPorSemana: number;
  /** horas por semana que o dono consegue dedicar a marketing e vendas */
  horasMarketing: number;
  relacionamento: string[];
  custoPessoal: string;
}

export const EQUIPE: Record<Respostas["equipe"], LeituraEquipe> = {
  "so-eu": {
    leitura: "O negócio depende de uma pessoa só.",
    publicacoesPorSemana: 3,
    horasMarketing: 3,
    relacionamento: [
      "Atendimento direto do dono, com alta confiança e pouca escala",
      "Risco: se o dono para, tudo para; por isso os procedimentos por escrito importam",
    ],
    custoPessoal: "Pró-labore do dono (custo real, mesmo que não saia do caixa)",
  },
  "2-5": {
    leitura: "A equipe é pequena e o dono ainda participa de quase tudo.",
    publicacoesPorSemana: 3,
    horasMarketing: 4,
    relacionamento: [
      "Atendimento pela equipe, com o dono no fechamento",
      "É preciso um padrão para o cliente receber o mesmo atendimento de qualquer pessoa",
    ],
    custoPessoal: "Salários e encargos da equipe pequena, além do pró-labore",
  },
  "6-15": {
    leitura: "A equipe já é grande o bastante para precisar de regras e de responsáveis.",
    publicacoesPorSemana: 4,
    horasMarketing: 6,
    relacionamento: [
      "Atendimento distribuído entre pessoas e setores",
      "É preciso um registro único de clientes e de combinados para ninguém repetir pergunta",
    ],
    custoPessoal: "Folha de pagamento e encargos (maior custo fixo)",
  },
  "16-30": {
    leitura: "A empresa tem estrutura, e a falta de processo passa a custar caro.",
    publicacoesPorSemana: 5,
    horasMarketing: 10,
    relacionamento: [
      "Atendimento por equipes, com metas e acompanhamento",
      "É preciso um sistema de gestão de clientes e indicadores por equipe",
    ],
    custoPessoal: "Folha de pagamento, encargos e gestão (maior custo fixo)",
  },
  "30+": {
    leitura: "A empresa precisa de gestão por indicadores e de processos documentados.",
    publicacoesPorSemana: 5,
    horasMarketing: 12,
    relacionamento: [
      "Atendimento organizado por áreas, com padrão de qualidade",
      "É preciso um sistema de gestão integrado e rotinas de treinamento",
    ],
    custoPessoal: "Folha de pagamento, encargos e gestão (maior custo fixo)",
  },
};

export interface FaixaInvestimento {
  rotulo: string;
  orientacao: string;
  /** categorias de ferramenta, sem marca nem preço (que mudam) */
  ferramentas: string[];
  /** como a automação é montada nesta faixa */
  automacao: string;
}

const BASE_GRATUITA = [
  "WhatsApp Business (gratuito): perfil, catálogo, respostas rápidas e etiquetas",
  "Perfil da Empresa no Google (gratuito)",
  "Planilha online (para clientes, pedidos e números da semana)",
  "Agenda do celular ou agenda online (para horários e lembretes)",
];

export const INVESTIMENTO: Record<Respostas["investimento"], FaixaInvestimento> = {
  "nao-sei": {
    rotulo: "Ainda não definido",
    orientacao:
      "Comece só com ferramentas gratuitas e defina um teto mensal depois do primeiro mês, quando você já souber o que realmente usa.",
    ferramentas: BASE_GRATUITA,
    automacao:
      "Use os recursos do WhatsApp Business: saudação, ausência, respostas rápidas e etiquetas. Não custa nada e resolve a maior parte do atendimento.",
  },
  "ate-500": {
    rotulo: "Até R$ 500 por mês",
    orientacao:
      "Concentre em ferramentas gratuitas e use o orçamento só para impulsionar publicações com um teto semanal e acompanhar o resultado.",
    ferramentas: [
      ...BASE_GRATUITA,
      "Ferramenta de design, na versão gratuita",
      "Impulsionamento de publicações com teto semanal definido",
    ],
    automacao:
      "WhatsApp Business com saudação, ausência, respostas rápidas, etiquetas e catálogo, e uma planilha como controle de funil.",
  },
  "500-1500": {
    rotulo: "R$ 500 a R$ 1.500 por mês",
    orientacao:
      "Vale pagar por um sistema simples de agenda ou de pedidos e por impulsionamento regular, medindo o custo por contato.",
    ferramentas: [
      ...BASE_GRATUITA,
      "Sistema simples de agenda, de pedidos ou de orçamentos",
      "Ferramenta de design com recursos de marca",
      "Impulsionamento regular com custo por contato acompanhado",
    ],
    automacao:
      "Além do WhatsApp Business, um sistema de agenda com lembrete automático e um formulário de orçamento ligado à planilha.",
  },
  "1500-3500": {
    rotulo: "R$ 1.500 a R$ 3.500 por mês",
    orientacao:
      "Já cabe um CRM simples, automação de mensagens e anúncios locais acompanhados, mais produção pontual de foto e vídeo.",
    ferramentas: [
      ...BASE_GRATUITA,
      "CRM simples para acompanhar cada oportunidade",
      "Automação de mensagens e de lembretes",
      "Anúncios locais com acompanhamento de resultado",
      "Produção pontual de foto e vídeo profissional",
    ],
    automacao:
      "CRM com funil, automação de lembretes e de follow-up e, se a empresa atende muito volume, integração com a API oficial do WhatsApp.",
  },
  "3500+": {
    rotulo: "Acima de R$ 3.500 por mês",
    orientacao:
      "Vale estruturar a operação: integração entre site, CRM e WhatsApp, painel de indicadores e apoio profissional para anúncios.",
    ferramentas: [
      ...BASE_GRATUITA,
      "CRM com funil e relatórios",
      "Integração entre site, CRM e WhatsApp pela API oficial",
      "Anúncios com acompanhamento de custo por contato e por venda",
      "Painel de indicadores semanal",
      "Apoio de profissional ou agência para tráfego pago",
    ],
    automacao:
      "Fluxo automatizado de captura, qualificação e follow-up, com a API oficial do WhatsApp, CRM e painel, e revisão humana da conversa nos casos de venda.",
  },
};

export const CAPTACAO_ROTULO: Record<string, string> = {
  indicacao: "Indicação boca a boca",
  portais: "Portais e plataformas",
  ads: "Anúncios pagos",
  social: "Redes sociais",
  "porta-a-porta": "Visitas e contato direto",
  "sem-processo": "Sem canal definido (oportunidade)",
};
