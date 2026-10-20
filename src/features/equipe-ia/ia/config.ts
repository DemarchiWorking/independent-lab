import { VERSAO_CONTRATO, type ConfigIA, type EstadoWorker, type LimitesIA, type ModoIA, type PrecoModelo } from "./contrato";
import { lerArquivoTolerante, escreverAtomico, caminhoConfig } from "./fila";

/**
 * Configuração da IA: um arquivo (`ia/config.json`) que o app grava e o worker
 * lê a cada ciclo. Mudar na tela do admin vale em segundos, sem reiniciar nada.
 *
 * Quem pode mudar: só o e-mail de `souAdminIA` (ver `lib/admin.ts`). Esta
 * camada valida TODO valor, porque a tela e a server action recebem dado de
 * cliente e o worker obedece ao arquivo sem desconfiar.
 */

/**
 * Modelos que o admin pode escolher, com os preços da página oficial de preços
 * da Anthropic (platform.claude.com/docs/en/about-claude/pricing, 20/10/2026).
 * Preço muda: confira a página antes de confiar nos custos mostrados, e
 * atualize esta tabela. `thinking` é o parâmetro que o modelo exige para não
 * gastar tokens "pensando" numa tarefa de redação (doc de erros da API).
 */
export const MODELOS_PADRAO: Readonly<Record<string, PrecoModelo>> = {
  "claude-haiku-5-5": { entradaUsdPorMTok: 0.1, saidaUsdPorMTok: 0.5, thinking: { type: "disabled" } },
  "claude-sonnet-5-5": { entradaUsdPorMTok: 2, saidaUsdPorMTok: 10, thinking: { type: "between_tools" } },
  "claude-opus-5-5": { entradaUsdPorMTok: 4, saidaUsdPorMTok: 20, thinking: null },
};

export const MODELO_USUARIO_PADRAO = "claude-sonnet-5-5";
export const MODELO_LOTE_PADRAO = "claude-haiku-5-5";

/**
 * Padrões pensados para a assinatura Pro (modo principal): ela tem janela de uso
 * (5 horas e semanal), então a melhoria contínua é discreta e deixa folga para
 * o próprio dono usar o Claude. No modo API o gasto é que limita; suba os números
 * na tela se quiser mais velocidade.
 */
export const LIMITES_PADRAO: LimitesIA = {
  pedidosPorNegocioDia: 6,
  melhoriasPorVarredura: 4,
  jobsPorDia: 120,
  gastoMaxUsdDia: 5,
  refinosPorDocumento: 2,
};

export function configPadrao(agora: Date = new Date()): ConfigIA {
  return {
    contrato: VERSAO_CONTRATO,
    ativa: true,
    // A assinatura Claude Pro é o modo principal. A API (créditos) é um toggle do admin,
    // para quando houver créditos. Atenção aos termos da Anthropic: ver IA-OPERACAO.md.
    modo: "assinatura",
    melhoriaContinua: true,
    modeloUsuario: MODELO_USUARIO_PADRAO,
    modeloLote: MODELO_LOTE_PADRAO,
    maxTokensSaida: 12_000,
    intervaloVarreduraMin: 60,
    limites: { ...LIMITES_PADRAO },
    cobrarPorRequisicao: false,
    modelos: structuredClone(MODELOS_PADRAO) as Record<string, PrecoModelo>,
    atualizadoEm: agora.toISOString(),
    atualizadoPor: "sistema",
    historico: [],
  };
}

function numeroEm(v: unknown, min: number, max: number, padrao: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : padrao;
}

function inteiroEm(v: unknown, min: number, max: number, padrao: number): number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : padrao;
}

