"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { LandingLinkButton } from "@/components/ui/LandingLinkButton";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TextShimmer } from "@/components/ui/TextShimmer";
import { Marquee } from "@/components/ui/Marquee";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { MotionCanvas } from "@/components/effects/MotionCanvas";
import { DEGRAUS } from "@/features/onboarding/scoring";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.09 } } };

// Reflete exatamente o que o Document Engine (GH-DOC-01) gera hoje — 6
// documentos por rodada, ver document-engine/knowledge-base/01-corpus-
// oficial-gamehub.md. Nunca prometer no marketing mais do que o motor
// realmente produz.
const DOCUMENTOS = [
  { label: "Business Model Canvas", desc: "9 blocos, ordem oficial, com tensões e riscos mapeados" },
  { label: "Modelo de Negócio", desc: "Narrativa estratégica, escada de valor, unit economics" },
  { label: "Análise SWOT Estratégica", desc: "Matriz cruzada, ancorada nos atributos do seu negócio" },
  { label: "Resumo Executivo", desc: "1 página, pronta pra mostrar a um sócio ou parceiro" },
  { label: "Roadmap de Melhoria Contínua", desc: "Plano de 90 dias ligado aos seus 5 atributos" },
  { label: "Proposta Comercial", desc: "Peça de venda pronta pra usar com os SEUS clientes" },
];

const TICKER_ITEMS = DOCUMENTOS.map((d) => d.label);

const FEATURES = [
  { icon: "bolt" as const, title: "10 minutos", desc: "Cadastre seu negócio e a IA já começa a trabalhar na sua documentação — mais rápido que montar uma proposta do zero." },
  { icon: "globe" as const, title: "Mapa regional", desc: "Seu negócio ganha um lote no mapa isométrico da sua região — vizinhos de quarteirão viram parcerias reais." },
  { icon: "users" as const, title: "Equipe de IA", desc: "Contrate Funcionários de IA por assinatura conforme sobe de degrau — sem contratar CLT." },
];

const CANAIS_MARKETING = [
  { icon: "file" as const, label: "Proposta Comercial pronta", desc: "Gerada a partir da sua documentação — é só copiar e mandar pro seu cliente." },
  { icon: "globe" as const, label: "Vitrine no Mapa Vivo", desc: "Suas ofertas aparecem pro bairro inteiro, sem configurar nada extra." },
];

