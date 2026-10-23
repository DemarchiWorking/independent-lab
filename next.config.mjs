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
  // `standalone`: gera `.next/standalone/server.js` com só o node_modules
  // mínimo de produção — é o que a imagem Docker (deploy/docker/Dockerfile)
  // copia. Sem isto, `.next/standalone` não existe e o build da imagem falha.
  // Não afeta o `next start` usado pelo PM2 (deploy/ecosystem.config.js),
  // que continua funcionando igual — standalone é só uma saída adicional.
  output: "standalone",
};

export default nextConfig;
