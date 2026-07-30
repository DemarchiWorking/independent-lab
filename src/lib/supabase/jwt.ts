import { createHmac } from "node:crypto";

/**
 * Assina um JWT compatível com o Supabase self-hosted (GH-OPS Bloco 5).
 *
 * SERVER-ONLY — `SUPABASE_JWT_SECRET` nunca pode chegar ao browser. Esse
 * segredo é o MESMO `JWT_SECRET` que o stack Supabase usa para GoTrue,
 * PostgREST e Realtime validarem token (ver
 * `deploy/supabase/docker-compose.yml` e `deploy/vps-setup.sh`, que copia o
 * valor gerado pelo stack para o `.env` do app) — por isso um JWT assinado
 * aqui é aceito por eles sem nenhuma chamada de rede a mais.
 *
 * Por que o app precisa assinar o PRÓPRIO JWT, em vez de usar o que o
 * Supabase Auth emitiria: a sessão deste produto é um cookie HMAC próprio
 * (`src/lib/auth/sessao.ts`), não um login via GoTrue — mesmo quando
 * `GAMEHUB_DB=supabase`, GoTrue só é usado como COFRE DE SENHA
 * (`src/lib/auth/supabase-provider.ts`), o JWT que ele devolve no login é
 * descartado. Presença ao vivo (Realtime) exige um JWT válido para abrir o
 * socket — este módulo é a ponte que faltava entre as duas identidades.
 *
 * Mesma primitiva HS256 de `deploy/supabase/gerar-chaves.mjs` (que assina
 * ANON_KEY/SERVICE_ROLE_KEY) — não é coincidência, é o mesmo formato que
 * qualquer verificador de JWT do Supabase espera.
 */

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export interface ClaimsRealtime {
  /** id do usuário (mesmo `usuarioId` da sessão HMAC própria) */
  sub: string;
  role: "authenticated";
  tenant_id: string;
}

function segredo(): string {
  const s = process.env.SUPABASE_JWT_SECRET;
  if (!s) {
    throw new Error(
      "SUPABASE_JWT_SECRET ausente — necessário só quando GAMEHUB_DB=supabase " +
        "e só para presença ao vivo (Realtime). Ver docs/deploy/02-CONFIGURAR.md.",
    );
  }
  return s;
}

/**
 * Token de curta duração (10 min) — a presença é re-obtida a cada visita à
 * sala, não é sessão de longa vida como o cookie principal. Um token vazado
 * (ex.: log de rede) expira rápido e só concede a mesma visibilidade que
 * qualquer visitante já tem (ver o quem-está-na-sala é intencionalmente
 * público dentro da própria sala).
 */
const TTL_SEGUNDOS = 600;

/**
 * `agoraMs` é explícito (mesmo princípio de `equipe-ia/senioridade.ts` e
 * `lib/auth/token.ts`: relógio nunca escondido dentro da função) — é o que
 * torna a assinatura testável sem mockar `Date.now()`. O único call site
 * real (`src/app/api/realtime-token/route.ts`) não passa nada e usa o
 * default — o servidor É a fonte do relógio ali, não há "outro agora" a
 * injetar em produção.
 */
export function assinarJwtRealtime(
  claims: Omit<ClaimsRealtime, "role">,
  agoraMs: number = Date.now(),
): string {
  const agora = Math.floor(agoraMs / 1000);
  const payload: ClaimsRealtime & { iat: number; exp: number; aud: string } = {
    ...claims,
    role: "authenticated",
    iat: agora,
    exp: agora + TTL_SEGUNDOS,
    aud: "authenticated",
  };

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const assinatura = createHmac("sha256", segredo())
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.${assinatura}`;
}

/** `true` se o app está configurado para presença ao vivo — usado pela rota
 *  da API para responder 501 (não configurado) em vez de 500 (erro). */
export function realtimeConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_JWT_SECRET);
}
