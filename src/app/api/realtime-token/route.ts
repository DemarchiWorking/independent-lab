import { NextResponse } from "next/server";
import { lerSessao } from "@/lib/auth/sessao";
import { assinarJwtRealtime, realtimeConfigurado } from "@/lib/supabase/jwt";

export const dynamic = "force-dynamic";

/**
 * Troca o cookie de sessão própria por um JWT de curta duração que o
 * Realtime do Supabase aceita (GH-OPS Bloco 5). Chamada pelo browser
 * (`usePresenca.ts`) antes de abrir o canal de presença.
 *
 * 401 sem sessão · 501 quando o app não está configurado para Realtime
 * (`GAMEHUB_DB=file`, ou self-hosted sem `SUPABASE_JWT_SECRET`) — 501, não
 * 500: não é uma falha, é um recurso desligado por configuração, e é
 * exatamente o sinal que `usePresenca` usa pra degradar sem barulho.
 */
export async function GET() {
  if (!realtimeConfigurado()) {
    return NextResponse.json(
      { erro: "Presença ao vivo não configurada neste ambiente." },
      { status: 501 },
    );
  }

  const sessao = await lerSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const token = assinarJwtRealtime({
    sub: sessao.usuarioId,
    tenant_id: sessao.tenantId,
  });

  return NextResponse.json({ token });
}
