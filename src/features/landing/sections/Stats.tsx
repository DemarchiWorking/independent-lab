"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { STATS } from "../content";

export function Stats() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-3 gap-3 sm:gap-6"
        >
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }}>
              <SpotlightCard className="flex h-full flex-col items-center justify-center p-3 text-center sm:p-7">
                <p className="text-2xl font-extrabold tabular-nums text-gradient sm:text-4xl">
                  <AnimatedCounter to={stat.to} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-[11px] leading-snug text-muted sm:text-sm">{stat.label}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
