import { promises as fs } from "node:fs";
import path from "node:path";
import type { GameRepository } from "@/lib/db";
import { pastaTenant } from "@/lib/db/arquivo";
import { POLITICA_IA_VERSAO } from "@/features/auth/politica";
import { carrosselParaDocumento, gerarCarrosseis } from "../entregaveis/carrossel";
import { carregarContexto, documentoDoEntregavel } from "../entregaveis/base";
import type { ContextoNegocio, Documento, PacoteCarrossel } from "../entregaveis/tipos";
import { cargoDoEntregavel, entregaveisDoCargo, type TipoEntregavel } from "../habilidades";
import { aplicarVersaoIA, type Efetivo } from "./aplicar";
import { lerConfig } from "./config";
import { VERSAO_CONTRATO, type ConfigIA, type PedidoIA, type PrioridadeIA, type ResultadoIA } from "./contrato";
import {
  contarFila,
  enfileirar,
  lerArquivoBruto,
  lerBatimento,
  lerResultado,
  listarIds,
  novoIdDePedido,
  pedidoAberto,
  removerDaFila,
  workerVivo,
} from "./fila";
import { GERADOR_IA_VERSAO, hashContexto, metaDoPedido, montarPedido } from "./prompt";
import { registrarFalhaRecente, registrarUso } from "./uso";
import { problemasParaFeedback, problemasParaLog, validarSaidaIA } from "./validar";
import {
  contarPedido,
  gravarConsentimento,
  lerConsentimento,
  lerRegistro,
  marcarTentativa,
  pedidosHoje,
  registrarFalha,
  registrarVersao,
  revogarConsentimento,
  versaoVigente,
  versoesDoContexto,
  type ConteudoIA,
  type VersaoIA,
} from "./versoes";
/**
 * Orquestração da IA dos Funcionários: pedir, coletar, validar e escolher
 * qual versão o usuário vê. É a única camada que junta o repositório, a fila e
 * a validação.
 *
 * Princípio: a IA é um REFINO sobre o material de regras, nunca uma dependência.
 * Qualquer falha aqui (fila parada, worker fora, resposta inválida, arquivo
 * ilegível) cai no material de regras, que sempre funciona. O usuário nunca vê
 * um erro por causa da IA.
 */

const MAX_REENVIOS = 1;
const EXPIRA_USUARIO_MS = 12 * 3_600_000;
const EXPIRA_LOTE_MS = 3 * 3_600_000;
/** Depois de falhas seguidas, a varredura espera antes de tentar o mesmo documento de novo. */
const ESPERA_APOS_FALHAS_MS = 6 * 3_600_000;
const FALHAS_SEGUIDAS_LIMITE = 3;
const TAMANHO_MAX_ENTRADA = 250_000;

// --------------------------------------------------------------------- base

export function baselineDe(tipo: TipoEntregavel, ctx: ContextoNegocio): { documento: Documento; pacote: PacoteCarrossel | null } {
  if (tipo === "carrossel") {
    const pacote = gerarCarrosseis(ctx);
    return { documento: carrosselParaDocumento(pacote), pacote };
  }
  return { documento: documentoDoEntregavel(tipo, ctx), pacote: null };
}

export async function contextoDoTenant(
  repo: GameRepository,
  tenantId: string,
  tipo: TipoEntregavel,
  agora: Date,
): Promise<{ ctx: ContextoNegocio; nivel: number } | null> {
  const cargoId = cargoDoEntregavel(tipo);
  if (!cargoId) return null;
  const funcionario = (await repo.listarFuncionarios(tenantId)).find((f) => f.cargoId === cargoId);
  if (!funcionario) return null;
  const ctx = await carregarContexto(repo, tenantId, funcionario.nivel, agora);
  return ctx ? { ctx, nivel: funcionario.nivel } : null;
}

// -------------------------------------------------------------- consentimento

/**
 * O dono autorizou, de forma específica, que os dados do negócio sigam para a
 * Anthropic? Aceitar a política de privacidade no cadastro NÃO basta: o envio é
 * uma transferência internacional e o consentimento precisa ser próprio e em
 * destaque (caixa opcional no cadastro ou botão no estúdio).
 */
