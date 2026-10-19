import { metaDoDocumento, secao } from "./documento";
import { capitalizar, listaPt, minusculaInicial } from "./linguagem";
import { perfilDeMercado } from "./mercado";
import { GARGALOS, INVESTIMENTO, PLANOS } from "./mercado/planos";
import type { Bloco, ContextoNegocio, Documento, Objecao, PerfilMercado, Secao } from "./tipos";

/**
 * Kit Comercial — entregável do Comercial/Automação IA.
 *
 * Segundo o playbook, o serviço é: qualificação de leads (BANT), follow-up
 * automático por WhatsApp, agendamento e planilha de acompanhamento, com o
 * critério de "lead bom" definido e o cliente sabendo como pausar a automação.
 * O FECHAMENTO da venda continua humano — o kit cuida do primeiro atendimento,
 * da qualificação e do acompanhamento.
 *
 * As mensagens são textos para COPIAR e COLAR. O que a IA conhece (nome do
 * negócio, cidade, ofertas) já vem preenchido; o que só o dono sabe (nome do
 * cliente, valor, data) vira `{campo}` explícito. Nunca inventamos preço,
 * prazo nem promessa.
 *
 * O documento é interno (usa gargalo, objetivo e orçamento para priorizar),
 * mas o TEXTO das mensagens é voltado ao cliente e jamais menciona essas
 * respostas privadas — há teste para isso.
 */

/** Campos que o dono troca. O linter só aceita estes entre chaves. */
export const CAMPOS_DAS_MENSAGENS = [
  "nome_do_cliente",
  "seu_nome",
  "quem_indicou",
  "servico",
  "valor",
  "prazo",
  "data",
  "horario",
  "link_avaliacao",
  "horario_de_atendimento",
  "endereco",
  "formas_de_pagamento",
] as const;

const DESCRICAO_DOS_CAMPOS: Record<(typeof CAMPOS_DAS_MENSAGENS)[number], string> = {
  nome_do_cliente: "Nome de quem está falando com você",
  seu_nome: "O seu nome, ou o de quem atende",
  quem_indicou: "Quem indicou o cliente, quando for o caso",
  servico: "O produto ou serviço combinado",
  valor: "O valor do orçamento",
  prazo: "O prazo de entrega ou de execução",
  data: "Uma data (de validade, de horário ou de entrega)",
  horario: "Um horário marcado",
  link_avaliacao: "O link direto para avaliar o negócio no Google",
  horario_de_atendimento: "Seus dias e horários de atendimento",
  endereco: "O endereço do negócio",
  formas_de_pagamento: "As formas de pagamento aceitas",
};

function mensagem(rotulo: string, quando: string, texto: string): Bloco {
  return { tipo: "mensagem", rotulo, quando, texto };
}

const SAIR = "Se preferir não receber mais mensagens, é só responder SAIR.";

