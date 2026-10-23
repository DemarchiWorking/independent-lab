import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth/sessao";
import { PainelAdmin } from "@/features/labdatadev/PainelAdmin";
import { listarTodasSolicitacoesAdmin } from "@/features/labdatadev/actions";

export const metadata = { title: "Admin · labdatadev" };

/**
 * Painel admin do negócio labdatadev — o fundador gere as solicitações de
 * serviço de todos os clientes. Mesma guarda neutra de `/admin/eventos`:
 * quem não tem `role === "admin"` (ver `lib/auth/provider.ts`) vê "página
 * não encontrada", nunca um erro que revele que a rota existe.
 */
export default async function AdminLabdatadevPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">
        Página não encontrada.
      </main>
    );
  }

  const solicitacoes = await listarTodasSolicitacoesAdmin();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub · admin
      </p>
      <h1 className="mb-1 text-xl font-extrabold text-white">
        Gestão de plataformas
      </h1>
      <p className="mb-6 text-sm text-muted">
        Pedidos de site, app, automação e novas funcionalidades — de todos os
        clientes que jogam. Avance o status conforme o atendimento anda.
      </p>

      <PainelAdmin inicial={solicitacoes} />
    </main>
  );
}
