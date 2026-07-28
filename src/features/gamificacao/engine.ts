import { nivelPorXp } from "@/lib/gamificacao";
import type { AtributoChave } from "@tokens";

/**
 * Motor de eventos de gamificação (puro e determinístico).
 *
 * Cada evento representa uma AÇÃO REAL de negócio. As recompensas (XP, moeda,
 * avanço de degrau) são fixas e auditáveis — nada de número mágico espalhado
 * pela aplicação. `aplicarEvento` é pura: mesma entrada, mesma saída.
 */

export type EventoKey =
  | "cadastro_completo"
  | "diagnostico_agendado"
  | "servico_contratado"
  | "servico_desbloqueado"
  | "parceria_formada"
  | "oferta_publicada"
  | "retro_90d"
  | "funcionario_ia_contratado";

export interface DefinicaoEvento {
  label: string;
  descricao: string;
  xp: number;
  moeda: number;
  /** true quando a ação faz o negócio subir um degrau na escada de valor */
  subeDegrau?: boolean;
  /**
   * Qual eixo da economia de atributos essa ação eleva, e quanto — ver
   * docs/analise-prints/telas/economia-de-atributos.md. Ausente em
   * `funcionario_ia_contratado`: cada cargo declara o próprio eixo em
   * `features/equipe-ia/catalogo.ts` (`CargoIA.eixoFortalecido`), resolvido
   * dinamicamente em `actions.ts` — o evento sozinho não sabe qual cargo.
   */
  atributo?: { chave: AtributoChave; ganho: number };
}

export const EVENTOS: Record<EventoKey, DefinicaoEvento> = {
  cadastro_completo: {
    label: "Cadastro concluído",
    descricao: "Você colocou seu negócio no mapa.",
    xp: 50,
    moeda: 0,
    // sem ganho aqui: o onboarding já define os 5 eixos iniciais
  },
  diagnostico_agendado: {
    label: "Diagnóstico agendado",
    descricao: "Primeiro passo real na escada de valor.",
    xp: 80,
    moeda: 100,
    atributo: { chave: "processo", ganho: 1 },
  },
  servico_contratado: {
    label: "Serviço contratado",
    descricao: "Um serviço de TI real foi fechado.",
    xp: 200,
    moeda: 300,
    subeDegrau: true,
    atributo: { chave: "tecnologia", ganho: 2 },
  },
  servico_desbloqueado: {
    label: "Serviço desbloqueado",
    descricao: "Um novo serviço entrou na sua trilha de maturidade de TI.",
    xp: 30,
    moeda: 0,
    atributo: { chave: "tecnologia", ganho: 1 },
  },
  parceria_formada: {
    label: "Parceria formada",
    descricao: "Você fechou parceria com um vizinho do quarteirão.",
    xp: 150,
    moeda: 120,
    atributo: { chave: "aquisicao", ganho: 2 },
  },
  oferta_publicada: {
    label: "Oferta publicada",
    descricao: "Sua vitrine ganhou uma nova oferta.",
    xp: 40,
    moeda: 0,
    atributo: { chave: "presenca", ganho: 1 },
  },
  retro_90d: {
    label: "Retrospectiva de 90 dias",
    descricao: "Ciclo de melhoria contínua concluído.",
    xp: 120,
    moeda: 80,
    atributo: { chave: "capacidade", ganho: 2 },
  },
  funcionario_ia_contratado: {
    label: "Funcionário de IA contratado",
    descricao: "Um agente Claude passou a trabalhar no seu negócio.",
    xp: 260,
    moeda: 200,
    subeDegrau: true,
    // sem `atributo` fixo — resolvido por cargo, ver comentário acima
  },
};

export interface EstadoProgresso {
  xp: number;
  moedaVirtual: number;
  degrauAtual: number;
}

export interface ResultadoEvento {
  estado: EstadoProgresso;
  ganhoXp: number;
  ganhoMoeda: number;
  subiuNivel: boolean;
  nivelAnterior: number;
  nivelNovo: number;
  subiuDegrau: boolean;
}

/** Aplica um evento a um estado, retornando o novo estado e o que mudou. */
export function aplicarEvento(
  estado: EstadoProgresso,
  evento: EventoKey,
  degrauMaximo = 5,
): ResultadoEvento {
  const def = EVENTOS[evento];
  const nivelAnterior = nivelPorXp(estado.xp);

  const xp = estado.xp + def.xp;
  const moedaVirtual = estado.moedaVirtual + def.moeda;
  const subiuDegrau = Boolean(def.subeDegrau) && estado.degrauAtual < degrauMaximo;
  const degrauAtual = subiuDegrau ? estado.degrauAtual + 1 : estado.degrauAtual;

  const nivelNovo = nivelPorXp(xp);

  return {
    estado: { xp, moedaVirtual, degrauAtual },
    ganhoXp: def.xp,
    ganhoMoeda: def.moeda,
    subiuNivel: nivelNovo > nivelAnterior,
    nivelAnterior,
    nivelNovo,
    subiuDegrau,
  };
}
