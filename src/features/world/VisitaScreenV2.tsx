"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";
import { ActionButton } from "@/components/ui/ActionButton";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { itemMobilia } from "@/features/sede/catalogo";
import { nivelSede } from "@/features/sede/niveis";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { classeTier, nomeArvoreTier } from "@/lib/tier";
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
import { corDoAtributo, corDoItem, corDePresenca } from "./render/cores";
import type { WorldCanvasHandle } from "./render/WorldCanvas";
import { InteracaoNpc } from "./InteracaoNpc";
import { avataresProximos, type AvatarProximo } from "./engine/proximidade";
import { entrarNaSala } from "./presenca/canal";
import type { PresencaConfig, VisitantePresente } from "./presenca/canalUtil";
import type { ItemMobiliaColocado, Negocio, Sede } from "@/lib/db/types";

/**
 * `VisitaScreenV2` — irmã de `VisitaScreen.tsx`, mesma relação que
 * `WorldScreenV2` tem com `WorldScreen.tsx` (ver comentário lá). Única
 * diferença: `DESENHADORES_V2` (`render/desenhoV2.ts`) + `itemId`/`cargoId`
 * em `EstadoCena`. Nenhuma regra de negócio muda — continua somente leitura,
 * mesmas Server Actions (nenhuma, na verdade: visita nunca chama
 * `comprarMobilia`/`moverMobilia`/`evoluirSede`), mesmo canal de presença.
 *
 * Rota: `/world/visitar/[tenantId]/v2` (`VisitaScreen.tsx`/
 * `/world/visitar/[tenantId]` continuam 100% intocados).
 */

const DISCORD_URL = "https://discord.gg/fWt2Nf4nkp";

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

interface VisitaScreenV2Props {
  negocioVisitado: Negocio;
  sede: Sede;
  mobilia: ItemMobiliaColocado[];
  funcionarios: string[];
  visitante: { tenantId: string; nome: string };
  presencaConfig: PresencaConfig | null;
}

export function VisitaScreenV2({
  negocioVisitado,
  sede,
  mobilia,
  funcionarios,
  visitante,
  presencaConfig,
}: VisitaScreenV2Props) {
  const canvasRef = useRef<WorldCanvasHandle | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [proximos, setProximos] = useState<AvatarProximo[]>([]);
  const [presentes, setPresentes] = useState<VisitantePresente[]>([]);
  const [confirmandoLigacao, setConfirmandoLigacao] = useState(false);

  const confirmarLigacao = () => {
    setConfirmandoLigacao(false);
    window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    return entrarNaSala(
      negocioVisitado.id,
      { tenantId: visitante.tenantId, nome: visitante.nome, entrouEm: new Date().toISOString() },
      setPresentes,
      presencaConfig,
    );
  }, [negocioVisitado.id, visitante.tenantId, visitante.nome, presencaConfig]);

  const outrosPresentes = useMemo(
    () => presentes.filter((p) => p.tenantId !== visitante.tenantId),
    [presentes, visitante.tenantId],
  );

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

    const ocupadasComEquipe = new Set(ocupadas);
    for (const pos of posicoesIa) {
      ocupadasComEquipe.add(chaveCelula(pos.cx, pos.cy));
    }
    const [posicaoVisitante, ...posicoesPresentes] = distribuirAvatares(
      geo,
      ocupadasComEquipe,
      1 + outrosPresentes.length,
    );

    return {
      geo,
      moveis: moveisPosicionados.map((m) => ({
        id: m.colocado.id,
        cx: m.celula.cx,
        cy: m.celula.cy,
        cor: corDoItem(m.item.cor),
        categoria: m.item.categoria,
        itemId: m.item.id,
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
            cargoId,
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
        ...outrosPresentes.map((p, i) => {
          const pos = posicoesPresentes[i] ?? posicaoVisitante ?? inicioDono;
          return {
            id: `presenca:${p.tenantId}`,
            cx: pos.cx,
            cy: pos.cy,
            cor: corDePresenca(),
            nome: p.nome,
            dono: false,
          };
        }),
      ],
      destaques: [],
    };
  }, [geo, moveisPosicionados, funcionarios, negocioVisitado.nome, outrosPresentes]);

  const proximidadeIniciada = useRef(false);
  useEffect(() => {
    if (proximidadeIniciada.current) return;
    proximidadeIniciada.current = true;
    const eu = estadoCena.avatares.find((a) => a.id === "visitante");
    if (eu) setProximos(avataresProximos(eu, estadoCena.avatares, "visitante"));
  }, [estadoCena.avatares]);

  const aoClicarCelula = (celula: Celula) => {
    setAviso(null);
    if (!canvasRef.current?.andarPara(celula)) {
      setAviso("Não dá para chegar aí — tem mobília no caminho.");
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-pill bg-teal px-2.5 py-1 text-[11px] font-extrabold text-ink">
          <Icon name="home" size={13} />
          Visitando
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {negocioVisitado.nome}
        </span>
        <span className="flex items-center gap-1.5 rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          <i className={`inline-block h-2 w-2 rounded-full ${classeTier(negocioVisitado.degrauAtual)}`} />
          {nomeArvoreTier(negocioVisitado.degrauAtual)}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          {nivel.nome}
        </span>
        <span className="rounded-pill bg-card2 px-2.5 py-1 text-[11px] font-bold text-muted">
          👥 {funcionarios.length + 1} na sala
        </span>
        <span className="rounded-pill bg-teal/20 px-2.5 py-1 text-[11px] font-bold text-teal">
          🧪 Preview visual — sprites reais + silhueta por item
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
            variante="v2"
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
          <div className="border-t border-[#e6ebf3] pt-3">
            <ActionButton
              variant="ghost"
              icon="globe"
              onClick={() => setConfirmandoLigacao(true)}
            >
              Ligar para o escritório
            </ActionButton>
          </div>
        </aside>
      </div>

      <RibbonPanel
        title="Ligar para o escritório"
        open={confirmandoLigacao}
        onClose={() => setConfirmandoLigacao(false)}
      >
        <div className="space-y-3 text-ink">
          <p className="text-[11px] leading-relaxed text-[#33415c]">
            Isto vai tentar uma ligação com o escritório de{" "}
            <b>{negocioVisitado.nome}</b> abrindo o canal de voz da nossa
            comunidade no Discord, numa aba nova.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <ActionButton
              variant="ghost"
              fullWidth={false}
              onClick={() => setConfirmandoLigacao(false)}
            >
              Cancelar
            </ActionButton>
            <ActionButton fullWidth={false} onClick={confirmarLigacao}>
              Confirmar
            </ActionButton>
          </div>
        </div>
      </RibbonPanel>
    </div>
  );
}
