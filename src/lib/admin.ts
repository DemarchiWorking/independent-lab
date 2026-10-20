/**
 * Quem tem acesso a telas administrativas (ex.: criar eventos globais):
 * só e-mails da allowlist `GAMEHUB_ADMIN_EMAILS` (env, separada por
 * vírgula), comparados por igualdade exata.
 *
 * Existia um atalho "e-mail contendo demarchi". Como o cadastro não
 * verifica a posse do e-mail, qualquer pessoa virava admin se cadastrando
 * como `x@demarchi.qualquer`. Removido: sem a env configurada, ninguém é
 * admin.
 *
 * MVP deliberado: sem tabela de `roles`, sem checagem no banco. Isso é
 * dívida técnica com plano de saída documentado — ver "Evolução para
 * roles reais" no fim deste arquivo antes de adicionar um 3º admin ou
 * expor qualquer ação administrativa mais sensível que "criar evento".
 */
type Ambiente = Record<string, string | undefined>;

function listaAdmins(env: Ambiente = process.env): string[] {
  return (env.GAMEHUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function souAdmin(email: string): boolean {
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return false;
  return listaAdmins().includes(normalizado);
}

/** Admin da IA padrão: o único e-mail que muda a configuração da IA (tela `/admin/ia`). */
export const EMAIL_ADMIN_IA_PADRAO = "admin@admin.com";

/**
 * Quem pode mudar a configuração da IA (modo de autenticação, limites,
 * modelos): um único e-mail, `GAMEHUB_IA_ADMIN_EMAIL` ou, sem a variável,
 * `admin@admin.com`. É mais estreito que `souAdmin` de propósito: esta tela
 * decide quanto dinheiro o app pode gastar e por qual credencial.
 */
export function emailAdminIA(env: Ambiente = process.env): string {
  return (env.GAMEHUB_IA_ADMIN_EMAIL ?? EMAIL_ADMIN_IA_PADRAO).trim().toLowerCase();
}

export function souAdminIA(email: string, env: Ambiente = process.env): boolean {
  const normalizado = email.trim().toLowerCase();
  return normalizado !== "" && normalizado === emailAdminIA(env);
}

/**
 * E-mails que nenhum visitante pode criar pelo cadastro público: os admins.
 * O cadastro não verifica a posse do e-mail, então, sem isto, quem se
 * cadastrasse como `admin@admin.com` ANTES do dono ganharia o painel.
 */
export function emailReservado(email: string, env: Ambiente = process.env): boolean {
  const normalizado = email.trim().toLowerCase();
  return souAdminIA(normalizado, env) || listaAdmins(env).includes(normalizado);
}

/**
 * Em produção, o cadastro público recusa e-mail reservado, a menos que o
 * operador libere por um instante (`GAMEHUB_LIBERAR_CADASTRO_ADMIN=1`) para
 * criar a própria conta de admin. Em desenvolvimento nada é bloqueado.
 */
export function cadastroBloqueado(email: string, env: Ambiente = process.env): boolean {
  return env.NODE_ENV === "production" && env.GAMEHUB_LIBERAR_CADASTRO_ADMIN !== "1" && emailReservado(email, env);
}

/**
 * Evolução para roles reais (Supabase Auth) — não implementado, é o plano
 * para quando este MVP virar produto com múltiplos admins de verdade.
 *
 * Hoje `Sessao` (lib/auth/sessao.ts) só carrega `usuarioId`/`email`; o
 * projeto já usa Supabase Auth de verdade quando `GAMEHUB_DB=supabase`
 * (ver `lib/auth/supabase-provider.ts` — `usuarioId` É o uuid de
 * `auth.users`). O caminho recomendado pela própria Supabase para RBAC:
 *
 * 1. Guardar o papel em `auth.users.app_metadata` (não `user_metadata` —
 *    esse o usuário edita sozinho, `app_metadata` só via Admin API/
 *    service_role):
 *    `supabaseAdmin().auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } })`
 * 2. `SupabaseAuthProvider.autenticar()`/`registrar()` (ver
 *    `lib/auth/supabase-provider.ts`) passam a devolver `role` dentro de
 *    `Identidade`; `criarSessao()` grava `role` no cookie assinado.
 * 3. `souAdmin()` morre — vira `sessao.role === "admin"`, checado direto
 *    do cookie (sem round-trip a mais).
 * 4. Opcional, só quando existir RLS que precise saber o papel DENTRO do
 *    Postgres (ex.: permitir um admin inserir em `eventos_globais` sem
 *    passar por RPC): um `custom_access_token_hook` injeta
 *    `app_metadata.role` no JWT na emissão do token, e a policy checa
 *    `(select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` — é
 *    assim que a Supabase documenta RBAC oficialmente, evita consultar
 *    uma tabela de roles a cada policy.
 * 5. `local-provider.ts` (modo `GAMEHUB_DB=file`, sem Supabase) precisa do
 *    mesmo campo `role` no registro de `Usuario` para o dev local não
 *    divergir do comportamento de produção.
 *
 * Gatilho para fazer isso de verdade: mais de ~2-3 admins, ou a primeira
 * ação administrativa que precise de RLS (não só RPC gated na Server
 * Action).
 */
