import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes Supabase (server-side).
 *
 * - `supabaseAdmin()`: usa a SERVICE ROLE KEY, ignora RLS, é **singleton**.
 *   PostgREST é stateless por trás (HTTP puro), então cachear é seguro e
 *   evita recriar o cliente a cada chamada. NUNCA exponha essa chave ao
 *   browser nem a use para ler dados a pedido do usuário.
 * - `criarClienteAnonimo()`: usa a ANON KEY, respeita RLS, é uma **fábrica**,
 *   nunca cacheada. `GoTrueClient` (o módulo de auth do supabase-js) MUTA
 *   estado interno a cada `signInWithPassword`/`createUser` e serializa
 *   chamadas atrás de um lock próprio — compartilhar uma instância entre
 *   requisições concorrentes vira gargalo e mistura estado de sessão entre
 *   usuários diferentes bem no pico de tráfego (GH-OPS M-9). Um cliente por
 *   chamada custa uma alocação de objeto JS; NÃO abre conexão nova (HTTP é
 *   por request de qualquer forma).
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

export function supabaseUrl(): string {
  return exigir("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

let adminCache: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (adminCache) return adminCache;
  adminCache = createClient(supabaseUrl(), exigir("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminCache;
}

/** Sempre uma instância NOVA — ver o porquê no comentário do topo do arquivo. */
export function criarClienteAnonimo(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
