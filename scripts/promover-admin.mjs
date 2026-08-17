#!/usr/bin/env node
/**
 * Promove uma conta existente (Supabase Auth) a admin cross-tenant,
 * gravando `app_metadata.role = "admin"` — a origem de verdade lida por
 * `lib/auth/supabase-provider.ts` (`roleDoUsuario`) ao logar. Uso único
 * por conta nova; não é migration, não roda em CI/deploy.
 *
 * Uso (a conta já precisa existir — cadastre-se normalmente no app antes):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/promover-admin.mjs alguem@exemplo.com
 *
 * Numa VPS com `.env` já preenchido (ver deploy/supabase/.env):
 *   set -a; source .env; set +a; node scripts/promover-admin.mjs alguem@exemplo.com
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/promover-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente. Veja o cabeçalho deste script.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const normalizado = email.trim().toLowerCase();

// Não há `getUserByEmail` na Admin API — busca paginada em `listUsers`,
// mesmo caminho já usado em `SupabaseAuthProvider.emailExiste`.
const { data, error } = await admin.auth.admin.listUsers();
if (error) {
  console.error(`listUsers: ${error.message}`);
  process.exit(1);
}

const usuario = data.users.find((u) => u.email?.toLowerCase() === normalizado);
if (!usuario) {
  console.error(`Nenhuma conta com o e-mail ${normalizado}. Cadastre-se no app primeiro.`);
  process.exit(1);
}

const { error: erroUpdate } = await admin.auth.admin.updateUserById(usuario.id, {
  app_metadata: { ...usuario.app_metadata, role: "admin" },
});
if (erroUpdate) {
  console.error(`updateUserById: ${erroUpdate.message}`);
  process.exit(1);
}

console.log(`OK — ${normalizado} (${usuario.id}) agora tem role "admin".`);
console.log("Efeito só no PRÓXIMO login (o cookie de sessão atual não é revalidado).");
