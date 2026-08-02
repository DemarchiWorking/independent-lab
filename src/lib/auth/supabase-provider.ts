import { supabaseAdmin, supabaseAnon } from "@/lib/supabase/client";
import { enviarEmail } from "@/lib/email/resend";
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
      // `email_confirm: true` (era `false`): este produto não tem NENHUM
      // fluxo de confirmação por e-mail (sem página `/confirmar`, sem SMTP
      // configurado no self-hosted) — com `false`, o GoTrue marca a conta
      // como não confirmada e `signInWithPassword` sempre recusa com
      // `email_not_confirmed`, mesmo com a senha certa. Bug ao vivo
      // 2026-08-02: TODO cadastro ficava permanentemente impossibilitado de
      // logar. `GOTRUE_MAILER_AUTOCONFIRM=true` do container não cobre
      // este caso — só afeta o fluxo público `/signup`, não
      // `admin.createUser`. Reproduzido e confirmado via API bruta do
      // GoTrue antes deste fix (Kong :8010) — ver commit.
      email_confirm: true,
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

  async removerConta(usuarioId: string): Promise<void> {
    const { error } = await supabaseAdmin().auth.admin.deleteUser(usuarioId);
    if (error) throw new Error(`Supabase deleteUser: ${error.message}`);
  }

  /**
   * `generateLink` (admin) gera o código sem que o GoTrue tente mandar
   * e-mail sozinho (este self-hosted não tem SMTP configurado) — o envio é
   * nosso, via Resend. `error` cobre tanto "e-mail não existe" quanto falha
   * de infra: os dois casos ficam silenciosos de propósito, nunca revelando
   * qual dos dois aconteceu.
   */
  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    const { data, error } = await supabaseAdmin().auth.admin.generateLink({
      type: "recovery",
      email,
    });
    const codigo = data?.properties?.email_otp;
    if (error || !codigo) return;

    await enviarEmail({
      to: email,
      subject: "Seu código de recuperação — labdatadev gamehub",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <h2>Recuperação de senha</h2>
          <p>Use o código abaixo para trocar sua senha no labdatadev gamehub:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:20px 0">${codigo}</p>
          <p style="color:#666;font-size:13px">Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.</p>
        </div>`,
    });
  }

  /**
   * `verifyOtp` (cliente anon) é quem de fato valida o código — expiração,
   * uso único e tentativas ficam por conta do GoTrue, nunca reimplementados
   * aqui. Só depois de validado é que a senha troca, via admin
   * `updateUserById` (não precisa da sessão que `verifyOtp` devolve, só da
   * confirmação de que o código bateu).
   */
  async confirmarRecuperacaoSenha(
    email: string,
    codigo: string,
    novaSenha: string,
  ): Promise<boolean> {
    const { data, error } = await supabaseAnon().auth.verifyOtp({
      email,
      token: codigo,
      type: "recovery",
    });
    if (error || !data.user) return false;

    const { error: erroSenha } = await supabaseAdmin().auth.admin.updateUserById(
      data.user.id,
      { password: novaSenha },
    );
    return !erroSenha;
  }
}