function precoEhRecorrente(preco: string) {
  return preco.includes("/mês");
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-line/60 bg-night/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <span className="font-pixel text-[11px] uppercase tracking-[3px] text-teal">
            labdatadev · gamehub
          </span>
          <div className="flex items-center gap-3">
            <Link href="/entrar" className="text-sm font-bold text-muted hover:text-white transition-colors">
              Entrar
            </Link>
            <LandingLinkButton href="/cadastro" icon="arrow" className="!px-4 !py-2 !text-xs">
              Começar grátis
            </LandingLinkButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal/5 blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-orange/5 blur-[100px]" />
        </div>

        <MotionCanvas className="pointer-events-none absolute inset-0 opacity-70" />

        <motion.div
          className="relative z-10 max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-teal">
              <Icon name="star" size={12} /> Documentação + gamificação real
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Sua empresa documentada<br />
            em <span className="text-gradient">10 minutos</span><br />
            e seu <TextShimmer>marketing no piloto automático</TextShimmer>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-10 text-lg text-muted max-w-2xl mx-auto leading-relaxed"
          >
            Cadastre seu negócio e ganhe um lote no mapa isométrico da sua região. Enquanto isso, nossa IA gera
            sua documentação completa — Canvas, Modelo de Negócio, SWOT, Resumo Executivo, Roadmap e até a
            Proposta Comercial pronta pra usar com os seus próprios clientes. Você foca em vender — a
            burocracia sai no piloto automático.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LandingLinkButton href="/cadastro" icon="arrow">
              Começar grátis
            </LandingLinkButton>
            <LandingLinkButton href="#escada" variant="ghost">
              Ver a escada de valor
            </LandingLinkButton>
          </motion.div>

          <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="mt-8 text-sm text-muted/70">
            Grátis para começar · sem cartão de crédito ·{" "}
            <Link href="/demo" className="font-bold text-teal underline underline-offset-2">
              ver demo ao vivo sem cadastro
            </Link>
          </motion.p>
        </motion.div>

        <div className="absolute bottom-20 right-16 opacity-20 hidden lg:block">
          <motion.div
            className="size-32 rounded-full border border-teal/30 bg-teal/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </section>

      {/* TICKER */}
      <section className="border-y border-line/60 bg-white/[0.02] py-5">
        <Marquee speedSeconds={30}>
          {TICKER_ITEMS.map((item) => (
            <span key={item} className="flex items-center gap-2.5 text-sm font-bold text-muted whitespace-nowrap">
              <span className="text-teal">✦</span> {item}
            </span>
          ))}
        </Marquee>
      </section>

      {/* STATS */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-3 gap-4 sm:gap-6"
          >
            {[
              { to: 10, suffix: " min", label: "do cadastro à documentação pronta" },
              { to: 6, suffix: "", label: "documentos gerados por rodada" },
              { to: 5, suffix: "", label: "degraus na escada de valor" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }}>
                <SpotlightCard className="p-5 sm:p-7 text-center h-full">
                  <p className="text-3xl sm:text-4xl font-extrabold text-gradient tabular-nums">
                    <AnimatedCounter to={stat.to} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-muted leading-snug">{stat.label}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.5 }}>
                <SpotlightCard className="p-6 h-full">
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-teal/15">
                    <Icon name={f.icon} size={20} className="text-teal" />
                  </div>
                  <h3 className="mb-2 text-lg font-extrabold text-white">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DOCUMENTOS GERADOS */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-teal">
              Gerado automaticamente pela IA
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              A documentação que sua empresa<br />
              <span className="text-gradient">precisa, pronta em minutos.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto gap-4"
          >
            {DOCUMENTOS.map((doc, i) => (
              <motion.div key={doc.label} variants={fadeUp} transition={{ duration: 0.4 }}>
                <div className="rounded-md border border-line bg-card2 p-4 h-full group hover:border-teal/40 transition-colors duration-300">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-md bg-teal/10 group-hover:bg-teal/20 transition-colors">
                    <Icon name="file" size={16} className="text-teal" />
                  </div>
                  <p className="mb-1 text-sm font-bold text-white">{doc.label}</p>
                  <p className="text-xs text-muted leading-relaxed">{doc.desc}</p>
                  <div className="mt-3 text-xs text-teal font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    #{i + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MARKETING NO PILOTO AUTOMÁTICO */}
      <section className="px-6 py-24 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-teal">
              A mesma documentação, virando marketing
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Seu marketing no<br />
              <TextShimmer>piloto automático.</TextShimmer>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 max-w-2xl mx-auto gap-5"
          >
            {CANAIS_MARKETING.map((canal) => (
              <motion.div key={canal.label} variants={fadeUp} transition={{ duration: 0.5 }}>
                <SpotlightCard className="p-6 h-full">
                  <Icon name={canal.icon} size={22} className="mb-4 text-teal" />
                  <p className="mb-2 text-base font-extrabold text-white">{canal.label}</p>
                  <p className="text-sm text-muted leading-relaxed">{canal.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ESCADA DE VALOR (oferta) */}
      <section id="escada" className="px-6 py-24 scroll-mt-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-[2px] text-orange">
              Comece grátis, suba de degrau
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              A escada de valor<br />
              <span className="text-gradient">do seu negócio.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted leading-relaxed">
              Todo cadastro nasce no degrau 1, de graça. Você sobe conforme contrata Funcionários de IA e
              automações reais — sem contrato longo, sem letra miúda.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {Object.entries(DEGRAUS).map(([n, d]) => (
              <motion.div key={n} variants={fadeUp} transition={{ duration: 0.4 }}>
                <SpotlightCard className="p-5 h-full flex flex-col">
                  <span className="mb-2 font-pixel text-[10px] text-teal">DEGRAU {n}</span>
                  <p className="mb-1 text-sm font-extrabold text-white leading-snug">{d.nome}</p>
                  <p className="mt-auto pt-3 text-lg font-extrabold text-gradient">{d.preco}</p>
                  {precoEhRecorrente(d.preco) ? (
                    <span className="text-[10px] text-muted">cobrança recorrente</span>
                  ) : (
                    <span className="text-[10px] text-muted">{d.preco === "R$ 0" ? "entrada" : "pagamento único"}</span>
                  )}
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <LandingLinkButton href="/cadastro" icon="arrow">
              Começar grátis e subir a escada
            </LandingLinkButton>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-line bg-card2 p-12 shadow-hard-lg"
          >
            <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
              Pronto para colocar<br />seu negócio no mapa?
            </h2>
            <p className="mb-8 text-muted">
              Cadastro grátis, documentação de nível consultoria e um lugar no mapa da sua região — em 10
              minutos.
            </p>
            <LandingLinkButton href="/cadastro" icon="arrow" className="px-10 py-4 text-base">
              Começar grátis agora
            </LandingLinkButton>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-line/60 px-6 py-8 text-center text-sm text-muted/60">
        © 2026 Laboratório Demarchi · labdatadev gamehub
      </footer>
    </div>
  );
}