function objeto(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * Lê qualquer coisa que esteja no arquivo e devolve uma configuração válida:
 * campo ausente ou fora da faixa volta ao padrão. Nunca lança por conteúdo
 * ruim, porque a tela do admin precisa abrir justamente para consertá-lo.
 */
export function normalizarConfig(bruto: unknown, agora: Date = new Date()): ConfigIA {
  const base = configPadrao(agora);
  const c = objeto(bruto);
  const lim = objeto(c.limites);
  const modelo = (v: unknown, padrao: string) => (typeof v === "string" && v in MODELOS_PADRAO ? v : padrao);
  return {
    ...base,
    ativa: typeof c.ativa === "boolean" ? c.ativa : base.ativa,
    modo: c.modo === "api" ? "api" : "assinatura",
    melhoriaContinua: typeof c.melhoriaContinua === "boolean" ? c.melhoriaContinua : base.melhoriaContinua,
    modeloUsuario: modelo(c.modeloUsuario, base.modeloUsuario),
    modeloLote: modelo(c.modeloLote, base.modeloLote),
    maxTokensSaida: inteiroEm(c.maxTokensSaida, 2_000, 32_000, base.maxTokensSaida),
    intervaloVarreduraMin: inteiroEm(c.intervaloVarreduraMin, 15, 1_440, base.intervaloVarreduraMin),
    limites: {
      pedidosPorNegocioDia: inteiroEm(lim.pedidosPorNegocioDia, 0, 100, base.limites.pedidosPorNegocioDia),
      melhoriasPorVarredura: inteiroEm(lim.melhoriasPorVarredura, 0, 200, base.limites.melhoriasPorVarredura),
      jobsPorDia: inteiroEm(lim.jobsPorDia, 0, 5_000, base.limites.jobsPorDia),
      gastoMaxUsdDia: numeroEm(lim.gastoMaxUsdDia, 0, 1_000, base.limites.gastoMaxUsdDia),
      refinosPorDocumento: inteiroEm(lim.refinosPorDocumento, 0, 5, base.limites.refinosPorDocumento),
    },
    // Sempre desativada: ver `ConfigIA.cobrarPorRequisicao`. Nenhum arquivo liga isto.
    cobrarPorRequisicao: false,
    // Preços vêm sempre do código: o arquivo não escolhe quanto custa um modelo.
    modelos: structuredClone(MODELOS_PADRAO) as Record<string, PrecoModelo>,
    atualizadoEm: typeof c.atualizadoEm === "string" ? c.atualizadoEm : base.atualizadoEm,
    atualizadoPor: typeof c.atualizadoPor === "string" ? c.atualizadoPor.slice(0, 120) : base.atualizadoPor,
    historico: Array.isArray(c.historico)
      ? c.historico
          .map(objeto)
          .filter((h) => typeof h.em === "string" && typeof h.por === "string" && Array.isArray(h.mudancas))
          .slice(-20)
          .map((h) => ({ em: String(h.em), por: String(h.por).slice(0, 120), mudancas: (h.mudancas as unknown[]).map(String).slice(0, 12) }))
      : [],
  };
}

export async function lerConfig(): Promise<ConfigIA> {
  return normalizarConfig(await lerArquivoTolerante<unknown>(caminhoConfig(), null));
}

/** Cria `config.json` se não existir: o worker só trabalha com configuração gravada. */
export async function garantirConfig(): Promise<ConfigIA> {
  const bruto = await lerArquivoTolerante<unknown>(caminhoConfig(), null);
  const config = normalizarConfig(bruto);
  if (bruto === null) await escreverAtomico(caminhoConfig(), config);
  return config;
}

export async function gravarConfig(config: ConfigIA): Promise<void> {
  await escreverAtomico(caminhoConfig(), config);
}

// ------------------------------------------------------------- edição do admin

export interface EdicaoAdmin {
  ativa: boolean;
  modo: ModoIA;
  melhoriaContinua: boolean;
  modeloUsuario: string;
  modeloLote: string;
  maxTokensSaida: number;
  intervaloVarreduraMin: number;
  limites: LimitesIA;
}

export type ResultadoEdicao = { ok: true; config: ConfigIA; mudancas: string[] } | { ok: false; erro: string };

const ROTULO_MODO: Record<ModoIA, string> = { api: "créditos de API", assinatura: "assinatura Claude Pro" };

/**
 * Valida o que a tela enviou e produz a nova configuração. O modo assinatura
 * só é aceito se o worker, pelo batimento, diz que tem credencial e a
 * confirmação do operador para esse modo: sem isso o worker pararia em silêncio.
 */
export function aplicarEdicaoAdmin(
  atual: ConfigIA,
  entrada: unknown,
  opcoes: { por: string; agora: Date; batimento: EstadoWorker | null },
): ResultadoEdicao {
  const e = objeto(entrada);
  const lim = objeto(e.limites);

  if (typeof e.ativa !== "boolean") return { ok: false, erro: "Valor inválido em 'IA ligada'." };
  if (typeof e.melhoriaContinua !== "boolean") return { ok: false, erro: "Valor inválido em 'melhoria contínua'." };
  if (e.modo !== "api" && e.modo !== "assinatura") return { ok: false, erro: "Modo de autenticação inválido." };
  if (typeof e.modeloUsuario !== "string" || !(e.modeloUsuario in MODELOS_PADRAO)) return { ok: false, erro: "Modelo dos pedidos de usuário inválido." };
  if (typeof e.modeloLote !== "string" || !(e.modeloLote in MODELOS_PADRAO)) return { ok: false, erro: "Modelo da melhoria contínua inválido." };

  const maxTokensSaida = e.maxTokensSaida;
  if (typeof maxTokensSaida !== "number" || !Number.isInteger(maxTokensSaida) || maxTokensSaida < 2_000 || maxTokensSaida > 32_000) {
    return { ok: false, erro: "Tamanho máximo da resposta: de 2.000 a 32.000 tokens." };
  }
  const intervalo = e.intervaloVarreduraMin;
  if (typeof intervalo !== "number" || !Number.isInteger(intervalo) || intervalo < 15 || intervalo > 1_440) {
    return { ok: false, erro: "Intervalo da varredura: de 15 a 1.440 minutos." };
  }

  const limites: LimitesIA = {
    pedidosPorNegocioDia: inteiroEm(lim.pedidosPorNegocioDia, 0, 100, -1),
    melhoriasPorVarredura: inteiroEm(lim.melhoriasPorVarredura, 0, 200, -1),
    jobsPorDia: inteiroEm(lim.jobsPorDia, 0, 5_000, -1),
    gastoMaxUsdDia: numeroEm(lim.gastoMaxUsdDia, 0, 1_000, -1),
    refinosPorDocumento: inteiroEm(lim.refinosPorDocumento, 0, 5, -1),
  };
  const ruim = (Object.entries(limites) as Array<[keyof LimitesIA, number]>).find(([, v]) => v < 0);
  if (ruim) return { ok: false, erro: `Limite inválido: ${ROTULO_LIMITE[ruim[0]]}.` };

  // Trocar de modo só vale se o worker diz que tem a credencial do modo novo: sem isso ele
  // pararia em silêncio. Sem batimento do worker não dá para saber, então também recusa.
  if (e.modo !== atual.modo) {
    const disponiveis = opcoes.batimento?.modosDisponiveis ?? [];
    if (!disponiveis.includes(e.modo)) {
      return {
        ok: false,
        erro:
          e.modo === "api"
            ? "O worker ainda não tem créditos de API (falta ANTHROPIC_API_KEY em .env.ia, ou o worker está parado). Nada foi alterado."
            : "O worker não tem a assinatura disponível (falta o token, o claude instalado ou IA_PERMITIR_ASSINATURA=1, ou o worker está parado). Nada foi alterado.",
      };
    }
  }

  const proxima: ConfigIA = {
    ...atual,
    ativa: e.ativa,
    modo: e.modo,
    melhoriaContinua: e.melhoriaContinua,
    modeloUsuario: e.modeloUsuario,
    modeloLote: e.modeloLote,
    maxTokensSaida,
    intervaloVarreduraMin: intervalo,
    limites,
    cobrarPorRequisicao: false,
    atualizadoEm: opcoes.agora.toISOString(),
    atualizadoPor: opcoes.por,
  };

  const mudancas: string[] = [];
  if (proxima.ativa !== atual.ativa) mudancas.push(proxima.ativa ? "IA ligada" : "IA desligada");
  if (proxima.modo !== atual.modo) mudancas.push(`modo: ${ROTULO_MODO[atual.modo]} → ${ROTULO_MODO[proxima.modo]}`);
  if (proxima.melhoriaContinua !== atual.melhoriaContinua) mudancas.push(proxima.melhoriaContinua ? "melhoria contínua ligada" : "melhoria contínua desligada");
  if (proxima.modeloUsuario !== atual.modeloUsuario) mudancas.push(`modelo dos pedidos: ${atual.modeloUsuario} → ${proxima.modeloUsuario}`);
  if (proxima.modeloLote !== atual.modeloLote) mudancas.push(`modelo da melhoria: ${atual.modeloLote} → ${proxima.modeloLote}`);
  if (proxima.maxTokensSaida !== atual.maxTokensSaida) mudancas.push(`tokens por resposta: ${atual.maxTokensSaida} → ${proxima.maxTokensSaida}`);
  if (proxima.intervaloVarreduraMin !== atual.intervaloVarreduraMin) mudancas.push(`varredura a cada ${proxima.intervaloVarreduraMin} min`);
  for (const k of Object.keys(limites) as Array<keyof LimitesIA>) {
    if (proxima.limites[k] !== atual.limites[k]) mudancas.push(`${ROTULO_LIMITE[k]}: ${atual.limites[k]} → ${proxima.limites[k]}`);
  }

  if (mudancas.length > 0) {
    proxima.historico = [...atual.historico, { em: proxima.atualizadoEm, por: opcoes.por, mudancas }].slice(-20);
  }
  return { ok: true, config: proxima, mudancas };
}

export const ROTULO_LIMITE: Record<keyof LimitesIA, string> = {
  pedidosPorNegocioDia: "pedidos por negócio por dia",
  melhoriasPorVarredura: "melhorias por varredura",
  jobsPorDia: "pedidos por dia (total)",
  gastoMaxUsdDia: "teto de gasto por dia, só no modo API (US$)",
  refinosPorDocumento: "refinos por documento",
};
