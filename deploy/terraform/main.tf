# ============================================================================
# labdatadev-gamehub — provisionamento declarativo de UMA VM nova (Hetzner
# Cloud), pronta pra rodar `deploy/docker/setup.sh` sozinha via cloud-init.
#
# Reaproveita (não duplica) o mesmo `deploy/docker/cloud-init.yaml` que já
# serve pra colar manualmente no painel de qualquer provedor — este módulo
# só automatiza "criar a VM e colar o cloud-init", não reinventa o
# provisionamento em si.
#
# NUNCA rodar `terraform apply` sem decidir antes: (1) qual provedor de
# verdade, (2) se esta é uma réplica de TESTE (destruível) ou uma VPS de
# PRODUÇÃO nova — nada aqui assume uma resposta, o `apply` fica sempre a
# critério de quem roda, nunca automático (CI/CD algum chama isto).
# ============================================================================

resource "hcloud_ssh_key" "gamehub" {
  name       = "${var.server_name}-deploy-key"
  public_key = var.ssh_public_key
}

# Firewall de rede (Hetzner) — camada ADICIONAL ao que o próprio Docker já
# isola dentro da VM (containers do Supabase nunca publicam porta pro host,
# ver deploy/supabase/docker-compose.yml). Aqui é o perímetro externo: só
# as portas de `allowed_ports_tcp` chegam na VM, o resto é descartado antes
# de tocar em qualquer processo.
resource "hcloud_firewall" "gamehub" {
  name = "${var.server_name}-firewall"

  dynamic "rule" {
    for_each = var.allowed_ports_tcp
    content {
      direction  = "in"
      protocol   = "tcp"
      port       = rule.value
      source_ips = ["0.0.0.0/0", "::/0"]
    }
  }

  # ICMP (ping) liberado — útil pra diagnóstico, não abre superfície real.
  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "gamehub" {
  name        = var.server_name
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.gamehub.id]
  firewall_ids = [hcloud_firewall.gamehub.id]

  # cloud-init genérico (mesmo arquivo usado pra colar manualmente em
  # qualquer provedor) — instala Docker, clona o repo, roda
  # deploy/docker/setup.sh sozinho. Ver deploy/docker/cloud-init.yaml para
  # o que exatamente acontece e como ajustar REPO_URL/REPO_BRANCH/SETUP_FLAGS
  # (hoje hardcoded no próprio arquivo — trocar lá, não aqui, pra manter as
  # DUAS formas de usar o cloud-init — colar manual ou via este Terraform —
  # sempre olhando pro mesmo conteúdo).
  user_data = file("${path.module}/${var.cloud_init_path}")

  labels = {
    projeto = "labdatadev-gamehub"
    epico   = "13-escala-replicacao"
  }
}
