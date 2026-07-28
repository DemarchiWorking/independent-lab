"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getAuthProvider } from "@/lib/auth";
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
  "imobiliaria",
  "construtora",
  "loteadora",
  "comercio",
  "servico",
  "outro",
];

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

/** Cadastro: conta + 10 respostas → tenant com lote no mapa + sessão. */
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
  if (await auth.emailExiste(email))
    return { erro: "Já existe uma conta com esse e-mail." };

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

  const identidade = await auth.registrar(nome, email, senha);
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