export async function temConsentimento(tenantId: string): Promise<boolean> {
  const c = await lerConsentimento(tenantId);
  return c !== null && c.politicaVersao >= POLITICA_IA_VERSAO;
}

export async function autorizarIA(tenantId: string, usuarioId: string, agora: Date = new Date()): Promise<void> {
  await gravarConsentimento(tenantId, { aceitoEm: agora.toISOString(), politicaVersao: POLITICA_IA_VERSAO, usuarioId });
}

/** Revoga e apaga o que a IA gerou para o negócio (o material de regras continua). */
export async function revogarIA(tenantId: string): Promise<void> {
  await revogarConsentimento(tenantId);
  await fs.rm(path.join(pastaTenant(tenantId), "ia"), { recursive: true, force: true });
}

// ------------------------------------------------------------ o que o usuário vê

export type EfetivoComVersao = Efetivo & { versao: VersaoIA | null };

/**
 * O material que a rota entrega: a versão de IA, se existe e ainda vale para
 * os dados atuais; senão, o de regras. Nunca lança por causa da IA.
 */
export async function entregavelEfetivo(tenantId: string, tipo: TipoEntregavel, ctx: ContextoNegocio): Promise<EfetivoComVersao> {
  const base = baselineDe(tipo, ctx);
  try {
    const registro = await lerRegistro(tenantId, tipo);
    const versao = versaoVigente(registro, hashContexto(ctx), GERADOR_IA_VERSAO);
    if (versao) return { ...aplicarVersaoIA(base.documento, base.pacote, versao), versao };
  } catch (e) {
    console.warn(JSON.stringify({ evento: "ia-leitura-falhou", tipo, erro: e instanceof Error ? e.name : "erro" }));
  }
  return { ...base, versao: null };
}

// ------------------------------------------------------------------- pedir

interface ParamsPedido {
  tenantId: string;
  tipo: TipoEntregavel;
  ctx: ContextoNegocio;
  anterior: ConteudoIA | null;
  rodada: number;
  prioridade: PrioridadeIA;
  feedback: string[] | null;
  reenvios: number;
  config: ConfigIA;
  agora: Date;
}

async function montarEEnfileirar(p: ParamsPedido): Promise<string | null> {
  const base = baselineDe(p.tipo, p.ctx);
  const entrada = { tipo: p.tipo, ctx: p.ctx, baseline: base.documento, pacoteBase: base.pacote, anterior: p.anterior, rodada: p.rodada, feedback: p.feedback };
  const montado = montarPedido(entrada);
  if (montado.entrada.length > TAMANHO_MAX_ENTRADA) return null;

  const id = novoIdDePedido(p.tenantId, p.tipo);
  const pedido: PedidoIA = {
    contrato: VERSAO_CONTRATO,
    id,
    criadoEm: p.agora.toISOString(),
    expiraEm: new Date(p.agora.getTime() + (p.prioridade === "usuario" ? EXPIRA_USUARIO_MS : EXPIRA_LOTE_MS)).toISOString(),
    prioridade: p.prioridade,
    modelo: p.prioridade === "usuario" ? p.config.modeloUsuario : p.config.modeloLote,
    maxTokens: p.config.maxTokensSaida,
    sistema: montado.sistema,
    entrada: montado.entrada,
    schema: montado.schema,
    tentativas: 0,
    naoAntesDe: null,
    meta: metaDoPedido(p.tenantId, entrada, p.reenvios, p.prioridade),
  };
  await enfileirar(pedido);
  return id;
}

export type Solicitacao =
  | { ok: true; estado: "na-fila" | "processando"; posicao: number; jaEstava: boolean }
  | { ok: false; motivo: "desativada" | "sem-funcionario" | "sem-consentimento" | "limite-diario" | "entrada-grande"; mensagem: string };

/**
 * Enfileira a geração (ou o refino) de um material. Prioridade `usuario` vem
 * de um clique e passa na frente da melhoria contínua.
 */
