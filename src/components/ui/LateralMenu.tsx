"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

export interface LateralItem<T extends string> {
  key: T;
  label: string;
  icon: IconName;
  /** false = ainda não implementado (mostra cadeado e não navega) */
  disponivel?: boolean;
  /** quando presente, o item navega para esta URL em vez de trocar de aba —
   *  usado pelo World, que tem rota própria (`/world`) fora do shell */
  href?: string;
  /** destaca o item como "o principal" (borda pulsante) */
  destaque?: boolean;
}

interface LateralMenuProps<T extends string> {
  items: ReadonlyArray<LateralItem<T>>;
  current: T | null;
  onSelect: (key: T) => void;
}

/** Barra vertical de ícones à esquerda do palco — a "sidebar de 5 ícones"
 *  observada em ~100% dos prints do Startup Panic
 *  (docs/analise-prints/telas/hud-moldura.md §1). Cada ícone abre um módulo.
 *  Tooltip aparece no hover; item indisponível mostra cadeado. */
export function LateralMenu<T extends string>({
  items,
  current,
  onSelect,
}: LateralMenuProps<T>) {
  return (
    <motion.nav
      variants={listContainer}
      initial="initial"
      animate="enter"
      aria-label="Módulos do jogo"
      className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5"
    >
      {items.map((item) => {
        const ativo = item.key === current;
        const bloqueado = item.disponivel === false;

        const classe = cn(
          "group relative grid h-9 w-9 place-items-center rounded-md shadow-hard transition-colors",
          ativo
            ? "bg-orange text-ink"
            : bloqueado
              ? "cursor-not-allowed bg-panel/40 text-muted"
              : "bg-panel/90 text-ink hover:bg-panel",
          item.destaque && !bloqueado && "ring-2 ring-teal ring-offset-1 ring-offset-night",
        );

        const conteudo = (
          <>
            <Icon name={bloqueado ? "lock" : item.icon} size={17} />

            {/* tooltip — só no hover, some em telas pequenas para não atrapalhar */}
            <span
              className={cn(
                "pointer-events-none absolute left-11 hidden whitespace-nowrap rounded-sm bg-night/90 px-2 py-1",
                "font-pixel text-[8px] uppercase text-white opacity-0 transition-opacity",
                "group-hover:opacity-100 sm:block",
              )}
            >
              {item.label}
              {bloqueado ? " · em breve" : ""}
            </span>
          </>
        );

        // item com rota própria: navegação real, não troca de aba
        if (item.href && !bloqueado) {
          return (
            <motion.div key={item.key} variants={listItem} {...pressable}>
              <Link href={item.href} aria-label={item.label} title={item.label} className={classe}>
                {conteudo}
              </Link>
            </motion.div>
          );
        }

        return (
          <motion.button
            key={item.key}
            variants={listItem}
            {...(bloqueado ? {} : pressable)}
            type="button"
            disabled={bloqueado}
            onClick={() => !bloqueado && onSelect(item.key)}
            aria-label={item.label}
            title={bloqueado ? `${item.label} — em breve` : item.label}
            className={classe}
          >
            {conteudo}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
