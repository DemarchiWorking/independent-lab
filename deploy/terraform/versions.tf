# ============================================================================
# labdatadev-gamehub — IaC de referência (Épico 13, Escala e Replicação).
#
# Provedor de referência: Hetzner Cloud (hcloud) — API simples, preço baixo,
# boa opção pra validar uma réplica de teste rápida. Trocar de provedor é
# reescrever este arquivo + `main.tf` com o provider equivalente
# (DigitalOcean/AWS/GCP seguem o MESMO padrão de `user_data` — ver
# `deploy/docker/cloud-init.yaml`, que já é genérico de propósito e não
# muda entre provedores).
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.48"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}
