/**
 * Primitivas puras do canal de presença (GH-MULTI-02) — separadas de
 * `canal.ts` porque não tocam em rede nenhuma, então são testáveis sem
 * mock de Supabase. Mesmo princípio já usado em `features/world/engine/`
 * (geometria pura) vs. `render/` (casca Pixi).
 */

/** O que trafega no canal de presença. Whitelist deliberada: só fachada
 *  pública (mesma disciplina de `GH-GROW-01`/`GH-GROW-03`) — nunca
 *  atributos, XP, moeda ou respostas de onboarding. */
export interface VisitantePresente {
  tenantId: string;
  nome: string;
  entrouEm: string;
}

/** Formato que `RealtimeChannel.presenceState<T>()` devolve: um mapa de
 *  chave de presença (gerada pelo Supabase, opaca para nós) → payloads. */
export type EstadoPresenca = Record<string, VisitantePresente[]>;

/** Um canal por SALA (a sede de um tenant), nunca um canal global "todo
 *  mundo online" — evita expor padrão de uso cruzando quem visita quem.
 *  Ver `docs/architecture/BMAD-MULTIPLAYER-VPS.md` §2. */
export function nomeCanal(salaTenantId: string): string {
  return `sede:${salaTenantId}`;
}

/**
 * `NEXT_PUBLIC_*` é inlined pelo Next.js em build time. Checar antes de
 * chamar `supabaseAnon()` é o que mantém `GAMEHUB_DB=file` (dev local,
 * sem Supabase) funcionando: sem isso, `supabaseAnon()` lançaria por
 * variável de ambiente ausente e derrubaria a tela de visita inteira por
 * causa de um recurso opcional.
 */
export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Achata o estado de presença numa lista estável de visitantes.
 *
 * Deduplica por `tenantId` porque o mesmo negócio pode estar presente com
 * mais de uma chave (duas abas abertas, reconexão) — para a UI é UMA
 * pessoa, não duas. Ordena por `tenantId` para a renderização ser
 * determinística: sem isso, a ordem viria do objeto do Supabase e os
 * avatares poderiam trocar de lugar a cada `sync`, piscando na tela.
 */
export function presentesDe(estado: EstadoPresenca): VisitantePresente[] {
  const porTenant = new Map<string, VisitantePresente>();
  for (const presencas of Object.values(estado)) {
    for (const p of presencas) {
      if (!porTenant.has(p.tenantId)) porTenant.set(p.tenantId, p);
    }
  }
  return [...porTenant.values()].sort((a, b) => a.tenantId.localeCompare(b.tenantId));
}
