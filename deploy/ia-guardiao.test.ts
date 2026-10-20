import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * O guardião roda na VPS, de hora em hora. Aqui ele roda de verdade (bash),
 * contra um `docker` falso que só registra as chamadas, e uma pasta de troca
 * montada à mão. Sem bash no ambiente, os testes são pulados.
 */

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "ia-guardiao.sh");
const temBash = spawnSync("bash", ["-c", "date -d '2026-01-01T00:00:00Z' +%s"], { encoding: "utf8" }).status === 0;

const DOCKER_FALSO = `#!/usr/bin/env bash
echo "$*" >> "$FAKE_LOG"
case "$1" in
  inspect)
    nome="\${@: -1}"; var_nome="\${nome//-/_}"
    case "$3" in
      *State.Running*) v="FAKE_RODANDO_$var_nome"; echo "\${!v:-true}" ;;
      *Health*)        v="FAKE_SAUDE_$var_nome";   echo "\${!v:-healthy}" ;;
    esac
    ;;
  restart|start) [ -n "\${FAKE_FALHA:-}" ] && exit 1; exit 0 ;;
esac
`;

let pasta = "";
let ia = "";
let estado = "";
let docker = "";
let log = "";

beforeEach(() => {
  pasta = mkdtempSync(path.join(tmpdir(), "guardiao-"));
  ia = path.join(pasta, "ia");
  estado = path.join(pasta, "estado");
  log = path.join(pasta, "docker.log");
  docker = path.join(pasta, "docker");
  mkdirSync(path.join(ia, "pendente"), { recursive: true });
  writeFileSync(docker, DOCKER_FALSO);
  chmodSync(docker, 0o755);
  writeFileSync(log, "");
});

afterEach(() => rmSync(pasta, { recursive: true, force: true }));

function batimento(extra: Record<string, unknown> = {}, idadeS = 10) {
  writeFileSync(
    path.join(ia, "worker.json"),
    JSON.stringify({ contrato: 1, batimentoEm: new Date(Date.now() - idadeS * 1000).toISOString(), motivoPausa: null, ...extra }, null, 2),
  );
}

function rodar(env: Record<string, string> = {}) {
  writeFileSync(log, ""); // o registro de chamadas é só desta execução
  const r = spawnSync("bash", [SCRIPT], {
    encoding: "utf8",
    env: { ...process.env, IA_DIR: ia, DOCKER_BIN: docker, ESTADO_DIR: estado, FAKE_LOG: log, ...env },
  });
  const chamadas = readFileSync(log, "utf8").split("\n").filter((l) => /^(restart|start) /.test(l));
  return { codigo: r.status, saida: `${r.stdout}${r.stderr}`, chamadas };
}

describe.skipIf(!temBash)("guardião da IA", () => {
  it("tudo em ordem: não mexe em nada e sai com 0", () => {
    batimento();
    const r = rodar();
    expect(r.codigo).toBe(0);
    expect(r.chamadas).toEqual([]);
    expect(r.saida).toMatch(/ok:/);
  });

  it("worker sem arquivo de batimento: reinicia só o worker, e não de novo dentro de 30 minutos", () => {
    const a = rodar();
    expect(a.codigo).toBe(1);
    expect(a.chamadas).toEqual(["restart independent-lab-ia-worker"]);
    const b = rodar();
    expect(b.chamadas).toEqual([]);
    expect(b.codigo).toBe(2); // não vira laço de reinícios: pede uma pessoa
    expect(b.saida).toMatch(/precisa de uma pessoa|Precisa de uma pessoa/);
  });

  it("batimento velho (mais de 5 minutos) reinicia o worker", () => {
    batimento({}, 900);
    const r = rodar();
    expect(r.codigo).toBe(1);
    expect(r.chamadas).toEqual(["restart independent-lab-ia-worker"]);
  });

  it("container parado é iniciado; container inexistente pede uma pessoa", () => {
    batimento();
    const parado = rodar({ FAKE_RODANDO_independent_lab_app: "false" });
    expect(parado.chamadas).toEqual(["start independent-lab-app"]);
    expect(parado.codigo).toBe(1);

    const ausente = rodar({ FAKE_RODANDO_independent_lab_app: "inexistente" });
    expect(ausente.codigo).toBe(2);
    expect(ausente.saida).toMatch(/publicar\.sh/);
  });

  it("container 'unhealthy' é reiniciado", () => {
    batimento();
    const r = rodar({ FAKE_SAUDE_independent_lab_app: "unhealthy" });
    expect(r.chamadas).toEqual(["restart independent-lab-app"]);
  });

  it("pausa por credencial recusada exige uma pessoa e NÃO reinicia (reiniciar não resolve)", () => {
    batimento({ motivoPausa: "auth" });
    const r = rodar();
    expect(r.codigo).toBe(2);
    expect(r.chamadas).toEqual([]);
    expect(r.saida).toMatch(/ANTHROPIC_API_KEY/);
  });

  it.each([["config"], ["modo-indisponivel"], ["gasto-diario"], ["gasto"]])("pausa '%s' exige uma pessoa", (motivo) => {
    batimento({ motivoPausa: motivo });
    expect(rodar().codigo).toBe(2);
  });

  it("limite de uso da Anthropic é espera normal: só avisa", () => {
    batimento({ motivoPausa: "limite" });
    const r = rodar();
    expect(r.codigo).toBe(0);
    expect(r.saida).toMatch(/limite de uso/);
  });

  it("fila esquecida há horas, com o worker vivo, pede uma pessoa", () => {
    batimento();
    const velho = path.join(ia, "pendente", "a-canvas-0f0f0f0f.json");
    writeFileSync(velho, "{}");
    const antes = new Date(Date.now() - 5 * 3600 * 1000);
    utimesSync(velho, antes, antes);
    writeFileSync(path.join(ia, "pendente", "b-pop-0f0f0f0f.json"), "{}");
    const r = rodar();
    expect(r.codigo).toBe(2);
    expect(r.saida).toMatch(/2 pedido\(s\) na fila/);
  });

  it("fila recente não é problema", () => {
    batimento();
    writeFileSync(path.join(ia, "pendente", "a-canvas-0f0f0f0f.json"), "{}");
    expect(rodar().codigo).toBe(0);
  });

  it("se o Docker recusa reiniciar, diz isso e pede uma pessoa", () => {
    const r = rodar({ FAKE_FALHA: "1" });
    expect(r.codigo).toBe(2);
    expect(r.saida).toMatch(/não consegui reiniciar/);
  });

  it("guarda o momento do último reinício em disco (sobrevive entre execuções)", () => {
    rodar();
    expect(existsSync(path.join(estado, "reinicio-independent-lab-ia-worker"))).toBe(true);
  });
});
