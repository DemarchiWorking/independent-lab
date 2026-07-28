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
}
