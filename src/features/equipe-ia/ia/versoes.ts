import { promises as fs } from "node:fs";
import path from "node:path";
import { escreverJson, lerJson, pastaTenant, travaDados } from "@/lib/db/arquivo";
import type { TipoEntregavel } from "../habilidades";
import type { PautaCarrossel, Secao } from "../entregaveis/tipos";
import type { ModoIA, UsoTokens } from "./contrato";
import { escreverAtomico, lerArquivoTolerante, pastaIA } from "./fila";

/**
 * O que a IA produziu para cada negócio, versionado. Quem escreve é só o app,
 * depois de validar (ver `validar.ts`): o worker nunca toca nestes arquivos.
 *
 * Guarda as últimas versões aceitas de cada entregável. A versão que o usuário
 * vê é a mais recente cujo `contextoHash` ainda bate com os dados atuais do
 * negócio; se o dono mudou o cadastro ou as ofertas, o conteúdo antigo deixa
 * de valer (falaria de oferta que já não existe) e volta o de regras até a IA
 * gerar de novo.
 */

export const MAX_VERSOES = 3;

export interface ConteudoDocumento {
  tipo: "documento";
  titulo: string;
  subtitulo: string;
  secoes: Secao[];
}

export interface ConteudoPacote {
  tipo: "pacote";
  pautas: PautaCarrossel[];
  boasPraticas: string[];
  reaproveitamento: string[];
  metricas: string[];
}

export type ConteudoIA = ConteudoDocumento | ConteudoPacote;

export interface VersaoIA {
  /** 1, 2, 3...: cresce a cada versão aceita */
  n: number;
  geradoEm: string;
  jobId: string;
  modelo: string;
  modo: ModoIA;
  /** 1 = primeira geração; 2 em diante = refino */
  rodada: number;
  contextoHash: string;
  geradorVersao: number;
  uso: UsoTokens;
  custoUsd: number;
  conteudo: ConteudoIA;
}

export interface RegistroIA {
  contrato: 1;
  tipo: TipoEntregavel;
  versoes: VersaoIA[];
  /** falhas seguidas (validação ou worker); zera ao aceitar uma versão */
  falhasSeguidas: number;
  ultimaTentativaEm: string | null;
  ultimaFalha: { em: string; motivo: string } | null;
}

function registroVazio(tipo: TipoEntregavel): RegistroIA {
  return { contrato: 1, tipo, versoes: [], falhasSeguidas: 0, ultimaTentativaEm: null, ultimaFalha: null };
}

const arquivoRegistro = (tenantId: string, tipo: TipoEntregavel): string => path.join(pastaTenant(tenantId), "ia", `${tipo}.json`);

export async function lerRegistro(tenantId: string, tipo: TipoEntregavel): Promise<RegistroIA> {
  // A camada de IA é auxiliar: arquivo ilegível vira registro vazio, nunca erro para o usuário.
  const r = await lerJson<RegistroIA | null>(arquivoRegistro(tenantId, tipo), null).catch(() => null);
  if (!r || r.contrato !== 1 || !Array.isArray(r.versoes)) return registroVazio(tipo);
  return r;
}

async function alterarRegistro(tenantId: string, tipo: TipoEntregavel, mudar: (r: RegistroIA) => void): Promise<RegistroIA> {
  return travaDados.exclusivo(async () => {
    const r = await lerRegistro(tenantId, tipo);
    mudar(r);
    await escreverJson(arquivoRegistro(tenantId, tipo), r);
    return r;
  });
}

/** Versão mais recente que vale para os dados atuais; `null` se não há (ou ficou velha). */
export function versaoVigente(registro: RegistroIA, contextoHash: string, geradorVersao: number): VersaoIA | null {
  for (let i = registro.versoes.length - 1; i >= 0; i--) {
    const v = registro.versoes[i];
    if (v.contextoHash === contextoHash && v.geradorVersao === geradorVersao) return v;
  }
  return null;
}

/** Quantas versões aceitas existem para estes dados; a primeira é a geração, as demais são refinos. */
export function versoesDoContexto(registro: RegistroIA, contextoHash: string, geradorVersao: number): number {
  return registro.versoes.filter((v) => v.contextoHash === contextoHash && v.geradorVersao === geradorVersao).length;
}

