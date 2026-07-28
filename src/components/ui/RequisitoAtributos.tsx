"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";
import { Icon } from "./Icon";
import {
  ATRIBUTO_BG_CLASS,
  ATRIBUTO_LABEL,
  type Atributos,
  type Requisitos,
} from "@/lib/atributos";

interface RequisitoAtributosProps {
  /** atributos atuais do negócio (do servidor). Ausente = modo demo, não renderiza. */
  atributos?: Atributos;
  requisitos: Requisitos;
  className?: string;
}

/** Comparação lado a lado (atual × mínimo) por eixo exigido (GH-ATR-03).
 *  Diferente de `AtributosBar`: aqui só os eixos com requisito aparecem, e a
 *  barra mede "atingiu o piso?", não "quanto falta para o teto". */
export function RequisitoAtributos({ atributos, requisitos, className }: RequisitoAtributosProps) {
  const chaves = Object.keys(requisitos) as Array<keyof Requisitos>;
  if (!atributos || chaves.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <span className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
        Requisito
      </span>
      {chaves.map((chave) => {
        const minimo = requisitos[chave]!;
        const atual = atributos[chave].valor;
        const atende = atual >= minimo;
        const pct = Math.min(100, Math.round((atual / minimo) * 100));
        return (
          <div key={chave}>
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-ink">
                <Icon name={atende ? "check" : "close"} size={11} />
                {ATRIBUTO_LABEL[chave]}
              </span>
              <span className={cn("text-[10px] font-bold tabular-nums", atende ? "text-teal" : "text-coral-dark")}>
                {atual}/{minimo}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-pill bg-[#dbe3f0]">
              <motion.i
                className={cn("block h-full", ATRIBUTO_BG_CLASS[chave])}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={springSnappy}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
