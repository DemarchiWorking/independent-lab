import type { GameRepository } from "./repository";
import { FileRepository } from "./file-adapter";
import { SupabaseRepository } from "./supabase-adapter";

/**
 * Factory do repositório. Trocar de persistência = trocar `GAMEHUB_DB`.
 *   GAMEHUB_DB=file      → JSON em data/ (padrão, protótipo)
 *   GAMEHUB_DB=supabase  → Postgres + RLS (supabase/migrations)
 * O AuthProvider (lib/auth) segue o mesmo driver.
 */
let instancia: GameRepository | null = null;

export function getRepository(): GameRepository {
  if (instancia) return instancia;

  const driver = process.env.GAMEHUB_DB ?? "file";
  switch (driver) {
    case "file":
      instancia = new FileRepository();
      return instancia;
    case "supabase":
      instancia = new SupabaseRepository();
      return instancia;
    default:
      throw new Error(
        `GAMEHUB_DB="${driver}" inválido. Use "file" ou "supabase".`,
      );
  }
}

export type { GameRepository, NovoNegocio } from "./repository";
