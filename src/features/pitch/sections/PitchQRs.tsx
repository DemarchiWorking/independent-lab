"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { fadeUp, stagger } from "../motion";
import { QR_FINAL } from "../content";

/** Dois QR Codes ao vivo, lado a lado — cada um aponta pra um sistema real
 *  rodando nesta VPS (V4MOS e o gamehub), não pra uma URL de exemplo.
 *  Pensado pra ser escaneado da plateia no fim da apresentação. */
export function PitchQRs() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-4 inline-block rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-teal"
          >
            {QR_FINAL.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {QR_FINAL.titulo} <span className="text-gradient">{QR_FINAL.tituloDestaque}</span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-base leading-relaxed text-muted">
            {QR_FINAL.descricao}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-6 sm:grid-cols-2"
        >
          {QR_FINAL.itens.map((item) => (
            <motion.div
              key={item.nome}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center rounded-md border border-line bg-card2 p-6 text-center shadow-hard-lg sm:p-8"
            >
              <div className="mb-4 flex items-center gap-2 font-pixel text-[10px] uppercase tracking-[1.5px] text-teal">
                <Icon name={item.icon} size={16} />
                {item.nome}
              </div>
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-hard">
                <QRCodeSVG
                  value={item.url}
                  size={180}
                  level="M"
                  marginSize={0}
                  fgColor="#080E1D"
                  bgColor="#FFFFFF"
                  title={item.nome}
                  className="h-[160px] w-[160px] sm:h-[180px] sm:w-[180px]"
                />
              </div>
              <p className="mb-1.5 text-sm font-bold text-white">{item.subtitulo}</p>
              <p className="font-mono text-xs text-muted">{item.url.replace(/^https?:\/\//, "")}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
