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
    if (!env.GAMEHUB_IA_ADMIN_EMAIL) {
      avisos.push("GAMEHUB_IA_ADMIN_EMAIL não definido: o admin da IA é admin@admin.com. O cadastro público recusa esse e-mail; para criar a conta, libere por um instante com GAMEHUB_LIBERAR_CADASTRO_ADMIN=1.");
    }
    if (env.GAMEHUB_LIBERAR_CADASTRO_ADMIN === "1") {
      avisos.push("GAMEHUB_LIBERAR_CADASTRO_ADMIN=1: qualquer pessoa pode cadastrar e-mail de admin. Remova depois de criar a sua conta e reinicie.");
    }
  }

  // A credencial da Anthropic fica SÓ no worker de IA. O app recebe texto de qualquer
  // usuário; se ele tivesse a chave, uma falha nele vazaria a chave junto.
  for (const nome of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN"]) {
    if (env[nome]) {
      const mensagem = `${nome} está definida no ambiente do app. Credencial da Anthropic fica só no worker de IA (ia-worker), nunca no app.`;
      if (producao) erros.push(mensagem);
      else avisos.push(mensagem);
    }
  }

  return { erros, avisos };
}
