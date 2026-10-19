import { metaDoDocumento, secao } from "./documento";
import { dataPt, listaPt } from "./linguagem";
import { perfilDeMercado } from "./mercado";
import { EQUIPE } from "./mercado/planos";
import type { Bloco, ContextoNegocio, Documento, PerfilMercado, Secao } from "./tipos";

/**
 * Manual de Processos (POPs) — o produto principal do Documentador, segundo o
 * playbook: "documentação técnica, SOPs, manuais de procedimento".
 *
 * POP = Procedimento Operacional Padrão: o passo a passo que qualquer pessoa
 * da equipe consegue seguir sem perguntar ao dono. O critério de qualidade do
 * playbook é exatamente esse ("alguém de fora do processo consegue seguir o
 * documento"), por isso cada POP tem responsável, quando usar, passos
 * numerados, checklist de qualidade, erros comuns e indicador.
 *
 * O texto é montado a partir do mercado do negócio (a execução é específica de
 * cada nicho) e do que o dono publicou (as ofertas entram no passo do orçamento).
 */

interface Pop {
  id: string;
  titulo: string;
  objetivo: string;
  quando: string;
  ferramentas: string;
  passos: Array<{ titulo: string; detalhe?: string }>;
  qualidade: string[];
  erros: string[];
  indicador: string;
}

function responsavel(ctx: ContextoNegocio): string {
  return ctx.privado.equipe === "so-eu"
    ? "O dono do negócio"
    : "Defina um nome e um substituto para quando a pessoa faltar";
}

function popAtendimento(ctx: ContextoNegocio, p: PerfilMercado): Pop {
  const referencia =
    ctx.ofertas.length > 0
      ? `Use as ofertas publicadas como referência: ${listaPt(ctx.ofertas.slice(0, 3).map((o) => o.titulo))}.`
      : "Tenha uma tabela de valores de referência à mão, mesmo que o valor final dependa de cada caso.";
  return {
    id: "atendimento",
    titulo: "Atendimento e orçamento",
    objetivo: "Responder rápido, entender a necessidade e enviar uma proposta clara.",
    quando: "Sempre que chegar um contato novo, por WhatsApp, ligação, visita ou redes sociais.",
    ferramentas: "WhatsApp Business (saudação e respostas rápidas), planilha de contatos, modelo de orçamento.",
    passos: [
      { titulo: "Responder em até 5 minutos no horário comercial", detalhe: "Use a mensagem de saudação. Fora do horário, a mensagem de ausência avisa quando você responde." },
      { titulo: "Entender a necessidade antes de falar de preço", detalhe: `Faça 3 perguntas, como: ${p.perguntas.slice(0, 3).map((q) => `"${q}"`).join("; ")}` },
      { titulo: "Informar valor de referência e prazo", detalhe: referencia },
      { titulo: "Enviar o orçamento por escrito", detalhe: "Com itens, valor, prazo de entrega e validade da proposta." },
      { titulo: "Registrar o contato na planilha", detalhe: "Nome, data, de onde veio, o que pediu, valor enviado e situação." },
      { titulo: "Fazer o primeiro retorno em 2 dias, se não houver resposta", detalhe: "Uma mensagem curta, perguntando se ficou alguma dúvida." },
      { titulo: "Fechar o combinado por escrito", detalhe: "Confirmar data, forma de pagamento e o que está incluso." },
    ],
    qualidade: [
      "A primeira resposta saiu em até 5 minutos no horário comercial",
      "O orçamento tem itens, valor, prazo e validade",
      "Todo contato está registrado na planilha",
    ],
    erros: [
      "Responder só com o preço, sem entender o que o cliente precisa",
      "Combinar apenas por voz, sem nada por escrito",
      "Esquecer de fazer o retorno",
    ],
    indicador: "Tempo da primeira resposta e orçamentos que viram venda (%)",
  };
}

