"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { entregaveisDoCargo, type TipoEntregavel } from "../habilidades";
import { EstudioEntregavel } from "./EstudioEntregavel";
import { INFO_ENTREGAVEL } from "./rotulos";

/**
 * Lista os entregáveis do cargo contratado e abre o estúdio de cada um num
 * painel. Só é mostrado depois de contratar (a rota repete a checagem).
 */
export function EntregaveisDoCargo({ cargoId }: { cargoId: string }) {
  const [aberto, setAberto] = useState<TipoEntregavel | null>(null);
  const tipos = entregaveisDoCargo(cargoId);
  if (tipos.length === 0) return null;

  return (
    <>
      <ul className="space-y-1.5" aria-label="Materiais que este funcionário produz">
        {tipos.map((tipo) => {
          const info = INFO_ENTREGAVEL[tipo];
          return (
            <li key={tipo}>
              <button
                type="button"
                onClick={() => setAberto(tipo)}
                className="flex w-full items-center gap-2 rounded-md bg-teal px-4 py-3 text-left font-ui text-sm font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Icon name={info.icone} size={16} />
                <span className="flex-1">
                  {info.abrir}
                  <small className="block text-[10px] font-semibold opacity-80">{info.nome}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <RibbonPanel
        title={aberto ? INFO_ENTREGAVEL[aberto].nome : "Material"}
        open={aberto !== null}
        onClose={() => setAberto(null)}
        className="max-w-6xl"
        tela
      >
        {aberto ? <EstudioEntregavel key={aberto} tipo={aberto} /> : null}
      </RibbonPanel>
    </>
  );
}
