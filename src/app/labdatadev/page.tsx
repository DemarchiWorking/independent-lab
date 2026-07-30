import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { SolicitarServico } from "@/features/labdatadev/SolicitarServico";
import { MinhasSolicitacoes } from "@/features/labdatadev/MinhasSolicitacoes";
import { listarMinhasSolicitacoes } from "@/features/labdatadev/actions";

export const metadata = { title: "labdatadev · seus projetos" };

/**
 * Área do cliente (labdatadev) — pensada para abrir do COMPUTADOR/CELULAR do
 * escritório no World. É onde o dono do negócio pede site/app/automação e
 * acompanha o andamento. Fonte de verdade das mutações: Server Actions.
 */
export default async function LabdatadevClientePage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const negocio = await getRepository().lerNegocio(sessao.tenantId);
  if (!negocio) redirect("/cadastro");

  const solicitacoes = await listarMinhasSolicitacoes();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · estúdio
      </p>
      <h1 className="mb-1 text-xl font-extrabold text-ink">
        Construa com a gente
      </h1>
      <p className="mb-6 text-sm text-muted">
        Site, aplicativo, automação — peça aqui e acompanhe cada etapa. Já
        entregamos algo? Peça uma <b className="text-ink">nova funcionalidade</b>{" "}
        pelo mesmo lugar.
      </p>

      <div className="flex flex-col gap-6">
        <SolicitarServico />
        <MinhasSolicitacoes solicitacoes={solicitacoes} />
      </div>

      <div className="mt-8">
        <Link href="/hub" className="text-xs font-bold text-teal hover:underline">
          ← Voltar ao hub
        </Link>
      </div>
    </main>
  );
}
