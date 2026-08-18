"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { TextShimmer } from "@/components/ui/TextShimmer";
import { MotionCanvas } from "@/components/effects/MotionCanvas";
import { fadeUp, stagger } from "@/features/landing/motion";
import { LANDING_URL } from "./config";

/**
 * Tela pensada para ficar PROJETADA (telão/monitor do datacenter), não para
 * navegação normal — texto grande, alto contraste, sem scroll, QR grande o
 * bastante pra ser escaneado de alguns metros de distância. A landing real
 * (com toda a responsividade celular) é a rota `/`, pra onde o QR aponta.
 */
export function QRPresentationPage() {
  return (
    <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/5 blur-[140px]" />
      </div>
      <MotionCanvas className="pointer-events-none absolute inset-0 opacity-60" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.span
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-5 py-2 font-pixel text-xs uppercase tracking-[2px] text-teal sm:text-sm"
        >
          <Icon name="monitor" size={18} /> Aponte a câmera do seu celular
        </motion.span>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-white p-6 shadow-hard-lg sm:p-8"
        >
          <QRCodeSVG
            value={LANDING_URL}
            size={280}
            level="M"
            marginSize={0}
            fgColor="#080E1D"
            bgColor="#FFFFFF"
            title="labdatadev gamehub — comece grátis"
            className="h-[220px] w-[220px] sm:h-[320px] sm:w-[320px]"
          />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Sua empresa documentada em <span className="text-gradient">10 minutos</span> e seu{" "}
          <TextShimmer>marketing no piloto automático</TextShimmer>.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="font-mono text-base text-muted sm:text-lg"
        >
          {LANDING_URL.replace(/^https?:\/\//, "")}
        </motion.p>
      </motion.div>
    </div>
  );
}
