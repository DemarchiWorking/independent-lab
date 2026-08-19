"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getRepository } from "@/lib/db";
import { getAuthProvider } from "@/lib/auth";
import { criarSessao, encerrarSessao } from "@/lib/auth/sessao";
import { slugify } from "@/lib/db/file-adapter";
import { calcular } from "@/features/onboarding/scoring";
import { itemMobilia } from "@/features/sede/catalogo";
import { POLITICA_PRIVACIDADE_VERSAO } from "./politica";
import {
  JANELA_CONVITES_MS,
  LIMITE_CONVITES_POR_JANELA,
  MOEDA_CONVITE,
  XP_CONVITE,
  lerTokenConvite,
} from "@/features/growth/convite";
import type { GameRepository } from "@/lib/db";
import type { Respostas, Segmento } from "@/lib/db/types";

export interface EstadoForm {
  erro?: string;
  /** GH-SEC-03: mensagem de sucesso sem redirect (ex.: "código enviado"). */
  sucesso?: string;
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

/**
 * Resgata um convite de vizinho (GH-GROW-02), se `fd` trouxer um token
 * válido — nunca derruba o cadastro se algo der errado (mesmo princípio de
 * `darMesaDeBoasVindas`: a conta criada é o que importa; o bônus de convite
 * é extra). Reverifica a assinatura aqui (autoritativo) — o que a página de
 * cadastro mostrou antes é só UX, nunca confiado para creditar recompensa.
 */
async function resgatarConviteSeExistir(
  repo: GameRepository,
  tenantIdConvidado: string,
  token: string | null,
): Promise<void> {
  if (!token) return;
  const dados = lerTokenConvite(token);
  if (!dados) return; // assinatura inválida ou expirado — silencioso, não é erro do usuário
  if (dados.tenantId === tenantIdConvidado) return; // impossível na prática, defensivo

  try {
    const convidante = await repo.lerNegocio(dados.tenantId);
    if (!convidante) return;

    const resgatesRecentes = (
      await repo.listarConvitesResgatados(dados.tenantId)
    ).filter((r) => Date.now() - new Date(r.resgatadoEm).getTime() < JANELA_CONVITES_MS);
    const dentroDoTeto = resgatesRecentes.length < LIMITE_CONVITES_POR_JANELA;

    await repo.resgatarConvite(
      dados.tenantId,
      tenantIdConvidado,
      dentroDoTeto ? XP_CONVITE : 0,
      dentroDoTeto ? MOEDA_CONVITE : 0,
      XP_CONVITE,
      MOEDA_CONVITE,
    );

    if (!dentroDoTeto) {
      const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
      console.warn(
        `[convite] teto de ${LIMITE_CONVITES_POR_JANELA}/30d atingido — convidante=${dados.tenantId} ip=${ip}`,
      );
    }
  } catch {
    // "convite_ja_resgatado" ou falha de I/O — conta criada é o que importa
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

function texto(fd: FormData, campo: string, maxLength?: number): string {
  const v = String(fd.get(campo) ?? "").trim();
  // Truncamento no servidor (achado real de code review, 2026-08-18): o
  // `maxLength` do input no Wizard é só UX — um POST direto ignora isso.
  // Sem teto, texto livre gigante infla sem limite o markdown da ficha e o
  // prompt enviado ao motor de IA headless (custo/latência). O cliente
  // nunca é fonte de verdade sozinho (regra 4 do AGENTS.md).
  return maxLength ? v.slice(0, maxLength) : v;
}

/** Cadastro: conta + respostas do onboarding → tenant com lote no mapa + sessão. */
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

  // Consentimento LGPD (GH-OPS-04) — checagem no servidor, nunca só
  // desabilitar o botão no client: um checkbox desmarcado nunca aparece no
  // FormData, então a ausência da chave já basta como sinal de recusa.
  if (fd.get("consentimento") !== "on") {
    return {
      erro: "É necessário aceitar a política de privacidade para continuar.",
    };
  }
  const perfilPublico = fd.get("perfilPublico") === "on";

  const segmentoBruto = texto(fd, "segmento") as Segmento;
  const respostas: Respostas = {
    nomeNegocio: texto(fd, "nomeNegocio"),
    segmento: SEGMENTOS.includes(segmentoBruto) ? segmentoBruto : "outro",
    cidade: texto(fd, "cidade") || "Outra",
    bairro: texto(fd, "bairro") || "Centro",
    problemaPrincipal: texto(fd, "problemaPrincipal", 300),
    equipe: (texto(fd, "equipe") || "so-eu") as Respostas["equipe"],
    presencaDigital: (texto(fd, "presencaDigital") ||
      "nada") as Respostas["presencaDigital"],
    captacao: fd.getAll("captacao").map(String),
    licitacaoPublico: (texto(fd, "licitacaoPublico") ||
      "nao-e-foco") as Respostas["licitacaoPublico"],
    modeloReceita: (texto(fd, "modeloReceita") ||
      "projeto-unico") as Respostas["modeloReceita"],
    ticketMedio: (texto(fd, "ticketMedio") ||
      "nao-sei") as Respostas["ticketMedio"],
    clientesPagantes: (texto(fd, "clientesPagantes") ||
      "nenhum") as Respostas["clientesPagantes"],
    faturamentoFaixa: (texto(fd, "faturamentoFaixa") ||
      "prefiro-nao-informar") as Respostas["faturamentoFaixa"],
    diferencial: texto(fd, "diferencial", 300),
    provaSocial: texto(fd, "provaSocial", 300),
    concorrentesConhecidos: texto(fd, "concorrentesConhecidos", 300),
    objetivo: (texto(fd, "objetivo") || "mais-leads") as Respostas["objetivo"],
    gargalo: (texto(fd, "gargalo") || "perco-leads") as Respostas["gargalo"],
    investimento: (texto(fd, "investimento") ||
      "nao-sei") as Respostas["investimento"],
  };

  if (!respostas.nomeNegocio)
    return { erro: "Informe o nome do seu negócio (pergunta 1)." };

  const resultado = calcular(respostas);

  // CEP (GH-CEP-01): campo oculto que o Wizard grava assim que os 8 dígitos
  // existem (`Wizard.tsx`), resolvendo ou não cidade/bairro via
  // `lib/localizacao/cep.ts` — `cidade`/`bairro` acima continuam sendo a
  // fonte que o cadastro usa (dropdown manual ou autofill por CEP passam
  // pelos MESMOS dois campos). Campo obrigatório: o Wizard já bloqueia
  // avançar sem os 8 dígitos, mas a checagem aqui é a que vale — o cliente
  // nunca é fonte de verdade sozinho (regra 4 do AGENTS.md).
  const cepBruto = texto(fd, "cep").replace(/\D/g, "");
  if (!/^\d{8}$/.test(cepBruto)) return { erro: "Informe um CEP válido (8 dígitos)." };
  const cep = cepBruto;

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
    perfilPublico,
    consentimentoVersao: POLITICA_PRIVACIDADE_VERSAO,
    cep,
  });

