import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import pkg from "../../../../package.json";

/**
 * Healthcheck real (GH-OPS M-5).
 *
 * O que existia antes disso: `deploy/deploy.sh` validava o deploy com
 * `curl -fsS http://127.0.0.1:8081/` — a HOME inteira, SSR completo + leitura
 * de banco, só para dizer "está vivo". Caro (falso negativo em cold start,
 * já que a home também depende de sessão/DB) e não distingue "processo Node
 * no ar" de "processo no ar mas o banco caiu".
 *
 * Esta rota faz as duas perguntas certas: (1) o processo responde? (2) o
 * driver configurado consegue falar com o banco? — via `pingDb()`, que em
 * cada adapter é o round trip mais barato possível (ver `repository.ts`).
 *
 * `force-dynamic`: nunca cachear um healthcheck — cada chamada tem que medir
 * o agora, não uma resposta velha do build.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const driver = process.env.GAMEHUB_DB ?? "file";
  const db = await getRepository()
    .pingDb()
    .catch(() => false);

  const corpo = {
    ok: db,
    versao: pkg.version,
    db: driver,
    horario: new Date().toISOString(),
  };

  // 503 (não 200) quando o banco falha — é o status que orquestradores
  // (Docker HEALTHCHECK, PM2, um futuro load balancer) entendem como "tire
  // este processo da fila", diferente de um 200 com `ok: false` no corpo.
  return NextResponse.json(corpo, { status: db ? 200 : 503 });
}
