import type { IconName } from "@/components/ui/Icon";

/**
 * Catálogo de mobília — mesmo padrão de `CARGOS_IA`
 * (features/equipe-ia/catalogo.ts): array estático, `id` referenciado por
 * `ItemMobiliaColocado.itemId` (lib/db nunca importa este catálogo — ver
 * docs/ARQUITETURA-MULTITENANT.md, regra "lib/ nunca importa de features/").
 *
 * Réplica adaptada da "Loja de móveis" do Startup Panic
 * (docs/analise-prints/telas/sede-escritorio-e-mobilia.md §3): preço + bônus
 * por atributo. O bônus é aplicado de verdade na compra — ver
 * `comprarMobilia` em `features/sede/actions.ts`, que repassa `item.bonus`
 * para `GameRepository.comprarMobilia`, aplicado atomicamente na mesma
 * transação do débito (GH-ATR-02).
 *
 * `cor` usa os tokens de categoria já existentes (design-system/tokens.ts)
 * — nunca hex avulso.
 */

export interface ItemMobilia {
  id: string;
  nome: string;
  icon: IconName;
  /** classe Tailwind do token de cor (nunca hex solto) */
  cor: string;
  preco: number;
  categoria: "trabalho" | "conforto" | "decoracao" | "tecnologia";
  descricao: string;
  bonus: {
    tecnologia?: number;
    processo?: number;
    presenca?: number;
  };
}

export const CATALOGO_MOBILIA: ItemMobilia[] = [
  {
    id: "mesa-trabalho",
    nome: "Mesa de Trabalho",
    icon: "desk",
    cor: "bg-cat-media",
    preco: 400,
    categoria: "trabalho",
    descricao: "O básico que sustenta tudo. Sem mesa, não tem escritório.",
    bonus: { processo: 1 },
  },
  {
    id: "estacao-dupla",
    nome: "Estação Dupla",
    icon: "monitor",
    cor: "bg-cat-growth",
    preco: 900,
    categoria: "tecnologia",
    descricao: "Dois monitores, o dobro da produtividade — ou do café derramado.",
    bonus: { tecnologia: 2 },
  },
  {
    id: "servidor-local",
    nome: "Servidor Local",
    icon: "bolt",
    cor: "bg-teal",
    preco: 2500,
    categoria: "tecnologia",
    descricao: "Zumbindo discreto no canto. É nele que tudo roda de verdade.",
    bonus: { tecnologia: 3 },
  },
  {
    id: "sofa-recepcao",
    nome: "Sofá de Recepção",
    icon: "sofa",
    cor: "bg-cat-ads",
    preco: 1200,
    categoria: "conforto",
    descricao: "Cliente que senta confortável negocia melhor. É ciência.",
    bonus: { presenca: 2 },
  },
  {
    id: "planta-tropical",
    nome: "Planta Tropical",
    icon: "plant",
    cor: "bg-cat-social",
    preco: 250,
    categoria: "decoracao",
    descricao: "Prova de vida no escritório — literalmente.",
    bonus: { presenca: 1 },
  },
  {
    id: "quadro-metas",
    nome: "Quadro de Metas",
    icon: "file",
    cor: "bg-orange",
    preco: 600,
    categoria: "decoracao",
    descricao: "Onde os números viram gráfico e o gráfico vira orgulho.",
    bonus: { processo: 2 },
  },
  {
    id: "estante-executiva",
    nome: "Estante Executiva",
    icon: "cube",
    cor: "bg-cat-media",
    preco: 1800,
    categoria: "conforto",
    descricao: "Livros que ninguém lê, mas que impressionam quem visita.",
    bonus: { presenca: 1, processo: 1 },
  },
];

export function itemMobilia(id: string): ItemMobilia | undefined {
  return CATALOGO_MOBILIA.find((i) => i.id === id);
}
