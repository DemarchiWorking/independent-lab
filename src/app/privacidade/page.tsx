import Link from "next/link";

export const metadata = { title: "Política de Privacidade · labdatadev gamehub" };

/**
 * LGPD mínimo (GH-OPS-04) — página pública, sem sessão exigida (precisa ser
 * lida ANTES do cadastro, de dentro do wizard, e ficar acessível depois).
 * Conteúdo reflete exatamente o que o produto coleta hoje — nada de cláusula
 * genérica de template. Se o dado coletado mudar, esta página muda junto.
 */
export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 text-sm leading-relaxed text-muted">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <h1 className="mb-1 text-xl font-extrabold text-white">
        Política de Privacidade
      </h1>
      <p className="mb-6 text-xs text-muted">
        Última atualização: 2026-07-29. Vale para todo negócio cadastrado no
        labdatadev gamehub (B2G Marketing LTDA).
      </p>

      <Secao titulo="1. Quem coleta o dado">
        <p>
          O labdatadev gamehub é operado pela B2G Marketing LTDA. Esta política
          descreve o que coletamos quando você cadastra um negócio, joga, e
          gera um documento (Diagnóstico de Maturidade Digital ou os
          documentos de história).
        </p>
      </Secao>

      <Secao titulo="2. O que coletamos, e por quê">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b className="text-white">Conta:</b> nome, e-mail e senha (nunca
            armazenada em texto puro). Necessário para você entrar depois.
          </li>
          <li>
            <b className="text-white">As 10 respostas do cadastro:</b> segmento,
            cidade, equipe, presença digital, gargalo, investimento etc.
            Usadas para calcular seus 5 eixos iniciais de maturidade e montar
            seu Diagnóstico.
          </li>
          <li>
            <b className="text-white">Progresso no jogo:</b> XP, nível, degrau,
            os 5 eixos de atributos, escolhas de história, Funcionários de IA
            contratados. É a economia do jogo — sem isso ele não funciona.
          </li>
          <li>
            <b className="text-white">Documentos gerados:</b> guardamos só a
            DATA de geração e a versão da metodologia usada — nunca o
            conteúdo do documento em si, que é sempre recalculado na hora a
            partir do seu progresso atual.
          </li>
        </ul>
      </Secao>

      <Secao titulo="3. O que é público, e o que não é">
        <p>
          O nome do seu negócio, segmento e nível aparecem no mapa regional
          (é a vitrine — outros jogadores da sua região veem que você existe,
          igual uma fachada de loja). Quando você visita a sede de um vizinho,
          seu nome aparece brevemente para quem também está visitando
          naquele momento (presença ao vivo) — some assim que você sai. Suas
          respostas do cadastro, seu Diagnóstico completo e seus documentos
          de história são
          <b className="text-white"> privados</b> — só você (e quem tem acesso
          à sua conta) consegue ler.
        </p>
      </Secao>

      <Secao titulo="4. Base legal e finalidade">
        <p>
          Tratamos seu dado com base no seu <b className="text-white">consentimento</b>{" "}
          (Art. 7º, I da LGPD), dado explicitamente no cadastro. A finalidade é
          exclusivamente: (a) fazer o jogo e a gamificação funcionarem, (b)
          gerar seu Diagnóstico e recomendações reais, (c) permitir contato
          comercial sobre os serviços do próprio labdatadev, quando você
          demonstra interesse dentro do jogo. Nunca vendemos, alugamos ou
          compartilhamos seu dado com terceiros para marketing de terceiros.
        </p>
      </Secao>

      <Secao titulo="5. Por quanto tempo guardamos">
        <p>
          Enquanto sua conta existir. Se você pedir exclusão (contato abaixo),
          apagamos seus dados em até 15 dias, exceto o mínimo exigido por lei
          (ex.: registro fiscal, se houver cobrança).
        </p>
      </Secao>

      <Secao titulo="6. Cookies">
        <p>
          Usamos só um cookie de sessão, técnico e necessário para você
          continuar logado — sem rastreamento, sem publicidade de terceiros,
          sem venda de dado de navegação.
        </p>
      </Secao>

      <Secao titulo="7. Seus direitos">
        <p>
          Você pode pedir a qualquer momento: acesso ao que temos sobre você,
          correção de dado errado, exclusão da conta, ou exportação dos seus
          dados. Escreva para{" "}
          <a href="mailto:contato@labdatadev.com.br" className="font-bold text-teal underline">
            contato@labdatadev.com.br
          </a>
          .
        </p>
      </Secao>

      <div className="mt-8 flex gap-3">
        <Link
          href="/cadastro"
          className="rounded-md bg-card2 px-4 py-2.5 text-xs font-bold text-muted hover:text-white"
        >
          Voltar ao cadastro
        </Link>
        <Link
          href="/"
          className="rounded-md bg-card2 px-4 py-2.5 text-xs font-bold text-muted hover:text-white"
        >
          Página inicial
        </Link>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-1.5 text-sm font-extrabold text-white">{titulo}</h2>
      {children}
    </section>
  );
}
