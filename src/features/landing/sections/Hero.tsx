"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { TextShimmer } from "@/components/ui/TextShimmer";
import { MotionCanvas } from "@/components/effects/MotionCanvas";
import { fadeUp, stagger } from "../motion";
import { HERO } from "../content";

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-24 text-center sm:px-6 sm:pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/5 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-orange/5 blur-[100px]" />
      </div>

      <MotionCanvas className="pointer-events-none absolute inset-0 opacity-70" />

      <motion.div className="relative z-10 max-w-4xl" initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-teal sm:px-4 sm:text-[9px] sm:tracking-[2px]">
            <Icon name="star" size={12} /> {HERO.badge}
          </span>
        </motion.div>

        {/*
          Sem <br /> fixo de propósito: quebras de linha manuais quebram de
          formas diferentes em cada resolução (celular estreito, 720p mais
          raso, tablet). O `max-w` controla o comprimento da linha, o
          navegador decide onde quebrar — funciona igual em qualquer
          dispositivo sem precisar de ajuste manual por breakpoint.
        */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          {HERO.tituloLinha1} em <span className="text-gradient">{HERO.tituloDestaqueGradiente}</span>{" "}
          {HERO.tituloLinha2Prefixo} <TextShimmer>{HERO.tituloDestaqueShimmer}</TextShimmer>.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {HERO.descricao}
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <LandingLinkButton href="/cadastro" icon="arrow" size="lg" className="w-full sm:w-auto">
            {HERO.ctaPrimario}
          </LandingLinkButton>
          <LandingLinkButton href="#escada" variant="ghost" className="w-full sm:w-auto">
            {HERO.ctaSecundario}
          </LandingLinkButton>
        </motion.div>

        <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="mt-8 text-sm text-muted/70">
          {HERO.rodape} ·{" "}
          <Link href="/demo" className="font-bold text-teal underline underline-offset-2">
            {HERO.linkDemo}
          </Link>
        </motion.p>
      </motion.div>

      <div className="absolute bottom-20 right-16 hidden opacity-20 lg:block">
        <motion.div
          className="size-32 rounded-full border border-teal/30 bg-teal/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </section>
  );
}
