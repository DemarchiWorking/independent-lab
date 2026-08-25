"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { PROBLEMA } from "../content";

export function Problema() {
  return (
    <section id="problema" className="relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
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
            className="mb-4 inline-block rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-coral"
          >
            {PROBLEMA.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {PROBLEMA.titulo}
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {PROBLEMA.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl rounded-md border border-line bg-card2 p-6 shadow-hard sm:p-8"
        >
          <p className="text-sm italic leading-relaxed text-muted sm:text-base">{PROBLEMA.historia}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-8 grid gap-5 sm:gap-6 md:grid-cols-3"
        >
          {PROBLEMA.pontos.map((p) => (
            <motion.div key={p.titulo} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="h-full p-6">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-coral/15">
                  <Icon name={p.icon} size={20} className="text-coral" />
                </div>
                <h3 className="mb-2 text-lg font-extrabold text-white">{p.titulo}</h3>
                <p className="text-sm leading-relaxed text-muted">{p.texto}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center text-sm font-bold text-coral"
        >
          {PROBLEMA.urgencia}
        </motion.p>
      </div>
    </section>
  );
}
