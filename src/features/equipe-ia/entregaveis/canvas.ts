import { metaDoDocumento, secao } from "./documento";
import { listaPt, minusculaInicial, semPontoFinal } from "./linguagem";
import { perfilDeMercado } from "./mercado";
import {
  CAPTACAO_ROTULO,
  EQUIPE,
  GARGALOS,
  INVESTIMENTO,
  PLANOS,
  PRESENCA_DIGITAL,
  type AcaoPlano,
} from "./mercado/planos";
import type {
  Bloco,
  CelulaCanvas,
  ContextoNegocio,
  Documento,
  OfertaPublica,
  PerfilMercado,
  Secao,
} from "./tipos";

/**
 * Modelo de Negócio (Canvas) + plano de ação — entregável do Documentador.
 *
 * Puro: o mesmo contexto gera o mesmo documento. O NÍVEL do agente controla a
 * PROFUNDIDADE, não a utilidade: já no nível 1 o dono recebe o canvas completo
 * (as 9 células, cada uma com conteúdo), as primeiras ações da semana e a
 * lista de documentos a manter em dia. O nível 2 acrescenta diagnóstico, plano
 * de 90 dias e indicadores; o 3, riscos e revisão trimestral.
 *
 * Documento INTERNO: usa as respostas privadas do cadastro. Não deve ser
 * publicado, e o próprio documento avisa isso.
 */

const ROTULO_EQUIPE: Record<ContextoNegocio["privado"]["equipe"], string> = {
  "so-eu": "Só o dono",
  "2-5": "2 a 5 pessoas",
  "6-15": "6 a 15 pessoas",
  "16-30": "16 a 30 pessoas",
  "30+": "Mais de 30 pessoas",
};

function descreverOferta(o: OfertaPublica): string {
  return o.preco ? `${o.titulo} (${o.preco})` : o.titulo;
}

function rotulosDeCaptacao(captacao: readonly string[]): string[] {
  return captacao.map((c) => CAPTACAO_ROTULO[c]).filter((c): c is string => Boolean(c));
}

export function celulasDoCanvas(ctx: ContextoNegocio, p: PerfilMercado): Record<CelulaCanvas, string[]> {
  const { privado } = ctx;
  const plano = PLANOS[privado.objetivo];
  const presenca = PRESENCA_DIGITAL[privado.presencaDigital];
  const equipe = EQUIPE[privado.equipe];
  const faixa = INVESTIMENTO[privado.investimento];
  const canaisHoje = rotulosDeCaptacao(privado.captacao).filter((c) => !c.startsWith("Sem canal"));

  const proposta: string[] = [];
  if (ctx.ofertas.length > 0) {
    proposta.push(`Oferta em destaque: ${descreverOferta(ctx.ofertas[0])}`);
    if (ctx.ofertas.length > 1) {
      proposta.push(`Também oferece: ${listaPt(ctx.ofertas.slice(1).map((o) => o.titulo))}`);
    }
  } else {
    proposta.push(`Oferece ${p.oQueVende} para ${p.tipoDeCliente}`);
  }
  proposta.push(
    `Resolve dores como: ${listaPt(p.dores.slice(0, 3))}`,
    `Entrega o que o cliente mais quer: ${listaPt(p.desejos.slice(0, 3))}`,
    `Diferencial a construir: mostrar ${minusculaInicial(p.provas[0])}`,
    `Foco dos próximos 90 dias: ${minusculaInicial(plano.rotulo)}`,
  );

  const canais = [
    canaisHoje.length > 0
      ? `Hoje: ${listaPt(canaisHoje)}`
      : "Hoje: nenhum canal estruturado (primeira prioridade)",
    `Presença digital: ${presenca.canal}`,
    ...p.canais.slice(0, 2).map((c) => `Canal recomendado: ${c}`),
  ];

  const relacionamento = [
    ...equipe.relacionamento,
    "Pós-venda: pedir avaliação e combinar o retorno de cada cliente",
    p.agendamento
      ? "Confirmação do horário um dia antes, para reduzir faltas"
      : "Registro de cada cliente e do que ele comprou, para o contato seguinte",
  ];

  const parcerias = [
    ...ctx.parceiros.map(
      (parceiro) =>
        `Parceria formada com ${parceiro.nome} (${perfilDeMercado(parceiro.segmento).rotulo.toLowerCase()})`,
    ),
    ...p.parcerias,
  ].slice(0, 6);

  return {
    segmentos: p.clientes,
    proposta,
    canais,
    relacionamento,
    receitas: p.receitas,
    recursos: p.recursos,
    atividades: p.atividadesChave,
    parcerias,
    custos: [
      equipe.custoPessoal,
      ...p.custos.slice(0, 4),
      `Tecnologia e divulgação: ${minusculaInicial(faixa.rotulo)}`,
    ],
  };
}

