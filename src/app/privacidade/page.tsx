import Link from "next/link";
import { POLITICA_PRIVACIDADE_VERSAO } from "@/features/auth/politica";

export const metadata = {
  title: "Política de Privacidade · labdatadev gamehub",
  robots: { index: true, follow: true },
};

/**
 * Política de privacidade (GH-OPS-04) — pré-requisito legal antes do
 * primeiro cadastro real, não opcional. Espelha, em linguagem simples, a
 * whitelist de campos públicos já aplicada em código (`GH-GROW-01`) — se um
 * dia a whitelist do código mudar, este texto tem que mudar junto.
 */
export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-10 text-sm leading-relaxed text-white">
      <p className="mb-1 font-pixel text-[11px] uppercase tracking-[3px] text-teal">
        labdatadev · gamehub
      </p>
      <h1 className="mb-1 text-xl font-extrabold">Política de Privacidade</h1>
      <p className="mb-6 text-xs text-muted">
        Versão {POLITICA_PRIVACIDADE_VERSAO}
      </p>

      <section className="mb-5 space-y-2">
        <h2 className="font-extrabold text-teal">O que coletamos no cadastro</h2>
        <p>
          Nome do negócio, segmento, cidade e bairro, seu nome e e-mail, e as
          respostas de um diagnóstico de 10 perguntas (equipe, presença
          digital, objetivo, gargalo e faixa de investimento). Essas
          respostas alimentam o diagnóstico e as recomendações dentro do
          jogo — nunca são vendidas ou compartilhadas com terceiros.
        </p>
      </section>

      <section className="mb-5 space-y-2">
        <h2 className="font-extrabold text-teal">
          O que fica público (página do seu negócio)
        </h2>
        <p>
          Ao se cadastrar, seu negócio ganha uma página pública, indexável
          pelo Google, com estes dados — e só estes:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nome do negócio</li>
          <li>Segmento</li>
          <li>Cidade e bairro</li>
          <li>Nível e degrau na escada de valor (gamificação)</li>
          <li>Serviços que você publicar na sua vitrine (opcional)</li>
        </ul>
        <p>
          Você pode recusar a página pública no próprio formulário de
          cadastro, marcando a opção correspondente — ela não aparece na
          busca nem no diretório do ecossistema.
        </p>
      </section>

      <section className="mb-5 space-y-2">
        <h2 className="font-extrabold text-teal">O que NUNCA fica público</h2>
        <p>
          E-mail e telefone (contato acontece por formulário, nunca expondo
          seu endereço direto), moeda virtual, XP, e as respostas do
          diagnóstico de 10 perguntas — incluindo faixa de investimento e
          gargalo declarados. Esses dados são usados só internamente, para
          personalizar sua experiência no jogo.
        </p>
      </section>

      <section className="mb-5 space-y-2">
        <h2 className="font-extrabold text-teal">
          Como pedir a exclusão dos seus dados
        </h2>
        <p>
          Entre na sua conta e use o formulário de contato do seu próprio
          painel para solicitar a exclusão — respondemos e confirmamos a
          remoção dos seus dados (cadastro, diagnóstico e página pública, se
          houver) em até 15 dias úteis.
        </p>
      </section>

      <section className="mb-8 space-y-2">
        <h2 className="font-extrabold text-teal">Moeda virtual e dinheiro real</h2>
        <p>
          A moeda virtual (🪙) do jogo nunca se converte em dinheiro real, e
          nenhuma tela do produto sugere o contrário.
        </p>
      </section>

      <Link href="/cadastro" className="text-xs font-bold text-teal underline">
        Voltar ao cadastro
      </Link>
    </main>
  );
}
