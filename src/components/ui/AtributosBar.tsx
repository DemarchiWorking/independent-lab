"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";
import {
  ATRIBUTO_BG_CLASS,
  ATRIBUTO_CHAVES,
  ATRIBUTO_LABEL,
  type Atributos,
} from "@/lib/atributos";

interface AtributosBarProps {
  atributos: Atributos;
  /** "dark" = cartão escuro (painel); "light" = aside clara (Sede). */
  tom?: "dark" | "light";
  className?: string;
}

/**
 * Os 5 eixos da economia de atributos como barras de progresso — leitura
 * consistente em `/painel` e na Sede, para o jogador sempre ver o que cada
 * ação (evento de gamificação) e cada móvel comprado eleva. Ver
 * docs/analise-prints/telas/economia-de-atributos.md.
 */
export function AtributosBar({ atributos, tom = "dark", className }: AtributosBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {ATRIBUTO_CHAVES.map((chave) => {
        const { valor, teto } = atributos[chave];
        const pct = Math.round((valor / teto) * 100);
        return (
          <div key={chave}>
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "font-pixel text-[8px] uppercase tracking-wide",
                  tom === "dark" ? "text-muted" : "text-[#5b6b86]",
                )}
              >
                {ATRIBUTO_LABEL[chave]}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  tom === "dark" ? "text-white" : "text-ink",
                )}
              >
                {valor}/{teto}
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full overflow-hidden rounded-pill",
                tom === "dark" ? "bg-card2" : "bg-[#dbe3f0]",
              )}
            >
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
