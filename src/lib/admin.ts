/**
 * Quem tem acesso a telas administrativas (ex.: criar eventos globais).
 * Duas regras, qualquer uma basta:
 *
 * 1. Allowlist explícita via `GAMEHUB_ADMIN_EMAILS` (env, separada por
 *    vírgula) — a forma "certa" de adicionar um sócio sem mexer em código.
 * 2. Atalho pessoal do fundador: e-mail contendo "demarchi". Existe só para
 *    não depender de configurar a env var em toda instância nova (local,
 *    preview, VPS) — é uma comparação de SUBSTRING, então
 *    "algo.demarchi@qualquer.com" também passa. Aceitável agora porque (a)
 *    ninguém de fora se cadastra com e-mail sob controle do fundador, e
 *    (b) isto é só a UX de "esconder o menu" — a garantia real de que
 *    escrita em `eventos_globais` só acontece via RPC com a service_role
 *    key (nunca policy de insert direta, ver `0013_eventos_globais.sql`).
 *
 * MVP deliberado: sem tabela de `roles`, sem checagem no banco. Isso é
 * dívida técnica com plano de saída documentado — ver "Evolução para
 * roles reais" no fim deste arquivo antes de adicionar um 3º admin ou
 * expor qualquer ação administrativa mais sensível que "criar evento".
 */
function listaAdmins(): string[] {
  return (process.env.GAMEHUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function souAdmin(email: string): boolean {
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return false;
  return listaAdmins().includes(normalizado) || normalizado.includes("demarchi");
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
