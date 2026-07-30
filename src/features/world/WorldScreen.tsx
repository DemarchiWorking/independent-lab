"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { AtributosBar } from "@/components/ui/AtributosBar";
import { ATRIBUTO_LABEL, ATRIBUTO_TEXT_CLASS } from "@/lib/atributos";
import { CATALOGO_MOBILIA, itemMobilia, type ItemMobilia } from "@/features/sede/catalogo";
import { nivelSede, proximoNivelSede } from "@/features/sede/niveis";
import { comprarMobilia, evoluirSede, moverMobilia } from "@/features/sede/actions";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { senioridadeDe } from "@/features/equipe-ia/senioridade";
import { PainelInteracao } from "./interacao/PainelInteracao";
import { ListaNaSala, type PessoaNaSala } from "./interacao/ListaNaSala";
import {
  AVATAR_DONO,
  avatarIdDeIa,
  iaDeAvatarId,
  type Interlocutor,
} from "./interacao/tipos";
import { bloqueiosDeMobilia, chaveCelula } from "./engine/caminho";
import {
  celulaInicialAvatar,
  distribuirAvatares,
  geometriaSala,
  slotParaCelula,
} from "./engine/sala";
import type { Celula } from "./engine/iso";
import type { EstadoCena } from "./render/cena";
import { corDoAtributo, corDoItem } from "./render/cores";
import type { WorldCanvasHandle } from "./render/WorldCanvas";
import type {
  Atributos,
  FuncionarioContratado,
  ItemMobiliaColocado,
  Sede,
} from "@/lib/db/types";

/**
 * O World — o motor de gamificação de verdade.
 *
 * Regra de fronteira: esta tela orquestra, mas não reimplementa nada. Compra,
 * movimentação e evolução continuam passando pelas MESMAS Server Actions
 * atômicas de `features/sede/actions.ts`, que já validam saldo, posse e
 * ocupação no servidor. O World acrescenta a camada de simulação (sala
 * caminhável, avatares, depth-sort) — não uma segunda fonte de verdade.
 */

// Pixi toca em `window`: só carrega no cliente, e fora do bundle inicial.
const WorldCanvas = dynamic(
  () => import("./render/WorldCanvas").then((m) => m.WorldCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-64 w-full place-items-center rounded-md bg-night/40">
        <span className="font-pixel text-[10px] uppercase tracking-widest text-teal">
          Carregando sua sede…
        </span>
      </div>
    ),
  },
);

type Modo = { tipo: "livre" } | { tipo: "mover"; itemColocadoId: string; slot: number };

interface WorldScreenProps {
  sede: Sede;
  mobilia: ItemMobiliaColocado[];
  moedaVirtual: number;
  atributos: Atributos;
  /**
   * Funcionários de IA contratados — viram avatares na sala e interlocutores.
   * O registro inteiro (não só `cargoId`): `contratadoEm` alimenta a
   * senioridade da ficha e `disponibilidade` alimenta a resposta "estou livre?"
   * (GH-EQP-01), sem nenhuma leitura extra no servidor.
   */
  funcionarios: FuncionarioContratado[];
  nomeNegocio: string;
  /** relógio do SERVIDOR — nunca `new Date()` no cliente (ver senioridade.ts) */
  agoraIso: string;
}

