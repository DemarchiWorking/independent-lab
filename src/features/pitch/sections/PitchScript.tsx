"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "../motion";
import { PITCH_SCRIPT } from "../content";

export function PitchScript() {
  return (
    <section id="pitch-script" className="relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-4 inline-block rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-teal"
          >
            {PITCH_SCRIPT.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {PITCH_SCRIPT.titulo}
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {PITCH_SCRIPT.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="relative space-y-4 border-l-2 border-line pl-6 sm:pl-8"
        >
          {PITCH_SCRIPT.blocos.map((b) => (
            <motion.div key={b.tempo} variants={fadeUp} transition={{ duration: 0.5 }} className="relative">
              <span className="absolute -left-[31px] top-1 size-3.5 rounded-full border-2 border-night bg-teal sm:-left-[39px]" />
              <div className="rounded-md border border-line bg-card2 p-5 shadow-hard">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-pill bg-teal/15 px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[1px] text-teal">
                    {b.tempo}
                  </span>
                  <h3 className="text-sm font-extrabold text-white">{b.titulo}</h3>
                </div>
                <p className="text-sm italic leading-relaxed text-muted">{b.texto}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
