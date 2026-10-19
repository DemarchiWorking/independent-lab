import type { Nivel } from "./tipos";
import type { ContextoNegocio, DadosPrivados } from "./tipos";

/** Contexto de teste com valores razoáveis; sobrescreva só o que importa ao caso. */
export function ctx(
  over: Partial<Omit<ContextoNegocio, "privado">> & { privado?: Partial<DadosPrivados> } = {},
): ContextoNegocio {
  const { privado, ...resto } = over;
  return {
    nome: "Radiz Engenharia",
    segmento: "engenharia",
    nicho: "engenharia",
    cidade: "Mendes",
    bairro: "Centro",
    ofertas: [],
    parceiros: [],
    nivel: 1,
    agora: "2026-10-19T15:00:00.000Z",
    ...resto,
    privado: {
      equipe: "2-5",
      presencaDigital: "social",
      captacao: ["indicacao"],
      objetivo: "mais-leads",
      gargalo: "perco-leads",
      investimento: "500-1500",
      degrau: 2,
      temOnboarding: true,
      ...privado,
    },
  };
}

export const NIVEIS: readonly Nivel[] = [1, 2, 3];
