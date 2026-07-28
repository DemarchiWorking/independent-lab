"use client";

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { StatCard } from "./StatCard";
import { AlertBanner } from "./AlertBanner";
import { Icon } from "./Icon";

export interface HudData {
  coins: string;
  network: string;
  cycleLabel: string;
  cycleProgress: number;
  objective: string;
  balance: string;
  alert?: string;
}

/** Moldura de topo do jogo: cartões (moeda/rede/ciclo) + Objetivo + Saldo +
 *  faixa de alerta. Fica fixa enquanto o "palco" central troca de tela. */
export function HudBar({ data }: { data: HudData }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex gap-2">
          <StatCard
            icon="coin"
            label="Moeda"
            value={data.coins}
            tint="bg-[#cdefe6]"
            iconColor="text-teal"
          />
          <StatCard
            icon="network"
            label="Rede"
            value={data.network}
            tint="bg-[#e7edfb]"
            iconColor="text-[#2a4a8f]"
          />
          <StatCard
            icon="calendar"
            label="Ciclo 90d"
            value={data.cycleLabel}
            tint="bg-[#fdeccf]"
            iconColor="text-[#7a4a12]"
            progress={data.cycleProgress}
          />
        </div>

        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springSnappy}
          className="pointer-events-auto flex items-center gap-3 rounded-md bg-panel/95 px-3 py-2 text-ink shadow-hard"
        >
          <div className="leading-tight">
            <small className="block font-pixel text-[8px] uppercase text-[#5b6b86]">
              Objetivo
            </small>
            <b className="text-xs">{data.objective}</b>
          </div>
          <Icon name="chevron" size={16} />
        </motion.div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {data.alert ? <AlertBanner message={data.alert} /> : <span />}
        <div className="pointer-events-auto rounded-md bg-panel/95 px-3 py-1.5 text-right text-ink shadow-hard">
          <small className="block font-pixel text-[8px] uppercase text-[#5b6b86]">
            Saldo do mês
          </small>
          <b className="tabular-nums text-green">{data.balance}</b>
        </div>
      </div>
    </div>
  );
}