function mensagensBase(ctx: ContextoNegocio, p: PerfilMercado): Record<string, Bloco> {
  const nome = ctx.nome;
  const ofertaComPreco = ctx.ofertas.find((o) => o.preco && !/consulta/i.test(o.preco));
  const referenciaDePreco = ofertaComPreco
    ? ` Como referência, ${ofertaComPreco.titulo}: ${ofertaComPreco.preco}.`
    : "";

  return {
    indicacao: mensagem(
      "Primeiro contato por indicação",
      "Quando alguém indicou o cliente e você faz o primeiro contato.",
      `Olá, {nome_do_cliente}! Aqui é {seu_nome}, de ${nome}. {quem_indicou} comentou que você procura ${p.oQueVende}. Posso te ajudar? Me conta rapidinho o que você precisa.`,
    ),
    preco: mensagem(
      "Quando perguntam o preço logo de cara",
      "Quando o cliente escreve só \"quanto custa?\".",
      `Oi, {nome_do_cliente}! O valor depende de alguns detalhes, e eu quero te passar um número certo, não um chute.${referenciaDePreco} Posso te fazer duas perguntas rápidas para montar o orçamento?`,
    ),
    orcamento: mensagem(
      "Envio do orçamento",
      "Logo depois de entender a necessidade do cliente.",
      `{nome_do_cliente}, segue o orçamento:\n\n{servico}\nValor: {valor}\nPrazo: {prazo}\nVálido até: {data}\n\nQualquer dúvida estou por aqui. Posso reservar a data para você?`,
    ),
    retorno2: mensagem(
      "Retorno depois de 2 dias",
      "Dois dias após o orçamento, se o cliente não respondeu.",
      `Oi, {nome_do_cliente}! Passando para saber se ficou alguma dúvida sobre o orçamento. Se quiser, ajusto alguma coisa para caber melhor para você. ${SAIR}`,
    ),
    retorno5: mensagem(
      "Retorno depois de 5 dias",
      "Cinco dias após o orçamento, trazendo algo útil e não só cobrando.",
      `Oi, {nome_do_cliente}! Lembrei de você e separei um exemplo de trabalho parecido com o que você pediu. Quer que eu te envie? ${SAIR}`,
    ),
    encerramento: mensagem(
      "Encerramento gentil",
      "Dez dias após o orçamento, sem resposta.",
      `Oi, {nome_do_cliente}. Vou encerrar por aqui para não te incomodar. Se mudar de ideia ou precisar de ${p.oQueVende}, é só me chamar. Obrigado pela atenção! ${SAIR}`,
    ),
    vouPensar: mensagem(
      "Resposta para \"vou pensar\"",
      "Quando o cliente pede um tempo.",
      `Claro, {nome_do_cliente}! Para eu te ajudar a decidir: o que seria mais importante conferir, o valor, o prazo ou outra coisa?`,
    ),
    confirmacao: mensagem(
      "Confirmação de horário",
      "Um dia antes do horário marcado.",
      `Oi, {nome_do_cliente}! Confirmando o seu horário: {data}, às {horario}. Responda SIM para confirmar. Se precisar remarcar, me avise com antecedência para eu oferecer o horário a outra pessoa.`,
    ),
    posVenda: mensagem(
      "Pós-venda e pedido de avaliação",
      "Um ou dois dias depois de concluir.",
      `Oi, {nome_do_cliente}! Como foi ${p.entrega}? Se gostou, uma avaliação no Google ajuda muito um negócio pequeno como ${nome}: {link_avaliacao}. Muito obrigado!`,
    ),
    indicacaoPedido: mensagem(
      "Pedido de indicação",
      "Quando o cliente elogia ou diz que ficou satisfeito.",
      `{nome_do_cliente}, que bom que deu tudo certo! Se você conhece alguém em ${ctx.cidade} que também precise de ${p.oQueVende}, pode indicar? Eu agradeço muito.`,
    ),
    reativacao: mensagem(
      "Reativação de cliente antigo",
      "Para quem comprou há mais de 60 dias ou pediu orçamento e sumiu.",
      `Oi, {nome_do_cliente}! Faz um tempo que não nos falamos. Passei para saber como estão as coisas e se posso ajudar com {servico}. ${SAIR}`,
    ),
  };
}

const OBJECOES_UNIVERSAIS: Objecao[] = [
  {
    objecao: "Está caro.",
    resposta:
      "Entendo. Posso explicar o que está incluso no valor? Se precisar, monto uma opção que caiba melhor, mostrando o que muda em cada uma.",
  },
  {
    objecao: "Vou pensar.",
    resposta:
      "Claro. Para eu te ajudar a decidir, o que seria mais importante conferir: valor, prazo ou outra coisa?",
  },
  {
    objecao: "Já tenho quem faça isso.",
    resposta:
      "Ótimo, isso mostra que você sabe o que precisa. O que o atual faz muito bem e o que você gostaria que fosse diferente?",
  },
  {
    objecao: "Agora não é o momento.",
    resposta:
      "Justo. Para eu não te procurar na hora errada: o que precisaria acontecer para ser o momento certo? Posso te avisar quando fizer sentido.",
  },
];

