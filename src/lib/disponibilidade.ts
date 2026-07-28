import type { Alocacao, Disponibilidade } from "@/lib/db/types";

/**
 * Decisão pura de disponibilidade de recurso (GH-EQP-01) — mesmo padrão de
 * `lib/atributos.ts`: mora em `lib/` (não em `features/`) porque os dois
 * adapters de `lib/db/` (`file-adapter.ts`/`supabase-adapter.ts`) precisam
 * dela para enriquecer `FuncionarioContratado` — e `lib/` nunca importa de
 * `features/` (ver docs/ARQUITETURA-MULTITENANT.md).
 *
 * `agoraIso` é sempre explícito (nunca `new Date()` escondido aqui dentro):
 * é o que permite simular "daqui a 3 dias" num teste de 1ms, e o que impede
 * o cliente de forjar o tempo — quem chama sempre passa o relógio do
 * SERVIDOR (mesmo princípio de `features/historia/relogio.ts`).
 */

/** Alocações ainda em vigor — `expiraEm` estritamente no futuro. Uma
 *  alocação que expira EXATAMENTE agora já conta como livre (janela fechada,
 *  não aberta). */
export function alocacoesAtivasEm(
  todas: readonly Alocacao[],
  agoraIso: string,
): Alocacao[] {
  return todas.filter((a) => a.expiraEm > agoraIso);
}

/** Disponibilidade de UM funcionário, a partir da lista JÁ FILTRADA de
 *  alocações ativas (ver `alocacoesAtivasEm`). */
export function disponibilidadeDe(
  ativas: readonly Alocacao[],
  funcionarioId: string,
): Disponibilidade {
  const alocacao = ativas.find((a) => a.funcionarioId === funcionarioId);
  return alocacao
    ? { estado: "alocado", jobId: alocacao.jobId, expiraEm: alocacao.expiraEm }
    : { estado: "livre" };
}
