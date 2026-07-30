import { CATALOGO_SERVICOS, CATALOGO_STATUS } from "./catalogo";
import { StatusBadge } from "./StatusBadge";
import type { SolicitacaoView } from "./tipos";
import { ordenarPorRecentes as ordenar } from "./motor";

/** Lista dos pedidos do próprio cliente, com status e o que cada status
 *  significa em linguagem de dono de negócio (não jargão técnico). */
export function MinhasSolicitacoes({ solicitacoes }: { solicitacoes: SolicitacaoView[] }) {
  const lista = ordenar(solicitacoes);

  return (
    <section>
      <h2 className="mb-2 text-sm font-extrabold text-ink">
        Meus pedidos ({lista.length})
      </h2>

      {lista.length === 0 ? (
        <p className="rounded-md bg-panel p-4 text-xs text-muted">
          Você ainda não pediu nada. Escolha um serviço acima para começar —
          leva menos de um minuto.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((s) => {
            const info = CATALOGO_SERVICOS[s.tipo];
            const st = CATALOGO_STATUS[s.status];
            return (
              <li key={s.id} className="rounded-md bg-panel p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden>{info.icone}</span>
                    <div>
                      <p className="text-sm font-bold text-ink">{s.titulo}</p>
                      <p className="text-[11px] text-muted">{info.nome}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 text-xs text-ink/80">{s.descricao}</p>
                <p className="mt-1.5 text-[11px] text-muted">{st.significado}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
