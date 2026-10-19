import { SEGREDO_MIN } from "@/lib/auth/segredo-min";

/**
 * Validação das variáveis de ambiente. Roda no boot do servidor
 * (`instrumentation.ts`): o app recusa subir configurado errado, em vez de
 * subir, passar no health check e devolver erro 500 no primeiro login.
 */

export interface ResultadoAmbiente {
  erros: string[];
  avisos: string[];
}

export function validarAmbiente(env: NodeJS.ProcessEnv = process.env): ResultadoAmbiente {
  const erros: string[] = [];
  const avisos: string[] = [];
  const producao = env.NODE_ENV === "production";

  if (!env.GAMEHUB_SECRET || env.GAMEHUB_SECRET.length < SEGREDO_MIN) {
    erros.push(`GAMEHUB_SECRET ausente ou com menos de ${SEGREDO_MIN} caracteres (openssl rand -hex 32).`);
  }

  const driver = env.GAMEHUB_DB ?? "file";
  if (driver !== "file" && driver !== "supabase") {
    erros.push(`GAMEHUB_DB inválido: "${driver}". Use "file" ou "supabase".`);
  }
  if (driver === "supabase") {
    for (const nome of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
      if (!env[nome]) erros.push(`${nome} é obrigatória com GAMEHUB_DB=supabase.`);
    }
  }

  if (producao) {
    const site = env.NEXT_PUBLIC_SITE_URL ?? "";
    if (!site.startsWith("https://")) {
      erros.push("NEXT_PUBLIC_SITE_URL deve ser a URL pública com https:// (sitemap e links absolutos).");
    }
    if (driver === "file" && !env.GAMEHUB_DATA_DIR) {
      avisos.push("GAMEHUB_DATA_DIR não definido: os dados ficam dentro da release e se perdem no próximo deploy.");
    }
    if (!env.GAMEHUB_ADMIN_EMAILS) {
      avisos.push("GAMEHUB_ADMIN_EMAILS vazio: ninguém acessa /admin/eventos.");
    }
  }

  return { erros, avisos };
}
