"use client";

import { motion } from "framer-motion";

const TENANTS = [
  { x: 30, label: "Radiz" },
  { x: 90, label: "Vitalys" },
  { x: 150, label: "TecNorte" },
  { x: 210, label: "+ milhares" },
] as const;

const DB_CENTER = { x: 120, y: 168 };

/** Diagrama de arquitetura multi-tenant: N negócios isolados (caixas em
 *  cima) compartilhando UM banco só (cilindro embaixo), com um cadeado de
 *  RLS no meio do caminho — comunica em 2 segundos o que o parágrafo técnico
 *  leva 3 frases pra explicar. SVG puro, sem lib de diagrama. */
export function MultiTenantDiagram() {
  return (
    <svg viewBox="0 0 240 210" className="mx-auto w-full max-w-[320px]" role="img" aria-label="Diagrama: vários negócios isolados compartilhando um único banco de dados multi-tenant, com RLS no meio">
      {/* linhas de conexão tenant -> banco */}
      {TENANTS.map((t, i) => (
        <motion.line
          key={t.label}
          x1={t.x}
          y1={34}
          x2={DB_CENTER.x}
          y2={DB_CENTER.y - 18}
          stroke="#8fa6ff"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.6 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, delay: 0.15 * i }}
        />
      ))}

      {/* caixas dos tenants */}
      {TENANTS.map((t, i) => (
        <motion.g
          key={t.label}
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.1 * i }}
        >
          <rect x={t.x - 24} y={12} width={48} height={22} rx={5} fill="#141d33" stroke="#6b8cff" strokeWidth={1.2} />
          <text x={t.x} y={26.5} textAnchor="middle" fill="#eaf2ff" fontSize={8} fontWeight={700}>
            {t.label}
          </text>
        </motion.g>
      ))}

      {/* cadeado RLS no meio do caminho */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <circle cx={120} cy={82} r={16} fill="#0d1424" stroke="#00D4C8" strokeWidth={1.5} />
        <path d="M114 84h12v7h-12z" fill="none" stroke="#00D4C8" strokeWidth={1.4} />
        <path d="M116 84v-3a4 4 0 018 0v3" fill="none" stroke="#00D4C8" strokeWidth={1.4} />
        <text x={120} y={106} textAnchor="middle" fill="#00D4C8" fontSize={7.5} fontWeight={800} letterSpacing={0.5}>
          RLS
        </text>
      </motion.g>

      {/* banco (cilindro) */}
      <motion.g
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <ellipse cx={DB_CENTER.x} cy={DB_CENTER.y - 22} rx={38} ry={10} fill="#1a2440" stroke="#F59E0B" strokeWidth={1.4} />
        <path
          d={`M${DB_CENTER.x - 38} ${DB_CENTER.y - 22} v28 a38 10 0 0 0 76 0 v-28`}
          fill="#1a2440"
          stroke="#F59E0B"
          strokeWidth={1.4}
        />
        <ellipse cx={DB_CENTER.x} cy={DB_CENTER.y + 6} rx={38} ry={10} fill="none" stroke="#F59E0B" strokeWidth={1} opacity={0.5} />
        <text x={DB_CENTER.x} y={DB_CENTER.y - 5} textAnchor="middle" fill="#F59E0B" fontSize={9} fontWeight={800}>
          1 banco só
        </text>
      </motion.g>
    </svg>
  );
}
