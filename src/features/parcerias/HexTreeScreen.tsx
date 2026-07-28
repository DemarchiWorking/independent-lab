"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { listContainer, springSnappy } from "@/lib/motion";
import { HexTile } from "@/components/ui/HexTile";
import { ActionButton } from "@/components/ui/ActionButton";
import { desbloquearNo } from "./actions";
import { hexNodes } from "./data";

const legend = [
  { c: "bg-cat-social", label: "Social/Web" },
  { c: "bg-cat-media", label: "Mídia" },
  { c: "bg-cat-growth", label: "Growth/Dados" },
  { c: "bg-cat-ads", label: "Ads" },
  { c: "bg-cat-locked", label: "Bloqueado" },
];

/** Árvore de parceiros/serviços: grid de hexágonos + painel lateral animado. */
export function HexTreeScreen({
  nosDesbloqueados = [],
  moedaVirtual = 0,
}: {
  /** noIds já desbloqueados — vem do servidor (GH-FDN-02: sobrevive a
   *  reload; não é `useState` local, que perdia o progresso ao recarregar). */
  nosDesbloqueados?: readonly string[];
  /** saldo atual — decide se o botão fica desabilitado (GH-ARV-01). */
  moedaVirtual?: number;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(hexNodes[0].id);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const selected = hexNodes.find((n) => n.id === selectedId) ?? hexNodes[0];
  const jaDesbloqueado = nosDesbloqueados.includes(selected.id);
  const caro = moedaVirtual < selected.custo;

  const desbloquear = () => {
    setErro(null);
    iniciar(async () => {
      const r = await desbloquearNo(selected.id);
      if (r.ok) router.refresh();
      else setErro(r.erro ?? "Não foi possível concluir.");
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr]">
      <div className="rounded-md bg-card2/70 p-3">
        <motion.div
          variants={listContainer}
          initial="initial"
          animate="enter"
          className="flex flex-wrap gap-3"
        >
          {hexNodes.map((node) => (
            <HexTile
              key={node.id}
              label={node.label}
              icon={node.icon}
              category={node.category}
              score={node.score}
              locked={node.locked}
              selected={node.id === selectedId}
              onClick={() => setSelectedId(node.id)}
            />
          ))}
        </motion.div>

        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${l.c}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.aside
          key={selected.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={springSnappy}
          className="flex flex-col rounded-md bg-panel p-4 text-ink"
        >
          <div className="mb-1 flex items-center justify-between">
            <b className="text-xs uppercase tracking-wide text-teal">Recurso</b>
            {selected.score ? (
              <span className="font-pixel text-[10px] text-[#5b6b86]">
                fit {selected.score}
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-extrabold text-coral-dark">
            {selected.label}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#33415c]">
            {selected.description}
          </p>

          {/* custo sempre visível — decisão informada antes de clicar
              (GH-ARV-01: "UI mostra o custo antes de confirmar") */}
          {!selected.locked && !jaDesbloqueado ? (
            <p className="mt-2 font-pixel text-[10px]">
              <span className={caro ? "text-coral-dark" : "text-teal"}>
                🪙 {selected.custo.toLocaleString("pt-BR")}
              </span>
            </p>
          ) : null}

          {erro ? (
            <p className="mt-2 rounded-sm bg-coral/15 px-2 py-1.5 text-[11px] font-bold text-coral-dark">
              {erro}
            </p>
          ) : null}

          <div className="mt-auto pt-4">
            <ActionButton
              variant={selected.locked || jaDesbloqueado || caro ? "ghost" : "primary"}
              disabled={selected.locked || jaDesbloqueado || caro || pendente}
              icon={selected.locked ? "lock" : jaDesbloqueado ? "check" : "arrow"}
              onClick={desbloquear}
            >
              {selected.locked
                ? "Bloqueado"
                : jaDesbloqueado
                  ? "Desbloqueado"
                  : caro
                    ? "Moeda insuficiente"
                    : pendente
                      ? "Desbloqueando…"
                      : `Desbloquear · 🪙 ${selected.custo.toLocaleString("pt-BR")}`}
            </ActionButton>
          </div>
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}
