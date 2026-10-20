// Substituto do `claude` para os testes do worker: não chama a internet.
// O comportamento vem do JSON que o worker manda no stdin ({"modo": "..."}),
// porque o ambiente do processo é propositalmente mínimo.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
if (args.includes("--version")) {
  console.log("0.0.0-falso");
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