export async function solicitarRefino(
  repo: GameRepository,
  tenantId: string,
  tipo: TipoEntregavel,
  prioridade: PrioridadeIA,
  agora: Date = new Date(),
  opcoes: { automatico?: boolean } = {},
): Promise<Solicitacao> {
  const config = await lerConfig();
  if (!config.ativa) return { ok: false, motivo: "desativada", mensagem: "O refinamento por IA está desligado no momento. O seu material continua disponível." };

  const info = await contextoDoTenant(repo, tenantId, tipo, agora);
  if (!info) return { ok: false, motivo: "sem-funcionario", mensagem: "Contrate o Funcionário de IA responsável para usar este recurso." };

  if (!(await temConsentimento(tenantId))) {
    return { ok: false, motivo: "sem-consentimento", mensagem: "Autorize o uso de IA sobre os dados do seu negócio para continuar." };
  }

  const aberto = await pedidoAberto(tenantId, tipo);
  if (aberto) return { ok: true, estado: aberto.estado === "processando" ? "processando" : "na-fila", posicao: aberto.posicao, jaEstava: true };

  // A primeira geração automática não gasta o teto de pedidos do dono: ele não pediu nada.
  if (prioridade === "usuario" && !opcoes.automatico) {
    const usados = await pedidosHoje(tenantId, agora);
    if (usados >= config.limites.pedidosPorNegocioDia) {
      return {
        ok: false,
        motivo: "limite-diario",
        mensagem: `Você já fez ${config.limites.pedidosPorNegocioDia} pedidos hoje. Volte amanhã: a melhoria automática continua rodando.`,
      };
    }
  }

  const registro = await lerRegistro(tenantId, tipo);
  const hash = hashContexto(info.ctx);
  const vigente = versaoVigente(registro, hash, GERADOR_IA_VERSAO);
  const rodada = vigente ? versoesDoContexto(registro, hash, GERADOR_IA_VERSAO) + 1 : 1;

  const id = await montarEEnfileirar({
    tenantId,
    tipo,
    ctx: info.ctx,
    anterior: vigente?.conteudo ?? null,
    rodada,
    prioridade,
    feedback: null,
    reenvios: 0,
    config,
    agora,
  });
  if (!id) return { ok: false, motivo: "entrada-grande", mensagem: "Os dados do negócio ficaram grandes demais para o refinamento. Reduza o texto das ofertas." };

  if (prioridade === "usuario" && !opcoes.automatico) await contarPedido(tenantId, agora);
  await marcarTentativa(tenantId, tipo, agora);
  const agoraAberto = await pedidoAberto(tenantId, tipo);
  return { ok: true, estado: "na-fila", posicao: agoraAberto?.posicao ?? 1, jaEstava: false };
}

/** Espera mínima entre duas tentativas automáticas no mesmo material (abrir a tela não pode virar laço). */
const ESPERA_ENTRE_AUTOMATICAS_MS = 30 * 60_000;

/**
 * "Quem entra recebe a melhor documentação": se o dono autorizou a IA e este material
 * ainda não tem versão de IA para os dados de hoje, a geração começa sozinha, na
 * primeira vez que ele abre o material ou logo depois de autorizar. Prioridade de usuário
 * (passa na frente da melhoria contínua), sem gastar o teto de pedidos dele.
 *
 * Não insiste: respeita falhas seguidas e uma espera mínima entre tentativas. Nunca
 * lança: é um benefício extra, não pode atrapalhar a tela.
 */
export async function garantirPrimeiraGeracao(repo: GameRepository, tenantId: string, tipo: TipoEntregavel, agora: Date = new Date()): Promise<boolean> {
  try {
    if (!(await lerConfig()).ativa) return false;
    if (!(await temConsentimento(tenantId))) return false;
    const info = await contextoDoTenant(repo, tenantId, tipo, agora);
    if (!info) return false;
    const registro = await lerRegistro(tenantId, tipo);
    if (versaoVigente(registro, hashContexto(info.ctx), GERADOR_IA_VERSAO)) return false;
    if (registro.falhasSeguidas >= FALHAS_SEGUIDAS_LIMITE) return false;
    const ultima = registro.ultimaTentativaEm ? new Date(registro.ultimaTentativaEm).getTime() : 0;
    if (agora.getTime() - ultima < ESPERA_ENTRE_AUTOMATICAS_MS) return false;
    if (await pedidoAberto(tenantId, tipo)) return false;
    const r = await solicitarRefino(repo, tenantId, tipo, "usuario", agora, { automatico: true });
    return r.ok && !r.jaEstava;
  } catch (e) {
    console.warn(JSON.stringify({ evento: "ia-primeira-geracao-falhou", tipo, erro: e instanceof Error ? e.name : "erro" }));
    return false;
  }
}

