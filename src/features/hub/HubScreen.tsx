"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable, springSoft } from "@/lib/motion";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MarketplaceScreen } from "@/features/marketplace/MarketplaceScreen";
import { MissaoCard } from "@/features/gamificacao/MissaoCard";
import type { Missao } from "@/features/gamificacao/missoes";

interface Room {
  id: string;
  name: string;
  segment: string;
  icon: IconName;
  color: string;
}

const rooms: Room[] = [
  { id: "vale", name: "Imobiliária Vale", segment: "Imobiliária", icon: "briefcase", color: "bg-cat-social" },
  { id: "norte", name: "Construtora Norte", segment: "Construtora", icon: "cube", color: "bg-cat-media" },
  { id: "sol", name: "Loteadora Sol", segment: "Loteadora", icon: "globe", color: "bg-cat-growth" },
];

/** Tela inicial do hub: salas de parceiros clicáveis (pixel/iso) + missão atual
 *  + abertura do modal de serviços com "pop". Demonstra o core loop do mundo. */
export function HubScreen({
  missao = null,
  trabalhosAceitos = [],
}: {
  missao?: Missao | null;
  trabalhosAceitos?: readonly string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5">
      {missao ? (
        <MissaoCard missao={missao} />
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="max-w-md text-center text-sm font-bold text-white drop-shadow"
        >
          Bem-vindo ao seu hub regional. Clique numa sede parceira ou veja as
          oportunidades de serviço.
        </motion.p>
      )}

      <motion.div
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="flex flex-wrap items-end justify-center gap-5"
      >
        {rooms.map((room) => (
          <motion.button
            key={room.id}
            variants={listItem}
            {...pressable}
            onClick={() => setOpen(true)}
            className="w-28 text-center"
          >
            <span
              className={cn(
                "mx-auto mb-2 grid h-20 w-24 place-items-center rounded-md text-ink shadow-hard-lg",
                room.color,
              )}
            >
              <Icon name={room.icon} size={30} />
            </span>
            <b className="block text-xs text-white drop-shadow">{room.name}</b>
            <small className="font-pixel text-[8px] uppercase text-white/80">
              {room.segment}
            </small>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSoft, delay: 0.25 }}
        className="mt-7 w-64"
      >
        <ActionButton icon="briefcase" onClick={() => setOpen(true)}>
          Ver oportunidades
        </ActionButton>
      </motion.div>

      <RibbonPanel title="Prestação de serviço" open={open} onClose={() => setOpen(false)}>
        <div className="h-[300px]">
          <MarketplaceScreen
            onAccept={() => setOpen(false)}
            trabalhosAceitos={trabalhosAceitos}
          />
        </div>
      </RibbonPanel>
    </div>
  );
}
