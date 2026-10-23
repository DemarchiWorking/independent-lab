import type {
  BlocoCanvas,
  CanvasNegocio,
  ChaveBloco,
  FasePlano,
  Maturidade,
  PerfilNegocio,
  Prioridade,
} from "./tipos";
import { conteudoCanvas, ORDEM_BLOCOS, PERGUNTA_BLOCO } from "./canvas-conteudo";
import {
  CAPTACAO_TEXTO,
  GARGALO_TEXTO,
  OBJETIVO_TEXTO,
  vocabulario,
} from "./vocabulario";

/**
 * Business Model Canvas de nível enterprise (entregável do Documentador de IA).
 *
 * Puro: mesmo perfil, mesmo canvas — sem relógio, sem I/O, sem aleatoriedade.
 * É o que torna cada afirmação testável.
 *
 * O que torna este canvas "de consultoria" e não um formulário preenchido:
 *
 * 1. **Cada quadro responde uma pergunta** (`PERGUNTA_BLOCO`) e traz a
 *    melhor prática, o indicador e — a partir do nível 2 — a hipótese a
 *    validar do SEGMENTO do negócio (`canvas-conteudo.ts`).
 * 2. **A maturidade de cada quadro vem das respostas do cadastro**, com a
 *    evidência escrita ao lado (`maturidadeDosBlocos`). Nada é opinião solta:
 *    quem lê vê qual resposta sustenta cada classificação.
 * 3. **Prioridades saem dos quadros menos definidos**, não de uma lista fixa.
 *
 * `nivelAgente` controla PROFUNDIDADE, nunca contradiz o nível anterior:
 * - nível 1: canvas completo (9 quadros, pergunta, resposta, boa prática,
 *   indicador, maturidade, resumo executivo e prioridades);
 * - nível 2: + itens extras, hipóteses por quadro, plano de 90 dias e
 *   próximos passos;
 * - nível 3: + matriz de riscos do nicho e checklist de validação.
 */

const PESO: Record<Maturidade, number> = { "a-definir": 0, parcial: 1, definido: 2 };
const PONTOS: Record<Maturidade, number> = { definido: 100, parcial: 50, "a-definir": 0 };

const ATIVIDADE_POR_GARGALO: Record<PerfilNegocio["respostas"]["gargalo"], string> = {
  "perco-leads": "Responder todo contato em minutos, com roteiro pronto e registro de cada conversa",
  manual: "Eliminar o trabalho manual que mais se repete (planilha solta vira rotina em sistema)",
  "sem-dados": "Registrar a origem de cada cliente e o resultado por canal, toda semana",
  "imagem-fraca": "Atualizar a presença digital com prova concreta do que o negócio já entregou",
  "sem-processo": "Documentar o atendimento e a entrega em passo a passo que qualquer pessoa repita",
};

const LICITACAO_TEXTO: Partial<Record<PerfilNegocio["respostas"]["licitacaoPublico"], string>> = {
  "vende-regularmente":
    "Você já vende regularmente ao poder público — priorize ampliar o número de órgãos atendidos",
  "ja-vendeu":
    "Você já vendeu ao poder público, mas sem regularidade — falta uma rotina semanal de acompanhamento de editais",
  "tem-interesse":
    "Você tem interesse em vender ao poder público — comece pela habilitação (certidões em dia) e por um edital pequeno",
};

const MODELO_RECEITA_TEXTO: Record<PerfilNegocio["respostas"]["modeloReceita"], string> = {
  "projeto-unico": "projeto único (receita irregular, exige captar sempre de novo)",
  "assinatura-recorrente": "assinatura recorrente (previsível)",
  "comissao-resultado": "comissão sobre resultado (depende do cliente vender)",
  "venda-produto": "venda de produto (margem e giro de estoque)",
  combinacao: "combinação de modelos",
};

const TICKET_TEXTO: Record<PerfilNegocio["respostas"]["ticketMedio"], string> = {
  "ate-500": "até R$ 500",
  "500-2000": "R$ 500 a R$ 2.000",
  "2000-10000": "R$ 2.000 a R$ 10.000",
  "10000-50000": "R$ 10.000 a R$ 50.000",
  "acima-50000": "acima de R$ 50.000",
  "nao-sei": "não informado",
};

/** Texto livre do cadastro entra no documento: apara e limita (o cadastro já
 *  trunca no servidor; aqui é a segunda camada, porque este módulo também
 *  recebe perfis vindos de seed e de testes). */
