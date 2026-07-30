import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { Icon } from "@/components/ui/Icon";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import {
  DOCUMENTOS_CATALOGO,
  documentoDoCatalogo,
} from "@/features/documentos/catalogo";
import {
  obterDiagnostico,
  obterDocumentoNarrativo,
} from "@/features/documentos/actions";
import { DOCUMENTO_DIAGNOSTICO, type DocumentoId } from "@/features/documentos/tipos";
import { BotaoImprimir } from "@/features/documentos/BotaoImprimir";

interface PageProps {
  params: Promise<{ docId: string }>;
}

function ehDocumentoId(id: string): id is DocumentoId {
  return DOCUMENTOS_CATALOGO.some((d) => d.id === id);
}

export default async function DocumentoPage({ params }: PageProps) {
  const { docId } = await params;
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  if (!ehDocumentoId(docId)) {
    return <NaoDisponivel titulo="Documento não existe" />;
  }

  if (docId === DOCUMENTO_DIAGNOSTICO) {
    const view = await obterDiagnostico();
    if (!view) return <NaoDisponivel titulo="Não foi possível gerar o diagnóstico" />;
    return <PaginaDiagnostico {...view} />;
  }

  const view = await obterDocumentoNarrativo(docId);
  if (!view) {
    return (
      <NaoDisponivel
        titulo="Ainda não disponível"
        descricao="Este documento é liberado por uma escolha específica na história do
          seu negócio. Continue jogando — ele aparece aqui assim que você
          tomar essa decisão."
      />
    );
  }
  return <PaginaNarrativa {...view} />;
}

function Moldura({
  children,
  docxHref,
}: {
  children: React.ReactNode;
  /** presente só para o Diagnóstico — os narrativos não têm .docx (ver Bloco 4) */
  docxHref?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/documentos"
          className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-white"
        >
          <Icon name="chevron" size={13} className="rotate-90" />
          Voltar ao acervo
        </Link>
        <div className="flex items-center gap-2">
          {docxHref ? (
            <a
              href={docxHref}
              className="flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-xs font-extrabold text-ink"
            >
              <Icon name="arrow" size={14} />
              Baixar .docx
            </a>
          ) : null}
          <BotaoImprimir />
        </div>
      </div>
      {children}
    </main>
  );
}

/** Estado "sem documento" — sempre com saída, nunca uma tela morta. */
function NaoDisponivel({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      <p className="font-pixel text-[10px] uppercase tracking-[3px] text-teal">
        labdatadev · documentos
      </p>
      <h1 className="mt-2 text-lg font-extrabold text-white">{titulo}</h1>
      {descricao ? <p className="mt-2 text-sm text-muted">{descricao}</p> : null}
      <Link
        href="/documentos"
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-card2 px-4 py-2.5 text-xs font-bold text-muted hover:text-white"
      >
        <Icon name="grid" size={14} />
        Ver acervo
      </Link>
    </main>
  );
}

/**
 * O Diagnóstico — layout de DOCUMENTO, não de tela de jogo: fundo claro,
 * texto escuro, mesmo no tema dark do resto do app. É pra parecer papel na
 * tela tanto quanto no `@media print` (via `print:`) — não é o mesmo
 * documento com uma casca diferente, é a MESMA marcação lendo bem nos dois.
 */
type DiagnosticoView = NonNullable<Awaited<ReturnType<typeof obterDiagnostico>>>;
type NarrativaView = NonNullable<Awaited<ReturnType<typeof obterDocumentoNarrativo>>>;

function PaginaDiagnostico({ diagnostico }: DiagnosticoView) {
  const d = diagnostico;
  const meta = documentoDoCatalogo(DOCUMENTO_DIAGNOSTICO);

  return (
    <Moldura docxHref={`/api/documentos/${DOCUMENTO_DIAGNOSTICO}/docx`}>
      <article className="rounded-md bg-white p-8 text-slate-900 shadow-hard print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-slate-200 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal">
            labdatadev · {meta.titulo}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{d.negocio.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {d.negocio.cidade} · gerado em{" "}
            {new Date(d.geradoEm).toLocaleDateString("pt-BR")} · metodologia v
            {d.versaoMetodologia}
          </p>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Os 5 eixos de maturidade digital
          </h2>
          <div className="space-y-2.5">
            {d.eixos.map((eixo) => (
              <div key={eixo.chave}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {eixo.label}
                    {eixo.chave === d.eixoMaisFraco.chave ? (
                      <span className="ml-1.5 rounded-pill bg-coral/15 px-1.5 py-0.5 text-[10px] font-bold text-coral-dark">
                        eixo mais fraco
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-slate-500">
                    {eixo.valor}/{eixo.teto}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-slate-100">
                  <div
                    className="h-full bg-teal"
                    style={{ width: `${eixo.percentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4">
            <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Escada de valor
            </h2>
            <p className="text-sm">
              Está em <b>{d.degrau.atualNome}</b> (degrau {d.degrau.atual}).
              <br />
              Próximo alvo: <b>{d.degrau.alvoNome}</b> (degrau {d.degrau.alvo}).
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Gargalo
            </h2>
            <p className="text-sm">
              {d.gargalo.declarado ? (
                <>
                  Declarado: <b>{d.gargalo.declarado}</b>.<br />
                </>
              ) : null}
              Observado: {d.gargalo.observado}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            3 próximos movimentos
          </h2>
          <ol className="space-y-3">
            {d.movimentos.map((m, i) => (
              <li key={m.eixo} className="rounded-md border-2 border-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-orange text-xs font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm">{m.titulo}</b>
                    <span className="text-xs text-slate-500">
                      eixo {ATRIBUTO_LABEL[m.eixo]}
                    </span>
                    <p className="mt-1 text-sm text-slate-700">{m.descricao}</p>
                    {m.cargo ? (
                      <p className="mt-1.5 text-xs font-bold">
                        R$ {m.cargo.precoMensal.toLocaleString("pt-BR")}/mês —{" "}
                        {m.cargo.disponivelAgora
                          ? "disponível agora"
                          : `disponível a partir do degrau ${m.cargo.degrauMinimo}`}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-8 border-t-2 border-slate-200 pt-4 text-[11px] text-slate-400">
          Metodologia labdatadev de Maturidade Digital, versão {d.versaoMetodologia}.
          Documento gerado automaticamente a partir do dado vivo do negócio —
          reproduzível a qualquer momento em /documentos/diagnostico-maturidade.
        </footer>
      </article>
    </Moldura>
  );
}

function PaginaNarrativa({ catalogo, documento }: NarrativaView) {
  return (
    <Moldura>
      <article className="rounded-md bg-white p-8 text-slate-900 shadow-hard print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-slate-200 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal">
            labdatadev · {catalogo.titulo}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{documento.capituloTitulo}</h1>
        </header>
        <section className="mb-5 rounded-md bg-slate-50 p-4">
          <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Situação
          </h2>
          <p className="text-sm text-slate-700">{documento.situacao}</p>
        </section>
        <section className="mb-5">
          <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Decisão tomada
          </h2>
          <p className="text-sm font-bold">{documento.escolhaFeita}</p>
        </section>
        <section>
          <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Resultado
          </h2>
          <p className="text-sm text-slate-700">{documento.desfecho}</p>
        </section>
      </article>
    </Moldura>
  );
}
