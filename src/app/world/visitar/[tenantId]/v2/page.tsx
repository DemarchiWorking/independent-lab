import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { VisitaScreenV2 } from "@/features/world/VisitaScreenV2";
import { configValida, type PresencaConfig } from "@/features/world/presenca/canalUtil";

export const metadata = { title: "Visitando (preview visual) · World · labdatadev gamehub" };

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 * Rota irmã de `/world/visitar/[tenantId]` — mesma relação que `/world/v2`
 * tem com `/world` (ver `docs/architecture/ARQUITETURA-VISUAL-ITENS-SEDE.md`).
 * Renderiza `VisitaScreenV2` (silhueta por item) em vez de `VisitaScreen`;
 * toda a leitura de dados e a regra de somente-leitura são idênticas à rota
 * original, que continua intocada.
 */
export default async function VisitarSedeV2Page({ params }: PageProps) {
  const { tenantId } = await params;
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  if (sessao.tenantId === tenantId) redirect("/world/v2");

  const configBruta: PresencaConfig = {
    url: process.env.GAMEHUB_REALTIME_PUBLIC_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
  const presencaConfig = configValida(configBruta) ? configBruta : null;

  const repo = getRepository();
  const [negocioVisitado, sede, mobilia, funcionarios, meuNegocio] = await Promise.all([
    repo.lerNegocio(tenantId),
    repo.lerSede(tenantId),
    repo.listarMobiliaColocada(tenantId),
    repo.listarFuncionarios(tenantId),
    repo.lerNegocio(sessao.tenantId),
  ]);

  if (!negocioVisitado) {
    return (
      <main className="mx-auto w-full max-w-2xl px-3 py-16 text-center">
        <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">
          labdatadev · world
        </p>
        <h1 className="mt-2 text-lg font-extrabold text-white">
          Vizinho não encontrado
        </h1>
        <Link
          href="/hub"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
        >
          <Icon name="grid" size={14} />
          Voltar ao hub
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">
            labdatadev · world · preview visual
          </p>
          <h1 className="text-lg font-extrabold text-white">
            Sede de {negocioVisitado.nome}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/world/visitar/${tenantId}`}
            className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
          >
            <Icon name="grid" size={14} />
            Ver versão atual
          </Link>
          <Link
            href="/hub"
            className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
          >
            <Icon name="grid" size={14} />
            Voltar ao hub
          </Link>
        </div>
      </div>

      <VisitaScreenV2
        negocioVisitado={negocioVisitado}
        sede={sede}
        mobilia={mobilia}
        funcionarios={funcionarios.map((f) => f.cargoId)}
        visitante={{
          tenantId: sessao.tenantId,
          nome: meuNegocio?.nome ?? "Visitante",
        }}
        presencaConfig={presencaConfig}
      />
    </main>
  );
}