function diagnostico(ctx: ContextoNegocio, p: PerfilMercado): Bloco {
  const { privado } = ctx;
  const presenca = PRESENCA_DIGITAL[privado.presencaDigital];
  const gargalo = GARGALOS[privado.gargalo];
  const equipe = EQUIPE[privado.equipe];
  const semCanal =
    privado.captacao.length === 0 || privado.captacao.every((c) => c === "sem-processo");

  const forcas: string[] = [];
  if (ctx.ofertas.length > 0) {
    forcas.push("Ofertas publicadas no hub: os clientes já podem ver o que você faz");
  }
  if (privado.presencaDigital === "site-portais" || privado.presencaDigital === "social") {
    forcas.push(`Já existe presença digital: ${presenca.canal}`);
  }
  if (privado.captacao.includes("indicacao")) {
    forcas.push("Clientes que indicam são sinal de que o trabalho entrega o que promete");
  }
  if (ctx.parceiros.length > 0) {
    forcas.push("Parcerias formadas: base para indicação mútua");
  }
  if (forcas.length === 0) {
    forcas.push("Você está estruturando o negócio: este documento e o seu cadastro são o primeiro passo");
  }

  const melhorar = [gargalo.diagnostico];
  if (privado.presencaDigital !== "site-portais") melhorar.push(presenca.leitura);
  if (semCanal) melhorar.push("Não há um processo definido para atrair clientes");
  if (privado.equipe === "so-eu") melhorar.push(equipe.leitura);
  if (ctx.ofertas.length === 0) {
    melhorar.push("Nenhuma oferta publicada: o hub e os materiais ficam mais genéricos do que poderiam");
  }

  const oportunidades = [
    `Quem compra costuma procurar quando: ${listaPt(p.gatilhos.slice(0, 3))}`,
    `Canal pouco explorado: ${p.canais[0]}`,
  ];
  if (ctx.parceiros.length === 0) {
    oportunidades.push("Parceria com negócios vizinhos para indicação mútua");
  }

  return {
    tipo: "cartoes",
    cartoes: [
      { titulo: "O que já funciona a seu favor", itens: forcas },
      { titulo: "O que melhorar primeiro", itens: melhorar.slice(0, 5).map(semPontoFinal) },
      { titulo: "Oportunidades", itens: oportunidades },
      { titulo: "Pontos de atenção do mercado", itens: p.riscos.slice(0, 3) },
    ],
  };
}

function linhasDoPlano(acoes: readonly AcaoPlano[]): string[][] {
  return acoes.map((a) => [a.acao, a.esforco, a.indicador]);
}

const COLUNAS_PLANO = ["Ação", "Tempo estimado", "Como saber que deu certo"];

function fase1(ctx: ContextoNegocio): AcaoPlano[] {
  const { privado } = ctx;
  const plano = PLANOS[privado.objetivo];
  const gargalo = GARGALOS[privado.gargalo];
  const presenca = PRESENCA_DIGITAL[privado.presencaDigital];

  const acoes: AcaoPlano[] = [
    {
      acao: gargalo.acao,
      esforco: "1 a 2 horas para começar",
      indicador: gargalo.sinal,
    },
    ...plano.fase30.slice(0, 2),
  ];
  if (privado.presencaDigital !== "site-portais") {
    acoes.push({
      acao: presenca.prioridade,
      esforco: "2 a 3 horas no início",
      indicador: "Visualizações do perfil e mensagens recebidas",
    });
  }
  if (ctx.ofertas.length === 0) {
    acoes.push({
      acao: "Cadastrar no hub as suas ofertas, com preço de referência: os materiais passam a falar do que você realmente vende",
      esforco: "30 minutos",
      indicador: "Ofertas publicadas",
    });
  }
  return acoes.slice(0, 5);
}

