#!/usr/bin/env node
// ia-worker: executa os pedidos de IA que o app deixa na pasta de troca.
//
// Por que este arquivo existe separado do app:
//   - É o ÚNICO componente que guarda credencial da Anthropic. O app, que é a
//     superfície pública e recebe texto de qualquer usuário, nunca a vê.
//   - Não abre porta e não recebe requisição: só lê `pendente/`, chama a IA e
//     grava `concluido/` ou `falhou/`.
//   - Não tem dependências (só Node 24): pouco código para auditar num lugar
//     que guarda um segredo.
//   - Não entende o conteúdo: não monta prompt nem valida a resposta. Quem
//     confia ou desconfia do que o modelo escreveu é o app.
//
// Formato dos arquivos: ver `src/features/equipe-ia/ia/contrato.ts`.
//
// Modos de autenticação (escolhidos na tela do admin, lidos de `config.json`):
//   api         ANTHROPIC_API_KEY (Console). Segue os termos da Anthropic.
//   assinatura  login da assinatura Pro/Max via `claude -p`. A Anthropic NÃO
//               permite rotear requisições de usuários de um produto por
//               credencial de assinatura (code.claude.com/docs/en/legal-and-compliance).
//               Só liga com IA_PERMITIR_ASSINATURA=1: é uma segunda confirmação
//               do operador, por conta e risco dele.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const CONTRATO = 1;
export const VERSAO_WORKER = "1.0.0";
export const ESTADOS = ["pendente", "processando", "concluido", "falhou"];

const MIN = 60_000;
const API_VERSAO = "2023-06-01";
const TIMEOUT_API_MS = 280_000;
const TIMEOUT_CLI_MS = 600_000;
const POLL_MS = 5_000;
const ORFAO_MS = 15 * MIN;
const MAX_TENTATIVAS = 3;
const RETENCAO_RESULTADO_MS = 24 * 60 * MIN;

// ---------------------------------------------------------------- utilidades

const codigoErro = (e) => (e && typeof e === "object" && "code" in e ? String(e.code) : undefined);

