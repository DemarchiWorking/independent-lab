"use client";

import { motion } from "framer-motion";
import { listContainer, listItem } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

interface ComingSoonProps {
  icon: IconName;
  title: string;
  intro: string;
  /** texto transcrito do print (referência) */
  referencia: string[];
  /** melhorias futuras propostas */
  melhorias: string[];
}

/** Placeholder modular para telas mapeadas mas ainda não implementadas.
 *  Mostra a referência do print + melhorias — base para a implementação. */
export function ComingSoon({
  icon,
  title,
  intro,
  referencia,
  melhorias,
}: ComingSoonProps) {
  return (
    <div className="flex h-full flex-col overflow-auto text-ink">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-orange text-ink shadow-hard">
          <Icon name={icon} size={22} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold">{title}</h3>
            <span className="rounded-sm bg-teal/15 px-2 py-0.5 font-pixel text-[8px] uppercase text-teal">
              Em breve
            </span>
          </div>
          <p className="max-w-prose text-xs text-[#33415c]">{intro}</p>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <Column title="Do print (referência)" icon="grid" items={referencia} />
        <Column title="Melhorias futuras" icon="bolt" items={melhorias} accent />
      </div>
    </div>
  );
}

function Column({
  title,
  icon,
  items,
  accent = false,
}: {
  title: string;
  icon: IconName;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-[#f7f9fc] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#5b6b86]">
        <Icon name={icon} size={14} />
        {title}
      </div>
      <motion.ul
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="space-y-1.5"
      >
        {items.map((it) => (
          <motion.li
            key={it}
            variants={listItem}
            className="flex gap-2 text-[12px] leading-snug text-[#33415c]"
          >
            <span className={accent ? "text-orange" : "text-teal"}>▸</span>
            {it}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
