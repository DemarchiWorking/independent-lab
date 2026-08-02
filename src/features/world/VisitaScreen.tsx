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

/**
 * "Ligar para o escritório": o produto ainda não tem telefonia real —
 * confirmar aqui abre o Discord da comunidade (canal de voz) numa aba nova,
 * que é onde o contato ao vivo acontece hoje. O aviso existe para não
 * surpreender quem clica esperando um telefone tocando de verdade.
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

interface VisitaScreenProps {
  negocioVisitado: Negocio;
  sede: Sede;
  mobilia: ItemMobiliaColocado[];
  funcionarios: string[];
  /** identidade pública de quem está visitando — anunciada no canal de
   *  presença (GH-MULTI-03). Só fachada: tenantId + nome do negócio. */
  visitante: { tenantId: string; nome: string };
  /** `null` quando não há Supabase configurado (`GAMEHUB_DB=file`) — vem
   *  de um Server Component (`page.tsx`), nunca lido de `process.env`
   *  aqui dentro (ver `canalUtil.ts`, `PresencaConfig`, para o porquê). */
  presencaConfig: PresencaConfig | null;
}

export function VisitaScreen({
  negocioVisitado,
  sede,
  mobilia,
  funcionarios,
  visitante,
  presencaConfig,
}: VisitaScreenProps) {
  const canvasRef = useRef<WorldCanvasHandle | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [proximos, setProximos] = useState<AvatarProximo[]>([]);
  const [presentes, setPresentes] = useState<VisitantePresente[]>([]);
  const [confirmandoLigacao, setConfirmandoLigacao] = useState(false);

  const confirmarLigacao = () => {
    setConfirmandoLigacao(false);
    window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
  };

  /**
   * Presença ao vivo na sala (GH-MULTI-03). `entrarNaSala` é no-op
   * silencioso sem `presencaConfig`, então em `GAMEHUB_DB=file` esta tela
   * funciona exatamente como antes — degradação limpa, não feature flag
   * espalhada pela UI.
   *
   * Depende só de valores primitivos (`id`, `tenantId`, `nome`) e não do
   * objeto `visitante`: uma prop recriada a cada render do servidor faria
   * este efeito derrubar e reabrir o canal em loop, e cada reconexão
   * aparece como entrar/sair para todo mundo que está na sala.
   * `presencaConfig` é estável (vem do `page.tsx`, não muda entre renders
   * do client) — incluído nas deps por completude, não porque varia.
   */
  useEffect(() => {
    return entrarNaSala(
      negocioVisitado.id,
      { tenantId: visitante.tenantId, nome: visitante.nome, entrouEm: new Date().toISOString() },
      setPresentes,
      presencaConfig,
    );
  }, [negocioVisitado.id, visitante.tenantId, visitante.nome, presencaConfig]);

  /** Quem mais está aqui agora — eu não conto (já sou o avatar "visitante"). */
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

    // o visitante entra por último: reserva as células do dono + equipe
    // antes de escolher onde ele nasce, pra nunca sobrepor ninguém
    const ocupadasComEquipe = new Set(ocupadas);
    for (const pos of posicoesIa) {
      ocupadasComEquipe.add(chaveCelula(pos.cx, pos.cy));
    }
    // eu + quem mais estiver na sala ao vivo, todos numa tacada só: pedir
    // as posições em duas chamadas separadas devolveria a MESMA célula
    // para o primeiro de cada lista (a função é determinística), e os
    // bonecos nasceriam empilhados.
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
        // gente de verdade, ao vivo, na mesma sala (GH-MULTI-03). Cor
        // sempre presença (teal) — mesmo token que o Mapa usa pra "gente
        // aqui agora" (Mapa Vivo, GH-MAPA-05), nunca uma cor de atributo.
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

  // Proximidade inicial: o jogador pode nascer já ao lado de um agente, e sem
  // isto o painel só apareceria depois do primeiro passo — justo na primeira
  // sessão, que é quando ele mais precisa ensinar a mecânica.
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
        {/* SedeNameplate (Mapa Vivo, GH-MAPA-05): mesma cor de tier que o
            pin deste negócio já tem no Mapa — continuidade visual. Ponto
            colorido + texto em `text-muted`, nunca texto direto sobre o
            preenchimento de tier (achado da Reviewer Gate de
            acessibilidade: contraste varia demais entre os 5 tiers —
            mesma disciplina de `DESIGN.md.mapa-badge-fundo`). */}
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
