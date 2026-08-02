import { encontrarCidadeRegiao } from "@/lib/regiao";

/**
 * Resolve CEP → cidade/bairro reais via ViaCEP (API pública br, sem chave,
 * sem custo). Roda só no servidor (chamada pela rota
 * `app/api/localizacao/cep/[cep]/route.ts`) — o cadastro sempre trata
 * cidade/bairro como texto livre vindo do FormData (ver
 * `features/auth/actions.ts`), então isto é conveniência de preenchimento,
 * nunca uma fonte de verdade que o servidor "confia" de forma diferente do
 * dropdown manual que já existia.
 *
 * Degrada em silêncio por design (mesmo princípio de
 * `docs/architecture/BMAD-MULTIPLAYER-VPS.md` §3.4): qualquer falha (CEP
 * inválido, ViaCEP fora do ar, timeout) devolve `null` — quem chama cai de
 * volta pro dropdown/texto manual, o cadastro nunca trava por causa disto.
 */

export interface LocalizacaoResolvida {
  cep: string;
  cidade: string;
  bairro: string;
  uf: string;
  /** `true` se a cidade do ViaCEP bate com uma das já modeladas em
   *  `CIDADES_REGIAO` — cidade fora do ICP ainda é aceita (o RPC já faz
   *  upsert de cidade/bairro novos), só não é "prioritária" no scoring. */
  cidadeReconhecida: boolean;
}

interface RespostaViaCep {
  cep?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const TIMEOUT_MS = 3000;

/** `true` só para os 8 dígitos que um CEP brasileiro exige — qualquer outra
 *  coisa nem chega a gerar uma requisição de rede. */
function cepValido(cep: string): boolean {
  return /^\d{8}$/.test(cep);
}

export async function resolverLocalizacaoPorCep(
  cepBruto: string,
): Promise<LocalizacaoResolvida | null> {
  const cep = cepBruto.replace(/\D/g, "");
  if (!cepValido(cep)) return null;

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controlador.signal,
      // ViaCEP não muda por deploy — cache curto evita bater na API de novo
      // se o usuário editar e voltar ao mesmo CEP na mesma sessão de cadastro.
      next: { revalidate: 3600 },
    });
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as RespostaViaCep;
    if (dados.erro || !dados.localidade || !dados.bairro || !dados.uf) {
      return null;
    }

    return {
      cep,
      cidade: dados.localidade,
      bairro: dados.bairro,
      uf: dados.uf,
      cidadeReconhecida: encontrarCidadeRegiao(dados.localidade) !== undefined,
    };
  } catch {
    // timeout (AbortError), rede fora do ar, JSON inválido — tudo cai aqui
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
