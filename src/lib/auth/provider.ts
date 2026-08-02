/**
 * Contrato de autenticação — separado do repositório de domínio.
 *
 * Motivo arquitetural: o modelo local guarda hash de senha; o Supabase Auth
 * não expõe hash algum. Misturar os dois no GameRepository vazaria o detalhe
 * de implementação. Aqui a identidade é só `usuarioId` (string), que no local
 * é um id hex e no Supabase é o uuid de `auth.users`.
 */
export interface Identidade {
  usuarioId: string;
}

export interface AuthProvider {
  emailExiste(email: string): Promise<boolean>;
  /** Cria a credencial. Lança se o e-mail já existir. */
  registrar(nome: string, email: string, senha: string): Promise<Identidade>;
  /** `null` quando e-mail ou senha não conferem (nunca diferencie os dois). */
  autenticar(email: string, senha: string): Promise<Identidade | null>;
  /**
   * Compensação de cadastro que falhou no meio (GH-SEC-04): desfaz uma
   * credencial recém-criada quando o passo seguinte (`vincularMembro`)
   * falha, evitando uma conta autenticável sem negócio vinculado — hoje
   * irrecuperável pelo usuário (sem `GH-SEC-03`, fluxo de reset). Nunca
   * para remover uma conta em uso.
   */
  removerConta(usuarioId: string): Promise<void>;

  /**
   * GH-SEC-03 — recuperação de senha, simplificada de propósito: sempre 1
   * e-mail, sempre 1 código de 6 dígitos (nunca link mágico, nunca fluxo de
   * múltiplas etapas). Nunca lança e nunca revela se o e-mail existe — a
   * ausência silenciosa é a defesa contra enumeração de contas (mesmo
   * princípio de `autenticar`/`emailExiste`).
   */
  solicitarRecuperacaoSenha(email: string): Promise<void>;
  /**
   * Valida o código e, se correto e não expirado, troca a senha. `false`
   * para código errado/expirado/e-mail sem conta — nunca lança, quem chama
   * decide a mensagem.
   */
  confirmarRecuperacaoSenha(
    email: string,
    codigo: string,
    novaSenha: string,
  ): Promise<boolean>;
}
