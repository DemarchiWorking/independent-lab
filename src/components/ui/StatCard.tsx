"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable, springSnappy } from "@/lib/motion";
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
  /** quando presente, o cartão vira botão e leva para a tela relacionada
   *  (moeda → Finanças, rede → Mercado, ciclo → Eventos). Sem isso, segue
   *  sendo um indicador estático — o modo demo não navega. */
  onClick?: () => void;
  /** texto do `title`/`aria-label` quando clicável */
  acaoLabel?: string;
}

/** Cartão de HUD (Dinheiro/Usuários/Data...). Branco, sombra dura, animado. */
export function StatCard({
  icon,
  label,
  value,
  tint = "bg-[#e7edfb]",
  iconColor = "text-[#2a4a8f]",
  progress,
  onClick,
  acaoLabel,
}: StatCardProps) {
  const Componente = onClick ? motion.button : motion.div;

  return (
    <Componente
      {...(onClick ? { ...pressable, type: "button" as const, onClick } : {})}
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springSnappy}
      {...(onClick ? { title: acaoLabel ?? label, "aria-label": acaoLabel ?? label } : {})}
      className={cn(
        "flex items-center gap-2 rounded-md bg-panel px-2.5 py-1.5 text-left text-ink shadow-hard",
        onClick && "cursor-pointer hover:bg-white",
      )}
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
    </Componente>
  );
}
