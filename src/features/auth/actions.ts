"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getAuthProvider } from "@/lib/auth";
import { cadastroBloqueado } from "@/lib/admin";
import { criarSessao, encerrarSessao } from "@/lib/auth/sessao";
import { SENHA_MAX } from "@/lib/auth/password";
import { slugify } from "@/lib/db/file-adapter";
import { Limitador } from "@/lib/limite";
import { ipDoCliente } from "@/lib/requisicao";
import { EMAIL_MAX, emailValido, opcaoValida, textoDoForm } from "@/lib/validacao";
import { calcular } from "@/features/onboarding/scoring";
import { perguntas } from "@/features/onboarding/perguntas";
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
      const ip = await ipDoCliente();
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

/** Valores aceitos em cada pergunta de escolha do onboarding. */
function opcoesDe(campo: string): string[] {
  const pergunta = perguntas.find((p) => p.campo === campo);
  return (pergunta?.opcoes ?? []).filter((o) => !o.locked).map((o) => o.valor);
}

const MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";

// Limites de tentativa (por processo). Login: por IP e por e-mail, para
// barrar tanto a força bruta numa conta quanto a varredura de muitas contas.
// Cada tentativa custa um scrypt; sem limite, é também um DoS barato.
const loginPorIp = new Limitador(10 * 60_000, 30);
const falhasPorEmail = new Limitador(15 * 60_000, 8);
const cadastroPorIp = new Limitador(60 * 60_000, 5);

/** Cadastro: conta + 10 respostas → tenant com lote no mapa + sessão. */
export async function cadastrar(
  _anterior: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const repo = getRepository();
  const auth = getAuthProvider();
  const texto = (campo: string, max = 80) => textoDoForm(fd, campo, max);

  const nome = texto("nome");
  const email = texto("email", EMAIL_MAX).toLowerCase();
  const senhaBruta = fd.get("senha");
  const senha = typeof senhaBruta === "string" ? senhaBruta : "";

  if (!nome || !email || !senha)
    return { erro: "Preencha nome, e-mail e senha." };
  if (!emailValido(email))
    return { erro: "E-mail inválido." };
  if (senha.length < 8)
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha.length > SENHA_MAX)
    return { erro: `A senha pode ter no máximo ${SENHA_MAX} caracteres.` };
  if (!cadastroPorIp.consumir(await ipDoCliente())) return { erro: MUITAS_TENTATIVAS };
  // E-mail de admin não se cria pelo formulário público (o cadastro não prova posse
  // do e-mail). Mesma mensagem de "já existe": não revela que o e-mail é reservado.
  if (cadastroBloqueado(email) || (await auth.emailExiste(email)))
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

  // Toda opção é conferida contra a lista da pergunta: um valor fora dela
  // virava NaN no score e contaminava a média do benchmark do bairro.
  const captacaoPermitida = opcoesDe("captacao");
  const respostas: Respostas = {
    nomeNegocio: texto("nomeNegocio"),
    segmento: opcaoValida<Segmento>(texto("segmento", 40), SEGMENTOS, "outro"),
    cidade: texto("cidade", 60) || "Outra",
    bairro: texto("bairro", 60) || "Centro",
    equipe: opcaoValida<Respostas["equipe"]>(texto("equipe", 40), opcoesDe("equipe"), "so-eu"),
    presencaDigital: opcaoValida<Respostas["presencaDigital"]>(
      texto("presencaDigital", 40),
      opcoesDe("presencaDigital"),
      "nada",
    ),
    captacao: [...new Set(fd.getAll("captacao").map(String))].filter((c) => captacaoPermitida.includes(c)),
    objetivo: opcaoValida<Respostas["objetivo"]>(texto("objetivo", 40), opcoesDe("objetivo"), "mais-leads"),
    gargalo: opcaoValida<Respostas["gargalo"]>(texto("gargalo", 40), opcoesDe("gargalo"), "perco-leads"),
    investimento: opcaoValida<Respostas["investimento"]>(
      texto("investimento", 40),
      opcoesDe("investimento"),
      "nao-sei",
    ),
  };

  if (!respostas.nomeNegocio)
    return { erro: "Informe o nome do seu negócio (pergunta 1)." };

  const resultado = calcular(respostas);

  // A credencial nasce PRIMEIRO. Antes, negócio, lote e recompensa de convite
  // eram criados antes dela: se o registro falhasse (e-mail duplicado numa
  // corrida, por exemplo), ficava um negócio órfão no mapa e o convidante
  // ganhava a recompensa por uma conta que não existia.
  let identidade: { usuarioId: string };
  try {
    identidade = await auth.registrar(nome, email, senha);
  } catch {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  let negocioId: string;
  try {
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
    });
    negocioId = negocio.id;

    await repo.salvarOnboarding({
      tenantId: negocio.id,
      respostas,
      scoreFit: resultado.scoreFit,
      degrauAlvo: resultado.degrauAlvo,
      servicosRecomendados: resultado.servicosRecomendados,
      respondidoEm: new Date().toISOString(),
    });

    await repo.vincularMembro({
      id: identidade.usuarioId,
      tenantId: negocio.id,
      nome,
      email,
      papel: "dono",
      criadoEm: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[cadastro] falhou depois de criar a credencial; desfazendo", e);
    await auth.remover(identidade.usuarioId).catch(() => undefined);
    return { erro: "Não foi possível concluir o cadastro. Tente de novo em instantes." };
  }

  // Extras cosméticos e de convite: só depois de a conta existir de verdade.
  await darMesaDeBoasVindas(repo, negocioId);
  await resgatarConviteSeExistir(repo, negocioId, texto("convite", 4096) || null);

  await criarSessao({
    usuarioId: identidade.usuarioId,
    tenantId: negocioId,
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

  const email = textoDoForm(fd, "email", EMAIL_MAX).toLowerCase();
  const senhaBruta = fd.get("senha");
  const senha = typeof senhaBruta === "string" ? senhaBruta : "";
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const ip = await ipDoCliente();
  if (falhasPorEmail.bloqueado(email) || !loginPorIp.consumir(ip)) {
    return { erro: MUITAS_TENTATIVAS };
  }

  // mensagem genérica: nunca revela se o e-mail existe
  const identidade = await auth.autenticar(email, senha);
  if (!identidade) {
    falhasPorEmail.registrar(email);
    return { erro: "E-mail ou senha incorretos." };
  }
  falhasPorEmail.limparChave(email);

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
