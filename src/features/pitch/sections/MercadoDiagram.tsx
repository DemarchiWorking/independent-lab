"use client";

import { motion } from "framer-motion";
import { MERCADO } from "../content";

const RAIOS = [96, 66, 36] as const;
const CORES = ["#00D4C8", "#38C172", "#F59E0B"] as const;

/** Diagrama clássico de TAM/SAM/SOM em círculos concêntricos — o mesmo
 *  vocabulário visual que qualquer investidor já reconhece de outros
 *  pitch decks, desenhado ao vivo via `stroke-dasharray` quando entra na
 *  viewport (SVG puro, sem lib de gráfico). */
export function MercadoDiagram() {
  return (
    <svg viewBox="0 0 240 240" className="mx-auto w-full max-w-[280px]" role="img" aria-label="Diagrama de tamanho de mercado: TAM, SAM e SOM em círculos concêntricos">
      {MERCADO.camadas.map((c, i) => {
        const r = RAIOS[i];
        const circunferencia = 2 * Math.PI * r;
        return (
          <g key={c.nome}>
            <motion.circle
              cx={120}
              cy={120}
              r={r}
              fill={CORES[i]}
              fillOpacity={0.06}
              stroke={CORES[i]}
              strokeWidth={1.5}
              strokeDasharray={circunferencia}
              initial={{ strokeDashoffset: circunferencia }}
              whileInView={{ strokeDashoffset: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.1, delay: i * 0.25, ease: "easeOut" }}
            />
            <motion.text
              x={120}
              y={120 - r + 14}
              textAnchor="middle"
              fill={CORES[i]}
              fontSize={11}
              fontWeight={800}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.25 }}
            >
              {c.nome}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}
