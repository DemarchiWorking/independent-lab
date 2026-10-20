import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth/sessao";
import { souAdminIA } from "@/lib/admin";
import { lerEstadoDoAgendador } from "@/features/equipe-ia/ia/agendador";
import { AdminIAForm } from "@/features/equipe-ia/ia/AdminIAForm";
import { lerConfig, MODELOS_PADRAO } from "@/features/equipe-ia/ia/config";
import { contarFila, lerBatimento, workerVivo } from "@/features/equipe-ia/ia/fila";
import { lerFalhasRecentes, lerLivro, resumoDoMes, type Acumulado } from "@/features/equipe-ia/ia/uso";
import { nomeDoModelo } from "@/features/equipe-ia/ia/aplicar";

export const metadata = { title: "Admin · IA", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const usd = (v: number) => `US$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const mil = (v: number) => v.toLocaleString("pt-BR");
const quando = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "nunca");

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-panel p-3 text-xs text-ink">
      <h2 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-soft">{titulo}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="text-soft">{rotulo}</span>
      <b className="text-right">{valor}</b>
    </p>
  );
}

function ResumoDeUso({ a }: { a: Acumulado }) {
  return (
    <>
      <Linha rotulo="Pedidos concluídos" valor={mil(a.jobs)} />
      <Linha rotulo="Falhas" valor={mil(a.falhas)} />
      <Linha rotulo="Tokens (entrada / saída)" valor={`${mil(a.entrada)} / ${mil(a.saida)}`} />
      <Linha rotulo="Custo estimado" valor={usd(a.custoUsd)} />
    </>
  );
}

/**
 * Tela do admin da IA. Só `souAdminIA` (por padrão admin@admin.com) vê algo;
 * quem não for recebe a mesma mensagem neutra das outras telas de admin, sem
 * revelar que a rota existe. As ações no servidor repetem a checagem.
 */
export default async function AdminIAPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/entrar");
  if (!souAdminIA(sessao.email)) {
    return <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">Página não encontrada.</main>;
  }

  const agora = new Date();
  const dia = agora.toISOString().slice(0, 10);
  const [config, batimento, fila, falhas, livroHoje, mes, agendador] = await Promise.all([
    lerConfig(),
    lerBatimento(),
    contarFila(),
    lerFalhasRecentes(),
    lerLivro(dia),
    resumoDoMes(dia.slice(0, 7)),
    lerEstadoDoAgendador(),
  ]);
  const vivo = workerVivo(batimento, agora);
  const modelos = Object.entries(MODELOS_PADRAO).map(([id, p]) => ({
    id,
    nome: nomeDoModelo(id),
    precos: `US$ ${p.entradaUsdPorMTok}/${p.saidaUsdPorMTok} por 1M tokens`,
  }));
  const pausadoAte = batimento?.pausadoAte && new Date(batimento.pausadoAte) > agora ? batimento.pausadoAte : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">labdatadev · gamehub · admin</p>
      <h1 className="mb-1 text-xl font-extrabold text-white">Inteligência artificial</h1>
      <p className="mb-4 text-xs text-white/70">
        Fila, uso e configuração dos Funcionários de IA. Valores em dólar são estimativas com a tabela de preços do código; a fatura da Anthropic é a fonte oficial.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao titulo="Worker">
          <Linha rotulo="Estado" valor={vivo ? (pausadoAte ? "Pausado" : batimento?.ocupadoCom ? "Processando" : "Ativo, ocioso") : "Parado"} />
          <Linha rotulo="Último batimento" valor={quando(batimento?.batimentoEm ?? null)} />
          <Linha rotulo="Modos disponíveis" valor={batimento?.modosDisponiveis.length ? batimento.modosDisponiveis.join(", ") : "nenhum"} />
          {pausadoAte ? <Linha rotulo={`Pausa (${batimento?.motivoPausa ?? "?"})`} valor={`até ${quando(pausadoAte)}`} /> : null}
          {!vivo ? <p className="rounded-sm bg-orange/20 px-1.5 py-1 text-[11px] font-bold">Sem batimento há mais de 90 s. Confira o container ia-worker (deploy/README.md).</p> : null}
        </Cartao>

        <Cartao titulo="Fila">
          <Linha rotulo="Esperando" valor={fila.pendente} />
          <Linha rotulo="Processando" valor={fila.processando} />
          <Linha rotulo="Prontos para coletar" valor={fila.concluido} />
          <Linha rotulo="Falhas para coletar" valor={fila.falhou} />
        </Cartao>

        <Cartao titulo="Agendador">
          <Linha rotulo="Última coleta" valor={quando(agendador.ultimaColetaEm)} />
          <Linha rotulo="Última varredura" valor={quando(agendador.ultimaVarreduraEm)} />
          <Linha
            rotulo="Resultado"
            valor={agendador.ultimaVarredura ? (agendador.ultimaVarredura.pulou ? `pulou (${agendador.ultimaVarredura.pulou})` : `${agendador.ultimaVarredura.enfileirados} de ${agendador.ultimaVarredura.candidatos}`) : "—"}
          />
        </Cartao>

        <Cartao titulo={`Uso hoje (${dia})`}>
          <ResumoDeUso a={livroHoje.total} />
          <Linha rotulo="Teto do dia" valor={usd(config.limites.gastoMaxUsdDia)} />
        </Cartao>

        <Cartao titulo={`Uso no mês (${dia.slice(0, 7)})`}>
          <ResumoDeUso a={mes} />
        </Cartao>

        <Cartao titulo="Hoje no worker">
          <Linha rotulo="Pedidos" valor={batimento?.hoje.jobs ?? 0} />
          <Linha rotulo="Falhas" valor={batimento?.hoje.falhas ?? 0} />
          <Linha rotulo="Custo estimado" valor={usd(batimento?.hoje.custoUsd ?? 0)} />
        </Cartao>
      </div>

      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white">Configuração</h2>
      <AdminIAForm config={config} modelos={modelos} modosDisponiveis={batimento?.modosDisponiveis ?? []} />

      <h2 className="mb-2 mt-8 text-sm font-extrabold uppercase tracking-wide text-white">Falhas recentes</h2>
      {falhas.length === 0 ? (
        <p className="text-xs text-white/70">Nenhuma falha registrada.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {falhas.slice(0, 15).map((f, i) => (
            <li key={`${f.em}-${i}`} className="rounded-sm bg-panel px-3 py-1.5 text-[11px] text-ink">
              <b>{f.motivo}</b> · {f.tipo} · {f.modo} · {f.modelo} · {quando(f.em)}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 mt-8 text-sm font-extrabold uppercase tracking-wide text-white">Histórico de mudanças</h2>
      {config.historico.length === 0 ? (
        <p className="text-xs text-white/70">Nenhuma mudança registrada.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {config.historico
            .slice()
            .reverse()
            .map((h) => (
              <li key={h.em} className="rounded-sm bg-panel px-3 py-1.5 text-[11px] text-ink">
                <b>{quando(h.em)}</b> · {h.por}: {h.mudancas.join("; ")}
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