function secaoComoUsar(ctx: ContextoNegocio): Secao {
  const plano = PLANOS[ctx.privado.objetivo];
  const gargalo = GARGALOS[ctx.privado.gargalo];
  const blocos: Bloco[] = [
    {
      tipo: "paragrafo",
      texto: `O kit existe para você responder rápido, entender quem é cada contato e acompanhar quem ainda não decidiu, sem perder oportunidade por falta de tempo. O seu foco de 90 dias é ${minusculaInicial(plano.rotulo)}.`,
    },
    {
      tipo: "destaque",
      tom: "info",
      titulo: "A venda continua sendo sua",
      texto:
        "A automação cuida do primeiro atendimento, da qualificação e do acompanhamento. Quem fecha o negócio, negocia valor e conversa sobre as condições é uma pessoa, você ou alguém da sua equipe.",
    },
  ];
  if (ctx.privado.gargalo === "perco-leads") {
    blocos.push({
      tipo: "destaque",
      tom: "atencao",
      titulo: "O seu ponto de partida",
      texto: `Você declarou que perde contatos pela demora. ${gargalo.diagnostico} Comece pela seção "Atendimento em 5 minutos": é onde está o maior ganho.`,
    });
  }
  blocos.push(
    {
      tipo: "paragrafo",
      texto:
        "Nas mensagens, o que está entre chaves, como {nome_do_cliente}, é o que só você sabe. Troque antes de enviar. O restante já está preenchido com os dados do seu negócio.",
    },
    {
      tipo: "tabela",
      colunas: ["Campo", "O que colocar"],
      linhas: CAMPOS_DAS_MENSAGENS.map((c): string[] => [`{${c}}`, DESCRICAO_DOS_CAMPOS[c]]),
    },
  );
  return secao("como-usar", "Como usar este kit", blocos);
}

function secaoCliente(p: PerfilMercado): Secao {
  return secao(
    "cliente-bom",
    "Quem é o seu cliente bom",
    [
      {
        tipo: "cartoes",
        cartoes: [
          { titulo: "Quem compra", itens: p.clientes },
          { titulo: "Quando procura", itens: p.gatilhos.map(capitalizar) },
          { titulo: "O que mais incomoda", itens: p.dores.map(capitalizar) },
          { titulo: "Onde encontrar", itens: p.canais },
        ],
      },
    ],
    "Saber para quem você fala é o que decide o que escrever e onde aparecer.",
  );
}

interface CriterioBant {
  criterio: string;
  pergunta: string;
  sinal: string;
  pontos: number;
}

/** Pontuação mínima de cada classe — a mesma na tabela e no fluxo de automação. */
const LIMITES = { quente: 8, morno: 5 } as const;

function criterios(p: PerfilMercado): CriterioBant[] {
  return [
    { criterio: "Necessidade", pergunta: p.perguntas[0], sinal: "Descreve um problema claro", pontos: 3 },
    { criterio: "Prazo", pergunta: "Para quando você precisa?", sinal: "Precisa em até 30 dias", pontos: 3 },
    { criterio: "Valor", pergunta: "Você já tem um valor em mente para isso?", sinal: "O valor é compatível com a sua oferta", pontos: 2 },
    { criterio: "Decisão", pergunta: "Você decide sozinho(a) ou mais alguém participa?", sinal: "Decide ou participa da decisão", pontos: 2 },
  ];
}

