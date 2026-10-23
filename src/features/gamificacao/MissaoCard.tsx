"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import type { Missao } from "./missoes";

/**
 * Cartão da Jornada — o "próximo passo" do jogador. Não dispara recompensa:
 * leva até a tela onde a ação acontece (Equipe de IA, Contratos, vitrine).
 * Quem paga é sempre uma Server Action com guarda própria, nunca este botão.
 * O passo se atualiza sozinho no refresh (o servidor recalcula `missaoAtual`).
 */
export function MissaoCard({
  missao,
  aoIr,
}: {
  missao: Missao | null;
  /** abre uma tela do shell */
  aoIr?: (view: "equipe-ia" | "marketplace" | "contratos") => void;
}) {
  const router = useRouter();
  if (!missao) return null;

  const clicar = () => {
    const alvo = missao.alvo;
    if (alvo.tipo === "view") aoIr?.(alvo.view);
    else if (alvo.tipo === "contrato") aoIr?.("contratos");
    else if (alvo.tipo === "rota") router.push(alvo.href);
  };

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
            Jornada · passo {missao.passo} de {missao.totalPassos}
          </small>
          <b className="block text-sm">{missao.titulo}</b>
        </div>
      </div>
      <p className="mb-3 text-xs text-[#33415c]">{missao.descricao}</p>
      {missao.acao ? (
        <ActionButton onClick={clicar} icon="arrow">
          {missao.acao}
        </ActionButton>
      ) : null}
    </motion.div>
  );
}
