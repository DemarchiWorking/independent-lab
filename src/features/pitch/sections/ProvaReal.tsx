"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "../motion";
import { PROVA_REAL } from "../content";

export function ProvaReal() {
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
            {PROVA_REAL.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {PROVA_REAL.titulo} <span className="text-gradient">{PROVA_REAL.tituloDestaque}</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-6 md:grid-cols-2"
        >
          {PROVA_REAL.itens.map((item) => (
            <motion.div key={item.legenda} variants={fadeUp} transition={{ duration: 0.6 }}>
              <div className="overflow-hidden rounded-md border border-line bg-card2 shadow-hard-lg">
                <div className="flex items-center gap-1.5 border-b border-line bg-night/60 px-3 py-2">
                  <span className="size-2.5 rounded-full bg-coral/70" />
                  <span className="size-2.5 rounded-full bg-orange/70" />
                  <span className="size-2.5 rounded-full bg-teal/70" />
                  <span className="ml-2 truncate font-pixel text-[8px] uppercase tracking-[1px] text-muted/70">
                    {item.url}
                  </span>
                </div>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  className="w-full"
                />
              </div>
              <p className="mt-3 text-center text-sm font-bold text-white">{item.legenda}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
