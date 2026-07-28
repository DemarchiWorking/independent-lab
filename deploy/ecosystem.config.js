const path = require("node:path");

/**
 * Processo PM2 do labdatadev-gamehub.
 *
 * Roda `next start` diretamente (não via `npm run`) — evita a camada extra
 * do processo npm e deixa o PM2 controlar sinais/restart de forma limpa.
 * Bind em 127.0.0.1: o app NUNCA fica exposto direto à internet — só o
 * Nginx (deploy/nginx.conf.template) fala com o mundo e repassa pra cá.
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
      instances: 1,
      exec_mode: "fork",
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
