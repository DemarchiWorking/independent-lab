import { CARGOS_IA, cargoPorId } from "@/features/equipe-ia/catalogo";
import type { SituacaoContrato } from "@/features/contratos/tipos";
import type { Negocio } from "@/lib/db/types";

/**
 * A Jornada — o "próximo passo certo" do jogador, sempre UM por vez.
 *
 * É o fio que costura o modo história: a carta do Laboratório traz a moeda,
 * a moeda contrata o Documentador (Canvas nível 1), o Canvas aponta a venda,
 * e os contratos semanais transformam isso em hábito. Cada passo diz POR QUE
 * ele ajuda a vender mais — a pergunta que o dono de PME faz a cada tela.
 *
 * Função pura sobre o estado: nada é "marcado" como feito. O passo atual é
 * simplesmente o primeiro cuja condição ainda não vale, então a jornada se
 * recalcula sozinha a cada page load e nunca fica fora de sincronia.
 */

export type AlvoMissao =
  /** abrir uma tela do shell */
  | { tipo: "view"; view: "equipe-ia" | "marketplace" | "contratos" }
  /** ir para uma rota própria */
  | { tipo: "rota"; href: string }
  /** abrir o contrato para cumprir */
  | { tipo: "contrato"; contratoId: string }
  /** nada a clicar (ex.: a carta já está na tela) */
  | { tipo: "nenhum" };

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  /** posição na jornada, para o "Passo 3 de 9" */
  passo: number;
  totalPassos: number;
  /** rótulo do botão; `null` quando não há o que clicar */
  acao: string | null;
  alvo: AlvoMissao;
}

export interface ContextoMissao {
  negocio: Negocio;
  /** ids dos cargos de IA já contratados */
  cargosContratados: readonly string[];
  /** ids dos capítulos de história já resolvidos */
  capitulosResolvidos: ReadonlySet<string>;
  contratos: readonly SituacaoContrato[];
}

const TOTAL_PASSOS = 9;

function contrato(ctx: ContextoMissao, id: string): SituacaoContrato | undefined {
  return ctx.contratos.find((s) => s.contrato.id === id);
}

