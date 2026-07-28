import { fileURLToPath } from "node:url";

/**
 * `outputFileTracingRoot` fixado no diretório deste projeto — sem isso, o
 * Next.js emite um warning em todo build sempre que este repositório é
 * aberto como git worktree (`.claude/worktrees/...`): ele encontra o
 * `package-lock.json` do checkout principal em um diretório acima e fica
 * em dúvida sobre qual é a raiz real. Fixar aqui resolve para qualquer
 * checkout (principal ou worktree), sempre relativo a este arquivo.
 */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;