function secaoQualificacao(p: PerfilMercado): Secao {
  const lista = criterios(p);
  const total = lista.reduce((s, c) => s + c.pontos, 0);
  return secao(
    "qualificacao",
    "Quem é um lead bom: critérios de qualificação",
    [
      {
        tipo: "paragrafo",
        texto:
          "Lead é qualquer pessoa que demonstrou interesse. Nem todo lead está pronto para comprar. Estas quatro perguntas, adaptadas do método BANT, ajudam a saber quem merece sua atenção primeiro. Faça-as em conversa, não como formulário.",
      },
      {
        tipo: "tabela",
        colunas: ["Critério", "Pergunta", "Sinal de lead bom", "Pontos"],
        linhas: lista.map((c): string[] => [c.criterio, c.pergunta, c.sinal, String(c.pontos)]),
      },
      {
        tipo: "tabela",
        colunas: ["Pontuação", "Classe", "O que fazer"],
        linhas: [
          [`${LIMITES.quente} a ${total}`, "Quente", "Responda na hora e proponha horário, visita ou orçamento"],
          [`${LIMITES.morno} a ${LIMITES.quente - 1}`, "Morno", "Envie um material curto e retome em 2 dias"],
          [`0 a ${LIMITES.morno - 1}`, "Frio", "Entre na cadência longa e não insista"],
        ],
      },
      {
        tipo: "destaque",
        tom: "info",
        texto:
          "Os pontos são um guia, não uma sentença. Se sua intuição diz que o lead é bom, trate como bom, e ajuste os pontos depois das primeiras semanas conforme o que realmente vira venda. Se o contato estiver fora da área que você atende, avise com educação e, se puder, indique alguém.",
      },
    ],
  );
}

function secaoAtendimento(ctx: ContextoNegocio): Secao {
  const nome = ctx.nome;
  const catalogo = ctx.ofertas.length > 0 ? ctx.ofertas.map((o) => o.titulo) : [];
  const blocos: Bloco[] = [
    {
      tipo: "paragrafo",
      texto:
        "A meta de resposta é de até 5 minutos no horário comercial. O WhatsApp Business, que é gratuito, tem as ferramentas para isso: mensagem de saudação, mensagem de ausência, respostas rápidas, etiquetas e catálogo.",
    },
    mensagem(
      "Mensagem de saudação",
      "Envia sozinha quando um cliente novo escreve.",
      `Olá! Aqui é ${nome}. Obrigado pelo contato. Como posso ajudar? Se for um orçamento, me conta o que você precisa que eu já te respondo.`,
    ),
    mensagem(
      "Mensagem de ausência",
      "Envia sozinha fora do horário de atendimento.",
      `Olá! Aqui é ${nome}. No momento não estamos atendendo. Nosso horário é {horario_de_atendimento}. Deixe a sua mensagem que respondemos assim que voltarmos.`,
    ),
    {
      tipo: "tabela",
      colunas: ["Atalho", "Quando usar", "Texto"],
      linhas: [
        ["/orcamento", "Cliente pediu orçamento", "Posso te passar o valor certinho. Me conta: o que você precisa, para quando e em qual endereço?"],
        ["/horario", "Perguntam o horário", "Atendemos {horario_de_atendimento}."],
        ["/endereco", "Perguntam onde fica", `Estamos em ${ctx.cidade}, {endereco}.`],
        ["/pagamento", "Perguntam como pagar", "Aceitamos {formas_de_pagamento}."],
        ["/obrigado", "Ao encerrar o atendimento", `Obrigado pelo contato! Qualquer dúvida é só chamar. ${nome}.`],
      ],
    },
    {
      tipo: "paragrafo",
      texto: "Para criar cada atalho no WhatsApp Business, use a opção de respostas rápidas nas ferramentas comerciais e digite o texto da tabela.",
    },
    {
      tipo: "lista",
      itens: [
        "Etiquetas sugeridas: Novo contato, Orçamento enviado, Negociando, Fechado, Pós-venda, Sem resposta",
        catalogo.length > 0
          ? `Catálogo: comece com as ofertas que você já publicou no hub (${listaPt(catalogo.slice(0, 4))}), com foto, descrição e valor`
          : "Catálogo: cadastre os seus principais produtos ou serviços com foto, descrição e valor",
      ],
    },
  ];
  return secao("atendimento", "Atendimento em 5 minutos (WhatsApp Business)", blocos);
}

