#!/usr/bin/env node
// Verificação do worker de IA: responde "a IA vai funcionar?" sem precisar esperar
// um pedido de verdade.
//
//   node verificar.mjs               confere ambiente, CLI e login, SEM gastar token
//   node verificar.mjs --chamada     + uma chamada real mínima (Haiku, ~100 tokens)
//   node verificar.mjs --chamada --modo=api        testa o modo API
//   node verificar.mjs --chamada --modo=assinatura testa a assinatura (padrão)
//
// Na VPS:  docker exec independent-lab-ia-worker node /app/verificar.mjs --chamada
//
// Sai com 0 quando o modo pedido está pronto, 1 quando algo impede.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chamarApi, chamarCli, modosDisponiveis, ambienteDoCli } from "./worker.mjs";
import os from "node:os";

const OK = "✓";
const FALHA = "✗";
const AVISO = "!";

const PEDIDO_MINIMO = {
  contrato: 1,
  id: "verificacao",
  modelo: "claude-haiku-5-5",
  maxTokens: 200,
  sistema: "Você responde somente com JSON.",
  entrada: 'Responda exatamente com {"ok": true}.',
  schema: { type: "object", additionalProperties: false, required: ["ok"], properties: { ok: { type: "boolean" } } },
};

async function rodar(bin, args, env, spawnImpl = spawn, tempoMs = 30_000) {
  return new Promise((resolve) => {
    let out = "";
    let terminou = false;
    const fim = (v) => {
      if (terminou) return;
      terminou = true;
      clearTimeout(t);
      resolve(v);
    };
    let filho;
    try {
      filho = spawnImpl(bin, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      return resolve({ erro: String(e?.message ?? e) });
    }
    const t = setTimeout(() => {
      filho.kill?.("SIGKILL");
      fim({ erro: "demorou demais" });
    }, tempoMs);
    filho.stdout?.on("data", (d) => (out += d));
    filho.stderr?.on("data", (d) => (out += d));
    filho.on("error", (e) => fim({ erro: String(e?.message ?? e) }));
    filho.on("close", (codigo) => fim({ codigo, out }));
  });
}

/**
 * Confere o worker. Devolve as linhas do relatório (para a tela e para os
 * testes) e se o modo pedido está pronto.
 */
export async function verificar({ env = process.env, pasta, chamada = false, modo, spawnImpl = spawn, fetchImpl = fetch, bin, argsIniciais = [] } = {}) {
  const linhas = [];
  const add = (marca, texto) => linhas.push(`${marca} ${texto}`);
  const comando = bin ?? env.IA_CLAUDE_BIN ?? "claude";

  // 1) pasta de troca e configuração
  const spool = path.resolve(pasta ?? env.IA_SPOOL_DIR ?? "/spool");
  let config = null;
  try {
    await fs.access(spool, fs.constants.W_OK);
    add(OK, `pasta de troca gravável: ${spool}`);
    try {
      config = JSON.parse(await fs.readFile(path.join(spool, "config.json"), "utf8"));
      add(OK, `configuração lida: modo escolhido na tela = ${config.modo}, IA ${config.ativa ? "ligada" : "DESLIGADA"}`);
    } catch {
      add(AVISO, "config.json ainda não existe (o app cria ao subir). O worker espera por ele.");
    }
  } catch {
    add(FALHA, `pasta de troca inacessível: ${spool}`);
  }

  // 2) CLI
  const versao = await rodar(comando, [...argsIniciais, "--version"], { PATH: env.PATH ?? "", SystemRoot: env.SystemRoot }, spawnImpl, 15_000);
  const cliOk = !versao.erro && versao.codigo === 0;
  add(cliOk ? OK : FALHA, cliOk ? `claude instalado: ${String(versao.out).trim().split("\n")[0]}` : "claude NÃO instalado (imagem sem INSTALAR_CLAUDE_CLI=1?)");

  // 3) credenciais e modos
  const modos = modosDisponiveis(env, cliOk);
  const alvo = modo ?? config?.modo ?? "assinatura";
  add(env.IA_PERMITIR_ASSINATURA === "1" ? OK : AVISO, `IA_PERMITIR_ASSINATURA=${env.IA_PERMITIR_ASSINATURA ?? "(vazio)"}`);
  add(env.CLAUDE_CODE_OAUTH_TOKEN || env.IA_CLAUDE_CONFIG_DIR ? OK : AVISO, `credencial da assinatura: ${env.CLAUDE_CODE_OAUTH_TOKEN ? "token (setup-token)" : env.IA_CLAUDE_CONFIG_DIR ? "pasta de login" : "ausente"}`);
  add(env.ANTHROPIC_API_KEY ? OK : AVISO, `créditos de API: ${env.ANTHROPIC_API_KEY ? "chave presente" : "sem chave (modo API indisponível, esperado se ainda não tem créditos)"}`);
  add(modos.length > 0 ? OK : FALHA, `modos prontos neste worker: ${modos.length > 0 ? modos.join(", ") : "nenhum"}`);

  // 4) login da assinatura, sem gastar nada
  if (cliOk && (env.CLAUDE_CODE_OAUTH_TOKEN || env.IA_CLAUDE_CONFIG_DIR)) {
    const casa = await fs.mkdtemp(path.join(os.tmpdir(), "ia-verificar-"));
    try {
      const st = await rodar(comando, [...argsIniciais, "auth", "status"], ambienteDoCli(env, casa), spawnImpl, 20_000);
      try {
        const j = JSON.parse(st.out);
        add(j.loggedIn ? OK : AVISO, j.loggedIn ? `login: ativo (${j.authMethod ?? "?"}${j.subscriptionType ? `, plano ${j.subscriptionType}` : ""})` : "login: `claude auth status` não confirma o login (a chamada real, com --chamada, é o teste definitivo)");
      } catch {
        add(AVISO, `não consegui ler \`claude auth status\`: ${String(st.out ?? st.erro).trim().slice(0, 120)}`);
      }
    } finally {
      await fs.rm(casa, { recursive: true, force: true });
    }
  }

  // 5) chamada real mínima
  let pronto = modos.includes(alvo);
  if (!pronto) add(FALHA, `o modo "${alvo}" não está pronto neste worker`);
  if (chamada && pronto) {
    const pedido = { ...PEDIDO_MINIMO, modelo: modo === "api" || alvo === "api" ? "claude-haiku-5-5" : (config?.modeloLote ?? PEDIDO_MINIMO.modelo) };
    const t0 = Date.now();
    const r = alvo === "api" ? await chamarApi({ pedido, config, env, fetchImpl }) : await chamarCli({ pedido, env, bin: comando, argsIniciais, spawnImpl });
    const s = Math.round((Date.now() - t0) / 1000);
    if (r.falha) {
      pronto = false;
      add(FALHA, `chamada real (${alvo}, ${pedido.modelo}) FALHOU em ${s}s: ${r.falha.codigo}: ${String(r.falha.mensagem ?? "").slice(0, 160)}`);
    } else {
      const certo = r.saida && typeof r.saida === "object" && r.saida.ok === true;
      pronto = Boolean(certo);
      add(certo ? OK : FALHA, `chamada real (${alvo}, ${pedido.modelo}) ${certo ? "respondeu certo" : "respondeu algo inesperado"} em ${s}s, ${r.uso?.entrada ?? 0} tokens de entrada e ${r.uso?.saida ?? 0} de saída`);
    }
  } else if (!chamada && pronto) {
    add(AVISO, "nenhuma chamada real foi feita (use --chamada para gastar ~100 tokens e provar de ponta a ponta)");
  }
  return { linhas, pronto };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const modo = args.find((a) => a.startsWith("--modo="))?.slice(7);
  verificar({ chamada: args.includes("--chamada"), modo }).then(({ linhas, pronto }) => {
    console.log(linhas.join("\n"));
    process.exit(pronto ? 0 : 1);
  });
}
