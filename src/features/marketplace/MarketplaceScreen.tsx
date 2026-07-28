"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { RequisitoAtributos } from "@/components/ui/RequisitoAtributos";
import { type Atributos } from "@/lib/atributos";
import type { FuncionarioContratado } from "@/lib/db/types";
import { SelecionarFuncionarioModal } from "./SelecionarFuncionarioModal";
import { jobs } from "./data";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-orange" aria-label={`${n} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Tela do marketplace de serviços de TI: lista + detalhe, ambos animados. */
export function MarketplaceScreen({
  trabalhosAceitos = [],
  atributos,
  funcionarios = [],
}: {
  /** jobIds já aceitos — vem do servidor (GH-FDN-01: guarda anti-farm; não é
   *  `useState` local, que resetaria ao recarregar e escondia o farm). */
  trabalhosAceitos?: readonly string[];
  /** atributos atuais do negócio — mostrado como contexto na ficha do job
   *  (GH-ATR-03). Ausente = modo demo. O gate real de "atende o requisito?"
   *  agora vive no modal de seleção de equipe (GH-EQP-02), não mais aqui:
   *  a baseline sozinha pode não bater, mas a equipe alocada pode completar. */
  atributos?: Atributos;
  /** Funcionários de IA contratados — alimentam o modal "Selecionar
   *  funcionário" (GH-EQP-02). Ausente/vazio = modal mostra lista vazia. */
  funcionarios?: FuncionarioContratado[];
}) {
  const [selectedId, setSelectedId] = useState(jobs[0].id);
  const [modalAberto, setModalAberto] = useState(false);
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];
  const jaAceito = trabalhosAceitos.includes(selected.id);

  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1fr_1.15fr]">
      <motion.ul
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="flex max-h-full flex-col gap-2 overflow-auto pr-1"
      >
        {jobs.map((job) => {
          const on = job.id === selectedId;
          const aceito = trabalhosAceitos.includes(job.id);
          return (
            <motion.li key={job.id} variants={listItem}>
              <button
                type="button"
                onClick={() => setSelectedId(job.id)}
                className={cn(
                  "w-full rounded-md border-2 p-2.5 text-left transition-colors",
                  on
                    ? "border-[#8fc6ff] bg-[#dcefff]"
                    : "border-transparent bg-[#f1f4f9] hover:bg-[#e8edf5]",
                )}
              >
                <span className="float-right font-extrabold tabular-nums text-green">
                  {job.reward}
                </span>
                <small className="text-[10px] text-[#5b6b86]">
                  {job.categoryLabel}
                </small>
                <b className="mt-0.5 block text-xs text-ink">{job.title}</b>
                {aceito ? (
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-teal">
                    <Icon name="check" size={11} />
                    Já aceito
                  </span>
                ) : null}
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={springSnappy}
          className="flex flex-col rounded-md bg-[#f7f9fc] p-3 text-ink"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#e0b3ff] text-[#5a2a80]">
              <Icon name="briefcase" size={18} />
            </span>
            <h3 className="text-sm font-extrabold text-coral-dark">
              {selected.title}
            </h3>
          </div>
          <Stars n={selected.rating} />
          <div className="my-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#5b6b86]">Recompensa</span>
              <br />
              <b>{selected.reward}</b>
            </div>
            <div>
              <span className="text-[#5b6b86]">Tempo est.</span>
              <br />
              <b>{selected.days} dias</b>
            </div>
            <div>
              <span className="text-[#5b6b86]">Parceiro</span>
              <br />
              <b>{selected.partner}</b>
            </div>
          </div>
          <RequisitoAtributos atributos={atributos} requisitos={selected.requisitos} className="my-2" />
          <p className="text-[11px] leading-relaxed text-[#33415c]">
            {selected.description}
          </p>
          <div className="mt-auto flex gap-2 pt-3">
            <ActionButton variant="ghost">Revisão</ActionButton>
            {jaAceito ? (
              <ActionButton variant="ghost" icon="check" disabled>
                Já aceito
              </ActionButton>
            ) : (
              <ActionButton onClick={() => setModalAberto(true)}>Aceitar trabalho</ActionButton>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <SelecionarFuncionarioModal
        open={modalAberto}
        job={selected}
        atributos={atributos}
        funcionarios={funcionarios}
        onClose={() => setModalAberto(false)}
        onConcluido={() => setModalAberto(false)}
      />
    </div>
  );
}