function secaoMensagens(ctx: ContextoNegocio, p: PerfilMercado): Secao {
  const m = mensagensBase(ctx, p);
  const doNivel1: Bloco[] = [m.indicacao, m.preco, m.orcamento, m.retorno2, m.encerramento];
  if (p.agendamento) doNivel1.push(m.confirmacao);
  doNivel1.push(m.posVenda);

  const lista: Bloco[] = [...doNivel1];
  if (ctx.nivel >= 2) lista.push(m.retorno5, m.vouPensar, m.indicacaoPedido);
  if (ctx.nivel >= 3 || ctx.privado.objetivo === "vender-mais") lista.push(m.reativacao);

  return secao(
    "mensagens",
    "Mensagens prontas",
    lista,
    "Copie, troque os campos entre chaves e envie. Escreva do seu jeito se preferir: o que importa é a estrutura.",
  );
}

function secaoScript(ctx: ContextoNegocio, p: PerfilMercado): Secao {
  const objecoes: Objecao[] = [...OBJECOES_UNIVERSAIS.slice(0, ctx.nivel >= 2 ? 3 : 2), ...p.objecoes];
  if (ctx.nivel >= 3) objecoes.push(OBJECOES_UNIVERSAIS[3]);

  const oferta =
    ctx.ofertas.length > 0
      ? `Apresente a oferta mais próxima do que o cliente pediu: ${listaPt(ctx.ofertas.slice(0, 3).map((o) => o.titulo))}.`
      : `Apresente em uma frase como ${ctx.nome} resolve o problema dele.`;

  return secao(
    "script",
    "Script de ligação ou visita",
    [
      mensagem(
        "Abertura",
        "Ao ligar ou ao receber o cliente.",
        `Oi, {nome_do_cliente}, tudo bem? Aqui é {seu_nome}, de ${ctx.nome}. Você pediu informações sobre ${p.oQueVende} e eu queria entender melhor o que você precisa para te passar o valor certo. Tem dois minutinhos?`,
      ),
      { tipo: "paragrafo", texto: "Descoberta: faça as perguntas em conversa e escute mais do que fala." },
      { tipo: "lista", itens: p.perguntas },
      { tipo: "paragrafo", texto: `Apresentação: ${oferta} Mostre uma prova real: ${minusculaInicial(p.provas[0])}.` },
      { tipo: "paragrafo", texto: "Objeções: ouça até o fim, reconheça o ponto e responda com um exemplo." },
      {
        tipo: "tabela",
        colunas: ["Quando o cliente diz", "Você pode responder"],
        linhas: objecoes.map((o): string[] => [o.objecao, o.resposta]),
      },
      mensagem(
        "Fechamento",
        "Quando o cliente demonstrou interesse.",
        `Pelo que você me contou, faz sentido a gente marcar {data} às {horario} para eu te mostrar como ficaria no seu caso. Esse dia funciona para você?`,
      ),
    ],
  );
}

function secaoCadencia(ctx: ContextoNegocio): Secao {
  const linhas: string[][] = [
    ["Dia 0", "WhatsApp", "Responder e entender a necessidade", "Saudação e orçamento"],
    ["Dia 2", "WhatsApp", "Saber se ficou dúvida", "Retorno depois de 2 dias"],
    ["Dia 10", "WhatsApp", "Encerrar com educação", "Encerramento gentil"],
  ];
  if (ctx.nivel >= 2) {
    linhas.splice(2, 0, ["Dia 5", "WhatsApp", "Trazer algo útil, não só cobrar", "Retorno depois de 5 dias"]);
    linhas.splice(4, 0, ["Dia 14", "Ligação", "Última tentativa da rodada, de forma direta e simpática", "Script de ligação"]);
  }
  if (ctx.nivel >= 3) {
    linhas.push(
      ["Dia 45", "WhatsApp", "Retomar com conteúdo útil, sem pedir nada", "Reativação de cliente antigo"],
      ["Dia 90", "WhatsApp", "Convidar a voltar com uma novidade", "Reativação de cliente antigo"],
    );
  }
  return secao(
    "cadencia",
    "Quando acompanhar cada contato",
    [
      { tipo: "tabela", colunas: ["Quando", "Canal", "Objetivo", "Mensagem"], linhas },
      {
        tipo: "destaque",
        tom: "atencao",
        titulo: "Insistir não é acompanhar",
        texto:
          "Quem disse não ou pediu para parar não recebe mais mensagem. Anote o pedido na planilha e respeite. Isso protege a sua reputação e a sua conta no WhatsApp.",
      },
    ],
  );
}

