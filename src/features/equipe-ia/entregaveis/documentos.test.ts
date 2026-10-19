import { describe, expect, it } from "vitest";
import { gerarCanvas, celulasDoCanvas } from "./canvas";
import { carrosselParaDocumento, gerarCarrosseis, montarCalendario } from "./carrossel";
import { CAMPOS_DAS_MENSAGENS, fluxoDeQualificacao, gerarKitComercial } from "./comercial";
import { gerarManualProcessos } from "./pop";
import { gerarReel, reelParaDocumento, SEGUNDOS_POR_CENA } from "./reel";
import { auditarDocumento, frasesPrivadas, textosDoDocumento } from "./qualidade";
import { perfilDeMercado, todosOsPerfis } from "./mercado";
import { INVESTIMENTO, PLANOS } from "./mercado/planos";
import { minusculaInicial } from "./linguagem";
import { ctx, NIVEIS } from "./teste-util";
import type { Bloco, ContextoNegocio, Documento } from "./tipos";

const NOMES = ["Mercado Fiel", "Studio Bela Cabelos", "João Silva ME", "Radiz Engenharia", "Casa das Tintas"];

function ids(doc: Documento): string[] {
  return doc.secoes.map((s) => s.id);
}

function mensagens(doc: Documento): string[] {
  return doc.secoes.flatMap((s) =>
    s.blocos.filter((b): b is Extract<Bloco, { tipo: "mensagem" }> => b.tipo === "mensagem").map((b) => b.texto),
  );
}

/** Um contexto para cada perfil de mercado (8 segmentos e 13 nichos) em cada nível. */
function contextosPorMercado(): ContextoNegocio[] {
  return todosOsPerfis().flatMap((p) =>
    NIVEIS.map((nivel) =>
      ctx({
        nome: NOMES[p.id.length % NOMES.length],
        nicho: p.id,
        segmento: p.id in { engenharia: 1, contabilidade: 1, saude: 1, tecnologia: 1, alimentacao: 1, comercio: 1, servico: 1, outro: 1 }
          ? (p.id as ContextoNegocio["segmento"])
          : "servico",
        nivel,
      }),
    ),
  );
}

