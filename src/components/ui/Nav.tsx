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
}

/** Barra de navegação inferior (troca o "palco"). Modular via `items`. */
export function Nav<T extends string>({ items, current, onChange }: NavProps<T>) {
  return (
    <nav className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex justify-center p-3">
      <div className="flex gap-1 rounded-pill bg-panel/95 p-1.5 shadow-hard">
        {items.map((item) => {
          const active = item.key === current;
          return (
            <motion.button
              key={item.key}
              type="button"
              {...pressable}
              onClick={() => onChange(item.key)}
              aria-current={active}
              className={cn(
                "relative flex items-center gap-1.5 rounded-pill px-3 py-2 text-xs font-extrabold",
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
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
