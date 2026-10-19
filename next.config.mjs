import { fileURLToPath } from "node:url";

const dev = process.env.NODE_ENV !== "production";

/** Origem do Supabase (presença ao vivo), só quando configurado. */
function origemSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  const origem = new URL(url).origin;
  return [origem, origem.replace(/^http/, "ws")];
}

/**
 * Content Security Policy. Tudo é servido pelo próprio app: fontes vêm de
 * `next/font` (self-hosted no build) e o Pixi usa `pixi.js/unsafe-eval`, a
 * variante sem `new Function`. Scripts inline continuam permitidos porque o
 * App Router injeta os dados de hidratação inline; usar nonce obrigaria todas
 * as páginas a serem dinâmicas. `unsafe-eval` existe só em dev (Fast Refresh).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  ["connect-src 'self'", ...origemSupabase(), ...(dev ? ["ws:"] : [])].join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const cabecalhosDeSeguranca = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // HSTS fica na borda (Caddy), que é quem termina o TLS.
];

const nextConfig = {
  reactStrictMode: true,
  /**
   * `outputFileTracingRoot` fixado neste diretório: sem isso, o Next.js
   * avisa em todo build aberto como git worktree (acha o lockfile do
   * checkout principal num diretório acima).
   */
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  /** Servidor mínimo para o container (`.next/standalone/server.js`). */
  output: "standalone",
  /** Não anuncia "X-Powered-By: Next.js". */
  poweredByHeader: false,
  /**
   * O app não usa `next/image`. Desligar o otimizador remove o endpoint
   * `/_next/image`, que teve falhas críticas (ex.: GHSA-2xp9-vwfh-vxw4).
   */
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca }];
  },
};

export default nextConfig;