export function missaoAtual(ctx: ContextoMissao): Missao {
  const { negocio } = ctx;

  // 1 · a carta do Laboratório: sem ela o jogador não tem capital para nada
  if (!ctx.capitulosResolvidos.has("parceria-laboratorio")) {
    return {
      id: "parceria-laboratorio",
      titulo: "Responda à carta do Laboratório",
      descricao:
        "A primeira parceria libera 🪙 400 para você montar o Canvas do seu " +
        "negócio — o mapa de onde a sua próxima venda vem.",
      passo: 1,
      totalPassos: TOTAL_PASSOS,
      acao: null,
      alvo: { tipo: "nenhum" },
    };
  }

  // 2 · Canvas nível 1 = contratar o Documentador
  const documentador = cargoPorId("documentador");
  if (documentador && !ctx.cargosContratados.includes("documentador")) {
    const falta = documentador.custoMoeda - negocio.moedaVirtual;
    if (falta <= 0) {
      return {
        id: "canvas-nivel-1",
        titulo: "Monte o Canvas do seu negócio (nível 1)",
        descricao:
          `Contrate o Documentador por 🪙 ${documentador.custoMoeda}. Ele ` +
          "escreve o Canvas com as suas respostas e mostra onde está a venda " +
          "que você ainda não está fazendo.",
        passo: 2,
        totalPassos: TOTAL_PASSOS,
        acao: "Ir para a Equipe de IA",
        alvo: { tipo: "view", view: "equipe-ia" },
      };
    }
    return {
      id: "canvas-nivel-1-juntar",
      titulo: `Junte 🪙 ${falta} para montar o Canvas`,
      descricao:
        "Os contratos da semana pagam moeda por ações que já aproximam você " +
        "de vender: registrar vendas, reativar clientes, publicar uma oferta.",
      passo: 2,
      totalPassos: TOTAL_PASSOS,
      acao: "Ver contratos",
      alvo: { tipo: "view", view: "contratos" },
    };
  }

  // 3 · medir: sem número não existe "vender mais"
  const vendas = contrato(ctx, "vendas-semana");
  if (vendas?.status === "disponivel") {
    return {
      id: "vendas-semana",
      titulo: "Registre as vendas da semana",
      descricao:
        "Você só consegue vender mais se souber quanto vende hoje. Leva um " +
        "minuto e vira o seu placar semanal.",
      passo: 3,
      totalPassos: TOTAL_PASSOS,
      acao: "Registrar vendas",
      alvo: { tipo: "contrato", contratoId: "vendas-semana" },
    };
  }

  // 4 · vitrine: o cliente novo precisa ter o que comprar
  const oferta = contrato(ctx, "oferta-semana");
  if (oferta && oferta.status !== "concluido" && oferta.status !== "bloqueado") {
    return oferta.status === "pendente"
      ? {
          id: "oferta-semana",
          titulo: "Publique uma oferta na sua vitrine",
          descricao:
            "Quem chega pela sua página precisa ver algo para comprar hoje. " +
            "Publique uma oferta nova e volte para receber a recompensa.",
          passo: 4,
          totalPassos: TOTAL_PASSOS,
          acao: "Publicar oferta",
          alvo: { tipo: "rota", href: "/painel" },
        }
      : {
          id: "oferta-semana-receber",
          titulo: "Receba a recompensa da sua oferta",
          descricao: "Oferta publicada. Falta só fechar o contrato para a moeda entrar.",
          passo: 4,
          totalPassos: TOTAL_PASSOS,
          acao: "Receber recompensa",
          alvo: { tipo: "contrato", contratoId: "oferta-semana" },
        };
  }

  // 5 · reativar: a venda mais barata do mês
  const clientes = contrato(ctx, "clientes-semana");
  if (clientes?.status === "disponivel") {
    return {
      id: "clientes-semana",
      titulo: "Chame clientes antigos no WhatsApp",
      descricao:
        "Quem já comprou de você é quem mais tem chance de comprar de novo. " +
        "Chame alguns e registre quantos.",
      passo: 5,
      totalPassos: TOTAL_PASSOS,
      acao: "Registrar contatos",
      alvo: { tipo: "contrato", contratoId: "clientes-semana" },
    };
  }

  // 6 · crescer a equipe: o próximo cargo que já dá para pagar
  const proximoCargo = CARGOS_IA.filter(
    (c) =>
      !ctx.cargosContratados.includes(c.id) &&
      c.degrauMinimo <= negocio.degrauAtual &&
      c.custoMoeda <= negocio.moedaVirtual,
  ).sort((a, b) => a.degrauMinimo - b.degrauMinimo)[0];
  if (proximoCargo) {
    return {
      id: `contratar-${proximoCargo.id}`,
      titulo: `Contrate: ${proximoCargo.nome}`,
      descricao:
        `${proximoCargo.descricao} Custa 🪙 ${proximoCargo.custoMoeda} e ` +
        "sobe o seu degrau na escada de valor.",
      passo: 6,
      totalPassos: TOTAL_PASSOS,
      acao: "Ir para a Equipe de IA",
      alvo: { tipo: "view", view: "equipe-ia" },
    };
  }

  // 7 · usar o que a IA entregou
  const entregavel = contrato(ctx, "entregavel-semana");
  if (entregavel?.status === "disponivel") {
    return {
      id: "entregavel-semana",
      titulo: "Coloque o material da IA para vender",
      descricao:
        "Baixe o entregável do seu Funcionário de IA e use hoje: publique o " +
        "post, grave o Reels ou aplique o script comercial.",
      passo: 7,
      totalPassos: TOTAL_PASSOS,
      acao: "Ver Equipe de IA",
      alvo: { tipo: "view", view: "equipe-ia" },
    };
  }

  // 8 · diagnóstico técnico (única vez)
  const diagnostico = contrato(ctx, "diagnostico");
  if (diagnostico?.status === "disponivel") {
    return {
      id: "diagnostico",
      titulo: "Agende seu diagnóstico técnico",
      descricao:
        "Entenda onde a tecnologia está travando as suas vendas. É o primeiro " +
        "passo real para os serviços de TI do Laboratório.",
      passo: 8,
      totalPassos: TOTAL_PASSOS,
      acao: "Agendar diagnóstico",
      alvo: { tipo: "contrato", contratoId: "diagnostico" },
    };
  }

  // 9 · fechar o ciclo de 90 dias
  const retro = contrato(ctx, "retro-90d");
  if (retro?.status === "disponivel") {
    return {
      id: "retro-90d",
      titulo: "Feche seu ciclo de 90 dias",
      descricao: "Você chegou ao seu alvo. Rode a retrospectiva e planeje o próximo salto.",
      passo: 9,
      totalPassos: TOTAL_PASSOS,
      acao: "Registrar retro",
      alvo: { tipo: "contrato", contratoId: "retro-90d" },
    };
  }

  // semana cumprida: a jornada não acaba, ela espera a próxima segunda
  const dias = vendas?.diasParaRenovar;
  return {
    id: "semana-cumprida",
    titulo: "Semana cumprida. Hora de vender mais.",
    descricao:
      "Seus contratos de hoje estão fechados" +
      (dias ? `; os próximos abrem em ${dias} dia(s)` : "") +
      ". Enquanto isso, aceite um serviço no Marketplace: ele paga moeda e " +
      "sobe o seu degrau.",
    passo: TOTAL_PASSOS,
    totalPassos: TOTAL_PASSOS,
    acao: "Ver serviços",
    alvo: { tipo: "view", view: "marketplace" },
  };
}
