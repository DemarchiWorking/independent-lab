// Roda antes do `npm run dev` (script "predev"). Garante que existe um .env
// com GAMEHUB_SECRET forte e exclusivo desta máquina.
//
// O app não tem mais segredo padrão em nenhum modo: um segredo fixo escrito
// no repositório deixava qualquer pessoa na mesma rede forjar o login de
// qualquer negócio numa máquina de demonstração.
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV = ".env";
const MINIMO = 32;

if (!existsSync(ENV)) {
  if (existsSync(".env.example")) {
    copyFileSync(".env.example", ENV);
    console.log("Criado .env a partir de .env.example (modo GAMEHUB_DB=file, sem infra).");
  } else {
    writeFileSync(ENV, "");
  }
}

const conteudo = readFileSync(ENV, "utf8");
const atual = conteudo.match(/^GAMEHUB_SECRET=(.*)$/m)?.[1]?.trim() ?? "";

if (atual.length < MINIMO) {
  const novo = randomBytes(32).toString("hex");
  const atualizado = /^GAMEHUB_SECRET=.*$/m.test(conteudo)
    ? conteudo.replace(/^GAMEHUB_SECRET=.*$/m, `GAMEHUB_SECRET=${novo}`)
    : `${conteudo.replace(/\s*$/, "")}\nGAMEHUB_SECRET=${novo}\n`;
  writeFileSync(ENV, atualizado, { mode: 0o600 });
  console.log("GAMEHUB_SECRET gerado no .env local (exclusivo desta máquina).");
}
