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
  // Achado 2026-08-25 (feedback ao vivo): o bloco isométrico tem tamanho
  // fixo em pixel (308×154) — cabia sem folga em mobile, e dois
  // quarteirões lado a lado forçavam rolagem horizontal. Escala 85% só até
  // o breakpoint `sm`, via wrapper com o tamanho JÁ REDUZIDO (pra
  // `flex-wrap` do container pai medir o espaço certo) + classe Tailwind
  // de `scale` no conteúdo interno — nunca `style` inline pra isso, senão
  // a responsividade do `sm:` não teria como vencer (inline sempre ganha
  // de classe). `TILE_W`/`TILE_H`/a matemática isométrica não mudaram,
  // só o desenho final fica menor.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springSnappy}
      className="w-[262px] h-[131px] shrink-0 sm:h-[154px] sm:w-[308px]"
    >
      <div
        className="relative mx-auto origin-top-left scale-[0.85] sm:scale-100"
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