function popExecucao(p: PerfilMercado): Pop {
  return {
    id: "execucao",
    titulo: `Execução e entrega: ${p.entrega}`,
    objetivo: p.execucao.objetivo,
    quando: `Toda vez que ${p.entrega} for realizado, do combinado até a conclusão.`,
    ferramentas: "Ordem de serviço ou pedido, checklist deste procedimento, fotos ou registro do resultado.",
    passos: p.execucao.passos.map((titulo) => ({ titulo })),
    qualidade: p.execucao.qualidade,
    erros: p.execucao.erros,
    indicador: p.indicadores[1] ?? p.indicadores[0],
  };
}

function popPosVenda(p: PerfilMercado): Pop {
  return {
    id: "pos-venda",
    titulo: "Pós-venda e pedido de avaliação",
    objetivo: "Garantir que o cliente ficou satisfeito, pedir avaliação e abrir a porta para a próxima compra.",
    quando: `1 a 2 dias depois de ${p.entrega} ser concluído.`,
    ferramentas: "WhatsApp Business, link do Perfil da Empresa no Google, planilha de clientes.",
    passos: [
      { titulo: `Perguntar como foi ${p.entrega}`, detalhe: "Uma mensagem curta e pessoal, sem texto genérico." },
      { titulo: "Resolver na hora qualquer problema", detalhe: "Registre o que aconteceu e o que foi feito." },
      { titulo: "Pedir avaliação no Perfil da Empresa no Google", detalhe: "Envie o link direto e agradeça." },
      { titulo: "Pedir indicação", detalhe: "Pergunte se o cliente conhece alguém que precise do mesmo." },
      { titulo: "Registrar a data de retorno ou de renovação", detalhe: "Anote na planilha para lembrar o cliente na hora certa." },
      { titulo: "Guardar o que o cliente elogiou", detalhe: "Com autorização, vira depoimento nas publicações." },
    ],
    qualidade: [
      "Todo cliente recebeu o contato de pós-venda",
      "Toda reclamação foi registrada e respondida",
      "A data de retorno está anotada",
    ],
    erros: [
      "Sumir depois de receber o pagamento",
      "Pedir avaliação sem agradecer antes",
      "Usar depoimento sem autorização",
    ],
    indicador: "Avaliações novas por mês e clientes que voltam (%)",
  };
}

function popFinanceiro(): Pop {
  return {
    id: "financeiro",
    titulo: "Controle financeiro semanal",
    objetivo: "Saber toda semana quanto entrou, quanto saiu e quanto sobra.",
    quando: "Uma vez por semana, em horário fixo (por exemplo, sexta no fim do dia).",
    ferramentas: "Planilha de entradas e saídas, extratos do banco e das maquininhas.",
    passos: [
      { titulo: "Reservar 30 minutos fixos na agenda" },
      { titulo: "Somar tudo o que entrou na semana", detalhe: "Separe por forma de pagamento: dinheiro, Pix e cartão." },
      { titulo: "Somar tudo o que saiu", detalhe: "Fornecedores, contas fixas, impostos e retiradas." },
      { titulo: "Separar o dinheiro da empresa do pessoal", detalhe: "Registre a sua retirada como pró-labore, não como gasto avulso." },
      { titulo: "Listar o que há para receber e para pagar nos próximos 15 dias" },
      { titulo: "Anotar o saldo e as decisões da semana" },
    ],
    qualidade: [
      "Entradas e saídas registradas até o fim da semana",
      "Contas da empresa e pessoais separadas",
      "Pagamentos dos próximos 15 dias listados",
    ],
    erros: [
      "Misturar as contas pessoais com as da empresa",
      "Anotar só as despesas grandes",
      "Deixar para olhar o caixa no fim do mês",
    ],
    indicador: "Saldo semanal e contas pagas no prazo (%)",
  };
}

