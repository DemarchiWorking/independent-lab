"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { fadeUp, stagger } from "../motion";
import { TECNICO } from "../content";
import { MultiTenantDiagram } from "./MultiTenantDiagram";

export function Tecnico() {
  return (
    <section id="tecnico" className="relative scroll-mt-20 border-y border-line/60 bg-card/40 px-4 py-20 sm:px-6 sm:py-24">
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
            className="mb-4 inline-block rounded-full border border-[#6b8cff]/30 bg-[#6b8cff]/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-[#8fa6ff]"
          >
            {TECNICO.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {TECNICO.titulo} <span className="text-gradient">{TECNICO.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mb-2 text-sm font-bold text-[#8fa6ff]">
            {TECNICO.traducaoSimples}
          </motion.p>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {TECNICO.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mb-12 rounded-md border border-[#6b8cff]/20 bg-night/40 bg-tech-grid py-6"
        >
          <MultiTenantDiagram />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2"
        >
          {TECNICO.pontos.map((p) => (
            <motion.div
              key={p.titulo}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="flex gap-4 rounded-md border border-line bg-card2 p-5 shadow-hard"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#6b8cff]/15">
                <Icon name={p.icon} size={18} className="text-[#8fa6ff]" />
              </div>
              <div>
                <h3 className="mb-1.5 text-sm font-extrabold text-white">{p.titulo}</h3>
                <p className="text-xs leading-relaxed text-muted">{p.texto}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
