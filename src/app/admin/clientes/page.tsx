import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth/sessao";
import { listarClientesAdminAction } from "@/features/admin-clientes/actions";
import { ClientesTable } from "@/features/admin-clientes/ClientesTable";

export const metadata = { title: "Admin · Clientes" };

/** Painel cross-tenant do fundador — todas as empresas cadastradas, com
 *  onboarding/score e status de assinatura. Mesma guarda neutra de
 *  `/admin/eventos`: quem não tem `role === "admin"` vê "página não
 *  encontrada", nunca um erro técnico que revele que a rota existe. */
export default async function AdminClientesPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">
        Página não encontrada.
      </main>
    );
  }

  const clientes = await listarClientesAdminAction();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub · admin
      </p>
      <h1 className="mb-1 text-xl font-extrabold text-white">Clientes</h1>
      <p className="mb-6 text-sm text-muted">
        Todas as empresas cadastradas, com onboarding e status de assinatura —
        {" "}{clientes.length} no total.
      </p>

      <ClientesTable clientes={clientes} />
    </main>
  );
}