export const dormir = (ms, sinal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (sinal) sinal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

/** `AAAA-MM-DD` em UTC: o dia que fecha os contadores e o teto de gasto. */
export function diaUtc(data) {
  return data.toISOString().slice(0, 10);
}

export function proximaMeiaNoiteUtc(data) {
  const d = new Date(data);
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

async function lerJson(arquivo, padrao) {
  let texto;
  try {
    texto = await fs.readFile(arquivo, "utf8");
  } catch (e) {
    if (codigoErro(e) === "ENOENT") return padrao;
    throw e;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return padrao;
  }
}

/** Grava de forma atômica (temporário + rename): quem lê vê tudo ou nada. */
export async function escreverJson(arquivo, dados) {
  await fs.mkdir(path.dirname(arquivo), { recursive: true, mode: 0o700 });
  const tmp = `${arquivo}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(dados, null, 2), { encoding: "utf8", mode: 0o600 });
  try {
    await fs.rename(tmp, arquivo);
  } catch (e) {
    await fs.rm(tmp, { force: true });
    throw e;
  }
}

/** Só aceita ids que o app gera: letras minúsculas, números e hífen. */
export function idValido(id) {
  return typeof id === "string" && /^[a-z0-9-]{1,100}$/.test(id);
}

async function idsDe(pasta, estado) {
  let nomes;
  try {
    nomes = await fs.readdir(path.join(pasta, estado));
  } catch (e) {
    if (codigoErro(e) === "ENOENT") return [];
    throw e;
  }
  return nomes.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)).filter(idValido);
}

const arq = (pasta, estado, id) => path.join(pasta, estado, `${id}.json`);

// ------------------------------------------------------------ classificação

/**
 * Traduz uma resposta HTTP de erro da API em uma decisão do worker.
 * `esperaMs` só existe quando o próprio servidor disse quanto esperar.
 */
export function classificarHttp(status, corpo, cabecalhos) {
  const tipo = corpo && typeof corpo === "object" && corpo.error ? String(corpo.error.type ?? "") : "";
  const mensagem = corpo && typeof corpo === "object" && corpo.error ? String(corpo.error.message ?? "") : "";
  const retry = Number(cabecalhos?.get?.("retry-after"));
  const esperaMs = Number.isFinite(retry) && retry > 0 ? Math.min(retry * 1000, 2 * 60 * MIN) : null;

  if (status === 401 || status === 403 || tipo === "authentication_error" || tipo === "permission_error") {
    return { codigo: "auth", mensagem };
  }
  if (status === 402 || tipo === "billing_error") return { codigo: "gasto", mensagem };
  if (status === 429 || tipo === "rate_limit_error") {
    // 429 sem retry-after é o teto de gasto da organização: não adianta insistir logo.
    return { codigo: "limite", esperaMs: esperaMs ?? 30 * MIN, mensagem };
  }
  if (status === 529 || tipo === "overloaded_error" || status >= 500) return { codigo: "sobrecarga", mensagem };
  if (status === 504 || tipo === "timeout_error") return { codigo: "timeout", mensagem };
  if (status === 400 && /spend limit|usage limit|credit balance/i.test(mensagem)) return { codigo: "gasto", mensagem };
  return { codigo: "invalido", mensagem };
}

/** Mesma decisão para o `claude -p`, que devolve texto, não códigos HTTP. */
export function classificarCli(texto) {
  const t = String(texto ?? "");
  if (/(usage|rate)[ -]?limit|limit reached|too many requests|\b429\b/i.test(t)) {
    const reset = /\|\s*(\d{10})\b/.exec(t);
    const epoch = reset ? Number(reset[1]) * 1000 - Date.now() : null;
    const esperaMs = epoch && epoch > 0 ? Math.min(epoch, 6 * 60 * MIN) : 60 * MIN;
    return { codigo: "limite", esperaMs, mensagem: t.slice(0, 200) };
  }
  if (/not logged in|login|authenticat|unauthori[sz]ed|expired|invalid (api key|token)|\b401\b|\b403\b/i.test(t)) {
    return { codigo: "auth", mensagem: t.slice(0, 200) };
  }
  if (/overloaded|\b529\b|\b5\d\d\b|econnreset|socket hang up|network/i.test(t)) {
    return { codigo: "sobrecarga", mensagem: t.slice(0, 200) };
  }
  return { codigo: "interno", mensagem: t.slice(0, 200) };
}

export function custoEstimado(config, modelo, uso) {
  const preco = config?.modelos?.[modelo];
  if (!preco) return 0;
  const usd = (uso.entrada * preco.entradaUsdPorMTok + uso.saida * preco.saidaUsdPorMTok) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

/** Tira cercas de código e texto em volta de um JSON, se o modelo as colocou. */
export function extrairJson(texto) {
  const bruto = String(texto ?? "").trim();
  const cerca = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(bruto);
  const candidato = cerca ? cerca[1] : bruto;
  try {
    return JSON.parse(candidato);
  } catch {
    const ini = candidato.indexOf("{");
    const fim = candidato.lastIndexOf("}");
    if (ini >= 0 && fim > ini) {
      try {
        return JSON.parse(candidato.slice(ini, fim + 1));
      } catch {
        /* cai no erro abaixo */
      }
    }
    throw new Error("resposta não é JSON");
  }
}

// ----------------------------------------------------------------- modo API

function urlBaseApi(env) {
  const base = (env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");
  const u = new URL(base);
  const local = u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.hostname === "[::1]";
  // A chave só viaja por https (ou por loopback, nos testes).
  if (u.protocol !== "https:" && !local) throw new Error("ANTHROPIC_BASE_URL precisa ser https");
  return base;
}

/**
 * Uma chamada à Messages API. Sem SDK: um POST. A resposta JSON vem como texto
 * (`output_config.format`); o app valida o conteúdo, aqui só se extrai.
 */
export async function chamarApi({ pedido, config, env, fetchImpl = fetch, sinal }) {
  const chave = env.ANTHROPIC_API_KEY;
  if (!chave) return { falha: { codigo: "config", mensagem: "ANTHROPIC_API_KEY ausente" } };
  const url = `${urlBaseApi(env)}/v1/messages`;
  const preco = config?.modelos?.[pedido.modelo];

  const montar = (opcoes) => {
    const corpo = {
      model: pedido.modelo,
      max_tokens: pedido.maxTokens,
      system: pedido.sistema,
      messages: [{ role: "user", content: pedido.entrada }],
    };
    if (pedido.schema && opcoes.estruturado) corpo.output_config = { format: { type: "json_schema", schema: pedido.schema } };
    if (preco?.thinking && opcoes.thinking) corpo.thinking = preco.thinking;
    return corpo;
  };

  let opcoes = { estruturado: true, thinking: true };
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TIMEOUT_API_MS);
    sinal?.addEventListener("abort", () => controle.abort(), { once: true });
    let resposta;
    try {
      resposta = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": chave, "anthropic-version": API_VERSAO },
        body: JSON.stringify(montar(opcoes)),
        signal: controle.signal,
      });
    } catch (e) {
      if (sinal?.aborted) return { falha: { codigo: "interno", mensagem: "interrompido" }, interrompido: true };
      const abortou = e && typeof e === "object" && e.name === "AbortError";
      return { falha: { codigo: abortou ? "timeout" : "sobrecarga", mensagem: abortou ? "tempo esgotado" : "falha de rede" } };
    } finally {
      clearTimeout(relogio);
    }

    let corpo = null;
    try {
      corpo = await resposta.json();
    } catch {
      /* corpo não JSON: segue só com o status */
    }

    if (!resposta.ok) {
      const decisao = classificarHttp(resposta.status, corpo, resposta.headers);
      // Parâmetros opcionais que o modelo recusa: tenta de novo sem eles, uma vez cada.
      if (resposta.status === 400 && /thinking/i.test(decisao.mensagem) && opcoes.thinking) {
        opcoes = { ...opcoes, thinking: false };
        continue;
      }
      if (resposta.status === 400 && /schema|too complex|output_config/i.test(decisao.mensagem) && opcoes.estruturado) {
        opcoes = { ...opcoes, estruturado: false };
        continue;
      }
      return { falha: decisao };
    }

    const parada = corpo?.stop_reason;
    const uso = { entrada: Number(corpo?.usage?.input_tokens) || 0, saida: Number(corpo?.usage?.output_tokens) || 0 };
    if (parada === "max_tokens") return { falha: { codigo: "truncado", mensagem: "resposta cortada no limite de tokens" }, uso };
    if (parada === "refusal") return { falha: { codigo: "recusa", mensagem: "o modelo recusou o pedido" }, uso };

    const texto = (corpo?.content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join("");
    if (!pedido.schema) return { saida: texto, uso };
    try {
      return { saida: extrairJson(texto), uso };
    } catch {
      return { falha: { codigo: "invalido", mensagem: "resposta não é JSON" }, uso };
    }
  }
  return { falha: { codigo: "invalido", mensagem: "pedido recusado pela API" } };
}

// ------------------------------------------------------------ modo assinatura

/** Ambiente MÍNIMO do `claude -p`: nunca herda chave de API nem o resto do ambiente. */
export function ambienteDoCli(env, casa) {
  const saida = {
    PATH: env.PATH ?? "",
    HOME: casa,
    USERPROFILE: casa,
    TMPDIR: casa,
    TEMP: casa,
    CLAUDE_CONFIG_DIR: path.join(casa, ".claude"),
    CLAUDE_CODE_OAUTH_TOKEN: env.CLAUDE_CODE_OAUTH_TOKEN ?? "",
    DISABLE_AUTOUPDATER: "1",
    NO_COLOR: "1",
    LANG: "C.UTF-8",
  };
  // Windows precisa disto para iniciar processos; não carrega segredo.
  if (env.SystemRoot) saida.SystemRoot = env.SystemRoot;
  return saida;
}

/**
 * Uma chamada ao `claude -p`. Sem `--bare` de propósito: o modo bare ignora o
 * token OAuth. Sem ferramentas, sem MCP, sem comandos e sem sessão salva: o
 * modelo só devolve texto. A chave de API, se existisse, venceria a assinatura
 * em `-p`: por isso `ambienteDoCli` nunca a repassa.
 */
export async function chamarCli({ pedido, env, bin = "claude", argsIniciais = [], spawnImpl = spawn, sinal }) {
  if (!env.CLAUDE_CODE_OAUTH_TOKEN) return { falha: { codigo: "config", mensagem: "CLAUDE_CODE_OAUTH_TOKEN ausente" } };
  const casa = await fs.mkdtemp(path.join(os.tmpdir(), "ia-worker-"));
  try {
    const arquivoSistema = path.join(casa, "sistema.txt");
    await fs.writeFile(arquivoSistema, pedido.sistema, { encoding: "utf8", mode: 0o600 });
    const args = [
      ...argsIniciais,
      "-p",
      "--output-format",
      "json",
      "--no-session-persistence",
      "--tools",
      "",
      "--disable-slash-commands",
      "--strict-mcp-config",
      "--max-turns",
      "3",
      "--model",
      pedido.modelo,
      "--system-prompt-file",
      arquivoSistema,
    ];
    if (pedido.schema) args.push("--json-schema", JSON.stringify(pedido.schema));

    const resultado = await new Promise((resolve) => {
      let filho;
      try {
        filho = spawnImpl(bin, args, { cwd: casa, env: ambienteDoCli(env, casa), stdio: ["pipe", "pipe", "pipe"] });
      } catch (e) {
        resolve({ erroInicio: String(e?.message ?? e) });
        return;
      }
      let out = "";
      let err = "";
      let terminou = false;
      const fim = (valor) => {
        if (terminou) return;
        terminou = true;
        clearTimeout(relogio);
        resolve(valor);
      };
      const relogio = setTimeout(() => {
        filho.kill?.("SIGKILL");
        fim({ timeout: true });
      }, TIMEOUT_CLI_MS);
      sinal?.addEventListener("abort", () => (filho.kill?.("SIGTERM"), fim({ interrompido: true })), { once: true });
      filho.stdout?.on("data", (d) => (out += d));
      filho.stderr?.on("data", (d) => (err += d));
      filho.on("error", (e) => fim({ erroInicio: String(e?.message ?? e) }));
      filho.on("close", (codigo) => fim({ codigo, out, err }));
      filho.stdin?.on("error", () => {});
      filho.stdin?.end(pedido.entrada);
    });

    if (resultado.interrompido) return { falha: { codigo: "interno", mensagem: "interrompido" }, interrompido: true };
    if (resultado.timeout) return { falha: { codigo: "timeout", mensagem: "tempo esgotado" } };
    if (resultado.erroInicio) return { falha: { codigo: "config", mensagem: `não foi possível iniciar o claude: ${resultado.erroInicio.slice(0, 120)}` } };

    let json = null;
    try {
      json = JSON.parse(resultado.out);
    } catch {
      /* saída que não é JSON: classifica pelo texto */
    }
    if (!json || typeof json !== "object") return { falha: classificarCli(`${resultado.out}\n${resultado.err}`) };

    const u = json.usage ?? {};
    const uso = {
      entrada: (Number(u.input_tokens) || 0) + (Number(u.cache_read_input_tokens) || 0) + (Number(u.cache_creation_input_tokens) || 0),
      saida: Number(u.output_tokens) || 0,
    };
    if (json.is_error || resultado.codigo !== 0) {
      return { falha: classificarCli(`${json.result ?? ""}\n${resultado.err}`), uso };
    }
    if (json.subtype === "error_max_turns") return { falha: { codigo: "truncado", mensagem: "limite de turnos" }, uso };
    if (pedido.schema) {
      if (json.structured_output && typeof json.structured_output === "object") return { saida: json.structured_output, uso, custoNocional: json.total_cost_usd };
      try {
        return { saida: extrairJson(json.result), uso, custoNocional: json.total_cost_usd };
      } catch {
        return { falha: { codigo: "invalido", mensagem: "resposta não é JSON" }, uso };
      }
    }
    return { saida: String(json.result ?? ""), uso, custoNocional: json.total_cost_usd };
  } finally {
    await fs.rm(casa, { recursive: true, force: true });
  }
}

// ----------------------------------------------------------------- capacidade

/** Modos que ESTE worker consegue usar com o ambiente que tem. */
export function modosDisponiveis(env, cliPronto) {
  const modos = [];
  if (env.ANTHROPIC_API_KEY) modos.push("api");
  if (env.IA_PERMITIR_ASSINATURA === "1" && env.CLAUDE_CODE_OAUTH_TOKEN && cliPronto) modos.push("assinatura");
  return modos;
}

async function cliFunciona(bin, argsIniciais, spawnImpl = spawn) {
  return new Promise((resolve) => {
    try {
      const f = spawnImpl(bin, [...argsIniciais, "--version"], { stdio: "ignore" });
      f.on("error", () => resolve(false));
      f.on("close", (c) => resolve(c === 0));
    } catch {
      resolve(false);
    }
  });
}

// ---------------------------------------------------------------------- fila

/** Pedido que ficou em `processando` porque o worker caiu: volta para a fila. */
export async function recuperarOrfaos(pasta, agora) {
  let devolvidos = 0;
  for (const id of await idsDe(pasta, "processando")) {
    const arquivo = arq(pasta, "processando", id);
    const stat = await fs.stat(arquivo).catch(() => null);
    if (!stat || agora.getTime() - stat.mtimeMs < ORFAO_MS) continue;
    const ja = (await idsDe(pasta, "concluido")).includes(id) || (await idsDe(pasta, "falhou")).includes(id);
    if (ja) {
      await fs.rm(arquivo, { force: true });
      continue;
    }
    const pedido = await lerJson(arquivo, null);
    if (!pedido) {
      await fs.rm(arquivo, { force: true });
      continue;
    }
    pedido.tentativas = (pedido.tentativas ?? 0) + 1;
    await escreverJson(arq(pasta, "pendente", id), pedido);
    await fs.rm(arquivo, { force: true });
    devolvidos++;
  }
  return devolvidos;
}

/** Apaga resultados antigos que o app não coletou (não deixa dado parado em disco). */
export async function limparAntigos(pasta, agora) {
  let removidos = 0;
  for (const estado of ["concluido", "falhou"]) {
    for (const id of await idsDe(pasta, estado)) {
      const arquivo = arq(pasta, estado, id);
      const stat = await fs.stat(arquivo).catch(() => null);
      if (stat && agora.getTime() - stat.mtimeMs > RETENCAO_RESULTADO_MS) {
        await fs.rm(arquivo, { force: true });
        removidos++;
      }
    }
  }
  return removidos;
}

/** Próximo pedido: `usuario` antes de `lote`, mais antigo primeiro, respeitando `naoAntesDe`. */
export async function escolherProximo(pasta, agora) {
  const candidatos = [];
  for (const id of await idsDe(pasta, "pendente")) {
    const pedido = await lerJson(arq(pasta, "pendente", id), null);
    if (!pedido || pedido.contrato !== CONTRATO || pedido.id !== id) {
      // Arquivo que não é um pedido válido: sai da fila para não travá-la.
      await fs.mkdir(path.join(pasta, "falhou"), { recursive: true, mode: 0o700 });
      await fs.rename(arq(pasta, "pendente", id), arq(pasta, "falhou", id)).catch(() => {});
      continue;
    }
    if (pedido.naoAntesDe && new Date(pedido.naoAntesDe) > agora) continue;
    candidatos.push(pedido);
  }
  candidatos.sort((a, b) => {
    if (a.prioridade !== b.prioridade) return a.prioridade === "usuario" ? -1 : 1;
    return String(a.criadoEm).localeCompare(String(b.criadoEm));
  });
  return candidatos[0] ?? null;
}

async function reivindicar(pasta, pedido) {
  try {
    await fs.mkdir(path.join(pasta, "processando"), { recursive: true, mode: 0o700 });
    await fs.rename(arq(pasta, "pendente", pedido.id), arq(pasta, "processando", pedido.id));
    return true;
  } catch {
    return false;
  }
}

function resultadoBase(pedido, modo, inicio, agora) {
  return {
    contrato: CONTRATO,
    id: pedido.id,
    meta: pedido.meta,
    modelo: pedido.modelo,
    modo,
    duracaoMs: Math.max(0, agora.getTime() - inicio),
    finalizadoEm: agora.toISOString(),
  };
}

// --------------------------------------------------------------------- estado

function contadoresVazios(agora) {
  return { dia: diaUtc(agora), jobs: 0, falhas: 0, entradaTokens: 0, saidaTokens: 0, custoUsd: 0 };
}

export function criarEstado({ pasta, env = process.env, relogio = () => new Date(), sleep = dormir, fetchImpl = fetch, spawnImpl = spawn, bin, argsIniciais }) {
  const inicio = relogio();
  return {
    pasta,
    env,
    relogio,
    sleep,
    fetchImpl,
    spawnImpl,
    bin: bin ?? env.IA_CLAUDE_BIN ?? "claude",
    argsIniciais: argsIniciais ?? [],
    iniciadoEm: inicio.toISOString(),
    cliPronto: null,
    pausa: null, // { ate: Date, motivo }
    ultimo: null,
    ocupadoCom: null,
    hoje: contadoresVazios(inicio),
    sinal: null,
  };
}

async function gravarBatimento(est, config) {
  const agora = est.relogio();
  const estado = {
    contrato: CONTRATO,
    pid: process.pid,
    iniciadoEm: est.iniciadoEm,
    batimentoEm: agora.toISOString(),
    versaoWorker: VERSAO_WORKER,
    modoConfigurado: config?.modo ?? null,
    modosDisponiveis: modosDisponiveis(est.env, est.cliPronto === true),
    pausadoAte: est.pausa && est.pausa.ate > agora ? est.pausa.ate.toISOString() : null,
    motivoPausa: est.pausa && est.pausa.ate > agora ? est.pausa.motivo : null,
    ocupadoCom: est.ocupadoCom,
    ultimo: est.ultimo,
    hoje: est.hoje,
  };
  await escreverJson(path.join(est.pasta, "worker.json"), estado);
  return estado;
}

function pausar(est, motivo, ms) {
  est.pausa = { ate: new Date(est.relogio().getTime() + ms), motivo };
}

// --------------------------------------------------------------------- ciclo

/** Executa um pedido já reivindicado e grava o resultado. */
async function executarPedido(est, config, pedido) {
  const modo = config.modo;
  const inicio = est.relogio().getTime();
  est.ocupadoCom = pedido.id;
  await gravarBatimento(est, config);

  let r;
  if (modo === "api") {
    r = await chamarApi({ pedido, config, env: est.env, fetchImpl: est.fetchImpl, sinal: est.sinal });
  } else {
    r = await chamarCli({ pedido, env: est.env, bin: est.bin, argsIniciais: est.argsIniciais, spawnImpl: est.spawnImpl, sinal: est.sinal });
  }
  est.ocupadoCom = null;
  const fim = est.relogio();
  const uso = r.uso ?? { entrada: 0, saida: 0 };
  const custoUsd = r.custoNocional && modo === "assinatura" ? Number(r.custoNocional) || 0 : custoEstimado(config, pedido.modelo, uso);

  if (r.uso) {
    est.hoje.entradaTokens += uso.entrada;
    est.hoje.saidaTokens += uso.saida;
    est.hoje.custoUsd = Math.round((est.hoje.custoUsd + custoUsd) * 1_000_000) / 1_000_000;
  }

  // Interrompido por desligamento: o pedido volta intacto para a fila.
  if (r.interrompido) {
    await escreverJson(arq(est.pasta, "pendente", pedido.id), pedido);
    await fs.rm(arq(est.pasta, "processando", pedido.id), { force: true });
    est.ultimo = { id: pedido.id, estado: "devolvido", motivo: null, em: fim.toISOString() };
    return;
  }

  if (!r.falha) {
    est.hoje.jobs += 1;
    const resultado = { ...resultadoBase(pedido, modo, inicio, fim), estado: "concluido", saida: r.saida, uso, custoUsd, motivo: null, mensagem: null };
    await escreverJson(arq(est.pasta, "concluido", pedido.id), resultado);
    await fs.rm(arq(est.pasta, "processando", pedido.id), { force: true });
    est.ultimo = { id: pedido.id, estado: "concluido", motivo: null, em: fim.toISOString() };
    return;
  }

  const { codigo, mensagem, esperaMs } = r.falha;
  // Auth e limite não são culpa do pedido: ele volta para a fila e o worker espera.
  if (codigo === "auth" || codigo === "limite" || codigo === "gasto" || codigo === "config") {
    const espera = codigo === "limite" ? (esperaMs ?? 30 * MIN) : codigo === "gasto" ? 60 * MIN : 30 * MIN;
    pausar(est, codigo, espera);
    await escreverJson(arq(est.pasta, "pendente", pedido.id), pedido);
    await fs.rm(arq(est.pasta, "processando", pedido.id), { force: true });
    est.ultimo = { id: pedido.id, estado: "devolvido", motivo: codigo, em: fim.toISOString() };
    est.hoje.falhas += 1;
    return;
  }

  // Falha transitória: tenta de novo mais tarde, até MAX_TENTATIVAS.
  if ((codigo === "sobrecarga" || codigo === "timeout" || codigo === "interno") && (pedido.tentativas ?? 0) + 1 < MAX_TENTATIVAS) {
    const tentativas = (pedido.tentativas ?? 0) + 1;
    const naoAntesDe = new Date(fim.getTime() + 30_000 * 2 ** tentativas).toISOString();
    await escreverJson(arq(est.pasta, "pendente", pedido.id), { ...pedido, tentativas, naoAntesDe });
    await fs.rm(arq(est.pasta, "processando", pedido.id), { force: true });
    est.ultimo = { id: pedido.id, estado: "devolvido", motivo: codigo, em: fim.toISOString() };
    est.hoje.falhas += 1;
    return;
  }

  est.hoje.falhas += 1;
  const resultado = { ...resultadoBase(pedido, modo, inicio, fim), estado: "falhou", saida: null, uso, custoUsd, motivo: codigo, mensagem: String(mensagem ?? "").slice(0, 300) };
  await escreverJson(arq(est.pasta, "falhou", pedido.id), resultado);
  await fs.rm(arq(est.pasta, "processando", pedido.id), { force: true });
  est.ultimo = { id: pedido.id, estado: "falhou", motivo: codigo, em: fim.toISOString() };
}

/**
 * Um passo do worker: confere config, limites e pausa, e processa no máximo
 * um pedido. Devolve o que fez (útil nos testes e no log).
 */
export async function ciclo(est) {
  const agora = est.relogio();

  if (diaUtc(agora) !== est.hoje.dia) est.hoje = contadoresVazios(agora);
  if (est.cliPronto === null) est.cliPronto = await cliFunciona(est.bin, est.argsIniciais, est.spawnImpl);

  const config = await lerJson(path.join(est.pasta, "config.json"), null);
  await recuperarOrfaos(est.pasta, agora);

  if (!config || config.contrato !== CONTRATO) {
    await gravarBatimento(est, null);
    return { acao: "sem-config" };
  }
  if (!config.ativa) {
    await gravarBatimento(est, config);
    return { acao: "desligada" };
  }
  if (est.pausa && est.pausa.ate > agora) {
    await gravarBatimento(est, config);
    return { acao: "pausado", motivo: est.pausa.motivo };
  }
  est.pausa = null;

  if (!modosDisponiveis(est.env, est.cliPronto === true).includes(config.modo)) {
    pausar(est, "modo-indisponivel", MIN);
    await gravarBatimento(est, config);
    return { acao: "pausado", motivo: "modo-indisponivel" };
  }

  const lim = config.limites ?? {};
  if (est.hoje.custoUsd >= (lim.gastoMaxUsdDia ?? Infinity)) {
    est.pausa = { ate: proximaMeiaNoiteUtc(agora), motivo: "gasto-diario" };
    await gravarBatimento(est, config);
    return { acao: "pausado", motivo: "gasto-diario" };
  }
  if (est.hoje.jobs >= (lim.jobsPorDia ?? Infinity)) {
    est.pausa = { ate: proximaMeiaNoiteUtc(agora), motivo: "limite-diario" };
    await gravarBatimento(est, config);
    return { acao: "pausado", motivo: "limite-diario" };
  }

  const pedido = await escolherProximo(est.pasta, agora);
  if (!pedido) {
    await limparAntigos(est.pasta, agora);
    await gravarBatimento(est, config);
    return { acao: "ocioso" };
  }
  if (pedido.expiraEm && new Date(pedido.expiraEm) < agora) {
    const resultado = { ...resultadoBase(pedido, config.modo, agora.getTime(), agora), estado: "falhou", saida: null, uso: { entrada: 0, saida: 0 }, custoUsd: 0, motivo: "expirado", mensagem: "pedido expirou na fila" };
    await escreverJson(arq(est.pasta, "falhou", pedido.id), resultado);
    await fs.rm(arq(est.pasta, "pendente", pedido.id), { force: true });
    return { acao: "expirado", id: pedido.id };
  }
  if (!(await reivindicar(est.pasta, pedido))) return { acao: "ocioso" };

  await executarPedido(est, config, pedido);
  await gravarBatimento(est, config);
  return { acao: "processou", id: pedido.id, resultado: est.ultimo };
}

/** Laço principal. Para quando `sinal` é abortado ou `maxCiclos` é atingido. */
export async function rodar(est, { sinal, maxCiclos = Infinity } = {}) {
  est.sinal = sinal ?? null;
  let n = 0;
  while (!sinal?.aborted && n < maxCiclos) {
    n++;
    let r;
    try {
      r = await ciclo(est);
    } catch (e) {
      console.error(`[ia-worker] erro no ciclo: ${e instanceof Error ? e.message : String(e)}`);
      r = { acao: "erro" };
    }
    // Com trabalho na fila, segue direto; sem trabalho, espera.
    if (r.acao !== "processou") await est.sleep(POLL_MS, sinal);
  }
  return n;
}

// ---------------------------------------------------------------------- main

async function main() {
  const pasta = path.resolve(process.env.IA_SPOOL_DIR || "/spool");
  const est = criarEstado({ pasta });
  const controle = new AbortController();
  for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => controle.abort());

  if (est.env.ANTHROPIC_API_KEY && est.env.CLAUDE_CODE_OAUTH_TOKEN) {
    console.warn("[ia-worker] aviso: chave de API e token de assinatura definidos; o modo escolhido na tela do admin decide qual usar.");
  }
  console.info(`[ia-worker] ${VERSAO_WORKER} iniciado; pasta de troca: ${pasta}`);
  await rodar(est, { sinal: controle.signal });
  console.info("[ia-worker] encerrado");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`[ia-worker] falha fatal: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}
