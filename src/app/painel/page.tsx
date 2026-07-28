import { redirect } from "next/navigation";
import Link from "next/link";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { sair } from "@/features/auth/actions";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { Icon } from "@/components/ui/Icon";
import { AtributosBar } from "@/components/ui/AtributosBar";

export const metadata = { title: "Painel · labdatadev gamehub" };

export default async function PainelPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");

  const repo = getRepository();
  const [negocio, onboarding, vizinhos] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.lerOnboarding(sessao.tenantId),
    repo.listarVizinhos(sessao.tenantId),
  ]);

  if (!negocio) redirect("/cadastro");

  const atual = DEGRAUS[negocio.degrauAtual];
  const alvo = DEGRAUS[negocio.degrauAlvo];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-pixel text-[10px] uppercase tracking-[3px] text-teal">
            labdatadev · gamehub
          </p>
          <h1 className="text-2xl font-extrabold text-white">{negocio.nome}</h1>
          <p className="text-xs text-muted">
            {negocio.endereco.bairroSlug} · {negocio.endereco.cidadeSlug} ·
            quarteirão {negocio.endereco.quarteiraoId} · lote {negocio.endereco.lote}
          </p>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-md bg-card2 px-3 py-2 text-xs font-bold text-muted hover:text-white"
          >
            Sair
          </button>
        </form>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metrica rotulo="Nível" valor={String(negocio.nivel)} icon="star" />
        <Metrica
          rotulo="Moeda"
          valor={`🪙 ${negocio.moedaVirtual}`}
          icon="coin"
        />
        <Metrica
          rotulo="Fit comercial"
          valor={`${onboarding?.scoreFit ?? 0}/100`}
          icon="chart"
        />
      </div>

      {/* Escada de valor — o norte do cliente */}
      <section className="mb-4 rounded-md bg-card p-5">
        <h2 className="mb-1 text-base font-extrabold text-white">
          Sua escada de valor
        </h2>
        <p className="mb-4 text-xs text-muted">
          Você está no degrau {negocio.degrauAtual}. O próximo passo recomendado
          para o seu objetivo é o degrau {negocio.degrauAlvo}.
        </p>

        <ol className="space-y-2">
          {Object.entries(DEGRAUS).map(([n, d]) => {
            const num = Number(n);
            const ehAtual = num === negocio.degrauAtual;
            const ehAlvo = num === negocio.degrauAlvo;
            return (
              <li
                key={n}
                className={[
                  "flex items-center gap-3 rounded-md border-2 px-3 py-2.5",
                  ehAtual
                    ? "border-teal bg-teal/10"
                    : ehAlvo
                      ? "border-orange bg-orange/10"
                      : "border-transparent bg-card2",
                ].join(" ")}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-night font-pixel text-[10px] text-teal">
                  {n}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm text-white">{d.nome}</b>
                  <span className="text-xs text-muted">{d.preco}</span>
                </div>
                {ehAtual ? <Selo texto="Você está aqui" cor="teal" /> : null}
                {ehAlvo && !ehAtual ? (
                  <Selo texto="Próximo passo" cor="orange" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Economia de atributos — os 5 eixos que marketplace, árvore, mobília e
          Funcionários de IA elevam (ver docs/analise-prints/telas/economia-de-atributos.md) */}
      <section className="mb-4 rounded-md bg-card p-5">
        <h2 className="mb-1 text-base font-extrabold text-white">
          Economia de atributos
        </h2>
        <p className="mb-4 text-xs text-muted">
          Cada ação real no seu negócio eleva um destes eixos. Móveis da sede e
          Funcionários de IA também contribuem.
        </p>
        <AtributosBar atributos={negocio.atributos} tom="dark" />
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-md bg-card p-5">
          <h2 className="mb-2 text-base font-extrabold text-white">
            Recomendado para você
          </h2>
          {onboarding && onboarding.servicosRecomendados.length > 0 ? (
            <ul className="space-y-1.5">
              {onboarding.servicosRecomendados.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-muted">
                  <span className="text-orange">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Sem recomendações ainda.</p>
          )}
        </section>

        <section className="rounded-md bg-card p-5">
          <h2 className="mb-2 text-base font-extrabold text-white">
            Vizinhos do seu quarteirão
          </h2>
          {vizinhos.length > 0 ? (
            <ul className="space-y-1.5">
              {vizinhos.map((v) => (
                <li key={v.id} className="flex items-center gap-2 text-sm text-muted">
                  <span className="text-teal">◈</span>
                  {v.nome}
                  <span className="text-xs opacity-60">({v.segmento})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Você é o primeiro do quarteirão. Convide um vizinho e comece uma
              parceria.
            </p>
          )}
        </section>
      </div>

      <div className="mt-5">
        <Link
          href="/hub"
          className="inline-flex items-center gap-2 rounded-md bg-orange px-4 py-3 text-sm font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
        >
          <Icon name="grid" size={18} />
          Ir para o hub
        </Link>
      </div>
    </main>
  );
}

function Metrica({
  rotulo,
  valor,
  icon,
}: {
  rotulo: string;
  valor: string;
  icon: "star" | "coin" | "chart";
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-card p-4">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-card2 text-teal">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <small className="block font-pixel text-[8px] uppercase text-muted">
          {rotulo}
        </small>
        <b className="text-base text-white">{valor}</b>
      </div>
    </div>
  );
}

function Selo({ texto, cor }: { texto: string; cor: "teal" | "orange" }) {
  return (
    <span
      className={[
        "shrink-0 rounded-sm px-2 py-0.5 font-pixel text-[7px] uppercase",
        cor === "teal" ? "bg-teal/20 text-teal" : "bg-orange/20 text-orange",
      ].join(" ")}
    >
      {texto}
    </span>
  );
}
