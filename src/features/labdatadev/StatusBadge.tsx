import { CATALOGO_STATUS, type CorToken } from "./catalogo";
import type { StatusSolicitacao } from "./tipos";

/** Classes completas por token (nunca interpoladas — o purge do Tailwind
 *  precisa ver a string inteira no código). */
const CLASSE_POR_COR: Record<CorToken, string> = {
  muted: "bg-muted/15 text-muted",
  teal: "bg-teal/15 text-teal",
  orange: "bg-orange/20 text-orange-dark",
  green: "bg-green/15 text-green",
  coral: "bg-coral/15 text-coral-dark",
};

/** Pílula de status, com a mesma cor semântica em cliente e admin. */
export function StatusBadge({ status }: { status: StatusSolicitacao }) {
  const info = CATALOGO_STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${CLASSE_POR_COR[info.cor]}`}
    >
      {info.nome}
    </span>
  );
}