  // GH-SEC-04: daqui até `criarSessao` são 3 escritas que não podem virar
  // uma transação real (Supabase Auth é um serviço HTTP à parte do
  // Postgres onde `negocios` vive) — a alternativa é compensação: se
  // qualquer passo falhar, desfaz o que já foi criado antes de devolver o
  // erro, para nunca sobrar negócio sem dono nem conta autenticável sem
  // negócio vinculado (essa segunda é irrecuperável pelo usuário hoje, sem
  // fluxo de reset — GH-SEC-03).
  let identidade: Awaited<ReturnType<typeof auth.registrar>> | null = null;
  try {
    await repo.salvarOnboarding({
      tenantId: negocio.id,
      respostas,
      scoreFit: resultado.scoreFit,
      degrauAlvo: resultado.degrauAlvo,
      servicosRecomendados: resultado.servicosRecomendados,
      respondidoEm: new Date().toISOString(),
    });

    await darMesaDeBoasVindas(repo, negocio.id);
    await resgatarConviteSeExistir(repo, negocio.id, texto(fd, "convite") || null);

    identidade = await auth.registrar(nome, email, senha);
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
      role: identidade.role,
    });
  } catch (erro) {
    if (identidade) {
      await auth.removerConta(identidade.usuarioId).catch((e) => {
        console.error(`[cadastro] falha ao reverter credencial órfã de ${negocio.id}:`, e);
      });
    }
    await repo.excluirNegocio(negocio.id).catch((e) => {
      console.error(`[cadastro] falha ao reverter negócio órfão ${negocio.id}:`, e);
    });
    console.error(`[cadastro] revertido depois de falhar no meio (negócio ${negocio.id}):`, erro);
    return { erro: "Não foi possível concluir o cadastro. Tente novamente." };
  }

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
    role: identidade.role,
  });
  redirect("/painel");
}

/**
 * GH-SEC-03, etapa 1: sempre devolve a mesma mensagem de sucesso, exista ou
 * não conta com este e-mail — evita que o formulário vire um jeito de
 * descobrir quais e-mails têm cadastro (mesmo princípio de `entrar`).
 */
export async function solicitarRecuperacao(
  _anterior: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const auth = getAuthProvider();
  const email = texto(fd, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { erro: "E-mail inválido." };
  }

  await auth.solicitarRecuperacaoSenha(email).catch((erro) => {
    console.error("[recuperação-senha] falha ao solicitar:", erro);
  });

  return {
    sucesso: "Se este e-mail tiver uma conta, enviamos um código de 6 dígitos. Confira sua caixa de entrada.",
  };
}

/** GH-SEC-03, etapa 2: código + nova senha → troca e manda logar de novo. */
export async function confirmarRecuperacao(
  _anterior: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const auth = getAuthProvider();
  const email = texto(fd, "email").toLowerCase();
  const codigo = texto(fd, "codigo").replace(/\D/g, "");
  const novaSenha = String(fd.get("novaSenha") ?? "");

  if (!/^\d{6}$/.test(codigo)) return { erro: "O código tem 6 dígitos." };
  if (novaSenha.length < 8) {
    return { erro: "A nova senha precisa ter pelo menos 8 caracteres." };
  }

  const ok = await auth.confirmarRecuperacaoSenha(email, codigo, novaSenha);
  if (!ok) return { erro: "Código incorreto ou expirado. Peça um novo." };

  redirect("/entrar");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/entrar");
}