function secaoAgendamento(): Secao {
  return secao(
    "agendamento",
    "Agendamento sem faltas",
    [
      {
        tipo: "passos",
        passos: [
          { titulo: "Ofereça dois horários, não uma pergunta aberta", detalhe: "\"Terça às 10h ou quinta às 15h?\" fecha mais rápido que \"qual horário você prefere?\"." },
          { titulo: "Envie a confirmação por escrito, com data, horário e endereço" },
          { titulo: "Peça a confirmação um dia antes", detalhe: "Use a mensagem de confirmação. Sem resposta, ligue." },
          { titulo: "Deixe a política de remarcação clara", detalhe: "Avisar com antecedência permite oferecer o horário a outra pessoa." },
          { titulo: "Tenha uma lista de espera", detalhe: "Quando alguém desmarca, chame a próxima pessoa da lista." },
        ],
      },
    ],
  );
}

export const COLUNAS_PLANILHA = [
  "Data",
  "Nome",
  "Contato",
  "De onde veio",
  "O que pediu",
  "Pontos",
  "Classe",
  "Valor enviado",
  "Próximo contato",
  "Situação",
];

function secaoPlanilha(): Secao {
  return secao(
    "planilha",
    "Planilha de acompanhamento (CRM simples)",
    [
      {
        tipo: "paragrafo",
        texto:
          "Uma planilha basta no começo. Crie estas colunas em uma planilha online e registre cada contato no mesmo dia. Quem não está na planilha não existe no seu funil.",
      },
      {
        tipo: "tabela",
        colunas: COLUNAS_PLANILHA,
        linhas: [
          ["(exemplo) 10/03", "Maria", "(11) 90000-0000", "Indicação", "Orçamento", "9", "Quente", "R$ 350", "12/03", "Orçamento enviado"],
          ["", "", "", "", "", "", "", "", "", ""],
        ],
      },
      {
        tipo: "paragrafo",
        texto:
          "Situações possíveis: Novo contato, Orçamento enviado, Negociando, Fechado, Perdido (anote o motivo) e Pós-venda.",
      },
    ],
  );
}

export interface FluxoQualificacao {
  versao: string;
  descricao: string;
  etapas: Array<{
    id: string;
    tipo: "mensagem" | "pergunta" | "classificacao" | "acao";
    texto: string;
    opcoes?: Array<{ rotulo: string; pontos: number; proximo: string }>;
    proximo?: string;
  }>;
  classes: Array<{ classe: string; minimo: number; acao: string }>;
}