function popPresencaDigital(ctx: ContextoNegocio): Pop {
  const horas = EQUIPE[ctx.privado.equipe].horasMarketing;
  return {
    id: "presenca-digital",
    titulo: "Rotina de presença digital",
    objetivo: "Manter o negócio visível e ativo sem consumir o dia.",
    quando: "Todas as semanas, em blocos de tempo fixos.",
    ferramentas: "Calendário e carrosséis do pacote de publicações, celular para fotos, Perfil da Empresa no Google.",
    passos: [
      { titulo: `Reservar cerca de ${horas} horas por semana`, detalhe: "Em blocos fixos, para não depender de ter tempo livre." },
      { titulo: "Escolher a pauta da semana no calendário de publicações" },
      { titulo: "Fotografar ou gravar durante o trabalho normal", detalhe: "O material real é mais forte que banco de imagens. Peça autorização a quem aparecer." },
      { titulo: "Publicar nos dias combinados e responder comentários e mensagens no mesmo dia" },
      { titulo: "Registrar alcance, salvamentos e mensagens recebidas", detalhe: "Cinco minutos por publicação." },
      { titulo: "Repetir o formato que mais trouxe mensagens" },
    ],
    qualidade: [
      "As publicações da semana saíram nos dias combinados",
      "Comentários e mensagens foram respondidos no mesmo dia",
      "Os números da semana estão anotados",
    ],
    erros: [
      "Publicar só quando sobra tempo",
      "Divulgar sem mostrar o trabalho de verdade",
      "Não responder os comentários",
    ],
    indicador: "Mensagens recebidas por semana vindas das redes",
  };
}

function popIntegracao(): Pop {
  return {
    id: "integracao",
    titulo: "Integração de novo colaborador",
    objetivo: "Fazer a pessoa nova render com segurança nas primeiras semanas.",
    quando: "No dia em que alguém novo começa e durante o primeiro mês.",
    ferramentas: "Este manual, lista de acessos e de contatos, conversa de avaliação.",
    passos: [
      { titulo: "Preparar o primeiro dia", detalhe: "Acessos, ferramentas, uniforme e quem vai acompanhar." },
      { titulo: "Apresentar o negócio, os clientes e os valores" },
      { titulo: "Mostrar os procedimentos deste manual, um por vez" },
      { titulo: "Acompanhar as primeiras tarefas e dar retorno no mesmo dia" },
      { titulo: "Combinar metas da primeira semana e do primeiro mês" },
      { titulo: "Fazer uma conversa de avaliação ao fim do primeiro mês" },
    ],
    qualidade: [
      "A pessoa sabe a quem recorrer em cada situação",
      "Os procedimentos foram apresentados e praticados",
      "A conversa de avaliação aconteceu",
    ],
    erros: [
      "Jogar a pessoa no trabalho sem explicar o padrão",
      "Corrigir só quando dá errado",
      "Não combinar metas",
    ],
    indicador: "Tempo até a pessoa trabalhar sem acompanhamento",
  };
}

function popReclamacao(): Pop {
  return {
    id: "reclamacao",
    titulo: "Tratamento de reclamações",
    objetivo: "Transformar uma reclamação em solução e aprender com ela.",
    quando: "Toda vez que um cliente reclamar, pessoalmente ou por mensagem.",
    ferramentas: "Planilha de ocorrências, WhatsApp Business.",
    passos: [
      { titulo: "Ouvir sem interromper e agradecer o aviso" },
      { titulo: "Registrar o que aconteceu: quem, quando e o quê" },
      { titulo: "Pedir desculpas pelo transtorno, sem culpar o cliente" },
      { titulo: "Propor uma solução e um prazo" },
      { titulo: "Cumprir e confirmar com o cliente que ficou resolvido" },
      { titulo: "Revisar o procedimento que falhou" },
    ],
    qualidade: [
      "A reclamação foi registrada e respondida no mesmo dia",
      "A solução foi cumprida no prazo combinado",
      "O procedimento foi revisado, se necessário",
    ],
    erros: [
      "Discutir com o cliente",
      "Prometer sem poder cumprir",
      "Não registrar e repetir o erro",
    ],
    indicador: "Reclamações por mês e resolvidas no prazo (%)",
  };
}

