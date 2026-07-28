"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, springSnappy, pressable } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { IsoFurnitureSlot } from "@/components/ui/IsoFurnitureSlot";
import { AtributosBar } from "@/components/ui/AtributosBar";
import { ATRIBUTO_LABEL, ATRIBUTO_TEXT_CLASS } from "@/lib/atributos";
import { CATALOGO_MOBILIA, itemMobilia, type ItemMobilia } from "./catalogo";
import { nivelSede, proximoNivelSede } from "./niveis";
import {
  comprarMobilia,
  evoluirEquipamento,
  evoluirSede,
  moverMobilia,
} from "./actions";
import {
  bonusTotalNoNivel,
  custoUpgradeMobilia,
  NIVEL_MAX_MOBILIA,
  podeEvoluirMobilia,
} from "./upgrade";
import type { Atributos, ItemMobiliaColocado, Sede } from "@/lib/db/types";

interface SedeScreenProps {
  sede: Sede;
  mobilia: ItemMobiliaColocado[];
  moedaVirtual: number;
  atributos: Atributos;
}

/** Geometria isométrica da sala: mesma projeção 2:1 do mapa regional
 *  (`QuarteiraoIso`), mas com o grid dimensionado pelo nível da sede. */
const TILE_W = 96;
const TILE_H = 48;
const COLS = 4;

/** Modo de interação da sala. `mover` guarda o id do móvel sendo reposicionado. */
type Modo = { tipo: "livre" } | { tipo: "mover"; itemColocadoId: string };

