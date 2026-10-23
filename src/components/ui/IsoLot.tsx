"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable } from "@/lib/motion";
import { classeAnelTier, nomeArvoreTier } from "@/lib/tier";
import { Icon, type IconName } from "./Icon";

interface IsoLotProps {
  x: number;
  y: number;
  w: number;
  h: number;
  numero: number;
  ocupado: boolean;
  cor?: string;
  icon?: IconName;
  ehJogador?: boolean;
  selecionado?: boolean;
  onClick?: () => void;
  /** Degrau na escada de valor (1–5) — Mapa Vivo, GH-MAPA-05. Ring de cor
   *  em volta da sede, independente da cor do ícone (segmento). `undefined`
   *  = sem lote ocupado, não desenha nada. */
  tier?: number;
}

const DIAMANTE = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";

/** Um lote no mapa isométrico: base em losango + "sede" (quando ocupado).
 *  Presentational puro — cor/ícone vêm por prop. */
export function IsoLot({
  x,
  y,
  w,
  h,
  numero,
  ocupado,
  cor = "bg-cat-social",
  icon = "briefcase",
  ehJogador = false,
  selecionado = false,
  onClick,
  tier,
}: IsoLotProps) {
  const rotuloTier = ocupado && tier ? `, ${nomeArvoreTier(tier)}` : "";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...(ocupado ? pressable : {})}
      style={{ left: x, top: y, width: w, height: h }}
      className="absolute focus-visible:outline-none"
      aria-label={ocupado ? `Lote ${numero} ocupado${rotuloTier}` : `Lote ${numero} livre`}
    >
      {/* base do terreno */}
      <span
        style={{ clipPath: DIAMANTE }}
        className={cn(
          "absolute inset-0 border",
          ocupado ? "bg-[#c79b6e] border-[#a77f52]" : "bg-[#1b2b4d] border-line",
        )}
      />

      {/* destaque do jogador (pulso) */}
      {ehJogador ? (
        <motion.span
          style={{ clipPath: DIAMANTE }}
          className="absolute inset-0 bg-teal/30"
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      ) : null}

      {/* seleção */}
      {selecionado ? (
        <span
          style={{ clipPath: DIAMANTE }}
          className="absolute inset-0 ring-2 ring-inset ring-orange"
        />
      ) : null}

      {/* sede (quando ocupado) — anel de tier (Mapa Vivo, GH-MAPA-05):
          eixo independente do ícone/cor de segmento, nunca substitui. */}
      {ocupado ? (
        <span
          className={cn(
            "absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-[75%] place-items-center rounded-sm text-ink shadow-hard",
            cor,
            tier ? cn("ring-2 ring-offset-1 ring-offset-night", classeAnelTier(tier)) : "",
          )}
        >
          <Icon name={icon} size={15} />
        </span>
      ) : (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[7px] text-muted">
          {numero}
        </span>
      )}
    </motion.button>
  );
}