// --------------------------------------------------------------------- estado

export interface EstadoIA {
  ligada: boolean;
  consentido: boolean;
  workerVivo: boolean;
  fila: { estado: "nenhum" | "na-fila" | "processando"; posicao: number | null };
  versao: { n: number; geradoEm: string; modelo: string; rodada: number } | null;
  /** já recebeu todos os refinos automáticos previstos para os dados atuais */
  completo: boolean;
  ultimaFalha: { em: string; motivo: string } | null;
  pedidosHoje: number;
  limiteDia: number;
}

export async function estadoIA(repo: GameRepository, tenantId: string, tipo: TipoEntregavel, ctx: ContextoNegocio, agora: Date = new Date()): Promise<EstadoIA> {
  const [config, consentido, aberto, registro, batimento, usados] = await Promise.all([
    lerConfig(),
    temConsentimento(tenantId),
    pedidoAberto(tenantId, tipo),
    lerRegistro(tenantId, tipo),
    lerBatimento(),
    pedidosHoje(tenantId, agora),
  ]);
  const hash = hashContexto(ctx);
  const vigente = versaoVigente(registro, hash, GERADOR_IA_VERSAO);
  const quantas = versoesDoContexto(registro, hash, GERADOR_IA_VERSAO);
  return {
    ligada: config.ativa,
    consentido,
    workerVivo: workerVivo(batimento, agora),
    fila: aberto ? { estado: aberto.estado === "processando" ? "processando" : "na-fila", posicao: aberto.estado === "processando" ? null : aberto.posicao } : { estado: "nenhum", posicao: null },
    versao: vigente ? { n: vigente.n, geradoEm: vigente.geradoEm, modelo: vigente.modelo, rodada: vigente.rodada } : null,
    completo: quantas >= 1 + config.limites.refinosPorDocumento,
    ultimaFalha: registro.ultimaFalha,
    pedidosHoje: usados,
    limiteDia: config.limites.pedidosPorNegocioDia,
  };
}

// --------------------------------------------------------------------- coleta

export interface ResumoColeta {
  aceitos: number;
  rejeitados: number;
  reenviados: number;
  obsoletos: number;
  falhas: number;
  lixo: number;
}

