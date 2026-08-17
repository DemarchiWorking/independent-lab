import type { Assinatura, ClienteAdmin } from "@/lib/db/types";

const STATUS_LABEL: Record<Assinatura["status"], string> = {
  ativa: "Ativa",
  pendente: "Pendente",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
};

function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Assinatura "atual": prioriza ativa/inadimplente sobre pendente/cancelada;
 *  empate desfeito pela mais recente. `null` quando o tenant nunca assinou. */
function assinaturaAtual(assinaturas: Assinatura[]): Assinatura | null {
  if (assinaturas.length === 0) return null;
  const prioridade: Record<Assinatura["status"], number> = {
    ativa: 0,
    inadimplente: 1,
    pendente: 2,
    cancelada: 3,
  };
  return [...assinaturas].sort((a, b) => {
    const diff = prioridade[a.status] - prioridade[b.status];
    if (diff !== 0) return diff;
    return b.criadaEm.localeCompare(a.criadaEm);
  })[0];
}

export function ClientesTable({ clientes }: { clientes: ClienteAdmin[] }) {
  if (clientes.length === 0) {
    return <p className="text-xs text-muted">Nenhuma empresa cadastrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md bg-panel">
      <table className="w-full text-left text-xs text-ink">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-muted">
            <th className="px-3 py-2">Empresa</th>
            <th className="px-3 py-2">Segmento</th>
            <th className="px-3 py-2">Local</th>
            <th className="px-3 py-2">Degrau</th>
            <th className="px-3 py-2">Nível</th>
            <th className="px-3 py-2">Score fit</th>
            <th className="px-3 py-2">Assinatura</th>
            <th className="px-3 py-2">Cadastro</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => {
            const assinatura = assinaturaAtual(c.assinaturas);
            return (
              <tr key={c.id} className="border-b border-white/5 last:border-0">
                <td className="px-3 py-2 font-semibold text-white">{c.nome}</td>
                <td className="px-3 py-2 capitalize">{c.segmento}</td>
                <td className="px-3 py-2">
                  {c.bairroNome}, {c.cidadeNome}
                </td>
                <td className="px-3 py-2">
                  {c.degrauAtual}/{c.degrauAlvo}
                </td>
                <td className="px-3 py-2">{c.nivel}</td>
                <td className="px-3 py-2">
                  {c.onboarding ? `${c.onboarding.scoreFit}/100` : "—"}
                </td>
                <td className="px-3 py-2">
                  {assinatura
                    ? `${STATUS_LABEL[assinatura.status]} · ${formatarPreco(assinatura.precoCentavos)}/${assinatura.periodicidade === "mensal" ? "mês" : "ano"}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-muted">
                  {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
