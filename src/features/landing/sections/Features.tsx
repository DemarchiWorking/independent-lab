"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { FEATURES } from "../content";

export function Features() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-5 sm:gap-6 md:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="h-full p-6">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-teal/15">
                  <Icon name={f.icon} size={20} className="text-teal" />
                </div>
                <h3 className="mb-2 text-lg font-extrabold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
