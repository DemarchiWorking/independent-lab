"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { concluirLicao } from "./actions";
import type { Licao } from "./catalogo";

/**
 * Lição do degrau atual (GH-EDU-01) — sempre ligada a uma ação concreta do
 * jogo (`licao.acao`), nunca teoria solta. Some da tela quando já concluída
 * (não fica repetindo "Concluída" pra sempre no meio do Hub).
 */
export function LicaoCard({
  licao,
  concluida,
}: {
  licao: Licao;
  concluida: boolean;
}) {
  const [aberta, setAberta] = useState(false);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  if (concluida) return null;

  const concluir = () => {
    iniciar(async () => {
      await concluirLicao(licao.id);
      router.refresh();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSnappy}
      className="w-full max-w-md rounded-md bg-panel/95 p-4 text-ink shadow-hard-lg backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-sm bg-teal text-ink">
          <Icon name="file" size={16} />
        </span>
        <div className="leading-tight">
          <small className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
            Lição · {licao.duracao}
          </small>
          <b className="block text-sm">{licao.titulo}</b>
        </div>
      </div>

      {aberta ? (
        <>
          <p className="mb-3 text-xs leading-relaxed text-[#33415c]">{licao.conteudo}</p>
          <p className="mb-3 text-[11px] font-bold text-teal">Ação: {licao.acao}</p>
          <ActionButton onClick={concluir} disabled={pendente} icon="check">
            {pendente ? "Concluindo…" : "Concluí a lição"}
          </ActionButton>
        </>
      ) : (
        <ActionButton variant="ghost" onClick={() => setAberta(true)} icon="arrow">
          Ler lição
        </ActionButton>
      )}
    </motion.div>
  );
}
