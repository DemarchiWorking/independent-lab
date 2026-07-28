"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { QuarteiraoIso } from "./QuarteiraoIso";
import { SEGMENTOS } from "./segmentos";
import { DEGRAUS } from "@/features/onboarding/scoring";
import { ActionButton } from "@/components/ui/ActionButton";
import { useRecompensa } from "@/features/gamificacao/RecompensaContext";
import type { Endereco, MapaView, NegocioResumo } from "@/lib/db/types";

interface MapaScreenProps {
  mapa: MapaView;
  endereco: Endereco;
  meuTenantId: string;
}

/** Mundo navegável: cidade → bairro → quarteirões isométricos, com o lote do
 *  jogador em destaque e o detalhe do negócio selecionado. */
export function MapaScreen({ mapa, endereco, meuTenantId }: MapaScreenProps) {
  const [cidadeSlug, setCidadeSlug] = useState(endereco.cidadeSlug);
  const [bairroSlug, setBairroSlug] = useState(endereco.bairroSlug);
  const [sel, setSel] = useState<{ q: string; lote: number } | null>({
    q: endereco.quarteiraoId,
    lote: endereco.lote,
  });
  const [parceriaCom, setParceriaCom] = useState<Set<string>>(new Set());
  const { disparar, pendente } = useRecompensa();

  const cidade =
    mapa.cidades.find((c) => c.slug === cidadeSlug) ?? mapa.cidades[0];
  const bairro =
    cidade?.bairros.find((b) => b.slug === bairroSlug) ?? cidade?.bairros[0];

  const selecionado: NegocioResumo | null =
    (sel &&
      bairro?.quarteiroes
        .find((q) => q.id === sel.q)
        ?.lotes.find((l) => l.numero === sel.lote)?.negocio) ||
    null;

  const trocarCidade = (slug: string) => {
    setCidadeSlug(slug);
    const c = mapa.cidades.find((x) => x.slug === slug);
    setBairroSlug(c?.bairros[0]?.slug ?? "");
    setSel(null);
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden text-ink">
      {/* seletor de cidade */}
      <div className="flex flex-wrap gap-1.5">
        {mapa.cidades.map((c) => {
          const ativo = c.slug === cidade?.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => trocarCidade(c.slug)}
              className={cn(
                "flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold",
                ativo ? "bg-orange text-ink" : "bg-card2 text-muted",
              )}
            >
              {c.prioritaria ? <Icon name="star" size={11} /> : null}
              {c.nome}
            </button>
          );
        })}
      </div>

      {/* seletor de bairro */}
      {cidade && cidade.bairros.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {cidade.bairros.map((b) => {
            const ativo = b.slug === bairro?.slug;
            return (
              <button
                key={b.slug}
                type="button"
                onClick={() => {
                  setBairroSlug(b.slug);
                  setSel(null);
                }}
                className={cn(
                  "rounded-pill px-2.5 py-1 text-[11px] font-bold",
                  ativo ? "bg-teal text-ink" : "bg-card2 text-muted",
                )}
              >
                {b.nome}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[1fr_220px]">
        {/* quarteirões isométricos */}
        <div className="min-h-0 overflow-auto rounded-md bg-card2/50 p-3">
          {bairro && bairro.quarteiroes.length > 0 ? (
            <div className="flex flex-wrap items-start gap-6">
              {bairro.quarteiroes.map((q) => (
                <QuarteiraoIso
                  key={q.id}
                  quarteirao={q}
                  meuTenantId={meuTenantId}
                  selecionadoLote={sel?.q === q.id ? sel.lote : null}
                  onSelecionar={(lote) => setSel({ q: q.id, lote })}
                />
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-xs text-muted">
              Nenhum quarteirão ainda neste bairro.
            </p>
          )}
        </div>

        {/* detalhe do selecionado */}
        <AnimatePresence mode="wait">
          <motion.aside
            key={selecionado?.id ?? "vazio"}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={springSnappy}
            className="rounded-md bg-panel p-3 text-ink"
          >
            {selecionado ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-sm text-ink",
                      SEGMENTOS[selecionado.segmento].cor,
                    )}
                  >
                    <Icon
                      name={SEGMENTOS[selecionado.segmento].icon}
                      size={18}
                    />
                  </span>
                  <div className="leading-tight">
                    <b className="block text-sm">{selecionado.nome}</b>
                    <small className="text-[11px] text-[#5b6b86]">
                      {SEGMENTOS[selecionado.segmento].label}
                    </small>
                  </div>
                </div>
                <dl className="space-y-1 text-[11px]">
                  <Linha rotulo="Nível" valor={`Nv ${selecionado.nivel}`} />
                  <Linha
                    rotulo="Degrau"
                    valor={DEGRAUS[selecionado.degrauAtual]?.nome ?? "—"}
                  />
                </dl>
                {selecionado.id === meuTenantId ? (
                  <p className="mt-2 rounded-sm bg-teal/15 px-2 py-1 font-pixel text-[8px] uppercase text-teal">
                    Sua sede
                  </p>
                ) : parceriaCom.has(selecionado.id) ? (
                  <p className="mt-2 rounded-sm bg-green/15 px-2 py-1 text-[11px] font-bold text-[#166534]">
                    Parceria formada ✓
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <p className="mb-0.5 text-[11px] text-[#5b6b86]">
                      Vizinho de negócio — candidato a parceria.
                    </p>
                    <Link
                      href={`/world/visitar/${selecionado.id}`}
                      className="flex items-center justify-center gap-1.5 rounded-md bg-card2 px-3 py-2.5 text-xs font-extrabold text-ink"
                    >
                      <Icon name="home" size={14} />
                      Visitar sede
                    </Link>
                    <ActionButton
                      icon="network"
                      disabled={pendente}
                      onClick={() => {
                        disparar("parceria_formada");
                        setParceriaCom((s) => new Set(s).add(selecionado.id));
                      }}
                    >
                      {pendente ? "Formando…" : "Formar parceria"}
                    </ActionButton>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted">
                Clique numa sede para ver os detalhes.
              </p>
            )}
          </motion.aside>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#5b6b86]">{rotulo}</dt>
      <dd className="font-bold">{valor}</dd>
    </div>
  );
}
