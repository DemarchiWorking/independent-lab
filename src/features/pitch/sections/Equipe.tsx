"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { fadeUp, stagger } from "../motion";
import { EQUIPE, EMPRESA } from "../content";

export function Equipe() {
  const { pessoa } = EQUIPE;
  return (
    <section id="equipe" className="relative scroll-mt-20 border-y border-line/60 bg-card/40 px-4 py-20 sm:px-6 sm:py-24">
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
            className="mb-4 inline-block rounded-full border border-orange/30 bg-orange/10 px-3 py-1.5 font-pixel text-[8px] uppercase tracking-[1.5px] text-orange"
          >
            {EQUIPE.badge}
          </motion.span>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            {EQUIPE.titulo} <span className="text-gradient">{EQUIPE.tituloDestaque}</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="rounded-2xl border border-line bg-card2 p-7 shadow-hard-lg sm:p-10">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-orange font-pixel text-xl text-ink">
                AD
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">{pessoa.nome}</h3>
                <p className="text-sm font-bold text-teal">{pessoa.cargo}</p>
              </div>
            </div>

            <ul className="mb-6 space-y-2">
              {pessoa.formacao.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>

            <p className="mb-6 text-sm leading-relaxed text-muted">{pessoa.bio}</p>

            <div>
              <p className="mb-2.5 font-pixel text-[9px] uppercase tracking-[1.5px] text-muted/70">
                Experiência profissional em
              </p>
              <div className="flex flex-wrap gap-2">
                {pessoa.empresas.map((e) => (
                  <span
                    key={e}
                    className="rounded-pill border border-line bg-card px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-6 rounded-2xl border border-line bg-card2 p-7 shadow-hard-lg sm:p-10"
          >
            <h3 className="mb-1 text-lg font-extrabold text-white">
              {EMPRESA.titulo} <span className="text-gradient">{EMPRESA.tituloDestaque}</span>
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-muted">{EMPRESA.quemSomos}</p>
            <p className="mb-1 text-xs font-bold text-teal">{EMPRESA.cnpj}</p>
            <p className="text-sm leading-relaxed text-muted">
              <Icon name="bolt" size={14} className="mr-1 inline text-orange" />
              <b className="text-white">Planos futuros:</b> {EMPRESA.planosFuturos}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
