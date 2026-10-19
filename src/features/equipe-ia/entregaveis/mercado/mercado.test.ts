import { describe, expect, it } from "vitest";
import { inferirNicho, perfilDeMercado, todosOsPerfis } from "./index";
import { EQUIPE, GARGALOS, INVESTIMENTO, PLANOS, PRESENCA_DIGITAL } from "./planos";
import { NICHOS } from "./nichos";
import { SEGMENTOS } from "./segmentos";

const SEGMENTOS_DO_CADASTRO = [
  "engenharia",
  "contabilidade",
  "saude",
  "tecnologia",
  "alimentacao",
  "comercio",
  "servico",
  "outro",
] as const;

describe("mercado: cobertura do conhecimento", () => {
  it("os 8 segmentos do cadastro têm perfil", () => {
    for (const s of SEGMENTOS_DO_CADASTRO) expect(SEGMENTOS[s].id).toBe(s);
  });

  it("os ids dos perfis são únicos", () => {
    const ids = todosOsPerfis().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo perfil tem conteúdo suficiente para os cinco entregáveis", () => {
    for (const p of todosOsPerfis()) {
      const nome = p.id;
      expect(p.clientes.length, `${nome}: clientes`).toBeGreaterThanOrEqual(3);
      expect(p.dores.length, `${nome}: dores`).toBeGreaterThanOrEqual(3);
      expect(p.desejos.length, `${nome}: desejos`).toBeGreaterThanOrEqual(3);
      expect(p.gatilhos.length, `${nome}: gatilhos`).toBeGreaterThanOrEqual(3);
      expect(p.provas.length, `${nome}: provas`).toBeGreaterThanOrEqual(3);
      expect(p.dicas.length, `${nome}: dicas`).toBeGreaterThanOrEqual(3);
      for (const d of p.dicas) expect(d.pontos.length, `${nome}: pontos de "${d.titulo}"`).toBeGreaterThanOrEqual(3);
      expect(p.mitos.length, `${nome}: mitos`).toBeGreaterThanOrEqual(2);
      expect(p.perguntas.length, `${nome}: perguntas`).toBeGreaterThanOrEqual(4);
      expect(p.objecoes.length, `${nome}: objeções`).toBeGreaterThanOrEqual(2);
      expect(p.canais.length, `${nome}: canais`).toBeGreaterThanOrEqual(3);
      expect(p.atividadesChave.length, `${nome}: atividades`).toBeGreaterThanOrEqual(3);
      expect(p.recursos.length, `${nome}: recursos`).toBeGreaterThanOrEqual(3);
      expect(p.parcerias.length, `${nome}: parcerias`).toBeGreaterThanOrEqual(3);
      expect(p.receitas.length, `${nome}: receitas`).toBeGreaterThanOrEqual(3);
      expect(p.custos.length, `${nome}: custos`).toBeGreaterThanOrEqual(3);
      expect(p.documentos.length, `${nome}: documentos`).toBeGreaterThanOrEqual(4);
      expect(p.execucao.passos.length, `${nome}: passos`).toBeGreaterThanOrEqual(6);
      expect(p.execucao.qualidade.length, `${nome}: qualidade`).toBeGreaterThanOrEqual(3);
      expect(p.execucao.erros.length, `${nome}: erros`).toBeGreaterThanOrEqual(3);
      expect(p.indicadores.length, `${nome}: indicadores`).toBeGreaterThanOrEqual(3);
      expect(p.riscos.length, `${nome}: riscos`).toBeGreaterThanOrEqual(3);
    }
  });

  it("nenhum texto tem espaço duplo, espaço nas pontas ou a palavra undefined", () => {
    for (const p of todosOsPerfis()) {
      const textos = JSON.stringify(p);
      expect(textos, p.id).not.toMatch(/undefined/);
      expect(textos, p.id).not.toMatch(/ {2,}/);
      expect(textos, p.id).not.toMatch(/"\s|\s"/);
    }
  });

  it("as hashtags vêm sem acento, sem espaço e sem hífen", () => {
    for (const p of todosOsPerfis()) {
      expect(p.hashtags.length).toBeGreaterThanOrEqual(2);
      for (const h of p.hashtags) expect(h, p.id).toMatch(/^#[a-z0-9]+$/);
    }
  });

  it("as perguntas terminam com interrogação e as dores não terminam com ponto", () => {
    for (const p of todosOsPerfis()) {
      for (const q of p.perguntas) expect(q, p.id).toMatch(/\?$/);
      for (const d of p.dores) expect(d, p.id).not.toMatch(/[.!?]$/);
    }
  });

  it("só quem vende ao governo cita o poder público entre os clientes sem ressalva", () => {
    for (const p of todosOsPerfis()) {
      const cita = p.clientes.some((c) => /prefeitura|órgão|orgao|pregão|licitação/i.test(c));
      if (cita) expect(p.vendeParaGoverno, p.id).toBe(true);
    }
    // e quando cita, é condicional (nem todo negócio participa de licitação)
    for (const p of todosOsPerfis()) {
      for (const c of p.clientes.filter((x) => /prefeitura|pregão|licitação|órgãos públicos/i.test(x))) {
        expect(c, p.id).toMatch(/se o negócio participa|por licitação|por pregão|por contrato|por fornecimento/i);
      }
    }
  });

  it("nichos de bairro não oferecem licitação como cliente", () => {
    for (const n of NICHOS) {
      expect(n.perfil.vendeParaGoverno, n.perfil.id).toBe(false);
      expect(JSON.stringify(n.perfil.clientes), n.perfil.id).not.toMatch(/licita|pregão|prefeitura/i);
    }
  });
});

describe("mercado: separação de perspectivas (a falha que existia)", () => {
  it("a dor do cliente nunca é a dor do dono (cliente que só lembra do contador)", () => {
    for (const p of todosOsPerfis()) {
      for (const d of p.dores) {
        expect(d, p.id).not.toMatch(/cliente que só lembra|depender de indicação|viver de projeto avulso/i);
      }
    }
  });
});

describe("inferirNicho", () => {
  it("reconhece o nicho pelo nome do negócio", () => {
    expect(inferirNicho("servico", "Studio Bela Cabelos", [])).toBe("beleza");
    expect(inferirNicho("servico", "Barbearia do Zé", [])).toBe("beleza");
    expect(inferirNicho("comercio", "Mercado Fiel", [])).toBe("mercadinho");
    expect(inferirNicho("servico", "Pet Shop Amigo Fiel", [])).toBe("pet");
    expect(inferirNicho("servico", "Auto Mecânica Silva", [])).toBe("automotivo");
    expect(inferirNicho("alimentacao", "Doces da Vovó Confeitaria", [])).toBe("confeitaria");
    expect(inferirNicho("alimentacao", "Pizzaria Bella", [])).toBe("restaurante");
    expect(inferirNicho("outro", "Imobiliária Vale", [])).toBe("imobiliario");
  });

  it("reconhece o nicho pelas ofertas quando o nome não ajuda", () => {
    const ofertas = [{ titulo: "Corte feminino", descricao: "Corte e escova com hidratação" }];
    expect(inferirNicho("servico", "Espaço Lúmen", ofertas)).toBe("beleza");
    const servicos = [{ titulo: "Instalação elétrica", descricao: "Eletricista para casa e comércio" }];
    expect(inferirNicho("servico", "JM Soluções", servicos)).toBe("servicos_casa");
  });

  it("o nome pesa mais que as ofertas", () => {
    const ofertas = [{ titulo: "Banho e tosa", descricao: "Tosa higiênica" }];
    expect(inferirNicho("servico", "Barbearia Premium", ofertas)).toBe("beleza");
  });

  it("sem palavra reconhecida, fica no segmento", () => {
    expect(inferirNicho("servico", "JM Soluções", [])).toBe("servico");
    expect(inferirNicho("comercio", "Loja Alfa", [])).toBe("comercio");
  });

  it("segmentos regulados não ganham nicho de bairro por acidente", () => {
    expect(inferirNicho("engenharia", "Radiz Engenharia", [])).toBe("engenharia");
    expect(inferirNicho("contabilidade", "Contabilizy", [])).toBe("contabilidade");
  });

  it("não confunde 'recursos' com 'curso' nem 'modalidade' com 'moda'", () => {
    const ofertas = [{ titulo: "Recursos humanos", descricao: "Modalidades de contrato" }];
    expect(inferirNicho("servico", "JM Consultoria", ofertas)).toBe("servico");
  });

  it("perfilDeMercado devolve o nicho, o segmento ou, sem nada, 'outro'", () => {
    expect(perfilDeMercado("beleza").id).toBe("beleza");
    expect(perfilDeMercado("engenharia").id).toBe("engenharia");
    expect(perfilDeMercado("nao-existe").id).toBe("outro");
  });
});

describe("planos: conhecimento transversal", () => {
  it("cobre todas as respostas possíveis do cadastro", () => {
    expect(Object.keys(PLANOS).sort()).toEqual(["aparecer", "automatizar", "mais-leads", "organizar", "vender-mais"]);
    expect(Object.keys(GARGALOS)).toHaveLength(5);
    expect(Object.keys(PRESENCA_DIGITAL)).toHaveLength(5);
    expect(Object.keys(EQUIPE)).toHaveLength(5);
    expect(Object.keys(INVESTIMENTO)).toHaveLength(5);
  });

  it("todo plano tem primeiras ações e ações nas três fases, com tempo e indicador", () => {
    for (const [id, plano] of Object.entries(PLANOS)) {
      expect(plano.primeirasAcoes.length, id).toBeGreaterThanOrEqual(3);
      for (const fase of [plano.fase30, plano.fase60, plano.fase90]) {
        expect(fase.length, id).toBeGreaterThanOrEqual(2);
        for (const a of fase) {
          expect(a.acao.length, id).toBeGreaterThan(15);
          expect(a.esforco.length, id).toBeGreaterThan(3);
          expect(a.indicador.length, id).toBeGreaterThan(3);
        }
      }
    }
  });

  it("o plano nunca inventa meta numérica de resultado (a IA não conhece a linha de base)", () => {
    for (const [id, plano] of Object.entries(PLANOS)) {
      const texto = JSON.stringify(plano);
      expect(texto, id).not.toMatch(/\d+\s?%\s+(a mais|de aumento)|aumentar\s+\d+|dobrar|triplicar/i);
    }
  });

  it("a recomendação de ferramentas cresce com o orçamento", () => {
    const n = (k: keyof typeof INVESTIMENTO) => INVESTIMENTO[k].ferramentas.length;
    expect(n("500-1500")).toBeGreaterThan(n("ate-500"));
    expect(n("1500-3500")).toBeGreaterThan(n("500-1500"));
    expect(n("3500+")).toBeGreaterThan(n("1500-3500"));
  });

  it("a faixa de investimento sai legível, sem o valor cru do formulário", () => {
    for (const f of Object.values(INVESTIMENTO)) {
      expect(f.rotulo).not.toMatch(/ate-|-\d|\+$/);
    }
  });
});
