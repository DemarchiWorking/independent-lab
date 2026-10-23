"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATALOGO_SERVICOS, CATALOGO_STATUS } from "./catalogo";
import { StatusBadge } from "./StatusBadge";
import { ordenarPorRecentes, proximoStatus, resumoAdmin } from "./motor";
import type { SolicitacaoView } from "./tipos";
import { mudarStatusSolicitacao } from "./actions";

/**
 * Painel de gestão do fundador (labdatadev) — os pedidos de TODOS os clientes,
 * com indicadores e o fluxo de atendimento (avançar / recusar). Gated na rota
 * e nas Server Actions (`sessao.role === "admin"`), nunca só escondido aqui.
 */
export function PainelAdmin({ inicial }: { inicial: SolicitacaoView[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ativoId, setAtivoId] = useState<string | null>(null);

  const lista = useMemo(() => ordenarPorRecentes(inicial), [inicial]);
  const resumo = useMemo(() => resumoAdmin(inicial), [inicial]);

  function mudar(id: string, status: string) {
    setErro(null);
    setAtivoId(id);
    iniciar(async () => {
      const r = await mudarStatusSolicitacao(id, status);
      if (!r.ok) setErro(r.erro ?? "Não foi possível atualizar.");
      setAtivoId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs — a leitura de relance para CTO/investidor */}
      <div className="grid grid-cols-3 gap-2">
        <Kpi rotulo="Pedidos" valor={resumo.total} />
        <Kpi rotulo="Em atendimento" valor={resumo.abertas} destaque="orange" />
        <Kpi rotulo="Entregues" valor={resumo.entregues} destaque="green" />
      </div>

      {/* distribuição por tipo */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(CATALOGO_SERVICOS) as Array<keyof typeof CATALOGO_SERVICOS>).map((t) => (
          <div key={t} className="rounded-md bg-panel px-3 py-2 text-center">
            <p className="text-lg" aria-hidden>{CATALOGO_SERVICOS[t].icone}</p>
            <p className="text-sm font-extrabold text-ink">{resumo.porTipo[t]}</p>
            <p className="text-[10px] text-muted">{CATALOGO_SERVICOS[t].nome}</p>
          </div>
        ))}
      </div>

      {erro ? (
        <p className="rounded-sm bg-coral/15 px-2 py-1.5 text-[11px] font-bold text-coral-dark">{erro}</p>
      ) : null}

      {/* fila de pedidos */}
      <div>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink">
          Fila de pedidos ({lista.length})
        </h2>
        {lista.length === 0 ? (
          <p className="rounded-md bg-panel p-4 text-xs text-muted">
            Nenhuma solicitação ainda. Elas aparecem aqui assim que um cliente
            pedir um serviço pelo computador do escritório dele.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lista.map((s) => {
              const info = CATALOGO_SERVICOS[s.tipo];
              const st = CATALOGO_STATUS[s.status];
              const proximo = proximoStatus(s.status);
              const emAndamento = pendente && ativoId === s.id;
              return (
                <li key={s.id} className="rounded-md bg-panel p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>{info.icone}</span>
                      <div>
                        <p className="text-sm font-bold text-ink">{s.titulo}</p>
                        <p className="text-[11px] text-muted">
                          {info.nome} · negócio #{s.tenantId}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <p className="mt-2 text-xs text-ink/80">{s.descricao}</p>

                  {s.status !== "entregue" && s.status !== "recusada" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {proximo ? (
                        <button
                          type="button"
                          disabled={emAndamento}
                          onClick={() => mudar(s.id, proximo)}
                          className="rounded-md bg-teal px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                        >
                          {emAndamento ? "…" : `Avançar → ${CATALOGO_STATUS[proximo].nome}`}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={emAndamento}
                        onClick={() => mudar(s.id, "recusada")}
                        className="rounded-md bg-[#e6eaf1] px-3 py-1.5 text-[11px] font-bold text-[#33415c] disabled:opacity-50"
                      >
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted">{st.significado}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: "orange" | "green";
}) {
  const cor =
    destaque === "orange" ? "text-orange-dark" : destaque === "green" ? "text-green" : "text-ink";
  return (
    <div className="rounded-md bg-panel px-3 py-3 text-center">
      <p className={`text-2xl font-extrabold ${cor}`}>{valor}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{rotulo}</p>
    </div>
  );
}