export function WorldScreen({
  sede,
  mobilia,
  moedaVirtual,
  atributos,
  funcionarios,
  nomeNegocio,
  agoraIso,
}: WorldScreenProps) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [modo, setModo] = useState<Modo>({ tipo: "livre" });
  const [lojaAberta, setLojaAberta] = useState(false);
  const [upgradeAberto, setUpgradeAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conversandoCom, setConversandoCom] = useState<string | null>(null);
  const canvasRef = useRef<WorldCanvasHandle | null>(null);

  const nivel = nivelSede(sede.nivel);
  const proximo = proximoNivelSede(sede.nivel);
  const geo = useMemo(() => geometriaSala(sede.nivel), [sede.nivel]);

  /** Mobília posicionada no grid 2D (derivada do `slot` persistido). */
  const moveisPosicionados = useMemo(
    () =>
      mobilia
        .map((m) => {
          const item = itemMobilia(m.itemId);
          const celula = slotParaCelula(m.slot, geo);
          if (!item || !celula) return null;
          return { colocado: m, item, celula };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [mobilia, geo],
  );

  const bloqueadas = useMemo(
    () => bloqueiosDeMobilia(moveisPosicionados.map((m) => m.celula)),
    [moveisPosicionados],
  );

  /** Slots livres do nível — os destinos válidos quando se move um móvel. */
  const destinosLivres = useMemo(() => {
    const ocupados = new Set(mobilia.map((m) => m.slot));
    const livres: Array<{ slot: number; celula: Celula }> = [];
    for (let slot = 0; slot < geo.slots; slot++) {
      if (ocupados.has(slot)) continue;
      const celula = slotParaCelula(slot, geo);
      if (celula) livres.push({ slot, celula });
    }
    return livres;
  }, [mobilia, geo]);

  const estadoCena: EstadoCena = useMemo(() => {
    const inicioDono = celulaInicialAvatar(geo);
    // a célula do dono conta como ocupada: sem isso o primeiro Funcionário de
    // IA nasce em cima dele (os dois disputam o centro da sala)
    const ocupadasPorAvatar = new Set(bloqueadas);
    ocupadasPorAvatar.add(chaveCelula(inicioDono.cx, inicioDono.cy));
    const posicoesIa = distribuirAvatares(
      geo,
      ocupadasPorAvatar,
      funcionarios.length,
    );

    return {
      geo,
      moveis: moveisPosicionados.map((m) => ({
        id: m.colocado.id,
        cx: m.celula.cx,
        cy: m.celula.cy,
        cor: corDoItem(m.item.cor),
        categoria: m.item.categoria,
        selecionado:
          modo.tipo === "mover" && modo.itemColocadoId === m.colocado.id,
      })),
      avatares: [
        {
          id: AVATAR_DONO,
          cx: inicioDono.cx,
          cy: inicioDono.cy,
          cor: corDoAtributo("presenca"),
          nome: "Você",
          dono: true,
          // não se conversa consigo mesmo
          interagivel: false,
        },
        ...funcionarios.map((f, i) => {
          const cargo = cargoPorId(f.cargoId);
          const pos = posicoesIa[i] ?? inicioDono;
          return {
            // `f.id` (não o cargoId): é a chave estável do registro, então a
            // cena reconcilia o mesmo boneco mesmo se um dia der para contratar
            // dois do mesmo cargo
            id: avatarIdDeIa(f.id),
            cx: pos.cx,
            cy: pos.cy,
            cor: corDoAtributo(cargo?.eixoFortalecido ?? "tecnologia"),
            nome: cargo?.nome.replace(/\s*IA$/, " IA") ?? f.cargoId,
            dono: false,
            interagivel: true,
          };
        }),
      ],
      destaques: modo.tipo === "mover" ? destinosLivres.map((d) => d.celula) : [],
    };
  }, [geo, bloqueadas, moveisPosicionados, funcionarios, modo, destinosLivres]);

  /** Quem está na sala, para a lista acessível do painel lateral. */
  const pessoasNaSala: PessoaNaSala[] = useMemo(
    () => [
      {
        avatarId: AVATAR_DONO,
        nome: "Você",
        papel: nomeNegocio,
        icon: "home",
        conversavel: false,
      },
      ...funcionarios.map((f) => {
        const cargo = cargoPorId(f.cargoId);
        // senioridade já na lista: o jogador enxerga a evolução da equipe sem
        // precisar abrir a ficha de cada um
        const { titulo } = senioridadeDe(f.contratadoEm, agoraIso);
        return {
          avatarId: avatarIdDeIa(f.id),
          nome: cargo?.nome ?? f.cargoId,
          papel: `${titulo} · ${
            f.disponibilidade.estado === "alocado" ? "ocupado" : "livre"
          }`,
          icon: cargo?.icon ?? "users",
          eixo: cargo?.eixoFortalecido,
          conversavel: true,
        };
      }),
    ],
    [funcionarios, nomeNegocio, agoraIso],
  );

  /**
   * Resolve o avatar clicado no interlocutor da conversa.
   *
   * Derivado (`useMemo`) em vez de guardado em estado: assim a ficha aberta
   * acompanha um `router.refresh()` — se o Funcionário for alocado num serviço
   * enquanto o painel está aberto, a resposta "estou livre?" já sai atualizada,
   * sem precisar fechar e reabrir.
   */
  const interlocutor: Interlocutor | null = useMemo(() => {
    const avatarId = conversandoCom;
    if (!avatarId) return null;

    const funcionarioId = iaDeAvatarId(avatarId);
    if (!funcionarioId) return null;

    const f = funcionarios.find((x) => x.id === funcionarioId);
    const cargo = f ? cargoPorId(f.cargoId) : undefined;
    if (!f || !cargo) return null;

    return {
      tipo: "ia-propria",
      avatarId,
      cargo,
      senioridade: senioridadeDe(f.contratadoEm, agoraIso),
      disponibilidade: f.disponibilidade,
    };
  }, [conversandoCom, funcionarios, agoraIso]);

  const executar = useCallback(
    (fn: () => Promise<{ ok: boolean; erro?: string }>) => {
      setErro(null);
      iniciar(async () => {
        const r = await fn();
        if (r.ok) router.refresh();
        else setErro(r.erro ?? "Não foi possível concluir.");
      });
    },
    [router],
  );

  /**
   * Um clique no palco significa coisas diferentes conforme o modo:
   * - modo mover  → se caiu num slot livre, reposiciona o móvel (ação atômica)
   * - modo livre  → se caiu num móvel, seleciona para mover; senão, anda até lá
   */
  const aoClicarCelula = useCallback(
    (celula: Celula) => {
      setAviso(null);

      if (modo.tipo === "mover") {
        const destino = destinosLivres.find(
          (d) => d.celula.cx === celula.cx && d.celula.cy === celula.cy,
        );
        if (!destino) {
          setAviso("Escolha um dos espaços destacados para soltar o móvel.");
          return;
        }
        const id = modo.itemColocadoId;
        setModo({ tipo: "livre" });
        executar(() => moverMobilia(id, destino.slot));
        return;
      }

      const movel = moveisPosicionados.find(
        (m) => m.celula.cx === celula.cx && m.celula.cy === celula.cy,
      );
      if (movel) {
        setModo({
          tipo: "mover",
          itemColocadoId: movel.colocado.id,
          slot: movel.colocado.slot,
        });
        return;
      }

      // chão livre: o boneco caminha até lá
      if (!canvasRef.current?.andarPara(celula)) {
        setAviso("Não dá para chegar aí — tem mobília no caminho.");
      }
    },
    [modo, destinosLivres, moveisPosicionados, executar],
  );

  const comprar = useCallback(
    (item: ItemMobilia) => {
      const livre = destinosLivres[0];
      if (!livre) {
        setErro("Não há espaço livre. Melhore sua sede primeiro.");
        setLojaAberta(false);
        return;
      }
      setLojaAberta(false);
      executar(() => comprarMobilia(item.id, livre.slot));
    },
    [destinosLivres, executar],
  );

  return (
    <div className="flex w-full flex-col gap-3">
      {/* faixa de status da sede */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-pill bg-orange px-2.5 py-1 text-[11px] font-extrabold text-ink">
          <Icon name="home" size={13} />
          {nivel.nome}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {nomeNegocio}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-teal">
          🪙 {moedaVirtual.toLocaleString("pt-BR")}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {mobilia.length}/{nivel.slots} espaços
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          👥 {funcionarios.length + 1} na sala
        </span>
      </div>

      {/* dica contextual do modo mover */}
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
              Clique num espaço destacado para soltar o móvel.
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
      {aviso ? (
        <p className="rounded-sm bg-card2 px-2.5 py-1.5 text-[11px] font-bold text-muted">
          {aviso}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        {/* O PALCO — canvas Pixi */}
        <div className="overflow-hidden rounded-md bg-gradient-to-b from-[#0b1830] to-[#132241] p-3">
          <WorldCanvas
            ref={canvasRef}
            estado={estadoCena}
            avatarDonoId={AVATAR_DONO}
            onCliqueCelula={aoClicarCelula}
            onInteragirAvatar={setConversandoCom}
          />
          <p className="mt-2 text-center text-[10px] text-muted">
            Clique no chão para andar · num móvel para reposicionar · no balão de
            quem está por perto para conversar
          </p>

          {/* Âncora da primeira sessão: uma sala vazia sem direção é a pior
              tela do produto. Ver EVOLUCAO-MOTOR-2026.md §7.6. */}
          {mobilia.length === 0 ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              {...pressable}
              onClick={() => setLojaAberta(true)}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-orange px-3 py-2.5 text-xs font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
            >
              <Icon name="grid" size={15} />
              Sua sede está vazia — comece pelo primeiro equipamento
            </motion.button>
          ) : null}
        </div>

        {/* painel lateral */}
        <aside className="flex flex-col gap-3 rounded-md bg-panel p-3 text-ink">
          <div>
            <b className="block text-sm">{nivel.nome}</b>
            <p className="mt-1 text-[11px] leading-relaxed text-[#33415c]">
              {nivel.descricao}
            </p>
          </div>

          <div className="border-t border-[#e6ebf3] pt-2">
            <b className="mb-1.5 block text-[11px] text-[#5b6b86]">
              Economia de atributos
            </b>
            <AtributosBar atributos={atributos} tom="light" />
          </div>

          <div className="border-t border-[#e6ebf3] pt-2">
            <ListaNaSala
              pessoas={pessoasNaSala}
              onConversar={setConversandoCom}
              dicaVazia={
                <Link
                  href="/hub?ver=equipe-ia"
                  className="mt-1.5 flex items-center gap-1.5 rounded-sm bg-teal/15 px-2 py-1.5 text-[10px] font-bold leading-snug text-[#0f766e] transition-colors hover:bg-teal/25"
                >
                  <Icon name="users" size={13} className="shrink-0" />
                  Sua sala está só com você. Contrate um Funcionário de IA e ele
                  aparece aqui para conversar.
                </Link>
              }
            />
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <ActionButton
              icon="grid"
              variant="ghost"
              disabled={pendente}
              onClick={() => setLojaAberta(true)}
            >
              Loja de equipamentos
            </ActionButton>
            {proximo ? (
              <ActionButton
                icon="arrow"
                disabled={pendente}
                onClick={() => setUpgradeAberto(true)}
              >
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

      {/* CONVERSA COM UM FUNCIONÁRIO DE IA */}
      <PainelInteracao
        interlocutor={interlocutor}
        onFechar={() => setConversandoCom(null)}
      />

      {/* LOJA */}
      <RibbonPanel
        title="Loja de equipamentos"
        open={lojaAberta}
        onClose={() => setLojaAberta(false)}
      >
        <p className="mb-2 text-[11px] text-[#5b6b86]">
          O item vai para o primeiro espaço livre — depois é só clicar nele na
          sala para reposicionar.
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
                onClick={() => comprar(item)}
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
                <div className="flex flex-wrap justify-center gap-1">
                  {(
                    Object.entries(item.bonus) as Array<
                      [keyof ItemMobilia["bonus"], number | undefined]
                    >
                  ).map(([chave, ganho]) =>
                    ganho ? (
                      <span
                        key={chave}
                        className={cn(
                          "text-[8px] font-bold",
                          ATRIBUTO_TEXT_CLASS[chave],
                        )}
                      >
                        +{ganho} {ATRIBUTO_LABEL[chave]}
                      </span>
                    ) : null,
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </RibbonPanel>

      {/* MELHORAR SEDE */}
      <RibbonPanel
        title="Melhorar sede"
        open={upgradeAberto}
        onClose={() => setUpgradeAberto(false)}
        className="max-w-md"
      >
        {proximo ? (
          <>
            <h3 className="text-sm font-extrabold text-coral-dark">{proximo.nome}</h3>
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
                  rotulo="Sala"
                  atual={`${geo.cols}×${geo.rows} tiles`}
                  proximo={(() => {
                    const g = geometriaSala(proximo.nivel);
                    return `${g.cols}×${g.rows} tiles`;
                  })()}
                />
                <LinhaComparativo
                  rotulo="Custo mensal"
                  atual={nivel.custoMensal > 0 ? `🪙 ${nivel.custoMensal}` : "—"}
                  proximo={proximo.custoMensal > 0 ? `🪙 ${proximo.custoMensal}` : "—"}
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
