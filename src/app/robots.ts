import type { MetadataRoute } from "next";

/** Primeiro `robots.ts` deste app (GH-GROW-01). Bloqueia indexação de rotas
 *  autenticadas/admin — só a vitrine pública (`/n/*`, `/`, `/cadastro`,
 *  `/privacidade`) deve aparecer no Google. */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8081";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/hub", "/painel", "/world", "/admin", "/entrar", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
