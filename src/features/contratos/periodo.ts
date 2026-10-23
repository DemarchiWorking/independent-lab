import type { Cadencia } from "./tipos";

/**
 * Períodos dos contratos — puros, sem `Date.now()`.
 *
 * A semana é a ISO 8601 (segunda a domingo) contada no horário de Brasília
 * (UTC−3, sem horário de verão desde 2019). Sem esse deslocamento, quem fecha
 * a semana no domingo à noite veria o contrato "renovar" 21h, por causa do UTC.
 */

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;
const OFFSET_BRASILIA_MS = -3 * MS_HORA;
const DIAS_CICLO = 90;

function emBrasilia(iso: string): Date | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + OFFSET_BRASILIA_MS);
}

/** Semana ISO ("2026-W43") de um instante, no relógio de Brasília. */
export function semanaIso(iso: string): string {
  const d = emBrasilia(iso);
  if (!d) return "invalida";
  // algoritmo ISO 8601: a semana pertence ao ano da quinta-feira dela
  const alvo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const diaSemana = alvo.getUTCDay() || 7; // domingo = 7
  alvo.setUTCDate(alvo.getUTCDate() + 4 - diaSemana);
  const inicioAno = Date.UTC(alvo.getUTCFullYear(), 0, 1);
  const semana = Math.ceil(((alvo.getTime() - inicioAno) / MS_DIA + 1) / 7);
  return `${alvo.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

/** Dias até a próxima segunda-feira (1–7), no relógio de Brasília. */
export function diasParaProximaSemana(iso: string): number {
  const d = emBrasilia(iso);
  if (!d) return 7;
  const diaSemana = d.getUTCDay() || 7; // segunda = 1 … domingo = 7
  return 8 - diaSemana;
}

/** Número do ciclo de 90 dias (1, 2, 3…) em que o negócio está. */
export function cicloDoNegocio(criadoEm: string, agoraIso: string): number {
  const de = Date.parse(criadoEm);
  const ate = Date.parse(agoraIso);
  if (Number.isNaN(de) || Number.isNaN(ate)) return 1;
  const dias = Math.max(0, Math.floor((ate - de) / MS_DIA));
  return Math.floor(dias / DIAS_CICLO) + 1;
}

/** Chave do período em que `instanteIso` cai, para esta cadência. */
export function periodoDe(
  cadencia: Cadencia,
  criadoEm: string,
  instanteIso: string,
): string {
  switch (cadencia) {
    case "unico":
      return "unico";
    case "semanal":
      return semanaIso(instanteIso);
    case "ciclo90":
      return `ciclo-${cicloDoNegocio(criadoEm, instanteIso)}`;
  }
}

/** Dias até o contrato renovar; `undefined` quando nunca renova. */
export function diasParaRenovar(
  cadencia: Cadencia,
  criadoEm: string,
  agoraIso: string,
): number | undefined {
  if (cadencia === "semanal") return diasParaProximaSemana(agoraIso);
  if (cadencia === "ciclo90") {
    const de = Date.parse(criadoEm);
    const ate = Date.parse(agoraIso);
    if (Number.isNaN(de) || Number.isNaN(ate)) return undefined;
    const dias = Math.max(0, Math.floor((ate - de) / MS_DIA));
    return DIAS_CICLO - (dias % DIAS_CICLO);
  }
  return undefined;
}
