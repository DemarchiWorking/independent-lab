"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { SOLUCAO } from "../content";

export function Solucao() {
  return (
    <section id="solucao" className="relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-4 inline-block rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-teal"
          >
            {SOLUCAO.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {SOLUCAO.titulo} <span className="text-gradient">{SOLUCAO.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {SOLUCAO.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-6 md:grid-cols-3"
        >
          {SOLUCAO.pilares.map((p) => (
            <motion.div key={p.titulo} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="flex h-full flex-col p-7">
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex size-11 items-center justify-center rounded-md bg-teal/15">
                    <Icon name={p.icon} size={22} className="text-teal" />
                  </div>
                  <span className="font-pixel text-2xl text-line">{p.numero}</span>
                </div>
                <h3 className="mb-2.5 text-lg font-extrabold text-white">{p.titulo}</h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">{p.texto}</p>
                <div className="rounded-md border border-teal/20 bg-teal/5 px-3 py-2.5 text-xs font-bold leading-snug text-teal">
                  {p.prova}
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
