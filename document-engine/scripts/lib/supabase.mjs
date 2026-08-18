// Cliente REST mínimo para o Supabase self-hosted do gamehub (Kong local,
// http://127.0.0.1:8010 — ver docker-compose.yml do stack em deploy/supabase/).
// Usa fetch nativo do Node 20+. Nenhuma dependência externa (mesmo princípio
// do document-engine do V4mos: este script roda fora do `npm install` da
// aplicação Next.js, então não pode depender de node_modules dela).

export function makeSupabaseClient({ restUrl, serviceRoleKey }) {
  const baseHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  async function request(path, options = {}) {
    const res = await fetch(`${restUrl}${path}`, {
      ...options,
      headers: { ...baseHeaders, ...(options.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase REST ${options.method || "GET"} ${path} -> ${res.status}: ${body}`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    // Só itens realmente pendentes — "processando" travado (motor morto no
    // meio de uma rodada) fica de fora de propósito: reprocessar automático
    // sem teto de tentativas poderia gerar loop de erro; ver `tentativas`
    // em `metadata.json` por cliente para decidir reprocessamento manual.
    async fetchFilaPendente() {
      return request(
        "/fila_geracao_documentos?status=eq.pendente&select=*&order=criado_em.asc",
      );
    },

    async setFilaProcessando(id) {
      return request(`/fila_geracao_documentos?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "processando", iniciado_em: new Date().toISOString() }),
      });
    },

    async setFilaConcluido(id) {
      return request(`/fila_geracao_documentos?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "concluido", concluido_em: new Date().toISOString() }),
      });
    },

    async setFilaErro(id, tentativasAtuais, mensagemErro) {
      return request(`/fila_geracao_documentos?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "erro",
          tentativas: tentativasAtuais + 1,
          erro: (mensagemErro || "").slice(0, 4000),
        }),
      });
    },

    async insertDocumento({ tenantId, filaId, tipo, titulo, conteudoMarkdown }) {
      return request("/documentos_gerados", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify([
          {
            tenant_id: tenantId,
            fila_id: filaId,
            tipo,
            titulo,
            conteudo_markdown: conteudoMarkdown,
          },
        ]),
      });
    },
  };
}
