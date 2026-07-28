import { slugify } from "@/lib/db/file-adapter";
import type { Negocio } from "@/lib/db/types";

/**
 * Slug do perfil público (GH-GROW-01) — pura, nunca persistida: derivada de
 * nome + id, não uma coluna nova. `slugify()` nunca produz hífen duplo
 * sozinho (só colapsa runs de caracteres não-alfanuméricos em UM hífen), por
 * isso "--" separa nome de id sem ambiguidade e sem precisar de índice/
 * unicidade dedicados — o id (já único) é que garante a unicidade do slug.
 *
 * Se o nome do negócio mudar, o slug muda junto (sem redirect de slug
 * antigo) — aceitável para o MVP; se um dia isso incomodar de verdade,
 * persistir o slug vira migration.
 */
export function slugDoNegocio(negocio: Pick<Negocio, "id" | "nome">): string {
  return `${slugify(negocio.nome)}--${negocio.id}`;
}

/** Recupera o id a partir do slug. `null` se o slug não tiver o separador. */
export function idDoSlug(slug: string): string | null {
  const idx = slug.lastIndexOf("--");
  if (idx === -1) return null;
  const id = slug.slice(idx + 2);
  return id || null;
}
