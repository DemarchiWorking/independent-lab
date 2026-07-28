import type { CanvasNegocio, PerfilNegocio } from "./tipos";
import {
  CAPTACAO_TEXTO,
  GARGALO_TEXTO,
  OBJETIVO_TEXTO,
  vocabulario,
} from "./vocabulario";

/**
 * Business Model Canvas preenchido a partir do perfil do negócio
 * (entregável do Documentador de IA). Puro: mesmo perfil, mesmo canvas —
 * sem relógio, sem I/O, sem aleatoriedade. É o que torna testável.
 *
 * `nivelAgente` controla PROFUNDIDADE, não conteúdo diferente: nível 1
 * entrega o canvas básico; 2 acrescenta um item extra por bloco e a
 * seção de próximos passos; 3 acrescenta leitura de risco. Assim evoluir
 * o agente tem efeito visível no produto, sem invalidar o que já foi
 * gerado antes.
 */
export function gerarCanvas(perfil: PerfilNegocio): CanvasNegocio {
  const v = vocabulario(perfil.segmento);
  const { respostas, nivelAgente } = perfil;
  const nivel2 = nivelAgente >= 2;
  const nivel3 = nivelAgente >= 3;

  const canaisAtuais = respostas.captacao
    .map((c) => CAPTACAO_TEXTO[c])
    .filter((c): c is string => Boolean(c));

  const blocos = [
    {
      titulo: "Segmentos de Clientes",
      itens: nivel2 ? v.clientes : v.clientes.slice(0, 2),
    },
    {
      titulo: "Proposta de Valor",
      itens: [
        `Entrega de ${v.oQueVende} com previsibilidade de prazo`,
        `Foco declarado para os próximos 90 dias: ${OBJETIVO_TEXTO[respostas.objetivo]}`,
        ...(nivel2 ? [`Diferencial a construir: ${v.argumentoChave}`] : []),
      ],
    },
    {
      titulo: "Canais",
      itens:
        canaisAtuais.length > 0
          ? [
              ...canaisAtuais,
              ...(nivel2 ? ["Página pública do negócio no ecossistema (SEO local)"] : []),
            ]
          : [
              "Nenhum canal estruturado hoje — primeira prioridade",
              "Começar por indicação ativa + presença digital básica",
            ],
    },
    {
      titulo: "Relacionamento com Clientes",
      itens: relacionamentoPorEquipe(respostas.equipe, nivel2),
    },
    {
      titulo: "Fontes de Receita",
      itens: nivel2 ? v.receitas : v.receitas.slice(0, 2),
    },
    {
      titulo: "Recursos Principais",
      itens: nivel2 ? v.recursos : v.recursos.slice(0, 2),
    },
    {
      titulo: "Atividades-Chave",
      itens: nivel2 ? v.atividades : v.atividades.slice(0, 3),
    },
    {
      titulo: "Parcerias Principais",
      itens: nivel2 ? v.parcerias : v.parcerias.slice(0, 2),
    },
    {
      titulo: "Estrutura de Custos",
      itens: custosPorEquipe(respostas.equipe, respostas.investimento, nivel2),
    },
  ];

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

  return {
    titulo: `Modelo de Negócio — ${perfil.nomeNegocio}`,
    subtitulo: `${v.oQueVende} · ${perfil.bairro}, ${perfil.cidade}`,
    blocos,
    proximosPassos,
  };
}

function relacionamentoPorEquipe(
  equipe: PerfilNegocio["respostas"]["equipe"],
  nivel2: boolean,
): string[] {
  const base =
    equipe === "so-eu"
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
  return nivel2 ? [...base, "Pós-venda estruturado gera recompra e indicação"] : base;
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
  const base = [pessoal, "Estrutura fixa (espaço, sistemas, licenças)"];
  if (!nivel2) return base;

  const teto =
    investimento === "nao-sei"
      ? "Definir um teto mensal de investimento em tecnologia — hoje não há"
      : `Investimento em tecnologia declarado: faixa ${investimento.replace("-", " a ")}`;
  return [...base, "Custo variável por entrega (insumo, deslocamento)", teto];
}
