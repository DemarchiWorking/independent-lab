"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { screenVariants, pressable, listContainer, listItem } from "@/lib/motion";
import { IsoRoom } from "@/components/ui/IsoRoom";
import { HudBar, type HudData } from "@/components/ui/HudBar";
import { Nav, type NavItem } from "@/components/ui/Nav";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { Icon } from "@/components/ui/Icon";
import { HubScreen } from "@/features/hub/HubScreen";
import { MarketplaceScreen } from "@/features/marketplace/MarketplaceScreen";
import { HexTreeScreen } from "@/features/parcerias/HexTreeScreen";
import { EventosScreen } from "@/features/eventos-globais/EventosScreen";
import type { EventoComProgresso } from "@/features/eventos-globais/actions";
import { ModuleScreen, modules, type ModuleKey } from "@/features/roadmap/modules";
import { MapaScreen } from "@/features/mapa/MapaScreen";
import { EquipeIaScreen } from "@/features/equipe-ia/EquipeIaScreen";
import { SedeScreen } from "@/features/sede/SedeScreen";
import { MercadoScreen } from "@/features/mercado/MercadoScreen";
import { FinancasScreen } from "@/features/financas/FinancasScreen";
import { CelularPanel } from "./CelularPanel";
import { InventarioPanel } from "./InventarioPanel";
import { LateralMenu, type LateralItem } from "@/components/ui/LateralMenu";
import { RecompensaProvider } from "@/features/gamificacao/RecompensaContext";
import type { Missao } from "@/features/gamificacao/missoes";
import type {
  Atributos,
  BenchmarkBairro,
  DestaqueBairro,
  Endereco,
  FuncionarioContratado,
  ItemMobiliaColocado,
  LicaoConcluida,
  MapaView,
  Negocio,
  Sede,
  SolicitacaoContato,
} from "@/lib/db/types";

type CoreView =
  | "hub"
  | "sede"
  | "mapa"
  | "equipe-ia"
  | "marketplace"
  | "parcerias"
  | "eventos"
  | "mercado"
  | "financas";
export type View = CoreView | ModuleKey;

/** Chaves do menu lateral: as views do shell + entradas que só navegam para
 *  uma rota própria (o World). "world" nunca vira `view` — tem href. */
type LateralKey = View | "world";

const NAV_BASE: ReadonlyArray<NavItem<CoreView>> = [
  { key: "hub", label: "Hub", icon: "grid" },
  { key: "marketplace", label: "Serviços", icon: "briefcase" },
  { key: "parcerias", label: "Parcerias", icon: "network" },
];
const NAV_MAPA: NavItem<CoreView> = { key: "mapa", label: "Mapa", icon: "globe" };
const NAV_EQUIPE: NavItem<CoreView> = {
  key: "equipe-ia",
  label: "Equipe IA",
  icon: "users",
};
const NAV_SEDE: NavItem<CoreView> = { key: "sede", label: "Sede", icon: "home" };

/** HUD de demonstração (rota pública `/`). O `/hub` autenticado injeta dados reais. */
const HUD_DEMO: HudData = {
  coins: "2.460",
  network: "38",
  cycleLabel: "Q3 · S6",
  cycleProgress: 64,
  objective: "Fechar 3 serviços reais",
  balance: "+ R$ 8.740",
  alert: "Faltam 12 dias para a retro de 90 dias",
};

function isModule(v: View): v is ModuleKey {
  return v in modules;
}

function stageTitle(v: View): string {
  if (v === "sede") return "Minha sede";
  if (v === "mapa") return "Mapa da região";
  if (v === "equipe-ia") return "Equipe de IA";
  if (v === "marketplace") return "Marketplace de TI";
  if (v === "parcerias") return "Árvore de parceiros";
  if (v === "eventos") return "Eventos";
  if (v === "mercado") return "Mercado da região";
  if (v === "financas") return "Finanças";
  if (isModule(v)) return modules[v].label;
  return "";
}

