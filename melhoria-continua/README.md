# Melhoria Contínua & Entrega de TI em Massa

> Pasta viva de arquivos para **melhoria contínua** e **entrega de serviços de TI
> em massa** — o motor operacional por trás da gamificação SaaS.
> Ancorada no valor institucional labdatadev: *"processos revisados a cada 90 dias".*

---

## Por que esta pasta existe

O gamehub transforma **serviços de TI reais** em jobs jogáveis (ver
[`../docs/design/SCREENS-INVENTORY.md`](../docs/design/SCREENS-INVENTORY.md) tela 4).
Para entregar isso **em massa e com qualidade crescente**, cada serviço precisa
de um **processo padronizado, medido e revisado**. É o que mora aqui.

## Estrutura

```
melhoria-continua/
├── servicos-ti/        # 1 arquivo por serviço: playbook + checklist + SLA
├── retros-90-dias/     # retrospectivas trimestrais (ciclo de 90 dias)
└── templates/          # modelos reutilizáveis (playbook, retro, feedback)
```

## Fluxo de melhoria contínua (loop de 90 dias)

```
   Padronizar ──► Entregar em massa ──► Medir (KPI/SLA) ──► Retrospectiva 90d
        ▲                                                        │
        └──────────────── Ajustar playbook ◄────────────────────┘
```

1. **Padronizar** — cada serviço vira um playbook em `servicos-ti/`.
2. **Entregar em massa** — jobs do marketplace seguem o playbook (repetível).
3. **Medir** — SLA, tempo real vs estimado, reputação, retrabalho.
4. **Retrospectiva (90d)** — registrada em `retros-90-dias/`; gera ações.
5. **Ajustar** — playbooks e tokens/UX evoluem; volta ao passo 1.

> Espelha a tabela `improvement_logs` do
> [banco regional](../docs/database/SCHEMA-PARCEIROS-REGIONAL.md).

## Catálogo — Funcionários de IA (produto central, assinatura mensal)

> Ver [`../docs/PRODUTO-IA-FUNCIONARIOS.md`](../docs/PRODUTO-IA-FUNCIONARIOS.md)
> para o contexto completo do pivot. Estes são os 4 cargos vendidos como
> agentes Claude recorrentes:

| Cargo | Entrega | Playbook |
|---|---|---|
| Documentador(a) IA | documentação técnica/processos | [`servicos-ti/documentador-ia.md`](servicos-ti/documentador-ia.md) |
| Social Media IA | carrosséis para redes sociais | [`servicos-ti/social-media-ia.md`](servicos-ti/social-media-ia.md) |
| Editor(a) de Vídeo IA | reels/vídeos para mídia paga | [`servicos-ti/editor-video-ia.md`](servicos-ti/editor-video-ia.md) |
| Comercial/Automação IA | SDR virtual, qualificação de leads | [`servicos-ti/comercial-automacao-ia.md`](servicos-ti/comercial-automacao-ia.md) |

## Catálogo — jobs avulsos de TI (marketplace, por entrega)

Baseado no portfólio labdatadev e nos jobs observados no Startup Panic:

| Serviço | Categoria | Onde documentar |
|---|---|---|
| Migração de dados (Excel → SQL Server) | dados | `servicos-ti/` |
| Automação de processos (n8n/Make) | automacao | `servicos-ti/` |
| Site/Landing page (Next.js) | web | `servicos-ti/` |
| Infra & deploy (AWS/VPS) | infra | `servicos-ti/` |
| Dashboard/BI | bi | `servicos-ti/` |
| Integração CRM/WhatsApp | integracao | `servicos-ti/` |
| Design UX/UI | uxui | `servicos-ti/` |

## Como usar

1. Novo serviço? Copie [`templates/playbook-servico.md`](templates/playbook-servico.md)
   para `servicos-ti/<nome>.md`.
2. Fechou um ciclo? Copie [`templates/retro-90-dias.md`](templates/retro-90-dias.md)
   para `retros-90-dias/<ano>-Q<n>.md`.
