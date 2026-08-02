import { NextResponse } from "next/server";
import { resolverLocalizacaoPorCep } from "@/lib/localizacao/cep";

/**
 * Autofill de cidade/bairro a partir do CEP no cadastro (Wizard chama esta
 * rota, nunca fala com o ViaCEP direto do browser — mesmo padrão de todo
 * dado externo neste projeto passar pelo servidor primeiro).
 *
 * `force-dynamic`: CEP muda de resposta por usuário, nunca cachear a rota
 * (o cache de 1h fica dentro de `resolverLocalizacaoPorCep`, no fetch pro
 * ViaCEP em si — não aqui).
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const { cep } = await params;
  const localizacao = await resolverLocalizacaoPorCep(cep);

  if (!localizacao) {
    // 200, não 404/500: "não achei" é um resultado esperado (CEP incompleto
    // enquanto o usuário ainda digita, CEP inexistente, ViaCEP fora do ar) —
    // o Wizard só cai pro preenchimento manual, não é um erro de servidor.
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({ encontrado: true, ...localizacao });
}
