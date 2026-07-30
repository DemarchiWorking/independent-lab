"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { itemMobilia } from "@/features/sede/catalogo";
import { nivelSede } from "@/features/sede/niveis";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { PitchPanel } from "@/features/vendas/PitchPanel";
import { escolherPitch } from "@/features/vendas/pitchVisita";
import { usePresenca } from "./presenca/usePresenca";
import { PainelInteracao } from "./interacao/PainelInteracao";
import { ListaNaSala, type PessoaNaSala } from "./interacao/ListaNaSala";
import {
  AVATAR_DONO,
  AVATAR_VISITANTE,
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
  /** cargoIds da equipe de IA do visitado — só o cargo, nada de dado interno
   *  dele (senioridade e disponibilidade são leitura da PRÓPRIA operação) */
  funcionarios: string[];
  /** identidade de quem está visitando — só para anunciar presença ao vivo
   *  (GH-OPS Bloco 5); nunca usada pra nada que a visita já não fizesse */
  meuTenantId: string;
  meuNome: string;
}

export function VisitaScreen({
  negocioVisitado,
  sede,
  mobilia,
  funcionarios,
  meuTenantId,
  meuNome,
}: VisitaScreenProps) {
  const canvasRef = useRef<WorldCanvasHandle | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conversandoCom, setConversandoCom] = useState<string | null>(null);
  const [pitchEmFoco, setPitchEmFoco] = useState(false);
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const timerFoco = useRef<number | undefined>(undefined);

  // Presença ao vivo (GH-OPS Bloco 5) — degrada sozinha: `aoVivo: false`
  // quando Realtime não está configurado/disponível, e a visita continua
  // funcionando 100% normal (a pill de "N online" some, só isso).
  const { visitantes, aoVivo } = usePresenca(negocioVisitado.id, {
    tenantId: meuTenantId,
    nome: meuNome,
  });

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
          id: AVATAR_DONO,
          cx: inicioDono.cx,
          cy: inicioDono.cy,
          cor: corDoAtributo("presenca"),
          nome: negocioVisitado.nome,
          dono: true,
          // o dono visitado É o outro jogador — o interlocutor principal aqui
          interagivel: true,
        },
        ...funcionarios.map((cargoId, i) => {
          const cargo = cargoPorId(cargoId);
          const pos = posicoesIa[i] ?? inicioDono;
          return {
            id: avatarIdDeIa(cargoId),
            cx: pos.cx,
            cy: pos.cy,
            cor: corDoAtributo(cargo?.eixoFortalecido ?? "tecnologia"),
            nome: cargo?.nome.replace(/\s*IA$/, " IA") ?? cargoId,
            dono: false,
            interagivel: true,
          };
        }),
        {
          id: AVATAR_VISITANTE,
          cx: posicaoVisitante?.cx ?? inicioDono.cx,
          cy: posicaoVisitante?.cy ?? inicioDono.cy,
          cor: corDoAtributo("aquisicao"),
          nome: "Você",
          dono: false,
          interagivel: false,
        },
      ],
      destaques: [],
    };
  }, [geo, moveisPosicionados, funcionarios, negocioVisitado.nome]);

  /** Quem está na sala do vizinho, para a lista acessível do painel lateral. */
  const pessoasNaSala: PessoaNaSala[] = useMemo(
    () => [
      {
        avatarId: AVATAR_DONO,
        nome: negocioVisitado.nome,
        papel: "Dono do negócio",
        icon: "home",
        conversavel: true,
      },
      ...funcionarios.map((cargoId) => {
        const cargo = cargoPorId(cargoId);
        return {
          avatarId: avatarIdDeIa(cargoId),
          nome: cargo?.nome ?? cargoId,
          papel: "Funcionário de IA da casa",
          icon: cargo?.icon ?? "users",
          eixo: cargo?.eixoFortalecido,
          conversavel: true,
        };
      }),
      {
        avatarId: AVATAR_VISITANTE,
        nome: "Você",
        papel: "Visitando",
        icon: "users",
        conversavel: false,
      },
    ],
    [funcionarios, negocioVisitado.nome],
  );

  const interlocutor: Interlocutor | null = useMemo(() => {
    if (!conversandoCom) return null;

    if (conversandoCom === AVATAR_DONO) {
      return {
        tipo: "jogador-visitado",
        avatarId: AVATAR_DONO,
        negocio: negocioVisitado,
        nivelSedeNome: nivel.nome,
        pitch: escolherPitch(negocioVisitado),
      };
    }

    const cargoId = iaDeAvatarId(conversandoCom);
    const cargo = cargoId ? cargoPorId(cargoId) : undefined;
    if (!cargo) return null;

    return {
      tipo: "ia-visitada",
      avatarId: conversandoCom,
      cargo,
      nomeAnfitriao: negocioVisitado.nome,
    };
  }, [conversandoCom, negocioVisitado, nivel.nome]);

  /**
   * "Tenho uma proposta pra você" → leva o olho até o pitch que já existe no
   * aside, em vez de duplicar a copy comercial dentro do painel de conversa.
   * O anel de destaque some sozinho para não virar ruído permanente.
   */
  const focarPitch = useCallback(() => {
    setPitchEmFoco(true);
    pitchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // guardado num ref e limpo no unmount/reentrada: sem isso, sair da visita
    // antes de 2,4s deixaria um timer pendurado escrevendo num componente que
    // já saiu da árvore — e clicar duas vezes encurtaria o destaque da segunda
    window.clearTimeout(timerFoco.current);
    timerFoco.current = window.setTimeout(() => setPitchEmFoco(false), 2400);
  }, []);

  useEffect(() => () => window.clearTimeout(timerFoco.current), []);

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
        {/* Só aparece com presença ao vivo de verdade conectada — nunca
            mostra "0 online" quando o recurso está indisponível, que seria
            informação falsa, não degradação. Mostra QUEM, não só quantos —
            "Marcenaria do Vale está aqui agora" vende a rede regional muito
            melhor que um número solto, e o dado já vem pronto do Presence. */}
        {aoVivo && visitantes.length > 0 ? (
          <span
            className="flex items-center gap-1.5 rounded-pill bg-green/15 px-2.5 py-1 text-[11px] font-bold text-green"
            title={visitantes.map((v) => v.nome).join(", ")}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
            {visitantes.length === 1
              ? `${visitantes[0].nome} também está aqui agora`
              : `${visitantes.length} negócios aqui agora`}
          </span>
        ) : null}
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
            avatarDonoId={AVATAR_VISITANTE}
            onCliqueCelula={aoClicarCelula}
            onInteragirAvatar={setConversandoCom}
          />
          <p className="mt-2 text-center text-[10px] text-muted">
            Clique no chão para andar · chegue perto de alguém e clique no balão
            para conversar — visita é só de olhar, nada aqui pode ser comprado
            ou movido.
          </p>
        </div>

        <aside className="flex flex-col gap-3 rounded-md bg-panel p-3 text-ink">
          <div>
            <b className="block text-sm">{nivel.nome}</b>
            <p className="mt-1 text-[11px] leading-relaxed text-[#33415c]">
              {nivel.descricao}
            </p>
          </div>
          <div className="border-t border-[#e6ebf3] pt-3">
            <ListaNaSala pessoas={pessoasNaSala} onConversar={setConversandoCom} />
          </div>
          <div
            ref={pitchRef}
            className={cn(
              "rounded-md border-t border-[#e6ebf3] pt-3 transition-shadow",
              pitchEmFoco && "shadow-[0_0_0_3px] shadow-orange",
            )}
          >
            <PitchPanel negocioVisitado={negocioVisitado} />
          </div>
        </aside>
      </div>

      {/* CONVERSA COM O VIZINHO OU COM A EQUIPE DE IA DELE */}
      <PainelInteracao
        interlocutor={interlocutor}
        onFechar={() => setConversandoCom(null)}
        onFocarPitch={focarPitch}
      />
    </div>
  );
}