describe("Canvas (Documentador)", () => {
  it("o nível 1 já entrega as 9 células, todas com conteúdo de verdade", () => {
    const celulas = celulasDoCanvas(ctx(), perfilDeMercado("engenharia"));
    expect(Object.keys(celulas)).toHaveLength(9);
    for (const [nome, itens] of Object.entries(celulas)) {
      expect(itens.length, nome).toBeGreaterThanOrEqual(3);
    }
  });

  it("a faixa de investimento sai legível, nunca 'ate a 500' nem '3500+'", () => {
    for (const investimento of ["nao-sei", "ate-500", "500-1500", "1500-3500", "3500+"] as const) {
      const doc = gerarCanvas(ctx({ nivel: 3, privado: { investimento } }));
      const texto = JSON.stringify(doc);
      expect(texto).not.toMatch(/ate a \d|faixa \d|\d\+"/);
      expect(texto).toContain(minusculaInicial(INVESTIMENTO[investimento].rotulo));
    }
  });

  it("nível 1 não traz diagnóstico nem plano; nível 2 traz; nível 3 traz riscos e revisão", () => {
    const n1 = ids(gerarCanvas(ctx({ nivel: 1 })));
    const n2 = ids(gerarCanvas(ctx({ nivel: 2 })));
    const n3 = ids(gerarCanvas(ctx({ nivel: 3 })));
    expect(n1).not.toContain("diagnostico");
    expect(n1).not.toContain("plano-1");
    expect(n2).toContain("diagnostico");
    expect(n2).toContain("plano-3");
    expect(n2).toContain("indicadores");
    expect(n2).not.toContain("riscos");
    expect(n3).toContain("riscos");
    expect(n3).toContain("revisao");
  });

  it("evoluir nunca tira seção: cada nível contém o anterior", () => {
    for (const gerar of [gerarCanvas, gerarManualProcessos, gerarKitComercial]) {
      const n1 = ids(gerar(ctx({ nivel: 1 })));
      const n2 = ids(gerar(ctx({ nivel: 2 })));
      const n3 = ids(gerar(ctx({ nivel: 3 })));
      for (const id of n1) expect(n2).toContain(id);
      for (const id of n2) expect(n3).toContain(id);
    }
  });

  it("já no nível 1 traz as primeiras ações e os documentos a manter em dia", () => {
    const doc = gerarCanvas(ctx({ nivel: 1 }));
    expect(ids(doc)).toEqual(expect.arrayContaining(["resumo", "canvas", "primeiras-acoes", "documentos"]));
  });

  it("usa as ofertas publicadas e as parcerias formadas", () => {
    const c = ctx({
      nome: "Studio Bela Cabelos",
      nicho: "beleza",
      segmento: "servico",
      ofertas: [
        { titulo: "Corte feminino", descricao: "Corte e escova", preco: "R$ 80" },
        { titulo: "Hidratação", descricao: "Tratamento", preco: "R$ 60" },
      ],
      parceiros: [{ nome: "Loja da Noiva", segmento: "comercio" }],
    });
    const celulas = celulasDoCanvas(c, perfilDeMercado("beleza"));
    expect(celulas.proposta.join(" ")).toContain("Corte feminino (R$ 80)");
    expect(celulas.proposta.join(" ")).toContain("Hidratação");
    expect(celulas.parcerias.join(" ")).toContain("Loja da Noiva");
  });

  it("a presença digital e a captação declaradas mudam os canais", () => {
    const nada = celulasDoCanvas(ctx({ privado: { presencaDigital: "nada", captacao: [] } }), perfilDeMercado("engenharia"));
    const site = celulasDoCanvas(
      ctx({ privado: { presencaDigital: "site-portais", captacao: ["ads", "social"] } }),
      perfilDeMercado("engenharia"),
    );
    expect(nada.canais.join(" ")).toMatch(/nenhum canal estruturado/i);
    expect(nada.canais.join(" ")).toMatch(/Google/);
    expect(site.canais.join(" ")).toContain("Anúncios pagos");
    expect(site.canais.join(" ")).not.toMatch(/nenhum canal/i);
  });

  it("um salão não recebe o poder público como cliente", () => {
    const doc = gerarCanvas(ctx({ nome: "Studio Bela", nicho: "beleza", segmento: "servico", nivel: 3 }));
    expect(JSON.stringify(doc)).not.toMatch(/licita|pregão|prefeitura|órgãos públicos/i);
  });

  it("negócio sem respostas de cadastro recebe o aviso, não um plano fingindo ser personalizado", () => {
    const doc = gerarCanvas(ctx({ privado: { temOnboarding: false } }));
    expect(JSON.stringify(doc)).toContain("Faltam respostas do cadastro");
    expect(doc.meta.baseadoEm.join(" ")).toMatch(/Sem respostas de cadastro/);
  });

  it("não inventa meta numérica: o indicador traz 'preencha depois de medir'", () => {
    const doc = gerarCanvas(ctx({ nivel: 2 }));
    const indicadores = doc.secoes.find((s) => s.id === "indicadores");
    expect(JSON.stringify(indicadores)).toContain("preencha depois de medir");
  });

  it("tem versão, autor e próxima revisão em 90 dias", () => {
    const doc = gerarCanvas(ctx());
    expect(doc.meta.versao).toBe("1.0");
    expect(doc.meta.autor).toContain("Documentador");
    const dias = (new Date(doc.meta.proximaRevisao).getTime() - new Date(doc.meta.geradoEm).getTime()) / 86_400_000;
    expect(dias).toBe(90);
    expect(doc.meta.circulacao).toBe("interno");
  });

  it("é puro: mesmo contexto, mesmo documento", () => {
    expect(gerarCanvas(ctx({ nivel: 3 }))).toEqual(gerarCanvas(ctx({ nivel: 3 })));
  });
});

describe("Manual de processos (Documentador)", () => {
  it("traz 3, 5 e 7 procedimentos conforme o nível", () => {
    const pops = (nivel: 1 | 2 | 3) => ids(gerarManualProcessos(ctx({ nivel }))).filter((i) => i.startsWith("pop-")).length;
    expect(pops(1)).toBe(3);
    expect(pops(2)).toBe(5);
    expect(pops(3)).toBe(7);
  });

  it("cada procedimento tem responsável, quando usar, passos, qualidade e erros comuns", () => {
    const doc = gerarManualProcessos(ctx({ nivel: 3 }));
    for (const s of doc.secoes.filter((x) => x.id.startsWith("pop-"))) {
      const tipos = s.blocos.map((b) => b.tipo);
      expect(tipos, s.id).toEqual(expect.arrayContaining(["tabela", "passos", "checklist", "lista"]));
      const passos = s.blocos.find((b): b is Extract<Bloco, { tipo: "passos" }> => b.tipo === "passos");
      expect(passos?.passos.length, s.id).toBeGreaterThanOrEqual(5);
      expect(JSON.stringify(s)).toContain("Responsável");
    }
  });

  it("tem o controle de versões com data e autor, como o playbook exige", () => {
    const doc = gerarManualProcessos(ctx());
    const texto = JSON.stringify(doc);
    expect(texto).toContain("Versão");
    expect(texto).toContain("19/10/2026");
    expect(texto).toContain("Documentador(a) IA");
  });

  it("o responsável muda com o tamanho da equipe", () => {
    const sozinho = JSON.stringify(gerarManualProcessos(ctx({ privado: { equipe: "so-eu" } })));
    const equipe = JSON.stringify(gerarManualProcessos(ctx({ privado: { equipe: "6-15" } })));
    expect(sozinho).toContain("O dono do negócio");
    expect(equipe).toContain("Defina um nome e um substituto");
  });

  it("o passo do orçamento usa as ofertas publicadas quando existem", () => {
    const doc = gerarManualProcessos(
      ctx({ ofertas: [{ titulo: "Projeto residencial", descricao: "Projeto completo", preco: "sob consulta" }] }),
    );
    expect(JSON.stringify(doc)).toContain("Projeto residencial");
  });
});

describe("Kit comercial (Comercial/Automação)", () => {
  it("define quem é lead bom (BANT) com classes quente, morno e frio", () => {
    const doc = gerarKitComercial(ctx());
    const sec = doc.secoes.find((s) => s.id === "qualificacao");
    const texto = JSON.stringify(sec);
    expect(texto).toMatch(/Necessidade/);
    expect(texto).toMatch(/Prazo/);
    expect(texto).toMatch(/Quente/);
    expect(texto).toMatch(/Morno/);
    expect(texto).toMatch(/Frio/);
  });

  it("as classes da tabela e do fluxo de automação usam os mesmos limites", () => {
    const f = fluxoDeQualificacao(ctx(), perfilDeMercado("engenharia"));
    const quente = f.classes.find((c) => c.classe === "quente")?.minimo;
    const morno = f.classes.find((c) => c.classe === "morno")?.minimo;
    const tabela = JSON.stringify(gerarKitComercial(ctx()).secoes.find((s) => s.id === "qualificacao"));
    expect(tabela).toContain(`${quente} a `);
    expect(tabela).toContain(`${morno} a ${Number(quente) - 1}`);
    // a pontuação máxima do fluxo bate com a soma da tabela
    const maximo = f.etapas.reduce((s, e) => s + Math.max(0, ...(e.opcoes?.map((o) => o.pontos) ?? [0])), 0);
    expect(tabela).toContain(`${quente} a ${maximo}`);
  });

  it("o fluxo de qualificação é um grafo consistente: todo 'proximo' existe", () => {
    const f = fluxoDeQualificacao(ctx(), perfilDeMercado("beleza"));
    const idsEtapas = new Set(f.etapas.map((e) => e.id));
    for (const e of f.etapas) {
      if (e.proximo) expect(idsEtapas.has(e.proximo), e.id).toBe(true);
      for (const o of e.opcoes ?? []) expect(idsEtapas.has(o.proximo), `${e.id}/${o.rotulo}`).toBe(true);
    }
    expect(f.classes.map((c) => c.minimo)).toEqual([...f.classes.map((c) => c.minimo)].sort((a, b) => b - a));
  });

  it("só usa campos conhecidos entre chaves nas mensagens", () => {
    for (const c of contextosPorMercado()) {
      const permitido = new Set<string>(CAMPOS_DAS_MENSAGENS);
      for (const texto of mensagens(gerarKitComercial(c))) {
        for (const m of texto.matchAll(/\{([^}]*)\}/g)) expect(permitido.has(m[1]), `${c.nicho}: {${m[1]}}`).toBe(true);
      }
    }
  });

  it("mensagens de acompanhamento sempre oferecem a saída (SAIR)", () => {
    const doc = gerarKitComercial(ctx({ nivel: 3 }));
    const acomp = doc.secoes
      .find((s) => s.id === "mensagens")
      ?.blocos.filter((b): b is Extract<Bloco, { tipo: "mensagem" }> => b.tipo === "mensagem" && /Retorno|Encerramento|Reativação/.test(b.rotulo));
    expect(acomp?.length).toBeGreaterThanOrEqual(3);
    for (const m of acomp ?? []) expect(m.texto, m.rotulo).toMatch(/SAIR/);
  });

  it("o número de mensagens cresce com o nível e a confirmação de horário só existe com agenda", () => {
    const rotulos = (c: ContextoNegocio) =>
      gerarKitComercial(c).secoes.find((s) => s.id === "mensagens")?.blocos.map((b) => (b.tipo === "mensagem" ? b.rotulo : "")) ?? [];
    expect(rotulos(ctx({ nivel: 2 })).length).toBeGreaterThan(rotulos(ctx({ nivel: 1 })).length);
    expect(rotulos(ctx({ nivel: 3 })).length).toBeGreaterThan(rotulos(ctx({ nivel: 2 })).length);
    expect(rotulos(ctx({ nicho: "pet", segmento: "servico" })).join()).toContain("Confirmação de horário");
    expect(rotulos(ctx({ nicho: "engenharia" })).join()).not.toContain("Confirmação de horário");
  });

  it("a reativação aparece já no nível 1 para quem quer vender mais a quem já é cliente", () => {
    const rotulos = (objetivo: "vender-mais" | "mais-leads") =>
      gerarKitComercial(ctx({ nivel: 1, privado: { objetivo } })).secoes.find((s) => s.id === "mensagens")?.blocos.map((b) => (b.tipo === "mensagem" ? b.rotulo : "")) ?? [];
    expect(rotulos("vender-mais").join()).toContain("Reativação");
    expect(rotulos("mais-leads").join()).not.toContain("Reativação");
  });

  it("as mensagens para o cliente nunca citam as respostas privadas do cadastro", () => {
    const privadas = frasesPrivadas().filter((f) => f.length > 12);
    for (const c of contextosPorMercado()) {
      const texto = mensagens(gerarKitComercial(c)).join("\n");
      for (const f of privadas) expect(texto, `${c.nicho}: ${f}`).not.toContain(f);
    }
  });

  it("explica como pausar a automação e as boas práticas de LGPD já no nível 1", () => {
    const n1 = JSON.stringify(gerarKitComercial(ctx({ nivel: 1 })));
    expect(n1).toContain("Boas práticas e LGPD");
    expect(JSON.stringify(gerarKitComercial(ctx({ nivel: 2 })))).toContain("Como pausar ou ajustar a automação");
  });

  it("dados de saúde e de menores recebem alerta específico de LGPD", () => {
    expect(JSON.stringify(gerarKitComercial(ctx({ nicho: "clinica", segmento: "saude" })))).toMatch(/sensíveis/);
    expect(JSON.stringify(gerarKitComercial(ctx({ nicho: "educacao", segmento: "servico" })))).toMatch(/adolescentes/);
  });

  it("expõe o fluxo e a planilha para integração (JSON)", () => {
    const doc = gerarKitComercial(ctx({ nivel: 2 }));
    expect(doc.dados).toHaveProperty("fluxoQualificacao");
    expect(doc.dados).toHaveProperty("planilha");
    expect(doc.dados).toHaveProperty("campos");
  });

  it("a automação recomendada muda com o orçamento", () => {
    const gratis = JSON.stringify(gerarKitComercial(ctx({ nivel: 2, privado: { investimento: "ate-500" } })));
    const alto = JSON.stringify(gerarKitComercial(ctx({ nivel: 2, privado: { investimento: "3500+" } })));
    expect(gratis).toContain("planilha como controle de funil");
    expect(alto).toContain("API oficial do WhatsApp");
  });
});

