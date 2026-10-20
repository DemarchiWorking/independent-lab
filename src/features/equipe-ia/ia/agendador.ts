import type { GameRepository } from "@/lib/db";
import { garantirConfig, lerConfig } from "./config";
import { escreverAtomico, lerArquivoTolerante, pastaIA } from "./fila";
import { coletar, varrer, type ResumoColeta, type ResumoVarredura } from "./servico-ia";
import path from "node:path";

/**
 * O "cron" interno da IA. Um laço que roda dentro do servidor do app:
 *
 *  - a cada 30 s recolhe o que o worker terminou (o usuário vê o resultado logo);
 *  - a cada `intervaloVarreduraMin` (60 por padrão) faz a varredura de
 *    melhoria contínua, que só enfileira se a fila estiver vazia.
 *
 * Por que dentro do app e não só num cron do sistema: a varredura precisa ler
 * o repositório (negócios, ofertas, funcionários), e o app é quem o conhece.
 * "Nunca para" vem de três camadas: o container reinicia sozinho
 * (`restart: unless-stopped`), o laço engole qualquer erro e segue, e o
 * guardião do host (`deploy/ia-guardiao.sh`, de hora em hora) confere o
 * batimento do worker e do app e reinicia o que parar.
 *
 * O estado "quando foi a última varredura" fica em disco: reiniciar o app não
 * zera o relógio (nem dispara varredura a cada reinício).
 */

export const TICK_MS = 30_000;

interface EstadoAgendador {
  ultimaVarreduraEm: string | null;
  ultimaColetaEm: string | null;
  ultimaVarredura: ResumoVarredura | null;
}

const arquivo = (): string => path.join(pastaIA(), "agendador.json");

export interface ResumoTick {
  coleta: ResumoColeta | null;
  varredura: ResumoVarredura | null;
}

/**
 * Um passo do agendador. Separado do `setInterval` para poder ser testado sem
 * relógio de verdade.
 */
export async function executarTick(repo: GameRepository, agora: Date = new Date()): Promise<ResumoTick> {
  const resumo: ResumoTick = { coleta: null, varredura: null };
  const estado = await lerArquivoTolerante<EstadoAgendador>(arquivo(), { ultimaVarreduraEm: null, ultimaColetaEm: null, ultimaVarredura: null });

  try {
    resumo.coleta = await coletar(repo, agora);
    estado.ultimaColetaEm = agora.toISOString();
  } catch (e) {
    console.error(JSON.stringify({ evento: "ia-agendador-coleta-erro", erro: e instanceof Error ? e.name : "erro" }));
  }

  try {
    const config = await lerConfig();
    const ultima = estado.ultimaVarreduraEm ? new Date(estado.ultimaVarreduraEm).getTime() : 0;
    if (agora.getTime() - ultima >= config.intervaloVarreduraMin * 60_000) {
      const v = await varrer(repo, agora);
      resumo.varredura = v;
      estado.ultimaVarredura = v;
      // Só conta como "varredura feita" quando ela de fato olhou os negócios. Se pulou por
      // fila ocupada ou worker parado, tenta de novo no próximo passo, assim que for possível.
      if (v.pulou === null || v.pulou === "desligada" || v.pulou === "melhoria-desligada") {
        estado.ultimaVarreduraEm = agora.toISOString();
        if (v.enfileirados > 0) console.info(JSON.stringify({ evento: "ia-varredura", candidatos: v.candidatos, enfileirados: v.enfileirados }));
      }
    }
  } catch (e) {
    console.error(JSON.stringify({ evento: "ia-agendador-varredura-erro", erro: e instanceof Error ? e.name : "erro" }));
  }

  try {
    await escreverAtomico(arquivo(), estado);
  } catch {
    /* o estado do agendador é só conveniência */
  }
  return resumo;
}

declare global {
  var __iaAgendador: ReturnType<typeof setInterval> | undefined;
}

/**
 * Liga o agendador uma única vez por processo (o recarregamento a quente do
 * `next dev` chamaria `register()` mais de uma vez).
 */
export async function iniciarAgendador(repo: GameRepository): Promise<void> {
  if (globalThis.__iaAgendador) return;
  await garantirConfig();

  let emAndamento = false;
  const passo = async () => {
    if (emAndamento) return; // um passo lento não empilha o seguinte
    emAndamento = true;
    try {
      await executarTick(repo);
    } finally {
      emAndamento = false;
    }
  };

  globalThis.__iaAgendador = setInterval(() => void passo(), TICK_MS);
  globalThis.__iaAgendador.unref?.();
  setTimeout(() => void passo(), 20_000).unref?.();
  console.info(JSON.stringify({ evento: "ia-agendador-iniciado", pasta: pastaIA(), tickMs: TICK_MS }));
}

export function pararAgendador(): void {
  if (globalThis.__iaAgendador) clearInterval(globalThis.__iaAgendador);
  globalThis.__iaAgendador = undefined;
}
