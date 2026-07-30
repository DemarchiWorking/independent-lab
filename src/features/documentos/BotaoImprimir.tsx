"use client";

import { Icon } from "@/components/ui/Icon";

/** `window.print()` só existe no cliente — por isso este componente separado
 *  (a página em volta continua Server Component). `print:hidden` no próprio
 *  botão garante que ele nunca aparece na versão impressa/PDF. */
export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 rounded-md bg-card2 px-4 py-2.5 text-xs font-bold text-muted hover:text-white"
    >
      <Icon name="file" size={15} />
      Imprimir / salvar em PDF
    </button>
  );
}