export function SedeScreen({ sede, mobilia, moedaVirtual, atributos }: SedeScreenProps) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [modo, setModo] = useState<Modo>({ tipo: "livre" });
  const [lojaAberta, setLojaAberta] = useState(false);
  const [upgradeAberto, setUpgradeAberto] = useState(false);
  const [equipamentosAberto, setEquipamentosAberto] = useState(false);
  const [slotAlvo, setSlotAlvo] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const nivel = nivelSede(sede.nivel);
  const proximo = proximoNivelSede(sede.nivel);
  const porSlot = new Map(mobilia.map((m) => [m.slot, m]));

  const rows = Math.ceil(nivel.slots / COLS);
  const offsetX = (rows - 1) * (TILE_W / 2);
  const largura = (COLS + rows - 1) * (TILE_W / 2) + TILE_W;
  const altura = (COLS + rows - 1) * (TILE_H / 2) + TILE_H;

  const executar = (fn: () => Promise<{ ok: boolean; erro?: string }>) => {
    setErro(null);
    iniciar(async () => {
      const r = await fn();
      if (r.ok) {
        router.refresh();
      } else {
        setErro(r.erro ?? "Não foi possível concluir.");
      }
    });
  };

  const clicarSlot = (slot: number) => {
    const ocupante = porSlot.get(slot);

    if (modo.tipo === "mover") {
      // segundo clique: destino do movimento
      if (ocupante) {
        setErro("Esse espaço já está ocupado. Escolha um vazio.");
        return;
      }
      const id = modo.itemColocadoId;
      setModo({ tipo: "livre" });
      executar(() => moverMobilia(id, slot));
      return;
    }

    if (ocupante) {
      setModo({ tipo: "mover", itemColocadoId: ocupante.id });
      setErro(null);
    } else {
      setSlotAlvo(slot);
      setLojaAberta(true);
    }
  };

  return (
    <div className="flex h-full flex-col gap-2 text-ink">
      {/* barra de status da sede */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-pill bg-orange px-2.5 py-1 text-[11px] font-extrabold text-ink">
          <Icon name="home" size={13} />
          {nivel.nome}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {nivel.tipo === "propria" ? "Própria" : "Alugada"} · até{" "}
          {nivel.capacidadeFuncionarios} pessoas
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-teal">
          🪙 {moedaVirtual.toLocaleString("pt-BR")}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {mobilia.length}/{nivel.slots} espaços
        </span>
      </div>

      {/* dica de modo mover */}
      <AnimatePresence>
        {modo.tipo === "mover" ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-2 rounded-sm bg-orange/20 px-2.5 py-1.5 text-[11px] font-bold text-orange"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="move" size={13} />
              Escolha um espaço vazio para mover o móvel.
            </span>
            <button
              type="button"
              onClick={() => setModo({ tipo: "livre" })}
              className="rounded-sm bg-orange/30 px-2 py-0.5"
            >
              Cancelar
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {erro ? (
        <p className="rounded-sm bg-coral/15 px-2.5 py-1.5 text-[11px] font-bold text-coral-dark">
          {erro}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[1fr_190px]">
        {/* A SALA — cena isométrica real */}
        <div className="relative min-h-0 overflow-auto rounded-md bg-gradient-to-b from-[#3a938a] via-[#2e7d74] to-[#c79b6e] p-4">
          <div
            className="relative mx-auto"
            style={{ width: largura, height: altura }}
          >
            {Array.from({ length: nivel.slots }).map((_, slot) => {
              const row = Math.floor(slot / COLS);
              const col = slot % COLS;
              const x = (col - row) * (TILE_W / 2) + offsetX;
              const y = (col + row) * (TILE_H / 2);
              const ocupante = porSlot.get(slot);
              const item = ocupante ? itemMobilia(ocupante.itemId) : undefined;
              return (
                <IsoFurnitureSlot
                  key={slot}
                  x={x}
                  y={y}
                  w={TILE_W}
                  h={TILE_H}
                  slot={slot}
                  ocupado={Boolean(ocupante)}
                  cor={item?.cor}
                  icon={item?.icon}
                  emMovimento={
                    modo.tipo === "mover" && modo.itemColocadoId === ocupante?.id
                  }
                  onClick={() => clicarSlot(slot)}
                />
              );
            })}
          </div>
        </div>

        {/* painel lateral de ações */}
        <aside className="flex flex-col gap-2 rounded-md bg-panel p-3">
          <div>
            <b className="block text-sm">{nivel.nome}</b>
            <p className="mt-1 text-[11px] leading-relaxed text-[#33415c]">
              {nivel.descricao}
            </p>
          </div>

          <dl className="space-y-1 text-[11px]">
            <Linha rotulo="Tipo" valor={nivel.tipo === "propria" ? "Própria" : "Alugada"} />
            <Linha rotulo="Equipe" valor={`até ${nivel.capacidadeFuncionarios}`} />
            <Linha
              rotulo="Custo mensal"
              valor={nivel.custoMensal > 0 ? `🪙 ${nivel.custoMensal}` : "—"}
            />
          </dl>

          <div className="border-t border-[#e6ebf3] pt-2">
            <b className="mb-1.5 block text-[11px] text-[#5b6b86]">
              Economia de atributos
            </b>
            <AtributosBar atributos={atributos} tom="light" />
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Link
              href="/world"
              className="flex items-center justify-center gap-1.5 rounded-md bg-teal px-3 py-2.5 text-xs font-extrabold text-ink shadow-[0_3px_0] shadow-[#00a89e]"
            >
              <Icon name="home" size={15} />
              Entrar na sede (World)
            </Link>
            <ActionButton
              icon="grid"
              variant="ghost"
              onClick={() => {
                setSlotAlvo(null);
                setLojaAberta(true);
              }}
            >
              Loja de equipamentos
            </ActionButton>
            {mobilia.length > 0 ? (
              <ActionButton
                icon="bolt"
                variant="ghost"
                onClick={() => setEquipamentosAberto(true)}
              >
                Melhorar equipamentos
              </ActionButton>
            ) : null}
            {proximo ? (
              <ActionButton icon="arrow" onClick={() => setUpgradeAberto(true)}>
                Melhorar sede
              </ActionButton>
            ) : (
              <ActionButton icon="star" variant="ghost" disabled>
                Sede no nível máximo
              </ActionButton>
            )}
          </div>
        </aside>
      </div>

      {/* MELHORAR EQUIPAMENTOS — upgrade de nível dos móveis já comprados
          (GH-WORLD-07). Cada nível reaplica o bônus de atributo do item. */}
      <RibbonPanel
        title="Melhorar equipamentos"
        open={equipamentosAberto}
        onClose={() => setEquipamentosAberto(false)}
      >
        <p className="mb-2 text-[11px] text-[#5b6b86]">
          Cada nível reaplica o bônus do equipamento nos atributos do seu
          escritório. Máximo: nível {NIVEL_MAX_MOBILIA}.
        </p>
        <div className="max-h-[300px] space-y-2 overflow-auto">
          {mobilia.map((colocado) => {
            const item = itemMobilia(colocado.itemId);
            if (!item) return null;
            const noMaximo = !podeEvoluirMobilia(colocado.nivel);
            const custo = custoUpgradeMobilia(item, colocado.nivel + 1);
            const caro = moedaVirtual < custo;
            const totalAtual = bonusTotalNoNivel(item, colocado.nivel);

            return (
              <div
                key={colocado.id}
                className="flex items-center gap-2.5 rounded-md bg-[#f1f4f9] p-2.5"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-sm text-ink",
                    item.cor,
                  )}
                >
                  <Icon name={item.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-xs text-ink">
                    {item.nome}{" "}
                    <span className="text-teal">Nv {colocado.nivel}</span>
                  </b>
                  <small className="text-[10px] text-[#5b6b86]">
                    {Object.entries(totalAtual)
                      .map(
                        ([chave, valor]) =>
                          `+${valor} ${ATRIBUTO_LABEL[chave as keyof typeof ATRIBUTO_LABEL]}`,
                      )
                      .join(" · ") || "sem bônus"}
                  </small>
                </div>
                {noMaximo ? (
                  <span className="shrink-0 rounded-sm bg-teal/20 px-1.5 py-0.5 font-pixel text-[7px] uppercase text-teal">
                    Máximo
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pendente || caro}
                    onClick={() => executar(() => evoluirEquipamento(colocado.id))}
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-extrabold",
                      caro
                        ? "cursor-not-allowed bg-[#e6eaf1] text-[#94a3b8]"
                        : "bg-orange text-ink",
                    )}
                  >
                    🪙 {custo}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </RibbonPanel>

      {/* LOJA DE EQUIPAMENTOS */}
      <RibbonPanel
        title="Loja de equipamentos"
        open={lojaAberta}
        onClose={() => setLojaAberta(false)}
      >
        <p className="mb-2 text-[11px] text-[#5b6b86]">
          {slotAlvo === null
            ? "Escolha um item — ele vai para o primeiro espaço livre da sala."
            : `Comprando para o espaço ${slotAlvo + 1}.`}
        </p>
        <motion.div
          variants={listContainer}
          initial="initial"
          animate="enter"
          className="grid max-h-[280px] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3"
        >
          {CATALOGO_MOBILIA.map((item) => {
            const caro = moedaVirtual < item.preco;
            return (
              <motion.button
                key={item.id}
                variants={listItem}
                {...(caro ? {} : pressable)}
                disabled={caro || pendente}
                onClick={() => {
                  const destino =
                    slotAlvo ??
                    Array.from({ length: nivel.slots }).findIndex(
                      (_, s) => !porSlot.has(s),
                    );
                  if (destino < 0) {
                    setErro("Não há espaço livre. Melhore sua sede primeiro.");
                    setLojaAberta(false);
                    return;
                  }
                  setLojaAberta(false);
                  executar(() => comprarMobilia(item.id, destino));
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md p-2.5 text-center transition-colors",
                  caro
                    ? "cursor-not-allowed bg-[#eef1f6] opacity-50"
                    : "bg-[#f1f4f9] hover:bg-[#e6edf7]",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-sm text-ink shadow-hard",
                    item.cor,
                  )}
                >
                  <Icon name={item.icon} size={20} />
                </span>
                <b className="text-[11px] leading-tight">{item.nome}</b>
                <span
                  className={cn(
                    "font-pixel text-[9px]",
                    caro ? "text-coral-dark" : "text-teal",
                  )}
                >
                  🪙 {item.preco}
                </span>
                <BonusMobilia bonus={item.bonus} />
              </motion.button>
            );
          })}
        </motion.div>
      </RibbonPanel>

      {/* MELHORAR SEDE — comparativo atual × próximo */}
      <RibbonPanel
        title="Melhorar sede"
        open={upgradeAberto}
        onClose={() => setUpgradeAberto(false)}
        className="max-w-md"
      >
        {proximo ? (
          <>
            <h3 className="text-sm font-extrabold text-coral-dark">
              {proximo.nome}
            </h3>
            <p className="mb-3 mt-1 text-[11px] leading-relaxed text-[#33415c]">
              {proximo.descricao}
            </p>

            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#5b6b86]">
                  <th className="pb-1 text-left font-normal">Detalhe</th>
                  <th className="pb-1 text-right font-normal">Atual</th>
                  <th className="pb-1 text-right font-normal">Próxima</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                <LinhaComparativo
                  rotulo="Equipe"
                  atual={String(nivel.capacidadeFuncionarios)}
                  proximo={String(proximo.capacidadeFuncionarios)}
                />
                <LinhaComparativo
                  rotulo="Espaços"
                  atual={String(nivel.slots)}
                  proximo={String(proximo.slots)}
                />
                <LinhaComparativo
                  rotulo="Custo mensal"
                  atual={nivel.custoMensal > 0 ? `🪙 ${nivel.custoMensal}` : "—"}
                  proximo={
                    proximo.custoMensal > 0 ? `🪙 ${proximo.custoMensal}` : "—"
                  }
                />
                <LinhaComparativo
                  rotulo="Tipo"
                  atual={nivel.tipo === "propria" ? "Própria" : "Alugada"}
                  proximo={proximo.tipo === "propria" ? "Própria" : "Alugada"}
                />
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between rounded-sm bg-[#f1f4f9] px-2.5 py-2">
              <span className="text-[11px] text-[#5b6b86]">Custo da melhoria</span>
              <b
                className={cn(
                  "text-sm",
                  moedaVirtual < proximo.custoEvolucao ? "text-coral-dark" : "text-teal",
                )}
              >
                🪙 {proximo.custoEvolucao.toLocaleString("pt-BR")}
              </b>
            </div>

            <div className="mt-3 flex gap-2">
              <ActionButton variant="ghost" onClick={() => setUpgradeAberto(false)}>
                Cancelar
              </ActionButton>
              <ActionButton
                icon="arrow"
                disabled={pendente || moedaVirtual < proximo.custoEvolucao}
                onClick={() => {
                  setUpgradeAberto(false);
                  executar(evoluirSede);
                }}
              >
                {moedaVirtual < proximo.custoEvolucao
                  ? "Moeda insuficiente"
                  : pendente
                    ? "Melhorando…"
                    : "Melhorar"}
              </ActionButton>
            </div>
          </>
        ) : (
          <p className="text-xs text-[#33415c]">
            Sua sede já está no nível máximo disponível.
          </p>
        )}
      </RibbonPanel>
    </div>
  );
}

/** Badges "+N Eixo" — mesma cor do token do atributo, para o jogador decidir
 *  a compra já vendo o que vai subir (GH-WORLD-02: "grade com bônus por
 *  atributo"). */
function BonusMobilia({ bonus }: { bonus: ItemMobilia["bonus"] }) {
  const entradas = Object.entries(bonus) as Array<
    [keyof ItemMobilia["bonus"], number | undefined]
  >;
  if (entradas.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {entradas.map(([chave, ganho]) =>
        ganho ? (
          <span
            key={chave}
            className={cn("text-[8px] font-bold", ATRIBUTO_TEXT_CLASS[chave])}
          >
            +{ganho} {ATRIBUTO_LABEL[chave]}
          </span>
        ) : null,
      )}
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

function LinhaComparativo({
  rotulo,
  atual,
  proximo,
}: {
  rotulo: string;
  atual: string;
  proximo: string;
}) {
  return (
    <tr className="border-t border-[#e6ebf3]">
      <td className="py-1 font-normal text-[#5b6b86]">{rotulo}</td>
      <td className="py-1 text-right text-[#33415c]">{atual}</td>
      <td className="py-1 text-right text-teal">{proximo}</td>
    </tr>
  );
}
