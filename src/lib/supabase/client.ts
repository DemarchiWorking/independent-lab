import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes Supabase do SERVIDOR. Nunca importe este módulo em código de
 * browser: o cliente do browser fica em `navegador.ts`.
 *
 * - `supabaseAdmin()`: usa a SERVICE ROLE KEY e ignora RLS. Só para o
 *   repositório e para o cadastro. NUNCA exponha essa chave ao browser.
 * - `supabaseLogin()`: cliente NOVO a cada chamada, só para
 *   `signInWithPassword`. Antes era um cliente anon compartilhado, que
 *   guardava em memória a sessão do último usuário que fez login no
 *   servidor; qualquer uso posterior dele agiria como essa pessoa.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/supabase/client.ts é só do servidor. No browser, use lib/supabase/navegador.ts.");
}

function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente. Veja .env.example e docs/ARQUITETURA-MULTITENANT.md`,
    );
  }
  return valor;
}

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false } } as const;

let adminCache: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  adminCache ??= createClient(
    exigir("NEXT_PUBLIC_SUPABASE_URL"),
    exigir("SUPABASE_SERVICE_ROLE_KEY"),
    SEM_SESSAO,
  );
  return adminCache;
}

export function supabaseLogin(): SupabaseClient {
  return createClient(exigir("NEXT_PUBLIC_SUPABASE_URL"), exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY"), SEM_SESSAO);
}
