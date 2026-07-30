import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { Icon } from "@/components/ui/Icon";
import { listarAcervo } from "@/features/documentos/actions";

export const metadata = { title: "Acervo de documentos · labdatadev gamehub" };

/**
 * O acervo — fecha a promessa de `CapituloCard.tsx` ("Documento liberado no
 * seu acervo"). Mostra TODO o catálogo, não só o disponível — ver o que
 * falta desbloquear é parte do incentivo de continuar jogando.
 */
export default async function AcervoPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const itens = await listarAcervo();
  if (!itens) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-pixel text-[10px] uppercase tracking-[3px] text-teal">
            labdatadev · gamehub
          </p>
          <h1 className="text-2xl font-extrabold text-white">Seu acervo</h1>
          <p className="text-xs text-muted">
            Documentos reais sobre o seu negócio, gerados a partir do que você
            já fez no jogo.
          </p>
        </div>
        <Link
          href="/hub"
          className="flex items-center gap-1.5 rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
        >
          <Icon name="grid" size={14} />
          Voltar ao hub
        </Link>
      </div>

      <ul className="space-y-2">
        {itens.map(({ catalogo, disponivel }) => {
          const conteudo = (
            <>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${
                  disponivel ? "bg-teal text-ink" : "bg-card2 text-muted"
                }`}
              >
                <Icon name={disponivel ? catalogo.icon : "lock"} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <b className={disponivel ? "text-white" : "text-muted"}>
                  {catalogo.titulo}
                </b>
                <p className="text-xs text-muted">{catalogo.descricaoCurta}</p>
              </div>
              {disponivel ? (
                <Icon name="chevron" size={16} className="-rotate-90 shrink-0 text-muted" />
              ) : null}
            </>
          );

          return (
            <li key={catalogo.id}>
              {disponivel ? (
                <Link
                  href={`/documentos/${catalogo.id}`}
                  className="flex items-center gap-3 rounded-md bg-card p-4 transition-colors hover:bg-card2"
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-md bg-card p-4 opacity-60">
                  {conteudo}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
