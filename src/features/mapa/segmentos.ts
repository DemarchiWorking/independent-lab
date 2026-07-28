import type { IconName } from "@/components/ui/Icon";
import type { Segmento } from "@/lib/db/types";

/** Aparência de cada segmento no mapa (ícone + cor da "sede"). */
export const SEGMENTOS: Record<
  Segmento,
  { label: string; icon: IconName; cor: string }
> = {
  imobiliaria: { label: "Imobiliária", icon: "briefcase", cor: "bg-cat-social" },
  construtora: { label: "Construtora", icon: "cube", cor: "bg-cat-media" },
  loteadora: { label: "Loteadora", icon: "globe", cor: "bg-cat-growth" },
  comercio: { label: "Comércio", icon: "grid", cor: "bg-cat-ads" },
  servico: { label: "Serviço", icon: "wrench", cor: "bg-teal" },
  outro: { label: "Outro", icon: "star", cor: "bg-[#8CA0C6]" },
};
