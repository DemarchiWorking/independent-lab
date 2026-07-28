"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { screenVariants, springSnappy, pressable } from "@/lib/motion";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { cadastrar, type EstadoForm } from "@/features/auth/actions";
import { perguntas } from "./perguntas";

const TOTAL = perguntas.length + 1; // 10 perguntas + tela de conta

interface ContextoConvite {
  token: string;
  convidanteNome: string;
  cidadeNome: string;
  bairroNome: string;
}

/** Cadastro em passos: 10 perguntas + conta. Uma pergunta por tela, com
 *  transição animada — parece jogo, não formulário.
 *
 *  `convite` (GH-GROW-02, opcional): pré-preenche cidade/bairro com o do
 *  convidante (o jogador ainda pode trocar) e leva o token como campo
 *  oculto — o resgate de verdade acontece em `cadastrar()`, que re-verifica
 *  a assinatura; isto aqui é só UX. */
export function Wizard({ convite }: { convite?: ContextoConvite | null }) {
  const [passo, setPasso] = useState(0);
  const [valores, setValores] = useState<Record<string, string | string[]>>(
    convite ? { cidade: convite.cidadeNome, bairro: convite.bairroNome } : {},
  );
  const [consentimento, setConsentimento] = useState(false);
  const [perfilPublico, setPerfilPublico] = useState(true);
  const [estado, formAction, pendente] = useActionState<EstadoForm, FormData>(
    cadastrar,
    {},
  );

  const naConta = passo === perguntas.length;
  const pergunta = naConta ? null : perguntas[passo];

  const valorAtual = pergunta ? valores[pergunta.campo] : undefined;
  const respondida = pergunta
    ? pergunta.tipo === "multipla"
      ? Array.isArray(valorAtual) && valorAtual.length > 0
      : typeof valorAtual === "string" && valorAtual.trim().length > 0
    : true;

  const definir = (campo: string, valor: string | string[]) =>
    setValores((v) => ({ ...v, [campo]: valor }));

  const alternar = (campo: string, valor: string) => {
    const atual = Array.isArray(valores[campo])
      ? (valores[campo] as string[])
      : [];
    definir(
      campo,
      atual.includes(valor)
        ? atual.filter((x) => x !== valor)
        : [...atual, valor],
    );
  };

  return (
    <form action={formAction} className="w-full max-w-lg">
      {convite ? <input type="hidden" name="convite" value={convite.token} /> : null}
      {/* respostas viajam como campos ocultos até o submit final */}
      {Object.entries(valores).map(([campo, valor]) =>
        Array.isArray(valor) ? (
          valor.map((v) => (
            <input key={`${campo}-${v}`} type="hidden" name={campo} value={v} />
          ))
        ) : (
          <input key={campo} type="hidden" name={campo} value={valor} />
        ),
      )}

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between font-pixel text-[9px] uppercase text-teal">
          <span>
            Passo {passo + 1} de {TOTAL}
          </span>
          <span>{Math.round(((passo + 1) / TOTAL) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-card2">
          <motion.div
            className="h-full bg-orange"
            animate={{ width: `${((passo + 1) / TOTAL) * 100}%` }}
            transition={springSnappy}
          />
        </div>
      </div>

      <div className="relative min-h-[300px] rounded-md bg-panel p-5 text-ink shadow-modal">
        <AnimatePresence mode="wait">
          <motion.div
            key={passo}
            variants={screenVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            {pergunta ? (
              <>
                <h2 className="text-lg font-extrabold">{pergunta.titulo}</h2>
                {pergunta.ajuda ? (
                  <p className="mt-1 text-xs text-[#5b6b86]">{pergunta.ajuda}</p>
                ) : null}

                <div className="mt-4">
                  {pergunta.tipo === "texto" ? (
                    <input
                      autoFocus
                      value={(valorAtual as string) ?? ""}
                      onChange={(e) => definir(pergunta.campo, e.target.value)}
                      placeholder={pergunta.placeholder}
                      className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {pergunta.opcoes?.map((op) => {
                        if (op.locked) {
                          // Teaser de nicho futuro (ex.: "Produto Marca
                          // Própria (importação)") — nunca selecionável
                          // aqui, só sinaliza que existe mais por vir.
                          return (
                            <div
                              key={op.valor}
                              aria-disabled="true"
                              className="flex cursor-not-allowed items-center gap-1.5 rounded-md border-2 border-transparent bg-[#f1f4f9] px-3 py-2.5 text-left text-sm font-bold text-muted opacity-60"
                            >
                              <Icon name="lock" size={14} />
                              <span className="flex-1">{op.rotulo}</span>
                              <span className="font-pixel text-[8px] uppercase tracking-wide">
                                Em breve
                              </span>
                            </div>
                          );
                        }
                        const ativo =
                          pergunta.tipo === "multipla"
                            ? Array.isArray(valorAtual) &&
                              valorAtual.includes(op.valor)
                            : valorAtual === op.valor;
                        return (
                          <motion.button
                            key={op.valor}
                            type="button"
                            {...pressable}
                            onClick={() =>
                              pergunta.tipo === "multipla"
                                ? alternar(pergunta.campo, op.valor)
                                : definir(pergunta.campo, op.valor)
                            }
                            className={cn(
                              "rounded-md border-2 px-3 py-2.5 text-left text-sm font-bold",
                              ativo
                                ? "border-teal bg-[#dcefff]"
                                : "border-transparent bg-[#f1f4f9] hover:bg-[#e8edf5]",
                            )}
                          >
                            {op.rotulo}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-extrabold">Quase lá — crie sua conta</h2>
                <p className="mt-1 text-xs text-[#5b6b86]">
                  É com ela que você entra no seu painel depois.
                </p>
                <div className="mt-4 space-y-2.5">
                  <input
                    name="nome"
                    placeholder="Seu nome"
                    autoComplete="name"
                    className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="voce@empresa.com.br"
                    autoComplete="email"
                    className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
                  />
                  <input
                    name="senha"
                    type="password"
                    placeholder="Senha (mín. 8 caracteres)"
                    autoComplete="new-password"
                    className="w-full rounded-md border-2 border-[#dbe3f0] bg-[#f7f9fc] px-3 py-2.5 text-sm outline-none focus:border-teal"
                  />
                </div>

                <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-[#5b6b86]">
                  <input
                    type="checkbox"
                    name="consentimento"
                    checked={consentimento}
                    onChange={(e) => setConsentimento(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Li e concordo com a{" "}
                    <a
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-teal underline"
                    >
                      política de privacidade
                    </a>
                    . Sei que meu negócio ganha uma página pública (nome,
                    segmento, cidade, nível) — nunca faturamento, moeda
                    virtual ou as respostas deste cadastro.
                  </span>
                </label>
                <label className="mt-2 flex items-start gap-2 text-[11px] leading-snug text-[#5b6b86]">
                  <input
                    type="checkbox"
                    name="perfilPublico"
                    checked={perfilPublico}
                    onChange={(e) => setPerfilPublico(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Quero que meu negócio apareça na página pública
                    (recomendado — ajuda clientes a te encontrar; pode
                    desmarcar e continuar mesmo assim).
                  </span>
                </label>

                {estado.erro ? (
                  <p className="mt-3 rounded-sm bg-coral/15 px-3 py-2 text-xs font-bold text-coral-dark">
                    {estado.erro}
                  </p>
                ) : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-2">
        {passo > 0 ? (
          <motion.button
            type="button"
            {...pressable}
            onClick={() => setPasso((p) => p - 1)}
            className="flex items-center gap-1.5 rounded-md bg-card2 px-4 py-3 text-sm font-extrabold text-muted"
          >
            <Icon name="chevron" size={16} className="rotate-90" />
            Voltar
          </motion.button>
        ) : null}

        {naConta ? (
          <ActionButton
            type="submit"
            disabled={pendente || !consentimento}
            icon="arrow"
          >
            {pendente ? "Criando seu negócio…" : "Criar meu negócio"}
          </ActionButton>
        ) : (
          <ActionButton
            onClick={() => respondida && setPasso((p) => p + 1)}
            disabled={!respondida}
            icon="arrow"
          >
            Continuar
          </ActionButton>
        )}
      </div>
    </form>
  );
}
