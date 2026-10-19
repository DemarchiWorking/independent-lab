import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { pastaDados } from "@/lib/db/arquivo";

export const dynamic = "force-dynamic";

/**
 * Saúde do app para o container e para monitor externo. Confere que o
 * processo responde e, no modo arquivo, que a pasta de dados é gravável.
 * Não expõe nada sensível: só a versão (sha do commit) e o tempo no ar.
 * O sha identifica qual release está respondendo, o que o deploy usa para
 * não confundir uma versão nova com a antiga ainda no ar.
 */
export async function GET(): Promise<Response> {
  const cabecalhos = { "Cache-Control": "no-store" };
  const base = {
    versao: process.env.GIT_SHA ?? "dev",
    uptimeSegundos: Math.round(process.uptime()),
  };

  if ((process.env.GAMEHUB_DB ?? "file") === "file") {
    try {
      const pasta = pastaDados();
      await mkdir(pasta, { recursive: true });
      await access(pasta, constants.W_OK);
    } catch {
      return Response.json({ ok: false, ...base, motivo: "pasta de dados sem permissão de escrita" }, { status: 503, headers: cabecalhos });
    }
  }
  return Response.json({ ok: true, ...base }, { headers: cabecalhos });
}
