# Metodologia da análise de prints

> Como os 56 prints do Startup Panic + 1 print de referência (Instagram)
> foram lidos, transcritos e organizados. Leia isto antes de adicionar um
> novo print à análise — mantém a consistência do arquivo.

**Origem:** `C:\Users\demarchi\Pictures\Startup` (56 capturas do jogo
*Startup Panic* + 1 do Instagram/Compass, usada como referência de
posicionamento de marca regional).

**Processo:** cada imagem foi lida individualmente (visão do modelo, não
OCR externo) e transcrita usando o template de posicionamento abaixo — a
mesma estrutura para todo print, o que permite comparar telas diferentes e
detectar o que **muda** entre prints do mesmo tipo de tela.

---

## Template de transcrição por print

```
### <nome-do-arquivo> — <categoria>

**Elementos por região** (a moldura do jogo é fixa — 4 cantos + centro):
- Topo-esquerda:
- Topo-direita:
- Lateral-esquerda:
- Centro / palco principal:
- Baixo-esquerda:
- Baixo-direita:
- Baixo-centro:

**Texto transcrito literal** (tudo que é legível, palavra por palavra):
...

**Elementos visuais/estruturais** (cores, formas, ícones, hierarquia):
...

**Funcionalidade / propósito desta tela:**
...

**O que muda em relação a outros prints da mesma categoria:**
...
```

## Taxonomia de categorias usada

| Categoria | O que agrupa |
|---|---|
| `hud-moldura` | A moldura fixa sempre visível (dinheiro, usuários, data, objetivo) |
| `mundo-escritorio` | Vista isométrica ambiente — escritório, funcionários, humor, alertas |
| `evento-narrativo` | Popups de evento com escolha e consequência (ex.: avaliação de blog) |
| `arvore-de-recursos` | A árvore de hexágonos (feature tree / trilha de maturidade) |
| `marketplace-servicos` | "Prestação de serviço" — lista e detalhe de jobs |
| `contratacao-equipe` | Contratar — caçador de talentos, recomendação de amigos |
| `escritorio-e-sede` | "Melhorar escritório" — comparação sede atual × próxima |
| `loja-de-moveis` | Customização — compra de mobília com atributos |
| `financas` | Empréstimo bancário, saldo, dívida |
| `rh-motivacao` | Férias coletivas, bem-estar/motivação da equipe |
| `mercado-concorrencia` | Participação de mercado, benchmark de atributos |
| `referencia-marca` | Prints que não são do jogo, usados como referência (ex.: Instagram) |
| `outros` | Qualquer tela que não se encaixe acima (documentar e propor categoria) |

## Onde está cada coisa

```
docs/analise-prints/
├── 00-METODOLOGIA.md          # este arquivo
├── 01-INDICE-MESTRE.md         # índice de todas as categorias + contagem de prints
├── _raw/                       # transcrição bruta por lote (material de trabalho)
│   └── batch-N.md              # saída de cada agente, antes da consolidação
├── telas/                      # UMA página por categoria, com variantes documentadas
│   ├── hud-moldura.md
│   ├── mundo-escritorio.md
│   ├── evento-narrativo.md
│   ├── arvore-de-recursos.md
│   ├── marketplace-servicos.md
│   ├── contratacao-equipe.md
│   ├── escritorio-e-sede.md
│   ├── loja-de-moveis.md
│   ├── financas.md
│   ├── rh-motivacao.md
│   └── mercado-concorrencia.md
└── SINTESE-REQUISITOS-FUNCIONAIS.md   # o documento de síntese (nível CTO)
```

`_raw/` é material de trabalho intermediário — depois da consolidação em
`telas/`, pode ser mantido como arquivo histórico (não apagar: é a fonte
primária caso precise reconferir um detalhe).
