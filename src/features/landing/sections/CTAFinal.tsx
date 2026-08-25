"use client";

import { motion } from "framer-motion";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { CTA_FINAL } from "../content";

export function CTAFinal() {
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
            {CTA_FINAL.titulo}
            <br />
            {CTA_FINAL.tituloLinha2}
          </h2>
          <p className="mb-8 text-muted">{CTA_FINAL.descricao}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LandingLinkButton href="/cadastro" icon="arrow" size="lg" className="w-full sm:w-auto">
              {CTA_FINAL.cta}
            </LandingLinkButton>
            <LandingLinkButton href="/pitch" variant="outline" size="lg" className="w-full sm:w-auto">
              Ver a apresentação para investidores
            </LandingLinkButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