/** O fluxo de qualificação como dado, para ferramentas de automação. */
export function fluxoDeQualificacao(ctx: ContextoNegocio, p: PerfilMercado): FluxoQualificacao {
  return {
    versao: "1.0",
    descricao:
      "Fluxo de qualificação por WhatsApp. Cada pergunta soma pontos; a soma classifica o contato em quente, morno ou frio. Revisão humana obrigatória antes de qualquer proposta.",
    etapas: [
      {
        id: "saudacao",
        tipo: "mensagem",
        texto: `Olá! Aqui é ${ctx.nome}. Para te atender melhor, vou fazer 3 perguntas rápidas. Pode ser?`,
        proximo: "necessidade",
      },
      {
        id: "necessidade",
        tipo: "pergunta",
        texto: p.perguntas[0],
        opcoes: [
          { rotulo: "Resposta clara sobre o que precisa", pontos: 3, proximo: "prazo" },
          { rotulo: "Resposta vaga ou ainda pesquisando", pontos: 1, proximo: "prazo" },
        ],
      },
      {
        id: "prazo",
        tipo: "pergunta",
        texto: "Para quando você precisa?\n1) Esta semana\n2) Este mês\n3) Ainda estou pesquisando",
        opcoes: [
          { rotulo: "Esta semana", pontos: 3, proximo: "valor" },
          { rotulo: "Este mês", pontos: 2, proximo: "valor" },
          { rotulo: "Ainda estou pesquisando", pontos: 0, proximo: "valor" },
        ],
      },
      {
        id: "valor",
        tipo: "pergunta",
        texto: "Você já tem um valor em mente?\n1) Sim\n2) Prefiro receber um orçamento",
        opcoes: [
          { rotulo: "Sim", pontos: 2, proximo: "decisao" },
          { rotulo: "Prefiro receber um orçamento", pontos: 1, proximo: "decisao" },
        ],
      },
      {
        id: "decisao",
        tipo: "pergunta",
        texto: "Você decide sozinho(a) ou mais alguém participa?\n1) Eu decido\n2) Mais alguém participa",
        opcoes: [
          { rotulo: "Eu decido", pontos: 2, proximo: "classificar" },
          { rotulo: "Mais alguém participa", pontos: 1, proximo: "classificar" },
        ],
      },
      {
        id: "classificar",
        tipo: "classificacao",
        texto: "Somar os pontos e classificar. Avisar o responsável por mensagem se a classe for quente.",
      },
    ],
    classes: [
      { classe: "quente", minimo: LIMITES.quente, acao: "Avisar o responsável agora e propor horário ou orçamento" },
      { classe: "morno", minimo: LIMITES.morno, acao: "Enviar material curto e retomar em 2 dias" },
      { classe: "frio", minimo: 0, acao: "Entrar na cadência longa, sem insistir" },
    ],
  };
}

function secaoFluxo(fluxo: FluxoQualificacao): Secao {
  return secao(
    "fluxo",
    "Fluxo de qualificação (para automatizar)",
    [
      {
        tipo: "paragrafo",
        texto:
          "Este é o passo a passo da conversa de qualificação. Dá para fazer à mão no WhatsApp Business ou levar para uma ferramenta de automação. A versão estruturada deste fluxo está no arquivo em formato JSON.",
      },
      {
        tipo: "tabela",
        colunas: ["Etapa", "O que acontece", "Pontos"],
        linhas: fluxo.etapas.map((e): string[] => [
          e.id,
          e.texto.replace(/\n/g, " "),
          e.opcoes ? e.opcoes.map((o) => `${o.rotulo}: ${o.pontos}`).join("; ") : "",
        ]),
      },
      {
        tipo: "tabela",
        colunas: ["Classe", "A partir de", "Ação"],
        linhas: fluxo.classes.map((c): string[] => [c.classe, String(c.minimo), c.acao]),
      },
    ],
  );
}

function secaoAutomacao(ctx: ContextoNegocio): Secao {
  const faixa = INVESTIMENTO[ctx.privado.investimento];
  const blocos: Bloco[] = [
    {
      tipo: "paragrafo",
      texto: `Para o seu orçamento (${faixa.rotulo.toLowerCase()}): ${faixa.automacao}`,
    },
    { tipo: "lista", itens: faixa.ferramentas },
    {
      tipo: "destaque",
      tom: "atencao",
      titulo: "Como pausar ou ajustar a automação",
      texto:
        "Mantenha sempre um jeito simples de desligar. No WhatsApp Business, desative a saudação e a ausência nas ferramentas comerciais. Em qualquer ferramenta paga, exija um botão de pausa e a opção de uma pessoa assumir a conversa. Revise as mensagens a cada 30 dias.",
    },
  ];
  if (ctx.nivel >= 3) {
    blocos.push({
      tipo: "checklist",
      itens: [
        "Teste o fluxo com 5 pessoas conhecidas antes de ativar para clientes",
        "Confira se algum contato bom foi classificado como frio (falso negativo)",
        "Confira se algum contato fraco foi classificado como quente (falso positivo)",
        "Ajuste os pontos e as perguntas com base no que realmente virou venda",
        "Defina quem recebe o aviso de lead quente e em quanto tempo responde",
      ],
    });
  }
  return secao("automacao", "Automação para o seu tamanho", blocos);
}

