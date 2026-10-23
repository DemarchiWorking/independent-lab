variable "hcloud_token" {
  description = "Token de API da Hetzner Cloud (Project → Security → API Tokens, permissão Read+Write). Nunca commitar — passe via TF_VAR_hcloud_token ou terraform.tfvars (já no .gitignore)."
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Chave pública SSH (conteúdo, não caminho) que vai ter acesso root à VM — mesma chave que você usa para `ssh` na labd.cloud, ou uma nova só para esta réplica."
  type        = string
}

variable "server_name" {
  description = "Nome do servidor na Hetzner (aparece no console) — também vira o hostname da VM."
  type        = string
  default     = "labdatadev-gamehub"
}

variable "server_type" {
  description = <<-EOT
    Tipo de servidor Hetzner. Default `cpx31` (4 vCPU / 8 GB) — dimensionado
    a partir do orçamento de RAM medido em
    docs/architecture/CARGA-1000-SIMULTANEOS.md: o stack completo (app 3
    réplicas + Nginx + Supabase self-hosted com os limites da Fase 2) soma
    ~6,2 GB de `mem_limit`, então 8 GB dá folga real para o SO + picos, sem
    ser o dobro do necessário (`cpx41`, 16 GB) por precaução vaga.
  EOT
  type        = string
  default     = "cpx31"
}

variable "location" {
  description = "Datacenter Hetzner. `nbg1` (Nuremberg) e `fsn1` (Falkenstein) são os mais baratos/latência menor pra Europa; `hil` (EUA) se o público-alvo mudar de região."
  type        = string
  default     = "nbg1"
}

variable "image" {
  description = "Imagem base — Ubuntu 24.04 LTS, mesma família que `deploy/vps-setup.sh`/`deploy/docker/setup.sh` já assumem (`apt`, `systemd`, cloud-init pré-instalado)."
  type        = string
  default     = "ubuntu-24.04"
}

variable "allowed_ports_tcp" {
  description = "Portas TCP liberadas no firewall da Hetzner (nível de rede, além de qualquer firewall dentro da VM). 22 = SSH, 3006 = app via docker-compose.yml base (sem Traefik), 80/443 = se um dia rodar Nginx/certbot próprio nesta VM nova."
  type        = list(string)
  default     = ["22", "80", "443", "3006"]
}

variable "cloud_init_path" {
  description = "Caminho do cloud-init reaproveitado (não duplicado) — o mesmo arquivo que já serve pra colar manualmente em qualquer provedor."
  type        = string
  default     = "../docker/cloud-init.yaml"
}
