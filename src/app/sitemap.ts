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
 *
 * `force-dynamic` (GH-OPS-07, achado de auditoria BMAD/NFR 2026-08-01):
 * sem isso o Next tenta PRERENDERIZAR esta rota em build time, chamando
 * `listarNegociosPublicos()` contra o Postgres configurado no `.env` do
 * momento do build — se o Supabase não estiver de pé (ou apontar para um
 * hostname interno do Docker, inalcançável do host), `npm run build`
 * quebra inteiro por causa de uma rota que não deveria nunca ser estática.
 * Renderizar sob demanda é o comportamento certo para um sitemap que
 * reflete cadastros novos, não só o fix do gate.
 */
export const dynamic = "force-dynamic";

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
