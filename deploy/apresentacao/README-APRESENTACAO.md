# Guia rápido — apresentação ao vivo (Sebrae)

Passo a passo humano pra usar as ferramentas desta pasta. Sem jargão técnico
onde der pra evitar.

## Antes de sair de casa/escritório

1. **Rode a checagem pré-voo.** No Windows, dê 2 cliques em
   `preflight.bat` (ajuste `SSH_HOST`/`SSH_USER` no arquivo antes, se ainda
   não tiver feito — são só 2 linhas no topo). Se estiver na própria VPS,
   rode `bash deploy/apresentacao/preflight.sh`.
2. Leia o resultado: tudo verde = pronto. Qualquer ✗ vermelho, resolva antes
   de sair — não dá pra consertar isso de dentro do Sebrae se a rede de lá
   for ruim.
3. **Ative o modo evento** (documentação sai em minutos, não em até 1 hora):
   ```
   ssh root@2.25.146.39
   crontab -e
   ```
   Comente a linha do `run-hourly.sh` (coloque `#` na frente) e adicione:
   ```
   */5 * * * * /root/labdatadev-gamehub/document-engine/cron/run-evento.sh
   ```
   Salve e saia.

## Se você não tem SSH configurado neste notebook Windows ainda

1. Abra o "PowerShell" (não precisa instalar nada, já vem no Windows 10/11).
2. Rode: `ssh root@2.25.146.39` — vai pedir a senha da VPS (a mesma que
   você usa pra entrar no painel da Hostinger, ou peça pro time técnico).
3. Se conectar (aparecer um prompt tipo `root@...:~#`), está funcionando —
   digite `exit` e pronto, os `.bat` desta pasta já vão funcionar.
4. Se não conectar, é mais rápido levar o notebook até alguém que já tenha
   acesso, ou usar o celular/outro notebook que já tenha.

## Durante a apresentação

- **Tela do QR Code**: abra `http://2.25.146.39:3006/apresentacao` no
  navegador do computador que vai estar projetado no telão. Deixe em tela
  cheia (F11 no Chrome/Edge). É pra ficar parado ali, os jurados escaneiam
  com o celular deles.
- **Alguém se cadastrou e quer ver o resultado na hora**: dê 2 cliques em
  `gerar-agora.bat` (ou rode `gerar-agora.sh` direto na VPS). Em ~1 a 5
  minutos (bem mais rápido que os 5 do modo evento) a documentação sai. O
  nome do negócio aparece na tela quando terminar.
- **A pessoa quer ver o resultado depois, sozinha**: ela entra em
  `http://2.25.146.39:3006/entrar` com o e-mail que cadastrou, e o
  resultado está em `/painel`. Se você esqueceu qual e-mail ela usou,
  confira em `/admin/clientes` (painel interno).

## Depois da apresentação

**Volte o cron pro normal** (senão fica gastando Pro plan/CPU de 5 em 5
minutos à toa pra sempre):
```
ssh root@2.25.146.39
crontab -e
```
Descomente a linha do `run-hourly.sh` e comente/apague a do `run-evento.sh`.

## Se a VPS estiver genuinamente fora do ar

Sendo direto: não existe um "plano B" que funcione sem a VPS — o app, o
banco de dados e a IA que gera a documentação vivem só lá. Nenhum script
no notebook resolve isso sozinho. O que dá pra fazer:

1. `ssh root@2.25.146.39` e `docker ps` — ver o que não está rodando.
2. `docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d`
   (dentro de `/root/labdatadev-gamehub`) — tenta subir de novo o que caiu.
3. Se nada disso resolver em campo, a apresentação segue com o **vídeo de
   backup** — ver seção abaixo.

## Vídeo de backup

`deploy/apresentacao/assets/demo-backup.mp4` (55s, 1280×720, ~3,4 MB) —
gravação real (não é mockup) do fluxo inteiro: landing → cadastro de 10
perguntas → IA gerando a documentação → login → os 6 documentos prontos no
painel. Gravado com Playwright direto em produção, dados de teste apagados
depois.

- **Baixe pro notebook ANTES de sair de casa** (não depende da VPS nem de
  wifi no dia): `scp root@2.25.146.39:/root/labdatadev-gamehub/deploy/apresentacao/assets/demo-backup.mp4 .`
- Toca em qualquer player (VLC, ou o navegador — é um `.mp4` padrão).
- Não está versionado no git (é binário grande e fica desatualizado a cada
  mudança visual da landing) — se a landing mudar muito, regrave antes do
  próximo evento.
- Só usar como **plano B de verdade** — a demo ao vivo (QR Code →
  cadastro real) é sempre a principal; o vídeo é o que mostrar SE a rede
  falhar.

## Onde cada arquivo desta pasta entra

| Arquivo | Roda onde | Pra quê |
|---|---|---|
| `preflight.sh` | VPS | Checagem de saúde (containers, fila, cron, autenticação) |
| `preflight.bat` | Windows, via SSH | Mesmo preflight, chamado remotamente |
| `gerar-agora.bat` | Windows, via SSH | Dispara `document-engine/scripts/gerar-agora.sh` remotamente |
| `document-engine/scripts/gerar-agora.sh` | VPS | Roda o motor de documentação na hora, fora do cron |
| `document-engine/cron/run-evento.sh` | VPS (cron) | Versão do motor pro modo evento (5 em 5 min) |
| `assets/demo-backup.mp4` | Notebook (offline) | Vídeo de backup — plano B se a rede falhar |
