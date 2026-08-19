#!/usr/bin/env node
// labdatadev-gamehub — Document Engine — scan-and-generate (GH-DOC-01)
//
// Lê `fila_geracao_documentos` (status = 'pendente'), e para cada item
// invoca o Claude Code (headless) para gerar Canvas + Modelo de Negócio a
// partir da ficha já pronta (`contexto_snapshot`, escrita pela Server Action
// `solicitarGeracaoDocumentos` em `src/features/documentos-gerados/actions.ts`),
// seguindo a metodologia em knowledge-base/. Resultado vai para
// `documentos_gerados`; o item da fila muda para 'concluido' ou 'erro'.
//
// Ao contrário do document-engine do V4mos, aqui NÃO escaneamos formulários
// nem calculamos hash — isso já foi feito no app (Next.js) antes de
// enfileirar. Este script só drena a fila.
//
// Uso:
//   node scripts/scan-and-generate.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "./lib/env.mjs";
import { makeSupabaseClient } from "./lib/supabase.mjs";
import { buildPrompt } from "./lib/prompt.mjs";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_ENV_PATH = join(ROOT_DIR, "..", ".env");
// Kong do stack Supabase self-hosted PRÓPRIO do gamehub (deploy/supabase/,
// distinto do Supabase compartilhado do Company HQ) — publicado em
// 127.0.0.1:8010 (ver deploy/supabase-up.sh, KONG_HTTP_PORT). O prefixo
// /rest/v1 é obrigatório: sem ele o Kong não roteia para o PostgREST.
const SUPABASE_REST_URL = "http://127.0.0.1:8010/rest/v1";
const KNOWLEDGE_BASE_DIR = join(ROOT_DIR, "knowledge-base");
const CLIENTS_DIR = join(ROOT_DIR, "clients");
// 30 min (era 25 até a migration 0039) — o corpus passou de 6 para 7
// documentos por rodada (GH-DOC-02, Análise de Concorrência); ainda cabe
// folgado dentro da janela horária do cron.
const CLAUDE_TIMEOUT_MS = 30 * 60 * 1000;

// Cron roda com PATH mínimo (sem /root/.npm-global/bin) — resolver o binário
// do Claude Code por caminho absoluto é obrigatório, senão o spawn falha
// silenciosamente com ENOENT (mesmo achado do document-engine do V4mos).
const CLAUDE_BIN = "/root/.npm-global/bin/claude";
if (!existsSync(CLAUDE_BIN)) {
  console.error(
    `[${new Date().toISOString()}] ERRO FATAL: binário do Claude Code não encontrado em ${CLAUDE_BIN}. ` +
      `Rode "which claude" numa sessão interativa e atualize essa constante se o caminho de instalação mudou.`
  );
  process.exit(1);
}

