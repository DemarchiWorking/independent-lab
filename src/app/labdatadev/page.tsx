import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { SolicitarServico } from "@/features/labdatadev/SolicitarServico";
import { MinhasSolicitacoes } from "@/features/labdatadev/MinhasSolicitacoes";
import { listarMinhasSolicitacoes } from "@/features/labdatadev/actions";
import { DEGRAU_MINIMO_LABDATADEV } from "@/features/labdatadev/tipos";

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

  // Gate por degrau — espelha o menu e a Server Action. Acesso direto por URL
  // abaixo do degrau mínimo vê a tela de "bloqueado", não o formulário.
  if (negocio.degrauAtual < DEGRAU_MINIMO_LABDATADEV) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
          labdatadev · estúdio
        </p>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md bg-panel text-2xl">
          🔒
        </div>
        <h1 className="mb-2 text-xl font-extrabold text-white">
          O computador do escritório chega no degrau {DEGRAU_MINIMO_LABDATADEV}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Depois do diagnóstico, você desbloqueia o estúdio para pedir site,
          app e automações. Evolua seu negócio e volte aqui.
        </p>
        <Link href="/hub" className="text-xs font-bold text-teal hover:underline">
          ← Voltar ao hub
        </Link>
      </main>
    );
  }

  const solicitacoes = await listarMinhasSolicitacoes();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · estúdio
      </p>
      <h1 className="mb-1 text-xl font-extrabold text-white">
        Construa com a gente
      </h1>
      <p className="mb-6 text-sm text-muted">
        Site, aplicativo, automação — peça aqui e acompanhe cada etapa. Já
        entregamos algo? Peça uma <b className="text-white">nova funcionalidade</b>{" "}
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