function secaoDoPop(n: number, pop: Pop, ctx: ContextoNegocio): Secao {
  const blocos: Bloco[] = [
    { tipo: "paragrafo", texto: `Objetivo: ${pop.objetivo}` },
    {
      tipo: "tabela",
      colunas: ["Campo", "Conteúdo"],
      linhas: [
        ["Responsável", responsavel(ctx)],
        ["Quando usar", pop.quando],
        ["Ferramentas", pop.ferramentas],
        ["Indicador", pop.indicador],
      ],
    },
    { tipo: "passos", passos: pop.passos },
    { tipo: "paragrafo", texto: "Como saber que ficou bom:" },
    { tipo: "checklist", itens: pop.qualidade },
    { tipo: "paragrafo", texto: "Erros comuns para evitar:" },
    { tipo: "lista", itens: pop.erros },
  ];
  return secao(`pop-${pop.id}`, `POP ${String(n).padStart(2, "0")}: ${pop.titulo}`, blocos);
}

export function gerarManualProcessos(ctx: ContextoNegocio): Documento {
  const p = perfilDeMercado(ctx.nicho);

  const pops: Pop[] = [popAtendimento(ctx, p), popExecucao(p), popPosVenda(p)];
  if (ctx.nivel >= 2) pops.push(popFinanceiro(), popPresencaDigital(ctx));
  if (ctx.nivel >= 3) pops.push(popIntegracao(), popReclamacao());

  const secoes: Secao[] = [
    secao("como-usar", "Como usar este manual", [
      {
        tipo: "paragrafo",
        texto:
          "POP é o Procedimento Operacional Padrão: o passo a passo que qualquer pessoa da equipe consegue seguir sem perguntar ao dono. Um procedimento bom é aquele que alguém de fora do processo consegue seguir sozinho.",
      },
      {
        tipo: "checklist",
        itens: [
          "Escolha uma pessoa responsável por manter este manual atualizado",
          "Leia cada procedimento com quem vai executá-lo e ajuste o que não bater com a realidade",
          "Imprima ou deixe à vista no local de trabalho",
          "Sempre que mudar o jeito de fazer, atualize o procedimento e o controle de versões",
        ],
      },
      {
        tipo: "destaque",
        tom: "atencao",
        titulo: "Este manual não substitui orientação profissional",
        texto:
          "Regras de segurança, de saúde, de vigilância sanitária e contratos têm exigências próprias. Valide os procedimentos com um profissional habilitado quando for o caso.",
      },
      {
        tipo: "tabela",
        colunas: ["Versão", "Data", "Autor", "O que mudou"],
        linhas: [
          [
            "1.0",
            dataPt(ctx.agora),
            "Documentador(a) IA",
            "Primeira versão gerada a partir dos dados do negócio",
          ],
          ["", "", "", ""],
        ],
      },
    ]),
    ...pops.map((pop, i) => secaoDoPop(i + 1, pop, ctx)),
  ];

  if (ctx.nivel >= 3) {
    secoes.push(
      secao(
        "revisao",
        "Revisão trimestral do manual",
        [
          {
            tipo: "checklist",
            itens: [
              "Cada procedimento ainda reflete como o trabalho é feito?",
              "Alguém novo conseguiu seguir sem ajuda?",
              "Qual procedimento gerou mais dúvidas na equipe?",
              "Algum procedimento precisa ser criado ou removido?",
              "A versão e a data de cada procedimento foram atualizadas?",
            ],
          },
        ],
        "A cada 90 dias, reserve uma hora com a equipe.",
      ),
    );
  }

  return {
    tipo: "pop",
    titulo: `Manual de Processos: ${ctx.nome}`,
    subtitulo: `${p.rotulo} · ${ctx.bairro}, ${ctx.cidade}`,
    meta: metaDoDocumento(ctx, { cargo: "Documentador(a) IA", circulacao: "interno" }),
    secoes,
  };
}
