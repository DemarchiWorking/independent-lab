"use client";

import { motion } from "framer-motion";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fadeUp, stagger } from "../motion";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { ESCADA_SECTION, precoEhRecorrente } from "../content";

export function EscadaValor() {
  return (
    <section id="escada" className="scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-12"
        >
          <span className="mb-4 inline-flex rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-orange">
            {ESCADA_SECTION.badge}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            {ESCADA_SECTION.titulo}
            <br />
            <span className="text-gradient">{ESCADA_SECTION.tituloDestaqueGradiente}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">{ESCADA_SECTION.descricao}</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5"
        >
          {Object.entries(DEGRAUS).map(([n, d]) => (
            <motion.div key={n} variants={fadeUp} transition={{ duration: 0.4 }}>
              <SpotlightCard className="flex h-full flex-col p-4 sm:p-5">
                <span className="mb-2 font-pixel text-[9px] text-teal sm:text-[10px]">DEGRAU {n}</span>
                <p className="mb-1 text-sm font-extrabold leading-snug text-white">{d.nome}</p>
                <p className="mt-auto pt-3 text-base font-extrabold text-gradient sm:text-lg">{d.preco}</p>
                {precoEhRecorrente(d.preco) ? (
                  <span className="text-[10px] text-muted">cobrança recorrente</span>
                ) : (
                  <span className="text-[10px] text-muted">{d.preco === "R$ 0" ? "entrada" : "pagamento único"}</span>
                )}
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex justify-center"
        >
          <LandingLinkButton href="/cadastro" icon="arrow" size="lg" className="w-full sm:w-auto">
            {ESCADA_SECTION.cta}
          </LandingLinkButton>
        </motion.div>
      </div>
    </section>
  );
}
