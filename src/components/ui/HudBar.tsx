"use client";

import { motion } from "framer-motion";
import { pressable, springSnappy } from "@/lib/motion";
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

/** Para onde cada elemento do HUD leva. Ausente = HUD só informativo
 *  (modo demo da rota pública, que não tem telas para navegar). */
export interface HudAcoes {
  aoClicarMoeda?: () => void;
  aoClicarRede?: () => void;
  aoClicarCiclo?: () => void;
  aoClicarObjetivo?: () => void;
  aoClicarSaldo?: () => void;
}

/** Moldura de topo do jogo: cartões (moeda/rede/ciclo) + Objetivo + Saldo +
 *  faixa de alerta. Fica fixa enquanto o "palco" central troca de tela.
 *  Cada elemento é um atalho para a tela que explica aquele número. */
export function HudBar({ data, acoes = {} }: { data: HudData; acoes?: HudAcoes }) {
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
            onClick={acoes.aoClicarMoeda}
            acaoLabel="Abrir Finanças"
          />
          <StatCard
            icon="network"
            label="Rede"
            value={data.network}
            tint="bg-[#e7edfb]"
            iconColor="text-[#2a4a8f]"
            onClick={acoes.aoClicarRede}
            acaoLabel="Abrir Mercado"
          />
          <StatCard
            icon="calendar"
            label="Ciclo 90d"
            value={data.cycleLabel}
            tint="bg-[#fdeccf]"
            iconColor="text-[#7a4a12]"
            progress={data.cycleProgress}
            onClick={acoes.aoClicarCiclo}
            acaoLabel="Abrir Eventos"
          />
        </div>

        <motion.button
          type="button"
          {...(acoes.aoClicarObjetivo ? pressable : {})}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springSnappy}
          onClick={acoes.aoClicarObjetivo}
          disabled={!acoes.aoClicarObjetivo}
          title={acoes.aoClicarObjetivo ? "Ver missão no Hub" : undefined}
          className="pointer-events-auto flex items-center gap-3 rounded-md bg-panel/95 px-3 py-2 text-left text-ink shadow-hard enabled:hover:bg-panel disabled:cursor-default"
        >
          <div className="leading-tight">
            <small className="block font-pixel text-[8px] uppercase text-[#5b6b86]">
              Objetivo
            </small>
            <b className="text-xs">{data.objective}</b>
          </div>
          <Icon name="chevron" size={16} />
        </motion.button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {data.alert ? <AlertBanner message={data.alert} /> : <span />}
        <motion.button
          type="button"
          {...(acoes.aoClicarSaldo ? pressable : {})}
          onClick={acoes.aoClicarSaldo}
          disabled={!acoes.aoClicarSaldo}
          title={acoes.aoClicarSaldo ? "Abrir Finanças" : undefined}
          className="pointer-events-auto rounded-md bg-panel/95 px-3 py-1.5 text-right text-ink shadow-hard enabled:hover:bg-panel disabled:cursor-default"
        >
          <small className="block font-pixel text-[8px] uppercase text-[#5b6b86]">
            Saldo do mês
          </small>
          <b className="tabular-nums text-green">{data.balance}</b>
        </motion.button>
      </div>
    </div>
  );
}
