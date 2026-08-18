/**
 * Conteúdo da landing (GH-MKT-01) — toda a copy e os dados de marketing
 * centralizados aqui, separados da apresentação (`sections/`). Trocar um
 * texto, preço ou adicionar um card não deve exigir mexer em JSX/motion —
 * só editar este arquivo.
 *
 * Única exceção: a escada de valor (preço real por degrau) vive em
 * `DEGRAUS` (`@/features/onboarding/scoring`) — é a mesma fonte usada pelo
 * resto do jogo, nunca duplicar preço aqui.
 *
 * Regra herdada do corpus do document-engine: nunca prometer no marketing
 * mais do que o produto realmente entrega hoje.
 */

export const NAV = {
  marca: "labdatadev · gamehub",
  entrar: "Entrar",
  cta: "Começar grátis",
};

export const HERO = {
  badge: "Documentação + gamificação real",
  tituloLinha1: "Sua empresa documentada",
  tituloDestaqueGradiente: "10 minutos",
  tituloLinha2Prefixo: "e seu",
  tituloDestaqueShimmer: "marketing no piloto automático",
  descricao:
    "Cadastre seu negócio e ganhe um lote no mapa isométrico da sua região. Enquanto isso, nossa IA gera sua documentação completa — Canvas, Modelo de Negócio, SWOT, Resumo Executivo, Roadmap e até a Proposta Comercial pronta pra usar com os seus próprios clientes. Você foca em vender — a burocracia sai no piloto automático.",
  ctaPrimario: "Começar grátis",
  ctaSecundario: "Ver a escada de valor",
  rodape: "Grátis para começar · sem cartão de crédito",
  linkDemo: "ver demo ao vivo sem cadastro",
};

// Reflete exatamente o que o Document Engine (GH-DOC-01) gera hoje — 6
// documentos por rodada, ver document-engine/knowledge-base/01-corpus-
// oficial-gamehub.md. Nunca prometer no marketing mais do que o motor
// realmente produz.
export const DOCUMENTOS = [
  { label: "Business Model Canvas", desc: "9 blocos, ordem oficial, com tensões e riscos mapeados" },
  { label: "Modelo de Negócio", desc: "Narrativa estratégica, escada de valor, unit economics" },
  { label: "Análise SWOT Estratégica", desc: "Matriz cruzada, ancorada nos atributos do seu negócio" },
  { label: "Resumo Executivo", desc: "1 página, pronta pra mostrar a um sócio ou parceiro" },
  { label: "Roadmap de Melhoria Contínua", desc: "Plano de 90 dias ligado aos seus 5 atributos" },
  { label: "Proposta Comercial", desc: "Peça de venda pronta pra usar com os SEUS clientes" },
] as const;

export const TICKER_ITEMS = DOCUMENTOS.map((d) => d.label);

export const FEATURES = [
  { icon: "bolt", title: "10 minutos", desc: "Cadastre seu negócio e a IA já começa a trabalhar na sua documentação — mais rápido que montar uma proposta do zero." },
  { icon: "globe", title: "Mapa regional", desc: "Seu negócio ganha um lote no mapa isométrico da sua região — vizinhos de quarteirão viram parcerias reais." },
  { icon: "users", title: "Equipe de IA", desc: "Contrate Funcionários de IA por assinatura conforme sobe de degrau — sem contratar CLT." },
] as const;

export const CANAIS_MARKETING = [
  { icon: "file", label: "Proposta Comercial pronta", desc: "Gerada a partir da sua documentação — é só copiar e mandar pro seu cliente." },
  { icon: "globe", label: "Vitrine no Mapa Vivo", desc: "Suas ofertas aparecem pro bairro inteiro, sem configurar nada extra." },
] as const;

export const STATS = [
  { to: 10, suffix: " min", label: "do cadastro à documentação pronta" },
  { to: 6, suffix: "", label: "documentos gerados por rodada" },
  { to: 5, suffix: "", label: "degraus na escada de valor" },
] as const;

export const DOCUMENTOS_SECTION = {
  badge: "Gerado automaticamente pela IA",
  tituloLinha1: "A documentação que sua empresa",
  tituloDestaque: "precisa, pronta em minutos.",
};

export const MARKETING_SECTION = {
  badge: "A mesma documentação, virando marketing",
  titulo: "Seu marketing no",
  tituloShimmer: "piloto automático.",
};

export const ESCADA_SECTION = {
  badge: "Comece grátis, suba de degrau",
  titulo: "A escada de valor",
  tituloDestaqueGradiente: "do seu negócio.",
  descricao:
    "Todo cadastro nasce no degrau 1, de graça. Você sobe conforme contrata Funcionários de IA e automações reais — sem contrato longo, sem letra miúda.",
  cta: "Começar grátis e subir a escada",
};

export const CTA_FINAL = {
  titulo: "Pronto para colocar",
  tituloLinha2: "seu negócio no mapa?",
  descricao:
    "Cadastro grátis, documentação de nível consultoria e um lugar no mapa da sua região — em 10 minutos.",
  cta: "Começar grátis agora",
};

export const FOOTER = {
  texto: "© 2026 Laboratório Demarchi · labdatadev gamehub",
};

export function precoEhRecorrente(preco: string): boolean {
  return preco.includes("/mês");
}