describe("Carrosséis (Social Media)", () => {
  it("2, 4 e 6 pautas conforme o nível", () => {
    expect(gerarCarrosseis(ctx({ nivel: 1 })).pautas).toHaveLength(2);
    expect(gerarCarrosseis(ctx({ nivel: 2 })).pautas).toHaveLength(4);
    expect(gerarCarrosseis(ctx({ nivel: 3 })).pautas).toHaveLength(6);
  });

  it("todo slide cabe no limite e toda pauta abre em capa e fecha em convite", () => {
    for (const c of contextosPorMercado()) {
      for (const pauta of gerarCarrosseis(c).pautas) {
        expect(pauta.slides[0].papel, `${c.nicho}/${pauta.id}`).toBe("capa");
        expect(pauta.slides[pauta.slides.length - 1].papel, `${c.nicho}/${pauta.id}`).toBe("cta");
        expect(pauta.slides.length, pauta.id).toBeGreaterThanOrEqual(4);
        expect(pauta.slides.length, pauta.id).toBeLessThanOrEqual(8);
        for (const s of pauta.slides) {
          expect(Array.from(s.titulo).length, `${c.nicho}/${pauta.id}: ${s.titulo}`).toBeLessThanOrEqual(60);
          expect(Array.from(s.texto).length, `${c.nicho}/${pauta.id}: ${s.texto}`).toBeLessThanOrEqual(180);
          expect(s.titulo.length).toBeGreaterThan(0);
        }
        expect(pauta.legenda.length).toBeLessThanOrEqual(2200);
        expect(pauta.hashtags.length).toBeLessThanOrEqual(8);
        for (const h of pauta.hashtags) expect(h).toMatch(/^#[a-z0-9]+$/);
        expect(pauta.textoAlternativo.length).toBeGreaterThan(20);
      }
    }
  });

  it("só a pauta de bastidores é rascunho com campos entre colchetes", () => {
    const pacote = gerarCarrosseis(ctx({ nivel: 3 }));
    for (const p of pacote.pautas) {
      const textoDosSlides = p.slides.map((s) => `${s.titulo}\n${s.texto}`).join("\n");
      const colchetes = /\[[^\]\n]+\]/.test(textoDosSlides);
      expect(colchetes, p.id).toBe(p.id === "bastidores");
      expect(p.rascunho, p.id).toBe(p.id === "bastidores");
    }
  });

  it("MATERIAL PÚBLICO NUNCA vaza o que veio das respostas privadas do cadastro", () => {
    const privadas = frasesPrivadas().filter((f) => f.length > 12);
    for (const c of contextosPorMercado()) {
      const pacote = gerarCarrosseis(c);
      const texto = JSON.stringify([pacote.pautas, pacote.assinatura, pacote.titulo]);
      for (const f of privadas) expect(texto, `${c.nicho}: ${f}`).not.toContain(f);
      const reel = JSON.stringify(gerarReel(c));
      for (const f of privadas) expect(reel, `${c.nicho}: ${f}`).not.toContain(f);
    }
  });

  it("mudar as respostas privadas não muda NENHUM texto das pautas (só o calendário)", () => {
    const a = gerarCarrosseis(ctx({ nivel: 3, privado: { gargalo: "sem-processo", objetivo: "organizar", investimento: "3500+", equipe: "so-eu" } }));
    const b = gerarCarrosseis(ctx({ nivel: 3, privado: { gargalo: "imagem-fraca", objetivo: "aparecer", investimento: "ate-500", equipe: "30+" } }));
    expect(a.pautas).toEqual(b.pautas);
  });

  it("a pauta de oferta tem ao menos 4 slides mesmo com uma única oferta publicada", () => {
    const pacote = gerarCarrosseis(ctx({ ofertas: [{ titulo: "Corte feminino", descricao: "Corte e escova", preco: "R$ 80" }] }));
    expect(pacote.pautas.find((p) => p.id === "oferta")?.slides.length).toBeGreaterThanOrEqual(4);
  });

  it("o texto alternativo descreve o que cada slide diz, não só os títulos", () => {
    const dicas = gerarCarrosseis(ctx()).pautas.find((p) => p.id === "dicas");
    const primeiraDica = dicas?.slides[1];
    expect(dicas?.textoAlternativo).toContain(primeiraDica?.texto.slice(0, 20));
    expect(Array.from(dicas?.textoAlternativo ?? "").length).toBeLessThanOrEqual(300);
  });

  it("não promete orçamento por escrito nem prazo: o que o negócio faz é do negócio", () => {
    const todas = gerarCarrosseis(ctx({ nivel: 3 })).pautas.map((p) => JSON.stringify(p)).join(" ");
    expect(todas).not.toMatch(/receba um or[çc]amento|or[çc]amento por escrito|sem compromisso|resposta em/i);
  });

  it("usa as ofertas publicadas na pauta de oferta e cai no perfil do mercado quando não há", () => {
    const com = gerarCarrosseis(
      ctx({ ofertas: [{ titulo: "Projeto residencial", descricao: "Projeto completo para casas", preco: "a partir de R$ 3.000" }] }),
    );
    const oferta = com.pautas.find((p) => p.id === "oferta");
    expect(JSON.stringify(oferta?.slides)).toContain("Projeto residencial");
    expect(JSON.stringify(oferta?.slides)).toContain("a partir de R$ 3.000");
    const sem = gerarCarrosseis(ctx());
    expect(JSON.stringify(sem.pautas.find((p) => p.id === "oferta")?.slides)).toContain("O que fazemos");
  });

  it("a pauta local só cita parceiro que existe", () => {
    const sem = gerarCarrosseis(ctx({ nivel: 3 })).pautas.find((p) => p.id === "local");
    expect(JSON.stringify(sem)).not.toContain("Quem trabalha junto");
    const com = gerarCarrosseis(ctx({ nivel: 3, parceiros: [{ nome: "Contabilizy", segmento: "contabilidade" }] })).pautas.find(
      (p) => p.id === "local",
    );
    expect(JSON.stringify(com)).toContain("Contabilizy");
  });

  it("o calendário dimensiona pela equipe: 3, 4 ou 5 publicações por semana", () => {
    const porSemana = (equipe: "so-eu" | "6-15" | "30+") => {
      const cal = gerarCarrosseis(ctx({ privado: { equipe } })).calendario;
      return cal.filter((d) => d.quando.startsWith("Semana 1")).length;
    };
    expect(porSemana("so-eu")).toBe(3);
    expect(porSemana("6-15")).toBe(4);
    expect(porSemana("30+")).toBe(5);
  });

  it("o calendário tem 2 semanas no nível 1 e 4 do nível 2 em diante, com carrosséis nos dois primeiros dias", () => {
    expect(gerarCarrosseis(ctx({ nivel: 1 })).calendario.filter((d) => d.quando.endsWith("terça")).length).toBe(2);
    expect(gerarCarrosseis(ctx({ nivel: 2 })).calendario.filter((d) => d.quando.endsWith("terça")).length).toBe(4);
    const pautas = gerarCarrosseis(ctx({ nivel: 2 })).pautas;
    const cal = montarCalendario(pautas, 3, 1);
    expect(cal[0].pautaId).toBe(pautas[0].id);
    expect(cal[1].pautaId).toBe(pautas[1].id);
    expect(cal[2].pautaId).toBeNull();
  });

  it("o documento do pacote avisa que é material para publicar e traz legenda copiável", () => {
    const doc = carrosselParaDocumento(gerarCarrosseis(ctx({ nivel: 2 })));
    expect(doc.meta.circulacao).toBe("publico");
    expect(mensagens(doc).length).toBeGreaterThanOrEqual(4 * 3);
    expect(doc.dados).toHaveProperty("pacote");
  });

  it("não promete o que o negócio pode não cumprir", () => {
    for (const c of contextosPorMercado()) {
      const doc = carrosselParaDocumento(gerarCarrosseis(c));
      const problemas = auditarDocumento(doc, { nomeNegocio: c.nome, publico: true, permitirColchetes: true });
      expect(problemas, `${c.nicho}/n${c.nivel}`).toEqual([]);
    }
  });
});

