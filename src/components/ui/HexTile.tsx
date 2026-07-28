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
      <span
        className={cn(
          "clip-hex relative mx-auto mb-1.5 grid h-[68px] w-[78px] place-items-center text-ink shadow-hard-lg",
          bg,
          locked && "text-white",
          selected && "ring-2 ring-teal ring-offset-2 ring-offset-night",
        )}
      >
        <Icon name={locked ? "lock" : icon} size={22} />
        <em className="absolute bottom-1.5 font-pixel text-[8px] not-italic">
          {locked ? "—" : score}
        </em>
      </span>
      <small className="block text-[10px] leading-tight text-muted">{label}</small>
    </motion.button>
  );
}
