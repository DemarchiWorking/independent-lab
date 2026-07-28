import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes Supabase (server-side).
 *
 * - `admin`: usa a SERVICE ROLE KEY. Ignora RLS — só para o fluxo de cadastro,
 *   que precisa criar tenant/membro antes de existir sessão. NUNCA exponha
 *   essa chave ao browser nem a use para ler dados a pedido do usuário.
 * - `anon`: respeita RLS. Use para tudo que é feito em nome do usuário.
 */

function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente. Veja .env.example e docs/ARQUITETURA-MULTITENANT.md`,
    );
  }
  return valor;
}

let adminCache: SupabaseClient | null = null;
let anonCache: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (adminCache) return adminCache;
  adminCache = createClient(
    exigir("NEXT_PUBLIC_SUPABASE_URL"),
    exigir("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return adminCache;
}

export function supabaseAnon(): SupabaseClient {
  if (anonCache) return anonCache;
  anonCache = createClient(
    exigir("NEXT_PUBLIC_SUPABASE_URL"),
    exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return anonCache;
}
