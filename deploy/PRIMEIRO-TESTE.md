# Primeiro teste na VPS: roteiro

Ordem de execução, do seu computador. Nada daqui roda sozinho: cada passo que mexe na VPS pede
uma confirmação digitada. O que o app faz de IA está descrito em
[`../docs/equipe-ia/IA-OPERACAO.md`](../docs/equipe-ia/IA-OPERACAO.md).

## 0. O que já está verificado e o que não está

| Verificado | Não verificado (aparece só no primeiro teste real) |
|---|---|
| typecheck, 843 testes, build de produção e `npm audit` sem achados | Build das duas imagens Docker (Docker Desktop não sobe nesta máquina: o primeiro build será na VPS) |
| Fluxo Pro e toggle de API no navegador, com CLI e API simuladas | Chamada ao modelo real (precisa do token do passo 3) |
| 10 tipos de negócio × 5 materiais: contexto certo, sem vazamento, custo medido | Qualidade do texto que o modelo real devolve |
| Scripts `bash -n`; VPS acessível, 143 GB livres, rede `vitrine_web-net` presente | Borda HTTPS e certificado (emitido na primeira visita) |

O `publicar.sh` só sobe os containers se as duas imagens construírem e o `/api/health` responder com
a versão nova. Se falhar na primeira instalação, não há nada no ar para quebrar e os outros projetos
da VPS não são tocados.

## 1. Git

```bash
git push -u origin ia-agentes-fila
```

Envia só esta branch (ela já contém `seguranca-producao` e `entregaveis-profissionais` no
histórico). A `main` não muda. O GitHub Actions só roda verificações, sem deploy.

## 2. Token da assinatura Pro (no seu computador)

```bash
claude setup-token
```

Abre o navegador; entre na conta Claude que será usada pelo produto. Ele imprime um token (vale 1
ano). **Guarde-o só no `.env.ia` da VPS**, nunca no Git nem no chat. Lembrete: a Anthropic não
permite atender usuários de um produto por credencial Pro/Max; o risco é da conta inteira. Prefira
uma conta separada e desligue o uso dos dados para treinamento nela.

## 3. Publicar

```bash
ADMIN_EMAILS=admin@admin.com ./deploy/publicar.sh
```

Digite `PUBLICAR`. Roda typecheck e testes, envia o commit, constrói as imagens na VPS (com `nice`),
tira snapshot dos dados, sobe app e worker e confere o health e o batimento. Na primeira vez cria
`/opt/independent-lab/.env` (com segredo novo) e `/opt/independent-lab/.env.ia` (modelo).

## 4. Borda HTTPS (único passo que encosta na Vitrine)

```bash
./deploy/borda-caddy.sh
```

Digite `CONFIRMAR`. Acrescenta `lab.2-25-146-39.sslip.io` ao Caddy existente com recarga a quente
(sem recriar o container); se a config nova for inválida, o Caddy mantém a antiga. Desfazer:
`./deploy/borda-caddy.sh --remover`. Confira: `https://lab.2-25-146-39.sslip.io/api/health`.

## 5. Token na VPS

```bash
ssh hostinger
nano /opt/independent-lab/.env.ia        # cole CLAUDE_CODE_OAUTH_TOKEN=...  (IA_PERMITIR_ASSINATURA=1 já vem)
/opt/independent-lab/recriar.sh ia-worker
docker exec independent-lab-ia-worker node /app/verificar.mjs --chamada
```

Atenção: `docker restart` **não relê** o `.env.ia`; use sempre o `recriar.sh`. O `verificar.mjs
--chamada` faz uma chamada real (~100 tokens) e diz o que falta.

## 6. Conta de admin

Em produção o cadastro recusa `admin@admin.com`. Por um instante:

```bash
echo 'GAMEHUB_LIBERAR_CADASTRO_ADMIN=1' >> /opt/independent-lab/.env
/opt/independent-lab/recriar.sh app
# cadastre-se em https://lab.2-25-146-39.sslip.io/cadastro com admin@admin.com
sed -i '/^GAMEHUB_LIBERAR_CADASTRO_ADMIN=/d' /opt/independent-lab/.env
/opt/independent-lab/recriar.sh app
```

Use uma **senha forte**: é um endereço público e essa conta controla a IA e os custos. A conta de
teste local (`admin123`) não existe na VPS: `data/` não vai para o Git nem para a imagem.

## 7. Teste de ponta a ponta

1. Com uma segunda conta (negócio comum): cadastro, Equipe de IA, abrir o Canvas, **Autorizar** o
   uso de IA. A versão refinada deve aparecer sozinha ("Refinado por IA", versão 2.0).
2. Em `https://lab.2-25-146-39.sslip.io/admin/ia` (admin): "Modo ativo: Assinatura Claude Pro",
   worker "Ativo", uso do dia contando.
3. Quando tiver créditos de API: `ANTHROPIC_API_KEY=` no `.env.ia`, `recriar.sh ia-worker`, e marcar
   **Usar créditos de API** em `/admin/ia`. Defina antes um limite mensal de gasto no Console.

O botão "Creditar saldo de teste" (moedas do jogo) fica **desligado em produção**, de propósito.

## 8. Depois do primeiro teste

- Guardião de hora em hora: `./deploy/instalar-guardiao.sh`.
- Endurecer a VPS (SSH por senha, fail2ban): copie `deploy/vps-hardening.sh` para a VPS e rode como root; sem argumento só simula, `--aplicar` aplica. Afeta todos os projetos da VPS: é decisão sua.

## Desfazer

| O quê | Como |
|---|---|
| Versão ruim | O `publicar.sh` volta sozinho para a imagem anterior se o health falhar |
| Borda | `./deploy/borda-caddy.sh --remover` |
| Dados | `/opt/independent-lab/backups/` (snapshot a cada deploy + diário) |
| Tudo | `docker compose -p independent-lab -f /opt/independent-lab/compose.yml down` (não toca nos outros projetos) |
