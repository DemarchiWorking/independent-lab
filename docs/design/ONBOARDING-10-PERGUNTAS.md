> ⚠️ **Desatualizado (2026-08-18):** o cadastro tem hoje **19 perguntas**,
> não 10 — expandido na Tarefa A de `docs/PROXIMA-TAREFA.md` (matriz de
> rastreabilidade pergunta→documento gerado por IA, a referência atual).
> A fonte de verdade do que existe agora é sempre
> `src/features/onboarding/perguntas.ts` (data-driven). Este arquivo
> continua valendo pelo *princípio* de design (cada pergunta serve a
> múltiplos propósitos) — só a lista abaixo ficou incompleta.

# Onboarding — 10 perguntas que criam um negócio

> Cada pergunta tem **três funções ao mesmo tempo**: cadastrar o negócio,
> qualificar comercialmente (BANT) e alimentar a gamificação. Nada é
> perguntado "só por perguntar".

| # | Pergunta | Cria/define | Qualifica | Gamifica |
|---|---|---|---|---|
| 1 | Nome do negócio | identidade do tenant | — | nome da sede no mapa |
| 2 | Segmento | tipo de negócio | fit com ICP | ícone/cor da sede |
| 3 | Cidade | geografia | prioridade regional | mapa/bairro |
| 4 | Bairro | geografia | densidade local | quarteirão + vizinhos |
| 5 | Tamanho da equipe | porte | firmográfico | capacidade inicial |
| 6 | Presença digital hoje | maturidade | dor técnica | zonas desbloqueadas |
| 7 | Como capta clientes | canal atual | dor de aquisição | missão inicial |
| 8 | Objetivo principal | **norte do cliente** | need (BANT) | objetivo do HUD |
| 9 | Maior gargalo | dor específica | urgência (BANT) | evento inicial |
| 10 | Investimento mensal | faixa | **budget (BANT)** | **degrau da escada** |

---

## As perguntas (texto exato da UI)

**1. Qual o nome do seu negócio?**
Campo livre. → nome da sede no mapa.

**2. Qual o seu segmento?**
`Imobiliária` · `Construtora` · `Loteadora` · `Comércio local` ·
`Prestador de serviço` · `Outro`
→ ICP primário do labdatadev é **Imobiliária** (peso maior de fit).

**3. Em qual cidade você atua?**
`Vassouras` · `Barra do Piraí` · `Piraí` · `Volta Redonda` · `Resende` · `Outra`
→ geografia prioritária do ICP.

**4. Qual bairro?**
Campo livre (com sugestões). → define **quarteirão** e vizinhos.

**5. Quantas pessoas trabalham com você?**
`Só eu` · `2 a 5` · `6 a 15` · `16 a 30` · `Mais de 30`

**6. Como está sua presença digital hoje?**
`Não tenho nada` · `Só Instagram/WhatsApp` · `Só portais (ZAP/OLX/Viva)` ·
`Site desatualizado` · `Site + portais funcionando`

**7. Como você capta clientes hoje?**
(múltipla) `Indicação` · `Portais` · `Anúncios pagos` · `Redes sociais` ·
`Porta a porta` · `Não tenho processo`

**8. Qual seu objetivo principal nos próximos 90 dias?**
`Mais leads` · `Organizar processos` · `Vender mais para quem já é cliente` ·
`Aparecer mais na região` · `Ganhar tempo (automatizar)`
→ vira o **Objetivo do HUD** e o ciclo de 90 dias.

**9. Qual seu maior gargalo hoje?**
`Perco leads por demora` · `Tudo é manual/planilha` · `Não sei de onde vem
resultado` · `Site/imagem fraca` · `Equipe sem processo`

**10. Quanto você consegue investir por mês em tecnologia?**
`Ainda não sei` · `Até R$ 500` · `R$ 500 a R$ 1.500` · `R$ 1.500 a R$ 3.500` ·
`Acima de R$ 3.500`

---

## Cálculo do degrau (escada de valor)

Todo negócio **nasce no Degrau 1** (Auditoria Gratuita) — princípio do value
ladder: *nunca pular degraus no outbound*. O que as respostas fazem é indicar o
**degrau-alvo** (para onde o jogo vai conduzi-lo):

| Resposta da Q10 | Degrau-alvo | Oferta |
|---|---|---|
| Ainda não sei / Até R$ 500 | 2 | Diagnóstico Técnico (R$ 497) |
| R$ 500 a R$ 1.500 | 2 → 3 | Diagnóstico → Automação |
| R$ 1.500 a R$ 3.500 | 3 | Automação Essencial |
| Acima de R$ 3.500 | 4 | Ecossistema Completo |

**Ajustes (fit):** `+1` se segmento = Imobiliária **e** equipe ≥ 6;
`−1` se presença digital = "Não tenho nada" (precisa de base antes).
Degrau-alvo é sempre limitado a 1–5.

## Score de fit (0–100)

Soma ponderada usada para priorização comercial e para o nível inicial:

| Fator | Peso |
|---|---|
| Segmento no ICP primário | 25 |
| Cidade prioritária | 15 |
| Porte (equipe 5–30) | 20 |
| Budget declarado | 25 |
| Urgência (gargalo crítico) | 15 |

`nivelInicial = 1 + floor(score / 25)` → 1 a 5.

## Serviços recomendados

Derivados de Q6/Q7/Q9 e mapeados no catálogo de TI (mesmos nós da árvore de
parcerias):

| Gatilho | Serviço sugerido |
|---|---|
| Sem site / site fraco | `Site & Landing` |
| Tudo manual / planilha | `Automação` · `BI / Dados` |
| Perde lead por demora | `Integração CRM` (WhatsApp) |
| Não sabe de onde vem resultado | `BI / Dados` |
| Quer aparecer na região | `Tráfego pago` |

## Princípio de UX

Uma pergunta por tela, com progresso visível (`3 de 10`), transição animada e
possibilidade de voltar. Sem formulário longo — **é um jogo, não um cadastro**.
