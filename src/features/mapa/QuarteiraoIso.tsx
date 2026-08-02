"use client";

import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { IsoLot } from "@/components/ui/IsoLot";
import { SEGMENTOS } from "./segmentos";
import type { QuarteiraoView } from "@/lib/db/types";

const TILE_W = 88;
const TILE_H = 44;
const COLS = 4;
const ROWS = 2;

// bounding box do bloco isométrico (2×4 losangos)
const OFFSET_X = (ROWS - 1) * (TILE_W / 2);
const LARGURA = (COLS + ROWS - 1) * (TILE_W / 2) + TILE_W;
const ALTURA = (COLS + ROWS - 1) * (TILE_H / 2) + TILE_H;

/** Renderiza um quarteirão como um bloco isométrico de 8 lotes. */
export function QuarteiraoIso({
  quarteirao,
  meuTenantId,
  selecionadoLote,
  onSelecionar,
}: {
  quarteirao: QuarteiraoView;
  meuTenantId: string;
  selecionadoLote: number | null;
  onSelecionar: (lote: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springSnappy}
      className="shrink-0"
    >
      <div
        className="relative mx-auto"
        style={{ width: LARGURA, height: ALTURA }}
      >
        {quarteirao.lotes.map((lote, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const x = (col - row) * (TILE_W / 2) + OFFSET_X;
          const y = (col + row) * (TILE_H / 2);
          const seg = lote.negocio
            ? SEGMENTOS[lote.negocio.segmento]
            : undefined;
          return (
            <IsoLot
              key={lote.numero}
              x={x}
              y={y}
              w={TILE_W}
              h={TILE_H}
              numero={lote.numero}
              ocupado={Boolean(lote.negocio)}
              cor={seg?.cor}
              icon={seg?.icon}
              ehJogador={lote.negocio?.id === meuTenantId}
              selecionado={selecionadoLote === lote.numero}
              tier={lote.negocio?.degrauAtual}
              onClick={() => lote.negocio && onSelecionar(lote.numero)}
            />
          );
        })}
      </div>
      <p className="mt-1 text-center font-pixel text-[8px] uppercase text-muted">
        {quarteirao.nome}
      </p>
    </motion.div>
  );
}