function secaoLgpd(p: PerfilMercado): Secao {
  const sensivel =
    p.id === "saude" || p.id === "clinica" || p.id === "bem_estar"
      ? ["Dados de saúde são sensíveis: peça só o necessário, guarde com cuidado e nunca em conversa solta"]
      : p.id === "educacao"
        ? ["Dados de crianças e adolescentes exigem consentimento de um responsável"]
        : [];
  return secao(
    "lgpd",
    "Boas práticas e LGPD",
    [
      {
        tipo: "checklist",
        itens: [
          "Guarde só o que precisa: nome, contato e o que a pessoa pediu",
          "Registre de onde veio o contato e que a pessoa aceitou receber mensagens",
          "Ofereça a saída em toda mensagem de acompanhamento (\"responda SAIR\")",
          "Não compre lista de contatos nem envie mensagem em massa para quem não pediu: além de infração, a conta do WhatsApp pode ser bloqueada",
          "Apague ou corrija os dados quando a pessoa pedir",
          "Não guarde documentos pessoais em conversa de WhatsApp sem necessidade",
          ...sensivel,
        ],
      },
      {
        tipo: "destaque",
        tom: "info",
        texto:
          "Este é um guia de boas práticas, não um parecer jurídico. Para dúvidas sobre a Lei Geral de Proteção de Dados no seu caso, converse com um advogado ou com o seu contador.",
      },
    ],
  );
}

function secaoMetricas(): Secao {
  return secao(
    "metricas",
    "Números para olhar toda semana",
    [
      {
        tipo: "tabela",
        colunas: ["Número", "Como calcular", "Referência"],
        linhas: [
          ["Tempo da primeira resposta", "Hora da resposta menos a hora do contato", "Até 5 minutos no horário comercial"],
          ["Contatos novos", "Quantas pessoas novas escreveram", "Compare semana com semana"],
          ["Orçamentos enviados", "Quantos orçamentos saíram", "Compare com os contatos novos"],
          ["Orçamentos que viram venda", "Vendas dividido por orçamentos, vezes 100", "Defina a sua meta depois de 4 semanas"],
          ["Contatos sem resposta após 10 dias", "Quantos chegaram ao encerramento gentil", "Quanto menor, melhor"],
        ],
      },
    ],
    "Meça por quatro semanas antes de definir metas. A IA não conhece os seus números de hoje.",
  );
}

export function gerarKitComercial(ctx: ContextoNegocio): Documento {
  const p = perfilDeMercado(ctx.nicho);
  const fluxo = fluxoDeQualificacao(ctx, p);

  const secoes: Secao[] = [
    secaoComoUsar(ctx),
    secaoCliente(p),
    secaoQualificacao(p),
    secaoAtendimento(ctx),
    secaoMensagens(ctx, p),
    secaoScript(ctx, p),
    secaoCadencia(ctx),
  ];
  if (p.agendamento) secoes.push(secaoAgendamento());
  secoes.push(secaoPlanilha());
  if (ctx.nivel >= 2) secoes.push(secaoFluxo(fluxo), secaoAutomacao(ctx));
  secoes.push(secaoLgpd(p), secaoMetricas());

  return {
    tipo: "comercial",
    titulo: `Kit Comercial: ${ctx.nome}`,
    subtitulo: `${p.rotulo} · ${ctx.bairro}, ${ctx.cidade}`,
    meta: metaDoDocumento(ctx, { cargo: "Comercial/Automação IA", circulacao: "interno" }),
    secoes,
    dados: {
      fluxoQualificacao: fluxo,
      planilha: { colunas: COLUNAS_PLANILHA },
      campos: Object.fromEntries(CAMPOS_DAS_MENSAGENS.map((c) => [c, DESCRICAO_DOS_CAMPOS[c]])),
    },
  };
}
