# 05 · Alpha-3 — plataforma de liderança / alta performance

**Fonte:** `Desktop/alpha-3-platform` (estudo estático). Next.js 15 · React 19 ·
TypeScript · Tailwind · Framer Motion · React Three Fiber. i18n PT-BR/EN-US.

## Objetivo

Landing **premium** para serviços de **liderança e alta performance** ("Cel.
Demarchi") — posicionamento executivo/mentoria, distinto do resto do
ecossistema (que é PME/técnico). Serve o público de gestão e desenvolvimento
de pessoas.

## Stack & estado

Next.js 15 App Router com i18n por segmento `[locale]` + middleware de
redireção, hero 3D (R3F) lazy-loaded, headers de segurança enterprise (CSP,
HSTS), GTM, SEO por locale (hreflang, JSON-LD Person), `sitemap.ts`/`robots.ts`.
Tem **camada de autenticação** (login/cadastro/recuperar). **Estado:** landing
avançada, publicável.

## Telas (sob `/[locale]`, ex.: `/pt`, `/en`)

### T1 · Home (`/[locale]`)
- **Objetivo:** apresentar a marca de liderança com impacto visual (hero 3D).
- **RF-01:** hero 3D reativo ao cursor, com fallback (respeita
  `prefers-reduced-motion`).
- **RF-02:** seções de proposta de valor, serviços e prova social.
- **RF-03:** troca de idioma PT/EN e tema claro/escuro persistido.

### T2 · Inicial (`/[locale]/inicial`)
- **Objetivo:** área pós-login / dashboard inicial do usuário autenticado.
- **RF-04:** conteúdo/painel exclusivo para quem entrou (gated por sessão).

### T3 · Login (`/[locale]/login`)
- **Objetivo:** autenticar usuário.
- **RF-05:** formulário e-mail/senha + link para recuperar/cadastro.

### T4 · Cadastro (`/[locale]/cadastro`)
- **Objetivo:** criar conta.
- **RF-06:** formulário de registro com validação.
- **RF-07 (LGPD):** consentimento explícito no cadastro.

### T5 · Recuperar (`/[locale]/recuperar`)
- **Objetivo:** recuperação de senha.
- **RF-08:** solicitar reset por e-mail.

## Papel no jogo

**App "🎖️ Alpha-3" — trilha de liderança do dono.** Enquanto os outros apps
falam do negócio, este fala do **empresário como líder**. Encaixa como um app
"de desenvolvimento pessoal" que complementa a educação empreendedora (o sócio
coordenador do MBA).

- **Integração N1→N2:** ícone abre a landing (nova aba) ou janela embutida com
  resumo dos serviços de liderança + CTA.
- **Sinergia de conteúdo:** as "lições" de empreendedorismo do jogo
  (`GH-EDU`) podem apontar para conteúdo Alpha-3 de liderança.
- **Gating:** app "premium" — liberar em degrau alto ou como recompensa
  narrativa (o dono "amadureceu como líder").

## Requisitos de integração

- **RI-01:** o login do Alpha-3 é **independente** do login do jogo — não
  tentar SSO agora; se embutido (N2), tratar como site externo (sandbox).
- **RI-02:** o hero 3D (R3F) é pesado — se algum dia N3, carregar sob demanda,
  nunca no first paint do jogo.
- **RI-03:** i18n do Alpha-3 não obriga i18n no jogo — o app é uma janela, o
  jogo segue PT-BR.
