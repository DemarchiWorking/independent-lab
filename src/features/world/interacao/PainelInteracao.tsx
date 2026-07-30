"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable, springSnappy } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";
import { RibbonPanel } from "@/components/ui/RibbonPanel";
import { ATRIBUTO_LABEL, ATRIBUTO_BG_CLASS } from "@/lib/atributos";
import { habilidadesLiberadas } from "@/features/equipe-ia/senioridade";
import { aberturaDe, opcoesPara } from "./catalogo";
import { nomeDoInterlocutor, type Interlocutor, type OpcaoInteracao } from "./tipos";

/**
 * A conversa com um NPC/jogador da sala (GH-WORLD-07).
 *
 * Duas telas dentro do mesmo painel: a ficha + as 4 escolhas, e o desfecho da
 * escolha. Mesma coreografia de `features/historia/CapituloCard.tsx` — e a
 * mesma decisão de não usar `useTransition`: aqui NENHUMA Server Action é
 * chamada, então não há pendência para segurar. Conversar informa e navega;
 * quem cobra e recompensa é a tela de destino.
 */

const CORES_TOM: Record<OpcaoInteracao["tom"], string> = {
  beneficio: "border-green/60 hover:bg-green/10",
  neutro: "border-[#dbe3f0] hover:bg-[#eef2f9]",
};

interface PainelInteracaoProps {
  interlocutor: Interlocutor | null;
  onFechar: () => void;
  /** só na visita: destacar o painel de proposta comercial do aside */
  onFocarPitch?: () => void;
}

