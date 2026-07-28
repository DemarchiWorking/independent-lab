"use client";

import { motion } from "framer-motion";
import { listContainer, listItem } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { EVENTOS } from "@/features/gamificacao/engine";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import type { EventoComProgresso } from "./actions";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Card de UM evento — barra de progresso vem do servidor, nunca de
 *  `useState` local (mesma regra de `trabalhosAceitos`/`nosDesbloqueados`). */
function EventoCard({ item }: { item: EventoComProgresso }) {
  const { evento, status, percentual, concluido } = item;
  const objetivoLabel = EVENTOS[evento.objetivo as keyof typeof EVENTOS]?.label ?? evento.objetivo;

  return (
    <motion.div
      variants={listItem}
      className="rounded-md bg-panel p-4 text-ink shadow-hard"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-orange">
            <Icon name={concluido ? "check" : "bolt"} size={16} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-coral-dark">{evento.titulo}</h3>
            <p className="font-pixel text-[9px] uppercase tracking-wide text-[#5b6b86]">
              {status === "agendado"
                ? `Começa em ${formatarData(evento.inicioEm)}`
                : `Até ${formatarData(evento.fimEm)}`}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[#33415c]">{evento.descricao}</p>

      <p className="mt-2 font-pixel text-[9px] uppercase text-[#5b6b86]">
        Objetivo: {objetivoLabel} · meta {evento.meta}
      </p>

      {status === "ativo" ? (
        <div className="mt-3">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e6eaf1]">
            <div
              className={concluido ? "h-full bg-teal" : "h-full bg-orange"}
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p className="mt-1 font-pixel text-[9px] text-[#5b6b86]">
            {item.progresso?.contagem ?? 0} / {evento.meta}
            {concluido ? " — concluído!" : ""}
          </p>
        </div>
      ) : null}

      <p className="mt-2 font-pixel text-[10px] text-teal">
        Recompensa: {evento.recompensa.xp} XP
        {evento.recompensa.moeda > 0 ? ` · 🪙 ${evento.recompensa.moeda}` : ""}
        {evento.recompensa.atributo
          ? ` · +${evento.recompensa.atributo.ganho} ${ATRIBUTO_LABEL[evento.recompensa.atributo.chave]}`
          : ""}
      </p>
    </motion.div>
  );
}

/** Tela do jogador: campanhas ativas/agendadas, com o progresso DELE em
 *  cada uma. Relógio lazy — o servidor já filtrou/ordenou; aqui só render. */
export function EventosScreen({ eventos }: { eventos: EventoComProgresso[] }) {
  if (eventos.length === 0) {
    return (
      <div className="grid h-full place-items-center text-center text-sm text-muted">
        <div>
          <Icon name="calendar" size={28} />
          <p className="mt-2">Nenhum evento no momento.</p>
          <p className="text-xs text-[#5b6b86]">Volte em breve — campanhas aparecem aqui assim que abrem.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={listContainer}
      initial="initial"
      animate="enter"
      className="grid h-full grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2"
    >
      {eventos.map((item) => (
        <EventoCard key={item.evento.id} item={item} />
      ))}
    </motion.div>
  );
}
