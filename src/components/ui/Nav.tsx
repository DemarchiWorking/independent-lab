"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

export interface NavItem<T extends string = string> {
  key: T;
  label: string;
  icon: IconName;
}

interface NavProps<T extends string> {
  items: ReadonlyArray<NavItem<T>>;
  current: T;
  onChange: (key: T) => void;
  /** Achado 2026-08-25 (feedback direto ao vivo): a barra ocupava espaço
   *  demais e tampava conteúdo em telas estreitas. `false` esconde
   *  visualmente (opacidade) e desliga clique — some sozinha depois de
   *  alguns segundos parada (ver `useAutoOcultar` em `GameShell`) e volta
   *  no primeiro toque. Default `true` pra nunca quebrar quem não passa
   *  esse prop (compat com outros usos do componente). */
  visivel?: boolean;
}

/** Barra de navegação inferior (troca o "palco"). Modular via `items`.
 *  Só ícone em telas estreitas (rótulo aparece a partir de `sm`) — o texto
 *  "Equipe IA" quebrando linha era o que mais inflava a altura da barra. */
export function Nav<T extends string>({ items, current, onChange, visivel = true }: NavProps<T>) {
  return (
    <motion.nav
      animate={{ opacity: visivel ? 1 : 0, y: visivel ? 0 : 8 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 sm:p-3",
        visivel ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="flex gap-0.5 rounded-pill bg-panel/95 p-1 shadow-hard sm:gap-1 sm:p-1.5">
        {items.map((item) => {
          const active = item.key === current;
          return (
            <motion.button
              key={item.key}
              type="button"
              {...pressable}
              onClick={() => onChange(item.key)}
              aria-current={active}
              title={item.label}
              className={cn(
                "relative flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-xs font-extrabold sm:px-3 sm:py-2",
                active ? "text-ink" : "text-[#5b6b86]",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-pill bg-orange"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ) : null}
              <span className="relative flex items-center gap-1.5">
                <Icon name={item.icon} size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
