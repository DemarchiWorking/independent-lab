"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { fadeUp, stagger } from "../motion";
import { GAMIFICACAO } from "../content";

export function Gamificacao() {
  return (
    <section className="relative border-y border-line/60 bg-card/40 px-4 py-20 sm:px-6 sm:py-24">
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
            className="mb-4 inline-block rounded-full border border-orange/30 bg-orange/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-orange"
          >
            {GAMIFICACAO.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {GAMIFICACAO.titulo} <span className="text-gradient">{GAMIFICACAO.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {GAMIFICACAO.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-5 md:grid-cols-2"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="rounded-md border border-line bg-card2 p-6 shadow-hard">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-teal/15">
              <Icon name="grid" size={20} className="text-teal" />
            </div>
            <h3 className="mb-2 text-base font-extrabold text-white">{GAMIFICACAO.quarteiroes.titulo}</h3>
            <p className="text-sm leading-relaxed text-muted">{GAMIFICACAO.quarteiroes.texto}</p>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="rounded-md border border-line bg-card2 p-6 shadow-hard">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-orange/15">
              <Icon name="network" size={20} className="text-orange" />
            </div>
            <h3 className="mb-2 text-base font-extrabold text-white">{GAMIFICACAO.concorrente.titulo}</h3>
            <p className="text-sm leading-relaxed text-muted">{GAMIFICACAO.concorrente.texto}</p>
          </motion.div>
        </motion.div>

        <p className="mt-8 text-center text-[11px] text-muted/60">{GAMIFICACAO.fonte}</p>
      </div>
    </section>
  );
}
