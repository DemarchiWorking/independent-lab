import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { obterDiagnostico } from "@/features/documentos/actions";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import { DOCUMENTO_DIAGNOSTICO } from "@/features/documentos/tipos";
import type { Diagnostico } from "@/features/documentos/motor";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ docId: string }>;
}

/**
 * `.docx` do Diagnóstico (GH-OPS Bloco 4) — via lib `docx` (JS puro, sem
 * Chromium/Puppeteer, que custariam ~300 MB + RAM num VPS que já hospeda o
 * stack do Supabase). Só o Diagnóstico gera `.docx` por ora: é o único
 * documento pensado para ser editado e reenviado (ex.: pro contador da
 * empresa) — os 5 narrativos são conteúdo de jogo, não papelada de negócio.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { docId } = await params;
  if (docId !== DOCUMENTO_DIAGNOSTICO) {
    return NextResponse.json({ erro: "Sem versão .docx para este documento." }, { status: 404 });
  }

  const view = await obterDiagnostico();
  if (!view) {
    return NextResponse.json({ erro: "Sessão expirada ou negócio não encontrado." }, { status: 401 });
  }

  const buffer = await Packer.toBuffer(montarDocumento(view.diagnostico));
  const nomeArquivo = `diagnostico-${slugSimples(view.diagnostico.negocio.nome)}.docx`;

  // `Buffer` (Node) não bate estruturalmente com `BodyInit` neste TS —
  // `Uint8Array` puro (cópia barata, documento é pequeno) resolve sem magia.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

function slugSimples(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titulo(texto: string): Paragraph {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_1 });
}

function subtitulo(texto: string): Paragraph {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_2, spacing: { before: 240 } });
}

function corpo(texto: string, negrito = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: texto, bold: negrito })],
    spacing: { after: 100 },
  });
}

/** Mesma estrutura da página HTML (`app/documentos/[docId]/page.tsx`) —
 *  os dois consomem o MESMO `Diagnostico` de `motor.ts`, nunca dois textos
 *  escritos à mão que podem divergir. */
function montarDocumento(d: Diagnostico): Document {
  const children: Paragraph[] = [
    titulo(`Diagnóstico de Maturidade Digital — ${d.negocio.nome}`),
    corpo(
      `${d.negocio.cidade} · gerado em ${new Date(d.geradoEm).toLocaleDateString("pt-BR")} · metodologia v${d.versaoMetodologia}`,
    ),

    subtitulo("Os 5 eixos de maturidade digital"),
    ...d.eixos.map((eixo) =>
      corpo(
        `${eixo.label}${eixo.chave === d.eixoMaisFraco.chave ? " (eixo mais fraco)" : ""}: ${eixo.valor}/${eixo.teto} (${eixo.percentual}%)`,
      ),
    ),

    subtitulo("Escada de valor"),
    corpo(`Está em ${d.degrau.atualNome} (degrau ${d.degrau.atual}).`),
    corpo(`Próximo alvo: ${d.degrau.alvoNome} (degrau ${d.degrau.alvo}).`),

    subtitulo("Gargalo"),
    ...(d.gargalo.declarado ? [corpo(`Declarado: ${d.gargalo.declarado}`)] : []),
    corpo(`Observado: ${d.gargalo.observado}`),

    subtitulo("3 próximos movimentos"),
    ...d.movimentos.flatMap((m, i) => [
      corpo(`${i + 1}. ${m.titulo} (eixo ${ATRIBUTO_LABEL[m.eixo]})`, true),
      corpo(m.descricao),
      ...(m.cargo
        ? [
            corpo(
              `R$ ${m.cargo.precoMensal.toLocaleString("pt-BR")}/mês — ${
                m.cargo.disponivelAgora
                  ? "disponível agora"
                  : `disponível a partir do degrau ${m.cargo.degrauMinimo}`
              }`,
            ),
          ]
        : []),
    ]),

    new Paragraph({
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: `Metodologia labdatadev de Maturidade Digital, versão ${d.versaoMetodologia}. Documento gerado automaticamente a partir do dado vivo do negócio.`,
          italics: true,
          size: 18,
        }),
      ],
    }),
  ];

  return new Document({ sections: [{ children }] });
}
