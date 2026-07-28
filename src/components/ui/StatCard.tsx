"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

interface StatCardProps {
  icon: IconName;
  label: string;
  value: string;
  /** cor do "chip" do ícone (classe tailwind de bg) */
  tint?: string;
  iconColor?: string;
  /** barra de progresso 0–100 (ex.: ciclo de 90 dias) */
  progress?: number;
}

/** Cartão de HUD (Dinheiro/Usuários/Data...). Branco, sombra dura, animado. */
export function StatCard({
  icon,
  label,
  value,
  tint = "bg-[#e7edfb]",
  iconColor = "text-[#2a4a8f]",
  progress,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springSnappy}
      className="flex items-center gap-2 rounded-md bg-panel px-2.5 py-1.5 text-ink shadow-hard"
    >
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-sm",
          tint,
          iconColor,
        )}
      >
        <Icon name={icon} size={16} />
      </span>
      <div className="leading-tight">
        <small className="block font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
          {label}
        </small>
        <b className="text-sm tabular-nums">{value}</b>
        {typeof progress === "number" ? (
          <div className="mt-1 h-1.5 w-14 overflow-hidden rounded-pill bg-[#dbe3f0]">
            <motion.i
              className="block h-full bg-green"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ ...springSnappy, delay: 0.2 }}
            />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
