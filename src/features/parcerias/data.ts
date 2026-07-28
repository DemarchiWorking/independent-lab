import type { CategoryKey } from "@tokens";
import type { IconName } from "@/components/ui/Icon";

export interface HexNode {
  id: string;
  label: string;
  icon: IconName;
  category: CategoryKey;
  score?: string;
  locked?: boolean;
  description: string;
  /** custo em moeda virtual 🪙 para desbloquear (GH-ARV-01) — nunca R$ real. */
  custo: number;
}

/**
 * Nós da árvore = serviços de TI / parcerias regionais a desbloquear.
 *
 * `custo` varia por nó (réplica do Startup Panic — $285/$293/$347...),
 * crescendo com `score`: o nó de maior fit (`crm`, 10) é o mais caro, não o
 * mais barato — trade-off real, não "sempre compre o melhor primeiro".
 */
export const hexNodes: HexNode[] = [
  {
    id: "web",
    label: "Site & Landing",
    icon: "globe",
    category: "social",
    score: "9.4",
    custo: 300,
    description:
      "Presença digital do parceiro: site institucional e landing pages de captação. Porta de entrada da maioria das imobiliárias.",
  },
  {
    id: "automacao",
    label: "Automação",
    icon: "bolt",
    category: "media",
    score: "8.5",
    custo: 600,
    description:
      "Fluxos n8n/Make que eliminam trabalho manual — leads, follow-up e integração entre sistemas.",
  },
  {
    id: "bi",
    label: "BI / Dados",
    icon: "chart",
    category: "growth",
    score: "7.8",
    custo: 900,
    description:
      "Dashboards e migração de dados (Excel → SQL). Transforma planilhas soltas em decisão orientada por dados.",
  },
  {
    id: "ads",
    label: "Tráfego pago",
    icon: "bolt",
    category: "ads",
    score: "6.8",
    custo: 700,
    description:
      "Campanhas de aquisição com rastreio de CAC — desbloqueia leads em escala para o parceiro.",
  },
  {
    id: "crm",
    label: "Integração CRM",
    icon: "network",
    category: "social",
    score: "10",
    custo: 1200,
    description:
      "Conecta CRM, WhatsApp e site. Nó de maior fit — base para parcerias de indicação e revenda.",
  },
  {
    id: "infra",
    label: "Infra AWS",
    icon: "cube",
    category: "locked",
    locked: true,
    custo: 3000,
    description:
      "Infraestrutura enterprise (EC2/RDS/S3, CI/CD). Desbloqueia ao atingir reputação e o 3º parceiro ativo.",
  },
];

export function noPorId(id: string): HexNode | undefined {
  return hexNodes.find((n) => n.id === id);
}
