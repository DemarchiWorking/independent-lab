#!/usr/bin/env node
/**
 * Gera os segredos do stack Supabase self-hosted (GH-OPS Bloco 2).
 *
 * Zero dependências além do Node — roda ANTES de qualquer `npm ci`, com
 * `node deploy/supabase/gerar-chaves.mjs`. Sem isso, o operador teria que
 * colar valores de um "gerador de JWT" externo e torcer para o `JWT_SECRET`
 * usado para ASSINAR bater com o que cada serviço usa para VALIDAR — a forma
 * clássica de deixar login/RLS quebrado silenciosamente na V.
 *
 * `ANON_KEY`/`SERVICE_ROLE_KEY` são JWTs HS256 comuns (header.payload.assinatura
 * em base64url, HMAC-SHA256) — mesma primitiva que `src/lib/auth/token.ts` já
 * usa no app, só que aqui é o formato que GoTrue/PostgREST/Kong esperam
 * (claims `role`/`iss`/`iat`/`exp`). Validade de 10 anos: são credenciais de
 * SERVIÇO (o `service_role` nunca sai do servidor), não sessão de usuário —
 * a rotação é manual, trocando o `.env` e reiniciando o stack.
 *
 * Uso:
 *   node deploy/supabase/gerar-chaves.mjs            # imprime .env pronto
 *   node deploy/supabase/gerar-chaves.mjs --checar X # valida um ANON_KEY
 *                                                     # existente contra o
 *                                                     # JWT_SECRET de $1 (uso
 *                                                     # interno do vps-setup)
 */
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function assinarJwtHs256(claims, segredo) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const assinatura = createHmac("sha256", segredo)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${header}.${payload}.${assinatura}`;
}

function gerarSegredos() {
  const agora = Math.floor(Date.now() / 1000);
  const dezAnos = 60 * 60 * 24 * 365 * 10;

  const jwtSecret = randomBytes(32).toString("hex"); // 64 chars, >= 32 exigido
  const claimsBase = { iss: "gamehub-selfhost", iat: agora, exp: agora + dezAnos };

  return {
    POSTGRES_PASSWORD: randomBytes(24).toString("hex"),
    JWT_SECRET: jwtSecret,
    ANON_KEY: assinarJwtHs256({ ...claimsBase, role: "anon" }, jwtSecret),
    SERVICE_ROLE_KEY: assinarJwtHs256({ ...claimsBase, role: "service_role" }, jwtSecret),
    // 16 caracteres — mesmo tamanho de chave que o Realtime espera para
    // `Cloak.Ecto` (AES-128); gerar mais que isso quebraria a decriptação.
    REALTIME_DB_ENC_KEY: randomBytes(12).toString("base64url").slice(0, 16),
    // Phoenix (`SECRET_KEY_BASE`) exige >= 64 bytes — hex de 48 bytes = 96
    // chars, folgado acima do mínimo.
    REALTIME_SECRET_KEY_BASE: randomBytes(48).toString("hex"),
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--checar") {
    // Uso interno: confirma que um par (token, segredo) existente ainda bate
    // — usado pelo vps-setup.sh para decidir se regenera ou preserva o .env.
    const [, token, segredo] = args;
    const [header, payload, assinatura] = (token ?? "").split(".");
    if (!header || !payload || !assinatura) {
      console.error("invalido");
      process.exit(1);
    }
    const esperada = createHmac("sha256", segredo)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const a = Buffer.from(esperada);
    const b = Buffer.from(assinatura);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    console.log(ok ? "valido" : "invalido");
    process.exit(ok ? 0 : 1);
  }

  const segredos = gerarSegredos();
  for (const [chave, valor] of Object.entries(segredos)) {
    console.log(`${chave}=${valor}`);
  }
}

main();
