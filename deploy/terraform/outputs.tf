output "server_ip" {
  description = "IP público da VM criada — use pra SSH e pra checar o healthcheck."
  value       = hcloud_server.gamehub.ipv4_address
}

output "proximos_passos" {
  description = "O que fazer depois do `terraform apply` (não roda sozinho)."
  value       = <<-EOT
    1. Espere ~1-2 min pro cloud-init terminar (ele já roda deploy/docker/setup.sh sozinho).
    2. ssh root@${hcloud_server.gamehub.ipv4_address} "tail -f /var/log/labdatadev-gamehub-setup.log"
    3. curl http://${hcloud_server.gamehub.ipv4_address}:3006/api/health
    4. Se quiser HTTPS/domínio próprio nesta VM nova, isso NÃO vem pelo
       cloud-init hoje (ele sobe só o docker-compose.yml base, sem overlay
       labd-cloud/Traefik, que é específico desta VPS) — é passo manual
       separado, decidir quando/se for produção de verdade.
  EOT
}