export function gerarCanvas(ctx: ContextoNegocio): Documento {
  const p = perfilDeMercado(ctx.nicho);
  const { privado } = ctx;
  const plano = PLANOS[privado.objetivo];
  const gargalo = GARGALOS[privado.gargalo];
  const presenca = PRESENCA_DIGITAL[privado.presencaDigital];
  const faixa = INVESTIMENTO[privado.investimento];
  const equipe = EQUIPE[privado.equipe];
  const canaisHoje = rotulosDeCaptacao(privado.captacao);

  const secoes: Secao[] = [];

  // ---------------------------------------------------------------- resumo
  const resumo: Bloco[] = [
    {
      tipo: "destaque",
      titulo: "Documento interno",
      tom: "atencao",
      texto:
        "Este documento usa as respostas do seu cadastro (gargalo, orçamento, equipe). É para você e para quem trabalha com você, não para publicar nem para mostrar a clientes.",
    },
    {
      tipo: "paragrafo",
      texto: `${ctx.nome} atua com ${p.oQueVende} em ${ctx.cidade}. O objetivo dos próximos 90 dias é ${minusculaInicial(plano.rotulo)}. O foco do ciclo é ${minusculaInicial(plano.foco)}`,
    },
    {
      tipo: "tabela",
      colunas: ["Item", "Informação"],
      linhas: [
        ["Negócio", ctx.nome],
        ["Mercado", p.rotulo],
        ["Local", `${ctx.bairro}, ${ctx.cidade}`],
        ["Equipe", ROTULO_EQUIPE[privado.equipe]],
        ["Presença digital", presenca.leitura],
        ["Como capta clientes hoje", canaisHoje.length > 0 ? listaPt(canaisHoje) : "Sem canal definido"],
        ["Objetivo dos próximos 90 dias", plano.rotulo],
        ["Maior gargalo declarado", gargalo.diagnostico],
        ["Investimento mensal em tecnologia", faixa.rotulo],
      ],
    },
  ];
  if (!privado.temOnboarding) {
    resumo.unshift({
      tipo: "destaque",
      titulo: "Faltam respostas do cadastro",
      tom: "info",
      texto:
        "Este documento foi gerado sem as respostas do cadastro. Equipe, objetivo, gargalo e presença digital usam valores neutros. Responda o cadastro para receber um plano feito para o seu negócio.",
    });
  }
  secoes.push(secao("resumo", "Resumo do negócio", resumo));

  // ---------------------------------------------------------------- canvas
  secoes.push(
    secao(
      "canvas",
      "Modelo de Negócio (Canvas)",
      [{ tipo: "canvas", celulas: celulasDoCanvas(ctx, p) }],
      "O Canvas mostra o negócio inteiro em uma página: para quem você vende, o que oferece, como chega até o cliente e de onde vem o dinheiro. Comece por quem compra e pelo que você oferece (centro e direita) e depois confira se atividades, recursos e custos sustentam isso.",
    ),
  );

  // ------------------------------------------------------- primeiras ações
  secoes.push(
    secao(
      "primeiras-acoes",
      "Primeiras ações: os próximos 7 dias",
      [
        {
          tipo: "checklist",
          itens: [...plano.primeirasAcoes, `Atacar o maior gargalo: ${minusculaInicial(gargalo.acao)}`],
        },
      ],
      "Pequenas, concretas e possíveis em uma semana. Marque cada uma quando fizer.",
    ),
  );

  // ----------------------------------------------- nível 2: plano e métricas
  if (ctx.nivel >= 2) {
    secoes.push(
      secao("diagnostico", "Diagnóstico do negócio", [diagnostico(ctx, p)], "Baseado no que você declarou no cadastro e no que publicou no hub."),
    );

    secoes.push(
      secao(
        "plano-1",
        "Plano de 90 dias, fase 1 (dias 1 a 30)",
        [
          { tipo: "tabela", colunas: COLUNAS_PLANO, linhas: linhasDoPlano(fase1(ctx)) },
          {
            tipo: "destaque",
            tom: "info",
            titulo: "Tempo do plano",
            texto: `O plano pressupõe cerca de ${equipe.horasMarketing} horas por semana para marketing e vendas. Se o seu tempo for menor, faça na ordem e pare quando o tempo acabar: a ordem já é de prioridade.`,
          },
        ],
        "Objetivo: colocar a base em ordem e começar a medir.",
      ),
    );
    secoes.push(
      secao(
        "plano-2",
        "Plano de 90 dias, fase 2 (dias 31 a 60)",
        [{ tipo: "tabela", colunas: COLUNAS_PLANO, linhas: linhasDoPlano(plano.fase60) }],
        "Objetivo: repetir o que funcionou e abrir um segundo caminho de clientes.",
      ),
    );
    secoes.push(
      secao(
        "plano-3",
        "Plano de 90 dias, fase 3 (dias 61 a 90)",
        [
          { tipo: "tabela", colunas: COLUNAS_PLANO, linhas: linhasDoPlano(plano.fase90) },
          {
            tipo: "destaque",
            tom: "info",
            titulo: `Sobre investimento: ${faixa.rotulo}`,
            texto: faixa.orientacao,
          },
          { tipo: "lista", itens: faixa.ferramentas },
        ],
        "Objetivo: decidir com números e planejar o próximo ciclo.",
      ),
    );

    secoes.push(
      secao(
        "indicadores",
        "Indicadores para acompanhar",
        [
          {
            tipo: "paragrafo",
            texto:
              "Anote estes números toda sexta, em uma planilha. A IA não conhece os seus números de hoje, então não inventamos metas: meça por duas semanas e escreva a sua meta na última coluna.",
          },
          {
            tipo: "tabela",
            colunas: ["Indicador", "Quando olhar", "Sua meta"],
            linhas: [
              [plano.indicadorPrincipal, "Toda semana", "(preencha depois de medir por 2 semanas)"],
              ...p.indicadores.map((indicador, i): string[] => [
                indicador,
                i < 2 ? "Toda semana" : "Todo mês",
                "(preencha depois de medir por 2 semanas)",
              ]),
            ],
          },
        ],
      ),
    );
  }

  // ------------------------------------------------------------- documentos
  secoes.push(
    secao(
      "documentos",
      "Documentos para manter em dia",
      [
        {
          tipo: "destaque",
          tom: "atencao",
          texto:
            "Estes são itens que costumam ser exigidos neste mercado. As regras variam por cidade e por atividade: confirme com o seu contador e com os órgãos do seu município antes de tomar qualquer decisão.",
        },
        { tipo: "checklist", itens: p.documentos },
      ],
    ),
  );

  // ----------------------------------------------- nível 3: riscos e revisão
  if (ctx.nivel >= 3) {
    secoes.push(
      secao(
        "riscos",
        "Riscos e como se proteger",
        [
          {
            tipo: "tabela",
            colunas: ["Risco", "Ação preventiva", "Quem cuida"],
            linhas: p.riscos.map((r): string[] => [r, "(defina uma ação)", "(defina um responsável)"]),
          },
          {
            tipo: "cartoes",
            cartoes: [
              {
                titulo: "Se o ritmo ficar abaixo do planejado",
                itens: [
                  "Faça só as três primeiras ações de cada fase",
                  "Mantenha a resposta rápida aos contatos e o pedido de avaliação: são os que mais pesam",
                  "Revise o tempo disponível antes de assumir novas ações",
                ],
              },
              {
                titulo: "Se o ritmo ficar acima do planejado",
                itens: [
                  "Antecipe a oferta de entrada e a lista de contatos",
                  "Documente o que está funcionando antes de crescer",
                  "Pense em delegar uma tarefa repetitiva",
                ],
              },
            ],
          },
        ],
        "Cada risco deste mercado precisa de uma ação preventiva e de um responsável. Preencha a tabela.",
      ),
    );

    secoes.push(
      secao(
        "revisao",
        "Revisão trimestral",
        [
          {
            tipo: "checklist",
            itens: [
              "O que funcionou nos últimos 90 dias?",
              "O que não funcionou, e por quê?",
              "Qual indicador melhorou e qual piorou?",
              "O objetivo continua o mesmo para o próximo ciclo?",
              "Quais procedimentos precisam ser atualizados?",
              "Quais documentos vencem nos próximos 90 dias?",
            ],
          },
        ],
        "Canvas parado vira enfeite. Reserve duas horas a cada trimestre.",
      ),
    );
  }

  return {
    tipo: "canvas",
    titulo: `Modelo de Negócio: ${ctx.nome}`,
    subtitulo: `${p.rotulo} · ${ctx.bairro}, ${ctx.cidade}`,
    meta: metaDoDocumento(ctx, { cargo: "Documentador(a) IA", circulacao: "interno" }),
    secoes,
  };
}
