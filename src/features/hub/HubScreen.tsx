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
import { LicaoCard } from "@/features/licoes/LicaoCard";
import { licaoDoDegrau } from "@/features/licoes/catalogo";
import { jaConcluiuLicao } from "@/features/licoes/guarda";
import type { Missao } from "@/features/gamificacao/missoes";
import type { Atributos, FuncionarioContratado, LicaoConcluida } from "@/lib/db/types";

interface Room {
  id: string;
  name: string;
  segment: string;
  icon: IconName;
  color: string;
  /** cliente-alvo ainda não ativado nesta região — visível, não clicável. */
  locked?: boolean;
}

/** Sedes parceiras = clientes-alvo reais do labdatadev/Siga Pregão (empresas
 *  regionais que fornecem para o poder público via licitação), não mais o
 *  elenco fictício original de imobiliárias. */
const rooms: Room[] = [
  { id: "mercado-fiel", name: "Mercado Fiel", segment: "Comércio & Varejo", icon: "cube", color: "bg-orange" },
  { id: "contabilizy", name: "Contabilizy", segment: "Contabilidade & Consultoria", icon: "chart", color: "bg-cat-media" },
  { id: "radiz", name: "Radiz Engenharia", segment: "Engenharia & Construção", icon: "wrench", color: "bg-cat-social" },
  { id: "vitalys", name: "Vitalys Saúde", segment: "Saúde & Equipamentos", icon: "users", color: "bg-cat-ads" },
  { id: "tecnorte", name: "TecNorte TI", segment: "Tecnologia & TI", icon: "monitor", color: "bg-teal", locked: true },
  { id: "sabor-cia", name: "Sabor & Cia Alimentos", segment: "Alimentação & Merenda Escolar", icon: "grid", color: "bg-cat-growth", locked: true },
];

/** Tela inicial do hub: salas de parceiros clicáveis (pixel/iso) + missão atual
 *  + abertura do modal de serviços com "pop". Demonstra o core loop do mundo. */
export function HubScreen({
  missao = null,
  trabalhosAceitos = [],
  atributos,
  funcionarios = [],
  degrauAtual,
  licoesConcluidas = [],
}: {
  missao?: Missao | null;
  trabalhosAceitos?: readonly string[];
  atributos?: Atributos;
  funcionarios?: FuncionarioContratado[];
  /** Degrau atual do negócio (GH-EDU-01) — decide qual lição mostrar.
   *  Ausente = modo demo, sem lição. */
  degrauAtual?: number;
  licoesConcluidas?: LicaoConcluida[];
}) {
  const [open, setOpen] = useState(false);
  const licao = degrauAtual !== undefined ? licaoDoDegrau(degrauAtual) : undefined;

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

      {licao ? (
        <LicaoCard licao={licao} concluida={jaConcluiuLicao(licoesConcluidas, licao.id)} />
      ) : null}

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
            {...(room.locked ? {} : pressable)}
            onClick={room.locked ? undefined : () => setOpen(true)}
            aria-disabled={room.locked}
            className={cn("w-28 text-center", room.locked && "cursor-not-allowed")}
          >
            <span
              className={cn(
                "relative mx-auto mb-2 grid h-20 w-24 place-items-center rounded-md text-ink shadow-hard-lg",
                room.locked ? "bg-cat-locked text-white" : room.color,
                room.locked && "opacity-70",
              )}
            >
              <Icon name={room.locked ? "lock" : room.icon} size={30} />
            </span>
            <b
              className={cn(
                "block text-xs drop-shadow",
                room.locked ? "text-white/70" : "text-white",
              )}
            >
              {room.name}
            </b>
            <small
              className={cn(
                "font-pixel text-[8px] uppercase",
                room.locked ? "text-white/50" : "text-white/80",
              )}
            >
              {room.locked ? "Em breve" : room.segment}
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
            trabalhosAceitos={trabalhosAceitos}
            atributos={atributos}
            funcionarios={funcionarios}
          />
        </div>
      </RibbonPanel>
    </div>
  );
}
