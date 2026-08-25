"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "../motion";
import { AGENTES_IA } from "../content";

export function AgentesIA() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-4 inline-block rounded-full border border-orange/30 bg-orange/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-orange"
          >
            {AGENTES_IA.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {AGENTES_IA.titulo} <span className="text-gradient">{AGENTES_IA.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {AGENTES_IA.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="space-y-4"
        >
          {AGENTES_IA.argumentos.map((a, i) => (
            <motion.div
              key={a.titulo}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4 rounded-md border border-line bg-card2 p-6 shadow-hard sm:flex-row sm:items-start"
            >
              <span className="font-pixel text-3xl text-orange/40 sm:w-16 sm:shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="mb-1.5 text-base font-extrabold text-white sm:text-lg">{a.titulo}</h3>
                <p className="text-sm leading-relaxed text-muted">{a.texto}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
