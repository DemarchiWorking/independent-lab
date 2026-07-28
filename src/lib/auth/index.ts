import type { AuthProvider } from "./provider";
import { LocalAuthProvider } from "./local-provider";
import { SupabaseAuthProvider } from "./supabase-provider";

/**
 * Factory de autenticação, alinhada ao driver de dados (`GAMEHUB_DB`):
 *   file     → LocalAuthProvider  (scrypt em data/)
 *   supabase → SupabaseAuthProvider (Supabase Auth)
 */
let instancia: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (instancia) return instancia;

  const driver = process.env.GAMEHUB_DB ?? "file";
  instancia =
    driver === "supabase" ? new SupabaseAuthProvider() : new LocalAuthProvider();
  return instancia;
}

export type { AuthProvider, Identidade } from "./provider";
