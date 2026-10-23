import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import pkg from "../../../../package.json";

/**
 * Healthcheck real (GH-OPS).
 *
 * `deploy/deploy.sh` valida o deploy com esta rota em vez de `curl` na HOME
 * inteira: ela responde as duas perguntas certas — (1) o processo responde?
 * (2) o driver configurado consegue falar com o banco? — via `pingDb()`, que
 * em cada adapter é o round trip mais barato possível (ver `repository.ts`).
 *
 * `force-dynamic`: nunca cachear um healthcheck — cada chamada mede o agora,
 * não uma resposta velha do build.
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
