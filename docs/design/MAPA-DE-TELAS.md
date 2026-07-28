# Mapa de Telas — prints do Startup Panic → gamehub (React)

> Catálogo de **cada contexto** identificado nos ~57 prints de
> `C:\Users\demarchi\Pictures\Startup`, com o texto transcrito e organizado, a
> **adaptação para negócio real (labdatadev)**, o componente/tela React
> correspondente e as **melhorias futuras**.
>
> **Objetivo:** mapear tudo agora; implementar aos poucos. Legenda de status:
> ✅ implementado · 🟡 stub (tela criada, sem lógica) · ⬜ só mapeado.

| # | Contexto (print) | Tela React | Status |
|---|---|---|---|
| 1 | Moldura / HUD | `components/ui/HudBar` | ✅ |
| 2 | Escritório isométrico (mundo) | `features/hub/HubScreen` | ✅ |
| 3 | Marketplace (Prestação de serviço) | `features/marketplace/MarketplaceScreen` | ✅ |
| 4 | Árvore de recursos (hex) | `features/parcerias/HexTreeScreen` | ✅ |
| 5 | Evento narrativo | `features/roadmap/modules.tsx` → `eventos` | 🟡 |
| 6 | Contratar (talentos) | `features/roadmap/modules.tsx` → `contratar` | 🟡 |
| 7 | Melhorar escritório (sede) | `features/roadmap/modules.tsx` → `sede` | 🟡 |
| 8 | Participação de mercado (concorrentes) | `features/roadmap/modules.tsx` → `concorrentes` | 🟡 |
| 9 | Loja de móveis (customização) | `features/roadmap/modules.tsx` → `loja` | 🟡 |
| 10 | Empréstimo bancário (finanças) | `features/roadmap/modules.tsx` → `emprestimo` | 🟡 |
| 11 | Férias coletivas (motivação/RH) | `features/roadmap/modules.tsx` → `motivacao` | 🟡 |

> Stubs são **data-driven**: cada contexto é uma entrada em `modules` (título,
> ícone, referência do print, melhorias) renderizada por `ModuleScreen`. Acessíveis
> pelo botão **app-drawer (2×2)** no hub. Migrar cada um para tela própria conforme
> a implementação avançar.

---

## 1. Moldura / HUD  ✅

**Texto do print:** `Dinheiro $-6444` · `Usuários 1040` · `Data Y5 M1 W` (barra) ·
`Objetivo ▾` · `Participação de mercado 3% / 96%` · `Saldo mensal -3872 $` ·
alerta `Você tem 54 dias para pagar sua dívida.`

**Adaptação labdatadev:** `Dinheiro → 🪙 Moeda + R$ real` · `Usuários → Rede
(parceiros)` · `Data → Ciclo de 90 dias` (valor institucional) · `Objetivo →
missão real` · `Participação → Ranking regional` · alerta → prazo da retro.

**Melhorias:** HUD configurável por perfil; tooltip explicando cada métrica;
animar variação (+/–) ao mudar valor.

## 2. Escritório isométrico (mundo)  ✅

**Texto/Elementos:** sala iso, funcionários com balões de humor (😊/😖), toolbar
lateral (negócio, RH, produto, portfólio, config), app-drawer 2×2 central.

**Adaptação:** salas = **sedes de parceiros reais** (imobiliárias, construtoras,
loteadoras da região); humor = saúde do relacionamento; app-drawer = menu de
módulos.

**Melhorias:** avatar/sede customizável; presença de outros players (social);
navegação por drag; pontos de interesse com badge de "oportunidade".

## 3. Marketplace — "Prestação de serviço"  ✅

**Texto do print:** título `Prestação de serviço`; cards `Recompensa: $2911 —
Banner de produtos em Photoshop`, `$3830 — Designer de UX/UI para empresa de
consultoria em crescimento`, `$1880 — Converter tabelas do Excel em tabelas do
SQL Server`, `Logo para colchão`, `Design de camiseta fácil`. Detalhe:
avatar, ⭐ rating, `Recompensa`, `Pontuação mín.`, `Tempo est.`, `Funcionário
recomendado: 1`, descrição, botões `Revisão` / `Aceitar trabalho`.

**Adaptação:** jobs = **serviços de TI reais** do portfólio labdatadev
(migração de dados, automação, web, infra, BI, integração, UX/UI). "Aceitar
trabalho" = contratação real (gateway + contrato + SLA).

**Melhorias:** filtro por categoria/preço/prazo; match automático parceiro↔serviço
(BANT); anexos; chat de orçamento; ligação com a pasta `melhoria-continua`.

## 4. Árvore de recursos (hex tree)  ✅

**Texto do print:** painel `Recurso` com abas `Informação` / `Status`,
`Atributos recomendados: N`, descrição e `Revisão ($285/$347/$1245)`. Nós vistos:
`Anúncios em texto`, `Anúncios em vídeo`, `Anúncios direcionados`, `Check-In`,
`Adicionar amigo`, `Linha do tempo`, `Lista de vagas`. Rodapé `Pontuação geral`.
Cores: 🟩 feito · 🟦 mídia · 🟨 growth · 🟪 ads · 🟥 bloqueado · ⬜ nota (7.8/9.4/10).

**Adaptação:** nós = **serviços/parcerias** a desbloquear (jornada de maturidade
de TI do parceiro). Nota = fit/prioridade. "Revisão" = orçar/avaliar.

**Melhorias:** zoom/pan; dependências entre nós (pré-requisitos); trilha
recomendada por segmento; status real (contratado/em entrega/concluído).

## 5. Evento narrativo  🟡

