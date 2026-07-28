import type { CategoryKey } from "@tokens";

export interface Job {
  id: string;
  title: string;
  categoryLabel: string;
  category: CategoryKey;
  reward: string;
  rating: number; // 0–5
  minScore: number;
  days: number;
  partner: string;
  description: string;
}

/** Jobs = serviços de TI reais do portfólio labdatadev, gamificados.
 *  Espelham os "trabalhos" observados no Startup Panic. */
export const jobs: Job[] = [
  {
    id: "excel-sql",
    title: "Migração Excel → SQL Server",
    categoryLabel: "Dados",
    category: "growth",
    reward: "R$ 1.880",
    rating: 3,
    minScore: 6,
    days: 12,
    partner: "Imobiliária Vale",
    description:
      "Cliente da região precisa migrar planilhas de imóveis para um banco SQL Server estruturado, com carga automática e validação. Segue o playbook de melhoria contínua.",
  },
  {
    id: "uxui",
    title: "Designer de UX/UI para consultoria",
    categoryLabel: "UX/UI",
    category: "social",
    reward: "R$ 3.830",
    rating: 4,
    minScore: 7,
    days: 19,
    partner: "Consultoria Cresce",
    description:
      "Redesenho da interface de um produto de consultoria em crescimento, com design system e componentes reutilizáveis.",
  },
  {
    id: "landing",
    title: "Landing page + banner de produtos",
    categoryLabel: "Web",
    category: "social",
    reward: "R$ 2.911",
    rating: 3,
    minScore: 7,
    days: 14,
    partner: "Loteadora Sol",
    description:
      "Página de captação chamativa e colorida, com banner de produtos e formulário integrado ao CRM.",
  },
  {
    id: "aws",
    title: "Deploy AWS + VPS para imobiliária",
    categoryLabel: "Infra",
    category: "ads",
    reward: "R$ 4.200",
    rating: 5,
    minScore: 9,
    days: 21,
    partner: "Construtora Norte",
    description:
      "Provisionamento de infraestrutura (EC2/RDS/S3), CI/CD e observabilidade para o sistema interno do parceiro.",
  },
  {
    id: "n8n",
    title: "Fluxo n8n: leads no WhatsApp",
    categoryLabel: "Automação",
    category: "media",
    reward: "R$ 2.600",
    rating: 4,
    minScore: 6,
    days: 9,
    partner: "Imob. Centro",
    description:
      "Automação que captura leads dos anúncios e distribui no WhatsApp Business com qualificação BANT.",
  },
];
