# 04 · Autovale — marketplace automotivo regional

**Fonte:** `Desktop/Projetos/Automotivo/autovale-app` (estudo estático).
Next.js 15 (App Router), design-system próprio. Features organizadas em
`src/features/`: `vehicles`, `home`, `analytics`, `layout`, `ui`, `providers`.

## Objetivo

Marketplace de **compra e anúncio de veículos** focado no Vale do Café — o
"OLX/Webmotors regional". Conecta quem quer vender um carro a quem quer comprar,
com vitrine e página de anúncio. Mesmo público regional do gamehub (empresários
locais, revendas, autônomos).

## Stack & estado

Next.js 15 com arquitetura por features (mesma filosofia do gamehub:
`features/` → `lib/`). Analytics embutido. **Estado:** app funcional em
desenvolvimento.

## Telas

### T1 · Home (`/`)
- **Objetivo:** vitrine de entrada — destaques e busca.
- **RF-01:** exibir veículos em destaque (recentes/populares).
- **RF-02:** busca/filtro rápido (marca, faixa de preço, cidade).
- **RF-03:** CTA "Anunciar" para quem quer vender.

### T2 · Carros — listagem (`/carros`)
- **Objetivo:** navegar o inventário completo com filtros.
- **RF-04:** listar veículos com paginação/scroll.
- **RF-05:** filtros (marca, modelo, ano, preço, km, cidade).
- **RF-06:** ordenar (preço, ano, mais recentes).
- **RF-07:** cada card leva ao detalhe (`/carros/[slug]`).

### T3 · Carro — detalhe (`/carros/[slug]`)
- **Objetivo:** decidir a compra / contatar o vendedor.
- **RF-08:** galeria de fotos + ficha técnica completa.
- **RF-09:** preço, descrição, localização.
- **RF-10:** CTA de contato com o anunciante (WhatsApp/form).
- **RF-11:** `slug` amigável para SEO/compartilhamento.

### T4 · Anunciar (`/anunciar`)
- **Objetivo:** publicar um veículo à venda.
- **RF-12:** formulário: dados do veículo, fotos, preço, contato.
- **RF-13:** validação dos campos obrigatórios antes de publicar.
- **RF-14 (LGPD):** consentimento para exibir dados de contato publicamente.

## Papel no jogo

**App "🚗 Autovale" — vitrine regional dentro do escritório.** Especialmente
relevante para negócios do segmento automotivo do ICP (revendas, oficinas). É
um exemplo concreto de "vitrine pública regional", conceito que o gamehub já
tem no mapa.

- **Integração N3 (recomendado):** mini-app `features/autovale/` com listagem +
  detalhe usando dados mockados regionais; o jogador do segmento automotivo
  "anuncia" e ganha XP.
- **Integração N2:** janela embutida com a listagem real (se o app estiver no
  ar e permitir embed).
- **Gating:** disponível para negócios cujo `segmento` do cadastro seja
  automotivo/comércio; para os demais, aparece como "app da vizinhança"
  (só navegação, sem anunciar).

## Requisitos de integração

- **RI-01:** reaproveitar a mesma filosofia `features/` → `lib/` — a migração
  para N3 é natural (arquiteturas compatíveis), mas **reescrita**, não cópia.
- **RI-02:** fotos de veículos são o ponto pesado — se N3, servir otimizado
  (`next/image`) e nunca guardar blob no Postgres (mesma regra do jogo).
- **RI-03:** contato do anunciante segue o padrão de "público na região vs.
  privado" já definido na política de privacidade do jogo.