async function processarResultado(repo: GameRepository, r: ResultadoIA, agora: Date, resumo: ResumoColeta): Promise<void> {
  const { tenantId, tipo } = r.meta;
  // O custo existiu de qualquer jeito, mesmo se o resultado for descartado.
  await registrarUso(r, agora);

  if (r.estado === "falhou") {
    resumo.falhas += 1;
    await registrarFalha(tenantId, tipo, r.motivo ?? "falhou", agora);
    await registrarFalhaRecente({ em: agora.toISOString(), tipo, motivo: r.motivo ?? "falhou", modo: r.modo, modelo: r.modelo });
    return;
  }

  const info = await contextoDoTenant(repo, tenantId, tipo, agora);
  if (!info || hashContexto(info.ctx) !== r.meta.contextoHash || r.meta.geradorVersao !== GERADOR_IA_VERSAO) {
    // Os dados mudaram enquanto o pedido estava na fila: o resultado falaria de algo que já não existe.
    resumo.obsoletos += 1;
    return;
  }

  const base = baselineDe(tipo, info.ctx);
  const registro = await lerRegistro(tenantId, tipo);
  const anterior = r.meta.rodada > 1 ? (versaoVigente(registro, r.meta.contextoHash, GERADOR_IA_VERSAO)?.conteudo ?? null) : null;
  const refeito = montarPedido({ tipo, ctx: info.ctx, baseline: base.documento, pacoteBase: base.pacote, anterior, rodada: r.meta.rodada, feedback: r.meta.feedback });

  const validacao = validarSaidaIA(r.saida, { tipo, nomeNegocio: info.ctx.nome, textoVisto: refeito.textoVisto, baseline: base.documento, pacoteBase: base.pacote });
  if (validacao.ok) {
    await registrarVersao(
      tenantId,
      tipo,
      {
        geradoEm: agora.toISOString(),
        jobId: r.id,
        modelo: r.modelo,
        modo: r.modo,
        rodada: r.meta.rodada,
        contextoHash: r.meta.contextoHash,
        geradorVersao: r.meta.geradorVersao,
        uso: r.uso,
        custoUsd: r.custoUsd,
        conteudo: validacao.conteudo,
      },
      agora,
    );
    resumo.aceitos += 1;
    return;
  }

  // Só os códigos no log: o texto reprovado pode ter vindo de instrução plantada.
  console.warn(JSON.stringify({ evento: "ia-saida-invalida", tipo, rodada: r.meta.rodada, modelo: r.modelo, problemas: problemasParaLog(validacao.problemas) }));

  if (r.meta.reenvios < MAX_REENVIOS) {
    const config = await lerConfig();
    const id = await montarEEnfileirar({
      tenantId,
      tipo,
      ctx: info.ctx,
      anterior,
      rodada: r.meta.rodada,
      prioridade: r.meta.prioridade,
      feedback: problemasParaFeedback(validacao.problemas),
      reenvios: r.meta.reenvios + 1,
      config,
      agora,
    });
    if (id) {
      resumo.reenviados += 1;
      return;
    }
  }
  resumo.rejeitados += 1;
  await registrarFalha(tenantId, tipo, "saida-invalida", agora);
  await registrarFalhaRecente({ em: agora.toISOString(), tipo, motivo: "saida-invalida", modo: r.modo, modelo: r.modelo });
}

let coletaEmAndamento: Promise<ResumoColeta> | null = null;

async function coletarInterno(repo: GameRepository, agora: Date): Promise<ResumoColeta> {
  const resumo: ResumoColeta = { aceitos: 0, rejeitados: 0, reenviados: 0, obsoletos: 0, falhas: 0, lixo: 0 };
  for (const estado of ["concluido", "falhou"] as const) {
    for (const id of await listarIds(estado)) {
      const r = lerResultado(await lerArquivoBruto(estado, id), id);
      if (!r || r.estado !== estado) {
        resumo.lixo += 1;
        await removerDaFila(estado, id);
        continue;
      }
      try {
        await processarResultado(repo, r, agora, resumo);
      } catch (e) {
        // Deixa o arquivo para a próxima coleta; o worker apaga o que ficar parado por um dia.
        console.error(JSON.stringify({ evento: "ia-coleta-erro", id, erro: e instanceof Error ? e.name : "erro" }));
        continue;
      }
      await removerDaFila(estado, id);
    }
  }
  return resumo;
}

/** Recolhe o que o worker terminou. Chamadas simultâneas dividem a mesma execução. */
export function coletar(repo: GameRepository, agora: Date = new Date()): Promise<ResumoColeta> {
  if (!coletaEmAndamento) {
    coletaEmAndamento = coletarInterno(repo, agora).finally(() => {
      coletaEmAndamento = null;
    });
  }
  return coletaEmAndamento;
}

/**
 * Para a rota: coleta na hora, para o usuário ver o resultado assim que o worker
 * terminar. A checagem é só listar duas pastas, então só trabalha quando há resultado.
 */
export async function coletarSePreciso(repo: GameRepository): Promise<void> {
  if (coletaEmAndamento) {
    await coletaEmAndamento;
    return;
  }
  const [prontos, falhados] = await Promise.all([listarIds("concluido"), listarIds("falhou")]);
  if (prontos.length + falhados.length === 0) return;
  try {
    await coletar(repo);
  } catch (e) {
    console.error(JSON.stringify({ evento: "ia-coleta-erro", erro: e instanceof Error ? e.name : "erro" }));
  }
}

// ------------------------------------------------------------------ varredura

export interface ResumoVarredura {
  pulou: "desligada" | "melhoria-desligada" | "worker-parado" | "fila-ocupada" | null;
  candidatos: number;
  enfileirados: number;
}

