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
  /** `false` esconde a barra (opacidade) e desliga o clique — ela some sozinha
   *  depois de alguns segundos parada e volta no primeiro toque (ver
   *  `GameShell`). Default `true`: quem não passa o prop não muda. */
  visivel?: boolean;
}

/** Barra de navegação inferior (troca o "palco"). Modular via `items`. */
export function Nav<T extends string>({ items, current, onChange, visivel = true }: NavProps<T>) {
  return (
    <motion.nav
      aria-label="Telas do jogo"
      animate={{ opacity: visivel ? 1 : 0, y: visivel ? 0 : 8 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 lg:absolute lg:z-20 lg:p-3",
        visivel ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-pill bg-panel/95 p-1.5 shadow-hard">
        {items.map((item) => {
          const active = item.key === current;
          return (
            <motion.button
              key={item.key}
              type="button"
              {...pressable}
              onClick={() => onChange(item.key)}
              aria-current={active}
              aria-label={item.label}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-2 text-xs font-extrabold sm:px-3",
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
                <span className="max-sm:hidden">{item.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
