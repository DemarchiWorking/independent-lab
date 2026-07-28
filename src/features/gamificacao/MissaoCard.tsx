"use client";

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { useRecompensa } from "./RecompensaContext";
import type { Missao } from "./missoes";

/**
 * Cartão de missão — o "próximo passo" do cliente. Concluir dispara o evento
 * de gamificação pelo caminho único (toast + refresh), e a própria missão se
 * atualiza no refresh (o servidor recalcula `missaoAtual`).
 */
export function MissaoCard({ missao }: { missao: Missao | null }) {
  const { disparar, pendente } = useRecompensa();
  if (!missao) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSnappy}
      className="w-full max-w-md rounded-md bg-panel/95 p-4 text-ink shadow-hard-lg backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-sm bg-orange text-ink">
          <Icon name="star" size={16} />
        </span>
        <div className="leading-tight">
          <small className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
            Missão · degrau {missao.degrauAlvo}
          </small>
          <b className="block text-sm">{missao.titulo}</b>
        </div>
      </div>
      <p className="mb-3 text-xs text-[#33415c]">{missao.descricao}</p>
      <ActionButton
        onClick={() => disparar(missao.evento)}
        disabled={pendente}
        icon="arrow"
      >
        {pendente ? "Concluindo…" : missao.acao}
      </ActionButton>
    </motion.div>
  );
}
