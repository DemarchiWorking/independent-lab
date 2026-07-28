"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { ATRIBUTO_BG_CLASS, type Atributos } from "@/lib/atributos";
import { SEGMENTOS } from "@/features/mapa/segmentos";
import {
  compararComBenchmark,
  eixoParaFocar,
  mensagemFoco,
} from "@/features/mapa/benchmark";
import type { BenchmarkBairro, DestaqueBairro, Negocio } from "@/lib/db/types";

interface MercadoScreenProps {
  atributos: Atributos;
  benchmark: BenchmarkBairro;
  destaque: DestaqueBairro | null;
  vizinhos: Negocio[];
  bairro: string;
}

/**
 * Mercado (GH-MAPA-04 + GH-GROW-04 numa tela só) — posição do negócio no
 * bairro, **nunca um ranking humilhante**. Reusa integralmente a lógica
 * pura já testada em `features/mapa/benchmark.ts`; esta tela só desenha.
 *
 * Diferença deliberada do print original do Startup Panic ("rival 96% ×
 * você 3%"): comparamos com a MÉDIA anonimizada do bairro e sempre
 * apontamos uma ação concreta — nenhum negócio é exibido negativamente.
 */
export function MercadoScreen({
  atributos,
  benchmark,
  destaque,
  vizinhos,
  bairro,
}: MercadoScreenProps) {
  const comparados = compararComBenchmark(atributos, benchmark);
  const foco = eixoParaFocar(comparados);
  const amostraSuficiente = benchmark.totalNegocios > 1;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto text-ink">
      <section className="rounded-md bg-[#f7f9fc] p-3">
        <h3 className="mb-0.5 text-sm font-extrabold text-coral-dark">
          Sua posição no bairro
        </h3>
        <p className="mb-2.5 text-[11px] text-[#5b6b86]">
          {amostraSuficiente
            ? `Média anonimizada entre ${benchmark.totalNegocios} negócios de ${bairro}. Nunca um ranking — só contexto para decidir onde investir.`
            : `Ainda não há vizinhos suficientes em ${bairro} para uma média confiável. Convide um vizinho para o ecossistema.`}
        </p>

        {amostraSuficiente ? (
          <>
            <ul className="space-y-2">
              {comparados.map((c) => {
                const pico = Math.max(c.seuValor, c.media, 1);
                return (
                  <li key={c.chave}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]">
                      <b>{c.label}</b>
                      <span className="tabular-nums text-[#5b6b86]">
                        você {c.seuValor} · média {Math.round(c.media)}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-pill bg-[#dbe3f0]">
                      <i
                        className={cn("absolute inset-y-0 left-0 block", ATRIBUTO_BG_CLASS[c.chave])}
                        style={{ width: `${(c.seuValor / pico) * 100}%` }}
                      />
                      {/* marcador da média — referência visual, não competição */}
                      <span
                        className="absolute inset-y-0 w-0.5 bg-ink/60"
                        style={{ left: `${(c.media / pico) * 100}%` }}
                        aria-hidden
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2.5 rounded-sm bg-teal/15 px-2.5 py-1.5 text-[11px] font-bold text-teal">
              {foco
                ? mensagemFoco(foco)
                : "Você está na média ou acima em todos os eixos do seu bairro. 🎉"}
            </p>
          </>
        ) : null}
      </section>

      {destaque ? (
        <section className="rounded-md bg-[#f7f9fc] p-3">
          <h3 className="mb-0.5 text-sm font-extrabold text-coral-dark">
            Destaque do bairro
          </h3>
          <p className="text-[11px] text-[#5b6b86]">
            <b className="text-ink">{destaque.nome}</b> foi quem mais evoluiu nos
            últimos 30 dias. Destaque por <b>evolução</b>, não por tamanho — mês
            que vem pode ser você.
          </p>
        </section>
      ) : null}

      <section className="rounded-md bg-[#f7f9fc] p-3">
        <h3 className="mb-2 text-sm font-extrabold text-coral-dark">
          Quem mais está no seu quarteirão
        </h3>
        {vizinhos.length > 0 ? (
          <motion.ul
            variants={listContainer}
            initial="initial"
            animate="enter"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
          >
            {vizinhos.map((v) => (
              <motion.li
                key={v.id}
                variants={listItem}
                className="flex items-center gap-2 rounded-sm bg-white px-2.5 py-1.5"
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-sm text-ink",
                    SEGMENTOS[v.segmento].cor,
                  )}
                >
                  <Icon name={SEGMENTOS[v.segmento].icon} size={14} />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <b className="block truncate text-[11px]">{v.nome}</b>
                  <small className="text-[10px] text-[#5b6b86]">
                    {SEGMENTOS[v.segmento].label}
                  </small>
                </span>
                <span className="shrink-0 font-pixel text-[7px] uppercase text-teal">
                  Nv {v.nivel}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="text-[11px] text-[#5b6b86]">
            Você é o primeiro do quarteirão. Convide um vizinho pelo Painel.
          </p>
        )}
      </section>
    </div>
  );
}