export async function registrarVersao(
  tenantId: string,
  tipo: TipoEntregavel,
  nova: Omit<VersaoIA, "n">,
  agora: Date,
): Promise<VersaoIA> {
  let aceita!: VersaoIA;
  await alterarRegistro(tenantId, tipo, (r) => {
    const n = (r.versoes[r.versoes.length - 1]?.n ?? 0) + 1;
    aceita = { ...nova, n };
    r.versoes = [...r.versoes, aceita].slice(-MAX_VERSOES);
    r.falhasSeguidas = 0;
    r.ultimaFalha = null;
    r.ultimaTentativaEm = agora.toISOString();
  });
  return aceita;
}

export async function registrarFalha(tenantId: string, tipo: TipoEntregavel, motivo: string, agora: Date): Promise<void> {
  await alterarRegistro(tenantId, tipo, (r) => {
    r.falhasSeguidas += 1;
    r.ultimaFalha = { em: agora.toISOString(), motivo: motivo.slice(0, 120) };
    r.ultimaTentativaEm = agora.toISOString();
  });
}

export async function marcarTentativa(tenantId: string, tipo: TipoEntregavel, agora: Date): Promise<void> {
  await alterarRegistro(tenantId, tipo, (r) => {
    r.ultimaTentativaEm = agora.toISOString();
  });
}

// --------------------------------------------------------------- consentimento

export interface ConsentimentoIA {
  aceitoEm: string;
  politicaVersao: string;
  /** quem aceitou (id do usuário, nunca o e-mail) */
  usuarioId: string;
}

const arquivoConsentimento = (tenantId: string): string => path.join(pastaTenant(tenantId), "ia", "consentimento.json");

export async function lerConsentimento(tenantId: string): Promise<ConsentimentoIA | null> {
  const c = await lerJson<ConsentimentoIA | null>(arquivoConsentimento(tenantId), null).catch(() => null);
  return c && typeof c.aceitoEm === "string" && typeof c.politicaVersao === "string" ? c : null;
}

export async function gravarConsentimento(tenantId: string, consentimento: ConsentimentoIA): Promise<void> {
  await travaDados.exclusivo(() => escreverJson(arquivoConsentimento(tenantId), consentimento));
}

export async function revogarConsentimento(tenantId: string): Promise<void> {
  await travaDados.exclusivo(() => fs.rm(arquivoConsentimento(tenantId), { force: true }));
}

// ------------------------------------------------------------ pedidos do dia

const arquivoPedidosDoDia = (dia: string): string => path.join(pastaIA(), `pedidos-${dia}.json`);

export function diaUtc(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Quantos refinos o negócio pediu hoje (dia UTC), para o teto por negócio. */
export async function pedidosHoje(tenantId: string, agora: Date): Promise<number> {
  const mapa = await lerArquivoTolerante<Record<string, number>>(arquivoPedidosDoDia(diaUtc(agora)), {});
  const n = mapa[tenantId];
  return typeof n === "number" ? n : 0;
}

export async function contarPedido(tenantId: string, agora: Date): Promise<void> {
  await travaDados.exclusivo(async () => {
    const arquivo = arquivoPedidosDoDia(diaUtc(agora));
    const mapa = await lerArquivoTolerante<Record<string, number>>(arquivo, {});
    mapa[tenantId] = (typeof mapa[tenantId] === "number" ? mapa[tenantId] : 0) + 1;
    await escreverAtomico(arquivo, mapa);
    // contadores de dias antigos não servem para nada: não deixa acumular
    try {
      for (const nome of await fs.readdir(pastaIA())) {
        const m = /^pedidos-(\d{4}-\d{2}-\d{2})\.json$/.exec(nome);
        if (m && m[1] < diaUtc(new Date(agora.getTime() - 3 * 24 * 3_600_000))) await fs.rm(path.join(pastaIA(), nome), { force: true });
      }
    } catch {
      /* limpeza é só higiene */
    }
  });
}