interface Candidato {
  tenantId: string;
  tipo: TipoEntregavel;
  ctx: ContextoNegocio;
  anterior: ConteudoIA | null;
  rodada: number;
  primeira: boolean;
  ultimaTentativaEm: number;
}

function tenantsDoMapa(mapa: { cidades: Array<{ bairros: Array<{ quarteiroes: Array<{ lotes: Array<{ tenantId: string | null }> }> }> }> }): string[] {
  const ids = new Set<string>();
  for (const c of mapa.cidades) for (const b of c.bairros) for (const q of b.quarteiroes) for (const l of q.lotes) if (l.tenantId) ids.add(l.tenantId);
  return [...ids];
}

/**
 * Melhoria contínua. Roda de hora em hora e só age quando a fila está vazia:
 * pedido de usuário sempre vem primeiro. Escolhe, entre os negócios que
 * autorizaram a IA, os materiais que (1) ainda não têm versão de IA para os
 * dados atuais, depois (2) os que ainda têm refinos a receber, os mais
 * antigos primeiro, até o limite por varredura.
 *
 * O limite de refinos por documento evita gastar para sempre num material que
 * já está "completo"; ele reabre quando o dono muda os dados.
 */
export async function varrer(repo: GameRepository, agora: Date = new Date()): Promise<ResumoVarredura> {
  const config = await lerConfig();
  if (!config.ativa) return { pulou: "desligada", candidatos: 0, enfileirados: 0 };
  if (!config.melhoriaContinua) return { pulou: "melhoria-desligada", candidatos: 0, enfileirados: 0 };
  // Sem worker vivo, enfileirar só acumularia pedido que ninguém processa.
  if (!workerVivo(await lerBatimento(), agora)) return { pulou: "worker-parado", candidatos: 0, enfileirados: 0 };
  const fila = await contarFila();
  if (fila.pendente + fila.processando > 0) return { pulou: "fila-ocupada", candidatos: 0, enfileirados: 0 };

  const candidatos: Candidato[] = [];
  for (const tenantId of tenantsDoMapa(await repo.lerMapa())) {
    try {
      if (!(await temConsentimento(tenantId))) continue;
      const cargos = new Set((await repo.listarFuncionarios(tenantId)).map((f) => f.cargoId));
      for (const cargo of cargos) {
        for (const tipo of entregaveisDoCargo(cargo)) {
          const info = await contextoDoTenant(repo, tenantId, tipo, agora);
          if (!info) continue;
          const registro = await lerRegistro(tenantId, tipo);
          const ultima = registro.ultimaTentativaEm ? new Date(registro.ultimaTentativaEm).getTime() : 0;
          if (registro.falhasSeguidas >= FALHAS_SEGUIDAS_LIMITE && agora.getTime() - ultima < ESPERA_APOS_FALHAS_MS) continue;

          const hash = hashContexto(info.ctx);
          const quantas = versoesDoContexto(registro, hash, GERADOR_IA_VERSAO);
          if (quantas >= 1 + config.limites.refinosPorDocumento) continue;
          const vigente = versaoVigente(registro, hash, GERADOR_IA_VERSAO);
          candidatos.push({ tenantId, tipo, ctx: info.ctx, anterior: vigente?.conteudo ?? null, rodada: quantas + 1, primeira: quantas === 0, ultimaTentativaEm: ultima });
        }
      }
    } catch (e) {
      console.error(JSON.stringify({ evento: "ia-varredura-erro", erro: e instanceof Error ? e.name : "erro" }));
    }
  }

  candidatos.sort((a, b) => (a.primeira !== b.primeira ? (a.primeira ? -1 : 1) : a.ultimaTentativaEm - b.ultimaTentativaEm));

  let enfileirados = 0;
  for (const c of candidatos.slice(0, config.limites.melhoriasPorVarredura)) {
    const id = await montarEEnfileirar({ tenantId: c.tenantId, tipo: c.tipo, ctx: c.ctx, anterior: c.anterior, rodada: c.rodada, prioridade: "lote", feedback: null, reenvios: 0, config, agora });
    if (id) {
      await marcarTentativa(c.tenantId, c.tipo, agora);
      enfileirados += 1;
    }
  }
  return { pulou: null, candidatos: candidatos.length, enfileirados };
}
