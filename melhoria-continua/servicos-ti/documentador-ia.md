# Playbook — Documentador(a) IA

> Funcionário de IA #1. Ver contexto completo em
> [`../../docs/PRODUTO-IA-FUNCIONARIOS.md`](../../docs/PRODUTO-IA-FUNCIONARIOS.md) §4.1.

| Campo | Valor |
|---|---|
| Serviço | Documentador(a) IA |
| Modelo | **Assinatura mensal** (não é job avulso) |
| Categoria | documentação / processos |
| Preço base (R$) | 297/mês (rascunho — validar com pricing_methodology.md) |
| Frequência | sob demanda + revisão mensal |
| Responsável padrão | Antonio (supervisão) + Claude (execução) |

## 1. Escopo (o que entra / o que NÃO entra)
- Entra: documentação técnica, SOPs, manuais de procedimento, base de
  conhecimento interna, documentação de processos comerciais/operacionais.
- Não entra: documentação jurídica/contratual (requer advogado), tradução
  certificada.

## 2. Pré-requisitos (do cliente)
- [ ] Acesso ao processo/sistema a documentar (entrevista ou gravação de tela)
- [ ] Nomear um ponto focal para validar o conteúdo
- [ ] Aprovação do escopo inicial (quais processos entram no 1º mês)

## 3. Passo a passo da entrega
1. Levantamento: entrevista/gravação do processo com o cliente
2. Estruturação: Claude gera o rascunho (formato SOP/manual)
3. Revisão humana (Antonio) — precisão técnica e tom
4. Validação com o cliente (ponto focal)
5. Publicação no repositório de conhecimento do cliente

## 4. Checklist de qualidade (Definition of Done)
- [ ] Testado (alguém de fora do processo consegue seguir o documento)
- [ ] Documentado com versionamento (data + autor)
- [ ] Revisado contra padrão enterprise (clareza, sem jargão desnecessário)
- [ ] Handoff feito com o ponto focal do cliente

## 5. SLA & métricas
- Prazo alvo: 5 dias úteis por documento (padrão) — ajustar por complexidade
- KPI de sucesso: documento aprovado sem retrabalho na 1ª revisão
- Retrabalho aceitável: até 1 rodada de ajuste sem custo extra

## 6. Riscos comuns & mitigação
| Risco | Mitigação |
|---|---|
| Cliente não separa tempo para validar | Definir prazo de resposta no contrato |
| Processo muda antes da entrega | Versionar e reconfirmar escopo semanalmente |

## 7. Histórico de melhoria (90 dias)
| Ciclo | Aprendizado | Ajuste no playbook |
|---|---|---|
| | | |
