"use client";

import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { Icon } from "@/components/ui/Icon";
import type { EventoComProgresso } from "@/features/eventos-globais/actions";
import type { Missao } from "@/features/gamificacao/missoes";
import type { SolicitacaoContato } from "@/lib/db/types";

interface CelularPanelProps {
  open: boolean;
  onClose: () => void;
  mensagens: SolicitacaoContato[];
  eventos: EventoComProgresso[];
  missao: Missao | null;
}

/**
 * "Celular" do jogador — agregador de notificações do que já existe no
 * sistema, numa moldura de telefone. Deliberadamente **não** é uma fonte
 * de dados nova: junta mensagens da vitrine pública (`GH-GROW-01`),
 * campanhas ativas (Épico 11) e a missão atual. Se um dia virar canal
 * próprio, aí sim ganha persistência.
 */
export function CelularPanel({
  open,
  onClose,
  mensagens,
  eventos,
  missao,
}: CelularPanelProps) {
  const total = mensagens.length + eventos.length + (missao ? 1 : 0);

  return (
    <RibbonPanel title="Celular" open={open} onClose={onClose} className="max-w-sm">
      <div className="mx-auto w-full max-w-[280px] rounded-[20px] border-4 border-ink bg-night p-2.5 shadow-modal">
        {/* "notch" — só enfeite, deixa claro que é um celular */}
        <div className="mx-auto mb-2 h-1 w-12 rounded-pill bg-white/25" aria-hidden />

        <div className="max-h-[300px] space-y-1.5 overflow-auto">
          {missao ? (
            <Notificacao
              icon="star"
              titulo="Missão atual"
              corpo={missao.titulo}
              cor="text-orange"
            />
          ) : null}

          {eventos.map((e) => (
            <Notificacao
              key={e.evento.id}
              icon="calendar"
              titulo={e.evento.titulo}
              corpo={`${e.progresso?.contagem ?? 0}/${e.evento.meta} · campanha ativa`}
              cor="text-teal"
            />
          ))}

          {mensagens.map((m) => (
            <Notificacao
              key={m.id}
              icon="users"
              titulo={m.nomeRemetente}
              corpo={m.mensagem}
              cor="text-green"
            />
          ))}

          {total === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] text-muted">
              Sem notificações por enquanto.
            </p>
          ) : null}
        </div>

        <p className="mt-2 text-center text-[9px] text-muted">
          Mensagens da sua página pública aparecem aqui.
        </p>
      </div>
    </RibbonPanel>
  );
}

function Notificacao({
  icon,
  titulo,
  corpo,
  cor,
}: {
  icon: "star" | "calendar" | "users";
  titulo: string;
  corpo: string;
  cor: string;
}) {
  return (
    <div className="flex gap-2 rounded-md bg-card2 p-2">
      <span className={`mt-0.5 shrink-0 ${cor}`}>
        <Icon name={icon} size={14} />
      </span>
      <div className="min-w-0 leading-tight">
        <b className="block truncate text-[11px] text-white">{titulo}</b>
        <span className="line-clamp-2 text-[10px] text-muted">{corpo}</span>
      </div>
    </div>
  );
}