**Texto do print:** título `Avaliação de blog` / `A avaliação ruim de João`;
mock de blog ("My Lifestyle My Blog", "The UI is so ewww"); texto: *"Um
blogueiro escreveu uma avaliação tão ruim do seu aplicativo... Você vai
responder?"*; botões `Não fazer nada` / `Responder` (ou `Pagar alguém para
escrever um artigo ($1000)` / `Nada`).

**Adaptação:** eventos = **acontecimentos de negócio reais** (avaliação de
cliente, indicação, prazo, oportunidade regional) com escolha de resposta e
consequência em reputação/moeda.

**Melhorias:** motor de eventos data-driven; efeitos em métricas; histórico de
decisões; eventos disparados por dados reais (CRM/analytics).

## 6. Contratar — talentos  🟡

**Texto do print:** título `Contratar`; `Caçador de talentos — Número de
candidatos: 15` (card CRT "TARGET LOCKED / PROFILE / HIRE / IGNORE"), e
`Recomendação de amigos — Número de candidatos: 6` (*"Pedir a recomendação de um
amigo é a maneira mais barata de contratar... quase grátis."* — botão `Grátis`).

**Adaptação:** montar **squad** de entrega (devs, designers, parceiros
revendedores). Fontes: rede (grátis), caçador (caro/melhor). Alimenta o
"Funcionário recomendado" do marketplace.

**Melhorias:** atributos por skill (front/back/infra/design); custo/tempo de
contratação; disponibilidade; alocação em jobs.

## 7. Melhorar escritório (sede)  🟡

**Texto do print:** título `Melhorar escritório`; `Praça dos Fundadores`;
comparativo `Escritório atual × Próximo` — `Funcionários 5 → 11`, `Aluguel $500 →
$1000`, `Custo $8000`; botões `Cancelar` / `Melhorar`.

**Adaptação:** evoluir a **sede/plano** (capacidade de entrega, nº de parceiros,
recursos). Pode ser plano SaaS (Free/Pro/Business).

**Melhorias:** preview animado da próxima sede; ROI da evolução; requisitos
(reputação/ciclo) para desbloquear.

## 8. Participação de mercado (concorrentes)  🟡

**Texto do print:** título `Participação de mercado`; `Lista de empresas` —
`Demarchi Labs 3%` vs `Allberg Industries 96%`; detalhe `Demarchi Labs —
Pontuação geral: 7.1`, 4 barras `1.5/150`, tabela `Recurso (10)` com colunas
`T / U / A / Pontuação`: `Página inicial 10/4.5/6.3/5.9`, `Registro
10/4.6/10/6.8`, `Anúncios em texto 7.1/6.4/10/8`.

**Adaptação:** **benchmark regional** — sua consultoria vs concorrentes locais,
por atributo (Tecnologia/Usabilidade/Estética) e por serviço. "Demarchi Labs" já
é o nome no jogo → usar como marca do player.

**Melhorias:** dados reais de mercado; radar chart; metas por atributo; alertas
quando o concorrente avança.

## 9. Loja de móveis (customização)  🟡

**Texto do print:** título `Loja de móveis`; grid com preços (`$2000/$6000/
$20000/$500/$7000/$12500/$25000`); detalhe `Quadro branco` com atributos
`Tecnologia (0%) +1%`, `Usabilidade (0%) +2%`, `Estética (0%) +1%`; botão
`Comprar`.

**Adaptação:** **customização da sede** com moeda virtual (cosmético) e itens que
dão pequenos bônus de atributo. Nunca com R$ real (regra de ouro de moeda).

**Melhorias:** inventário; temas de sala; itens desbloqueáveis por conquista;
preview no hub em tempo real.

## 10. Empréstimo bancário (finanças)  🟡

**Texto do print:** título `Empréstimo bancário`; `FdP` (*"Financeira do Povo.
Um dos bancos mais ricos da cidade."*); `Empréstimo $20K`, `Juros mensais $200`,
`Pagamento $21K`; botão `Pagar empréstimo`; carrossel de bancos (‹ ›).

**Adaptação:** **gestão financeira** do player (capital de giro, fluxo). Em modo
real, apenas simulação educativa — nunca operação financeira real (regra:
Claude não executa transações).

**Melhorias:** simulador de fluxo de caixa; runway; alertas de saldo; painel de
recebíveis dos deals reais (somente leitura).

## 11. Férias coletivas (motivação/RH)  🟡

**Texto do print:** título `Férias coletivas`; opções `Parapente (Motivação +10,
7 dias, $150)`, `Snorkel (Motivação +20, 7 dias, $500)`; `Detalhe — Desconto $0,
Bônus de motivação 0`; `Selecionar funcionário (0/5)`: `Molly 21`, `Jaxon 36`,
`Jackson 37`; botões `Me recomende`, `$150` (*"convide mais pessoas por preços
mais baixos"*).

**Adaptação:** **saúde do time/parceiros** — ações que elevam motivação e a
qualidade da entrega (melhoria contínua). Reforça o relacionamento real.

**Melhorias:** efeito da motivação na velocidade/qualidade dos jobs; cooldown;
pacotes; impacto no NPS do parceiro.

---

## Notas de UX (frontend sênior)

- **Uma moldura, muitos palcos:** HUD + nav fixos; cada contexto é um "palco"
  que entra com movimento (`lib/motion`), como no Startup Panic.
- **Moderno e limpo:** manter o carisma pixel/iso **como camada temática**, mas a
  UI de painéis é limpa, arredondada e legível (mobile-first, dark).
- **Reuso:** `RibbonPanel`, `ActionButton`, `StatCard`, `HexTile` cobrem quase
  todos os contextos — telas novas montam a partir deles.
- **Pronto p/ React Native:** tokens + lógica isolados de `ui/`; portar depois
  para NativeWind sem reescrever regra de negócio.
