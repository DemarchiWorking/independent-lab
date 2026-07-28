"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listItem, pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";
import type { CategoryKey } from "@tokens";

interface HexTileProps {
  label: string;
  icon: IconName;
  category: CategoryKey;
  /** nota/pontuação (ex.: "9.4"); ausente quando bloqueado */
  score?: string;
  locked?: boolean;
  /** requisito de atributo não atendido (GH-ARV-02) — distinto de `locked`:
   *  o nó já é estruturalmente alcançável, só falta maturidade. Nunca `true`
   *  junto com `locked` (o próprio bloqueio já é o motivo, nesse caso). */
  inalcancavel?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const bgByCategory: Record<CategoryKey, string> = {
  social: "bg-cat-social",
  media: "bg-cat-media",
  growth: "bg-cat-growth",
  ads: "bg-cat-ads",
  locked: "bg-cat-locked",
};

/** Hexágono da árvore de parceiros/serviços. Cor por categoria + ícone + nota
 *  (nunca só cor — acessível). Animado com stagger e feedback de toque. */
export function HexTile({
  label,
  icon,
  category,
  score,
  locked = false,
  inalcancavel = false,
  selected = false,
  onClick,
}: HexTileProps) {
  const bg = locked ? bgByCategory.locked : bgByCategory[category];
  return (
    <motion.button
      type="button"
      variants={listItem}
      {...pressable}
      onClick={onClick}
      aria-pressed={selected}
      className="w-[84px] text-center focus-visible:outline-none"
    >
      {/* wrapper SEM clip-path: o badge de "inalcançável" precisa ficar fora
          da área recortada pelo hexágono (`clip-hex`), senão o
          `clip-path: polygon(...)` corta qualquer conteúdo que exceda os
          limites do hexágono, incluindo elementos absolutos com offset
          negativo — o badge ficaria invisível dentro do span recortado. */}
      <span className="relative mx-auto mb-1.5 block h-[68px] w-[78px]">
        <span
          className={cn(
            "clip-hex absolute inset-0 grid place-items-center text-ink shadow-hard-lg",
            bg,
            locked && "text-white",
            // GH-ARV-02: nó visível mas maturidade insuficiente — dimmed em
            // vez da cor sólida de `locked` (o nó não está bloqueado, só
            // distante).
            inalcancavel && "opacity-45",
            selected && "ring-2 ring-teal ring-offset-2 ring-offset-night",
          )}
        >
          <Icon name={locked ? "lock" : icon} size={22} />
          <em className="absolute bottom-1.5 font-pixel text-[8px] not-italic">
            {locked ? "—" : score}
          </em>
        </span>
        {inalcancavel ? (
          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-pill bg-coral-dark text-white shadow-hard">
            <Icon name="close" size={9} />
          </span>
        ) : null}
      </span>
      <small className="block text-[10px] leading-tight text-muted">{label}</small>
    </motion.button>
  );
}