describe("Roteiro de vídeo (Editor de Vídeo)", () => {
  it("abre pelo gancho e fecha pelo convite", () => {
    const cenas = gerarReel(ctx()).cenas;
    expect(cenas[0].papel).toBe("Gancho");
    expect(cenas[cenas.length - 1].papel).toBe("Convite");
  });

  it("o gancho cita a dor do CLIENTE do mercado, em todos os perfis", () => {
    for (const p of todosOsPerfis()) {
      const reel = gerarReel(ctx({ nicho: p.id, nivel: 1 }));
      const dor = p.dores[0];
      expect(reel.cenas[0].fala.toLowerCase()).toContain(dor.toLowerCase());
    }
  });

  it("nenhuma cena sai sem fala, imagem ou texto de tela, e a legenda de tela é curta", () => {
    for (const c of contextosPorMercado()) {
      for (const cena of gerarReel(c).cenas) {
        expect(cena.fala.length).toBeGreaterThan(10);
        expect(cena.imagem.length).toBeGreaterThan(10);
        expect(cena.legenda.length).toBeGreaterThan(0);
        expect(Array.from(cena.legenda).length).toBeLessThanOrEqual(42);
      }
    }
  });

  it("as janelas de tempo são contínuas e somam a duração", () => {
    for (const nivel of NIVEIS) {
      const reel = gerarReel(ctx({ nivel }));
      reel.cenas.forEach((c, i) => {
        expect(c.tempo).toBe(`${i * SEGUNDOS_POR_CENA}–${(i + 1) * SEGUNDOS_POR_CENA}s`);
      });
      expect(reel.duracaoSegundos).toBe(reel.cenas.length * SEGUNDOS_POR_CENA);
    }
  });

  it("evoluir acrescenta cena: dica extra no 2, prova real no 3", () => {
    const n = (nivel: 1 | 2 | 3) => gerarReel(ctx({ nivel })).cenas;
    expect(n(2).length).toBeGreaterThan(n(1).length);
    expect(n(3).length).toBeGreaterThan(n(2).length);
    expect(n(3).some((c) => c.papel === "Prova")).toBe(true);
  });

  it("traz checklist de captura e formatos, como o playbook pede", () => {
    const reel = gerarReel(ctx());
    expect(reel.capturaChecklist.length).toBeGreaterThanOrEqual(6);
    expect(reel.formatos.join(" ")).toContain("9:16");
  });

  it("ganchos alternativos só do nível 2 em diante e reaproveitamento só no 3", () => {
    expect(gerarReel(ctx({ nivel: 1 })).ganchosAlternativos).toEqual([]);
    expect(gerarReel(ctx({ nivel: 2 })).ganchosAlternativos).toHaveLength(3);
    expect(gerarReel(ctx({ nivel: 2 })).reaproveitamento).toEqual([]);
    expect(gerarReel(ctx({ nivel: 3 })).reaproveitamento.length).toBeGreaterThan(0);
  });

  it("não tem artigo errado antes do nome, nem promessa, em nenhum perfil", () => {
    for (const c of contextosPorMercado()) {
      const doc = reelParaDocumento(gerarReel(c));
      expect(auditarDocumento(doc, { nomeNegocio: c.nome, publico: true }), `${c.nicho}/n${c.nivel}`).toEqual([]);
    }
  });
});

