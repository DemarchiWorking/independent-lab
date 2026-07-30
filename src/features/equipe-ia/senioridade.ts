import type { CargoIA, HabilidadeIA } from "./catalogo";

/**
 * Senioridade de um Funcionário de IA — tempo de casa virado em título, barra e
 * habilidades reveladas (GH-WORLD-07).
 *
 * ⚠️ LEITURA, NÃO MECÂNICA. Isto **não** é progressão: subir de faixa não dá
 * XP, não mexe em atributo, não desconta moeda e não destrava nada no jogo. É
 * só uma forma organizada de mostrar algo que já é verdade no banco
 * (`FuncionarioContratado.contratadoEm`) e de apresentar o que o cargo entrega
 * em etapas digeríveis, em vez de despejar tudo de uma vez. Se um dia
 * senioridade for VALER alguma coisa, aí sim vira estado persistido, com
 * guarda anti-farm — não derivação.
 *
 * `agoraIso` é sempre explícito (nunca `new Date()` escondido aqui dentro) —
 * mesmo contrato de `lib/disponibilidade.ts` e `features/historia/relogio.ts`:
 * é o que permite testar "daqui a 90 dias" em 1ms, e o que impede o cliente de
 * forjar o tempo. Quem chama passa o relógio do SERVIDOR.
 */

export type NivelSenioridade = "junior" | "pleno" | "senior" | "especialista";

interface Faixa {
  nivel: NivelSenioridade;
  titulo: string;
  /** dias de casa a partir dos quais a faixa vale */
  desde: number;
}

/**
 * As faixas, em ordem crescente. Tabela explícita (padrão `NIVEIS_SEDE`/
 * `SALA_POR_NIVEL` do projeto) em vez de fórmula: game design ajusta números
 * sem reescrever matemática.
 */
const FAIXAS: readonly Faixa[] = [
  { nivel: "junior", titulo: "Júnior", desde: 0 },
  { nivel: "pleno", titulo: "Pleno", desde: 7 },
  { nivel: "senior", titulo: "Sênior", desde: 30 },
  { nivel: "especialista", titulo: "Especialista", desde: 90 },
];

const MS_POR_DIA = 86_400_000;

export interface Senioridade {
  nivel: NivelSenioridade;
  titulo: string;
  diasDeCasa: number;
  /** 0..1 rumo à próxima faixa — é a barra da ficha. 1 no topo. */
  progresso: number;
  proximo: NivelSenioridade | null;
  /** título da próxima faixa, para a legenda da barra */
  proximoTitulo: string | null;
  diasParaProximo: number | null;
}

/** Ordem de uma faixa (0 = júnior). Usado para comparar níveis. */
export function ordemDoNivel(nivel: NivelSenioridade): number {
  return FAIXAS.findIndex((f) => f.nivel === nivel);
}

/**
 * Dias inteiros completos entre a contratação e agora.
 *
 * Nunca negativo: `contratadoEm` no futuro (relógio torto, seed de teste) conta
 * como "hoje" em vez de virar dia negativo e quebrar a barra. Data ilegível
 * também cai em 0 — a ficha degrada para "recém-chegado", não para `NaN`.
 */
function diasEntre(contratadoEm: string, agoraIso: string): number {
  const de = Date.parse(contratadoEm);
  const ate = Date.parse(agoraIso);
  if (Number.isNaN(de) || Number.isNaN(ate)) return 0;
  return Math.max(0, Math.floor((ate - de) / MS_POR_DIA));
}

/** Senioridade derivada do tempo de casa. Pura e determinística. */
export function senioridadeDe(contratadoEm: string, agoraIso: string): Senioridade {
  const diasDeCasa = diasEntre(contratadoEm, agoraIso);

  let indice = 0;
  for (let i = 0; i < FAIXAS.length; i++) {
    if (diasDeCasa >= FAIXAS[i].desde) indice = i;
  }

  const atual = FAIXAS[indice];
  const proxima = FAIXAS[indice + 1] ?? null;

  if (!proxima) {
    return {
      nivel: atual.nivel,
      titulo: atual.titulo,
      diasDeCasa,
      progresso: 1,
      proximo: null,
      proximoTitulo: null,
      diasParaProximo: null,
    };
  }

  const janela = proxima.desde - atual.desde;
  const andado = diasDeCasa - atual.desde;

  return {
    nivel: atual.nivel,
    titulo: atual.titulo,
    diasDeCasa,
    progresso: Math.min(1, Math.max(0, andado / janela)),
    proximo: proxima.nivel,
    proximoTitulo: proxima.titulo,
    diasParaProximo: proxima.desde - diasDeCasa,
  };
}

export interface HabilidadeRevelada extends HabilidadeIA {
  /** já visível para o jogador (a faixa atual alcançou `nivelMinimo`) */
  liberada: boolean;
}

/**
 * As habilidades do cargo, marcando quais a senioridade atual já revelou.
 *
 * Devolve TODAS (não filtra): a ficha mostra as travadas em cinza, porque ver o
 * que ainda vem é metade do valor da tela — é o que explica ao empresário que o
 * serviço tem mais camadas do que ele contratou até agora.
 */
export function habilidadesLiberadas(
  cargo: CargoIA,
  senioridade: Senioridade,
): HabilidadeRevelada[] {
  const atual = ordemDoNivel(senioridade.nivel);
  return cargo.habilidades.map((h) => ({
    ...h,
    liberada: ordemDoNivel(h.nivelMinimo) <= atual,
  }));
}
