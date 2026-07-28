import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRepository } from "@/lib/db";
import { idDoSlug, slugDoNegocio } from "@/features/growth/slug";
import { ContatoForm } from "@/features/growth/ContatoForm";
import { SEGMENTOS } from "@/features/mapa/segmentos";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { Icon } from "@/components/ui/Icon";
import type { Negocio } from "@/lib/db/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Whitelist explícita de campos públicos (GH-GROW-01) — nunca "serializar o
 * negócio inteiro". Se um campo novo for adicionado a `Negocio` no futuro,
 * ele NÃO aparece aqui automaticamente — é preciso decidir explicitamente
 * se é público, mesmo princípio do card.
 */
async function buscarNegocioPublico(slug: string): Promise<Negocio | null> {
  const id = idDoSlug(slug);
  if (!id) return null;
  const negocio = await getRepository().lerNegocio(id);
  if (!negocio || !negocio.perfilPublico) return null;
  // nome mudou desde que o slug foi gerado (ex.: link antigo) → 404, não
  // um perfil errado
  if (slugDoNegocio(negocio) !== slug) return null;
  return negocio;
}

function formatarSlug(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await buscarNegocioPublico(slug);
  if (!negocio) return { title: "Negócio não encontrado · labdatadev gamehub" };

  const local = `${formatarSlug(negocio.endereco.bairroSlug)}, ${formatarSlug(negocio.endereco.cidadeSlug)}`;
  const titulo = `${negocio.nome} — ${local}`;
  const descricao = `${negocio.nome} (${SEGMENTOS[negocio.segmento].label}) no ecossistema labdatadev — nível ${negocio.nivel}, ${DEGRAUS[negocio.degrauAtual].nome}.`;

  return {
    title: `${titulo} · labdatadev gamehub`,
    description: descricao,
    openGraph: { title: titulo, description: descricao, type: "profile" },
  };
}

export default async function PerfilPublicoPage({ params }: PageProps) {
  const { slug } = await params;
  const negocio = await buscarNegocioPublico(slug);
  if (!negocio) notFound();

  const ofertas = await getRepository().listarOfertas(negocio.id);
  const segmento = SEGMENTOS[negocio.segmento];
  const local = `${formatarSlug(negocio.endereco.bairroSlug)}, ${formatarSlug(negocio.endereco.cidadeSlug)}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-white">
      <p className="mb-4 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>

      <div className="mb-5 flex items-center gap-3">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-md text-ink ${segmento.cor}`}>
          <Icon name={segmento.icon} size={26} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">{negocio.nome}</h1>
          <p className="text-sm text-muted">
            {segmento.label} · {local}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-card2/60 p-3">
          <span className="text-xs text-muted">Nível</span>
          <p className="font-extrabold text-teal">Nv {negocio.nivel}</p>
        </div>
        <div className="rounded-md bg-card2/60 p-3">
          <span className="text-xs text-muted">Degrau</span>
          <p className="font-extrabold text-teal">{DEGRAUS[negocio.degrauAtual].nome}</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-extrabold text-teal">Serviços oferecidos</h2>
        {ofertas.length > 0 ? (
          <ul className="space-y-2">
            {ofertas.map((o) => (
              <li key={o.id} className="rounded-md bg-card2/60 p-3 text-sm">
                <b>{o.titulo}</b>
                {o.preco ? <span className="float-right text-teal">{o.preco}</span> : null}
                {o.descricao ? <p className="mt-1 text-xs text-muted">{o.descricao}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Nenhum serviço publicado ainda.</p>
        )}
      </section>

      <ContatoForm tenantId={negocio.id} />

      <p className="mt-8 text-center text-[11px] text-muted">
        Faça parte do ecossistema —{" "}
        <a href="/cadastro" className="font-bold text-teal underline">
          labdatadev
        </a>
      </p>
    </main>
  );
}