// Escopo atual (migration 0039: 7 tipos — ver
// document-engine/knowledge-base/01-corpus-oficial-gamehub.md, "Escopo atual
// de geração").
const DOC_TYPE_MAP = [
  { file: "01-business-model-canvas.md", type: "canvas", title: "Business Model Canvas" },
  { file: "02-modelo-de-negocio.md", type: "modelo-negocio", title: "Modelo de Negócio" },
  { file: "03-analise-swot.md", type: "swot", title: "Análise SWOT Estratégica" },
  { file: "04-resumo-executivo.md", type: "resumo-executivo", title: "Resumo Executivo" },
  {
    file: "05-roadmap-melhoria-continua.md",
    type: "roadmap-melhoria-continua",
    title: "Roadmap de Melhoria Contínua",
  },
  { file: "06-proposta-comercial.md", type: "proposta-comercial", title: "Proposta Comercial" },
  {
    file: "07-analise-concorrencia.md",
    type: "analise-concorrencia",
    title: "Análise de Concorrência",
  },
];
const EXPECTED_FILES = DOC_TYPE_MAP.map((d) => d.file);

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function extrairNome(contextoSnapshot) {
  const primeiraLinha = (contextoSnapshot || "").split("\n")[0] || "";
  const m = primeiraLinha.match(/^#\s*Ficha do negócio\s*—\s*(.+)$/);
  return m ? m[1].trim() : null;
}

function runClaude(prompt, cwd) {
  return new Promise((resolve) => {
    const child = spawn(
      CLAUDE_BIN,
      [
        "-p",
        prompt,
        "--add-dir",
        KNOWLEDGE_BASE_DIR,
        "--allowedTools",
        "Read Write",
        "--permission-mode",
        "acceptEdits",
        "--model",
        "sonnet",
        "--output-format",
        "json",
      ],
      {
        cwd,
        timeout: CLAUDE_TIMEOUT_MS,
        killSignal: "SIGKILL",
        env: { ...process.env, HOME: process.env.HOME || "/root" },
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });
    child.on("error", (err) => {
      resolve({ code: -1, signal: null, stdout, stderr: String(err) });
    });
  });
}

async function main() {
  const appEnv = loadEnv(APP_ENV_PATH);
  const serviceRoleKey = appEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    log(`ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrado em ${APP_ENV_PATH}`);
    process.exit(1);
  }

  const supabase = makeSupabaseClient({ restUrl: SUPABASE_REST_URL, serviceRoleKey });
  mkdirSync(CLIENTS_DIR, { recursive: true });

  log("Consultando fila_geracao_documentos por itens pendentes...");
  const pendentes = await supabase.fetchFilaPendente();

  if (!pendentes || pendentes.length === 0) {
    log("Fila vazia — nada pendente.");
    return;
  }

  log(`${pendentes.length} item(ns) pendente(s) na fila.`);

  let ok = 0;
  let erros = 0;

  for (const item of pendentes) {
    const nome = extrairNome(item.contexto_snapshot) || `tenant ${item.tenant_id}`;
    const clientDir = join(CLIENTS_DIR, `${item.tenant_id}-${item.id}`);
    mkdirSync(clientDir, { recursive: true });

    log(`--- Processando "${nome}" (tenant_id=${item.tenant_id}, fila_id=${item.id}) ---`);

    try {
      await supabase.setFilaProcessando(item.id);
    } catch (e) {
      log(`AVISO: não consegui marcar status=processando para fila_id=${item.id}: ${e.message}`);
    }

    writeFileSync(join(clientDir, "context-ficha.md"), item.contexto_snapshot);

    // GH-DOC-02 — concorrentes reais (mesmo segmento + cidade, perfil
    // público) via RPC `concorrentes_regiao`. Falha aqui NUNCA derruba a
    // rodada inteira (é só enriquecimento) — mas achado real de code review
    // (2026-08-18): antes, falha de rede/RPC/migration-não-aplicada caía no
    // MESMO texto de "nenhum concorrente encontrado" — o 7º documento então
    // afirmava (de forma falsa) "você é o primeiro do segmento" numa
    // rodada onde os dados simplesmente não puderam ser buscados. Agora os
    // dois casos têm textos DIFERENTES — falha é honesta sobre ser falha.
    let concorrentes = null; // null = falha ao buscar; [] = buscou, veio vazio de verdade
    try {
      concorrentes = (await supabase.fetchConcorrentes(item.tenant_id)) || [];
    } catch (e) {
      log(`AVISO: não consegui buscar concorrentes de "${nome}" (tenant_id=${item.tenant_id}): ${e.message}`);
    }
    let contextoConcorrentes;
    if (concorrentes === null) {
      contextoConcorrentes =
        "# Concorrentes reais na mesma região e segmento\n\n" +
        "**Dados indisponíveis nesta rodada** — falha técnica ao buscar (não é ausência de concorrente confirmada). " +
        "Nunca escreva que este negócio é 'o primeiro' ou 'único' do segmento — isso não foi verificado. " +
        "Foque a seção no que a ficha permitir (ex. a resposta livre `concorrentesConhecidos`, se preenchida) e deixe explícito que a comparação com dados reais da plataforma ficará para a próxima rodada.";
    } else if (concorrentes.length > 0) {
      contextoConcorrentes = [
        "# Concorrentes reais na mesma região e segmento",
        "",
        "Dados reais do próprio jogo (mesmo segmento, mesma cidade, perfil público) — NUNCA inventar concorrente além desta lista.",
        "",
        ...concorrentes.map(
          (c) =>
            `- **${c.nome}** — nível ${c.nivel}, degrau ${c.degrau_atual}/5, bairro ${c.bairro_nome}, no jogo desde ${c.criado_em}`,
        ),
      ].join("\n");
    } else {
      contextoConcorrentes =
        "# Concorrentes reais na mesma região e segmento\n\nNenhum concorrente do mesmo segmento cadastrado ainda nesta cidade — escreva sobre a dinâmica regional/do segmento em geral (e a resposta livre de `concorrentesConhecidos` na ficha, se preenchida), nunca fabrique um nome de empresa.";
    }
    writeFileSync(join(clientDir, "context-concorrentes.md"), contextoConcorrentes);

    const prompt = buildPrompt({ nomeNegocio: nome });
    const result = await runClaude(prompt, clientDir);

    if (result.code !== 0) {
      erros++;
      log(`ERRO ao gerar documentação de "${nome}" (exit=${result.code}, signal=${result.signal})`);
      log(`stderr: ${result.stderr.slice(0, 2000)}`);
      try {
        await supabase.setFilaErro(item.id, item.tentativas ?? 0, result.stderr);
      } catch {}
      continue;
    }

    const filesPresent = readdirSync(clientDir);
    const missing = EXPECTED_FILES.filter((f) => !filesPresent.includes(f));
    if (missing.length > 0) {
      erros++;
      const msg = `Claude terminou mas faltam arquivos: ${missing.join(", ")}`;
      log(`ERRO: ${msg} (negócio "${nome}")`);
      try {
        await supabase.setFilaErro(item.id, item.tentativas ?? 0, msg);
      } catch {}
      continue;
    }

    try {
      for (const doc of DOC_TYPE_MAP) {
        const conteudo = readFileSync(join(clientDir, doc.file), "utf8");
        await supabase.insertDocumento({
          tenantId: item.tenant_id,
          filaId: item.id,
          tipo: doc.type,
          titulo: doc.title,
          conteudoMarkdown: conteudo,
        });
      }
      await supabase.setFilaConcluido(item.id);
    } catch (e) {
      erros++;
      log(`ERRO ao gravar documentos_gerados para "${nome}": ${e.message}`);
      try {
        await supabase.setFilaErro(item.id, item.tentativas ?? 0, e.message);
      } catch {}
      continue;
    }

    ok++;
    log(`OK — documentação de "${nome}" gerada e gravada (fila_id=${item.id}).`);
  }

  log(`Concluído. ${ok} gerado(s) com sucesso, ${erros} erro(s).`);
  if (erros > 0) process.exitCode = 1;
}

main().catch((err) => {
  log(`ERRO FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
