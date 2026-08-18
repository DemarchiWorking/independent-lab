"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable, springSnappy } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { ATRIBUTO_LABEL, ATRIBUTO_TEXT_CLASS } from "@/lib/atributos";
import { escolherNoCapitulo } from "./actions";
import { rotuloDeTempo } from "./relogio";
import type { Capitulo, Escolha, TomEscolha } from "./tipos";

/**
 * A carta de história — o momento em que o jogo fala com o jogador.
 *
 * Visual de "carta que chegou", não de modal de sistema: tem remetente, tem
 * data, e as opções mostram o custo ANTES de clicar. O jogador precisa poder
 * decidir informado — escolha às cegas não ensina nada sobre o negócio dele.
 *
 * `fixed inset-0` (overlay de página inteira), não bloco no fluxo normal —
 * achado real em celular (relato do fundador, docs/PROXIMA-TAREFA.md Tarefa
 * D): `CapituloGate` é montado ANTES/fora do `<GameShell>` em `/hub` e
 * `/world` (ver os `page.tsx`), então como bloco em fluxo ele empurrava o
 * canvas do World inteiro para baixo da dobra numa tela de celular — o
 * jogador via só o card, sem nenhuma pista de que dava pra rolar até o
 * jogo. Como overlay fixo e centralizado, com `max-h` + scroll interno
 * próprio, ele nunca depende da altura da viewport: aparece por cima,
 * sempre visível, em qualquer tamanho de tela. Não reaproveita
 * `RibbonPanel` de propósito: lá o `absolute inset-0` é relativo à janela
 * do jogo (dentro do `<GameShell>`) — aqui o gate precisa cobrir a
 * PÁGINA inteira, incluindo fora do `<GameShell>`.
 */

const CORES_TOM: Record<TomEscolha, string> = {
  beneficio: "border-green/60 hover:bg-green/10",
  risco: "border-orange/60 hover:bg-orange/10",
  neutro: "border-line hover:bg-card2",
};

const ICONE_TOM: Record<TomEscolha, "check" | "bolt" | "chevron"> = {
  beneficio: "check",
  risco: "bolt",
  neutro: "chevron",
};

