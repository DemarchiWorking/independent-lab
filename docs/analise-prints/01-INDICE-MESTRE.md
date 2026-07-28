# Índice mestre — análise dos 56 prints

> Ponto de entrada da análise. Todos os 56 prints de
> `C:\Users\demarchi\Pictures\Startup` foram lidos individualmente e
> transcritos. Metodologia em [`00-METODOLOGIA.md`](00-METODOLOGIA.md).

---

## Distribuição por categoria

| Categoria | Prints | Documento consolidado |
|---|---:|---|
| Árvore de recursos (produto) | **33** | [`telas/arvore-recursos-produto.md`](telas/arvore-recursos-produto.md) |
| Marketplace de serviços | 5 | [`telas/marketplace-servicos.md`](telas/marketplace-servicos.md) |
| Contratação de equipe | 5 | [`telas/equipe-contratacao-e-gestao.md`](telas/equipe-contratacao-e-gestao.md) |
| Evento narrativo | 3 | [`telas/eventos-financas-e-progressao.md`](telas/eventos-financas-e-progressao.md) |
| Loja de móveis | 2 | [`telas/sede-escritorio-e-mobilia.md`](telas/sede-escritorio-e-mobilia.md) |
| Finanças (empréstimo) | 2 | [`telas/eventos-financas-e-progressao.md`](telas/eventos-financas-e-progressao.md) |
| Escritório e sede | 2 | [`telas/sede-escritorio-e-mobilia.md`](telas/sede-escritorio-e-mobilia.md) |
| RH / motivação | 1 | [`telas/equipe-contratacao-e-gestao.md`](telas/equipe-contratacao-e-gestao.md) |
| Conquistas | 1 | [`telas/eventos-financas-e-progressao.md`](telas/eventos-financas-e-progressao.md) |
| Mundo / escritório livre | 1 | [`telas/sede-escritorio-e-mobilia.md`](telas/sede-escritorio-e-mobilia.md) |
| Mercado / concorrência | 1 | [`telas/economia-de-atributos.md`](telas/economia-de-atributos.md) |
| Referência de marca (Instagram) | 1 | [`telas/referencia-marca.md`](telas/referencia-marca.md) |
| **Total** | **57** | *(56 do jogo + 1 referência)* |

> ⚠️ **A distribuição é, por si só, um achado.** 33 de 56 prints (59%) são da
> árvore de recursos. O usuário passou a maior parte do tempo naquela tela —
> é onde está o coração do jogo, e é o padrão que mais merece atenção no
> nosso produto.

## Documentos transversais (não são "telas")

| Documento | Por que existe |
|---|---|
| [`telas/hud-moldura.md`](telas/hud-moldura.md) | A moldura fixa presente em ~100% dos prints |
| [`telas/economia-de-atributos.md`](telas/economia-de-atributos.md) | 🔑 **O sistema T/U/A que amarra todas as telas** — leitura obrigatória |
| [`SINTESE-REQUISITOS-FUNCIONAIS.md`](SINTESE-REQUISITOS-FUNCIONAIS.md) | Consolidação nível CTO: o que significa cada etapa e o que construir |

## Material bruto

`_raw/batch-1.md` … `_raw/batch-6.md` — transcrição literal print a print
(regiões, texto, visual, funcionalidade, diffs). **Fonte primária:** consulte
se precisar reconferir um detalhe específico de uma captura.

## Ordem de leitura recomendada

1. [`SINTESE-REQUISITOS-FUNCIONAIS.md`](SINTESE-REQUISITOS-FUNCIONAIS.md) — a visão de produto
2. [`telas/economia-de-atributos.md`](telas/economia-de-atributos.md) — o sistema central
3. [`telas/hud-moldura.md`](telas/hud-moldura.md) — a gramática visual
4. As telas específicas conforme a feature que você for construir
5. `_raw/` só quando precisar do detalhe literal

## Mapa: análise → o que construir

| Análise | Alimenta |
|---|---|
| Árvore de recursos | `features/parcerias/HexTreeScreen` (existe, incompleta) |
| Marketplace | `features/marketplace` (existe, falta alocação de equipe) |
| Equipe/contratação | `features/equipe-ia` (existe) + equipe humana (futuro) |
| Sede/mobília/mundo | 🆕 [World](../world/ARQUITETURA-WORLD.md) — a construir |
| Mercado/concorrência | 🆕 stub `mercado-concorrencia` |
| Eventos/conquistas/perks | 🆕 stubs `eventos`, progressão de perks |
| Economia de atributos | 🔴 **Nada ainda** — é o maior gap estrutural |
