"use client";

import { AnimatePresence, motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import {
  entregavelDoCargo,
  habilidadesDoCargo,
  NIVEL_MAX_FUNCIONARIO,
} from "@/features/equipe-ia/habilidades";
import { cargoDoAvatar, tenantDoAvatar, type AvatarProximo } from "./engine/proximidade";

const ROTULO_ENTREGAVEL: Record<string, string> = {
  canvas: "Pedir o Modelo de Negócio",
  post: "Pedir um post pronto",
  script: "Pedir o script comercial",
  reel: "Pedir o roteiro de Reels",
};

interface InteracaoNpcProps {
  /** avatares ao alcance — só o primeiro (mais próximo) é oferecido */
  proximos: AvatarProximo[];
  /** `false` na sede de outro tenant: lá a interação é só de leitura + pitch */
  minhaSede: boolean;
  /** nível do agente, quando é um Funcionário de IA desta sede */
  nivelPorCargo?: Record<string, number>;
}

/**
 * Interação por proximidade no World (GH-WORLD-08) — aparece quando o
 * avatar do jogador para ao lado de alguém.
 *
 * Reusa o que já existe em vez de inventar mecânica nova: as habilidades
 * vêm de `equipe-ia/habilidades.ts` e o download usa a mesma rota
 * `/api/entregavel/[tipo]` (que já deriva o tenant da sessão). Na sede de
 * outro negócio a ação vira pitch — você vê o agente trabalhando e pode
 * contratar o seu.
 */
export function InteracaoNpc({ proximos, minhaSede, nivelPorCargo = {} }: InteracaoNpcProps) {
  const alvo = proximos[0] ?? null;
  const cargoId = alvo ? cargoDoAvatar(alvo.id) : null;
  const cargo = cargoId ? cargoPorId(cargoId) : undefined;
  // gente de verdade na sala agora (GH-MULTI-03) — não é NPC nem agente
  const tenantAoVivo = alvo ? tenantDoAvatar(alvo.id) : null;

  return (
    <AnimatePresence>
      {alvo ? (
        <motion.div
          key={alvo.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={springSnappy}
          className="rounded-md bg-panel p-3 text-ink shadow-modal"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-teal/20 text-teal">
              <Icon name={cargo?.icon ?? "users"} size={18} />
            </span>
            <div className="min-w-0 leading-tight">
              <b className="block truncate text-sm">{alvo.nome}</b>
              <small className="text-[10px] text-[#5b6b86]">
                {cargo
                  ? `${cargo.entrega} · Nv ${nivelPorCargo[cargo.id] ?? 1}/${NIVEL_MAX_FUNCIONARIO}`
                  : tenantAoVivo
                    ? "Está online, nesta sala, agora"
                    : "Está bem ao seu lado"}
              </small>
            </div>
          </div>

          {tenantAoVivo ? (
            <VisitanteAoVivo tenantId={tenantAoVivo} nome={alvo.nome} />
          ) : cargo ? (
            minhaSede ? (
              <AcoesDoMeuAgente
                cargoId={cargo.id}
                nivel={nivelPorCargo[cargo.id] ?? 1}
              />
            ) : (
              <p className="text-[11px] leading-relaxed text-[#33415c]">
                Este negócio usa um <b>{cargo.nome}</b> para {cargo.entrega.toLowerCase()}.
                Você pode contratar o seu na aba <b>Equipe de IA</b>.
              </p>
            )
          ) : (
            <p className="text-[11px] text-[#33415c]">
              {minhaSede
                ? "É você mesmo. Aproxime-se de um Funcionário de IA para interagir."
                : "O dono deste negócio. Aproxime-se de um Funcionário de IA para ver o que ele entrega."}
            </p>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Encontro com outro empresário ao vivo — o momento em que o jogo vira
 * networking de verdade. Chegar perto de alguém não pode terminar em
 * "olá": leva para a sede dele, que é onde dá para ver o que ele entrega
 * e abrir conversa de parceria.
 */
function VisitanteAoVivo({ tenantId, nome }: { tenantId: string; nome: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-[#33415c]">
        <b>{nome}</b> está visitando esta sede junto com você agora.
      </p>
      <a
        href={`/world/visitar/${tenantId}`}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2.5 text-xs font-extrabold text-ink"
      >
        <Icon name="home" size={14} />
        Conhecer a sede de {nome}
      </a>
    </div>
  );
}

function AcoesDoMeuAgente({ cargoId, nivel }: { cargoId: string; nivel: number }) {
  const entregavel = entregavelDoCargo(cargoId);
  const habilidades = habilidadesDoCargo(cargoId, nivel);
  const destravadas = habilidades.filter((h) => h.destravada);
  const proxima = habilidades.find((h) => !h.destravada);

  return (
    <div className="space-y-2">
      <ul className="space-y-0.5">
        {destravadas.map((h) => (
          <li key={h.id} className="flex items-center gap-1.5 text-[11px] text-[#33415c]">
            <Icon name="check" size={11} className="shrink-0 text-teal" />
            {h.nome}
          </li>
        ))}
        {proxima ? (
          <li className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <Icon name="lock" size={11} className="shrink-0" />
            {proxima.nome} (nível {proxima.nivelMinimo})
          </li>
        ) : null}
      </ul>

      {entregavel ? (
        <a
          href={`/api/entregavel/${entregavel}`}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2.5 text-xs font-extrabold text-ink"
        >
          <Icon name="file" size={14} />
          {ROTULO_ENTREGAVEL[entregavel] ?? "Pedir entregável"}
        </a>
      ) : null}
    </div>
  );
}
