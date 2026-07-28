# Playbook — Comercial/Automação IA (SDR virtual)

> Funcionário de IA #4. Ver contexto completo em
> [`../../docs/PRODUTO-IA-FUNCIONARIOS.md`](../../docs/PRODUTO-IA-FUNCIONARIOS.md) §4.4.

| Campo | Valor |
|---|---|
| Serviço | Comercial/Automação IA (SDR virtual) |
| Modelo | **Assinatura mensal** (always-on) |
| Categoria | automação / vendas |
| Preço base (R$) | 897/mês (rascunho — validar com pricing_methodology.md) |
| Frequência | contínuo |
| Responsável padrão | Antonio (supervisão de pipeline) + Claude + n8n |

## 1. Escopo (o que entra / o que NÃO entra)
- Entra: qualificação de leads (BANT), follow-up automático via WhatsApp,
  agendamento, integração com CRM existente do cliente.
- Não entra: fechamento de venda (segue humano), atendimento pós-venda
  (é outro serviço), CRM do zero (é um projeto de implantação à parte).

## 2. Pré-requisitos (do cliente)
- [ ] Acesso ao WhatsApp Business API (Z-API ou similar)
- [ ] CRM existente (mesmo que básico — Kommo, planilha) ou aceitar sugestão
- [ ] Critérios de qualificação definidos (o que é um lead "bom" para eles)

## 3. Passo a passo da entrega
1. Mapear o funil atual do cliente (de onde vêm os leads)
2. Configurar automação (n8n) de captura → qualificação → follow-up
3. Definir critérios BANT específicos do negócio do cliente
4. Testar com leads reais em ambiente controlado
5. Ativar em produção + dashboard de acompanhamento

## 4. Checklist de qualidade (Definition of Done)
- [ ] Testado com leads reais (não só simulação)
- [ ] Documentado (fluxo de automação + critérios de qualificação)
- [ ] Revisado: taxa de falso-positivo/negativo aceitável
- [ ] Handoff: cliente sabe como pausar/ajustar a automação

## 5. SLA & métricas
- Prazo alvo: 2 semanas para ativação inicial
- KPI de sucesso: tempo de resposta ao lead (< 5 min) e taxa de qualificação
- Retrabalho aceitável: ajustes de critério nas primeiras 4 semanas sem custo

## 6. Riscos comuns & mitigação
| Risco | Mitigação |
|---|---|
| Automação qualifica mal (falsos positivos) | Período de calibração com revisão humana |
| Cliente sem WhatsApp Business API | Orientar contratação antes de iniciar |
| LGPD — dados de leads | Seguir política de dados do labdatadev (ver `labdatadev-context`) |

## 7. Histórico de melhoria (90 dias)
| Ciclo | Aprendizado | Ajuste no playbook |
|---|---|---|
| | | |
