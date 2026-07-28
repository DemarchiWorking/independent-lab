import type { AtributoChave } from "@tokens";
import type { EventoKey } from "@/features/gamificacao/engine";

/** Recompensa concedida a um tenant quando ele bate a meta do evento. */
export interface RecompensaEventoGlobal {
  xp: number;
  moeda: number;
  atributo?: { chave: AtributoChave; ganho: number };
}

/**
 * Campanha com prazo definido, visível para todos os negócios ao mesmo
 * tempo (ex.: "Semana da Automação: 3 serviços de automação vendidos
 * ganham bônus"). `objetivo` reusa `EventoKey` — o mesmo catálogo de
 * `features/gamificacao/engine.ts` — em vez de inventar uma taxonomia
 * paralela: contar "quantos `servico_contratado` esse tenant gerou dentro
 * da janela" é exatamente o que o dispatcher `recompensar()` já sabe fazer.
 */
export interface EventoGlobal {
  id: string;
  titulo: string;
  descricao: string;
  objetivo: EventoKey;
  meta: number;
  inicioEm: string;
  fimEm: string;
  recompensa: RecompensaEventoGlobal;
  criadoPor: string;
  criadoEm: string;
}

export type NovoEventoGlobal = Omit<EventoGlobal, "id" | "criadoEm">;

/**
 * Progresso de UM tenant em UM evento. Nasce só quando a primeira ação
 * relevante acontece dentro da janela — relógio lazy, sem linha "zerada"
 * pré-criada para cada par tenant×evento (mesmo espírito de
 * `features/historia/relogio.ts`).
 */
export interface ProgressoEventoGlobal {
  eventoId: string;
  tenantId: string;
  contagem: number;
  completoEm: string | null;
}

export type StatusEvento = "agendado" | "ativo" | "encerrado";
