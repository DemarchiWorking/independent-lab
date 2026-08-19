"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { listContainer, listItem, pressable } from "@/lib/motion";
import { Icon, type IconName } from "./Icon";

export interface LateralItem<T extends string> {
  key: T;
  label: string;
  icon: IconName;
  /** false = ainda não implementado (mostra cadeado e não navega) */
  disponivel?: boolean;
  /** quando presente, o item navega para esta URL em vez de trocar de aba —
   *  usado pelo World, que tem rota própria (`/world`) fora do shell */
  href?: string;
  /** destaca o item como "o principal" (borda pulsante) */
  destaque?: boolean;
}

interface LateralMenuProps<T extends string> {
  items: ReadonlyArray<LateralItem<T>>;
  current: T | null;
  onSelect: (key: T) => void;
}

/** Barra vertical de ícones à esquerda do palco — a "sidebar de 5 ícones"
 *  observada em ~100% dos prints do Startup Panic
 *  (docs/analise-prints/telas/hud-moldura.md §1). Cada ícone abre um módulo.
 *  Tooltip aparece no hover; item indisponível mostra cadeado. */
export function LateralMenu<T extends string>({
  items,
  current,
  onSelect,
}: LateralMenuProps<T>) {
  return (
    <motion.nav
      variants={listContainer}
      initial="initial"
      animate="enter"
      aria-label="Módulos do jogo"
      // Achado real de auditoria mobile (2026-08-19, Playwright real: 375 a
      // 1920px, conta com todos os módulos liberados): `top-1/2
      // -translate-y-1/2` centralizava a lista na altura INTEIRA da caixa do
      // jogo — com `min-h-[440px]` (GameShell) fixo em qualquer largura de
      // celular/tablet retrato, e até 10 itens hoje, os últimos ícones
      // ("Mercado", "Finanças") ficavam por trás da barra `<Nav>` inferior
      // (mesmo z-20, mas `<Nav>` renderiza DEPOIS no JSX — empata no
      // z-index, quem vem depois pinta por cima). Resultado: 2 módulos
      // inteiros ficavam impossíveis de abrir pelo menu lateral no celular,
      // sem nenhum erro visível. `bottom-20` reserva o espaço real da
      // `<Nav>` (medido: ~68px de altura); `top-3` casa com o padding do
      // HUD; `overflow-y-auto` é rede de segurança se a lista crescer além
      // do espaço disponível (hoje já seria o caso com 9-10 itens numa
      // caixa de 440px — antes disso ela simplesmente cortava sem avisar).
      // SEM `justify-center`: quando o conteúdo excede o espaço disponível
      // (9-10 módulos), centralizar um container com overflow corta as DUAS
      // pontas simetricamente (scrollTop=0 mostra o meio da lista, não o
      // topo) — achado ao vivo corrigindo este mesmo bug. Alinhado ao topo,
      // o primeiro item sempre começa visível e rolar pra baixo alcança o
      // resto, sem nenhuma ponta inacessível.
      className="absolute left-2 top-3 bottom-20 z-20 flex flex-col gap-1.5 overflow-y-auto"
    >
      {items.map((item) => {
        const ativo = item.key === current;
        const bloqueado = item.disponivel === false;

        const classe = cn(
          // `shrink-0`: sem isso, o flexbox espremia os ícones abaixo de
          // 36px (alvo de toque mínimo recomendado, WCAG 2.5.5) pra caber
          // sem rolar, quando os 9-10 módulos cabem justo no espaço
          // disponível — melhor rolar de verdade (`overflow-y-auto` no
          // `<nav>` pai) do que apertar o alvo de toque.
          "group relative grid h-9 w-9 shrink-0 place-items-center rounded-md shadow-hard transition-colors",
          ativo
            ? "bg-orange text-ink"
            : bloqueado
              ? "cursor-not-allowed bg-panel/40 text-muted"
              : "bg-panel/90 text-ink hover:bg-panel",
          item.destaque && !bloqueado && "ring-2 ring-teal ring-offset-1 ring-offset-night",
        );

        const conteudo = (
          <>
            <Icon name={bloqueado ? "lock" : item.icon} size={17} />

            {/* tooltip — só no hover, some em telas pequenas para não atrapalhar */}
            <span
              className={cn(
                "pointer-events-none absolute left-11 hidden whitespace-nowrap rounded-sm bg-night/90 px-2 py-1",
                "font-pixel text-[8px] uppercase text-white opacity-0 transition-opacity",
                "group-hover:opacity-100 sm:block",
              )}
            >
              {item.label}
              {bloqueado ? " · em breve" : ""}
            </span>
          </>
        );

        // item com rota própria: navegação real, não troca de aba
        if (item.href && !bloqueado) {
          return (
            <motion.div key={item.key} variants={listItem} {...pressable} className="shrink-0">
              <Link href={item.href} aria-label={item.label} title={item.label} className={classe}>
                {conteudo}
              </Link>
            </motion.div>
          );
        }

        return (
          <motion.button
            key={item.key}
            variants={listItem}
            {...(bloqueado ? {} : pressable)}
            type="button"
            disabled={bloqueado}
            onClick={() => !bloqueado && onSelect(item.key)}
            aria-label={item.label}
            title={bloqueado ? `${item.label} — em breve` : item.label}
            className={classe}
          >
            {conteudo}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
