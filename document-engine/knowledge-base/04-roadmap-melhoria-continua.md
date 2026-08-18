# Roadmap de Melhoria Contínua — Pipeline Kaizen do gamehub

## Objetivo

Todo documento gerado não é um evento único — é a fotografia de um ciclo. O
gamehub roda de hora em hora e reprocessa qualquer pedido novo do dono
(botão "Gerar/atualizar" em `/painel`). A documentação deve ser desenhada
para **evoluir**, não para ser reescrita do zero a cada rodada perdendo o
histórico — por isso este arquivo é o único, junto do Modelo de Negócio, com
seção "Notas de Versão" append-only.

## Ancoragem obrigatória: os 5 atributos de maturidade (0–40)

Ao contrário do V4mos (que usa estágio de startup), o roadmap do gamehub é
ancorado nos **5 atributos da ficha** (Tecnologia, Processo, Presença,
Aquisição, Capacidade — seção 3 da ficha). Cada ação do roadmap deve
declarar explicitamente **qual atributo ela move** e por quanto (estimativa
qualitativa: baixo/médio/alto impacto no atributo).

## Ciclo PDCA aplicado a cada tenant

1. **Plan** — diagnóstico: dos 5 atributos, qual é o mais baixo em relação
   à média dos outros 4 (o "gargalo estrutural")? Isso vira a prioridade #1.
2. **Do** — plano de 90 dias (formato 5W2H: o quê, por quê, quem, quando,
   onde, como, quanto custa) para as 3-5 ações priorizadas.
3. **Check** — seção **"Histórico de Revisões"**: cada rodada nova registra
   data, o que mudou nos 5 atributos/degrau desde a rodada anterior (se
   houver rodada anterior nos `documentos_gerados` do tenant — o motor não
   tem acesso automático a isso ainda; se a ficha atual for a primeira
   rodada, registre isso explicitamente e comece o histórico agora), e se as
   ações da rodada anterior parecem ter avançado.
4. **Act** — reprioriza: atributo que subiu sai do topo, atributo que
   estagnou sobe de prioridade.

## Estrutura de saída obrigatória

```
1. Cabeçalho (nome, segmento, degrau atual/alvo, data)
2. Diagnóstico dos 5 atributos (tabela: atributo, valor atual/40, gap até
   40, prioridade 1-5)
3. Gargalo estrutural identificado (1 atributo, com justificativa)
4. Plano de 90 dias — 3 a 5 ações em formato 5W2H, cada uma marcada com o
   atributo que move
5. Histórico de Revisões (append-only — primeira entrada se for a 1ª rodada)
6. Resumo Fácil
```

## Regras para reprocessamento (quando já existe rodada anterior)

- **Nunca apagar o histórico** — nova entrada em "Histórico de Revisões",
  nunca sobrescrita silenciosa.
- **Nunca inventar comparação** com uma rodada anterior que o motor não
  tenha em mãos nesta pasta — se não houver como comparar, declare
  explicitamente "primeira rodada registrada" em vez de fingir um delta.

## Por que isso importa para o Laboratório Demarchi

Este é o documento que sustenta a esteira de melhoria contínua como produto
defensável — não é gerar uma foto bonita uma vez, é acompanhar a evolução
real do negócio a cada rodada, com rigor de consultoria a custo de
automação. Isso é o que justifica o negócio contratar mais Funcionários de
IA e subir de degrau — a métrica de MRR que o Laboratório Demarchi persegue.
