"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import { cumprirContrato } from "./actions";
import type { SituacaoContrato } from "./tipos";

/**
 * Quadro de contratos — o trabalho da semana. Fica sempre a um clique do hub
 * (menu lateral) porque é aqui que o jogador volta toda segunda para ganhar
 * moeda e, de quebra, fazer o que realmente o faz vender mais.
 */
export function ContratosScreen({
  situacoes,
  onIr,
}: {
  situacoes: readonly SituacaoContrato[];
  /** abre uma tela do shell (ex.: Equipe de IA) a partir do contrato */
  onIr?: (view: "equipe-ia" | "marketplace" | "parcerias" | "mapa" | "sede") => void;
}) {
  const semanais = situacoes.filter((s) => s.contrato.cadencia === "semanal");
  const jornada = situacoes.filter((s) => s.contrato.cadencia !== "semanal");
  const feitos = semanais.filter((s) => s.status === "concluido").length;
  const moedaAberta = semanais
    .filter((s) => s.status !== "concluido")
    .reduce((soma, s) => soma + s.contrato.recompensa.moeda, 0);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="rounded-md bg-card2 p-3 text-white">
        <p className="font-pixel text-[8px] uppercase tracking-wide text-teal">
          Contratos da semana
        </p>
        <p className="mt-1 text-sm font-bold">
          {feitos} de {semanais.length} cumpridos
          {moedaAberta > 0 ? ` · 🪙 ${moedaAberta} ainda disponíveis` : " · semana fechada"}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Renovam toda segunda-feira. Cada um é uma ação que te aproxima de
          vender mais — a moeda é consequência.
        </p>
      </header>

      <motion.ul
        variants={listContainer}
        initial="initial"
        animate="enter"
        className="flex flex-col gap-2"
      >
        {semanais.map((s) => (
          <motion.li key={s.contrato.id} variants={listItem}>
            <CartaContrato situacao={s} onIr={onIr} />
          </motion.li>
        ))}
      </motion.ul>

      {jornada.length > 0 ? (
        <>
          <p className="mt-1 font-pixel text-[8px] uppercase tracking-wide text-teal">
            Jornada
          </p>
          <ul className="flex flex-col gap-2">
            {jornada.map((s) => (
              <li key={s.contrato.id}>
                <CartaContrato situacao={s} onIr={onIr} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function CartaContrato({
  situacao,
  onIr,
}: {
  situacao: SituacaoContrato;
  onIr?: (view: "equipe-ia" | "marketplace" | "parcerias" | "mapa" | "sede") => void;
}) {
  const router = useRouter();
  const { contrato, status } = situacao;
  const [valor, setValor] = useState("");
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ganho, setGanho] = useState<string | null>(null);

  const precisaValor = contrato.verificacao.tipo === "declaradoComValor";
  const concluido = status === "concluido" || ganho !== null;

  /**
   * Sem `useTransition` (mesma razão de `CapituloCard`): a action revalida
   * rotas inteiras, e dentro de uma transição o feedback de sucesso ficaria
   * represado atrás dessa reconciliação grande.
   */
  const cumprir = async () => {
    setErro(null);
    let numero: number | undefined;
    if (contrato.verificacao.tipo === "declaradoComValor") {
      numero = Number(valor);
      if (valor.trim() === "" || !Number.isInteger(numero) || numero < 0) {
        setErro(`Informe um número inteiro em “${contrato.verificacao.rotuloValor}”.`);
        return;
      }
    }
    setPendente(true);
    const r = await cumprirContrato(contrato.id, numero);
    setPendente(false);
    if (!r.ok) {
      setErro(r.erro ?? "Não foi possível concluir.");
      return;
    }
    const partes = [`+${r.ganhoXp} XP`, `+🪙 ${r.ganhoMoeda}`];
    if (r.atributoGanho) partes.push(`+${r.atributoGanho.ganho} ${r.atributoGanho.label}`);
    setGanho(partes.join(" · "));
    router.refresh();
  };

  const destino = contrato.destino;

  return (
    <article
      className={cn(
        "rounded-md border-2 p-3",
        concluido ? "border-green/40 bg-card2/60" : "border-line bg-card2",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm",
            concluido ? "bg-green text-ink" : status === "bloqueado" ? "bg-cat-locked text-white" : "bg-orange text-ink",
          )}
        >
          <Icon name={concluido ? "check" : status === "bloqueado" ? "lock" : "star"} size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <b className="text-sm text-white">{contrato.titulo}</b>
            <span className="rounded-pill bg-white/10 px-2 py-0.5 font-pixel text-[7px] uppercase text-white/80">
              {contrato.entrega === "real" ? "Entrega real" : "No jogo"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{contrato.descricao}</p>
          <p className="mt-1.5 text-[11px] font-bold text-teal">
            🪙 {contrato.recompensa.moeda} · {contrato.recompensa.xp} XP
            {Object.entries(contrato.recompensa.atributos ?? {}).map(([k, v]) => (
              <span key={k} className="ml-2 text-white/80">
                +{v} {ATRIBUTO_LABEL[k as keyof typeof ATRIBUTO_LABEL]}
              </span>
            ))}
          </p>
        </div>
      </div>

      {concluido ? (
        <p className="mt-2 text-[11px] font-bold text-green">
          {ganho ?? "Cumprido"}
          {situacao.valor !== null && situacao.valor !== undefined && !ganho
            ? ` · você informou ${situacao.valor}`
            : ""}
          {situacao.diasParaRenovar !== undefined
            ? ` · renova em ${situacao.diasParaRenovar} dia(s)`
            : ""}
        </p>
      ) : status === "bloqueado" ? (
        <p className="mt-2 text-[11px] font-bold text-white/70">{situacao.motivo}</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {status === "pendente" ? (
            <p className="text-[11px] font-bold text-orange">{situacao.motivo}</p>
          ) : null}
          {precisaValor && status === "disponivel" ? (
            <label className="flex items-center gap-2 text-[11px] font-bold text-white">
              {contrato.verificacao.tipo === "declaradoComValor"
                ? contrato.verificacao.rotuloValor
                : null}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-24 rounded-sm bg-white px-2 py-1 text-sm text-ink"
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {status === "pendente" && destino?.tipo === "rota" ? (
              <a
                href={destino.href}
                className="inline-flex items-center gap-2 rounded-md bg-orange px-4 py-2.5 text-sm font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
              >
                Publicar oferta
                <Icon name="arrow" size={14} />
              </a>
            ) : (
              <ActionButton
                icon="check"
                fullWidth={false}
                disabled={pendente || status !== "disponivel"}
                onClick={cumprir}
              >
                {pendente ? "Registrando…" : contrato.rotuloAcao}
              </ActionButton>
            )}
            {destino?.tipo === "view" && onIr ? (
              <ActionButton
                variant="ghost"
                fullWidth={false}
                icon="arrow"
                onClick={() => onIr(destino.view)}
              >
                Abrir
              </ActionButton>
            ) : null}
          </div>
        </div>
      )}

      {erro ? (
        <p className="mt-2 rounded-sm bg-coral/15 px-2.5 py-1.5 text-[11px] font-bold text-coral-dark">
          {erro}
        </p>
      ) : null}
    </article>
  );
}
