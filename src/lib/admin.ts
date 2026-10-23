/**
 * Bootstrap de admin para o modo `GAMEHUB_DB=file` (sem Supabase Auth, sem
 * `app_metadata`). A autorização real de produção é `sessao.role ===
 * "admin"` (ver `lib/auth/sessao.ts`), preenchida a partir de
 * `auth.users.app_metadata.role` — checagem feita direto no cookie
 * assinado, sem round-trip.
 *
 * Este módulo só serve para `local-provider.ts` decidir, NO CADASTRO em
 * modo arquivo, se carimba `role: "admin"` na credencial — permite dev
 * local ficar em paridade com produção sem precisar de uma Admin API. Não
 * é mais usado como checagem de autorização em nenhuma tela/action (era o
 * `souAdmin(email)` antigo, removido depois que o painel `/admin/clientes`
 * virou "a primeira ação administrativa que precisa de RLS/dado
 * cross-tenant" — o gatilho que este arquivo já previa).
 */
export function emailAdminBootstrapLocal(email: string): boolean {
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return false;
  const lista = (process.env.GAMEHUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(normalizado) || normalizado.includes("demarchi");
}
