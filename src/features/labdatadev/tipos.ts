/**
 * labdatadev — o "negócio dentro do jogo". O cliente (um negócio jogando)
 * solicita, pelo computador/celular do escritório, um serviço real ao
 * Laboratório Demarchi: site, app, automação ou uma nova funcionalidade numa
 * plataforma já entregue. O fundador gere tudo pelo painel `/admin/labdatadev`.
 *
 * Uniões ESTREITAS ficam aqui (feature), nunca em `lib/db/types.ts` — regra
 * de fronteira do AGENTS.md. `lib/` só conhece `SolicitacaoServico` com
 * `tipo`/`status` como `string`; a validação forte é aqui + no `check` da
 * migration `0027_solicitacoes_servico.sql`.
 */
import type { SolicitacaoServico } from "@/lib/db/types";

/**
 * Degrau mínimo para o "computador do escritório" liberar o estúdio labdatadev.
 * Degrau 2 = "Diagnóstico Técnico" (ver `features/onboarding/scoring.ts`
 * DEGRAUS): a narrativa é "depois do diagnóstico, você começa a construir".
 * Gate espelhado em 3 lugares — menu (UX), rota e Server Action (fonte de
 * verdade), conforme a regra do AGENTS.md.
 */
export const DEGRAU_MINIMO_LABDATADEV = 2;

/** XP concedido UMA vez, no primeiro pedido do cliente (anti-farm: só quando
 *  ainda não havia nenhuma solicitação). Reforça o eixo de presença digital. */
export const XP_PRIMEIRA_SOLICITACAO = 60;

/** Os 4 serviços que o Laboratório Demarchi entrega. */
export type TipoServico = "site" | "app" | "automacao" | "funcionalidade";

/** Ciclo de atendimento — do pedido à entrega. `recusada` é terminal
 *  alternativo (fora de escopo, sem fit, etc.). */
export type StatusSolicitacao =
  | "recebida"
  | "em_analise"
  | "em_producao"
  | "entregue"
  | "recusada";

export const TIPOS_SERVICO: readonly TipoServico[] = [
  "site",
  "app",
  "automacao",
  "funcionalidade",
] as const;

/** Ordem canônica do funil, usada para ordenar colunas do painel e validar
 *  avanço de status (só anda para frente, ou para `recusada`). */
export const FLUXO_STATUS: readonly StatusSolicitacao[] = [
  "recebida",
  "em_analise",
  "em_producao",
  "entregue",
] as const;

export function ehTipoServico(v: string): v is TipoServico {
  return (TIPOS_SERVICO as readonly string[]).includes(v);
}

export function ehStatus(v: string): v is StatusSolicitacao {
  return (
    (FLUXO_STATUS as readonly string[]).includes(v) || v === "recusada"
  );
}

/** `SolicitacaoServico` do domínio, mas com os campos já estreitados para a
 *  UI da feature (evita `string` solto nas telas). */
export interface SolicitacaoView extends SolicitacaoServico {
  tipo: TipoServico;
  status: StatusSolicitacao;
}
