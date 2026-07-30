/**
 * Presença ao vivo — implementação real (GH-OPS Bloco 5).
 *
 * Antes deste bloco este arquivo era `declare`-only (contrato sem código —
 * ver histórico em `docs/world/VISITAR-VIZINHO.md` §6). Supabase Realtime
 * Presence, não Broadcast nem Postgres Changes: presença é exatamente "quem
 * está aqui agora", sincronizado entre clientes do mesmo canal sem modelar
 * isso como linha de tabela — ver `docs/world/EVOLUCAO-MOTOR-2026.md` §3.5.
 *
 * CONTRATO DE DEGRADAÇÃO (não é detalhe, é requisito de produto): a sala e o
 * Diagnóstico têm que continuar funcionando mesmo se isto falhar — token
 * expirado, Realtime fora do ar, `GAMEHUB_DB=file` sem Supabase nenhum. Por
 * isso `assinarPresenca` NUNCA lança — qualquer falha devolve `null`, e quem
 * chama trata `null` como "sem presença ao vivo agora", nunca como erro.
 *
 * Browser-only de propósito: importa `@supabase/supabase-js` por `import()`
 * dinâmico (mesmo padrão do Pixi em `WorldCanvas.tsx` — mantém a lib fora do
 * bundle inicial de quem nunca visita a sala de outra pessoa) e lê
 * `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, os únicos dois
 * segredos do Supabase que podem legitimamente chegar ao cliente.
 */

export interface VisitantePresente {
  tenantId: string;
  nome: string;
  entrouEm: string;
}

/** Fecha o canal e para de anunciar presença. Sempre seguro de chamar mais
 *  de uma vez (ex.: StrictMode do React 19 desmontando/remontando em dev). */
export type CancelarPresenca = () => void;

async function obterTokenRealtime(): Promise<string | null> {
  try {
    const resposta = await fetch("/api/realtime-token", { cache: "no-store" });
    if (!resposta.ok) return null; // 401 sem sessão, 501 sem Realtime configurado
    const corpo = (await resposta.json()) as { token?: unknown };
    return typeof corpo.token === "string" ? corpo.token : null;
  } catch {
    return null; // rede fora do ar — degrada, não propaga
  }
}

/**
 * Entra no canal de presença da sede de `salaTenantId` e mantém `aoMudar`
 * chamado com a lista de QUEM MAIS está lá (nunca inclui `eu` mesmo —
 * ninguém precisa ver a si próprio na própria lista de visitantes).
 *
 * Devolve a função de cancelamento, ou `null` se não deu pra conectar por
 * QUALQUER motivo — ver o contrato de degradação no comentário do arquivo.
 * Nunca lança.
 */
export async function assinarPresenca(
  salaTenantId: string,
  eu: VisitantePresente & { tenantId: string },
  aoMudar: (visitantes: VisitantePresente[]) => void,
): Promise<CancelarPresenca | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null; // GAMEHUB_DB=file — nem tenta

    const token = await obterTokenRealtime();
    if (!token) return null;

    const { createClient } = await import("@supabase/supabase-js");
    const cliente = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cliente.realtime.setAuth(token);

    const canal = cliente.channel(`presenca:sede:${salaTenantId}`, {
      config: { presence: { key: eu.tenantId } },
    });

    let cancelada = false;

    canal.on("presence", { event: "sync" }, () => {
      if (cancelada) return;
      const estado = canal.presenceState();
      const visitantes = Object.values(estado)
        .flat()
        .map((p) => p as unknown as VisitantePresente)
        .filter((v) => v.tenantId !== eu.tenantId);
      aoMudar(visitantes);
    });

    canal.subscribe((status) => {
      if (cancelada) return;
      if (status === "SUBSCRIBED") {
        // fire-and-forget: se o track falhar, o `sync` só não vai incluir a
        // gente — não há o que fazer de diferente daqui
        void canal.track(eu);
      }
    });

    return () => {
      if (cancelada) return;
      cancelada = true;
      void canal.untrack().catch(() => {});
      void cliente.removeChannel(canal).catch(() => {});
    };
  } catch {
    return null;
  }
}