export function CapituloCard({
  capitulo,
  diaDoNegocio,
  aoFechar,
}: {
  capitulo: Capitulo;
  diaDoNegocio: number;
  /** chamado quando o jogador confirma que leu o desfecho — ver `CapituloGate` */
  aoFechar?: () => void;
}) {
  const router = useRouter();
  const [pendente, setPendente] = useState(false);
  const [desfecho, setDesfecho] = useState<string | null>(null);
  const [documento, setDocumento] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * De propósito, SEM `useTransition`/`startTransition` aqui.
   *
   * `escolherNoCapitulo` chama `revalidatePath("/hub"|"/world"|"/painel")` —
   * o Next.js embute uma árvore RSC nova NA PRÓPRIA resposta da Server
   * Action. Se `setDesfecho` estivesse dentro de uma transição, ele vira uma
   * atualização de baixa prioridade JUNTO com a reconciliação dessa árvore —
   * e se essa reconciliação demorar (ela é grande: hub+GameShell inteiros),
   * o `desfecho` fica represado e nunca chega a pintar, mesmo a resposta já
   * tendo voltado com sucesso do servidor (bug real, achado em runtime).
   * `setState` fora de transição commita assim que a promise resolve —
   * independente do que o Next fizer com o resto da árvore em segundo plano.
   */
  const escolher = async (escolha: Escolha) => {
    setErro(null);
    setPendente(true);
    const r = await escolherNoCapitulo(capitulo.id, escolha.id);
    setPendente(false);
    if (r.ok) {
      // NÃO chama router.refresh() aqui: o servidor já marca este capítulo
      // como resolvido, então um refresh imediato reavalia `capituloAtual()`
      // como null e o React desmontaria este card antes do jogador ler o
      // desfecho. O refresh só acontece quando ele clica "Continuar" —
      // mesmo princípio do RecompensaProvider (toast sobrevive ao refresh
      // porque não depende do dado do servidor para existir).
      setDesfecho(r.desfecho ?? null);
      setDocumento(r.documento ?? null);
    } else {
      setErro(r.erro ?? "Não foi possível concluir.");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springSnappy}
    >
      <div className="absolute inset-0 bg-black/55" />
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSnappy}
        role="dialog"
        aria-modal="true"
        aria-label={`Capítulo: ${capitulo.titulo}`}
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-md bg-panel p-4 pt-5 text-ink shadow-modal"
      >
        <span className="clip-ribbon absolute -left-1.5 -top-3 rounded-sm bg-coral px-4 py-1.5 text-[13px] font-extrabold text-white shadow-[0_3px_0] shadow-coral-dark">
          {rotuloDeTempo(diaDoNegocio)}
        </span>

        <div className="mt-3">
          <p className="font-pixel text-[8px] uppercase tracking-wide text-[#5b6b86]">
            {capitulo.remetente}
          </p>
          <h2 className="mt-1 text-base font-extrabold leading-tight">
            {capitulo.titulo}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#33415c]">
            {capitulo.narrativa}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {desfecho ? (
            <motion.div
              key="desfecho"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-sm bg-[#f1f4f9] p-3"
            >
              <p className="text-[13px] font-bold leading-relaxed text-ink">
                {desfecho}
              </p>
              {documento ? (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-teal">
                  <Icon name="file" size={13} />
                  Documento liberado no seu acervo: {documento}
                </p>
              ) : null}
              <button
                type="button"
                {...pressable}
                onClick={() => {
                  // sincroniza o resto da tela (HUD, moeda, XP) e só então some
                  // — a ordem importa pouco aqui porque `aoFechar` já tira este
                  // card da árvore por estado local, imune ao refresh alheio
                  router.refresh();
                  aoFechar?.();
                }}
                className="mt-3 w-full rounded-md bg-orange px-3 py-2 text-center text-[12px] font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
              >
                Continuar
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="escolhas"
              variants={listContainer}
              initial="initial"
              animate="enter"
              exit={{ opacity: 0 }}
              className="mt-3 flex flex-col gap-2"
            >
              {capitulo.escolhas.map((e) => (
                <motion.button
                  key={e.id}
                  variants={listItem}
                  {...(pendente ? {} : pressable)}
                  type="button"
                  disabled={pendente}
                  onClick={() => escolher(e)}
                  className={cn(
                    "rounded-md border-2 bg-white p-2.5 text-left transition-colors disabled:opacity-60",
                    CORES_TOM[e.tom],
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon name={ICONE_TOM[e.tom]} size={14} />
                    <b className="text-[13px]">{e.rotulo}</b>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#5b6b86]">
                    {e.descricao}
                  </span>
                  <CustoDaEscolha escolha={e} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {erro ? (
          <p className="mt-2 rounded-sm bg-coral/15 px-2.5 py-1.5 text-[11px] font-bold text-coral-dark">
            {erro}
          </p>
        ) : null}
      </motion.section>
    </motion.div>
  );
}

/** Mostra o preço da decisão antes do clique — nada de escolha às cegas. */
function CustoDaEscolha({ escolha }: { escolha: Escolha }) {
  const { xp, moeda, atributos, documento } = escolha.efeito;
  const partes: React.ReactNode[] = [];

  if (xp) partes.push(<span key="xp" className="text-[#166534]">+{xp} XP</span>);
  if (moeda) {
    partes.push(
      <span key="m" className={moeda < 0 ? "text-coral-dark" : "text-teal"}>
        {moeda < 0 ? "−" : "+"}🪙 {Math.abs(moeda)}
      </span>,
    );
  }
  for (const [chave, v] of Object.entries(atributos ?? {})) {
    if (!v) continue;
    const k = chave as keyof typeof ATRIBUTO_LABEL;
    partes.push(
      <span key={chave} className={ATRIBUTO_TEXT_CLASS[k]}>
        {v > 0 ? "+" : "−"}
        {Math.abs(v)} {ATRIBUTO_LABEL[k]}
      </span>,
    );
  }
  if (documento) {
    partes.push(<span key="doc" className="text-teal">📄 documento</span>);
  }

  if (partes.length === 0) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold">
      {partes}
    </span>
  );
}
