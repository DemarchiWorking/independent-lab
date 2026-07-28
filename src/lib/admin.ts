/**
 * Allowlist de e-mails com acesso a telas administrativas (ex.: criar
 * eventos globais). MVP: variável de ambiente, sem tabela de roles — a
 * garantia real é que só código server-side com a service_role key chama as
 * RPCs de escrita; esta checagem é a UX amigável de "esconder o menu de
 * quem não é admin", não o único portão. Reavaliar para uma tabela de roles
 * se o número de admins crescer além do fundador e mais um ou dois sócios.
 */
function listaAdmins(): string[] {
  return (process.env.GAMEHUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function souAdmin(email: string): boolean {
  return listaAdmins().includes(email.trim().toLowerCase());
}
