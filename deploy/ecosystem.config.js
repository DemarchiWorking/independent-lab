const path = require("node:path");

/**
 * Processo PM2 do labdatadev-gamehub.
 *
 * Roda `next start` diretamente (não via `npm run`) — evita a camada extra
 * do processo npm e deixa o PM2 controlar sinais/restart de forma limpa.
 * Bind em 127.0.0.1: o app NUNCA fica exposto direto à internet — só o
 * Nginx (deploy/nginx.conf.template) fala com o mundo e repassa pra cá.
 *
 * `exec_mode: "cluster"` + `instances: 3` (GH-OPS Bloco 3, M-7): antes era
 * `fork`/1 — um processo Node, um core, sob 100 jogadores simultâneos vira o
 * teto de vazão MUITO antes do Supabase. PM2 cluster faz 3 processos
 * dividirem a MESMA porta 8081 (round-robin via `SO_REUSEPORT`, o `next
 * start` builtin já suporta isso). `max_memory_restart` agora é POR
 * processo: orçamento total ≈ 3 × 400M = 1,2 GB, dentro do planejado para a
 * VPS de 8 GB (Supabase self-hosted ~4 GB + isto + Nginx/SO + folga).
 *
 * ⚠️ Só é seguro em `cluster` porque a produção usa `GAMEHUB_DB=supabase`
 * (Bloco 2). Com `GAMEHUB_DB=file` o adapter faz leitura-modificação-escrita
 * de JSON SEM lock (`file-adapter.ts`) — em `fork`/1 processo isso já era
 * frágil sob concorrência; em `cluster`/3 processos seria corrupção de dado
 * garantida (3 processos escrevendo o mesmo arquivo ao mesmo tempo). NUNCA
 * rode `cluster` com `GAMEHUB_DB=file`.
 *
 * Uso:  pm2 start deploy/ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: "labdatadev-gamehub",
      script: "node_modules/.bin/next",
      args: "start -p 8081 -H 127.0.0.1",
      cwd: path.join(__dirname, ".."),
      instances: 3,
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./deploy/logs/out.log",
      error_file: "./deploy/logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