interface GameShellProps {
  initialView?: View;
  /** HUD real (rota autenticada). Ausente = modo demo. */
  hud?: HudData;
  missao?: Missao | null;
  /** Mundo real do jogador (rota autenticada). Habilita a aba "Mapa". */
  mapa?: MapaView;
  endereco?: Endereco;
  meuTenantId?: string;
  /** cargoIds já contratados. Presente (mesmo vazio) = habilita a aba "Equipe IA". */
  funcionariosContratados?: string[];
  /** Registros completos (id/cargoId/disponibilidade) dos Funcionários de IA
   *  contratados — alimenta o modal de seleção de equipe do Marketplace
   *  (GH-EQP-02). `funcionariosContratados` acima continua só com cargoIds,
   *  usado pela aba "Equipe IA"; este é um prop adicional, não substitui o
   *  outro. */
  funcionarios?: FuncionarioContratado[];
  degrauAtual?: number;
  /** Sede do jogador (rota autenticada). Presente = habilita a aba "Sede". */
  sede?: Sede;
  mobilia?: ItemMobiliaColocado[];
  moedaVirtual?: number;
  /** Os 5 eixos da economia de atributos — exibidos na Sede. */
  atributos?: Atributos;
  /** jobIds do marketplace já aceitos — guarda anti-farm (GH-FDN-01). */
  trabalhosAceitos?: string[];
  /** noIds da árvore de parcerias já desbloqueados (GH-FDN-02). */
  nosDesbloqueados?: string[];
  /** vizinhoTenantIds com parceria já formada no Mapa (GH-FDN-03). */
  parceriasFormadas?: string[];
  /** Eventos globais visíveis ao jogador, já com o progresso dele (Épico 11). */
  eventos?: EventoComProgresso[];
  /** Lições concluídas (GH-EDU-01) — decide se a lição do degrau atual já
   *  foi lida, mostrada no Hub. */
  licoesConcluidas?: LicaoConcluida[];
  /** Mercado (GH-MAPA-04 + GH-GROW-04): média do bairro, destaque e
   *  vizinhos. Presente = habilita a aba "Mercado". */
  benchmark?: BenchmarkBairro;
  destaqueBairro?: DestaqueBairro | null;
  vizinhos?: Negocio[];
  /** Mensagens recebidas pela vitrine pública — alimentam o celular. */
  mensagens?: SolicitacaoContato[];
}

/** Moldura do jogo: cena isométrica + HUD fixos; o "palco" central troca de tela
 *  com movimento. O botão app-drawer (2×2) abre o menu de módulos mapeados. */