function livre(texto: string | undefined, max = 240): string {
  const t = (texto ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** O dono respondeu de verdade? ("não sei", "ainda não tenho" e afins contam como vazio.) */
function respondido(texto: string | undefined): boolean {
  const t = livre(texto).toLowerCase();
  return t.length >= 8 && !/^(n[aã]o sei|ainda n[aã]o tenho|nenhum|n\/a|-+)\.?$/.test(t);
}

interface Avaliacao {
  nivel: Maturidade;
  evidencia: string;
}

/** Sobe/desce um nível de maturidade (limitado aos extremos). */
function ajustar(nivel: Maturidade, delta: -1 | 1): Maturidade {
  const ordem: Maturidade[] = ["a-definir", "parcial", "definido"];
  const i = Math.min(2, Math.max(0, ordem.indexOf(nivel) + delta));
  return ordem[i];
}

/**
 * Quão definido está cada quadro, a partir do que o dono declarou no
 * cadastro. Regras explícitas e conservadoras: sem resposta que comprove,
 * o quadro nunca passa de "parcial" — e a evidência diz o porquê.
 */
export function maturidadeDosBlocos(
  respostas: PerfilNegocio["respostas"],
): Record<ChaveBloco, Avaliacao> {
  const canais = respostas.captacao.filter((c) => c !== "sem-processo");
  const grande = respostas.equipe === "6-15" || respostas.equipe === "16-30" || respostas.equipe === "30+";

  const clientes: Avaliacao =
    respostas.clientesPagantes === "nenhum" && canais.length === 0
      ? { nivel: "a-definir", evidencia: "Você declarou não ter clientes pagantes nem canal de captação — quem compra ainda não foi identificado." }
      : respostas.clientesPagantes === "6-20" ||
          respostas.clientesPagantes === "21-50" ||
          respostas.clientesPagantes === "mais-50"
        ? { nivel: "definido", evidencia: `Você já tem clientes pagantes (faixa ${respostas.clientesPagantes}), o que permite descrever quem compra.` }
        : { nivel: "parcial", evidencia: "O segmento está declarado, mas o cliente prioritário ainda não foi escolhido." };

  const base: Maturidade =
    respostas.presencaDigital === "site-portais"
      ? "definido"
      : respostas.presencaDigital === "nada"
        ? "a-definir"
        : "parcial";
  const temProposta = respondido(respostas.problemaPrincipal) && respondido(respostas.diferencial);
  const comProposta = temProposta ? ajustar(base, 1) : base;
  const proposta: Avaliacao = {
    nivel: respostas.gargalo === "imagem-fraca" ? ajustar(comProposta, -1) : comProposta,
    evidencia:
      respostas.gargalo === "imagem-fraca"
        ? "Você declarou que a presença digital está abaixo do que o negócio entrega."
        : temProposta
          ? "Você descreveu o problema que resolve e o seu diferencial — falta validar com clientes."
          : respostas.presencaDigital === "nada"
            ? "Você declarou não ter presença digital — a proposta ainda não está publicada."
            : "Há presença digital, mas a proposta de valor ainda não foi validada com clientes.",
  };

  const canaisAval: Avaliacao =
    canais.length === 0
      ? { nivel: "a-definir", evidencia: "Você declarou não ter um canal de captação estruturado." }
      : canais.length === 1
        ? { nivel: "parcial", evidencia: "Você depende de um único canal de captação." }
        : { nivel: "definido", evidencia: `Você já capta por ${canais.length} canais diferentes.` };

  const relacionamento: Avaliacao =
    respostas.gargalo === "perco-leads"
      ? { nivel: "a-definir", evidencia: "Você declarou perder contatos por demora na resposta." }
      : grande
        ? { nivel: "definido", evidencia: "A equipe já divide o atendimento." }
        : { nivel: "parcial", evidencia: "O atendimento depende de poucas pessoas e não tem rotina escrita." };

  const receitas: Avaliacao =
    respostas.gargalo === "sem-dados"
      ? { nivel: "a-definir", evidencia: "Você declarou não saber de onde vem o resultado." }
      : respostas.ticketMedio !== "nao-sei" &&
          (respostas.modeloReceita === "assinatura-recorrente" || respostas.modeloReceita === "combinacao")
        ? { nivel: "definido", evidencia: "Você declarou o modelo de receita e o ticket médio — a base para medir margem existe." }
        : { nivel: "parcial", evidencia: "As fontes de receita são conhecidas, mas a margem por fonte ainda não é medida." };

  const recursos: Avaliacao =
    respostas.equipe === "so-eu"
      ? { nivel: "parcial", evidencia: "Todo o conhecimento está concentrado no dono." }
      : { nivel: "definido", evidencia: "Há equipe para sustentar a entrega." };

  const atividades: Avaliacao =
    respostas.gargalo === "sem-processo"
      ? { nivel: "a-definir", evidencia: "Você declarou que a equipe não tem processo definido." }
      : respostas.gargalo === "manual"
        ? { nivel: "parcial", evidencia: "Você declarou muito trabalho manual e planilha." }
        : respostas.gargalo === "perco-leads"
          ? { nivel: "parcial", evidencia: "Você declarou perder contatos — a rotina de resposta ainda não está estruturada." }
          : respostas.gargalo === "sem-dados"
            ? { nivel: "parcial", evidencia: "Você declarou não medir de onde vem o resultado — falta rotina de registro." }
            : { nivel: "definido", evidencia: "Nenhum gargalo operacional foi declarado." };

  const parcerias: Avaliacao =
    canais.includes("indicacao") && canais.includes("portais")
      ? { nivel: "definido", evidencia: "Você já recebe indicação e atua em portais — há rede ativa." }
      : canais.includes("indicacao")
        ? { nivel: "parcial", evidencia: "Você recebe indicação, mas sem parceiros formalizados." }
        : { nivel: "a-definir", evidencia: "Você não declarou indicação nem rede de parceiros." };

  const custos: Avaliacao =
    respostas.investimento === "nao-sei"
      ? { nivel: "a-definir", evidencia: "Você declarou não ter um teto de investimento em tecnologia." }
      : respostas.investimento === "ate-500"
        ? { nivel: "parcial", evidencia: "O teto de investimento é baixo e precisa ser priorizado." }
        : { nivel: "definido", evidencia: "Há um teto de investimento declarado." };

  return { clientes, proposta, canais: canaisAval, relacionamento, receitas, recursos, atividades, parcerias, custos };
}

export function gerarCanvas(perfil: PerfilNegocio): CanvasNegocio {
  const v = vocabulario(perfil.segmento);
  const c = conteudoCanvas(perfil.segmento);
  const { respostas, nivelAgente } = perfil;
  const nivel2 = nivelAgente >= 2;
  const nivel3 = nivelAgente >= 3;
  const avaliacao = maturidadeDosBlocos(respostas);

  const canaisAtuais = respostas.captacao
    .filter((x) => x !== "sem-processo")
    .map((x) => CAPTACAO_TEXTO[x])
    .filter((x): x is string => Boolean(x));

  const itens: Record<ChaveBloco, string[]> = {
    clientes: [
      ...(nivel2 ? v.clientes : v.clientes.slice(0, 2)),
      ...(respostas.captacao.includes("portais")
        ? ["Você já atende compradores que usam portais — formalize esse segmento como prioridade"]
        : []),
      ...(LICITACAO_TEXTO[respostas.licitacaoPublico]
        ? [LICITACAO_TEXTO[respostas.licitacaoPublico]!]
        : []),
    ],
    proposta: [
      ...(respondido(respostas.problemaPrincipal)
        ? [`Problema que resolvemos (nas suas palavras): ${livre(respostas.problemaPrincipal)}`]
        : ["Descreva em uma frase o problema que você resolve — é o ponto de partida deste quadro"]),
      ...(respondido(respostas.diferencial)
        ? [`Diferencial declarado: ${livre(respostas.diferencial)}`]
        : []),
      ...(respondido(respostas.provaSocial)
        ? [`Prova social disponível: ${livre(respostas.provaSocial)}`]
        : ["Sem prova social registrada — colete 3 depoimentos ou casos antes de investir em divulgação"]),
      ...(nivel2 ? c.propostaValor : c.propostaValor.slice(0, 2)),
      `Foco declarado para os próximos 90 dias: ${OBJETIVO_TEXTO[respostas.objetivo]}`,
      ...(respostas.gargalo === "imagem-fraca"
        ? ["Ajuste necessário: a presença digital ainda não mostra o que o negócio entrega"]
        : []),
      ...(nivel2 && respondido(respostas.concorrentesConhecidos)
        ? [`Concorrentes que você já conhece: ${livre(respostas.concorrentesConhecidos)} — compare preço, prazo e prova com cada um`]
        : []),
      ...(nivel2 ? [`Diferencial a construir: ${v.argumentoChave}`] : []),
    ],
    canais:
      canaisAtuais.length > 0
        ? [
            ...canaisAtuais.map((x) => `Hoje: ${x}`),
            ...c.canaisIdeais
              .slice(0, nivel2 ? 3 : 2)
              .map((x) => `Recomendado para o segmento: ${x}`),
          ]
        : [
            "Nenhum canal estruturado hoje — primeira prioridade",
            ...c.canaisIdeais
              .slice(0, nivel2 ? 3 : 2)
              .map((x) => `Recomendado para o segmento: ${x}`),
          ],
    relacionamento: [
      ...relacionamentoPorEquipe(respostas.equipe),
      ...(nivel2 ? c.relacionamento : c.relacionamento.slice(0, 1)),
    ],
    receitas: [
      `Modelo declarado: ${MODELO_RECEITA_TEXTO[respostas.modeloReceita]}`,
      ...(respostas.ticketMedio !== "nao-sei"
        ? [`Ticket médio declarado: ${TICKET_TEXTO[respostas.ticketMedio]}`]
        : ["Ticket médio não informado — calcule antes de definir metas de venda"]),
      ...(nivel2 ? v.receitas : v.receitas.slice(0, 2)),
      ...(respostas.gargalo === "sem-dados"
        ? ["Medir a receita por fonte: hoje não está claro de onde vem o resultado"]
        : []),
    ],
    recursos: [
      ...(nivel2 ? v.recursos : v.recursos.slice(0, 2)),
      ...(respostas.equipe === "so-eu"
        ? ["Risco: o conhecimento e a operação dependem de uma única pessoa"]
        : []),
    ],
    atividades: [
      ...(nivel2 ? v.atividades : v.atividades.slice(0, 3)),
      `Prioridade operacional: ${ATIVIDADE_POR_GARGALO[respostas.gargalo]}`,
    ],
    parcerias: nivel2 ? v.parcerias : v.parcerias.slice(0, 2),
    custos: [
      ...custosPorEquipe(respostas.equipe, respostas.investimento, nivel2),
      ...(nivel2 ? c.custos : c.custos.slice(0, 2)),
    ],
  };

  const blocos: BlocoCanvas[] = ORDEM_BLOCOS.map(({ chave, titulo }, i) => {
    const pratica = c.blocos[chave];
    return {
      chave,
      numero: i + 1,
      titulo,
      pergunta: PERGUNTA_BLOCO[chave],
      itens: itens[chave],
      boaPratica: pratica.boaPratica,
      indicador: pratica.indicador,
      maturidade: avaliacao[chave].nivel,
      evidencia: avaliacao[chave].evidencia,
      ...(nivel2 ? { hipotese: pratica.hipotese } : {}),
    };
  });

  const indiceClareza = Math.round(
    blocos.reduce((soma, b) => soma + PONTOS[b.maturidade], 0) / blocos.length,
  );

  const prioridades: Prioridade[] = [...blocos]
    .filter((b) => b.maturidade !== "definido")
    .sort((a, b) => PESO[a.maturidade] - PESO[b.maturidade] || a.numero - b.numero)
    .slice(0, 3)
    .map((b) => ({ bloco: b.titulo, porque: b.evidencia, acao: b.boaPratica }));

  const proximosPassos: string[] = [];
  if (nivel2) {
    proximosPassos.push(
      `Atacar o gargalo declarado: ${GARGALO_TEXTO[respostas.gargalo]}.`,
      `Transformar "${OBJETIVO_TEXTO[respostas.objetivo]}" em uma meta com número e prazo.`,
    );
  }
  if (nivel3) {
    proximosPassos.push(
      `Risco a monitorar: ${v.dorTipica} — é o que mais trava negócios deste segmento.`,
      "Revisar este canvas a cada ciclo de 90 dias; canvas parado vira enfeite.",
    );
  }

  const plano90Dias: FasePlano[] = nivel2
    ? [
        {
          fase: "Dias 1–30 · Fundamentar",
          acoes: [
            prioridades[0]
              ? `${prioridades[0].bloco}: ${prioridades[0].acao}`
              : "Registrar a linha de base dos 9 indicadores deste canvas",
            "Registrar os indicadores-base dos 9 quadros em uma planilha única, com um responsável",
          ],
        },
        {
          fase: "Dias 31–60 · Executar",
          acoes: [
            `Atacar o gargalo declarado: ${ATIVIDADE_POR_GARGALO[respostas.gargalo]}`,
            ...(prioridades[1] ? [`${prioridades[1].bloco}: ${prioridades[1].acao}`] : []),
            "Validar as hipóteses dos quadros conversando com 5 clientes reais",
          ],
        },
        {
          fase: "Dias 61–90 · Medir e decidir",
          acoes: [
            "Comparar os indicadores com a linha de base do dia 30",
            "Decidir o que manter, ajustar ou cortar — com número, não com impressão",
            "Atualizar este canvas e abrir o próximo ciclo de 90 dias",
          ],
        },
      ]
    : [];

  const riscos = nivel3
    ? [
        ...c.riscos,
        {
          risco: `Gargalo declarado sem tratamento: ${GARGALO_TEXTO[respostas.gargalo]}`,
          mitigacao: ATIVIDADE_POR_GARGALO[respostas.gargalo],
        },
      ]
    : [];

  const checklistValidacao = nivel3
    ? [
        "Conversei com pelo menos 5 clientes reais sobre a proposta de valor",
        "Sei quanto custa e quanto rende cada fonte de receita",
        "Cada canal tem um número de contatos e de vendas acompanhado",
        "Existe um responsável por cada indicador deste canvas",
        "Os 3 riscos principais têm um plano de mitigação com dono e prazo",
        "A data da próxima revisão (90 dias) está na agenda",
      ]
    : [];

  return {
    titulo: `Modelo de Negócio — ${perfil.nomeNegocio}`,
    subtitulo: `${v.oQueVende} · ${perfil.bairro}, ${perfil.cidade}`,
    controle: {
      documento: "Business Model Canvas",
      versao: `1.${nivelAgente - 1}`,
      classificacao: "Confidencial — uso interno do negócio",
      metodologia: "Business Model Canvas (Osterwalder & Pigneur, 2010) + boas práticas do segmento",
      elaboradoPor: `Documentador IA · nível ${nivelAgente}`,
      revisao: "A cada ciclo de 90 dias",
    },
    resumoExecutivo: [
      {
        rotulo: "O negócio",
        texto:
          `${perfil.nomeNegocio} atua com ${v.oQueVende} em ${perfil.bairro}, ${perfil.cidade}.` +
          (respondido(respostas.problemaPrincipal)
            ? ` Resolve: ${livre(respostas.problemaPrincipal)}`
            : ""),
      },
      {
        rotulo: "Para quem vende",
        texto: v.clientes.slice(0, 2).join("; ") + ".",
      },
      {
        rotulo: "Como ganha dinheiro",
        texto:
          v.receitas[0] +
          (respostas.gargalo === "sem-dados" ? " — ainda sem medição por fonte." : "."),
      },
      {
        rotulo: "Foco dos próximos 90 dias",
        texto: `${capitalizar(OBJETIVO_TEXTO[respostas.objetivo])}, enfrentando: ${GARGALO_TEXTO[respostas.gargalo]}.`,
      },
      {
        rotulo: "Maior ponto de atenção",
        texto: prioridades[0]
          ? `${prioridades[0].bloco} — ${prioridades[0].porque}`
          : "Todos os quadros estão bem definidos; o desafio agora é medir e revisar.",
      },
    ],
    indiceClareza,
    rotuloClareza:
      indiceClareza >= 75
        ? "Modelo sólido"
        : indiceClareza >= 50
          ? "Modelo em estruturação"
          : "Modelo inicial",
    blocos,
    prioridades,
    proximosPassos,
    plano90Dias,
    riscos,
    checklistValidacao,
  };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function relacionamentoPorEquipe(equipe: PerfilNegocio["respostas"]["equipe"]): string[] {
  return equipe === "so-eu"
    ? [
        "Atendimento direto do dono (alta confiança, baixa escala)",
        "Risco: tudo depende de uma pessoa só",
      ]
    : equipe === "2-5"
      ? [
          "Atendimento pela equipe, com o dono no fechamento",
          "Precisa de padrão para não depender de quem atendeu",
        ]
      : [
          "Atendimento distribuído na equipe",
          "Exige processo documentado e histórico centralizado",
        ];
}

function custosPorEquipe(
  equipe: PerfilNegocio["respostas"]["equipe"],
  investimento: PerfilNegocio["respostas"]["investimento"],
  nivel2: boolean,
): string[] {
  const pessoal =
    equipe === "so-eu"
      ? "Pró-labore do dono (custo real, mesmo que não saia do caixa)"
      : "Folha da equipe (maior custo fixo)";
  const base = [pessoal];
  if (!nivel2) return base;

  const teto =
    investimento === "nao-sei"
      ? "Definir um teto mensal de investimento em tecnologia — hoje não há"
      : `Investimento em tecnologia declarado: faixa ${investimento.replace("-", " a ")}`;
  return [...base, teto];
}