describe("Qualidade do texto em todas as combinações (o que a auditoria de 19/10 pegou)", () => {
  it("canvas, manual e kit comercial: nada de undefined, campo solto, espaço duplo nem artigo antes do nome", () => {
    for (const c of contextosPorMercado()) {
      for (const [rotulo, doc] of [
        ["canvas", gerarCanvas(c)],
        ["pop", gerarManualProcessos(c)],
        ["comercial", gerarKitComercial(c)],
      ] as const) {
        const problemas = auditarDocumento(doc, { nomeNegocio: c.nome, publico: false });
        expect(problemas, `${rotulo}/${c.nicho}/n${c.nivel}/${c.nome}`).toEqual([]);
      }
    }
  });

  it("todas as combinações de respostas do cadastro geram canvas e kit válidos", () => {
    const objetivos = Object.keys(PLANOS) as Array<keyof typeof PLANOS>;
    const gargalos = ["perco-leads", "manual", "sem-dados", "imagem-fraca", "sem-processo"] as const;
    const presencas = ["nada", "social", "portais", "site-desatualizado", "site-portais"] as const;
    const investimentos = ["nao-sei", "ate-500", "500-1500", "1500-3500", "3500+"] as const;
    const equipes = ["so-eu", "2-5", "6-15", "16-30", "30+"] as const;
    let total = 0;
    for (const objetivo of objetivos) {
      for (const gargalo of gargalos) {
        for (const presenca of presencas) {
          const investimento = investimentos[total % 5];
          const equipe = equipes[total % 5];
          total += 1;
          const c = ctx({
            nome: "Mercado Fiel",
            nivel: 3,
            privado: { objetivo, gargalo, presencaDigital: presenca, investimento, equipe, captacao: total % 2 ? ["indicacao", "social"] : [] },
          });
          for (const doc of [gerarCanvas(c), gerarKitComercial(c)]) {
            expect(auditarDocumento(doc, { nomeNegocio: c.nome, publico: false }), `${objetivo}/${gargalo}/${presenca}`).toEqual([]);
          }
        }
      }
    }
    expect(total).toBe(125);
  });

  it("nomes difíceis (acento, aspas, símbolos, muito longo) não quebram nem vazam formatação", () => {
    for (const nome of ["Café & Cia <Ltda>", "Zé \"da Esquina\" ME", "A".repeat(200), "Açaí do Léo — Delivery"]) {
      const c = ctx({ nome: nome.slice(0, 80), nicho: "restaurante", segmento: "alimentacao", nivel: 3 });
      for (const doc of [gerarCanvas(c), gerarManualProcessos(c), gerarKitComercial(c), carrosselParaDocumento(gerarCarrosseis(c)), reelParaDocumento(gerarReel(c))]) {
        expect(() => JSON.stringify(doc)).not.toThrow();
        expect(textosDoDocumento(doc).every(([, t]) => typeof t === "string")).toBe(true);
      }
    }
  });
});
