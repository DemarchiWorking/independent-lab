import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes Supabase — SERVIDOR, EXCLUSIVAMENTE. `process.env` aqui é
 * SEMPRE seguro de ler (dinâmico ou não) porque este módulo só é
 * importado por Server Actions/Server Components — o servidor vê o
 * `.env` real em runtime, nunca um valor congelado em build time.
 *
 * - `admin`: SERVICE ROLE KEY, ignora RLS — só para o fluxo de cadastro
 *   (criar tenant/membro antes de existir sessão) e para
 *   `SupabaseAuthProvider.emailExiste`/`listUsers`. NUNCA exponha essa
 *   chave ao browser.
 * - `anon`: usado SÓ por `SupabaseAuthProvider.autenticar` (login via
 *   `signInWithPassword`, chamado pela Server Action `entrar()`) — nunca
 *   pelo browser.
 *
 * ⚠️ **Este arquivo NUNCA pode ser importado por um componente
 * `"use client"`.** Achado de auditoria BMAD/NFR (2026-08-01): a presença
 * ao vivo (`GH-MULTI-02`) chamava uma função equivalente a `supabaseAnon()`
 * direto do browser, lendo `NEXT_PUBLIC_SUPABASE_URL` por chave dinâmica —
 * o Next.js só inlina acesso ESTÁTICO em build time, então no bundle do
 * browser a leitura sempre voltava vazia e a função sempre lançava
 * (bloqueava toda a presença multiplayer no deploy Docker). Corrigido:
 * o cliente anon do BROWSER agora é criado só em
 * `features/world/presenca/canal.ts`, com `url`/`anonKey` explícitos
 * vindos de prop (um Server Component os lê e repassa) — nunca importando
 * este arquivo nem lendo env var direto de código client-side.
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

/** Server-only — ver aviso no cabeçalho do arquivo. */
export function supabaseAnon(): SupabaseClient {
  if (anonCache) return anonCache;
  anonCache = createClient(
    exigir("NEXT_PUBLIC_SUPABASE_URL"),
    exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return anonCache;
}
