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

/**
 * E-mail duplicado no cadastro — o único erro de `registrar` que vira
 * mensagem amigável na tela. Qualquer outro erro de `registrar` é genérico.
 *
 * Substituiu `emailExiste()` (removido do contrato — GH-OPS M-2). A versão
 * antiga fazia uma checagem prévia via `auth.admin.listUsers()`, que no
 * Supabase pagina em 50 por padrão: passado esse número de contas, um e-mail
 * que JÁ EXISTIA voltava `false`, o cadastro seguia e só falhava depois de já
 * ter consumido lote no mapa (ver `features/auth/actions.ts`). Deixar o
 * próprio `registrar` ser autoritativo sobre unicidade elimina o scan O(n) de
 * usuários **e** a janela de corrida entre checar e criar — não são dois
 * requests, é um só.
 */
export class EmailJaExisteError extends Error {
  constructor(email: string) {
    super(`E-mail já cadastrado: ${email}`);
    this.name = "EmailJaExisteError";
  }
}

export interface AuthProvider {
  /**
   * Cria a credencial. Lança `EmailJaExisteError` se o e-mail já existir —
   * é a fonte de verdade sobre unicidade, não uma checagem em duas etapas.
   */
  registrar(nome: string, email: string, senha: string): Promise<Identidade>;
  /** `null` quando e-mail ou senha não conferem (nunca diferencie os dois). */
  autenticar(email: string, senha: string): Promise<Identidade | null>;
}
