import { criarClienteAnonimo, supabaseAdmin } from "@/lib/supabase/client";
import { EmailJaExisteError, type AuthProvider, type Identidade } from "./provider";

/**
 * `code === "email_exists"` é o código estável do GoTrue para duplicidade
 * (introduzido nas versões recentes). Verificamos também a mensagem como
 * salvaguarda contra instalações self-hosted rodando uma versão do GoTrue
 * anterior a esse código existir — o self-hosted deste projeto (GH-OPS bloco
 * 2) não tem a garantia de estar sempre na última tag.
 */
function ehEmailDuplicado(error: { code?: string; message: string }): boolean {
  if (error.code === "email_exists") return true;
  return /already.*(registered|exists)|already been registered/i.test(error.message);
}

/**
 * Autenticação via Supabase Auth. A senha nunca transita pela nossa camada de
 * dados: quem armazena e verifica é o próprio Supabase (bcrypt gerenciado),
 * com rate limiting, verificação de e-mail e reset já resolvidos.
 */
export class SupabaseAuthProvider implements AuthProvider {
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
    if (error) {
      if (ehEmailDuplicado(error)) throw new EmailJaExisteError(email);
      throw new Error(`Supabase createUser: ${error.message}`);
    }
    if (!data.user) throw new Error("Supabase createUser: sem usuário na resposta");
    return { usuarioId: data.user.id };
  }

  async autenticar(email: string, senha: string): Promise<Identidade | null> {
    // Cliente novo por chamada — nunca compartilhado. Ver GH-OPS M-9 e o
    // comentário em `criarClienteAnonimo()`.
    const { data, error } = await criarClienteAnonimo().auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error || !data.user) return null;
    return { usuarioId: data.user.id };
  }
}
