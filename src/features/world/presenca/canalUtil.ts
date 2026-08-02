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
 * Config mínima pra abrir o canal de presença no browser — URL + anon key.
 *
 * ⚠️ Histórico (achado em auditoria BMAD/NFR, 2026-08-01): esta config
 * ANTES vinha de `process.env.NEXT_PUBLIC_SUPABASE_URL` lido DENTRO do
 * código do browser. `NEXT_PUBLIC_*` só é substituído pelo Next.js em
 * BUILD TIME (não runtime) — numa imagem Docker construída uma vez e
 * configurada depois via `.env`/`docker-compose`, isso significa que o
 * bundle do navegador congelava o valor PLACEHOLDER do `Dockerfile` pra
 * sempre, e pior: o guard `if (!supabaseConfigurado())` virava uma
 * constante `true` em build time e era eliminado por dead-code
 * elimination — a tela de visita LANÇAVA exceção em vez de degradar.
 *
 * Correção: a config agora é lida no SERVIDOR (que sempre vê o `.env`
 * real em runtime, sem essa armadilha) e passada como prop até aqui —
 * `app/world/visitar/[tenantId]/page.tsx` → `VisitaScreen` →
 * `entrarNaSala(..., config)`. Nenhum código de browser lê
 * `process.env.NEXT_PUBLIC_*` diretamente neste módulo nunca mais.
 */
export interface PresencaConfig {
  url: string;
  anonKey: string;
}

/** `true` só se as duas partes da config existem e não são strings vazias —
 *  puro, sem tocar em `process.env`, testável sem mock. */
export function configValida(
  config: PresencaConfig | null | undefined,
): config is PresencaConfig {
  return Boolean(config?.url) && Boolean(config?.anonKey);
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
