# 03 · ServGo — marketplace de serviços regionais

**Fonte:** `claude-code/shalon/ssh-alon-app` (estudo estático). Expo / React
Native (SDK 57, New Architecture, Expo Router). Identidade "Preto & Laranja".
Protótipo de pitch com mocks funcionais.

## Objetivo

Conectar **prestadores de serviço** e **clientes** numa região — o "iFood dos
serviços" local: cliente encontra um prestador por categoria, agenda, conversa,
paga e avalia; prestador recebe pedidos e gerencia agenda. Complementa o
gamehub: enquanto o jogo ensina maturidade digital, o ServGo é o **canal onde o
MEI vende o serviço** de fato.

## Stack & estado

Expo Router (file-based), React Native, Reanimated 4. Protótipo com dados
mockados — pronto para demo, ainda não é produção. É o mais "app de celular" do
ecossistema (encaixa no celular que o jogo já tem no HUD).

## Telas

Navegação por **abas** (`(tabs)/`) + telas de fluxo.

### Abas principais
- **T1 · Início (`(tabs)/index`)** — descoberta.
  - **RF-01:** destaque de categorias e prestadores próximos/recomendados.
  - **RF-02:** busca por serviço/categoria.
- **T2 · Serviços (`(tabs)/services`)** — catálogo.
  - **RF-03:** listar categorias e serviços com filtro.
- **T3 · Agendamentos (`(tabs)/bookings`)** — o que o cliente contratou.
  - **RF-04:** listar bookings por status (pendente, confirmado, concluído).
- **T4 · Perfil (`(tabs)/profile`)** — conta do usuário.
  - **RF-05:** dados, histórico, alternar papel cliente/prestador.

### Fluxos
- **T5 · Onboarding (`onboarding`)** — primeiro acesso.
  - **RF-06:** apresentar valor + escolher papel (cliente/prestador).
- **T6 · Categoria (`category/[id]`)** — prestadores de uma categoria.
  - **RF-07:** listar prestadores com avaliação, preço e disponibilidade.
- **T7 · Prestador (`provider/[id]`)** — perfil do prestador.
  - **RF-08:** portfólio, avaliações, serviços e botão "agendar".
- **T8 · Novo agendamento (`booking/new`)** — criar pedido.
  - **RF-09:** escolher serviço, data/hora, endereço, observações.
- **T9 · Detalhe do agendamento (`booking/[id]`)** — acompanhar.
  - **RF-10:** status, dados do prestador, cancelar/reagendar.
- **T10 · Chat (`chat/[providerId]`)** — conversa cliente↔prestador.
  - **RF-11:** troca de mensagens (mock hoje; realtime no futuro).
- **T11 · Avaliação (`review/[bookingId]`)** — pós-serviço.
  - **RF-12:** nota + comentário; alimenta a reputação do prestador (RF-08).

## Papel no jogo

**App "🔧 ServGo" — o marketplace onde o negócio do jogador vende.** Forte
sinergia: os **Funcionários de IA** do jogo (Social Media, Comercial) fazem
sentido como "quem cuida do perfil ServGo do negócio".

- **Integração N3 (recomendado):** mini-app nativo `features/servgo/` com o
  design-system do jogo, dados mockados regionais (mesmos negócios do mapa).
  O jogador "publica seu serviço" e vê pedidos fictícios chegarem — vira loop
  de gamificação (pedido → XP).
- **Integração N2 (rápida p/ pitch):** telas estáticas de preview do app,
  mostrando o fluxo cliente→agendamento→avaliação.
- **Gating:** liberar quando o negócio tiver "presença digital" suficiente
  (degrau intermediário) — ensina a ordem: primeiro se estrutura, depois vende.

## Requisitos de integração

- **RI-01:** como é RN/Expo, **não** dá para embutir por `<iframe>` — ou vira
  N3 (reescrito em React web no gamehub) ou N2 (screenshots/preview).
- **RI-02:** chat e realtime, se forem para N3, reusam o Supabase Realtime que
  o jogo já configurou (presença) — mesma infra, outro canal.
- **RI-03:** avaliações e reputação são dado público-na-região, coerente com a
  vitrine do mapa; dado de contato do prestador é privado (padrão LGPD do jogo).
- **RI-04:** pagamento real fica **fora** do jogo (link/deep-link) — 🪙 nunca
  paga serviço real.
