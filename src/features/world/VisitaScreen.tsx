"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";
import { itemMobilia } from "@/features/sede/catalogo";
import { nivelSede } from "@/features/sede/niveis";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { PitchPanel } from "@/features/vendas/PitchPanel";
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
import { InteracaoNpc } from "./InteracaoNpc";
import { avataresProximos, type AvatarProximo } from "./engine/proximidade";
import type { ItemMobiliaColocado, Negocio, Sede } from "@/lib/db/types";

/**
 * Tela de visita à sede de outro tenant — somente leitura.
 *
 * Irmã leve de `WorldScreen.tsx`, não uma variante dela: reaproveita a mesma
 * geometria/render (`engine/sala.ts`, `render/cena.ts`, `render/WorldCanvas.tsx`)
 * mas nunca importa `moverMobilia`/`comprarMobilia`/`evoluirSede` — não há
 * modo "mover", loja nem upgrade de sede. Ver docs/world/VISITAR-VIZINHO.md.
 *
 * O avatar do visitante (`id: "visitante"`) é puramente cosmético: nasce numa
 * célula livre, anda ao clique, nunca é persistido. `WorldCanvas`/`CenaWorld`
 * não precisaram de nenhuma mudança para suportar isso — `avatarDonoId`
 * resolve qualquer id presente em `avatares`, por construção.
 */

const WorldCanvas = dynamic(
  () => import("./render/WorldCanvas").then((m) => m.WorldCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-64 w-full place-items-center rounded-md bg-night/40">
        <span className="font-pixel text-[10px] uppercase tracking-widest text-teal">
          Carregando a sede…
        </span>
      </div>
    ),
  },
);

interface VisitaScreenProps {
  negocioVisitado: Negocio;
  sede: Sede;
  mobilia: ItemMobiliaColocado[];
  funcionarios: string[];
}

export function VisitaScreen({
  negocioVisitado,
  sede,
  mobilia,
  funcionarios,
}: VisitaScreenProps) {
  const canvasRef = useRef<WorldCanvasHandle | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [proximos, setProximos] = useState<AvatarProximo[]>([]);

  const nivel = nivelSede(sede.nivel);
  const geo = useMemo(() => geometriaSala(sede.nivel), [sede.nivel]);

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

  const estadoCena: EstadoCena = useMemo(() => {
    const inicioDono = celulaInicialAvatar(geo);
    const bloqueadas = bloqueiosDeMobilia(moveisPosicionados.map((m) => m.celula));

    const ocupadas = new Set(bloqueadas);
    ocupadas.add(chaveCelula(inicioDono.cx, inicioDono.cy));
    const posicoesIa = distribuirAvatares(geo, ocupadas, funcionarios.length);

    // o visitante entra por último: reserva as células do dono + equipe
    // antes de escolher onde ele nasce, pra nunca sobrepor ninguém
    const ocupadasComEquipe = new Set(ocupadas);
    for (const pos of posicoesIa) {
      ocupadasComEquipe.add(chaveCelula(pos.cx, pos.cy));
    }
    const [posicaoVisitante] = distribuirAvatares(geo, ocupadasComEquipe, 1);

    return {
      geo,
      moveis: moveisPosicionados.map((m) => ({
        id: m.colocado.id,
        cx: m.celula.cx,
        cy: m.celula.cy,
        cor: corDoItem(m.item.cor),
        categoria: m.item.categoria,
        selecionado: false,
      })),
      avatares: [
        {
          id: "dono",
          cx: inicioDono.cx,
          cy: inicioDono.cy,
          cor: corDoAtributo("presenca"),
          nome: negocioVisitado.nome,
          dono: true,
        },
        ...funcionarios.map((cargoId, i) => {
          const cargo = cargoPorId(cargoId);
          const pos = posicoesIa[i] ?? inicioDono;
          return {
            id: `ia:${cargoId}`,
            cx: pos.cx,
            cy: pos.cy,
            cor: corDoAtributo(cargo?.eixoFortalecido ?? "tecnologia"),
            nome: cargo?.nome.replace(/\s*IA$/, " IA") ?? cargoId,
            dono: false,
          };
        }),
        {
          id: "visitante",
          cx: posicaoVisitante?.cx ?? inicioDono.cx,
          cy: posicaoVisitante?.cy ?? inicioDono.cy,
          cor: corDoAtributo("aquisicao"),
          nome: "Você",
          dono: false,
        },
      ],
      destaques: [],
    };
  }, [geo, moveisPosicionados, funcionarios, negocioVisitado.nome]);

  const aoClicarCelula = (celula: Celula) => {
    setAviso(null);
    if (!canvasRef.current?.andarPara(celula)) {
      setAviso("Não dá para chegar aí — tem mobília no caminho.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-pill bg-teal px-2.5 py-1 text-[11px] font-extrabold text-ink">
          <Icon name="home" size={13} />
          Visitando
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {negocioVisitado.nome}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {nivel.nome}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          👥 {funcionarios.length + 1} na sala
        </span>
      </div>

      {aviso ? (
        <p className="rounded-sm bg-card2 px-2.5 py-1.5 text-[11px] font-bold text-muted">
          {aviso}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <div className="overflow-hidden rounded-md bg-gradient-to-b from-[#0b1830] to-[#132241] p-3">
          <WorldCanvas
            ref={canvasRef}
            estado={estadoCena}
            onAvatarParou={(celula) =>
              setProximos(avataresProximos(celula, estadoCena.avatares, "visitante"))
            }
            avatarDonoId="visitante"
            onCliqueCelula={aoClicarCelula}
          />
          <p className="mt-2 text-center text-[10px] text-muted">
            Clique no chão para andar — chegue perto da equipe para ver o que
            ela entrega. Visita é só de olhar, nada aqui pode ser alterado.
          </p>

          {/* Proximidade na sede alheia: read-only, vira pitch (GH-WORLD-08) */}
          <div className="mt-2">
            <InteracaoNpc proximos={proximos} minhaSede={false} />
          </div>
        </div>

        <aside className="flex flex-col gap-3 rounded-md bg-panel p-3 text-ink">
          <div>
            <b className="block text-sm">{nivel.nome}</b>
            <p className="mt-1 text-[11px] leading-relaxed text-[#33415c]">
              {nivel.descricao}
            </p>
          </div>
          <div className="border-t border-[#e6ebf3] pt-3">
            <PitchPanel negocioVisitado={negocioVisitado} />
          </div>
        </aside>
      </div>
    </div>
  );
}
