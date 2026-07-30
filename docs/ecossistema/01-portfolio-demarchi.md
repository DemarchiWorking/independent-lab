# 01 · Portfólio Demarchi

**Fonte:** site publicado `https://portfoliodemarchi.com.br` (estudo por
leitura pública; nenhum código copiado).

## Objetivo

Vitrine profissional de **Antonio Demarchi** como engenheiro de software —
apresentar expertise em **.NET, AWS e DevOps** para atrair clientes e
demonstrar capacidade técnica via projetos e experiência. É a **porta de
entrada comercial** dos serviços de TI do Laboratório Demarchi.

## Stack & estado

Next.js (publicado, em produção). Site institucional, majoritariamente
estático/SSR, com formulário de contato. **Estado: no ar e estável** — o
candidato mais fácil para o primeiro app do computador do escritório (N1).

## Telas

### T1 · Início (Home)
- **Objetivo:** apresentação e proposta de valor em uma frase; direcionar para
  projetos e contato.
- **RF-01:** exibir hero com nome, cargo e resumo de posicionamento.
- **RF-02:** CTA primário "Meus projetos" (âncora/rota para Portfólio).
- **RF-03:** CTA secundário "Contatar" → rota `/chamado`.
- **RF-04:** link "Currículo Completo" para download do PDF.

### T2 · Sobre
- **Objetivo:** background profissional, método de trabalho e diferenciais.
- **RF-05:** narrativa de experiência (timeline ou blocos).
- **RF-06:** destacar stack e certificações/formação.

### T3 · Serviços
- **Objetivo:** listar as ofertas contratáveis.
- **RF-07:** apresentar os 6 serviços: Backend .NET, Arquitetura Cloud (AWS),
  DevOps & Automação, Full-Stack, Análise de Segurança, Documentação Técnica.
- **RF-08:** cada serviço com descrição curta e (desejável) faixa de escopo.

### T4 · Portfólio
- **Objetivo:** provar competência com casos reais.
- **RF-09:** grade de projetos (ex.: plataforma imobiliária React/Next, sistema
  de clínica médica, e-commerce Java/Angular, plataforma gamificada de ensino
  de programação, microserviço de feature toggle em Kubernetes).
- **RF-10:** cada card com stack e resultado; link para detalhe quando houver.

### T5 · Contato (`/chamado`)
- **Objetivo:** converter interesse em conversa comercial.
- **RF-11:** formulário de contato (nome, e-mail, mensagem).
- **RF-12:** canais alternativos: e-mail, LinkedIn, grupo VIP no WhatsApp.
- **RF-13 (LGPD):** consentimento explícito antes de enviar dado pessoal —
  espelhar o padrão que o gamehub já adota (`/privacidade`).

## Papel no jogo

**App "🌐 Portfólio" no computador do escritório.** É o cartão de visitas do
próprio Laboratório Demarchi dentro da ficção: o jogador, ao abrir, vê "quem
construiu este mundo" e os serviços de TI reais que pode contratar fora do
jogo.

- **Integração N1 (agora):** ícone abre `portfoliodemarchi.com.br` em nova aba.
- **Integração N2 (depois):** janela embutida com resumo dos 6 serviços +
  botão "abrir site"; conecta o serviço "Documentação Técnica" ao produto de
  diagnóstico do jogo (ver [06](06-consultoria-e-entregaveis.md)).
- **Gating:** app "starter" — disponível assim que o computador é comprado.

## Requisitos de integração

- **RI-01:** confirmar que o site permite `<iframe>` (cabeçalho
  `X-Frame-Options`/`CSP frame-ancestors`) antes de tentar N2; se bloquear,
  ficar em N1.
- **RI-02:** o ícone e o nome do app vêm do catálogo genérico de apps do
  computador (a criar em `features/escritorio/` ou similar) — não hardcodar na
  tela do World.
- **RI-03:** nenhum dado do jogador é enviado ao site externo sem ação
  explícita dele (abrir aba é ação; POST automático não).
