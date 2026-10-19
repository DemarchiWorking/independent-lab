import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do BROWSER (anon key, respeita RLS). Hoje só a presença
 * ao vivo usa (`features/world/presenca/canal.ts`).
 *
 * As variáveis aparecem escritas por inteiro de propósito: o Next.js só
 * embute `NEXT_PUBLIC_*` no bundle do browser quando o nome está literal no
 * código. A versão anterior lia `process.env[nome]`, que no browser é
 * sempre `undefined`, e a tela de visita quebrava assim que o Supabase era
 * configurado.
 */
let cache: SupabaseClient | null = null;

export function supabaseNavegador(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.");
  }
  cache ??= createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cache;
}