export function GameShell({
  initialView = "hub",
  hud,
  missao = null,
  mapa,
  endereco,
  meuTenantId,
  funcionariosContratados,
  funcionarios = [],
  degrauAtual,
  sede,
  mobilia,
  moedaVirtual,
  atributos,
  trabalhosAceitos = [],
  nosDesbloqueados = [],
  parceriasFormadas = [],
  eventos = [],
  licoesConcluidas = [],
  benchmark,
  destaqueBairro = null,
  vizinhos = [],
  mensagens = [],
}: GameShellProps) {
  const [view, setView] = useState<View>(initialView);
  const [drawer, setDrawer] = useState(false);
  const [celular, setCelular] = useState(false);
  const [inventario, setInventario] = useState(false);

  const demo = hud === undefined;
  const dadosHud = hud ?? HUD_DEMO;
  const temMapa = Boolean(mapa && endereco && meuTenantId);
  const temEquipeIa = funcionariosContratados !== undefined && degrauAtual !== undefined;
  const temSede =
    sede !== undefined &&
    mobilia !== undefined &&
    moedaVirtual !== undefined &&
    atributos !== undefined;
  const temMercado = Boolean(benchmark && atributos && endereco);
  const navItems = [
    NAV_BASE[0],
    ...(temSede ? [NAV_SEDE] : []),
    ...(temMapa ? [NAV_MAPA] : []),
    ...(temEquipeIa ? [NAV_EQUIPE] : []),
    ...NAV_BASE.slice(1),
  ];

  /** Menu lateral — espelha a sidebar de ícones do Startup Panic. Itens sem
   *  tela pronta aparecem com cadeado, em vez de sumir (o jogador vê o que
   *  ainda vem por aí — mesma lógica dos stubs do app-drawer). */
  const lateralItems: ReadonlyArray<LateralItem<LateralKey>> = [
    { key: "marketplace", label: "Serviços", icon: "briefcase" },
    { key: "equipe-ia", label: "Equipe de IA", icon: "users", disponivel: temEquipeIa },
    // O World é o motor de gamificação de verdade e tem rota própria: sala
    // caminhável, avatares e mobília reposicionável (`/world`).
    {
      key: "world",
      label: "Entrar na sede (World)",
      icon: "home",
      disponivel: temSede,
      href: "/world",
      destaque: true,
    },
    { key: "sede", label: "Sede (resumo)", icon: "cube", disponivel: temSede },
    { key: "parcerias", label: "Parcerias", icon: "network" },
    { key: "eventos", label: "Eventos", icon: "calendar" },
    { key: "mapa", label: "Mapa da região", icon: "globe", disponivel: temMapa },
    { key: "mercado", label: "Mercado", icon: "chart", disponivel: temMercado },
    { key: "financas", label: "Finanças", icon: "coin", disponivel: temSede },
  ];

  const core: CoreView = isModule(view) ? "hub" : view;

  const go = (v: View) => {
    setView(v);
    setDrawer(false);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6">
      <p className="mb-3 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <div className="relative aspect-[20/11] min-h-[440px] w-full overflow-hidden rounded-[14px] border-[3px] border-[#05304a] shadow-[0_0_0_4px_#041018,0_18px_50px_rgba(0,0,0,.55)]">
       <RecompensaProvider demo={demo}>
        <IsoRoom />
        <HudBar
          data={dadosHud}
          acoes={
            demo
              ? {}
              : {
                  aoClicarMoeda: () => go("financas"),
                  aoClicarRede: () => go("mercado"),
                  aoClicarCiclo: () => go("eventos"),
                  aoClicarObjetivo: () => go("hub"),
                  aoClicarSaldo: () => go("financas"),
                }
          }
        />

        <div className="absolute inset-x-0 bottom-0 top-0 z-10 pb-20 pl-14 pr-4 pt-24">
          <AnimatePresence mode="wait">
            <motion.section
              key={view}
              variants={screenVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="h-full"
            >
              {view === "hub" ? (
                <HubScreen
                  missao={missao}
                  trabalhosAceitos={trabalhosAceitos}
                  atributos={atributos}
                  funcionarios={funcionarios}
                  degrauAtual={degrauAtual}
                  licoesConcluidas={licoesConcluidas}
                />
              ) : (
                <div className="relative h-full rounded-md bg-card/85 p-4 pt-5 backdrop-blur-sm">
                  <span className="clip-ribbon absolute -left-1.5 -top-3 rounded-sm bg-coral px-4 py-1.5 text-[13px] font-extrabold text-white shadow-[0_3px_0] shadow-coral-dark">
                    {stageTitle(view)}
                  </span>
                  <div className="h-full pt-3">
                    {view === "sede" &&
                    sede &&
                    mobilia !== undefined &&
                    moedaVirtual !== undefined &&
                    atributos ? (
                      <SedeScreen
                        sede={sede}
                        mobilia={mobilia}
                        moedaVirtual={moedaVirtual}
                        atributos={atributos}
                      />
                    ) : view === "mapa" && mapa && endereco && meuTenantId ? (
                      <MapaScreen
                        mapa={mapa}
                        endereco={endereco}
                        meuTenantId={meuTenantId}
                        parceriasFormadas={parceriasFormadas}
                      />
                    ) : view === "equipe-ia" &&
                      funcionariosContratados !== undefined &&
                      degrauAtual !== undefined ? (
                      <EquipeIaScreen
                        contratados={funcionariosContratados}
                        degrauAtual={degrauAtual}
                        funcionarios={funcionarios}
                      />
                    ) : view === "marketplace" ? (
                      <MarketplaceScreen
                        trabalhosAceitos={trabalhosAceitos}
                        atributos={atributos}
                        funcionarios={funcionarios}
                      />
                    ) : view === "parcerias" ? (
                      <HexTreeScreen
                        nosDesbloqueados={nosDesbloqueados}
                        moedaVirtual={moedaVirtual ?? 0}
                        atributos={atributos}
                      />
                    ) : view === "mercado" && benchmark && atributos && endereco ? (
                      <MercadoScreen
                        atributos={atributos}
                        benchmark={benchmark}
                        destaque={destaqueBairro}
                        vizinhos={vizinhos}
                        bairro={endereco.bairroSlug}
                      />
                    ) : view === "financas" && sede && moedaVirtual !== undefined && mobilia ? (
                      <FinancasScreen
                        moedaVirtual={moedaVirtual}
                        nivelSedeAtual={sede.nivel}
                        mobilia={mobilia}
                        funcionarios={funcionarios}
                      />
                    ) : view === "eventos" ? (
                      <EventosScreen eventos={eventos} />
                    ) : isModule(view) ? (
                      <ModuleScreen moduleKey={view} />
                    ) : null}
                  </div>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        {/* menu lateral de ícones — fiel à sidebar do Startup Panic */}
        <LateralMenu
          items={lateralItems}
          current={view}
          onSelect={(k) => {
            if (k !== "world") go(k); // "world" navega por href, não troca de aba
          }}
        />

        {/* app-drawer (2×2) — abre o menu de módulos, fiel ao Startup Panic */}
        <motion.button
          type="button"
          {...pressable}
          onClick={() => setDrawer(true)}
          aria-label="Abrir módulos"
          className="absolute bottom-3 left-3 z-20 grid grid-cols-2 gap-0.5 rounded-md bg-panel/90 p-2.5 shadow-hard"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="h-2 w-2 rounded-[2px] bg-ink/70" />
          ))}
        </motion.button>

        {/* Ações do jogador — canto inferior direito, espelhando o
            app-drawer da esquerda. Só no modo autenticado: no demo não há
            inventário nem mensagens de verdade para mostrar. */}
        {!demo ? (
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2">
            <motion.button
              type="button"
              {...pressable}
              onClick={() => setCelular(true)}
              aria-label="Abrir celular"
              title="Celular"
              className="relative grid h-11 w-11 place-items-center rounded-md bg-panel/90 text-ink shadow-hard"
            >
              <Icon name="monitor" size={19} />
              {mensagens.length > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-pill bg-coral px-1 font-pixel text-[7px] text-white">
                  {mensagens.length}
                </span>
              ) : null}
            </motion.button>
            <motion.button
              type="button"
              {...pressable}
              onClick={() => setInventario(true)}
              aria-label="Abrir inventário"
              title="Inventário"
              className="grid h-11 w-11 place-items-center rounded-md bg-panel/90 text-ink shadow-hard"
            >
              <Icon name="cube" size={19} />
            </motion.button>
          </div>
        ) : null}

        <CelularPanel
          open={celular}
          onClose={() => setCelular(false)}
          mensagens={mensagens}
          eventos={eventos}
          missao={missao}
        />

        <InventarioPanel
          open={inventario}
          onClose={() => setInventario(false)}
          mobilia={mobilia ?? []}
          funcionarios={funcionarios}
          nosDesbloqueados={nosDesbloqueados}
        />

        <Nav items={navItems} current={core} onChange={go} />

        <RibbonPanel title="Módulos" open={drawer} onClose={() => setDrawer(false)}>
          <motion.div
            variants={listContainer}
            initial="initial"
            animate="enter"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {Object.values(modules).map((m) => (
              <motion.button
                key={m.key}
                variants={listItem}
                {...pressable}
                onClick={() => go(m.key)}
                className="flex flex-col items-center gap-1.5 rounded-md bg-[#f1f4f9] p-3 text-ink hover:bg-[#e6edf7]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-md bg-orange">
                  <Icon name={m.icon} size={18} />
                </span>
                <b className="text-xs">{m.label}</b>
                <span className="rounded-sm bg-teal/15 px-1.5 font-pixel text-[7px] uppercase text-teal">
                  Em breve
                </span>
              </motion.button>
            ))}
          </motion.div>
        </RibbonPanel>
       </RecompensaProvider>
      </div>
    </main>
  );
}
