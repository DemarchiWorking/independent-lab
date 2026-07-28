import type { IconName } from "@/components/ui/Icon";
import type { Segmento } from "@/lib/db/types";

/** Aparência de cada segmento no mapa (ícone + cor da "sede"). */
export const SEGMENTOS: Record<
  Segmento,
  { label: string; icon: IconName; cor: string }
> = {
  engenharia: { label: "Engenharia & Construção", icon: "wrench", cor: "bg-cat-social" },
  contabilidade: { label: "Contabilidade & Consultoria", icon: "chart", cor: "bg-cat-media" },
  saude: { label: "Saúde & Equipamentos", icon: "users", cor: "bg-cat-ads" },
  tecnologia: { label: "Tecnologia & TI", icon: "monitor", cor: "bg-teal" },
  alimentacao: { label: "Alimentação & Merenda Escolar", icon: "grid", cor: "bg-cat-growth" },
  comercio: { label: "Loja Produto (estoque)", icon: "cube", cor: "bg-orange" },
  servico: { label: "Prestador de Serviço", icon: "briefcase", cor: "bg-cat-locked" },
  outro: { label: "Outro", icon: "star", cor: "bg-[#8CA0C6]" },
};
