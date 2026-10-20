// Substituto do `claude` para os testes do worker: não chama a internet.
// O comportamento vem do JSON que o worker manda no stdin ({"modo": "..."}),
// porque o ambiente do processo é propositalmente mínimo.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
if (args.includes("--version")) {
  console.log("0.0.0-falso");
  process.exit(0);
}

// ---- Modo PONTE (testes de ponta a ponta) --------------------------------------------
// Com `--servidor <url>`, este "claude" repassa o prompt a um servidor HTTP local (o mesmo
// que imita a API nos testes) e responde no formato JSON do `claude -p` de verdade. Assim a
// assinatura e a API passam pela mesma "inteligência" de teste, e o worker é exercitado com
// processo, stdin, flags e saída JSON reais. Também confere que o worker passou as flags de
// segurança; se faltar uma, responde como a CLI real responderia a um erro.
const iServidor = args.indexOf("--servidor");
if (iServidor >= 0) {
  const servidor = args[iServidor + 1];
  const valorDe = (flag) => args[args.indexOf(flag) + 1];
  const exigidas = ["-p", "--no-session-persistence", "--safe-mode", "--disable-slash-commands", "--strict-mcp-config", "--system-prompt-file", "--model"];
  const faltando = exigidas.filter((x) => !args.includes(x));
  const iTools = args.indexOf("--tools");
  if (iTools < 0 || args[iTools + 1] !== "") faltando.push("--tools ''");
  if (valorDe("--output-format") !== "json") faltando.push("--output-format json");
  if (args.includes("--bare")) faltando.push("(sem --bare)");
  if (faltando.length > 0) {
    console.log(JSON.stringify({ type: "result", subtype: "success", is_error: true, result: `flag ausente ou indevida: ${faltando.join(", ")}`, usage: { input_tokens: 0, output_tokens: 0 } }));
    process.exit(1);
  }
  const prompt = readFileSync(0, "utf8");
  const sistema = readFileSync(valorDe("--system-prompt-file"), "utf8");
  const modelo = valorDe("--model");
  const resposta = await fetch(`${servidor}/v1/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: modelo, system: sistema, messages: [{ role: "user", content: prompt }] }),
  });
  const corpo = await resposta.json();
  if (!resposta.ok) {
    console.log(JSON.stringify({ type: "result", subtype: "success", is_error: true, api_error_status: resposta.status, result: corpo?.error?.message ?? "erro", usage: { input_tokens: 0, output_tokens: 0 } }));
    process.exit(1);
  }
  const texto = (corpo.content ?? []).map((b) => b.text).join("");
  const uso = corpo.usage ?? {};
  const precos = { "claude-haiku-5-5": [0.1, 0.5], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };
  const [pe, ps] = precos[modelo] ?? [0, 0];
  const comEsquema = args.includes("--json-schema");
  let estruturado;
  if (comEsquema) {
    try {
      estruturado = JSON.parse(texto);
    } catch {
      /* a CLI real devolveria o texto em result */
    }
  }
  console.log(
    JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      result: texto,
      ...(estruturado ? { structured_output: estruturado } : {}),
      total_cost_usd: ((uso.input_tokens ?? 0) * pe + (uso.output_tokens ?? 0) * ps) / 1_000_000,
      usage: { input_tokens: uso.input_tokens ?? 0, output_tokens: uso.output_tokens ?? 0 },
    }),
  );
  process.exit(0);
}

const entrada = JSON.parse(readFileSync(0, "utf8"));
const modo = entrada.modo;

const usage = { input_tokens: 700, output_tokens: 300 };

if (modo === "ok") {
  console.log(
    JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      result: "ok",
      total_cost_usd: 0.0123,
      usage,
      structured_output: {
        // O teste confere o que o worker deixou chegar até o processo filho.
        temChaveApi: "ANTHROPIC_API_KEY" in process.env,
        temAuthToken: "ANTHROPIC_AUTH_TOKEN" in process.env,
        temSegredoDoApp: "GAMEHUB_SECRET" in process.env,
        temToken: Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN),
        homeEstaNoTemp: String(process.env.HOME ?? "").includes("ia-worker-"),
        args,
        temSistema: args.includes("--system-prompt-file"),
      },
    }),
  );
  process.exit(0);
}
if (modo === "esquema-recusado" && args.includes("--json-schema")) {
  console.error("Error: --json-schema is not a valid JSON Schema");
  process.exit(1);
}
if (modo === "esquema-recusado") {
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: '{"sem":"esquema"}', usage }));
  process.exit(0);
}
if (modo === "limite-novo") {
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: true, api_error_status: 429, result: "5-hour limit reached ∙ resets 3pm", usage }));
  process.exit(1);
}
if (modo === "modelo-indisponivel") {
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: true, api_error_status: 404, result: "There's an issue with the selected model (claude-haiku-5-5). It may not exist or you may not have access to it.", usage }));
  process.exit(1);
}
if (modo === "texto") {
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: '```json\n{"veio":"do texto"}\n```', usage }));
  process.exit(0);
}
if (modo === "limite") {
  const reset = Math.floor(Date.now() / 1000) + 3600;
  console.log(JSON.stringify({ type: "result", is_error: true, result: `Claude AI usage limit reached|${reset}`, usage }));
  process.exit(1);
}
if (modo === "auth") {
  console.log(JSON.stringify({ type: "result", is_error: true, result: "Invalid API key · Please run /login", usage }));
  process.exit(1);
}
if (modo === "max-turns") {
  console.log(JSON.stringify({ type: "result", subtype: "error_max_turns", is_error: false, result: "", usage }));
  process.exit(0);
}
console.log("isto não é JSON");
process.exit(0);
