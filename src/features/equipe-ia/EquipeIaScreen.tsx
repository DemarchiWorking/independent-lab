"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, springSnappy } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { useRecompensa } from "@/features/gamificacao/RecompensaContext";
import { CARGOS_IA } from "./catalogo";
import {
  custoEvolucao,
  entregavelDoCargo,
  habilidadesDoCargo,
  NIVEL_MAX_FUNCIONARIO,
} from "./habilidades";
import { evoluirFuncionario } from "./actions";
import type { FuncionarioContratado } from "@/lib/db/types";

const ROTULO_ENTREGAVEL: Record<string, string> = {
  canvas: "Baixar Modelo de Negócio",
  post: "Baixar post pronto",
  script: "Baixar script comercial",
  reel: "Baixar roteiro de Reels",
};

interface EquipeIaScreenProps {
  /** cargoIds já contratados — vem do servidor (não é estado local: precisa
   *  sobreviver a reload e ser a mesma fonte de verdade da guarda anti-farm
   *  em features/gamificacao/actions.ts). */
  contratados: string[];
  degrauAtual: number;
  /** registros completos (id/nivel) dos contratados — necessário para
   *  evoluir e para saber o nível que gera o entregável (GH-EQP-04). */
  funcionarios?: FuncionarioContratado[];
}

/** Vitrine dos 4 Funcionários de IA — o produto central do gamehub.
 *  Lista + detalhe animado, mesmo padrão do marketplace/árvore de parcerias. */
export function EquipeIaScreen({
  contratados,
  degrauAtual,
  funcionarios = [],
}: EquipeIaScreenProps) {
  const [selectedId, setSelectedId] = useState(CARGOS_IA[0].id);
  const selected = CARGOS_IA.find((c) => c.id === selectedId) ?? CARGOS_IA[0];
  const { disparar, pendente } = useRecompensa();
  const [erroEvolucao, setErroEvolucao] = useState<string | null>(null);
  const [evoluindo, iniciarEvolucao] = useTransition();
  const router = useRouter();

  const jaContratado = contratados.includes(selected.id);
  const bloqueadoPorDegrau = degrauAtual < selected.degrauMinimo;
  const funcionario = funcionarios.find((f) => f.cargoId === selected.id);
  const nivel = funcionario?.nivel ?? 1;
  const habilidades = habilidadesDoCargo(selected.id, nivel);
  const entregavel = entregavelDoCargo(selected.id);
  const custoProximo = custoEvolucao(nivel + 1);

  const evoluir = () => {
    if (!funcionario) return;
    setErroEvolucao(null);
    iniciarEvolucao(async () => {
      const r = await evoluirFuncionario(funcionario.id);
      if (r.ok) router.refresh();
      else setErroEvolucao(r.erro ?? "Não foi possível evoluir.");
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1fr_1.2fr]">
      <motion.ul
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="flex max-h-full flex-col gap-2 overflow-auto pr-1"
      >
        {CARGOS_IA.map((cargo) => {
          const on = cargo.id === selectedId;
          const contratado = contratados.includes(cargo.id);
          return (
            <motion.li key={cargo.id} variants={listItem}>
              <button
                type="button"
                onClick={() => setSelectedId(cargo.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border-2 p-2.5 text-left transition-colors",
                  on
                    ? "border-[#8fc6ff] bg-[#dcefff]"
                    : "border-transparent bg-[#f1f4f9] hover:bg-[#e8edf5]",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-teal/20 text-teal">
                  <Icon name={cargo.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-xs text-ink">{cargo.nome}</b>
                  <small className="text-[10px] text-[#5b6b86]">
                    R$ {cargo.precoMensal}/mês
                  </small>
                </div>
                {contratado ? (
                  <span className="shrink-0 rounded-sm bg-green/20 px-1.5 py-0.5 font-pixel text-[7px] uppercase text-[#166534]">
                    Contratado
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
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-orange text-ink">
              <Icon name={selected.icon} size={18} />
            </span>
            <h3 className="text-sm font-extrabold text-coral-dark">
              {selected.nome}
            </h3>
          </div>
          <div className="my-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#5b6b86]">Entrega</span>
              <br />
              <b>{selected.entrega}</b>
            </div>
            <div>
              <span className="text-[#5b6b86]">Frequência</span>
              <br />
              <b>{selected.frequencia}</b>
            </div>
            <div>
              <span className="text-[#5b6b86]">Preço</span>
              <br />
              <b className="text-green">R$ {selected.precoMensal}/mês</b>
            </div>
            <div>
              <span className="text-[#5b6b86]">Disponível a partir de</span>
              <br />
              <b>Degrau {selected.degrauMinimo}</b>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[#33415c]">
            {selected.descricao}
          </p>

          {/* Habilidades — destravadas por nível (GH-EQP-04). Mostradas
              mesmo antes de contratar: é parte do que o jogador está
              comprando, então precisa ser visível na decisão. */}
          <div className="mt-3 border-t border-[#e6ebf3] pt-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
                Habilidades
              </span>
              {jaContratado ? (
                <span className="rounded-sm bg-teal/15 px-1.5 py-0.5 font-pixel text-[7px] uppercase text-teal">
                  Nível {nivel}/{NIVEL_MAX_FUNCIONARIO}
                </span>
              ) : null}
            </div>
            <ul className="space-y-1">
              {habilidades.map((h) => {
                const ativa = jaContratado && h.destravada;
                return (
                  <li
                    key={h.id}
                    className={cn(
                      "flex items-start gap-1.5 text-[11px]",
                      ativa ? "text-[#33415c]" : "text-[#94a3b8]",
                    )}
                  >
                    <Icon name={ativa ? "check" : "lock"} size={11} className="mt-0.5 shrink-0" />
                    <span>
                      <b>{h.nome}</b>
                      {!ativa ? (
                        <span className="ml-1 opacity-70">(nível {h.nivelMinimo})</span>
                      ) : null}
                      <br />
                      <span className="opacity-80">{h.descricao}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {erroEvolucao ? (
            <p className="mt-2 text-[11px] font-bold text-coral-dark">{erroEvolucao}</p>
          ) : null}

          <div className="mt-auto space-y-2 pt-3">
            {/* Entregável: só existe depois de contratar (o servidor
                repete essa checagem — ver /api/entregavel/[tipo]). */}
            {jaContratado && entregavel ? (
              <a
                href={`/api/entregavel/${entregavel}`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 font-ui text-sm font-extrabold text-ink"
              >
                <Icon name="file" size={16} />
                {ROTULO_ENTREGAVEL[entregavel] ?? "Baixar entregável"}
              </a>
            ) : null}

            {jaContratado && custoProximo !== undefined ? (
              <ActionButton
                variant="ghost"
                icon="arrow"
                cost={`🪙 ${custoProximo}`}
                disabled={evoluindo}
                onClick={evoluir}
              >
                {evoluindo ? "Evoluindo…" : `Evoluir para nível ${nivel + 1}`}
              </ActionButton>
            ) : null}

            {jaContratado ? (
              <ActionButton variant="ghost" icon="check" disabled>
                Já faz parte da sua equipe
              </ActionButton>
            ) : bloqueadoPorDegrau ? (
              <ActionButton variant="ghost" icon="lock" disabled>
                Disponível no degrau {selected.degrauMinimo}
              </ActionButton>
            ) : (
              <ActionButton
                icon="arrow"
                disabled={pendente}
                onClick={() => disparar("funcionario_ia_contratado", selected.id)}
              >
                {pendente ? "Contratando…" : "Contratar"}
              </ActionButton>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
