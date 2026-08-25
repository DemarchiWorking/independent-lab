"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { MERCADO } from "../content";

export function Mercado() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
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
            {MERCADO.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {MERCADO.titulo} <span className="text-gradient">{MERCADO.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {MERCADO.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6"
        >
          {MERCADO.stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="flex h-full flex-col items-center justify-center p-6 text-center">
                <p className="text-3xl font-extrabold tabular-nums text-gradient sm:text-5xl">
                  <AnimatedCounter to={stat.to} suffix={stat.suffix} decimals={stat.decimals} />
                </p>
                <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{stat.label}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-4 md:grid-cols-3"
        >
          {MERCADO.camadas.map((c) => (
            <motion.div
              key={c.nome}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="rounded-md border border-line bg-card2 p-5"
            >
              <span className="mb-2 inline-block font-pixel text-[10px] uppercase tracking-[2px] text-orange">
                {c.nome}
              </span>
              <h3 className="mb-1.5 text-sm font-extrabold text-white">{c.titulo}</h3>
              <p className="text-xs leading-relaxed text-muted">{c.texto}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-8 text-center text-[11px] text-muted/60">{MERCADO.fonte}</p>
      </div>
    </section>
  );
}
