import type { IconName } from "@/components/ui/Icon";
import type { TipoEntregavel } from "../habilidades";

/** Como cada entregável aparece na tela do app (nome, chamada e ícone). */
export const INFO_ENTREGAVEL: Record<
  TipoEntregavel,
  { nome: string; abrir: string; descricao: string; icone: IconName; interno: boolean }
> = {
  canvas: {
    nome: "Modelo de Negócio e plano de ação",
    abrir: "Abrir o Canvas",
    descricao: "Canvas completo, primeiras ações, plano de 90 dias e documentos a manter em dia.",
    icone: "grid",
    interno: true,
  },
  pop: {
    nome: "Manual de Processos (POPs)",
    abrir: "Abrir o manual",
    descricao: "Procedimentos passo a passo para atender, entregar e fazer o pós-venda.",
    icone: "file",
    interno: true,
  },
  carrossel: {
    nome: "Carrosséis e calendário de publicação",
    abrir: "Abrir o editor de publicações",
    descricao: "Edite o texto, escolha o formato e baixe as imagens prontas para postar.",
    icone: "grid",
    interno: false,
  },
  comercial: {
    nome: "Kit comercial e automação",
    abrir: "Abrir o kit comercial",
    descricao: "Critérios de lead, mensagens prontas para copiar, cadência e planilha de funil.",
    icone: "network",
    interno: true,
  },
  reel: {
    nome: "Roteiro de vídeo curto",
    abrir: "Abrir o roteiro",
    descricao: "Cena a cena, com fala, texto de tela e checklist de gravação.",
    icone: "video",
    interno: false,
  },
};
