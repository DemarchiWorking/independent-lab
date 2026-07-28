import { supabaseAdmin, supabaseAnon } from "@/lib/supabase/client";
import type { AuthProvider, Identidade } from "./provider";

/**
 * Autenticação via Supabase Auth. A senha nunca transita pela nossa camada de
 * dados: quem armazena e verifica é o próprio Supabase (bcrypt gerenciado),
 * com rate limiting, verificação de e-mail e reset já resolvidos.
 */
export class SupabaseAuthProvider implements AuthProvider {
  /**
   * Só há resposta confiável para e-mail existente através da API admin.
   * Mantemos a checagem apenas para dar mensagem melhor no cadastro; o login
   * continua com mensagem genérica.
   */
  async emailExiste(email: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin().auth.admin.listUsers();
    if (error) throw new Error(`Supabase listUsers: ${error.message}`);
    return data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async registrar(
    nome: string,
    email: string,
    senha: string,
  ): Promise<Identidade> {
    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password: senha,
      email_confirm: false,
      user_metadata: { nome },
    });
    if (error || !data.user) {
      throw new Error(`Supabase createUser: ${error?.message ?? "sem usuário"}`);
    }
    return { usuarioId: data.user.id };
  }

  async autenticar(email: string, senha: string): Promise<Identidade | null> {
    const { data, error } = await supabaseAnon().auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error || !data.user) return null;
    return { usuarioId: data.user.id };
  }
}
