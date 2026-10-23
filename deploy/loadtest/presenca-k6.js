// ============================================================================
// labdatadev-gamehub — harness de carga (Épico 13, Escala e Replicação).
//
// Mede quantas conexões simultâneas de presença (Supabase Realtime,
// protocolo Phoenix Channels) + tráfego HTTP normal (Server Actions/SSR via
// Nginx) este stack aguenta ANTES de prometer qualquer número em produção —
// mesmo princípio de `docs/architecture/DBA-ARQUITETURA-ESCALA-2026.md`:
// "não prometer o que não foi medido".
//
// O que simula (fielmente, conferido contra
// node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js):
//   - 1 canal Presence por VU, escopo `sede:<tenantId>` (mesmo desenho de
//     `docs/architecture/BMAD-MULTIPLAYER-VPS.md` §2 — nunca um canal
//     global) — os VUs se distribuem entre `NUM_BAIRROS` canais diferentes,
//     como aconteceria na prática (jogadores espalhados pela geografia real
//     via CEP, ver Fase 1 do Épico 13).
//   - handshake `phx_join` com o mesmo payload de config que o
//     `RealtimeChannel.subscribe()` real monta, seguido de `track()` com o
//     mesmo payload mínimo (`{ tenantId, nome }`) que
//     `docs/architecture/BMAD-MULTIPLAYER-VPS.md` §2 documenta como
//     whitelist.
//   - heartbeat Phoenix a cada 15s (a spec pede 30s; metade aqui só para
//     não perder o timeout do servidor durante o teste).
//   - protocolo vsn "1.0.0" (JSON simples) em vez do "2.0.0" binário
//     (default do client real) — mesmo efeito de carga no servidor, sem
//     reimplementar o serializer binário do Phoenix. Documentado, não
//     escondido: é uma aproximação da carga de conexão/join/heartbeat, não
//     um teste de compatibilidade de protocolo.
//   - uma segunda cena (`httpGeral`) martela `/api/health` através do
//     Nginx, simulando SSR/Server Actions normais concorrentes com a
//     presença — é o que valida o `deploy.replicas` do app (Fase 2).
//
// Uso (contra o stack local já de pé — docker-compose.yml +
// docker-compose.supabase.yml, `deploy/supabase-up.sh` já rodado):
//   docker run --rm -i --network host \
//     -e REALTIME_WS_URL=ws://127.0.0.1:8010/realtime/v1/websocket \
//     -e ANON_KEY=<da deploy/supabase/.env> \
//     -e APP_HTTP_URL=http://127.0.0.1:8092 \
//     -e VUS=300 -e HTTP_VUS=20 -e HOLD_SECONDS=30 -e NUM_BAIRROS=30 \
//     grafana/k6 run - < deploy/loadtest/presenca-k6.js
//
// Resultado real medido nesta VPS: docs/architecture/CARGA-1000-SIMULTANEOS.md
// ============================================================================

import ws from "k6/ws";
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

const REALTIME_URL = __ENV.REALTIME_WS_URL || "ws://127.0.0.1:8010/realtime/v1/websocket";
const ANON_KEY = __ENV.ANON_KEY || "";
const APP_HTTP_URL = __ENV.APP_HTTP_URL || "http://127.0.0.1:8092";
const HOLD_SECONDS = parseInt(__ENV.HOLD_SECONDS || "30", 10);
const NUM_BAIRROS = parseInt(__ENV.NUM_BAIRROS || "30", 10);
const VUS = parseInt(__ENV.VUS || "100", 10);
const HTTP_VUS = parseInt(__ENV.HTTP_VUS || "10", 10);

const presencaJoinOk = new Counter("presenca_join_ok");
const presencaJoinFalha = new Counter("presenca_join_falha");
const presencaJoinLatenciaMs = new Trend("presenca_join_latencia_ms");
const presencaTrackOk = new Counter("presenca_track_ok");

export const options = {
  scenarios: {
    presenca: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: VUS },
        { duration: "30s", target: VUS },
        { duration: "10s", target: 0 },
      ],
      exec: "presenca",
    },
    http_geral: {
      executor: "constant-vus",
      vus: HTTP_VUS,
      duration: "60s",
      exec: "httpGeral",
    },
  },
  thresholds: {
    presenca_join_falha: ["count<1"],
  },
};

export function presenca() {
  const tenantId = 1 + (__VU % NUM_BAIRROS);
  const topic = `realtime:sede:${tenantId}`;
  const url = `${REALTIME_URL}?apikey=${ANON_KEY}&vsn=1.0.0`;
  const t0 = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    let heartbeatId;

    socket.on("open", () => {
      // Mesmo payload de config que RealtimeChannel.subscribe() monta
      // (presence.enabled=true, broadcast.self=false, private=false).
      const joinMsg = [
        "1",
        "1",
        topic,
        "phx_join",
        {
          config: {
            broadcast: { ack: false, self: false },
            presence: { enabled: true, key: "" },
            postgres_changes: [],
            private: false,
          },
        },
      ];
      socket.send(JSON.stringify(joinMsg));

      heartbeatId = socket.setInterval(() => {
        socket.send(JSON.stringify([null, "hb", "phoenix", "heartbeat", {}]));
      }, 15000);
    });

    socket.on("message", (data) => {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch (_e) {
        return;
      }
      const evento = msg[3];
      const payload = msg[4];

      if (evento === "phx_reply" && payload && payload.status === "ok") {
        presencaJoinOk.add(1);
        presencaJoinLatenciaMs.add(Date.now() - t0);

        // track() real: só {tenantId, nome} — mesma whitelist de
        // BMAD-MULTIPLAYER-VPS.md §2, nunca XP/moeda/onboarding.
        const trackMsg = [
          "1",
          "2",
          topic,
          "presence",
          {
            type: "presence",
            event: "track",
            payload: { tenantId: String(tenantId), nome: `carga-vu${__VU}` },
          },
        ];
        socket.send(JSON.stringify(trackMsg));
        presencaTrackOk.add(1);
      } else if (evento === "phx_reply" && payload && payload.status === "error") {
        presencaJoinFalha.add(1);
      }
    });

    socket.on("error", () => {
      presencaJoinFalha.add(1);
    });

    socket.setTimeout(() => {
      if (heartbeatId) socket.clearInterval(heartbeatId);
      socket.close();
    }, HOLD_SECONDS * 1000);
  });

  check(res, { "conexão WS aberta (HTTP 101)": (r) => r && r.status === 101 });
}

export function httpGeral() {
  const resposta = http.get(`${APP_HTTP_URL}/api/health`);
  check(resposta, { "health 200": (r) => r.status === 200 });
  sleep(1);
}
