"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "ghost" | "danger";

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  /** Custo mostrado à direita (ex.: "R$ 1.880" ou "🪙 285"). */
  cost?: string;
  icon?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

const styles: Record<Variant, string> = {
  primary: "bg-orange text-ink shadow-[0_3px_0] shadow-orange-dark",
  ghost: "bg-[#e6eaf1] text-[#33415c] shadow-[0_3px_0] shadow-[#c7cedb]",
  danger: "bg-coral text-white shadow-[0_3px_0] shadow-coral-dark",
};

/** CTA no estilo Startup Panic: cheio, cantos arredondados, sombra dura e
 *  feedback de "afundar" ao clicar. Reutilizável e personalizável por props. */
export function ActionButton({
  children,
  onClick,
  variant = "primary",
  cost,
  icon,
  fullWidth = true,
  disabled = false,
  type = "button",
}: ActionButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...pressable}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 font-ui font-extrabold text-sm",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
        "disabled:opacity-50 disabled:pointer-events-none",
        fullWidth && "w-full",
        styles[variant],
      )}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
      {cost ? (
        <span className="ml-auto tabular-nums font-pixel text-[10px] opacity-80">
          {cost}
        </span>
      ) : null}
    </motion.button>
  );
}