export function PainelInteracao({
  interlocutor,
  onFechar,
  onFocarPitch,
}: PainelInteracaoProps) {
  const [escolhida, setEscolhida] = useState<OpcaoInteracao | null>(null);

  /**
   * Reinicia a conversa ao trocar de interlocutor — senão o desfecho do
   * Funcionário anterior apareceria na ficha do próximo.
   *
   * A dependência é o `avatarId`, NUNCA o objeto `interlocutor`: ele é
   * recalculado por `useMemo` a cada render da tela, e `agoraIso` muda a cada
   * render do servidor. Depender da identidade do objeto fazia qualquer
   * `router.refresh()` de fundo (comprar um móvel, um toast de recompensa)
   * apagar o desfecho no meio da leitura do jogador — o mesmo tipo de bug que
   * o `CapituloGate` existe para evitar no card de história.
   */
  const avatarId = interlocutor?.avatarId;
  useEffect(() => {
    setEscolhida(null);
  }, [avatarId]);

  const aberto = interlocutor !== null;

  function escolher(opcao: OpcaoInteracao) {
    if (opcao.efeito.tipo === "encerrar") {
      onFechar();
      return;
    }
    if (opcao.efeito.tipo === "focar-pitch") {
      onFechar();
      onFocarPitch?.();
      return;
    }
    setEscolhida(opcao);
  }

  return (
    <RibbonPanel
      title={interlocutor ? nomeDoInterlocutor(interlocutor) : ""}
      open={aberto}
      onClose={onFechar}
      className="max-w-lg"
    >
      {interlocutor ? (
        <>
          <Ficha interlocutor={interlocutor} />

          {/* Um único nó re-chaveado, e NÃO `AnimatePresence mode="wait"`.
              O painel já está aberto: animar a saída do bloco antigo só
              atrasaria a resposta — que é justamente o prêmio da interação. E
              `mode="wait"` trava de vez quando o `requestAnimationFrame` não
              roda (aba oculta/automação), armadilha que o AGENTS.md já
              documenta. Trocar pela chave dá a mesma entrada com "pop", sem
              nada que possa ficar pendurado. */}
          <motion.div key={escolhida?.id ?? "opcoes"}>
            {escolhida ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springSnappy}
                className="mt-3 rounded-sm bg-[#f1f4f9] p-3"
              >
                <p className="text-[11px] font-bold text-[#5b6b86]">
                  Você: “{escolhida.rotulo}”
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
                  {escolhida.desfecho}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {/* `motion.button`, não `<button>`: `pressable` carrega
                      `whileHover`/`whileTap`, que num elemento DOM comum o
                      React repassa como atributo e reclama no console */}
                  <motion.button
                    type="button"
                    {...pressable}
                    onClick={() => setEscolhida(null)}
                    className="min-h-11 rounded-md bg-[#e3e9f3] px-4 text-[12px] font-extrabold text-[#33415c]"
                  >
                    Voltar
                  </motion.button>
                  {escolhida.efeito.tipo === "ir-para" ? (
                    <Link
                      href={escolhida.efeito.href}
                      className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-orange px-3 text-center text-[12px] font-extrabold text-ink shadow-[0_3px_0] shadow-orange-dark"
                    >
                      <Icon name="arrow" size={14} />
                      {escolhida.efeito.cta}
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={listContainer}
                initial="initial"
                animate="enter"
                className="mt-3 flex flex-col gap-2"
              >
                <p className="rounded-sm bg-[#f1f4f9] px-3 py-2 text-[13px] leading-relaxed text-ink">
                  {aberturaDe(interlocutor)}
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {opcoesPara(interlocutor).map((o) => (
                    <motion.button
                      key={o.id}
                      variants={listItem}
                      {...pressable}
                      type="button"
                      onClick={() => escolher(o)}
                      className={cn(
                        // `min-h-11` = 44px: alvo de toque confortável no
                        // celular, que é onde o empresário vai abrir isso.
                        // Sem ele as opções ficavam em 38px — passa no mínimo
                        // da WCAG, mas erra o dedo com o jogo em movimento.
                        "flex min-h-11 items-center gap-1.5 rounded-md border-2 bg-white p-2.5 text-left transition-colors",
                        CORES_TOM[o.tom],
                      )}
                    >
                      <Icon
                        name={o.icon}
                        size={14}
                        className="mt-0.5 shrink-0 text-[#5b6b86]"
                      />
                      <b className="text-[12px] leading-snug">{o.rotulo}</b>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      ) : null}
    </RibbonPanel>
  );
}

/**
 * A ficha do interlocutor: quem é, em que faixa está e o que sabe fazer.
 *
 * Só o Funcionário de IA PRÓPRIO mostra senioridade e habilidades — é dado
 * derivado da minha própria contratação. Na visita, a ficha do vizinho fica no
 * mínimo (nome + cargo/segmento): o que se revela ali é o mesmo que o
 * `PitchPanel` já revela, e nada além.
 */
function Ficha({ interlocutor }: { interlocutor: Interlocutor }) {
  if (interlocutor.tipo === "jogador-visitado") {
    const { negocio, nivelSedeNome } = interlocutor;
    return (
      <div className="flex items-center gap-2.5 rounded-md bg-[#f1f4f9] p-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-orange text-ink shadow-hard">
          <Icon name="home" size={20} />
        </span>
        <div className="leading-tight">
          <b className="block text-[13px]">{negocio.nome}</b>
          <span className="text-[11px] text-[#5b6b86]">
            Dono do negócio · {nivelSedeNome}
          </span>
        </div>
      </div>
    );
  }

  const { cargo } = interlocutor;
  const eixo = ATRIBUTO_LABEL[cargo.eixoFortalecido];

  if (interlocutor.tipo === "ia-visitada") {
    return (
      <div className="flex items-center gap-2.5 rounded-md bg-[#f1f4f9] p-2.5">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-sm text-white shadow-hard",
            ATRIBUTO_BG_CLASS[cargo.eixoFortalecido],
          )}
        >
          <Icon name={cargo.icon} size={20} />
        </span>
        <div className="leading-tight">
          <b className="block text-[13px]">{cargo.nome}</b>
          <span className="text-[11px] text-[#5b6b86]">
            Funcionário de IA de {interlocutor.nomeAnfitriao} · eixo {eixo}
          </span>
        </div>
      </div>
    );
  }

  const { senioridade } = interlocutor;
  const habilidades = habilidadesLiberadas(cargo, senioridade);

  return (
    <div className="rounded-md bg-[#f1f4f9] p-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-sm text-white shadow-hard",
            ATRIBUTO_BG_CLASS[cargo.eixoFortalecido],
          )}
        >
          <Icon name={cargo.icon} size={20} />
        </span>
        <div className="min-w-0 leading-tight">
          <b className="block text-[13px]">{cargo.nome}</b>
          <span className="text-[11px] text-[#5b6b86]">
            {senioridade.titulo} · {senioridade.diasDeCasa}{" "}
            {senioridade.diasDeCasa === 1 ? "dia" : "dias"} de casa · eixo {eixo}
          </span>
        </div>
      </div>

      {/* a barra: quanto falta para a próxima faixa */}
      <div className="mt-2">
        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-[#dbe3f0]">
          <motion.i
            className="block h-full bg-green"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(senioridade.progresso * 100)}%` }}
            transition={{ ...springSnappy, delay: 0.15 }}
          />
        </div>
        <span className="mt-1 block text-[10px] font-bold text-[#5b6b86]">
          {senioridade.proximoTitulo && senioridade.diasParaProximo !== null
            ? `Faltam ${senioridade.diasParaProximo} ${senioridade.diasParaProximo === 1 ? "dia" : "dias"} para ${senioridade.proximoTitulo}`
            : "Faixa máxima — sabe fazer tudo do cargo"}
        </span>
      </div>

      {/* as habilidades, incluindo as que ainda não abriram */}
      <ul className="mt-2 flex flex-col gap-1">
        {habilidades.map((h) => (
          <li
            key={h.nome}
            className={cn(
              "flex items-start gap-1.5 text-[11px] leading-snug",
              h.liberada ? "text-[#33415c]" : "text-[#9aa8bf]",
            )}
          >
            <Icon
              name={h.liberada ? "check" : "lock"}
              size={12}
              className="mt-0.5 shrink-0"
            />
            <span>
              <b>{h.nome}</b>
              {h.liberada ? ` — ${h.descricao}` : " — ainda não destravado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
