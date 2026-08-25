"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { fadeUp, stagger } from "../motion";
import { CUSTO_COMPARATIVO } from "../content";

export function CustoComparativo() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-4 inline-block rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-teal"
          >
            {CUSTO_COMPARATIVO.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {CUSTO_COMPARATIVO.titulo} <span className="text-gradient">{CUSTO_COMPARATIVO.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {CUSTO_COMPARATIVO.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="space-y-3"
        >
          {CUSTO_COMPARATIVO.linhas.map((l) => (
            <motion.div
              key={l.nome}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className={cn(
                "flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center sm:gap-6",
                l.destaque
                  ? "border-teal/40 bg-teal/[0.07] shadow-hard"
                  : "border-line bg-card2",
              )}
            >
              <div className="sm:w-64 sm:shrink-0">
                <h3 className={cn("text-base font-extrabold", l.destaque ? "text-teal" : "text-white")}>
                  {l.nome}
                </h3>
                <p className="text-xs text-muted">{l.categoria}</p>
              </div>
              <div className="sm:w-40 sm:shrink-0">
                <span
                  className={cn(
                    "font-pixel text-lg tabular-nums",
                    l.destaque ? "text-teal" : "text-orange",
                  )}
                >
                  {l.preco}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted sm:flex-1">{l.detalhe}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-8 text-center text-[11px] text-muted/60">{CUSTO_COMPARATIVO.fonte}</p>
      </div>
    </section>
  );
}
