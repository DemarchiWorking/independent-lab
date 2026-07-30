"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getAuthProvider } from "@/lib/auth";
import { EmailJaExisteError } from "@/lib/auth/provider";
import { criarSessao, encerrarSessao } from "@/lib/auth/sessao";
import { slugify } from "@/lib/db/file-adapter";
import { calcular } from "@/features/onboarding/scoring";
import { itemMobilia } from "@/features/sede/catalogo";
import type { GameRepository } from "@/lib/db";
import type { Respostas, Segmento } from "@/lib/db/types";

export interface EstadoForm {
  erro?: string;
}

/** Item que toda empresa ganha ao nascer — ver `MESA_DE_BOAS_VINDAS` abaixo. */
const ITEM_BOAS_VINDAS = "mesa-trabalho";

/**
 * Entrega a sede inicial já com uma mesa colocada.
 *
 * Por quê: sem isso, a primeira coisa que o dono vê no World é uma **sala
 * vazia sem instrução** — a pior tela do produto, justamente na hora em que
 * ele decide se aquilo faz sentido. Um móvel já posto ensina a mecânica por
 * exemplo (é o que Habbo e The Sims fazem no primeiro quarto) e dá o que
 * clicar. Ver docs/world/EVOLUCAO-MOTOR-2026.md §7.6.
 *
 * Custo zero: é presente de boas-vindas, não compra.
 *
 * Falha aqui **nunca** derruba o cadastro — é cosmético, e perder a conta por
 * causa de um móvel seria desproporcional.
 */
async function darMesaDeBoasVindas(
  repo: GameRepository,
  tenantId: string,
): Promise<void> {
  const item = itemMobilia(ITEM_BOAS_VINDAS);
  if (!item) return;
  try {
    await repo.lerSede(tenantId); // garante que a sede existe antes de mobiliar
    await repo.comprarMobilia(tenantId, item.id, 0, 0, item.bonus);
  } catch {
    // sede sem mesa é degradação aceitável; conta criada é o que importa
  }
}

const SEGMENTOS: Segmento[] = [
  "engenharia",
  "contabilidade",
  "saude",
  "tecnologia",
  "alimentacao",
  "comercio",
  "servico",
  "outro",
];

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

/**
 * Cadastro: conta + 10 respostas → tenant com lote no mapa + sessão.
 *
 * ORDEM É REGRA DE NEGÓCIO (GH-OPS M-3): a identidade (`auth.registrar`) é
 * criada **antes** do negócio, não depois. Na ordem antiga, uma falha no
 * registro (e-mail duplicado que passou pela checagem prévia quebrada, senha
 * rejeitada pelo GoTrue, rate limit) deixava um **tenant órfão ocupando um
 * lote do mapa** — `negocios` e `onboardings` já gravados, sem `membros`,
 * inalcançável pela UI e sem forma de liberar aquele lote de volta. Nesta
 * ordem, o pior caso passa a ser um usuário de auth sem tenant — recuperável
 * por um admin, e nenhum lote do mapa fica preso.
 */
export async function cadastrar(
  _anterior: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const repo = getRepository();
  const auth = getAuthProvider();

  const nome = texto(fd, "nome");
  const email = texto(fd, "email").toLowerCase();
  const senha = String(fd.get("senha") ?? "");

  if (!nome || !email || !senha)
    return { erro: "Preencha nome, e-mail e senha." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { erro: "E-mail inválido." };
  if (senha.length < 8)
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  // LGPD (GH-OPS-04): aceite explícito, checado no SERVIDOR — o `required`
  // do checkbox no Wizard é só UX, nunca a garantia real (regra 4 do
  // AGENTS.md). Sem isso o cadastro não segue, e nenhum negócio nasce sem
  // consentimento registrado.
  if (fd.get("aceiteLgpd") !== "sim") {
    return { erro: "É preciso aceitar a política de privacidade para continuar." };
  }
  const consentimentoLgpdEm = new Date().toISOString();

  const segmentoBruto = texto(fd, "segmento") as Segmento;
  const respostas: Respostas = {
    nomeNegocio: texto(fd, "nomeNegocio"),
    segmento: SEGMENTOS.includes(segmentoBruto) ? segmentoBruto : "outro",
    cidade: texto(fd, "cidade") || "Outra",
    bairro: texto(fd, "bairro") || "Centro",
    equipe: (texto(fd, "equipe") || "so-eu") as Respostas["equipe"],
    presencaDigital: (texto(fd, "presencaDigital") ||
      "nada") as Respostas["presencaDigital"],
    captacao: fd.getAll("captacao").map(String),
    objetivo: (texto(fd, "objetivo") || "mais-leads") as Respostas["objetivo"],
    gargalo: (texto(fd, "gargalo") || "perco-leads") as Respostas["gargalo"],
    investimento: (texto(fd, "investimento") ||
      "nao-sei") as Respostas["investimento"],
  };

  if (!respostas.nomeNegocio)
    return { erro: "Informe o nome do seu negócio (pergunta 1)." };

  // Toda validação de formulário passou — só agora criamos algo com efeito
  // colateral. `registrar` é a fonte de verdade sobre e-mail duplicado (ver
  // `EmailJaExisteError`); não há checagem prévia separada.
  let identidade;
  try {
    identidade = await auth.registrar(nome, email, senha);
  } catch (e) {
    if (e instanceof EmailJaExisteError) {
      return { erro: "Já existe uma conta com esse e-mail." };
    }
    throw e;
  }

  const resultado = calcular(respostas);

  const negocio = await repo.criarNegocio({
    nome: respostas.nomeNegocio,
    segmento: respostas.segmento,
    cidadeSlug: slugify(respostas.cidade),
    cidadeNome: respostas.cidade,
    bairroNome: respostas.bairro,
    degrauAlvo: resultado.degrauAlvo,
    xpInicial: resultado.xpInicial,
    moedaVirtual: 500,
    atributosIniciais: resultado.atributosIniciais,
    consentimentoLgpdEm,
  });

  await repo.salvarOnboarding({
    tenantId: negocio.id,
    respostas,
    scoreFit: resultado.scoreFit,
    degrauAlvo: resultado.degrauAlvo,
    servicosRecomendados: resultado.servicosRecomendados,
    respondidoEm: new Date().toISOString(),
  });

  await darMesaDeBoasVindas(repo, negocio.id);

  await repo.vincularMembro({
    id: identidade.usuarioId,
    tenantId: negocio.id,
    nome,
    email,
    papel: "dono",
    criadoEm: new Date().toISOString(),
  });

  await criarSessao({
    usuarioId: identidade.usuarioId,
    tenantId: negocio.id,
    nome,
    email,
  });
  redirect("/painel");
}

/** Login: autentica e resolve o tenant do usuário. */
export async function entrar(
  _anterior: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const repo = getRepository();
  const auth = getAuthProvider();

  const email = texto(fd, "email").toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  // mensagem genérica: nunca revela se o e-mail existe
  const identidade = await auth.autenticar(email, senha);
  if (!identidade) return { erro: "E-mail ou senha incorretos." };

  const membro = await repo.lerMembroPorUsuario(identidade.usuarioId);
  if (!membro) return { erro: "Conta sem negócio vinculado." };

  await criarSessao({
    usuarioId: membro.id,
    tenantId: membro.tenantId,
    nome: membro.nome,
    email,
  });
  redirect("/painel");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
