"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable, springSnappy } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

interface IsoFurnitureSlotProps {
  x: number;
  y: number;
  w: number;
  h: number;
  slot: number;
  ocupado: boolean;
  cor?: string;
  icon?: IconName;
  /** este slot está marcado como origem de um "mover" em andamento */
  emMovimento?: boolean;
  onClick?: () => void;
}

const DIAMANTE = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";

/** Um espaço de mobília dentro da sala isométrica da sede: losango de piso +
 *  o móvel "em pé" acima dele (mesmo truque visual de `IsoLot`, para a sede
 *  em vez do mapa regional). Vazio mostra "+" para comprar; ocupado mostra
 *  o móvel e pode ser clicado para entrar em modo mover. */
export function IsoFurnitureSlot({
  x,
  y,
  w,
  h,
  slot,
  ocupado,
  cor = "bg-cat-media",
  icon = "desk",
  emMovimento = false,
  onClick,
}: IsoFurnitureSlotProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...pressable}
      style={{ left: x, top: y, width: w, height: h }}
      className="absolute focus-visible:outline-none"
      aria-label={ocupado ? `Espaço ${slot + 1} ocupado` : `Espaço ${slot + 1} livre`}
    >
      {/* piso de madeira do slot */}
      <span
        style={{ clipPath: DIAMANTE }}
        className={cn(
          "absolute inset-0 border transition-colors",
          ocupado ? "border-[#a77f52] bg-[#c79b6e]" : "border-white/25 bg-white/10",
        )}
      />

      {emMovimento ? (
        <motion.span
          style={{ clipPath: DIAMANTE }}
          className="absolute inset-0 bg-orange/40"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      ) : null}

      {ocupado ? (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springSnappy}
          className={cn(
            "absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-[78%] place-items-center rounded-sm text-ink shadow-hard",
            cor,
          )}
        >
          <Icon name={icon} size={16} />
        </motion.span>
      ) : (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[10px] text-white/50">
          +
        </span>
      )}
    </motion.button>
  );
}
