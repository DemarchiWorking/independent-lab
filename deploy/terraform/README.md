# Terraform — replicar o gamehub numa VPS/cloud nova

> IaC de referência (Épico 13 — Escala e Replicação, 2026-08-01). Provedor
> de referência: **Hetzner Cloud**. Reaproveita
> [`../docker/cloud-init.yaml`](../docker/cloud-init.yaml) — este módulo só
> automatiza "criar a VM certa e colar o cloud-init nela", não reimplementa
> provisionamento.

## Pré-requisito

Conta na Hetzner Cloud + token de API (Project → Security → API Tokens,
Read+Write). Nunca commitar o token — passe como variável de ambiente:

```bash
export TF_VAR_hcloud_token="seu-token-aqui"
export TF_VAR_ssh_public_key="$(cat ~/.ssh/id_ed25519.pub)"
```

## Uso

```bash
cd deploy/terraform
terraform init
terraform validate
terraform plan      # mostra o que SERIA criado — não cria nada ainda
terraform apply     # cria de verdade — confirmação manual (digite "yes")
```

`terraform destroy` quando terminar de testar (Hetzner cobra por hora
ligada) — **nunca rode isso contra a VPS de produção real (labd.cloud)**,
este módulo só provisiona uma VM NOVA, nunca toca na existente.

## Trocar de provedor

`versions.tf` + `main.tf` concentram tudo específico da Hetzner
(`hcloud_server`, `hcloud_firewall`, `hcloud_ssh_key`). Para DigitalOcean/AWS/
GCP: trocar o `provider` e os `resource` equivalentes — todos aceitam
`user_data`/`user-data` apontando pro mesmo `cloud-init.yaml`, então o
`file(...)` em `main.tf` não muda. Não implementado ainda porque não havia
necessidade real de mais de um provedor de referência — adicionar quando
o Antonio precisar de fato de um segundo provedor.

## O que este módulo NÃO faz (de propósito)

- Não configura domínio/HTTPS na VM nova — o cloud-init sobe o
  `docker-compose.yml` BASE (porta `3006`, sem Traefik) porque
  `docker-compose.labd-cloud.yml` é específico da VPS labd.cloud (rede
  `traefik-public` externa que só existe lá). Numa VM nova de produção de
  verdade, decidir depois: Traefik próprio, ou reaproveitar o padrão de
  `deploy/nginx-supabase.conf.template` (modo PM2) adaptado, ou apontar
  DNS + rodar certbot manual.
- Não decide sozinho se a VM deve rodar Supabase próprio ou compartilhado —
  isso é `SETUP_FLAGS` dentro do próprio `cloud-init.yaml`, editável antes
  de aplicar.
