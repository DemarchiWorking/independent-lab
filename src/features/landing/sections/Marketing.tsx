"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TextShimmer } from "@/components/ui/TextShimmer";
import { fadeUp, stagger } from "../motion";
import { CANAIS_MARKETING, MARKETING_SECTION } from "../content";

export function Marketing() {
  return (
    <section className="bg-white/[0.015] px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-12"
        >
          <span className="mb-4 inline-flex rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-teal">
            {MARKETING_SECTION.badge}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            {MARKETING_SECTION.titulo}
            <br />
            <TextShimmer>{MARKETING_SECTION.tituloShimmer}</TextShimmer>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-2"
        >
          {CANAIS_MARKETING.map((canal) => (
            <motion.div key={canal.label} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="h-full p-6">
                <Icon name={canal.icon} size={22} className="mb-4 text-teal" />
                <p className="mb-2 text-base font-extrabold text-white">{canal.label}</p>
                <p className="text-sm leading-relaxed text-muted">{canal.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
