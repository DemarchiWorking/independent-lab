"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { fadeUp, stagger } from "../motion";
import { DOCUMENTOS, DOCUMENTOS_SECTION } from "../content";

export function Documentos() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-12"
        >
          <span className="mb-4 inline-flex rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-teal">
            {DOCUMENTOS_SECTION.badge}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            {DOCUMENTOS_SECTION.tituloLinha1}
            <br />
            <span className="text-gradient">{DOCUMENTOS_SECTION.tituloDestaque}</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {DOCUMENTOS.map((doc, i) => (
            <motion.div key={doc.label} variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="group h-full rounded-md border border-line bg-card2 p-4 transition-colors duration-300 hover:border-teal/40">
                <div className="mb-3 inline-flex size-8 items-center justify-center rounded-md bg-teal/10 transition-colors group-hover:bg-teal/20">
                  <Icon name="file" size={16} className="text-teal" />
                </div>
                <p className="mb-1 text-sm font-bold text-white">{doc.label}</p>
                <p className="text-xs leading-relaxed text-muted">{doc.desc}</p>
                <div className="mt-3 text-xs font-bold text-teal opacity-0 transition-opacity group-hover:opacity-100">
                  #{i + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
