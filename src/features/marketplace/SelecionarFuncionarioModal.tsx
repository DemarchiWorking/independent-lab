"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { ActionButton } from "@/components/ui/ActionButton";
import { RequisitoAtributos } from "@/components/ui/RequisitoAtributos";
import { aplicarGanhos, atendeRequisitos, type Atributos } from "@/lib/atributos";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import type { FuncionarioContratado } from "@/lib/db/types";
import { aceitarTrabalhoComEquipe } from "./actions";
import { contribuicaoDaEquipe } from "./contribuicao";
import type { Job } from "./data";

interface SelecionarFuncionarioModalProps {
  open: boolean;
  job: Job;
  /** atributos atuais do negócio (baseline, sem equipe). Ausente = modo
   *  demo, não valida — mesma convenção de `RequisitoAtributos`. */
  atributos?: Atributos;
  funcionarios: readonly FuncionarioContratado[];
  onClose: () => void;
  onConcluido: () => void;
}

/** Etapa 2 do aceite de job (GH-EQP-02): escolher quem executa, com soma
 *  dinâmica de atributos comparada ao requisito — réplica de
 *  docs/analise-prints/telas/marketplace-servicos.md §3. */
export function SelecionarFuncionarioModal({
  open,
  job,
  atributos,
  funcionarios,
  onClose,
  onConcluido,
}: SelecionarFuncionarioModalProps) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const funcionariosSelecionados = useMemo(
    () => funcionarios.filter((f) => selecionados.includes(f.id)),
    [funcionarios, selecionados],
  );
  const atributosComEquipe = useMemo(
    () =>
      atributos
        ? aplicarGanhos(atributos, contribuicaoDaEquipe(funcionariosSelecionados))
        : undefined,
    [atributos, funcionariosSelecionados],
  );
  const atende = atributosComEquipe ? atendeRequisitos(atributosComEquipe, job.requisitos) : false;

  const alternar = (id: string) => {
    setErro(null);
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const fechar = () => {
    setSelecionados([]);
    setErro(null);
    onClose();
  };

  const confirmar = () => {
    setErro(null);
    iniciar(async () => {
      const r = await aceitarTrabalhoComEquipe(job.id, selecionados);
      if (r.ok) {
        setSelecionados([]);
        router.refresh();
        onConcluido();
      } else {
        setErro(r.erro ?? "Não foi possível concluir.");
      }
    });
  };

  return (
    <RibbonPanel title="Selecionar funcionário" open={open} onClose={fechar}>
      <div className="space-y-3 text-ink">
        <p className="text-[11px] leading-relaxed text-[#33415c]">{job.description}</p>
        <RequisitoAtributos atributos={atributosComEquipe} requisitos={job.requisitos} />

        <ul className="max-h-48 space-y-1.5 overflow-auto pr-1">
          {funcionarios.map((f) => {
            const cargo = cargoPorId(f.cargoId);
            const livre = f.disponibilidade.estado === "livre";
            const on = selecionados.includes(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  disabled={!livre}
                  onClick={() => alternar(f.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border-2 px-2.5 py-2 text-left text-xs transition-colors",
                    !livre
                      ? "cursor-not-allowed border-transparent bg-[#f1f4f9] opacity-50"
                      : on
                        ? "border-[#8fc6ff] bg-[#dcefff]"
                        : "border-transparent bg-[#f1f4f9] hover:bg-[#e8edf5]",
                  )}
                >
                  <span className="font-semibold">{cargo?.nome ?? f.cargoId}</span>
                  <span className="text-[10px] text-[#5b6b86]">{livre ? "Livre" : "Ocupado"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {funcionarios.length === 0 ? (
          <p className="text-[11px] text-[#5b6b86]">
            Você ainda não contratou nenhum Funcionário de IA.
          </p>
        ) : null}

        {erro ? <p className="text-[11px] font-bold text-coral-dark">{erro}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <ActionButton variant="ghost" fullWidth={false} onClick={fechar}>
            Cancelar
          </ActionButton>
          <ActionButton fullWidth={false} onClick={confirmar} disabled={!atende || pendente}>
            {pendente ? "Confirmando…" : "Confirmar"}
          </ActionButton>
        </div>
      </div>
    </RibbonPanel>
  );
}
