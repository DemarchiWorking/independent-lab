import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/db";
import { slugDoNegocio } from "@/features/growth/slug";

/** URL base do site — mesma variável que o resto do deploy já usa para
 *  montar links absolutos (ver deploy/README.md). Sem ela, cai num
 *  placeholder de dev — nunca quebra o build. */
function origem(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8081";
}

/**
 * Sitemap dinâmico (GH-GROW-01) — primeiro deste app. Só negócios com
 * `perfilPublico = true` entram; nunca inclui rotas privadas (`/hub`,
 * `/painel`, `/admin/*`, `/world/*`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = origem();
  const negociosPublicos = await getRepository().listarNegociosPublicos();

  const perfis: MetadataRoute.Sitemap = negociosPublicos.map((n) => ({
    url: `${base}/n/${slugDoNegocio(n)}`,
    lastModified: n.criadoEm,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/cadastro`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.1 },
    ...perfis,
  ];
}
