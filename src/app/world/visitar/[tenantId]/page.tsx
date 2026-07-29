import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { VisitaScreen } from "@/features/world/VisitaScreen";

export const metadata = { title: "Visitando · World · labdatadev gamehub" };

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 * Visita somente-leitura à sede de outro tenant — ver
 * docs/world/VISITAR-VIZINHO.md. Aberta por padrão no MVP: qualquer
 * jogador logado visita qualquer vizinho, sem opt-in/publicação.
 */
export default async function VisitarSedePage({ params }: PageProps) {
  const { tenantId } = await params;
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  // visitar a si mesmo não faz sentido — manda pra própria sede
  if (sessao.tenantId === tenantId) redirect("/world");

  const repo = getRepository();
  const [negocioVisitado, sede, mobilia, funcionarios, meuNegocio] = await Promise.all([
    repo.lerNegocio(tenantId),
    repo.lerSede(tenantId),
    repo.listarMobiliaColocada(tenantId),
    repo.listarFuncionarios(tenantId),
    // quem SOU eu — a presença ao vivo (GH-MULTI-03) precisa se anunciar,
    // e o dado dessa identidade morria aqui antes desta linha
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
            labdatadev · world
          </p>
          <h1 className="text-lg font-extrabold text-white">
            Sede de {negocioVisitado.nome}
          </h1>
        </div>
        <Link
          href="/hub"
          className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
        >
          <Icon name="grid" size={14} />
          Voltar ao hub
        </Link>
      </div>

      {/* 🔒 O nome que vai para o canal de presença é o do NEGÓCIO, nunca
          `sessao.nome` (que é o nome da pessoa). O canal Realtime é público
          por padrão — ver a limitação registrada em
          `docs/architecture/BMAD-MULTIPLAYER-VPS.md` — então só pode
          trafegar fachada que já é pública no mapa e em `/n/[slug]`. */}
      <VisitaScreen
        negocioVisitado={negocioVisitado}
        sede={sede}
        mobilia={mobilia}
        funcionarios={funcionarios.map((f) => f.cargoId)}
        visitante={{
          tenantId: sessao.tenantId,
          nome: meuNegocio?.nome ?? "Visitante",
        }}
      />
    </main>
  );
}
