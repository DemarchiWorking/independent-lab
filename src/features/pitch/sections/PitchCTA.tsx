"use client";

import { motion } from "framer-motion";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { CTA_FINAL_PITCH } from "../content";

export function PitchCTA() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-line bg-card2 p-8 shadow-hard-lg sm:p-12"
        >
          <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {CTA_FINAL_PITCH.titulo}
            <br />
            {CTA_FINAL_PITCH.tituloLinha2}
          </h2>
          <p className="mb-8 text-muted">{CTA_FINAL_PITCH.descricao}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LandingLinkButton href="/cadastro" icon="arrow" size="lg" className="w-full sm:w-auto">
              {CTA_FINAL_PITCH.ctaPrimario}
            </LandingLinkButton>
            <LandingLinkButton href="/apresentacao" variant="outline" size="lg" className="w-full sm:w-auto">
              {CTA_FINAL_PITCH.ctaSecundario}
            </LandingLinkButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
